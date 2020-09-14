import Model from '../abstract/model';
import LoggerService from '../service/logger.service';

export interface FileData {
  fullPath: string,
}

class FileModel extends Model {
  private FullPath: string;

  private Name: string;

  private Filename: string;

  private Extension: string;

  constructor(logger: LoggerService, data: FileData) {
    super(logger);

    this.FullPath = data.fullPath;

    const segments = this.FullPath.split(/[/\\]/g);

    if (!segments ?? segments.length) {
      throw new Error(`Invalid file path ${this.FullPath}`);
    }

    const filename = segments[segments.length - 1];

    this.Filename = filename;

    const [name, extension] = filename.split('.');

    if (!name || !extension) {
      throw new Error(`Unable to parse file path ${filename}`);
    }

    this.Name = name;
    this.Extension = extension;
  }

  get extension(): string {
    return this.Extension;
  }

  get fullPath(): string {
    return this.FullPath;
  }

  get filename(): string {
    // name + ext.
    return this.Filename;
  }
}

export default FileModel;
