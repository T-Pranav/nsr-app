# builds app/feedmill/index.html from the Claude feed-mill page, wired to the farm's Firebase
import re,os
s=open('feedmill-src/orig.html').read()
a=s.index('<!DOCTYPE html>');s=s[a:]
s=s[:s.rindex('</body></html>')].rstrip()
if not s.endswith('</html>'):s+='\n'
def rep(x,y):
    global s
    assert s.count(x)==1,(s.count(x),x[:80]);s=s.replace(x,y)
# downloads: real browser download
rep("window.claude&&claude.use('downloads').then","(window.claude?claude.use('downloads'):Promise.resolve({save:o=>{const u=URL.createObjectURL(new Blob(['\\ufeff'+o.data],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download=o.filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},500);return Promise.resolve()}})).then")
rep(" tab(d){tab=d.v;render()},"," tab(d){tab=d.v;render()},\n fmth(d){fmSetTheme(d.v)},\n fmout(){try{sessionStorage.removeItem('lf-session');localStorage.removeItem('lf-session');localStorage.removeItem('lf-remember')}catch(e){}const go=()=>location.replace('../');try{const u=firebase.auth().currentUser;if(u&&!u.isAnonymous)return void firebase.auth().signOut().then(go,go)}catch(e){}go()},")
# firebase + farm login gate
rep("(window.claude?claude.use('db'):Promise.resolve(null)).then(d=>{db=d;ready=true;","fmConnect().then(d=>{db=d;ready=true;")
rep("render()}).catch(()=>{ready=true;render()});","render()}).catch(()=>{if(window.__fmLocked)return;ready=true;render()});")
loader=r"""
/* ===== hosted with the farm app: same Firebase, admin login from the farm app ===== */
function fmTheme(){let p='auto';try{p=localStorage.getItem('lf-theme')||'auto'}catch(e){}if(p==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=p;return p}
fmTheme();
function fmSetTheme(p){try{localStorage.setItem('lf-theme',p)}catch(e){}fmTheme();render()}
function fmThemeBtns(){const p=fmTheme();return `<div style="display:flex;gap:4px;margin-bottom:8px">${[['light','Light'],['dark','Dark'],['auto','Auto']].map(([k,l])=>`<button data-a="fmth" data-v="${k}" class="${p===k?'on':''}" style="flex:1;padding:6px 4px;font-size:12px">${l}</button>`).join('')}</div>`}
function fmUserBox(){const u=window.__fmUser;if(!u)return'';return `<div style="margin-bottom:8px"><b style="color:var(--brn)">${h(u.name)}</b><br><small>${u.mill==='admin'?'Feed mill admin':'Feed mill staff'}</small></div>${u.layer?'<a class="btn" href="../" style="display:block;text-align:center;margin-bottom:8px">Layer farm</a>':''}${fmThemeBtns()}<button data-a="fmout" style="display:block;width:100%;margin-bottom:8px">Log out</button>`}
function fmImportBtn(){const u=window.__fmUser;return u&&u.mill==='admin'?'<label class="btn" style="display:block;text-align:center;cursor:pointer;margin-bottom:8px">Import backup<input type="file" accept=".json" hidden data-imp="1"></label>':''}
function fmUserChip(){const u=window.__fmUser;if(!u)return'';return `<span class="pill fmchip">${h(u.name)}</span>${u.layer?'<a class="btn fmmob" href="../">Layer farm</a>':''}<button class="fmmob" data-a="fmth" data-v="${fmTheme()==='dark'?'light':'dark'}">${fmTheme()==='dark'?'☀️':'🌙'}</button><button class="fmmob" data-a="fmout">Log out</button>`}
function fmSel(el){if(!el||el===document.body||!el.matches||!el.matches('input,select,textarea'))return'';if(el.id)return '#'+CSS.escape(el.id);
  const a=[...el.attributes].filter(x=>x.name.startsWith('data-')&&x.name!=='data-fm-dirty').map(x=>'['+x.name+'="'+CSS.escape(x.value)+'"]');return a.length?el.tagName.toLowerCase()+a.join(''):''}
function fmKeep(){const el=document.activeElement,k={sel:fmSel(el),y:window.scrollY,sc:[...document.querySelectorAll('.sc')].map(x=>[x.scrollTop,x.scrollLeft])};
  if(k.sel){k.val=el.value;k.chk=el.checked;try{k.s0=el.selectionStart;k.s1=el.selectionEnd}catch(e){}k.dirty=el.dataset&&el.dataset.fmDirty==='1'}return k}
function fmRestore(k){if(!k)return;document.querySelectorAll('.sc').forEach((x,i)=>{const p=k.sc[i];if(p){x.scrollTop=p[0];x.scrollLeft=p[1]}});if(Math.abs(window.scrollY-k.y)>2)window.scrollTo(0,k.y);
  if(!k.sel)return;const el=document.querySelector(k.sel);if(!el)return;if(k.dirty&&el.type!=='checkbox'){el.value=k.val;el.dataset.fmDirty='1'}
  el.focus({preventScroll:true});try{if(k.s0!=null)el.setSelectionRange(k.s0,k.s1)}catch(e){}}
document.addEventListener('input',e=>{const t=e.target;if(t&&t.dataset&&t.matches('input,textarea'))t.dataset.fmDirty='1'},true);
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset)delete t.dataset.fmDirty;window.__fmInChange=true;setTimeout(()=>{window.__fmInChange=false},0)},true);
function fmLoad(src){return new Promise((ok,no)=>{const e=document.createElement('script');e.src=src;e.onload=ok;e.onerror=no;document.head.appendChild(e)})}
async function fmConnect(){
  await fmLoad('../firebase-config.js');const B='https://www.gstatic.com/firebasejs/10.14.1/';
  await fmLoad(B+'firebase-app-compat.js');await fmLoad(B+'firebase-auth-compat.js');await fmLoad(B+'firebase-firestore-compat.js');
  firebase.initializeApp(window.FIREBASE_CONFIG);const cu=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x)})});if(!cu){try{await firebase.auth().signInAnonymously()}catch(e){if(!firebase.auth().currentUser)throw e}}
  const f=firebase.firestore();try{f.settings({experimentalForceLongPolling:true,ignoreUndefinedProperties:true,merge:true})}catch(e){}try{await f.enablePersistence({synchronizeTabs:true})}catch(e){}
  let sess=null;try{sess=sessionStorage.getItem('lf-session')||(localStorage.getItem('lf-remember')==='1'?localStorage.getItem('lf-session'):null)}catch(e){}let ok=false;
  if(sess){if(sess==='owner'){ok=true;window.__fmUser={name:'Admin',mill:'admin',layer:'admin'}}else{let pub=null;try{const ps=await f.doc('public/staff').get();pub=ps.exists?ps.data():null}catch(e){}const authed=!!(firebase.auth().currentUser&&!firebase.auth().currentUser.isAnonymous);const st=pub&&pub.secured?null:await f.doc('settings/staff').get();const u=pub&&pub.secured?(authed?(pub.list||[]).find(x=>x.id===sess):null):((st.exists&&st.data().list)||[]).find(x=>x.id===sess);
    if(u){const mill=u.mill!==undefined?u.mill:(u.role==='admin'?'admin':u.role==='mill'?'staff':'');const layer=['sup','chk','admin'].includes(u.role)?u.role:'';if(mill){ok=true;window.__fmUser={name:u.name,mill,layer}}}}}
  if(!ok){window.__fmLocked=true;setTimeout(()=>location.replace('../'),1200);document.getElementById('app').innerHTML='<div style="max-width:420px;margin:80px auto;padding:24px;text-align:center;background:var(--sf);border:1px solid var(--bd);border-radius:18px"><h2 style="text-transform:none;font-size:20px;color:var(--brn)">Feed Mill</h2><p>Taking you to the login page…</p><a class="btn" href="../">Go to login</a></div>';throw new Error('login')}
  return{doc:p=>f.doc('fm_'+p),collection:c=>f.collection('fm_'+c),_f:f}}
async function fmImport(file){try{const o=JSON.parse(await file.text());const F=db._f;let n=0;
  for(const c of ['items','days','led','reg','cfg']){const m=o[c]||{};const ks=Object.keys(m);for(let i=0;i<ks.length;i+=400){const b=F.batch();ks.slice(i,i+400).forEach(k=>{b.set(F.doc('fm_'+c+'/'+k),m[k]);n++});await b.commit()}}
  say('Imported '+n+' records from the backup.')}catch(e){say('Could not import: '+(e.message||e))}}
"""
rep("function sub(c,k){",loader+"function sub(c,k){")
rep("${!db&&ready&&MODE!='local'?'<div class=\"bn\">Not connected to shared storage: changes live in this tab only.</div>':''}","${!db&&ready&&MODE!='local'?'<div class=\"bn\">Not connected to shared storage: changes live in this tab only.</div>':''}${db&&ready&&!Object.keys(S.items).length&&window.__fmUser&&window.__fmUser.mill==='admin'?'<div class=\"bn\">No feed mill data here yet. Import your backup file (feedmill-backup.json) to bring over your stock, formulas and purchases. <label class=\"btn\" style=\"cursor:pointer;margin-left:8px\">Import backup<input type=\"file\" accept=\".json\" hidden data-imp=\"1\"></label></div>':''}")
rep("<span class=\"pill\">${pill}</span>${EXTRA}","<span class=\"pill\">${pill}</span>${EXTRA}${fmUserChip()}")
rep("</style>","@media(min-width:861px){.fmmob{display:none!important}}</style>")

