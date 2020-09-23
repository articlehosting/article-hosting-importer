import ApiArticleHostingImporter from './api';
import config from './api/config';
import LoggerService, { Level } from './api/service/logger.service';

void (async (): Promise<void> => {
  console.log(JSON.stringify(config, undefined, 2), 'config');

  let code = 0;
  const logger = new LoggerService();

  try {
    const api = new ApiArticleHostingImporter(logger);

    await api.process();
  } catch (err) {
    logger.log(Level.error, err.message, err);

    code = 1;
  }

  process.exit(code);
})();
