import request from 'supertest';
import { jest } from '@jest/globals';
import { createApp } from '../src/app.js';
import { TransactionWorkflow } from '../src/services/transactionWorkflow.js';
import { TripayService } from '../src/services/tripayService.js';

class FakeCatalogRepository {
  constructor() {
    this.product = {
      id: 1,
      sku_code: 'ML10',
      name: 'Mobile Legends 10 Diamonds',
      seller_price: 15000
    };
  }

  async listCategories() {
    return [{ id: 1, name: 'Mobile Legends', slug: 'mobile-legends', image_url: null }];
  }

  async listActiveProductsByCategorySlug() {
    return [this.product];
  }

  async findProductById(id) {
    return Number(id) === this.product.id ? this.product : null;
  }
}

class FakeTransactionRepository {
  constructor() {
    this.nextId = 1;
    this.transactions = new Map();
    this.logs = [];
  }

  async createPendingTransaction(data) {
    const transaction = {
      id: this.nextId++,
      reference_id: null,
      payment_status: 'unpaid',
      topup_status: 'pending',
      digiflazz_ref_id: null,
      digiflazz_sn: null,
      failure_reason: null,
      ...data
    };
    this.transactions.set(transaction.id, transaction);
    return { ...transaction };
  }

  async attachPaymentReference(transactionId, referenceId) {
    const transaction = this.transactions.get(transactionId);
    transaction.reference_id = referenceId;
    return { ...transaction };
  }

  async findById(id) {
    const transaction = this.transactions.get(Number(id));
    return transaction ? { ...transaction } : null;
  }

  async findByInvoice(invoiceNumber) {
    const transaction = [...this.transactions.values()].find((item) => item.invoice_number === invoiceNumber);
    return transaction ? { ...transaction } : null;
  }

  async logPaymentCallback(transactionId, payload) {
    this.logs.push({ transactionId, payload });
  }

  async markPaid(invoiceNumber) {
    const transaction = [...this.transactions.values()].find((item) => item.invoice_number === invoiceNumber);
    if (!transaction) return null;
    if (transaction.payment_status === 'unpaid') transaction.payment_status = 'paid';
    return { ...transaction };
  }

  async markExpired(invoiceNumber) {
    const transaction = [...this.transactions.values()].find((item) => item.invoice_number === invoiceNumber);
    if (!transaction) return null;
    if (transaction.payment_status === 'unpaid') transaction.payment_status = 'expired';
    return { ...transaction };
  }

  async acquireOrderLock(transactionId, digiflazzRefId) {
    const transaction = this.transactions.get(transactionId);
    if (
      transaction &&
      transaction.payment_status === 'paid' &&
      transaction.topup_status === 'pending'
    ) {
      transaction.topup_status = 'processing';
      transaction.digiflazz_ref_id = digiflazzRefId;
      return true;
    }
    return false;
  }

  async markTopupSuccess(transactionId, serialNumber) {
    const transaction = this.transactions.get(transactionId);
    transaction.topup_status = 'success';
    transaction.digiflazz_sn = serialNumber || null;
    transaction.failure_reason = null;
    return { ...transaction };
  }

  async markTopupFailed(transactionId, reason) {
    const transaction = this.transactions.get(transactionId);
    transaction.topup_status = 'failed';
    transaction.failure_reason = reason;
    return { ...transaction };
  }
}

