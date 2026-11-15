import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  demoConversations,
  formatPrice,
  siteImages,
  storefrontProducts,
} from './data.js';

const CART_KEY = 'jielikx-demo-cart';
const ORDER_KEY = 'jielikx-demo-order';
const ADMIN_ORDERS_KEY = 'jielikx-demo-admin-orders';
const ADMIN_KEY = 'jielikx-demo-admin';
const PRODUCTS_KEY = 'jielikx-demo-products';
const PRODUCTS_UPDATED_EVENT = 'jielikx-products-updated';
const DEFAULT_SHOP_ADDRESS = 'Binalonan Public Market';
const DEFAULT_SHOP_PHONE = '63+ 000 000 0000';
const DEFAULT_SHOP_EMAIL = 'Jielikxframeshop@gmail.com';
const ACCOUNT_KEY = 'jielikx-demo-account';
const USERS_KEY = 'jielikx-demo-users';
const SESSION_KEY = 'jielikx-demo-session';
const PREFERENCES_KEY = 'jielikx-demo-preferences';
const ADMIN_SETTINGS_KEY = 'jielikx-demo-admin-settings';
const PASSWORD_HASH_ITERATIONS = 120000;
const ADMIN_EMAIL = 'admin@jielikxframeshop.com';
const ADMIN_PASSWORD = 'JielikxAdmin2026!';

function getStored(key, fallback) {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProductCatalog() {
  const saved = getStored(PRODUCTS_KEY, null);
  return Array.isArray(saved) ? saved : storefrontProducts;
}

function saveProductCatalog(catalog) {
  saveStored(PRODUCTS_KEY, catalog);
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
}

function useProductCatalog() {
  const [catalog, setCatalog] = useState(getProductCatalog);
  useEffect(() => {
    const syncCatalog = () => setCatalog(getProductCatalog());
    window.addEventListener('storage', syncCatalog);
    window.addEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
    return () => {
      window.removeEventListener('storage', syncCatalog);
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, syncCatalog);
    };
  }, []);
  function updateCatalog(nextCatalog) {
    saveProductCatalog(nextCatalog);
    setCatalog(nextCatalog);
  }
  return [catalog, updateCatalog];
}

function prepareProductImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The image could not be read. Please choose another file.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const scale = Math.min(1, 900 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('The image could not be prepared in this browser.'));
          return;
        }
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isCustomerSignedIn() {
  const email = normalizeEmail(getStored(SESSION_KEY, ''));
  const users = getStored(USERS_KEY, {});
  return Boolean(email && users?.[email]?.passwordHash);
}

function getCurrentProfile() {
  const email = normalizeEmail(getStored(SESSION_KEY, ''));
  const users = getStored(USERS_KEY, {});
  const profile = users?.[email]?.profile;
  if (profile) return profile;
  const legacyProfile = getStored(ACCOUNT_KEY, {});
  return normalizeEmail(legacyProfile.email) === email ? legacyProfile : { email };
}

function getAdminOrders() {
  const orders = getStored(ADMIN_ORDERS_KEY, []);
  return Array.isArray(orders) ? orders : [];
}

function getAdminCustomers(orders = getAdminOrders()) {
  const customers = new Map();
  for (const order of orders) {
    const email = normalizeEmail(order.customerEmail);
    if (!email) continue;
    const customer = customers.get(email) || {
      name: order.customer,
      email,
      phone: order.phone || '',
      orders: 0,
      spent: 0,
      joined: order.date,
      joinedAt: order.createdAt,
      lastOrderAt: order.createdAt,
    };
    customer.orders += 1;
    customer.spent += Number(order.total) || 0;
    if (new Date(order.createdAt) < new Date(customer.joinedAt)) {
      customer.joinedAt = order.createdAt;
      customer.joined = order.date;
    }
    if (new Date(order.createdAt) > new Date(customer.lastOrderAt)) customer.lastOrderAt = order.createdAt;
    if (!customer.phone && order.phone) customer.phone = order.phone;
    customers.set(email, customer);
  }
  return Array.from(customers.values());
}

function saveCurrentProfile(profile) {
  const email = normalizeEmail(getStored(SESSION_KEY, ''));
  const users = getStored(USERS_KEY, {});
  if (!email || !users?.[email]) throw new Error('Your session expired. Please log in again.');
  users[email] = { ...users[email], profile };
  saveStored(USERS_KEY, users);
}

function createPasswordSalt() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure password storage is unavailable. Open this site on localhost or HTTPS.');
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Password verification is unavailable. Open this site on localhost or HTTPS.');
  }
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const result = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function passwordHashesMatch(first, second) {
  if (first.length !== second.length) return false;
  let difference = 0;
  for (let index = 0; index < first.length; index += 1) {
    difference |= first.charCodeAt(index) ^ second.charCodeAt(index);
  }
  return difference === 0;
}

function addProductToCart(slug) {
  const cart = getStored(CART_KEY, {});
  cart[slug] = (cart[slug] || 0) + 1;
  saveStored(CART_KEY, cart);
}

function Brand({ className = 'brand' }) {
  return (
    <Link className={className} to="/">
      <img src="/images/jielikx-frame-shop-badge.png" alt="" />
      <span>Jielikx Frame Shop</span>
    </Link>
  );
}

function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/frames', label: 'Frames' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <header className="site-header">
      <Brand />
      <button
        className="menu-toggle"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>
      <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.to}
            className={location.pathname === item.to ? 'active' : ''}
            to={item.to}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link className="button button-dark nav-account" to="/account/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <Brand />
        <p>Frame what matters most.</p>
      </div>
      <div className="footer-links">
        <Link to="/frames">Shop frames</Link>
        <Link to="/contact">Contact us</Link>
        <Link to="/account/help">Help &amp; Support</Link>
      </div>
      <small>Frontend demo · no live order fulfillment</small>
    </footer>
  );
}

function StoreLayout() {
  return (
    <>
      <SiteHeader />
      <main><Outlet /></main>
      <SiteFooter />
    </>
  );
}

function Eyebrow({ children }) {
  return <p className="eyebrow">{children}</p>;
}

function DemoNotice({ children = 'Demo only: information is stored in this browser and is not sent to a shop system.' }) {
  return <p className="demo-notice" role="note">{children}</p>;
}

function PageIntro({ eyebrow, title, copy }) {
  return (
    <div className="page-intro">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </div>
  );
}

function ProductArtwork({ product, variant = 'product', compact = false }) {
  const image = {
    product: product.image,
    cart: product.cartImage,
    checkout: product.checkoutImage,
    confirmation: product.confirmationImage,
  }[variant] || product.image;
  return <img className={`product-art${compact ? ' compact' : ''}`} src={image} alt={product.name} loading="lazy" />;
}

function ProductCard({ product }) {
  return (
    <article className="product-card">
      <Link className="product-art-link" to={`/cart/${product.slug}`} onClick={() => addProductToCart(product.slug)}>
        <ProductArtwork product={product} />
      </Link>
      <div className="product-card-body">
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <strong className="price-tag">{formatPrice(product.price)}</strong>
        <div className="review-line"><span aria-label="No rating">☆ ☆ ☆ ☆ ☆</span><small>No reviews yet</small></div>
        <Link className="button button-dark full-width" to={`/cart/${product.slug}`} onClick={() => addProductToCart(product.slug)}>Buy now</Link>
      </div>
    </article>
  );
}

