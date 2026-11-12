"""Calcula las huellas SHA-384 de las hojas de modulos/ y las escribe en nucleo/motor.js."""
import base64, hashlib, json, pathlib, re

raiz = pathlib.Path(__file__).resolve().parent.parent
hojas = sorted(p for p in (raiz / 'modulos').rglob('*') if p.suffix in {'.js', '.css', '.html'})

def huella(p):
    return 'sha384-' + base64.b64encode(hashlib.sha384(p.read_bytes()).digest()).decode()

mapa = {p.relative_to(raiz).as_posix(): huella(p) for p in hojas}
motor = raiz / 'nucleo' / 'motor.js'
src = motor.read_text(encoding='utf-8')
src = re.sub(r'var HUELLAS = \{.*?\};', lambda m: 'var HUELLAS = ' + json.dumps(mapa, indent=2).replace('\n', '\n  ') + ';', src, flags=re.S)
motor.write_text(src, encoding='utf-8')
print(json.dumps(mapa, indent=2))
print('nucleo/motor.js', huella(motor))
