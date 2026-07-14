import { ArrowLeft, Copy } from 'lucide-react';
import { StatusPill } from '../components/StatusPill.jsx';

export const InvoicePage = ({ transaction, payment, onBack }) => {
  const paymentCode = payment?.pay_code || payment?.qr_url || payment?.checkout_url || transaction?.reference_id;
  const copyPaymentCode = async () => {
    await navigator.clipboard?.writeText(String(paymentCode || transaction.invoice_number));
    alert('Kode pembayaran/invoice disalin.');
  };

  return (
    <main className="page-shell invoice-layout">
      <button className="icon-text" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> Pesan lagi
      </button>

      <section className="invoice-head">
        <div>
          <p className="eyebrow">Invoice</p>
          <h1>{transaction.invoice_number}</h1>
        </div>
        <StatusPill value={transaction.topup_status} />
      </section>

      <section className="invoice-panel">
        <div>
          <span>Status Pembayaran</span>
          <StatusPill value={transaction.payment_status} />
        </div>
        <div>
          <span>Produk</span>
          <strong>{transaction.product_name}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>Rp {Number(transaction.price).toLocaleString('id-ID')}</strong>
        </div>
        <div>
          <span>Kode Bayar</span>
          <button className="copy-code" type="button" onClick={copyPaymentCode}>
            {paymentCode || 'Menunggu data pembayaran'} <Copy size={16} />
          </button>
        </div>
        {transaction.digiflazz_sn && (
          <div>
            <span>Serial Number</span>
            <strong>{transaction.digiflazz_sn}</strong>
          </div>
        )}
      </section>
    </main>
  );
};
