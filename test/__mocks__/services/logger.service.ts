import LoggerService from '../../../src/services/logger.service';

class LoggerServiceMock extends LoggerService {
  log(): void {
    console.log('was called')
    jest.fn();
  }
}

export const loggerMock = new LoggerServiceMock();

export default LoggerServiceMock;
