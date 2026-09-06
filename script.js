/* ==========================================================
   Ranowin Enterprises — site script
   No frameworks, no build step — just vanilla JS.
   ========================================================== */

/* ----------------------------------------------------------
   1. CONFIG — edit these for your business
   ---------------------------------------------------------- */

// TODO: replace with your published Google Sheet CSV link.
// In Google Sheets: File > Share > Publish to web > select the sheet,
// choose "Comma-separated values (.csv)", then paste that link here.
// Expected columns (first row = headers): Name, Price, ImageLink, Status
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRX3ME8gLubgdcM-QzUKRJ7GO0pabllVpknR11UGFBlOQ5YbCfmNf4rEAdOKTYIgdfi7i5an1Nx-L3K/pub?output=csv';

const WHATSAPP_NUMBER = '94719692801'; // international format, no + and no leading 0
const DELIVERY_FEE = 350;

// Shown only if the Google Sheet above can't be reached (e.g. while it's
// still a dummy URL, or if you open index.html directly from disk, where
// browsers block cross-origin fetches). Replace or remove once your sheet
// is live — this is just so the page isn't empty during development.
const FALLBACK_PRODUCTS = [
  { name: 'Bag Model 001', price: 1800, image: '', status: 'In Stock' },
  { name: 'Bag Model 002', price: 2200, image: '', status: 'In Stock' },
  { name: 'Bag Model 003', price: 1950, image: '', status: 'Out of Stock' },
  { name: 'Bag Model 004', price: 2450, image: '', status: 'In Stock' },
  { name: 'Bag Model 005', price: 2000, image: '', status: 'In Stock' },
  { name: 'Bag Model 006', price: 2650, image: '', status: 'Out of Stock' }
];

const BAG_ICON_SVG = `<svg viewBox="0 0 24 24" class="product-icon" aria-hidden="true">
  <path d="M6 8h12l-1.2 12.5a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9L6 8Z"/>
  <path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>
</svg>`;

/* ----------------------------------------------------------
   2. TRANSLATIONS
   NOTE: The Sinhala and Tamil strings below are a best-effort
   translation. Please have a native speaker review them
   before this goes live — a couple of words may read stiffly.
   ---------------------------------------------------------- */
