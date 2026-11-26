/* Pruebas del polvo dorado de la Etxea (el lienzo .cg-polvo que flota sobre la casa).
   Navegador:  probarPolvo(textoDelScript)  → [{nombre, ok, detalle}]
   Node:       node polvo.prueba.js casa.html   (busca dentro el script que lleva «cg-polvo»)
   El script se ejecuta en una página de mentira: no toca la página real. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.probarPolvo = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {

  // Una página de mentira con lo justo: la casa, el lienzo, el reloj de cuadros y los avisos del navegador.
  function pagina(opc) {
    opc = opc || {};
    var cola = [], reloj = 0, oyentes = {}, observadores = [], dibujo = { borrados: 0, arcos: [] };
    var semilla = 12345, M = Object.create(Math);
    M.random = function () { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    var ctx = { clearRect: function () { dibujo.borrados++; }, arc: function (x, y) { dibujo.arcos.push([x, y]); },
                beginPath: function () {}, fill: function () {}, setTransform: function () {} };
    var lienzo = { width: 0, height: 0, getContext: function () { return ctx; } };
    var puntos = { children: [], appendChild: function (a) { this.children.push(a); } };
    var R = { classList: { remove: function () {}, add: function () {}, toggle: function () {} }, style: { setProperty: function () {} },
              querySelectorAll: function () { return []; },
              querySelector: function (s) { return s === 'canvas.cg-polvo' ? lienzo : s === '.cg-puntos' ? puntos : s === '.cg-barra' ? {} : null; },
              getBoundingClientRect: function () { return { top: 0, height: 30000, bottom: 30000 }; } };
    var doc = { hidden: false, querySelector: function (s) { return s === '.sbz-cg' ? R : null; },
                addEventListener: function (t, f) { (oyentes[t] = oyentes[t] || []).push(f); } };
    function IO(f) { this.f = f; this.vistos = []; observadores.push(this); }
    IO.prototype.observe = function (el) { this.vistos.push(el); };
    var win = { matchMedia: function () { return { matches: !!opc.sinMovimiento }; }, devicePixelRatio: 2, IntersectionObserver: IO };
    var avisa = function () { (oyentes.visibilitychange || []).forEach(function (f) { f(); }); };
    return {
      arranca: function (texto) {
        new Function('window', 'document', 'matchMedia', 'innerWidth', 'innerHeight', 'addEventListener', 'requestAnimationFrame', 'IntersectionObserver', 'Math', texto)(
          win, doc, win.matchMedia, 1200, 800, function () {}, function (f) { cola.push(f); return cola.length; }, IO, M);
      },
      enPantalla: function (si) { observadores.forEach(function (o) { if (o.vistos.indexOf(R) >= 0) o.f([{ isIntersecting: si, target: R }]); }); },
      ocultar: function () { doc.hidden = true; avisa(); },
      mostrar: function () { doc.hidden = false; avisa(); },
      // Un cuadro de pantalla: corre lo que estaba pedido y dice cuántas veces se borró el lienzo.
      // Con la ventana oculta el navegador no corre nada: lo pedido se queda esperando.
      cuadro: function (ms) {
        reloj += ms || 1000 / 60; if (doc.hidden) return 0;
        var ahora = cola, antes = dibujo.borrados; cola = [];
        ahora.forEach(function (f) { f(reloj); });
        return dibujo.borrados - antes;
      },
      dibujo: dibujo
    };
  }

  return function probarPolvo(texto) {
    var res = [];
    function prueba(nombre, f) {
      try { var d = f(); res.push({ nombre: nombre, ok: d === true, detalle: d === true ? '' : String(d) }); }
      catch (e) { res.push({ nombre: nombre, ok: false, detalle: 'error: ' + e.message }); }
    }
    function lista(opc) { var p = pagina(opc); p.arranca(texto); p.enPantalla(true); return p; }
    var veces = function (n) { return 'borra el lienzo ' + n + ' veces por cuadro'; };

    prueba('dibuja una vez por cuadro', function () {
      var p = lista(); p.cuadro(); var n = p.cuadro(); return n === 1 || veces(n);
    });
    prueba('tras esconder y mostrar la ventana 5 veces sigue dibujando una vez por cuadro', function () {
      var p = lista(); p.cuadro();
      for (var i = 0; i < 5; i++) { p.ocultar(); p.cuadro(); p.mostrar(); p.cuadro(); }
      var n = p.cuadro(); return n === 1 || veces(n);
    });
    prueba('si el aviso de «en pantalla» llega 5 veces seguidas sigue dibujando una vez por cuadro', function () {
      var p = lista(); for (var i = 0; i < 5; i++) p.enPantalla(true);
      p.cuadro(); var n = p.cuadro(); return n === 1 || veces(n);
    });
    prueba('con la ventana oculta no dibuja, y al volver sigue', function () {
      var p = lista(); p.cuadro(); p.ocultar(); var a = p.cuadro() + p.cuadro(); p.mostrar(); p.cuadro(); var b = p.cuadro();
      return (a === 0 && b === 1) || 'oculta dibuja ' + a + ' veces; al volver, ' + b + ' por cuadro';
    });
    prueba('cuando la casa sale de la pantalla se para, y al volver arranca', function () {
      var p = lista(); p.cuadro(); p.enPantalla(false); p.cuadro(); var a = p.cuadro(); p.enPantalla(true); p.cuadro(); var b = p.cuadro();
      return (a === 0 && b === 1) || 'fuera de pantalla dibuja ' + a + ' veces; al volver, ' + b + ' por cuadro';
    });
    prueba('con «reducir movimiento» no dibuja nunca', function () {
      var p = pagina({ sinMovimiento: true }); p.arranca(texto); p.enPantalla(true);
      var n = p.cuadro() + p.cuadro() + p.cuadro(); return n === 0 || 'dibuja ' + n + ' veces';
    });

    // Cuánto sube el polvo en un segundo, de media por mota (solo las que no dan la vuelta por arriba).
    function sube(hz, antes) {
      var p = lista(), paso = 1000 / hz; if (antes) antes(p);
      p.cuadro(paso); var n = p.dibujo.arcos.length, ini = p.dibujo.arcos.slice(0, n);
      for (var i = 0; i < hz; i++) p.cuadro(paso);
      var fin = p.dibujo.arcos.slice(-n), s = 0, k = 0;
      for (var j = 0; j < n; j++) if (ini[j][1] > 100) { s += ini[j][1] - fin[j][1]; k++; }
      return s / k;
    }
    prueba('el polvo sube despacio: entre 3 y 18 píxeles por segundo', function () {
      var v = sube(60); return (v >= 3 && v <= 18) || 'sube ' + v.toFixed(1) + ' píxeles por segundo';
    });
    prueba('sube igual de deprisa en una pantalla de 120 Hz que en una de 60', function () {
      var a = sube(60), b = sube(120); return Math.abs(b / a - 1) < 0.05 || 'a 120 Hz sube ' + (b / a).toFixed(2) + ' veces lo que a 60';
    });
    prueba('tras esconder y mostrar 5 veces sube a la misma velocidad', function () {
      var a = sube(60), b = sube(60, function (p) { p.cuadro(); for (var i = 0; i < 5; i++) { p.ocultar(); p.cuadro(); p.mostrar(); p.cuadro(); } });
      return Math.abs(b / a - 1) < 0.05 || 'sube ' + (b / a).toFixed(2) + ' veces más deprisa';
    });
    prueba('tras 10 segundos oculta, el primer cuadro no da un salto', function () {
      var p = lista(); p.cuadro(); p.cuadro(); var n = p.dibujo.arcos.length, a = p.dibujo.arcos.slice(-n);
      p.ocultar(); p.cuadro(10000); p.mostrar(); p.cuadro(); if (p.dibujo.arcos.length === 2 * n) p.cuadro();
      var b = p.dibujo.arcos.slice(-n), m = 0;
      for (var j = 0; j < n; j++) if (a[j][1] > 100) m = Math.max(m, Math.abs(a[j][1] - b[j][1]));
      return m <= 2 || 'una mota salta ' + m.toFixed(1) + ' píxeles de golpe';
    });
    return res;
  };
});

if (typeof require === 'function' && typeof module === 'object' && require.main === module) {
  var html = require('fs').readFileSync(process.argv[2], 'utf8'), m, texto = null, re = /<script[^>]*>([\s\S]*?)<\/script>/g;
  while ((m = re.exec(html))) if (m[1].indexOf('cg-polvo') >= 0) texto = m[1];
  if (texto === null) texto = html;                    // también vale un archivo que sea solo el script
  var res = module.exports(texto), mal = res.filter(function (r) { return !r.ok; });
  res.forEach(function (r) { console.log((r.ok ? 'bien  ' : 'FALLA ') + r.nombre + (r.ok ? '' : ' -> ' + r.detalle)); });
  console.log((res.length - mal.length) + ' de ' + res.length + ' pruebas pasan');
  process.exit(mal.length ? 1 : 0);
}
