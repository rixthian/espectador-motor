/*! El Espectador de historias · motor modular
 * Carga hojas (módulos) desde este mismo almacén, en una versión fija,
 * y comprueba la huella SHA-384 de cada archivo antes de usarlo.
 * Uso en Blogger:  <div data-eh-modulo="mapoteca"></div>
 */
(function () {
  'use strict';
  if (window.EHMotor) return;

  var actual = document.currentScript;
  var BASE = actual && actual.src ? actual.src.replace(/[^/]*$/, '') : '';

  /* Huellas de cada hoja (las rellena el script de publicación). */
  var HUELLAS = {
    "mapoteca/mapoteca.css": "sha384-5d9nyiBcNL9Zl/2w/3hSPA3EPd2znfyv17l91C3ygGSLWj8y4BdPIkEQ9fO1NHAq",
    "mapoteca/mapoteca.html": "sha384-w8Kw9g3RYPv8v+wQGvT3Qw+Qj42ed9eFZka4xWdTEF0yU56NUER/uH0VRFsvxOJE",
    "mapoteca/mapoteca.js": "sha384-3/xv+8DTsXRiunYU5oqpgS0Belenz7aHZETHflLpm7tQYcyVdIVUKyvkviH/MAF1"
  };

  /* Qué archivos forman cada módulo. */
  var MODULOS = {
    mapoteca: { html: 'mapoteca/mapoteca.html', css: 'mapoteca/mapoteca.css', js: 'mapoteca/mapoteca.js' }
  };

  function b64(buf) {
    var s = '', b = new Uint8Array(buf);
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  function texto(ruta) {
    return fetch(BASE + ruta, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('No se pudo leer ' + ruta);
      return r.arrayBuffer();
    }).then(function (buf) {
      var esperado = HUELLAS[ruta];
      if (!esperado || !window.crypto || !crypto.subtle) throw new Error('Sin huella para ' + ruta);
      return crypto.subtle.digest('SHA-384', buf).then(function (d) {
        if ('sha384-' + b64(d) !== esperado) throw new Error('Huella incorrecta en ' + ruta);
        return new TextDecoder('utf-8').decode(buf);
      });
    });
  }

  function estilo(ruta) {
    return new Promise(function (ok, mal) {
      if (document.querySelector('link[data-eh="' + ruta + '"]')) return ok();
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = BASE + ruta; l.crossOrigin = 'anonymous';
      l.integrity = HUELLAS[ruta] || ''; l.setAttribute('data-eh', ruta);
      l.onload = ok; l.onerror = function () { mal(new Error('Estilo bloqueado: ' + ruta)); };
      document.head.appendChild(l);
    });
  }

  function guion(ruta) {
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = BASE + ruta; s.crossOrigin = 'anonymous'; s.integrity = HUELLAS[ruta] || '';
      s.onload = ok; s.onerror = function () { mal(new Error('Guion bloqueado: ' + ruta)); };
      document.body.appendChild(s);
    });
  }

  function aviso(el, msg) {
    el.innerHTML = '<p style="text-align:center;font:600 12px Cinzel,serif;letter-spacing:.15em;color:#8a6a22;padding:40px 16px">' +
      'ESTA SECCIÓN NO PUDO CARGARSE · VUELVE A INTENTARLO MÁS TARDE</p>';
    if (window.console) console.warn('[EH motor]', msg);
  }

  function montar(el) {
    if (el.__eh) return; el.__eh = 1;
    var nombre = el.getAttribute('data-eh-modulo'), m = MODULOS[nombre];
    if (!m) return aviso(el, 'Módulo desconocido: ' + nombre);
    el.innerHTML = '<p style="text-align:center;font:600 11px Cinzel,serif;letter-spacing:.2em;color:#8a8a8a;padding:60px 16px">CARGANDO…</p>';
    Promise.all([m.html ? texto(m.html) : '', m.css ? estilo(m.css) : null])
      .then(function (r) { el.innerHTML = r[0]; return m.js ? guion(m.js) : null; })
      .catch(function (e) { aviso(el, e.message); });
  }

  function buscar(raiz) {
    (raiz || document).querySelectorAll('[data-eh-modulo]').forEach(montar);
  }

  window.EHMotor = { version: '1.0.0', base: BASE, montar: montar, buscar: buscar };
  buscar();
  new MutationObserver(function () { buscar(); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();
