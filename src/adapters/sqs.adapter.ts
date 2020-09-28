import SQS, {
  ClientConfiguration,
  Message, MessageList, ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService, { Level } from '../services/logger.service';

export interface SQSAdapterOptions {
  queueName: string;
  endpoint?: string;
}

class SQSAdapter extends Adapter {
  private sqs: SQS;

  private readonly name: string;

  private readonly endpoint?: string;

  private queueUrl?: string;

  constructor(logger: LoggerService, options: SQSAdapterOptions) {
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

    return this.connectToQueue();
  }

  public async connectToQueue(queueName?: string): Promise<string> {
    const QueueName = queueName ?? this.name;

    const { QueueUrl } = await this.sqs.getQueueUrl({ QueueName }).promise();

    if (!QueueUrl) {
      throw new Error(`Queue ${QueueName} not exists`);
    }

    this.queueUrl = QueueUrl;

    this.logger.log<string>(Level.info, 'connected to queue', QueueUrl);

    return QueueUrl;
  }

  public async getMessages(params?: ReceiveMessageRequest): Promise<MessageList> {
    const QueueUrl = await this.getQueueUrl();

    const data = await this.sqs.receiveMessage({
      ...config.aws.sqs.defaultParams,
      QueueUrl,
      ...(params ?? {}),
    }).promise();

    return data.Messages ?? [];
  }

  public async removeMessage(message: Message): Promise<void> {
    const QueueUrl = await this.getQueueUrl();

    if (message.ReceiptHandle) {
      await this.sqs.deleteMessage({ QueueUrl, ReceiptHandle: message.ReceiptHandle }).promise();
    }
  }
}

export default SQSAdapter;
