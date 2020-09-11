import path from 'path';
import S3, { ClientConfiguration } from 'aws-sdk/clients/s3';
import Adapter from '../abstract/adapter';
import config from '../config';
import FileModel from '../models/file.model';
import FileSystemService from '../service/fs.service';
import LoggerService, { Level } from '../service/logger.service';

interface S3AdapterOptions {
  bucketName: string;
  endpoint?: string
}

class S3Adapter extends Adapter {
  private s3: S3;

  private fsService: FileSystemService;

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
    this.fsService = new FileSystemService(this.logger);
  }

  async download(objectKey: string): Promise<FileModel> {
    const params = {
      Bucket: this.bucketName,
      Key: objectKey,
    };

    this.logger.log(Level.debug, 'download s3 object', params);

    const filename = path.join(config.paths.tempFolder, objectKey);
    const readStream = this.s3.getObject(params).createReadStream();

    return this.fsService.writeToFile(filename, readStream);
  }

  // async upload(s3ObjectModel: FileModel): Promise<FileModel> {
  //   // this.s3.upload()
  // }
}

export default S3Adapter;
