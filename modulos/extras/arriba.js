/*! El Espectador de historias · plugin «Volver arriba»
 * Un botón redondo que aparece al bajar y sube al principio de la página.
 */
(function(){
  'use strict';
  if(window.EHArriba)return;window.EHArriba=1;
  var D=document,b=D.createElement('button');
  b.type='button';b.setAttribute('aria-label','Volver arriba');b.title='Volver arriba';
  b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  b.style.cssText='position:fixed;left:18px;bottom:18px;z-index:90;width:46px;height:46px;border-radius:50%;border:1px solid var(--linea,#e3e6eb);background:var(--tarjeta,#fff);color:var(--tit,#0e1525);box-shadow:0 10px 24px var(--sombra,rgba(0,0,0,.15));cursor:pointer;display:grid;place-items:center;opacity:0;pointer-events:none;transform:translateY(8px);transition:opacity .25s,transform .25s';
  D.body.appendChild(b);
  function mira(){var v=window.scrollY>600;b.style.opacity=v?'1':'0';b.style.pointerEvents=v?'auto':'none';b.style.transform=v?'none':'translateY(8px)';}
  window.addEventListener('scroll',mira,{passive:true});
  b.addEventListener('click',function(){var q=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;window.scrollTo({top:0,behavior:q?'auto':'smooth'});});
  mira();
})();
