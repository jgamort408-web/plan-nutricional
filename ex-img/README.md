# Imágenes de ejercicios (generadas)

Carpeta de salida del generador `gen-exercise-art.cjs`. Cada imagen se llama
`<id-del-ejercicio>.png` y `manifest.json` lista las disponibles.

La app (`sport-illus.js` → `exIllusBox`) prefiere la imagen sobre el pictograma
SVG cuando existe. Son ficheros de mismo origen: el service worker los cachea y
funcionan offline.

**Cómo generarlas:**
```
set OPENAI_API_KEY=sk-...           # tu clave (no se guarda en el repo)
node gen-exercise-art.cjs --dry-run --sample   # ver los prompts (gratis)
node gen-exercise-art.cjs --sample             # 6 de muestra para fijar el estilo
node gen-exercise-art.cjs --all                # los 341 (resumible, salta las hechas)
```

Son ilustraciones **originales** (arte propio a partir del movimiento). No se
descargan ni derivan imágenes de terceros.
