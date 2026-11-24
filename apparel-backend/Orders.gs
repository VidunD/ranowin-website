/* Apparel-only order intake, inventory reservation, media upload and admin order tools.
   Uses the Ranowin Apparel spreadsheet only. Never references the Baby Bag database. */
function apparelOrdersSheet_(){
  const db=DB_();let s=db.getSheetByName('Orders');
  if(!s)s=db.insertSheet('Orders');
  ensureHeaders_(s,['ID','CreatedAt','Customer','Phone','Address','ItemsJSON','Total','Status','DesignFilesJSON','Notes','DeliveryFee','GoodsTotal','PaymentStatus']);
  return s;
}
function apparelOrderJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  try{
    const raw=e&&e.postData&&e.postData.contents?e.postData.contents:'{}';
    const input=JSON.parse(raw);
    if(input.action!=='createOrder')return apparelOrderJson_({success:false,error:'Unknown apparel action.'});
    return apparelOrderJson_(createApparelOrder_(input));
  }catch(err){return apparelOrderJson_({success:false,error:String(err&&err.message||err)});}
}
function createApparelOrder_(input){
  input=input||{};
  const customer=String(input.customer||'').trim(),phone=String(input.phone||'').trim(),address=String(input.address||'').trim();
  const items=Array.isArray(input.items)?input.items:[];
  if(!customer||customer.length>120)throw Error('Enter a valid customer name.');
  if(!phone||phone.length>40)throw Error('Enter a valid phone number.');
  if(!address||address.length>1000)throw Error('Enter a delivery address.');
  if(!items.length||items.length>30)throw Error('Your cart is empty or contains too many items.');
  const delivery=Number(input.deliveryFee||0);
  if(!Number.isFinite(delivery)||delivery<0||delivery>100000)throw Error('Invalid delivery fee.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const ps=DB_().getSheetByName('Products'),all=products_(),byId={};
    all.forEach(p=>byId[String(p.id)]=p);
    const normalized=[];let goods=0;const demand={};
    items.forEach(it=>{
      const p=byId[String(it.productId||'')];if(!p||!p.active)throw Error('A selected product is no longer available.');
      const color=String(it.color||'').trim(),size=String(it.size||'').trim(),qty=Number(it.qty);
      if(!p.sizes.includes(size)||!Number.isInteger(qty)||qty<1||qty>20)throw Error('Invalid size or quantity for '+p.name+'.');
      if(p.colors.length&&!p.colors.includes(color))throw Error('Invalid colour for '+p.name+'.');
      const key=color+'||'+size,stockMap=p.colors.length?p.stockByVariant:p.stockBySize,stockKey=p.colors.length?key:size;
      const demandKey=String(p.id)+'::'+stockKey;demand[demandKey]=(demand[demandKey]||0)+qty;
      const unit=Number(p.salePrice||p.basePrice)||0,line=unit*qty;goods+=line;
      normalized.push({productId:p.id,name:p.name,color:color,size:size,qty:qty,unitPrice:unit,lineTotal:line,stockKey:stockKey});
    });
    Object.keys(demand).forEach(k=>{
      const parts=k.split('::'),p=byId[parts[0]],stockMap=p.colors.length?p.stockByVariant:p.stockBySize,available=Number(stockMap[parts[1]]||0);
      if(available<demand[k])throw Error(p.name+' ('+parts[1].replace('||',' / ')+') has only '+available+' item(s) in stock.');
    });
    const updated={};
    normalized.forEach(it=>{
      const p=byId[String(it.productId)],map=p.colors.length?p.stockByVariant:p.stockBySize,key=String(p.id)+'::'+it.stockKey;
      if(!updated[key]){map[it.stockKey]=Number(map[it.stockKey]||0)-demand[key];updated[key]=true;}
    });
    Object.keys(updated).forEach(k=>{
      const parts=k.split('::'),p=byId[parts[0]],ix=all.findIndex(x=>String(x.id)===String(p.id)),row=ix+2,m=headerMap_(ps),col=p.colors.length?m.VariantStockJSON:m.StockJSON;
      ps.getRange(row,col+1).setValue(JSON.stringify(p.colors.length?p.stockByVariant:p.stockBySize));
    });
      const p=byId[String(it.productId||'')];if(!p||!p.active)throw Error('A selected product is no longer available.');
      const color=String(it.color||'').trim(),size=String(it.size||'').trim(),qty=Number(it.qty);
      if(!p.sizes.includes(size)||!Number.isInteger(qty)||qty<1||qty>20)throw Error('Invalid size or quantity for '+p.name+'.');
      if(p.colors.length&&!p.colors.includes(color))throw Error('Invalid colour for '+p.name+'.');
      const key=color+'||'+size;
      const stockMap=p.colors.length?p.stockByVariant:p.stockBySize;
      const stockKey=p.colors.length?key:size;
      const available=Number(stockMap&&stockMap[stockKey]||0);
      if(available<qty)throw Error(p.name+' ('+(color?color+' / ':'')+size+') has only '+available+' item(s) in stock.');
      const unit=Number(p.salePrice||p.basePrice)||0,line=unit*qty;goods+=line;
      normalized.push({productId:p.id,name:p.name,color:color,size:size,qty:qty,unitPrice:unit,lineTotal:line,stockKey:stockKey});
    });

    const id='APP-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
    const total=goods+delivery,sh=apparelOrdersSheet_();
    const savedItems=normalized.map(({stockKey,...x})=>x);
    sh.appendRow([id,new Date(),customer,phone,address,JSON.stringify(savedItems),total,'Pending','',String(input.notes||'').slice(0,500),delivery,goods,'Unpaid']);
    return {success:true,orderId:id,total:total,goodsTotal:goods,deliveryFee:delivery,message:'T-Shirt order received.'};
  }finally{lock.releaseLock();}
}
function getApparelOrders(token){
  auth_(token);const s=apparelOrdersSheet_(),rows=apparelRowsAsObjects_(s);
  return rows.reverse().map(o=>({id:String(o.ID||''),createdAt:o.CreatedAt,customer:o.Customer,phone:o.Phone,address:o.Address,
    items:json_(o.ItemsJSON,[]),total:Number(o.Total)||0,goodsTotal:Number(o.GoodsTotal)||Number(o.Total)||0,
    deliveryFee:Number(o.DeliveryFee)||0,status:String(o.Status||'Pending'),paymentStatus:String(o.PaymentStatus||'Unpaid'),notes:o.Notes||''}));
}
function updateApparelOrder(token,id,status){
  auth_(token);id=String(id||'').trim();status=String(status||'').trim();
  const allowed=['Pending','Confirmed','Processing','Dispatched','Completed','Cancelled'];
  if(!allowed.includes(status))throw Error('Invalid order status.');
  const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow();if(n<2)throw Error('Order not found.');
  const rows=s.getRange(2,1,n-1,s.getLastColumn()).getValues(),ix=rows.findIndex(r=>String(r[m.ID])===id);
  if(ix<0)throw Error('Order not found.');
  s.getRange(ix+2,m.Status+1).setValue(status);
  return {success:true,status:status};
}
function uploadApparelImage(token,dataUrl,fileName){
  auth_(token);
  const match=String(dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)throw Error('Choose a JPG, PNG, WEBP or GIF image.');
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>5*1024*1024)throw Error('Each image must be 5 MB or smaller.');
  const folderId=String(P_().getProperty('APPAREL_MEDIA_FOLDER_ID')||'').trim();
  let folder;if(folderId){try{folder=DriveApp.getFolderById(folderId);}catch(e){}}
  if(!folder){folder=DriveApp.createFolder('Ranowin Apparel Product Images');P_().setProperty('APPAREL_MEDIA_FOLDER_ID',folder.getId());}
  const safe=String(fileName||'apparel-image').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90);
  const blob=Utilities.newBlob(bytes,match[1],safe),file=folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return {url:'https://drive.google.com/uc?export=view&id='+file.getId(),fileId:file.getId(),name:file.getName()};
}
