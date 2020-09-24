import path from 'path';
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

  public async extractFiles(zipFile: FileModel, destination: string): Promise<Array<FileModel>> {
    await this.fsService.extract(zipFile, destination);

    const files = await this.fsService.getFolderFiles(path.join(destination, zipFile.name));

    return files;
  }
}

export default ExtractService;
