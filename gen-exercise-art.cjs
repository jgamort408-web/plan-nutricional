#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   GENERADOR DE ARTE DE EJERCICIOS · OpenAI Images API
   Crea una ilustración ORIGINAL por ejercicio, en un estilo propio y
   coherente, a partir del MOVIMIENTO y la ANATOMÍA (hechos, no
   copyright). Guarda PNG en ex-img/<id>.png y actualiza
   ex-img/manifest.json, que la app usa para preferir la imagen sobre
   el pictograma SVG.

   ── Flujo recomendado ──────────────────────────────────────
   1) Crea un ELENCO de modelos humanos diversos (mujeres y hombres, de
      distintos orígenes y rasgos —asiáticos, africanos, sudamericanos,
      europeos…—, edades, tallas, tonos de piel y estado físico):
        node gen-exercise-art.cjs --cast
        (revisa ex-img/_cast/_contact.html · rehaz uno con
         --cast --persona h3 --force · edita la lista PERSONAS para ajustar)
   2) (Opcional) fija el estilo de dibujo con unas INSIGNIA:
        node gen-exercise-art.cjs --refs
   3) Genera los lotes: cada ejercicio se asigna a un modelo del elenco
      (reparto diverso y reproducible) y lo reutiliza como referencia:
        node gen-exercise-art.cjs --pattern squat --use-cast
        node gen-exercise-art.cjs --all --use-cast
      Rehaz o descarta las que no te gusten (borra el PNG para descartar):
        node gen-exercise-art.cjs --redo dominadas
        node gen-exercise-art.cjs --redo dominadas --persona m2   (otra persona)

   ── Flags ──────────────────────────────────────────────────
     --cast         genera el elenco de modelos diversos (ex-img/_cast/)
     --use-cast     cada ejercicio reutiliza su modelo del elenco (edits)
     --persona pid  fuerza una persona (ids: m1..m6, h1..h6)
     --refs         genera el set insignia (referencia de ESTILO)
     --use-refs     usa las insignia como referencia de estilo
     --redo a,b     rehace esos ids (= --force --only a,b)
     --contact      escribe ex-img/_contact.html para revisar
     --dry-run      no llama a la API; imprime los prompts (gratis)
     --sample       muestra variada (~6)
     --only a,b     ids concretos
     --pattern p    solo ejercicios de esa pose (squat, hinge, run…)
     --all          todo el catálogo (resumible; salta las hechas)
     --limit N      como mucho N
     --force        sobrescribe las existentes
     --size S       1024x1024 (def) | 1024x1536 | 1536x1024 | auto
     --quality Q    low | medium (def) | high
     --model M      gpt-image-1 (def)
     --out DIR      carpeta (def: ex-img)

   No pide ni guarda tu clave (OPENAI_API_KEY). Solo crea arte propio;
   nunca descarga ni parte de imágenes de terceros.
══════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

/* ── Catálogo + resolver de poses (reutiliza sport-illus) ─────── */
global.window = global; global.lsGet = () => null; global.lsSet = () => {};
require(path.join(ROOT, 'sport-catalog.js'));
try { require(path.join(ROOT, 'sport-gear.js')); } catch (e) {}
let sd = fs.readFileSync(path.join(ROOT, 'sport-data.js'), 'utf8').split('function loadSportPlan')[0];
sd += '\n;global.EXERCISES=EXERCISES;global.EX_MUSCLES=EX_MUSCLES;global.EX_SPORTS=EX_SPORTS;global.exDisc=exDisc;';
(0, eval)(sd);
(0, eval)(fs.readFileSync(path.join(ROOT, 'sport-illus.js'), 'utf8'));
const E = EXERCISES;

