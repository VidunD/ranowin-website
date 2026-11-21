/* Ranowin Apparel backend — deploy as a separate Apps Script Web App.
   All write operations enforce role and category scope on the server. */
function P_(){return PropertiesService.getScriptProperties();}
function DB_(){return SpreadsheetApp.openById(P_().getProperty('APPAREL_SHEET_ID'));}
function doGet(e){
  if(e && e.parameter && e.parameter.action==='catalog'){
    const data={version:1,products:products_().filter(p=>p.active)};
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createHtmlOutputFromFile('Admin').setTitle('Ranowin Apparel Admin').addMetaTag('viewport','width=device-width,initial-scale=1');
}
function hash_(s){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function setupApparel_(){
  const p=P_(),superEmail=String(p.getProperty('SUPER_ADMIN_EMAIL')||'').trim().toLowerCase(),superPass=p.getProperty('SUPER_ADMIN_PASSWORD'),staffEmail=String(p.getProperty('APPAREL_ADMIN_EMAIL')||'binadiperera05@gmail.com').trim().toLowerCase(),staffPass=p.getProperty('APPAREL_ADMIN_PASSWORD');
  if(!superEmail||!superPass||superPass.length<16)throw Error('Set SUPER_ADMIN_EMAIL and a 16+ character SUPER_ADMIN_PASSWORD first.');
  if(!staffPass||staffPass.length<16)throw Error('Set APPAREL_ADMIN_PASSWORD to a unique 16+ character password first.');
  const db=DB_();
  const specs={Settings:['Key','Value'],Products:['ID','Name','Category','Description','ImagesJSON','ColorsJSON','SizesJSON','BasePrice','Active','CreatedAt','UpdatedAt'],Orders:['ID','CreatedAt','Customer','Phone','Address','ItemsJSON','Total','Status','DesignFilesJSON','Notes'],Categories:['Name','Active'],Users:['Email','Role','Salt','PasswordHash','Active']};
  Object.keys(specs).forEach(n=>{let s=db.getSheetByName(n);if(!s)s=db.insertSheet(n);if(s.getLastRow()===0)s.appendRow(specs[n]);});
  const c=db.getSheetByName('Categories');if(c.getLastRow()===1)['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'].forEach(x=>c.appendRow([x,true]));
  const u=db.getSheetByName('Users');const rows=u.getLastRow()>1?u.getRange(2,1,u.getLastRow()-1,5).getValues():[];
  [[superEmail,'SUPER_ADMIN',superPass],[staffEmail,'APPAREL_ADMIN',staffPass]].forEach(x=>{const salt=Utilities.getUuid(),record=[x[0],x[1],salt,hash_(salt+x[2]),true],i=rows.findIndex(r=>String(r[0]).toLowerCase()===x[0]);if(i>=0)u.getRange(i+2,1,1,5).setValues([record]);else u.appendRow(record);});
  p.deleteProperty('SUPER_ADMIN_PASSWORD');p.deleteProperty('APPAREL_ADMIN_PASSWORD');
  return 'Setup complete. Super Admin and Apparel Admin accounts created.';
}
function login(email,password){
  const e=String(email||'').trim().toLowerCase(),s=DB_().getSheetByName('Users'),n=s.getLastRow();
  if(n<2)throw Error('Run setupApparel_ first.');
  const rows=s.getRange(2,1,n-1,5).getValues(),u=rows.find(r=>String(r[0]).toLowerCase()===e&&r[4]===true);
  if(!u||hash_(String(u[2])+String(password||''))!==u[3])throw Error('Email or password is incorrect.');
  const token=Utilities.getUuid()+Utilities.getUuid(),role=u[1],cache=CacheService.getScriptCache();
  cache.put('apparel:'+hash_(token),JSON.stringify({email:e,role}),21600);
  return {token,role,email:e};
}
function auth_(token){const raw=CacheService.getScriptCache().get('apparel:'+hash_(String(token||'')));if(!raw)throw Error('Session expired. Sign in again.');return JSON.parse(raw);}
function requireSuper_(token){const a=auth_(token);if(a.role!=='SUPER_ADMIN')throw Error('Super Admin permission required.');return a;}
function categoryNames_(){const s=DB_().getSheetByName('Categories');return s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,2).getValues().filter(r=>r[1]===true).map(r=>String(r[0]));}
function products_(){const s=DB_().getSheetByName('Products');if(s.getLastRow()<2)return [];return s.getRange(2,1,s.getLastRow()-1,11).getValues().map(r=>({id:r[0],name:r[1],category:r[2],description:r[3],images:json_(r[4],[]),colors:json_(r[5],[]),sizes:json_(r[6],['S','M','L','XL','2XL']),basePrice:Number(r[7])||0,active:r[8]===true,createdAt:r[9],updatedAt:r[10]}));}
function json_(v,f){try{return JSON.parse(v||'')}catch(e){return f;}}
function apparelStaffCategories_(){return ['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'];}
function getAdminData(token){const a=auth_(token),allowed=a.role==='SUPER_ADMIN'?categoryNames_():apparelStaffCategories_().filter(c=>categoryNames_().includes(c));return {role:a.role,email:a.email,categories:allowed,products:products_().filter(p=>allowed.includes(p.category))};}
function saveProduct(token,p){
  const a=auth_(token);p=p||{};const name=String(p.name||'').trim(),cat=String(p.category||'').trim();
  if(!name||name.length>120)throw Error('Enter a product name.');if(!categoryNames_().includes(cat))throw Error('Unknown category.');
  if(a.role!=='SUPER_ADMIN'&&!apparelStaffCategories_().includes(cat))throw Error('You cannot manage this category.');
  const price=Number(p.basePrice);if(!Number.isFinite(price)||price<0||price>10000000)throw Error('Invalid base price.');
  const colors=Array.isArray(p.colors)?p.colors.map(x=>String(x).trim()).filter(Boolean).slice(0,40):[];
  const sizes=Array.isArray(p.sizes)?p.sizes.map(x=>String(x).trim()).filter(Boolean).slice(0,40):[];
  const images=Array.isArray(p.images)?p.images.map(x=>String(x).trim()).filter(x=>/^https:\/\//i.test(x)).slice(0,8):[];
  const s=DB_().getSheetByName('Products'),id=String(p.id||'').trim(),all=products_(),old=id?all.find(x=>x.id===id):null;
  if(id&&!old)throw Error('Product not found.');
  if(old&&a.role!=='SUPER_ADMIN'&&!['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'].includes(old.category))throw Error('Access denied.');
  const now=new Date().toISOString(),row=[id||'AP-'+Utilities.getUuid().slice(0,8).toUpperCase(),name,cat,String(p.description||'').slice(0,2000),JSON.stringify(images),JSON.stringify(colors),JSON.stringify(sizes),price,p.active!==false,old?old.createdAt:now,now];
  if(old){const ix=all.findIndex(x=>x.id===id);s.getRange(ix+2,1,1,row.length).setValues([row]);}else s.appendRow(row);
  return getAdminData(token);
}
function deleteProduct(token,id){const a=auth_(token),all=products_(),ix=all.findIndex(p=>p.id===id);if(ix<0)throw Error('Product not found.');if(a.role!=='SUPER_ADMIN'&&!['T-Shirts','Hoodies','Shorts','Sports Bottoms','Caps'].includes(all[ix].category))throw Error('Access denied.');DB_().getSheetByName('Products').deleteRow(ix+2);return getAdminData(token);}
function addCategory(token,name){requireSuper_(token);name=String(name||'').trim();if(!name||name.length>80)throw Error('Enter a category name.');if(categoryNames_().some(x=>x.toLowerCase()===name.toLowerCase()))throw Error('Category already exists.');DB_().getSheetByName('Categories').appendRow([name,true]);return getAdminData(token);}
function savePricing(token,pricing){const a=auth_(token);if(a.role!=='SUPER_ADMIN')throw Error('Only Super Admin can edit global pricing.');const s=DB_().getSheetByName('Settings');if(s.getLastRow()===0)s.appendRow(['Key','Value']);Object.keys(pricing||{}).forEach(k=>{const key='PRICE_'+k.replace(/[^A-Z0-9_]/gi,'_').toUpperCase(),n=Number(pricing[k]);if(!Number.isFinite(n)||n<0||n>10000000)throw Error('Invalid price.');const vals=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,2).getValues():[],i=vals.findIndex(r=>r[0]===key);if(i<0)s.appendRow([key,n]);else s.getRange(i+2,2).setValue(n);});return 'Pricing saved.';}
function logout(token){CacheService.getScriptCache().remove('apparel:'+hash_(String(token||'')));return true;}
