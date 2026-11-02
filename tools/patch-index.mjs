import fs from "node:fs";

const src = fs.readFileSync("/tmp/vr/index.html", "utf8");
let html = src;

function swap(old, next, label) {
  if (!html.includes(old)) {
    console.error("MISSING:", label);
    process.exit(1);
  }
  html = html.replace(old, next);
}

swap(
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n<meta name="theme-color" content="#1A1A1A">\n<title>Varmint Ridge - JW Manor</title>',
  `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#1A1A1A">
<meta name="color-scheme" content="dark light">
<meta name="description" content="A family garden defense from JW Manor. All ages. No ads.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Varmint Ridge">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<title>Varmint Ridge - JW Manor</title>`,
  "head",
);

swap(
  "document.documentElement.setAttribute('data-theme',t);var b=document.getElementById('themeBtn');",
  "document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',t==='dark'?'#1A1A1A':'#F3E6C4');var b=document.getElementById('themeBtn');",
  "theme-color",
);

swap(
  "#themeBtn{position:fixed;top:calc(6px + env(safe-area-inset-top));right:6px;z-index:9999;font:600 12px Georgia,serif;padding:5px 9px;margin:0;min-width:0;min-height:0;border-radius:99px;border:1px solid rgba(193,154,80,.8);background:rgba(26,26,26,.75);color:#F3E6C4;cursor:pointer;box-shadow:none}html[data-theme=light] #themeBtn{background:rgba(255,252,242,.92);color:#305032;border-color:#305032}\n</style>",
  `#themeBtn{position:fixed;top:calc(6px + env(safe-area-inset-top));right:calc(6px + env(safe-area-inset-right));z-index:9999;font:600 12px Georgia,serif;padding:8px 12px;margin:0;min-width:44px;min-height:44px;border-radius:99px;border:1px solid rgba(193,154,80,.8);background:rgba(26,26,26,.75);color:#F3E6C4;cursor:pointer;box-shadow:none;touch-action:manipulation}html[data-theme=light] #themeBtn{background:rgba(255,252,242,.92);color:#305032;border-color:#305032}
html,body{overscroll-behavior:none}
#app{padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
#bar{width:min(100%,520px);margin-top:6px;padding:0 6px 2px;box-sizing:border-box}
.card{flex:1 1 0;min-width:0;min-height:56px;padding:8px 4px 6px;touch-action:manipulation}
.card .nm{display:block;font-size:11px;line-height:1.05}
.btn,.lv button,#towerMenu .btn{touch-action:manipulation}
.btn{min-height:44px}
a.quiet{color:var(--gold);text-decoration:none}
html[data-theme=light] a.quiet{color:#305032}
@media (pointer:coarse){.card{min-height:60px}#towerMenu .btn{min-height:44px;padding:10px 12px}}
@media (max-width:360px){.card .nm{font-size:10px}h1{font-size:36px}}
</style>`,
  "css",
);

swap(
  `   <button class="btn" id="bPlay">Play</button>
   <button class="btn" id="bCont" style="display:none">Continue</button>`,
  `   <button class="btn" id="bPlay">Play</button>
   <button class="btn alt" id="bDaily">Today's Ridge</button>
   <p class="small" id="dailyBlurb" style="margin:2px 16px 8px"></p>
   <button class="btn" id="bCont" style="display:none">Continue</button>`,
  "daily-button",
);

swap(
  `<p class="small" style="margin-top:14px">Best: <span id="tBest">0</span> &middot; East Texas, JW Manor Homestead</p>`,
  `<p class="small" style="margin-top:14px">Best: <span id="tBest">0</span> &middot; East Texas, JW Manor Homestead</p>
   <p class="small">All ages &middot; No ads &middot; <a class="quiet" href="privacy.html">Privacy</a></p>`,
  "footer",
);