function HomePage() {
  const frameCards = [
    { title: 'Modern Frame', image: siteImages.home.highlights[0], alt: 'Modern black picture frame' },
    { title: 'Certificate Frame', image: siteImages.home.highlights[1], alt: 'Certificate displayed in a black frame' },
    { title: 'Wooden Frame', image: siteImages.home.woodenFrameCard, alt: 'Flowers displayed in a wooden frame' },
  ];
  const showcaseImages = siteImages.home.showcase;
  const workflowImages = siteImages.home.gallery.slice(3);

  return (
    <div className="home-page" style={{ backgroundImage: `url("${siteImages.home.whyBackground}")` }}>
      <section className="home-hero">
        <img className="hero-photo" src={siteImages.home.hero} alt="Colorful illustrated artwork in a frame" />
        <div className="hero-copy">
          <h1>YOUR MEMORIES,<br />BEAUTIFULLY FRAMED</h1>
          <p>Quality frames for your photos, certificates, artworks and special memories</p>
          <div className="button-row">
            <Link className="button button-brown" to="/frames">View Our Frames</Link>
            <Link className="button button-teal" to="/contact">Contact US</Link>
          </div>
        </div>
      </section>
      <section className="home-frame-grid" aria-label="Featured frames">
        {frameCards.map((card) => (
          <Link className="home-frame-card" key={card.title} to="/frames">
            <img src={card.image} alt={card.alt} loading="lazy" />
            <h2>{card.title}</h2>
            <p>A single Modern Design for your Frame Pictures</p>
          </Link>
        ))}
      </section>
      <section className="home-why-section">
        <h2>Why Choose Us?</h2>
        <div className="home-benefit-icons" aria-label="Quality, value, creativity, and care">
          {siteImages.home.benefits.map((src, index) => (
            <img key={src} src={src} alt={['Quality', 'Value', 'Creativity', 'Care'][index]} loading="lazy" />
          ))}
        </div>
        <div className="home-showcase-panels">
          <div className="home-photo-panel" aria-label="Featured frame styles">
            {showcaseImages.map((src, index) => (
              <img key={src} src={src} alt={['Landscape in a black frame', 'Sunset in a wooden frame', 'Flowers in an ornate frame'][index]} loading="lazy" />
            ))}
          </div>
          <div className="home-workflow-panel" aria-label="Shopping workflow: cart, photo, settings, confirmation">
            {workflowImages.map((src, index) => (
              <span className="workflow-step" key={src}>
                <img src={src} alt={['Shopping cart', 'Photo', 'Settings', 'Confirmed'][index]} loading="lazy" />
                {index < workflowImages.length - 1 && <span className="workflow-arrow" aria-hidden="true">→</span>}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className="home-reviews">
        <h2>Customer Reviews</h2>
        <div className="home-review-card">
          <span className="home-review-quote" aria-hidden="true">“</span>
          <p>“Beautiful frames High quality and fast delivery!”<br /><span>—Happy Customer</span></p>
          <span className="home-review-stars" aria-label="Five stars">
            {siteImages.home.reviewStars.map((src) => <img key={src} src={src} alt="" loading="lazy" />)}
          </span>
        </div>
      </section>
    </div>
  );
}

function FramesPage() {
  const [catalog] = useProductCatalog();
  return (
    <div className="content-page">
      <PageIntro eyebrow="THE FRAME COLLECTION" title="Find the frame that feels like you" copy="Thoughtful shapes, warm finishes, and beautiful details for your favorite things." />
      <div className="product-grid">{catalog.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="content-page about-page">
      <section className="about-hero">
        <div><Eyebrow>ABOUT US</Eyebrow><h1>Turning Your Memories Into Beautiful Frames</h1><p>At jielikx Frame Shop, We believe that every moment deserves to be remembered. We Create high-quality, stylish, and durable frames that bring your photos, art and special memories to life. Whether it’s for your home, office or a gift, we’re here to help you frame what matters most.</p><span className="script-line">Your memories<br />our frames</span></div>
        <img className="about-photo about-hero-photo" src={siteImages.about.hero} alt="A framed family portrait" />
      </section>
      <section className="story-card about-story-card"><img className="about-photo" src={siteImages.about.story} alt="A family sharing a meaningful moment" loading="lazy" /><div><Eyebrow>OUR STORY</Eyebrow><h2>Frames for the stories you keep</h2><p>Jielikx Frame Shop was created with the idea of making every special memory more meaningful through beautiful and carefully selected frames.</p></div></section>
      <section className="mission-grid">
        <article className="soft-card"><Eyebrow>WHAT WE BELIEVE</Eyebrow><h2>Our Mission &amp; vision</h2><div className="two-col-copy"><div><h3><img className="about-small-icon" src={siteImages.about.missionIcon} alt="" />Mission</h3><p>To provide beautiful and quality frames that preserve meaningful memories.</p></div><div><h3><img className="about-small-icon" src={siteImages.about.visionIcon} alt="" />Vision</h3><p>To become a trusted frame shop known for creativity, quality, and beautiful designs.</p></div></div></article>
        <article className="soft-card about-story-detail"><img className="about-photo" src={siteImages.about.missionPhoto} alt="A framed photograph in a warm home setting" loading="lazy" /><div><Eyebrow>MADE WITH CARE</Eyebrow><h2>Our Story</h2><p>We offer more than just frames — we provide quality, style, and a personal touch. From modern designs to timeless classics, we have the perfect frame for your home, your achievements, and your most cherished memories.</p></div></article>
      </section>
      <section className="benefit-grid about-benefits">
        {['Quality Materials', 'Variety of Frame Designs', 'Frames for every Occasion'].map((item, index) => <div className="benefit-card" key={item}><img className="benefit-icon" src={siteImages.about.benefits[index]} alt="" loading="lazy" /><span>0{index + 1}</span><h3>{item}</h3></div>)}
      </section>
    </div>
  );
}

function ContactPage() {
  const [feedback, setFeedback] = useState('');
  const settings = getStored(ADMIN_SETTINGS_KEY, {});
  const address = String(settings.address || DEFAULT_SHOP_ADDRESS).trim();
  const phone = String(settings.phone || DEFAULT_SHOP_PHONE).trim();
  const email = String(settings.email || DEFAULT_SHOP_EMAIL).trim();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Binalonan, Pangasinan, Philippines`)}`;
  return (
    <div className="content-page">
      <section className="contact-banner" style={{ backgroundImage: `linear-gradient(120deg, #f4e0ced9, #fff8f2d9), url("${siteImages.contact.background}")` }}><Eyebrow>CONTACT US</Eyebrow><h1>We’d Love to Hear From you</h1><p>Have a question suggestion, or Need assistance? Feel free to reach out to us. We’re here to help.</p></section>
      <div className="contact-layout">
        <aside className="contact-info soft-card">
          <h2>Get In Touch</h2>
          <dl>
            <div className="contact-detail"><img src={siteImages.contact.details[0]} alt="" loading="lazy" /><dt>Phone</dt><dd><a href={`tel:${phone.trim().startsWith('+') ? '+' : ''}${phone.replace(/\D/g, '')}`}>{phone}</a></dd></div>
            <div className="contact-detail"><img src={siteImages.contact.details[1]} alt="" loading="lazy" /><dt>Email</dt><dd><a href={`mailto:${email}`}>{email}</a></dd></div>
            <div className="contact-detail"><img src={siteImages.contact.details[2]} alt="" loading="lazy" /><dt>Address</dt><dd><a href={mapUrl} target="_blank" rel="noreferrer">{address}</a></dd></div>
            <div className="contact-detail"><img src={siteImages.contact.details[3]} alt="" loading="lazy" /><dt>Business Hours</dt><dd>9:00AM- 4:00PM</dd></div>
          </dl>
          <hr /><h3>Follow us</h3><div className="contact-social-icons">{siteImages.contact.social.map((src) => <img key={src} src={src} alt="Social media" loading="lazy" />)}</div>
          <a className="contact-map-link" href={mapUrl} target="_blank" rel="noreferrer" aria-label={`View ${address} on Google Maps`}>
            <img className="contact-photo" src={siteImages.contact.photo} alt={`Jielikx Frame Shop at ${address}`} loading="lazy" />
            <span>View on maps <span aria-hidden="true">↗</span></span>
          </a>
        </aside>
        <form className="form-card contact-form" onSubmit={(event) => { event.preventDefault(); setFeedback('Thanks for your message. This frontend demo does not send messages to the shop.'); }}>
          <h2>Send Us a Message</h2><p>Fill out the form Below and we’ll get back to you as soon as possible.</p>
          <div className="form-grid two-columns">
            <Field label="Your Name" name="name" required />
            <Field label="Your Email" name="email" type="email" required />
          </div>
          <Field label="Subject" name="subject" required />
          <Field label="Message" name="message" as="textarea" required />
          <button className="button button-brown" type="submit">Send message　➝</button>
          {feedback && <p className="form-feedback" role="status">{feedback}</p>}
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, type = 'text', required = false, as = 'input', ...props }) {
  const id = props.id || name;
  return (
    <label className="field" htmlFor={id}>
      <span>{label}{required ? ' *' : ''}</span>
      {as === 'textarea'
        ? <textarea id={id} name={name} required={required} rows="5" {...props} />
        : <input id={id} name={name} type={type} required={required} {...props} />}
    </label>
  );
}

function PasswordField({ label, name, required = false, ...props }) {
  const [isVisible, setIsVisible] = useState(false);
  const id = props.id || name;
  return (
    <div className="field">
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      <div className="password-input-wrap">
        <input id={id} name={name} type={isVisible ? 'text' : 'password'} required={required} {...props} />
        <button
          className="password-toggle"
          type="button"
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}

const accountLinks = [
  ['/account/profile', 'My profile'],
  ['/account/orders', 'My Orders'],
  ['/account/payment-methods', 'Payment Methods'],
  ['/account/settings', 'Settings'],
  ['/account/help', 'Help & Support'],
];

function AccountLayout({ active, children }) {
  const navigate = useNavigate();
  function signOut() {
    localStorage.removeItem(SESSION_KEY);
    navigate('/login', { replace: true });
  }
  return (
    <div className="account-page content-page">
      <PageIntro eyebrow="YOUR ACCOUNT" title={active} copy="A little about you, and everything for your next meaningful frame." />
      <div className="account-layout">
        <aside className="account-nav soft-card">
          <Eyebrow>MY ACCOUNT</Eyebrow>
          {accountLinks.map(([to, label]) => <Link className={active === label ? 'selected' : ''} key={to} to={to}>{label}</Link>)}
          <button className="account-signout" onClick={signOut}>Sign Out</button>
          <hr /><p>Made for your memories.</p><small>Your frames. Your own little story.</small>
        </aside>
        <div className="account-content">{children}</div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [feedback, setFeedback] = useState('');
  const profile = getCurrentProfile();
  function saveProfile(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    try {
      saveCurrentProfile(Object.fromEntries(new FormData(form).entries()));
      setFeedback('Your details were saved in this browser demo.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Your details could not be saved.');
    }
  }
  return (
    <AccountLayout active="My profile">
      <form className="form-card" onSubmit={saveProfile}>
        <h2>Personal information</h2><p>Keep your details up to date for a smoother checkout.</p>
        <div className="form-grid two-columns">
          <Field label="First name" name="firstName" placeholder="Maria" defaultValue={profile.firstName || ''} required />
          <Field label="Last name" name="lastName" placeholder="Santos" defaultValue={profile.lastName || ''} required />
          <Field label="Email address" name="email" type="email" placeholder="maria.santos@example.com" defaultValue={profile.email || ''} required />
          <Field label="Phone number" name="phone" placeholder="Add your phone number" defaultValue={profile.phone || ''} />
        </div>
        <div className="button-row form-actions"><small>Your details are kept in this browser demo.</small><button className="button button-dark" type="submit">Save changes</button></div>
        {feedback && <p className="form-feedback" role="status">{feedback}</p>}
      </form>
      <div className="card-grid two-columns">
        <article className="form-card"><h2>My Orders</h2><p>Every frame, in one place.</p><p>Follow your orders and revisit the pieces you picked for your special moments.</p><Link className="button button-light" to="/account/orders">View my orders</Link></article>
        <article className="form-card peach-card"><h2>Payment Methods</h2><p>Cash on delivery is available at checkout.</p><Link className="button button-light" to="/account/payment-methods">View payment methods</Link></article>
      </div>
    </AccountLayout>
  );
}

function OrdersPage() {
  const email = normalizeEmail(getStored(SESSION_KEY, ''));
  const orders = getAdminOrders().filter((order) => order.customerEmail === email);
  return (
    <AccountLayout active="My Orders">
      <section className="form-card"><h2>My Orders</h2><p>Follow your orders and revisit the pieces you picked for your special moments.</p><DemoNotice />
        {orders.length ? orders.map((order) => <div className="order-list-item" key={order.id}><div><strong>{order.items.map((item) => item.name).join(', ')}</strong><p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} frame(s) · Cash on delivery · {order.id}</p></div><strong>{formatPrice(order.total)}</strong><Link to={`/order-confirmation/${order.items[0].slug}`}>View order</Link></div>)
          : <div className="empty-state"><span className="empty-icon">♡</span><h3>No demo orders yet</h3><p>Your demo order will appear here after you complete checkout.</p><Link className="button button-dark" to="/frames">Explore frames</Link></div>}
      </section>
    </AccountLayout>
  );
}

function PaymentMethodsPage() {
  return <AccountLayout active="Payment Methods"><section className="form-card"><h2>Payment Methods</h2><p>Choose a payment method for your frame order.</p><div className="payment-choice"><span className="radio-dot" /><div><strong>Cash on delivery</strong><p>Pay when your frame arrives.</p></div><span className="payment-badge">Available</span></div><DemoNotice>Payment handling is not connected. Cash on delivery is the payment method shown in this demo.</DemoNotice></section></AccountLayout>;
}

function SettingsPage() {
  const [message, setMessage] = useState('');
  const preferences = getStored(PREFERENCES_KEY, { orderUpdates: true, shopNews: false });
  return <AccountLayout active="Settings"><form className="form-card" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); saveStored(PREFERENCES_KEY, { orderUpdates: data.has('orderUpdates'), shopNews: data.has('shopNews') }); setMessage('Your preferences were saved in this browser demo.'); }}><h2>Settings</h2><p>Manage your account preferences.</p><label className="check-row"><input type="checkbox" name="orderUpdates" defaultChecked={preferences.orderUpdates} /> <span>Email me about order updates</span></label><label className="check-row"><input type="checkbox" name="shopNews" defaultChecked={preferences.shopNews} /> <span>Send me occasional shop news</span></label><button className="button button-dark" type="submit">Save settings</button>{message && <p className="form-feedback" role="status">{message}</p>}<DemoNotice /></form></AccountLayout>;
}

function HelpPage() {
  return <AccountLayout active="Help & Support"><div className="card-stack"><section className="form-card peach-card"><h2>How can I help?</h2><p>Questions about an order, payment, or finding the right frame?</p><div className="button-row"><Link className="button button-dark" to="/contact">Contact the shop</Link><Link className="button button-light" to="/account/orders">View my orders</Link></div></section><section className="form-card"><h2>A few helpful answers</h2><div className="faq"><strong>When will my frame arrive?</strong><span>Standard delivery takes 3–5 business days.</span></div><div className="faq"><strong>How do I pay for my order?</strong><span>Pay the courier in cash when your frame arrives.</span></div><div className="faq"><strong>Where can I view my order details?</strong><span>Open My Orders and select View order for your frame.</span></div></section></div></AccountLayout>;
}

function AuthPage({ type }) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = {
    login: { eyebrow: 'YOUR ACCOUNT', title: 'Login to your account', description: 'Find your favorites and follow your frame orders.', button: 'Login', image: siteImages.auth.login },
    signup: { eyebrow: 'YOUR ACCOUNT', title: 'Create your account', description: 'Save your details for a smoother framing journey.', button: 'Sign up', image: siteImages.auth.signup },
    forgot: { eyebrow: 'ACCOUNT HELP', title: 'Forgot your password?', description: 'Enter your email address and we’ll show the next demo step.', button: 'Continue', image: siteImages.auth.forgot },
    reset: { eyebrow: 'ACCOUNT HELP', title: 'Reset your password', description: 'Choose a new password for this frontend demo.', button: 'Save password', image: siteImages.auth.reset },
  }[type];
  const isForgot = type === 'forgot';
  const isReset = type === 'reset';
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (type === 'signup' && values.password !== values.confirmPassword) {
      setFeedback('The passwords do not match.');
      return;
    }
    if (isReset && values.password !== values.confirmPassword) {
      setFeedback('The passwords do not match.');
      return;
    }
    if (isForgot) {
      setFeedback('Demo only: no reset email was sent.');
      return;
    }
    if (isReset) {
      setFeedback('Password update is not connected to an authentication service.');
      return;
    }
    setFeedback('');
    setIsSubmitting(true);
    const email = normalizeEmail(values.email);
    const users = getStored(USERS_KEY, {});
    if (!users || typeof users !== 'object' || Array.isArray(users)) {
      setFeedback("Account data in this browser is invalid. Please clear this site's saved data and try again.");
      setIsSubmitting(false);
      return;
    }

    if (type === 'signup') {
      if (users?.[email]) {
        setFeedback('An account with that email already exists. Please log in.');
        setIsSubmitting(false);
        return;
      }

      let salt;
      let passwordHash;
      try {
        salt = createPasswordSalt();
        passwordHash = await hashPassword(values.password, salt);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Password could not be saved in this browser.');
        setIsSubmitting(false);
        return;
      }

      const legacyProfile = getStored(ACCOUNT_KEY, {});
      const savedProfile = normalizeEmail(legacyProfile?.email) === email ? legacyProfile : {};
      const nameParts = String(values.name).trim().split(/\s+/);
      const profile = {
        ...savedProfile,
        email: savedProfile.email || String(values.email).trim(),
        name: String(values.name).trim(),
        firstName: savedProfile.firstName || nameParts[0] || '',
        lastName: savedProfile.lastName || nameParts.slice(1).join(' '),
      };
      users[email] = { salt, passwordHash, profile };
      try {
        saveStored(USERS_KEY, users);
        saveStored(SESSION_KEY, email);
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Your account could not be saved in this browser.');
        setIsSubmitting(false);
        return;
      }
      navigate('/');
      return;
    }

    const user = users?.[email];
    if (!user || typeof user.salt !== 'string' || typeof user.passwordHash !== 'string') {
      setFeedback('Incorrect email or password. If you have not signed up, create an account first.');
      setIsSubmitting(false);
      return;
    }

    let passwordHash;
    try {
      passwordHash = await hashPassword(values.password, user.salt);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Password could not be verified in this browser.');
      setIsSubmitting(false);
      return;
    }
    if (!passwordHashesMatch(user.passwordHash, passwordHash)) {
      setFeedback('Incorrect email or password. Please try again.');
      setIsSubmitting(false);
      return;
    }
    try {
      saveStored(SESSION_KEY, email);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Your session could not be saved in this browser.');
      setIsSubmitting(false);
      return;
    }
    navigate('/');
  }
  return (
    <div className="auth-page content-page">
      <section className="auth-story"><Eyebrow>YOUR MEMORIES, BEAUTIFULLY FRAMED</Eyebrow><h1>Welcome back to<br />what matters most.</h1><img className="auth-photo" src={copy.image} alt="Family portrait displayed in a wooden frame" /><h2>Beautiful frames. Meaningful moments.</h2><p>Quality frames for your photos, certificates, artworks and special memories.</p></section>
      <form className="auth-card" onSubmit={submit}>
        <Eyebrow>{copy.eyebrow}</Eyebrow><h2>{copy.title}</h2><p>{copy.description}</p>
        {(type === 'signup') && <Field label="Your name" name="name" autoComplete="name" required />}
        <Field label="Email address" name="email" type="email" placeholder="Enter your email address" autoComplete="email" required />
        {!isForgot && <PasswordField label="Password" name="password" placeholder="Enter your password" autoComplete={isReset ? 'new-password' : 'current-password'} required />}
        {type === 'signup' && <PasswordField label="Confirm password" name="confirmPassword" placeholder="Re-enter your password" autoComplete="new-password" required />}
        {isReset && <PasswordField label="Confirm new password" name="confirmPassword" placeholder="Re-enter your new password" autoComplete="new-password" required />}
        {type === 'login' && <div className="auth-extra"><label className="check-row"><input type="checkbox" name="remember" />Remember me</label><Link to="/forgot-password">Forgot password?</Link></div>}
        <button className="button button-dark full-width" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : copy.button}</button>
        {feedback && <p className="form-feedback" role="status">{feedback}</p>}
        {isForgot && feedback && <Link className="text-link" to="/forgot-password/reset">Continue to reset demo password</Link>}
        <DemoNotice>Demo only: passwords are verified in this browser. This is not production-grade security, and account recovery is not connected.</DemoNotice>
        <div className="auth-switch">{type === 'login' ? <>Don’t have an account? <Link to="/signup">Sign up</Link></> : type === 'signup' ? <>Already have an account? <Link to="/login">Login</Link></> : <Link to="/login">Back to login</Link>}</div>
        {type === 'login' && <div className="auth-switch">Managing the shop? <Link to="/admin/login">Admin login</Link></div>}
      </form>
    </div>
  );
}

