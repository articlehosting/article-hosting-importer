import S3, { ClientConfiguration } from 'aws-sdk/clients/s3';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService from '../service/logger.service';

interface S3AdapterOptions {
  bucketName: string;
  endpoint?: string
}

class S3Adapter extends Adapter {
  private s3: S3;

  private bucketName: string;

  private endpoint?: string;

  constructor(logger: LoggerService, options: S3AdapterOptions) {
    super(logger);

    if (options.endpoint) {
      this.endpoint = options.endpoint;
    }

    this.bucketName = options.bucketName;

    const s3Options = <ClientConfiguration>{
      ...(config.aws.secrets),
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
    };

    this.s3 = new S3(s3Options);
  }

  // download() {
  //
  // }
  //
  // upload() {
  //
  // }
}

export default S3Adapter;
