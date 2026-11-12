"""Calcula las huellas SHA-384 de las hojas y las escribe en motor.js."""
import base64, hashlib, json, pathlib, re, sys

raiz = pathlib.Path(__file__).resolve().parent.parent
hojas = sorted(p for p in raiz.rglob('*') if p.suffix in {'.js', '.css', '.html'}
               and p.name != 'motor.js' and 'herramientas' not in p.parts)

def huella(p):
    return 'sha384-' + base64.b64encode(hashlib.sha384(p.read_bytes()).digest()).decode()

mapa = {str(p.relative_to(raiz)).replace('\\', '/'): huella(p) for p in hojas}
motor = raiz / 'motor.js'
src = motor.read_text(encoding='utf-8')
src = re.sub(r'var HUELLAS = \{.*?\};', 'var HUELLAS = ' + json.dumps(mapa, indent=2).replace('\n', '\n  ') + ';', src, flags=re.S)
motor.write_text(src, encoding='utf-8')
print(json.dumps(mapa, indent=2))
print('motor.js', huella(motor))