const translations = {
  en: {
    brandSubtitle: 'Baby bags, made simple',
    sectionOurBags: 'Our Bags',
    heroHeadline: 'Bags built for the newborn years.',
    heroSub: 'Soft-structured, easy-clean baby bags designed for hospital trips, daily outings, and everything a new parent carries.',
    dataNotice: 'Showing demo products — connect your Google Sheet to see live inventory.',
    loadingProducts: 'Loading products…',
    orderNow: 'Order Now',
    outOfStock: 'Out of Stock',
    backToShop: 'Back to shop',
    itemPriceLabel: 'Bag Price',
    deliveryLabel: 'Delivery Fee',
    totalLabel: 'Total',
    formSectionTitle: 'Delivery Details',
    labelName: 'Name',
    labelAddress: 'Delivery Address',
    labelPhone: 'Phone Number',
    labelColor: 'Bag Color',
    labelNote: 'Special Note (optional)',
    colorBlue: 'Blue',
    colorPink: 'Pink',
    selectColor: 'Select a color',
    placeholderName: 'Your full name',
    placeholderAddress: 'House no, street, city',
    placeholderPhone: '07XXXXXXXX',
    placeholderNote: 'Anything else we should know?',
    submitBtn: 'Send Order via WhatsApp',
    footerText: '© 2026 Ranowin Enterprises',
    errorRequired: 'This field is required.',
    errorPhone: 'Please enter numbers only (9–10 digits).',
    errorColor: 'Please select a bag color.'
  },
  si: {
    brandSubtitle: 'ළදරු බෑග් - සරලවම',
    sectionOurBags: 'අපගේ බෑග්',
    heroHeadline: 'අලුත උපන් දරුවන්ට ගැලපෙන බෑග්.',
    heroSub: 'රෝහල් සංචාර, දෛනික ගමන් සහ නව දෙමාපියෙකු රැගෙන යන සියල්ලටම ගැලපෙන මෘදු, පිරිසිදු කිරීමට පහසු ළදරු බෑග්.',
    dataNotice: 'නියැදි නිෂ්පාදන පෙන්වයි — සජීවී තොග දැක්වීමට ඔබේ Google Sheet සම්බන්ධ කරන්න.',
    loadingProducts: 'නිෂ්පාදන පූරණය වෙමින්…',
    orderNow: 'දැන් ඇණවුම් කරන්න',
    outOfStock: 'තොග අවසන්',
    backToShop: 'සාප්පුවට ආපසු',
    itemPriceLabel: 'බෑග් මිල',
    deliveryLabel: 'බෙදාහැරීමේ ගාස්තුව',
    totalLabel: 'මුළු මුදල',
    formSectionTitle: 'බෙදාහැරීමේ විස්තර',
    labelName: 'නම',
    labelAddress: 'බෙදාහැරීමේ ලිපිනය',
    labelPhone: 'දුරකථන අංකය',
    labelColor: 'බෑගයේ වර්ණය',
    labelNote: 'විශේෂ සටහන (අත්‍යවශ්‍ය නොවේ)',
    colorBlue: 'නිල්',
    colorPink: 'රෝස',
    selectColor: 'වර්ණයක් තෝරන්න',
    placeholderName: 'ඔබේ සම්පූර්ණ නම',
    placeholderAddress: 'ගෙය අංකය, වීදිය, නගරය',
    placeholderPhone: '07XXXXXXXX',
    placeholderNote: 'අපි දැනගත යුතු වෙනත් දෙයක් තිබේද?',
    submitBtn: 'WhatsApp හරහා ඇණවුම යවන්න',
    footerText: '© 2026 Ranowin Enterprises',
    errorRequired: 'මෙම ක්ෂේත්‍රය අවශ්‍යයි.',
    errorPhone: 'කරුණාකර ඉලක්කම් පමණක් ඇතුළත් කරන්න (අංක 9–10).',
    errorColor: 'කරුණාකර බෑග් වර්ණයක් තෝරන්න.'
  },
  ta: {
    brandSubtitle: 'குழந்தை பைகள் - எளிதாக',
    sectionOurBags: 'எங்கள் பைகள்',
    heroHeadline: 'புதிதாகப் பிறந்த குழந்தைகளுக்கு ஏற்ற பைகள்.',
    heroSub: 'மருத்துவமனை பயணங்கள், தினசரி வெளியீடுகள் மற்றும் புதிய பெற்றோர் சுமக்கும் அனைத்திற்கும் ஏற்ற மென்மையான, சுத்தம் செய்ய எளிதான குழந்தை பைகள்.',
    dataNotice: 'மாதிரி பொருட்கள் காட்டப்படுகின்றன — நேரடி இருப்பைக் காண உங்கள் Google Sheet-ஐ இணைக்கவும்.',
    loadingProducts: 'பொருட்கள் ஏற்றப்படுகின்றன…',
    orderNow: 'இப்போது ஆர்டர் செய்யவும்',
    outOfStock: 'கையிருப்பு இல்லை',
    backToShop: 'கடைக்குத் திரும்பு',
    itemPriceLabel: 'பை விலை',
    deliveryLabel: 'டெலிவரி கட்டணம்',
    totalLabel: 'மொத்தத் தொகை',
    formSectionTitle: 'டெலிவரி விவரங்கள்',
    labelName: 'பெயர்',
    labelAddress: 'டெலிவரி முகவரி',
    labelPhone: 'தொலைபேசி எண்',
    labelColor: 'பை நிறம்',
    labelNote: 'சிறப்பு குறிப்பு (விருப்பத்திற்குரியது)',
    colorBlue: 'நீலம்',
    colorPink: 'இளஞ்சிவப்பு',
    selectColor: 'ஒரு நிறத்தை தேர்ந்தெடுக்கவும்',
    placeholderName: 'உங்கள் முழுப்பெயர்',
    placeholderAddress: 'வீட்டு எண், தெரு, நகரம்',
    placeholderPhone: '07XXXXXXXX',
    placeholderNote: 'நாங்கள் தெரிந்து கொள்ள வேண்டிய வேறு ஏதேனும் உள்ளதா?',
    submitBtn: 'WhatsApp மூலம் ஆர்டரை அனுப்பவும்',
    footerText: '© 2026 Ranowin Enterprises',
    errorRequired: 'இந்த புலம் அவசியம்.',
    errorPhone: 'எண்களை மட்டும் உள்ளிடவும் (9–10 இலக்கங்கள்).',
    errorColor: 'தயவுசெய்து ஒரு பை நிறத்தை தேர்ந்தெடுக்கவும்.'
  }
};