/* ══════════════════════════════════════════════════════════
   ESTILO DE LA CASA · pensado como un director de arte + ingeniero
   de prompts. Un único personaje coherente, plano y editorial, con
   la paleta cálida de la app y un acento por músculo primario.
══════════════════════════════════════════════════════════ */
const STYLE_HOUSE = [
  'Editorial vector illustration for a premium fitness app, in ONE cohesive house DRAWING style (the drawing style is constant across the whole set; only the person varies).',
  'Flat design: clean geometric shapes, smooth confident linework of even weight, and simple 2–3 tone shading (no photorealism, no gradient meshes, no 3D render).',
  'Believable human proportions (about 7.5 heads tall), simplified friendly facial features (no fine facial detail), simple athletic wear. Depict the specific person described in the subject faithfully and respectfully — their gender, age, body size, skin tone and ethnic/regional facial features and hair — so the whole set feels genuinely diverse.',
  'Warm limited palette for the scene: soft cream paper background #F6EDD8; outlines and clothing in deep warm brown #2C1F0E; realistic natural skin tone for the person; and ONE single accent colour <ACCENT> used sparingly ONLY on the equipment or a small prop — never on the body.',
  'A single soft directional long shadow grounds the figure. Balanced, centered, the full body comfortably inside the frame with generous margins and calm negative space.',
  'Anatomically accurate joint angles and posture. Do NOT colour, highlight, shade or mark any muscles — the body stays one natural skin tone with no coloured muscle patches.',
  'Modern, quiet, high-end, instantly readable. Absolutely NO text, letters, numbers, arrows, logos, UI or watermark. Square 1:1.'
].join(' ');

/* Briefs de MOVIMIENTO con biomecánica correcta (nivel experto).
   Describen la fase más reconocible del ejercicio y las claves que la
   hacen anatómicamente creíble. El material lo añade equipClause. */
