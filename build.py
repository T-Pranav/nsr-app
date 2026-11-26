import re,os,shutil,json
src=open('src/index.html').read()
s=src
# ---- head: PWA tags + config ----
s=s.replace('<link rel="preconnect" href="https://fonts.googleapis.com">','''<meta name="theme-color" content="#6a4d35">
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="NSR Farms">
<meta name="mobile-web-app-capable" content="yes">
<script src="firebase-config.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">''',1)
# ---- firebase helpers (inserted before data store functions) ----
fb='''
/* ---------- Firebase (standalone app) ---------- */
let FB=false;
const fbReady=()=>window.FIREBASE_CONFIG&&FIREBASE_CONFIG.apiKey&&!/PASTE/i.test(FIREBASE_CONFIG.apiKey);
function loadScript(u){return new Promise((res,rej)=>{const x=document.createElement('script');x.src=u;x.onload=res;x.onerror=rej;document.head.appendChild(x)})}
async function initFirebase(){const V='10.14.1',B='https://www.gstatic.com/firebasejs/'+V+'/';
  await loadScript(B+'firebase-app-compat.js');await loadScript(B+'firebase-auth-compat.js');await loadScript(B+'firebase-firestore-compat.js');try{await loadScript(B+'firebase-storage-compat.js')}catch(e){}
  firebase.initializeApp(FIREBASE_CONFIG);
  /* keep a staff member's own login if they are signed in; otherwise a guest login just for the login screen */
  const cu=await new Promise(r=>{const u=firebase.auth().onAuthStateChanged(x=>{u();r(x)})});
  if(!cu){try{await firebase.auth().signInAnonymously()}catch(e){if(!firebase.auth().currentUser)throw e}}
  const f=firebase.firestore();try{f.settings({experimentalForceLongPolling:true,ignoreUndefinedProperties:true,merge:true})}catch(e){}
  try{await f.enablePersistence({synchronizeTabs:true})}catch(e){}
  addEventListener('online',()=>{try{f.enableNetwork()}catch(e){}});
  setTimeout(()=>{try{syncWatch();syncRefresh()}catch(e){}},4000);
  /* phones put the app to sleep; when it comes back, open a fresh connection */
  let hid=0;document.addEventListener('visibilitychange',()=>{if(document.hidden){hid=Date.now();return}if(hid&&Date.now()-hid>60000){f.disableNetwork().then(()=>f.enableNetwork()).catch(()=>{})}});
  return f}
/* show a pill until every photo and entry saved on this phone has reached the server */
/* one sync light in the header: Live · Sending · Offline (saved on this phone) */
let _sw=null,_swState='';function syncSet(st,txt){let e=document.getElementById('syncDot');if(!e){const w=document.getElementById('who');if(!w)return;e=document.createElement('span');e.id='syncDot';e.setAttribute('role','status');w.parentNode.insertBefore(e,w)}
  if(_swState===st&&e.dataset.t===txt)return;_swState=st;e.className='sync-'+st;e.dataset.t=txt;e.innerHTML='<i></i><span>'+txt+'</span>';e.title=txt}
function syncRefresh(){if(!FB||!db)return;if(!navigator.onLine)return syncSet('off',t('syncOff'));if(_sw)return syncSet('up',t('syncUpS'));syncSet('ok',t('syncLive'))}
function syncWatch(){if(!FB||!db||!db.waitForPendingWrites||_sw)return;let shown=false;const tm=setTimeout(()=>{shown=true;syncSet(navigator.onLine?'up':'off',navigator.onLine?t('syncUpS'):t('syncOff'));if(role&&role()==='sup')toast('⏫ '+t('syncUp'))},1200);
  _sw=db.waitForPendingWrites().then(()=>{clearTimeout(tm);_sw=null;syncRefresh();if(shown)toast(t('syncDone'))}).catch(()=>{clearTimeout(tm);_sw=null;syncRefresh()})}
addEventListener('online',()=>setTimeout(syncRefresh,300));addEventListener('offline',()=>syncRefresh());setInterval(()=>{try{syncRefresh()}catch(e){}},15000);
function soon(p){setTimeout(syncWatch,0);p.catch(e=>{console.error(e);toast(e&&e.code==='permission-denied'?'Permission denied – check Firestore rules':t('saveFail'))});return Promise.race([p,new Promise(r=>setTimeout(r,2500))])}
'''
s=s.replace("/* ---------- data store (shared cloud db, or this-device fallback) ---------- */","/* ---------- data store (shared cloud db, or this-device fallback) ---------- */"+fb,1)
s=s.replace("if(db){await db.collection(coll).doc(id).set(obj);return}","if(db){FB?await soon(db.collection(coll).doc(id).set(obj)):await db.collection(coll).doc(id).set(obj);return}",1)
s=s.replace("if(db){await db.collection(coll).doc(id).delete();return}","if(db){FB?await soon(db.collection(coll).doc(id).delete()):await db.collection(coll).doc(id).delete();return}",1)
s=s.replace("if(db){await db.doc('settings/'+id).set(obj);return}","if(db){FB?await soon(db.doc('settings/'+id).set(obj)):await db.doc('settings/'+id).set(obj);return}",1)
s=s.replace("  if(db){const ref=db.collection('day').doc(date);","  if(db&&FB){await soon(db.collection('day').doc(date).set({[shed]:obj},{merge:true}));return}\n  if(db){const ref=db.collection('day').doc(date);",1)
s=s.replace("async function saveShedPhotos(date,shed,add){const id=date+'_'+shed;for(const k in add)add[k]=await toStore('photos/'+id+'/'+k+'.jpg',add[k]);","async function saveShedPhotos(date,shed,add){const id=date+'_'+shed;for(const k in add)add[k]=await toStore('photos/'+id+'/'+k+'.jpg',add[k]);\n  if(db&&FB){await soon(db.doc('photos/'+id).set({...add,ts:Date.now()},{merge:true}));return}",1)
s=s.replace("if(db){await db.doc('photos/'+id).set(obj);return}","if(db){FB?await soon(db.doc('photos/'+id).set(obj)):await db.doc('photos/'+id).set(obj);return}",1)
# first-time admin allowed in firebase mode too
s=s.replace("S.isOwner||(S.mode==='local'&&!S.staff.some(x=>x.role==='admin'))","S.isOwner||((S.mode==='local'||FB)&&!S.staff.some(x=>x.role==='admin'))")
assert s.count("(S.mode==='local'||FB)")>=1
# boot: firebase first
s=s.replace("""  let d=null,u=null;
  if(window.claude&&window.claude.use){""","""  let d=null,u=null;
  if(fbReady()){
    try{d=await initFirebase();FB=true}catch(e){console.error(e);
      $('#login').classList.add('show');$('#login').innerHTML=`<div class="lg-box">${logoMark()}<div class="lg-sub" style="margin-top:30px">📶 ${t('needNet')}</div><button class="wide" onclick="location.reload()">↻ ${t('retry')}</button></div>`;return}}
  else if(window.claude&&window.claude.use){""",1)
