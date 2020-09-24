import ApiArticleHostingImporter from './api';
import LoggerService, { Level } from './api/service/logger.service';

void (async (): Promise<void> => {
  let code = 0;
  const logger = new LoggerService();

  try {
    logger.log(Level.warn, `Service starts in ${process.env.NODE_ENV} mode.`);
    const api = new ApiArticleHostingImporter(logger);

    await api.process();
  } catch (err) {
    logger.log(Level.error, err.message, err);

    code = 1;
  }

  // wait 4 mins before exit
  await new Promise((resolve) => setTimeout(resolve, (4 * 60) * 1000));

  process.exit(code);
})();