const POSE_BRIEF = {
  squat:'shown from the side at the bottom of a squat: hips sitting back and just below the knee crease, shins close to vertical, knees tracking over the toes, chest tall, spine long and neutral, weight balanced over the mid-foot, quads and glutes under tension',
  hinge:'shown from the side in a stiff-legged hip hinge / Romanian deadlift at mid-shin: hips driven far back, long flat back, soft unlocked knees, shoulders in front of the bar, hamstrings and glutes loaded and lengthened',
  lunge:'shown from the side at the bottom of a forward lunge: front shin vertical with the knee stacked over the ankle, rear knee lowered just above the floor, torso upright and tall, front glute and quad working',
  benchpress:'shown from the side mid-rep of a bench press: lying supine on a bench, feet planted, slight arch, elbows tucked around 45–75°, forearms vertical, pressing the load up over the mid-chest, pecs and triceps engaged',
  pushup:'shown from the side at the bottom of a push-up: one straight rigid line from head to heels, hands under the shoulders, elbows bent back around 45°, chest just above the floor, braced core',
  ohp:'shown from the front at lockout of a standing strict overhead press: load pressed directly over the crown, ribs down, glutes and core braced, wrists stacked over elbows over shoulders, deltoids working',
  row:'shown from the side performing a bent-over row: torso hinged to near parallel with a flat back, knees soft, pulling the load to the lower ribs with the elbow driving back past the torso, lats and mid-back squeezing',
  pulldown:'shown from the front seated at a cable lat pulldown: tall chest, slight lean back, driving the elbows down and back to bring the bar to the upper chest, lats fully engaged',
  pullup:'shown from the front at the top of a pull-up: hanging from a fixed overhead bar, chin above the bar, shoulder blades pulled down and together, elbows driven to the ribs, lats and biceps working',
  curl:'shown from the front at peak contraction of a standing biceps curl: tall torso, upper arms pinned to the sides, elbows flexed to bring the load toward the shoulders, biceps squeezed, wrists neutral',
  tricepsext:'shown from the front performing a standing cable triceps push-down: tall torso, upper arms fixed to the sides, elbows extending fully to drive the handle down, triceps engaged',
  lateralraise:'shown from the front at the top of a lateral raise: arms lifted out to the sides to shoulder height, slight elbow bend, shoulder blades stable, side deltoids working',
  frontraise:'shown from the side at the top of a front raise: one arm lifted straight forward to shoulder height, tall posture, front deltoid working',
  fly:'shown from the front performing a chest fly: upright or on a bench, arms opening wide in a smooth arc with a soft elbow bend, pecs stretching, a controlled squeeze',
  facepull:'shown from the front performing a cable face pull: pulling a rope toward the eyes/forehead with high flaring elbows, shoulder blades retracted, rear deltoids and upper back working',
  shrug:'shown from the front at the top of a shrug: tall arms holding a load at the sides, shoulders lifted straight up toward the ears, traps contracted',
  calf:'shown from the side at the top of a standing calf raise: fully risen onto the balls of the feet, ankles plantarflexed, tall body, calves contracted',
  legext:'shown from the side at lockout of a seated leg-extension machine: seated upright against the pad, knees extending to lift the ankle pad, quadriceps contracted',
  legcurl:'shown from the side on a lying leg-curl machine: face-down, curling the heels toward the glutes against the pad, hamstrings contracted',
  abduction:'shown from the front on a seated hip-abduction machine: seated upright, knees pressing outward against the pads, glutes (gluteus medius) working',
  legpress:'shown from the side mid-rep of a 45° leg-press machine: reclined on the seat, both feet on the platform, knees bent toward the chest about to press away, quads and glutes loaded',
  plank:'shown from the side holding a forearm plank: forearms on the floor under the shoulders, one perfectly straight rigid line from head to heels, braced core and glutes',
  crunch:'shown from the side at the top of an abdominal crunch: lying on the back, knees bent, feet down, curling only the shoulder blades off the floor, abs contracted',
  run:'shown from the side running mid-stride: airborne float phase, one knee driving high, opposite arm forward, relaxed hands, tall posture, clear athletic motion',
  bike:'shown from the side cycling on a stationary bike: seated, hands on the bars, one leg driving the pedal down, athletic forward lean',
  rowmachine:'shown from the side on an indoor rowing erg at the mid-drive: legs pressing, torso opening back, arms about to pull the handle to the lower ribs',
  swim:'shown from the side swimming front-crawl: streamlined body at the surface, one arm reaching forward in the catch, the other finishing the pull, a few clean stylized water lines',
  jump:'shown from the side in an explosive vertical / box jump caught at the apex: hips and knees extending, arms swinging up, powerful athletic motion',
  boxing:'shown from the side in a boxing stance throwing a straight cross: rear hand extending, lead hand guarding the chin, hips rotating, on the balls of the feet',
  racket:'shown from the side at contact of a tennis forehand: rotated hips and shoulders, racket meeting the ball out in front, athletic split stance',
  dance:'shown full-body in a dynamic dance pose: expressive, balanced and graceful, extended limbs, clear line of motion',
  carry:'shown from the front performing a farmer\'s carry: walking tall, shoulders back, a heavy load hanging in each hand at the sides, braced core and grip',
  stretch:'shown from the side in a calm mobility stretch: a gentle, elongated, controlled position with relaxed breathing',
  generic:'shown from the front performing a controlled resistance exercise: tall neutral athletic posture, deliberate form'
};

