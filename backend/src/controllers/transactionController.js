import { z } from 'zod';
import { asyncHandler, AppError } from '../utils/errors.js';

const createOrderSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  user_id_game: z.string().min(3).max(120),
  zone_id: z.string().max(80).optional().nullable(),
  payment_method: z.string().min(2).max(80).optional().default('DIGIFLAZZ_DIRECT'),
  customer: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(30).optional()
    })
    .optional()
});

export const createTransactionController = ({ transactionWorkflow, transactionRepository, tripayService }) => ({
  createOrder: asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const result = await transactionWorkflow.createOrder(input);
    res.status(201).json({ success: true, data: result });
  }),

  getStatus: asyncHandler(async (req, res) => {
    const transaction = await transactionRepository.findByInvoice(req.params.invoiceNumber);
    if (!transaction) throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    res.json({ success: true, data: transaction });
  }),

  tripayCallback: asyncHandler(async (req, res) => {
    const signature = req.get('X-Callback-Signature') || req.get('x-callback-signature');
    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    if (!tripayService.verifyCallback(rawBody, signature)) {
      throw new AppError('Invalid callback signature', 401, 'INVALID_SIGNATURE');
    }

    const transaction = await transactionWorkflow.handlePaidCallback(req.body);
    res.json({ success: true, data: transaction });
  })
});
