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

  public async convert(xmlFile: FileModel): Promise<FileModel> {
    const xmlFilePath = xmlFile.fullPath;
    const jsonFilePath = xmlFile.fullPath.replace('xml', 'json');
    const cmd = [
      'encoda',
      'convert',
      xmlFilePath,
      jsonFilePath,
      '--from', 'jats',
    ];

    return new Promise((resolve, reject) => {
      exec(cmd.join(' '), (err) => {
        if (err) {
          return reject(err);
        }

        const jsonFile = new FileModel(this.logger, {
          fullPath: jsonFilePath,
        });

        return resolve(jsonFile);
      });
    });
  }
}

export default StencilaService;
