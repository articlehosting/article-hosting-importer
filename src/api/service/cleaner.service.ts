import FileSystemService from './fs.service';
import LoggerService from './logger.service';
import Service from '../abstract/service';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import FileModel from '../models/file.model';

const { endpoint } = config.aws.s3;

class CleanerService extends Service {
  private readonly archiveS3Adapter: S3Adapter;

  private readonly fsService: FileSystemService;

  constructor(logger: LoggerService) {
    super(logger);
    this.archiveS3Adapter = new S3Adapter(this.logger, {
      endpoint,
      bucketName: config.aws.s3.archiveStorage.bucketName,
    });
    this.fsService = new FileSystemService(this.logger);
  }

  public async clean(zipFile: FileModel): Promise<void> {
    await this.archiveFile(zipFile);
    await this.fsService.removeFolder(zipFile.folderPath);
  }

  private async archiveFile(file: FileModel): Promise<void> {
    const objectKey = `${file.name}-${new Date().toISOString()}.${file.extension}`;

    await this.archiveS3Adapter.upload({ objectKey }, file);
  }
}

export default CleanerService;
