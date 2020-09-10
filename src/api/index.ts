import SQS from 'aws-sdk/clients/sqs';
import SQSAdapter from './adapters/sqs.adapter';
import SQSService from './service/sqs.service';
import config from '../config';

const { endpoint } = config.aws.sqs;

class ApiArticleHostingImporter {
  private sqsAdapter: SQSAdapter;

  private sqsService: SQSService;

  constructor() {
    this.sqsAdapter = new SQSAdapter(
      config.aws.sqs.queueName,
      new SQS({
        ...config.aws.secrets,
        ...(endpoint ? { endpoint } : {}),
      }),
    );

    this.sqsService = new SQSService(this.sqsAdapter);
  }

  async process(): Promise<void> {
    const messages = await this.sqsService.getMessages();

    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    for (const message of messages) {
      await this.sqsService.processMessage(message);
    }

    await this.process();
  }
}

const api = new ApiArticleHostingImporter();

export default api;