swap(
  `function layout(){dpr=Math.min(window.devicePixelRatio||1,2.5);const barH=86,aw=innerWidth-8,ah=innerHeight-barH-12;scale=Math.max(.4,Math.min(aw/W,ah/H,2));const cw=Math.floor(W*scale),ch=Math.floor(H*scale);cv.style.width=cw+'px';cv.style.height=ch+'px';cv.width=Math.floor(cw*dpr);cv.height=Math.floor(ch*dpr);$('stage').style.width=cw+'px';$('stage').style.height=ch+'px';bgCache=null;placeMenu()}
addEventListener('resize',layout);`,
  `function layout(){dpr=Math.min(window.devicePixelRatio||1,2);const app=$('app'),cs=getComputedStyle(app);const padT=parseFloat(cs.paddingTop)||0,padB=parseFloat(cs.paddingBottom)||0,padL=parseFloat(cs.paddingLeft)||0,padR=parseFloat(cs.paddingRight)||0;const barEl=$('bar');const barShown=barEl&&barEl.style.visibility!=='hidden';const barH=barShown?barEl.offsetHeight+8:0;const aw=Math.max(160,innerWidth-padL-padR-8),ah=Math.max(220,innerHeight-padT-padB-barH-4);scale=Math.max(.35,Math.min(aw/W,ah/H,2));const cw=Math.floor(W*scale),ch=Math.floor(H*scale);cv.style.width=cw+'px';cv.style.height=ch+'px';cv.width=Math.floor(cw*dpr);cv.height=Math.floor(ch*dpr);$('stage').style.width=cw+'px';$('stage').style.height=ch+'px';bgCache=null;placeMenu()}
addEventListener('resize',layout);if(window.visualViewport)visualViewport.addEventListener('resize',layout);`,
  "layout",
);

swap(
  `if(S.crops.every(c=>c.hp<=0)){end(false);return}`,
  `if(S.dailyRule==='clean'&&S.crops.some(c=>c.hp<=0)){end(false);return}
 if(S.crops.every(c=>c.hp<=0)){end(false);return}`,
  "clean-rule",
);

swap(
  `if(S.wave>=10){end(true);return}`,
  `if(S.wave>=10||S.dailyStop){end(true);return}`,
  "daily-stop",
);

swap(
  `if(S.score>LS.get('best',0))LS.set('best',S.score);`,
  `if(S.score>LS.get('best',0))LS.set('best',S.score);publishWidget();`,
  "publish-on-end",
);

swap(
  `function save(){if(S&&S.phase==='build')LS.set('save',{wave:S.wave,coins:S.coins,score:S.score,fence:S.fence,zeus:S.zeus,kills:S.kills,lost:S.lost,crops:S.crops.map(c=>c.hp),towers:S.towers.map(t=>({type:t.type,x:t.x,y:t.y,lv:t.lv,spent:t.spent}))})}`,
  `function save(){if(S&&S.phase==='build')LS.set('save',{wave:S.wave,coins:S.coins,score:S.score,fence:S.fence,zeus:S.zeus,kills:S.kills,lost:S.lost,crops:S.crops.map(c=>c.hp),towers:S.towers.map(t=>({type:t.type,x:t.x,y:t.y,lv:t.lv,spent:t.spent})),only:S.only||'',dailyRule:S.dailyRule||'',dailyStop:!!S.dailyStop,dailyTitle:S.dailyTitle||''})}`,
  "save",
);

swap(
  `function load(){const d=LS.get('save',null);if(!d)return false;newState(d.wave);S.coins=d.coins;S.score=d.score;S.fence=d.fence;S.zeus=d.zeus;S.kills=d.kills||0;S.lost=d.lost||0;d.crops.forEach((h,i)=>S.crops[i].hp=h);S.towers=d.towers.map(t=>({...t,cdLeft:0,kick:0}));return true}`,
  `function load(){const d=LS.get('save',null);if(!d)return false;newState(d.wave);S.coins=d.coins;S.score=d.score;S.fence=d.fence;S.zeus=d.zeus;S.kills=d.kills||0;S.lost=d.lost||0;d.crops.forEach((h,i)=>S.crops[i].hp=h);S.towers=d.towers.map(t=>({...t,cdLeft:0,kick:0}));S.only=d.only||'';S.dailyRule=d.dailyRule||'';S.dailyStop=!!d.dailyStop;S.dailyTitle=d.dailyTitle||'';if(S.only)sel=S.only;return true}`,
  "load",
);

