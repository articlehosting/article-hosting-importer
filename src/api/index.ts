import Logable from './abstract/logable';
import SQSAdapter from './adapters/sqs.adapter';
import config from './config';
import ImportService from './service/import.service';
import LoggerService, { Level } from './service/logger.service';
import SQSService from './service/sqs.service';

const { endpoint } = config.aws.sqs;

class ApiArticleHostingImporter extends Logable {
  private sqsAdapter: SQSAdapter;

  private sqsService: SQSService;

  private importService: ImportService;

  constructor(logger: LoggerService) {
    super(logger);

    this.sqsAdapter = new SQSAdapter(
      this.logger,
      {
        queueName: config.aws.sqs.queueName,
        endpoint,
      },
    );

    this.sqsService = new SQSService(this.logger, this.sqsAdapter);
    this.importService = new ImportService(this.logger, this.sqsService);
  }

  async process(): Promise<void> {
    const messages = await this.sqsService.getMessages();

    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    const asyncQueue = [];

    for (const message of messages) {
      asyncQueue.push(
        this.importService.processMessage(message)
          .catch((err) => {
            this.logger.log<Error>(Level.error, err.message, err);
          }),
      );
    }

    await Promise.all(asyncQueue);
    await this.process();
  }
}

export default ApiArticleHostingImporter;
