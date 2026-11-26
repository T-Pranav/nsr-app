/* NSR – one bar on top of every module: Layer · Feed mill · Fleet management */
(function(){
  var here=/\/feedmill\//.test(location.pathname)?'fm':/\/vehicles\//.test(location.pathname)?'vh':'layer';
  var M={};try{M=JSON.parse(localStorage.getItem('lf-mods')||'{}')}catch(e){}
  var ta=M.lang==='ta';
  var L={layer:ta?'லேயர்':'Layer',fm:ta?'தீவன ஆலை':'Feed mill',vh:ta?'வாகன மேலாண்மை':'Fleet management'},SL={layer:L.layer,fm:L.fm,vh:ta?'வாகனம்':'Fleet'};
  var I={layer:'<circle cx="8.5" cy="7.5" r="2.6"/><path d="M6 10c-1.8 1.4-2.5 3.5-2 5.5.7 3 3.8 4.5 7 4.5 4.5 0 8-3 8-7.5 0-1.5-.4-2.7-1-3.7"/><path d="M11 9.5l2.5 1"/>',
    fm:'<path d="M12 21V8"/><path d="M12 8c-2.5 0-3.5-2-3.5-4 2.5 0 3.5 2 3.5 4zM12 8c2.5 0 3.5-2 3.5-4-2.5 0-3.5 2-3.5 4z"/><path d="M12 13c-2.5 0-3.5-2-3.5-4 2.5 0 3.5 2 3.5 4zM12 13c2.5 0 3.5-2 3.5-4-2.5 0-3.5 2-3.5 4z"/>',
    vh:'<path d="M2.5 6h11v10h-11z"/><path d="M13.5 9.5h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'};
  var href={layer:'../',fm:'../feedmill/',vh:'../vehicles/'};
  var show=['layer'];if(M.fm||here==='fm')show.push('fm');if(M.vh||here==='vh')show.push('vh');
  var css='#nsrMods{position:sticky;top:0;z-index:60;height:46px;box-sizing:border-box;display:flex;align-items:center;gap:14px;padding:0 max(2vw,12px);background:#10243b;color:#e8eef6;font:700 12.5px Manrope,"Noto Sans Tamil",system-ui,sans-serif;box-shadow:inset 0 -3px 0 0 transparent}'+
    '#nsrMods::after{content:"";position:absolute;left:0;bottom:0;width:120px;height:3px;background:#c8283a}'+
    '#nsrMods .b{font-weight:800;letter-spacing:.06em;color:#fff;white-space:nowrap}#nsrMods .b small{font-weight:600;letter-spacing:0;color:#9fb3c8;margin-left:6px}'+
    '#nsrMods .s{display:inline-flex;gap:2px;padding:3px;border-radius:9px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}'+
    '#nsrMods a{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:6px;color:#cdd9e7;text-decoration:none;white-space:nowrap}'+
    '#nsrMods a:hover{background:rgba(255,255,255,.08);color:#fff}#nsrMods a.on{background:#fff;color:#10243b}'+
    '#nsrMods svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'+
    '#nsrMods .sl{display:none}@media(max-width:860px){#nsrMods .ll{display:none!important}#nsrMods .sl{display:inline!important}}@media(max-width:699px){#nsrMods .b small{display:none}#nsrMods a{padding:5px 8px}#nsrMods a span{display:none}#nsrMods a.on span{display:inline}}'+
    '@media(min-width:861px){.side{top:46px!important;height:calc(100vh - 46px)!important}}@media print{#nsrMods{display:none}}'+
    /* phones: the switcher sits at the bottom, within thumb reach, above the page menu */
    '@media(max-width:860px){#nsrMods{position:fixed;top:auto;bottom:0;left:0;right:0;height:auto;padding:6px 8px calc(6px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 14px rgba(0,0,0,.18)}'+
    '#nsrMods::after{display:none}#nsrMods .b{display:none}#nsrMods .s{flex:1;display:flex}#nsrMods a{flex:1;justify-content:center;padding:8px 4px;min-width:0;font-size:12px}'+
    '#nsrMods a span,#nsrMods a.on span{display:inline;overflow:hidden;text-overflow:ellipsis}body{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))!important}}';
  if(here==='fm')css+='@media(max-width:860px){.side{bottom:calc(48px + env(safe-area-inset-bottom,0px))!important;padding-bottom:6px!important;overflow-x:auto;justify-content:flex-start!important;scrollbar-width:none}.side::-webkit-scrollbar{display:none}'+
    '.side .ni{flex:0 0 68px!important;min-width:68px!important}.side .ni span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64px}main{padding-bottom:150px!important}.fmmob{display:none!important}}'+
    '@media(min-width:861px){.side a.btn[href="../"]{display:none!important}}';
  /* same corporate colours in every module */
  var FMV='--bg:#eef1f5;--sf2:#f5f7fa;--ink:#16202c;--mu:#5b6878;--bd:#dfe4eb;--bd2:#c9d2dd;--ac:#1d3a5c;--ac2:#3d6593;--brn:#1d3a5c;--gold:#3d6593;--okbg:#e6f2ea';
  if(here==='fm')css+='@media(prefers-color-scheme:light){:root:not([data-theme=dark]){'+FMV+'}}:root[data-theme=light]{'+FMV+'}'+
    'h1,h2,h3,.ph h1{font-family:Manrope,Inter,"Segoe UI",system-ui,sans-serif!important;letter-spacing:-.2px}';
  if(here==='vh')css+=':root{--bar:light-dark(#10243b,#0a1624);--bg:light-dark(#eef1f5,#0d151f);--panel:light-dark(#fff,#152131);--rule:light-dark(#dfe4eb,#26374b);--ink:light-dark(#16202c,#e6edf5);--mute:light-dark(#5b6878,#9aa9ba);--brick:light-dark(#c8283a,#ef6a72)}'+
    'header.band{padding-top:22px!important;padding-bottom:22px!important}header .back{display:none}header h1{font-size:clamp(22px,3vw,30px)!important}';
  function go(){if(document.getElementById('nsrMods'))return;
    var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
    var d=document.createElement('div');d.id='nsrMods';
    d.innerHTML='<span class="b">NSR<small>Poultry Farms</small></span><span class="s">'+show.map(function(k){return '<a href="'+href[k]+'" class="'+(k===here?'on':'')+'"><svg viewBox="0 0 24 24">'+I[k]+'</svg><span class="ll">'+L[k]+'</span><span class="sl">'+SL[k]+'</span></a>'}).join('')+'</span>';
    document.body.insertBefore(d,document.body.firstChild)}
  if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
