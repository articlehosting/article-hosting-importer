import path from 'path';
import Service from '../abstract/service';
import FileModel from '../models/file.model';

class UtilService extends Service {
  public sourceFilePath(messageId: string, objectKey: string): string {
    return path.join(messageId, path.basename(objectKey));
  }

  public fetchFileByExtension(files: Array<FileModel>, extension: string): FileModel {
    const file = files.find((f) => f.extension === extension);

    if (!file) {
      throw new Error(`Unable to find file with extension ${extension}`);
    }

    return file;
  }
}

export default UtilService;