# keep the user's place when the page redraws (save, sync from other devices): focused box, cursor, typed value, scroll
rep("function render(){const ae=document.activeElement,ds=ae&&ae.dataset||{},fs=","function render(){if(window.__fmInChange){clearTimeout(window.__fmRT);window.__fmRT=setTimeout(render,0);return}const ae=document.activeElement,ds=ae&&ae.dataset||{},KP=fmKeep(),fs=")
rep(" if(fs){const e2=document.querySelector(fs);if(e2){e2.focus();try{e2.setSelectionRange(99,99)}catch(x){}}}}"," if(fs){const e2=document.querySelector(fs);if(e2){e2.focus();try{e2.setSelectionRange(99,99)}catch(x){}}}else fmRestore(KP)}")

# stock transfers both ways: godown -> mill (issue) and mill -> godown (return)
rep("if(e.type=='I'){x.g-=num(e.qty);x.m+=num(e.qty)}else if(e.inc!==false)","if(e.type=='I'){x.g-=num(e.qty);x.m+=num(e.qty)}else if(e.type=='R'){x.m-=num(e.qty);x.g+=num(e.qty)}else if(e.inc!==false)")
rep('<option value="I">Issue godown → mill</option>','<option value="I">Transfer: Godown → Mill (issue)</option><option value="R">Transfer: Mill → Godown (return)</option>')
rep("const e={date:g('ld'),type:t,item:it.n,qty,rate:num(g('lr'))||num(it.r),party:g('lp'),dest:t=='I'?'M':g('lm'),inc:t=='I'?true:$('#lc').checked};","if(t!=='P'){const C=calc(),x=C[id(it.n)],have=x?(t=='I'?x.g:x.m):0;if(qty>have+1e-9)return say('Only '+f2(have)+' kg of '+it.n+' in the '+(t=='I'?'godown':'mill')+'. Reduce the quantity.')}const e={date:g('ld'),type:t,item:it.n,qty,rate:num(g('lr'))||num(it.r),party:g('lp'),dest:t=='I'?'M':t=='R'?'G':g('lm'),inc:t=='P'?$('#lc').checked:true};")
rep("${e.type=='P'?'Purchase':'Issue'}","${e.type=='P'?'Purchase':e.type=='R'?'Mill → Godown':'Godown → Mill'}")
rep('Purchase entries and godown issues','Purchases, and transfers between godown and mill (both ways)')

