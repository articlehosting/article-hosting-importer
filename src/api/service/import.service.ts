import LoggerService, { Level } from './logger.service';
import SQSService from './sqs.service';
import Service from '../abstract/service';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import ArticleModel from '../models/article.model';

const { endpoint } = config.aws.s3;

class ImportService extends Service {
  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly storageS3Adapter: S3Adapter;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);
    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;

    this.storageS3Adapter = new S3Adapter(this.logger, {
      endpoint,
      bucketName: config.aws.s3.articleStorage.bucketName,
    });
  }

  public async importArticle(article: ArticleModel): Promise<void> {
    await Promise.all([
      this.importToDatabase(article),
      this.importFiles(article),
    ]);
  }

  private async importToDatabase(article: ArticleModel): Promise<void> {
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

  private async importFiles(article: ArticleModel): Promise<void> {
    const publisherId = article.getPublisherID();

    if (!publisherId) {
      throw new Error(`Invalid article publisher ID: ${publisherId}`);
    }

    const asyncQueue = [];

    for (const file of article.files) {
      if (!config.importFilesWhiteList.includes(file.extension)) {
        const objectKey = `articles/${publisherId}/${file.filename}`;

        asyncQueue.push(this.storageS3Adapter.upload({ objectKey }, file));
      }
    }

    await Promise.all(asyncQueue);
  }
}

export default ImportService;
