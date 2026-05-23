import app from './app.js';
import { env } from './config/envConfig.js';
import { initDB } from './db/dbConfig.js';

const main = async (): Promise<void> => {
  try {
    await initDB();
    console.log('Database connected successfully.');

    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

main();

