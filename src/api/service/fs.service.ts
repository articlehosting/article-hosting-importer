import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { Level } from './logger.service';
import Service from '../abstract/service';
import config from '../config';
import FileModel from '../models/file.model';

class FileSystemService extends Service {
  private decoupleFile(filePath: string): Array<string> {
    const segments = filePath.split(/[/\\]/g);

    segments.pop();

    // const lastSegment = segments[segments.length - 1];
    return segments;
  }

  private async checkAccess(fileFullPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(fileFullPath, fs.constants.W_OK, (err) => resolve(!err));
    });
  }

  private async createFolder(folderPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.mkdir(folderPath, { recursive: config.fs.createFoldersRecursivelyFlag }, (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data ?? '');
      });
    });
  }

  async writeToFile(fileFullPath: string, readStream: Readable): Promise<FileModel> {
    if (!await this.checkAccess(fileFullPath)) {
      await this.createFolder(path.join(...this.decoupleFile(fileFullPath)));
    }

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(fileFullPath, config.fs.writeStreamOptions);

      writeStream.on('error', reject);

      writeStream.on('close', () => {
        const file = new FileModel(this.logger, {
          fullPath: fileFullPath,
        });

        this.logger.log<FileModel>(Level.debug, `${file.basename} download complete`, file);

        resolve(file);
      });

      readStream.pipe(writeStream);
    });
  }

  readFromFile(file: FileModel): Readable {
    // todo: file.filename to file.buildFullPath ..
    const readStream = fs.createReadStream(file.filename, config.fs.readStreamOptions);

    readStream.on('error', (err) => {
      this.logger.log<Error>(Level.error, err.message, err);
    });

    return readStream;
  }
}

export default FileSystemService;
