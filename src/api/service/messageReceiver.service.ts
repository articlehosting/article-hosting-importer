import SQSMessageModel, { SQSEvent } from '../../models/SQSMessage.model';
import SQSAdapter from '../adapters/sqs';

class MessageReceiverService {
  private sqsAdapter: SQSAdapter;

  constructor(sqsAdapter: SQSAdapter) {
    this.sqsAdapter = sqsAdapter;
  }

  public async getMessages(): Promise<Array<SQSMessageModel<SQSEvent>>> {
    const messages = await this.sqsAdapter.getMessages();

    const result = messages.map((message) => new SQSMessageModel<SQSEvent>(message));

    return result;
  }

  async processMessage(message: SQSMessageModel<SQSEvent>): Promise<void> {
    console.log(message);

    await this.sqsAdapter.removeMessage(message.message);
    console.info(`Message ${message.messageId} was removed from queue.`);
  }

  // async process(): void {
  //   const messages = await this.getMessages();
  //
  // }
}

export default MessageReceiverService;
