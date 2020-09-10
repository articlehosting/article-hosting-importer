import SQS, {
  GetQueueUrlResult, Message, MessageList, ReceiveMessageRequest,
} from 'aws-sdk/clients/sqs';
import config from '../../config';

export default class SQSConsumer {
  private sqs: SQS;

  private name: string;

  private queueUrl?: string;

  constructor(queueName: string, sqs: SQS) {
    this.name = queueName;
    this.sqs = sqs;
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
      console.log(err);
      throw new Error(err);
    }
  }

  async removeMessage(message: Message): Promise<void> {
    try {
      const QueueUrl = await this.getQueueUrl();

      if (message.ReceiptHandle) {
        await this.sqs.deleteMessage({ QueueUrl, ReceiptHandle: message.ReceiptHandle }).promise();
        console.info(`${message.MessageId ?? ''} was removed from queue.`);
      }
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  }
}
