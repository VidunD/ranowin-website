# Cart ordering

Customers choose a product's color and material, enter quantity next to Add to cart, then open Cart in the navigation. Different color/material choices become separate lines; identical choices combine. They can adjust quantities or remove lines and send one itemized WhatsApp message with delivery/contact details.

Delivery rules are per order, using the total number of bags (including quantity on the same line):

- One item: use that product's existing delivery fee.
- Exactly two bags: LKR 600.
- Exactly three bags: LKR 700.
- Four or more bags, or multi-item orders containing other categories: delivery and grand total are marked for WhatsApp confirmation. No additional rate has been invented.

The cart persists only product IDs, color, pattern URL and quantity in localStorage. Contact details are not persisted. Prices come from the current catalog and are checked again against stock.json at checkout. Removed products/options and stock excesses block checkout; eligible zero-stock custom bags remain explicit custom requests. Quantity caps apply to the same material and to tracked whole-product stock. Availability is not reserved and only a confirmed admin sale deducts stock. The cart is retained after opening WhatsApp because opening a link is not proof of a sent/confirmed order.

This feature changes only the GitHub Pages frontend. No Apps Script code, properties or deployment changes are required. Keep cart.js loaded before script.js (both deferred) as in index.html.

Validation: `node tests/cart.test.cjs`, `node tests/cart-boot.test.cjs` and `node tests/storefront-unit.test.cjs`. Tests use fixtures and do not send messages or alter live stock. The boot test checks both actual scripts together with a minimal DOM; it is not a substitute for a real mobile-browser layout check.
