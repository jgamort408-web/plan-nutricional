#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   MINIATURAS DE EJERCICIOS  (uso local, requiere sharp)
   Crea versiones de baja resolución en ex-img/sm/<id>.webp a partir de
   las imágenes de alta de ex-img/<id>.png. La app usa la MINIATURA en
   tarjetas, listas y modo entrenamiento (carga instantánea, ~7 KB) y
   reserva la imagen de ALTA resolución para la vista de detalle/ficha.

   Una miniatura de 320 px cubre con nitidez hasta 3× retina del mayor
   tamaño no-hero (entreno, 104 px). WebP q82: ~170× más ligera que la PNG.

   Requiere `sharp` (solo desarrollo):  npm i -D sharp
   Uso:
     node make-thumbs.cjs                (320 px, q82, resumible)
     node make-thumbs.cjs --size 384 --q 80 --force
     --size N   lado máximo en px (def 320)
     --q N      calidad WebP 0..100 (def 82)
     --force    regenera aunque ya exista
     --out DIR  carpeta de alta (def ex-img); las miniaturas van en DIR/sm
══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let sharp;
try { sharp = require('sharp'); }
catch (e) {
  console.error('\n✘ Falta «sharp». Instálalo una vez con:  npm i -D sharp');
  process.exit(1);
}

function parseArgs() {
  const a = process.argv.slice(2); const o = { size: 320, q: 82, out: 'ex-img', force: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--size') o.size = Math.max(64, +a[++i] || 320);
    else if (a[i] === '--q') o.q = Math.max(1, Math.min(100, +a[++i] || 82));
    else if (a[i] === '--force') o.force = true;
    else if (a[i] === '--out') o.out = a[++i];
  }
  return o;
}

async function main() {
  const o = parseArgs();
  const dir = path.isAbsolute(o.out) ? o.out : path.join(__dirname, o.out);
  const smDir = path.join(dir, 'sm');
  if (!fs.existsSync(dir)) { console.error('✘ No existe ' + dir); process.exit(1); }
  if (!fs.existsSync(smDir)) fs.mkdirSync(smDir, { recursive: true });

  // fuentes: todas las imágenes de alta en la raíz de ex-img (no _cast, no sm)
  const srcs = fs.readdirSync(dir).filter(f => /\.(png|webp)$/i.test(f));
  if (!srcs.length) { console.log('No hay imágenes en ' + dir); return; }

  let done = 0, skip = 0, fail = 0, before = 0, after = 0;
  for (const f of srcs) {
    const id = f.replace(/\.(png|webp)$/i, '');
    const src = path.join(dir, f);
    const dst = path.join(smDir, id + '.webp');
    if (!o.force && fs.existsSync(dst)) { skip++; continue; }
    try {
      before += fs.statSync(src).size;
      await sharp(src).resize(o.size, o.size, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: o.q, effort: 5 }).toFile(dst);
      after += fs.statSync(dst).size;
      done++;
      if (done % 40 === 0) process.stdout.write(`  · ${done} generadas…\n`);
    } catch (err) { fail++; console.log(`  · ${id}  \x1b[31mfalló\x1b[0m · ${err.message}`); }
  }

  const kb = n => Math.round(n / 1024) + ' KB', mb = n => (n / 1048576).toFixed(1) + ' MB';
  const total = fs.readdirSync(smDir).filter(f => f.endsWith('.webp')).length;
  console.log(`\n✔ miniatura ${o.size}px q${o.q} · ${done} nuevas · ${skip} ya estaban · ${fail} fallos`);
  if (done) console.log(`  peso generado: ${mb(before)} (alta) → ${mb(after)} (miniaturas) · media ${kb(after / done)}/img`);
  console.log(`  total en ex-img/sm: ${total} miniaturas`);
}

main().catch(e => { console.error('✘', e.message); process.exit(1); });
