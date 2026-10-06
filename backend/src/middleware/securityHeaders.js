import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/index.js';

export function configureSecurityMiddleware(app) {
  // Helmet HTTP Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Managed by NGINX or custom Policy
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS Configuration
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || config.frontendUrl === '*' || config.env === 'development') {
        return callback(null, true);
      }
      if (origin === config.frontendUrl || origin.startsWith(config.frontendUrl)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Access blocked for this origin'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Server-ID'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition', 'X-Server-ID'],
    credentials: true
  };

  app.use(cors(corsOptions));
}