s=s.replace("  db=d;userCap=u;S.mode='cloud';compute();\n  try{S.isOwner=u?u.isOwner():false;","  db=d;userCap=u;S.mode='cloud';compute();\n  if(FB){S.canSettings=true;S.isOwner=false}else try{S.isOwner=u?u.isOwner():false;",1)
s=s.replace("catT:'Table',","catT:'Table',needNet:'Internet is needed the first time the app opens. Please connect and try again.',retry:'Try again',",1)
s=s.replace("catT:'டேபிள்',","catT:'டேபிள்',needNet:'முதல் முறை திறக்க இணையம் தேவை. இணைத்து மீண்டும் முயற்சிக்கவும்.',retry:'மீண்டும் முயற்சி',",1)
# cloud note for FB
s=s.replace("${S.mode==='cloud'?t('cloudNote2'):t('localNote')}","${FB?t('fbNote'):S.mode==='cloud'?t('cloudNote2'):t('localNote')}")
s=s.replace("catT:'Table',","catT:'Table',fbNote:'Data is saved online in your Firebase database and shared live with every phone that has the app.',",1)
s=s.replace("catT:'டேபிள்',","catT:'டேபிள்',fbNote:'தரவு உங்கள் Firebase-ல் சேமிக்கப்பட்டு, ஆப் உள்ள அனைத்து போன்களிலும் நேரலையில் தெரியும்.',",1)
# service worker registration
s=s.replace("boot();\n</script>","boot();\nif('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});\n</script>")
# automatic updates: compare this page's version with the live sw.js when the app comes back to the screen
UPD=r"""
const APP_VER='__APPVER__';
(function(){let busy=false,shown=false;
  const typing=()=>{const a=document.activeElement;return !!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))||!!(document.getElementById('view')&&document.getElementById('view')._dirty)};
  const go=()=>{try{navigator.serviceWorker&&navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{})}catch(e){}location.reload()};
  async function check(){if(busy||document.hidden)return;busy=true;try{const r=await fetch('__SWPATH__?v='+Date.now(),{cache:'no-store'});const tx=await r.text();const m=tx.match(/nsr-v\d+/);
    if(m&&m[0]!==APP_VER){if(!typing()){go();return}if(!shown){shown=true;const b=document.createElement('div');b.id='updBar';b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top));z-index:10000;background:#3b2717;color:#f7efe3;border:1px solid rgba(227,195,147,.5);border-radius:16px;padding:10px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.4);font:600 14px system-ui,sans-serif';
      b.innerHTML='✨ New version ready <button style="background:#e3c393;color:#3b2717;border:0;border-radius:10px;padding:7px 12px;font:700 14px system-ui,sans-serif">Update</button>';b.querySelector('button').onclick=go;document.body.appendChild(b)}}}catch(e){}busy=false}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});addEventListener('focus',check);addEventListener('pageshow',check);setInterval(check,15*60e3);setTimeout(check,20e3)})();
"""
_i=s.rfind('</script>');s=s[:_i]+UPD.replace('__SWPATH__','sw.js')+'\n'+s[_i:]
assert "APP_VER" in s

out='app'
shutil.rmtree(out,ignore_errors=True)
shutil.copytree('static',out)  # config, manifest, sw.js, icons
_V=re.search(r"nsr-v\d+",open('static/sw.js').read()).group(0)
open(out+'/index.html','w').write(s.replace('__APPVER__',_V))
open('/tmp/b.js','w').write(re.search(r'<script>(.*)</script>',s,re.S).group(1))
exec(open('build_feedmill.py').read())
# Vehicles branch (loans, value, service and parts register)
os.makedirs(out+'/vehicles',exist_ok=True)
shutil.copy('vehicles-src/index.html',out+'/vehicles/index.html')
shutil.copy('vehicles-src/sfparse.js',out+'/vehicles/sfparse.js')
shutil.copytree('vehicles-src/vendor',out+'/vehicles/vendor',dirs_exist_ok=True)
