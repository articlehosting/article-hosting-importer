import path from 'path';
import Service from '../abstract/service';
import config from '../config';
import FileModel from '../models/file.model';

interface ArticleObjectKeyDetails {
  filename: string,
  file: string,
}

class UtilService extends Service {
  public workingFolder(messageId: string): string {
    return path.join(config.paths.tempFolder, messageId);
  }

  public parseObjectKey(objectKey: string): ArticleObjectKeyDetails {
    const segments = objectKey.split('/');

    const file = segments[segments.length - 1];

    const [filename] = file.split('.');

    return {
      file,
      filename,
    };
  }

  public fetchFileByExtension(files: Array<FileModel>, extension: string): FileModel {
    const file = files.find((f) => f.extension === extension);

    if (!file) {
      throw new Error(`Unable to find file with extension ${extension}`);
    }

    return file;
  }

  public sourceFilePath(messageId: string, objectKey: string): string {
    const { filename, file } = this.parseObjectKey(objectKey);

    // @todo: should identify source xml file
    return path.join(this.workingFolder(messageId), filename, file);
  }
}

export default UtilService;
