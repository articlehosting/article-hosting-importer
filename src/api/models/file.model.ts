import path from 'path';
import Model from '../abstract/model';
import LoggerService from '../service/logger.service';

export interface FileData {
  filePath: string,
}

class FileModel extends Model {
  private readonly FilePath: string;

  private readonly Dirname: string;

  private readonly FolderName: string;

  private readonly Basename: string;

  private readonly Name: string;

  private readonly Extension: string;

  constructor(logger: LoggerService, data: FileData) {
    super(logger);

    this.FilePath = data.filePath;

    this.Dirname = path.dirname(this.FilePath);

    this.FolderName = path.basename(this.Dirname);

    this.Basename = path.basename(this.FilePath);

    const [name, extension] = this.Basename.split('.');

    if (!name || !extension) {
      throw new Error(`Unable to parse basename ${this.Basename}`);
    }

    this.Name = name;
    this.Extension = extension;
  }

  get filePath(): string {
    return this.FilePath;
  }

  get dirname(): string {
    return this.Dirname;
  }

  get folderName(): string {
    return this.FolderName;
  }

  get basename(): string {
    return this.Basename;
  }

  get name(): string {
    return this.Name;
  }

  get extension(): string {
    return this.Extension;
  }
}

export default FileModel;
