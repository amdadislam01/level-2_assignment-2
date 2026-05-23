import app from '../src/app.js';
import { initDB } from '../src/db/dbConfig.js';

// Initialize the database tables/migrations on startup
initDB();

export default app;
