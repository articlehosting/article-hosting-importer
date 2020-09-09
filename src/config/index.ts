import { CommonEncodeOptions } from '@stencila/encoda/dist/codecs/types';

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
    sqs: {
      name: process.env.SQS_NAME ?? 'sqs-test',
      concurrency: process.env.SQS_CONCURRENCY ?? 2,
      maxNumberOfMessages: 4,
    },
    s3: {
      importStorage: {},
      articleStorage: {},
      archiveStorage: {},
    },
  },
};

export default config;
