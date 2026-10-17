# Upgrade the existing admin: products & categories

No new GitHub token, password, Drive folder or deployment URL is needed.

1. In your existing Apps Script project, replace **Code.gs** with the complete latest `backend/Code.gs` from this repository.
2. Replace **Admin.html** with the complete latest `backend/Admin.html`.
3. Save. Do not run setupAdmin_ again: your existing password hash and session settings are retained.
4. Deploy → Manage deployments → select your existing Web app → Edit (pencil) → Version: **New version** → Deploy. Keep the same Execute as Me / Anyone configuration and use the same /exec URL.
5. Refresh the admin and sign in. The new page automatically adds missing product columns and stable IDs without deleting or rebuilding existing rows, materials or sales. Click **Retry website sync** once to publish the complete product catalog.

## Products

Use Add product for new stock. Example: Name `Toy 001`, Category `Toys`, Price `1250`, Delivery fee `325`. Leaving Category empty infers `Toys` from Toy 001, `Baby Bags` from Baby Bag 016, or the name prefix for other items. An explicit category always takes priority. Categories appear as soon as they have a visible product; no code edits are needed. Use Rename category to rename a whole category.

Edit product / price changes name, category, price, shipping, stock status, fixed size, three language descriptions, up to three photos and optional colors. Existing product links keep their IDs even if names or categories change. Material records follow product renames. Uncheck Visible on the website to hide a product without deleting it.

For a toy without color/material choices, leave Colors blank. Set Product Qty for stock tracked per item. Leave Product Qty blank when tracking separate material quantities. Do not track both the overall product and individual material quantities unless you intend to maintain both manually: confirming one sale does not automatically reduce the other.

Use product Confirm sale for whole-item Qty or the material Confirm sale for design Qty. Both reject repeated order references. WhatsApp clicks never deduct stock.

Custom stitching is a separate checkbox: leave it OFF for toys and other bought-in items. Zero-stock toys use an availability enquiry instead of promising seven-day stitching.

Website changes are already in GitHub; Apps Script requires the explicit deployment steps above. Published CSV/GitHub Pages changes can take a few minutes. Retry sync publishes all public product data; internal Sales rows and Drive IDs are excluded.

## Validation

Run `node tests/catalog.test.cjs` and `node tests/storefront-unit.test.cjs` for backend schema/category/price/sale tests and storefront/checkout logic. They use in-memory fixtures and do not mutate the live Sheet or send WhatsApp messages. Browser rendering and the actual Apps Script runtime still require checking after deployment.
