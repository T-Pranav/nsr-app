/* ===== Sales: raw materials sold to outside customers (bill only; stock goes down) ===== */
let SL={date:'',cust:'',src:'G',bill:'',rows:[{i:'',q:'',r:''}],cn:'',cp:'',cph:''};
const slCust=()=>((S.cfg.cust||{}).list||[]);
const slBills=()=>{const B={};for(const k in S.led){const e=S.led[k];if(e.type!=='S')continue;const b=B[e.bill||k]=B[e.bill||k]||{bill:e.bill||'',date:e.date,party:e.party,src:e.src,lines:[]};b.lines.push(Object.assign({k},e))}return B};
function slNext(){let n=0;Object.values(S.led).forEach(e=>{if(e.type=='S'){const m=/(\d+)$/.exec(e.bill||'');if(m)n=Math.max(n,+m[1])}});return 'FS-'+String(n+1).padStart(4,'0')}
function salev(){if(!SL.date)SL.date=td();if(!SL.bill)SL.bill=slNext();const cs=slCust().filter(c=>c.on!==false),C=calc();
 const B=Object.values(slBills()).filter(b=>String(b.date).startsWith(M)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.bill<b.bill?1:-1));
 const amt=b=>b.lines.reduce((s,e)=>s+num(e.qty)*num(e.rate),0),tot=B.reduce((s,b)=>s+amt(b),0),tq=B.reduce((s,b)=>s+b.lines.reduce((a,e)=>a+num(e.qty),0),0);
 const byC={},byI={};B.forEach(b=>b.lines.forEach(e=>{const c=byC[e.party]=byC[e.party]||[0,0,0],i=byI[e.item]=byI[e.item]||[0,0];c[0]++;c[1]+=num(e.qty);c[2]+=num(e.qty)*num(e.rate);i[0]+=num(e.qty);i[1]+=num(e.qty)*num(e.rate)}));
 const have=n=>{const x=C[id(n)];return x?(SL.src=='G'?x.g:x.m):null};
 const rows=SL.rows.map((r,i)=>{const hv=r.i?have(r.i):null,a=num(r.q)*num(r.r);return `<tr><td><input data-sl="i" data-si="${i}" list="dl" value="${h(r.i)}" style="min-width:150px" placeholder="Item"></td>
   <td><input data-sl="q" data-si="${i}" type="number" step="any" inputmode="decimal" value="${h(r.q)}" style="width:90px"><div><small data-slh="${i}" class="${hv!=null&&num(r.q)>hv+1e-9?'bad':''}">${hv==null?'':'in '+(SL.src=='G'?'godown':'mill')+': '+f2(hv)}</small></div></td>
   <td><input data-sl="r" data-si="${i}" type="number" step="any" inputmode="decimal" value="${h(r.r)}" style="width:80px"></td><td><b data-sla="${i}">${a?f2(a):'–'}</b></td><td>${SL.rows.length>1?`<button class="dg" data-a="sldel" data-i="${i}">✕</button>`:''}</td></tr>`}).join('');
 return `<h2>New sales bill</h2>
 ${cs.length?'':'<div class="bn">Add a customer below first.</div>'}
 <div class="row"><label>Date<input id="sld" type="date" value="${h(SL.date)}"></label><label>Bill no.<input id="slb" value="${h(SL.bill)}" style="width:100px"></label>
  <label>Customer<select id="slc"><option value="">Choose…</option>${cs.map(c=>`<option value="${h(c.n)}" ${SL.cust==c.n?'selected':''}>${h(c.n)}${c.place?' · '+h(c.place):''}</option>`).join('')}</select></label>
  <label>Take from<select id="sls"><option value="G" ${SL.src=='G'?'selected':''}>Godown</option><option value="M" ${SL.src=='M'?'selected':''}>Mill</option></select></label></div>
 <div class="sc" data-noexp="1"><table><tr><th>Item</th><th>Qty (kg)</th><th>Rate ₹/kg</th><th>Amount ₹</th><th></th></tr>${rows}
 <tr><td colspan=3><button data-a="sladd">+ Add item</button></td><td><b id="sltot">${f2(SL.rows.reduce((s,r)=>s+num(r.q)*num(r.r),0))}</b></td><td></td></tr></table></div>
 <div class="row"><button class="pri" data-a="slsave">Save bill</button><button data-a="slclr">Clear</button></div>
 <div class="row" style="margin-top:14px"><label>Month<input type="month" data-m=1 value="${M}"></label><button data-a="slcsv">Export CSV</button></div>
 <h2>Sales this month · ${B.length} bill${B.length==1?'':'s'} · ${f2(tq)} kg · ₹${f2(tot)}</h2>
 <div class="sc"><table><tr><th>Date</th><th>Bill</th><th>Customer</th><th>Item</th><th>Qty kg</th><th>Rate ₹</th><th>Amount ₹</th><th>From</th><th></th></tr>
 ${B.map(b=>b.lines.map((e,j)=>`<tr>${j?'<td></td><td></td><td></td>':`<td>${h(b.date)}</td><td><b>${h(b.bill)}</b></td><td>${h(b.party)}</td>`}<td>${h(e.item)}</td><td>${f2(e.qty)}</td><td>${f2(e.rate)}</td><td>${f2(num(e.qty)*num(e.rate))}</td><td>${e.src=='M'?'Mill':'Godown'}</td><td><button class="dg" data-a="sldl" data-k="${e.k}" title="Delete this line">✕</button></td></tr>`).join('')+(b.lines.length>1?`<tr><td></td><td></td><td colspan=4><small>Bill total</small></td><td><b>${f2(amt(b))}</b></td><td></td><td><button class="dg" data-a="sldb" data-b="${h(b.bill)}">Delete bill</button></td></tr>`:'')).join('')||'<tr><td colspan=9>No sales this month</td></tr>'}</table></div>
 <div class="grid2"><div><h2>By customer</h2><div class="sc"><table><tr><th>Customer</th><th>Qty kg</th><th>Amount ₹</th></tr>${Object.keys(byC).sort().map(n=>`<tr><td>${h(n)}</td><td>${f2(byC[n][1])}</td><td>${f2(byC[n][2])}</td></tr>`).join('')||'<tr><td colspan=3>–</td></tr>'}</table></div></div>
 <div><h2>By material</h2><div class="sc"><table><tr><th>Item</th><th>Qty kg</th><th>Amount ₹</th></tr>${Object.keys(byI).sort().map(n=>`<tr><td>${h(n)}</td><td>${f2(byI[n][0])}</td><td>${f2(byI[n][1])}</td></tr>`).join('')||'<tr><td colspan=3>–</td></tr>'}</table></div></div></div>
 <div data-noexp="1"><h2>Customers</h2><div class="row"><label>Name<input id="scn" value="${h(SL.cn)}"></label><label>Place<input id="scp" value="${h(SL.cp)}" style="width:120px"></label><label>Phone<input id="scph" type="tel" value="${h(SL.cph)}" style="width:130px"></label><button class="pri" data-a="scadd">Add customer</button></div>
 <div class="sc"><table><tr><th>Name</th><th>Place</th><th>Phone</th><th>Active</th></tr>${slCust().map((c,i)=>`<tr><td>${h(c.n)}</td><td>${h(c.place||'')}</td><td>${h(c.ph||'')}</td><td><input type="checkbox" data-a="sctog" data-i="${i}" ${c.on!==false?'checked':''}></td></tr>`).join('')||'<tr><td colspan=4>No customers yet</td></tr>'}</table></div></div>`}
