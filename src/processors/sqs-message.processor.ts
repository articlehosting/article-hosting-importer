import path from 'path';
import Processor from '../abstract/processor';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { XML_EXT } from '../config/constants';
import ManifestMapper, { Manifest, ManifestMapped } from '../mappers/manifest.mapper';
import ArticleModel, { Article } from '../models/article.model';
import FileModel from '../models/file.model';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';
import DecodeService from '../services/decode.service';
import ExtractService from '../services/extract.service';
import FileSystemService from '../services/fs.service';
import ImportService from '../services/import.service';
import LoggerService, { Level } from '../services/logger.service';
import SQSService from '../services/sqs.service';
import StencilaService from '../services/stencila.service';
import UtilService from '../services/util.service';
import XmlService from '../services/xml.service';

const { endpoint } = config.aws.s3;

class SQSEventProcessor extends Processor {
  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly fsService: FileSystemService;

  private readonly utilService: UtilService;

  private readonly extractService: ExtractService;

  private readonly stencilaService: StencilaService;

  private readonly xmlService: XmlService;

  private readonly manifestMapper: ManifestMapper<Manifest>;

  private readonly decodeService: DecodeService;

  private readonly importService: ImportService;

  private readonly importS3Adapter: S3Adapter;

  private Event?: S3EventModel;

  private Message?: SQSMessageModel<S3Event>;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);

    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;

    this.fsService = new FileSystemService(this.logger);
    this.utilService = new UtilService(this.logger);
    this.extractService = new ExtractService(this.logger);
    this.stencilaService = new StencilaService(this.logger);
    this.xmlService = new XmlService(this.logger);
    this.manifestMapper = new ManifestMapper<Manifest>(this.logger);
    this.decodeService = new DecodeService(this.logger);
    this.importService = new ImportService(this.logger, this.sqsService, this.dbAdapter);

    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
  }

  withEvent(event: S3EventModel): SQSEventProcessor {
    this.Event = event;

    return this;
  }

  withMessage(message: SQSMessageModel<S3Event>): SQSEventProcessor {
    this.Message = message;

    return this;
  }

  public async processEvent(): Promise<void> {
    if (!this.Event) {
      throw new Error('Invalid S3 event model');
    }

    const zipContents = await this.processSourceFile(this.Event);

    const files = await this.processZipContents(zipContents);

    const jsonFile = await this.stencilaService.convert(this.utilService.fetchFileByExtension(files, XML_EXT), 'jats');

    const article = await this.decodeArticleFrom(jsonFile);

    const articleModel = new ArticleModel(this.logger, {
      article,
      files,
    });

    await this.importService.importArticle(articleModel);
  }

  private async processZipContents(zipContents: Array<FileModel>): Promise<Array<FileModel>> {
    const MANIFEST = 'manifest.xml';
    // @todo: implement more better way..
    const manifest = zipContents.find((file) => file.basename === MANIFEST);

    if (!manifest) {
      return zipContents;
    }

    const manifestContent = await this.xmlService.parse(manifest);
    const decodedManifest = this.manifestMapper.map<ManifestMapped>(manifestContent);

    const files: Array<string> = [];

    if (!decodedManifest.xmlFile) {
      throw new Error(`Unable to identify source XML file from ${MANIFEST}`);
    } else {
      files.push(decodedManifest.xmlFile);
    }

    if (decodedManifest.pdfFile) {
      files.push(decodedManifest.pdfFile);
    }

    if (decodedManifest.media && Array.isArray(decodedManifest.media) && decodedManifest.media.length) {
      files.push(...decodedManifest.media);
    }

    return files.map((file: string) => new FileModel(this.logger, {
      filePath: path.join(manifest.dirname, file),
    }));
  }

  private async processSourceFile({ objectKey, bucketName }: S3EventModel): Promise<Array<FileModel>> {
    if (!this.Message) {
      throw new Error('Invalid context message');
    }

    const srcFileDest = this.utilService.sourceFilePath(this.Message.messageId, objectKey);

    this.logger.log(Level.info, `article source file destination ${srcFileDest}`);

    const zipFile = await this.importS3Adapter.download({ objectKey, bucketName }, srcFileDest);

    const extracted = await this.extractService.extractFiles(zipFile, this.Message.messageId);

    if (!extracted || !extracted.length) {
      throw new Error('Unable to extract zip content');
    }

    return extracted;
  }

  private async decodeArticleFrom(jsonFile: FileModel): Promise<Article> {
    const converted = await this.fsService.readFileContents(jsonFile);

    return this.decodeService.decodeJSON<Article>(converted);
  }
}

export default SQSEventProcessor;