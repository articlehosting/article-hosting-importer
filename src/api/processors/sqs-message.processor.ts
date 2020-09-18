import path from 'path';
import Processor from '../abstract/processor';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { XML_EXT, ZIP_EXT } from '../constants';
import ArticleModel, { Article } from '../models/article.model';
import FileModel from '../models/file.model';
import S3EventModel from '../models/s3-event.model';
import CleanerService from '../service/cleaner.service';
import DecodeService from '../service/decode.service';
import ExtractService from '../service/extract.service';
import FileSystemService from '../service/fs.service';
import ImportService from '../service/import.service';
import LoggerService from '../service/logger.service';
import SQSService from '../service/sqs.service';
import StencilaService from '../service/stencila.service';

const { endpoint } = config.aws.s3;

interface ArticleObjectKeyDetails {
  filename: string,
  file: string,
}

class SQSEventProcessor extends Processor {
  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly fsService: FileSystemService;

  private readonly extractService: ExtractService;

  private readonly stencilaService: StencilaService;

  private readonly decodeService: DecodeService;

  private readonly importService: ImportService;

  private readonly cleanerService: CleanerService;

  private readonly importS3Adapter: S3Adapter;

  private Event?: S3EventModel;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);

    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;

    this.fsService = new FileSystemService(this.logger);
    this.extractService = new ExtractService(this.logger);
    this.stencilaService = new StencilaService(this.logger);
    this.decodeService = new DecodeService(this.logger);
    this.importService = new ImportService(this.logger, this.sqsService, this.dbAdapter);
    this.cleanerService = new CleanerService(this.logger);

    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
  }

  withEvent(event: S3EventModel): SQSEventProcessor {
    this.Event = event;

    return this;
  }

  public async processEvent(): Promise<void> {
    if (!this.Event) {
      throw new Error('Invalid S3 event model');
    }

    const files = await this.processSourceFile(this.Event);

    const jsonFile = await this.stencilaService.convert(this.fetchFileByExtension(files, XML_EXT));

    const article = await this.decodeArticleFrom(jsonFile);

    const articleModel = new ArticleModel(this.logger, {
      article,
      files,
    });

    await this.importService.importArticle(articleModel);
    await this.cleanerService.clean(this.fetchFileByExtension(files, ZIP_EXT));
  }

  private async processSourceFile({ objectKey, bucketName }: S3EventModel): Promise<Array<FileModel>> {
    const { filename, file } = SQSEventProcessor.parseObjectKey(objectKey);

    const zipFile = await this.importS3Adapter.download(
      { objectKey, bucketName },
      path.join(config.paths.tempFolder, filename, file),
    );

    const extracted = await this.extractService.extractFiles(zipFile, config.paths.tempFolder);

    if (!extracted || !extracted.length) {
      throw new Error('Unable to extract zip content');
    }

    return extracted;
  }

  private static parseObjectKey(objectKey: string): ArticleObjectKeyDetails {
    const segments = objectKey.split('/');

    const file = segments[segments.length - 1];

    const [filename] = file.split('.');

    return {
      file,
      filename,
    };
  }

  private fetchFileByExtension(files: Array<FileModel>, extension: string): FileModel {
    const file = files.find((f) => f.extension === extension);

    if (!file) {
      throw new Error(`Unable to find file with extension ${extension}`);
    }

    return file;
  }

  private async decodeArticleFrom(jsonFile: FileModel): Promise<Article> {
    const converted = await this.fsService.readFileContents(jsonFile);

    return this.decodeService.decodeJSON<Article>(converted);
  }
}

export default SQSEventProcessor;