function slRead(){const g=x=>{const e=$('#'+x);return e?e.value:''};SL.date=g('sld')||SL.date;SL.bill=g('slb');SL.cust=g('slc');SL.src=g('sls')||SL.src;SL.cn=g('scn');SL.cp=g('scp');SL.cph=g('scph')}
const SLA={
 sladd(){slRead();SL.rows.push({i:'',q:'',r:''});render()},
 sldel(d){slRead();SL.rows.splice(+d.i,1);render()},
 slclr(){SL={date:td(),cust:'',src:SL.src,bill:'',rows:[{i:'',q:'',r:''}],cn:'',cp:'',cph:''};render()},
 async slsave(){slRead();if(!SL.cust)return say('Choose the customer.');const bill=(SL.bill||'').trim();if(!bill)return say('Enter the bill number.');
  if(Object.values(S.led).some(e=>e.type=='S'&&e.bill==bill))return say('Bill '+bill+' already exists. Use another number.');
  const L=SL.rows.filter(r=>r.i||num(r.q));if(!L.length)return say('Add at least one item.');const C=calc(),use={};
  for(const r of L){const it=S.items[id(r.i)];if(!it)return say('"'+r.i+'" is not in the item list. Pick from the list.');if(!(num(r.q)>0))return say('Enter the quantity for '+it.n+'.');if(!(num(r.r)>0))return say('Enter the rate for '+it.n+'.');
   use[id(it.n)]=(use[id(it.n)]||0)+num(r.q);const x=C[id(it.n)],hv=x?(SL.src=='G'?x.g:x.m):0;if(use[id(it.n)]>hv+1e-9)return say('Only '+f2(hv)+' kg of '+it.n+' in the '+(SL.src=='G'?'godown':'mill')+'. Reduce the quantity.')}
  const t0=Date.now();for(let i=0;i<L.length;i++){const r=L[i],it=S.items[id(r.i)];await put('led',(t0+i).toString(36),{date:SL.date,type:'S',item:it.n,qty:num(r.q),rate:num(r.r),party:SL.cust,src:SL.src,bill,by:(window.__fmUser||{}).name||''})}
  const tot=L.reduce((s,r)=>s+num(r.q)*num(r.r),0);SL={date:SL.date,cust:'',src:SL.src,bill:'',rows:[{i:'',q:'',r:''}],cn:'',cp:'',cph:''};say('Bill '+bill+' saved · ₹'+f2(tot)+'. Stock reduced.')},
 async sldl(d){if(confirm('Delete this sale line? The stock comes back.'))await del('led',d.k)},
 async sldb(d){if(!confirm('Delete the whole bill '+d.b+'? The stock comes back.'))return;for(const k of Object.keys(S.led))if(S.led[k].type=='S'&&S.led[k].bill==d.b)await del('led',k)},
 async scadd(){slRead();const n=(SL.cn||'').trim();if(!n)return say('Enter the customer name.');const l=slCust().slice();if(l.some(c=>key(c.n)==key(n)))return say(n+' is already in the list.');
  l.push({n,place:(SL.cp||'').trim(),ph:(SL.cph||'').trim(),on:true});SL.cn=SL.cp=SL.cph='';await put('cfg','cust',{list:l});say('Customer added.')},
 async sctog(d){const l=slCust().map(c=>Object.assign({},c));const c=l[+d.i];if(!c)return;c.on=c.on===false;await put('cfg','cust',{list:l})},
 slcsv(){const r=[['Date','Bill','Customer','Item','Qty kg','Rate','Amount','From']];Object.values(slBills()).filter(b=>String(b.date).startsWith(M)).sort((a,b)=>a.date<b.date?-1:1).forEach(b=>b.lines.forEach(e=>r.push([b.date,b.bill,b.party,e.item,e.qty,e.rate,num(e.qty)*num(e.rate),e.src=='M'?'Mill':'Godown'])));csv(r,'feed_mill_sales_'+M+'.csv')}};
