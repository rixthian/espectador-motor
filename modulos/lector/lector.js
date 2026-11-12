(function(){
var raiz=document.querySelector('.sbz-lec');if(!raiz)return;
var HTM=document.documentElement;HTM.classList.add('sl-js');
var V={es:raiz.querySelector('.sl-v[lang="es"]'),en:raiz.querySelector('.sl-v[lang="en"]')};if(!V.es)return;
var barra=raiz.querySelector('.sl-barra'),bVoz=raiz.querySelector('[data-sl="voz"]'),bRap=raiz.querySelector('[data-sl="rapida"]'),bIdi=raiz.querySelector('[data-sl="idioma"]');
var lang='es';
var GT=(function(){var OK={en:1,pt:1,fr:1,it:1,de:1},m=document.cookie.match(/(?:^|; )googtrans=([^;]*)/),g=m?(decodeURIComponent(m[1]).split('/')[2]||''):'';return OK[g]?g:'';})();
function vl(){return(lang==='es'&&GT&&GT!=='en')?GT:lang;}
function lee(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function guarda(k,v){try{localStorage.setItem(k,v);}catch(e){}}
var T={
 es:{escuchando:'Escuchando',pausa:'En pausa',ant:'Párrafo anterior',sig:'Párrafo siguiente',play:'Continuar',pausar:'Pausar',cerrar:'Cerrar',vel:'Velocidad de lectura',voz:'Voz',lento:'Lento',normal:'Normal',rapido:'Rápido',muyrap:'Muy rápido',
  sinvoz:'Tu navegador no tiene voces en español. Prueba con Chrome, Edge o Safari.',nosoporta:'Tu navegador no puede leer en voz alta. Prueba con Chrome, Edge o Safari.',aviso:'Aviso',
  rap:'Lectura rápida',ppm:'palabras/min',atras:'Retroceder 10 palabras',adel:'Avanzar 10 palabras',menos:'Más lento',mas:'Más rápido',reproducir:'Reproducir',
  ayuda:'Espacio: pausa · Flechas: retroceder, avanzar y velocidad · Esc: cerrar',fin:'Fin',narr:'Narración en voz alta',herr:'Herramientas de lectura'},
 en:{escuchando:'Listening',pausa:'Paused',ant:'Previous paragraph',sig:'Next paragraph',play:'Resume',pausar:'Pause',cerrar:'Close',vel:'Reading speed',voz:'Voice',lento:'Slow',normal:'Normal',rapido:'Fast',muyrap:'Very fast',
  sinvoz:'Your browser has no English voice installed. Try Chrome, Edge or Safari.',nosoporta:'Your browser cannot read aloud. Try Chrome, Edge or Safari.',aviso:'Notice',
  rap:'Speed reading',ppm:'words/min',atras:'Back 10 words',adel:'Forward 10 words',menos:'Slower',mas:'Faster',reproducir:'Play',
  ayuda:'Space: pause · Arrows: back, forward and speed · Esc: close',fin:'The end',narr:'Read aloud',herr:'Reading tools'}};
function t(k){return T[lang][k];}
var ICO={ant:'<svg viewBox="0 0 24 24"><path d="M6 5h2.5v14H6zM20 5v14L9 12z"/></svg>',sig:'<svg viewBox="0 0 24 24"><path d="M15.5 5H18v14h-2.5zM4 5v14l11-7z"/></svg>',
 play:'<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z"/></svg>',pausa:'<svg viewBox="0 0 24 24"><path d="M6 4.5h4.2v15H6zM13.8 4.5H18v15h-4.2z"/></svg>',
 atras:'<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>',adel:'<svg viewBox="0 0 24 24"><path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/></svg>'};
function lista(){return [].slice.call(V[lang].querySelectorAll('.sl-n'));}
function seccionDe(el){var s=el&&el.closest('.sl-sec');return s?s.getAttribute('data-etq'):(raiz.getAttribute('data-etq-'+lang)||'');}
function desdeAqui(els){
  var cab=(barra?barra.getBoundingClientRect().bottom:0)+12;
  if(V[lang].getBoundingClientRect().top>cab-40)return 0;
  for(var i=0;i<els.length;i++){if(els[i].getBoundingClientRect().bottom>cab+24)return i;}
  return 0;
}
function sb(){return(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth';}
function aVista(el){var r=el.getBoundingClientRect(),cab=(barra?barra.getBoundingClientRect().bottom:0)+12,pie=(pl.classList.contains('abierto')?pl.offsetHeight:0)+24,libre=window.innerHeight-cab-pie;
  if(r.height>=libre){if(Math.abs(r.top-cab)>6)window.scrollBy({top:r.top-cab,behavior:sb()});}
  else if(r.top<cab||r.bottom>window.innerHeight-pie)window.scrollBy({top:r.top-cab-Math.max(0,(libre-r.height)/3),behavior:sb()});}

/* ---------- Reproductor (narrador) ---------- */
var ss=window.speechSynthesis,UT=window.SpeechSynthesisUtterance;
var pl=document.createElement('div');pl.className='sl-player';pl.setAttribute('role','region');
pl.innerHTML='<div class="sl-pl-info"><p class="sl-pl-et"></p><p class="sl-pl-tit" aria-live="polite"></p><div class="sl-pl-barra"><span></span></div></div>'+
 '<div class="sl-pl-ctrl"><button type="button" data-a="ant">'+ICO.ant+'</button><button type="button" class="sl-pl-play" data-a="play">'+ICO.pausa+'</button><button type="button" data-a="sig">'+ICO.sig+'</button>'+
 '<select data-a="vel"><option value="0.85"></option><option value="1"></option><option value="1.15"></option><option value="1.3"></option></select><select data-a="voz"></select>'+
 '<button type="button" class="sl-pl-x" data-a="x">&#215;</button></div>';
document.body.appendChild(pl);
var plEt=pl.querySelector('.sl-pl-et'),plTit=pl.querySelector('.sl-pl-tit'),plBar=pl.querySelector('.sl-pl-barra span'),bPlay=pl.querySelector('[data-a="play"]'),selVel=pl.querySelector('[data-a="vel"]'),selVoz=pl.querySelector('[data-a="voz"]');
var VS=[],voz=null,vel=parseFloat(lee('sl-vel'))||1;selVel.value=String(vel);if(selVel.value!==String(vel)){vel=1;selVel.value='1';}
var els=[],idx=0,partes=null,pi=0,estado='parado',token=0,actual=null,habla=false;
function puntua(v){var g=v.lang.replace('_','-').toLowerCase(),p=50;
  if(vl()==='es'){if(g==='es-ve')p=100;else if(/^es-(419|us|mx|co|pe|cl|ar|ec|pa|do|pr|cu|uy|bo|py|cr|gt|hn|ni|sv)$/.test(g))p=80;else if(g==='es-es')p=60;}
  else if(lang==='en'){if(g==='en-gb')p=100;else if(g==='en-us')p=80;else if(/^en-(ie|au|nz|za|in|ca)$/.test(g))p=70;}
  if(/natural|online|neural|google|premium|enhanced|mejorada/i.test(v.name))p+=12;return p;}
function nombreVoz(v){return v.name.replace(/^(Microsoft|Google|Apple)\s+/,'').replace(/\s*\(Natural\)/,'').replace(/\s+Online/,'').replace(/\s+-\s+.*$/,'')+' · '+v.lang.replace('_','-');}
function llenaVoces(){
  if(!ss){VS=[];return;}
  var re=new RegExp('^'+vl()+'([-_]|$)','i');
  VS=ss.getVoices().filter(function(v){return re.test(v.lang);});VS.sort(function(a,b){return puntua(b)-puntua(a);});
  var pref=lee('sl-voz-'+vl());voz=null;
  for(var i=0;i<VS.length;i++){if(VS[i].name===pref){voz=VS[i];break;}}
  if(!voz)voz=VS[0]||null;
  selVoz.innerHTML='';
  VS.forEach(function(v,i){var o=document.createElement('option');o.value=String(i);o.textContent=nombreVoz(v);if(v===voz)o.selected=true;selVoz.appendChild(o);});
  selVoz.style.display=VS.length>1?'':'none';
}
if(ss){llenaVoces();if(ss.addEventListener)ss.addEventListener('voiceschanged',llenaVoces);else ss.onvoiceschanged=llenaVoces;}
function conVoces(cb){llenaVoces();if(VS.length||!ss){cb();return;}var hecho=false;function f(){if(hecho)return;hecho=true;llenaVoces();cb();}
  if(ss.addEventListener)ss.addEventListener('voiceschanged',f);setTimeout(f,1200);}
function normaliza(s){
  s=s.replace(/\s+/g,' ').trim();
  if(lang==='es'){s=s.replace(/\bCarlos IV\b/g,'Carlos cuarto').replace(/\btomo IV\b/g,'tomo cuarto').replace(/\bsiglo XIX\b/g,'siglo diecinueve').replace(/\bp\. (\d+)/g,'página $1').replace(/\bURD\b/g,'U erre de').replace(/\bFAO\b/g,'Fao').replace(/\bpa’/g,'pa');}
  else{s=s.replace(/\bCharles IV\b/g,'Charles the Fourth').replace(/\bvol\. IV\b/g,'volume four').replace(/\bp\. (\d+)/g,'page $1').replace(/\bURD\b/g,'U R D');}
  s=s.replace(/ L\.,/g,',').replace(/[«»“”"]/g,'').replace(/…/g,'... ').replace(/\s*[—–]\s*/g,', ').replace(/^,\s*/,'');
  return s;
}
function textoVoz(el){if(vl()===lang)return el.getAttribute('data-voz')||el.textContent;if(el.classList.contains('sl-cap'))return [].map.call(el.children,function(c){return c.textContent.trim();}).filter(Boolean).join('. ')+'.';return el.textContent;}
function trozos(s){
  var fr=s.match(/[^.!?;:]+[.!?;:]*\s*/g)||[s],out=[],cur='';
  fr.forEach(function(f){
    if(f.length>220){f.split(/,\s+/).forEach(function(x,i,a){x=i<a.length-1?x+',':x;if((cur+' '+x).length>220&&cur){out.push(cur.trim());cur='';}cur+=' '+x;});return;}
    if((cur+f).length>220&&cur){out.push(cur.trim());cur='';}cur+=f;
  });
  if(cur.trim())out.push(cur.trim());return out;
}
function marca(el){
  if(actual&&actual!==el)actual.classList.remove('sl-leyendo');
  actual=el;if(!el)return;el.classList.add('sl-leyendo');
  plTit.textContent=seccionDe(el);plBar.style.width=((idx+1)/els.length*100).toFixed(1)+'%';aVista(el);
}
function pintaPlay(){var h=estado==='hablando';bPlay.innerHTML=h?ICO.pausa:ICO.play;bPlay.setAttribute('aria-label',h?t('pausar'):t('play'));plEt.textContent=h?t('escuchando'):t('pausa');}
function hablar(){
  if(estado!=='hablando')return;
  var el=els[idx];if(!el){detener();return;}
  if(!partes){partes=trozos(normaliza(textoVoz(el)));pi=0;marca(el);}
  if(pi>=partes.length){idx++;partes=null;hablar();return;}
  var u=new UT(partes[pi]);u.lang=voz?voz.lang:(vl()==='es'?'es-ES':vl()==='en'?'en-GB':vl());if(voz)u.voice=voz;u.rate=vel;
  var mio=++token;
  u.onstart=function(){habla=true;};
  u.onend=function(){if(mio!==token||estado!=='hablando')return;pi++;hablar();};
  u.onerror=function(ev){if(mio!==token)return;var er=ev&&ev.error;if(er==='interrupted'||er==='canceled')return;pi++;setTimeout(hablar,50);};
  ss.speak(u);
}
function reanuda(){token++;ss.cancel();setTimeout(hablar,90);}
function abre(){pl.classList.add('abierto');if(bVoz)bVoz.setAttribute('aria-expanded','true');}
function arranca(desde){
  els=lista();idx=Math.max(0,Math.min(desde,els.length-1));partes=null;estado='hablando';
  HTM.classList.add('sl-hablando');pl.classList.remove('sin-voz');abre();pintaPlay();reanuda();
}
function pausa(){if(estado!=='hablando')return;estado='pausa';token++;ss.cancel();pintaPlay();}
function sigue(){if(estado==='hablando')return;estado='hablando';pintaPlay();reanuda();}
function salta(d){if(!els.length)return;idx=Math.max(0,Math.min(els.length-1,idx+d));partes=null;estado='hablando';pintaPlay();reanuda();}
function detener(){token++;estado='parado';if(ss)ss.cancel();marca(null);pl.classList.remove('abierto');HTM.classList.remove('sl-hablando');if(bVoz)bVoz.setAttribute('aria-expanded','false');}
function aviso(msg){detener();pl.classList.add('sin-voz');plEt.textContent=t('aviso');plTit.textContent=msg;plBar.style.width='0';abre();}
pl.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;var a=b.getAttribute('data-a');
  if(a==='x'){detener();if(bVoz)bVoz.focus({preventScroll:true});}else if(a==='play'){estado==='hablando'?pausa():sigue();}else if(a==='ant')salta(-1);else if(a==='sig')salta(1);});
selVel.addEventListener('change',function(){vel=parseFloat(selVel.value)||1;guarda('sl-vel',String(vel));if(estado==='hablando')reanuda();});
selVoz.addEventListener('change',function(){voz=VS[parseInt(selVoz.value,10)]||voz;if(voz)guarda('sl-voz-'+vl(),voz.name);if(estado==='hablando')reanuda();});
raiz.addEventListener('click',function(ev){if(estado==='parado')return;if(ev.target.closest('a,button'))return;var el=ev.target.closest('.sl-n');if(!el)return;var i=els.indexOf(el);if(i<0)return;idx=i;partes=null;estado='hablando';pintaPlay();reanuda();});
if(bVoz){bVoz.setAttribute('aria-expanded','false');}
if(bVoz)bVoz.addEventListener('click',function(){
  if(!ss||!UT){aviso(t('nosoporta'));return;}
  if(estado==='hablando'){pausa();return;}
  if(estado==='pausa'){sigue();return;}
  cierraRap(true);
  llenaVoces();habla=false;arranca(desdeAqui(lista()));
  if(!VS.length)setTimeout(function(){llenaVoces();if(!habla&&!VS.length&&estado==='hablando')aviso(t('sinvoz'));},1800);
});

/* ---------- Lectura rapida (palabra a palabra) ---------- */
var rap=document.createElement('div');rap.className='sl-rap';rap.setAttribute('role','dialog');rap.setAttribute('aria-modal','true');
rap.innerHTML='<div class="sl-rap-caja"><div class="sl-rap-cab"><div><p class="sl-rap-et"></p><p class="sl-rap-sec"></p></div><button type="button" data-r="x">&#215;</button></div>'+
 '<div class="sl-rap-pal" aria-hidden="true"><span class="a"></span><span class="p"></span><span class="b"></span></div><div class="sl-rap-prog"><span></span></div>'+
 '<div class="sl-rap-ctrl"><button type="button" data-r="atras">'+ICO.atras+'</button><button type="button" class="sl-rap-play" data-r="play">'+ICO.play+'</button><button type="button" data-r="adel">'+ICO.adel+'</button>'+
 '<div class="sl-rap-vel"><button type="button" data-r="menos">&#8722;</button><output></output><button type="button" data-r="mas">+</button></div></div><p class="sl-rap-ayuda"></p></div>';
document.body.appendChild(rap);
var rA=rap.querySelector('.a'),rP=rap.querySelector('.p'),rB=rap.querySelector('.b'),rSec=rap.querySelector('.sl-rap-sec'),rProg=rap.querySelector('.sl-rap-prog span'),rPlay=rap.querySelector('[data-r="play"]'),rOut=rap.querySelector('output');
var pal=[],pj=0,ppm=parseInt(lee('sl-ppm'),10)||300,timer=null,corre=false,abiertoRap=false,volverA=null;
function textoVista(el){
  if(el.classList.contains('sl-cap'))return el.querySelector('.sl-cap-num').textContent+': '+el.querySelector('.sl-cap-t').textContent;
  if(el.closest('.sl-dialogo'))return el.getAttribute('data-voz');
  return el.textContent;
}
function prepara(desde){
  var lst=lista();pal=[];
  for(var i=desde;i<lst.length;i++){var ws=textoVista(lst[i]).replace(/\s+/g,' ').trim().split(' ');
    for(var j=0;j<ws.length;j++){if(ws[j])pal.push({w:ws[j],el:lst[i],ini:j===0,fin:j===ws.length-1});}}
}
function pivote(w){var lead=(w.match(/^[^0-9A-Za-zÀ-ÿ]*/)||[''])[0].length,core=w.length-lead,L=core;
  var k=L<=1?0:L<=5?1:L<=9?2:L<=13?3:4;return Math.min(w.length-1,lead+k);}
function pinta(){
  var x=pal[pj];if(!x){rA.textContent='';rP.textContent=t('fin');rB.textContent='';return;}
  var k=pivote(x.w);rA.textContent=x.w.slice(0,k);rP.textContent=x.w.charAt(k);rB.textContent=x.w.slice(k+1);
  var pw=rP.parentNode;pw.style.fontSize='';var fs=parseFloat(getComputedStyle(pw).fontSize)||34,n=0;
  while((rA.scrollWidth>rA.clientWidth+1||rB.scrollWidth>rB.clientWidth+1)&&fs>16&&n<10){fs-=3;pw.style.fontSize=fs+'px';n++;}
  rSec.textContent=seccionDe(x.el);rProg.style.width=(pal.length?(pj+1)/pal.length*100:0).toFixed(1)+'%';
}
function espera(x){var f=1;
  if(/[.!?…]["»”)]*$/.test(x.w))f=2.2;else if(/[,;:]["»”)]*$/.test(x.w))f=1.5;
  if(x.w.length>8)f*=1.25;if(x.fin)f=Math.max(f,2.6);if(x.ini)f*=1.15;return 60000/ppm*f;}
function paso(){if(!corre)return;if(pj>=pal.length-1){pj=pal.length;pinta();para();return;}pj++;pinta();timer=setTimeout(paso,espera(pal[pj]));}
function anda(){if(!pal.length)return;if(pj>=pal.length)pj=0;corre=true;rPlay.innerHTML=ICO.pausa;rPlay.setAttribute('aria-label',t('pausar'));pinta();clearTimeout(timer);timer=setTimeout(paso,espera(pal[pj]));}
function para(){corre=false;clearTimeout(timer);rPlay.innerHTML=ICO.play;rPlay.setAttribute('aria-label',t('reproducir'));}
function velocidad(d){ppm=Math.max(150,Math.min(700,ppm+d));guarda('sl-ppm',String(ppm));rOut.textContent=ppm+' '+t('ppm');}
function abreRap(){
  if(estado!=='parado')pausa();
  prepara(desdeAqui(lista()));pj=0;velocidad(0);textosRap();
  rap.classList.add('abierto');abiertoRap=true;HTM.style.overflow='hidden';pinta();rPlay.focus();setTimeout(anda,650);
}
function cierraRap(silencio){
  if(!abiertoRap)return;para();rap.classList.remove('abierto');abiertoRap=false;HTM.style.overflow='';
  var x=pal[Math.min(pj,pal.length-1)];
  if(!silencio&&x&&pj>0){x.el.scrollIntoView({block:'center'});x.el.classList.add('sl-leyendo');setTimeout(function(){if(x.el!==actual)x.el.classList.remove('sl-leyendo');},1800);}
  if(!silencio&&bRap)bRap.focus();
}
rap.addEventListener('click',function(ev){if(ev.target===rap){cierraRap();return;}var b=ev.target.closest('button');if(!b)return;var r=b.getAttribute('data-r');
  if(r==='x')cierraRap();else if(r==='play'){corre?para():anda();}else if(r==='atras'){pj=Math.max(0,pj-10);pinta();}else if(r==='adel'){pj=Math.min(pal.length-1,pj+10);pinta();}
  else if(r==='menos')velocidad(-25);else if(r==='mas')velocidad(25);});
document.addEventListener('keydown',function(ev){if(!abiertoRap)return;var k=ev.key;
  if(k==='Escape'){ev.preventDefault();cierraRap();}
  else if(k===' '||k==='Spacebar'){if(ev.target.closest&&ev.target.closest('button'))return;ev.preventDefault();corre?para():anda();}
  else if(k==='ArrowLeft'){ev.preventDefault();pj=Math.max(0,pj-10);pinta();}
  else if(k==='ArrowRight'){ev.preventDefault();pj=Math.min(pal.length-1,pj+10);pinta();}
  else if(k==='ArrowUp'){ev.preventDefault();velocidad(25);}
  else if(k==='ArrowDown'){ev.preventDefault();velocidad(-25);}
  else if(k==='Tab'){var f=[].slice.call(rap.querySelectorAll('button'));var i=f.indexOf(document.activeElement);if(ev.shiftKey&&i<=0){ev.preventDefault();f[f.length-1].focus();}else if(!ev.shiftKey&&i===f.length-1){ev.preventDefault();f[0].focus();}}
});
if(bRap)bRap.addEventListener('click',abreRap);

/* ---------- Idioma ---------- */
function textosRap(){
  rap.setAttribute('aria-label',t('rap'));rap.setAttribute('lang',lang);rap.querySelector('.sl-rap-et').textContent=t('rap');
  rap.querySelector('[data-r="x"]').setAttribute('aria-label',t('cerrar'));rap.querySelector('[data-r="atras"]').setAttribute('aria-label',t('atras'));
  rap.querySelector('[data-r="adel"]').setAttribute('aria-label',t('adel'));rap.querySelector('[data-r="menos"]').setAttribute('aria-label',t('menos'));
  rap.querySelector('[data-r="mas"]').setAttribute('aria-label',t('mas'));rap.querySelector('.sl-rap-ayuda').textContent=t('ayuda');rOut.textContent=ppm+' '+t('ppm');
  rPlay.setAttribute('aria-label',corre?t('pausar'):t('reproducir'));
}
function textos(){
  [].forEach.call(raiz.querySelectorAll('.sl-barra [data-es]'),function(el){el.textContent=el.getAttribute('data-'+lang);});
  if(barra)barra.setAttribute('aria-label',barra.getAttribute('data-'+lang+'-label')||t('herr'));
  if(bIdi){bIdi.setAttribute('aria-pressed',lang==='en'?'true':'false');bIdi.removeAttribute('aria-label');var et=bIdi.querySelector('[lang]');if(et)et.setAttribute('lang',lang==='es'?'en':'es');}
  pl.setAttribute('aria-label',t('narr'));pl.setAttribute('lang',lang);
  pl.querySelector('[data-a="ant"]').setAttribute('aria-label',t('ant'));pl.querySelector('[data-a="sig"]').setAttribute('aria-label',t('sig'));pl.querySelector('[data-a="x"]').setAttribute('aria-label',t('cerrar'));
  selVel.setAttribute('aria-label',t('vel'));selVoz.setAttribute('aria-label',t('voz'));
  var o=selVel.options;o[0].textContent=t('lento');o[1].textContent=t('normal');o[2].textContent=t('rapido');o[3].textContent=t('muyrap');
  pintaPlay();textosRap();compacta();
}
function compacta(){if(!barra)return;barra.classList.remove('sl-c1','sl-c2');
  function lleno(){return barra.offsetHeight>66||barra.scrollWidth>barra.clientWidth+1;}
  if(lleno())barra.classList.add('sl-c1');if(lleno())barra.classList.add('sl-c2');}
window.addEventListener('resize',compacta);window.addEventListener('load',compacta);
function cambiaIdioma(){
  var nuevo=lang==='es'?'en':'es',k=null,arriba=V[lang].getBoundingClientRect().top>0;
  var secs=V[lang].querySelectorAll('.sl-sec');for(var i=0;i<secs.length;i++){if(secs[i].getBoundingClientRect().bottom>160){k=secs[i].getAttribute('data-k');break;}}
  detener();cierraRap(true);
  if(!V[nuevo])return;
  V[lang].hidden=true;V[nuevo].hidden=false;lang=nuevo;guarda('sbz_lang',lang==='en'?'en':'');raiz.classList.toggle('sl-en',lang==='en');
  llenaVoces();textos();
  if(!arriba&&k){var s=V[lang].querySelector('.sl-sec[data-k="'+k+'"]');if(s)s.scrollIntoView({block:'start'});}
}
if(bIdi)bIdi.addEventListener('click',cambiaIdioma);
window.addEventListener('pagehide',function(){if(estado!=='parado')detener();});
textos();
/* Sitio traducido: la version inglesa y la sigla nunca pasan por el traductor; en ingles se muestra la version propia */
if(GT){[].forEach.call(raiz.querySelectorAll('.sl-sigla'),function(e){e.setAttribute('translate','no');e.classList.add('notranslate');});if(V.en){V.en.setAttribute('translate','no');V.en.classList.add('notranslate');}}
if(GT==='en'&&V.en){raiz.setAttribute('translate','no');raiz.classList.add('notranslate');if(lang!=='en')cambiaIdioma();}else if(lee('sbz_lang')==='en'&&V.en&&lang!=='en'){cambiaIdioma();}
})();