rep('.grid2{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;margin-top:16px}','.grid2{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;margin-top:16px}.grid2>*{min-width:0}.seg{flex-wrap:wrap;max-width:100%}button.ni.on,button.ni.on:hover{background:var(--brbg);color:var(--brt);filter:none}')
# least-cost formula maker with cost cap and Claude review
rep("function regv(){",open('patches/lc.js').read()+"\nfunction regv(){")
rep('<button data-a="rv" data-v="med" class="${RV==\'med\'?\'on\':\'\'}">Medicines</button></div></div>${RV==\'nutri\'?nutriv():RV==\'med\'?medv():regvF()}','<button data-a="rv" data-v="med" class="${RV==\'med\'?\'on\':\'\'}">Medicines</button><button data-a="rv" data-v="lc" class="${RV==\'lc\'?\'on\':\'\'}">Lowest cost</button></div></div>${RV==\'nutri\'?nutriv():RV==\'med\'?medv():RV==\'lc\'?lcv():regvF()}')
rep(" rv(d){RV=d.v;render()},"," rv(d){RV=d.v;render()},\n lcuse(){const c0=cur(RG),t0=Object.values(c0).reduce((s,v)=>s+num(v),0),R=lcSolve(RG,LCB||Math.round(t0)||1000);if(!R.f)return;RDR[RG]=clone(R.f);RV='formula';say('Loaded as a draft for '+RG+'. Check it, then press Save formula.')},\n lcai(){lcAsk()},\n lckey(){lsS('fm-ai-key',($('#lckey').value||'').trim());lsS('fm-ai-model',($('#lcmod').value||'').trim());say('Claude key saved on this device.')},")
rep("document.addEventListener('change',e=>{const t=e.target,d=t.dataset;","document.addEventListener('change',e=>{const t=e.target,d=t.dataset;\n  if(d.lck!==undefined){if(d.lck=='mode'){(S.cfg.lc=S.cfg.lc||{}).mode=t.value;put('cfg','lc',S.cfg.lc)}else if(d.lck=='b'){LCB=num(t.value)>=100?num(t.value):0;render()}else{lcSet(d.lci||'',d.lck,t.type=='checkbox'?t.checked:t.value);render()}return}")

