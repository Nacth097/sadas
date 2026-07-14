import { useEffect, useState } from 'react';
import { api } from './api/client.js';
import { HomePage } from './pages/HomePage.jsx';
import { OrderPage } from './pages/OrderPage.jsx';
import { InvoicePage } from './pages/InvoicePage.jsx';

const demoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const paymentGatewayEnabled = import.meta.env.VITE_PAYMENT_GATEWAY_ENABLED === 'true';

export const App = () => {
  const [view, setView] = useState('home');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [category, setCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ user_id_game: '', zone_id: '', email: '', whatsapp: '' });

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
    api.paymentChannels().then(setChannels).catch(() => setChannels([]));
  }, []);

  useEffect(() => {
    if (!transaction?.invoice_number || transaction.id === 0 || transaction.topup_status === 'success') return undefined;
    const interval = window.setInterval(async () => {
      try {
        setTransaction(await api.transaction(transaction.invoice_number));
      } catch {
        window.clearInterval(interval);
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [transaction?.invoice_number, transaction?.topup_status]);

  const openCategory = async (nextCategory) => {
    setCategory(nextCategory);
    setSelectedProduct(null);
    setSelectedChannel(null);
    setForm({ user_id_game: '', zone_id: '', email: '', whatsapp: '' });
    setError('');
    setView('order');
    try {
      setProducts(await api.products(nextCategory.slug));
    } catch {
      setProducts([]);
    }
  };

  const submitOrder = async (pricing = {}) => {
    setError('');
    setLoading(true);
    try {
      const result = await Promise.race([
        api.createTransaction({
          product_id: selectedProduct.id,
          user_id_game: form.user_id_game,
          zone_id: form.zone_id || null,
          payment_method: paymentGatewayEnabled ? selectedChannel.code : 'DIGIFLAZZ_DIRECT',
          customer: {
            name: form.user_id_game || 'Nacth Customer',
            email: form.email || undefined,
            phone: form.whatsapp || undefined
          },
          promo_code: pricing.promoCode || null,
          referral_code: pricing.referralCode || null
        }),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('Payment request timeout')), demoMode ? 1200 : 15000);
        })
      ]);
      setTransaction(result.transaction);
      setPayment(result.payment);
      setView('invoice');
    } catch (err) {
      if (!demoMode) {
        setError('Invoice belum dibuat karena backend/payment gateway belum aktif. Tidak ada saldo atau pembayaran yang terpotong.');
        return;
      }
      const demoInvoice = `NTH-DEMO-${Date.now().toString().slice(-8)}`;
      setTransaction({
        id: 0,
        invoice_number: demoInvoice,
        reference_id: 'DEMO-PAYMENT-CODE',
        product_name: selectedProduct.name,
        price: pricing.total || selectedProduct.seller_price,
        payment_method: paymentGatewayEnabled ? selectedChannel.code : 'DIGIFLAZZ_DIRECT',
        discount: pricing.totalDiscount || 0,
        payment_fee: pricing.fee || 0,
        payment_status: 'unpaid',
        topup_status: 'pending',
        digiflazz_sn: null
      });
      setPayment({
        reference: 'DEMO-TRIPAY-REF',
        checkout_url: 'Mode demo tanpa koneksi API'
      });
      setError('Mode demo aktif: invoice contoh dibuat tanpa backend.');
      setView('invoice');
    } finally {
      setLoading(false);
    }
  };

  const checkInvoiceDemo = (invoiceNumber) => {
    if (!demoMode) {
      api.transaction(invoiceNumber)
        .then((data) => {
          setTransaction(data);
          setPayment(null);
          setView('invoice');
        })
        .catch(() => setError('Invoice tidak ditemukan atau backend produksi belum aktif.'));
      return;
    }
    setTransaction({
      id: 0,
      invoice_number: invoiceNumber,
      reference_id: 'DEMO-PAYMENT-CODE',
      product_name: 'Invoice Demo Nacth',
      price: 27999,
      payment_method: 'QRIS',
      payment_status: 'unpaid',
      topup_status: 'pending',
      digiflazz_sn: null
    });
    setPayment({
      reference: 'DEMO-TRIPAY-REF',
      checkout_url: 'Mode demo tanpa koneksi API'
    });
    setView('invoice');
  };

  return (
    <>
      {error && <div className="toast">{error}</div>}
      {view === 'home' && (
        <HomePage
          categories={categories}
          onSelectCategory={openCategory}
          onCheckInvoice={checkInvoiceDemo}
        />
      )}
      {view === 'order' && category && (
        <OrderPage
          category={category}
          products={products}
          channels={channels}
          form={form}
          setForm={setForm}
          selectedProduct={selectedProduct}
          selectedChannel={selectedChannel}
          paymentGatewayEnabled={paymentGatewayEnabled}
          setSelectedProduct={setSelectedProduct}
          setSelectedChannel={setSelectedChannel}
          onBack={() => setView('home')}
          onSubmit={submitOrder}
          loading={loading}
        />
      )}
      {view === 'invoice' && transaction && (
        <InvoicePage
          transaction={transaction}
          payment={payment}
          onBack={() => {
            setView('home');
            setTransaction(null);
          }}
        />
      )}
    </>
  );
};
