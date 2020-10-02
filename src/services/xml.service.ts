import { xml2json } from 'xml-js';
import DecodeService from './decode.service';
import FileSystemService from './fs.service';
import LoggerService from './logger.service';
import Service from '../abstract/service';
import FileModel from '../models/file.model';

class XmlService extends Service {
  private readonly fsService: FileSystemService;

  private readonly decodeService: DecodeService;

  constructor(logger: LoggerService) {
    super(logger);

    this.fsService = new FileSystemService(logger);
    this.decodeService = new DecodeService(logger);
  }

  public async parse<T>(file: FileModel): Promise<T> {
    const result = xml2json(await this.fsService.readFileContents(file));

    return this.decodeService.decodeJSON<T>(result);
  }
}

export default XmlService;
