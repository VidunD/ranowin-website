# Private orders and postal receipts

## Install this upgrade

1. Replace the complete Apps Script `Code.gs` and `Admin.html` with the matching files in this repository. Keep your existing Script Properties and password unchanged. Do not rerun setupAdmin_().
2. Save. Deploy > Manage deployments > pencil > Version: New version > Deploy. Keep Execute as: Me and the existing web-app access setting; every data operation requires the admin session.
3. Open the existing admin /exec URL, refresh, sign in, and click **Open / activate private orders**. Authorize the new spreadsheet creation scope if Google asks.
4. Activation creates `Ranowin Private Orders` in the script owner's Drive and stores its ID as `ORDERS_SHEET_ID`. Keep that spreadsheet private and unpublished. Never use the published product spreadsheet for this property. Both laptops use the same admin /exec URL and login.
5. Test with a dummy customer and one inexpensive test order before entering real orders. The Apps Script deployment cannot be performed by a repository commit.

No customer information is added to `stock.json`, GitHub, the published product CSV, or browser localStorage. Orders use the existing admin credentials. Treat anyone with those credentials as having access to all customer records. Back up the private orders spreadsheet periodically.

## Daily use

- New order: customer, phone, address, 1–20 item lines, color / pattern, quantity, actual agreed unit price and delivery charge. Catalog prices are suggested; the saved order keeps its original price even after catalog edits.
- Save draft does not deduct stock. WhatsApp messages are entered manually in this release; opening WhatsApp is not confirmation and does not create an order in this database.
- Confirm & deduct tracked stock: for each line, a tracked material quantity takes priority; otherwise tracked product quantity is used. Untracked quantities stay untracked. A second confirmation is rejected. Do not also use the legacy Confirm sale buttons for these same items.
- Confirmed orders cannot be edited. Cancel the incorrect order, return its stock if appropriate, and create a corrected draft.
- Dispatch: save the postal barcode and dispatch date. The barcode cannot be assigned to another order. Update the existing dispatch if you correct a barcode. Delivered status is manual; this is not a postal tracking API.
- Cancel is available before dispatch. Return is available after dispatch / delivery. Neither changes stock automatically. **Return items to stock** restores the original tracked quantities once, when the goods are physically available again. Restore a deleted tracked material before restocking its historical order.
- An interrupted confirmation stores a recovery journal. Use **Recover stock update** on that order; do not manually adjust inventory during recovery. Target stock values are checked so retrying does not apply the same deduction twice. Other inventory edits are blocked while a recovery is pending. If stock has independently changed, investigate before retrying.
- Website sync failures do not undo an order or stock confirmation. Retry website sync; do not confirm a second time.

## Postal payments

Record a receipt only when the money is actually received. Delivery and payment status are independent. You can record partial payments. For a combined monthly remittance, open each relevant order and use the same remittance reference with the amounts allocated to that order. A repeated reference on the same order is rejected; another installment on that same order needs its own distinct reference.

- Goods received: the merchandise portion settled in the remittance, excluding delivery.
- Delivery received: the delivery portion settled.
- Postal deduction: fee withheld from those settled amounts, if any. Allocate a combined fee across the corresponding orders once; do not repeat the full fee on every order.
- Actual cash = goods received + delivery received - postal deduction.
- Goods receipts are sales receipts, not profit. Costs and refunds are not calculated here.

Example: merchandise 3,000, delivery 400, postal deduction 100 => goods receipts 3,000; delivery receipts 400; cash 3,300. If your postal statement excludes delivery entirely, leave delivery received at zero until it is actually settled; do not invent a receipt merely to close the order.

The month filter uses receipt dates; outstanding total always covers all dates. Cancelled / returned orders are excluded from active outstanding totals, but historical cash receipts remain visible. Void mistaken entries with a reason; history is retained. Voiding is a correction, not a real refund workflow. Actual refunds require a separate accounting entry in Manager.

## Manager Desktop 26.4.30 invoice import

This release exports customer and invoice TSVs compatible in structure with the supplied Sales Invoices template. It does not connect to the installed application over the internet. The actual import must be validated in your Manager business. Back up Manager before the first test import.

