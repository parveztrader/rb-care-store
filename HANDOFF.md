# RB Care — testing handoff

Prepared 2026-10-30. Start here when continuing testing in `D:\gravity\rb-care-store`.

## Current scope

Test the active WordPress/WooCommerce store. Theme: `wordpress/wp-content/themes/rb-care` (1.0.0). Plugin: `wordpress/wp-content/plugins/rb-care-commerce` (1.0.1). The directory cleanup preserves the current storefront design and all WordPress data.

Old Next.js code/runtime is archived under `archive/nextjs-2026-10-30/`. It is reference material. The active project does not mount or import the archive on normal startup. Git history remains at the project root; changes are local and uncommitted.

## Start, login, test

1. Open Docker Desktop, then double-click `Start-WordPress.cmd`.
2. Store: http://localhost:8096/ . Admin: http://localhost:8096/wp-admin/ . Use the local credentials in `wordpress/dev/private/LOCAL-ACCESS.md`; do not copy passwords or tracking secrets into reports.
3. Run `Test-WordPress.cmd` for PHP/JavaScript syntax checks and the existing 80-assertion HTTP/WooCommerce regression suite. Node.js is required for this test command; no `npm install` is needed.
4. Double-click `Stop-WordPress.cmd` when finished. It stops containers and keeps their database, uploads and private photos.

Normal Start does not reseed an existing store or reset its settings. The explicit `-InitializeDemo` switch on `wordpress/dev/start.ps1` is for deliberate local bootstrap/reset work only. Do not use that switch during routine testing.

## Baseline to preserve

- WordPress 7.1.4, WooCommerce 11.2.1, PHP 8.3, MariaDB 11; theme/plugin versions above. Core was updated on 2026-10-30; the fresh WordPress.org inventory reported zero pending core/plugin/theme/translation updates.
- Four published seed products, each with stock 1; no product drafts, seller requests or enquiries after earlier QA cleanup.
- One original administrator and one pre-existing cancelled dummy order (#41, ₹15,150). It is an unpaid local checkout fixture.
- Inventory IDs/SKUs, prices and stock are recorded in ignored `wordpress/dev/reports/reorganization-before.json` and `reorganization-after.json`.
- Local email and outbound WooCommerce webhooks are blocked. BACS is labelled as a no-payment local test method. Live Razorpay, courier delivery and real messaging are not configured.

Automated tests create their own temporary records and remove matching fixtures. The suite checks the seed product price/warranty and idempotent import; run it against this isolated local baseline. Review its assumptions before adapting it to another catalogue.

## Manual acceptance

| Area | Action | Expected result |
| --- | --- | --- |
| Storefront | Home, category, city filter, brand/model search and product page | Existing design loads; source product details/prices remain correct; reference images stay labelled |
| Responsive | Check home, catalogue, product and seller form at 320px and desktop width | Usable controls and no horizontal overflow |
| Language | Type into the seller form, switch English/Hindi, then return | Entered values/files and canonical category choices remain intact |
| Cart/checkout | Add the Lucknow LG unit; use synthetic contact details and Lucknow delivery | Native WooCommerce flow; ₹14,500 + ₹650 delivery = ₹15,150; offline order is on hold and unpaid |
| Delivery validation | Try the same city-stock appliance with a different destination city | No usable delivery rate / validation blocks checkout |
| Order admin | Inspect the test order, add a private note, then cancel it | Status and private note persist; the unique unit returns to stock 1 |
| Product admin | Use a temporary draft; edit price, city/mode, warranty, delivery, tested functions and specifications | Values survive Save Draft/reload; existing catalogue is preserved |
| Seller submission | Submit 1–6 non-sensitive JPG/PNG/WebP images, each at most 3 MB | NEW/private request; customer cannot set the team price/status; a private tracking fragment is returned |
| Seller review | Attempt direct publication; then QUOTED with a positive price; separately PUBLISHED with consent | First attempt rejected; team rate appears in private tracking; publication is a separate step |
| Privacy | Inspect public community output and close the listing | Contact details, tracking secret and private note remain absent; closure removes listing and revokes public photo access |
| Enquiries | Submit synthetic contact/bulk details and inspect Customer enquiries | A private saved record and receipt exist; no outbound message is implied |
| Access | Log out / use a temporary customer role to request backend pages | Admin authentication is required; customers cannot edit products, sellers, enquiries or orders; denied order admin returns 403 |

Use `wordpress/tests/admin-prepare.mjs`, `admin-check.mjs` and `admin-cleanup.mjs` for repeatable backend fixtures. Exact UI values and sequence are in `docs/BACKEND-QA-2026-10-30.md`. Preparation prints current IDs; do not reuse IDs from earlier reports. Cancel test orders to restore stock before removing their fixtures. Do not alter the original administrator or use real customer contacts.

## Test results and issue reporting

Existing evidence: 80 baseline regression assertions, backend browser tests plus 38 published-stage / 34 closed-stage assertions (overlapping coverage), and 8 responsive page checks. The backend 500 → 403 denial fix is included in plugin 1.0.1.

After organizing the directory, the complete 80-assertion regression suite passed again, and the store snapshot matched the pre-move baseline. The 77-file legacy source manifest matched before/after. See `docs/REORGANIZATION-2026-10-30.md` for verification of the new layout.

After updating WordPress to 7.1.4, all 80 assertions passed again and core checksum verification succeeded. Business data matched the pre-update snapshot. See `docs/UPDATES-2026-10-30.md`; private rollback backups are under `wordpress/dev/private/backups/updates-2026-10-30/`.

For each new failure record: page/URL without private fragments, role, steps, expected/actual result, screenshot and relevant log excerpt with secrets removed. Relevant files:

- `wordpress/dev/reports/` — ignored generated results.
- `wordpress/dev/private/` — credentials, fixture receipts and the private pre-organization database backup.
- Container `wp-content/debug.log` — PHP log; distinguish historical QA errors from new failures.
- `docs/MIGRATION.md` — feature mapping and launch work.
- `docs/BACKEND-QA-2026-10-30.md` — detailed backend test evidence.

## Open work before launch

Resolve inherited warranty/returns wording conflicts; approve real catalogue/photos, delivery/PIN-code rules and tax/invoice settings; configure and verify a native payment gateway, email/SMS and courier integration; rehearse backups/restores and physical-device/provider acceptance. Local functional checks do not establish real payment or delivery success.

## Packaging and recovery

Build installable theme/plugin/source packages with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File wordpress/tools/package.ps1
```

Packages go to ignored `wordpress/releases/`. The archive, credentials, database backups, runtime reports and test receipts are excluded. To save them elsewhere use `-OutputDirectory` explicitly. Data lives in the existing `rb-care` Docker volumes; a plugin/theme ZIP is not a database/uploads backup. The private database backup before the directory cleanup is in `wordpress/dev/private/backups/`.
