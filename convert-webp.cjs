#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   CONVERTIR IMÁGENES DE EJERCICIO A WebP  (uso puntual, local)
   Reempaqueta los PNG de ex-img/ a WebP para que pesen menos SIN perder
   calidad. Por defecto usa WebP SIN PÉRDIDA (lossless): la imagen queda
   idéntica píxel a píxel a la PNG, solo que el fichero es más pequeño
   (típicamente ~20-40% menos en estas ilustraciones). Coste CERO de API.
   Reescribe ex-img/manifest.json y borra los PNG originales.

   Si algún día quieres ficheros mucho más pequeños a cambio de una
   compresión con algo de pérdida, usa --q N (p. ej. --q 90 casi no se
   nota; --q 80 pesa ~10-20× menos que la PNG).

   Requiere `sharp` (solo desarrollo, no se envía a producción):
       npm i -D sharp
   Uso:
       node convert-webp.cjs                (WebP sin pérdida, misma calidad)
       node convert-webp.cjs --q 90         (WebP con pérdida, calidad 90)
       node convert-webp.cjs --keep --out ex-img
     --q N     WebP CON PÉRDIDA a calidad 0..100 (si se omite → sin pérdida)
     --keep    NO borrar los PNG originales (por defecto se borran)
     --out DIR carpeta (def: ex-img)
══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); }
catch (e) {
  console.error('\n✘ Falta «sharp». Instálalo una vez con:  npm i -D sharp\n' +
    '  (es solo una herramienta de desarrollo; no forma parte de la app.)');
  process.exit(1);
}

function parseArgs() {
  const a = process.argv.slice(2); const o = { q: null, lossless: true, out: 'ex-img', keep: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--q') { o.q = Math.max(1, Math.min(100, +a[++i] || 90)); o.lossless = false; }
    else if (a[i] === '--lossless') o.lossless = true;
    else if (a[i] === '--keep') o.keep = true;
    else if (a[i] === '--out') o.out = a[++i];
  }
  return o;
}

async function main() {
  const o = parseArgs();
  const dir = path.isAbsolute(o.out) ? o.out : path.join(__dirname, o.out);
  if (!fs.existsSync(dir)) { console.error('✘ No existe la carpeta ' + dir); process.exit(1); }

  // Solo la raíz de ex-img (no _cast/, que son referencias del elenco).
  const pngs = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png'));
  if (!pngs.length) { console.log('No hay PNG que convertir en ' + dir + ' (¿ya están en WebP?).'); }

  let done = 0, fail = 0, before = 0, after = 0;
  for (const png of pngs) {
    const id = png.replace(/\.png$/i, '');
    const src = path.join(dir, png);
    const dst = path.join(dir, id + '.webp');
    try {
      const inSize = fs.statSync(src).size; before += inSize;
      const webpOpts = o.lossless ? { lossless: true, effort: 5 } : { quality: o.q, effort: 5 };
      await sharp(src).webp(webpOpts).toFile(dst);
      const outSize = fs.statSync(dst).size; after += outSize;
      if (!o.keep) fs.unlinkSync(src);
      done++;
      process.stdout.write(`  · ${id}  ${(inSize/1024|0)}KB → ${(outSize/1024|0)}KB\n`);
    } catch (err) {
      fail++; console.log(`  · ${id}  \x1b[31mfalló\x1b[0m · ${err.message}`);
    }
  }

  // Reconstruye el manifest desde el disco: cada id con .webp o .png presente.
  const manifest = {};
  fs.readdirSync(dir).forEach(f => {
    const m = f.match(/^(.+)\.(webp|png)$/i);
    if (m) manifest[m[1]] = m[2].toLowerCase();
  });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 0));

  const mb = n => (n / (1024 * 1024)).toFixed(1) + ' MB';
  console.log(`\n✔ ${done} convertidas (${o.lossless ? 'sin pérdida · misma calidad' : 'calidad ' + o.q} · WebP)` +
    ` · ${fail} fallos` + (o.keep ? ' · PNG conservados (--keep)' : ' · PNG borrados'));
  if (before) console.log(`  peso: ${mb(before)} → ${mb(after)}  (${Math.round((1 - after / before) * 100)}% menos)`);
  console.log(`  manifest: ${Object.keys(manifest).length} imágenes → ${path.join(o.out, 'manifest.json')}`);
}

main().catch(e => { console.error('✘', e.message); process.exit(1); });
