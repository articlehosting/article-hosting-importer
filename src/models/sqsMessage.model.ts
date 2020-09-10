import { Message, MessageAttributeValue } from 'aws-sdk/clients/sqs';
import Model from './model';
import LoggerService, { Level } from '../api/service/logger.service';

export interface SQSEvent {
  Records: [{
    eventVersion: string,
    eventSource: string,
    awsRegion: string,
    eventTime: string,
    eventName: string,
    userIdentity: {
      principalId: string
    },
    requestParameters: {
      sourceIPAddress: string,
    },
    responseElements: {
      'x-amz-request-id': string,
      'x-amz-id-2': string,
    },
    s3: {
      s3SchemaVersion: string,
      configurationId: string,
      bucket: {
        name: string,
        ownerIdentity: {
          principalId: string,
        },
        arn: string,
      },
      object: {
        key: string,
        size: number,
        eTag: string,
        sequencer: string,
      }
    }
  }],
}

class SQSMessageModel<T> extends Model {
  private Message: Message;

  private MessageId: string;

  private ReceiptHandle: string;

  private Attributes: {[key: string]: string};

  private MessageAttributes: {[key: string]: MessageAttributeValue};

  private OriginalBody: string;

  private Body: T;

  constructor(logger: LoggerService, message: Message) {
    super(logger);
    this.Message = message;
    this.MessageId = message.MessageId ?? '';
    this.ReceiptHandle = message.ReceiptHandle ?? '';
    this.Attributes = message.Attributes ?? {};
    this.MessageAttributes = message.MessageAttributes ?? {};
    this.OriginalBody = message.Body ?? '';

    this.Body = this.decodeBody<T>();
  }

  get message(): Message {
    return this.Message;
  }

  get messageId(): string {
    return this.MessageId;
  }

  get receiptHandle(): string {
    return this.ReceiptHandle;
  }

  get attributes(): {[key: string]: string} {
    return this.Attributes;
  }

  get messageAttributes(): {[key: string]: MessageAttributeValue} {
    return this.MessageAttributes;
  }

  get originalBody(): string {
    return this.OriginalBody;
  }

  get body(): T {
    return this.decodeBody<T>();
  }

  private decodeBody<T>(): T {
    try {
      return <T>JSON.parse(this.OriginalBody);
    } catch (err) {
      this.logger.log<Error>(Level.error, `Unable to parse body "${this.OriginalBody}"`, err);

      return <T>{};
    }
  }
}

export default SQSMessageModel;
