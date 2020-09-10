import SQS from 'aws-sdk/clients/sqs';
import SQSConsumer from './service/sqs-consumer';
import config from '../config';

class ApiArticleHostingImporter {
  async process(): Promise<void> {
    const { endpoint } = config.aws.sqs;

    const consumer = new SQSConsumer(
      config.aws.sqs.queueName,
      new SQS({
        ...config.aws.secrets,
        ...(endpoint ? { endpoint } : {}),
      }),
    );

    const messages = await consumer.getMessages();

    console.log(messages);

    for (let i = 0; i < messages.length; i += 1) {
      const message = messages[i];

      await consumer.removeMessage(message);
      console.log(`Message ${message.MessageId ?? ''} was removed from ${config.aws.sqs.queueName} queue`);
    }
  }
}

const api = new ApiArticleHostingImporter();

export default api;
