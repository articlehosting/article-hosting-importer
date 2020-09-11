import S3, { ClientConfiguration } from 'aws-sdk/clients/s3';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService from '../service/logger.service';

interface S3AdapterOptions {
  endpoint?: string
}

class S3Adapter extends Adapter {
  private s3: S3;

  private endpoint?: string;

  constructor(logger: LoggerService, options?: S3AdapterOptions) {
    super(logger);

    if (options && options.endpoint) {
      this.endpoint = options.endpoint;
    }

    const s3Options = <ClientConfiguration>{
      ...(config.aws.secrets),
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    };

    this.s3 = new S3(s3Options);
  }
}

export default S3Adapter;
