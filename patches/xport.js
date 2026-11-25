/* ===== Reports: PDF / Excel / CSV in the same format as the farm app (copied from the farm app's export code) ===== */
(function(){
const TX={xNoTable:'No report table on this page.',xGen:'Generated',xConf:'Confidential – for NSR Poultry Farms use',xPage:'Page',xPages:'pages',xReady:'PDF ready',xReadyXl:'Excel ready',xSheets:'sheets',xShareSave:'Share / Save to Files',xOpenPdf:'Open PDF',xOpenXl:'Open file',xBackApp:'Back to app',xSheetHelp:'Share sends it to WhatsApp, Mail or Files. If you open the file, tap Done (top-left) to come back.',saveFail:'Could not create the file.'};
const t=k=>TX[k]||k,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=q=>document.querySelector(q),cur='fm',NAVINFO={fm:['','fmTitle']},today=()=>td(),fmtDate=d=>dFmt(d),toast=m=>say(m),audit=()=>{},logoSrc=()=>LOGO,loadScript=undefined,xPdf=()=>{try{window.print()}catch(e){}};
const S={farm:{name:'NSR Poultry Farms'},get user(){const u=window.__fmUser;return u?{name:u.name}:null}};
TX.fmTitle='';
const xName=()=>'NSR-FeedMill-'+String(TT[tab][0]).replace(/[^\w]+/g,'-')+'-'+td();
const xTables=()=>[...document.querySelectorAll('#app main .page table')].filter(x=>x.rows.length>1&&!x.closest('[data-noexp]'));
function xTitle(tb){let el=tb;for(let i=0;i<6&&el;i++){let p=el.previousElementSibling;while(p){const h=p.matches&&(p.matches('h2,h3,.rep-title')?p:p.querySelector&&p.querySelector('h2,h3,.rep-title'));if(h)return h.textContent.trim();p=p.previousElementSibling}el=el.parentElement}return''}
/* PDF of the report tables only (with their headings) – not the other cards, buttons or forms on the screen */
function xClean(tb){const c=tb.cloneNode(true);const lv=[...tb.querySelectorAll('input,select,textarea')];c.querySelectorAll('input,select,textarea').forEach((x,i)=>{const o=lv[i],sp=document.createElement('span');sp.textContent=!o?'':o.tagName==='SELECT'?((o.options[o.selectedIndex]||{}).text||''):o.type==='checkbox'?(o.checked?'✓':''):o.value;x.replaceWith(sp)});c.querySelectorAll('button').forEach(x=>x.remove());return c}
/* print-quality report: its own clean layout (never the app's colours or dark mode) */
function xPrintTable(tb){const c=xClean(tb);c.querySelectorAll('*').forEach(el=>{const cl=String(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||'');
    if(/\b(red|neg)\b/.test(cl)||/var\(--red\)/.test(el.getAttribute('style')||''))el.setAttribute('data-neg','1');if(/\bpos\b/.test(cl))el.setAttribute('data-pos','1');
    if(/\b(hl|pc)\b/.test(cl))el.setAttribute('data-hl','1');if(/\b(tiny|muted)\b/.test(cl))el.setAttribute('data-sm','1');
    el.removeAttribute('class');el.removeAttribute('style');el.removeAttribute('id');el.removeAttribute('title')});
  c.querySelectorAll('svg').forEach(g=>{const sp=document.createElement('span');sp.textContent='✓';sp.setAttribute('data-pos','1');g.replaceWith(sp)});
  c.removeAttribute('class');c.removeAttribute('style');
  /* numbers right-aligned, text left */c.querySelectorAll('td').forEach(td=>{const v=td.textContent.trim();if(v&&/^[-+−₹(]?[\d,.]+%?\)?(\s|$)/.test(v))td.setAttribute('data-n','1')});
  return c}
/* real PDF file (same on iPhone, Android and computer); falls back to the print page if the PDF tools cannot load or the text is Tamil */
const xLd=u=>typeof loadScript==='function'?loadScript(u):new Promise((ok,no)=>{const x=document.createElement('script');x.src=u;x.onload=ok;x.onerror=no;document.head.appendChild(x)});
async function xImg(src){return new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0);res({d:c.toDataURL('image/jpeg',.92),w:c.width,h:c.height})}catch(e){res(null)}};im.onerror=()=>res(null);im.src=src})}
/* the built-in PDF fonts only have Latin letters: write ₹ as Rs, drop emoji */
/* PDF text: with the bundled DejaVu font ₹ and dashes print as they are; without it (font not loaded) fall back to Latin-only */
let XF=false;const xLat=v=>{v=String(v==null?'':v);if(XF)return v.replace(/[^\x00-\xFF₹−–—‘’“”•…✓→←≥≤×]/g,'').replace(/\s+/g,' ').trim();
  return v.replace(/₹/g,'Rs ').replace(/[−–—]/g,'-').replace(/✓/g,'OK').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[^\x00-\xFF]/g,'').replace(/\s+/g,' ').trim()};
