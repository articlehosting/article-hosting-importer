import FileSystemService from './fs.service';
import LoggerService, { Level } from './logger.service';
import UtilService from './util.service';
import Service from '../abstract/service';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import FileModel from '../models/file.model';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';

const { endpoint } = config.aws.s3;

class CleanerService extends Service {
  private readonly archiveS3Adapter: S3Adapter;

  private readonly fsService: FileSystemService;

  private readonly utilService: UtilService;

  constructor(logger: LoggerService) {
    super(logger);
    this.archiveS3Adapter = new S3Adapter(this.logger, {
      endpoint,
      bucketName: config.aws.s3.archiveStorage.bucketName,
    });
    this.fsService = new FileSystemService(this.logger);
    this.utilService = new UtilService(this.logger);
  }

  public async clean(message: SQSMessageModel<S3Event>, event: S3EventModel): Promise<void> {
    const zipFile = await this.fsService.getFile(this.utilService.sourceFilePath(message.messageId, event.objectKey));

    this.logger.log<Array<string>>(Level.debug, 'archive source file', [zipFile.fullPath]);

    // @todo: [TBC] should archive file here, or this should be a part of import.
    // @todo: identify if message was processed well/fail. In `fail` case should move to fail bucket.
    // @todo: do not archive anything if source is invalid?
    // @todo: check source file if is not valid.
    await this.archiveFile(zipFile);

    const workingFolder = this.utilService.workingFolder(message.messageId);

    this.logger.log<Array<string>>(Level.debug, 'remove working folder', [workingFolder]);

    await this.fsService.removeFolder(workingFolder);
  }

  private async archiveFile(file: FileModel): Promise<void> {
    const objectKey = `${file.name}-${new Date().toISOString()}.${file.extension}`;

    await this.archiveS3Adapter.upload({ objectKey }, file);
  }
}

export default CleanerService;