let currentLang = 'en';

/* ----------------------------------------------------------
   3. LANGUAGE SWITCHING
   ---------------------------------------------------------- */
function applyTranslations(lang) {
  const dict = translations[lang];

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });
}

function setLanguage(lang) {
  if (!translations[lang]) lang = 'en';
  currentLang = lang;
  document.documentElement.lang = lang;
  applyTranslations(lang);

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  try { localStorage.setItem('ranowin_lang', lang); } catch (e) { /* storage unavailable, ignore */ }
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

/* ----------------------------------------------------------
   4. CSV FETCH + PARSE
   ---------------------------------------------------------- */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] || '').trim(); });
      return obj;
    });
}

function normalizeProducts(rawRows) {
  return rawRows.map((r) => ({
    name: r.Name || 'Unnamed Bag',
    price: parseFloat(String(r.Price || '').replace(/[^0-9.]/g, '')) || 0,
    image: r.ImageLink || '',
    status: (r.Status || 'In Stock').trim()
  }));
}

async function loadProducts() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);
    if (rows.length === 0) throw new Error('Sheet returned no rows');
    return { products: normalizeProducts(rows), isFallback: false };
  } catch (err) {
    console.warn('[Ranowin] Could not load the Google Sheet CSV — showing demo products instead.', err);
    return { products: FALLBACK_PRODUCTS, isFallback: true };
  }
}