swap(
  ` if(p.y<44&&p.x>W-96){if(p.x>W-48)pause();else toggleFast();return}
 if(p.y<44&&p.x>130&&p.x<270&&S.phase==='build'){startWave();return}
 const hit=S.towers.find(t=>Math.hypot(t.x-p.x,t.y-8-p.y)<20);`,
  ` if(p.y<64&&p.x>W-112){if(p.x>W-54)pause();else toggleFast();return}
 if(p.y<64&&p.x>118&&p.x<282&&S.phase==='build'){startWave();return}
 if(S.only&&sel!==S.only)sel=S.only;
 const hit=S.towers.find(t=>Math.hypot(t.x-p.x,t.y-8-p.y)<(e.pointerType==='mouse'?22:34));`,
  "hits",
);

swap(
  `b.insertAdjacentHTML('beforeend','<div>'+TOWERS[k].name+'</div><div class="c">'+TOWERS[k].cost+' coins</div>');b.onclick=()=>pick(k);bar.appendChild(b);cards[k]={b,c}});`,
  `b.title=TOWERS[k].name;b.setAttribute('role','button');b.insertAdjacentHTML('beforeend','<div class="nm">'+(k==='trap'?'Trap':TOWERS[k].name)+'</div><div class="c">'+TOWERS[k].cost+'</div>');b.onclick=()=>pick(k);bar.appendChild(b);cards[k]={b,c}});`,
  "cards",
);

swap(
  `goCard.innerHTML='<div style="font-size:20px">&#9654;</div><div id="goTxt">Start</div><div class="c">Space</div>';`,
  `goCard.innerHTML='<div style="font-size:20px;line-height:1">&#9654;</div><div class="nm" id="goTxt">Start</div><div class="c">wave</div>';goCard.setAttribute('role','button');`,
  "gocard",
);

swap(
  `shopCard.innerHTML='<div style="font-size:20px">&#9874;</div><div>Upgrades</div><div class="c">build only</div>';`,
  `shopCard.innerHTML='<div style="font-size:20px;line-height:1">&#9874;</div><div class="nm">Shop</div><div class="c">build</div>';shopCard.setAttribute('role','button');shopCard.title='Homestead upgrades';`,
  "shopcard",
);

swap(
  `function pick(k){sel=k;selTower=null;placeMenu();ui()}`,
  `function pick(k){if(S&&S.only&&k!==S.only){SFX.deny();floatTxt(200,320,'Today: '+TOWERS[S.only].name+' only','#ffb0a0');return}sel=k;selTower=null;placeMenu();ui()}`,
  "pick",
);

swap(
  `function ui(){Object.keys(cards).forEach(k=>{cards[k].b.classList.toggle('sel',k===sel);cards[k].b.classList.toggle('poor',!!S&&S.coins<TOWERS[k].cost)});`,
  `function ui(){Object.keys(cards).forEach(k=>{const locked=!!(S&&S.only&&S.only!==k);cards[k].b.classList.toggle('sel',k===sel);cards[k].b.classList.toggle('poor',!!S&&(S.coins<TOWERS[k].cost||locked));cards[k].b.style.pointerEvents=locked?'none':''});`,
  "ui",
);

swap(
  `function toTitle(){S=null;$('bar').style.visibility='hidden';bgCache=null;selTower=null;placeMenu();$('bCont').style.display=LS.get('save',null)?'':'none';$('tBest').textContent=LS.get('best',0);show('sTitle');ui()}`,
  `function toTitle(){S=null;$('bar').style.visibility='hidden';bgCache=null;selTower=null;placeMenu();$('bCont').style.display=LS.get('save',null)?'':'none';$('tBest').textContent=LS.get('best',0);paintDaily();show('sTitle');ui();layout();publishWidget()}`,
  "toTitle",
);

