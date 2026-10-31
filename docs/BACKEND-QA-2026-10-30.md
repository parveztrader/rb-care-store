# WordPress admin QA — 2026-10-30

Local site: http://localhost:8096/ . Tested as the existing `rb_admin` administrator, plus an isolated temporary WooCommerce customer. WordPress 7.1.3, WooCommerce 11.2.1, RB Care theme 1.0.0, companion plugin updated to 1.0.1. No production website was involved.

## Results

| Area | Test and observed result |
| --- | --- |
| Login and dashboard | Browser login succeeded; product, seller, enquiry and WooCommerce menus loaded. Pending-request widget was present. |
| Product editor | Native Save Draft persisted price ₹1,234, Gonda/CENTRAL stock settings, model, 45-day warranty, ₹125 delivery charge, multiline tested functions and parsed specifications. The fixture stayed a draft. |
| Seller review validation | Attempting NEW → PUBLISHED through the admin form showed a rejection and retained NEW/zero price. |
| Quote | QUOTED at ₹1,800 and a customer-visible note saved through the UI; the same values appeared in bearer-protected tracking. |
| Publication | Separate PUBLISHED save succeeded after quotation and consent. Public community output omitted seller contact details, tracking secret and private note. |
| Closure | CLOSED saved through the UI; the public listing disappeared and its photo returned 404 to an unauthenticated visitor. Private tracking retained the saved price/status. |
| Enquiry admin | The actual saved contact enquiry and consent were visible only in its private admin record. |
| Order admin | Pending → On hold → Cancelled saved through the native HPOS order editor. Stock moved 1 → 0 → 1. No payment was collected. |
| Order snapshot and notes | The existing ₹1,000 order line stayed unchanged when the product price later became ₹1,234. A native private order note persisted with its private flag. |
| Customer restrictions | The customer account could not open product lists/editors, seller lists/editors, enquiries or order admin. |
| Form nonce | An admin product-save request with an invalid nonce returned 403 and did not change the title. |
| Notifications | A genuine authenticated WordPress Heartbeat request returned the pending seller-request count. |
| Syntax | PHP syntax checks passed for the current plugin/theme and QA PHP files. |

The published-stage backend run passed 38 assertions. The closed-stage run passed 34 assertions, including an additional check that authorized admin order access still works after the fix. These runs overlap; their counts should not be added as independent coverage. Native browser actions above were additionally verified against saved database/API values.

## Issue found and fixed

A logged-in customer requesting the HPOS order-admin page received an empty HTTP 500 from the native WooCommerce page controller. It did not expose the order. The companion plugin now checks the same order-list capability before that controller runs and returns a clear HTTP 403. Authorized admin access still returns 200. The fix is in `wp-content/plugins/rb-care-commerce/includes/core.php`; no vendor files were modified.

Plugin release: `rb-care-commerce-1.0.1.zip`. The theme remains `rb-care-theme-1.0.0.zip`. Updated source bundle: `rb-care-wordpress-source-1.0.1.zip`.

## Fixture cleanup and current state

Only the tagged QA product, order, seller record/photo, contact enquiry and temporary customer account were removed. The four source products and their stock were preserved. The pre-existing cancelled local checkout test order #41 was left intact.

After cleanup: 4 published products, 0 product drafts, 0 private seller requests, 0 private enquiries, 1 user (the original administrator), and 1 existing cancelled test order. Secrets, fixture receipts and generated reports stay in ignored local directories and are excluded from installable packages.

Screenshots supplied with the report: `wp-admin-order-test.jpg` (temporary order before cleanup) and `wp-admin-dashboard.jpg` (clean admin state afterward).

## Repeat the backend test

Run from `D:\gravity\rb-care-store`:

```powershell
node wordpress/tests/admin-prepare.mjs
```

The preparation command prints only fixture IDs. In WordPress admin, edit that draft product to the values described above; quote and separately publish the test seller request; view the contact enquiry; move the test order on hold, add the exact private test note from `admin-verify.php`, and cancel it. Use the IDs printed by this run, not the IDs from the earlier test.

```powershell
node wordpress/tests/admin-check.mjs PUBLISHED
```

Then close the seller request through admin and run:

```powershell
node wordpress/tests/admin-check.mjs CLOSED
node wordpress/tests/admin-cleanup.mjs
```

The fixtures and cleanup helpers require a local WordPress environment. A pending fixture run must be completed/cleaned before a new one can be prepared. Cleanup verifies its run tags, IDs and seller secret before touching records.

## Limits

This was functional backend QA and focused permission/nonce verification, not a full penetration test. Live payments/refunds, courier integration, real email/SMS delivery, production load and physical-device acceptance remain untested. The local mail guard blocks transport even though native WooCommerce order notes may say an email was sent. Policy wording conflicts noted in `MIGRATION.md` still require owner decisions. WordPress displayed a 7.1.4 update notice; testing did not change core or WooCommerce versions.
