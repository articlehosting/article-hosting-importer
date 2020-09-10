import LoggerService, {Level} from './logger.service';
import SqsMessageModel, {SQSEvent} from '../../models/sqsMessage.model';
import SQSAdapter from '../adapters/sqs.adapter';

class SQSService {
  private logger: LoggerService;

  private sqsAdapter: SQSAdapter;

  constructor(logger: LoggerService, sqsAdapter: SQSAdapter) {
    this.logger = logger;
    this.sqsAdapter = sqsAdapter;
  }

  public async getMessages(): Promise<Array<SqsMessageModel<SQSEvent>>> {
    const messages = await this.sqsAdapter.getMessages();

    return messages.map((message) => new SqsMessageModel<SQSEvent>(message));
  }

  public async removeMessage(message: SqsMessageModel<SQSEvent>): Promise<void> {
    await this.sqsAdapter.removeMessage(message.message);

    this.logger.log(Level.info, `Message ${message.messageId} was removed from queue.`);
  }
}

export default SQSService;
