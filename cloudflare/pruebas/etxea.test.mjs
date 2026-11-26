// Pruebas del candado de la Euskal Etxea Urdaneta (cloudflare/etxea.mjs).
// La base de datos es SQLite de verdad (node:sqlite) con la forma de D1.
//   node --test cloudflare/pruebas/etxea.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { etxea, ESQUEMA } from '../etxea.mjs';

// sha256('abc'), vector de prueba conocido.
const HUELLA_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const BASE = 'https://espectador-puente.espectador-historias.workers.dev';
const CASA = '<div class="sbz-cg">Casa</div><p>fin</p>';

function d1() {
  const sq = new DatabaseSync(':memory:');
  const orden = (sql, args = []) => ({
    bind: (...a) => orden(sql, a),
    first: async (col) => {
      const fila = sq.prepare(sql).get(...args);
      return fila === undefined ? null : (col ? fila[col] : fila);
    },
    all: async () => ({ results: sq.prepare(sql).all(...args) }),
    run: async () => { sq.prepare(sql).run(...args); return { success: true }; },
  });
  return {
    prepare: (sql) => orden(sql),
    batch: async (lista) => { for (const o of lista) await o.run(); return []; },
    sq,
  };
}

function casa({ conContenido = true } = {}) {
  const DB = d1();
  for (const sql of ESQUEMA) DB.sq.exec(sql);
  DB.sq.prepare("INSERT INTO etxea_cfg (k, v) VALUES ('hash', ?)").run(HUELLA_ABC);
  if (conContenido) {
    // Guardadas al revés para comprobar que se sirven por orden de parte.
    DB.sq.prepare("INSERT INTO etxea_doc (nombre, parte, texto) VALUES ('contenido', 1, '<p>fin</p>')").run();
    DB.sq.prepare("INSERT INTO etxea_doc (nombre, parte, texto) VALUES ('contenido', 0, '<div class=\"sbz-cg\">Casa</div>')").run();
  }
  return { DB };
}

function llamar(env, ruta, { metodo = 'GET', origen = 'https://www.eedh.us', cuerpo, cabeceras = {}, ip = '203.0.113.7' } = {}) {
  const req = new Request(BASE + ruta, {
    method: metodo,
    headers: { Origin: origen, 'CF-Connecting-IP': ip, ...cabeceras },
    body: cuerpo,
  });
  return etxea(req, env, new URL(req.url));
}
const abrir = (env, clave, mas = {}) => llamar(env, '/etxea/abrir', {
  metodo: 'POST', cuerpo: JSON.stringify({ clave }), cabeceras: { 'Content-Type': 'application/json' }, ...mas,
});
const conPase = (env, pase) => llamar(env, '/etxea/contenido', { cabeceras: { Authorization: 'Bearer ' + pase } });

test('la clave buena abre: entrega la casa entera, por orden, con un pase', async () => {
  const r = await abrir(casa(), 'abc');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), CASA);
  assert.match(r.headers.get('X-Etxea-Token'), /^\d{10}\.[0-9a-f]{64}$/);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://www.eedh.us');
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
});

test('la clave vale con espacios alrededor y en mayúsculas, como en la puerta vieja', async () => {
  const r = await abrir(casa(), '  ABC ');
  assert.equal(r.status, 200);
});

test('la clave mala no abre ni deja ver nada de la casa', async () => {
  const r = await abrir(casa(), 'abd');
  assert.equal(r.status, 401);
  assert.deepEqual(await r.json(), { ok: false, error: 'clave' });
  assert.equal(r.headers.get('X-Etxea-Token'), null);
});

test('una segunda huella guardada (hash2) también abre', async () => {
  const env = casa();
  env.DB.sq.prepare("UPDATE etxea_cfg SET v = ? WHERE k = 'hash'").run('0'.repeat(64));
  env.DB.sq.prepare("INSERT INTO etxea_cfg (k, v) VALUES ('hash2', ?)").run(HUELLA_ABC);
  assert.equal((await abrir(env, 'abc')).status, 200);
});

test('la clave vacía o demasiado larga se rechaza sin contar como fallo', async () => {
  const env = casa();
  for (let i = 0; i < 12; i++) assert.equal((await abrir(env, '   ')).status, 400);
  assert.equal((await abrir(env, 'x'.repeat(201))).status, 400);
  assert.equal((await abrir(env, 'abc')).status, 200);
});

test('tras 8 fallos la puerta se bloquea, incluso para la clave buena', async () => {
  const env = casa();
  for (let i = 0; i < 8; i++) assert.equal((await abrir(env, 'mala' + i)).status, 401);
  const r = await abrir(env, 'abc');
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { ok: false, error: 'espera' });
});

test('el bloqueo es por dirección: otra persona puede entrar', async () => {
  const env = casa();
  for (let i = 0; i < 8; i++) await abrir(env, 'mala' + i);
  assert.equal((await abrir(env, 'abc', { ip: '198.51.100.9' })).status, 200);
});

test('el bloqueo se levanta pasados 15 minutos', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1795660000000 });
  const env = casa();
  for (let i = 0; i < 8; i++) await abrir(env, 'mala' + i);
  t.mock.timers.tick(901 * 1000);
  assert.equal((await abrir(env, 'abc')).status, 200);
});

test('entrar bien borra los fallos anteriores de esa dirección', async () => {
  const env = casa();
  for (let i = 0; i < 7; i++) await abrir(env, 'mala' + i);
  assert.equal((await abrir(env, 'abc')).status, 200);
  for (let i = 0; i < 7; i++) await abrir(env, 'otra' + i);
  assert.equal((await abrir(env, 'abc')).status, 200);
});

