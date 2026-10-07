# Ranowin Production

Replace index.html, style.css and script.js in your existing GitHub Pages repository with these files. No framework or build step. Keep all three files in the same folder. Commit the files and allow GitHub Pages to finish deploying. Open the deployed URL and refresh once if older code appears.

## Configuration

At the top of script.js, the existing published Google Sheet URL and WhatsApp number are preserved. Set CONFIG.facebookURL to your actual Facebook page URL; the Facebook button appears when configured. The About page uses your existing Pannipitiya location.

The head in index.html contains the GA4 insertion point and your previous measurement ID. Analytics is not enabled until you insert the actual GA4 snippet.

## Google Sheet

Required headers: Name, Price.

Recommended headers:
ID, Name, Price, ImageLink, ImageLink2, ImageLink3, Status, DeliveryFee, DescriptionEN, DescriptionSI, DescriptionTA, ColorOptions, Size, Blue Patterns, Pink Patterns

- Use a unique, permanent ID for each bag so shared product links remain stable when rows move. Without ID, links use the row position.
- Status: In Stock or Out of Stock.
- ColorOptions: Blue,Pink (comma-separated inside one cell). Leave blank if there is no colour choice. Pattern columns automatically add their matching colour.
- Size: enter one fixed size per bag, e.g. L, XL or XXL. Customers cannot change this size. The older Sizes header is still accepted; put only one size in each cell.
- Blue Patterns / Pink Patterns: public direct image URLs separated with | (or newlines). Empty cells mean plain colour; no extra selector is shown. Other colours are supported as plain colours.
- ImageLink / ImageLink2 / ImageLink3: public HTTPS image URLs. Private Drive sharing pages are not image files.
- DescriptionEN / SI / TA: enter the actual features for each model in its language. Newlines are supported. Describe the main zipper pocket, back zipper pocket, two side pockets, front long pocket and any divisions, carrying handles and long shoulder strap where applicable. Features are not invented for bags with missing descriptions.
- Prices are LKR. Empty/invalid bag prices display Price on request. Empty/invalid delivery fees use the existing Rs.350 default; set each product’s actual fee explicitly.
- Publish the correct tab to the web as CSV. Changes may take time to appear in Google's published feed. Do not store customer details in this public sheet.

## Behaviour

Home, Products and About use hash routes compatible with GitHub Pages. Clicking a bag adds a product route to browser history; Back returns to the previous website view. A directly opened product URL has no earlier site history, so its visible Back to products link is always available.

The collection loads from your Sheet, with a 20-second timeout and Retry on failure. No fabricated products appear on failure. Search and stock filtering are available. Changing colour clears the pattern choice. A selected colour and applicable pattern are required before checkout. The fixed bag size is displayed and included automatically in the order. Custom orders show the 7-day notice in all three languages.

The checkout validates delivery details and opens WhatsApp with the bag, ID, size, colour, pattern image, price, delivery fee, total and delivery details. Customers must send the message in WhatsApp; the website does not charge payments or independently reserve stock. Actual availability is confirmed by your business.

## Validation

JavaScript syntax and CSV/data normalisation checks passed, including quoted commas, multiline fields, missing optional columns, safe image URLs, stock flags and duplicate IDs. Automated browser verification could not run in the supplied environment because its Chromium executable is unavailable. Before publishing, test on your phone: browse → choose bag → select colour/pattern → fill details → WhatsApp; then verify browser Back and custom orders against the live sheet.
