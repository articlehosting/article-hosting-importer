import path from 'path';
import { Message } from 'aws-sdk/clients/sqs';
import DecoderService from './decoder.service';
import FileSystemService from './fs.service';
import LoggerService, { Level } from './logger.service';
import SQSService from './sqs.service';
import StencilaService from './stencila.service';
import Service from '../abstract/service';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import ArticleModel, { Article } from '../models/article.model';
import { S3Event } from '../models/s3Event.model';
import SQSMessageModel from '../models/sqsMessage.model';

const { endpoint } = config.aws.s3;
const XML_TYPE = 'xml';
const JSON_TYPE = 'json';

class ImportService extends Service {
  private readonly filesWhitelist = [XML_TYPE, JSON_TYPE];

  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly importS3Adapter: S3Adapter;

  private readonly storageS3Adapter: S3Adapter;

  private readonly fsService: FileSystemService;

  private readonly decoderService: DecoderService;

  private readonly stencilaService: StencilaService;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);
    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;
    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
    this.storageS3Adapter = new S3Adapter(this.logger, {
      endpoint,
      bucketName: config.aws.s3.articleStorage.bucketName,
    });
    this.fsService = new FileSystemService(this.logger);
    this.decoderService = new DecoderService(this.logger);
    this.stencilaService = new StencilaService(this.logger);
  }

  // todo: store here only import related logic. (rename method to import)
  async processMessage(message: SQSMessageModel<S3Event>): Promise<void> {
    this.logger.log<Message>(Level.debug, 'message', message.message);
    await this.sqsService.removeMessage(message);

    const context = this.sqsService.decodeContent(message);

    const zipFile = await this.importS3Adapter.download(context.objectKey, context.bucketName);
    const unzipDest = path.join(config.paths.tempFolder, 'extracted');
    await this.fsService.createFolder(unzipDest);
    await this.fsService.extract(zipFile, unzipDest);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const extracted = await this.fsService.getFolderFiles(path.join(unzipDest, zipFile.name));

    if (!extracted || !extracted.length) {
      throw new Error('Unable to extract zip content');
    }

    const xmlFile = extracted.find((file) => file.extension === XML_TYPE);

    if (!xmlFile) {
      throw new Error('Unable to find source xml file');
    }

    const jsonFile = await this.stencilaService.convert(xmlFile);
    const converted = await this.fsService.readFileContents(jsonFile);
    const decoded = this.decoderService.decodeJSON<Article>(converted);
    const article = new ArticleModel(this.logger, {
      article: decoded,
      files: extracted,
    });

    await Promise.all([
      this.importToDatabase(article),
      this.importFiles(article),
    ]);
  }

  async importToDatabase(article: ArticleModel): Promise<void> {
    const doi = article.getDOI();

    if (!doi) {
      throw new Error(`Invalid article identifier doi: ${doi}`);
    }

    this.logger.log(Level.debug, 'insert article to db');
    await (await this.dbAdapter.collection(article.collectionName)).updateOne({ _id: doi }, {
      $set: {
        ...article.originalData,
        files: article.buildFiles(),
        _id: doi,
      },
    }, { upsert: true });
  }

  async importFiles(article: ArticleModel): Promise<void> {
    const publisherId = article.getPublisherID();

    if (!publisherId) {
      throw new Error(`Invalid article publisher ID: ${publisherId}`);
    }

    const asyncQueue = [];
    for (const file of article.files) {
      if (!this.filesWhitelist.includes(file.extension)) {
        asyncQueue.push(this.storageS3Adapter.upload(`articles/${publisherId}/${file.filename}`, file));
      }
    }

    await Promise.all(asyncQueue);
  }
}

export default ImportService;