swap(
  `function begin(w){audio();selTower=null;placeMenu();$('bar').style.visibility='visible';newState(w);bgCache=null;speed=1;hideAll();fx.length=floats.length=bolts.length=rings.length=0;S.banner={txt:'Wave '+S.wave+': set up your defenses',t:2.5};ui()}`,
  `function begin(w){audio();selTower=null;placeMenu();$('bar').style.visibility='visible';newState(w);S.only='';S.dailyRule='';S.dailyStop=false;S.dailyTitle='';bgCache=null;speed=1;hideAll();fx.length=floats.length=bolts.length=rings.length=0;S.banner={txt:'Wave '+S.wave+': set up your defenses',t:2.5};ui();layout()}`,
  "begin",
);

swap(
  `$('bPlay').onclick=()=>begin(1);`,
  `$('bPlay').onclick=()=>begin(1);$('bDaily').onclick=()=>beginDaily();`,
  "daily-click",
);

const block = `
/* ---------- Today's Ridge + home-screen widget snapshot ---------- */
const RIDGE_CRITTERS=[
 {id:'raccoon',name:'Raccoon',line:'Steals a crop and runs. Catch it before it gets away.'},
 {id:'crow',name:'Crow',line:'Flies right over the fence. Scarecrows and lanterns watch the sky.'},
 {id:'armadillo',name:'Armadillo',line:'Digs under the rail. Snap traps still bite while it digs.'},
 {id:'possum',name:'Possum',line:'Plays dead once. Wait it out, then it gets back up.'},
 {id:'boss',name:'Bandit King',line:'The wave 10 boss. The gang shows up twice as his health drops.'}
];
const RIDGE_DAILIES=[
 {title:'Straw Only',blurb:'Clear this wave with scarecrows only.',rule:'only:scarecrow'},
 {title:'Lantern Watch',blurb:'Lanterns only. Fliers take the extra hit.',rule:'only:lantern'},
 {title:'Snap Line',blurb:'Snap traps only. Keep an eye on the crows.',rule:'only:trap'},
 {title:'Lean Purse',blurb:'Start with 70 coins and make them count.',rule:'coins:70'},
 {title:'Zeus on Duty',blurb:'Zeus starts at level 1 and chases the closest critter.',rule:'zeus:1'},
 {title:'Clean Beds',blurb:'Lose one crop bed and the challenge ends.',rule:'clean'}
];
function ridgeFnv(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
function ridgeDayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function ridgeToday(d){d=d||new Date();const key=ridgeDayKey(d),h=ridgeFnv('jwmanor-vr-'+key);const varmint=h%5,daily=(h>>>8)%6,wave=1+((h>>>16)%6);return{key,h,varmint,daily,wave,critter:RIDGE_CRITTERS[varmint],challenge:RIDGE_DAILIES[daily],waveName:WAVES[wave-1].name}}
function paintDaily(){const pack=ridgeToday(),el=$('dailyBlurb');if(el)el.textContent='Today\\'s varmint: '+pack.critter.name+'. '+pack.challenge.title+' \\u00b7 wave '+pack.wave+' ('+pack.waveName+').'}
function beginDaily(){const pack=ridgeToday();begin(pack.wave);S.dailyStop=true;S.dailyTitle=pack.challenge.title;S.dailyRule=pack.challenge.rule;if(pack.challenge.rule.indexOf('only:')===0){S.only=pack.challenge.rule.slice(5);sel=S.only}if(pack.challenge.rule==='coins:70')S.coins=70;if(pack.challenge.rule==='zeus:1')S.zeus=1;S.banner={txt:pack.challenge.title+' \\u00b7 Wave '+pack.wave,t:3.2};ui();publishWidget()}
function publishWidget(){const pack=ridgeToday();const snap={best:LS.get('best',0)|0,initials:LS.get('ini','')||'',reach:LS.get('reach',1)|0,theme:document.documentElement.getAttribute('data-theme')||'dark'};LS.set('widget',Object.assign({day:pack.key,varmint:pack.critter.name,daily:pack.challenge.title,wave:pack.wave},snap));try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify({type:'vr-widget',snap:snap}))}catch(e){}}
function promptDaily(){if(S)return;const b=$('bDaily');if(b){b.style.boxShadow='0 0 0 3px #ffe39a';b.focus()}}

`;

