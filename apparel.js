/* Apparel storefront — uses only the separate Apparel Apps Script deployment.
   Paste the Apparel Web App /exec URL below after deploying apparel-backend. */
const APPAREL_API_URL = 'PASTE_APPAREL_WEB_APP_EXEC_URL_HERE';
const $ = id => document.getElementById(id);
let products=[],selected=null,cart=[];
const money=n=>'LKR '+Number(n||0).toLocaleString('en-LK',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function apiGet(){
 if(!APPAREL_API_URL.startsWith('https://script.google.com/'))throw Error('Apparel backend URL has not been configured yet. Set APPAREL_API_URL in apparel.js.');
 const res=await fetch(APPAREL_API_URL+'?action=catalog',{cache:'no-store'});if(!res.ok)throw Error('Could not load apparel catalogue.');return res.json();
}
function stockFor(p,color,size){const key=color+'||'+size;return p.colors&&p.colors.length?Number((p.stockByVariant||{})[key]||0):Number((p.stockBySize||{})[size]||0);}
function renderProducts(){
 $('productGrid').innerHTML=products.map(p=>{const img=(p.images||[])[0]||'';const stock=(p.sizes||[]).reduce((sum,s)=>sum+(p.colors&&p.colors.length?p.colors.reduce((a,c)=>a+stockFor(p,c,s),0):stockFor(p,'',s)),0);
 return '<article class="apparel-card"><img src="'+esc(img)+'" alt="'+esc(p.name)+'" loading="lazy"><div class="inside"><h3>'+esc(p.name)+'</h3><p>'+esc(p.category||'Apparel')+'</p><p class="apparel-price">'+money(p.salePrice||p.basePrice)+'</p><p>'+stock+' in stock</p><button class="apparel-btn" data-product="'+esc(p.id)+'">View & order</button></div></article>';}).join('')||'<p class="apparel-notice">No apparel products available right now.</p>';
}
function openProduct(id){
 selected=products.find(p=>String(p.id)===String(id));if(!selected)return;
 const p=selected,colors=p.colors||[],sizes=p.sizes||[],firstColor=colors[0]||'',firstSize=sizes[0]||'';
 $('detail').classList.remove('hidden');
 $('detail').innerHTML='<div><img id="mainPhoto" src="'+esc((p.images||[])[0]||'')+'" alt="'+esc(p.name)+'"><div class="apparel-thumbs">'+(p.images||[]).map((u,i)=>'<button type="button" data-photo="'+i+'"><img src="'+esc(u)+'" alt="Photo '+(i+1)+'"></button>').join('')+'</div></div><div><p class="eyebrow">'+esc(p.category)+'</p><h2>'+esc(p.name)+'</h2><p>'+esc(p.description||'')+'</p><h3>'+money(p.salePrice||p.basePrice)+'</h3><label>Colour<select id="chosenColor">'+(colors.length?colors.map(c=>'<option>'+esc(c)+'</option>').join(''):'<option value="">Standard</option>')+'</select></label><label>Size<select id="chosenSize">'+sizes.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></label><p id="variantStock"></p><label>Quantity<input id="chosenQty" type="number" min="1" max="20" value="1"></label>'+(p.sizeChartImage?'<h3>Size guide</h3><img class="size-guide" src="'+esc(p.sizeChartImage)+'" alt="Size chart">':'')+'<button class="apparel-btn" id="addToCart">Add to cart</button></div>';
 const update=()=>{const color=$('chosenColor').value,size=$('chosenSize').value,n=stockFor(p,color,size);$('variantStock').textContent=n>0?n+' available':'Out of stock';$('chosenQty').max=Math.max(1,n);$('addToCart').disabled=n<1;};
 $('chosenColor').onchange=update;$('chosenSize').onchange=update;update();
 $('detail').querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{$('mainPhoto').src=p.images[Number(b.dataset.photo)];});
 $('addToCart').onclick=()=>{const color=$('chosenColor').value,size=$('chosenSize').value,qty=Number($('chosenQty').value),available=stockFor(p,color,size);if(!Number.isInteger(qty)||qty<1||qty>available)return alert('Please choose a valid quantity.');const existing=cart.find(x=>x.productId===p.id&&x.color===color&&x.size===size);if(existing){if(existing.qty+qty>available)return alert('Not enough stock for this variant.');existing.qty+=qty;}else cart.push({productId:p.id,name:p.name,color,size,qty,unitPrice:Number(p.salePrice||p.basePrice)});renderCart();alert('Added to your cart.');};
 $('detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderCart(){
 $('cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);
 $('cartLines').innerHTML=cart.map((x,i)=>'<div class="cart-line"><span>'+esc(x.name)+' · '+esc(x.color)+' / '+esc(x.size)+' × '+x.qty+'</span><strong>'+money(x.unitPrice*x.qty)+'</strong><button type="button" data-remove="'+i+'">×</button></div>').join('')||'<p>Your cart is empty.</p>';
 $('cartTotal').textContent=money(cart.reduce((s,x)=>s+x.qty*x.unitPrice,0));
 $('cartLines').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);renderCart();});
}
$('productGrid').onclick=e=>{const b=e.target.closest('[data-product]');if(b)openProduct(b.dataset.product);};
$('showCart').onclick=()=>{$('orderPanel').classList.toggle('hidden');$('orderPanel').scrollIntoView({behavior:'smooth'});};
$('orderForm').onsubmit=async e=>{
 e.preventDefault();if(!cart.length)return alert('Your cart is empty.');
 $('orderStatus').textContent='Submitting order…';
 const payload={action:'createOrder',customer:$('customer').value.trim(),phone:$('phone').value.trim(),address:$('address').value.trim(),notes:$('notes').value.trim(),deliveryFee:0,items:cart.map(x=>({productId:x.productId,color:x.color,size:x.size,qty:x.qty}))};
 try{
  const res=await fetch(APPAREL_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  const result=await res.json();if(!result.success)throw Error(result.error||'Order could not be saved.');
  $('orderStatus').textContent='Order saved! Your order number is '+result.orderId+'. Total: '+money(result.total)+'. We will contact you to confirm delivery.';
  cart=[];renderCart();$('orderForm').reset();const fresh=await apiGet();products=fresh.products||[];renderProducts();$('detail').classList.add('hidden');
 }catch(err){$('orderStatus').textContent='Order was not confirmed: '+(err.message||String(err))+'. Please contact us before trying again.';}
};
$('year').textContent=new Date().getFullYear();
(async()=>{try{const data=await apiGet();products=(data.products||[]).filter(p=>p.active);$('apparelStatus').classList.add('hidden');renderProducts();}catch(e){$('apparelStatus').textContent=e.message||String(e);}})();
