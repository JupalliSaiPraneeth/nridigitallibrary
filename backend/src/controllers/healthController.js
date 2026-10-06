import { config } from '../config/index.js';

export function getHealthStatus(req, res) {
  res.status(200).json({
    status: 'healthy',
    server: config.serverId,
    timestamp: new Date().toISOString()
  });
}