/* ══════════════════════════════════════════════════════════
   ELENCO DIVERSO · personas variadas en género, ORIGEN/RASGOS (asiático,
   africano, sudamericano, europeo, de Oriente Medio…), edad, tamaño,
   tono de piel y estado físico. El estilo de DIBUJO es común; la PERSONA
   varía. Asignación determinista por id (reproducible y repartida) para
   que el catálogo tenga diversidad equilibrada.
══════════════════════════════════════════════════════════ */
const PERSONAS = [
  { id:'m1', desc:'a young East Asian woman with a lean, toned athletic build' },
  { id:'h1', desc:'a middle-aged White European man with light skin, a larger heavier body and average everyday fitness' },
  { id:'m2', desc:'a Black woman of African descent with deep skin and a strong, visibly muscular build' },
  { id:'h2', desc:'a young Latino man of South American descent with tan brown skin and an average, everyday build' },
  { id:'m3', desc:'an older White European woman with fair skin, short silver hair and a slim build' },
  { id:'h3', desc:'a tall Black man of African descent with dark skin and an athletic build' },
  { id:'m4', desc:'a Latina woman of South American descent with a soft, curvy plus-size body, a happy beginner' },
  { id:'h4', desc:'a young Southeast Asian man with medium skin and a wiry, slim build' },
  { id:'m5', desc:'a middle-aged South Asian woman with medium-brown skin and a healthy, average build' },
  { id:'h5', desc:'an older East Asian man with grey hair and a stocky, sturdy build' },
  { id:'m6', desc:'a Middle Eastern woman with olive skin and a compact, muscular build' },
  { id:'h6', desc:'a South Asian man with brown skin and a softer, out-of-shape build, just getting started' }
];
/* hash estable id → índice de persona (reparto uniforme y reproducible) */
function personaFor(id, override){
  if(override){ const p = PERSONAS.find(x => x.id === override); if(p) return p; }
  let h = 0; for(let i=0;i<id.length;i++) h = (h*31 + id.charCodeAt(i)) >>> 0;
  return PERSONAS[h % PERSONAS.length];
}
/* Prompt para una imagen de MODELO del elenco (pose neutra de referencia) */
function castPrompt(persona){
  const style = STYLE_HOUSE.replace('<ACCENT>', '#B5603A');
  return `Subject: ${persona.desc}, standing relaxed in a neutral athletic stance, facing forward, `
    + `full body from head to feet, simple athletic clothing, friendly and confident. `
    + `\n\nStyle: ${style}`;
}

/* Modificadores de VARIANTE por palabras del nombre (afinan la técnica
   sin contradecir el brief base). */
function variantModifier(name) {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const mods = [];
  if (/inclinad/.test(n)) mods.push('on an incline bench (upper chest emphasis)');
  if (/declinad/.test(n)) mods.push('on a decline bench (lower chest emphasis)');
  if (/agarre cerrado|cerrado|close/.test(n)) mods.push('with a narrow, close grip');
  if (/agarre ancho|ancho|wide/.test(n)) mods.push('with a wide grip');
  if (/agarre neutro|neutro|martillo|hammer/.test(n)) mods.push('with a neutral (palms-facing) grip');
  if (/supin|invertid|chin/.test(n)) mods.push('with a supinated (underhand) grip');
  if (/sentad(?!illa)|seated/.test(n)) mods.push('seated');   // "sentado", no "sentadilla"
  if (/de pie|standing/.test(n)) mods.push('standing');
  if (/tumbad|lying|banco/.test(n) && !/inclinad|declinad/.test(n)) mods.push('lying on a bench');
  if (/una mano|un brazo|unilateral|single|a una pierna/.test(n)) mods.push('single-sided (one arm or one leg)');
  if (/frontal|front rack|goblet/.test(n) && /sentadilla|squat/.test(n)) mods.push('with the load held in a front-rack / goblet position at the chest');
  if (/bulgar|split/.test(n)) mods.push('as a rear-foot-elevated split squat');
  if (/sumo/.test(n)) mods.push('with a wide sumo stance');
  if (/deficit|deficit/.test(n)) mods.push('standing on a small platform for extra range');
  if (/pausa|pause/.test(n)) mods.push('paused at the hardest point');
  return mods.length ? ' (' + mods.join(', ') + ')' : '';
}

/* Cláusula de material a partir del implemento resuelto */
function equipClause(ex, id) {
  const pose = illPoseKey(ex, id);
  const eq = (ex.equip || '').toLowerCase();
  if (pose === 'pullup') return 'using a fixed overhead pull-up bar';
  if (/maquina|máquina|prensa|smith|contractora|peck/.test(eq) || ['legpress','legext','legcurl','abduction','pulldown'].includes(pose)) return 'on a clean, simple weight machine';
  if (pose === 'rowmachine') return 'on an indoor rowing machine';
  if (pose === 'bike') return 'on a stationary exercise bike';
  const imp = _illImplement(ex, id);
  if (imp === 'bar') return 'with an olympic barbell';
  if (imp === 'db') return 'with dumbbells';
  if (imp === 'kb') return 'with a kettlebell';
  if (imp === 'cable') return 'using a cable pulley with a simple handle';
  if (/banda|goma/.test(eq)) return 'with a resistance band';
  return 'using body weight only, no equipment';
}
function engMuscle(m) {
  return ({ pecho: 'chest (pectorals)', espalda: 'back and lats', hombro: 'shoulders (deltoids)', biceps: 'biceps',
    triceps: 'triceps', antebrazo: 'forearms', core: 'core / abdominals', cuadriceps: 'quadriceps',
    isquios: 'hamstrings', gluteo: 'glutes', gemelo: 'calves' })[m] || m;
}

