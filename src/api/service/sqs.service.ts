import LoggerService, { Level } from './logger.service';
import Service from '../abstract/service';
import SQSAdapter from '../adapters/sqs.adapter';
import S3EventModel, { S3Event } from '../models/s3Event.model';
import SQSMessageModel from '../models/sqsMessage.model';

class SQSService extends Service {
  private sqsAdapter: SQSAdapter;

  constructor(logger: LoggerService, sqsAdapter: SQSAdapter) {
    super(logger);
    this.sqsAdapter = sqsAdapter;
  }

  public async getMessages(): Promise<Array<SQSMessageModel<S3Event>>> {
    const messages = await this.sqsAdapter.getMessages();

    return messages.map((message) => new SQSMessageModel<S3Event>(this.logger, message));
  }

  public async removeMessage(message: SQSMessageModel<S3Event>): Promise<void> {
    await this.sqsAdapter.removeMessage(message.message);

    this.logger.log(Level.info, `Message ${message.messageId} was removed from queue.`);
  }

  public decodeContent(message: SQSMessageModel<S3Event>): S3EventModel {
    // todo: implement check message.body
    return new S3EventModel(this.logger, message.body);
  }
}

export default SQSService;
