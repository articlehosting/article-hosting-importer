import SQS, {
  ClientConfiguration,
  GetQueueUrlResult, Message, MessageList, ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService, { Level } from '../service/logger.service';

export interface SqsAdapterOptions {
  queueName: string;
  endpoint?: string;
}

class SQSAdapter extends Adapter {
  private sqs: SQS;

  private name: string;

  private endpoint?: string;

  private queueUrl?: string;

  constructor(logger: LoggerService, options: SqsAdapterOptions) {
    super(logger);

    this.name = options.queueName;

    if (options && options.endpoint) {
      this.endpoint = options.endpoint;
    }

    const sqsOptions = <ClientConfiguration>{
      ...config.aws.secrets,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    };

    this.sqs = new SQS(sqsOptions);
  }

  private async getQueueUrl(): Promise<string> {
    if (this.queueUrl) {
      return this.queueUrl;
    }

    const queue = await this.connectToQueue();

    if (!queue.QueueUrl) {
      throw new Error(`Queue ${this.name} not exists`);
    }

    return queue.QueueUrl;
  }

  async connectToQueue(queueName?: string): Promise<GetQueueUrlResult> {
    try {
      const QueueName = queueName ?? this.name;
      const queue = await this.sqs.getQueueUrl({ QueueName }).promise();

      if (!queue || !queue.QueueUrl) {
        throw new Error(`Queue ${QueueName} not exists`);
      }

      this.queueUrl = queue.QueueUrl;

      this.logger.log<GetQueueUrlResult>(Level.info, 'connected to queue', queue);

      return queue;
    } catch (err) {
      throw new Error(err);
    }
  }

  async getMessages(params?: ReceiveMessageRequest): Promise<MessageList> {
    try {
      const QueueUrl = await this.getQueueUrl();

      const data = await this.sqs.receiveMessage({
        ...config.aws.sqs.defaultParams,
        QueueUrl,
        ...(params ?? {}),
      }).promise();

      return data.Messages ?? [];
    } catch (err) {
      throw new Error(err);
    }
  }

  async removeMessage(message: Message): Promise<void> {
    try {
      const QueueUrl = await this.getQueueUrl();

      if (message.ReceiptHandle) {
        await this.sqs.deleteMessage({ QueueUrl, ReceiptHandle: message.ReceiptHandle }).promise();
      }
    } catch (err) {
      throw new Error(err);
    }
  }
}

export default SQSAdapter;
