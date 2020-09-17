import path from 'path';
import extractzip from 'extract-zip';
import FileSystemService from './fs.service';
import LoggerService from './logger.service';
import Service from '../abstract/service';
import FileModel from '../models/file.model';

class ExtractService extends Service {
  private readonly fsService: FileSystemService;

  constructor(logger: LoggerService) {
    super(logger);

    this.fsService = new FileSystemService(this.logger);
  }

  private async extract(zipFile: FileModel, destination: string): Promise<void> {
    return extractzip(zipFile.fullPath, { dir: destination });
  }

  public async extractFiles(zipFile: FileModel, destination: string): Promise<Array<FileModel>> {
    await this.extract(zipFile, destination);

    const files = await this.fsService.getFolderFiles(path.join(destination, zipFile.name));

    return files;
  }
}

export default ExtractService;
