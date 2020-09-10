import SQS, { Message } from 'aws-sdk/clients/sqs';
import SQSAdapter from './adapters/sqs.adapter';
import LoggerService, { Level, Logable } from './service/logger.service';
import SQSService from './service/sqs.service';
import config from '../config';

const { endpoint } = config.aws.sqs;

class ApiArticleHostingImporter extends Logable {
  private sqsAdapter: SQSAdapter;

  private sqsService: SQSService;

  constructor() {
    super(new LoggerService());

    this.sqsAdapter = new SQSAdapter(
      this.logger,
      config.aws.sqs.queueName,
      new SQS({
        ...config.aws.secrets,
        ...(endpoint ? { endpoint } : {}),
      }),
    );

    this.sqsService = new SQSService(this.logger, this.sqsAdapter);
  }

  async process(): Promise<void> {
    const messages = await this.sqsService.getMessages();

    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    const asyncQueue = [];

    for (const message of messages) {
      this.logger.log<Message>(Level.debug, 'message', message.message);

      asyncQueue.push(this.sqsService.removeMessage(message));
    }

    await Promise.all(asyncQueue);
    await this.process();
  }
}

const api = new ApiArticleHostingImporter();

export default api;
