/* ===== Stock count: physical vs system stock, corrected periodically with adjustment entries (type 'A' in the ledger) ===== */
let SCN=false;const SCK='fm-count';
function scDraft(){try{return JSON.parse(localStorage.getItem(SCK)||'null')||{date:td(),note:'',v:{}}}catch(e){return{date:td(),note:'',v:{}}}}
function scSave(d){try{localStorage.setItem(SCK,JSON.stringify(d))}catch(e){}}
/* system stock at the end of a day: every ledger entry and production day up to that date */
function calcAt(date){const keep=S.led,kd=S.days,L={},Dd={};for(const k in keep)if(String(keep[k].date||'')<=date)L[k]=keep[k];for(const d in kd)if(d<=date)Dd[d]=kd[d];
  S.led=L;S.days=Dd;try{return calc()}finally{S.led=keep;S.days=kd}}
const scRs=v=>(v<0?'−':v>0?'+':'')+'₹'+f2(Math.abs(v));
const scNum=v=>v===''||v==null?null:num(v);
function scView(){const d=scDraft(),C=calcAt(d.date),ks=Object.keys(S.items).sort().filter(k=>(!ty||S.items[k].t==ty)&&key(S.items[k].n).includes(key(q)));
  let dq=0,dv=0,n=0;const rows=ks.map(k=>{const i=S.items[k],x=C[k]||{m:0,g:0},e=d.v[k]||{},pm=scNum(e.m),pg=scNum(e.g),df=(pm==null?0:pm-x.m)+(pg==null?0:pg-x.g),val=df*num(i.r);
    if(pm!=null||pg!=null){n++;dq+=df;dv+=val}
    return `<tr data-scr="${k}" class="${Math.abs(df)>1e-6?(df<0?'bad':''):''}"><td>${h(i.n)} <small>${i.t}</small></td><td>${f2(x.m)}</td><td><input type="number" step="any" inputmode="decimal" data-sc="${k}" data-w="m" value="${pm??''}" style="width:90px"></td><td>${f2(x.g)}</td><td><input type="number" step="any" inputmode="decimal" data-sc="${k}" data-w="g" value="${pg??''}" style="width:90px"></td><td data-scd>${pm==null&&pg==null?'–':(df>0?'+':'')+f2(df)}</td><td data-scv>${pm==null&&pg==null?'–':(val>0?'+':'')+f2(val)}</td></tr>`}).join('');
  return `<div class="panel" style="border-left:4px solid var(--wn)"><h2 style="margin-top:0">📋 Stock count – physical vs system</h2>
   <small>Count what is actually in the mill and the godown, enter it here (or fill the CSV and upload it), then post. The difference is added as an adjustment, so system stock matches the physical stock from that date. Leave a box empty for items you did not count.</small>
   <div class="row" style="margin-top:10px"><label>Count date<input type="date" id="scd" value="${h(d.date)}" max="${td()}"></label><label style="flex:1">Note / reason<input id="scn" value="${h(d.note)}" placeholder="e.g. Month-end count, moisture loss"></label></div>
   <div class="row"><button data-a="scsheet">⬇ Count sheet CSV</button><button data-a="scup">⬆ Upload counted CSV</button><input type="file" id="scFile" accept=".csv,text/csv" hidden><button data-a="scfill">Copy system → physical</button><button data-a="scclear">Clear</button><button data-a="scclose">Close</button></div>
   <div class="sc" style="margin-top:8px"><h3 style="margin:6px 0">Stock count · ${h(dFmt(d.date))}</h3><table><tr><th>Item</th><th>System mill</th><th>Physical mill</th><th>System godown</th><th>Physical godown</th><th>Difference qty</th><th>Difference ₹</th></tr>${rows||'<tr><td colspan=7>No items</td></tr>'}</table></div>
   <div class="row" style="margin-top:10px;align-items:center"><b id="scsum">${n} items counted · difference ${dq>0?'+':''}${f2(dq)} · ${scRs(dv)}</b><button class="pri" data-a="scpost"${n?'':' disabled'}>Post adjustments</button></div></div>`}