document.addEventListener('input',e=>{const t=e.target,d=t.dataset||{};if(d.sl===undefined)return;const r=SL.rows[+d.si];if(!r)return;r[d.sl]=t.value;
  if(d.sl=='i'){const it=S.items[id(t.value)];if(it&&!r.r){r.r=String(num(it.r)||'');const ri=document.querySelector(`[data-sl="r"][data-si="${d.si}"]`);if(ri)ri.value=r.r}}
  const a=num(r.q)*num(r.r),ae=document.querySelector(`[data-sla="${d.si}"]`);if(ae)ae.textContent=a?f2(a):'–';const te=$('#sltot');if(te)te.textContent=f2(SL.rows.reduce((s,x)=>s+num(x.q)*num(x.r),0));
  const he=document.querySelector(`[data-slh="${d.si}"]`);if(he){const x=calc()[id(r.i)],hv=x?(($('#sls')||{}).value=='M'?x.m:x.g):null;he.textContent=hv==null?'':'in '+((($('#sls')||{}).value=='M')?'mill':'godown')+': '+f2(hv);he.className=hv!=null&&num(r.q)>hv+1e-9?'bad':''}});
document.addEventListener('change',e=>{if(e.target.id=='sls'){slRead();render()}});
Object.assign(A,SLA,{fmx(d){const b=document.querySelector(`[data-a="fmx"][data-k="${d.k}"]`);window.FMX&&FMX.go(d.k,b)}});
/* purchase rate correction after posting (quantity locked) */
document.addEventListener('change',async e=>{const t=e.target,k=t.dataset&&t.dataset.prate;if(!k)return;const en=S.led[k];if(!en||en.type!=='P')return;const v=num(t.value);
  if(!(v>0)){t.value=num(en.rate)||'';return say('Enter a rate above 0.')}if(v===num(en.rate))return;
  if(!confirm('Change the rate of '+en.item+' ('+f2(en.qty)+' kg, '+en.date+') from ₹'+f2(en.rate)+' to ₹'+f2(v)+'? Quantity stays the same.')){t.value=num(en.rate)||'';return}
  await put('led',k,Object.assign({},en,{rate:v,rateOld:en.rateOld!=null?en.rateOld:num(en.rate),rateBy:(window.__fmUser||{}).name||'',rateAt:Date.now()}));say('Rate updated for '+en.item+'. Amount is now ₹'+f2(num(en.qty)*v)+'.')});
/* raw material received per day (kg) for the farm app's feed mill contract pay – quantities only, no prices */
let _rmT=null;window.rmSyncSoon=()=>{clearTimeout(_rmT);_rmT=setTimeout(rmSync,1500)};
async function rmSync(){if(!db||!ready)return;const want={};for(const k in S.led){const e=S.led[k];if(e.type!=='P')continue;const it=S.items[id(e.item)];if(it&&it.t&&it.t!=='RM')continue;want[e.date]=(want[e.date]||0)+num(e.qty)}
  const have=S.rmin||{};for(const d of new Set([...Object.keys(want),...Object.keys(have)])){const kg=Math.round((want[d]||0)*100)/100;if(num((have[d]||{}).kg)===kg)continue;
    try{if(kg)await db.doc('rmin/'+d).set({kg,ts:Date.now()});else await db.doc('rmin/'+d).delete()}catch(e){console.warn('rmin',e&&e.code);return}}}