function ProductFromRoute() {
  const { slug } = useParams();
  const [catalog] = useProductCatalog();
  const product = catalog.find((item) => item.slug === slug);
  return product ? <CartPage product={product} /> : <NotFoundPage />;
}

function CartPage({ product }) {
  const navigate = useNavigate();
  const [catalog] = useProductCatalog();
  const [cart, setCart] = useState(() => getStored(CART_KEY, {}));

  useEffect(() => {
    if (localStorage.getItem(CART_KEY) === null && product) {
      const initialCart = { [product.slug]: 1 };
      setCart(initialCart);
      saveStored(CART_KEY, initialCart);
    }
  }, [product, cart]);

  function update(slug, amount) {
    const next = { ...cart };
    const quantity = (next[slug] || 0) + amount;
    if (quantity <= 0) delete next[slug];
    else next[slug] = quantity;
    setCart(next);
    saveStored(CART_KEY, next);
  }
  const rows = catalog.filter((item) => cart[item.slug] > 0);
  const count = rows.reduce((sum, item) => sum + cart[item.slug], 0);
  const subtotal = rows.reduce((sum, item) => sum + item.price * cart[item.slug], 0);
  const shipping = count ? 80 : 0;
  return (
    <div className="content-page commerce-page">
      <div className="breadcrumb"><Link to="/">Home</Link> / Shopping cart</div>
      <div className="commerce-heading"><h1>Your cart</h1><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
      <p className="commerce-subtitle">A little closer to framing your favorite moments.</p>
      <div className="commerce-layout">
        <section className="form-card cart-items"><div className="table-heading"><span>Product</span><span>Total</span></div>
          {rows.length ? rows.map((item) => <div className="cart-row" key={item.slug}>
            <ProductArtwork product={item} variant="cart" compact />
            <div className="cart-product-copy"><h2>{item.name}</h2><p>{item.description}</p><strong>{formatPrice(item.price)}</strong><div className="quantity-control"><button aria-label={`Decrease ${item.name} quantity`} onClick={() => update(item.slug, -1)}>−</button><span>{cart[item.slug]}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => update(item.slug, 1)}>+</button></div><button className="text-button" onClick={() => update(item.slug, -cart[item.slug])}>Remove</button></div>
            <strong className="row-total">{formatPrice(item.price * cart[item.slug])}</strong>
          </div>) : <div className="empty-state"><h2>Your cart is empty</h2><p>Choose a frame to get started.</p><Link className="button button-dark" to="/frames">Browse frames</Link></div>}
          <Link className="button button-light" to="/frames">Continue shopping</Link>
        </section>
        <aside className="form-card order-summary"><h2>Order summary</h2><p>{count} {count === 1 ? 'item' : 'items'}</p><hr /><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Standard delivery</span><span>{formatPrice(shipping)}</span></div><small>3–5 business days</small><hr /><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal + shipping)}</strong></div><small>PHP · Includes delivery</small>
          {count > 0 && <button className="button button-dark full-width" onClick={() => navigate(`/checkout/${(product && cart[product.slug] ? product : rows[0]).slug}`)}>Proceed to checkout</button>}
          <div className="notice-box"><strong>Cash on delivery available</strong><span>Review your delivery details and payment method at checkout.</span></div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [catalog] = useProductCatalog();
  const product = catalog.find((item) => item.slug === slug);
  const [cart, setCart] = useState(() => getStored(CART_KEY, {}));
  const [feedback, setFeedback] = useState('');
  const profile = getCurrentProfile();

  useEffect(() => {
    if (!product) return;
    if (!cart[slug]) {
      const next = Object.values(cart).some((quantity) => quantity > 0) ? cart : { [slug]: 1 };
      if (!next[slug]) next[slug] = 1;
      setCart(next);
      saveStored(CART_KEY, next);
    }
  }, [cart, product, slug]);

  if (!product) return <NotFoundPage />;
  const rows = catalog.filter((item) => cart[item.slug] > 0);
  const count = rows.reduce((sum, item) => sum + cart[item.slug], 0);
  const subtotal = rows.reduce((sum, item) => sum + item.price * cart[item.slug], 0);
  const shipping = count ? 80 : 0;

  function submit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const firstName = String(values.firstName).trim();
    const lastName = String(values.lastName).trim();
    const customer = `${firstName} ${lastName}`.trim();
    const customerEmail = normalizeEmail(getStored(SESSION_KEY, ''));
    const phone = String(values.phone).trim();
    const createdAt = new Date().toISOString();
    const order = {
      createdAt,
      items: rows.map((item) => ({ slug: item.slug, name: item.name, description: item.description, price: item.price, quantity: cart[item.slug] })),
      subtotal,
      shipping,
      total: subtotal + shipping,
      demo: true,
    };
    const adminOrder = {
      ...order,
      id: `#${Date.now()}`,
      customer,
      customerEmail,
      phone,
      date: new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Processing',
    };
    try {
      saveCurrentProfile({
        ...profile,
        firstName,
        lastName,
        name: customer,
        email: customerEmail,
        phone,
      });
      saveStored(ADMIN_ORDERS_KEY, [adminOrder, ...getAdminOrders()]);
      saveStored(ORDER_KEY, adminOrder);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Your order could not be saved in this browser.');
      return;
    }
    localStorage.removeItem(CART_KEY);
    navigate(`/order-confirmation/${slug}`);
  }

  return (
    <div className="content-page commerce-page">
      <div className="breadcrumb"><Link to="/frames">‹　Continue shopping</Link></div>
      <div className="commerce-heading"><h1>Checkout</h1><span>01　Details　/　02　Place order</span></div>
      <p className="commerce-subtitle">A few details, and your next favorite frame is on its way.</p>
      <div className="commerce-layout checkout-layout">
        <form className="form-card checkout-form" onSubmit={submit}>
          <fieldset><legend>1. Contact information</legend><Field label="Email address" name="email" type="email" defaultValue={profile.email || ''} placeholder="you@example.com" readOnly required /><small>This order is saved under your signed-in account.</small></fieldset>
          <fieldset><legend>2. Delivery address</legend><div className="form-grid two-columns"><Field label="First name" name="firstName" defaultValue={profile.firstName || String(profile.name || '').split(/\s+/)[0] || ''} required /><Field label="Last name" name="lastName" defaultValue={profile.lastName || String(profile.name || '').split(/\s+/).slice(1).join(' ')} required /></div><Field label="Phone number" name="phone" type="tel" placeholder="+63 912 345 6789" defaultValue={profile.phone || ''} required /><Field label="Street address" name="street" placeholder="House number, street and barangay" required /><Field label="Apartment, unit, etc. (optional)" name="apartment" /><div className="form-grid three-columns"><Field label="City / municipality" name="city" required /><Field label="Province" name="province" required /><Field label="Postal code" name="postalCode" required /></div><small>Country / region: Philippines</small></fieldset>
          <fieldset><legend>3. Payment method</legend><label className="payment-choice"><input type="radio" name="payment" value="Cash on delivery" defaultChecked /><img className="payment-choice-icon" src={product.checkoutPaymentIcon} alt="" /><span><strong>Cash on delivery</strong><small>Pay when your frame arrives.</small></span></label></fieldset>
          <p className="fine-print">Review your details before placing your order.</p>
          <button className="button button-dark full-width" type="submit">Place order · {formatPrice(subtotal + shipping)}</button>
          {feedback && <p className="form-feedback" role="alert">{feedback}</p>}
          <DemoNotice>Placing the order creates a local demo confirmation only. No email, payment, or fulfillment service is connected.</DemoNotice>
        </form>
        <aside className="form-card order-summary"><h2>Your order</h2><p>{count} {count === 1 ? 'item' : 'items'}</p>{rows.map((item) => <div className="summary-product" key={item.slug}><ProductArtwork product={item} variant="checkout" compact /><div><strong>{item.name}</strong><small>Qty　{cart[item.slug]}</small></div><strong>{formatPrice(item.price * cart[item.slug])}</strong></div>)}<hr /><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Standard delivery</span><span>{formatPrice(shipping)}</span></div><small>3–5 business days</small><hr /><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(subtotal + shipping)}</strong></div><small>PHP · Cash on delivery</small></aside>
      </div>
    </div>
  );
}