swap("/* ---------- Supporter Store (native IAP, OFF by default) ---------- */", block + "/* ---------- Supporter Store (native IAP, OFF by default) ---------- */", "daily-fns");

const storeOld = `let gateAns=0;
function storeMsg(m,ok){$('storeNote').innerHTML='<span style="color:'+(ok?'#9be27a':'#ffb0a0')+'">'+m+'</span>'}
$('bStore').onclick=()=>{back='sTitle';const a=Math.floor(rnd(12,20)),b=Math.floor(rnd(6,10));gateAns=a*b;$('gateQ').textContent='What is '+a+' × '+b+'?';$('gateA').value='';$('gateMsg').textContent='';$('gate').style.display='';$('storeItems').style.display='none';
 const owned=[];if(LS.get('pass',false))owned.push('Ridge Pass');if(LS.get('bank',0))owned.push(LS.get('bank',0)+' coins waiting for your next game');$('storeNote').textContent=owned.length?'Owned: '+owned.join(', '):'';show('sStore')};
$('gateGo').onclick=()=>{if(parseInt($('gateA').value,10)!==gateAns){$('gateMsg').textContent='Not quite. Ask a grown-up for help.';$('gateA').value='';return}
 $('gate').style.display='none';const box=$('storeItems');box.style.display='';
 if(!IAP.available()){box.innerHTML='<p class="small">The store isn\\'t open yet. Thanks for wanting to support JW Manor games!</p>';return}
 box.innerHTML=IAP.products.map(p=>'<div class="row"><span><b>'+p.name+'</b> '+p.price+'<br><span class="small">'+p.desc+'</span></span><button class="btn sm" data-sku="'+p.sku+'">Buy</button></div>').join('')+'<button class="btn alt sm" id="bRestore">Restore Purchases</button>';
 box.querySelectorAll('[data-sku]').forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await IAP.purchase(b.dataset.sku);b.disabled=false;if(!r.ok&&r.reason!=='cancelled')storeMsg('Purchase did not finish ('+r.reason+').')});
 $('bRestore').onclick=async()=>{const r=await IAP.restore();storeMsg(r.ok?'Purchases restored.':'Restore failed ('+r.reason+').',r.ok)}};`;