# AI feed mill monitor
rep("function regv(){",open('patches/mon.js').read()+"\nfunction regv(){")
rep("const NAV=[['dash','Dashboard'],","const NAV=[['dash','Dashboard'],['mon','Monitor'],")
rep("const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],","const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],mon:['Monitor','Automatic checks and Claude\\'s daily review'],")
rep("const IC={dash:","const IC={mon:'<path d=\"M3 12h4l3-8 4 16 3-8h4\"/>',dash:")
rep("const v={dash,prod,","const v={dash:()=>monBanner()+dash(),mon:monv,prod,")
rep(" rv(d){RV=d.v;render()},"," rv(d){RV=d.v;render()},\n monai(){monAsk()},")

# stock page: show transfers and make current mill/godown stock clear
rep("r[k]={m:num(i.m),g:num(i.g),p:0,c:0}","r[k]={m:num(i.m),g:num(i.g),p:0,c:0,tr:0}")
rep("if(e.type=='I'){x.g-=num(e.qty);x.m+=num(e.qty)}else if(e.type=='R'){x.m-=num(e.qty);x.g+=num(e.qty)}","if(e.type=='I'){x.g-=num(e.qty);x.m+=num(e.qty);x.tr+=num(e.qty)}else if(e.type=='R'){x.m-=num(e.qty);x.g+=num(e.qty);x.tr-=num(e.qty)}")
rep("<th>Purchased</th><th>Consumed</th><th>Mill</th><th>Godown</th>","<th>Purchased</th><th>Transfers<br><small>to mill +, to godown −</small></th><th>Consumed</th><th>Now in mill</th><th>Now in godown</th>")
rep("<td>${f2(x.p)}</td><td>${f2(x.c)}</td><td>${f2(x.m)}</td><td>${f2(x.g)}</td>","<td>${f2(x.p)}</td><td>${x.tr?(x.tr>0?'+':'−')+f2(Math.abs(x.tr)):'–'}</td><td>${f2(x.c)}</td><td><b>${f2(x.m)}</b></td><td><b>${f2(x.g)}</b></td>")
rep("'<tr><td colspan=11>No items</td></tr>'","'<tr><td colspan=12>No items</td></tr>'")

