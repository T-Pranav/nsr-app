/* NSR – one bar on top of every module: Layer · Feed mill · Fleet management */
(function(){
  var here=/\/feedmill\//.test(location.pathname)?'fm':/\/vehicles\//.test(location.pathname)?'vh':'layer';
  var M={};try{M=JSON.parse(localStorage.getItem('lf-mods')||'{}')}catch(e){}
  var ta=M.lang==='ta';
  var A={navy:['#10243b','#1d3a5c','#3d6593','#eaf0f7','#e4e4e6'],charcoal:['#1c1f24','#2b2f36','#4a505a','#eceef1','#e4e4e6'],forest:['#143d28','#1f5b3a','#3a7d56','#e7f2eb','#7fcf9a'],maroon:['#4a121a','#7a1f2b','#9e3a46','#f6e9eb','#ec8f98'],classic:['#3a2617','#6b4a31','#c6955a','#f3e7d6','#e3c393']};
  var mode='auto',acc='navy';try{mode=localStorage.getItem('lf-theme')||'auto';acc=localStorage.getItem('lf-accent')||'navy'}catch(e){}if(!A[acc])acc='navy';
  var dark=mode==='dark'||(mode==='auto'&&window.matchMedia&&matchMedia('(prefers-color-scheme:dark)').matches),C=A[acc],CL=acc==='classic',BAR=dark?(CL?'#0f0a07':'#0b0b0c'):C[0];
  if(mode==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=mode;
  document.documentElement.style.colorScheme=dark?'dark':'light';
  try{var tm=document.querySelector('meta[name=theme-color]');if(tm)tm.content=BAR}catch(e){}
  var L={layer:ta?'லேயர்':'Layer',fm:ta?'தீவன ஆலை':'Feed mill',vh:ta?'வாகன மேலாண்மை':'Fleet management'},SL={layer:L.layer,fm:L.fm,vh:ta?'வாகனம்':'Fleet'};
  var I={layer:'<circle cx="8.5" cy="7.5" r="2.6"/><path d="M6 10c-1.8 1.4-2.5 3.5-2 5.5.7 3 3.8 4.5 7 4.5 4.5 0 8-3 8-7.5 0-1.5-.4-2.7-1-3.7"/><path d="M11 9.5l2.5 1"/>',
    fm:'<path d="M12 21V8"/><path d="M12 8c-2.5 0-3.5-2-3.5-4 2.5 0 3.5 2 3.5 4zM12 8c2.5 0 3.5-2 3.5-4-2.5 0-3.5 2-3.5 4z"/><path d="M12 13c-2.5 0-3.5-2-3.5-4 2.5 0 3.5 2 3.5 4zM12 13c2.5 0 3.5-2 3.5-4-2.5 0-3.5 2-3.5 4z"/>',
    vh:'<path d="M2.5 6h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'};
  var href={layer:'../',fm:'../feedmill/',vh:'../vehicles/'};
  var show=['layer'];if(M.fm||here==='fm')show.push('fm');if(M.vh||here==='vh')show.push('vh');
  var css='#nsrMods{position:sticky;top:0;z-index:60;height:46px;box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:0 max(2vw,12px);background:'+BAR+';color:#e8eef6;font:700 12.5px Manrope,"Noto Sans Tamil",system-ui,sans-serif;box-shadow:inset 0 -3px 0 0 transparent}'+
    '#nsrMods::after{content:"";position:absolute;left:0;bottom:0;width:120px;height:3px;background:#c8283a}'+
    '#nsrMods .b{font-weight:800;letter-spacing:.06em;color:#fff;white-space:nowrap}#nsrMods .b small{font-weight:600;letter-spacing:0;color:#9fb3c8;margin-left:6px}'+
    '#nsrMods .s{display:inline-flex;gap:2px;padding:3px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}'+
    '#nsrMods a{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:6px;color:#cdd9e7;text-decoration:none;white-space:nowrap}'+
    '#nsrMods a:hover{background:rgba(255,255,255,.08);color:#fff}#nsrMods a.on{background:#fff;color:'+BAR+'}'+
    '#nsrMods svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'+
    '#nsrMods .sl{display:none}@media(max-width:860px){#nsrMods .ll{display:none!important}#nsrMods .sl{display:inline!important}}@media(max-width:699px){#nsrMods .b small{display:none}#nsrMods a{padding:5px 8px}#nsrMods a span{display:none}#nsrMods a.on span{display:inline}}'+
    '@media(min-width:861px){.side{top:46px!important;height:calc(100vh - 46px)!important}}@media print{#nsrMods{display:none}}'+
    '#nsrMods .th{margin-left:auto;width:34px;height:34px;flex:0 0 34px;display:inline-flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);color:#e8eef6;padding:0;cursor:pointer}'+
    '#nsrMods .th svg{width:18px;height:18px}'+
    '#nsrTh{position:fixed;z-index:80;right:12px;top:54px;width:min(320px,calc(100vw - 24px));background:'+(dark?'#1c1d20':'#fff')+';color:'+(dark?'#ececed':'#16202c')+';border:1px solid '+(dark?'#2f3136':'#dfe4eb')+';border-radius:12px;padding:12px;box-shadow:0 12px 30px rgba(0,0,0,.25);font:600 13px Manrope,"Noto Sans Tamil",system-ui,sans-serif}'+
    '#nsrTh .r{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}#nsrTh .g{display:grid;grid-template-columns:1fr 1fr}'+
    '#nsrTh button{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:8px;border:1px solid '+(dark?'#2f3136':'#dfe4eb')+';background:transparent;color:inherit;font:inherit;cursor:pointer}'+
    '#nsrTh button.on{box-shadow:0 0 0 2px '+(dark?C[4]:C[1])+' inset}#nsrTh i{width:16px;height:16px;border-radius:50%;flex:0 0 16px}'+
    '@media(max-width:860px){#nsrTh{top:auto;bottom:calc(64px + env(safe-area-inset-bottom,0px))}#nsrMods .th{margin-left:4px}}'+
    /* phones: the switcher sits at the bottom, within thumb reach, above the page menu */
    '@media(max-width:860px){#nsrMods{position:fixed;top:auto;bottom:0;left:0;right:0;height:auto;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 14px rgba(0,0,0,.18)}'+
    '#nsrMods::after{display:none}#nsrMods .b{display:none}#nsrMods .s{flex:1;display:flex}#nsrMods a{flex:1;justify-content:center;padding:8px 4px;min-width:0;font-size:12px}'+
    '#nsrMods a span,#nsrMods a.on span{display:inline;overflow:hidden;text-overflow:ellipsis}body{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))!important}}';
  if(here==='fm')css+='@media(max-width:860px){.side{bottom:calc(48px + env(safe-area-inset-bottom,0px))!important;padding-bottom:6px!important;overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}.side::-webkit-scrollbar{display:none}'+
    '.side .ni{flex:0 0 68px!important;min-width:68px!important}.side .ni span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64px}main{padding-bottom:150px!important}.fmmob{display:none!important}}'+
    '@media(min-width:861px){.side a.btn[href="../"]{display:none!important}}';
  /* same corporate colours in every module */
  var FMV=(CL?'--bg:#f6efe4;--sf:#fffdf9;--sf2:#f4ebdd;--ink:#2b1d12;--mu:#5e4a38;--bd:#e6d8c4;--bd2:#d6c3a8;':'--bg:#eef1f5;--sf:#fff;--sf2:#f5f7fa;--ink:#111a24;--mu:#44505e;--bd:#dfe4eb;--bd2:#c9d2dd;')+'--ac:'+C[1]+';--ac2:'+C[2]+';--br:'+C[1]+';--br2:'+C[2]+';--brbg:'+C[3]+';--brt:'+C[1]+';--brn:'+C[1]+';--gold:'+C[2]+';--okbg:#e6f2ea';
  var FMD=(CL?'--bg:#15100c;--sf:#1f1813;--sf2:#271e17;--ink:#f5f0ea;--mu:#cbbfb2;--bd:#3a2f26;--bd2:#4a3d31;':'--bg:#121314;--sf:#1c1d20;--sf2:#232428;--ink:#f1f1f2;--mu:#bfc1c6;--bd:#2f3136;--bd2:#3a3c42;')+'--ac:'+C[4]+';--ac2:'+C[4]+';--br:'+C[4]+';--br2:'+C[4]+';--brbg:#2a2b2f;--brt:'+C[4]+';--brn:'+C[4]+';--gold:'+C[4]+';--okbg:#1d2a22';
  if(here==='fm')css+='@media(prefers-color-scheme:dark){:root:not([data-theme=light]){'+FMD+'}}:root[data-theme=dark]{'+FMD+'}';
  if(here==='fm')css+='@media(prefers-color-scheme:light){:root:not([data-theme=dark]){'+FMV+'}}:root[data-theme=light]{'+FMV+'}'+
    'h1,h2,h3,.ph h1{font-family:Manrope,Inter,"Segoe UI",system-ui,sans-serif!important;letter-spacing:-.2px}'+
    /* readability: larger base text, clearer muted text, active menu item always readable */
    'body{font-size:15px;-webkit-font-smoothing:antialiased}small,.panel small{font-size:13.5px;color:var(--mu);line-height:1.45}td,th{font-size:14px}th{color:var(--mu)}'+
    'button.ni,.ni{color:var(--ink);font-weight:600}button.ni.on,button.ni.on:hover,:root[data-theme=dark] button.ni.on,:root:not([data-theme=light]) button.ni.on{color:var(--brt)!important;background:var(--brbg)!important;font-weight:700}'+
    ':root[data-theme=dark] button.ni.on svg,:root:not([data-theme=light]) button.ni.on svg{stroke:var(--brt)}'+
    '@media(prefers-color-scheme:dark){:root:not([data-theme=light]) button.ni.on{background:#33353a!important}}:root[data-theme=dark] button.ni.on{background:#33353a!important}';
  if(here==='vh')css+=':root{--bar:light-dark('+C[0]+','+(CL?'#0f0a07':'#0b0b0c')+');'+(CL?'--bg:light-dark(#f6efe4,#15100c);--panel:light-dark(#fffdf9,#1f1813);--rule:light-dark(#e6d8c4,#3a2f26);--ink:light-dark(#2b1d12,#f1ebe4);--mute:light-dark(#7a6450,#b3a597);':'--bg:light-dark(#eef1f5,#121314);--panel:light-dark(#fff,#1c1d20);--rule:light-dark(#dfe4eb,#2f3136);--ink:light-dark(#16202c,#ececed);--mute:light-dark(#5b6878,#a4a6ab);')+'--brick:light-dark(#c8283a,#ef6a72)}'+
    ':root{--pri:light-dark('+C[1]+','+C[4]+');--pri-ink:light-dark(#fff,'+(CL?'#1b120b':'#121314')+');--pri-soft:light-dark('+C[3]+','+(CL?'#2e2318':'#2a2b2f')+');--th:light-dark('+(CL?'#f4ebdd':'#f5f7fa')+','+(CL?'#271e17':'#232428')+')}';
  function go(){if(document.getElementById('nsrMods'))return;
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var d=document.createElement('div');d.id='nsrMods';
    d.innerHTML='<span class="b">NSR<small>Poultry Farms</small></span><span class="s">'+show.map(function(k){return '<a href="'+href[k]+'" class="'+(k===here?'on':'')+'"><svg viewBox="0 0 24 24">'+I[k]+'</svg><span class="ll">'+L[k]+'</span><span class="sl">'+SL[k]+'</span></a>'}).join('')+'</span>';
    var tb=document.createElement('button');tb.className='th';tb.type='button';tb.title=ta?'தீம்':'Theme';
    tb.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7.2" r="1.1"/><circle cx="14.5" cy="7.2" r="1.1"/></svg>';
    tb.onclick=function(){var x=document.getElementById('nsrTh');if(x){x.remove();return}var pn=document.createElement('div');pn.id='nsrTh';
      var md=[['light',ta?'☀️ வெளிச்சம்':'☀️ Light'],['dark',ta?'🌙 இருள்':'🌙 Dark'],['auto',ta?'📱 தானியங்கி':'📱 Auto']],
          an={navy:ta?'கடல் நீலம்':'Navy',charcoal:ta?'கரி சாம்பல்':'Charcoal',forest:ta?'பச்சை':'Forest green',maroon:ta?'மெரூன்':'Maroon',classic:ta?'பழுப்பு & தங்கம்':'Classic brown & gold'};
      pn.innerHTML='<b>'+(ta?'தீம்':'Theme')+'</b><div class="r">'+md.map(function(m){return '<button data-m="'+m[0]+'" class="'+(mode===m[0]?'on':'')+'">'+m[1]+'</button>'}).join('')+'</div><div class="r g">'+
        Object.keys(A).map(function(k){return '<button data-c="'+k+'" class="'+(acc===k?'on':'')+'" style="'+(k==='classic'?'grid-column:1/-1':'')+'"><i style="background:'+(k==='classic'?'linear-gradient(135deg,#6b4a31 50%,#e3c393 50%)':A[k][1])+'"></i>'+an[k]+'</button>'}).join('')+'</div>';
      pn.onclick=function(e){var b=e.target.closest('button');if(!b)return;try{if(b.dataset.m)localStorage.setItem('lf-theme',b.dataset.m);if(b.dataset.c)localStorage.setItem('lf-accent',b.dataset.c)}catch(_){}location.reload()};
      document.body.appendChild(pn)};
    d.appendChild(tb);
    document.body.insertBefore(d,document.body.firstChild)}
  if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
