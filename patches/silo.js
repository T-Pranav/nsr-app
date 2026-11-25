/* ===== Feed silos (read-only here): weights copied hourly from Poultry Manager; setup is in the layer app ===== */
let SIL={live:null,lt:0,now:null,d:{},cfg:{},sel:null,date:'',on:false};
function silWatch(){if(SIL.on||!db||!db._f)return;SIL.on=true;const F=db._f,from=new Date(Date.now()-35*864e5).toLocaleDateString('en-CA');
 F.doc('silo/now').onSnapshot(s=>{SIL.now=s.exists?s.data():null;if(tab=='silo')render()},()=>{});
 F.collection('silo').where('date','>=',from).onSnapshot(s=>{const o={};s.docs.forEach(x=>{const d=x.data();if(d.date)o[d.date]=d});SIL.d=o;if(tab=='silo')render()},()=>{});
 F.doc('settings/silo').onSnapshot(s=>{SIL.cfg=s.exists?s.data():{};if(tab=='silo')render()},()=>{})}
const silN=v=>Math.round(num(v)).toLocaleString('en-IN'),silT=kg=>kg==null?'–':kg>=1000?(kg/1000).toFixed(2)+' t':silN(kg)+' kg';
const silAdd=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')};
async function silLive(force){try{if(!window.firebase)return;const u=firebase.auth().currentUser;if(!u||u.isAnonymous)return;if(!force&&Date.now()-SIL.lt<9e4)return;SIL.lt=Date.now();
 const r=await fetch('/api/silo-live',{headers:{Authorization:'Bearer '+await u.getIdToken()}});if(!r.ok)return;const j=await r.json();if(j&&j.silos){SIL.live=j;if(tab=='silo')render()}}catch(e){}}
setInterval(()=>{if(typeof tab!=='undefined'&&tab=='silo'&&!document.hidden)silLive()},12e4);
const silSrc=()=>{const a=SIL.live,b=SIL.now;return a&&(!b||a.at>=b.at)?a:b};
const silList=()=>((silSrc()||{}).silos||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'en',{numeric:true}));
const silC=id=>((SIL.cfg||{}).map||{})[id]||{},silDay=(id,d)=>(((SIL.d||{})[d]||{}).s||{})[id]||null;
const silLoc=sh=>!sh?'':sh.startsWith('C-')?'CHICK-'+sh.slice(2):sh.startsWith('G-')?'GRO-'+sh.slice(2):sh.replace('-','');
function silAvg(id){const a=[];for(let i=1;i<=7;i++){const x=silDay(id,silAdd(td(),-i));if(x&&x.n)a.push(num(x.u))}return a.length?a.reduce((p,c)=>p+c,0)/a.length:0}
function silSt(x){const c=silC(x.id),kg=num(x.kg),avg=silAvg(x.id),left=avg>0?kg/avg:null,low=(c.low&&kg<=num(c.low))||(left!=null&&left<1.5);
 return{c,kg,left,low,warn:!low&&left!=null&&left<3,stale:!x.la||Date.now()-Date.parse(x.la)>3*36e5,pct:num(c.cap)>0?Math.max(0,Math.min(100,kg/num(c.cap)*100)):null}}
function silMade(d,loc){const dd=(S.days||{})[d];if(!dd||!dd.b||!loc)return 0;const b=num(dd.b[loc]);if(!b)return 0;let k=0;for(const n in dd.f||{})k+=num((dd.f[n]||{})[loc]);
 if(!k){const r=(S.reg||{})[loc.replace('-','_')]||(S.reg||{})[loc];if(r)for(const n in r.f||{})k+=num(r.f[n])}return b*k}
