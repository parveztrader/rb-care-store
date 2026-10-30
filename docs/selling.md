# Customer appliance selling

- `/sell`: three-step Hinglish form, 1–6 JPG/PNG/WebP photos (3 MB each), seller details and consent to team review and publication.
- `/sell/track#REQUEST_ID:SECRET`: private receipt and team price. The secret stays in the URL fragment and is sent as a bearer header to the status API. Save this link; no SMS/email is sent automatically.
- `/admin/sell`: owner review, one team-approved price, customer-visible note, publish/close/decline controls. Every submission starts NEW and private, regardless of any customer-supplied price or status fields. NEW requests appear in the dashboard notification inbox, which checks for updates every 15 seconds while open. Only an authenticated team member can set the price and change status to QUOTED; the customer sees that exact rate on their private tracking page. Publication is a separate team action and requires prior QUOTED status, seller consent and a positive team price. Customers cannot set prices or publish their own submissions.
- `/community` and `/community/ID`: approved customer listings. Customer contact fields are never included. Approved listings display only the team price. Enquiries go through RB Care. These units are not added to refurbished store inventory or checkout.

## Owner access

Set `ADMIN_SELL_TOKEN` to a long random secret in the server environment. Enter it on the owner page. The browser holds it only in memory; Lock or reload to clear it. Do not use a NEXT_PUBLIC variable.

For local development only, if this variable is absent the first admin API request creates `.data/sell/admin-token.txt`. Open that local file to obtain the key. Production fails closed when the variable is absent.

## Persistence and deployment

Records and original image bytes are stored outside `public/` in `.data/sell`, ignored by Git. Writes use a temporary file and atomic rename. Data survives local server restarts. Photos of pending requests require owner/seller authorization; publication makes them public, and closing the listing removes public access.

This implementation targets the current single-server local app. Before deployment, set `SELL_DATA_DIR` to a writable persistent disk and back it up, or replace the store with a shared database and object storage. Ephemeral/serverless filesystems and multiple independent server disks are not supported. Put upload body limits and request rate limits at the reverse proxy in production. Notifications are in the admin dashboard only. No automatic pickup scheduling, payments, SMS, WhatsApp sending or market-price calculator is included. The team supplies the rate after reviewing the actual appliance.
