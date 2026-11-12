# Motor de El Espectador de historias

Hojas de código (CSS y JavaScript) que dan vida al blog
[El Espectador de historias](https://elespectadordehistorias.blogspot.com/).

Blogger es la casa; este almacén es la sala de máquinas.

## Cómo funciona

1. El diseño de Blogger carga `motor.js` desde jsDelivr, en una **versión fija**
   y con su **huella de integridad** (SRI).
2. Cualquier página del blog pide un módulo con una sola línea:

   ```html
   <div data-eh-modulo="mapoteca"></div>
   ```

3. El motor descarga las hojas de ese módulo desde la misma versión y comprueba
   la huella SHA-384 de cada una antes de usarla. Si una hoja no coincide,
   no se ejecuta.

## Módulos

| Módulo     | Hojas                                   | Qué hace                              |
|------------|-----------------------------------------|---------------------------------------|
| `mapoteca` | `mapoteca.html`, `.css`, `.js`          | Mapa de estudio con mapas antiguos    |

## Seguridad

- Las versiones se publican con etiquetas (`v1.0.0`, `v1.1.0`…). El blog nunca
  usa «la última versión»: cada cambio se activa a propósito.
- Cada archivo lleva su huella SHA-384, calculada por `herramientas/huellas.py`.
- Aquí solo hay código. Ningún dato personal.
