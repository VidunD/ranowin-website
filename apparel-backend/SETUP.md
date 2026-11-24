# Ranowin Apparel backend (separate from Baby Bag backend)

This creates a second Apps Script Web App and a separate Google Sheet. It does not replace or modify the existing Baby Bag backend.

## 1. Create the spreadsheet
Create a new Google Sheet named **Ranowin Apparel Database**. Copy only the spreadsheet ID from its URL.

## 2. Create Apps Script
Create a standalone project at https://script.google.com/ and add:
- Code.gs → contents of this folder's Code.gs
- Orders.gs → contents of Orders.gs (required for T-Shirt order saving, order management and image uploads)
- Reports.gs → contents of Reports.gs (monthly reports, payments and backups)
- HTML file named **Admin** → contents of Admin.html

## 3. Script Properties
In Project Settings → Script Properties, add:
| Property | Value |
|---|---|
| APPAREL_SHEET_ID | Spreadsheet ID only (not the full URL) |
| SUPER_ADMIN_EMAIL | Your Google account email |
| SUPER_ADMIN_PASSWORD | Unique password, 16+ characters |
| APPAREL_ADMIN_EMAIL | binadiperera05@gmail.com |
| APPAREL_ADMIN_PASSWORD | Separate unique password, 16+ characters |

Do not reuse the Baby Bag admin password. Credentials are converted to salted hashes by setup and then deleted from Script Properties.

## 4. Initialize and deploy
1. Select and run setupApparel_ once. Approve Sheets access.
2. Deploy → New deployment → Web app → Execute as Me → Who has access: Anyone.
3. Open the /exec URL to use the Apparel Admin. Keep this URL private.
4. Sign in as Super Admin and verify category workspaces.

## 5. Existing database migration
If this backend and Products sheet already exist, do **not** rerun setupApparel_ just to add the new fields. Paste the updated Code.gs, Orders.gs and Admin.html into Apps Script, select **migrateApparelStockAndSizeCharts_**, and Run it once. It appends the new colour-size stock column without deleting existing product rows. Existing shared size stock is assigned to the first colour as a safe starting point; review and adjust each colour/size quantity in Admin.

Then deploy the web app using **Deploy → Manage deployments → Edit → New version → Deploy**.

## 6. Product data
The Admin product editor supports:
- A separate whole-number stock quantity for every colour + size combination. A quantity of 0 means out of stock.
- Product photo uploads by drag-and-drop or the Upload photos button. Uploaded images are stored in a dedicated Google Drive folder and their URLs are saved with the product.
- Size-chart photo uploads by drag-and-drop or the Choose image button.
- A measurement table. Enter one row per line in this order: Size,Chest,Length,Waist,Hip. Use one consistent unit (cm or inches) per product.
- Existing images, colours, descriptions, categories and prices.

The public read-only catalogue endpoint is /exec?action=catalog. It returns active products with colour-size stock, photos and size chart. The repository's separate apparel.html/apparel.js page uses this endpoint and sends customer orders to this same Apparel backend. In apparel.js, set APPAREL_API_URL to the deployed Apparel Web App /exec URL.

## Security and order handling
- User roles and category access are checked by server functions.
- The apparel admin account and spreadsheet are separate from the Baby Bag admin login and database.
- Public catalogue reads are read-only. Order submission validates product, colour, size and available stock on the server, then reserves stock and appends the order to the Apparel Orders sheet.
- Admin can view T-Shirt orders and update their status. Payment records and monthly reports remain in the Apparel spreadsheet.

## 7. Summary reports and Google Drive backups
Add the new **Reports.gs** file from this folder to the same Apps Script project. It is a separate module and does not replace Code.gs.

The Admin page adds a **Summary Report & Charts** section:
- Monthly orders and goods sales
- Delivery fees charged (kept separate from goods sales)
- Payments received, based on payment dates
- Outstanding balances
- Monthly received-income and outstanding-balance charts

The reporting workbook is written to the separate reporting spreadsheet:
- Default spreadsheet: the existing Ranowin Apparel reporting spreadsheet
- Optional Script Property: `APPAREL_REPORT_SHEET_ID` (spreadsheet ID only)

The first **Backup Now** action creates a Google Drive folder named **Ranowin Apparel Backups**, saves timestamped Orders and Payments CSV files, creates a PDF summary, and refreshes the reporting workbook with monthly data and charts. The first run asks Google for the required Sheets, Drive and Docs permissions.

To enable scheduled backups, sign in as Admin and click **Enable Automatic Daily Backup** once. The Apps Script time trigger then runs the backup at approximately 2:00 AM in the project time zone.

The reporting module appends `DeliveryFee`, `GoodsTotal`, and `PaymentStatus` headers to the existing Orders sheet and creates a separate Payments sheet if it does not exist. Existing order rows and product data are preserved. The Admin page also includes a payment-entry form: enter the Apparel Order ID, payment date, total received, and its goods/delivery allocation. The server checks the order and remaining balance, prevents overpayment, and updates Paid / Partially Paid status. Received-income totals count payments by their payment dates; outstanding balances subtract all recorded payments linked to each order. Record goods and delivery allocations in `GoodsAmount` and `DeliveryAmount` for the split totals to be accurate.

After adding Reports.gs and updating Admin.html, deploy the web app with **Deploy → Manage deployments → Edit → New version → Deploy**.


## 8. Deploy and connect the apparel storefront
1. Add the updated Code.gs, Orders.gs, Reports.gs and Admin.html to the **separate Apparel Apps Script project**.
2. Run **migrateApparelStockAndSizeCharts_** once for an existing database. Run **setupApparel_** only for a new database.
3. Deploy the web app as **Execute as Me** and **Who has access: Anyone**. Approve Google Drive access the first time you upload an image.
4. Copy the deployed web app URL ending in **/exec**.
5. In the GitHub repository, open **apparel.js** and replace `PASTE_APPAREL_WEB_APP_EXEC_URL_HERE` with that URL. Do not put the URL in the Baby Bag script.
6. GitHub Pages will publish the separate **apparel.html** page. The main website has an Apparel navigation link.

The new order endpoint is POST to the same /exec URL with action=createOrder. Orders are stored only in the Apparel spreadsheet. Re-deploy the Apps Script web app using **Manage deployments → Edit → New version → Deploy** after changing Apps Script files.
## 9. Customer custom T-Shirt orders and WhatsApp

The Apparel storefront supports per-item customization:
- Printing method: no print, DTF, embroidery, or custom design discussion
- Placement: left/right chest, centre front, back, front and back, sleeve, or custom placement
- Back neck label: keep existing, custom woven brand label, printed neck label, remove, or discuss
- Free-text design and label instructions
- Up to 3 customer artwork/logo images per order (JPG, PNG, WEBP or GIF; 3 MB each)

When a customer submits an order, the image files are uploaded to the separate Apparel Google Drive folder, then the order and Drive links are saved in the Apparel Orders sheet. The site opens a pre-filled WhatsApp message to the existing Ranowin Production number +94 71 969 2801. The customer must still tap Send in WhatsApp. The Admin order card displays the custom specifications and links to uploaded artwork.

The public customer upload endpoint is separate from the authenticated Admin product-image uploader. It accepts only the listed image formats and enforces the 3 MB per-file limit. The first customer upload creates a Drive folder named Ranowin Apparel Customer Designs and asks the Apps Script owner to authorize Drive access. Re-deploy the Apps Script web app as a new version after updating Orders.gs and Admin.html.
