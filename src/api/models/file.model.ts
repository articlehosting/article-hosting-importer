import path from 'path';
import Model from '../abstract/model';
import LoggerService from '../service/logger.service';

export interface FileData {
  fullPath: string,
}

class FileModel extends Model {
  private readonly FullPath: string;

  private readonly Name: string;

  private readonly Filename: string;

  private readonly Extension: string;

  private readonly FolderPath: string;

  constructor(logger: LoggerService, data: FileData) {
    super(logger);

    this.FullPath = data.fullPath;

    const segments = this.FullPath.split(/[/\\]/g);

    if (!segments ?? segments.length) {
      throw new Error(`Invalid file path ${this.FullPath}`);
    }

    const filename = segments[segments.length - 1];

    segments.pop();

    this.FolderPath = path.join(...segments);

    this.Filename = filename;

    const [name, extension] = filename.split('.');

    if (!name || !extension) {
      throw new Error(`Unable to parse file path ${filename}`);
    }

    this.Name = name;
    this.Extension = extension;
  }

  get name(): string {
    return this.Name;
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

  get folderPath(): string {
    return this.FolderPath;
  }
}

export default FileModel;
