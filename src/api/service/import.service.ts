import { Message } from 'aws-sdk/clients/sqs';
import LoggerService, { Level } from './logger.service';
import SQSService from './sqs.service';
import Service from '../abstract/service';
import { S3Event } from '../models/s3Event.model';
import SQSMessageModel from '../models/sqsMessage.model';

class ImportService extends Service {
  private sqsService: SQSService;

  constructor(logger: LoggerService, sqsService: SQSService) {
    super(logger);
    this.sqsService = sqsService;
  }

  async processMessage(message: SQSMessageModel<S3Event>): Promise<void> {
    this.logger.log<Message>(Level.debug, 'message', message.message);
    await this.sqsService.removeMessage(message);

    const context = await this.sqsService.decodeContent(message);

    // this.logger.log(Level.debug, 'message--->', context);

    console.log(context);

    // download zip from s3
    // unzip zip
    // convert xml & upload to article.storage
    // insert to db
  }
}

export default ImportService;
