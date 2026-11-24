/* Ranowin Apparel storefront — separate Apparel Apps Script backend.
   Set this to the separate Apparel Web App /exec URL after deployment. */
const APPAREL_API_URL = 'PASTE_APPAREL_WEB_APP_EXEC_URL_HERE';
const APPAREL_WHATSAPP = '94719692801'; // Ranowin Production WhatsApp number.
const $ = id => document.getElementById(id);
let products=[],selected=null,cart=[];
const money=n=>'LKR '+Number(n||0).toLocaleString('en-LK',{maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function apiGet(){
 if(!APPAREL_API_URL.startsWith('https://script.google.com/'))throw Error('Apparel backend URL has not been configured yet. Set APPAREL_API_URL in apparel.js.');
 const res=await fetch(APPAREL_API_URL+'?action=catalog',{cache:'no-store'});if(!res.ok)throw Error('Could not load apparel catalogue.');return res.json();
}
async function apiPost(payload){
 const res=await fetch(APPAREL_API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
 const result=await res.json();if(!result.success)throw Error(result.error||'Apparel request failed.');return result;
}
function stockFor(p,color,size){const key=color+'||'+size;return p.colors&&p.colors.length?Number((p.stockByVariant||{})[key]||0):Number((p.stockBySize||{})[size]||0);}
function renderProducts(){
 $('productGrid').innerHTML=products.map(p=>{const img=(p.images||[])[0]||'';const stock=(p.sizes||[]).reduce((sum,s)=>sum+(p.colors&&p.colors.length?p.colors.reduce((a,c)=>a+stockFor(p,c,s),0):stockFor(p,'',s)),0);
 return '<article class="apparel-card"><img src="'+esc(img)+'" alt="'+esc(p.name)+'" loading="lazy"><div class="inside"><h3>'+esc(p.name)+'</h3><p>'+esc(p.category||'Apparel')+'</p><p class="apparel-price">'+money(p.salePrice||p.basePrice)+'</p><p>'+stock+' in stock</p><button class="apparel-btn" data-product="'+esc(p.id)+'">View & order</button></div></article>';}).join('')||'<p class="apparel-notice">No apparel products available right now.</p>';
}
function openProduct(id){
 selected=products.find(p=>String(p.id)===String(id));if(!selected)return;
 const p=selected,colors=p.colors||[],sizes=p.sizes||[];
 $('detail').classList.remove('hidden');
 $('detail').innerHTML='<div><img id="mainPhoto" src="'+esc((p.images||[])[0]||'')+'" alt="'+esc(p.name)+'"><div class="apparel-thumbs">'+(p.images||[]).map((u,i)=>'<button type="button" data-photo="'+i+'"><img src="'+esc(u)+'" alt="Photo '+(i+1)+'"></button>').join('')+'</div></div><div><p class="eyebrow">'+esc(p.category)+'</p><h2>'+esc(p.name)+'</h2><p>'+esc(p.description||'')+'</p><h3>'+money(p.salePrice||p.basePrice)+'</h3><label>Colour<select id="chosenColor">'+(colors.length?colors.map(c=>'<option>'+esc(c)+'</option>').join(''):'<option value="">Standard</option>')+'</select></label><label>Size<select id="chosenSize">'+sizes.map(s=>'<option>'+esc(s)+'</option>').join('')+'</select></label><p id="variantStock"></p><label>Quantity<input id="chosenQty" type="number" min="1" max="20" value="1"></label>'+(p.sizeChartImage?'<h3>Size guide</h3><img class="size-guide" src="'+esc(p.sizeChartImage)+'" alt="Size chart">':'')+
 '<div class="custom-options"><h3>Customize your T-Shirt</h3><label>Printing method<select id="printMethod"><option value="No print">No print</option><option value="DTF Print">DTF Print</option><option value="Embroidery">Embroidery</option><option value="Custom design - discuss">Custom design - discuss</option></select></label><label>Print / embroidery placement<select id="printPlacement"><option value="Not applicable">Not applicable</option><option>Left chest</option><option>Right chest</option><option>Center front</option><option>Back</option><option>Both front and back</option><option>Sleeve</option><option>Custom placement - explain below</option></select></label><label>Back neck label<select id="neckLabel"><option value="Keep existing label">Keep existing label</option><option value="Custom woven brand label">Custom woven brand label</option><option value="Printed neck label">Printed neck label</option><option value="Remove existing label">Remove existing label</option><option value="Discuss custom label">Discuss custom label</option></select></label><label>Custom design / label instructions<textarea id="customInstructions" rows="3" maxlength="1000" placeholder="Describe your design, logo size, colours, exact position or neck label changes..."></textarea></label><p class="design-help">Upload your artwork/logo in the order form at checkout, or describe a design you want us to create.</p></div><button class="apparel-btn" id="addToCart">Add to cart</button></div>';
 const update=()=>{const color=$('chosenColor').value,size=$('chosenSize').value,n=stockFor(p,color,size);$('variantStock').textContent=n>0?n+' available':'Out of stock';$('chosenQty').max=Math.max(1,n);$('addToCart').disabled=n<1;};
 $('chosenColor').onchange=update;$('chosenSize').onchange=update;update();
 $('detail').querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{$('mainPhoto').src=p.images[Number(b.dataset.photo)];});
 $('addToCart').onclick=()=>{const color=$('chosenColor').value,size=$('chosenSize').value,qty=Number($('chosenQty').value),available=stockFor(p,color,size);if(!Number.isInteger(qty)||qty<1||qty>available)return alert('Please choose a valid quantity.');
 cart.push({productId:p.id,name:p.name,color,size,qty,unitPrice:Number(p.salePrice||p.basePrice),printMethod:$('printMethod').value,printPlacement:$('printPlacement').value,neckLabel:$('neckLabel').value,customInstructions:$('customInstructions').value.trim()});renderCart();alert('Added to your cart.');};
 $('detail').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderCart(){
 $('cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);
 $('cartLines').innerHTML=cart.map((x,i)=>'<div class="cart-line"><span><strong>'+esc(x.name)+'</strong> · '+esc(x.color)+' / '+esc(x.size)+' × '+x.qty+'<br><small>'+esc(x.printMethod)+' · '+esc(x.printPlacement)+' · Neck: '+esc(x.neckLabel)+'</small>'+(x.customInstructions?'<br><small>Instructions: '+esc(x.customInstructions)+'</small>':'')+'</span><strong>'+money(x.unitPrice*x.qty)+'</strong><button type="button" data-remove="'+i+'">×</button></div>').join('')||'<p>Your cart is empty.</p>';
 $('cartTotal').textContent=money(cart.reduce((s,x)=>s+x.qty*x.unitPrice,0));
 $('cartLines').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);renderCart();});
}
async function fileToDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read '+file.name));r.readAsDataURL(file);});}
async function uploadCustomerDesigns(files){
 const uploaded=[];
 for(let i=0;i<files.length;i++){
  const file=files[i];
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw Error(file.name+': use JPG, PNG, WEBP or GIF.');
  if(file.size>3*1024*1024)throw Error(file.name+': maximum file size is 3 MB.');
  $('uploadStatus').textContent='Uploading design '+(i+1)+' of '+files.length+'...';
  const dataUrl=await fileToDataUrl(file);
  const result=await apiPost({action:'uploadCustomerDesign',fileName:file.name,dataUrl});
  uploaded.push({name:file.name,url:result.url,fileId:result.fileId});
 }
 return uploaded;
}
$('productGrid').onclick=e=>{const b=e.target.closest('[data-product]');if(b)openProduct(b.dataset.product);};
$('showCart').onclick=()=>{$('orderPanel').classList.toggle('hidden');$('orderPanel').scrollIntoView({behavior:'smooth'});};
$('orderForm').onsubmit=async e=>{
 e.preventDefault();if(!cart.length)return alert('Your cart is empty.');
 const button=$('orderForm').querySelector('button[type="submit"]');if(button.disabled)return;
 button.disabled=true;$('orderStatus').textContent='Preparing your order...';$('uploadStatus').textContent='';
 try{
  const files=Array.from($('designFiles').files||[]);if(files.length>3)throw Error('Upload a maximum of 3 design images.');
  const designFiles=files.length?await uploadCustomerDesigns(files):[];
  const payload={action:'createOrder',customer:$('customer').value.trim(),phone:$('phone').value.trim(),address:$('address').value.trim(),notes:$('notes').value.trim(),deliveryFee:0,designFiles,items:cart.map(x=>({productId:x.productId,color:x.color,size:x.size,qty:x.qty,printMethod:x.printMethod,printPlacement:x.printPlacement,neckLabel:x.neckLabel,customInstructions:x.customInstructions}))};
  $('orderStatus').textContent='Saving your T-Shirt order...';
  const result=await apiPost(payload);
  const lines=cart.map((x,i)=>[(i+1)+'. '+x.name,'Colour: '+(x.color||'Standard'),'Size: '+x.size,'Quantity: '+x.qty,'Printing: '+x.printMethod,'Placement: '+x.printPlacement,'Back neck label: '+x.neckLabel,x.customInstructions?'Custom instructions: '+x.customInstructions:'','Item total: '+money(x.unitPrice*x.qty)].filter(Boolean).join('\n')).join('\n\n');
  const links=designFiles.length?'\n\nUploaded design files:\n'+designFiles.map((f,i)=>(i+1)+'. '+f.name+'\n'+f.url).join('\n'):'';
  const message=['Hello Ranowin Production! I would like to place this custom T-Shirt order.','Order reference: '+result.orderId,'','CUSTOM ITEMS',lines,'','Customer: '+$('customer').value.trim(),'Phone: '+$('phone').value.trim(),'Delivery address: '+$('address').value.trim(),$('notes').value.trim()?'Additional note: '+$('notes').value.trim():'','Goods total: '+money(result.goodsTotal),'Delivery: To confirm','Total: To confirm after custom requirements are reviewed.',links,'','Please confirm the custom design, label requirements, final price and delivery.'].filter(Boolean).join('\n');
  $('orderStatus').textContent='Order saved. Opening WhatsApp...';cart=[];renderCart();
  window.location.href='https://wa.me/'+APPAREL_WHATSAPP+'?text='+encodeURIComponent(message);
 }catch(err){$('orderStatus').textContent='Order was not confirmed: '+(err.message||String(err))+'. Please contact us before submitting again.';}
 finally{button.disabled=false;}
};
$('year').textContent=new Date().getFullYear();
(async()=>{try{const data=await apiGet();products=(data.products||[]).filter(p=>p.active);$('apparelStatus').classList.add('hidden');renderProducts();}catch(e){$('apparelStatus').textContent=e.message||String(e);}})();
