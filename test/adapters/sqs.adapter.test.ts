import { mocked } from 'ts-jest/utils';

import { loggerMock } from '../mocks/services/logger.service.mock';

const mockedGetQueueUrl = jest.fn();

jest.mock('aws-sdk/clients/sqs', () => jest.fn().mockImplementation(() => ({
  getQueueUrl: () => ({
    promise: mockedGetQueueUrl,
  }),
})));

// eslint-disable-next-line import/first, import/order
import SQS, { GetQueueUrlResult } from 'aws-sdk/clients/sqs';
// eslint-disable-next-line import/first, import/order
import SQSAdapter from '../../src/adapters/sqs.adapter';

describe('sqs adapter', () => {
  const QueueName = 'default';
  const endpoint = 'http://test.sqs.queueurl';
  const getQueueUrl = (name: string): string => `${endpoint}/${name}`;

  const MockedSQS = mocked(SQS, true);

  beforeEach(() => {
    // console.log(MockedSQS.SQS);
    MockedSQS.mockClear();
  });

  it('should construct adapter with custom endpoint', () => {
    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: QueueName,
      endpoint,
    });

    // @ts-ignore
    expect(sqsAdapter.endpoint).toBe(endpoint);
  });

  it('should connect to queue', async () => {
    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: QueueName,
    });

    const QueueUrl = getQueueUrl(QueueName);

    mockedGetQueueUrl.mockResolvedValueOnce(<GetQueueUrlResult>{ QueueUrl });

    const result = await sqsAdapter.connectToQueue();

    expect(result).toBe(QueueUrl);
  });

  it('should connect to queue with custom queueName', async () => {
    const customQueue = 'custom';

    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: customQueue,
    });

    const QueueUrl = getQueueUrl(customQueue);

    mockedGetQueueUrl.mockResolvedValueOnce(<GetQueueUrlResult>{ QueueUrl });

    const result = await sqsAdapter.connectToQueue();

    expect(result).toBe(QueueUrl);
  });

  it('should not connect to queue', async () => {
    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: QueueName,
    });

    const error = new Error('Unable to connect to queue');

    mockedGetQueueUrl.mockRejectedValueOnce(error);

    await expect(async () => sqsAdapter.connectToQueue()).rejects.toStrictEqual(error);
  });

  it('should not connect to queue if given sqs response is invalid', async () => {
    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: QueueName,
    });

    mockedGetQueueUrl.mockResolvedValueOnce(<GetQueueUrlResult>{ QueueUrl: undefined });

    // @ts-ignore
    await expect(async () => sqsAdapter.getQueueUrl()).rejects.toStrictEqual(new Error(`Queue ${QueueName} not exists`));
  });

  it('should return actual connection to queue', async () => {
    const QueueUrl = getQueueUrl(QueueName);

    const sqsAdapter = new SQSAdapter(loggerMock, {
      queueName: QueueName,
    });

    mockedGetQueueUrl.mockResolvedValue(<GetQueueUrlResult>{ QueueUrl });

    // @ts-ignore
    void await sqsAdapter.getQueueUrl();

    // @ts-ignore
    const result = await sqsAdapter.getQueueUrl();

    expect(result).toBe(QueueUrl);
  });
});