const storeNew = `let gateAns=0,gateUntil=0,gateNext=null;
function storeMsg(m,ok){$('storeNote').innerHTML='<span style="color:'+(ok?'#9be27a':'#ffb0a0')+'">'+m+'</span>'}
function freshGate(){const a=Math.floor(rnd(12,20)),b=Math.floor(rnd(6,10));gateAns=a*b;$('gateQ').textContent='What is '+a+' \\u00d7 '+b+'?';$('gateA').value='';$('gateMsg').textContent=''}
function showGate(next,keepItems){gateNext=next;freshGate();$('gate').style.display='';if(!keepItems)$('storeItems').style.display='none'}
function passGate(){gateUntil=Date.now()+120000;$('gate').style.display='none';const next=gateNext;gateNext=null;if(next)next()}
function withPurchaseGate(fn){if(Date.now()<gateUntil)fn();else showGate(fn,true)}
function openStoreBody(){const box=$('storeItems');box.style.display='';
 if(!IAP.available()){box.innerHTML='<p class="small">The store isn\\'t open yet. There are no ads. When the App Store build is on, every purchase and Restore still asks a grown-up first.</p>';return}
 box.innerHTML=IAP.products.map(p=>'<div class="row"><span><b>'+p.name+'</b> '+p.price+'<br><span class="small">'+p.desc+'</span></span><button class="btn sm" data-sku="'+p.sku+'">Buy</button></div>').join('')+'<button class="btn alt sm" id="bRestore">Restore Purchases</button>';
 box.querySelectorAll('[data-sku]').forEach(b=>b.onclick=()=>withPurchaseGate(async()=>{b.disabled=true;const r=await IAP.purchase(b.dataset.sku);b.disabled=false;if(!r.ok&&r.reason!=='cancelled')storeMsg('Purchase did not finish ('+r.reason+').')}));
 const restore=$('bRestore');if(restore)restore.onclick=()=>withPurchaseGate(async()=>{const r=await IAP.restore();storeMsg(r.ok?'Purchases restored.':'Restore failed ('+r.reason+').',r.ok)})}
$('bStore').onclick=()=>{back='sTitle';const owned=[];if(LS.get('pass',false))owned.push('Ridge Pass');if(LS.get('bank',0))owned.push(LS.get('bank',0)+' coins waiting for your next game');$('storeNote').textContent=owned.length?'Owned: '+owned.join(', '):'';show('sStore');showGate(openStoreBody,false)};
$('gateGo').onclick=()=>{if(parseInt($('gateA').value,10)!==gateAns){$('gateMsg').textContent='Not quite. Ask a grown-up for help.';freshGate();return}passGate()};`;

swap(storeOld, storeNew, "store");

swap(
  `window.VR={get S(){return S},step,startWave,begin,end,grant,TOWERS,WAVES,place(type,x,y){const T=TOWERS[type];if(canPlace(x,y)||S.coins<T.cost)return false;S.coins-=T.cost;S.towers.push({type,x,y,lv:1,spent:T.cost,cdLeft:0,kick:0});return true},upgrade(t){const c=TOWERS[t.type].ups[t.lv-1];if(t.lv<3&&S.coins>=c){S.coins-=c;t.spent+=c;t.lv++;return true}return false},buy(k){const lv=S[k];if(lv<3&&S.coins>=UPS[k][lv]){S.coins-=UPS[k][lv];S[k]++;return true}return false}};
layout();setMute(muted);drawCardIcons();toTitle();requestAnimationFrame(frame);`,
  `window.VR={get S(){return S},step,startWave,begin,beginDaily,promptDaily,end,grant,TOWERS,WAVES,ridgeToday,publishWidget,place(type,x,y){const T=TOWERS[type];if((S.only&&type!==S.only)||canPlace(x,y)||S.coins<T.cost)return false;S.coins-=T.cost;S.towers.push({type,x,y,lv:1,spent:T.cost,cdLeft:0,kick:0});return true},upgrade(t){const c=TOWERS[t.type].ups[t.lv-1];if(t.lv<3&&S.coins>=c){S.coins-=c;t.spent+=c;t.lv++;return true}return false},buy(k){const lv=S[k];if(lv<3&&S.coins>=UPS[k][lv]){S.coins-=UPS[k][lv];S[k]++;return true}return false}};
layout();setMute(muted);drawCardIcons();toTitle();
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(function(){});
if(location.search.indexOf('daily=1')>=0||window.__VR_LAUNCH__==='daily')promptDaily();
requestAnimationFrame(frame);`,
  "boot",
);

const outDir = "/workspace/varmint-ridge/www";
fs.mkdirSync(outDir + "/icons", { recursive: true });
fs.writeFileSync(outDir + "/index.html", html);
console.log("wrote", html.length);

// fixture for the Swift twin
function ridgeFnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
const key = "2026-10-30";
const h = ridgeFnv("jwmanor-vr-" + key);
console.log("FIXTURE", key, h, h % 5, (h >>> 8) % 6, 1 + ((h >>> 16) % 6));
