import path from 'path';
import { Message } from 'aws-sdk/clients/sqs';
import FileSystemService from './fs.service';
import LoggerService, { Level } from './logger.service';
import SQSService from './sqs.service';
import Service from '../abstract/service';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { S3Event } from '../models/s3Event.model';
import SQSMessageModel from '../models/sqsMessage.model';

const { endpoint } = config.aws.s3;

class ImportService extends Service {
  private sqsService: SQSService;

  private importS3Adapter: S3Adapter;

  private fsService: FileSystemService;

  constructor(logger: LoggerService, sqsService: SQSService) {
    super(logger);
    this.sqsService = sqsService;

    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
    this.fsService = new FileSystemService(this.logger);
  }

  // todo: store here only import related logic. (rename method to import)
  async processMessage(message: SQSMessageModel<S3Event>): Promise<void> {
    this.logger.log<Message>(Level.debug, 'message', message.message);
    await this.sqsService.removeMessage(message);

    const context = this.sqsService.decodeContent(message);

    const zipFile = await this.importS3Adapter.download(context.objectKey, context.bucketName);
    const unzipDest = path.join(config.paths.tempFolder, 'extracted');
    await this.fsService.createFolder(unzipDest);
    await this.fsService.unzip(zipFile, unzipDest);

    // this.logger.log(Level.debug, 'message--->', context);
    // download zip from s3
    // unzip zip
    // convert xml & upload to article.storage
    // insert to db
  }
}

export default ImportService;