async function xFont(doc){try{if(!window.__nsrF){const base=(location.pathname.includes('/feedmill/')?'../':'')+'fonts/';
    const b64=async u=>{const r=await fetch(base+u);if(!r.ok)throw 0;const a=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<a.length;i+=8192)s+=String.fromCharCode.apply(null,a.subarray(i,i+8192));return btoa(s)};
    window.__nsrF=[await b64('nsr-pdf.ttf'),await b64('nsr-pdf-b.ttf')]}
  doc.addFileToVFS('nsr.ttf',window.__nsrF[0]);doc.addFont('nsr.ttf','nsr','normal');doc.addFileToVFS('nsr-b.ttf',window.__nsrF[1]);doc.addFont('nsr-b.ttf','nsr','bold');return true}catch(e){return false}}
/* iPhone/iPad: keep the PDF inside the app – a sheet with Share / Save and Close, so the home-screen app is never left without a way back */
function xSheet(blob,name,pages,kind){const old=document.getElementById('xSheet');if(old)old.remove();
  const file=new File([blob],name,{type:kind==='xl'?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/pdf'}),url=URL.createObjectURL(blob),canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  const o=document.createElement('div');o.id='xSheet';o.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(20,14,8,.55);display:flex;align-items:flex-end;justify-content:center';
  o.innerHTML=`<div style="background:var(--card,#fff);color:var(--ink,#211810);width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -6px 30px rgba(0,0,0,.25)">
   <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><div style="font-size:30px">${kind==='xl'?'📊':'📄'}</div><div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</b><small style="opacity:.7">${kind==='xl'?t('xReadyXl')+' · '+pages+' '+t('xSheets'):t('xReady')+' · '+pages+' '+t('xPages')}</small></div>
   <button id="xsX" aria-label="Close" style="border:0;background:rgba(0,0,0,.07);color:inherit;width:36px;height:36px;border-radius:50%;font-size:18px">✕</button></div>
   ${canShare?`<button id="xsShare" class="btn" style="width:100%;margin-bottom:10px;padding:14px;font-size:16px">⬆️ ${t('xShareSave')}</button>`:''}
   <a id="xsOpen" href="${url}" download="${esc(name)}" class="btn ${canShare?'ghost':''}" style="display:block;text-align:center;width:100%;box-sizing:border-box;margin-bottom:10px;padding:14px;font-size:16px;text-decoration:none">👁 ${kind==='xl'?t('xOpenXl'):t('xOpenPdf')}</a>
   <button id="xsClose" class="btn ghost" style="width:100%;padding:12px">${t('xBackApp')}</button>
   <small style="display:block;margin-top:10px;opacity:.65;text-align:center">${t('xSheetHelp')}</small></div>`;
  document.body.appendChild(o);const close=()=>{o.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)};
  o.querySelector('#xsX').onclick=close;o.querySelector('#xsClose').onclick=close;o.onclick=e=>{if(e.target===o)close()};
  const sh=o.querySelector('#xsShare');if(sh)sh.onclick=async()=>{try{await navigator.share({files:[file],title:name})}catch(e){}};}
async function xPdfFile(btn){const tbs=xTables();if(!tbs.length)return toast(t('xNoTable'));
  if(tbs.some(tb=>/[஀-௿]/.test(tb.textContent)))return xPdf();
  const lab=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='…'}
  try{if(!(window.jspdf&&window.jspdf.jsPDF))await xLd('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const {jsPDF}=window.jspdf;if(!(jsPDF.API&&jsPDF.API.autoTable))await xLd('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
    const cols=Math.max(...tbs.map(tb=>Math.max(...[...tb.rows].map(r=>[...r.cells].reduce((a,x)=>a+(x.colSpan||1),0)))));
    const fmt=cols>26?'a3':'a4',ori=cols>12?'landscape':'portrait',fs=cols>30?6.4:cols>20?7:cols>12?7.8:8.6;
    const doc=new jsPDF({orientation:ori,unit:'mm',format:fmt});XF=await xFont(doc);const FN=XF?'nsr':'helvetica',FT=XF?'nsr':'times';const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=8;
    const title=xLat(t((NAVINFO[cur]||['',''])[1]||''))||'Report',farm=xLat(S.farm.name||'NSR Poultry Farms'),dt=fmtDate(($('#dDate')&&$('#dDate').value)||today()),gen=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const logo=await xImg(logoSrc());
    const head=()=>{let x=M;if(logo){const h=11,w=Math.min(34,h*logo.w/logo.h);doc.addImage(logo.d,'JPEG',M,6,w,h);x=M+w+4}
      doc.setFont(FT,'bold');doc.setFontSize(15);doc.setTextColor(59,39,23);doc.text(farm,x,11);doc.setFont(FN,'normal');doc.setFontSize(8.5);doc.setTextColor(122,106,88);doc.text(title,x,15.5);
      doc.setFont(FN,'bold');doc.setFontSize(10);doc.setTextColor(59,39,23);doc.text(dt,W-M,10,{align:'right'});doc.setFont(FN,'normal');doc.setFontSize(7.5);doc.setTextColor(122,106,88);doc.text(t('xGen')+': '+gen,W-M,14,{align:'right'});if(S.user)doc.text(xLat(S.user.name),W-M,17.5,{align:'right'});
      doc.setDrawColor(107,74,49);doc.setLineWidth(.7);doc.line(M,20,W-M,20)};
    let y=24;const host=document.createElement('div');host.style.cssText='position:fixed;left:-99999px;top:0';document.body.appendChild(host);
    for(const tb of tbs){const c=xPrintTable(tb);host.innerHTML='';host.appendChild(c);const h=xLat(xTitle(tb));
      if(h){if(y>H-30){doc.addPage();y=24}doc.setFont(FN,'bold');doc.setFontSize(9.5);doc.setTextColor(59,39,23);doc.text(h,M,y);y+=2.5}
      doc.autoTable({html:c,startY:y,margin:{top:24,left:M,right:M,bottom:12},theme:'grid',useCss:false,
        styles:{font:FN,fontSize:fs,cellPadding:{top:1.1,bottom:1.1,left:1,right:1},lineColor:[214,201,182],lineWidth:.15,textColor:[33,24,16],valign:'middle',overflow:'linebreak'},
        headStyles:{fillColor:[239,228,211],textColor:[59,39,23],fontStyle:'bold',halign:'center',lineColor:[201,183,158]},
        footStyles:{fillColor:[239,228,211],textColor:[33,24,16],fontStyle:'bold'},alternateRowStyles:{fillColor:[250,246,239]},
        showHead:'everyPage',showFoot:'lastPage',
        didParseCell:d=>{const el=d.cell.raw;if(!el||!el.getAttribute)return;if(d.section==='head'&&d.row.index===0&&d.table.head.length>1)d.cell.styles.fillColor=[227,210,184];
          if(el.hasAttribute('data-n'))d.cell.styles.halign='right';if(el.querySelector&&el.querySelector('[data-neg]')||el.hasAttribute('data-neg'))d.cell.styles.textColor=[179,38,30];
          if(el.querySelector&&el.querySelector('[data-pos]')||el.hasAttribute('data-pos'))d.cell.styles.textColor=[30,123,69];if(el.hasAttribute('data-hl')||d.column.index===0)d.cell.styles.fontStyle='bold';
          d.cell.text=d.cell.text.map(xLat)},
        didDrawPage:()=>head()});y=doc.lastAutoTable.finalY+8}
    host.remove();const n=doc.internal.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont(FN,'normal');doc.setFontSize(7);doc.setTextColor(154,138,120);doc.setDrawColor(221,208,189);doc.setLineWidth(.2);doc.line(M,H-8,W-M,H-8);doc.text(farm+' · '+title+' · '+t('xConf'),M,H-4.5);doc.text((t('xPage')||'Page')+' '+i+' / '+n,W-M,H-4.5,{align:'right'})}
    const iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(iOS)xSheet(doc.output('blob'),xName()+'.pdf',n);else doc.save(xName()+'.pdf');audit('export','pdf',cur)}
  catch(e){xPdf()}
  if(btn){btn.disabled=false;btn.textContent=lab}}
