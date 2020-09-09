import path from 'path';
import { CommonEncodeOptions } from '@stencila/encoda/dist/codecs/types';
import { ReceiveMessageRequest } from 'aws-sdk/clients/sqs';

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line
  require('dotenv').config({
    path: path.join(__dirname, '..', '..', '.env'),
  });
}

const config = {
  stencila: {
    options: <CommonEncodeOptions> {
      isBundle: false,
      isStandalone: true,
      shouldZip: 'no',
      format: 'json',
    },
  },
  aws: {
    secrets: {
      region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    sqs: {
      QueueName: process.env.SQS_QUEUE_NAME ?? 'somequeue',
      defaultReceiveParams: <ReceiveMessageRequest> {
        AttributeNames: [
          'SentTimestamp',
        ],
        MaxNumberOfMessages: 1 ?? 10,
        MessageAttributeNames: [
          'All',
        ],
        VisibilityTimeout: 5 ?? 20,
        WaitTimeSeconds: 10,
      },
    },
    s3: {
      importStorage: {},
      articleStorage: {},
      archiveStorage: {},
    },
  },
};

export default config;
