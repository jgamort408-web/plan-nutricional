# Imágenes de ejercicios (generadas)

Carpeta de salida del generador `gen-exercise-art.cjs`. Cada imagen se llama
`<id-del-ejercicio>.png` y `manifest.json` lista las disponibles. En `_cast/`
van los modelos del elenco diverso.

La app (`sport-illus.js` → `exIllusBox`) prefiere la imagen sobre el pictograma
SVG cuando existe. Son ficheros de mismo origen: el service worker los cachea y
funcionan offline.

**Prompts por ejercicio.** Cada ejercicio tiene un *brief* propio (biomecánica
de la fase reconocible, ángulo de cámara e implemento) en `sport-exdesc.js`
(`EX_DESC[id].b`); el generador lo usa en vez de una frase genérica por familia.
Así dos variantes del mismo grupo (p. ej. curl concentrado vs. curl invertido)
producen imágenes distintas y correctas. El mismo fichero guarda el texto de
técnica que ve el usuario en la app (`.c`). Para afinar un ejercicio, edita su
`b`/`c` y comprueba el prompt con `--dry-run --only <id>`.

## Cómo generarlas

```bash
set OPENAI_API_KEY=sk-...            # tu clave (no se guarda en el repo)

# 1) Elenco de modelos diversos (mujeres/hombres, edades, tallas, tonos de
#    piel y estado físico). Revisa ex-img/_cast/_contact.html
node gen-exercise-art.cjs --cast
node gen-exercise-art.cjs --cast --persona h3 --force   # rehacer uno

# 2) (opcional) fijar el estilo de dibujo con unas insignia
node gen-exercise-art.cjs --refs

# 3) Generar los lotes: cada ejercicio usa su modelo del elenco (reparto
#    diverso y reproducible) como referencia
node gen-exercise-art.cjs --all --use-cast
node gen-exercise-art.cjs --pattern squat --use-cast    # por familias

# revisar / rehacer / descartar
node gen-exercise-art.cjs --contact
node gen-exercise-art.cjs --redo dominadas              # rehacer
node gen-exercise-art.cjs --redo dominadas --persona m2 # con otra persona
# descartar = borra el PNG y vuelve a generarlo
```

`--dry-run` imprime los prompts **sin gastar**. El generador es **resumible**
(salta las ya hechas).

## Diversidad

El estilo de **dibujo** es constante; la **persona** varía. Hay 12 modelos
(`m1..m6` mujeres, `h1..h6` hombres) de **distintos orígenes y rasgos** (asiáticos
—oriental, sudeste, sur—, africanos, sudamericanos, europeos, de Oriente Medio) y
con distintas edades, tallas, tonos de piel y estado físico. Cada ejercicio se
asigna a uno de forma determinista y equilibrada (~mitad y mitad). Para ajustar el
elenco, edita la lista `PERSONAS` en `gen-exercise-art.cjs`. Los músculos **no** se
colorean sobre el cuerpo; el acento va solo en el material.

Son ilustraciones **originales** (arte propio a partir del movimiento y la
anatomía). No se descargan ni derivan imágenes de terceros.

## Peso y velocidad de carga

La app **no** descarga estas imágenes al instalarse: no van en `app.min.js` ni en
el `SHELL` del service worker. Cada tarjeta usa `<img loading="lazy" decoding="async">`,
así que el navegador solo baja la miniatura cuando te acercas a ella, y el service
worker la **cachea la primera vez que se ve** (offline progresivo). El índice es
`manifest.json` (unos KB): dice qué ids tienen imagen; el resto cae al pictograma SVG.

El generador crea **PNG** (sin pérdida, máxima calidad) por defecto. Cada imagen
pesa ~1,2 MB; como se cargan de forma diferida y se cachean al verlas, esto no
afecta a la descarga inicial de la app, pero sí al tamaño del repo/caché.

Si quieres aligerarlas **sin perder calidad**, reempaquétalas a WebP sin pérdida
(idénticas píxel a píxel, ~20-40% menos) — coste CERO de API:

```bash
npm i -D sharp                 # herramienta de desarrollo, una vez
node convert-webp.cjs          # PNG → WebP SIN pérdida (misma calidad), reescribe manifest
node convert-webp.cjs --keep   # igual, pero conserva los PNG
```

El cargador admite mezcla png/webp (el manifest guarda la extensión por id). Si
algún día prefieres ficheros mucho más pequeños a cambio de algo de pérdida:
`node convert-webp.cjs --q 90` (apenas se nota) o `--q 80` (~10-20× menos).

`_cast/` (los 12 modelos) son **referencias** para `--use-cast`, no se envían a la
app; su peso no afecta a la descarga. Puedes dejarlos fuera de git si quieres.

## Subir para producción

```bash
git add ex-img/
git commit -m "Imagenes de ejercicios"
git push
```
GitHub Pages las servirá y funcionarán offline.
