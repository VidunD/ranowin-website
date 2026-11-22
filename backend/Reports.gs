/*
 * Ranowin Baby Bags — monthly reports and Drive backups.
 * Reads the existing private Orders workbook only. It never edits or deletes order data.
 */
function bagReportFolder_(){
  const p=props_(); let id=p.getProperty('BAG_BACKUP_FOLDER_ID');
  if(id){try{return DriveApp.getFolderById(id);}catch(e){p.deleteProperty('BAG_BACKUP_FOLDER_ID');}}
  const f=DriveApp.createFolder('Ranowin Baby Bags Backups');
  p.setProperty('BAG_BACKUP_FOLDER_ID',f.getId()); return f;
}
function bagReportWorkbook_(){
  const p=props_(); let id=p.getProperty('BAG_REPORT_SHEET_ID');
  if(id){try{return SpreadsheetApp.openById(id);}catch(e){p.deleteProperty('BAG_REPORT_SHEET_ID');}}
  const ss=SpreadsheetApp.create('Ranowin Baby Bags — Monthly Reports');
  p.setProperty('BAG_REPORT_SHEET_ID',ss.getId());
  try{DriveApp.getFileById(ss.getId()).moveTo(bagReportFolder_());}catch(e){Logger.log('Could not move report workbook into backup folder: '+e);}
  return ss;
}
function bagReportData_(){
  const orders=orderRows_().map(x=>x.value).filter(o=>!o.deleted);
  const legacy=legacyReceipts_().filter(r=>!r.voided);
  const months={};
  function month_(key){if(!months[key])months[key]={month:key,orders:0,goods:0,delivery:0,legacy:0,deductions:0,received:0};return months[key];}
  orders.forEach(o=>{
    const created=String(o.invoiceDate||o.created||'').slice(0,7);
    if(/^\d{4}-\d{2}$/.test(created))month_(created).orders++;
    (o.payments||[]).filter(p=>!p.voided).forEach(p=>{
      const key=String(p.date||'').slice(0,7);if(!/^\d{4}-\d{2}$/.test(key))return;
      const m=month_(key),goods=Number(p.goods)||0,delivery=Number(p.delivery)||0,fee=Number(p.fee)||0;
      m.goods+=goods;m.delivery+=delivery;m.deductions+=fee;m.received+=goods+delivery-fee;
    });
  });
  legacy.forEach(r=>{
    const amount=Number(r.settledAmount??((!r.status||r.status==='Received')?r.amount:0))||0;
    const date=String(r.settledDate||r.date||'');
    if(amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(date)){const m=month_(date.slice(0,7));m.legacy+=amount;m.received+=amount;}
  });
  const active=orders.filter(o=>['Confirmed','Dispatched','Delivered'].includes(o.status));
  let goodsOutstanding=0,deliveryOutstanding=0;
  active.forEach(o=>{const t=orderTotals_(o);goodsOutstanding+=Math.max(0,t.goods-t.goodsReceived);deliveryOutstanding+=Math.max(0,t.delivery-t.deliveryReceived);});
  const legacyPending=legacy.filter(r=>r.status==='Pending').reduce((n,r)=>n+(Number(r.amount)||0),0);
  const rows=Object.keys(months).sort().map(k=>{const m=months[k];return {...m,goods:m.goods/100,delivery:m.delivery/100,legacy:m.legacy/100,deductions:m.deductions/100,received:m.received/100};});
  return {generatedAt:new Date().toISOString(),orderCount:orders.length,activeOrders:active.length,goodsOutstanding:goodsOutstanding/100,deliveryOutstanding:deliveryOutstanding/100,legacyPending:legacyPending/100,outstanding:(goodsOutstanding+deliveryOutstanding)/100+legacyPending/100,goodsReceived:rows.reduce((n,m)=>n+m.goods,0),deliveryReceived:rows.reduce((n,m)=>n+m.delivery,0),legacyReceived:rows.reduce((n,m)=>n+m.legacy,0),deductions:rows.reduce((n,m)=>n+m.deductions,0),received:rows.reduce((n,m)=>n+m.received,0),months:rows,orders,legacy};
}
function bagWriteReport_(){
  const d=bagReportData_(),ss=bagReportWorkbook_();
  let s=ss.getSheetByName('Monthly Summary')||ss.insertSheet('Monthly Summary');
  s.getCharts().forEach(c=>s.removeChart(c));s.clear();
  s.getRange(1,1,1,7).merge().setValue('Ranowin Baby Bags — Monthly Summary').setFontSize(16).setFontWeight('bold');
  s.getRange(2,1,1,2).merge().setValue('Generated: '+d.generatedAt);
  s.getRange(4,1,7,2).setValues([
    ['All-time goods received (LKR)',d.goodsReceived],
    ['All-time delivery received (LKR)',d.deliveryReceived],
    ['Old bill receipts (LKR)',d.legacyReceived],
    ['Postal deductions (LKR)',d.deductions],
    ['Net cash received (LKR)',d.received],
    ['Outstanding incl. old bills (LKR)',d.outstanding],
    ['Orders in private database',d.orderCount]
  ]);
  s.getRange(12,1,1,7).setValues([['Month','Orders created','Goods received','Delivery received','Old bill receipts','Postal deductions','Net cash received']]).setFontWeight('bold');
  if(d.months.length)s.getRange(13,1,d.months.length,7).setValues(d.months.map(m=>[m.month,m.orders,m.goods,m.delivery,m.legacy,m.deductions,m.received]));
  s.setFrozenRows(12);s.autoResizeColumns(1,7);
  if(d.months.length){
    const chart=s.newChart().setChartType(Charts.ChartType.COLUMN).addRange(s.getRange(12,1,d.months.length+1,1)).addRange(s.getRange(12,7,d.months.length+1,1)).setPosition(4,4,0,0).setOption('title','Monthly net cash received (LKR)').setOption('legend',{position:'none'}).build();s.insertChart(chart);
    const chart2=s.newChart().setChartType(Charts.ChartType.COLUMN).addRange(s.getRange(12,1,d.months.length+1,1)).addRange(s.getRange(12,3,d.months.length+1,1)).addRange(s.getRange(12,6,d.months.length+1,1)).setPosition(20,1,0,0).setOption('title','Goods received vs postal deductions (LKR)').build();s.insertChart(chart2);
  }
  let detail=ss.getSheetByName('Payment Details')||ss.insertSheet('Payment Details');detail.clear();
  const payments=[['Type','Order / Bill','Customer','Received date','Goods / amount (LKR)','Delivery (LKR)','Postal deduction (LKR)','Net cash (LKR)']];
  d.orders.forEach(o=>(o.payments||[]).filter(p=>!p.voided).forEach(p=>payments.push(['Order',o.billReference||o.reference||o.id,o.customer||'',p.date||'',(Number(p.goods)||0)/100,(Number(p.delivery)||0)/100,(Number(p.fee)||0)/100,((Number(p.goods)||0)+(Number(p.delivery)||0)-(Number(p.fee)||0))/100])));
  d.legacy.forEach(r=>{const amount=Number(r.settledAmount??((!r.status||r.status==='Received')?r.amount:0))||0;if(amount>0)payments.push(['Old bill',r.bill,'Historical receipt',r.settledDate||r.date||'',amount/100,0,0,amount/100]);});
  detail.getRange(1,1,payments.length,payments[0].length).setValues(payments);detail.setFrozenRows(1);detail.getRange(1,1,1,8).setFontWeight('bold');detail.autoResizeColumns(1,8);
  return {spreadsheetId:ss.getId(),url:ss.getUrl(),data:d};
}
function bagCsv_(rows){return rows.map(r=>r.map(v=>{const x=String(v??'');return /[",\n\r]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;}).join(',')).join('\r\n');}
function bagCreatePdf_(d,folder){
  const doc=DocumentApp.create('Ranowin Baby Bags Backup '+Utilities.formatDate(new Date(),'Asia/Colombo','yyyy-MM-dd HHmm'));
  const body=doc.getBody();body.appendParagraph('Ranowin Production — Baby Bags').setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph('Monthly summary generated '+d.generatedAt);
  body.appendParagraph('Net cash received: LKR '+d.received.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Goods received: LKR '+d.goodsReceived.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Delivery received: LKR '+d.deliveryReceived.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Old bill receipts (delivery not separated): LKR '+d.legacyReceived.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Postal deductions: LKR '+d.deductions.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Outstanding including old bills: LKR '+d.outstanding.toLocaleString('en-LK',{minimumFractionDigits:2,maximumFractionDigits:2}));
  body.appendParagraph('Monthly breakdown').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  const table=[['Month','Orders','Goods','Delivery','Old bills','Deductions','Net cash']];
  d.months.forEach(m=>table.push([m.month,String(m.orders),m.goods.toFixed(2),m.delivery.toFixed(2),m.legacy.toFixed(2),m.deductions.toFixed(2),m.received.toFixed(2)]));
  body.appendTable(table);doc.saveAndClose();
  const file=folder.createFile(DriveApp.getFileById(doc.getId()).getBlob().setName('Baby-Bags-Summary-'+Utilities.formatDate(new Date(),'Asia/Colombo','yyyyMMdd-HHmm')+'.pdf'));
  DriveApp.getFileById(doc.getId()).setTrashed(true);return file;
}
function bagBackupCore_(){
  const folder=bagReportFolder_(),report=bagWriteReport_(),d=report.data,stamp=Utilities.formatDate(new Date(),'Asia/Colombo','yyyyMMdd-HHmmss');
  const orders=[['ID','Reference','Created','Status','Customer','Phone','Address','Goods (LKR)','Delivery (LKR)','Total (LKR)','Goods received (LKR)','Delivery received (LKR)','Tracking','Order JSON']];
  d.orders.forEach(o=>{const t=orderTotals_(o);orders.push([o.id,o.billReference||o.reference||o.id,o.created,o.status,o.customer,o.phone,o.address,t.goods/100,t.delivery/100,t.total/100,t.goodsReceived/100,t.deliveryReceived/100,o.tracking||'',JSON.stringify(o)]);});
  const payments=[['Type','Order / Bill','Customer','Date','Goods / amount (LKR)','Delivery (LKR)','Postal deduction (LKR)','Net cash (LKR)','Status']];
  d.orders.forEach(o=>(o.payments||[]).forEach(p=>payments.push(['Order',o.billReference||o.reference||o.id,o.customer||'',p.date||'',(p.goods||0)/100,(p.delivery||0)/100,(p.fee||0)/100,((p.goods||0)+(p.delivery||0)-(p.fee||0))/100,p.voided?'VOID':'Received'])));
  d.legacy.forEach(r=>payments.push(['Old bill',r.bill,'Historical receipt',r.settledDate||r.date||'',(Number(r.settledAmount??((!r.status||r.status==='Received')?r.amount:0))||0)/100,0,0,(Number(r.settledAmount??((!r.status||r.status==='Received')?r.amount:0))||0)/100,r.status||'Received']));
  folder.createFile('Baby-Bags-Orders-'+stamp+'.csv',bagCsv_(orders),MimeType.CSV);
  folder.createFile('Baby-Bags-Payments-'+stamp+'.csv',bagCsv_(payments),MimeType.CSV);
  const pdf=bagCreatePdf_(d,folder);
  return {folderId:folder.getId(),folderUrl:folder.getUrl(),reportUrl:report.url,pdfUrl:pdf.getUrl(),orders:d.orders.length,months:d.months.length};
}
function getBagReports(token){auth_(token);const d=bagReportData_();return {generatedAt:d.generatedAt,orderCount:d.orderCount,activeOrders:d.activeOrders,goodsOutstanding:d.goodsOutstanding,deliveryOutstanding:d.deliveryOutstanding,legacyPending:d.legacyPending,outstanding:d.outstanding,goodsReceived:d.goodsReceived,deliveryReceived:d.deliveryReceived,legacyReceived:d.legacyReceived,deductions:d.deductions,received:d.received,months:d.months,reportUrl:props_().getProperty('BAG_REPORT_SHEET_ID')?'https://docs.google.com/spreadsheets/d/'+props_().getProperty('BAG_REPORT_SHEET_ID')+'/edit':''};}
function runBagBackup(token){auth_(token);return bagBackupCore_();}
function enableBagDailyBackup(token){auth_(token);ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='bagDailyBackup').forEach(t=>ScriptApp.deleteTrigger(t));ScriptApp.newTrigger('bagDailyBackup').timeBased().everyDays(1).atHour(2).create();return 'Daily Baby Bags backup enabled (around 2 AM Sri Lanka time).';}
function bagDailyBackup(){return bagBackupCore_();}
