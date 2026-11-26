// Candado de la Euskal Etxea Urdaneta.
//
// La casa (el HTML de la página) vive en la base de datos D1 de la pieza
// «espectador-puente» y solo sale de ahí con la clave correcta. Blogger guarda
// únicamente la puerta. Aquí no hay ninguna clave ni ninguna huella: la huella
// de la clave está en la tabla etxea_cfg.
//
//   POST /etxea/abrir      {clave}            → la casa + un pase de 12 horas
//   GET  /etxea/contenido  Authorization      → la casa, con el pase
//   GET|POST /etxea/carga  X-Carga            → subir o leer un documento
//                                               (solo mientras el canal esté abierto)

export const ESQUEMA = [
  'CREATE TABLE IF NOT EXISTS etxea_cfg (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS etxea_doc (nombre TEXT NOT NULL, parte INTEGER NOT NULL, texto TEXT NOT NULL, PRIMARY KEY (nombre, parte))',
  'CREATE TABLE IF NOT EXISTS etxea_intentos (ip TEXT NOT NULL, ts INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS etxea_intentos_ip ON etxea_intentos (ip, ts)',
];

const ORIGENES = ['https://www.eedh.us', 'https://eedh.us'];
const MAX_FALLOS = 8; //       fallos seguidos antes de bloquear una dirección
const VENTANA = 900; //        segundos que dura el bloqueo
const VIDA_PASE = 43200; //    segundos que vale el pase de sesión
const MAX_TROZO = 120000; //   letras por trozo de carga
const MAX_CLAVE = 200;

const letras = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha256 = async (texto) => hex(await crypto.subtle.digest('SHA-256', letras.encode(texto)));
const ahora = () => Math.floor(Date.now() / 1000);

// Compara sin revelar por el tiempo cuántas letras coinciden.
function iguales(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

async function firma(secreto, texto) {
  const llave = await crypto.subtle.importKey('raw', letras.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', llave, letras.encode(texto)));
}

function permisos(req, abierto) {
  if (abierto) return { 'Access-Control-Allow-Origin': '*' };
  const origen = req.headers.get('Origin') || '';
  return ORIGENES.includes(origen) ? { 'Access-Control-Allow-Origin': origen, Vary: 'Origin' } : {};
}

function json(estado, cuerpo, cabeceras) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras },
  });
}

const cfg = (db, k) => db.prepare('SELECT v FROM etxea_cfg WHERE k = ?').bind(k).first('v');

async function leer(db, nombre) {
  const { results } = await db.prepare('SELECT texto FROM etxea_doc WHERE nombre = ? ORDER BY parte').bind(nombre).all();
  return results.length ? results.map((f) => f.texto).join('') : null;
}

async function secreto(db) {
  let s = await cfg(db, 'firma');
  if (!s) {
    s = hex(crypto.getRandomValues(new Uint8Array(32)));
    await db.prepare("INSERT OR IGNORE INTO etxea_cfg (k, v) VALUES ('firma', ?)").bind(s).run();
    s = await cfg(db, 'firma');
  }
  return s;
}

async function nuevoPase(db) {
  const caduca = ahora() + VIDA_PASE;
  return caduca + '.' + await firma(await secreto(db), 'etxea:' + caduca);
}

async function paseValido(db, pase) {
  const m = /^(\d{10})\.([0-9a-f]{64})$/.exec(pase || '');
  if (!m || Number(m[1]) <= ahora()) return false;
  return iguales(m[2], await firma(await secreto(db), 'etxea:' + m[1]));
}

function casa(html, cabeceras) {
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras },
  });
}

