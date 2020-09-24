import ApiArticleHostingImporter from './api';
import config from './api/config';
import LoggerService, { Level } from './api/service/logger.service';

void (async (): Promise<void> => {
  let code = 0;
  const logger = new LoggerService();

  logger.log(Level.info, JSON.stringify(config.paths, undefined, 2));

  try {
    logger.log(Level.warn, `Service starts in ${process.env.NODE_ENV} mode.`);
    const api = new ApiArticleHostingImporter(logger);

    await api.process();
  } catch (err) {
    logger.log(Level.error, err.message, err);

    code = 1;
  }

  // @todo: remove that when solve deploy issue.
  await new Promise((resolve) => setTimeout(resolve, (2 * 60) * 1000));

  process.exit(code);
})();