# one look with the farm app: same cream/brown/gold palette, Playfair headings, Manrope text
rep("@media(min-width:861px){.fmmob{display:none!important}}</style>","@media(min-width:861px){.fmmob{display:none!important}}"
 ":root{--bg:#f4ede2;--sf:#fffdf8;--sf2:#f8f1e6;--ink:#24170d;--mu:#7a6a58;--bd:#eadfcd;--bd2:#dccbb2;--br:#6b4a31;--br2:#8a6646;--brbg:#f5ebdc;--brt:#6b4a31;--brn:#5a3d27;--gold:#c6955a;--sh2:0 14px 34px -18px rgba(60,38,20,.35)}"
 "@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#140d08;--sf:#22170f;--sf2:#2a1d13;--ink:#f3e9dc;--mu:#b9a791;--bd:#3a2b1f;--bd2:#4a3828;--br:#c6955a;--br2:#e3c393;--brbg:#3a2c20;--brt:#e3c393;--brn:#e3c393}}"
 ":root[data-theme=dark]{--bg:#140d08;--sf:#22170f;--sf2:#2a1d13;--ink:#f3e9dc;--mu:#b9a791;--bd:#3a2b1f;--bd2:#4a3828;--br:#c6955a;--br2:#e3c393;--brbg:#3a2c20;--brt:#e3c393;--brn:#e3c393}"
 "body{font-family:'Manrope','Noto Sans Tamil',system-ui,sans-serif}.ph h1,.panel h3,.card h3{font-family:'Playfair Display',Georgia,serif;font-weight:700;letter-spacing:0}"
 "@media(prefers-color-scheme:dark){:root:not([data-theme=light]) button.on,:root:not([data-theme=light]) button.pri{color:#1b120b}}:root[data-theme=dark] button.on,:root[data-theme=dark] button.pri{color:#1b120b}"
 "</style>")
rep("</head>","<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin><link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'></head>")
# sidebar: back link + import
rep("<div class=\"sidef\">NSR Poultry Farms · ${dFmt(td())}</div>","<div class=\"sidef\">${fmUserBox()}${fmImportBtn()}NSR Poultry Farms · ${dFmt(td())}</div>")
rep("document.addEventListener('change',e=>{const t=e.target,d=t.dataset;","document.addEventListener('change',e=>{const t=e.target,d=t.dataset;if(d.imp&&t.files[0]){if(confirm('Import this backup into the shared feed mill data?'))fmImport(t.files[0]);t.value='';return}")
rep('<title>NSR Feed Mill Stock</title>','<title>NSR Feed Mill</title><link rel="manifest" href="../manifest.json">')

# Sales: raw materials sold to outside customers; stock goes down from godown or mill
rep("function regv(){",open('patches/sale.js').read()+"\nfunction regv(){")
rep("const NAV=[['dash','Dashboard'],['mon','Monitor'],","const NAV=[['dash','Dashboard'],['mon','Monitor'],['sale','Sales'],")
rep("const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],","const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],sale:['Sales','Raw materials sold to outside customers – stock goes down'],")
rep("const IC={mon:","const IC={sale:'<path d=\"M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2\"/><circle cx=\"10\" cy=\"20\" r=\"1.4\"/><circle cx=\"17\" cy=\"20\" r=\"1.4\"/>',mon:")
rep("const v={dash:()=>monBanner()+dash(),mon:monv,prod,","const v={dash:()=>monBanner()+dash(),mon:monv,sale:salev,prod,")
# purchases: after posting, the rate can be corrected; quantity stays locked
rep("<td>${f2(e.qty)}</td><td>${f2(e.rate)}</td><td>${e.dest=='G'?'Godown':'Mill'}</td>","<td>${f2(e.qty)}</td><td>${e.type=='P'?`<input type=\"number\" step=\"any\" inputmode=\"decimal\" data-prate=\"${k}\" value=\"${num(e.rate)||''}\" style=\"width:84px\" title=\"Change the rate. Quantity cannot be changed.\">`:f2(e.rate)}</td><td>${e.dest=='G'?'Godown':'Mill'}</td>")
rep("<th>Qty</th><th>Rate</th><th>Store</th>","<th>Qty</th><th>Rate ₹<br><small>can be changed</small></th><th>Store</th>")
rep("r[k]={m:num(i.m),g:num(i.g),p:0,c:0,tr:0}","r[k]={m:num(i.m),g:num(i.g),p:0,c:0,tr:0,sl:0}")
rep("else if(e.type=='R'){x.m-=num(e.qty);x.g+=num(e.qty);x.tr-=num(e.qty)}","else if(e.type=='R'){x.m-=num(e.qty);x.g+=num(e.qty);x.tr-=num(e.qty)}else if(e.type=='S'){x[e.src=='M'?'m':'g']-=num(e.qty);x.sl+=num(e.qty)}")
rep("<th>Consumed</th><th>Now in mill</th>","<th>Consumed</th><th>Sold</th><th>Now in mill</th>")
rep("<td>${f2(x.c)}</td><td><b>${f2(x.m)}</b></td>","<td>${f2(x.c)}</td><td>${x.sl?f2(x.sl):'–'}</td><td><b>${f2(x.m)}</b></td>")
rep("'<tr><td colspan=12>No items</td></tr>'","'<tr><td colspan=13>No items</td></tr>'")
rep("function buy(){const L=Object.keys(S.led).filter(k=>String(S.led[k].date).startsWith(M))","function buy(){const L=Object.keys(S.led).filter(k=>S.led[k].type!=='S'&&String(S.led[k].date).startsWith(M))")

