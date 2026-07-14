import { useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Headphones, Mail, ShieldCheck, Star, TicketPercent } from 'lucide-react';

const fallbackChannels = [
  { code: 'QRISC', name: 'QRIS (Customizable)', total_fee: { flat: 0, percent: 0.7 } },
  { code: 'BRIVA', name: 'BRI Virtual Account', total_fee: { flat: 0, percent: 0 } },
  { code: 'BCAVA', name: 'BCA Virtual Account', total_fee: { flat: 0, percent: 0 } }
];

const feeAmount = (price, channel) => {
  const fee = channel?.total_fee || {};
  return Math.ceil((Number(price || 0) * Number(fee.percent || 0)) / 100);
};

const formatRupiah = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

const defaultFieldConfig = (category) => ({
  playerLabel: `ID ${category.name}`,
  playerPlaceholder: `Masukkan ID ${category.name}`,
  zoneLabel: 'Server ID',
  zonePlaceholder: 'Opsional',
  zoneRequired: false
});

const singleIdGameLabels = {
  'free-fire': ['Player ID Free Fire', 'Contoh: 123456789'],
  'free-fire-max': ['Player ID Free Fire MAX', 'Contoh: 123456789'],
  'pubg-mobile': ['Character ID PUBG Mobile', 'Contoh: 5123456789'],
  'point-blank': ['User ID Point Blank', 'Contoh: NACTHPLAYER'],
  valorant: ['Riot ID / Username Valorant', 'Contoh: Nacth#ID1'],
  'genshin-impact': ['UID Genshin Impact', 'Contoh: 800123456'],
  'honkai-star-rail': ['UID Honkai Star Rail', 'Contoh: 800123456'],
  'zenless-zone-zero': ['UID Zenless Zone Zero', 'Contoh: 1300000000'],
  'honor-of-kings': ['Player ID Honor of Kings', 'Contoh: 123456789'],
  'call-of-duty-mobile': ['OpenID Call of Duty Mobile', 'Contoh: 1234567890'],
  'arena-of-valor': ['User ID Arena of Valor', 'Contoh: 123456789'],
  'blood-strike': ['User ID Blood Strike', 'Contoh: 123456789'],
  'arena-breakout': ['User ID Arena Breakout', 'Contoh: 123456789']
};

const zoneRequiredSlugs = new Set([
  'mobile-legends',
  'mobile-legends-adventure',
  'genshin-impact',
  'honkai-star-rail',
  'honkai-impact-3',
  'zenless-zone-zero',
  'tower-of-fantasy',
  'wuthering-waves',
  'ragnarok-m-eternal-love',
  'ragnarok-origin',
  'ragnarok-m-classic',
  'ragnarok-twilight',
  'moonlight-blade-m',
  'mu-origin-2',
  'mu-origin-3',
  'dragon-nest-m-classic',
  'laplace-m',
  'seal-m-sea',
  'lineage2m',
  'revelation-infinite-journey'
]);

const zoneLabels = {
  'mobile-legends': ['Server ID', 'Contoh: 1234'],
  'mobile-legends-adventure': ['Server ID', 'Contoh: 1234'],
  'genshin-impact': ['Server / Region', 'Contoh: Asia'],
  'honkai-star-rail': ['Server / Region', 'Contoh: Asia'],
  'honkai-impact-3': ['Server / Region', 'Contoh: SEA'],
  'zenless-zone-zero': ['Server / Region', 'Contoh: Asia'],
  'tower-of-fantasy': ['Server', 'Contoh: Eden'],
  'wuthering-waves': ['Server / Region', 'Contoh: SEA'],
  'ragnarok-m-eternal-love': ['Server', 'Contoh: Eternal Love'],
  'ragnarok-origin': ['Server', 'Contoh: Odin'],
  'ragnarok-m-classic': ['Server', 'Contoh: Classic'],
  'ragnarok-twilight': ['Server', 'Contoh: Twilight']
};

const fieldConfigFor = (category) => {
  if (category.slug === 'mobile-legends') {
    return {
      playerLabel: 'User ID Mobile Legends',
      playerPlaceholder: 'Contoh: 12345678',
      zoneLabel: 'Server ID',
      zonePlaceholder: 'Contoh: 1234',
      zoneRequired: true
    };
  }
  const custom = singleIdGameLabels[category.slug] || [`ID ${category.name}`, `Masukkan ID ${category.name}`];
  const zone = zoneLabels[category.slug] || ['Server', 'Masukkan server'];
  return {
    playerLabel: custom[0],
    playerPlaceholder: custom[1],
    zoneLabel: zone[0],
    zonePlaceholder: zone[1],
    zoneRequired: zoneRequiredSlugs.has(category.slug)
  };
};

