import path from 'path';
import { Message } from 'aws-sdk/clients/sqs';
import Processor from '../abstract/processor';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { XML_EXT } from '../constants';
import ArticleModel, { Article } from '../models/article.model';
import FileModel from '../models/file.model';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';
import DecodeService from '../service/decode.service';
import ExtractService from '../service/extract.service';
import FileSystemService from '../service/fs.service';
import ImportService from '../service/import.service';
import LoggerService, { Level } from '../service/logger.service';
import SQSService from '../service/sqs.service';
import StencilaService from '../service/stencila.service';

const { endpoint } = config.aws.s3;

interface ArticleObjectKeyDetails {
  filename: string,
  file: string,
}

class SQSMessageProcessor extends Processor {
  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly fsService: FileSystemService;

  private readonly extractService: ExtractService;

  private readonly stencilaService: StencilaService;

  private readonly decodeService: DecodeService;

  private readonly importService: ImportService;

  private readonly importS3Adapter: S3Adapter;

  private Message?: SQSMessageModel<S3Event>;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);

    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;

    this.fsService = new FileSystemService(this.logger);
    this.extractService = new ExtractService(this.logger);
    this.stencilaService = new StencilaService(this.logger);
    this.decodeService = new DecodeService(this.logger);
    this.importService = new ImportService(this.logger, this.sqsService, this.dbAdapter);

    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
  }

  withMessage(message: SQSMessageModel<S3Event>): SQSMessageProcessor {
    this.Message = message;

    return this;
  }

  public async processMessage(): Promise<void> {
    if (!this.Message) {
      throw new Error('Empty message context');
    }

    this.logger.log<Message>(Level.debug, 'message', this.Message.message);

    await this.sqsService.removeMessage(this.Message);
    const context = this.sqsService.decodeContent(this.Message);
    const files = await this.processSourceFile(context);
    const xmlFile = this.getXMLFile(files);

    const jsonFile = await this.stencilaService.convert(xmlFile);

    const article = await this.decodeArticleFrom(jsonFile);

    const articleModel = new ArticleModel(this.logger, {
      article,
      files,
    });

    await this.importService.importArticle(articleModel);
  }

  private async processSourceFile({ objectKey, bucketName }: S3EventModel): Promise<Array<FileModel>> {
    const { filename, file } = SQSMessageProcessor.parseObjectKey(objectKey);

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

  private getXMLFile(files: Array<FileModel>): FileModel {
    const xmlFile = files.find((file) => file.extension === XML_EXT);

    if (!xmlFile) {
      throw new Error('Unable to find source xml file');
    }

    return xmlFile;
  }

  private async decodeArticleFrom(jsonFile: FileModel): Promise<Article> {
    const converted = await this.fsService.readFileContents(jsonFile);

    return this.decodeService.decodeJSON<Article>(converted);
  }
}

export default SQSMessageProcessor;
