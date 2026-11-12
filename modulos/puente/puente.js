/*! El Espectador de historias · puente con la base de datos
 * Registra lo que pasa en la web (sin datos personales: ni IP, ni cookies,
 * ni identificadores que duren más que una página) y muestra los resultados
 * del buscador propio. Respeta "No rastrear" y el Control Global de Privacidad.
 */
(function(){
  'use strict';
  var W=window,D=document;
  if(W.EHPuente)return;
  var P='https://espectador-puente.espectador-historias.workers.dev';
  function $(i){return D.getElementById(i);}
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  var mudo=navigator.doNotTrack==='1'||W.doNotTrack==='1'||navigator.globalPrivacyControl===true;
  var visita=Math.random().toString(36).slice(2,12),cola=[],tmr=null;

  function disp(){var w=W.innerWidth;return w<640?'movil':w<1024?'tableta':'escritorio';}
  function envia(){
    clearTimeout(tmr);tmr=null;if(!cola.length)return;
    var b=JSON.stringify(cola.splice(0,8));
    try{if(navigator.sendBeacon&&navigator.sendBeacon(P+'/r',new Blob([b],{type:'text/plain'})))return;}catch(e){}
    try{fetch(P+'/r',{method:'POST',body:b,keepalive:true,headers:{'Content-Type':'text/plain'}}).catch(function(){});}catch(e){}
  }
  function reg(t,d,f){
    if(mudo)return;
    var e={t:t,r:location.pathname,p:disp(),i:(navigator.language||'').slice(0,10),m:D.documentElement.getAttribute('data-tema')||'',a:W.innerWidth,v:visita};
    if(d!==undefined&&d!==null)e.d=String(d).slice(0,400);
    if(f)e.f=String(f).slice(0,120);
    cola.push(e);
    if(cola.length>=8)envia();else if(!tmr)tmr=setTimeout(envia,2500);
  }
  W.EHPuente={registra:reg,direccion:P};

  /* Visita */
  var ref='';try{if(D.referrer){var h=new URL(D.referrer).hostname;if(h!==location.hostname)ref=h;}}catch(e){}
  reg('vista',D.title.slice(0,120),ref);

  /* Clics en enlaces, tema, filtros, cuestionario y lector */
  D.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target:null;if(!el)return;
    var b=el.closest('#eh-temabar button');if(b){reg('tema',b.getAttribute('data-t'));return;}
    b=el.closest('#p-filtros button');if(b){reg('filtro',b.textContent.trim());return;}
    b=el.closest('#p-qops button');if(b){var pg=$('p-qpreg');reg('quiz',(pg?pg.textContent.slice(0,80):'')+' → '+(b.classList.contains('si')?'acierto':'fallo'));return;}
    b=el.closest('.sl-barra button,.sl-b');if(b){reg('audio',(b.getAttribute('aria-label')||b.textContent||'').trim().slice(0,60));return;}
    var a=el.closest('a[href]');if(!a)return;
    try{var u=new URL(a.href,location.href);if(!/^https?:$/.test(u.protocol))return;reg('clic',u.hostname===location.hostname?u.pathname+u.hash:u.hostname+u.pathname);}catch(x){}
  },true);

  /* Profundidad de lectura en artículos */
  if(D.body.classList.contains('eh-item')){
    var hitos=[25,50,75,100],hecho={};
    W.addEventListener('scroll',function(){
      var alto=D.documentElement.scrollHeight-W.innerHeight;if(alto<400)return;
      var pc=Math.round(100*W.scrollY/alto);
      hitos.forEach(function(m){if(pc>=m&&!hecho[m]){hecho[m]=1;reg('lectura',m+'%');}});
    },{passive:true});
  }

  /* Tiempo en la página */
  var t0=Date.now(),visto=0,dicho=false;
  function cierra(){if(D.visibilityState==='hidden'){visto+=Date.now()-t0;if(!dicho&&visto>3000){dicho=true;reg('tiempo',Math.round(visto/1000)+' s');}envia();}else t0=Date.now();}
  D.addEventListener('visibilitychange',cierra);
  W.addEventListener('pagehide',function(){if(!dicho){visto+=Date.now()-t0;dicho=true;reg('tiempo',Math.round(visto/1000)+' s');}envia();});

  /* Errores de la web */
  var nerr=0;
  W.addEventListener('error',function(e){if(nerr++>4)return;var f=(e.filename||'').split('/').pop();reg('error',(e.message||'error')+(f?' · '+f+':'+(e.lineno||0)):''));});
  W.addEventListener('unhandledrejection',function(e){if(nerr++>4)return;var r=e.reason;reg('error','promesa: '+String(r&&r.message||r).slice(0,200));});

  /* Buscador propio: artículos de la casa, encima de los resultados */
  var ultQ='';
  function propios(q){
    var zona=$('eh-resultados');if(!zona)return;
    var caja=$('eh-propios');
    if(!caja){caja=D.createElement('section');caja.id='eh-propios';caja.className='eh-propios';caja.hidden=true;zona.parentNode.insertBefore(caja,zona);}
    caja.hidden=true;
    fetch(P+'/buscar?q='+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(j){
      if(q!==ultQ||!j.r||!j.r.length)return;
      caja.innerHTML='<h2>En El Espectador de historias</h2><div class="l">'+j.r.slice(0,6).map(function(a){
        var tz=esc(a.trozo||a.resumen||'').replace(/\[\[/g,'<b>').replace(/\]\]/g,'</b>');
        var im=a.imagen?a.imagen.replace(/\/(?:s|w)\d+(?:-[a-z0-9-]+)?\//,'/w320/'):'';
        return '<a href="'+esc(a.ruta)+'">'+(im?'<img alt="" loading="lazy" src="'+esc(im)+'">':'<span></span>')+'<div>'+(a.rotulo?'<small>'+esc(a.rotulo)+'</small>':'')+'<strong>'+esc(a.titulo)+'</strong><p>'+tz+'</p></div></a>';
      }).join('')+'</div>';
      caja.hidden=false;
    }).catch(function(){});
  }
  function mira(){
    if(!D.body.classList.contains('eh-res'))return;
    var i=$('eh-q'),q=i?i.value.trim():'';
    if(!q||q===ultQ)return;
    ultQ=q;reg('busca',q);propios(q);
  }
  var tit=D.querySelector('title');
  if(tit)new MutationObserver(mira).observe(tit,{childList:true,characterData:true,subtree:true});
  new MutationObserver(function(){if(!D.body.classList.contains('eh-res'))ultQ='';else mira();}).observe(D.body,{attributes:true,attributeFilter:['class']});
  mira();
})();
