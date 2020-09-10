import SqsMessageModel, { SQSEvent } from '../../models/sqsMessage.model';
import SQSAdapter from '../adapters/sqs.adapter';

class SQSService {
  private sqsAdapter: SQSAdapter;

  constructor(sqsAdapter: SQSAdapter) {
    this.sqsAdapter = sqsAdapter;
  }

  public async getMessages(): Promise<Array<SqsMessageModel<SQSEvent>>> {
    const messages = await this.sqsAdapter.getMessages();

    const result = messages.map((message) => new SqsMessageModel<SQSEvent>(message));

    return result;
  }

  async processMessage(message: SqsMessageModel<SQSEvent>): Promise<void> {
    console.log(message);

    await this.sqsAdapter.removeMessage(message.message);
    console.info(`Message ${message.messageId} was removed from queue.`);
  }
}

export default SQSService;
