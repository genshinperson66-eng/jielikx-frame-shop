const imagePath = (name) => `/images/${name}_expires_30_days.png`;

export const siteImages = {
  home: {
    heroBackground: imagePath('atrc0w5w'),
    hero: imagePath('byl1uifo'),
    whyBackground: imagePath('4e9t3xks'),
    benefits: ['rgcxqqnw', 'a378n8ma', 't63mgx19', 'txjip9wf'].map(imagePath),
    gallery: ['x18wvdew', 'ocrbrkz5', 'ru1m8kje', 'uz7lxbrd', 'kjkqv4gu', 'akdtjtrz', 'haitsh44'].map(imagePath),
    highlights: ['6zahq1l6', 'cmyqx6pm', 'cfebqe5r'].map(imagePath),
    showcase: [
      '/images/home-landscape-frame.png',
      '/images/home-sunset-frame.png',
      '/images/home-floral-frame.png',
    ],
    woodenFrameCard: '/images/home-wooden-frame-card.png',
    reviewStars: ['5fzm3noc', 'g03sx3t8', '3w8csptn', '3w19memy', 'mmobgcel'].map(imagePath),
  },
  about: {
    hero: imagePath('ftmcakny'),
    story: imagePath('he3j3mi9'),
    missionIcon: imagePath('5b26doy0'),
    visionIcon: imagePath('o600k9zd'),
    missionPhoto: imagePath('ycmew3ln'),
    benefits: ['ofjiu7wq', 'gk6t9h5s', 'yckhide3'].map(imagePath),
  },
  contact: {
    background: imagePath('14tsfnqy'),
    details: ['zdffpj32', 'dnl2y8hr', 'v574xbmo', '6qqin45n'].map(imagePath),
    social: ['d8yhv4jf', 'o6pje37a'].map(imagePath),
    photo: imagePath('8lmmrpb0'),
  },
  auth: {
    login: imagePath('hyg0v8pn'),
    signup: imagePath('81x5xpce'),
    forgot: imagePath('enec9234'),
    reset: imagePath('s0z845cc'),
    admin: imagePath('qkcp1z9r'),
  },
  admin: {
    popularFrames: ['vnguhbov', '6qs26p7i', 'y11jxipp'].map(imagePath),
  },
};

export const products = [
  {
    slug: 'natural-oak-frame',
    name: 'Natural Oak Frame',
    description: 'Light oak grain with a clean, Scandinavian profile.',
    price: 300,
    tone: 'oak',
    image: imagePath('eixq6m5r'),
    cartImage: imagePath('gjk1s1m6'),
    checkoutImage: imagePath('z5i57rvs'),
    checkoutPaymentIcon: imagePath('hh2r6ig7'),
    confirmationImage: imagePath('awvg8u41'),
    confirmationIcon: imagePath('99e8uu8u'),
  },
  {
    slug: 'walnut-gallery-frame',
    name: 'Walnut Gallery Frame',
    description: 'Rich walnut with an ivory mat for timeless displays.',
    price: 450,
    tone: 'walnut',
    image: imagePath('o6oo9shx'),
    cartImage: imagePath('losluy55'),
    checkoutImage: imagePath('n50c2hg6'),
    checkoutPaymentIcon: imagePath('jzy9rd5k'),
    confirmationImage: imagePath('a7t4024v'),
    confirmationIcon: imagePath('n3dxrkqd'),
  },
  {
    slug: 'brushed-brass-frame',
    name: 'Brushed Brass Frame',
    description: 'Slim brushed brass for a refined, modern finish.',
    price: 350,
    tone: 'brass',
    image: imagePath('w6qydjjo'),
    cartImage: imagePath('if5gp6wr'),
    checkoutImage: imagePath('yql2uqmk'),
    checkoutPaymentIcon: imagePath('kkj9ifh6'),
    confirmationImage: imagePath('o0umjdaq'),
    confirmationIcon: imagePath('7qomny8u'),
  },
  {
    slug: 'white-shadow-box',
    name: 'White Shadow Box',
    description: 'A deep white frame for keepsakes and special pieces.',
    price: 599,
    tone: 'white',
    image: imagePath('i0wdxapk'),
    cartImage: imagePath('krm40nnc'),
    checkoutImage: imagePath('8cc3e5z0'),
    checkoutPaymentIcon: imagePath('vvjgzekb'),
    confirmationImage: imagePath('lbigkye0'),
    confirmationIcon: imagePath('oa1chl6w'),
  },
  {
    slug: 'black-gallery-frame',
    name: 'Black Gallery Frame',
    description: 'Matte black with a wide mat for a bold gallery look.',
    price: 450,
    tone: 'black',
    image: imagePath('e2njgc3t'),
    cartImage: imagePath('dy5q814a'),
    checkoutImage: imagePath('zbri5zik'),
    checkoutPaymentIcon: imagePath('nmr5no3b'),
    confirmationImage: imagePath('fv4my4la'),
    confirmationIcon: imagePath('gy38nrvl'),
  },
  {
    slug: 'terracotta-arch-frame',
    name: 'Terracotta Arch Frame',
    description: 'Warm terracotta with a soft, arched silhouette.',
    price: 450,
    tone: 'terracotta',
    image: imagePath('m550etzf'),
    cartImage: imagePath('ebwut5go'),
    checkoutImage: imagePath('buprzjyw'),
    checkoutPaymentIcon: imagePath('2hb8kf9f'),
    confirmationImage: imagePath('tznaeofs'),
    confirmationIcon: imagePath('229gvs8q'),
  },
  {
    slug: 'bamboo-frame',
    name: 'Bamboo Frame',
    description: 'Natural bamboo brings a light, organic touch.',
    price: 250,
    tone: 'bamboo',
    image: imagePath('q4lq2b7v'),
    cartImage: imagePath('cwr8hsq3'),
    checkoutImage: imagePath('6imbr9ha'),
    checkoutPaymentIcon: imagePath('vr5fpg7t'),
    confirmationImage: imagePath('78vuxltw'),
    confirmationIcon: imagePath('n9b14ms1'),
  },
  {
    slug: 'sage-green-frame',
    name: 'Sage Green Frame',
    description: 'A soft sage finish for calm, contemporary spaces.',
    price: 300,
    tone: 'sage',
    image: imagePath('5nw9onnc'),
    cartImage: imagePath('rfrw93z7'),
    checkoutImage: imagePath('j51aeyfx'),
    checkoutPaymentIcon: imagePath('is0e34k4'),
    confirmationImage: imagePath('d7tv05e1'),
    confirmationIcon: imagePath('zahocypf'),
  },
  {
    slug: 'vintage-oval-frame',
    name: 'Vintage Oval Frame',
    description: 'Antique gold details in a graceful oval shape.',
    price: 600,
    tone: 'gold',
    image: imagePath('5xskkzp2'),
    cartImage: imagePath('4yiv5s99'),
    checkoutImage: imagePath('44gyf6ee'),
    checkoutPaymentIcon: imagePath('te6jkns1'),
    confirmationImage: imagePath('3bm921hl'),
    confirmationIcon: imagePath('ymtvqbns'),
  },
];

