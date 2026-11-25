/* ---------- least-cost formula with cost control ---------- */
const LCMX={MAIZE:65,SOYA:30,RICE:25,JOWER:30,KAMBU:25,DORB:10,RICE_POLISH:8,RAPSEED:8,SF:8,RICE_DDGS:8,G_N:8,DRY_FISH:5,SALT:.5,SODA_SALT:.3,SOYA_OIL:3,DCP:2,DLM:.3,LYSINE:.3,L_THERONINE:.2};
let LCB=0,LCAI=null,lcT=0;
const lsG=k=>{try{return localStorage.getItem(k)||''}catch(e){return''}},lsS=(k,v)=>{try{v?localStorage.setItem(k,v):localStorage.removeItem(k)}catch(e){}};
const lcO=()=>S.cfg.lc||{};
const lcP=i=>{const v=(lcO().p||{})[i];return v!=null&&v!==''?num(v):num((S.items[i]||{}).r)};
const lcMx=i=>{const v=(lcO().mx||{})[i];return v!=null&&v!==''?num(v):(i in LCMX?LCMX[i]:100)};
const lcMn=i=>num((lcO().mn||{})[i]);
const lcOff=i=>!!(lcO().off||{})[i];
function lcSet(i,k,v){const o=S.cfg.lc=S.cfg.lc||{};['p','mn','mx','off'].forEach(z=>o[z]=o[z]||{});
 if(k=='off')o.off[i]=!v;else if(k=='stk')o.stk=!!v;else if(k=='cap')o.cap=v===''?null:num(v);else o[k][i]=v===''?null:num(v);
 clearTimeout(lcT);lcT=setTimeout(()=>put('cfg','lc',S.cfg.lc),500)}
const lcSt=(v,t)=>!t?'ok':stOf(v,[t[0]==null?null:t[0]*.995,t[1]==null?null:t[1]*1.005]);
const lcCost=f=>{let t=0,c=0;for(const n in f){const q=num(f[n]);t+=q;c+=q*lcP(id(n))}return t?c/t:0};
function lcCands(){const C=calc(),o=[],ids=new Set([...Object.keys(DN),...Object.keys((S.cfg.nut&&S.cfg.nut.vals)||{})]);
 for(const i of ids){const it=S.items[i];if(!it)continue;const d=getN(it.n);if(!d||!NK.some(k=>num(d[k])))continue;const x=C[i]||{m:0,g:0};o.push({i,n:it.n,d,p:lcP(i),stk:num(x.m)+num(x.g)})}
 return o.sort((a,b)=>a.n.localeCompare(b.n))}
