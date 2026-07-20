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
import { createHash } from 'node:crypto';

const ROOT = dirname(fileURLToPath(import.meta.url));

/* Orden EXACTO de carga (el mismo que tenían los <script src> del HTML,
   sin menu-biblio/menu-teoria, que son de carga diferida). */
const CORE = [
  'menu-ui.js', 'menu-prefs.js', 'menu-page.js', 'menu-data.js',
  'menu-foods.js', 'menu-comp.js', 'menu-recipes2.js', 'menu-recipes-junio.js',
  'menu-recipes-comp.js', 'menu-cuisines.js', 'menu-app.js', 'menu-forms.js',
  'menu-onboard.js', 'menu-builder.js', 'menu-calendar.js', 'menu-saved.js',
  'menu-shop.js', 'sport-catalog.js', 'sport-data.js', 'sport-engine.js',
  // sport-log.js va ANTES que sport-ui/train/progress: define SP_LEVELS,
  // SP_GEAR y SP_INJURIES, que los demás leen al generar y al entrenar.
  'sport-gear.js', 'sport-log.js', 'sport-ui.js', 'sport-calendar.js', 'sport-train.js',
  'sport-progress.js', 'sport-anim.js', 'menu-unified.js',
  'menu-session.js', 'menu-assistant.js', 'menu-month.js', 'sport-assistant.js',
  'menu-feedback.js', 'menu-translate.js'
];

const OUT = 'app.min.js';

async function loadEsbuild(){
  try{ return await import('esbuild'); }
  catch(e){ return null; }
}

/* ── Guardia TDZ ────────────────────────────────────────────
   Al concatenar, todos los const/let de nivel superior se hoistean SIN
   inicializar. Un `typeof X` sobre uno declarado en un archivo POSTERIOR
   lanza ReferenceError (con <script> separados era seguro y devolvía
   'undefined'). Esas variables deben declararse con `var`. */
function checkTDZ(){
  const decl = {};
  CORE.forEach((f, i) => {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for(const m of src.matchAll(/^(?:const|let)\s+([A-Za-z_$][\w$]*)/gm)){
      if(!(m[1] in decl)) decl[m[1]] = { file:f, idx:i };
    }
  });
  const bad = new Set();
  CORE.forEach((f, i) => {
    const src = readFileSync(join(ROOT, f), 'utf8');
    for(const m of src.matchAll(/typeof\s+([A-Za-z_$][\w$]*)/g)){
      const d = decl[m[1]];
      if(d && d.idx > i) bad.add(`${f}: "typeof ${m[1]}" pero ${m[1]} es const/let declarado despues en ${d.file} → decláralo con var`);
    }
  });
  if(bad.size){
    console.error('✘ build abortado · ' + bad.size + ' problema(s) de TDZ:');
    bad.forEach(b => console.error('  ' + b));
    process.exit(1);
  }
}

async function main(){
  checkTDZ();
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

  // El build es DETERMINISTA (sin marca de tiempo): el mismo código produce
  // el mismo bundle, y por tanto el mismo hash de caché del service worker.
  const code = parts.join('\n');
  const hash = createHash('sha1').update(code).digest('hex').slice(0, 8);

  const banner = `/* app.min.js · GENERADO por build.mjs · ${hash}\n` +
    `   NO editar a mano: edita los archivos fuente y ejecuta \`node build.mjs\`.\n` +
    `   Fuentes (en orden): ${CORE.join(', ')} */\n`;

  const bundle = banner + code;
  writeFileSync(join(ROOT, OUT), bundle);

  // Sella la versión de caché del SW con el hash del bundle: si cambia el
  // código, cambia sw.js → el navegador instala un SW nuevo, purga las
  // cachés viejas y los clientes reciben la versión actual (sin esto, un
  // cliente con el SW anterior podía seguir sirviendo código antiguo).
  const swPath = join(ROOT, 'sw.js');
  const sw = readFileSync(swPath, 'utf8');
  const swNew = sw
    .replace(/const CACHE = '[^']*';/, `const CACHE = 'plan-nutri-${hash}';`)
    .replace(/'app\.min\.js(\?v=[^']*)?'/, `'app.min.js?v=${hash}'`);
  if (swNew !== sw) writeFileSync(swPath, swNew);

  // Cache-busting: la URL del bundle lleva el hash, así ni la caché HTTP del
  // navegador ni la CDN pueden servir una versión antigua (la URL cambia).
  const htmlPath = join(ROOT, 'Menu Nutricional.html');
  const html = readFileSync(htmlPath, 'utf8');
  const htmlNew = html.replace(/<script src="app\.min\.js(\?v=[^"]*)?"><\/script>/,
    `<script src="app.min.js?v=${hash}"></script>`);
  if (htmlNew !== html) writeFileSync(htmlPath, htmlNew);

  const outBytes = Buffer.byteLength(bundle);
  const kb = n => (n / 1024).toFixed(0) + ' KB';
  console.log(`✔ ${OUT} generado`);
  console.log(`  archivos: ${CORE.length}  ·  minificado: ${minify ? 'sí (esbuild)' : 'no (instala esbuild: npm i -D esbuild)'}`);
  console.log(`  tamaño: ${kb(rawBytes)} → ${kb(outBytes)}`);
  console.log(`  caché del service worker: plan-nutri-${hash}`);
}

main().catch(err => { console.error('✘ build falló:', err.message); process.exit(1); });
