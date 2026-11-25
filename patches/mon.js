/* ---------- feed mill monitor: automatic checks + Claude daily review ---------- */
const addD=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const med=a=>{const b=a.slice().sort((x,y)=>x-y),m=b.length>>1;return b.length?(b.length%2?b[m]:(b[m-1]+b[m])/2):0};
let MONAI=null,MONAUTO='';
function monData(){const T0=td(),C=calc(),A=[],add=(sev,area,txt,act)=>A.push({sev,area,txt,act});
 const ds=Object.keys(S.days).sort(),rec=ds.filter(d=>d>=addD(T0,-14)&&d<=T0),use={};
 rec.forEach(d=>{const N=need(S.days[d]);for(const n in N){const i=id(n);use[i]=(use[i]||0)+N[n]}});
 const nd=Math.max(1,rec.length),avg=i=>(use[i]||0)/nd;
 /* stock cover */
 const cover=[],xfer=[];for(const k in S.items){const it=S.items[k],x=C[k];if(!x)continue;const t=x.m+x.g,u=avg(k);
  if(t<-1e-6){add('high','Stock',`${it.n} stock is negative (${f2(Math.round(t))} kg). A purchase or production entry is probably missing.`,'Check purchases and production entries for '+it.n);continue}
  if(u>0){const cv=t/u;cover.push({n:it.n,cv,t,u,m:x.m,g:x.g});
   if(cv<3)add('high','Stock',`${it.n}: only ${cv.toFixed(1)} days left (${f2(Math.round(t))} kg, using about ${f2(Math.round(u))} kg a day).`,'Order '+it.n+' now');
   else if(cv<7)add('med','Stock',`${it.n}: about ${Math.round(cv)} days left (${f2(Math.round(t))} kg).`,'Plan the next purchase of '+it.n);
   if(x.m<2*u&&x.g>0&&cv>=3)xfer.push(`${it.n} ${f2(Math.max(0,Math.ceil(7*u-x.m)))} kg`)}
  else if(num(it.lv)>0&&t<=num(it.lv))add('med','Stock',`${it.n} is at or below its reorder level (${f2(Math.round(t))} of ${f2(it.lv)} kg).`,'Reorder '+it.n);
  if(it.ex&&t>0){if(it.ex<T0)add('high','Expiry',`${it.n} expired on ${dFmt(it.ex)} and ${f2(Math.round(t))} kg is still in stock.`,'Remove expired '+it.n+' from use');else if(it.ex<=addD(T0,30))add('med','Expiry',`${it.n} expires on ${dFmt(it.ex)} (${f2(Math.round(t))} kg in stock).`,'Use '+it.n+' first')}}
 cover.sort((a,b)=>a.cv-b.cv);
 if(xfer.length)add('med','Stock',`${xfer.length} item${xfer.length>1?'s are':' is'} short in the mill (under 2 days or negative) but in stock at the godown.`,'Transfer godown → mill for about a week: '+xfer.join(', '));
 /* production entries */
 if(ds.some(d=>d>=addD(T0,-30))){const miss=[];for(let i=1;i<=6;i++){const d=addD(T0,-i);if(!S.days[d])miss.push(d)}
  if(miss.length)add(miss.includes(addD(T0,-1))?'med':'low','Production',`No production entered for ${miss.map(dFmt).join(', ')}. Stock is not reduced for those days.`,'Enter the missing days in Production')}
 /* batches per shed vs usual + formula drift */
 const last=ds.filter(d=>d<=T0).slice(-1)[0];
 if(last){const L=S.days[last],prev=ds.filter(d=>d<last).slice(-7);
  LOC.forEach(l=>{const b=num(L.b&&L.b[l]),hs=prev.map(d=>num((S.days[d].b||{})[l])).filter(v=>v>0);if(hs.length<3)return;const m=med(hs);
   if(!b)add('low','Production',`${l} had no batches on ${dFmt(last)} (usually ${f2(m)}).`,'Confirm '+l+' was fed from stock');
   else if(Math.abs(b-m)/m>.3)add('med','Production',`${l} made ${f2(b)} batches on ${dFmt(last)}, usually ${f2(m)}.`,'Check '+l+' bird count and feed use')})}
 ds.filter(d=>d>=addD(T0,-7)).forEach(d=>{const fv=S.days[d].fv||{},bb=S.days[d].b||{};LOC.forEach(l=>{if(!num(bb[l]))return;const c=fv[l];if(c=='none')add('high','Formula',`${l} on ${dFmt(d)}: batches entered but no formula, so nothing was deducted.`,'Set the '+l+' formula and re-post '+dFmt(d));else if(c=='custom'||String(c).endsWith('*'))add('low','Formula',`${l} on ${dFmt(d)} used a formula edited for that day (${h(c)}).`,'Check the change was approved')})});
 /* nutrients of saved formulas */
 const nb=[];LOC.forEach(l=>{const f=regF(l);if(!Object.keys(f).length)return;const v=nutri(f).v,T=tgt(profOf(l),l),bad=NK.filter(k=>lcSt(v[k],T[k])!='ok');if(bad.length)nb.push([l,bad])});
 if(nb.length){const AB={me:'energy',cp:'protein',ca:'calcium',ap:'av. P',lys:'lysine',met:'methionine',na:'sodium',cf:'fibre'},worst=nb.slice().sort((a,b)=>b[1].length-a[1].length);add(worst[0][1].length>=3?'med':'low','Nutrition',`${nb.length} shed formula${nb.length>1?'s are':' is'} off the BV-300 target: ${worst.map(([l,b])=>l+' ('+b.map(k=>AB[k]).join(', ')+')').join('; ')}.`,'Open Formulas → Lowest cost, starting with '+worst[0][0])}
 /* purchase prices */
 const P=Object.values(S.led).filter(e=>e.type=='P').sort((a,b)=>a.date<b.date?-1:1);
 P.filter(e=>e.date>=addD(T0,-30)).forEach(e=>{const old=P.filter(z=>z.item==e.item&&z.date<e.date&&num(z.rate)>0).slice(-3),base=old.length?old.reduce((s,z)=>s+num(z.rate),0)/old.length:0,r=num(e.rate);if(!base||!r)return;const ch=(r-base)/base*100;
  if(ch>8)add(ch>15?'high':'med','Purchase',`${e.item} bought on ${dFmt(e.date)} at ₹${f2(r)}/kg, ${ch.toFixed(0)}% above the recent ₹${f2(+base.toFixed(2))}.`,'Check the rate with the supplier'+(e.party?' ('+e.party+')':''))});
 P.filter(e=>e.inc===false&&e.date>=addD(T0,-30)).forEach(e=>add('low','Purchase',`${e.item} ${f2(e.qty)} kg bought on ${dFmt(e.date)} is not added to stock yet.`,'Tick "In stock" when it arrives'));
 /* unpriced medicines in use */
 const up=[...new Set(rec.flatMap(d=>Object.keys(need(S.days[d]))).filter(n=>{const i=S.items[id(n)];return i&&!(num(i.r)>0)}))];
 if(up.length)add('low','Cost',`${up.length} items used in feed have no rate (${up.slice(0,6).join(', ')}${up.length>6?'…':''}), so feed cost is understated.`,'Enter rates in the Stock tab');
 /* feed cost per kg trend */
 const tr=ds.slice(-14).map(d=>{const N=need(S.days[d]),kg=Object.values(N).reduce((s,v)=>s+v,0);return{d,kg,cpk:kg?dayVal(S.days[d])/kg:0}}).filter(x=>x.kg>0);
 if(tr.length>=3){const l=tr[tr.length-1],b=tr.slice(0,-1).slice(-7),av=b.reduce((s,x)=>s+x.cpk,0)/b.length,ch=(l.cpk-av)/av*100;if(Math.abs(ch)>3)add(ch>0?'med':'low','Cost',`Feed cost on ${dFmt(l.d)} was ₹${l.cpk.toFixed(2)}/kg, ${Math.abs(ch).toFixed(1)}% ${ch>0?'above':'below'} the 7-day average ₹${av.toFixed(2)}.`,ch>0?'See which ingredient or formula changed':'')}
 const ord={high:0,med:1,low:2};A.sort((a,b)=>ord[a.sev]-ord[b.sev]);
 const nH=A.filter(a=>a.sev=='high').length,nM=A.filter(a=>a.sev=='med').length,nL=A.length-nH-nM,score=Math.max(0,100-Math.min(45,15*nH)-Math.min(30,5*nM)-Math.min(10,nL));
 return{A,nH,nM,nL,score,cover,tr,rec:rec.length,use}}