/* two-phase simplex: minimise c·x subject to rows (L ≤, G ≥, E =) and x ≥ 0 */
function simplex(c,A,b,ty){const m=A.length,n=c.length;A=A.map(r=>r.slice());b=b.slice();ty=ty.slice();
 for(let i=0;i<m;i++)if(b[i]<0){A[i]=A[i].map(v=>-v);b[i]=-b[i];ty[i]=ty[i]=='L'?'G':ty[i]=='G'?'L':'E'}
 let ns=0;ty.forEach(t=>{if(t!='E')ns++});const na=ty.filter(t=>t!='L').length,N=n+ns+na,T=[],B=[],art=[];let si=n,ai=n+ns;
 for(let i=0;i<m;i++){const r=new Array(N+1).fill(0);for(let j=0;j<n;j++)r[j]=A[i][j];r[N]=b[i];
  if(ty[i]=='L'){r[si]=1;B.push(si++)}else{if(ty[i]=='G')r[si++]=-1;r[ai]=1;art.push(ai);B.push(ai++)}T.push(r)}
 const isA=j=>j>=n+ns;
 const piv=(r,e,z)=>{const pr=T[r],pv=pr[e];for(let j=0;j<=N;j++)pr[j]/=pv;for(let i=0;i<m;i++)if(i!=r){const f=T[i][e];if(f)for(let j=0;j<=N;j++)T[i][j]-=f*pr[j]}const f=z[e];if(f)for(let j=0;j<=N;j++)z[j]-=f*pr[j];B[r]=e};
 const run=(z,ok)=>{for(let it=0;it<20000;it++){let e=-1;for(let j=0;j<N;j++)if(ok(j)&&z[j]<-1e-9){e=j;break}if(e<0)return true;let r=-1,best=Infinity;
  for(let i=0;i<m;i++)if(T[i][e]>1e-9){const q=T[i][N]/T[i][e];if(q<best-1e-12||(r>=0&&Math.abs(q-best)<=1e-12&&B[i]<B[r])){best=q;r=i}}if(r<0)return false;piv(r,e,z)}return false};
 const z1=new Array(N+1).fill(0);art.forEach(j=>z1[j]=1);for(let i=0;i<m;i++)if(isA(B[i]))for(let j=0;j<=N;j++)z1[j]-=T[i][j];
 run(z1,()=>true);if(-z1[N]>1e-7)return null;
 for(let i=0;i<m;i++)if(isA(B[i])){for(let j=0;j<n+ns;j++)if(Math.abs(T[i][j])>1e-9){piv(i,j,z1);break}}
 const z=new Array(N+1).fill(0);for(let j=0;j<n;j++)z[j]=c[j];for(let i=0;i<m;i++){const f=z[B[i]];if(f)for(let j=0;j<=N;j++)z[j]-=f*T[i][j]}
 if(!run(z,j=>!isA(j)))return null;const x=new Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]<n)x[B[i]]=T[i][N];return x}
function lcTg(l,p,c0,o){const T=tgt(p,l);if(o.mode!='cur'||!Object.values(c0).some(v=>num(v)))return T;const v=nutri(c0).v,X={};for(const k of NK){const t=T[k];if(!t){X[k]=t;continue}X[k]=[t[0]==null?null:+Math.min(t[0],v[k]).toFixed(4),t[1]==null?null:+Math.max(t[1],v[k]).toFixed(4)]}return X}
function lcSolve(l,B){const o=lcO(),p=profOf(l),c0=cur(l),Tg=lcTg(l,p,c0,o),cand=lcCands(),vars=[],fixed={},why=[];
 cand.forEach(c=>{if(lcOff(c.i))return;if(!(c.p>0)){if(num(c0[c.n]))why.push(c.n);return}if(o.stk&&c.stk<=0)return;vars.push(c)});
 const vi=new Set(vars.map(v=>v.i)),ct=Object.values(c0).reduce((s,v)=>s+num(v),0),fs=ct?B/ct:1;
 for(const n in c0){const q=num(c0[n]);if(q&&!vi.has(id(n)))fixed[n]=q*fs}
 const F=Object.values(fixed).reduce((s,v)=>s+v,0),fc=Object.keys(fixed).reduce((s,n)=>s+fixed[n]*lcP(id(n)),0);
 if(!vars.length)return{err:'No raw materials with both a rate and nutrient values. Add rates in the Stock tab or prices in the ingredient list below.'};
 const fN={};NK.forEach(k=>{fN[k]=0;for(const n in fixed){const d=getN(n);if(d)fN[k]+=fixed[n]*num(d[k])}});
 const sp=[];NK.forEach(k=>{const t=Tg[k];if(t)[0,1].forEach(m=>{if(t[m]!=null&&t[m]>0)sp.push({k,m,v:t[m]})})});
 const nv=vars.length,NV=nv+sp.length,mk=()=>new Array(NV).fill(0),rows=[],rb=[],rt=[],add=(r,v,t)=>{rows.push(r);rb.push(v);rt.push(t)};
 {const r=mk();for(let j=0;j<nv;j++)r[j]=1;add(r,B-F,'E')}
 let room=0;vars.forEach((v,j)=>{const mx=Math.min(lcMx(v.i),100)/100*B,mn=lcMn(v.i)/100*B;room+=mx;if(mx<B-F){const r=mk();r[j]=1;add(r,mx,'L')}if(mn>0){const r=mk();r[j]=1;add(r,mn,'G')}});
 if(room<B-F-1e-6)return{err:'The maximum % limits of the ingredients allowed add up to less than 100%. Raise some limits or allow more ingredients.'};
 sp.forEach((s,q)=>{const r=mk(),den=s.v*B;vars.forEach((v,j)=>r[j]=num(v.d[s.k])/den);r[nv+q]=s.m==0?1:-1;add(r,1-fN[s.k]/den,s.m==0?'G':'L')});
 const cost=vars.map(v=>v.p/B);let x=simplex(cost.concat(sp.map(()=>1e4)),rows,rb,rt);
 if(!x)return{err:'Could not find a mix with these limits. Check the minimum % values.'};
 const cpk=y=>(y.slice(0,nv).reduce((s,v,j)=>s+v*vars[j].p,0)+fc)/B,best=cpk(x);let capped=false;const cap=num(o.cap);
 if(cap>0&&best>cap+1e-6){if(fc/B>=cap)return{err:'The medicines and premixes kept from the current formula already cost ₹'+f2(fc/B)+' per kg, above the ₹'+f2(cap)+' limit.'};
  const r=mk();vars.forEach((v,j)=>r[j]=v.p/(cap*B));const y=simplex(cost.map(v=>v*1e-3).concat(sp.map(s=>s.m?10:1)),rows.concat([r]),rb.concat([1-fc/(cap*B)]),rt.concat(['L']));
  if(!y)return{err:'No mix can be made for ₹'+f2(cap)+' per kg or less with these limits.'};x=y;capped=true}
 const f={};vars.forEach((v,j)=>{const q=x[j]<10?Math.round(x[j]*100)/100:Math.round(x[j]*10)/10;if(q>=.01)f[v.n]=q});for(const n in fixed)f[n]=+fixed[n].toFixed(3);
 const tot=Object.values(f).reduce((s,v)=>s+v,0),big=vars.map(v=>v.n).filter(n=>f[n]).sort((a,b)=>f[b]-f[a])[0];if(big)f[big]=+(f[big]+B-tot).toFixed(3);
 const short=sp.map((s,q)=>({k:s.k,m:s.m,gap:x[nv+q]})).filter(s=>s.gap>5e-4);
 return{f,vars,fixed,short,capped,best,p,Tg,B,why}}
