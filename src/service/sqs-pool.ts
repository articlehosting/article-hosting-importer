import { EventEmitter } from 'events';
import SQS, { Message, ReceiveMessageRequest } from 'aws-sdk/clients/sqs';
import config from '../config';

export const CONNECT_EVENT = 'connect';
export const MESSAGE_EVENT = 'message';
export const ERROR_EVENT = 'error';
export const END_EVENT = 'end';
export const STOP_EVENT = 'stop';

export interface SQSQueue {
  QueueUrl: string
}

export interface MessageEventContext {
  QueueUrl: string,
  message: Message
}

class SQSPool extends EventEmitter {
  public sqs: SQS;

  private shouldExit: boolean;

  constructor(sqs: SQS) {
    super();
    this.sqs = sqs;
    this.shouldExit = false;

    this.on(STOP_EVENT, () => {
      this.shouldExit = true;
    });
  }

  private async connectToQueue(QueueName: string): Promise<string> {
    try {
      const queue = await this.sqs.getQueueUrl({ QueueName }).promise();
      this.emit(CONNECT_EVENT, queue);
      return <string><unknown>queue.QueueUrl;
    } catch (err) {
      this.emit(ERROR_EVENT, err);
      throw err;
    }
  }

  private readQueue(params: ReceiveMessageRequest): void {
    void this.sqs.receiveMessage({ ...config.aws.sqs.defaultReceiveParams, ...params }).promise()
      .then(({ Messages }) => {
        if (!Array.isArray(Messages) || Messages.length === 0) {
          this.emit(END_EVENT);
          return;
        }

        Messages.forEach((message) => {
          this.emit(MESSAGE_EVENT, {
            QueueUrl: params.QueueUrl,
            message,
          });
        });

        if (this.shouldExit) {
          return;
        }

        this.readQueue(params);
      })
      .catch((err) => this.emit(ERROR_EVENT, err));
  }

  public listen(
    QueueName: string,
    cb: (err?: Error | null, queue?: SQSQueue) => void,
  ): void {
    void this.connectToQueue(QueueName)
      .then((QueueUrl) => {
        cb(null, { QueueUrl });
        this.readQueue({ QueueUrl });
      })
      .catch((err) => cb(err));
  }
}

const sqs = new SQS({
  ...config.aws.secrets,
  endpoint: 'http://localhost:9324',
});

const pool = new SQSPool(sqs);

export default pool;
