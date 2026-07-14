import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Headphones,
  LogIn,
  MessageCircle,
  ReceiptText,
  Search,
  ShoppingBag,
  Trophy,
  UserPlus,
  Zap
} from 'lucide-react';

const gameImages = {
  'mobile-legends': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80',
  'free-fire': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=700&q=80',
  'pubg-mobile': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=700&q=80',
  'point-blank': 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&w=700&q=80',
  'arena-breakout': 'https://images.unsplash.com/photo-1541728472741-03e45a58cf88?auto=format&fit=crop&w=700&q=80',
  'blood-strike': 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=700&q=80'
};

const demoCategories = [
  { id: 1, code: 'ML', name: 'Mobile Legends', publisher: 'Moonton', slug: 'mobile-legends', image_url: gameImages['mobile-legends'] },
  { id: 2, code: 'FF', name: 'Free Fire', publisher: 'Garena', slug: 'free-fire', image_url: gameImages['free-fire'] },
  { id: 3, code: 'PUBG', name: 'PUBG Mobile', publisher: 'Tencent Games', slug: 'pubg-mobile', image_url: gameImages['pubg-mobile'] },
  { id: 4, code: 'PB', name: 'Point Blank', publisher: 'Zepetto', slug: 'point-blank', image_url: gameImages['point-blank'] },
  { id: 5, code: 'AB', name: 'Arena Breakout', publisher: 'Level Infinite', slug: 'arena-breakout', image_url: gameImages['arena-breakout'] },
  { id: 6, code: 'BS', name: 'Blood Strike', publisher: 'NetEase', slug: 'blood-strike', image_url: gameImages['blood-strike'] }
];

const banners = [
  { title: 'Cepat dan Murah', subtitle: 'Buka 24 Jam, transaksi otomatis', categorySlug: 'mobile-legends' },
  { title: 'Diamond Instan', subtitle: 'Mobile Legends dan Free Fire siap top up', categorySlug: 'free-fire' },
  { title: 'Promo Member', subtitle: 'Harga hemat untuk akun yang login', categorySlug: 'pubg-mobile' }
];

const saleItems = [
  { title: 'Weekly Diamond Pass', game: 'Mobile Legends', price: 27999, old: 32000, icon: 'ML', slug: 'mobile-legends', stock: 80, sold: 52 },
  { title: '140 Diamonds', game: 'Free Fire', price: 18999, old: 22000, icon: 'FF', slug: 'free-fire', stock: 120, sold: 103 },
  { title: '355 Diamonds', game: 'Mobile Legends', price: 45199, old: 50000, icon: 'ML', slug: 'mobile-legends', stock: 45, sold: 38 },
  { title: 'PUBG UC Pack', game: 'PUBG Mobile', price: 31500, old: 36000, icon: 'UC', slug: 'pubg-mobile', stock: 60, sold: 41 }
];

const trendingSlugs = [
  'mobile-legends',
  'free-fire',
  'pubg-mobile',
  'honor-of-kings',
  'genshin-impact',
  'point-blank'
];

const leaderboard = [
  { rank: 1, name: 'nacth_user01', total: 'Rp 3.450.000', orders: 88 },
  { rank: 2, name: 'legendbuyer', total: 'Rp 2.910.000', orders: 72 },
  { rank: 3, name: 'fastdiamond', total: 'Rp 2.120.000', orders: 54 },
  { rank: 4, name: 'guest tidak dihitung', total: 'Login required', orders: 0 }
];

const waUrl = 'https://wa.me/6283831813841';
const discordUrl = 'https://discord.com/users/nacth0975';
const saleEndsAt = Date.now() + 2 * 60 * 60 * 1000 + 18 * 60 * 1000 + 44 * 1000;

const formatPrice = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

const categoryImage = (item) =>
  item.image_url || gameImages[item.slug] || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=700&q=80';

const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0'));
};

