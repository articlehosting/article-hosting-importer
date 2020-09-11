import fs from 'fs';
import { Readable } from 'stream';
import { Level } from './logger.service';
import Service from '../abstract/service';
import FileModel from '../models/file.model';

class FileSystemService extends Service {
  async writeToFile(filename: string, readStream: Readable): Promise<FileModel> {
    // todo: resolve folders ..
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filename);

      writeStream.on('error', (err) => {
        this.logger.log<Error>(Level.error, err.message, err);

        reject(err);
      });

      writeStream.on('close', () => {
        const file = new FileModel(this.logger, {
          filename,
        });

        this.logger.log<FileModel>(Level.debug, `${filename} download complete`, file);

        resolve(file);
      });

      readStream.pipe(writeStream);
    });
  }

  readFromFile(file: FileModel): Readable {
    // todo: file.filename to file.buildFullPath ..
    const readStream = fs.createReadStream(file.filename);

    readStream.on('error', (err) => {
      this.logger.log<Error>(Level.error, err.message, err);
    });

    return readStream;
  }
}

export default FileSystemService;