/* Prompt experto completo de un ejercicio (con persona diversa) */
function buildPrompt(id, personaOverride) {
  const ex = E[id];
  const pose = illPoseKey(ex, id);
  const brief = (POSE_BRIEF[pose] || POSE_BRIEF.generic) + variantModifier(ex.name || '');
  const primary = (ex.muscles || [])[0];
  const accent = (EX_MUSCLES[primary] || {}).c || '#B5603A';   // acento solo para el material
  const persona = personaFor(id, personaOverride);
  const style = STYLE_HOUSE.replace('<ACCENT>', accent);
  return `Subject: ${persona.desc}, ${brief}, ${equipClause(ex, id)}. `
    + `The pose must read instantly and unambiguously as this exact exercise, technically correct. `
    + `\n\nStyle: ${style}`;
}

/* ── Set INSIGNIA (referencias de estilo) ──────────────────────
   Cubren los arquetipos visuales del catálogo: compuesto con barra,
   press en banco, peso corporal vertical, polea, máquina, accesorio
   con mancuerna, carrera, natación, core y bici. */
const REF_IDS = ['sentadilla_trasera', 'press_banca_barra', 'dominadas', 'gim_remo_sentado_polea',
  'sf_prensa_de_piernas', 'curl_biceps', 'carrera_suave', 'nadar_crol', 'plancha', 'bici_estatica']
  .filter(id => E[id]);
/* insignia preferida según la familia de pose del objetivo */
function preferredRef(pose) {
  const map = {
    legpress: 'sf_prensa_de_piernas', legext: 'sf_prensa_de_piernas', legcurl: 'sf_prensa_de_piernas',
    abduction: 'sf_prensa_de_piernas', pulldown: 'gim_remo_sentado_polea', rowmachine: 'gim_remo_sentado_polea',
    facepull: 'gim_remo_sentado_polea', row: 'gim_remo_sentado_polea', bike: 'bici_estatica',
    run: 'carrera_suave', jump: 'carrera_suave', swim: 'nadar_crol', pullup: 'dominadas',
    plank: 'plancha', crunch: 'plancha', carry: 'plancha',
    squat: 'sentadilla_trasera', hinge: 'sentadilla_trasera', lunge: 'sentadilla_trasera', legpress2: 'sf_prensa_de_piernas',
    benchpress: 'press_banca_barra', pushup: 'press_banca_barra', fly: 'press_banca_barra',
    ohp: 'curl_biceps', curl: 'curl_biceps', tricepsext: 'curl_biceps', lateralraise: 'curl_biceps',
    frontraise: 'curl_biceps', shrug: 'curl_biceps', calf: 'curl_biceps'
  };
  return map[pose] || 'sentadilla_trasera';
}