1. Create/find the customer in Manager. You can link the UUID manually from Customers Batch Update, or paste the imported customer export under **Link the newly imported customer automatically**. The app matches its exact order Code and saves the Customer Key. Do not use an invoice Key. Customer creation is manual: the supplied sample describes invoices, not the Customer import schema.
2. For a manual link, save that UUID under the order's Manager invoice section. For automatic matching, use **Find & save customer UUID**. Batch Create does not return the new UUID to our app, so this export/link step is necessary.
3. Set each order line's real Manager item code / ID while editing the draft. Alternatively configure a valid **sales Account UUID** in Manager import settings for lines without items. Do not invent IDs or use the sample customer's UUID for new customers.
4. Configure the actual Delivery Item UUID and optional invoice Theme UUID from your own Manager data. If delivery has no item, it falls back to the configured sales Account; confirm this account treatment is appropriate in Manager.
5. Prepare Manager import > Copy import text. In Manager use **Sales Invoices > Batch Create**, paste, Next, and review customer, quantities, merchandise total, delivery, dates, and printed theme before completing the creation. Do not paste it into Batch Update.
6. Mark **Invoice already imported** in the order after Manager successfully creates it. The app blocks another export while marked imported, but cannot detect a repeat paste inside Manager. Search the exported order reference in Manager before retrying an uncertain import.

The export creates an invoice only. It does not record Manager payments, automatically create a separate delivery bill, or guarantee the existing custom print theme reproduces your postal document. Review the first printed invoice / delivery document and adjust the Manager template separately if required. Copy customer / order details remains available for manual billing.

## Validation performed

Node backend tests cover authentication boundaries, separate private storage, multi-item totals, material/product stock priority, duplicate and stale actions, dispatch, partial receipts, fee split, payment voiding, overpayment rejection, Manager TSV construction, imported flag, return stock once and interrupted stock recovery. Existing catalog and cart regression tests pass. Admin JavaScript syntax, initial handlers and static element IDs were checked. The Apps Script live deployment, authorization prompts, rendered browser layout, actual postal statements and Manager import/printing must be checked in the owner's environment.

Customer import includes Name, Code, BillingAddress, DeliveryAddress and Inactive from the supplied Customer template. Phone is included in the addresses because the template only exposes legacy telephone fields. Currency, control account and other optional values use Manager defaults. Review those defaults before creating the customer. Import text uses quoted multiline TSV; copy it directly without hand-editing quotes. Exact Code matching rejects missing or duplicate matches, malformed quoted text and invalid Customer Keys. Imported customer data is not retained beyond the matching UUID; the pasted export is cleared when the order view refreshes.

## Save Manager product links once

After updating Code.gs and Admin.html and deploying a new version, open private orders > Manager import settings. Under **Link products to Manager once**, select the exported Inventory Items .txt file (or paste the full Batch Update export) and click **Save product links from export**. No exported customer or inventory file is bundled in this public repository. Links are stored privately in Script Properties, separate from catalog / stock.json.

The importer matches website names such as `Baby Bag 001` with Manager `ItemCode=001` and `ItemName=BABY BAG`. It skips inactive exported items, rejects duplicate codes and invalid UUIDs, preserves unmatched existing links, and separately links the `DELIVERY` code when present. The success report lists the number of bags linked and any website bags without matches. It does not change product prices, quantities, order statuses, customer links or themes.

New order lines auto-fill the linked product UUID when you select a product. Existing draft lines with empty IDs get the saved default in the editor; saving snapshots that default. A blank historical line can also use the current mapping during export, while a nonblank line ID remains unchanged. Reopen an already-open draft after importing links. Order-specific overrides remain possible.

For new products or other categories, choose the product under **Save this product link**, paste its real Manager item Key UUID and save once. Leave it blank to remove the default link. Website IDs are the mapping keys, so renaming a product does not break its saved link. Existing direct Manager IDs on saved order lines are not changed automatically when defaults change.

## Clean invoice descriptions and customer names

New customer exports omit Code, so Manager displays the customer's name without an order UUID prefix. Automatic linking now matches exact Name + full BillingAddress (including phone); old exports with Code equal to the original order ID remain supported. Missing/ambiguous matches are rejected. Customers already created in Manager retain their existing Code: edit that customer's Code in Manager to clear it if you want the name-only display; do not create the customer again.

Invoice lines show product / color / Pattern N, with no photo URL or filename. Saving a draft snapshots the pattern number from the product's color-specific pattern list. There is also a Pattern label field for untracked designs. Historical orders without a snapshot infer the number from the current catalog; if the old design no longer exists there, its unknown number is omitted. Keep image URLs privately on the order for identifying the actual design; they are not printed on the invoice export.

New orders receive RW-000001-style references, generated under the existing script lock. Internal UUIDs remain unchanged for data integrity. Existing order references remain unchanged to avoid invoice duplicates. The updated bill theme reads invoice number/reference from Manager's document fields. This theme update is separate from Apps Script deployment. Already imported invoices are not automatically changed: edit their description/theme in Manager and do not reimport them.