function monBanner(){if(!ready)return '';const M=monData();return M.nH?`<div class="bn" style="cursor:pointer" data-a="tab" data-v="mon"><b>Monitor: ${M.nH} urgent alert${M.nH>1?'s':''}.</b> ${h(M.A[0].txt)} <u>Open Monitor</u></div>`:''}
function monText(M){return '*NSR FEED MILL - MONITOR '+dFmt(td())+'*\nHealth '+M.score+'/100 · '+M.nH+' urgent · '+M.nM+' to watch\n\n'+(M.A.filter(a=>a.sev!='low').map(a=>(a.sev=='high'?'🔴 ':'🟠 ')+a.txt).join('\n')||'No urgent alerts')}
function trendSvg(tr){if(tr.length<2)return '<small>Needs at least two production days.</small>';const W=620,H=150,P=34,v=tr.map(x=>x.cpk),lo=Math.min(...v)*.98,hi=Math.max(...v)*1.02,X=i=>P+i*(W-P-10)/(tr.length-1),Y=y=>H-22-(y-lo)/(hi-lo||1)*(H-40);
 const pts=tr.map((x,i)=>X(i).toFixed(1)+','+Y(x.cpk).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Feed cost per kg, last ${tr.length} production days"><line x1="${P}" x2="${W-10}" y1="${Y(lo)}" y2="${Y(lo)}" stroke="var(--bd)"/><text x="2" y="${Y(hi)+4}" font-size="11" fill="var(--mu)">₹${hi.toFixed(1)}</text><text x="2" y="${Y(lo)+4}" font-size="11" fill="var(--mu)">₹${lo.toFixed(1)}</text><polyline points="${pts}" fill="none" stroke="var(--br)" stroke-width="2" stroke-linejoin="round"/>${tr.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x.cpk)}" r="4" fill="var(--br)" stroke="var(--sf)" stroke-width="2"><title>${dFmt(x.d)}: ₹${x.cpk.toFixed(2)}/kg, ${f2(Math.round(x.kg))} kg</title></circle>`).join('')}${tr.map((x,i)=>i%Math.ceil(tr.length/7)==0||i==tr.length-1?`<text x="${X(i)}" y="${H-4}" font-size="11" text-anchor="middle" fill="var(--mu)">${x.d.slice(8)}/${x.d.slice(5,7)}</text>`:'').join('')}</svg>`}
function monv(){const M=monData(),adm=(window.__fmUser||{}).mill=='admin',rv=S.cfg.mon,today=td(),fresh=rv&&rv.date==today;
 if(adm&&lsG('fm-ai-key')&&!fresh&&MONAUTO!=today&&!(MONAI&&MONAI.busy)&&ready){MONAUTO=today;setTimeout(monAsk,50)}
 const sevL={high:['Urgent','high'],med:['Watch','low'],low:['Note','']};
 const lt=M.tr[M.tr.length-1],cs=contacts(),txt=monText(M);
 const kpi=(lab,val,sub)=>`<div class="card kpi"><span>${lab}</span><b>${val}</b><em>${sub}</em></div>`;
 const rvH=rv&&rv.en?`<div class="panel"><h3>Claude's daily review · ${dFmt(rv.date)}${rv.at?' '+new Date(rv.at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):''}</h3><p>${h(rv.en.summary)}</p><ol>${(rv.en.priorities||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ol>${rv.ta?`<details><summary>தமிழில்</summary><p>${h(rv.ta.summary)}</p><ol>${(rv.ta.priorities||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ol></details>`:''}${fresh?'':'<small>This review is from an earlier day. Press Review now for today.</small>'}</div>`:'';
 return `<div class="bn soft">The monitor checks the feed mill every time data changes: stock cover from the last 14 days of use, expiry, missing production days, unusual batch counts, formulas used, nutrients against BV-300, purchase prices and feed cost per kg. Claude reads these each day and lists what to do first.</div>
 <div class="cards">${kpi('Mill health',M.score+'/100',M.score>=85?'Running well':M.score>=60?'Needs attention':'Act today')}${kpi('Urgent alerts',M.nH,M.nM+' to watch · '+M.nL+' notes')}${kpi('Feed cost',lt?'₹'+lt.cpk.toFixed(2):'–',lt?'per kg on '+dFmt(lt.d):'no production yet')}${kpi('Shortest stock',M.cover[0]?M.cover[0].cv.toFixed(1)+' days':'–',M.cover[0]?h(M.cover[0].n):'')}</div>
 <div class="row"><button class="pri" data-a="monai" ${MONAI&&MONAI.busy?'disabled':''}>${MONAI&&MONAI.busy?'Claude is reviewing…':'Review now with Claude'}</button>${cs.length?cs.map(c=>`<a class="btn wa" style="text-decoration:none" target="_blank" rel="noopener" href="${h(waLink(c.p,txt))}">WhatsApp ${h(c.n)}</a>`).join(''):'<small>Add WhatsApp numbers in Share to send alerts.</small>'}</div>
 ${MONAI&&MONAI.err?`<div class="bn">${h(MONAI.err)}</div>`:''}${!lsG('fm-ai-key')?`<small>${adm?'Add the Claude API key below to get the daily review.':'The admin can add a Claude API key on this device for the daily review.'}</small>`:''}
 ${rvH}
 <h2>Alerts (${M.A.length})</h2><div class="panel" style="padding:4px 16px">${M.A.map(a=>`<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-bottom:1px solid var(--bd)"><span class="chip ${sevL[a.sev][1]}" style="flex:none">${sevL[a.sev][0]}</span><div style="min-width:0"><div><small style="color:var(--mu)">${a.area}</small> · ${h(a.txt)}</div>${a.act?`<small style="color:var(--mu)">→ ${h(a.act)}</small>`:''}</div></div>`).join('')||'<p>No alerts. Everything checked looks normal.</p>'}</div>
 <div class="grid2"><div class="panel"><h3>Feed cost per kg, last ${M.tr.length} production days</h3>${trendSvg(M.tr)}</div>
 <div class="panel"><h3>Stock cover (days)</h3><div class="sc" style="box-shadow:none;max-height:320px"><table><tr><th>Material</th><th>Days</th><th>Mill kg</th><th>Godown kg</th><th>Use/day</th></tr>${M.cover.slice(0,15).map(c=>`<tr><td>${h(c.n)}</td><td class="${c.cv<3?'high':c.cv<7?'low':'ok'}">${c.cv>999?'999+':c.cv.toFixed(1)}</td><td>${f2(Math.round(c.m))}</td><td>${f2(Math.round(c.g))}</td><td>${f2(Math.round(c.u))}</td></tr>`).join('')||'<tr><td colspan=5>Needs production entries to work out daily use.</td></tr>'}</table></div><small>Daily use is the average over ${M.rec} production day(s) in the last 14 days.</small></div></div>
 ${adm?`<details class="panel"><summary>Claude API key (this device)</summary><div class="row"><label>Key<input type="password" id="lckey" value="${h(lsG('fm-ai-key'))}" placeholder="sk-ant-…" style="width:260px"></label><label>Model<input id="lcmod" value="${h(lsG('fm-ai-model')||'claude-sonnet-5-5')}" style="width:170px"></label><button data-a="lckey">Save key</button></div><small>Use the same key as in the farm app's P&L. It is kept only in this browser. The daily review is saved for everyone.</small></details>`:''}`}
async function monAsk(){const k=lsG('fm-ai-key');if(!k)return say((window.__fmUser||{}).mill=='admin'?'Add the Claude API key at the bottom of the Monitor page first.':'Ask the feed mill admin to add the Claude API key on this device.');
 MONAI={busy:true};render();const M=monData();
 const top=Object.keys(M.use).map(i=>[i,M.use[i]/Math.max(1,M.rec)]).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([i,u])=>`${(S.items[i]||{}).n||i} ${Math.round(u)} kg/day @ ₹${num((S.items[i]||{}).r)}`).join('; ');
 const ctx=`Feed mill of a commercial BV-300 layer farm in Tamil Nadu, India (sheds B1-B10 layers, CHICK-1/2, GRO-1/2). Date ${td()}.
Mill health score ${M.score}/100. Alerts found by automatic checks (level | area | finding):
${M.A.map(a=>a.sev+' | '+a.area+' | '+a.txt).join('\n')||'none'}
Feed cost per kg, recent production days: ${M.tr.map(x=>x.d.slice(5)+' ₹'+x.cpk.toFixed(2)+' ('+Math.round(x.kg)+' kg)').join(', ')||'no data'}.
Shortest stock cover: ${M.cover.slice(0,8).map(c=>c.n+' '+c.cv.toFixed(1)+' days').join(', ')||'no data'}.
Top daily use: ${top||'no data'}.`;
 const sys='You are an experienced feed mill manager for an Indian commercial layer farm. From the monitor data, write a short daily review for the mill owner: one-sentence summary of how the mill is running, then at most 5 priorities in order of urgency. Each priority must be a concrete action with quantities or dates where the data supports it (for example how many kg to order and by when). Mention patterns across alerts (for example a price rise and low cover on the same material). Do not invent figures not in the data. Reply ONLY with JSON: {"en":{"summary":"","priorities":[""]},"ta":{"summary":"","priorities":[""]}} where "ta" is the same in simple Tamil.';
 try{const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:lsG('fm-ai-model')||'claude-sonnet-5-5',max_tokens:2000,system:sys,messages:[{role:'user',content:ctx}]})});
  const j=await res.json();if(!res.ok)throw new Error((j.error&&j.error.message)||('HTTP '+res.status));
  const tx=(j.content||[]).map(c=>c.text||'').join(''),m=tx.match(/\{[\s\S]*\}/);if(!m)throw new Error('Unexpected reply');const r=JSON.parse(m[0]);
  MONAI=null;await put('cfg','mon',{date:td(),at:Date.now(),en:r.en,ta:r.ta,score:M.score})}
 catch(e){MONAI={err:'Claude could not review the mill: '+(e.message||e)};render()}}