function lcv(){const l=RG,p=profOf(l),o=lcO(),c0=cur(l),T=lcTg(l,p,c0,o),t0=Object.values(c0).reduce((s,v)=>s+num(v),0),B=LCB||Math.round(t0)||1000,R=lcSolve(l,B),cands=lcCands(),adm=(window.__fmUser||{}).mill=='admin';
 const sig=R.f?JSON.stringify([l,R.f]):'',ai=LCAI&&LCAI.sig==sig?LCAI:null;
 const top=`<div class="bn soft">The app works out the <b>cheapest mix of your raw materials</b> that meets the BV-300 nutrient targets for ${l}, using today's rates. Medicines and premixes in the current formula are kept as they are. Set a <b>maximum ₹ per kg</b> to hold the cost down: if the targets cannot be met at that price, it shows the closest mix and what falls short. Claude can then check the result and explain it. Nothing changes until you load it as a draft and save.</div>
 ${shedbar()}
 <div class="row"><label>Target profile<select data-nt="1">${Object.keys(PROF).map(k=>`<option value="${k}"${k==p?' selected':''}>${PROF[k].n}</option>`).join('')}</select></label>${PROF[p].s?`<label>Feed intake, g/bird/day<input type="number" min="60" max="160" step="1" data-ti="1" value="${intOf(l)}" style="width:90px"></label>`:''}<label>Aim<select data-lck="mode"><option value="bv"${o.mode!='cur'?' selected':''}>Meet BV-300 targets in full</option><option value="cur"${o.mode=='cur'?' selected':''}>Cut cost, keep today's nutrition</option></select></label><label>Batch size, kg<input type="number" min="100" step="any" data-lck="b" value="${B}" style="width:100px"></label><label>Maximum ₹ per kg<input type="number" step="any" min="0" data-lck="cap" value="${o.cap??''}" placeholder="no limit" style="width:110px"></label><label style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" data-lck="stk" ${o.stk?'checked':''}> Only materials in stock</label></div>
 ${o.mode=='cur'?'<small>Targets here are BV-300 or today\'s formula level, whichever is lower, so nutrition never drops below what the birds get now.</small>':''}
 ${(()=>{const miss=cands.filter(c=>['DLM','LYSINE','L_THERONINE','DCP','SOYA_OIL'].includes(c.i)&&!(c.p>0)&&!lcOff(c.i));return miss.length?`<div class="panel"><h3>Add today's prices</h3><small>These supplements have no rate, so the app cannot use them. Methionine and lysine are very hard to reach with grains and meals alone, so without DLM and lysine prices the suggested mix needs much more soya and costs more.</small><div class="row">${miss.map(c=>`<label>${h(c.n)} ₹/kg<input type="number" step="any" min="0" data-lck="p" data-lci="${c.i}" style="width:90px"></label>`).join('')}</div></div>`:''})()}`;
 let body='';
 if(R.err)body=`<div class="bn">${h(R.err)}</div>`;
 else{const cc=lcCost(c0),sc=lcCost(R.f),n0=t0?nutri(c0).v:null,n1=nutri(R.f).v,save=(cc-sc)*1000,ns=NK.filter(k=>lcSt(n1[k],T[k])!='ok');
  const names=[...new Set([...Object.keys(R.f),...Object.keys(c0).filter(n=>num(c0[n]))])].sort((a,b)=>(num(R.f[b])-num(R.f[a]))||a.localeCompare(b));
  const fsc=t0?B/t0:1;
  const irow=n=>{const a=num(c0[n])*fsc,b=num(R.f[n]),d=b-a,fx=n in R.fixed;return `<tr><td>${h(n)}${fx?' <small>kept</small>':''}</td><td>${a?f2(+a.toFixed(1)):'–'}</td><td><b>${b?f2(b):'–'}</b>${b?`<br><small>${(b/B*100).toFixed(1)}%</small>`:''}</td><td class="${Math.abs(d)<.05?'':d>0?'ok':'low'}">${Math.abs(d)<.05?'':(d>0?'+':'')+f2(+d.toFixed(1))}</td></tr>`};
  const nrow=k=>`<tr><td>${NL[k][0]} <small>${NL[k][1]}</small></td><td><small>${tgText(T[k],k)}</small></td>${n0?`<td class="chip ${lcSt(n0[k],T[k])}">${fmtN(n0[k],k)}</td>`:''}<td class="chip ${lcSt(n1[k],T[k])}"><b>${fmtN(n1[k],k)}</b></td></tr>`;
  const sh=R.short.map(s=>`${NL[s.k][0]} ${s.m==0?'below the minimum':'above the maximum'} by ${(s.gap*100).toFixed(1)}%`).join('; ');
  body=`${R.capped?`<div class="bn">Held to ₹${f2(num(o.cap))} per kg. At this price: ${h(sh)||'all targets met'}. The lowest-cost mix that meets every target costs more; clear the limit to see it.</div>`:R.short.length?`<div class="bn">The allowed materials cannot meet every target: ${h(sh)}. Allow more ingredients, add prices for DCP, DLM or lysine, or raise their limits below.</div>`:''}
  ${R.why.length?`<div class="bn soft">${h(R.why.join(', '))} ${R.why.length>1?'are':'is'} in the formula but ${R.why.length>1?'have':'has'} no price, so ${R.why.length>1?'they are':'it is'} kept at the current amount. Add a price in the ingredient list below to let the app adjust ${R.why.length>1?'them':'it'}.</div>`:''}
  <div class="cards"><div class="card kpi"><span>Current formula</span><b>${t0?'₹'+f2(+cc.toFixed(2)):'–'}</b><em>per kg feed</em></div><div class="card kpi"><span>Suggested formula</span><b>₹${f2(+sc.toFixed(2))}</b><em>per kg feed</em></div><div class="card kpi"><span>Saving</span><b>${t0?(save>=0?'₹':'−₹')+f2(Math.abs(Math.round(save))):'–'}</b><em>per tonne of feed</em></div><div class="card kpi"><span>Nutrients</span><b>${ns.length?ns.length+' off target':'All in range'}</b><em>${h(PROF[p].n.split(' (')[0])}</em></div></div>
  <div class="grid2"><div class="panel"><h3>Ingredients per ${f2(B)} kg batch</h3><div class="sc" style="box-shadow:none"><table><tr><th>Ingredient</th><th>Now kg</th><th>New kg</th><th>Change</th></tr>${names.map(irow).join('')}</table></div></div>
  <div class="panel"><h3>Nutrients per kg of feed</h3><div class="sc" style="box-shadow:none"><table><tr><th>Nutrient</th><th>Target</th>${n0?'<th>Current</th>':''}<th>Suggested</th></tr>${NK.map(nrow).join('')}</table></div></div></div>
  <div class="row"><button class="pri" data-a="lcuse">Load as draft for ${l}</button><button data-a="lcai" ${LCAI&&LCAI.busy?'disabled':''}>${LCAI&&LCAI.busy?'Claude is checking…':'Ask Claude to check this formula'}</button></div>
  ${ai&&ai.err?`<div class="bn">${h(ai.err)}</div>`:''}${ai&&ai.en?`<div class="panel"><h3>Claude's check</h3><p>${h(ai.en.summary)}</p><ul>${(ai.en.points||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ul>${ai.ta?`<details><summary>தமிழில்</summary><p>${h(ai.ta.summary)}</p><ul>${(ai.ta.points||[]).map(x=>`<li>${h(x)}</li>`).join('')}</ul></details>`:''}<small>Advice from Claude. Check major changes with your nutritionist before using them.</small></div>`:''}`}
 const crow=c=>`<tr><td><input type="checkbox" data-lck="off" data-lci="${c.i}" ${lcOff(c.i)?'':'checked'}></td><td>${h(c.n)}</td><td><input type="number" step="any" min="0" data-lck="p" data-lci="${c.i}" value="${(o.p||{})[c.i]??''}" placeholder="${num((S.items[c.i]||{}).r)||'add'}" style="width:80px"></td><td><input type="number" step="any" min="0" max="100" data-lck="mn" data-lci="${c.i}" value="${(o.mn||{})[c.i]??''}" placeholder="0" style="width:64px"></td><td><input type="number" step="any" min="0" max="100" data-lck="mx" data-lci="${c.i}" value="${(o.mx||{})[c.i]??''}" placeholder="${c.i in LCMX?LCMX[c.i]:100}" style="width:64px"></td><td>${f2(Math.round(c.stk))}</td><td>${c.p>0?'':'<small class="low">no price</small>'}</td></tr>`;
 const lst=`<details class="panel" ${lcO().open?'open':''} ontoggle="(S.cfg.lc=S.cfg.lc||{}).open=this.open"><summary>Ingredients the app can use (${cands.length})</summary><div class="sc" style="box-shadow:none"><table><tr><th>Use</th><th>Ingredient</th><th>Price ₹/kg</th><th>Min %</th><th>Max %</th><th>Stock kg</th><th></th></tr>${cands.map(crow).join('')}</table></div><small>Price is the Stock tab rate unless you type one here. Max % are practical limits for layer feed (for example DORB 10%, fish 5%, oil 3%); change them to suit your farm. Nutrient values come from the Nutrient composition tab.</small></details>`;
 const key=adm?`<details class="panel"><summary>Claude API key (this device)</summary><div class="row"><label>Key<input type="password" id="lckey" value="${h(lsG('fm-ai-key'))}" placeholder="sk-ant-…" style="width:260px"></label><label>Model<input id="lcmod" value="${h(lsG('fm-ai-model')||'claude-sonnet-5-5')}" style="width:170px"></label><button data-a="lckey">Save key</button></div><small>Use the same key as in the farm app's P&L. It is kept only in this browser.</small></details>`:'';
 return top+body+lst+key}
async function lcAsk(){const l=RG,o=lcO(),c0=cur(l),t0=Object.values(c0).reduce((s,v)=>s+num(v),0),B=LCB||Math.round(t0)||1000,R=lcSolve(l,B);if(R.err||!R.f)return;
 const k=lsG('fm-ai-key');if(!k)return say((window.__fmUser||{}).mill=='admin'?'Add the Claude API key at the bottom of this page first.':'Ask the feed mill admin to add the Claude API key on this device.');
 const sig=JSON.stringify([l,R.f]);LCAI={sig,busy:true};render();const T=tgt(R.p,l),n0=t0?nutri(c0).v:null,n1=nutri(R.f).v;
 const ing=R.vars.map(v=>`${v.n}: ₹${v.p}/kg, max ${lcMx(v.i)}%, ${NK.map(z=>z+' '+num(v.d[z])).join(', ')}`).join('\n');
 const fm=f=>Object.keys(f).filter(n=>num(f[n])).map(n=>n+' '+f2(num(f[n]))+' kg').join(', ');
 const ctx=`Commercial layer farm, Tamil Nadu, India. Breed BV-300. Shed ${l}. Target profile: ${PROF[R.p].n}${PROF[R.p].s?', feed intake '+intOf(l)+' g/bird/day':''}.
Targets per kg feed (min–max): ${NK.map(z=>z+' '+tgText(T[z],z)).join('; ')}.
Ingredients allowed (nutrients per kg as fed; me kcal/kg, others %):
${ing}
Kept unchanged (medicines/premixes): ${fm(R.fixed)||'none'}.
Current formula per ${f2(t0)} kg: ${fm(c0)||'none'}. Cost ₹${lcCost(c0).toFixed(2)}/kg. Nutrients: ${n0?NK.map(z=>z+' '+fmtN(n0[z],z)).join(', '):'-'}.
Least-cost formula per ${B} kg: ${fm(R.f)}. Cost ₹${lcCost(R.f).toFixed(2)}/kg. Nutrients: ${NK.map(z=>z+' '+fmtN(n1[z],z)).join(', ')}.${R.capped?' Cost was capped at ₹'+o.cap+'/kg.':''}${R.short.length?' Shortfalls: '+R.short.map(s=>s.k+' '+(s.gap*100).toFixed(1)+'%').join(', '):''}`;
 const sys='You are an experienced poultry nutritionist advising an Indian commercial layer farm. You are given a least-cost formula produced by a linear program. Check it for practical problems the program cannot see: palatability and sudden ingredient changes, anti-nutritional factors and mycotoxin risk (DORB, rapeseed, sunflower, DDGS), limestone particle size for eggshell (grit vs powder), amino-acid balance, energy to protein balance, sodium and chloride, and whether the change from the current formula is too abrupt. Suggest at most 5 specific, practical changes in kg per batch where useful, with the likely effect on cost. Do not invent prices. Reply ONLY with JSON: {"en":{"summary":"","points":[""]},"ta":{"summary":"","points":[""]}} where "ta" is the same content in simple Tamil.';
 try{const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:lsG('fm-ai-model')||'claude-sonnet-5-5',max_tokens:2000,system:sys,messages:[{role:'user',content:ctx}]})});
  const j=await res.json();if(!res.ok)throw new Error((j.error&&j.error.message)||('HTTP '+res.status));
  const tx=(j.content||[]).map(c=>c.text||'').join(''),m=tx.match(/\{[\s\S]*\}/);if(!m)throw new Error('Unexpected reply');const r=JSON.parse(m[0]);LCAI={sig,en:r.en,ta:r.ta}}
 catch(e){LCAI={sig,err:'Claude could not check the formula: '+(e.message||e)}}render()}