export const HomePage = ({ categories, onSelectCategory, onCheckInvoice }) => {
  const [activePanel, setActivePanel] = useState('topup');
  const [activeCatalog, setActiveCatalog] = useState('topup');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [csOpen, setCsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authMessage, setAuthMessage] = useState('');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [sessionUser, setSessionUser] = useState(() => JSON.parse(localStorage.getItem('nacth_session_user') || 'null'));
  const [remainingMs, setRemainingMs] = useState(() => saleEndsAt - Date.now());
  const items = categories.length ? categories : demoCategories;
  const trendingItems = [
    ...trendingSlugs.map((slug) => items.find((item) => item.slug === slug)).filter(Boolean),
    ...items
  ].filter((item, index, self) => self.findIndex((candidate) => candidate.slug === item.slug) === index).slice(0, 6);
  const activeSlugs = new Set(items.map((item) => item.slug));
  const activeSaleItems = saleItems.filter((item) => activeSlugs.has(item.slug));

  useEffect(() => {
    const timer = window.setInterval(() => setRemainingMs(saleEndsAt - Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const searchableItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.name} ${item.publisher || ''}`.toLowerCase().includes(normalized));
  }, [items, query]);

  const findCategory = (slug) => items.find((item) => item.slug === slug) || demoCategories.find((item) => item.slug === slug) || items[0];
  const currentBanner = banners[bannerIndex];
  const countdown = formatCountdown(remainingMs);
  const nextBanner = () => setBannerIndex((value) => (value + 1) % banners.length);
  const previousBanner = () => setBannerIndex((value) => (value - 1 + banners.length) % banners.length);
  const openCategoryBySlug = (slug) => onSelectCategory(findCategory(slug));
  const renderGameThumb = (item, className = 'game-badge') => {
    const image = item.image_url || gameImages[item.slug];
    if (image) return <img src={image} alt="" />;
    const initials = item.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
    const tones = ['tone-gold', 'tone-red', 'tone-green', 'tone-blue', 'tone-steel', 'tone-cyan', 'tone-violet'];
    const tone = tones[(item.slug || item.name).length % tones.length];
    return <span className={`${className} ${tone}`}>{initials || 'NT'}</span>;
  };

  const activatePanel = (panel) => {
    setActivePanel(panel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (searchableItems[0]) openCategoryBySlug(searchableItems[0].slug);
  };

  const submitAuth = (event) => {
    event.preventDefault();
    const users = JSON.parse(localStorage.getItem('nacth_demo_users') || '[]');
    if (authMode === 'register') {
      if (!authForm.username || !authForm.email || authForm.password.length < 6) {
        setAuthMessage('Isi username, email, dan password minimal 6 karakter.');
        return;
      }
      if (users.some((user) => user.email === authForm.email || user.username === authForm.username)) {
        setAuthMessage('Username atau email sudah terdaftar.');
        return;
      }
      const newUser = { username: authForm.username, email: authForm.email };
      localStorage.setItem('nacth_demo_users', JSON.stringify([...users, { ...newUser, password: authForm.password }]));
      localStorage.setItem('nacth_session_user', JSON.stringify(newUser));
      setSessionUser(newUser);
      setAuthOpen(false);
      setAuthMessage('');
      return;
    }
    const found = users.find((user) => (user.email === authForm.email || user.username === authForm.email) && user.password === authForm.password);
    if (!found) {
      setAuthMessage('Akun tidak ditemukan atau password salah.');
      return;
    }
    const nextSession = { username: found.username, email: found.email };
    localStorage.setItem('nacth_session_user', JSON.stringify(nextSession));
    setSessionUser(nextSession);
    setAuthOpen(false);
    setAuthMessage('');
  };

  const logout = () => {
    localStorage.removeItem('nacth_session_user');
    setSessionUser(null);
  };

  return (
    <div className="site-frame">
      <header className="market-header">
        <div className="header-row">
          <button className="brand-logo" type="button" onClick={() => activatePanel('topup')}>
            <span className="logo-orbit" />
            <img src="/assets/nacth-logo-cutout.png" alt="Nacth Top Up Store" />
          </button>
          <form className="market-search-wrap" onSubmit={submitSearch}>
            <label className="market-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchableItems[0]) {
                    event.preventDefault();
                    openCategoryBySlug(searchableItems[0].slug);
                  }
                }}
                placeholder="Cari Game atau Voucher"
              />
            </label>
            {query && (
              <div className="search-results">
                {searchableItems.length ? searchableItems.map((item) => (
                  <button type="button" key={item.slug} aria-label={`Hasil pencarian ${item.name}`} onClick={() => openCategoryBySlug(item.slug)}>
                    {renderGameThumb(item)}
                    <span><strong>{item.name}</strong><small>{item.publisher || 'Nacth Partner'}</small></span>
                  </button>
                )) : <p>Tidak ada hasil.</p>}
              </div>
            )}
          </form>
          <button className="currency-chip" type="button" onClick={() => alert('Region aktif: Indonesia. Mata uang: IDR.')}>ID / IDR</button>
        </div>
        <nav className="nav-row" aria-label="Main navigation">
          <button className={`nav-item ${activePanel === 'topup' ? 'active' : ''}`} type="button" onClick={() => activatePanel('topup')}><ShoppingBag size={16} /> Topup</button>
          <button className={`nav-item ${activePanel === 'invoice' ? 'active' : ''}`} type="button" onClick={() => activatePanel('invoice')}><ReceiptText size={16} /> Cek Transaksi</button>
          <button className={`nav-item ${activePanel === 'leaderboard' ? 'active' : ''}`} type="button" onClick={() => activatePanel('leaderboard')}><Trophy size={16} /> Leaderboard</button>
          {sessionUser ? (
            <button className="nav-item login-link" type="button" onClick={logout}><LogIn size={16} /> {sessionUser.username}</button>
          ) : (
            <button className="nav-item login-link" type="button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}><LogIn size={16} /> Masuk</button>
          )}
        </nav>
      </header>

      <main className="market-shell">
        {activePanel === 'topup' && (
          <div className="app-panel">
            <section className="hero-stage" aria-label="Nacth promo">
              <button className="hero-arrow hero-prev" type="button" aria-label="Previous banner" onClick={previousBanner}><ChevronLeft size={24} /></button>
              <button className="hero-copy hero-click" type="button" onClick={() => openCategoryBySlug(currentBanner.categorySlug)}>
                <p>Top Up Game</p>
                <h1>{currentBanner.title}</h1>
                <strong>{currentBanner.subtitle}</strong>
              </button>
              <button className="hero-character" type="button" onClick={() => openCategoryBySlug(currentBanner.categorySlug)}>
                <Headphones size={74} />
                <span>NACTH</span>
              </button>
              <button className="hero-arrow hero-next" type="button" aria-label="Next banner" onClick={nextBanner}><ChevronRight size={24} /></button>
            </section>

            <section className="flash-panel">
              <div className="section-title">
                <div>
                  <h2><Zap size={20} /> FLASH SALE</h2>
                  <p>Persediaan mengikuti stok promo yang dimasukkan.</p>
                </div>
                <div className="countdown">{countdown.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
              </div>
              <div className="sale-strip">
                {activeSaleItems.map((item) => {
                  const remaining = Math.max(0, item.stock - item.sold);
                  return (
                    <button className="sale-card" type="button" key={item.title} disabled={remaining === 0} onClick={() => openCategoryBySlug(item.slug)}>
                      <div className="sale-icon">{item.icon}</div>
                      <strong>{item.title}</strong>
                      <small>{item.game}</small>
                      <b>{formatPrice(item.price)}</b>
                      <del>{formatPrice(item.old)}</del>
                      <em>Sisa {remaining}/{item.stock}</em>
                      <span className="sale-meter" style={{ right: `${Math.round((remaining / item.stock) * 100)}%` }} />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="trending-section">
              <div className="section-title">
                <div>
                  <h2><Flame size={20} /> TRENDING</h2>
                  <p>Game populer ditampilkan ringkas agar halaman utama tetap ringan.</p>
                </div>
              </div>
              <div className="trending-grid">
                {trendingItems.map((category) => (
                  <button className="trend-card" type="button" key={category.slug} onClick={() => onSelectCategory(category)}>
                    {renderGameThumb(category)}
                    <span><strong>{category.name}</strong><small>{category.publisher || 'Nacth Partner'}</small></span>
                  </button>
                ))}
              </div>
            </section>

            <section className="catalog-section" id="game-lainnya">
              <div className="section-title catalog-heading">
                <div>
                  <h2>Game Lainnya</h2>
                  <p>Semua game dan voucher yang masuk allowlist Digiflazz ditampilkan di sini.</p>
                </div>
              </div>
              <div className="tab-row">
                <button className={`tab-pill ${activeCatalog === 'topup' ? 'active' : ''}`} type="button" onClick={() => setActiveCatalog('topup')}>Top Up Game</button>
                <button className={`tab-pill ${activeCatalog === 'voucher' ? 'active' : ''}`} type="button" onClick={() => setActiveCatalog('voucher')}>Voucher Game</button>
              </div>
              <p className="catalog-note">
                {activeCatalog === 'topup'
                  ? 'Semua daftar top up game yang diizinkan dari Digiflazz ditampilkan di sini.'
                  : 'Voucher game seperti Razer Gold dan voucher publisher akan masuk di daftar yang sama saat produk aktif dari Digiflazz.'}
              </p>
              <div className="poster-grid">
                {items.map((item, index) => (
                  <button className={`poster-card ${index === 0 ? 'featured' : ''}`} type="button" key={item.slug} onClick={() => openCategoryBySlug(item.slug)}>
                    {item.image_url || gameImages[item.slug] ? <img src={categoryImage(item)} alt="" /> : renderGameThumb(item, 'poster-art')}
                    <span className="poster-info"><strong>{item.name}</strong><small>{item.publisher || 'Nacth Partner'}</small></span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activePanel === 'invoice' && (
          <section className="invoice-check app-panel">
            <h2>Cek Invoice Kamu dengan Mudah dan Cepat</h2>
            <p>Lihat detail pembelian kamu menggunakan nomor invoice.</p>
            <form className="invoice-search" onSubmit={(event) => { event.preventDefault(); onCheckInvoice(invoiceNumber || 'NTH-DEMO-CHECK'); }}>
              <label>
                Cari detail pembelian kamu disini
                <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Masukkan nomor Invoice Kamu (Contoh: NTHXXXXXXXXXXXX)" />
              </label>
              <button type="submit"><ReceiptText size={16} /> Cari Invoice</button>
            </form>
          </section>
        )}

        {activePanel === 'leaderboard' && (
          <section className="leaderboard-section app-panel">
            <div className="section-title">
              <div>
                <h2><Trophy size={20} /> LEADERBOARD TOP UP</h2>
                <p>Hanya transaksi user yang login yang dihitung.</p>
              </div>
            </div>
            <div className="leaderboard-list">
              {leaderboard.map((item) => (
                <div className="leaderboard-row" key={item.rank}>
                  <b>#{item.rank}</b>
                  <span>{item.name}</span>
                  <strong>{item.total}</strong>
                  <small>{item.orders} transaksi</small>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {csOpen && (
        <div className="cs-menu">
          <a href={waUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a>
          <a href={discordUrl} target="_blank" rel="noreferrer"><Headphones size={18} /> Discord</a>
        </div>
      )}
      <button className="chat-bubble" type="button" aria-label="Customer support" onClick={() => setCsOpen((value) => !value)}><Headphones size={26} /></button>

      {authOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="login-modal" onSubmit={submitAuth}>
            <h2>{authMode === 'login' ? 'Masuk Akun' : 'Daftar Akun'}</h2>
            {authMode === 'register' && <input value={authForm.username} onChange={(event) => setAuthForm({ ...authForm, username: event.target.value })} placeholder="Username" />}
            <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder={authMode === 'login' ? 'Email atau username' : 'Email'} />
            <input value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Password" type="password" />
            {authMessage && <p className="auth-message">{authMessage}</p>}
            <button type="submit">{authMode === 'login' ? 'Masuk' : 'Daftar'}</button>
            <button type="button" className="ghost-button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthMessage(''); }}>
              {authMode === 'login' ? <><UserPlus size={16} /> Buat Akun Baru</> : 'Sudah punya akun'}
            </button>
            <button type="button" className="ghost-button" onClick={() => setAuthOpen(false)}>Tutup</button>
          </form>
        </div>
      )}
    </div>
  );
};
