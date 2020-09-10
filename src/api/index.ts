import SQS from 'aws-sdk/clients/sqs';
import SQSAdapter from './adapters/sqs';
import MessageReceiverService from './service/messageReceiver.service';
import config from '../config';

const { endpoint } = config.aws.sqs;

class ApiArticleHostingImporter {
  private sqsAdapter: SQSAdapter;

  private messageReceiverService: MessageReceiverService;

  constructor() {
    this.sqsAdapter = new SQSAdapter(
      config.aws.sqs.queueName,
      new SQS({
        ...config.aws.secrets,
        ...(endpoint ? { endpoint } : {}),
      }),
    );

    this.messageReceiverService = new MessageReceiverService(this.sqsAdapter);
  }

  async process(): Promise<void> {
    const messages = await this.messageReceiverService.getMessages();

    for (const message of messages) {
      await this.messageReceiverService.processMessage(message);
    }
  }
}

const api = new ApiArticleHostingImporter();

export default api;