function scHist(){const L=Object.keys(S.led).filter(k=>S.led[k].type=='A').map(k=>({k,...S.led[k]})).sort((a,b)=>a.date<b.date?1:-1);if(!L.length)return'';
  const by={};L.forEach(e=>{(by[e.date]=by[e.date]||[]).push(e)});
  return `<h2>Stock adjustments (physical count)</h2>${Object.keys(by).slice(0,12).map(dt=>{const A=by[dt],sh=A.filter(e=>num(e.qty)<0).reduce((s,e)=>s+num(e.qty)*num(e.rate),0),ex=A.filter(e=>num(e.qty)>0).reduce((s,e)=>s+num(e.qty)*num(e.rate),0);
   return `<div class="sc" style="margin-bottom:10px"><h3 style="margin:6px 0">Count ${h(dFmt(dt))} · shortage ₹${f2(-sh)} · excess ₹${f2(ex)}${A[0].note?' · '+h(A[0].note):''}</h3><table><tr><th>Item</th><th>Store</th><th>System</th><th>Physical</th><th>Adjusted qty</th><th>Value ₹</th><th>By</th><th></th></tr>${A.map(e=>`<tr class="${num(e.qty)<0?'bad':''}"><td>${h(e.item)}</td><td>${e.dest=='G'?'Godown':'Mill'}</td><td>${f2(e.sys)}</td><td>${f2(e.phys)}</td><td>${num(e.qty)>0?'+':''}${f2(e.qty)}</td><td>${f2(num(e.qty)*num(e.rate))}</td><td>${h(e.by||'')}</td><td><button class="dg" data-a="scdel" data-k="${e.k}" title="Undo this adjustment">✕</button></td></tr>`).join('')}</table></div>`}).join('')}`}
