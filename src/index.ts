import ApiArticleHostingImporter from './api';
import config from './api/config';
import LoggerService, { Level } from './api/service/logger.service';

void (async (): Promise<void> => {
  let code = 0;
  const logger = new LoggerService();

  console.log(JSON.stringify(config.paths, undefined, 2));

  try {
    logger.log(Level.warn, `Service starts in ${process.env.NODE_ENV} mode.`);
    const api = new ApiArticleHostingImporter(logger);

    await api.process();
  } catch (err) {
    logger.log(Level.error, err.message, err);

    code = 1;
  }

  process.exit(code);
})();
