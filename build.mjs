/* ══════════════════════════════════════════════════════════
   BUILD · Plan Nutricional
   Concatena (y minifica si esbuild está disponible) los ~30 scripts
   "core" en un único app.min.js, para que el arranque haga 1 petición
   en vez de 30 y el service worker cachee un solo fichero.

   · NO usa módulos ES: los archivos comparten scope global (window),
     así que se concatenan preservando ese scope (sin envoltura IIFE).
   · Teoría y Bibliografía NO se incluyen: se cargan bajo demanda
     (ver el loader en Menu Nutricional.html).
   · Minificado opcional: si `esbuild` está instalado (npm i -D esbuild)
     se minifica cada archivo; si no, se concatena sin minificar.

   Uso:  node build.mjs        (o  npm run build)
══════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* Orden EXACTO de carga (el mismo que tenían los <script src> del HTML,
   sin menu-biblio/menu-teoria, que son de carga diferida). */
const CORE = [
  'menu-ui.js', 'menu-prefs.js', 'menu-page.js', 'menu-data.js',
  'menu-foods.js', 'menu-comp.js', 'menu-recipes2.js', 'menu-recipes-junio.js',
  'menu-recipes-comp.js', 'menu-cuisines.js', 'menu-app.js', 'menu-forms.js',
  'menu-onboard.js', 'menu-builder.js', 'menu-calendar.js', 'menu-saved.js',
  'menu-shop.js', 'sport-catalog.js', 'sport-data.js', 'sport-engine.js',
  'sport-ui.js', 'sport-calendar.js', 'sport-anim.js', 'menu-unified.js',
  'menu-session.js', 'menu-assistant.js', 'menu-month.js', 'sport-assistant.js',
  'menu-feedback.js', 'menu-translate.js'
];

const OUT = 'app.min.js';

async function loadEsbuild(){
  try{ return await import('esbuild'); }
  catch(e){ return null; }
}

async function main(){
  const esbuild = await loadEsbuild();
  const minify = !!esbuild;
  const parts = [];
  let rawBytes = 0;

  for(const file of CORE){
    let code = readFileSync(join(ROOT, file), 'utf8');
    rawBytes += Buffer.byteLength(code);
    if(minify){
      const res = await esbuild.transform(code, { minify: true, legalComments: 'none' });
      code = res.code;
    }
    // ";" inicial como guardia contra ASI al unir programas completos.
    parts.push(`\n;/* ${file} */\n${code}`);
  }

  const banner = `/* app.min.js · GENERADO por build.mjs (${new Date().toISOString()})\n` +
    `   NO editar a mano: edita los archivos fuente y ejecuta \`node build.mjs\`.\n` +
    `   Fuentes (en orden): ${CORE.join(', ')} */\n`;

  const bundle = banner + parts.join('\n');
  writeFileSync(join(ROOT, OUT), bundle);

  const outBytes = Buffer.byteLength(bundle);
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log(`✔ ${OUT} generado`);
  console.log(`  archivos: ${CORE.length}  ·  minificado: ${minify ? 'sí (esbuild)' : 'no (instala esbuild: npm i -D esbuild)'}`);
  console.log(`  tamaño: ${kb(rawBytes)} → ${kb(outBytes)}`);
}

main().catch(err => { console.error('✘ build falló:', err.message); process.exit(1); });
