# Migration handoff — 2026-10-30

Working folder: `D:\gravity\rb-care-store`. Remote: `parveztrader/rb-care-store`, branch `main`, starting commit `9c82d0b`. All setup/migration changes are local and uncommitted. Earlier local changes were preserved.

## Feature mapping

| Existing Next.js feature | WordPress implementation |
| --- | --- |
| Header, navigation, home sections, footer and responsive source styling | RB Care custom PHP theme |
| Products and details | WooCommerce products + appliance metadata and condition tab |
| Search/category/city filters | Native product search/taxonomies; brand/model metadata search; stock-city filter |
| Cart and checkout | Native WooCommerce sessions, nonces and checkout |
| Orders, stock and customer accounts | Persistent native WooCommerce records; HPOS compatibility declared |
| Per-unit delivery and city restriction | Native RB Care shipping method + classic/Store API destination validation |
| Seller form and photo uploads | Three-step shortcode + validated multipart endpoint |
| Private request tracking | Fragment receipt + bearer-secret hash validation |
| Team pricing and separate publication | Capability/nonce-checked admin metabox; NEW → QUOTED → PUBLISHED |
| Community cards/detail pages | Explicit public-field whitelist; consent and price gate |
| Private seller photos | Persistent storage outside document root; authorized streaming |
| Seller notifications | Admin dashboard count/list and authenticated WordPress Heartbeat |
| Bulk/contact forms | Persisted private enquiry records; contact consent |
| English/Hindi switching | Imported authored dictionary plus native-flow additions; in-place form-safe switching |
| FAQ and policy pages | Source text imported as editable WordPress Pages |
| Sitemap/product markup | WordPress native sitemaps and WooCommerce structured product data, with UsedCondition |
| Insecure simulated payment confirmation | Replaced by native gateway architecture; no custom mark-paid endpoint |

The Next.js sample paid orders are **not** imported as actual orders. The original app only kept orders in process memory; there is no durable order ledger in this clone to migrate. The local WordPress database contains one cancelled dummy browser QA order (#41), explicitly labelled as a no-payment test. Its cancellation restored the source appliance's stock. No live customer orders or payments were migrated. The old application and its `.data` now live under `archive/nextjs-2026-10-30/`; WordPress is the active project.

At setup the `.data/sell` directory contained only the old local admin key, not seller records/photos. Zero existing seller requests were imported. The legacy importer is available for a later genuine export and preserves UUIDs and SHA-256 tracking hashes, so the same private fragments continue to work after domain cutover. It does not import the old admin key; WordPress authentication replaces it.

## WP-CLI import commands

From `wordpress/dev` on this PC:

```powershell
docker compose run --rm cli rb-care setup /project/migration/content.seed.json --publish --configure-local
docker compose run --rm cli rb-care import-catalog /project/migration/catalog.seed.json --publish
docker compose run --rm -v "D:/gravity/rb-care-store/archive/nextjs-2026-10-30/.data:/legacy-data:ro" cli rb-care import-sellers /legacy-data/sell
docker compose run --rm cli rewrite flush --hard
```

The optional legacy command mounts the archive explicitly for that one CLI run. Normal startup has no archive/data mount. The `setup --configure-local` example resets local demo settings deliberately; do not run it during routine testing.

On hosting, use ordinary `wp rb-care setup /path/content.seed.json`, `wp rb-care import-catalog /path/catalog.json`, and `wp rb-care import-sellers /path/legacy-sell`. Omit `--configure-local`; it is deliberately restricted to a local WordPress environment. Omit `--publish` when preparing drafts. Existing pages/SKUs/UUIDs are skipped. Importers do not delete or synchronize existing WordPress edits. Back up first and rehearse on staging.

Catalog field mappings: `id` → native SKU; name/slug/description/price → native WooCommerce properties; available unique unit → stock 1 and sold-individually; reserved/sold → stock 0. Appliance fields are saved as `_rb_*` product metadata; images are external-reference fallbacks until native attachments are supplied. Product categories become WooCommerce taxonomy terms.

## Verification

- PHP syntax checks passed for theme, plugin, local guard and test PHP files.
- JavaScript syntax checks passed for storefront/admin assets.
- Automated suite: 48 HTTP assertions plus 32 native WordPress/WooCommerce assertions passed (80 total). Coverage includes real multipart uploads, private tracking/photos, forged price/status rejection, publication gating, anonymous admin protection, idempotent import, source metadata, server delivery charge, stock reduction/cancellation, persistent unpaid orders and public contact exclusion. These checks are not a complete external penetration test.
- Browser: source product → Add to cart → native cart → checkout → Order received. Total: ₹14,500 + ₹650 delivery = ₹15,150, BACS offline fixture, on hold and unpaid. The test order was then cancelled and stock restored.
- Browser: Hindi switching preserved the entered brand/model; canonical option values remain unchanged.
- Browser layout checks and final package inspection are recorded in `dev/reports` locally and the delivered migration report.
- Original Next.js tests passed before migration; the original application remains reference code and is not the WordPress runtime.

## Decisions still needed before launch

Additional backend QA on 2026-10-30 exercised native admin login, product price/metadata saves, private seller quotation/publication/closure, enquiry viewing, native order status changes, private notes and stock restoration through the actual admin UI. Authenticated HTTP tests also covered customer role denials, invalid form nonce rejection and the seller-notification heartbeat. See `BACKEND-QA-2026-10-30.md`.

Plugin 1.0.1 adds a capability check before the native WooCommerce order page controller so denied customers receive HTTP 403 instead of its empty HTTP 500 response. Order data was already blocked. Authorized admin access was rechecked. The theme remains version 1.0.0.

1. **Copy conflicts inherited from the source:** product/warranty policy says 90 days; FAQ says six months plus a paid extension. Source returns page and FAQ also differ. Delivery/installation promises, response times, brand/service claims and contact channels need owner-approved wording. Existing text was migrated for review; no new commercial promise was invented.
2. **Payments:** no Razorpay integration plugin or real credentials have been configured here. Configure a maintained native WooCommerce gateway; verify test payments, signature checks, webhooks, duplicates, timeouts and refunds before live use.
3. **Operations:** hosting/domain, TLS, tax/invoices, approved PIN-code serviceability, email/SMS delivery, shipping-provider acceptance, backups/restore and actual catalogue/photos remain launch work. City matching is not a courier PIN-code availability lookup.
4. **Media/storage:** private photos need the persistent external directory on hosting. Native WordPress uploads/database/private files must all be backed up. Reference product URLs depend on their original external hosts.
5. **Language QA:** the installed WooCommerce version has no available official Hindi pack. The custom dictionary covers the migrated storefront and common checkout labels; third-party gateway strings and uncommon WooCommerce messages need native-flow Hindi review.
6. **Acceptance:** mobile physical-device checkout, real provider delivery and production load/concurrency acceptance remain unproven. Core native checkout/stock behavior was exercised locally, not on production infrastructure.

Do not enable the old simulated payment endpoint on a public site. Do not copy local `.env`, private credentials, fixtures or mu-plugin guards into production. No live site was changed.
