import express from 'express';
import morgan from 'morgan';
import { configureSecurityMiddleware } from './middleware/securityHeaders.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/healthRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';

const app = express();

// HTTP Request Logger
app.use(morgan('combined'));

// Security & CORS
configureSecurityMiddleware(app);

// JSON Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General Rate Limiter
app.use('/api', generalLimiter);

// Route Registration
app.use('/api', healthRoutes);
app.use('/api', bookRoutes);

// Root Fallback / Status
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Digital Library College API',
    serverId: config.serverId,
    status: 'online',
    documentation: '/api/health'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Requested API endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default app;
