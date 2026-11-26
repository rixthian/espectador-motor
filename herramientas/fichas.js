// Fichas del árbol de la Euskal Etxea Urdaneta: leer, escribir y retirar.
//
// Los datos viajan comprimidos: «w» es un diccionario de palabras y «d» una
// fila por persona (nombre|nace|muere|lugar|padre|cónyuge|otro|extra), con los
// números en base 36. El padre se anota como distancia hacia atrás y el otro
// progenitor como posición absoluta, así que retirar una fila obliga a
// recolocar todas las demás. Este archivo sirve igual en Node y en el navegador.
(function (raiz) {
  var TACHA = '·'; // ocupa el hueco de una palabra que ya nadie usa

  function b36(n) { return n.toString(36); }

  function leer(json) {
    var palabras = json.w.split(' ');
    function texto(c) {
      return c ? c.split('.').map(function (x) { return palabras[parseInt(x, 36)]; }).join(' ') : '';
    }
    var filas = json.d.split('~').map(function (r, i) {
      var f = r.split('|');
      return {
        nombre: texto(f[0]),
        nace: f[1] ? parseInt(f[1], 36) : 0,
        muere: f[2] ? parseInt(f[2], 36) : 0,
        lugar: texto(f[3] || ''),
        padre: f[4] ? i - parseInt(f[4], 36) : -1,
        conyuge: texto(f[5] || ''),
        otro: f[6] ? parseInt(f[6], 36) : -1,
        extra: texto(f[7] || ''),
      };
    });
    return { palabras: palabras, filas: filas, inicio: json.inicio || 0, nota: json.nota || '' };
  }

  function escribir(datos) {
    var pos = new Map();
    datos.palabras.forEach(function (p, i) { if (p !== TACHA && !pos.has(p)) pos.set(p, i); });
    function codigo(t) {
      if (!t) return '';
      return t.split(' ').map(function (p) {
        if (!pos.has(p)) throw new Error('Palabra fuera del diccionario: ' + p);
        return b36(pos.get(p));
      }).join('.');
    }
    var d = datos.filas.map(function (f, i) {
      var c = [
        codigo(f.nombre),
        f.nace ? b36(f.nace) : '',
        f.muere ? b36(f.muere) : '',
        codigo(f.lugar),
        f.padre >= 0 ? b36(i - f.padre) : '',
        codigo(f.conyuge),
        f.otro >= 0 ? b36(f.otro) : '',
        codigo(f.extra),
      ];
      while (c.length > 5 && c[c.length - 1] === '') c.pop();
      return c.join('|');
    }).join('~');
    return { w: datos.palabras.join(' '), d: d, n: datos.filas.length, inicio: datos.inicio, nota: datos.nota };
  }

  // Quita las fichas pedidas. También borra su nombre donde figure como
  // cónyuge de otra ficha y tacha del diccionario las palabras huérfanas.
  function retirar(datos, indices) {
    var filas = datos.filas;
    var fuera = new Set(indices);
    if (fuera.has(datos.inicio)) throw new Error('No se puede retirar la ficha de inicio');
    filas.forEach(function (f, i) {
      if (fuera.has(i)) return;
      var p = fuera.has(f.padre) ? f.padre : (fuera.has(f.otro) ? f.otro : -1);
      if (p >= 0) throw new Error('La ficha ' + p + ' tiene hijos que se quedan');
    });

    var nuevo = [];
    var cuenta = 0;
    filas.forEach(function (f, i) { nuevo[i] = fuera.has(i) ? -1 : cuenta++; });

    var nombres = new Set(indices.map(function (i) { return filas[i].nombre; }));
    // Un tocayo que se queda puede ser la verdadera pareja: solo se borra el
    // cónyuge si no hay tocayo, o si el retirado nombraba a esa ficha como suya.
    var tocayos = new Set();
    filas.forEach(function (f, i) { if (!fuera.has(i) && nombres.has(f.nombre)) tocayos.add(f.nombre); });
    function sinTrato(s) { return s.replace(/^(Dⁿ|D\.ª) /, ''); }
    var parejas = new Map();
    indices.forEach(function (i) {
      var r = filas[i];
      if (!r.conyuge) return;
      if (!parejas.has(r.nombre)) parejas.set(r.nombre, new Set());
      parejas.get(r.nombre).add(sinTrato(r.conyuge));
    });
    function eraSuPareja(g) { return parejas.has(g.conyuge) && parejas.get(g.conyuge).has(sinTrato(g.nombre)); }
    var callados = [];
    var quedan = [];
    filas.forEach(function (f, i) {
      if (fuera.has(i)) return;
      var g = Object.assign({}, f, {
        padre: f.padre >= 0 ? nuevo[f.padre] : -1,
        otro: f.otro >= 0 ? nuevo[f.otro] : -1,
      });
      if (g.conyuge && nombres.has(g.conyuge) && (eraSuPareja(g) || !tocayos.has(g.conyuge))) {
        callados.push({ nombre: g.nombre, conyuge: g.conyuge });
        g.conyuge = '';
      }
      quedan.push(g);
    });

    var usadas = new Set();
    quedan.forEach(function (f) {
      [f.nombre, f.lugar, f.conyuge, f.extra].forEach(function (t) {
        if (t) t.split(' ').forEach(function (p) { usadas.add(p); });
      });
    });
    var palabras = datos.palabras.map(function (p) { return usadas.has(p) ? p : TACHA; });

    var retiradas = indices.slice().sort(function (a, b) { return a - b; }).map(function (i) {
      return { indice: i, padre: filas[i].padre >= 0 ? filas[filas[i].padre].nombre : '', fila: filas[i] };
    });

    return {
      datos: { palabras: palabras, filas: quedan, inicio: nuevo[datos.inicio], nota: datos.nota },
      retiradas: retiradas,
      callados: callados,
    };
  }

  var api = { leer: leer, escribir: escribir, retirar: retirar };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  raiz.Fichas = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
