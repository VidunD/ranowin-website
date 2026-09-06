// Google Sheet CSV Link
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRX3ME8gLubgdcM-QzUKRJ7GO0pabllVpknR11UGFBlOQ5YbCfmNf4rEAdOKTYIgdfi7i5an1Nx-L3K/pub?output=csv";

// WhatsApp Number - REPLACE THIS!
const whatsappNumber = "947XXXXXXXX";

let currentLang = 'en';
let selectedProduct = {};

// Translations
const translations = {
  en: {
    brandTitle: "Ranowin Enterprises",
    orderNow: "Order Now",
    outOfStock: "Out of Stock",
    backBtn: "Back",
    bagPriceTxt: "Bag Price:",
    deliveryTxt: "Delivery Fee:",
    totalTxt: "Total Amount:",
    labelName: "Name",
    labelAddress: "Delivery Address",
    labelPhone: "Phone Number",
    labelColor: "Bag Color",
    selectColor: "Select a color",
    colorBlue: "Blue",
    colorPink: "Pink",
    labelNote: "Special Note (optional)",
    submitBtn: "Send Order via WhatsApp"
  },
  si: {
    brandTitle: "රනොවින් එන්ටර්ප්‍රයිසස්",
    orderNow: "දැන්ම ඇණවුම් කරන්න",
    outOfStock: "තොග අවසන්",
    backBtn: "ආපසු",
    bagPriceTxt: "බෑගයේ මිල:",
    deliveryTxt: "ප්‍රවාහන ගාස්තුව:",
    totalTxt: "මුළු මුදල:",
    labelName: "නම",
    labelAddress: "ලිපිනය",
    labelPhone: "දුරකථන අංකය",
    labelColor: "පාට",
    selectColor: "පාටක් තෝරන්න",
    colorBlue: "නිල්",
    colorPink: "රෝස",
    labelNote: "විශේෂ සටහනක් (ඇත්නම්)",
    submitBtn: "WhatsApp හරහා ඇණවුම් කරන්න"
  },
  ta: {
    brandTitle: "ரனோவின் எண்டர்பிரைசஸ்",
    orderNow: "இப்போதே ஆர்டர் செய்யுங்கள்",
    outOfStock: "ஸ்டாக் இல்லை",
    backBtn: "பின்செல்",
    bagPriceTxt: "பையின் விலை:",
    deliveryTxt: "டெலிவரி கட்டணம்:",
    totalTxt: "மொத்த தொகை:",
    labelName: "பெயர்",
    labelAddress: "முகவரி",
    labelPhone: "தொலைபேசி எண்",
    labelColor: "நிறம்",
    selectColor: "நிறத்தை தேர்ந்தெடுக்கவும்",
    colorBlue: "நீலம்",
    colorPink: "இளஞ்சிவப்பு",
    labelNote: "குறிப்பு (விரும்பினால்)",
    submitBtn: "WhatsApp மூலம் ஆர்டர் செய்யவும்"
  }
};

// Fetch Data from Google Sheets
async function loadProducts() {
  try {
    const response = await fetch(sheetURL);
    const data = await response.text();
    
    // Simple CSV parser
    const rows = data.split("\n").map(row => row.split(","));
    const headers = rows[0].map(h => h.trim().replace(/\r/g, ''));
    
    const products = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].length < 2 || !rows[i][0]) continue;
      
      let item = {};
      headers.forEach((header, index) => {
        item[header] = rows[i][index] ? rows[i][index].trim().replace(/\r/g, '') : "";
      });
      products.push(item);
    }

    // Sort: Out of Stock items go to the bottom
    products.sort((a, b) => {
      let statusA = a.Status ? a.Status.toLowerCase() : "";
      let statusB = b.Status ? b.Status.toLowerCase() : "";
      if (statusA === "out of stock" && statusB !== "out of stock") return 1;
      if (statusB === "out of stock" && statusA !== "out of stock") return -1;
      return 0;
    });

    renderGrid(products);
  } catch (error) {
    document.getElementById('productGrid').innerHTML = "<p>Error loading products. Please try again later.</p>";
  }
}

// Render Products to Grid
function renderGrid(products) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = "";

  products.forEach(p => {
    const isOut = (p.Status && p.Status.toLowerCase() === "out of stock");
    const btnText = isOut ? translations[currentLang].outOfStock : translations[currentLang].orderNow;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.ImageLink || 'favicon.svg'}" alt="${p.Name}">
      <h3>${p.Name}</h3>
      <p class="product-price">Rs. ${p.Price}</p>
      <button class="btn-primary" ${isOut ? 'disabled' : ''} 
        onclick="openCheckout('${p.Name}', '${p.Price}', '${p.DeliveryFee}', '${p.ImageLink}')">
        <span data-i18n="${isOut ? 'outOfStock' : 'orderNow'}">${btnText}</span>
      </button>
    `;
    grid.appendChild(card);
  });
}

// Open Checkout View
function openCheckout(name, price, delivery, img) {
  selectedProduct = { name, price: parseInt(price), delivery: parseInt(delivery || 350) };
  
  document.getElementById('chk-img').src = img || 'favicon.svg';
  document.getElementById('chk-title').innerText = name;
  document.getElementById('chk-price').innerText = selectedProduct.price;
  document.getElementById('chk-delivery').innerText = selectedProduct.delivery;
  document.getElementById('chk-total').innerText = selectedProduct.price + selectedProduct.delivery;
  
  document.getElementById('checkout-view').classList.add('active');
}

// Close Checkout View
function closeCheckout() {
  document.getElementById('checkout-view').classList.remove('active');
  document.getElementById('orderForm').reset();
}

// Handle Form Submit to WhatsApp
function submitOrder(e) {
  e.preventDefault();
  
  const name = document.getElementById('custName').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const color = document.getElementById('custColor').value;
  const note = document.getElementById('custNote').value.trim();
  const total = selectedProduct.price + selectedProduct.delivery;

  if (phone.length < 9) {
    alert("Please enter a valid phone number.");
    return;
  }

  const message = `*New Order - Ranowin Enterprises* %0A%0A` +
                  `*Item:* ${selectedProduct.name} %0A` +
                  `*Color:* ${color} %0A` +
                  `*Price:* Rs. ${selectedProduct.price} %0A` +
                  `*Delivery:* Rs. ${selectedProduct.delivery} %0A` +
                  `*Total:* Rs. ${total} %0A%0A` +
                  `*Customer Details:* %0A` +
                  `Name: ${name} %0A` +
                  `Address: ${address} %0A` +
                  `Phone: ${phone} %0A` +
                  `Note: ${note ? note : "None"}`;

  window.location.href = `https://wa.me/${whatsappNumber}?text=${message}`;
}

// Language Switcher Logic
function changeLang(lang) {
  currentLang = lang;
  
  // Update Buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if(btn.innerText.toLowerCase() === lang) btn.classList.add('active');
  });

  // Update Text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(translations[lang][key]) {
      el.innerText = translations[lang][key];
    }
  });
}

// Initialize
window.onload = () => {
  loadProducts();
};
