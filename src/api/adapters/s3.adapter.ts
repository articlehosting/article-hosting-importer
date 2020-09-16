import path from 'path';
import S3, { ClientConfiguration, PutObjectRequest } from 'aws-sdk/clients/s3';
import Adapter from '../abstract/adapter';
import config from '../config';
import FileModel from '../models/file.model';
import FileSystemService from '../service/fs.service';
import LoggerService, { Level } from '../service/logger.service';

interface S3AdapterOptions {
  bucketName?: string;
  endpoint?: string
}

class S3Adapter extends Adapter {
  private s3: S3;

  private fsService: FileSystemService;

  private bucketName?: string;

  private endpoint?: string;

  constructor(logger: LoggerService, options: S3AdapterOptions) {
    super(logger);

    if (options.bucketName) {
      this.bucketName = options.bucketName;
    }

    if (options.endpoint) {
      this.endpoint = options.endpoint;
    }

    const s3Options = <ClientConfiguration>{
      ...(config.aws.secrets),
      ...(this.endpoint ? {
        endpoint: this.endpoint,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      } : {}),
    };

    this.s3 = new S3(s3Options);
    this.fsService = new FileSystemService(this.logger);
  }

  resolveBucketName(bucketName?:string): string {
    const bucket = bucketName ?? this.bucketName;

    if (!bucket) {
      throw new Error(`Invalid bucket name ${bucket}`);
    }

    return bucket;
  }

  async download(objectKey: string, bucketName?: string): Promise<FileModel> {
    const Bucket = this.resolveBucketName(bucketName);

    const params = {
      Bucket,
      Key: objectKey,
    };

    return new Promise((resolve, reject) => {
      this.logger.log(Level.debug, 'download s3 object', params);

      const fileFullPath = path.join(config.paths.tempFolder, objectKey);
      const readStream = this.s3.getObject(params).createReadStream();

      readStream.on('error', reject);

      this.fsService.writeToFile(fileFullPath, readStream)
        .then(resolve)
        .catch(reject);
    });
  }

  async upload(key: string, file: FileModel, bucketName?: string): Promise<FileModel> {
    const Bucket = this.resolveBucketName(bucketName);

    return new Promise((resolve, reject) => {
      const readStream = this.fsService.readFromFile(file);

      const uploadParams = <PutObjectRequest>{
        Bucket,
        Key: key,
        Body: readStream,
      };

      this.s3.upload(uploadParams)
        .promise()
        .then(() => resolve(file))
        .catch(reject);
    });
  }
}

export default S3Adapter;