function scCsvParse(t){const rows=[];let r=[],c='',qd=false;t=t.replace(/^﻿/,'');for(let i=0;i<t.length;i++){const ch=t[i];if(qd){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else qd=false}else c+=ch}else if(ch=='"')qd=true;else if(ch==','||ch==';'||ch=='\t'){r.push(c);c=''}else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);rows.push(r);r=[];c=''}else c+=ch}if(c||r.length){r.push(c);rows.push(r)}return rows.filter(x=>x.some(v=>String(v).trim()))}
let scDel={};
Object.assign(A,{
 scup(){const f=document.getElementById('scFile');if(f)f.click()},
 scopen(){SCN=true;render();scrollTo(0,0)},scclose(){SCN=false;render()},
 scclear(){const d=scDraft();d.v={};scSave(d);render()},
 scfill(){const d=scDraft(),C=calcAt(d.date);for(const k in S.items){const x=C[k]||{m:0,g:0};d.v[k]={m:+x.m.toFixed(3),g:+x.g.toFixed(3)}}scSave(d);render();say('System stock copied – now change only the items that differ')},
 scsheet(){const d=scDraft(),C=calcAt(d.date),r=[['Item','Type','Rate','System mill','Physical mill','System godown','Physical godown']];Object.keys(S.items).sort().forEach(k=>{const i=S.items[k],x=C[k]||{m:0,g:0},e=d.v[k]||{};r.push([i.n,i.t,i.r,+x.m.toFixed(3),e.m??'',+x.g.toFixed(3),e.g??''])});csv(r,'stock-count-'+d.date+'.csv')},
 async scpost(b){const btn=document.querySelector('[data-a="scpost"]');if(!btn.dataset.sure){btn.dataset.sure=1;btn.textContent='Tap again to post';setTimeout(()=>{if(btn.isConnected){delete btn.dataset.sure;btn.textContent='Post adjustments'}},4000);return}
  const d=scDraft(),C=calcAt(d.date),by=(window.__fmUser||{}).name||'',ts=Date.now();let n=0;
  for(const k in d.v){const i=S.items[k];if(!i)continue;const x=C[k]||{m:0,g:0};for(const w of ['m','g']){const p=scNum(d.v[k][w]);if(p==null)continue;const sys=w=='m'?x.m:x.g,df=+(p-sys).toFixed(3);if(Math.abs(df)<1e-6)continue;
    await put('led','adj_'+d.date+'_'+k+'_'+w+'_'+ts,{type:'A',date:d.date,item:i.n,qty:df,dest:w=='g'?'G':'M',rate:num(i.r),sys:+sys.toFixed(3),phys:p,note:d.note,by,ts});n++}}
  scSave({date:td(),note:'',v:{}});SCN=false;say(n?`${n} adjustment${n>1?'s':''} posted – system stock now matches the count`:'Nothing to adjust – physical and system stock already match');render()},
 scdel(dd){const b=document.querySelector(`[data-a="scdel"][data-k="${dd.k}"]`);if(!scDel[dd.k]){scDel[dd.k]=1;if(b)b.textContent='Undo?';setTimeout(()=>{delete scDel[dd.k];if(b&&b.isConnected)b.textContent='✕'},3000);return}del('led',dd.k)}
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.sc){const d=scDraft(),k=t.dataset.sc;d.v[k]=d.v[k]||{};d.v[k][t.dataset.w]=t.value===''?'':num(t.value);scSave(d);
  const C=calcAt(d.date),x=C[k]||{m:0,g:0},i=S.items[k],pm=scNum(d.v[k].m),pg=scNum(d.v[k].g),df=(pm==null?0:pm-x.m)+(pg==null?0:pg-x.g),tr=t.closest('tr'),none=pm==null&&pg==null;
  tr.querySelector('[data-scd]').textContent=none?'–':(df>0?'+':'')+f2(df);tr.querySelector('[data-scv]').textContent=none?'–':(df*num(i.r)>0?'+':'')+f2(df*num(i.r));tr.className=Math.abs(df)>1e-6&&df<0?'bad':'';
  let n=0,dq=0,dv=0;for(const kk in d.v){const ii=S.items[kk];if(!ii)continue;const xx=C[kk]||{m:0,g:0},a=scNum(d.v[kk].m),g=scNum(d.v[kk].g);if(a==null&&g==null)continue;n++;const f=(a==null?0:a-xx.m)+(g==null?0:g-xx.g);dq+=f;dv+=f*num(ii.r)}
  const s=document.getElementById('scsum');if(s)s.textContent=`${n} items counted · difference ${dq>0?'+':''}${f2(dq)} · ${scRs(dv)}`;const pb=document.querySelector('[data-a="scpost"]');if(pb)pb.disabled=!n}
 if(t.id==='scn'){const d=scDraft();d.note=t.value;scSave(d)}});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='scd'){const d=scDraft();d.date=t.value||td();scSave(d);render()}
 if(t.id==='scFile'&&t.files[0]){const f=t.files[0];t.value='';f.text().then(tx=>{const R=scCsvParse(tx);if(R.length<2){say('Empty CSV');return}const H=R[0].map(x=>String(x).toLowerCase().trim());
   const ci=H.findIndex(x=>/item|material|name/.test(x)),pm=H.findIndex(x=>/phys/.test(x)&&/mill/.test(x)),pg=H.findIndex(x=>/phys/.test(x)&&/godown|store/.test(x)),p1=H.findIndex(x=>/phys|count|actual/.test(x));
   if(ci<0||(pm<0&&pg<0&&p1<0)){say('CSV needs an Item column and a Physical column – download the count sheet to see the format');return}
   const d=scDraft();let n=0,miss=[];R.slice(1).forEach(r=>{const nm=String(r[ci]||'').trim();if(!nm)return;const k=id(nm);if(!S.items[k]){miss.push(nm);return}const v=d.v[k]=d.v[k]||{};
     const g=c=>c>=0&&String(r[c]??'').trim()!==''?num(r[c]):null;const a=g(pm>=0?pm:(pg<0?p1:-1)),b=g(pg);if(a!=null)v.m=a;if(b!=null)v.g=b;if(a!=null||b!=null)n++});
   scSave(d);SCN=true;render();say(`${n} items filled from the CSV`+(miss.length?` · not found: ${miss.slice(0,5).join(', ')}${miss.length>5?'…':''}`:''))})}});
