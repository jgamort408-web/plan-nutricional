# Imágenes de ejercicios (generadas)

Carpeta de salida del generador `gen-exercise-art.cjs`. Cada imagen se llama
`<id-del-ejercicio>.png` y `manifest.json` lista las disponibles. En `_cast/`
van los modelos del elenco diverso.

La app (`sport-illus.js` → `exIllusBox`) prefiere la imagen sobre el pictograma
SVG cuando existe. Son ficheros de mismo origen: el service worker los cachea y
funcionan offline.

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

## Subir para producción

```bash
git add ex-img/
git commit -m "Imagenes de ejercicios"
git push
```
GitHub Pages las servirá y funcionarán offline.