test('el pase devuelve la casa sin volver a pedir la clave', async () => {
  const env = casa();
  const pase = (await abrir(env, 'abc')).headers.get('X-Etxea-Token');
  const r = await conPase(env, pase);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), CASA);
});

test('un pase con la firma cambiada no vale', async () => {
  const env = casa();
  const pase = (await abrir(env, 'abc')).headers.get('X-Etxea-Token');
  const falso = pase.slice(0, -1) + (pase.endsWith('0') ? '1' : '0');
  assert.equal((await conPase(env, falso)).status, 401);
});

test('un pase con la caducidad alargada a mano no vale', async () => {
  const env = casa();
  const pase = (await abrir(env, 'abc')).headers.get('X-Etxea-Token');
  const [caduca, firma] = pase.split('.');
  assert.equal((await conPase(env, (Number(caduca) + 86400) + '.' + firma)).status, 401);
});

test('el pase caduca a las 12 horas', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1795660000000 });
  const env = casa();
  const pase = (await abrir(env, 'abc')).headers.get('X-Etxea-Token');
  t.mock.timers.tick((12 * 3600 - 5) * 1000);
  assert.equal((await conPase(env, pase)).status, 200);
  t.mock.timers.tick(10 * 1000);
  assert.equal((await conPase(env, pase)).status, 401);
});

test('sin pase no hay contenido', async () => {
  assert.equal((await llamar(casa(), '/etxea/contenido')).status, 401);
});

test('si la casa aún no está cargada, la clave buena recibe un 503 claro', async () => {
  const r = await abrir(casa({ conContenido: false }), 'abc');
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { ok: false, error: 'vacio' });
});

test('otro sitio web no recibe permiso para leer la respuesta', async () => {
  const r = await abrir(casa(), 'abc', { origen: 'https://otro-sitio.example' });
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});

test('el navegador recibe permiso previo para enviar el pase desde el blog', async () => {
  const r = await llamar(casa(), '/etxea/contenido', {
    metodo: 'OPTIONS',
    cabeceras: { 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' },
  });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://www.eedh.us');
  assert.match(r.headers.get('Access-Control-Allow-Headers'), /Authorization/i);
});

test('con la base de datos vacía crea sus tablas y responde con normalidad', async () => {
  const env = { DB: d1() };
  assert.equal((await abrir(env, 'abc')).status, 401);
  assert.equal(env.DB.sq.prepare('SELECT COUNT(*) AS n FROM etxea_intentos').get().n, 1);
});

test('una ruta desconocida da 404 y un método equivocado 405', async () => {
  const env = casa();
  assert.equal((await llamar(env, '/etxea/otra')).status, 404);
  assert.equal((await llamar(env, '/etxea/abrir')).status, 405);
});

// ---------- Canal de carga ----------

const PASE_CARGA = 'pase-de-carga-de-un-solo-uso';
async function conCanal(env) {
  const { createHash } = await import('node:crypto');
  env.DB.sq.prepare("INSERT INTO etxea_cfg (k, v) VALUES ('carga', ?)").run(createHash('sha256').update(PASE_CARGA).digest('hex'));
  return env;
}
const subir = (env, consulta, texto, pase = PASE_CARGA) => llamar(env, '/etxea/carga?' + consulta, {
  metodo: 'POST', cuerpo: texto, cabeceras: { 'X-Carga': pase, 'Content-Type': 'text/plain' }, origen: 'https://www.blogger.com',
});

test('el canal de carga no existe mientras nadie lo abra', async () => {
  assert.equal((await subir(casa(), 'doc=contenido&parte=0', 'x')).status, 404);
});

test('el canal de carga rechaza un pase equivocado', async () => {
  const env = await conCanal(casa());
  assert.equal((await subir(env, 'doc=contenido&parte=0', 'x', 'otro-pase')).status, 403);
});

test('subir por partes guarda el documento y devuelve su largo y su huella', async () => {
  const env = await conCanal(casa());
  assert.equal((await subir(env, 'doc=nuevo&parte=0', 'a')).status, 200);
  const r = await subir(env, 'doc=nuevo&parte=1&fin=1', 'bc');
  assert.deepEqual(await r.json(), { ok: true, partes: 2, largo: 3, sha256: HUELLA_ABC });
});

test('volver a subir desde la parte 0 sustituye el documento entero', async () => {
  const env = await conCanal(casa());
  await subir(env, 'doc=contenido&parte=0&fin=1', '<div class="sbz-cg">Nueva</div>');
  assert.equal(await (await abrir(env, 'abc')).text(), '<div class="sbz-cg">Nueva</div>');
});

test('el canal devuelve un documento guardado, para poder volver atrás', async () => {
  const env = await conCanal(casa());
  const r = await llamar(env, '/etxea/carga?doc=contenido', { cabeceras: { 'X-Carga': PASE_CARGA }, origen: 'https://www.blogger.com' });
  assert.equal(r.status, 200);
  assert.equal(await r.text(), CASA);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), '*');
});

test('el canal rechaza nombres raros y trozos de más de 120 000 letras', async () => {
  const env = await conCanal(casa());
  assert.equal((await subir(env, 'doc=../x&parte=0', 'x')).status, 400);
  assert.equal((await subir(env, 'doc=contenido&parte=-1', 'x')).status, 400);
  assert.equal((await subir(env, 'doc=contenido&parte=0', 'x'.repeat(120001))).status, 413);
});
