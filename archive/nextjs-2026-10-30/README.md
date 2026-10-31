# RB Care Store

**Current development: WordPress custom theme + companion plugin with WooCommerce.** See `wordpress/README.md` and `wordpress/MIGRATION.md`. Start the local store with `Start-WordPress.cmd` or `npm run wp:start`; preview: http://localhost:8096/. The original Next.js source remains available for reference.

Original Next.js storefront and administration app, with English/Hindi language switching, appliance products, customer seller requests, team pricing, moderated community listings and order management.

## Run locally

Windows setup and continuation notes: see `HANDOFF.md`. On this PC the checkout is `D:\gravity\rb-care-store`. Double-click `Start-Local.cmd` or run `npm run dev:local` to start on loopback port 3000. Copy `.env.local.example` to `.env.local` on a fresh checkout.

Install dependencies with `npm install`, then run `npm run dev -- --hostname 127.0.0.1 --port 3000`.

- Store: http://127.0.0.1:3000/
- Products: http://127.0.0.1:3000/products
- Sell an appliance: http://127.0.0.1:3000/sell
- Track a request: http://127.0.0.1:3000/sell/track
- Community listings: http://127.0.0.1:3000/community
- Admin: http://127.0.0.1:3000/admin
- Seller review and pending requests: http://127.0.0.1:3000/admin/sell
- Orders: http://127.0.0.1:3000/admin/orders

Run the original regression tests with `npm test`. Production builds use `npm run build`, then `npm start` on a suitable Node.js host.

Original application data under `.data/sell` and original source/data backups are retained. Runtime data and local environment files remain excluded from Git. See `.env.example` for configuration names and `docs/selling.md`, `docs/languages.md` and `docs/product-listings.md` for the existing workflows.
