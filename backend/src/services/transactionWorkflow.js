import { createInvoiceNumber, createVendorRef } from '../utils/invoice.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

const requiresZoneId = (categorySlug) => ['mobile-legends'].includes(String(categorySlug || '').toLowerCase());

export class TransactionWorkflow {
  constructor({ catalogRepository, transactionRepository, tripayService, digiflazzService, adminAlertService }) {
    this.catalogRepository = catalogRepository;
    this.transactionRepository = transactionRepository;
    this.tripayService = tripayService;
    this.digiflazzService = digiflazzService;
    this.adminAlertService = adminAlertService;
  }

  async createOrder(input) {
    const product = await this.catalogRepository.findProductById(input.product_id);
    if (!product) throw new AppError('Product is unavailable', 404, 'PRODUCT_UNAVAILABLE');
    if (requiresZoneId(product.category_slug) && !input.zone_id) {
      throw new AppError('Server ID is required for this game', 400, 'ZONE_ID_REQUIRED');
    }

    const transaction = await this.transactionRepository.createPendingTransaction({
      invoice_number: createInvoiceNumber(),
      user_id: input.user_id,
      zone_id: input.zone_id,
      user_id_game: input.user_id_game,
      product_name: product.name,
      sku_code: product.sku_code,
      price: product.seller_price,
      payment_method: env.paymentGatewayEnabled ? input.payment_method : 'DIGIFLAZZ_DIRECT'
    });

    if (!env.paymentGatewayEnabled) {
      const paid = await this.transactionRepository.markPaid(transaction.invoice_number);
      const processed = await this.executeDigiflazzOrder(paid);
      return {
        transaction: processed,
        payment: {
          reference: null,
          checkout_url: null,
          mode: 'digiflazz_direct',
          message: 'Payment gateway sementara nonaktif. Order langsung dikirim ke Digiflazz.'
        }
      };
    }

    const payment = await this.tripayService.createClosedInvoice(transaction, input.customer);
    const reference = payment.reference || payment.reference_id || payment.ref || null;
    const updated = reference
      ? await this.transactionRepository.attachPaymentReference(transaction.id, reference)
      : transaction;

    return { transaction: updated, payment };
  }

  async executeDigiflazzOrder(transaction) {
    const digiflazzRefId = createVendorRef(transaction.id);
    const lockAcquired = await this.transactionRepository.acquireOrderLock(transaction.id, digiflazzRefId);
    if (!lockAcquired) {
      return this.transactionRepository.findById(transaction.id);
    }

    transaction = await this.transactionRepository.findById(transaction.id);
    const customerNo = transaction.zone_id
      ? `${transaction.user_id_game}${transaction.zone_id}`
      : transaction.user_id_game;
    const result = await this.digiflazzService.orderPrepaid({
      skuCode: transaction.sku_code,
      customerNo,
      refId: transaction.digiflazz_ref_id
    });

    if (result.status === 'success' || result.status === 'pending') {
      return this.transactionRepository.markTopupSuccess(transaction.id, result.serialNumber);
    }

    const reason = result.message || 'Digiflazz order failed';
    const failed = await this.transactionRepository.markTopupFailed(transaction.id, reason);
    await this.adminAlertService.notifyRefundRequired(failed, reason);
    return failed;
  }

  async handlePaidCallback(payload) {
    const invoiceNumber = payload.merchant_ref || payload.invoice_number;
    if (!invoiceNumber) throw new AppError('Missing merchant_ref', 400, 'INVALID_CALLBACK');

    let transaction = await this.transactionRepository.findByInvoice(invoiceNumber);
    if (!transaction) throw new AppError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    await this.transactionRepository.logPaymentCallback(transaction.id, payload);

    const callbackStatus = String(payload.status || '').toUpperCase();
    if (callbackStatus === 'EXPIRED' && this.transactionRepository.markExpired) {
      return this.transactionRepository.markExpired(invoiceNumber);
    }

    if (callbackStatus !== 'PAID') {
      return transaction;
    }

    transaction = await this.transactionRepository.markPaid(invoiceNumber);

    return this.executeDigiflazzOrder(transaction);
  }
}
