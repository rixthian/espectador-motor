// Pruebas de herramientas/fichas.js: leer, escribir y retirar fichas
// del árbol de la Euskal Etxea Urdaneta.  node --test herramientas/pruebas/
const test = require('node:test');
const assert = require('node:assert/strict');
const { leer, escribir, retirar } = require('../fichas.js');

// Años en base 36: 1900=1gs 1925=1hh 1930=1hm 1955=1ib 1960=1ig 1970=1iq 1990=1ja 2010=1ju
const W = 'Ana Luis Paz Rosa Bilbao Eva Leo Sol';
const FILAS = [
  '0.2|1gs|1iq|4|', //        0 Ana Paz 1900-1970, Bilbao, raíz
  '1.2|1hm||4|1|3.2', //      1 Luis Paz 1930-, hijo de Ana, casado con «Rosa Paz»
  '3.2|1hm|1ju||2', //        2 Rosa Paz 1930-2010, hija de Ana
  '5.2|1ib|||1|1.2|4', //     3 Eva Paz 1955-, hija de Rosa y de Leo, casada con «Luis Paz»
  '6.2|1hh|1ja||', //         4 Leo Paz 1925-1990, sin padre anotado
  '7.2|1ig|1ju||2', //        5 Sol Paz 1960-2010, hija de Eva
];
const json = (inicio = 2) => ({ w: W, d: FILAS.join('~'), n: 6, inicio, nota: 'Solo personas fallecidas.' });

test('leer descifra nombre, años, lugar, padres y cónyuge', () => {
  const datos = leer(json());
  assert.deepEqual(datos.filas[3], {
    nombre: 'Eva Paz', nace: 1955, muere: 0, lugar: '', padre: 2, conyuge: 'Luis Paz', otro: 4, extra: '',
  });
  assert.deepEqual(datos.filas[0], {
    nombre: 'Ana Paz', nace: 1900, muere: 1970, lugar: 'Bilbao', padre: -1, conyuge: '', otro: -1, extra: '',
  });
  assert.equal(datos.inicio, 2);
});

test('escribir devuelve el mismo texto que se leyó', () => {
  const salida = escribir(leer(json()));
  assert.equal(salida.d, FILAS.join('~'));
  assert.equal(salida.w, W);
  assert.equal(salida.n, 6);
  assert.equal(salida.nota, 'Solo personas fallecidas.');
});

test('retirar quita la ficha y recoloca a padres, otro progenitor e inicio', () => {
  const { datos } = retirar(leer(json()), [1]);
  const salida = escribir(datos);
  assert.equal(salida.d, [
    '0.2|1gs|1iq|4|',
    '3.2|1hm|1ju||1', //   Rosa sigue colgando de Ana
    '5.2|1ib|||1||3', //   Eva: padre Rosa (ahora 1), otro progenitor Leo (ahora 3)
    '6.2|1hh|1ja||',
    '7.2|1ig|1ju||2', //   Sol sigue colgando de Eva
  ].join('~'));
  assert.equal(salida.n, 5);
  assert.equal(salida.inicio, 1);
});

test('retirar borra el nombre retirado donde figura como cónyuge', () => {
  const { datos, callados } = retirar(leer(json()), [1]);
  assert.equal(datos.filas[2].nombre, 'Eva Paz');
  assert.equal(datos.filas[2].conyuge, '');
  assert.deepEqual(callados, [{ nombre: 'Eva Paz', conyuge: 'Luis Paz' }]);
});

// Otro «Luis Paz» (1890-1950) que se queda: un tocayo del retirado.
const TOCAYO = '1.2|1gi|1i6||';

test('retirar respeta el cónyuge cuando quien se queda es un tocayo del retirado', () => {
  const con = { ...json(), d: [...FILAS, TOCAYO].join('~'), n: 7 };
  const { datos, callados } = retirar(leer(con), [1]);
  assert.equal(datos.filas[2].conyuge, 'Luis Paz');
  assert.deepEqual(callados, []);
});

test('retirar borra el cónyuge aunque haya un tocayo si la pareja era el retirado', () => {
  const filas = [...FILAS, TOCAYO];
  filas[1] = '1.2|1hm||4|1|5.2'; // el Luis retirado dice estar casado con «Eva Paz»
  const { datos, callados } = retirar(leer({ ...json(), d: filas.join('~'), n: 7 }), [1]);
  assert.equal(datos.filas[2].conyuge, '');
  assert.deepEqual(callados, [{ nombre: 'Eva Paz', conyuge: 'Luis Paz' }]);
});

test('retirar tacha del diccionario las palabras que ya nadie usa', () => {
  const { datos } = retirar(leer(json()), [1]);
  assert.equal(escribir(datos).w, 'Ana · Paz Rosa Bilbao Eva Leo Sol');
});

test('retirar devuelve las fichas retiradas con su lugar de origen', () => {
  const { retiradas } = retirar(leer(json()), [1]);
  assert.deepEqual(retiradas, [{
    indice: 1,
    padre: 'Ana Paz',
    fila: { nombre: 'Luis Paz', nace: 1930, muere: 0, lugar: 'Bilbao', padre: 0, conyuge: 'Rosa Paz', otro: -1, extra: '' },
  }]);
});

test('retirar se niega si la ficha tiene hijos que se quedan', () => {
  assert.throws(() => retirar(leer(json()), [3]), /hijos/);
});

test('retirar se niega si la ficha es el otro progenitor de alguien que se queda', () => {
  assert.throws(() => retirar(leer(json()), [4]), /hijos/);
});

test('retirar se niega a quitar la ficha de inicio', () => {
  assert.throws(() => retirar(leer(json(1)), [1]), /inicio/);
});

test('escribir se niega ante una palabra que no está en el diccionario', () => {
  const datos = leer(json());
  datos.filas[0].lugar = 'Vitoria';
  assert.throws(() => escribir(datos), /Vitoria/);
});
