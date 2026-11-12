/*! El Espectador de historias · efectos
 * Aparición al bajar, onda al pulsar, sombra de la cabecera y barra de avance.
 * Todo se apaga solo si la persona pidió "menos movimiento" en su dispositivo.
 */
(function(){
  'use strict';
  var W=window,D=document,H=D.documentElement;
  if(W.EHEfectos)return;W.EHEfectos=1;
  var quieto=W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sombra de la cabecera y barra de avance */
  var cab=D.getElementById('cab'),barra=D.createElement('div');
  barra.id='ef-avance';barra.setAttribute('aria-hidden','true');D.body.appendChild(barra);
  var pend=false;
  function mide(){
    pend=false;
    var y=W.scrollY,alto=H.scrollHeight-W.innerHeight;
    if(cab)cab.classList.toggle('ef-baja',y>8);
    barra.style.transform='scaleX('+(alto>200?Math.min(1,y/alto):0)+')';
  }
  W.addEventListener('scroll',function(){if(!pend){pend=true;W.requestAnimationFrame(mide);}},{passive:true});
  mide();

  if(quieto||!('IntersectionObserver' in W))return;
  H.classList.add('ef');

  /* Aparición al bajar */
  var SEL='#eh-home .titsec,#eh-home .grande,#eh-home .lista>a,#eh-home .mini,#eh-home .dato,#eh-home .quiz,#eh-home .col,#eh-home .ut,#eh-home .cita blockquote,#eh-home .eh-panel,.eh-propios a,.eh-art-cab';
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('ef-in');io.unobserve(e.target);}});
  },{rootMargin:'0px 0px -6% 0px',threshold:.06});
  function apunta(raiz){
    [].forEach.call((raiz||D).querySelectorAll(SEL),function(el){
      if(el.__ef)return;el.__ef=1;
      var i=0,h=el;while((h=h.previousElementSibling)&&i<6)i++;
      el.style.setProperty('--ef-i',i);
      el.classList.add('ef-ap');io.observe(el);
    });
  }
  apunta();
  new MutationObserver(function(){apunta();}).observe(D.body,{childList:true,subtree:true});

  /* Onda al pulsar */
  var OND='button,.cats a,.filtros button,.tend button,.col,.sig,.busca button,.cf-nav a,.sl-b';
  D.addEventListener('pointerdown',function(e){
    var b=e.target&&e.target.closest?e.target.closest(OND):null;
    if(!b||b.disabled)return;
    var r=b.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=D.createElement('span');
    s.className='ef-onda';s.style.width=s.style.height=d+'px';
    s.style.left=(e.clientX-r.left-d/2)+'px';s.style.top=(e.clientY-r.top-d/2)+'px';
    if(getComputedStyle(b).position==='static')b.style.position='relative';
    b.classList.add('ef-con-onda');b.appendChild(s);
    setTimeout(function(){s.remove();},650);
  },{passive:true});
})();
