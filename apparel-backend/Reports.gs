/* Ranowin Apparel reporting + backup module.
   This module is separate from the Baby Bags backend.
   Existing Orders columns are preserved; reporting columns are appended only. */
const APPAREL_REPORT_SHEET_ID_FALLBACK_ = '1qIGJH4rbE1XljAFeGKDyC0qic5Vaf0eVxxbjW63jecQ';

function apparelReportDb_() {
  const id = String(P_().getProperty('APPAREL_REPORT_SHEET_ID') || APPAREL_REPORT_SHEET_ID_FALLBACK_).trim();
  if (!id) throw new Error('Set APPAREL_REPORT_SHEET_ID in Script Properties.');
  return SpreadsheetApp.openById(id);
}
function apparelReportHeaders_() {
  const db = DB_();
  let orders = db.getSheetByName('Orders');
  if (!orders) throw new Error('Orders sheet not found.');
  ensureHeaders_(orders, ['DeliveryFee','GoodsTotal','PaymentStatus']);
  let payments = db.getSheetByName('Payments');
  if (!payments) payments = db.insertSheet('Payments');
  ensureHeaders_(payments, ['PaymentID','OrderID','PaymentDate','Amount','GoodsAmount','DeliveryAmount','Method','Note']);
  return {orders:orders,payments:payments};
}
function apparelRowsAsObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getDisplayValues()[0];
  return sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues().map(row => {
    const o = {};
    headers.forEach((h,i) => o[String(h).trim()] = row[i]);
    return o;
  });
}
function apparelDate_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function apparelMoney_(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function apparelMonthlySummary_(year) {
  const sheets = apparelReportHeaders_();
  const orders = apparelRowsAsObjects_(sheets.orders);
  const payments = apparelRowsAsObjects_(sheets.payments);
  const months = {};
  for (let m=0;m<12;m++) {
    const key = year+'-'+('0'+(m+1)).slice(-2);
    months[key] = {month:key,label:Utilities.formatDate(new Date(year,m,1),Session.getScriptTimeZone(),'MMM'),orders:0,goodsSales:0,deliveryCharged:0,receivedGoods:0,receivedDelivery:0,received:0,outstanding:0};
  }
  const paidByOrder = {};
  payments.forEach(p => {
    const d = apparelDate_(p.PaymentDate);
    if (!d || d.getFullYear() !== year) return;
    const key = Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM');
    if (!months[key]) return;
    const goods = apparelMoney_(p.GoodsAmount);
    const delivery = apparelMoney_(p.DeliveryAmount);
    const amount = apparelMoney_(p.Amount) || goods+delivery;
    months[key].receivedGoods += goods;
    months[key].receivedDelivery += delivery;
    months[key].received += amount;
    const oid = String(p.OrderID || '');
    if (oid) paidByOrder[oid] = (paidByOrder[oid] || 0) + amount;
  });
  let totalOrders=0,totalGoods=0,totalDelivery=0,totalReceived=0,totalOutstanding=0;
  orders.forEach(o => {
    const d = apparelDate_(o.CreatedAt);
    if (!d || d.getFullYear() !== year) return;
    const key = Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM');
    if (!months[key]) return;
    const status = String(o.Status || 'Draft').toLowerCase();
    if (status === 'cancelled' || status === 'returned') return;
    const goods = apparelMoney_(o.GoodsTotal !== '' && o.GoodsTotal != null ? o.GoodsTotal : o.Total);
    const delivery = apparelMoney_(o.DeliveryFee);
    const due = goods + delivery;
    const paid = paidByOrder[String(o.ID || '')] || 0;
    months[key].orders++;
    months[key].goodsSales += goods;
    months[key].deliveryCharged += delivery;
    months[key].outstanding += Math.max(0,due-paid);
    totalOrders++; totalGoods+=goods; totalDelivery+=delivery; totalOutstanding+=Math.max(0,due-paid);
  });
  Object.keys(months).forEach(k => {
    const x=months[k];
    x.goodsSales=Math.round(x.goodsSales*100)/100;
    x.deliveryCharged=Math.round(x.deliveryCharged*100)/100;
    x.receivedGoods=Math.round(x.receivedGoods*100)/100;
    x.receivedDelivery=Math.round(x.receivedDelivery*100)/100;
    x.received=Math.round(x.received*100)/100;
    x.outstanding=Math.round(x.outstanding*100)/100;
    totalReceived+=x.received;
  });
  return {year:year,months:Object.keys(months).sort().map(k=>months[k]),totals:{orders:totalOrders,goodsSales:Math.round(totalGoods*100)/100,deliveryCharged:Math.round(totalDelivery*100)/100,received:Math.round(totalReceived*100)/100,outstanding:Math.round(totalOutstanding*100)/100}};
}
function getApparelSummary(token, year) {
  auth_(token);
  const y = Number(year) || new Date().getFullYear();
  if (!Number.isInteger(y) || y<2020 || y>2100) throw new Error('Invalid report year.');
  return apparelMonthlySummary_(y);
}
function apparelWriteReportWorkbook_(summary) {
  const db=apparelReportDb_();
  let s=db.getSheetByName('Apparel Summary'); if(!s)s=db.insertSheet('Apparel Summary');
  let m=db.getSheetByName('Monthly Data'); if(!m)m=db.insertSheet('Monthly Data');
  [s,m].forEach(sh=>{sh.clear();sh.getCharts().forEach(c=>sh.removeChart(c));});
  s.getRange('A1:B1').merge().setValue('RANOWIN APPAREL — SUMMARY REPORT').setFontSize(16).setFontWeight('bold');
  s.getRange('A2:B2').merge().setValue('Year: '+summary.year+' | Generated: '+new Date()).setFontColor('#666666');
  s.getRange(4,1,5,2).setValues([
    ['Metric','LKR / Count'],
    ['Orders',summary.totals.orders],
    ['Goods sales',summary.totals.goodsSales],
    ['Delivery fees charged',summary.totals.deliveryCharged],
    ['Payments received',summary.totals.received]
  ]);
  s.getRange('A10:B10').setValues([['Outstanding balance',summary.totals.outstanding]]);
  s.getRange('A4:B4').setFontWeight('bold').setBackground('#e9e2f3');
  s.getRange('A10:B10').setFontWeight('bold').setBackground('#fce8e6');
  m.getRange(1,1,1,8).setValues([['Month','Orders','Goods Sales','Delivery Charged','Received - Goods','Received - Delivery','Total Received','Outstanding']]);
  if(summary.months.length) m.getRange(2,1,summary.months.length,8).setValues(summary.months.map(x=>[x.label,x.orders,x.goodsSales,x.deliveryCharged,x.receivedGoods,x.receivedDelivery,x.received,x.outstanding]));
  m.getRange(1,1,1,8).setFontWeight('bold').setBackground('#e9e2f3');
  m.setFrozenRows(1); m.autoResizeColumns(1,8);
  const chart=m.newChart().setChartType(Charts.ChartType.COLUMN).addRange(m.getRange(1,1,13,1)).addRange(m.getRange(1,7,13,1)).setOption('title','Monthly Payments Received (LKR)').setOption('legend',{position:'none'}).setPosition(15,1,0,0).build();
  m.insertChart(chart);
  const chart2=m.newChart().setChartType(Charts.ChartType.LINE).addRange(m.getRange(1,1,13,1)).addRange(m.getRange(1,8,13,1)).setOption('title','Monthly Outstanding Balance (LKR)').setOption('legend',{position:'none'}).setPosition(15,9,0,0).build();
  m.insertChart(chart2);
  return db.getUrl();
}
function apparelCsv_(sheet) {
  const values=sheet.getDataRange().getDisplayValues();
  return values.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
function apparelBackupFolder_() {
  const props=P_(),id=String(props.getProperty('APPAREL_BACKUP_FOLDER_ID')||'').trim();
  if(id) { try { return DriveApp.getFolderById(id); } catch(e) {} }
  const folder=DriveApp.createFolder('Ranowin Apparel Backups');
  props.setProperty('APPAREL_BACKUP_FOLDER_ID',folder.getId());
  return folder;
}
function apparelCreatePdfBackup_(folder,summary) {
  const doc=DocumentApp.create('Ranowin Apparel Summary '+summary.year+' '+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd-HHmm'));
  const body=doc.getBody();
  body.appendParagraph('RANOWIN APPAREL — SUMMARY REPORT').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Year: '+summary.year);
  body.appendParagraph('Orders: '+summary.totals.orders);
  body.appendParagraph('Goods sales: LKR '+summary.totals.goodsSales.toLocaleString());
  body.appendParagraph('Delivery fees charged: LKR '+summary.totals.deliveryCharged.toLocaleString());
  body.appendParagraph('Payments received: LKR '+summary.totals.received.toLocaleString());
  body.appendParagraph('Outstanding balance: LKR '+summary.totals.outstanding.toLocaleString());
  body.appendParagraph('Monthly breakdown').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  const table=[['Month','Orders','Goods sales','Delivery','Received','Outstanding']];
  summary.months.forEach(x=>table.push([x.label,String(x.orders),String(x.goodsSales),String(x.deliveryCharged),String(x.received),String(x.outstanding)]));
  body.appendTable(table);
  doc.saveAndClose();
  const file=DriveApp.getFileById(doc.getId()),pdf=folder.createFile(file.getBlob().getAs(MimeType.PDF).setName(doc.getName()+'.pdf'));
  file.setTrashed(true);
  return pdf.getUrl();
}
function runApparelBackup_(token) {
  auth_(token);
  return apparelRunBackupCore_();
}
function apparelRunBackupCore_() {
  const sheets=apparelReportHeaders_(),year=new Date().getFullYear(),summary=apparelMonthlySummary_(year),folder=apparelBackupFolder_();
  const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd-HHmmss');
  const ordersCsv=apparelCsv_(sheets.orders),paymentsCsv=apparelCsv_(sheets.payments);
  folder.createFile('Apparel-Orders-'+stamp+'.csv',ordersCsv,MimeType.CSV);
  folder.createFile('Apparel-Payments-'+stamp+'.csv',paymentsCsv,MimeType.CSV);
  const reportUrl=apparelWriteReportWorkbook_(summary);
  const pdfUrl=apparelCreatePdfBackup_(folder,summary);
  return {message:'Backup completed. Orders and Payments CSV + Summary PDF saved to Google Drive.',folderUrl:folder.getUrl(),reportUrl:reportUrl,pdfUrl:pdfUrl,year:year};
}
function enableApparelDailyBackup(token) {
  auth_(token);
  const exists=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='apparelDailyBackup_');
  if(!exists) ScriptApp.newTrigger('apparelDailyBackup_').timeBased().everyDays(1).atHour(2).create();
  return 'Automatic daily backup enabled (around 2:00 AM, script time zone).';
}
function apparelDailyBackup_() { return apparelRunBackupCore_(); }
