# Ranowin Production

Replace index.html, style.css and script.js in your existing GitHub Pages repository with these files. No framework or build step. Keep all three files in the same folder. Commit the files and allow GitHub Pages to finish deploying. Open the deployed URL and refresh once if older code appears.

## Configuration

At the top of script.js, the existing published Google Sheet URL and WhatsApp number are preserved. CONFIG.facebookURL is configured to https://web.facebook.com/ranowinproduction. The About page uses your existing Pannipitiya location.

The head in index.html contains the GA4 insertion point and your previous measurement ID. Analytics is not enabled until you insert the actual GA4 snippet.

## Google Sheet

Required headers: Name, Price.

Recommended headers:
ID, Name, Price, ImageLink, ImageLink2, ImageLink3, Status, DeliveryFee, DescriptionEN, DescriptionSI, DescriptionTA, ColorOptions, Size, Blue Patterns, Pink Patterns

- Use a unique, permanent ID for each bag so shared product links remain stable when rows move. Without ID, links use the row position.
- Status: In Stock or Out of Stock.
- ColorOptions: Blue,Pink (comma-separated inside one cell). Leave blank if there is no colour choice. Pattern columns automatically add their matching colour.
- Size: enter one fixed size per bag, e.g. L, XL or XXL. Customers cannot change this size. The older Sizes header is still accepted; put only one size in each cell.
- Blue Patterns / Pink Patterns: repository-relative image paths or public direct image URLs separated with | (or newlines). Empty cells mean plain colour; no extra selector is shown. Other colours are supported as plain colours.
- ImageLink / ImageLink2 / ImageLink3: a repository-relative filename such as 001.jpg, a relative folder path such as images/001.jpg, or a public HTTPS image URL. GitHub blob links are converted to raw image links. Private Drive sharing pages are not image files.
- DescriptionEN / SI / TA: enter the actual features for each model in its language. Newlines are supported. Describe the main zipper pocket, back zipper pocket, two side pockets, front long pocket and any divisions, carrying handles and long shoulder strap where applicable. Features are not invented for bags with missing descriptions.
- Prices are LKR. Empty/invalid bag prices display Price on request. Empty/invalid delivery fees use the existing Rs.350 default; set each product’s actual fee explicitly.
- Publish the correct tab to the web as CSV. Changes may take time to appear in Google's published feed. Do not store customer details in this public sheet.

## Behaviour

Home, Products and About use hash routes compatible with GitHub Pages. Clicking a bag adds a product route to browser history; Back returns to the previous website view. A directly opened product URL has no earlier site history, so its visible Back to products link is always available.

The collection loads from your Sheet, with a 20-second timeout and Retry on failure. No fabricated products appear on failure. Search and stock filtering are available. Changing colour clears the pattern choice. A selected colour and applicable pattern are required before checkout. The fixed bag size is displayed and included automatically in the order. Custom orders show the 7-day notice in all three languages.

The checkout validates delivery details and opens WhatsApp with the bag, ID, size, colour, pattern image, price, delivery fee, total and delivery details. Customers must send the message in WhatsApp; the website does not charge payments or independently reserve stock. Actual availability is confirmed by your business.

## Validation

JavaScript syntax and CSV/data normalisation checks passed, including quoted commas, multiline fields, missing optional columns, safe image URLs, stock flags and duplicate IDs. Automated browser verification could not run in the supplied environment because its Chromium executable is unavailable. Before publishing, test on your phone: browse → choose bag → select colour/pattern → fill details → WhatsApp; then verify browser Back and custom orders against the live sheet.


## October 2026 update

The Home page language selector controls navigation, descriptions and checkout labels across the site. English, Sinhala and Tamil are supported, and the choice persists when local storage is available. There is no language selector inside product details. The theme uses pale blue, purple with white lettering, and pale red accents. The About page credits Vidun Damsana with telephone 075 132 8199; business orders continue to use the existing Ranowin WhatsApp number.

Validation: current published CSV parsed successfully with 15 products; relative and GitHub image links, Sinhala/Tamil labels, fixed-size details, removal of detail language control, colour/pattern reset and generated WhatsApp order details checked with a simulated DOM. Visual browser verification remains to be completed.


## Android app installation

Ranowin Production is also configured as an installable Progressive Web App (PWA). It uses the same live website, product feed, WhatsApp checkout and existing backend; it does not create a second product database or payment system.

After GitHub Pages publishes the latest commit:
1. Open https://ranowin.com.lk/ in Chrome on Android.
2. Wait for the page to finish loading.
3. Tap the **Install** prompt if it appears, or open Chrome's menu (⋮) and choose **Install app** / **Add to Home screen**.
4. Open **Ranowin** from the Android home screen.

The service worker caches the app shell for faster repeat loading and a basic offline fallback. Live stock data is deliberately fetched from the network, so offline mode does not promise current stock or checkout. This PWA is not a standalone APK and is not automatically published to Google Play.
