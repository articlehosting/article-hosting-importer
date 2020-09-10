import LoggerService from './logger.service';

abstract class Service {
  protected logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }
}

export default Service;
