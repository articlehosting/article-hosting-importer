import ArticleImporterProcessor from './processors/article-importer.processor';
import LoggerService, { Level } from './services/logger.service';

void (async (): Promise<void> => {
  let code = 0;
  const logger = new LoggerService();

  try {
    logger.log(Level.warn, `Service starts in ${process.env.NODE_ENV} mode.`);
    const api = new ArticleImporterProcessor(logger);

    await api.process();
  } catch (err) {
    logger.log(Level.error, err.message, err);

    code = 1;
  }

  process.exit(code);
})();