/* ── CLI ──────────────────────────────────────────────────────── */
function parseArgs() {
  const a = process.argv.slice(2); const o = { size: '1024x1024', quality: 'medium', model: 'gpt-image-1', out: 'ex-img' };
  for (let i = 0; i < a.length; i++) {
    const f = a[i];
    if (f === '--dry-run') o.dry = true;
    else if (f === '--sample') o.sample = true;
    else if (f === '--all') o.all = true;
    else if (f === '--force') o.force = true;
    else if (f === '--refs') o.refs = true;
    else if (f === '--use-refs') o.useRefs = true;
    else if (f === '--cast') o.cast = true;
    else if (f === '--use-cast') o.useCast = true;
    else if (f === '--persona') o.persona = a[++i];
    else if (f === '--contact') o.contact = true;
    else if (f === '--redo') { o.only = (a[++i] || '').split(',').map(s => s.trim()).filter(Boolean); o.force = true; }
    else if (f === '--only') o.only = (a[++i] || '').split(',').map(s => s.trim()).filter(Boolean);
    else if (f === '--pattern') o.pattern = a[++i];
    else if (f === '--limit') o.limit = +a[++i];
    else if (f === '--size') o.size = a[++i];
    else if (f === '--quality') o.quality = a[++i];
    else if (f === '--model') o.model = a[++i];
    else if (f === '--out') o.out = a[++i];
  }
  return o;
}
const SAMPLE_IDS = ['sentadilla_trasera', 'press_banca_barra', 'dominadas', 'curl_biceps', 'carrera_suave', 'nadar_crol'];
function pickIds(o) {
  let ids = Object.keys(E);
  if (o.refs) ids = REF_IDS;
  else if (o.only) ids = o.only.filter(id => E[id] || (console.warn('  ⚠ id desconocido: ' + id), false));
  else if (o.sample) ids = SAMPLE_IDS.filter(id => E[id]);
  else if (o.pattern) ids = ids.filter(id => illPoseKey(E[id], id) === o.pattern);
  else if (!o.all) return null;
  if (o.limit) ids = ids.slice(0, o.limit);
  return ids;
}

/* ── API ──────────────────────────────────────────────────────── */
async function apiGenerate(prompt, o) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: o.model, prompt, size: o.size, quality: o.quality, n: 1 })
  });
  return handleRes(res);
}
async function apiEdit(prompt, refBuffers, o) {
  const form = new FormData();
  form.append('model', o.model);
  form.append('prompt', prompt);
  form.append('size', o.size);
  form.append('quality', o.quality);
  refBuffers.forEach((b, i) => form.append('image[]', new Blob([b], { type: 'image/png' }), 'ref' + i + '.png'));
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
    body: form
  });
  return handleRes(res);
}
async function handleRes(res) {
  if (!res.ok) throw new Error('HTTP ' + res.status + ' · ' + (await res.text()).slice(0, 300));
  const data = await res.json();
  const b64 = data.data && data.data[0] && data.data[0].b64_json;
  if (!b64) throw new Error('respuesta sin imagen');
  return Buffer.from(b64, 'base64');
}

function loadManifest(dir) { try { return JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); } catch (e) { return {}; } }
function saveManifest(dir, m) { fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m, null, 0)); }

/* Hoja de contactos para revisar de un vistazo */
function writeContact(dir) {
  const m = loadManifest(dir);
  const ids = Object.keys(m);
  const cells = ids.map(id => `<figure><img src="${id}.png" loading="lazy"><figcaption>${(E[id] || {}).name || id}<br><small>${id}</small></figcaption></figure>`).join('');
  const html = `<!doctype html><meta charset=utf8><title>Revisión de imágenes</title>
<style>body{background:#F6EDD8;color:#2C1F0E;font:14px system-ui;margin:0;padding:20px}
h1{font-size:18px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
figure{margin:0;background:#FFFDF7;border:1px solid #e5dcc6;border-radius:12px;overflow:hidden}
img{width:100%;display:block;aspect-ratio:1}figcaption{padding:8px 10px;font-size:12px}small{color:#8a7a5f}</style>
<h1>Revisión · ${ids.length} imágenes</h1><p>Para descartar una: borra su PNG y regénera con <code>--redo &lt;id&gt;</code>.</p>
<div class=g>${cells}</div>`;
  fs.writeFileSync(path.join(dir, '_contact.html'), html);
  console.log(`✔ ex-img/_contact.html (${ids.length} imágenes). Ábrelo en el navegador para revisar.`);
}

