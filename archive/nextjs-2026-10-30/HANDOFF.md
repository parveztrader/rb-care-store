# RB Care Store — local development handoff

> Current direction (2026-10-30): migrate to the custom WordPress theme `rb-care` and companion plugin `rb-care-commerce` with native WooCommerce. The running WordPress preview is http://localhost:8096/. Start with `wordpress/README.md` and `wordpress/MIGRATION.md`; use `Start-WordPress.cmd`. The Next.js setup below is retained as the original source/reference.

Prepared on 2026-10-30 (Asia/Kolkata).

## Project

- Folder: `D:\gravity\rb-care-store`
- Repository: https://github.com/parveztrader/rb-care-store
- Account access checked: `ak1458`, WRITE permission.
- Starting branch/commit: `main`, `9c82d0b`.
- Objective: continue the existing application into a complete ecommerce store. This setup prepares local development; the store is not production-ready yet.

## Start and stop

Double-click `Start-Local.cmd`, or use PowerShell:

```powershell
Set-Location 'D:\gravity\rb-care-store'
npm run dev:local
```

Open http://127.0.0.1:3000. Stop a foreground server with Ctrl+C. If this port is already occupied, use the running store or stop that server first.

`Start-Local.cmd` copies `.env.local.example` if `.env.local` is missing and runs `npm ci` if Next.js has not been installed. `.env.local` and `.data/` are ignored by Git.

Installed runtime at setup: Node.js 24.19.0, npm 11.17.0. Dependencies are pinned by `package-lock.json`; use `npm ci` for repeat installs.

## Local pages

| Page | URL |
| --- | --- |
| Store | http://127.0.0.1:3000/ |
| Catalog | http://127.0.0.1:3000/products |
| Cart / checkout | http://127.0.0.1:3000/cart and /checkout |
| Sell an appliance | http://127.0.0.1:3000/sell |
| Community | http://127.0.0.1:3000/community |
| Admin | http://127.0.0.1:3000/admin |
| Seller review | http://127.0.0.1:3000/admin/sell |
| Orders | http://127.0.0.1:3000/admin/orders |

On the first seller-admin API request, development creates `.data/sell/admin-token.txt`. Use that local key on `/admin/sell`; do not commit or share it. Real Razorpay keys have not been configured. The existing payment simulator does not move money; use dummy information only.

## Current implementation

- Next.js 15 App Router, React 19, TypeScript; English/Hindi UI.
- Existing storefront, product detail gallery, cart, checkout, inventory admin, orders, seller review and community pages.
- Inventory persists in `.data/inventory.json` after a write. Seller requests/photos persist in `.data/sell/`.
- Orders and reservations are process-memory Maps in `lib/orders.ts`, with sample orders. They reset on process/module reload and are unsuitable for real commerce.
- `prisma/schema.prisma` defines PostgreSQL models, but no active application code imports `lib/prisma.ts`. No database instance or migrations have been created. The schema's invalid one-line syntax was repaired without changing its fields.
- Bulk enquiries currently only log input and return success.

## Continue development in this order

1. Build persistent database-backed orders, inventory/reservations, customers and enquiries. Plan migrations and transaction-safe stock allocation before relying on checkout.
2. Add authenticated/authorized admin access across product and order APIs; the existing seller access key covers seller routes only.
3. Complete Razorpay test-mode integration: server-side signature verification, payment/order/amount matching, persisted provider order IDs, idempotent webhooks and reservation expiry. Current `/api/checkout/confirm` trusts a submitted payment ID and can mark an order paid without verifying a gateway signature. Keep the demo flow separate before enabling actual payments.
4. Complete shipping, protected webhooks, tax/invoices, email/SMS, returns/refunds, backups and operational monitoring.
5. Replace sample catalogue/photography and validate business details, service areas and policy content with the owner.
6. Resolve dependency advisories and complete mobile/browser and end-to-end acceptance before deployment. The initial locked install reported 17 npm advisories (3 moderate, 11 high, 3 critical); this is dependency metadata, not a demonstrated exploit assessment.

The request in this chat authorizes local setup. No GitHub push, production deployment, actual payment or outbound customer message was performed.

## Checks

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

The baseline build and 20 tests passed. Prisma validation and client generation passed after the schema syntax repair, using a temporary local-format DATABASE_URL solely for schema validation; no connection was made to a database. See `docs/LOCAL-SETUP-2026-10-30.md` for the final setup checks.

Before future work, inspect `git status`, this handoff and the existing `docs/selling.md`, `docs/product-listings.md`, `docs/languages.md`. Preserve local data and secrets. Development changes from this setup remain local and uncommitted.