const validPromos = {
  NACTH10: { type: 'percent', value: 10, minPurchase: 50000, label: 'Promo 10%' },
  HEMAT5000: { type: 'flat', value: 5000, minPurchase: 75000, label: 'Potongan Rp 5.000' }
};

const validReferrals = {
  NACTHREF: { type: 'percent', value: 5, minPurchase: 50000, label: 'Referral 5%' },
  TEMAN3000: { type: 'flat', value: 3000, minPurchase: 60000, label: 'Referral Rp 3.000' }
};

const discountAmount = (base, voucher) => {
  if (!voucher) return 0;
  if (voucher.type === 'percent') return Math.floor((base * voucher.value) / 100);
  return voucher.value;
};

const groupPaymentChannel = (channel) => {
  const group = String(channel.group || '').toLowerCase();
  const code = String(channel.code || '').toUpperCase();
  if (code.includes('QRIS')) return 'QRIS';
  if (group.includes('wallet') || ['OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA'].includes(code)) return 'E-Wallet';
  if (group.includes('virtual account') || code.includes('VA') || code.includes('BRI') || code.includes('MANDIRI')) return 'Bank';
  if (group.includes('convenience') || ['ALFAMART', 'ALFAMIDI', 'INDOMARET'].includes(code)) return 'Metode Pembayaran Lainnya';
  return 'Metode Pembayaran Lainnya';
};

const paymentGroupOrder = ['QRIS', 'E-Wallet', 'Bank', 'Metode Pembayaran Lainnya'];

const productDescription = (category, selectedProduct) => {
  const productName = selectedProduct?.name || `produk ${category.name}`;
  return `Cara top up ${category.name} untuk ${productName}: pilih nominal, masukkan data akun dengan benar, pilih pembayaran, isi kontak, lalu selesaikan pembayaran. Pesanan diproses otomatis setelah callback pembayaran tervalidasi.`;
};

