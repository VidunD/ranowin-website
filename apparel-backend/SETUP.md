# Ranowin Apparel backend (separate from Baby Bag backend)

This creates a second Apps Script Web App and a separate Google Sheet. It does not replace or modify the existing Baby Bag backend.

## 1. Create the spreadsheet
Create a new Google Sheet named **Ranowin Apparel Database**. Copy its ID from the URL.

## 2. Create Apps Script
Create a standalone project at https://script.google.com/ and add:
- Code.gs → contents of this folder's Code.gs
- HTML file named **Admin** → contents of Admin.html

## 3. Script Properties
In Project Settings → Script Properties, add:
| Property | Value |
|---|---|
| APPAREL_SHEET_ID | New spreadsheet ID |
| SUPER_ADMIN_EMAIL | Your Google account email |
| SUPER_ADMIN_PASSWORD | Unique password, 16+ characters |
| APPAREL_ADMIN_EMAIL | binadiperera05@gmail.com |
| APPAREL_ADMIN_PASSWORD | Separate unique password, 16+ characters |

Do not reuse the Baby Bag admin password. These credentials are converted to salted hashes by setup and then deleted from Script Properties.

## 4. Initialize and deploy
1. Select and run setupApparel_ once. Approve Sheets access.
2. Deploy → New deployment → Web app → Execute as Me → Who has access: Anyone.
3. Open the /exec URL to use the Apparel Admin. Keep this URL private.
4. Sign in as Super Admin and verify that all category workspaces are visible.
5. Sign in separately with binadiperera05@gmail.com and verify that only the five initial apparel workspaces are visible.

## Security and current scope
- User roles are checked by server functions, not just hidden in the page.
- The apparel admin account is separate from the Baby Bag admin login and cannot call Super Admin category/pricing functions.
- This is email + password authentication: the email is the account identifier, not proof of Google identity. Share the apparel password with the invited admin privately.
- The customer-facing apparel catalogue endpoint is /exec?action=catalog. It is public read-only JSON. Do not store customer design files in a public repository.
- Product fields currently support base price, colours, sizes, images and description. Printing options (DTF/embroidery, placement, design size), quantity-tier pricing, private artwork uploads and apparel order submission are the next integration layer; this initial backend does not yet calculate those custom-print charges or accept design files.
- Existing Baby Bag site/cart/order flows remain unchanged. Two Apps Script deployments are fine on one domain, but the apparel feed and cart/order path must be connected before apparel products appear on the live website.
