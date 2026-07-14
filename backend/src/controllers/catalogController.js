import { asyncHandler } from '../utils/errors.js';

export const createCatalogController = ({ catalogRepository, tripayService, digiflazzService }) => ({
  listCategories: asyncHandler(async (_req, res) => {
    const categories = await catalogRepository.listCategories();
    res.json({ success: true, data: categories });
  }),

  listProducts: asyncHandler(async (req, res) => {
    const products = await catalogRepository.listActiveProductsByCategorySlug(req.params.slug);
    res.json({ success: true, data: products });
  }),

  listPaymentChannels: asyncHandler(async (_req, res) => {
    const channels = await tripayService.listPaymentChannels();
    res.json({ success: true, data: channels });
  }),

  syncProducts: asyncHandler(async (_req, res) => {
    const result = await digiflazzService.syncProducts(catalogRepository);
    res.json({ success: true, data: result });
  })
});
