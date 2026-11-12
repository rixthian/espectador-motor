/*! El Espectador de historias · motor modular v1.2
 * Carga módulos desde este mismo almacén, en una versión fija,
 * y comprueba la huella SHA-384 de cada hoja antes de usarla.
 *
 * En una página:   <div data-eh-modulo="mapoteca"></div>
 * Desde el diseño: EHMotor.cargar('lector')  → Promise
 * Al arrancar carga siempre: diseno y buscador.
 */
(function () {
  'use strict';
  if (window.EHMotor) return;

  var actual = document.currentScript;
  /* La raíz del almacén: la carpeta que contiene /nucleo/ */
  var RAIZ = actual && actual.src ? actual.src.replace(/nucleo\/[^/]*$/, '') : '';

  /* Huellas de cada hoja (las escribe herramientas/huellas.py). */
  var HUELLAS = {
    "modulos/aura/aura.js": "sha384-KHD0qGCFBH/BIoHNI3891ocPNG2G4XuD8byvzRAKls4OCRr5hrMsmtryZXf7B0ql",
    "modulos/buscador/buscador.js": "sha384-yYBAX+TBPZShDJ+y2eJaj8jH6etK015t6RooG7+XlJBuw+OOEUri8KSCT5DBzR9N",
    "modulos/diseno/diseno.css": "sha384-NH7txxb5nqZBbY5KZwZphU8OQw79TBKJqNEuksutdk9h7GResA7xUCXH2ibP7Qks",
    "modulos/lector/lector.css": "sha384-Eql9MuC/vaCBUOzaugmSOFlAdBmlS1FKp8ga+HnuMbEPwwUvMXFIotYNaFHzqCzA",
    "modulos/lector/lector.js": "sha384-p0INvJlQm617z5ysgyscsElTUNlVagyBxqvRlY6kyu5LTay4uLBHoHJAA9aNzcO3",
    "modulos/mapoteca/mapoteca.css": "sha384-5d9nyiBcNL9Zl/2w/3hSPA3EPd2znfyv17l91C3ygGSLWj8y4BdPIkEQ9fO1NHAq",
    "modulos/mapoteca/mapoteca.html": "sha384-w8Kw9g3RYPv8v+wQGvT3Qw+Qj42ed9eFZka4xWdTEF0yU56NUER/uH0VRFsvxOJE",
    "modulos/mapoteca/mapoteca.js": "sha384-3/xv+8DTsXRiunYU5oqpgS0Belenz7aHZETHflLpm7tQYcyVdIVUKyvkviH/MAF1"
  };

  /* Cada módulo vive en su carpeta: modulos/<nombre>/ */
  var MODULOS = {
    mapoteca: { html: 'mapoteca.html', css: 'mapoteca.css', js: 'mapoteca.js' },
    lector:   { css: 'lector.css', js: 'lector.js' },
    aura:     { js: 'aura.js' },
    buscador: { js: 'buscador.js' },
    diseno:   { css: 'diseno.css' }
  };

  /* Módulos que arrancan siempre, en este orden. */
  var ARRANQUE = ['diseno', 'buscador'];

  var cargados = {};

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
      var esperado = HUELLAS[r];
      if (!esperado || !window.crypto || !crypto.subtle) throw new Error('Sin huella para ' + r);
      return crypto.subtle.digest('SHA-384', buf).then(function (d) {
        if ('sha384-' + b64(d) !== esperado) throw new Error('Huella incorrecta en ' + r);
        return new TextDecoder('utf-8').decode(buf);
      });
    });
  }

  function estilo(r) {
    return new Promise(function (ok, mal) {
      if (document.querySelector('link[data-eh="' + r + '"]')) return ok();
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = RAIZ + r; l.crossOrigin = 'anonymous';
      l.integrity = HUELLAS[r] || ''; l.setAttribute('data-eh', r);
      l.onload = ok; l.onerror = function () { mal(new Error('Estilo bloqueado: ' + r)); };
      document.head.appendChild(l);
    });
  }

  function guion(r) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = RAIZ + r; s.crossOrigin = 'anonymous'; s.integrity = HUELLAS[r] || '';
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
    cargados[nombre] = (m.css ? estilo(ruta(nombre, m.css)) : Promise.resolve())
      .then(function () { return m.js ? guion(ruta(nombre, m.js)) : null; })
      .catch(function (e) { delete cargados[nombre]; if (window.console) console.warn('[EH motor]', e.message); throw e; });
    return cargados[nombre];
  }

  function aviso(el, msg) {
    el.innerHTML = '<p style="text-align:center;font:600 12px Cinzel,serif;letter-spacing:.15em;color:#8a6a22;padding:40px 16px">' +
      'ESTA SECCIÓN NO PUDO CARGARSE · VUELVE A INTENTARLO MÁS TARDE</p>';
    if (window.console) console.warn('[EH motor]', msg);
  }

  /* Monta un módulo con estructura HTML dentro de un elemento. */
  function montar(el) {
    if (el.__eh) return; el.__eh = 1;
    var nombre = el.getAttribute('data-eh-modulo'), m = MODULOS[nombre];
    if (!m) return aviso(el, 'Módulo desconocido: ' + nombre);
    el.innerHTML = '<p style="text-align:center;font:600 11px Cinzel,serif;letter-spacing:.2em;color:#8a8a8a;padding:60px 16px">CARGANDO…</p>';
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

  window.EHMotor = { version: '1.2.0', raiz: RAIZ, cargar: cargar, montar: montar, buscar: buscar };
  try { document.dispatchEvent(new Event('eh:motor')); } catch (e) {}
  ARRANQUE.reduce(function (p, n) { return p.then(function () { return cargar(n).catch(function () {}); }); }, Promise.resolve());
  buscar();
  new MutationObserver(function () { buscar(); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
