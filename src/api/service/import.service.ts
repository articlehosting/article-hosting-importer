import { Message } from 'aws-sdk/clients/sqs';
import LoggerService, { Level } from './logger.service';
import SQSService from './sqs.service';
import Service from '../abstract/service';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { S3Event } from '../models/s3Event.model';
import SQSMessageModel from '../models/sqsMessage.model';

const { endpoint } = config.aws.s3;
const importBucketName = config.aws.s3.importStorage.bucketName;

class ImportService extends Service {
  private sqsService: SQSService;

  private importS3Adapter: S3Adapter;

  constructor(logger: LoggerService, sqsService: SQSService) {
    super(logger);
    this.sqsService = sqsService;

    if (!importBucketName) {
      throw new Error(`Invalid importBucketName: ${importBucketName}`);
    }

    this.importS3Adapter = new S3Adapter(this.logger, {
      bucketName: importBucketName,
      endpoint,
    });
  }

  async processMessage(message: SQSMessageModel<S3Event>): Promise<void> {
    this.logger.log<Message>(Level.debug, 'message', message.message);
    await this.sqsService.removeMessage(message);

    const context = await this.sqsService.decodeContent(message);

    const zipFile = await this.importS3Adapter.download(context.objectKey);

    // this.logger.log(Level.debug, 'message--->', context);

    console.log(zipFile);

    // download zip from s3
    // unzip zip
    // convert xml & upload to article.storage
    // insert to db
  }
}

export default ImportService;
