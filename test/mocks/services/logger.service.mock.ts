import LoggerService from '../../../src/services/logger.service';

class LoggerServiceMock extends LoggerService {
  log(): void {
    jest.fn();
  }
}

export const loggerMock = new LoggerServiceMock();

export default LoggerServiceMock;
