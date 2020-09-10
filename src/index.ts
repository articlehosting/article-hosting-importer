import api from './api';

void (async (): Promise<void> => {
  try {
    await api.process();

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
