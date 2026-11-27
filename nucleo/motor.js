/*! El Espectador de historias · motor modular v1.8
 * Carga módulos desde este mismo almacén, en una versión fija.
 *
 * En una página:   <div data-eh-modulo="mapoteca"></div>
 * Desde el diseño: EHMotor.cargar('lector')  → Promise
 * Al arrancar monta el armazón (cabecera, portada y pie) dentro de
 * #eh-app y #eh-pie, y carga: diseno, buscador, portada, articulo, efectos y puente.
 */
(function () {
  'use strict';
  if (window.EHMotor) return;

  var actual = document.currentScript;
  /* La raíz del almacén: la carpeta que contiene /nucleo/ */
  var RAIZ = actual && actual.src ? actual.src.replace(/nucleo\/[^/]*$/, '') : '';

  /* Cada módulo vive en su carpeta: modulos/<nombre>/ */
  var MODULOS = {
    mapoteca: { html: 'mapoteca.html', css: 'mapoteca.css', js: 'mapoteca.js' },
    lector:   { css: 'lector.css', js: 'lector.js' },
    aura:     { js: 'aura.js' },
    buscador: { js: 'buscador.js' },
    diseno:   { css: 'moderno.css' },
    portada:  { js: 'portada.js' },
    puente:   { js: 'puente.js' },
    efectos:  { js: 'efectos.js' },
    articulo: { css: 'articulo.css', js: 'articulo.js' }
  };

  /* Módulos que arrancan siempre, en este orden, después del armazón. */
  var ARRANQUE = ['buscador', 'portada', 'articulo', 'efectos', 'puente'];

  var cargados = {};

  /* Ajustes del panel de control: qué plugins están encendidos y cuáles se añadieron.
   * Se usa la última copia guardada (para no frenar el arranque) y se renueva al final. */
  var PUENTE = 'https://espectador-puente.espectador-historias.workers.dev';
  var CONF = {};
  try { CONF = JSON.parse(localStorage.getItem('eh-config') || '{}') || {}; } catch (e) { CONF = {}; }
  function activo(n) { return !(CONF.plugins && CONF.plugins[n] === false); }

  function extras() {
    (Array.isArray(CONF.extras) ? CONF.extras : []).forEach(function (x) {
      if (!x || !/^[0-9a-f]{40}$/.test(x.c) || !/^modulos\/[a-z0-9_\/-]+\.js$/.test(x.r) || !/^sha384-[A-Za-z0-9+\/=]{64}$/.test(x.h)) return;
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/gh/rixthian/espectador-motor@' + x.c + '/' + x.r;
      s.crossOrigin = 'anonymous'; s.integrity = x.h; s.setAttribute('data-eh-extra', x.r);
      document.body.appendChild(s);
    });
  }

  function renueva() {
    try {
      fetch(PUENTE + '/config', { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j) localStorage.setItem('eh-config', JSON.stringify(j)); }).catch(function () {});
    } catch (e) {}
  }

  function ruta(nombre, hoja) { return 'modulos/' + nombre + '/' + hoja; }

  function b64(buf) {
    var s = '', b = new Uint8Array(buf);
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  function texto(r) {
    return fetch(RAIZ + r, { credentials: 'omit' }).then(function (res) {
      if (!res.ok) throw new Error('No se pudo leer ' + r);
      return res.arrayBuffer();
    }).then(function (buf) {
      return new TextDecoder('utf-8').decode(buf);
    });
  }

  function estilo(r) {
    return new Promise(function (ok, mal) {
      if (document.querySelector('link[data-eh="' + r + '"]')) return ok();
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = RAIZ + r; l.setAttribute('data-eh', r);
      l.onload = ok; l.onerror = function () { mal(new Error('Estilo bloqueado: ' + r)); };
      document.head.appendChild(l);
    });
  }

  function guion(r) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = RAIZ + r;
      s.setAttribute('data-eh', r);
      s.onload = ok; s.onerror = function () { mal(new Error('Guion bloqueado: ' + r)); };
      document.body.appendChild(s);
    });
  }

  /* Carga el estilo y el guion de un módulo (una sola vez). */
  function cargar(nombre) {
    if (cargados[nombre]) return cargados[nombre];
    var m = MODULOS[nombre];
    if (!m) return Promise.reject(new Error('Módulo desconocido: ' + nombre));
    if (!activo(nombre)) return Promise.resolve();
    cargados[nombre] = (m.css ? estilo(ruta(nombre, m.css)) : Promise.resolve())
      .then(function () { return m.js ? guion(ruta(nombre, m.js)) : null; })
      .catch(function (e) { delete cargados[nombre]; if (window.console) console.warn('[EH motor]', e.message); throw e; });
    return cargados[nombre];
  }

  function aviso(el, msg) {
    el.innerHTML = '<p style="text-align:center;font:600 13px system-ui,sans-serif;letter-spacing:.04em;color:#5c6370;padding:40px 16px">' +
      'ESTA SECCIÓN NO PUDO CARGARSE · VUELVE A INTENTARLO MÁS TARDE</p>';
    if (window.console) console.warn('[EH motor]', msg);
  }

  /* Monta un módulo con estructura HTML dentro de un elemento. */
  function montar(el) {
    if (el.__eh) return; el.__eh = 1;
    var nombre = el.getAttribute('data-eh-modulo'), m = MODULOS[nombre];
    if (!m) return aviso(el, 'Módulo desconocido: ' + nombre);
    if (!activo(nombre)) { el.innerHTML = '<p style="text-align:center;font:600 13px system-ui,sans-serif;color:#5c6370;padding:40px 16px">Esta sección está desactivada por ahora.</p>'; return; }
    el.innerHTML = '<p style="text-align:center;font:600 13px system-ui,sans-serif;letter-spacing:.04em;color:#8a8a8a;padding:60px 16px">Cargando…</p>';
    Promise.all([m.html ? texto(ruta(nombre, m.html)) : '', m.css ? estilo(ruta(nombre, m.css)) : null])
      .then(function (r) {
        el.innerHTML = r[0];
        return m.js ? (cargados[nombre] = guion(ruta(nombre, m.js))) : null;
      })
      .catch(function (e) { aviso(el, e.message); });
  }

  function buscar(raiz) {
    (raiz || document).querySelectorAll('[data-eh-modulo]').forEach(montar);
  }

  /* Armazón de la web: cabecera y portada en #eh-app, pie en #eh-pie. */
  function armazon() {
    var app = document.getElementById('eh-app');
    if (!app) return Promise.resolve();
    return texto('modulos/portada/portada.html').then(function (h) {
      var p = h.split('<!--PIE-->');
      app.innerHTML = p[0];
      var pie = document.getElementById('eh-pie');
      if (pie) pie.innerHTML = p[1] || '';
    }).catch(function (e) { aviso(app, e.message); throw e; });
  }

  window.EHMotor = { version: '1.8.0', raiz: RAIZ, config: CONF, cargar: cargar, montar: montar, buscar: buscar };
  try { document.dispatchEvent(new Event('eh:motor')); } catch (e) {}
  ARRANQUE.reduce(function (p, n) { return p.then(function () { return cargar(n).catch(function () {}); }); },
    cargar('diseno').catch(function () {}).then(armazon)).catch(function () {}).then(extras);
  renueva();
  buscar();
  new MutationObserver(function () { buscar(); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
