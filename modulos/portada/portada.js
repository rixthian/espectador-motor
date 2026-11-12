/*! El Espectador de historias · portada */
(function(){
  'use strict';
  var D=document;
  function $(i){return D.getElementById(i);}
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  if(!$('cab'))return;
  var item=D.body.classList.contains('eh-item'),path=location.pathname;

  /* Sección activa en la barra */
  var sec=item?(/mapoteca/.test(path)?'mapoteca':/centro-de-genealogia/.test(path)?'urdaneta':/^\/p\//.test(path)?'':'articulos'):'portada';
  [].forEach.call(D.querySelectorAll('#p-cats a'),function(a){if(a.getAttribute('data-s')===sec){a.classList.add('on');a.setAttribute('aria-current','page');}});

  /* Panel Explorar */
  var be=$('p-exp'),pa=$('p-panel');
  function cierraPanel(){pa.hidden=true;be.setAttribute('aria-expanded','false');}
  be.addEventListener('click',function(e){e.stopPropagation();var o=pa.hidden;pa.hidden=!o;be.setAttribute('aria-expanded',o?'true':'false');});
  pa.addEventListener('click',function(e){if(e.target.closest('a'))cierraPanel();});
  D.addEventListener('click',function(e){if(!pa.hidden&&!e.target.closest('#p-panel'))cierraPanel();});
  D.addEventListener('keydown',function(e){
    if(e.key==='Escape')cierraPanel();
    if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))&&!e.target.isContentEditable&&!e.ctrlKey&&!e.metaKey){e.preventDefault();$('eh-q').focus();}
  });

  /* Fecha de hoy */
  try{var f=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});$('p-fecha').textContent=f.charAt(0).toUpperCase()+f.slice(1);}catch(e){}

  var AUD='<span class="audio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9z"/></svg>Audio</span>';
  var CAT=[['Chronicles','Crónicas'],['Biographies','Biografías'],['Colonial Venezuela','Colonia'],['Mapoteca','Mapoteca'],['Essays','Ensayos']];
  function foto(u,w){return u?u.replace(/\/(?:s|w)\d+(?:-[a-z0-9-]+)?\//,'/w'+w+'/'):'';}
  function texto(h){var t=D.createElement('textarea');t.innerHTML=h;return t.value;}

  function lee(e){
    var l=(e.link||[]).find(function(x){return x.rel==='alternate';});if(!l)return null;
    var c=e.content?e.content.$t:'',m=c.match(/<img[^>]+src="([^"]+)"/),k=c.match(/class="sl-kicker"[^>]*>([^<]+)</),d=c.match(/class="sl-dek[^"]*"[^>]*>([^<]+)</);
    return {t:e.title.$t,u:l.href.replace(/^https?:\/\/[^/]+/,''),img:m?m[1]:'',k:k?texto(k[1]).split('·')[0].trim():'Artículo',dek:d?texto(d[1]).trim():'',cats:(e.category||[]).map(function(x){return x.term;})};
  }

  function ultimos(A){$('p-ult').innerHTML=A.slice(0,3).map(function(a){return '<a href="'+esc(a.u)+'"><img alt="" loading="lazy" src="'+esc(foto(a.img,320))+'"><b>'+esc(a.t)+'</b></a>';}).join('');}

  function portada(A){
    var g=A.slice(0,2).map(function(a,i){return '<a class="grande" href="'+esc(a.u)+'"><div class="im"><img alt="" '+(i?'loading="lazy"':'fetchpriority="high"')+' src="'+esc(foto(a.img,800))+'"></div><div class="tx"><span class="rotulo">'+esc(a.k)+'</span><h3>'+esc(a.t)+'</h3>'+(a.dek?'<p>'+esc(a.dek)+'</p>':'')+'</div></a>';}).join('');
    var l=A.slice(2,6).map(function(a){return '<a href="'+esc(a.u)+'"><div><small class="rotulo">'+esc(a.k)+'</small><b>'+esc(a.t)+'</b></div><img alt="" loading="lazy" src="'+esc(foto(a.img,320))+'"></a>';}).join('');
    $('p-racimo').innerHTML=g+(l?'<div class="lista">'+l+'</div>':'');

    /* Catálogo con filtros */
    var grid=$('p-grid'),fil=$('p-filtros'),act='';
    function pinta(){
      var L=A.filter(function(a){return !act||a.cats.indexOf(act)>-1;});
      grid.innerHTML=L.length?L.map(function(a){return '<a class="mini" href="'+esc(a.u)+'"><div class="im"><img alt="" loading="lazy" decoding="async" src="'+esc(foto(a.img,640))+'"></div><div class="etq"><span>'+esc(a.k)+'</span>'+AUD+'</div><h3>'+esc(a.t)+'</h3></a>';}).join(''):'<p class="vacio">Todavía no hay artículos en esta sección.</p>';
    }
    fil.innerHTML='<button type="button" data-c="" aria-pressed="true">Todos</button>'+CAT.filter(function(c){return A.some(function(a){return a.cats.indexOf(c[0])>-1;});}).map(function(c){return '<button type="button" data-c="'+esc(c[0])+'" aria-pressed="false">'+esc(c[1])+'</button>';}).join('');
    fil.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;act=b.getAttribute('data-c');[].forEach.call(fil.querySelectorAll('button'),function(x){x.setAttribute('aria-pressed',x===b?'true':'false');});pinta();});
    pinta();

    /* ¿Sabías que…? */
    var DATOS=[
      ['tierra-de-gracia','El mapa de Juan de la Cosa, de 1500, es el más antiguo que dibuja la costa de Venezuela.','Leer el artículo'],
      ['fernandez-moran','Humberto Fernández-Morán, nacido en Maracaibo en 1924, creó la cuchilla de diamante para cortar las muestras del microscopio electrónico.','Leer la biografía'],
      ['la-gran-colombia','La Gran Colombia duró once años: nació en Angostura en 1819 y se deshizo en 1830.','Leer la crónica']
    ];
    $('p-sabias').innerHTML=DATOS.map(function(d){var a=A.find(function(x){return x.u.indexOf(d[0])>-1;});if(!a)return '';return '<div class="dato"><img alt="" loading="lazy" src="'+esc(foto(a.img,320))+'"><p>'+esc(d[1])+'<br><a href="'+esc(a.u)+'">'+esc(d[2])+' →</a></p></div>';}).join('');

    /* Si la dirección trae un ancla, ir a ella cuando ya hay contenido */
    if(location.hash.length>1){var t=$(location.hash.slice(1));if(t)setTimeout(function(){t.scrollIntoView();},60);}
  }

  /* Cuestionario */
  function quiz(){
    var Q=[
      ['¿De qué año es el mapa de Juan de la Cosa?',['1492','1500','1522'],1],
      ['¿En qué ciudad nació Humberto Fernández-Morán?',['Caracas','Mérida','Maracaibo'],2],
      ['¿Cuántos años duró la Gran Colombia?',['Once','Cinco','Veinticinco'],0],
      ['¿Qué compañía vasca dominó el comercio del cacao en el siglo XVIII?',['La Casa Welser','La Compañía Guipuzcoana','La Compañía de Barcelona'],1]
    ],n=0,ok=0,pr=$('p-qprog').children,pg=$('p-qpreg'),op=$('p-qops'),ms=$('p-qmsg'),sg=$('p-qsig');
    function pon(){
      if(n>=Q.length){pg.textContent='Has acertado '+ok+' de '+Q.length+'.';op.innerHTML='';ms.textContent=ok===Q.length?'Pleno. Enhorabuena.':'Las respuestas están en los artículos.';sg.textContent='Otra vez';sg.hidden=false;return;}
      var q=Q[n];pg.textContent=(n+1)+'. '+q[0];ms.textContent='';sg.hidden=true;sg.textContent=n===Q.length-1?'Ver resultado':'Siguiente';
      op.innerHTML=q[1].map(function(o,i){return '<button type="button" data-i="'+i+'">'+esc(o)+'</button>';}).join('');
    }
    op.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;var q=Q[n],i=+b.getAttribute('data-i'),bs=op.querySelectorAll('button');[].forEach.call(bs,function(x){x.disabled=true;});bs[q[2]].classList.add('si');if(i===q[2]){ok++;ms.textContent='Correcto.';}else{b.classList.add('no');ms.textContent='No es esa.';}pr[n].classList.add('h');sg.hidden=false;sg.focus();});
    sg.addEventListener('click',function(){if(n>=Q.length){n=0;ok=0;[].forEach.call(pr,function(x){x.classList.remove('h');});}else n++;pon();});
    pon();
  }

  fetch('/feeds/posts/default?alt=json&max-results=30').then(function(r){return r.json();}).then(function(j){
    var A=(j.feed.entry||[]).map(lee).filter(Boolean);
    ultimos(A);
    if(!item)portada(A);
  }).catch(function(){var r=$('p-racimo');if(r&&!item)r.innerHTML='<p class="vacio">No se pudieron cargar los artículos. Recarga en un momento.</p>';});
  if(!item)quiz();
})();
