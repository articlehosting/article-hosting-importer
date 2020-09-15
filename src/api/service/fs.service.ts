import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import unzip from 'unzipper';
import { Level } from './logger.service';
import Service from '../abstract/service';
import config from '../config';
import FileModel from '../models/file.model';

class FileSystemService extends Service {
  private decoupleFile(filePath: string): Array<string> {
    const segments = filePath.split(/[/\\]/g);

    segments.pop();

    return segments;
  }

  private async checkAccess(fileFullPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(fileFullPath, fs.constants.W_OK, (err) => resolve(!err));
    });
  }

  public async createFolder(folderPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.mkdir(folderPath, { recursive: true }, (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data ?? '');
      });
    });
  }

  public async writeToFile(fileFullPath: string, readStream: Readable): Promise<FileModel> {
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

        this.logger.log(Level.debug, `${file.filename} download complete`);

        resolve(file);
      });

      readStream.pipe(writeStream);
    });
  }

  public readFromFile(file: FileModel): Readable {
    const readStream = fs.createReadStream(file.fullPath, config.fs.readStreamOptions);

    readStream.on('error', (err) => {
      this.logger.log<Error>(Level.error, err.message, err);
    });

    return readStream;
  }

  public async unzip(file: FileModel, destination: string): Promise<void> {
    return new Promise((resolve) => {
      const readStream = this.readFromFile(file);

      readStream.pipe(unzip.Extract({ path: destination }));

      // readStream.on('close', () => resolve(file))

      readStream.on('close', resolve);
    });
  }
}

export default FileSystemService;
