# RB Care — WordPress migration

Custom theme: `wordpress/wp-content/themes/rb-care`. Companion plugin: `wordpress/wp-content/plugins/rb-care-commerce`. WooCommerce provides products, persistent orders, inventory, cart, checkout, customer accounts and gateway integration points. The original Next.js application is preserved in `archive/nextjs-2026-10-30/`. Active setup and testing start at the project-root `README.md` and `HANDOFF.md`.

Prepared and tested locally on 2026-10-30 with WordPress 7.1.3, WooCommerce 11.2.1, PHP 8.3 and MariaDB 11.

Current installed WordPress is **7.1.4**, updated and regression-tested later on 2026-10-30. Plugin/theme versions remain current; see `UPDATES-2026-10-30.md`. Core files and installed third-party plugins live in the persistent Docker website volume, while the custom theme/plugin source stays in this repository.

## Start locally

Requires Docker Desktop. Run `Start-WordPress.cmd` at the repository root, or:

```powershell
Set-Location 'D:\gravity\rb-care-store'
powershell -NoProfile -ExecutionPolicy Bypass -File wordpress/dev/start.ps1
```

- Store: http://localhost:8096/
- WordPress admin: http://localhost:8096/wp-admin/
- Login: ignored `wordpress/dev/private/LOCAL-ACCESS.md`.
- Stop only this stack: `Stop-WordPress.cmd`.
- Tests: `Test-WordPress.cmd` (Node.js required for tests; no npm installation).

The launcher creates separate `rb-care` database, WordPress and private-photo volumes. Only a new empty installation is initialized with the four seed products by default. Existing stores retain their data and settings on normal startup. Deliberate demo initialization uses `-InitializeDemo`; it is not a routine testing step. Legacy files remain archived and are not mounted or imported automatically. Optional import commands are documented in `MIGRATION.md`. Imports skip existing SKUs/UUIDs; they do not overwrite later WordPress edits. Ordinary stop/start preserves all volumes.

The local site blocks outgoing WordPress email and WooCommerce webhooks and uses an offline test method that leaves orders on hold. No Razorpay keys, real payment, hosting deployment or GitHub push was performed. Local core translation downloads from WordPress.org are allowed. The native WooCommerce Hindi pack was unavailable for the installed version; the companion plugin supplies the authored storefront translations instead.

## Manage the migrated store

| Task | WordPress location |
| --- | --- |
| Products, prices, stock, actual images | Products |
| City, delivery charge, warranty, condition, model, external reference photos | Product data → RB Care appliance |
| Orders and customer accounts | WooCommerce → Orders / WordPress Users |
| Seller review and team price | Seller requests |
| Contact and bulk enquiries | Customer enquiries |
| Policy/FAQ copy | Pages |
| Navigation | Appearance → Menus, Primary navigation |
| Native gateways and shipping | WooCommerce → Settings |

Seller requests start private and NEW. Save a positive price as QUOTED first; then separately select PUBLISHED if prior seller consent exists. Community output omits contacts, tracking hashes and owner notes. Closing the listing revokes public photo access. Seller images live outside the web root and are served through an authorization check. English/Hindi toggles preserve values in the current form; input values and customer descriptions stay unmodified.

The local catalog imports reference images without downloading/relabeling them as actual unit photos. Use the native product image/gallery controls to add verified unit photos. Unknown product details remain empty.

## Install on hosting later

1. Back up the destination database, content and private files first. Install supported WordPress/PHP and WooCommerce. Do not overwrite an existing live site's settings blindly.
2. Install `rb-care-commerce-1.0.1.zip` under Plugins and `rb-care-theme-1.0.0.zip` under Appearance → Themes; activate WooCommerce, the plugin and the theme.
3. Create a writable persistent private-photo directory **outside** the document root. Set `define('RBCARE_PRIVATE_DIR', '/absolute/private/rbcare-photos');` in server-side `wp-config.php`. Give the PHP account access; do not expose it through a public web-server alias.
4. Use the source bundle and WP-CLI commands in `MIGRATION.md` to import the catalogue and page content. These commands default to drafts unless `--publish` is explicitly supplied. The plugin does not create pages or import data just by being activated.
5. Assign WooCommerce shop/cart/checkout/account pages. Configure INR, tax treatment, country/service area, stock holding, supported payment gateway, shipping zones and `RB Care appliance delivery`. Local setup uses classic WooCommerce cart/checkout shortcodes; native Store API checkout city validation is also registered.
6. Set product permalinks to `/products/%product%/`, preserve slugs, and flush permalinks. Community detail links support `/community/UUID/`; private tracking links preserve the `#UUID:SECRET` format.
7. Resolve the inherited copy conflicts and finish the acceptance items in `MIGRATION.md` before launch. Configure a maintained WooCommerce Razorpay gateway in test mode and verify signatures/webhooks through that gateway before enabling live credentials.

Do not upload `dev/`, local credentials, test fixtures, Docker configuration, SQL backups or `.data/` to production. The installable ZIPs include only theme/plugin source and assets. The Docker local guard is deliberately excluded from them. Back up the database and private-photo directory together; a theme/plugin ZIP is not a backup of store data.

## Official documentation used

Reviewed directly on 2026-10-30: [WooCommerce classic theme integration](https://developer.woocommerce.com/docs/theming/theme-development/classic-theme-developer-handbook/), [WordPress capability checks](https://developer.wordpress.org/plugins/security/checking-user-capabilities/), [custom post types in plugins](https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/), and [WordPress nonces](https://developer.wordpress.org/apis/security/nonces/). Native WooCommerce shipping behavior was also checked against the installed 11.2.1 source.