export const OrderPage = ({
  category,
  products,
  channels,
  form,
  setForm,
  selectedProduct,
  selectedChannel,
  paymentGatewayEnabled = true,
  setSelectedProduct,
  setSelectedChannel,
  onBack,
  onSubmit,
  loading
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [referralStatus, setReferralStatus] = useState(null);
  const productItems = products;
  const channelItems = channels.length ? channels : fallbackChannels;
  const basePrice = Number(selectedProduct?.seller_price || 0);
  const fieldConfig = fieldConfigFor(category);
  const fee = paymentGatewayEnabled && selectedChannel ? feeAmount(basePrice, selectedChannel) : 0;
  const promoVoucher = promoStatus?.valid ? validPromos[promoCode.trim().toUpperCase()] : null;
  const referralVoucher = referralStatus?.valid ? validReferrals[referralCode.trim().toUpperCase()] : null;
  const promoDiscount = discountAmount(basePrice, promoVoucher);
  const referralDiscount = discountAmount(basePrice - promoDiscount, referralVoucher);
  const totalDiscount = Math.min(basePrice, promoDiscount + referralDiscount);
  const total = Math.max(0, basePrice - totalDiscount + fee);
  const contactReady = Boolean(form.email || form.whatsapp);
  const groupedChannels = useMemo(() => {
    const grouped = channelItems.reduce((acc, channel) => {
      const group = groupPaymentChannel(channel);
      return { ...acc, [group]: [...(acc[group] || []), channel] };
    }, {});
    return paymentGroupOrder
      .map((group) => ({ group, items: grouped[group] || [] }))
      .filter((entry) => entry.items.length);
  }, [channelItems]);
  const applyVoucher = (kind) => {
    const source = kind === 'promo' ? validPromos : validReferrals;
    const code = (kind === 'promo' ? promoCode : referralCode).trim().toUpperCase();
    const setter = kind === 'promo' ? setPromoStatus : setReferralStatus;
    if (!code) {
      setter({ valid: false, message: 'Kode wajib diisi.' });
      return;
    }
    const voucher = source[code];
    if (!voucher) {
      setter({ valid: false, message: 'Kode tidak valid atau belum aktif.' });
      return;
    }
    if (!selectedProduct) {
      setter({ valid: false, message: 'Pilih produk terlebih dahulu.' });
      return;
    }
    if (basePrice < voucher.minPurchase) {
      setter({
        valid: false,
        message: `Minimal pembelian ${formatRupiah(voucher.minPurchase)} untuk kode ini.`
      });
      return;
    }
    setter({ valid: true, message: `${voucher.label} berhasil digunakan.` });
  };

  return (
    <main className="page-shell order-layout">
      <button className="icon-text" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali
      </button>

      <section className="order-header">
        <div>
          <p className="eyebrow">Order</p>
          <h1>{category.name}</h1>
        </div>
        <div className="trust-badge">
          <ShieldCheck size={18} /> Callback tervalidasi
        </div>
      </section>

      <div className="order-content-grid">
        <div className="order-main-column">
          <section className="step-card form-band">
            <div className="step-head"><b>1</b><span>Masukkan Data Akun</span></div>
            <div className={`field-grid ${fieldConfig.zoneRequired ? '' : 'single-field'}`}>
              <label>
                {fieldConfig.playerLabel}
                <input
                  value={form.user_id_game}
                  onChange={(event) => setForm({ ...form, user_id_game: event.target.value })}
                  placeholder={fieldConfig.playerPlaceholder}
                />
              </label>
              {fieldConfig.zoneRequired && (
                <label>
                  {fieldConfig.zoneLabel}
                  <input
                    value={form.zone_id}
                    onChange={(event) => setForm({ ...form, zone_id: event.target.value })}
                    placeholder={fieldConfig.zonePlaceholder}
                  />
                </label>
              )}
            </div>
          </section>

          <section className="step-card">
            <div className="step-head"><b>2</b><span>Pilih Nominal</span></div>
            <div className="product-grid product-art-grid">
              {productItems.length ? productItems.map((product) => (
                <button
                  className={`product-card product-art-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
                  type="button"
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                >
                  <strong>{product.name}</strong>
                  <span>Rp {Number(product.seller_price).toLocaleString('id-ID')}</span>
                  <em>Proses instan</em>
                </button>
              )) : (
                <div className="empty-products">
                  Produk untuk game ini belum tersedia dari Digiflazz. Coba sync ulang setelah produk aktif di akun vendor.
                </div>
              )}
            </div>
          </section>

          {paymentGatewayEnabled ? (
            <section className="step-card">
              <div className="step-head"><b>3</b><span>Pilih Pembayaran</span></div>
              <div className="payment-accordion">
                {groupedChannels.map(({ group, items }) => (
                  <details className="payment-group" key={group} open={group === 'QRIS'}>
                    <summary>
                      <span>{group}</span>
                      <small>{items.length} metode</small>
                    </summary>
                    <div className="payment-grid">
                      {items.map((channel) => (
                        <button
                          className={`payment-row ${selectedChannel?.code === channel.code ? 'selected' : ''}`}
                          type="button"
                          key={channel.code}
                          onClick={() => setSelectedChannel(channel)}
                        >
                          {channel.icon_url ? <img src={channel.icon_url} alt="" /> : <CreditCard size={20} />}
                          <span>{channel.name}</span>
                          <b>{basePrice ? formatRupiah(basePrice + feeAmount(basePrice, channel)) : 'Pilih produk'}</b>
                        </button>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ) : (
            <section className="step-card gateway-off-panel">
              <div className="step-head"><b>3</b><span>Mode Digiflazz Langsung</span></div>
              <p>Payment gateway sementara dinonaktifkan. Setelah tombol order ditekan, transaksi langsung dikirim ke Digiflazz.</p>
            </section>
          )}

          <section className="voucher-panel">
            <h2>Kode Promo & Referral</h2>
            <p className="promo-note">
              Untuk mendapatkan berbagai macam promo dan referral terbaru, follow Instagram Nacht Top-up Store.
            </p>
            <div className="voucher-grid">
              <label>
                Kode Promo
                <span>
                  <input value={promoCode} onChange={(event) => { setPromoCode(event.target.value); setPromoStatus(null); }} placeholder="Contoh: NACTH10" />
                  <button type="button" onClick={() => applyVoucher('promo')}><TicketPercent size={16} /> Pakai</button>
                </span>
                {promoStatus && <small className={promoStatus.valid ? 'valid-code' : 'invalid-code'}>{promoStatus.message}</small>}
              </label>
              <label>
                Kode Referral
                <span>
                  <input value={referralCode} onChange={(event) => { setReferralCode(event.target.value); setReferralStatus(null); }} placeholder="Contoh: NACTHREF" />
                  <button type="button" onClick={() => applyVoucher('referral')}><TicketPercent size={16} /> Pakai</button>
                </span>
                {referralStatus && <small className={referralStatus.valid ? 'valid-code' : 'invalid-code'}>{referralStatus.message}</small>}
              </label>
            </div>
            <div className="price-breakdown">
              <span>Subtotal <b>Rp {basePrice.toLocaleString('id-ID')}</b></span>
              {paymentGatewayEnabled && <span>Biaya payment <b>Rp {fee.toLocaleString('id-ID')}</b></span>}
              <span>Diskon <b>- Rp {totalDiscount.toLocaleString('id-ID')}</b></span>
            </div>
          </section>

          <section className="step-card contact-panel">
            <div className="step-head"><b>4</b><span>Detail Kontak</span></div>
            <label>
              Email
              <input
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="example@gmail.com"
                type="email"
              />
            </label>
            <label>
              No. WhatsApp
              <input
                value={form.whatsapp}
                onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
                placeholder="+6283831813841"
              />
            </label>
            <small>*Nomor ini akan dihubungi jika terjadi masalah</small>
            <div className="receipt-note"><Mail size={16} /> Bukti transaksi otomatis dikirim ke email/no HP yang dimasukkan.</div>
          </section>
        </div>

        <aside className="order-side-column">
          <div className="rating-card">
            <span>Ulasan dan rating</span>
            <strong>4.99</strong>
            <div>{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={30} fill="currentColor" />)}</div>
            <small>Berdasarkan total 832 rating</small>
          </div>
          <button className="help-card" type="button" onClick={() => window.open('https://wa.me/6283831813841', '_blank', 'noopener,noreferrer')}>
            <Headphones size={28} />
            <span><b>Butuh Bantuan?</b><small>Kamu bisa hubungi admin disini.</small></span>
          </button>
          <div className="selected-summary">
            {selectedProduct ? (
              <>
                <b>{selectedProduct.name}</b>
                <span>{paymentGatewayEnabled ? (selectedChannel ? selectedChannel.name : 'Pilih pembayaran') : 'Digiflazz langsung'}</span>
                <strong>{formatRupiah(total)}</strong>
              </>
            ) : (
              <span>Belum ada item produk yang dipilih.</span>
            )}
          </div>
          <button
            className="side-order-button"
            type="button"
            disabled={loading || !selectedProduct || (paymentGatewayEnabled && !selectedChannel) || !contactReady}
            onClick={() => onSubmit({ promoCode, referralCode, total, totalDiscount, fee })}
          >
            {loading ? 'Membuat invoice...' : 'Pesan Sekarang!'}
          </button>
        </aside>
      </div>

      <section className="description-panel bottom-description">
        <div className="description-head"><span /> <b>Deskripsi {category.name}</b></div>
        <p>{productDescription(category, selectedProduct)}</p>
        <ol>
          <li>Pilih nominal</li>
          <li>Masukkan data akun</li>
          <li>Masukkan jumlah pembelian</li>
          <li>{paymentGatewayEnabled ? 'Pilih pembayaran' : 'Konfirmasi mode Digiflazz langsung'}</li>
          <li>Isi detail kontak</li>
          <li>Masukkan kode promo jika ada</li>
          <li>{paymentGatewayEnabled ? 'Klik order dan lakukan pembayaran' : 'Klik order untuk mengirim transaksi ke Digiflazz'}</li>
          <li>Selesai</li>
        </ol>
      </section>

      <footer className="checkout-bar">
        <div>
          <span>Total</span>
          <strong>Rp {total.toLocaleString('id-ID')}</strong>
        </div>
        <button
          type="button"
          disabled={loading || !selectedProduct || (paymentGatewayEnabled && !selectedChannel) || !contactReady}
          onClick={() => onSubmit({ promoCode, referralCode, total, totalDiscount, fee })}
        >
          {loading ? 'Membuat invoice...' : 'Bayar Sekarang'}
        </button>
      </footer>
    </main>
  );
};
