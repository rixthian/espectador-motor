/*! El Espectador de historias · publicidad propia
 * Muestra los anuncios que se configuran en el panel de control.
 * Sin redes de anuncios, sin cookies y sin rastreo: solo una imagen con su enlace,
 * siempre con la etiqueta «Publicidad».
 */
(function(){
  'use strict';
  var W=window,D=document;
  if(W.EHAnuncios)return;W.EHAnuncios=1;
  var conf=(W.EHMotor&&W.EHMotor.config)||{},L=Array.isArray(conf.anuncios)?conf.anuncios:[];
  if(!L.length)return;
  var ruta=location.pathname,cuerpo=D.body.classList;
  if(/^\/p\//.test(ruta))return; /* nunca en páginas de proyecto (Mapoteca, Casa Urdaneta) */
  var hoy=new Date().toISOString().slice(0,10);
  function vale(a){return a&&a.on!==false&&/^https:\/\//.test(a.img||'')&&/^https:\/\//.test(a.url||'')&&(!a.desde||a.desde<=hoy)&&(!a.hasta||a.hasta>=hoy);}
  function elige(lugar){var c=L.filter(function(a){return vale(a)&&a.lugar===lugar;});return c.length?c[Math.floor(Math.random()*c.length)]:null;}
  function reg(t,id){try{if(W.EHPuente)W.EHPuente.registra(t,id);}catch(e){}}

  var st=D.createElement('style');
  st.textContent='.eh-anuncio{width:min(1240px,100%);margin:0 auto;padding:22px 16px;text-align:center}.eh-anuncio small{display:block;margin-bottom:8px;font:700 10.5px var(--fb,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--mut,#5c6370)}.eh-anuncio a{display:inline-block;max-width:100%;border-radius:var(--radio,16px);overflow:hidden;border:1px solid var(--linea,#e3e6eb);transition:transform .25s,box-shadow .25s}.eh-anuncio a:hover{transform:translateY(-2px);box-shadow:0 14px 30px var(--sombra,rgba(0,0,0,.12))}.eh-anuncio img{display:block;max-width:100%;height:auto;max-height:320px}';
  D.head.appendChild(st);

  function pinta(a){
    var c=D.createElement('aside');c.className='eh-anuncio';c.setAttribute('aria-label','Publicidad');
    var s=D.createElement('small');s.textContent='Publicidad';
    var l=D.createElement('a');l.href=a.url;l.target='_blank';l.rel='sponsored noopener noreferrer';
    var i=D.createElement('img');i.src=a.img;i.alt=a.alt||a.n||'Anuncio';i.loading='lazy';i.decoding='async';
    l.appendChild(i);c.appendChild(s);c.appendChild(l);
    l.addEventListener('click',function(){reg('anuncio-clic',a.id);});
    if('IntersectionObserver' in W){var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();reg('anuncio',a.id);}},{threshold:.5});io.observe(c);}
    return c;
  }

  if(cuerpo.contains('eh-item')){
    var a=elige('articulo');
    if(a){
      var caja=D.getElementById('eh-pagina'),hecho=false;
      var pon=function(){var t=caja&&caja.querySelector('.eh-cuerpo');if(!t||hecho||!t.textContent.trim())return;hecho=true;t.parentNode.insertBefore(pinta(a),t.nextSibling);};
      pon();
      if(!hecho&&caja){var mo=new MutationObserver(function(){pon();if(hecho)mo.disconnect();});mo.observe(caja,{childList:true,subtree:true});}
    }
  }else{
    var p=elige('portada'),d=D.getElementById('destacado');
    if(p&&d&&d.parentNode)d.parentNode.insertBefore(pinta(p),d.nextSibling);
  }
  var f=elige('pie'),pie=D.getElementById('eh-pie');
  if(f&&pie&&pie.parentNode)pie.parentNode.insertBefore(pinta(f),pie);
})();
