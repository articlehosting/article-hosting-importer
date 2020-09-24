import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import rimraf from 'rimraf';
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
      fs.access(fileFullPath, fs.constants.F_OK, (err) => resolve(!err));
    });
  }

  public async createFolder(folderPath: string): Promise<string> {
    // @todo: also check for permissions, not only if dir exists.
    this.logger.log(Level.debug, `create folder ${folderPath} recursively.`);
    const haveAccessAndExists = await this.checkAccess(folderPath);

    if (haveAccessAndExists) {
      return Promise.resolve(folderPath);
    }

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
    await this.createFolder(path.join(...this.decoupleFile(fileFullPath)));

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(fileFullPath, config.fs.writeStreamOptions);

      writeStream.on('error', reject);

      // @todo: fix that ... file still not accessible.
      readStream.on('error', (err) => {
        writeStream.emit('error', err);
      });

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

  public async readFileContents(file: FileModel): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(file.fullPath, 'utf-8', (err, content) => {
        if (err) {
          return reject(err);
        }

        return resolve(content);
      });
    });
  }

  public async getFolderFiles(folderPath: string): Promise<Array<FileModel>> {
    return new Promise((resolve, reject) => {
      fs.readdir(folderPath, { withFileTypes: true }, (err, dirents: Array<fs.Dirent>) => {
        if (err) {
          return reject(err);
        }

        const files: Array<FileModel> = [];

        for (const dirent of dirents) {
          if (dirent.isFile()) {
            const fullPath = path.normalize(path.join(folderPath, dirent.name));

            files.push(new FileModel(this.logger, { fullPath }));
          }
        }

        return resolve(files);
      });
    });
  }

  public async removeFolder(folderPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      rimraf(folderPath, (error) => (error ? reject(error) : resolve()));
    });
  }

  public async getFile(fullPath: string): Promise<FileModel> {
    const haveAccessAndExists = await this.checkAccess(fullPath);

    if (!haveAccessAndExists) {
      throw new Error(`Invalid path ${fullPath}. No permissions to file or file might not exists!`);
    }

    return new FileModel(this.logger, { fullPath });
  }
}

export default FileSystemService;
