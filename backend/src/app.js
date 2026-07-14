import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { pool } from './db/mysql.js';
import { CatalogRepository } from './repositories/catalogRepository.js';
import { TransactionRepository } from './repositories/transactionRepository.js';
import { DigiflazzService } from './services/digiflazzService.js';
import { TripayService } from './services/tripayService.js';
import { AdminAlertService } from './services/adminAlertService.js';
import { TransactionWorkflow } from './services/transactionWorkflow.js';
import { catalogRoutes } from './routes/catalogRoutes.js';
import { transactionRoutes } from './routes/transactionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const createDependencies = () => {
  const catalogRepository = new CatalogRepository(pool);
  const transactionRepository = new TransactionRepository(pool);
  const tripayService = new TripayService();
  const digiflazzService = new DigiflazzService();
  const adminAlertService = new AdminAlertService();
  const transactionWorkflow = new TransactionWorkflow({
    catalogRepository,
    transactionRepository,
    tripayService,
    digiflazzService,
    adminAlertService
  });

  return {
    catalogRepository,
    transactionRepository,
    tripayService,
    digiflazzService,
    adminAlertService,
    transactionWorkflow
  };
};

export const createApp = (deps = createDependencies()) => {
  const app = express();
  const allowedOrigins = env.frontendOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));
  app.use(rateLimit({ windowMs: 60_000, max: 180 }));
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buffer) => {
        req.rawBody = buffer.toString('utf8');
      }
    })
  );

  app.get('/health', (_req, res) => res.json({ success: true, service: 'nacth-topup-api' }));
  app.use('/api', catalogRoutes(deps));
  app.use('/api', transactionRoutes(deps));
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
