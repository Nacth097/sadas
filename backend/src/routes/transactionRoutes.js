import { Router } from 'express';
import { createTransactionController } from '../controllers/transactionController.js';

export const transactionRoutes = (deps) => {
  const router = Router();
  const controller = createTransactionController(deps);

  router.post('/transactions', controller.createOrder);
  router.get('/transactions/:invoiceNumber', controller.getStatus);
  router.post('/webhooks/tripay', controller.tripayCallback);

  return router;
};
