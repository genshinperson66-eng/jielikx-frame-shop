# Jielikx Frame Shop

A responsive React storefront and demo admin workspace rebuilt from the supplied Jielikx Frame Shop HTML references. This is a frontend-only application: customer/admin sessions, cart contents, profile details, and demo orders are stored in the browser's `localStorage`.

## Run locally

Requires Node.js 20.19 or newer (or 22.12 or newer).

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, or serve it locally with `npm run preview`.

On Windows PowerShell, run `npm.cmd install` once if dependencies are not installed, then run `npm.cmd run dev` and keep that terminal open. Open `http://127.0.0.1:5173/` in your browser. In VS Code, press **F5** and choose **Launch Chrome against localhost**; the launch task starts Vite before opening Chrome. **Go Live** is not used for this Vite app.

## Deploy to Netlify

Import the GitHub repository into Netlify and use the project root as the Base directory. The included [`netlify.toml`](./netlify.toml) sets the build command to `npm run build`, publishes the `dist` directory, and rewrites application routes to `index.html` so direct links and refreshes work with React Router.

## Routes and source-page checklist

| Supplied reference | React route / reusable page |
| --- | --- |
| `Home.html` | `/` |
| `Frames.html` | `/frames` |
| `About.html` | `/about` |
| `Contacts.html` | `/contact` |
| `Login.html` | `/login` |
| `SignUp.html` | `/signup` |
| `ForgotPassword.html` | `/forgot-password` |
| `ForgotPassword2.html` | `/forgot-password/reset` |
| `MyProfile.html` | `/account/profile` |
| `MyOrders.html` | `/account/orders` |
| `PaymentMethods.html` | `/account/payment-methods` |
| `Settings.html` | `/account/settings` |
| `HelpSupport.html` | `/account/help` |
| `ShoppingCartBambooFrame.html` | `/cart/bamboo-frame` |
| `ShoppingCartBlackGalleryFrame.html` | `/cart/black-gallery-frame` |
| `ShoppingCartBrushedBrassFrame.html` | `/cart/brushed-brass-frame` |
| `ShoppingCartNaturalOakFrame.html` | `/cart/natural-oak-frame` |
| `ShoppingCartSageGreenFrame.html` | `/cart/sage-green-frame` |
| `ShoppingCartTerracottaArchFrame.html` | `/cart/terracotta-arch-frame` |
| `ShoppingCartVintageOvalFrame.html` | `/cart/vintage-oval-frame` |
| `ShoppingCartWalnutGalleryFrame.html` | `/cart/walnut-gallery-frame` |
| `ShoppingCartWhiteShadowBox.html` | `/cart/white-shadow-box` |
| `CheckoutBambooFrame.html` | `/checkout/bamboo-frame` |
| `CheckoutBlackGalleryFrame.html` | `/checkout/black-gallery-frame` |
| `CheckoutBrushedBrassFrame.html` | `/checkout/brushed-brass-frame` |
| `CheckoutNaturalOakFrame.html` | `/checkout/natural-oak-frame` |
| `CheckoutSageGreenFrame.html` | `/checkout/sage-green-frame` |
| `CheckoutTerracottaArchFrame.html` | `/checkout/terracotta-arch-frame` |
| `CheckoutVintageOvalFrame.html` | `/checkout/vintage-oval-frame` |
| `CheckoutWalnutGalleryFrame.html` | `/checkout/walnut-gallery-frame` |
| `CheckoutWhiteShadowBox.html` | `/checkout/white-shadow-box` |
| `OrderConfirmationBambooFrame.html` | `/order-confirmation/bamboo-frame` |
| `OrderConfirmationBlackGalleryFrame.html` | `/order-confirmation/black-gallery-frame` |
| `OrderConfirmationBrushedBrassFrame.html` | `/order-confirmation/brushed-brass-frame` |
| `OrderConfirmationNaturalOakFrame.html` | `/order-confirmation/natural-oak-frame` |
| `OrderConfirmationSageGreenFrame.html` | `/order-confirmation/sage-green-frame` |
| `OrderConfirmationTerracottaArchFrame.html` | `/order-confirmation/terracotta-arch-frame` |
| `OrderConfirmationVintageOvalFrame.html` | `/order-confirmation/vintage-oval-frame` |
| `OrderConfirmationWalnutGalleryFrame.html` | `/order-confirmation/walnut-gallery-frame` |
| `OrderConfirmationWhiteShadowBox.html` | `/order-confirmation/white-shadow-box` |
| `AdminLogin.html` | `/admin/login` |
| `AdminDashboard.html` | `/admin` (also `/admin/overview`) |
| `AdminOrders.html` | `/admin/orders` |
| `AdminFramesInventory.html` | `/admin/inventory` |
| `AdminCustomers.html` | `/admin/customers` |
| `AdminMessages.html` | `/admin/messages` |
| `AdminSettings.html` | `/admin/settings` |
| `ExportOrdersPreview.html` | `/admin/export-orders-preview` |

The original HTML files are preserved under [`reference/`](./reference/).

## Demo behavior and limitations

- The catalog starts in `src/data.js`; admin-added frames and stock edits are saved in `localStorage` and appear on the storefront Frames page in the same browser.
- Admin inventory includes the storefront catalog and the original Modern, Certificate, and Wooden frame samples. New frames require an image, which is resized and stored in this browser with the product.
- Contact Us reads its address, phone, and email from Admin Settings. The address and map preview open a Google Maps search for the configured location.
- Product prices and descriptions, the ₱80 standard delivery example, cash-on-delivery text, and sample admin metrics follow the source pages.
- Customers must be signed in to check out. Each placed demo order is saved in this browser and appears in the admin order list, sales totals, and customer directory; each customer is counted once, on their first order. This does not submit a real order, process payment, send email, or connect to a courier.
- Customer sign-up and login verify passwords using salted PBKDF2 hashes stored in the browser, and profile details persist per account across sign-out. This remains a frontend-only demo, not production authentication; the demo administrator credentials are also client-side and must not be used for a real deployment. Password reset is not connected.
- Admin sign-in uses the demo credentials `admin@jielikxframeshop.com` / `JielikxAdmin2026!`. Admin orders and customer records are based on signed-in customer orders in this browser; order export downloads those records as a CSV. Message replies only affect the current page session.
- Product and contact-setting changes are local to the same browser and site origin; they are not shared across devices and are not backed by a server database.
- The original page images are stored locally in `public/images` and used through local paths, so the React app does not depend on temporary TagJS URLs. The supplied Jielikx Frame Shop badge is `public/images/jielikx-frame-shop-badge.png`. Social icons are included; social-media destination links were not supplied.

## Project structure

- `src/data.js` — storefront products and sample admin records
- `src/App.jsx` — routes, shared layouts, account/store/admin pages, and demo flows
- `src/styles.css` — shared branding, responsive layouts, and focus states
- `public/images/` — original page images and the Jielikx brand mark
- `reference/` — unchanged source HTML snapshots