const makeDeps = ({ digiflazzResult } = {}) => {
  const catalogRepository = new FakeCatalogRepository();
  const transactionRepository = new FakeTransactionRepository();
  const tripayService = new TripayService(
    {
      privateKey: 'test-private-key',
      apiKey: 'test-api-key',
      merchantCode: 'TST',
      baseUrl: 'https://tripay.test'
    },
    {
      post: jest.fn(async () => ({
        data: { data: { reference: 'TRIPAY-REF-1', checkout_url: 'https://pay.test/1' } }
      })),
      get: jest.fn(async () => ({ data: { data: [] } }))
    }
  );
  const digiflazzService = {
    syncProducts: jest.fn(async () => ({ synced: 0 })),
    orderPrepaid: jest.fn(async () => digiflazzResult || {
      status: 'success',
      serialNumber: 'SN123456789'
    })
  };
  const adminAlertService = {
    notifyRefundRequired: jest.fn(async () => undefined)
  };
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

const signedCallback = (tripayService, payload) => {
  const raw = JSON.stringify(payload);
  return {
    raw,
    signature: tripayService.callbackSignature(raw)
  };
};

describe('TriPay webhook workflow', () => {
  test('valid PAID callback marks payment paid and triggers one Digiflazz order', async () => {
    const deps = makeDeps();
    const app = createApp(deps);

    const orderResponse = await request(app)
      .post('/api/transactions')
      .send({
        product_id: 1,
        user_id_game: '12345678',
        zone_id: '1234',
        payment_method: 'QRIS',
        customer: { email: 'buyer@example.com' }
      })
      .expect(201);

    const invoice = orderResponse.body.data.transaction.invoice_number;
    const payload = { merchant_ref: invoice, status: 'PAID' };
    const { raw, signature } = signedCallback(deps.tripayService, payload);

    const callbackResponse = await request(app)
      .post('/api/webhooks/tripay')
      .set('Content-Type', 'application/json')
      .set('X-Callback-Signature', signature)
      .send(raw)
      .expect(200);

    expect(callbackResponse.body.data.payment_status).toBe('paid');
    expect(callbackResponse.body.data.topup_status).toBe('success');
    expect(callbackResponse.body.data.digiflazz_sn).toBe('SN123456789');
    expect(deps.digiflazzService.orderPrepaid).toHaveBeenCalledTimes(1);
    expect(deps.digiflazzService.orderPrepaid).toHaveBeenCalledWith(
      expect.objectContaining({ skuCode: 'ML10', customerNo: '123456781234' })
    );
  });

  test('duplicate PAID callbacks cannot create duplicate Digiflazz orders', async () => {
    const deps = makeDeps();
    const app = createApp(deps);

    const orderResponse = await request(app)
      .post('/api/transactions')
      .send({ product_id: 1, user_id_game: '999888777', payment_method: 'QRIS' })
      .expect(201);

    const invoice = orderResponse.body.data.transaction.invoice_number;
    const payload = { merchant_ref: invoice, status: 'PAID' };
    const { raw, signature } = signedCallback(deps.tripayService, payload);

    await Promise.all([
      request(app).post('/api/webhooks/tripay').set('Content-Type', 'application/json').set('X-Callback-Signature', signature).send(raw),
      request(app).post('/api/webhooks/tripay').set('Content-Type', 'application/json').set('X-Callback-Signature', signature).send(raw)
    ]);

    const stored = await deps.transactionRepository.findByInvoice(invoice);
    expect(stored.payment_status).toBe('paid');
    expect(stored.topup_status).toBe('success');
    expect(deps.digiflazzService.orderPrepaid).toHaveBeenCalledTimes(1);
  });

  test('Digiflazz failure marks topup failed and alerts admin for manual refund', async () => {
    const deps = makeDeps({
      digiflazzResult: { status: 'failed', message: 'OUT_OF_STOCK' }
    });
    const app = createApp(deps);

    const orderResponse = await request(app)
      .post('/api/transactions')
      .send({ product_id: 1, user_id_game: '444555666', payment_method: 'BRIVA' })
      .expect(201);

    const invoice = orderResponse.body.data.transaction.invoice_number;
    const payload = { merchant_ref: invoice, status: 'PAID' };
    const { raw, signature } = signedCallback(deps.tripayService, payload);

    const callbackResponse = await request(app)
      .post('/api/webhooks/tripay')
      .set('Content-Type', 'application/json')
      .set('X-Callback-Signature', signature)
      .send(raw)
      .expect(200);

    expect(callbackResponse.body.data.topup_status).toBe('failed');
    expect(callbackResponse.body.data.failure_reason).toBe('OUT_OF_STOCK');
    expect(deps.adminAlertService.notifyRefundRequired).toHaveBeenCalledTimes(1);
  });

  test('invalid TriPay signature is rejected before workflow execution', async () => {
    const deps = makeDeps();
    const app = createApp(deps);

    await request(app)
      .post('/api/webhooks/tripay')
      .set('Content-Type', 'application/json')
      .set('X-Callback-Signature', 'bad-signature')
      .send(JSON.stringify({ merchant_ref: 'NTH-FAKE', status: 'PAID' }))
      .expect(401);

    expect(deps.digiflazzService.orderPrepaid).not.toHaveBeenCalled();
  });

  test('non-PAID callback does not mark payment paid or trigger Digiflazz', async () => {
    const deps = makeDeps();
    const app = createApp(deps);

    const orderResponse = await request(app)
      .post('/api/transactions')
      .send({ product_id: 1, user_id_game: '111222333', payment_method: 'QRIS' })
      .expect(201);

    const invoice = orderResponse.body.data.transaction.invoice_number;
    const payload = { merchant_ref: invoice, status: 'EXPIRED' };
    const { raw, signature } = signedCallback(deps.tripayService, payload);

    const callbackResponse = await request(app)
      .post('/api/webhooks/tripay')
      .set('Content-Type', 'application/json')
      .set('X-Callback-Signature', signature)
      .send(raw)
      .expect(200);

    expect(callbackResponse.body.data.payment_status).toBe('expired');
    expect(callbackResponse.body.data.topup_status).toBe('pending');
    expect(deps.digiflazzService.orderPrepaid).not.toHaveBeenCalled();
  });
});
