# Detailed appliance listings

The product page uses an image gallery, a central product summary and a purchase panel, followed by a unit-specific condition report, technical specifications, included accessories and delivery/warranty policies.

Inventory → Edit in `/admin` now accepts up to 10 distinct image URLs (`Label | URL` per line), a photo-source declaration, description, features, capacity, color, specifications (`Label: Value`), included accessories, packaging, repair history and installation notes. The cover image remains compatible with existing cards/cart data. Never mark reference images as actual unit photos. Missing views appear as labelled placeholders, not duplicated images. Existing seed photography remains labelled as reference photography.

Admin edits persist in `.data/inventory.json` (ignored by Git). Set `PRODUCT_DATA_FILE` to an absolute path on a persistent disk in deployment. This is a single-server file store; distributed/serverless deployments require a shared database/object store. Public pages and checkout read the same saved inventory, rather than the client's seed catalog. Existing order reservations continue to be checked server-side.

Unknown dimensions, power ratings, accessory lists, colors and repair history are not invented. Add verified information from the unit/model label and upload/host its actual photos before promoting a listing. No original MRP, discounts, customer reviews, delivery dates or star ratings are manufactured. Product JSON-LD includes the actual listed price and used condition; image URLs are included only when labelled as actual unit photos.

Reference: the supplied Amazon product URL could not be opened past Amazon's continue screen. The page structure follows Amazon's official product-detail guidance at https://advertising.amazon.com/en-us/library/guides/improve-your-products-for-advertising, not an extracted copy of the supplied item.
