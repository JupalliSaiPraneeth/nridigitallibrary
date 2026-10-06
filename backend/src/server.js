import app from './app.js';
import { config } from './config/index.js';
import { scanBookStorage, getActiveStorageRoot } from './services/bookService.js';
import { logger } from './utils/logger.js';

// Initial Storage Scan
scanBookStorage();

function startServer(portToUse) {
  const server = app.listen(portToUse, '0.0.0.0', () => {
    logger.info(`Digital Library API Server running on port ${portToUse}`);
    logger.info(`Server Instance Identifier: ${config.serverId}`);
    logger.info(`Storage Root Path: ${getActiveStorageRoot()}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && portToUse < 5010) {
      const nextPort = portToUse + 1;
      logger.warn(`Port ${portToUse} is occupied. Trying next port ${nextPort}...`);
      startServer(nextPort);
    } else {
      logger.error(`Failed to start server on port ${portToUse}:`, err);
    }
  });
}

startServer(config.port);

