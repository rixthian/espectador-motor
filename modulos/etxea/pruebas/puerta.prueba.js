// Pruebas de la puerta de la Etxea (modulos/etxea/puerta.html).
// Se ejecutan en un navegador de verdad: pega este archivo en la consola de
// cualquier página del blog y llama a  await probarPuerta(textoDePuertaHtml).
// La red se sustituye por respuestas de mentira: no sale ninguna petición.
async function probarPuerta(puertaHtml) {
  const res = [];
  const ok = (nombre, cond, extra) => res.push((cond ? 'ok    ' : 'FALLA ') + nombre + (cond || extra === undefined ? '' : ' → ' + extra));
  // Esperas sin setTimeout: en una pestaña de fondo el navegador los frena.
  const cede = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
  const espera = async (ms) => { const fin = performance.now() + ms; while (performance.now() < fin) await cede(); };
  const hasta = async (cond, max) => { const fin = performance.now() + max; while (!cond() && performance.now() < fin) await cede(); return cond(); };
  const fetchReal = window.fetch;
  const paseAntes = sessionStorage.getItem('eeu-t');
  const PASE = '1795700000.' + 'a'.repeat(64);
  const CASA = '<div class="sbz-cg prueba-casa"><script>window.__casaViva=(window.__casaViva||0)+1<\/script>Hola</div>';

  async function monta(respuestas, paseGuardado) {
    document.querySelectorAll('.prueba-caja').forEach((e) => e.remove());
    document.documentElement.classList.remove('eeu-lock');
    sessionStorage.removeItem('eeu-t');
    if (paseGuardado) sessionStorage.setItem('eeu-t', paseGuardado);
    window.__casaViva = 0;
    const llamadas = [];
    window.fetch = (u, op) => {
      llamadas.push({ u: String(u), op: op || {} });
      const r = respuestas.shift();
      if (!r || r === 'red') return Promise.reject(new TypeError('sin red'));
      return Promise.resolve(new Response(r.cuerpo || '', { status: r.st, headers: r.pase ? { 'X-Etxea-Token': r.pase } : {} }));
    };
    const caja = document.createElement('div');
    caja.className = 'prueba-caja';
    document.body.appendChild(caja);
    caja.innerHTML = puertaHtml;
    // Igual que el motor del blog: vuelve a crear cada guion para que se ejecute.
    [...caja.querySelectorAll('script')].forEach((o) => { const n = document.createElement('script'); n.text = o.text; o.parentNode.replaceChild(n, o); });
    await espera(80);
    return {
      llamadas,
      puerta: () => caja.querySelector('#eeu-puerta'),
      visible: () => { const g = caja.querySelector('#eeu-puerta'); return !!g && !g.hidden && !g.classList.contains('eeu-sale'); },
      aviso: () => (caja.querySelector('#eeu-err') || {}).textContent || '',
      boton: () => caja.querySelector('#eeu-f button'),
      casa: () => caja.querySelector('.prueba-casa'),
      enviar: async (v) => {
        caja.querySelector('#eeu-i').value = v;
        caja.querySelector('#eeu-f').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        await espera(80);
      },
    };
  }

  try {
    let p = await monta([]);
    ok('sin pase enseña la puerta y bloquea la página', p.visible() && document.documentElement.classList.contains('eeu-lock'));
    ok('sin pase no llama a nadie', p.llamadas.length === 0, p.llamadas.length);
    await p.enviar('   ');
    ok('la clave vacía no se envía', p.llamadas.length === 0, p.llamadas.length);

    p = await monta([{ st: 200, cuerpo: CASA, pase: PASE }]);
    await p.enviar('una-clave');
    const ll = p.llamadas[0] || { op: {} };
    ok('la clave viaja por POST a /etxea/abrir en el cuerpo', /\/etxea\/abrir$/.test(ll.u) && ll.op.method === 'POST' && ll.op.body === '{"clave":"una-clave"}', ll.u + ' ' + ll.op.body);
    ok('la clave buena monta la casa en la página', !!p.casa());
    ok('los guiones de la casa se ejecutan una vez', window.__casaViva === 1, window.__casaViva);
    ok('guarda el pase de la sesión', sessionStorage.getItem('eeu-t') === PASE);
    ok('desbloquea la página y borra la clave del campo', !document.documentElement.classList.contains('eeu-lock') && p.puerta().querySelector('#eeu-i').value === '');
    ok('la puerta se retira', await hasta(() => !p.puerta(), 4000));

    p = await monta([{ st: 401, cuerpo: '{"ok":false,"error":"clave"}' }]);
    await p.enviar('mala');
    ok('la clave mala avisa y deja probar de nuevo', /Clave incorrecta/.test(p.aviso()) && p.visible() && !p.boton().disabled && !p.casa(), p.aviso());

    p = await monta([{ st: 429 }]);
    await p.enviar('x');
    ok('el bloqueo por intentos se explica', /Demasiados intentos/.test(p.aviso()), p.aviso());

    p = await monta([{ st: 503 }]);
    await p.enviar('x');
    ok('si la casa no está cargada, lo dice', /no responde/.test(p.aviso()) && !p.boton().disabled, p.aviso());

    p = await monta(['red']);
    await p.enviar('x');
    ok('sin conexión, lo dice y deja reintentar', /No hay conexión/.test(p.aviso()) && !p.boton().disabled, p.aviso());

    p = await monta([{ st: 200, cuerpo: CASA }], 'pase-guardado');
    const l2 = p.llamadas[0] || { op: { headers: {} } };
    ok('con pase guardado pide la casa sin clave', /\/etxea\/contenido$/.test(l2.u) && (l2.op.headers || {}).Authorization === 'Bearer pase-guardado', l2.u);
    ok('con pase guardado monta la casa', !!p.casa() && window.__casaViva === 1);

    p = await monta([{ st: 401 }], 'pase-caducado');
    ok('un pase caducado se borra y vuelve la puerta', sessionStorage.getItem('eeu-t') === null && p.visible() && !p.boton().disabled && p.aviso() === '');
  } finally {
    window.fetch = fetchReal;
    document.querySelectorAll('.prueba-caja').forEach((e) => e.remove());
    document.documentElement.classList.remove('eeu-lock');
    if (paseAntes === null) sessionStorage.removeItem('eeu-t'); else sessionStorage.setItem('eeu-t', paseAntes);
  }
  return res;
}
if (typeof module !== 'undefined') module.exports = { probarPuerta };
