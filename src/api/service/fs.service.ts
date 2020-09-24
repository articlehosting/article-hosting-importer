import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import extractzip from 'extract-zip';
import rimraf from 'rimraf';
import { Level } from './logger.service';
import Service from '../abstract/service';
import config from '../config';
import FileModel from '../models/file.model';

class FileSystemService extends Service {
  private readonly cwd = config.paths.tempFolder;

  public resolveWorkingPath(relativePath: string | FileModel): string {
    return path.join(
      this.cwd,
      relativePath instanceof FileModel
        ? relativePath.filePath
        : relativePath,
    );
  }

  private async checkAccess(fileFullPath: string): Promise<boolean> {
    return new Promise((resolve) => {
      // @todo: check error messages ...
      fs.access(fileFullPath, fs.constants.F_OK, (err) => resolve(!err));
    });
  }

  public async createFolders(foldersPath: string): Promise<string> {
    // @todo: also check for permissions, not only if dir exists.
    const haveAccessAndExists = await this.checkAccess(foldersPath);

    if (haveAccessAndExists) {
      return Promise.resolve(foldersPath);
    }

    return new Promise((resolve, reject) => {
      fs.mkdir(foldersPath, { recursive: true }, (err, data) => {
        if (err) {
          // ['EACCES', 'EPERM', 'EISDIR', 'ENOENT']
          if (err.code !== 'EEXIST') {
            reject(err);
          }
        }

        resolve(data ?? '');
      });
    });
  }

  public async writeToFile(filePath: string, readStream: Readable): Promise<FileModel> {
    const absoluteFilePath = this.resolveWorkingPath(filePath);

    await this.createFolders(path.dirname(absoluteFilePath));

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(absoluteFilePath, config.fs.writeStreamOptions);

      writeStream.on('error', reject);

      // @todo: fix that ... file still not accessible.
      readStream.on('error', (err) => {
        writeStream.emit('error', err);
      });

      writeStream.on('close', () => {
        const file = new FileModel(this.logger, {
          filePath,
        });

        this.logger.log(Level.debug, `${file.basename} download complete`);

        resolve(file);
      });

      readStream.pipe(writeStream);
    });
  }

  public readFromFile(file: FileModel): Readable {
    const readStream = fs.createReadStream(this.resolveWorkingPath(file.filePath), config.fs.readStreamOptions);

    readStream.on('error', (err) => {
      this.logger.log<Error>(Level.error, err.message, err);
    });

    return readStream;
  }

  public async readFileContents(file: FileModel): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.resolveWorkingPath(file.filePath), 'utf-8', (err, content) => {
        if (err) {
          return reject(err);
        }

        return resolve(content);
      });
    });
  }

  public async getFolderFiles(folderPath: string): Promise<Array<FileModel>> {
    return new Promise((resolve, reject) => {
      fs.readdir(this.resolveWorkingPath(folderPath), { withFileTypes: true }, (err, dirents: Array<fs.Dirent>) => {
        if (err) {
          return reject(err);
        }

        const files: Array<FileModel> = [];

        for (const dirent of dirents) {
          if (dirent.isFile()) {
            const filePath = path.join(folderPath, dirent.name);

            files.push(new FileModel(this.logger, { filePath }));
          }
        }

        return resolve(files);
      });
    });
  }

  public async removeFolder(folderPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      rimraf(this.resolveWorkingPath(folderPath), (error) => (error ? reject(error) : resolve()));
    });
  }

  public async getFile(filePath: string): Promise<FileModel> {
    const absoluteFilePath = this.resolveWorkingPath(filePath);
    const haveAccessAndExists = await this.checkAccess(absoluteFilePath);

    if (!haveAccessAndExists) {
      throw new Error(`Invalid path ${filePath}. No permissions to file or file might not exists!`);
    }

    return new FileModel(this.logger, { filePath });
  }

  public async extract(zipfile: FileModel, destination: string): Promise<void> {
    const absoluteFilePath = this.resolveWorkingPath(zipfile.filePath);
    const absoluteDestPath = this.resolveWorkingPath(destination);

    return extractzip(absoluteFilePath, { dir: absoluteDestPath });
  }
}

export default FileSystemService;
