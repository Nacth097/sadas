import { Router } from 'express';
import { createCatalogController } from '../controllers/catalogController.js';

export const catalogRoutes = (deps) => {
  const router = Router();
  const controller = createCatalogController(deps);

  router.get('/categories', controller.listCategories);
  router.get('/categories/:slug/products', controller.listProducts);
  router.get('/payment-channels', controller.listPaymentChannels);
  router.post('/admin/sync-products', controller.syncProducts);

  return router;
};
