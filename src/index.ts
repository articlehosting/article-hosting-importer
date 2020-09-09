import config from './config';
import pool, {
  END_EVENT, ERROR_EVENT, MESSAGE_EVENT, MessageEventContext,
} from './service/sqs-pool';

export interface SQSQueueEvent {
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

let called = 1;

pool.on(MESSAGE_EVENT, ({ message, QueueUrl }: MessageEventContext) => {
  setTimeout(() => {
    console.log(message, called);

    const { ReceiptHandle } = message;

    if (ReceiptHandle) {
      pool.sqs.deleteMessage({ QueueUrl, ReceiptHandle }, (err, data) => {
        console.log(`${message.MessageId ?? ''} removed from queue`, data);

        if (err) {
          pool.emit(ERROR_EVENT, err);
        }
      });
    } else {
      pool.emit(ERROR_EVENT, new Error('IMPOSSIBLE ERROR!! :D'));
    }

    called += 1;
  }, 4000);
});

pool.on(ERROR_EVENT, (err) => console.error(err));

pool.on(END_EVENT, () => console.info('Job done.'));

pool.listen(config.aws.sqs.QueueName, () => {
  console.info('start listening SQS events.');
});
