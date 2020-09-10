import LoggerService from '../api/service/logger.service';

abstract class Model {
  protected logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }
}

export default Model;
