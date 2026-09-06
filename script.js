/* ==========================================================
   Ranowin Enterprises — site script
   No frameworks, no build step — just vanilla JS.
   ========================================================== */

/* ----------------------------------------------------------
   1. CONFIG — edit these two values for your business
   ---------------------------------------------------------- */
const WHATSAPP_NUMBER = '94719692801'; // international format, no + and no leading 0
const DELIVERY_FEE = 350;

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
    orderNow: 'Order Now',
    deliveryNote: '(+ Rs. 350 Delivery Charges)',
    modalTitle: 'Complete Your Order',
    orderingLabel: "You're ordering:",
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
    orderNow: 'දැන් ඇණවුම් කරන්න',
    deliveryNote: '(+ රු. 350 බෙදාහැරීමේ ගාස්තුව)',
    modalTitle: 'ඔබේ ඇණවුම සම්පූර්ණ කරන්න',
    orderingLabel: 'ඔබ ඇණවුම් කරන්නේ:',
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
    orderNow: 'இப்போது ஆர்டர் செய்யவும்',
    deliveryNote: '(+ ரூ. 350 டெலிவரி கட்டணம்)',
    modalTitle: 'உங்கள் ஆர்டரை முடிக்கவும்',
    orderingLabel: 'நீங்கள் ஆர்டர் செய்கிறீர்கள்:',
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

  // Refresh the modal summary line if the modal is currently open
  if (selectedProduct && !modalOverlay.hidden) {
    updateModalSummary();
  }
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

/* ----------------------------------------------------------
   4. MODAL — open / close
   ---------------------------------------------------------- */
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalSummary = document.getElementById('modalSummary');
const orderForm = document.getElementById('orderForm');

const custName = document.getElementById('custName');
const custAddress = document.getElementById('custAddress');
const custPhone = document.getElementById('custPhone');
const custColor = document.getElementById('custColor');
const custNote = document.getElementById('custNote');

let selectedProduct = null;   // { name, price }
let lastFocusedElement = null;

function updateModalSummary() {
  const dict = translations[currentLang];
  const formattedPrice = selectedProduct.price.toLocaleString();
  modalSummary.textContent = `${dict.orderingLabel} ${selectedProduct.name} — Rs. ${formattedPrice}`;
}

function openModal(name, price) {
  selectedProduct = { name, price };
  updateModalSummary();
  clearAllErrors();
  orderForm.reset();

  modalOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  custName.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = '';
  selectedProduct = null;
  if (lastFocusedElement) lastFocusedElement.focus();
}

document.querySelectorAll('.order-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    lastFocusedElement = btn;
    openModal(btn.dataset.name, Number(btn.dataset.price));
  });
});

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.hidden) closeModal();
});

/* Keep keyboard focus inside the modal while it's open */
modalOverlay.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || modalOverlay.hidden) return;
  const focusable = modalOverlay.querySelectorAll(
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
   5. PHONE INPUT — digits only, enforced as the user types
   ---------------------------------------------------------- */
custPhone.addEventListener('input', () => {
  custPhone.value = custPhone.value.replace(/[^0-9]/g, '').slice(0, 10);
});

/* ----------------------------------------------------------
   6. VALIDATION HELPERS
   ---------------------------------------------------------- */
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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ----------------------------------------------------------
   7. FORM SUBMIT — validate, build message, redirect to WhatsApp
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
  // If you'd rather keep the shop open in its own tab, swap this line for:
  //   window.open(whatsappUrl, '_blank');
  window.location.href = whatsappUrl;
});

/* ----------------------------------------------------------
   8. INIT — restore the visitor's last-used language
   ---------------------------------------------------------- */
(function init() {
  let savedLang = 'en';
  try { savedLang = localStorage.getItem('ranowin_lang') || 'en'; } catch (e) { /* ignore */ }
  setLanguage(savedLang);
})();
