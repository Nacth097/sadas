export class TransactionRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createPendingTransaction(data) {
    const [result] = await this.pool.query(
      `INSERT INTO transactions
        (invoice_number, user_id, zone_id, user_id_game, product_name, sku_code, price, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.invoice_number,
        data.user_id || null,
        data.zone_id || null,
        data.user_id_game,
        data.product_name,
        data.sku_code,
        data.price,
        data.payment_method
      ]
    );
    return this.findById(result.insertId);
  }

  async attachPaymentReference(transactionId, referenceId) {
    await this.pool.query(
      'UPDATE transactions SET reference_id = ? WHERE id = ?',
      [referenceId, transactionId]
    );
    return this.findById(transactionId);
  }

  async findById(id) {
    const [rows] = await this.pool.query('SELECT * FROM transactions WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async findByInvoice(invoiceNumber) {
    const [rows] = await this.pool.query(
      'SELECT * FROM transactions WHERE invoice_number = ? LIMIT 1',
      [invoiceNumber]
    );
    return rows[0] || null;
  }

  async logPaymentCallback(transactionId, payload) {
    await this.pool.query(
      'INSERT INTO payment_logs (transaction_id, raw_callback_data) VALUES (?, CAST(? AS JSON))',
      [transactionId, JSON.stringify(payload)]
    );
  }

  async markPaid(invoiceNumber) {
    await this.pool.query(
      `UPDATE transactions
       SET payment_status = 'paid'
       WHERE invoice_number = ? AND payment_status = 'unpaid'`,
      [invoiceNumber]
    );
    return this.findByInvoice(invoiceNumber);
  }

  async markExpired(invoiceNumber) {
    await this.pool.query(
      `UPDATE transactions
       SET payment_status = 'expired'
       WHERE invoice_number = ? AND payment_status = 'unpaid'`,
      [invoiceNumber]
    );
    return this.findByInvoice(invoiceNumber);
  }

  async acquireOrderLock(transactionId, digiflazzRefId) {
    const [result] = await this.pool.query(
      `UPDATE transactions
       SET topup_status = 'processing', digiflazz_ref_id = ?
       WHERE id = ?
         AND payment_status = 'paid'
         AND topup_status = 'pending'`,
      [digiflazzRefId, transactionId]
    );
    return result.affectedRows === 1;
  }

  async markTopupSuccess(transactionId, serialNumber) {
    await this.pool.query(
      `UPDATE transactions
       SET topup_status = 'success', digiflazz_sn = ?, failure_reason = NULL
       WHERE id = ?`,
      [serialNumber || null, transactionId]
    );
    return this.findById(transactionId);
  }

  async markTopupFailed(transactionId, reason) {
    await this.pool.query(
      `UPDATE transactions
       SET topup_status = 'failed', failure_reason = ?
       WHERE id = ?`,
      [reason, transactionId]
    );
    return this.findById(transactionId);
  }
}