# PDF / Excel / CSV of the page's report tables, same format as the farm app
rep("function regv(){",open('patches/xport.js').read()+"\nfunction regv(){")
rep("<div class=\"acts\"><span class=\"pill\">${pill}</span>","<div class=\"acts\">${['stock','buy','sale','rep','reg','mon','prod','dash'].includes(tab)?`<span class=\"fmx\"><small>Download</small><button data-a=\"fmx\" data-k=\"pdf\">PDF</button><button data-a=\"fmx\" data-k=\"xls\">Excel</button><button data-a=\"fmx\" data-k=\"csv\">CSV</button></span>`:''}<span class=\"pill\">${pill}</span>")
rep("@media(min-width:861px){.fmmob{display:none!important}}","@media(min-width:861px){.fmmob{display:none!important}}.fmx{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.fmx small{color:var(--mu);font-weight:600}.fmx button{padding:6px 12px}@media print{.fmx{display:none!important}}")

# publish daily raw-material kg (no prices) for the HR feed mill contract
rep("if(k=='days'||k=='reg')initF();render()}","if(k=='days'||k=='reg')initF();if(window.rmSyncSoon&&(k=='led'||k=='items'||k=='rmin'))rmSyncSoon();render()}")
rep("sub('cfg','cfg')}","sub('cfg','cfg');sub('rmin','rmin')}")

# Feed silos (read-only): weights from Poultry Manager, feed produced vs silo refilled
rep("function regv(){",open('patches/silo.js').read()+"\nfunction regv(){")
rep("const NAV=[['dash','Dashboard'],['mon','Monitor'],['sale','Sales'],","const NAV=[['dash','Dashboard'],['mon','Monitor'],['silo','Silos'],['sale','Sales'],")
rep("const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],","const TT={dash:['Dashboard','Stock, consumption and alerts at a glance'],silo:['Silos','Live silo weights, refills and feed sent'],")
rep("const IC={sale:","const IC={silo:'<path d=\"M7 3h10v12l-3 4h-4l-3-4z\"/><path d=\"M7 7h10M7 11h10\"/><path d=\"M10 19v2.5M14 19v2.5\"/>',sale:")
rep("const v={dash:()=>monBanner()+dash(),mon:monv,sale:salev,","const v={dash:()=>monBanner()+dash(),mon:monv,silo:silov,sale:salev,")
rep(" rv(d){RV=d.v;render()},"," rv(d){RV=d.v;render()},\n silsel(d){SIL.sel=d.v||null;SIL.date='';render();scrollTo(0,0)},")
rep("document.addEventListener('change',e=>{const t=e.target,d=t.dataset;","document.addEventListener('change',e=>{const t=e.target,d=t.dataset;if(t.id=='sild'){SIL.date=t.value;render();return}")
os.makedirs('app/feedmill',exist_ok=True)
try:
  _UPD=UPD.replace('__SWPATH__','../sw.js');_V2=re.search(r"nsr-v\d+",open('static/sw.js').read()).group(0)
  _i=s.rfind('</script>');s=s[:_i]+_UPD.replace('__APPVER__',_V2)+'\n'+s[_i:]
except NameError: pass
open('app/feedmill/index.html','w').write(s)
print('feedmill ok',len(s))
