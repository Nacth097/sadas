export class AdminAlertService {
  async notifyRefundRequired(transaction, reason) {
    console.error('[ADMIN_REFUND_REQUIRED]', {
      invoice_number: transaction.invoice_number,
      transaction_id: transaction.id,
      reason
    });
  }
}
