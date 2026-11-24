/* Ranowin Apparel backend — separate Apps Script Web App.
   Per-size inventory and product size charts are stored without replacing existing product data. */
function P_(){return PropertiesService.getScriptProperties();}
function DB_(){const id=String(P_().getProperty('APPAREL_SHEET_ID')||'').trim();if(!id)throw Error('APPAREL_SHEET_ID is missing. Add the Google Sheet ID (not the full URL) in Script Properties.');return SpreadsheetApp.openById(id);}
function doGet(e){
  if(e&&e.parameter&&e.parameter.action==='catalog'){
    const products=products_().filter(p=>p.active);
    return ContentService.createTextOutput(JSON.stringify({version:2,products:products})).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Admin').setTitle('Ranowin Apparel Admin').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function hash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function ensureHeaders_(sheet,headers){
  if(sheet.getLastRow()===0){sheet.appendRow(headers);return;}
  const current=sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(),1)).getValues()[0].map(String);
  headers.forEach(h=>{if(!current.includes(h)){sheet.getRange(1,sheet.getLastColumn()+1).setValue(h);current.push(h);}});
}
function setupApparel_(){
  const p=P_(),superEmail=String(p.getProperty('SUPER_ADMIN_EMAIL')||'').trim().toLowerCase(),superPass=p.getProperty('SUPER_ADMIN_PASSWORD'),staffEmail=String(p.getProperty('APPAREL_ADMIN_EMAIL')||'binadiperera05@gmail.com').trim().toLowerCase(),staffPass=p.getProperty('APPAREL_ADMIN_PASSWORD');
  if(!superEmail||!superPass||superPass.length<16)throw Error('Set SUPER_ADMIN_EMAIL and a 16+ character SUPER_ADMIN_PASSWORD first.');
  if(!staffPass||staffPass.length<16)throw Error('Set APPAREL_ADMIN_PASSWORD to a unique 16+ character password first.');
  const db=DB_();
  const specs={Settings:['Key','Value'],Products:['ID','Name','Category','Description','ImagesJSON','ColorsJSON','SizesJSON','BasePrice','Active','CreatedAt','UpdatedAt','StockJSON','SizeChartImage','SizeChartJSON','DiscountPrice'],Orders:['ID','CreatedAt','Customer','Phone','Address','ItemsJSON','Total','Status','DesignFilesJSON','Notes'],Categories:['Name','Active'],Users:['Email','Role','Salt','PasswordHash','Active']};
  Object.keys(specs).forEach(n=>{let s=db.getSheetByName(n);if(!s)s=db.insertSheet(n);ensureHeaders_(s,specs[n]);});
  const c=db.getSheetByName('Categories');if(c.getLastRow()===1)['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'].forEach(x=>c.appendRow([x,true]));
  const u=db.getSheetByName('Users'),rows=u.getLastRow()>1?u.getRange(2,1,u.getLastRow()-1,5).getValues():[];
  [[superEmail,'SUPER_ADMIN',superPass],[staffEmail,'APPAREL_ADMIN',staffPass]].forEach(x=>{const salt=Utilities.getUuid(),record=[x[0],x[1],salt,hash_(salt+x[2]),true],i=rows.findIndex(r=>String(r[0]).toLowerCase()===x[0]);if(i>=0)u.getRange(i+2,1,1,5).setValues([record]);else u.appendRow(record);});
  p.deleteProperty('SUPER_ADMIN_PASSWORD');p.deleteProperty('APPAREL_ADMIN_PASSWORD');
  return 'Setup complete. Existing product rows were preserved; stock and size-chart columns are ready.';
}
function migrateApparelStockAndSizeCharts_(){const s=DB_().getSheetByName('Products');if(!s)throw Error('Products sheet not found. Run setupApparel_ first.');ensureHeaders_(s,['ID','Name','Category','Description','ImagesJSON','ColorsJSON','SizesJSON','BasePrice','Active','CreatedAt','UpdatedAt','StockJSON','SizeChartImage','SizeChartJSON','DiscountPrice']);return 'Migration complete. Existing products preserved; StockJSON, SizeChartImage and SizeChartJSON columns are ready.';}
function json_(v,f){try{return JSON.parse(v||'')}catch(e){return f;}}
function headerMap_(sheet){const h=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];const m={};h.forEach((v,i)=>m[String(v)]=i);return m;}
function products_(){
  const s=DB_().getSheetByName('Products');if(s.getLastRow()<2)return [];
  const m=headerMap_(s),rows=s.getRange(2,1,s.getLastRow()-1,s.getLastColumn()).getValues();
  return rows.map(r=>({
    id:r[m.ID],name:r[m.Name],category:r[m.Category],description:r[m.Description],
    images:json_(r[m.ImagesJSON],[]),colors:json_(r[m.ColorsJSON],[]),sizes:json_(r[m.SizesJSON],['S','M','L','XL','2XL']),
    basePrice:Number(r[m.BasePrice])||0,discountPrice:r[m.DiscountPrice]===''||r[m.DiscountPrice]===undefined?null:Number(r[m.DiscountPrice]),salePrice:r[m.DiscountPrice]!==''&&r[m.DiscountPrice]!==undefined&&Number(r[m.DiscountPrice])>=0&&Number(r[m.DiscountPrice])<Number(r[m.BasePrice])?Number(r[m.DiscountPrice]):Number(r[m.BasePrice])||0,active:r[m.Active]===true,createdAt:r[m.CreatedAt],updatedAt:r[m.UpdatedAt],
    stockBySize:json_(r[m.StockJSON],{}),sizeChartImage:String(r[m.SizeChartImage]||''),sizeChart:json_(r[m.SizeChartJSON],[])
  })).filter(p=>p.id);
}
function apparelStaffCategories_(){return ['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'];}
function categoryNames_(){const s=DB_().getSheetByName('Categories');return s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,2).getValues().filter(r=>r[1]===true).map(r=>String(r[0]));}
function getAdminData(token){const a=auth_(token),cats=categoryNames_(),allowed=a.role==='SUPER_ADMIN'?cats:apparelStaffCategories_().filter(c=>cats.includes(c));return {role:a.role,email:a.email,categories:allowed,products:products_().filter(p=>allowed.includes(p.category))};}
function login(email,password){
  const e=String(email||'').trim().toLowerCase(),s=DB_().getSheetByName('Users'),n=s.getLastRow();
  if(n<2)throw Error('Run setupApparel_ first.');
  const rows=s.getRange(2,1,n-1,5).getValues(),u=rows.find(r=>String(r[0]).toLowerCase()===e&&r[4]===true);
  if(!u||hash_(String(u[2])+String(password||''))!==u[3])throw Error('Email or password is incorrect.');
  const token=Utilities.getUuid()+Utilities.getUuid(),role=u[1];CacheService.getScriptCache().put('apparel:'+hash_(token),JSON.stringify({email:e,role:role}),21600);
  return {token:token,role:role,email:e};
}
function auth_(token){const raw=CacheService.getScriptCache().get('apparel:'+hash_(String(token||'')));if(!raw)throw Error('Session expired. Sign in again.');return JSON.parse(raw);}
function requireSuper_(token){const a=auth_(token);if(a.role!=='SUPER_ADMIN')throw Error('Super Admin permission required.');return a;}
function saveProduct(token,p){
  const a=auth_(token);p=p||{};const name=String(p.name||'').trim(),cat=String(p.category||'').trim();
  if(!name||name.length>120)throw Error('Enter a product name (max 120 characters).');
  if(!categoryNames_().includes(cat))throw Error('Unknown category.');
  if(a.role!=='SUPER_ADMIN'&&!apparelStaffCategories_().includes(cat))throw Error('You cannot manage this category.');
  const price=Number(p.basePrice);if(!Number.isFinite(price)||price<0||price>10000000)throw Error('Invalid base price.');const discountRaw=p.discountPrice===''||p.discountPrice===null||p.discountPrice===undefined?null:Number(p.discountPrice);if(discountRaw!==null&&(!Number.isFinite(discountRaw)||discountRaw<0||discountRaw>=price))throw Error('Discount price must be lower than the original price.');
  const colors=Array.isArray(p.colors)?p.colors.map(x=>String(x).trim()).filter(Boolean).slice(0,40):[];
  const sizes=Array.isArray(p.sizes)?Array.from(new Set(p.sizes.map(x=>String(x).trim()).filter(Boolean))).slice(0,40):[];
  if(!sizes.length)throw Error('Add at least one size.');
  const images=Array.isArray(p.images)?p.images.map(x=>String(x).trim()).filter(x=>/^https:\/\//i.test(x)).slice(0,8):[];
  const stockInput=p.stockBySize&&typeof p.stockBySize==='object'?p.stockBySize:{};
  const s=DB_().getSheetByName('Products'),m=headerMap_(s),id=String(p.id||'').trim(),all=products_(),old=id?all.find(x=>x.id===id):null;
  if(id&&!old)throw Error('Product not found.');
  if(old&&a.role!=='SUPER_ADMIN'&&!apparelStaffCategories_().includes(old.category))throw Error('Access denied.');
  const stock={};sizes.forEach(size=>{const raw=Object.prototype.hasOwnProperty.call(stockInput,size)?stockInput[size]:(old&&old.stockBySize&&old.stockBySize[size]!==undefined?old.stockBySize[size]:0);const n=Number(raw);if(!Number.isInteger(n)||n<0||n>1000000)throw Error('Stock for size '+size+' must be a whole number from 0 to 1,000,000.');stock[size]=n;});
  const chartImage=String(p.sizeChartImage||'').trim();if(chartImage&&!/^https:\/\//i.test(chartImage))throw Error('Size chart image must be an HTTPS URL.');
  const chart=Array.isArray(p.sizeChart)?p.sizeChart.slice(0,40).map(x=>({size:String(x.size||'').trim(),chest:String(x.chest||'').trim(),length:String(x.length||'').trim(),waist:String(x.waist||'').trim(),hip:String(x.hip||'').trim()})).filter(x=>x.size):[];
  const now=new Date().toISOString(),record={
    ID:id||'AP-'+Utilities.getUuid().slice(0,8).toUpperCase(),Name:name,Category:cat,Description:String(p.description||'').slice(0,2000),
    ImagesJSON:JSON.stringify(images),ColorsJSON:JSON.stringify(colors),SizesJSON:JSON.stringify(sizes),BasePrice:price,DiscountPrice:discountRaw===null?'':discountRaw,Active:p.active!==false,
    CreatedAt:old?old.createdAt:now,UpdatedAt:now,StockJSON:JSON.stringify(stock),SizeChartImage:chartImage,SizeChartJSON:JSON.stringify(chart)
  };
  const row=new Array(s.getLastColumn()).fill('');Object.keys(record).forEach(k=>{if(m[k]!==undefined)row[m[k]]=record[k];});
  if(old){const ix=all.findIndex(x=>x.id===id);s.getRange(ix+2,1,1,row.length).setValues([row]);}else s.appendRow(row);
  return getAdminData(token);
}
function deleteProduct(token,id){
  const a=auth_(token),all=products_(),ix=all.findIndex(p=>p.id===id);if(ix<0)throw Error('Product not found.');
  if(a.role!=='SUPER_ADMIN'&&!apparelStaffCategories_().includes(all[ix].category))throw Error('Access denied.');
  const s=DB_().getSheetByName('Products'),m=headerMap_(s);s.deleteRow(ix+2);return getAdminData(token);
}
function addCategory(token,name){requireSuper_(token);name=String(name||'').trim();if(!name||name.length>80)throw Error('Enter a category name.');if(categoryNames_().some(x=>x.toLowerCase()===name.toLowerCase()))throw Error('Category already exists.');DB_().getSheetByName('Categories').appendRow([name,true]);return getAdminData(token);}
function renameCategory(token,oldName,newName){
  requireSuper_(token);oldName=String(oldName||'').trim();newName=String(newName||'').trim();
  if(!oldName||!newName||newName.length>80)throw Error('Enter a valid category name (1–80 characters).');
  if(oldName===newName)throw Error('The new name is the same as the current name.');
  const db=DB_(),cs=db.getSheetByName('Categories'),last=cs.getLastRow();if(last<2)throw Error('Category not found.');
  const rows=cs.getRange(2,1,last-1,2).getValues(),ix=rows.findIndex(r=>String(r[0])===oldName&&r[1]===true);if(ix<0)throw Error('Active category not found.');
  if(rows.some((r,i)=>i!==ix&&r[1]===true&&String(r[0]).toLowerCase()===newName.toLowerCase()))throw Error('A category with that name already exists.');
  cs.getRange(ix+2,1).setValue(newName);const ps=db.getSheetByName('Products'),n=ps.getLastRow();
  if(n>1){const m=headerMap_(ps),vals=ps.getRange(2,1,n-1,ps.getLastColumn()).getValues();vals.forEach(r=>{if(String(r[m.Category])===oldName)r[m.Category]=newName;});ps.getRange(2,1,vals.length,vals[0].length).setValues(vals);}
  return getAdminData(token);
}
function deleteCategory(token,name){
  requireSuper_(token);name=String(name||'').trim();if(!name)throw Error('Category name is required.');
  const db=DB_(),cs=db.getSheetByName('Categories'),last=cs.getLastRow();if(last<2)throw Error('Category not found.');
  const rows=cs.getRange(2,1,last-1,2).getValues(),ix=rows.findIndex(r=>String(r[0])===name&&r[1]===true);if(ix<0)throw Error('Active category not found.');
  const ps=db.getSheetByName('Products'),all=products_(),count=all.filter(p=>p.category===name).length;if(count)throw Error('Cannot delete this category: '+count+' product(s) still use it. Move or delete those products first.');
  cs.getRange(ix+2,2).setValue(false);return getAdminData(token);
}
function savePricing(token,pricing){const a=auth_(token);if(a.role!=='SUPER_ADMIN')throw Error('Only Super Admin can edit global pricing.');const s=DB_().getSheetByName('Settings');Object.keys(pricing||{}).forEach(k=>{const key='PRICE_'+k.replace(/[^A-Z0-9_]/gi,'_').toUpperCase(),n=Number(pricing[k]);if(!Number.isFinite(n)||n<0||n>10000000)throw Error('Invalid price.');const vals=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,2).getValues():[],i=vals.findIndex(r=>r[0]===key);if(i<0)s.appendRow([key,n]);else s.getRange(i+2,2).setValue(n);});return 'Pricing saved.';}
function logout(token){CacheService.getScriptCache().remove('apparel:'+hash_(String(token||'')));return true;}
