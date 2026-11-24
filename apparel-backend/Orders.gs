/* Apparel-only order intake, inventory reservation, media upload and admin order tools.
   Uses the Ranowin Apparel spreadsheet only. Never references the Baby Bag database. */
function apparelOrdersSheet_(){
  const db=DB_();let s=db.getSheetByName('Orders');
  if(!s)s=db.insertSheet('Orders');
  ensureHeaders_(s,['ID','CreatedAt','Customer','Phone','Address','ItemsJSON','Total','Status','DesignFilesJSON','Notes','DeliveryFee','GoodsTotal','PaymentStatus','StockDeducted','DispatchBarcode','DispatchedAt','Manual']);
  return s;
}
function apparelOrderJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  try{
    const raw=e&&e.postData&&e.postData.contents?e.postData.contents:'{}';
    const input=JSON.parse(raw);
    if(input.action==='uploadCustomerDesign')return apparelOrderJson_(uploadCustomerDesign_(input));
    if(input.action==='createOrder')return apparelOrderJson_(createApparelOrder_(input));
    return apparelOrderJson_({success:false,error:'Unknown apparel action.'});
  }catch(err){return apparelOrderJson_({success:false,error:String(err&&err.message||err)});}
}
function setupCustomerDesignFolder_(){
  const props=P_(),key='APPAREL_CUSTOMER_DESIGN_FOLDER_ID';
  const existing=String(props.getProperty(key)||'').trim();
  if(existing){try{return 'Customer design folder is ready: '+DriveApp.getFolderById(existing).getName();}catch(e){}}
  const folder=DriveApp.createFolder('Ranowin Apparel Customer Designs');
  props.setProperty(key,folder.getId());
  return 'Customer design folder created: '+folder.getName();
}
function uploadCustomerDesign_(input){
  const name=String(input.fileName||'design-image').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90);
  const match=String(input.dataUrl||'').match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)throw Error('Choose a JPG, PNG, WEBP or GIF design image.');
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>3*1024*1024)throw Error('Each customer design image must be 3 MB or smaller.');
  const folderId=String(P_().getProperty('APPAREL_CUSTOMER_DESIGN_FOLDER_ID')||'').trim();
  if(!folderId)throw Error('Customer design folder is not initialized. Run setupCustomerDesignFolder_ once from the Apps Script editor.');
  const folder=DriveApp.getFolderById(folderId);
  const file=folder.createFile(Utilities.newBlob(bytes,match[1],name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return {success:true,url:'https://drive.google.com/file/d/'+file.getId()+'/view',fileId:file.getId(),name:file.getName()};
}
function createApparelOrder_(input){
  input=input||{};
  const customer=String(input.customer||'').trim(),phone=String(input.phone||'').trim(),address=String(input.address||'').trim();
  const items=Array.isArray(input.items)?input.items:[];
  if(!customer||customer.length>120)throw Error('Enter a valid customer name.');
  if(!phone||phone.length>40)throw Error('Enter a valid phone number.');
  if(!address||address.length>1000)throw Error('Enter a delivery address.');
  if(!items.length||items.length>30)throw Error('Your cart is empty or contains too many items.');
  const designFiles=Array.isArray(input.designFiles)?input.designFiles.slice(0,3).map(f=>({name:String(f.name||'Design').slice(0,120),url:String(f.url||'')})).filter(f=>/^https:\/\/drive\.google\.com\//i.test(f.url)):[];
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
      normalized.push({productId:p.id,name:p.name,color:color,size:size,qty:qty,unitPrice:unit,lineTotal:line,printMethod:String(it.printMethod||'No print').slice(0,80),printPlacement:String(it.printPlacement||'Not applicable').slice(0,100),neckLabel:String(it.neckLabel||'Keep existing label').slice(0,100),customInstructions:String(it.customInstructions||'').slice(0,1000),stockKey:stockKey});
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
    const id='APP-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
    const total=goods+delivery,sh=apparelOrdersSheet_();
    const savedItems=normalized.map(({stockKey,...x})=>x);
    sh.appendRow([id,new Date(),customer,phone,address,JSON.stringify(savedItems),total,'Pending',JSON.stringify(designFiles),String(input.notes||'').slice(0,500),delivery,goods,'Unpaid',true,'','',false]);
    return {success:true,orderId:id,total:total,goodsTotal:goods,deliveryFee:delivery,message:'T-Shirt order received.'};
  }finally{lock.releaseLock();}
}
function getApparelOrders(token){
  auth_(token);const s=apparelOrdersSheet_(),rows=apparelRowsAsObjects_(s);
  return rows.reverse().map(o=>({id:String(o.ID||''),createdAt:o.CreatedAt,customer:o.Customer,phone:o.Phone,address:o.Address,
    items:json_(o.ItemsJSON,[]),designFiles:json_(o.DesignFilesJSON,[]),total:Number(o.Total)||0,goodsTotal:Number(o.GoodsTotal)||Number(o.Total)||0,
    deliveryFee:Number(o.DeliveryFee)||0,status:String(o.Status||'Pending'),paymentStatus:String(o.PaymentStatus||'Unpaid'),notes:o.Notes||'',dispatchBarcode:String(o.DispatchBarcode||''),manual:o.Manual===true}));
}
function updateApparelOrder(token,id,status){
  auth_(token);id=String(id||'').trim();status=String(status||'').trim();
  const allowed=['Pending','Confirmed','Processing','Dispatched','Completed','Cancelled'];
  if(!allowed.includes(status))throw Error('Invalid order status.');
  const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow();if(n<2)throw Error('Order not found.');
  const rows=s.getRange(2,1,n-1,s.getLastColumn()).getValues(),ix=rows.findIndex(r=>String(r[m.ID])===id);
  if(ix<0)throw Error('Order not found.');
  const row=rows[ix],previous=String(row[m.Status]||'Pending');
  if(previous==='Cancelled'&&status!=='Cancelled')throw Error('Cancelled orders cannot be reopened. Create a new order instead.');
  if(status==='Cancelled'&&previous!=='Cancelled'){
    const items=json_(row[m.ItemsJSON],[]),ps=DB_().getSheetByName('Products'),all=products_(),byId={};all.forEach(p=>byId[String(p.id)]=p);
    const restore={};
    items.forEach(it=>{
      const p=byId[String(it.productId||'')];if(!p)return;
      const key=p.colors.length?String(it.color||'')+'||'+String(it.size||''):String(it.size||'');
      const group=String(p.id)+'::'+key;restore[group]=(restore[group]||0)+Number(it.qty||0);
    });
    Object.keys(restore).forEach(group=>{
      const parts=group.split('::'),p=byId[parts[0]];if(!p)return;
      const map=p.colors.length?p.stockByVariant:p.stockBySize;map[parts[1]]=Number(map[parts[1]]||0)+restore[group];
      const ixProduct=all.findIndex(x=>String(x.id)===String(p.id)),pm=headerMap_(ps),col=p.colors.length?pm.VariantStockJSON:pm.StockJSON;
      ps.getRange(ixProduct+2,col+1).setValue(JSON.stringify(map));
    });
  }
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


/* Manual order management — both SUPER_ADMIN and APPAREL_ADMIN can use this.
   Draft orders do not reserve stock. Stock is deducted once, only on confirmation. */
function createManualApparelOrder(token,input){
  const actor=auth_(token); input=input||{};
  const customer=String(input.customer||'').trim(),phone=String(input.phone||'').trim(),address=String(input.address||'').trim();
  const delivery=Number(input.deliveryFee||0),items=Array.isArray(input.items)?input.items:[];
  if(!customer||customer.length>120)throw Error('Enter a customer name (max 120 characters).');
  if(!phone||phone.length>40)throw Error('Enter a valid phone number.');
  if(!address||address.length>1000)throw Error('Enter a delivery address.');
  if(!items.length||items.length>30)throw Error('Add at least one order item.');
  if(!Number.isFinite(delivery)||delivery<0||delivery>100000)throw Error('Invalid delivery fee.');
  const allowed=actor.role==='SUPER_ADMIN'?categoryNames_():apparelStaffCategories_();
  const products=products_(),byId={};products.forEach(p=>byId[String(p.id)]=p);
  let goods=0;
  const normalized=items.map(it=>{
    const p=byId[String(it.productId||'')];if(!p||!p.active)throw Error('Selected product is unavailable.');
    if(!allowed.includes(p.category))throw Error('You do not have permission to order from '+p.category+'.');
    const color=String(it.color||'').trim(),size=String(it.size||'').trim(),qty=Number(it.qty),unit=Number(it.unitPrice);
    if(!p.sizes.includes(size)||!Number.isInteger(qty)||qty<1||qty>100)throw Error('Check size and quantity for '+p.name+'.');
    if(p.colors.length&&!p.colors.includes(color))throw Error('Choose a valid colour for '+p.name+'.');
    if(!p.colors.length&&color)throw Error('This product does not use colour variants.');
    if(!Number.isFinite(unit)||unit<0||unit>10000000)throw Error('Invalid unit price for '+p.name+'.');
    const line=unit*qty;goods+=line;
    return {productId:p.id,name:p.name,color,size,qty,unitPrice:unit,lineTotal:line,
      printMethod:String(it.printMethod||'No print').slice(0,80),
      printPlacement:String(it.printPlacement||'Not applicable').slice(0,100),
      neckLabel:String(it.neckLabel||'Keep existing label').slice(0,100),
      customInstructions:String(it.customInstructions||'').slice(0,1000)};
  });
  const id='APP-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
  const total=goods+delivery,s=apparelOrdersSheet_();
  s.appendRow([id,new Date(),customer,phone,address,JSON.stringify(normalized),total,'Draft','[]',String(input.notes||'').slice(0,500),delivery,goods,'Unpaid',false,'','',true]);
  return {success:true,orderId:id,total,goodsTotal:goods,deliveryFee:delivery,status:'Draft'};
}
function confirmManualApparelOrder(token,id){
  auth_(token);id=String(id||'').trim();
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow(),rows=n>1?s.getRange(2,1,n-1,s.getLastColumn()).getValues():[];
    const ix=rows.findIndex(r=>String(r[m.ID])===id);if(ix<0)throw Error('Order not found.');
    const row=rows[ix],status=String(row[m.Status]||'Draft');
    if(status!=='Draft')throw Error('Only draft orders can be confirmed.');
    if(row[m.StockDeducted]===true)throw Error('Stock was already deducted for this order.');
    const items=json_(row[m.ItemsJSON],[]),all=products_(),byId={};all.forEach(p=>byId[String(p.id)]=p);
    const demand={};
    items.forEach(it=>{
      const p=byId[String(it.productId)];if(!p||!p.active)throw Error('A product in this order is no longer available.');
      const key=p.colors.length?String(it.color||'')+'||'+String(it.size||''):String(it.size||'');
      const group=String(p.id)+'::'+key;demand[group]=(demand[group]||0)+Number(it.qty||0);
    });
    Object.keys(demand).forEach(group=>{
      const parts=group.split('::'),p=byId[parts[0]],map=p.colors.length?p.stockByVariant:p.stockBySize,available=Number(map[parts[1]]||0);
      if(available<demand[group])throw Error(p.name+' ('+parts[1].replace('||',' / ')+') has only '+available+' in stock.');
    });
    const ps=DB_().getSheetByName('Products'),pm=headerMap_(ps);
    Object.keys(demand).forEach(group=>{
      const parts=group.split('::'),p=byId[parts[0]],map=p.colors.length?p.stockByVariant:p.stockBySize;
      map[parts[1]]=Number(map[parts[1]]||0)-demand[group];
      const productIndex=all.findIndex(x=>String(x.id)===String(p.id)),col=p.colors.length?pm.VariantStockJSON:pm.StockJSON;
      ps.getRange(productIndex+2,col+1).setValue(JSON.stringify(map));
    });
    s.getRange(ix+2,m.Status+1).setValue('Confirmed');
    s.getRange(ix+2,m.StockDeducted+1).setValue(true);
    return {success:true,status:'Confirmed'};
  }finally{lock.releaseLock();}
}
function deleteManualApparelDraft(token,id){
  auth_(token);id=String(id||'').trim();
  const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow();
  if(n<2)throw Error('Order not found.');
  const rows=s.getRange(2,1,n-1,s.getLastColumn()).getValues(),ix=rows.findIndex(r=>String(r[m.ID])===id);
  if(ix<0)throw Error('Order not found.');
  const row=rows[ix];
  if(row[m.Manual]!==true||String(row[m.Status])!=='Draft')throw Error('Only manual draft orders can be deleted.');
  if(row[m.StockDeducted]===true)throw Error('This order has deducted stock and cannot be deleted.');
  s.deleteRow(ix+2);return {success:true};
}
function setApparelDispatchInfo(token,id,barcode){
  auth_(token);id=String(id||'').trim();barcode=String(barcode||'').trim().slice(0,100);
  if(!barcode)throw Error('Enter the postal barcode number.');
  const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow(),rows=n>1?s.getRange(2,1,n-1,s.getLastColumn()).getValues():[];
  const ix=rows.findIndex(r=>String(r[m.ID])===id);if(ix<0)throw Error('Order not found.');
  const status=String(rows[ix][m.Status]||'');
  if(status!=='Confirmed'&&status!=='Processing'&&status!=='Dispatched')throw Error('Confirm the order before dispatch.');
  s.getRange(ix+2,m.DispatchBarcode+1).setValue(barcode);
  s.getRange(ix+2,m.DispatchedAt+1).setValue(new Date());
  s.getRange(ix+2,m.Status+1).setValue('Dispatched');
  return {success:true,status:'Dispatched'};
}
/* Override status handler to restore stock only when stock was actually deducted. */
function updateApparelOrder(token,id,status){
  auth_(token);id=String(id||'').trim();status=String(status||'').trim();
  const allowed=['Draft','Pending','Confirmed','Processing','Dispatched','Completed','Cancelled'];
  if(!allowed.includes(status))throw Error('Invalid order status.');
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const s=apparelOrdersSheet_(),m=headerMap_(s),n=s.getLastRow();if(n<2)throw Error('Order not found.');
    const rows=s.getRange(2,1,n-1,s.getLastColumn()).getValues(),ix=rows.findIndex(r=>String(r[m.ID])===id);
    if(ix<0)throw Error('Order not found.');
    const row=rows[ix],previous=String(row[m.Status]||'Pending');
    if(previous==='Cancelled'&&status!=='Cancelled')throw Error('Cancelled orders cannot be reopened. Create a new order instead.');
    if(previous==='Draft'&&status!=='Draft'&&status!=='Cancelled')throw Error('Use Confirm Order to deduct stock safely.');
    if(status==='Cancelled'&&previous!=='Cancelled'){
      const marker=m.StockDeducted!==undefined?row[m.StockDeducted]:undefined;
      const deducted=marker===true||(marker===''||marker===undefined)&&previous!=='Draft';
      if(deducted){
        const items=json_(row[m.ItemsJSON],[]),ps=DB_().getSheetByName('Products'),all=products_(),byId={};all.forEach(p=>byId[String(p.id)]=p);
        const restore={};
        items.forEach(it=>{const p=byId[String(it.productId||'')];if(!p)return;const key=p.colors.length?String(it.color||'')+'||'+String(it.size||''):String(it.size||'');const group=String(p.id)+'::'+key;restore[group]=(restore[group]||0)+Number(it.qty||0);});
        const pm=headerMap_(ps);
        Object.keys(restore).forEach(group=>{const parts=group.split('::'),p=byId[parts[0]];if(!p)return;const map=p.colors.length?p.stockByVariant:p.stockBySize;map[parts[1]]=Number(map[parts[1]]||0)+restore[group];const pi=all.findIndex(x=>String(x.id)===String(p.id)),col=p.colors.length?pm.VariantStockJSON:pm.StockJSON;ps.getRange(pi+2,col+1).setValue(JSON.stringify(map));});
        if(m.StockDeducted!==undefined)s.getRange(ix+2,m.StockDeducted+1).setValue(false);
      }
    }
    s.getRange(ix+2,m.Status+1).setValue(status);
    return {success:true,status};
  }finally{lock.releaseLock();}
}
