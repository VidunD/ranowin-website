# Ranowin Apparel backend (separate from Baby Bag backend)

This creates a second Apps Script Web App and a separate Google Sheet. It does not replace or modify the existing Baby Bag backend.

## 1. Create the spreadsheet
Create a new Google Sheet named **Ranowin Apparel Database**. Copy only the spreadsheet ID from its URL.

## 2. Create Apps Script
Create a standalone project at https://script.google.com/ and add:
- Code.gs → contents of this folder's Code.gs
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
If this backend and Products sheet already exist, do **not** rerun setupApparel_ just to add the new fields. Paste the updated Code.gs and Admin.html into Apps Script, select **migrateApparelStockAndSizeCharts_**, and Run it once. It appends these columns without deleting existing product rows:
- StockJSON — stock quantity for each size
- SizeChartImage — HTTPS URL for the size-chart image
- SizeChartJSON — measurement rows (size, chest, length, waist, hip)

Then deploy the web app using **Deploy → Manage deployments → Edit → New version → Deploy**.

## 6. Product data
The Admin product editor supports:
- A separate whole-number stock quantity for every size. A quantity of 0 means out of stock.
- A size-chart image URL.
- A measurement table. Enter one row per line in this order: Size,Chest,Length,Waist,Hip. Use one consistent unit (cm or inches) per product.
- Existing images, colours, descriptions, categories and prices.

The public read-only catalogue endpoint is /exec?action=catalog. It returns active products with sizes, stockBySize, sizeChartImage and sizeChart fields. A customer-facing apparel page must read these fields to display available sizes and the Size Guide. This endpoint is separate from the existing Baby Bag storefront and does not automatically connect or change its order flow.

## Security and current scope
- User roles and category access are checked by server functions.
- The apparel admin account is separate from the Baby Bag admin login.
- The public catalogue endpoint is read-only. Do not store customer design files in a public repository.
- This backend currently manages catalogue data and per-size stock values. It does not yet decrement stock automatically when a customer places an order; that requires connecting the apparel order submission flow to a server-side stock-reservation function.

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

The reporting module appends `DeliveryFee`, `GoodsTotal`, and `PaymentStatus` headers to the existing Orders sheet and creates a separate Payments sheet if it does not exist. Existing order rows and product data are preserved. Received-income totals count payments by their payment dates; outstanding balances subtract all recorded payments linked to each order. Record goods and delivery allocations in `GoodsAmount` and `DeliveryAmount` for the split totals to be accurate.

After adding Reports.gs and updating Admin.html, deploy the web app with **Deploy → Manage deployments → Edit → New version → Deploy**.
