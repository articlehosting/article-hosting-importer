import { Message, MessageAttributeValue } from 'aws-sdk/clients/sqs';
import Model from '../abstract/model';
import DecoderService from '../service/decoder.service';
import LoggerService from '../service/logger.service';

class SQSMessageModel<T> extends Model {
  private readonly Message: Message;

  private readonly MessageId: string;

  private readonly ReceiptHandle: string;

  private readonly Attributes: {[key: string]: string};

  private readonly MessageAttributes: {[key: string]: MessageAttributeValue};

  private readonly OriginalBody: string;

  private readonly Body: T;

  private readonly decoderService: DecoderService;

  constructor(logger: LoggerService, message: Message) {
    super(logger);
    this.decoderService = new DecoderService(this.logger);

    this.Message = message;
    this.MessageId = message.MessageId ?? '';
    this.ReceiptHandle = message.ReceiptHandle ?? '';
    this.Attributes = message.Attributes ?? {};
    this.MessageAttributes = message.MessageAttributes ?? {};
    this.OriginalBody = message.Body ?? '';

    this.Body = this.decoderService.decodeJSON<T>(this.OriginalBody);
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
    return this.Body;
  }
}

export default SQSMessageModel;