const silTag=(t,c)=>`<span style="display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;margin:2px 4px 0 0;background:var(--${c}bg);color:var(--${c=='ok'?'ac':c})">${t}</span>`;
function silTank(st){const p=st.pct==null?60:st.pct,col=st.low?'var(--bad)':st.warn?'var(--wn)':'var(--ac)',hh=Math.round(64*p/100);
 return `<svg viewBox="0 0 44 92" width="40" height="84" aria-hidden="true" style="flex:none"><path d="M4 6h36v66l-10 14H14L4 72z" fill="none" stroke="var(--bd2)" stroke-width="2.5"/><rect x="6.5" y="${70-hh}" width="31" height="${hh}" rx="3" fill="${col}" opacity="${st.pct==null?.35:.85}"/><path d="M15 86v5M29 86v5" stroke="var(--bd2)" stroke-width="2.5"/></svg>`}
function silLine(x,d){const y=silDay(x.id,d);if(!y||!y.n)return '<small>No readings for this day.</small>';const last=d===td()?new Date().getHours():23,pts=[[0,y.o]];let v=y.o;for(let i=0;i<=last;i++){if(y.h&&y.h[i]!=null)v=y.h[i];pts.push([i+1,v])}
 const mx=Math.max(...pts.map(p=>p[1]),num(silC(x.id).cap))*1.08||1,W=600,H=170,X=hr=>36+hr/24*(W-62),Y=k=>H-22-(k/mx)*(H-34),path=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
 return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${[0,6,12,18,24].map(hr=>`<text x="${X(hr)}" y="${H-6}" font-size="11" text-anchor="middle" fill="var(--mu)">${String(hr).padStart(2,'0')}:00</text><line x1="${X(hr)}" x2="${X(hr)}" y1="10" y2="${H-22}" stroke="var(--bd)" stroke-width=".6"/>`).join('')}${[0,.5,1].map(f=>`<text x="30" y="${Y(mx/1.08*f)+4}" font-size="10" text-anchor="end" fill="var(--mu)">${(mx/1.08*f/1000).toFixed(1)}t</text>`).join('')}<path d="${path} L${X(pts[pts.length-1][0])} ${Y(0)} L${X(0)} ${Y(0)}Z" fill="var(--ac)" opacity=".10"/><path d="${path}" fill="none" stroke="var(--ac)" stroke-width="2"/></svg>`}
function silov(){silWatch();silLive();const L=silList(),T=td();
 if(!silSrc()||!L.length)return `<div class="panel"><h3>Feed silos</h3><small>Waiting for the first silo reading from Poultry Manager. It updates every hour once set up.</small></div>`;
 const x=SIL.sel!=null&&L.find(s=>String(s.id)===String(SIL.sel));if(x)return silDet(x);
 const kpi=(ic,lab,val,sub)=>`<div class="card kpi"><i class="ic">${ICON(ic)}</i><span>${lab}</span><b>${val}</b><em>${sub||'&nbsp;'}</em></div>`;
 const S2=L.map(s=>[s,silSt(s)]),Yd=silAdd(T,-1),tot=L.reduce((a,s)=>a+num(s.kg),0),uT=L.reduce((a,s)=>a+num((silDay(s.id,T)||{}).u),0),fT=L.reduce((a,s)=>a+num((silDay(s.id,T)||{}).f),0),nl=S2.filter(z=>z[1].low).length;
 const cards=S2.map(([s,st])=>{const t0=silDay(s.id,T)||{};return `<button data-a="silsel" data-v="${s.id}" class="card" style="display:flex;gap:12px;align-items:center;text-align:left;width:100%;cursor:pointer;font:inherit;color:var(--ink)">${silTank(st)}<div style="flex:1;min-width:0">
  <b style="font-size:15px">${h(s.name)}</b>${st.c.sh?` <span style="font-size:12px;color:var(--mu);font-weight:600">· ${h(st.c.sh)}</span>`:''}<div style="font-size:22px;font-weight:800">${silT(s.kg)}${st.pct!=null?` <small style="font-weight:600">${Math.round(st.pct)}%</small>`:''}</div>
  <small>Used today ${t0.n?silN(t0.u)+' kg':'–'}${st.left!=null?' · ≈ '+st.left.toFixed(1)+' days left':''}</small><div>${st.low?silTag('Low – refill','bad'):st.warn?silTag('Refill soon','wn'):''}${st.stale?silTag('No signal','wn'):''}${t0.fills?silTag('⬆ Refilled '+silN(t0.f)+' kg','ok'):''}</div></div></button>`}).join('');
 const D=SIL.date||Yd,rows=L.filter(s=>silC(s.id).sh).map(s=>{const sh=silC(s.id).sh,y=silDay(s.id,D)||{},m=silMade(D,silLoc(sh)),gap=m&&y.n?(num(y.f)-m)/m*100:null,bad=gap!=null&&Math.abs(gap)>5;
  return `<tr${bad?' class="bad"':''}><td>${h(s.name)}</td><td>${h(sh)}</td><td>${m?silN(m):'–'}</td><td>${y.n?(y.f?silN(y.f):'0'):'–'}</td><td>${gap==null?'–':(gap>0?'+':'')+gap.toFixed(1)+'%'}</td><td>${y.n?silN(y.u):'–'}</td></tr>`}).join('');
 return `<div class="cards">${kpi('stock','Feed in silos',silT(tot),(silSrc()===SIL.live?'● Live · ':'')+L.length+' silos · '+new Date(silSrc().at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}))}${kpi('prod','Used today',silT(uT),'so far')}${kpi('buy','Refilled today',fT?silT(fT):'–','into silos')}${kpi('flask','Low silos',nl,nl?'Plan production':'All good')}</div>
 <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:16px">${cards}</div>
 <div class="panel" style="margin-top:16px"><h3>Feed sent vs silo refilled</h3><small>Feed the mill produced for each shed compared with what the silo scale recorded as refilled. More than 5% apart is shown in red. Link silos to sheds in the layer app (Silos → Silo setup).</small>
 <div class="row" style="margin:10px 0"><label>Date<input id="sild" type="date" value="${D}" max="${T}"></label></div>
 <div class="sc" style="box-shadow:none"><table><tr><th>Silo</th><th>Shed</th><th>Produced (kg)</th><th>Silo refilled (kg)</th><th>Difference</th><th>Silo used (kg)</th></tr>${rows||'<tr><td colspan=6>No silos linked to sheds yet.</td></tr>'}</table></div></div>`}
function silDet(x){const d=SIL.date||td(),y=silDay(x.id,d)||{},st=silSt(x),loc=silLoc(st.c.sh),R=[];
 for(let i=0;i<14;i++){const dd=silAdd(d,-i),z=silDay(x.id,dd);if(z&&z.n){const m=silMade(dd,loc);R.push(`<tr><td>${dFmt(dd)}</td><td>${silN(z.o)}</td><td>${m?silN(m):'–'}</td><td>${z.f?'+'+silN(z.f):'–'}</td><td><b>${silN(z.u)}</b></td><td>${silN(z.c)}</td></tr>`)}}
 return `<button data-a="silsel" data-v="">← All silos</button>
 <div class="panel" style="margin-top:12px"><h3>${h(x.name)}${st.c.sh?' · '+h(st.c.sh):''}</h3><small>Now ${silT(x.kg)}${st.pct!=null?' ('+Math.round(st.pct)+'%)':''}${st.left!=null?' · ≈ '+st.left.toFixed(1)+' days left':''}${st.stale?' · no signal':''}</small>
 <div class="row" style="margin:10px 0"><label>Date<input id="sild" type="date" value="${d}" max="${td()}"></label></div>
 <div class="cards">${[['Opening',y.n?silT(y.o):'–'],['Refilled',y.f?'+'+silT(y.f):'–'],['Used',y.n?silT(y.u):'–'],['Closing',y.n?silT(y.c):'–']].map(([a,b])=>`<div class="card kpi"><span>${a}</span><b>${b}</b><em>&nbsp;</em></div>`).join('')}</div>${silLine(x,d)}</div>
 <div class="panel" style="margin-top:16px"><h3>Last 14 days</h3><div class="sc" style="box-shadow:none"><table><tr><th>Date</th><th>Opening</th><th>Produced (kg)</th><th>Refilled</th><th>Used</th><th>Closing</th></tr>${R.join('')||'<tr><td colspan=6>No readings.</td></tr>'}</table></div></div>`}
