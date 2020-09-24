import Processor from '../abstract/processor';
import DatabaseAdapter from '../adapters/db.adapter';
import S3Adapter from '../adapters/s3.adapter';
import config from '../config';
import { XML_EXT } from '../constants';
import ArticleModel, { Article } from '../models/article.model';
import FileModel from '../models/file.model';
import S3EventModel, { S3Event } from '../models/s3-event.model';
import SQSMessageModel from '../models/sqs-message.model';
import DecodeService from '../service/decode.service';
import ExtractService from '../service/extract.service';
import FileSystemService from '../service/fs.service';
import ImportService from '../service/import.service';
import LoggerService, { Level } from '../service/logger.service';
import SQSService from '../service/sqs.service';
import StencilaService from '../service/stencila.service';
import UtilService from '../service/util.service';

const { endpoint } = config.aws.s3;

class SQSEventProcessor extends Processor {
  private readonly sqsService: SQSService;

  private readonly dbAdapter: DatabaseAdapter;

  private readonly fsService: FileSystemService;

  private readonly utilService: UtilService;

  private readonly extractService: ExtractService;

  private readonly stencilaService: StencilaService;

  private readonly decodeService: DecodeService;

  private readonly importService: ImportService;

  private readonly importS3Adapter: S3Adapter;

  private Event?: S3EventModel;

  private Message?: SQSMessageModel<S3Event>;

  constructor(logger: LoggerService, sqsService: SQSService, dbAdapter: DatabaseAdapter) {
    super(logger);

    this.sqsService = sqsService;
    this.dbAdapter = dbAdapter;

    this.fsService = new FileSystemService(this.logger);
    this.utilService = new UtilService(this.logger);
    this.extractService = new ExtractService(this.logger);
    this.stencilaService = new StencilaService(this.logger);
    this.decodeService = new DecodeService(this.logger);
    this.importService = new ImportService(this.logger, this.sqsService, this.dbAdapter);

    this.importS3Adapter = new S3Adapter(this.logger, {
      endpoint,
    });
  }

  withEvent(event: S3EventModel): SQSEventProcessor {
    this.Event = event;

    return this;
  }

  withMessage(message: SQSMessageModel<S3Event>): SQSEventProcessor {
    this.Message = message;

    return this;
  }

  public async processEvent(): Promise<void> {
    if (!this.Event) {
      throw new Error('Invalid S3 event model');
    }

    const files = await this.processSourceFile(this.Event);

    const jsonFile = await this.stencilaService.convert(this.utilService.fetchFileByExtension(files, XML_EXT));

    const article = await this.decodeArticleFrom(jsonFile);

    const articleModel = new ArticleModel(this.logger, {
      article,
      files,
    });

    await this.importService.importArticle(articleModel);
  }

  private async processSourceFile({ objectKey, bucketName }: S3EventModel): Promise<Array<FileModel>> {
    if (!this.Message) {
      throw new Error('Invalid context message');
    }

    const sourceFileDestination = this.utilService.sourceFilePath(this.Message.messageId, objectKey);

    this.logger.log(Level.info, `article source file destination ${sourceFileDestination}`);

    const zipFile = await this.importS3Adapter.download({ objectKey, bucketName }, sourceFileDestination);

    const extractDest = this.utilService.workingFolder(this.Message.messageId);

    this.logger.log(Level.info, `extract zip source file from ${zipFile.fullPath} to ${extractDest}`);

    const extracted = await this.extractService.extractFiles(zipFile, extractDest);

    if (!extracted || !extracted.length) {
      throw new Error('Unable to extract zip content');
    }

    return extracted;
  }

  private async decodeArticleFrom(jsonFile: FileModel): Promise<Article> {
    const converted = await this.fsService.readFileContents(jsonFile);

    return this.decodeService.decodeJSON<Article>(converted);
  }
}

export default SQSEventProcessor;
