import { exec } from 'child_process';
import FileSystemService from './fs.service';
import LoggerService from './logger.service';
import Service from '../abstract/service';
import FileModel from '../models/file.model';

class StencilaService extends Service {
  private fsService: FileSystemService;

  constructor(logger: LoggerService) {
    super(logger);

    this.fsService = new FileSystemService(this.logger);
  }

  public async convert(xmlFile: FileModel, from?: string, to?: string): Promise<FileModel> {
    const xmlFilePath = xmlFile.filePath;
    const jsonFilePath = xmlFile.filePath.replace('xml', 'json');

    const cmd = [
      'encoda',
      'convert',
      this.fsService.resolveWorkingPath(xmlFilePath),
      this.fsService.resolveWorkingPath(jsonFilePath),
    ];

    if (from) {
      cmd.push('--from', from);
    }

    if (to) {
      cmd.push('--to', to);
    }

    return new Promise((resolve, reject) => {
      exec(cmd.join(' '), (err) => {
        if (err) {
          return reject(err);
        }

        const jsonFile = new FileModel(this.logger, {
          filePath: jsonFilePath,
        });

        return resolve(jsonFile);
      });
    });
  }
}

export default StencilaService;
