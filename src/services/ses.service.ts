import LoggerService, { Level } from './logger.service';
import Service from '../abstract/service';
import SESAdapter from '../adapters/ses.adapter';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';
import { renderEmailErrorTemplate } from '../templates/email.template';

class SESService extends Service {
  private sesAdapter: SESAdapter;

  private readonly charset = 'UTF-8';

  constructor(logger: LoggerService, sesAdapter: SESAdapter) {
    super(logger);

    this.sesAdapter = sesAdapter;
  }

  private async sendMessage(subject: string, body: string): Promise<void> {
    this.logger.log<string>(Level.info, 'Sending email with error report', subject);

    await this.sesAdapter.send({
      Message: {
        Subject: {
          Charset: this.charset,
          Data: subject,
        },
        Body: {
          Html: {
            Charset: this.charset,
            Data: body,
          },
          Text: {
            Charset: this.charset,
            Data: subject,
          },
        },
      },
    });

    this.logger.log(Level.info, 'Email with report was sent!');
  }

  public async sendErrorMessage(message: SQSMessageModel<S3Event>, event: S3EventModel, err: Error): Promise<void> {
    const subject = 'Failed to import article';
    const body = renderEmailErrorTemplate(message, event, err);

    return this.sendMessage(subject, body);
  }
}

export default SESService;
