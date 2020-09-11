import path from 'path';
import { CommonEncodeOptions } from '@stencila/encoda/dist/codecs/types';
import { ReceiveMessageRequest } from 'aws-sdk/clients/sqs';

const root = path.normalize(path.join(__dirname, '..', '..', '..'));

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line
  require('dotenv').config({
    path: path.join(root, '.env'),
  });
}

const config = {
  logger: {
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
  },
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
      endpoint: process.env.SQS_ENDPOINT,
      queueName: process.env.SQS_QUEUE_NAME ?? 'default',
      defaultParams: <ReceiveMessageRequest> {
        AttributeNames: [
          'SentTimestamp',
        ],
        MaxNumberOfMessages: 3, // executes 3 articles in parallel
        MessageAttributeNames: [
          'All',
        ],
        VisibilityTimeout: 5 ?? 20,
        WaitTimeSeconds: 10,
      },
    },
    s3: {
      importStorage: {
        bucketName: process.env.S3_IMPORT_BUCKET_NAME,
      },
      articleStorage: {
        bucketName: process.env.S3_STORAGE_BUCKET_NAME,
      },
      archiveStorage: {
        bucketName: process.env.S3_ARCHIVE_BUCKET_NAME,
      },
    },
  },
  paths: {
    tempFolder: path.join(root, 'tmp'),
  },
};

export default config;