function xCsv(){const tbs=xTables();if(!tbs.length)return toast(t('xNoTable'));const q=v=>{v=String(v??'').replace(/\s+/g,' ').trim();return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const out=[];tbs.forEach((tb,i)=>{const c=xClean(tb),h=xTitle(tb);if(i)out.push('');if(h)out.push(q(h));
    /* expand merged cells so every column lines up */const grid=[];[...c.rows].forEach((tr,ri)=>{grid[ri]=grid[ri]||[];let ci=0;[...tr.cells].forEach(td=>{while(grid[ri][ci]!==undefined)ci++;const rs=td.rowSpan||1,cs=td.colSpan||1,v=td.innerText!==undefined&&td.innerText!==''?td.innerText:td.textContent;for(let a=0;a<rs;a++)for(let b=0;b<cs;b++){grid[ri+a]=grid[ri+a]||[];grid[ri+a][ci+b]=b?'':v}ci+=cs})});
    grid.forEach(row=>out.push(row.map(q).join(',')))});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+out.join('\n')],{type:'text/csv'}));a.download=xName()+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),800);audit('export','csv',cur)}
/* ===== Excel (.xlsx) built in the app: same look as the PDF, real numbers, locked sheet (select & sum allowed, no editing) ===== */
const XZ={crc:null};
function xzCrc(b){if(!XZ.crc){XZ.crc=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;XZ.crc[n]=c>>>0}}let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=XZ.crc[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function xzZip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;const d=new Date(),dt=((d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1))&0xFFFF,dd=(((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate())&0xFFFF;
  for(const [name,txt] of files){const nb=enc.encode(name),data=enc.encode(txt),crc=xzCrc(data);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,dt,true);h.setUint16(12,dd,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nb.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),nb,data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nb.length,true);c.setUint32(42,off,true);
    cd.push(new Uint8Array(c.buffer),nb);off+=30+nb.length+data.length}
  const cdl=cd.reduce((a,x)=>a+x.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdl,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
const xe=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const xCol=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
/* one table cell → value + kind: numbers become real numbers ("₹1,200", "−3.5%", "(40)") */
function xCellVal(td){const k=td.cloneNode(true);k.querySelectorAll('br').forEach(b=>b.replaceWith(' '));const sm=[...k.querySelectorAll('[data-sm]')].map(x=>{const v=x.textContent.trim();x.remove();return v}).filter(Boolean);
  let main=k.textContent.replace(/\s+/g,' ').trim(),extra=sm.join(' · ');
  const raw=main.replace(/[₹\s]/g,'').replace(/[−–]/g,'-');let m=/^([+-]?)\(?([+-]?)([\d,]*\.?\d+)\)?(%?)$/.exec(raw);
  if(m&&main!=='-'&&main!=='–'){const neg=m[1]==='-'||m[2]==='-'||/^\(.*\)$/.test(raw),n=parseFloat(m[3].replace(/,/g,''))*(neg?-1:1),dp=(m[3].split('.')[1]||'').length,cur=/₹/.test(main),pct=m[4]==='%';
    return{n,dp,cur,pct,comma:/,/.test(m[3])||Math.abs(n)>=1000,note:extra}}
  if(main==='–'||main==='-')main='';
  return{s:extra&&main?main+' ('+extra+')':(main||extra)}}
function xlsxBook(tbs){const sheets=[],used={},styles=[],sk={},fonts=['<font><sz val="10"/><name val="Calibri"/></font>'],fk={},fills=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'],flk={},nfs=[],nfk={};
  const font=(b,c,sz,i)=>{const x=`<font>${b?'<b/>':''}${i?'<i/>':''}<sz val="${sz||10}"/>${c?`<color rgb="FF${c}"/>`:''}<name val="Calibri"/></font>`;if(fk[x]==null){fk[x]=fonts.length;fonts.push(x)}return fk[x]};
  const fill=c=>{if(!c)return 0;const x=`<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`;if(flk[x]==null){flk[x]=fills.length;fills.push(x)}return flk[x]};
  const nf=code=>{if(!code)return 0;if(nfk[code]==null){nfk[code]=164+nfs.length;nfs.push(`<numFmt numFmtId="${nfk[code]}" formatCode="${xe(code)}"/>`)}return nfk[code]};
  const st=o=>{const key=JSON.stringify(o);if(sk[key]!=null)return sk[key];const f=font(o.b,o.c,o.sz,o.i),fl=fill(o.f),n=nf(o.nf),br=o.br?1:0;
    styles.push(`<xf numFmtId="${n}" fontId="${f}" fillId="${fl}" borderId="${br}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${n?' applyNumberFormat="1"':''} applyAlignment="1"><alignment horizontal="${o.h||'general'}" vertical="center"${o.w?' wrapText="1"':''}/><protection locked="1"/></xf>`);sk[key]=styles.length-1;return styles.length-1};
  st({});/* index 0 placeholder → real styles start at 1 */
  const farm=S.farm.name||'NSR Poultry Farms',title=t((NAVINFO[cur]||['',''])[1]||'')||'Report',dt=fmtDate(($('#dDate')&&$('#dDate').value)||today()),gen=new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  tbs.forEach((tb,ti)=>{const c=xPrintTable(tb),grid=[],merges=[];let hdr=0;
    [...c.rows].forEach((tr,ri)=>{grid[ri]=grid[ri]||[];let ci=0;const isH=[...tr.cells].every(x=>x.tagName==='TH');if(isH&&ri===hdr)hdr++;
      [...tr.cells].forEach(td=>{while(grid[ri][ci]!==undefined)ci++;const rs=td.rowSpan||1,cs=td.colSpan||1,v=xCellVal(td);
        v.th=td.tagName==='TH';v.neg=td.hasAttribute('data-neg')||!!td.querySelector('[data-neg]');v.pos=td.hasAttribute('data-pos')||!!td.querySelector('[data-pos]');v.hl=td.hasAttribute('data-hl')||!!td.querySelector('b,strong');
        for(let a=0;a<rs;a++)for(let b=0;b<cs;b++){grid[ri+a]=grid[ri+a]||[];grid[ri+a][ci+b]=a||b?{span:1,th:v.th}:v}
        if(rs>1||cs>1)merges.push([ri,ci,ri+rs-1,ci+cs-1]);ci+=cs})});
    let nc=Math.max(1,...grid.map(r=>r.length));const T=4;/* drop trailing columns with nothing in them (e.g. delete buttons) */while(nc>1&&grid.every(r=>{const v=r[nc-1];return !v||v.span||(v.n==null&&!v.s)}))nc--;/* title rows */
    const sub=xTitle(tb)||title;let name=sub.replace(/[\\\/?*\[\]:]/g,' ').replace(/\s+/g,' ').slice(0,28).replace(/[\s·–-]+$/,'').trim()||('Table '+(ti+1));while(used[name])name=name.slice(0,25)+' '+(++used[name]);used[name]=1;
    const W=new Array(nc).fill(6),rows=[];
    const cellX=(r,ci,v)=>{const ref=xCol(ci)+(r+1);if(!v||v.span){const s=v&&v.th?st({b:1,c:'3B2717',f:'EFE4D3',br:1,h:'center',w:1}):st({br:1});return `<c r="${ref}" s="${s}"/>`}
      if(v.th){W[ci]=Math.max(W[ci],Math.min(28,(v.s||'').length*0.9+2));return `<c r="${ref}" s="${st({b:1,c:'3B2717',f:'EFE4D3',br:1,h:'center',w:1})}" t="inlineStr"><is><t>${xe(v.s??v.n)}</t></is></c>`}
      const tot=v.rowTot,alt=v.alt,fl=tot?'F1E6D4':alt?'FAF6EF':'',col=v.neg?'B3261E':v.pos?'1E7B45':'211810',bold=tot||v.hl||ci===0;
      if(v.n!=null){const d=v.dp?'.'+'0'.repeat(Math.min(v.dp,3)):'',base=(v.comma?'#,##0':'0')+d,code=(v.cur?'"₹"':'')+base+(v.pct?'"%"':'')+';'+(v.cur?'-"₹"':'-')+base+(v.pct?'"%"':'');
        const len=String(Math.abs(v.n).toFixed(v.dp)).length+(v.comma?Math.floor(String(Math.trunc(Math.abs(v.n))).length/3):0)+(v.cur?2:0)+(v.pct?1:0)+(v.n<0?1:0);W[ci]=Math.max(W[ci],len+2);
        return `<c r="${ref}" s="${st({b:bold?1:0,c:v.n<0?'B3261E':col,f:fl,br:1,h:'right',nf:code})}"><v>${v.n}</v></c>`}
      const s=v.s||'';W[ci]=Math.max(W[ci],Math.min(42,s.length*1.05+2));return s?`<c r="${ref}" s="${st({b:bold?1:0,c:col,f:fl,br:1,h:'left',w:s.length>42?1:0})}" t="inlineStr"><is><t xml:space="preserve">${xe(s)}</t></is></c>`:`<c r="${ref}" s="${st({br:1,f:fl})}"/>`};
    rows.push(`<row r="1" ht="22" customHeight="1"><c r="A1" s="${st({b:1,c:'3B2717',sz:16})}" t="inlineStr"><is><t>${xe(farm)}</t></is></c></row>`);
    rows.push(`<row r="2" ht="17" customHeight="1"><c r="A2" s="${st({b:1,c:'6B4A31',sz:12})}" t="inlineStr"><is><t>${xe(sub)}</t></is></c></row>`);
    rows.push(`<row r="3"><c r="A3" s="${st({i:1,c:'7A6A58',sz:9})}" t="inlineStr"><is><t>${xe(title+' · '+dt+' · '+t('xGen')+' '+gen+(S.user?' · '+S.user.name:''))}</t></is></c></row>`);
    let k=0;grid.forEach((r,ri)=>{const first=r[0]&&!r[0].span?(r[0].s||''):'';const tot=ri>=hdr&&/^(total|மொத்தம்|grand)/i.test(first);if(ri>=hdr)k++;
      for(let ci=0;ci<nc;ci++){const v=r[ci];if(v&&!v.span&&!v.th){v.rowTot=tot;v.alt=k%2===0}}
      rows.push(`<row r="${T+ri+1}">${Array.from({length:nc},(_,ci)=>cellX(T+ri,ci,r[ci])).join('')}</row>`)});
    const mg=merges.map(([a,b,c2,d])=>`<mergeCell ref="${xCol(b)}${T+a+1}:${xCol(d)}${T+c2+1}"/>`);
    const xml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${xCol(nc-1)}${T+grid.length}"/>
<sheetViews><sheetView workbookViewId="0" showGridLines="0"${ti===0?' tabSelected="1"':''}><pane ySplit="${T+hdr}" xSplit="1" topLeftCell="B${T+hdr+1}" activePane="bottomRight" state="frozen"/><selection pane="bottomRight"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>
<cols>${W.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${Math.max(7,Math.min(46,w)).toFixed(1)}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData>
<sheetProtection sheet="1" objects="1" scenarios="1" formatColumns="0" formatRows="0" sort="1" autoFilter="1"/>${mg.length?`<mergeCells count="${mg.length}">${mg.join('')}</mergeCells>`:''}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${nc>8?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;L${xe(farm)} · ${xe(sub)} · ${xe(t('xConf'))}&amp;R${xe(t('xPage')||'Page')} &amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
    sheets.push({name,xml,T,hdr})});
  const css=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${nfs.length?`<numFmts count="${nfs.length}">${nfs.join('')}</numFmts>`:''}<fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD6C9B6"/></left><right style="thin"><color rgb="FFD6C9B6"/></right><top style="thin"><color rgb="FFD6C9B6"/></top><bottom style="thin"><color rgb="FFD6C9B6"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${styles.length}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${styles.slice(1).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files=[['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${xe(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><definedNames>${sheets.map((s,i)=>`<definedName name="_xlnm.Print_Titles" localSheetId="${i}">'${xe(s.name).replace(/'/g,"''")}'!$${s.T+1}:$${s.T+s.hdr}</definedName>`).filter((x,i)=>sheets[i].hdr).join('')}</definedNames></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',css],...sheets.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml',s.xml])];
  return xzZip(files)}
function xXls(btn){const tbs=xTables();if(!tbs.length)return toast(t('xNoTable'));
  try{const blob=xlsxBook(tbs),name=xName()+'.xlsx',iOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(iOS)xSheet(blob,name,tbs.length,'xl');else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}audit('export','excel',cur)}
  catch(e){console.error(e);toast(t('saveFail'))}}

window.FMX={go(k,btn){TX.fmTitle='Feed Mill · '+TT[tab][0];return k==='pdf'?xPdfFile(btn):k==='xls'?xXls(btn):xCsv()}};
})();