function ConfirmationPage() {
  const { slug } = useParams();
  const [catalog] = useProductCatalog();
  const fallbackProduct = catalog.find((item) => item.slug === slug);
  const order = getStored(ORDER_KEY, null);
  if (!fallbackProduct) return <NotFoundPage />;
  const items = order?.items?.length ? order.items : [{ slug, name: fallbackProduct.name, description: fallbackProduct.description, price: fallbackProduct.price, quantity: 1 }];
  const subtotal = order?.subtotal ?? fallbackProduct.price;
  const shipping = order?.shipping ?? 80;
  const total = order?.total ?? subtotal + shipping;
  return (
    <div className="content-page confirmation-page">
      <section className="confirmation-hero"><img className="confirmation-check-image" src={fallbackProduct.confirmationIcon} alt="Order confirmed" /><Eyebrow>{order?.demo ? 'DEMO ORDER SAVED' : 'CHECKOUT PREVIEW'}</Eyebrow><h1>Order confirmed</h1><h2>Thank you for your order!</h2><p>Your next favorite frame will soon be on its way.<br />A confirmation and order updates will not be sent from this demo.</p><div className="steps">01　Details　/　02　Place order　/　03　Confirmed</div></section>
      <div className="commerce-layout confirmation-layout">
        <section className="card-stack"><article className="form-card"><h2>What happens next</h2><ol className="next-steps"><li><strong>We’re preparing your frame</strong><span>Your frame will be carefully packed for its journey.</span></li><li><strong>Watch your inbox</strong><span>In a real store, you’d receive an update when your order is dispatched.</span></li><li><strong>Enjoy your meaningful moments</strong><span>Standard delivery takes 3–5 business days.</span></li></ol></article><div className="notice-box reminder"><strong>A little reminder</strong><span>Please have the exact order total ready for cash on delivery.<br />Your frame is made for the moments that matter.</span></div><Link className="button button-dark align-start" to="/frames">Continue shopping</Link><Link className="text-link" to="/contact">Need help? Contact Us</Link><DemoNotice>No order ID is generated and no production order was submitted.</DemoNotice></section>
        <aside className="form-card order-summary"><h2>Your order</h2><p>{items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p>{items.map((item) => <div className="summary-product" key={item.slug}><ProductArtwork product={catalog.find((product) => product.slug === item.slug) || fallbackProduct} variant="confirmation" compact /><div><strong>{item.name}</strong><small>Qty　{item.quantity}</small><strong>{formatPrice(item.price * item.quantity)}</strong></div></div>)}<hr /><p className="summary-label">Delivery</p><div className="summary-line"><span>Standard delivery</span><span>{formatPrice(shipping)}</span></div><small>3–5 business days</small><hr /><div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="summary-line"><span>Shipping</span><span>{formatPrice(shipping)}</span></div><hr /><div className="summary-line summary-total"><strong>Total</strong><strong>{formatPrice(total)}</strong></div><small>Cash on delivery</small></aside>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return <div className="content-page empty-state"><Eyebrow>PAGE NOT FOUND</Eyebrow><h1>We couldn’t find that page.</h1><Link className="button button-dark" to="/">Return home</Link></div>;
}

function ProtectedAdmin() {
  return getStored(ADMIN_KEY, false) ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

function ProtectedCustomer() {
  return isCustomerSignedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

function GuestOnly() {
  return isCustomerSignedIn() ? <Navigate to="/" replace /> : <Outlet />;
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = [
    ['/admin', 'Overview'],
    ['/admin/orders', 'Orders'],
    ['/admin/inventory', 'Frames & inventory'],
    ['/admin/customers', 'Customers'],
    ['/admin/messages', 'Messages'],
    ['/admin/settings', 'Settings'],
  ];
  function logout() {
    localStorage.removeItem(ADMIN_KEY);
    navigate('/admin/login');
  }
  return (
    <div className="admin-app">
      <header className="admin-header"><Brand /><strong>ADMIN WORKSPACE</strong><div><Link to="/">View shop</Link><button className="button button-dark" onClick={logout}>Log out</button></div></header>
      <div className="admin-layout">
        <aside className="admin-sidebar"><Brand /><Eyebrow>MANAGE YOUR SHOP</Eyebrow><nav aria-label="Admin navigation">{navigation.map(([to, label]) => <Link key={to} className={(location.pathname === to || (to === '/admin' && location.pathname === '/admin/')) ? 'selected' : ''} to={to}>{label}{label === 'Messages' && <span className="nav-count">5</span>}</Link>)}</nav><div className="admin-user"><strong>Jielikx Frame Shop</strong><small>Administrator · demo workspace</small><button className="text-button" onClick={logout}>Log out</button></div></aside>
        <main className="admin-main"><DemoNotice>Only orders placed by signed-in customers appear here. Orders and customer details are saved in this browser, not on a server.</DemoNotice><Outlet /></main>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState('');
  function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (normalizeEmail(values.email) !== ADMIN_EMAIL || values.password !== ADMIN_PASSWORD) {
      setFeedback('Incorrect administrator email or password.');
      return;
    }
    try {
      saveStored(ADMIN_KEY, true);
      navigate('/admin');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The administrator session could not be saved in this browser.');
    }
  }
  return <div className="admin-login-page"><Brand /><form className="auth-card" onSubmit={submit}><img className="admin-login-photo" src={siteImages.auth.admin} alt="Family portrait displayed in a wooden frame" /><Eyebrow>ADMIN WORKSPACE</Eyebrow><h1>Shop admin</h1><p>Sign in to manage the demo storefront workspace.</p><Field label="Email address" name="email" type="email" autoComplete="username" required /><Field label="Password" name="password" type="password" autoComplete="current-password" required /><button className="button button-dark full-width">Sign in</button>{feedback && <p className="form-feedback" role="alert">{feedback}</p>}<DemoNotice>This is frontend-only demo authentication, not production-grade security.</DemoNotice><Link to="/">Return to shop</Link></form></div>;
}

function AdminPageHeading({ eyebrow, title, copy, action }) {
  return <div className="admin-page-heading"><div><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{copy}</p></div>{action}</div>;
}

function StatCards({ stats }) {
  return <div className="stat-grid">{stats.map(([label, value, note]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>;
}

function DashboardPage() {
  const [catalog] = useProductCatalog();
  const orders = getAdminOrders();
  const customers = getAdminCustomers(orders);
  const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const trackedStock = catalog.filter((product) => Number.isInteger(product.stock));
  const lowStock = trackedStock.filter((product) => product.stock < 5);
  const soldByFrame = new Map();
  for (const order of orders) {
    for (const item of order.items) {
      soldByFrame.set(item.slug, (soldByFrame.get(item.slug) || 0) + item.quantity);
    }
  }
  const popularFrames = Array.from(soldByFrame, ([slug, sold]) => ({
    product: catalog.find((item) => item.slug === slug),
    sold,
  })).filter((item) => item.product).sort((first, second) => second.sold - first.sold).slice(0, 3);
  return <>
    <AdminPageHeading eyebrow="SHOP OVERVIEW" title="Welcome back, Admin" copy="Here’s what’s happening at your frame shop today." action={<span className="pill">This month</span>} />
    <StatCards stats={ [['Total sales', formatPrice(totalSales), 'From customer orders'], ['Orders', orders.length, 'Orders placed by customers'], ['Total customers', customers.length, 'Customers with an order'], ['Frames in shop', catalog.length, 'Available on the storefront']] } />
    <div className="admin-dashboard-grid">
      <section className="admin-card"><div className="card-heading"><h2>Recent orders</h2><Link to="/admin/orders">View all</Link></div><DataTable columns={['Order', 'Customer', 'Frame / item', 'Total', 'Status']} rows={orders.slice(0, 4).map((order) => [order.id, order.customer, order.items.map((item) => item.name).join(', '), formatPrice(order.total), <StatusBadge key={order.id} value={order.status} />])} /></section>
      <section className="admin-card"><div className="card-heading"><h2>Low-stock items</h2><Link to="/admin/inventory">View inventory</Link></div>{lowStock.length ? lowStock.map((product) => <div className="low-stock-row" key={product.slug}><span className="swatch" /><strong>{product.name}</strong><span>{product.stock} left</span></div>) : <p>No tracked products are below 5 pieces.</p>}</section>
    </div>
    <section className="admin-card"><div className="card-heading"><h2>Popular frames</h2><span>From customer orders</span></div>{popularFrames.length ? <div className="popular-frame-grid">{popularFrames.map(({ product, sold }) => <article className="popular-frame-card" key={product.slug}><img src={product.image} alt={`${product.name} product`} loading="lazy" /><strong>{product.name}</strong><small>{sold} sold</small></article>)}</div> : <p>No frame sales yet. Completed customer orders will appear here.</p>}</section>
  </>;
}

function StatusBadge({ value }) {
  return <span className={`status-badge ${value.toLowerCase().replaceAll(' ', '-')}`}>{value}</span>;
}

function DataTable({ columns, rows }) {
  return <div className="table-scroll"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>) : <tr><td className="table-empty" colSpan={columns.length}>No matching records.</td></tr>}</tbody></table></div>;
}

function OrdersAdminPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const orders = getAdminOrders();
  const filtered = useMemo(() => orders.filter((order) => `${order.id} ${order.customer} ${order.items.map((item) => item.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || order.status === status)), [orders, query, status]);
  function exportRows() {
    const header = ['Order', 'Customer', 'Frame', 'Size', 'Date', 'Total', 'Status'];
    const csvRows = [header, ...filtered.map((order) => [order.id, order.customer, order.items.map((item) => item.name).join('; '), order.items.map((item) => item.description).join('; '), order.date, order.total, order.status])];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jielikx-demo-orders.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
  return <>
    <AdminPageHeading eyebrow="ORDER MANAGEMENT" title="Orders" copy="Track every frame, from confirmation to pickup." action={<button className="button button-dark" onClick={exportRows}>Export orders</button>} />
    <StatCards stats={ [['All orders', orders.length, 'Placed by signed-in customers'], ['Processing', orders.filter((order) => order.status === 'Processing').length, 'Orders need attention'], ['Ready for pickup', orders.filter((order) => order.status === 'Ready for pickup').length, 'Notify your customers'], ['Completed', orders.filter((order) => order.status === 'Completed').length, 'Successfully fulfilled']] } />
    <section className="admin-card"><div className="card-heading"><h2>All orders</h2><Link to="/admin/export-orders-preview">Open export preview</Link></div><div className="filter-row"><input aria-label="Search order ID or customer" placeholder="Search order ID or customer" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>{['All statuses', 'Processing', 'Ready for pickup', 'Completed'].map((value) => <option key={value}>{value}</option>)}</select><span>{filtered.length} shown · {orders.length} total</span></div><DataTable columns={['Order', 'Customer', 'Frame / item', 'Date', 'Total', 'Status']} rows={filtered.map((order) => [order.id, order.customer, order.items.map((item) => item.name).join(', '), order.date, formatPrice(order.total), <StatusBadge key={order.id} value={order.status} />])} /></section>
  </>;
}

function InventoryAdminPage() {
  const [catalog, updateCatalog] = useProductCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [isAdding, setIsAdding] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [editingStockSlug, setEditingStockSlug] = useState('');
  const [stockValue, setStockValue] = useState('');
  const items = catalog.map((item, index) => ({
    ...item,
    sku: item.sku || `CAT-${String(index + 1).padStart(3, '0')}`,
    size: item.size || '—',
    category: item.category || item.tone || 'General',
    stock: Number.isInteger(item.stock) ? item.stock : null,
  }));
  const categories = [...new Set(items.map((item) => item.category))].sort();
  const filtered = items
    .filter((item) => `${item.name} ${item.sku}`.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => category === 'All categories' || item.category === category);
  const trackedStock = items.filter((item) => Number.isInteger(item.stock));
  const lowStock = trackedStock.filter((item) => item.stock < 5);
  const totalStock = trackedStock.reduce((total, item) => total + item.stock, 0);

  function startStockEdit(item) {
    setEditingStockSlug(item.slug);
    setStockValue(String(item.stock ?? 0));
    setFeedback('');
  }

  function saveStock(event, item) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const stock = Number(stockValue);
    if (!Number.isInteger(stock) || stock < 0) {
      setFeedback('Stock must be a whole number equal to or greater than zero.');
      return;
    }
    const nextCatalog = catalog.map((product) => product.slug === item.slug ? { ...product, stock } : product);
    try {
      updateCatalog(nextCatalog);
      setFeedback(`${item.name} stock updated.`);
      setEditingStockSlug('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Stock could not be saved in this browser.');
    }
  }

  async function handleImageChange(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      setNewImage('');
      return;
    }
    if (!file.type.startsWith('image/')) {
      input.value = '';
      setFeedback('Choose an image file for the new frame.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      input.value = '';
      setFeedback('Choose an image smaller than 10 MB.');
      return;
    }
    setFeedback('');
    setIsPreparingImage(true);
    try {
      setNewImage(await prepareProductImage(file));
    } catch (error) {
      setNewImage('');
      input.value = '';
      setFeedback(error instanceof Error ? error.message : 'The image could not be prepared.');
    } finally {
      setIsPreparingImage(false);
    }
  }

  function addProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (!newImage) {
      setFeedback('Choose a product image before adding this frame.');
      return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const name = String(values.name).trim();
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `frame-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 2;
    while (catalog.some((product) => product.slug === slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    const nextSku = catalog.reduce((highest, product) => {
      const match = /^FRM-(\d+)$/.exec(product.sku || '');
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1;
    const product = {
      slug,
      sku: `FRM-${String(nextSku).padStart(3, '0')}`,
      name,
      description: String(values.description).trim(),
      category: String(values.category).trim(),
      tone: String(values.category).trim().toLowerCase(),
      size: String(values.size).trim(),
      price: Number(values.price),
      stock: Number(values.stock),
      image: newImage,
      cartImage: newImage,
      checkoutImage: newImage,
      checkoutPaymentIcon: catalog[0]?.checkoutPaymentIcon || siteImages.contact.details[0],
      confirmationImage: newImage,
      confirmationIcon: catalog[0]?.confirmationIcon || siteImages.contact.details[0],
    };
    try {
      updateCatalog([...catalog, product]);
      setFeedback(`${name} was added to the storefront frames.`);
      setIsAdding(false);
      setNewImage('');
      form.reset();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'The product could not be saved in this browser.');
    }
  }

  return <>
    <AdminPageHeading eyebrow="PRODUCT MANAGEMENT" title="Frames & inventory" copy="Products and stock here are shared with the storefront frames." action={<button className="button button-dark" onClick={() => { setIsAdding((open) => !open); setNewImage(''); setFeedback(''); }}>{isAdding ? 'Cancel' : 'Add frame'}</button>} />
    {feedback && <p className="form-feedback" role="status">{feedback}</p>}
    {isAdding && <form className="admin-card inventory-add-form" onSubmit={addProduct}>
      <div className="card-heading"><h2>Add frame to storefront</h2><span>Required fields marked *</span></div>
      <div className="form-grid two-columns">
        <Field label="Frame name" name="name" required />
        <Field label="Category" name="category" placeholder="e.g. Modern" required />
        <Field label="Size" name="size" placeholder="e.g. 8 × 10 in" required />
        <Field label="Price (₱)" name="price" type="number" min="0.01" step="0.01" required />
        <Field label="Stock quantity" name="stock" type="number" min="0" step="1" required />
        <label className="field" htmlFor="product-image"><span>Product image *</span><input id="product-image" name="image" type="file" accept="image/*" required={!newImage} onChange={handleImageChange} /><small>Images are resized before saving in this browser.</small></label>
      </div>
      <Field label="Description" name="description" as="textarea" required />
      {newImage && <img className="inventory-image-preview" src={newImage} alt="New frame preview" />}
      <button className="button button-dark" type="submit" disabled={isPreparingImage}>{isPreparingImage ? 'Preparing image…' : 'Add to storefront'}</button>
    </form>}
    <StatCards stats={ [['Tracked units', totalStock, `${trackedStock.length} frame styles with stock set`], ['Frame styles', catalog.length, 'Shared with the storefront'], ['Low-stock styles', lowStock.length, 'Below 5 pieces'], ['Out of stock', trackedStock.filter((item) => item.stock === 0).length, 'Tracked styles at zero']] } />
    {lowStock.length > 0 && <div className="notice-box inventory-alert"><strong>{lowStock.length} style{lowStock.length === 1 ? '' : 's'} running low</strong><span>{lowStock.map((item) => item.name).join(' · ')}</span></div>}
    <section className="admin-card"><div className="card-heading"><h2>Storefront frame collection</h2><span>{catalog.length} products</span></div><div className="filter-row"><input aria-label="Search frame name or SKU" placeholder="Search frame name or SKU" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filter category" value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><span>Edits are saved in this browser</span></div><DataTable columns={['Preview', 'Frame / SKU', 'Size', 'Category', 'Price', 'Stock', 'Action']} rows={filtered.map((item) => [<img key={item.sku} className="inventory-image" src={item.image} alt={`${item.name} preview`} loading="lazy" />, <><strong>{item.name}</strong><small className="table-subtext">{item.sku}</small></>, item.size, item.category, formatPrice(item.price), item.stock === null ? <span className="table-subtext">Not tracked</span> : <StatusBadge key={item.sku} value={`${item.stock} in stock`} />, editingStockSlug === item.slug ? <form key={`${item.sku}-stock-form`} className="stock-edit-form" onSubmit={(event) => saveStock(event, item)}><input aria-label={`${item.name} stock`} type="number" min="0" step="1" required value={stockValue} onChange={(event) => setStockValue(event.target.value)} /><button className="text-button" type="submit">Save</button><button className="text-button" type="button" onClick={() => setEditingStockSlug('')}>Cancel</button></form> : <button key={`${item.sku}-action`} className="text-button" onClick={() => startStockEdit(item)}>Edit stock</button>])} /></section>
  </>;
}

function CustomersAdminPage() {
  const [query, setQuery] = useState('');
  const customers = getAdminCustomers();
  const currentMonth = new Date();
  const isThisMonth = (date) => {
    const parsedDate = new Date(date);
    return parsedDate.getMonth() === currentMonth.getMonth() && parsedDate.getFullYear() === currentMonth.getFullYear();
  };
  const filteredCustomers = customers.filter((customer) => `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <AdminPageHeading eyebrow="CUSTOMER RELATIONSHIPS" title="Customers" copy="Signed-in customers are added after their first order." />
    <StatCards stats={ [['Total customers', customers.length, 'Customers with an order'], ['New this month', customers.filter((customer) => isThisMonth(customer.joinedAt)).length, 'First-time customers'], ['Returning customers', customers.filter((customer) => customer.orders > 1).length, 'Made more than one order'], ['Active this month', customers.filter((customer) => isThisMonth(customer.lastOrderAt)).length, 'Customers with an order']] } />
    <section className="admin-card"><div className="card-heading"><h2>Customer directory</h2></div><div className="filter-row"><input aria-label="Search customers" placeholder="Search name, email or phone" value={query} onChange={(event) => setQuery(event.target.value)} /></div><DataTable columns={['Customer', 'Phone', 'Orders', 'Total spent', 'Joined']} rows={filteredCustomers.map((customer) => [<><strong>{customer.name}</strong><small className="table-subtext">{customer.email}</small></>, customer.phone || '—', customer.orders, formatPrice(customer.spent), customer.joined])} /></section>
  </>;
}

function MessagesAdminPage() {
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [sent, setSent] = useState([]);
  const conversations = demoConversations.map((item, index) => ({ ...item, index })).filter((item) => `${item.name} ${item.preview}`.toLowerCase().includes(search.toLowerCase()));
  const current = demoConversations[selected] || demoConversations[0];
  function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    setSent((messages) => [...messages, { name: current.name, text: reply.trim() }]);
    setReply('');
  }
  return <>
    <AdminPageHeading eyebrow="CUSTOMER INBOX" title="Messages" copy="Answer inquiries and keep every customer updated." action={<span className="pill">5 unread</span>} />
    <div className="messages-layout"><section className="admin-card inbox-list"><h2>Inbox</h2><input placeholder="Search conversations" aria-label="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} /><div className="message-filters"><span className="pill pill-active">All messages</span><span className="pill">Unread · 5</span></div>{conversations.map((conversation) => <button key={conversation.name} className={`conversation ${selected === conversation.index ? 'selected' : ''}`} onClick={() => setSelected(conversation.index)}><span><strong>{conversation.name}</strong><small>{conversation.time}</small></span><small>{conversation.preview}</small></button>)}</section><section className="admin-card conversation-panel"><div className="card-heading"><div><h2>{current.name}</h2><span className="table-subtext">Customer message · demo conversation</span></div></div><div className="chat-thread"><p className="chat-message">{current.message}</p>{sent.filter((message) => message.name === current.name).map((message, index) => <p className="chat-message sent-message" key={index}>{message.text}</p>)}</div><form className="reply-form" onSubmit={sendReply}><label htmlFor="reply">Your reply</label><textarea id="reply" value={reply} onChange={(event) => setReply(event.target.value)} required rows="3" placeholder="Write a reply..." /><button className="button button-dark">Send reply</button><small>Replies are only shown in this browser demo. No email is sent.</small></form></section></div>
  </>;
}

function AdminSettingsPage() {
  const [feedback, setFeedback] = useState('');
  const settings = getStored(ADMIN_SETTINGS_KEY, {});
  return <><AdminPageHeading eyebrow="SHOP PREFERENCES" title="Settings" copy="Keep your shop details and preferences up to date." /><form className="admin-card admin-settings-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const values = Object.fromEntries(new FormData(form).entries()); values.orderNotifications = form.elements.orderNotifications.checked; values.stockNotifications = form.elements.stockNotifications.checked; saveStored(ADMIN_SETTINGS_KEY, values); setFeedback('Settings saved in this browser demo.'); }}><h2>Shop information</h2><Field label="Shop name" name="shopName" defaultValue={settings.shopName || 'Jielikx Frame Shop'} required /><Field label="Contact email" name="email" type="email" defaultValue={settings.email || 'Jielikxframeshop@gmail.com'} required /><Field label="Phone number" name="phone" defaultValue={settings.phone || '63+ 000 000 0000'} /><Field label="Shop address" name="address" defaultValue={settings.address || 'Binalonan public Market'} /><h2>Notifications</h2><label className="check-row"><input type="checkbox" name="orderNotifications" defaultChecked={settings.orderNotifications ?? true} />Email me about new orders</label><label className="check-row"><input type="checkbox" name="stockNotifications" defaultChecked={settings.stockNotifications ?? true} />Notify me when frames are running low</label><button className="button button-dark">Save settings</button>{feedback && <p role="status" className="form-feedback">{feedback}</p>}</form></>;
}

function ExportOrdersPreviewPage() {
  const orders = getAdminOrders();
  return <div className="export-preview"><Link className="text-link" to="/admin/orders">← Back to orders</Link><div className="export-header"><div><Eyebrow>JIELIKX FRAME SHOP</Eyebrow><h1>Orders export preview</h1><p>{orders.length} customer order(s).</p></div><button className="button button-light" onClick={() => window.print()}>Print preview</button></div><DataTable columns={['Order', 'Customer', 'Frame', 'Items', 'Date', 'Total']} rows={orders.map((order) => [order.id, order.customer, order.items.map((item) => item.name).join(', '), order.items.reduce((sum, item) => sum + item.quantity, 0), order.date, formatPrice(order.total)])} /><DemoNotice>Only orders placed by signed-in customers are included.</DemoNotice></div>;
}

function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route element={<GuestOnly />}>
          <Route path="login" element={<AuthPage type="login" />} />
          <Route path="signup" element={<AuthPage type="signup" />} />
          <Route path="forgot-password" element={<AuthPage type="forgot" />} />
          <Route path="forgot-password/reset" element={<AuthPage type="reset" />} />
        </Route>
        <Route element={<ProtectedCustomer />}>
          <Route index element={<HomePage />} />
          <Route path="frames" element={<FramesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="account" element={<Navigate to="/account/profile" replace />} />
          <Route path="account/profile" element={<ProfilePage />} />
          <Route path="account/orders" element={<OrdersPage />} />
          <Route path="account/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="account/settings" element={<SettingsPage />} />
          <Route path="account/help" element={<HelpPage />} />
          <Route path="cart/:slug" element={<ProductFromRoute />} />
          <Route path="checkout/:slug" element={<CheckoutPage />} />
          <Route path="order-confirmation/:slug" element={<ConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="overview" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersAdminPage />} />
          <Route path="inventory" element={<InventoryAdminPage />} />
          <Route path="customers" element={<CustomersAdminPage />} />
          <Route path="messages" element={<MessagesAdminPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="export-orders-preview" element={<ExportOrdersPreviewPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
