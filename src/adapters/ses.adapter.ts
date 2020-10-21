import SES, { ClientConfiguration, Content, SendEmailRequest } from 'aws-sdk/clients/ses';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService from '../services/logger.service';

export interface SESAdapterOptions {
  endpoint?: string;
}

export interface SESSendEmailRequest {
  Message: {
    Subject: Content,
    Body: {
      Html?: Content,
      Text?: Content
    }
  }
}

class SESAdapter extends Adapter {
  private ses: SES;

  private readonly endpoint?: string;

  constructor(logger: LoggerService, options: SESAdapterOptions) {
    super(logger);

    if (options && options.endpoint) {
      this.endpoint = options.endpoint;
    }

    const sesOptions = <ClientConfiguration>{
      ...config.aws.secrets,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    };

    this.ses = new SES(sesOptions);
  }

  public async send(params: SESSendEmailRequest): Promise<void> {
    const sendParams = <SendEmailRequest> {
      ...config.aws.ses.defaultSendParams,
      ...params,
    };

    await this.ses.sendEmail(sendParams).promise();
  }
}

export default SESAdapter;
