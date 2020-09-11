import Model from '../abstract/model';
import LoggerService from '../service/logger.service';

export interface FileData {
  filename: string,
}

class FileModel extends Model {
  private Filename: string;

  constructor(logger: LoggerService, data: FileData) {
    super(logger);

    this.Filename = data.filename;
  }

  get filename(): string {
    return this.Filename;
  }
}

export default FileModel;
