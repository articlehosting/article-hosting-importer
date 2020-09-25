import Model from '../abstract/model';
import LoggerService from '../services/logger.service';

export interface S3Event {
  Records: [{
    eventVersion: string,
    eventSource: string,
    awsRegion: string,
    eventTime: string,
    eventName: string,
    userIdentity: {
      principalId: string
    },
    requestParameters: {
      sourceIPAddress: string,
    },
    responseElements: {
      'x-amz-request-id': string,
      'x-amz-id-2': string,
    },
    s3: {
      s3SchemaVersion: string,
      configurationId: string,
      bucket: {
        name: string,
        ownerIdentity: {
          principalId: string,
        },
        arn: string,
      },
      object: {
        key: string,
        size: number,
        eTag: string,
        sequencer: string,
      }
    }
  }],
}

class S3EventModel extends Model {
  private ConfigurationId: string;

  private BucketName: string;

  private BucketArn: string;

  private ObjectKey: string;

  private ObjectSize: number;

  constructor(logger: LoggerService, s3Event: S3Event) {
    super(logger);

    const record = s3Event.Records[0];

    this.ConfigurationId = record.s3.configurationId;
    this.BucketName = record.s3.bucket.name;
    this.BucketArn = record.s3.bucket.arn;
    this.ObjectKey = record.s3.object.key;
    this.ObjectSize = record.s3.object.size;
  }

  get configurationId(): string {
    return this.ConfigurationId;
  }

  get bucketName(): string {
    return this.BucketName;
  }

  get bucketArn(): string {
    return this.BucketArn;
  }

  get objectKey(): string {
    return this.ObjectKey;
  }

  get objectSize(): number {
    return this.ObjectSize;
  }
}

export default S3EventModel;
