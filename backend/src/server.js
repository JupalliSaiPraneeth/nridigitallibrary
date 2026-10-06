import app from './app.js';
import { config } from './config/index.js';
import { scanBookStorage } from './services/bookService.js';
import { logger } from './utils/logger.js';

// Initial Storage Scan
scanBookStorage();

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Digital Library API Server running on port ${config.port}`);
  logger.info(`Server Instance Identifier: ${config.serverId}`);
  logger.info(`Storage Root Path: ${config.bookStoragePath}`);
});
