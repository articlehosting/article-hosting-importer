import SQSEventProcessor from './sqs-message.processor';
import Logable from '../abstract/logable';
import DatabaseAdapter from '../adapters/db.adapter';
import SESAdapter from '../adapters/ses.adapter';
import SQSAdapter from '../adapters/sqs.adapter';
import config from '../config';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';
import CleanerService from '../services/cleaner.service';
import LoggerService, { Level } from '../services/logger.service';
import SESService from '../services/ses.service';
import SQSService from '../services/sqs.service';

class ArticleImporterProcessor extends Logable {
  private readonly sqsAdapter: SQSAdapter;

  private readonly sesAdapter: SESAdapter;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly sqsService: SQSService;

  private readonly sesService: SESService;

  private readonly cleanerService: CleanerService;

  constructor(logger: LoggerService) {
    super(logger);

    this.sqsAdapter = new SQSAdapter(
      this.logger,
      {
        queueName: config.aws.sqs.queueName,
        endpoint: config.aws.sqs.endpoint,
      },
    );

    this.sesAdapter = new SESAdapter(
      this.logger,
      {
        endpoint: config.aws.ses.endpoint,
      },
    );

    this.dbAdapter = new DatabaseAdapter(this.logger);

    this.sqsService = new SQSService(this.logger, this.sqsAdapter);

    this.sesService = new SESService(this.logger, this.sesAdapter);

    this.cleanerService = new CleanerService(this.logger);
  }

  async process(): Promise<void> {
    this.logger.log(Level.info, 'watching queue for a job');

    const messages = await this.sqsService.getMessages();

    if (!Array.isArray(messages) || messages.length === 0) {
      this.logger.log(Level.info, 'No messages in queue. Exiting!');
      return;
    }

    const messagesIds = messages.map((message) => message.messageId);

    this.logger.log<Array<string>>(Level.info, `parallel messages: '${config.aws.sqs.defaultParams.MaxNumberOfMessages}'`, messagesIds);

    const asyncQueue = [];
    const removeMessagesQueue = [];

    for (const message of messages) {
      const event = this.sqsService.parseMessageEvent(message);

      removeMessagesQueue.push(
        this.sqsService.removeMessage(message)
          .catch(async (err) => {
            this.logger.log<Error>(Level.error, err.message, err);
          }),
      );

      asyncQueue.push(
        new Promise((resolve) => {
          void this.processEvent(message, event)
            .then(resolve)
            .catch(async (err) => {
              this.logger.log<Error>(Level.error, err.message, err);

              await this.sesService.sendErrorMessage(message, event, err);

              resolve();
            });
        })
          .then(async () => {
            await this.cleanerService.clean(message, event);
          })
          .catch(async (err) => {
            // critical error.
            this.logger.log<Error>(Level.error, `Unable to clear stuff ${message.messageId}. ${err.message}`, err);
          }),
      );
    }

    await Promise.all(removeMessagesQueue);
    await Promise.all(asyncQueue);

    this.logger.log<Array<string>>(Level.info, 'set of messages processed!', messagesIds);

    await this.process();
  }

  private async processEvent(message: SQSMessageModel<S3Event>, event: S3EventModel): Promise<void> {
    return new SQSEventProcessor(this.logger, this.sqsService, this.dbAdapter)
      .withMessage(message)
      .withEvent(event)
      .processEvent();
  }
}

export default ArticleImporterProcessor;