async function abrir(req, db) {
  const cors = permisos(req, false);
  const ip = await sha256('ip:' + (req.headers.get('CF-Connecting-IP') || '?'));
  const fallos = await db.prepare('SELECT COUNT(*) AS n FROM etxea_intentos WHERE ip = ? AND ts > ?').bind(ip, ahora() - VENTANA).first('n');
  if (fallos >= MAX_FALLOS) return json(429, { ok: false, error: 'espera' }, { ...cors, 'Retry-After': String(VENTANA) });

  let clave = '';
  try { clave = String((await req.json()).clave ?? ''); } catch (e) { clave = ''; }
  clave = clave.trim().toLowerCase();
  if (!clave || clave.length > MAX_CLAVE) return json(400, { ok: false, error: 'vacia' }, cors);

  const huella = await sha256(clave);
  const [buena, segunda] = [await cfg(db, 'hash'), await cfg(db, 'hash2')];
  const acierta = iguales(huella, buena) | iguales(huella, segunda);
  if (!acierta) {
    await db.batch([
      db.prepare('INSERT INTO etxea_intentos (ip, ts) VALUES (?, ?)').bind(ip, ahora()),
      db.prepare('DELETE FROM etxea_intentos WHERE ts <= ?').bind(ahora() - VENTANA),
    ]);
    return json(401, { ok: false, error: 'clave' }, cors);
  }

  await db.prepare('DELETE FROM etxea_intentos WHERE ip = ?').bind(ip).run();
  const html = await leer(db, 'contenido');
  if (html === null) return json(503, { ok: false, error: 'vacio' }, cors);
  return casa(html, { ...cors, 'X-Etxea-Token': await nuevoPase(db), 'Access-Control-Expose-Headers': 'X-Etxea-Token' });
}

async function contenido(req, db) {
  const cors = permisos(req, false);
  const pase = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await paseValido(db, pase))) return json(401, { ok: false, error: 'pase' }, cors);
  const html = await leer(db, 'contenido');
  if (html === null) return json(503, { ok: false, error: 'vacio' }, cors);
  return casa(html, cors);
}

// Canal de carga: existe solo mientras etxea_cfg tenga la huella «carga».
async function carga(req, db, url) {
  const cors = permisos(req, true);
  const esperada = await cfg(db, 'carga');
  if (!esperada) return json(404, { ok: false, error: 'cerrado' }, cors);
  if (!iguales(await sha256(req.headers.get('X-Carga') || ''), esperada)) return json(403, { ok: false, error: 'pase' }, cors);

  const doc = url.searchParams.get('doc') || '';
  if (!/^[a-z0-9-]{1,40}$/.test(doc)) return json(400, { ok: false, error: 'doc' }, cors);

  if (req.method === 'GET') {
    const texto = await leer(db, doc);
    return texto === null ? json(404, { ok: false, error: 'doc' }, cors) : casa(texto, cors);
  }

  const parte = Number(url.searchParams.get('parte') ?? 'x');
  if (!Number.isInteger(parte) || parte < 0 || parte > 99) return json(400, { ok: false, error: 'parte' }, cors);
  const texto = await req.text();
  if (texto.length > MAX_TROZO) return json(413, { ok: false, error: 'largo' }, cors);

  const ordenes = [];
  if (parte === 0) ordenes.push(db.prepare('DELETE FROM etxea_doc WHERE nombre = ?').bind(doc));
  ordenes.push(db.prepare('INSERT OR REPLACE INTO etxea_doc (nombre, parte, texto) VALUES (?, ?, ?)').bind(doc, parte, texto));
  await db.batch(ordenes);

  if (!url.searchParams.get('fin')) return json(200, { ok: true }, cors);
  const todo = await leer(db, doc);
  const partes = await db.prepare('SELECT COUNT(*) AS n FROM etxea_doc WHERE nombre = ?').bind(doc).first('n');
  return json(200, { ok: true, partes, largo: todo.length, sha256: await sha256(todo) }, cors);
}

async function despachar(req, env, url) {
  const ruta = url.pathname.replace(/^\/etxea\//, '');
  const rutas = { abrir: ['POST', abrir], contenido: ['GET', contenido], carga: ['GET POST', carga] };
  if (!rutas[ruta]) return json(404, { ok: false, error: 'ruta' }, permisos(req, false));
  const [metodos, hacer] = rutas[ruta];
  if (!metodos.split(' ').includes(req.method)) return json(405, { ok: false, error: 'metodo' }, permisos(req, ruta === 'carga'));
  return hacer(req, env.DB, url);
}

export async function etxea(req, env, url) {
  const abierto = url.pathname === '/etxea/carga';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...permisos(req, abierto),
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Carga',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  try {
    try {
      return await despachar(req, env, url);
    } catch (e) {
      // Primera vez: las tablas aún no existen. Se crean y se repite la orden.
      if (!/no such table/i.test(String(e && e.message))) throw e;
      await env.DB.batch(ESQUEMA.map((sql) => env.DB.prepare(sql)));
      return await despachar(req, env, url);
    }
  } catch (e) {
    return json(500, { ok: false, error: 'interno', detalle: String(e && e.message).slice(0, 120) }, permisos(req, abierto));
  }
}