function sortByStock(products) {
  return [...products].sort((a, b) => {
    const aOut = a.status.toLowerCase() === 'out of stock' ? 1 : 0;
    const bOut = b.status.toLowerCase() === 'out of stock' ? 1 : 0;
    return aOut - bOut; // stable sort keeps original order within each group
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ----------------------------------------------------------
   5. RENDER PRODUCT GRID
   ---------------------------------------------------------- */
const productGrid = document.getElementById('productGrid');
const loadingText = document.getElementById('loadingText');
const dataNotice = document.getElementById('dataNotice');

function renderProducts(products) {
  productGrid.innerHTML = products.map((product, index) => {
    const isOut = product.status.toLowerCase() === 'out of stock';
    const altClass = index % 2 === 1 ? ' product-image--alt' : '';

    return `
      <article class="product-card">
        <div class="product-image${altClass}">
          ${BAG_ICON_SVG}
          ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.style.display='none'">` : ''}
          ${isOut ? `<span class="stock-badge" data-i18n="outOfStock">Out of Stock</span>` : ''}
        </div>
        <div class="product-body">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-price">Rs. ${product.price.toLocaleString()}</p>
          <button type="button"
                  class="btn-primary order-btn${isOut ? ' btn-disabled' : ''}"
                  ${isOut ? 'disabled' : ''}
                  data-name="${escapeHtml(product.name)}"
                  data-price="${product.price}"
                  data-image="${escapeHtml(product.image)}">
            <span data-i18n="${isOut ? 'outOfStock' : 'orderNow'}">${isOut ? 'Out of Stock' : 'Order Now'}</span>
          </button>
        </div>
      </article>
    `;
  }).join('');

  applyTranslations(currentLang);
}

/* Event delegation: one listener handles every Order Now button,
   including ones added/replaced by future re-renders. */
productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.order-btn');
  if (!btn || btn.disabled) return;
  lastFocusedElement = btn;
  openCheckout({
    name: btn.dataset.name,
    price: Number(btn.dataset.price),
    image: btn.dataset.image
  });
});

/* ----------------------------------------------------------
   6. FULL-SCREEN CHECKOUT VIEW
   ---------------------------------------------------------- */
const checkoutView = document.getElementById('checkoutView');
const checkoutBack = document.getElementById('checkoutBack');
const checkoutImage = document.getElementById('checkoutImage');
const checkoutProductName = document.getElementById('checkoutProductName');
const checkoutItemPrice = document.getElementById('checkoutItemPrice');
const checkoutDeliveryFee = document.getElementById('checkoutDeliveryFee');
const checkoutTotal = document.getElementById('checkoutTotal');

const orderForm = document.getElementById('orderForm');
const custName = document.getElementById('custName');
const custAddress = document.getElementById('custAddress');
const custPhone = document.getElementById('custPhone');
const custColor = document.getElementById('custColor');
const custNote = document.getElementById('custNote');

let selectedProduct = null;
let lastFocusedElement = null;

function openCheckout(product) {
  selectedProduct = product;
  const total = product.price + DELIVERY_FEE;

  checkoutProductName.textContent = product.name;
  checkoutItemPrice.textContent = `Rs. ${product.price.toLocaleString()}`;
  checkoutDeliveryFee.textContent = `Rs. ${DELIVERY_FEE.toLocaleString()}`;
  checkoutTotal.textContent = `Rs. ${total.toLocaleString()}`;

  checkoutImage.innerHTML = `
    ${BAG_ICON_SVG}
    ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" onerror="this.style.display='none'">` : ''}
  `;

  clearAllErrors();
  orderForm.reset();

  document.body.classList.add('checkout-locked');
  checkoutView.classList.add('open');
  checkoutView.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => custName.focus(), 200); // wait for the slide-in to be underway
}

function closeCheckout() {
  checkoutView.classList.remove('open');
  checkoutView.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('checkout-locked');
  selectedProduct = null;
  if (lastFocusedElement) lastFocusedElement.focus();
}

checkoutBack.addEventListener('click', closeCheckout);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && checkoutView.classList.contains('open')) closeCheckout();
});

/* Keep keyboard focus inside the checkout view while it's open */
checkoutView.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !checkoutView.classList.contains('open')) return;
  const focusable = checkoutView.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ----------------------------------------------------------
   7. PHONE INPUT — digits only, enforced as the user types
   ---------------------------------------------------------- */
custPhone.addEventListener('input', () => {
  custPhone.value = custPhone.value.replace(/[^0-9]/g, '').slice(0, 10);
});

/* ----------------------------------------------------------
   8. VALIDATION HELPERS
   ---------------------------------------------------------- */
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function showError(fieldName, message) {
  const input = document.getElementById(`cust${capitalize(fieldName)}`);
  const errorEl = document.getElementById(`err-${fieldName}`);
  if (input) input.closest('.field').classList.add('has-error');
  if (errorEl) errorEl.textContent = message;
}

function clearAllErrors() {
  document.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
  document.querySelectorAll('.error-text').forEach((e) => { e.textContent = ''; });
}

/* ----------------------------------------------------------
   9. FORM SUBMIT — validate, build message, redirect to WhatsApp
   ---------------------------------------------------------- */
orderForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearAllErrors();

  const dict = translations[currentLang];

  const name = custName.value.trim();
  const address = custAddress.value.trim();
  const phone = custPhone.value.trim();
  const color = custColor.value;
  const note = custNote.value.trim();

  let isValid = true;

  if (!name) { showError('name', dict.errorRequired); isValid = false; }
  if (!address) { showError('address', dict.errorRequired); isValid = false; }
  if (!/^[0-9]{9,10}$/.test(phone)) { showError('phone', dict.errorPhone); isValid = false; }
  if (!color) { showError('color', dict.errorColor); isValid = false; }

  if (!isValid || !selectedProduct) return;

  const total = selectedProduct.price + DELIVERY_FEE;

  const message =
`New Order - Ranowin Enterprises
--------------------------------
Product: ${selectedProduct.name}
Color: ${color}
Item Price: Rs. ${selectedProduct.price.toLocaleString()}
Delivery: Rs. ${DELIVERY_FEE}
Total Amount: Rs. ${total.toLocaleString()}

Customer Details
Name: ${name}
Address: ${address}
Phone: ${phone}${note ? `\nNote: ${note}` : ''}`;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Redirects the current tab to WhatsApp with the order pre-filled.
  // Prefer keeping the shop open instead? Use:
  //   window.open(whatsappUrl, '_blank');
  window.location.href = whatsappUrl;
});

/* ----------------------------------------------------------
   10. INIT
   ---------------------------------------------------------- */
(async function init() {
  let savedLang = 'en';
  try { savedLang = localStorage.getItem('ranowin_lang') || 'en'; } catch (e) { /* ignore */ }
  setLanguage(savedLang);

  const { products, isFallback } = await loadProducts();
  const sorted = sortByStock(products);

  loadingText.hidden = true;
  dataNotice.hidden = !isFallback;
  renderProducts(sorted);
})();
