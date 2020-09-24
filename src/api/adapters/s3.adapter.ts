import S3, { ClientConfiguration, DeleteObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3';
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
  private readonly s3: S3;

  private readonly fsService: FileSystemService;

  private readonly bucketName?: string;

  private readonly endpoint?: string;

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

  async download(
    params: { objectKey: string, bucketName?: string, },
    destinationFile: string,
  ): Promise<FileModel> {
    const Bucket = this.resolveBucketName(params.bucketName);

    const downloadParams = {
      Key: params.objectKey,
      Bucket,
    };

    return new Promise((resolve, reject) => {
      this.logger.log(Level.debug, 'download s3 object', { downloadParams, destinationFile });

      const readStream = this.s3.getObject(downloadParams).createReadStream();

      readStream.on('error', reject);

      this.fsService.writeToFile(destinationFile, readStream)
        .then(resolve)
        .catch(reject);
    });
  }

  async upload(
    params: { objectKey: string, bucketName?: string },
    file: FileModel,
  ): Promise<FileModel> {
    const Bucket = this.resolveBucketName(params.bucketName);

    return new Promise((resolve, reject) => {
      const readStream = this.fsService.readFromFile(file);

      const uploadParams = <PutObjectRequest>{
        Bucket,
        Key: params.objectKey,
        Body: readStream,
      };

      this.s3.upload(uploadParams)
        .promise()
        .then(() => resolve(file))
        .catch(reject);
    });
  }

  async remove(params: { objectKey: string, bucketName?: string }): Promise<void> {
    const Bucket = this.resolveBucketName(params.bucketName);

    return new Promise((resolve, reject) => {
      const removeParams = <DeleteObjectRequest>{
        Bucket,
        Key: params.objectKey,
      };

      this.s3.deleteObject(removeParams)
        .promise()
        .then(() => resolve())
        .catch(reject);
    });
  }

  private resolveBucketName(bucketName?:string): string {
    const bucket = bucketName ?? this.bucketName;

    if (!bucket) {
      throw new Error(`Invalid bucket name ${bucket}`);
    }

    return bucket;
  }
}

export default S3Adapter;
