import xml2js, { parseStringPromise } from 'xml2js';
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
    const fileContents = await this.fsService.readFileContents(file);

    return <T><unknown>(await parseStringPromise(fileContents));
  }

  public createXml<T>(json: T): string {
    const builder = new xml2js.Builder();

    return builder.buildObject(json);
  }
}

export default XmlService;
