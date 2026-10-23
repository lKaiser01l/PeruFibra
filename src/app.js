import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'node:crypto';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/errors.js';
import chatRoutes from './routes/chat.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  const logger = pino({
    level: config.env === 'test' ? 'silent' : 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });
  app.use(
    pinoHttp({
      logger,
      genReqId: (_req, res) => {
        const id = crypto.randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    })
  );

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('CORS_NOT_ALLOWED'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', chatRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
