# Capa Canaves

`capa.css` es la capa de diseño que siempre gana. La escribe el compilador de Canaves
a partir de `motor.cnvs`. No se edita a mano.

- Vive dentro de `@layer canaves` y todo va con `!important`. Por las reglas de la cascada,
  eso gana a cualquier `!important` que no esté en una capa: el tema de Blogger y el CSS
  que cada entrada trae dentro.
- En pantallas grandes el artículo, el título y la portada crecen por pasos (`zoom`), de
  1280 px a 3840 px de ancho, hasta 2,4 veces. Sirve para escritorio, televisores y consolas.
- La columna del texto y el título miden como máximo 900 px (`content 900` con `measure`).
- Desde 1060 px de ancho, las figuras y el título salen de la columna hasta el ancho amplio (1100 px).
- Navegadores sin `@layer` ignoran el bloque entero y ven el diseño de antes.

## Cómo llega al blog

GitHub (`main`) → Cloudflare (`/capa.css` en `espectador-puente`) → una línea en el tema de Blogger.
Un cambio aquí llega al blog en unos minutos, sin tocar Blogger.

## Cómo se genera

    node design.js ejemplos/motor.cnvs salida/
    cp salida/layer.css modulos/canaves/capa.css

El compilador está en el repositorio `canaves` (`design.js`, bloque `layout`).

## Apagarla

Vaciar `capa.css` (dejar solo un comentario) la apaga en unos minutos.