export const adminOrders = [
  { id: '#1042', customer: 'Maria Santos', frame: 'Wooden Frame', size: '12 × 16 in', date: 'Nov 13, 2026', total: 1850, status: 'Processing' },
  { id: '#1041', customer: 'Jose Reyes', frame: 'Certificate Frame', size: 'A4', date: 'Nov 13, 2026', total: 950, status: 'Ready for pickup' },
  { id: '#1040', customer: 'Ana Cruz', frame: 'Modern Frame', size: '16 × 20 in', date: 'Nov 12, 2026', total: 2400, status: 'Completed' },
  { id: '#1039', customer: 'Paolo Garcia', frame: 'Modern Frame', size: '8 × 10 in', date: 'Nov 12, 2026', total: 750, status: 'Processing' },
  { id: '#1038', customer: 'Liza Mendoza', frame: 'Certificate Frame', size: 'A4', date: 'Nov 11, 2026', total: 950, status: 'Completed' },
  { id: '#1037', customer: 'Carlo Ramos', frame: 'Wooden Frame', size: '8 × 10 in', date: 'Nov 11, 2026', total: 850, status: 'Completed' },
];

export const inventoryItems = [
  { name: 'Modern Frame', sku: 'FRM-001', size: '8 × 10 in', price: 750, stock: 58, category: 'Modern', image: imagePath('u6xtr13o') },
  { name: 'Certificate Frame', sku: 'FRM-002', size: 'A4', price: 950, stock: 41, category: 'Certificate', image: imagePath('lkjq3ipn') },
  { name: 'Wooden Frame', sku: 'FRM-003', size: '12 × 16 in', price: 1850, stock: 3, category: 'Wooden', image: imagePath('c0en6dfp') },
];

export const storefrontProducts = [
  ...products,
  ...inventoryItems.map((item) => {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return {
      ...item,
      slug,
      description: `${item.category} frame for your favorite photos and memories.`,
      tone: item.category.toLowerCase(),
      cartImage: item.image,
      checkoutImage: item.image,
      checkoutPaymentIcon: imagePath('hh2r6ig7'),
      confirmationImage: item.image,
      confirmationIcon: imagePath('99e8uu8u'),
    };
  }),
];

export const productBySlug = Object.fromEntries(storefrontProducts.map((product) => [product.slug, product]));

export const demoCustomers = [
  { name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+63 917 555 0142', orders: 4, spent: 4550, joined: 'Oct 18, 2026' },
  { name: 'Jose Reyes', email: 'jose.reyes@example.com', phone: '+63 917 555 0181', orders: 2, spent: 1900, joined: 'Oct 22, 2026' },
  { name: 'Ana Cruz', email: 'ana.cruz@example.com', phone: '+63 917 555 0173', orders: 3, spent: 6800, joined: 'Oct 29, 2026' },
  { name: 'Paolo Garcia', email: 'paolo.garcia@example.com', phone: '+63 917 555 0119', orders: 1, spent: 750, joined: 'Nov 02, 2026' },
  { name: 'Liza Mendoza', email: 'liza.mendoza@example.com', phone: '+63 917 555 0166', orders: 2, spent: 1900, joined: 'Nov 05, 2026' },
];

export const demoConversations = [
  { name: 'Maria Santos', time: '10:24 AM', preview: 'Do you offer custom sizes for a family portrait?', message: 'Hello! Do you offer custom sizes for a family portrait?' },
  { name: 'Jose Reyes', time: '9:48 AM', preview: 'What time can I pick up my order?', message: 'What time can I pick up my order?' },
  { name: 'Ana Cruz', time: 'Yesterday', preview: 'Thank you! The frame looks beautiful.', message: 'Thank you! The frame looks beautiful.' },
  { name: 'Paolo Garcia', time: 'Yesterday', preview: 'Can I change the frame color?', message: 'Can I change the frame color?' },
];

export const formatPrice = (amount) =>
  `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
