import winston, { Logger } from 'winston';
import config from '../config';

export enum Level {
  error = 'error',
  warn = 'warn',
  info = 'info',
  http = 'http',
  verbose = 'verbose',
  debug = 'debug',
  silly = 'silly',
}

class LoggerService {
  private winston: Logger;

  constructor() {
    // todo: creates more acceptable logger.
    this.winston = winston.createLogger({
      level: config.logger.level ?? 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'user-services' },
      transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'debug.log', level: 'debug' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });

    // if (process.env.NODE_ENV !== 'production') {
    this.winston.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
    // }
  }

  public log<T>(level: Level, message: string, data?: T): void {
    this.winston[level](message, data);
  }
}

export default LoggerService;
