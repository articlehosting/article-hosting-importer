import LoggerService from '../service/logger.service';

abstract class Adapter {
  protected logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }
}

export default Adapter;
