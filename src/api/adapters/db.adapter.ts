import { Collection, Db, MongoClient } from 'mongodb';
import Adapter from '../abstract/adapter';
import config from '../config';
import LoggerService from '../service/logger.service';

// todo: implement logging for all queries..
class DatabaseAdapter extends Adapter {
  private readonly DbName: string;

  private Connection?: MongoClient;

  private Db?: Db;

  constructor(logger: LoggerService) {
    super(logger);

    const dbName: string | undefined = config.db.mongoUrl.split('/')[3];

    if (!dbName) {
      throw new Error(`Missing or invalid db name ${dbName}`);
    }

    this.DbName = dbName;
  }

  public async close(): Promise<void> {
    if (this.Connection) {
      await this.Connection.close();

      this.Connection = undefined;
    }
  }

  private async connect(): Promise<MongoClient> {
    this.Connection = await MongoClient.connect(config.db.mongoUrl, config.db.options);

    return this.Connection;
  }

  private async connectToDb(): Promise<Db> {
    if (!this.Db) {
      const db = (this.Connection ?? await this.connect()).db(this.DbName);

      this.Db = db;
    }

    return this.Db;
  }

  public async collection(name: string): Promise<Collection> {
    return (this.Db ?? await this.connectToDb()).collection(name);
  }
}

export default DatabaseAdapter;
