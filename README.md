# Motor de El Espectador de historias

Hojas de código (CSS, HTML y JavaScript) que dan vida al blog
[El Espectador de historias](https://elespectadordehistorias.blogspot.com/).

Blogger es la casa; este almacén es la sala de máquinas.

## Estructura

```
nucleo/
  motor.js            El cargador: trae los módulos y verifica sus huellas
modulos/
  mapoteca/           Mapa de estudio con mapas antiguos
    mapoteca.html
    mapoteca.css
    mapoteca.js
  lector/             Lectura cómoda, audio lectura, lectura rápida e idioma
    lector.css
    lector.js
  aura/               Aura, el acompañante de lectura
    aura.js
herramientas/
  huellas.py          Calcula las huellas SHA-384 y las escribe en el motor
```

## Cómo funciona

1. El diseño de Blogger carga `nucleo/motor.js` desde jsDelivr, fijado a un
   **commit exacto** y con su **huella de integridad** (SRI).
2. Una página pide un módulo con una sola línea:

   ```html
   <div data-eh-modulo="mapoteca"></div>
   ```

   y el diseño puede pedirlo por código: `EHMotor.cargar('lector')`.
3. El motor descarga las hojas del módulo desde ese mismo commit y comprueba la
   huella SHA-384 de cada una antes de usarla. Si una hoja no coincide, no se
   ejecuta.

## Cómo publicar un cambio

1. Editar las hojas del módulo.
2. Ejecutar `python herramientas/huellas.py` para actualizar las huellas.
3. Subir los cambios y fijar en Blogger el nuevo commit y la nueva huella del motor.

## Seguridad

- El blog nunca usa «la última versión»: cada cambio se activa a propósito.
- Cada hoja lleva su huella SHA-384.
- Aquí solo hay código. Ningún dato personal.
