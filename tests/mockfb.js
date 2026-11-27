(function(){const store={};const L=[];
const dm=(a,b)=>{const o={...a};for(const k in b){const x=a[k],y=b[k];o[k]=(y&&typeof y==='object'&&!Array.isArray(y)&&x&&typeof x==='object'&&!Array.isArray(x))?dm(x,y):y}return o};
const snap=p=>({id:p.split('/').pop(),exists:p in store,data:()=>store[p],metadata:{fromCache:false}});
try{const sv=localStorage.getItem('__mockStore');if(sv){const o=JSON.parse(sv);for(const k in store)delete store[k];Object.assign(store,o)}}catch(e){}
const notify=()=>{try{localStorage.setItem('__mockStore',JSON.stringify(store))}catch(e){}setTimeout(()=>L.forEach(f=>f()),0)};
function doc(p){return{id:p.split('/').pop(),update(d){if(!store[p]){const e=new Error('no doc');e.code='not-found';return Promise.reject(e)}store[p]=Object.assign({},store[p],JSON.parse(JSON.stringify(d)));notify();window.__writes=(window.__writes||0)+1;return Promise.resolve()},set(d,o){store[p]=o&&o.merge?dm(store[p]||{},d):JSON.parse(JSON.stringify(d));notify();window.__writes=(window.__writes||0)+1;return Promise.resolve()},
  delete(){delete store[p];notify();return Promise.resolve()},get(){return Promise.resolve(snap(p))},
  onSnapshot(n,e2,e3){if(typeof n!=='function')n=e2;const f=()=>n(snap(p));L.push(f);setTimeout(f,0);return()=>{}}}}
function col(p,flt){const run=()=>{const docs=Object.keys(store).filter(k=>k.startsWith(p+'/')&&k.split('/').length===p.split('/').length+1).map(snap).filter(s=>!flt||flt(s.data()));return{docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false}}};
  return{doc:id=>doc(p+'/'+id),where:(f,op,v)=>col(p,d=>op==='>='?d[f]>=v:op==='>'?d[f]>v:d[f]==v),get:()=>Promise.resolve(run()),onSnapshot(n,e2,e3){if(typeof n!=='function')n=e2;const f=()=>n(run());L.push(f);setTimeout(f,0);return()=>{}}}}
window.__store=store;
const AU=window.__authUsers=window.__authUsers||JSON.parse(localStorage.getItem('__mockAuth')||'{}');const saveAU=()=>localStorage.setItem('__mockAuth',JSON.stringify(AU));
function mkAuth(main){const A={currentUser:null,_p:'LOCAL',
  onAuthStateChanged(cb){setTimeout(()=>cb(A.currentUser),0);return()=>{}},
  async setPersistence(p){A._p=p},
  async signInAnonymously(){A.currentUser={uid:'anon'+Math.random().toString(36).slice(2,6),isAnonymous:true};return{user:A.currentUser}},
  async createUserWithEmailAndPassword(e,p){if(AU[e])throw{code:'auth/email-already-in-use'};const uid='u'+Math.random().toString(36).slice(2,8);AU[e]={pw:p,uid};saveAU();A.currentUser=mkU(e);return{user:A.currentUser}},
  async signInWithEmailAndPassword(e,p){window.__signIns=(window.__signIns||0)+1;if(!AU[e]||AU[e].pw!==p)throw{code:'auth/invalid-credential'};A.currentUser=mkU(e);if(main&&A._p!=='NONE')sessionStorage.setItem('__mockCur',e);return{user:A.currentUser}},
  async signOut(){A.currentUser=null;if(main)sessionStorage.removeItem('__mockCur')}};
  const mkU=e=>({uid:AU[e].uid,email:e,isAnonymous:false,async updatePassword(p){AU[e].pw=p;saveAU()},async delete(){delete AU[e];saveAU()}});
  if(main){const c=sessionStorage.getItem('__mockCur');if(c&&AU[c])A.currentUser=mkU(c)}return A}
const MAINAUTH=mkAuth(true),apps={};
const authFn=function(){return MAINAUTH};authFn.Auth={Persistence:{LOCAL:'LOCAL',SESSION:'SESSION',NONE:'NONE'}};
window.__stoFiles={};
window.firebase={apps:[],initializeApp(c,name){if(name){return apps[name]=apps[name]||{auth:(()=>{const a=mkAuth(false);return()=>a})()}}firebase.apps.push({name:'[DEFAULT]'})},auth:authFn,...(localStorage.getItem('__mockSto')?{storage(){return{ref(p){return{putString(d){window.__stoFiles[p]=d.length;return Promise.resolve()},put(f){window.__stoFiles[p]=f.size||0;return Promise.resolve()},getDownloadURL(){return Promise.resolve('https://storage.mock/'+p)}}}}}}:{}),
  firestore(){return{runTransaction:async fn=>{const ops=[];const r=await fn({get:ref=>ref.get(),set:(ref,d)=>ops.push([ref,d])});for(const [ref,d] of ops)await ref.set(d);return r},terminate:async()=>{},clearPersistence:async()=>{},disableNetwork:async()=>{},enableNetwork:async()=>{},waitForPendingWrites:()=>new Promise(r=>setTimeout(r,window.__pw||0)),enablePersistence:async()=>{},settings(){},collection:col,doc,batch(){const ops=[];return{set(r,d){ops.push(()=>r.set(d))},commit(){ops.forEach(f=>f());return Promise.resolve()}}}}}};})();
