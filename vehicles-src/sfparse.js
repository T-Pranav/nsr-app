/* BPCL SmartFleet account statement (PDF) → fuel fills. Works on pdf.js text items, page by page.
   Rows start at the Sl.No number in the left margin; the rest of the row follows in the PDF's own order. */
function sfParse(pages){
  const out={period:'',account:'',cards:{},fills:[],recharges:[],skipped:0};
  for(const items of pages){
    const it=items.map(i=>({s:String(i.str||'').trim(),x:i.transform[4],y:i.transform[5]})).filter(i=>i.s);
    const all=it.map(i=>i.s).join(' ');
    if(!out.period){const m=all.match(/(\d{1,2} [A-Z][a-z]{2} \d{4}\s*-\s*\d{1,2} [A-Z][a-z]{2} \d{4})/);if(m)out.period=m[1]}
    if(!out.account){const m=all.match(/\b(FA\d{6,})\b/);if(m)out.account=m[1]}
    const rows=[];let cur=null;
    for(const i of it){
      if(i.x<62&&/^\d{1,4}$/.test(i.s)){cur={n:+i.s,t:[]};rows.push(cur);continue}
      if(/^\d+\/\d+$/.test(i.s)&&i.y<60)continue;               /* page number */
      if(cur)cur.t.push(i.s)}
    for(const r of rows){
      const t=r.t.join(' ').replace(/\s+/g,' ');
      const d=t.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}) ?([AP]M)/);
      if(!d){ /* card summary row: name, card number, vehicle number, sales… */
        const c=t.match(/(FC\d{8,12})\s+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4})\b/);
        if(c)out.cards[c[1]]=c[2].replace(/\s/g,'');continue}
      let h=+d[4]%12;if(d[6]==='PM')h+=12;
      const date=`${d[3]}-${d[2]}-${d[1]}`,time=`${String(h).padStart(2,'0')}:${d[5]}`;
      const rest=t.slice(d[0].length).trim(),type=(rest.match(/^([A-Z]+)/)||[])[1]||'';
      const nums=(rest.match(/(?:CMS|CARD|REWARD|WALLET|CREDIT)\s+((?:\d[\d.]*\s*)+)/)||[])[1];
      const amts=nums?nums.trim().split(/\s+/).map(Number):[];
      if(type==='RECHARGE'){out.recharges.push({date,time,amount:amts[0]||0,via:rest.replace(/^RECHARGE\s*/,'').replace(/\s*(CMS|CARD).*$/,'')});continue}
      if(type!=='SALE'){out.skipped++;continue}
      const card=(rest.match(/FC\d{8,12}/)||[])[0]||'',reg=((rest.match(/SALE\s+([A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4})\s*\|/)||[])[1]||'').replace(/\s/g,'');
      /* product is the last word before "| litres"; the bunk is everything between "At" and the product */
      const pv=rest.match(/FC\d{8,12}\s+At\s+(.*)\s+([A-Za-z][A-Za-z-]*)\s*\|\s*([\d.]+)\s+(?:CMS|CARD|REWARD|WALLET|CREDIT)/);
      const st=pv?pv[1]:'';
      /* amounts: purchase [tcs] total petromiles */
      const total=amts.length>=3?amts[amts.length-2]:amts[0]||0,pm=amts.length>=3?amts[amts.length-1]:0;
      out.fills.push({date,time,card,reg,product:pv?pv[2]:'',litres:pv?+pv[3]:0,amount:total,petromiles:pm,station:st.replace(/\s+/g,' ').replace(/,$/,'').trim(),src:'SmartFleet'})}
  }
  for(const f of out.fills)if(!f.reg&&out.cards[f.card])f.reg=out.cards[f.card];
  return out;
}
if(typeof module!=='undefined')module.exports={sfParse};