async function main() {
  const o = parseArgs();
  const outDir = path.isAbsolute(o.out) ? o.out : path.join(ROOT, o.out);

  if (o.cast) { await genCast(o, outDir); return; }
  if (o.contact && !o.refs && !o.all && !o.only && !o.sample && !o.pattern) { writeContact(outDir); return; }

  const ids = pickIds(o);
  if (!ids) {
    console.log('Elige qué generar. Flujo recomendado:\n' +
      '  node gen-exercise-art.cjs --cast         (elenco de modelos diversos)\n' +
      '  node gen-exercise-art.cjs --refs         (imágenes insignia de estilo)\n' +
      '  node gen-exercise-art.cjs --contact      (revisar)\n' +
      '  node gen-exercise-art.cjs --all --use-cast   (lotes: cada ejercicio con su modelo diverso)\n' +
      'Usa --dry-run para ver los prompts sin gastar. Más flags en la cabecera.');
    return;
  }
  if (!o.dry && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const manifest = o.dry ? {} : loadManifest(outDir);
  const pending = ids.filter(id => o.force || o.dry || !fs.existsSync(path.join(outDir, id + '.png')));

  console.log(`\n${ids.length} seleccionados · ${pending.length} por generar` +
    (o.dry ? ' · DRY-RUN (sin API)' : ` · ${o.size} ${o.quality} · ${o.model}${o.useRefs ? ' · con referencias' : ''}`));

  if (o.dry) {
    pending.slice(0, 6).forEach(id => {
      const p = personaFor(id, o.persona);
      console.log('\n\x1b[1m' + id + '\x1b[0m  (' + E[id].name + ')  · pose ' + illPoseKey(E[id], id) + ' · persona ' + p.id);
      console.log('  ' + buildPrompt(id, o.persona).replace(/\n/g, '\n  '));
    });
    if (pending.length > 6) console.log(`\n… y ${pending.length - 6} más (personas variadas, mismo estilo).`);
    return;
  }
  if (!process.env.OPENAI_API_KEY) { console.error('\n✘ Falta OPENAI_API_KEY. (Usa --dry-run para ver los prompts sin clave.)'); process.exit(1); }

  // referencias de PERSONA (si --use-cast): reutiliza los modelos del elenco
  let cast = {};
  if (o.useCast) {
    const castDir = path.join(outDir, '_cast');
    PERSONAS.forEach(p => { const f = path.join(castDir, p.id + '.png'); if (fs.existsSync(f)) cast[p.id] = fs.readFileSync(f); });
    const n = Object.keys(cast).length;
    if (!n) { console.error('✘ --use-cast pero no hay elenco. Genera antes con --cast.'); process.exit(1); }
    console.log(`  usando el elenco (${n} modelos) como referencia de persona`);
  }
  // referencias de ESTILO (si --use-refs): las insignia
  let refs = {};
  if (o.useRefs) {
    REF_IDS.forEach(rid => { const p = path.join(outDir, rid + '.png'); if (fs.existsSync(p)) refs[rid] = fs.readFileSync(p); });
    const n = Object.keys(refs).length;
    if (!n) { console.error('✘ --use-refs pero no hay imágenes insignia. Genera antes con --refs.'); process.exit(1); }
    console.log(`  usando ${n} insignia como referencia de estilo`);
  }

  let done = 0, fail = 0;
  for (const id of pending) {
    process.stdout.write(`  · ${id} … `);
    try {
      const prompt = buildPrompt(id, o.persona);
      let buf;
      if (o.useCast && Object.keys(cast).length) {
        const p = personaFor(id, o.persona);
        const ref = cast[p.id];
        buf = ref
          ? await apiEdit(prompt + '\nDepict the SAME individual as in the reference image (same face, body type, skin tone, hair and clothing); change only their pose to perform the exercise; keep the exact house drawing style and palette.', [ref], o)
          : await apiGenerate(prompt, o);
      } else if (o.useRefs && Object.keys(refs).length) {
        const pref = preferredRef(illPoseKey(E[id], id));
        const chosen = [pref, 'sentadilla_trasera', 'press_banca_barra']
          .filter((r, i, a) => a.indexOf(r) === i && refs[r]).slice(0, 3).map(r => refs[r]);
        buf = await apiEdit(prompt + '\nMatch the exact house drawing style and palette of the reference image(s), but keep the person as described in the subject.', chosen, o);
      } else {
        buf = await apiGenerate(prompt, o);
      }
      fs.writeFileSync(path.join(outDir, id + '.png'), buf);
      manifest[id] = 'png'; saveManifest(outDir, manifest);
      done++; console.log('\x1b[32mok\x1b[0m (' + Math.round(buf.length / 1024) + ' KB)');
    } catch (err) {
      fail++; console.log('\x1b[31mfalló\x1b[0m · ' + err.message);
      if (/HTTP 401/.test(err.message)) { console.error('  Clave inválida: abortando.'); break; }
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  console.log(`\n✔ ${done} generadas · ${fail} fallos · manifest: ${Object.keys(manifest).length} imágenes`);
  if (o.contact) writeContact(outDir);
  else console.log('Revisa con:  node gen-exercise-art.cjs --contact');
}

/* ── Elenco de modelos diversos ───────────────────────────────── */
async function genCast(o, outDir) {
  const castDir = path.join(outDir, '_cast');
  const targets = o.persona ? PERSONAS.filter(p => p.id === o.persona) : PERSONAS;
  const pending = targets.filter(p => o.force || o.dry || !fs.existsSync(path.join(castDir, p.id + '.png')));
  console.log(`\nElenco: ${targets.length} modelos · ${pending.length} por generar` + (o.dry ? ' · DRY-RUN' : ` · ${o.size} ${o.quality}`));
  if (o.dry) {
    pending.forEach(p => { console.log('\n\x1b[1m' + p.id + '\x1b[0m  ' + p.desc); console.log('  ' + castPrompt(p).replace(/\n/g, '\n  ')); });
    return;
  }
  if (!process.env.OPENAI_API_KEY) { console.error('\n✘ Falta OPENAI_API_KEY.'); process.exit(1); }
  if (!fs.existsSync(castDir)) fs.mkdirSync(castDir, { recursive: true });
  let done = 0, fail = 0;
  for (const p of pending) {
    process.stdout.write(`  · ${p.id} (${p.desc.slice(0, 40)}…) … `);
    try {
      const buf = await apiGenerate(castPrompt(p), o);
      fs.writeFileSync(path.join(castDir, p.id + '.png'), buf);
      done++; console.log('\x1b[32mok\x1b[0m');
    } catch (err) {
      fail++; console.log('\x1b[31mfalló\x1b[0m · ' + err.message);
      if (/HTTP 401/.test(err.message)) break;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  // hoja de revisión del elenco
  const cells = PERSONAS.filter(p => fs.existsSync(path.join(castDir, p.id + '.png')))
    .map(p => `<figure><img src="${p.id}.png"><figcaption>${p.id}<br><small>${p.desc}</small></figcaption></figure>`).join('');
  fs.writeFileSync(path.join(castDir, '_contact.html'),
    `<!doctype html><meta charset=utf8><title>Elenco</title><style>body{background:#F6EDD8;color:#2C1F0E;font:14px system-ui;padding:20px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}figure{margin:0;background:#FFFDF7;border:1px solid #e5dcc6;border-radius:12px;overflow:hidden}img{width:100%;display:block;aspect-ratio:1}figcaption{padding:8px 10px;font-size:12px}small{color:#8a7a5f}</style><h1>Elenco de modelos</h1><p>Rehaz uno con <code>--cast --persona ${PERSONAS[0].id} --force</code>. Edita la lista PERSONAS en el .cjs para ajustar.</p><div class=g>${cells}</div>`);
  console.log(`\n✔ elenco: ${done} modelos · ${fail} fallos → ${castDir}`);
  console.log('Revisa ex-img/_cast/_contact.html · luego genera con --use-cast');
}

main().catch(e => { console.error('✘', e.message); process.exit(1); });
