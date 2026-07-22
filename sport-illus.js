/* ══════════════════════════════════════════════════════════
   SPORT ILLUS · pictogramas de ejercicios (SVG, offline)
   No se pueden empaquetar 341 fotos reales (la app funciona sin
   conexión y el service worker bloquea imágenes externas). En su
   lugar, cada ejercicio recibe una ILUSTRACIÓN esquemática: una
   silueta haciendo el movimiento + el material, elegida por el
   patrón de movimiento, el equipo y el nombre.

   `exIllus(id, opts)` → cadena SVG autocontenida (usa currentColor,
   así hereda el color del tema). Recognoscible de un vistazo para
   identificar el ejercicio en el gimnasio.

   depende de sport-data.js (EXERCISES, exDisc) y, si está,
   sport-gear.js (gearItemsOf)
══════════════════════════════════════════════════════════ */

/* ── Piezas reutilizables ─────────────────────────────────── */
function _illHead(x,y,r){ return `<circle cx="${x}" cy="${y}" r="${r||5.5}" fill="currentColor" stroke="none"/>`; }
/* barra olímpica horizontal con discos, centrada en (x,y), semiancho w */
function _illBar(x,y,w){ w=w||30; return `<g class="ill-imp"><line x1="${x-w}" y1="${y}" x2="${x+w}" y2="${y}"/><line x1="${x-w}" y1="${y-6}" x2="${x-w}" y2="${y+6}"/><line x1="${x-w+4}" y1="${y-7}" x2="${x-w+4}" y2="${y+7}"/><line x1="${x+w}" y1="${y-6}" x2="${x+w}" y2="${y+6}"/><line x1="${x+w-4}" y1="${y-7}" x2="${x+w-4}" y2="${y+7}"/></g>`; }
/* mancuerna centrada en (x,y) */
function _illDb(x,y){ return `<g class="ill-imp"><line x1="${x-6}" y1="${y}" x2="${x+6}" y2="${y}"/><line x1="${x-6}" y1="${y-4}" x2="${x-6}" y2="${y+4}"/><line x1="${x+6}" y1="${y-4}" x2="${x+6}" y2="${y+4}"/></g>`; }
/* kettlebell colgando de (x,y) */
function _illKb(x,y){ return `<g class="ill-imp"><path d="M${x-3} ${y} a3 3 0 0 1 6 0"/><path d="M${x-5} ${y+3} q0 8 5 8 q5 0 5 -8 z" fill="currentColor" opacity=".18"/><path d="M${x-5} ${y+3} q0 8 5 8 q5 0 5 -8 z"/></g>`; }
/* marco de máquina (fondo) */
function _illMachine(){ return `<g class="ill-mach"><rect x="14" y="16" width="72" height="70" rx="5"/><line x1="24" y1="16" x2="24" y2="86"/></g>`; }
/* polea alta (rueda + cable desde arriba a (x,y)) */
function _illPulleyTop(x,y){ return `<g class="ill-mach"><circle cx="78" cy="18" r="5"/><line x1="78" y1="18" x2="78" y2="10"/></g><line class="ill-imp" x1="78" y1="22" x2="${x}" y2="${y}"/>`; }
/* suelo tenue */
const _illGround = `<line class="ill-ground" x1="12" y1="90" x2="88" y2="90"/>`;

/* ── Poses (silueta de línea, viewBox 0..100) ─────────────── */
/* Cada pose devuelve el interior de <g stroke=currentColor>. */
const ILL_POSES = {
  // sentadilla (vista lateral, con barra a la espalda)
  squat:(imp)=>`${_illGround}${imp==='bar'?_illBar(50,34,26):''}
    ${_illHead(50,20)}<path d="M50 25 L51 44"/><path d="M51 44 L40 56 L43 78"/><path d="M51 44 L60 56 L58 78"/>
    <path d="M50 30 L38 36"/><path d="M50 30 L62 36"/>${imp==='db'?_illDb(38,36)+_illDb(62,36):''}`,
  // bisagra de cadera / peso muerto
  hinge:(imp)=>`${_illGround}${_illHead(36,26)}<path d="M40 30 L60 44"/><path d="M60 44 L60 78"/>
    <path d="M43 33 L44 58"/><path d="M50 37 L51 58"/>${imp==='bar'?_illBar(44,58,20):imp==='db'?_illDb(44,58)+_illDb(51,58):imp==='kb'?_illKb(47,56):''}`,
  // zancada / unilateral
  lunge:(imp)=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 46"/><path d="M50 46 L36 58 L36 78"/><path d="M50 46 L64 62 L70 78"/>
    <path d="M50 30 L44 44"/><path d="M50 30 L56 44"/>${imp==='db'?_illDb(44,44)+_illDb(56,44):''}`,
  // press de banca
  benchpress:(imp)=>`<line class="ill-mach" x1="20" y1="70" x2="72" y2="70"/><line class="ill-mach" x1="30" y1="70" x2="30" y2="84"/><line class="ill-mach" x1="64" y1="70" x2="64" y2="84"/>
    ${_illHead(30,62)}<path d="M34 66 L64 66"/><path d="M40 66 L40 48"/><path d="M56 66 L56 48"/>${imp==='db'?_illDb(40,46)+_illDb(56,46):_illBar(48,45,20)}`,
  // flexiones (peso corporal)
  pushup:()=>`${_illGround}${_illHead(26,54)}<path d="M31 57 L74 74"/><path d="M40 60 L40 76"/><path d="M58 66 L58 76"/><path d="M31 57 L30 76"/>`,
  // press militar / vertical
  ohp:(imp)=>`${_illGround}${_illHead(50,30)}<path d="M50 35 L50 66"/><path d="M50 66 L42 84"/><path d="M50 66 L58 84"/>
    <path d="M50 40 L40 24"/><path d="M50 40 L60 24"/>${imp==='db'?_illDb(40,22)+_illDb(60,22):_illBar(50,20,18)}`,
  // remo horizontal
  row:(imp)=>`${_illGround}${_illHead(34,30)}<path d="M38 34 L62 46"/><path d="M62 46 L62 78"/><path d="M45 38 L46 60"/>
    <path d="M46 40 L58 52"/>${imp==='bar'?_illBar(58,54,16):imp==='db'?_illDb(58,54):''}`,
  // jalón al pecho (polea alta, sentado)
  pulldown:()=>`${_illPulleyTop(50,42)}${_illHead(50,50)}<path d="M50 55 L50 74"/><path d="M50 58 L40 44"/><path d="M50 58 L60 44"/>
    <line class="ill-imp" x1="38" y1="42" x2="62" y2="42"/><path d="M50 74 L44 84"/><path d="M50 74 L56 84"/>`,
  // dominada (colgado de barra)
  pullup:()=>`<line class="ill-imp" x1="24" y1="18" x2="76" y2="18"/>${_illHead(50,38)}<path d="M50 43 L50 68"/><path d="M50 46 L42 20"/><path d="M50 46 L58 20"/><path d="M50 68 L45 82"/><path d="M50 68 L55 82"/>`,
  // curl de bíceps
  curl:(imp)=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 60"/><path d="M50 60 L44 84"/><path d="M50 60 L56 84"/>
    <path d="M50 32 L42 46 L48 36"/>${imp==='bar'?_illBar(46,34,14):imp==='db'?_illDb(48,35):_illDb(48,35)}`,
  // extensión de tríceps (polea / encima)
  tricepsext:(imp)=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 60"/><path d="M50 60 L44 84"/><path d="M50 60 L56 84"/>
    <path d="M50 32 L56 44 L52 54"/>${imp==='cable'?_illPulleyTop(52,54):_illDb(52,55)}`,
  // elevación lateral
  lateralraise:(imp)=>`${_illGround}${_illHead(50,22)}<path d="M50 27 L50 62"/><path d="M50 62 L44 84"/><path d="M50 62 L56 84"/>
    <path d="M50 34 L30 34"/><path d="M50 34 L70 34"/>${imp==='cable'?'':_illDb(28,34)+_illDb(72,34)}`,
  // elevación frontal
  frontraise:()=>`${_illGround}${_illHead(38,24)}<path d="M40 28 L44 62"/><path d="M44 62 L40 84"/><path d="M44 62 L50 84"/><path d="M42 36 L66 34"/>${_illDb(68,34)}`,
  // aperturas / cruce (pecho)
  fly:()=>`${_illGround}${_illHead(50,22)}<path d="M50 27 L50 60"/><path d="M50 60 L44 84"/><path d="M50 60 L56 84"/><path d="M50 34 Q34 34 30 46"/><path d="M50 34 Q66 34 70 46"/>${_illDb(29,48)+_illDb(71,48)}`,
  // face pull / deltoides posterior (polea a la cara)
  facepull:()=>`${_illPulleyTop(56,40)}${_illHead(40,34)}<path d="M42 38 L44 66"/><path d="M44 66 L40 84"/><path d="M44 66 L50 84"/><path d="M44 44 L58 40"/><line class="ill-imp" x1="56" y1="34" x2="56" y2="46"/>`,
  // encogimiento (trapecio)
  shrug:(imp)=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 64"/><path d="M50 64 L44 84"/><path d="M50 64 L56 84"/><path d="M38 32 L38 60"/><path d="M62 32 L62 60"/>${imp==='bar'?_illBar(50,62,20):_illDb(38,62)+_illDb(62,62)}`,
  // gemelo (de puntillas)
  calf:()=>`${_illGround}${_illHead(50,22)}<path d="M50 27 L50 66"/><path d="M50 66 L46 82"/><path d="M50 66 L54 82"/><path d="M40 82 L46 82"/><path d="M54 82 L60 82"/><path d="M43 84 L57 84"/>`,
  // extensión de cuádriceps (sentado en máquina)
  legext:()=>`${_illMachine()}${_illHead(34,40)}<path d="M36 44 L50 52"/><path d="M50 52 L68 46"/><path d="M50 52 L50 66"/>`,
  // curl femoral (tumbado en máquina)
  legcurl:()=>`${_illMachine()}${_illHead(24,58)}<path d="M28 58 L60 58"/><path d="M60 58 L68 44"/>`,
  // abducción de cadera (máquina)
  abduction:()=>`${_illMachine()}${_illHead(50,34)}<path d="M50 38 L50 58"/><path d="M50 58 L38 76"/><path d="M50 58 L62 76"/>`,
  // prensa de piernas (recostado empujando la plataforma en rampa)
  legpress:()=>`${_illGround}<rect class="ill-mach" x="62" y="30" width="20" height="24" rx="3"/>
    ${_illHead(20,66)}<path d="M24 68 L44 72"/><path d="M44 72 L58 60"/><path d="M58 60 L64 48"/><path d="M26 64 L40 62"/>`,
  // plancha
  plank:()=>`${_illGround}${_illHead(24,60)}<path d="M29 62 L72 74"/><path d="M30 64 L30 78"/><path d="M68 72 L70 80"/>`,
  // crunch / abdominales (tumbado, tronco elevado y rodillas flexionadas)
  crunch:()=>`${_illGround}${_illHead(28,72)}<path d="M32 72 L50 64"/><path d="M50 64 L62 74"/><path d="M62 74 L72 74"/><path d="M50 64 L56 74"/>`,
  // carrera
  run:()=>`${_illGround}${_illHead(56,20)}<path d="M55 25 L50 48"/><path d="M50 48 L62 58 L58 74"/><path d="M50 48 L40 60 L46 74"/><path d="M52 30 L64 40"/><path d="M52 30 L42 42"/>`,
  // ciclismo
  bike:()=>`${_illGround}<circle class="ill-mach" cx="32" cy="74" r="12"/><circle class="ill-mach" cx="70" cy="74" r="12"/><path class="ill-mach" d="M32 74 L52 74 L44 54 L60 54"/><path class="ill-mach" d="M52 74 L60 54"/>${_illHead(52,34)}<path d="M52 39 L52 56"/><path d="M52 44 L62 52"/><path d="M52 56 L44 66"/>`,
  // remo máquina / ski erg
  rowmachine:()=>`<line class="ill-mach" x1="16" y1="82" x2="84" y2="82"/>${_illHead(58,44)}<path d="M56 48 L44 60"/><path d="M44 60 L30 62"/><path d="M44 60 L58 66"/><line class="ill-imp" x1="30" y1="58" x2="30" y2="66"/>`,
  // natación
  swim:()=>`<path class="ill-water" d="M12 66 q9 -6 18 0 t18 0 t18 0 t18 0"/><path class="ill-water" d="M12 74 q9 -6 18 0 t18 0 t18 0 t18 0" opacity=".5"/>${_illHead(34,52)}<path d="M38 54 L64 58"/><path d="M40 55 L28 44"/><path d="M64 58 L74 50"/>`,
  // salto / pliometría
  jump:()=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 48"/><path d="M50 48 L42 62 L44 74"/><path d="M50 48 L58 62 L56 74"/><path d="M50 30 L38 22"/><path d="M50 30 L62 22"/>`,
  // combate (guardia / golpeo)
  boxing:()=>`${_illGround}${_illHead(46,22)}<path d="M46 27 L48 60"/><path d="M48 60 L40 82"/><path d="M48 60 L56 82"/><path d="M47 34 L64 30"/><path d="M47 34 L58 42"/><circle cx="66" cy="30" r="4" fill="currentColor" stroke="none"/>`,
  // raqueta
  racket:()=>`${_illGround}${_illHead(46,22)}<path d="M46 27 L48 60"/><path d="M48 60 L42 82"/><path d="M48 60 L56 82"/><path d="M47 34 L62 24"/><ellipse class="ill-imp" cx="68" cy="19" rx="6" ry="8"/>`,
  // baile
  dance:()=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L54 52"/><path d="M54 52 L46 76"/><path d="M54 52 L66 70"/><path d="M52 32 L38 24"/><path d="M52 32 L66 40"/>`,
  // acarreo (farmer walk)
  carry:()=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 64"/><path d="M50 64 L44 84"/><path d="M50 64 L56 84"/><path d="M40 30 L40 58"/><path d="M60 30 L60 58"/>${_illKb(40,58)+_illKb(60,58)}`,
  // movilidad / estiramiento
  stretch:()=>`${_illGround}${_illHead(38,30)}<path d="M40 34 L52 52"/><path d="M52 52 L70 48"/><path d="M52 52 L50 74"/><path d="M42 38 L66 46"/>`,
  // genérico (mancuerna de pie) — último recurso
  generic:()=>`${_illGround}${_illHead(50,20)}<path d="M50 25 L50 62"/><path d="M50 62 L44 84"/><path d="M50 62 L56 84"/><path d="M50 34 L40 48"/><path d="M50 34 L60 48"/>${_illDb(38,50)+_illDb(62,50)}`
};

/* ── Resolver: ejercicio → clave de pose + implemento ─────── */
function _illImplement(ex, id){
  let items = [];
  try{ if(typeof gearItemsOf==='function') items = gearItemsOf(id) || []; }catch(e){}
  const eq = (ex.equip||'').toLowerCase();
  if(items.includes('barra') || /barra(?! fija)/.test(eq)) return 'bar';
  if(items.includes('mancuernas') || /mancuern/.test(eq)) return 'db';
  if(items.includes('kettlebell') || /kettlebell|pesa rusa/.test(eq)) return 'kb';
  if(items.includes('polea') || /polea|cable/.test(eq)) return 'cable';
  return '';
}

/* Devuelve la clave de pose para un ejercicio */
function illPoseKey(ex, id){
  const n = (ex.name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const eq = (ex.equip||'').toLowerCase();
  const pat = ex.pat;
  const has = (...w)=> w.some(x=> n.includes(x));

  // 1) por nombre (disciplinas y movimientos inequívocos)
  if(has('natacion','nadar','crol','braza','espalda','mariposa','pull-buoy','aquagym','estilos','pies de','aletas','palas')) return 'swim';
  if(has('bici','bicicleta','spinning','eliptica','ciclismo','rodillo','cadencia','sweet spot')) return 'bike';
  if(has('remoergometro','skierg','ski erg','remo continuo','remo 500','remo 2000','remo:','remo suave','remo intervalos')) return 'rowmachine';
  if(has('correr','carrera','sprint','fartlek','trote','rodaje','tempo','series de 4','cuesta','escalera','caminar','senderismo','marcha nordica','tirada')) return 'run';
  if(has('boxeo','kickboxing','sombra','saco','manopla','patada','rodilla','combate','sparring','guardia','esquiva')) return 'boxing';
  if(has('tenis','padel','raqueta','volea','smash','saque','bandeja','vibora','dejada','multibola','badminton','revs','derecha','reves')) return 'racket';
  if(has('baile','zumba','salsa','bachata','hip-hop','danza','ballet','batuka','flamenco','swing','coreografia')) return 'dance';
  if(has('kayak','piragu','paddle','sup','surf')) return 'rowmachine';
  if(has('yoga','pilates','estiramiento','estira','movilidad','gato','cobra','psoas','cadera 90','dislocacion','perro boca','tai chi','respiracion')) return 'stretch';
  if(has('salto','burpee','box jump','pliometr','saltar a la comba','comba','jumping jack','thruster','wall ball','slam','battle','bear crawl','mountain climber','sled','trineo')) return has('comba','jumping','burpee','mountain','bear','battle','slam')?'jump':'jump';
  if(has('dominada','pull-up','pull up','chin-up')) return 'pullup';
  if(has('jalon','pulldown','pullover')) return 'pulldown';
  if(has('gemelo','pantorrilla','calf','elevacion de talones')) return 'calf';  // antes que 'prensa' (gemelo en prensa)
  if(has('prensa de pierna','prensa horizontal','leg press')) return 'legpress';
  if(has('extension de cuadriceps','extension de pierna','leg extension')) return 'legext';
  if(has('curl femoral','curl de pierna','femoral')) return 'legcurl';
  if(has('abduccion','abductor','aductor','contragolpe','patada de gluteo','kickback')) return 'abduction';
  if(has('face pull','tiron a la cara','cruces inversos','pajaro','reverse fly','deltoides posterior')) return 'facepull';
  if(has('apertura','aperturas','cruce de polea','peck deck','contractora','pec')) return 'fly';
  if(has('elevacion lateral','lateral raise','elevaciones laterales')) return 'lateralraise';
  if(has('elevacion frontal','elevaciones frontales')) return 'frontraise';   // NO 'frontal' suelto (sentadilla/plancha frontal)
  if(has('escalada','trepar','rocodromo')) return 'pullup';
  if(has('encogimiento','shrug','trapecio')) return 'shrug';
  if(has('curl','biceps','martillo','predicador')) return 'curl';
  if(has('triceps','frances','fondos','press frances','patada de triceps','extension de codo')) return 'tricepsext';
  if(has('sentadilla','squat','hack','goblet')) return 'squat';
  if(has('peso muerto','deadlift','buenos dias','hip thrust','puente','rumano','bisagra','swing','good morning')) return 'hinge';
  if(has('zancada','bulgara','lunge','desplante','step up','step-up','subida al cajon','split','pistol')) return 'lunge';
  if(has('press de banca','press banca','press de pecho','press pecho')) return 'benchpress';
  if(has('press militar','press de hombro','press hombro','arnold','push press','press estricto')) return 'ohp';
  if(has('remo')) return 'row';
  if(has('flexion','push up','push-up','fondo de pecho')) return 'pushup';
  if(has('plancha','plank','hollow','copenhague','pallof')) return 'plank';
  if(has('abdominal','crunch','encogimiento de rodilla','elevacion de piernas','rueda','ab wheel','russian','dead bug','bird dog','oblicuo','rotacion')) return 'crunch';
  if(has('farmer','acarreo','carry','suitcase','yoke')) return 'carry';

  // 2) por disciplina (deportes no-gimnasio cuyo nombre no matchee arriba:
  //    p. ej. «Aguas abiertas» o «Series hipóxicas» son natación → swim)
  let disc = ''; try{ if(typeof exDisc==='function') disc = exDisc(ex); }catch(e){}
  const byDisc = {natacion:'swim', ciclismo:'bike', remo:'rowmachine', carrera:'run',
    combate:'boxing', raqueta:'racket', baile:'dance', movilidad:'stretch'};
  if(byDisc[disc]) return byDisc[disc];

  // 3) por patrón de movimiento
  const byPat = {
    sentadilla:'squat', bisagra:'hinge', unilateral:'lunge',
    empuje_h:/peso corporal|sin material/.test(eq)?'pushup':'benchpress',
    empuje_v:'ohp', traccion_h:'row',
    traccion_v:/barra fija|dominad/.test(eq)?'pullup':'pulldown',
    core:'plank', acarreo:'carry', carrera:'run',
    ergometro:'bike', pliometria:'jump', condicionamiento:'jump', movilidad:'stretch'
  };
  if(byPat[pat]) return byPat[pat];
  return 'generic';
}

/* ── API pública ──────────────────────────────────────────── */
const _illCache = {};
function exIllus(id, opts){
  opts = opts || {};
  const ex = (typeof EXERCISES!=='undefined') ? EXERCISES[id] : null;
  const key = (id||'') + (opts.cls||'');
  if(_illCache[key]) return _illCache[key];
  if(!ex){ return `<svg viewBox="0 0 100 100" class="ex-illus-svg" aria-hidden="true"></svg>`; }
  const pose = illPoseKey(ex, id);
  const imp  = _illImplement(ex, id);
  const inner = (ILL_POSES[pose] || ILL_POSES.generic)(imp);
  const svg = `<svg viewBox="0 0 100 100" class="ex-illus-svg${opts.cls?' '+opts.cls:''}" role="img" aria-label="${(ex.name||'').replace(/"/g,'')}" data-pose="${pose}">`
    + `<g fill="none" stroke="currentColor" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
  _illCache[key] = svg;
  return svg;
}
/* ── Imágenes reales generadas (ex-img/) ──────────────────────
   Si el generador (gen-exercise-art.cjs) ha creado una imagen para
   este ejercicio, la app la prefiere sobre el pictograma SVG. El
   manifest (ex-img/manifest.json) dice qué ids tienen imagen; se
   carga una vez al arrancar. Sin manifest, todo sigue en SVG. */
var _illImg = null;                 // {id: 'png'|'webp'} o null si no hay
/* Imagen de ALTA resolución (ex-img/<id>.<ext>) → vista de detalle/ficha */
function illImageFor(id){
  if(!_illImg || !_illImg[id]) return null;
  return 'ex-img/' + id + '.' + _illImg[id];
}
/* MINIATURA de baja resolución (ex-img/sm/<id>.webp, ~7 KB) → tarjetas,
   listas y modo entrenamiento: carga instantánea. Se genera una por cada
   imagen de alta (make-thumbs.cjs), así que existe siempre que exista la alta. */
function illThumbFor(id){
  if(!_illImg || !_illImg[id]) return null;
  return 'ex-img/sm/' + id + '.webp';
}
/* Fija el manifest directamente (lo usa illInitImages y sirve para tests) */
function illUseManifest(m){
  _illImg = (m && typeof m === 'object' && Object.keys(m).length) ? m : null;
  try{ if(typeof renderSportActive === 'function') renderSportActive(); }catch(e){}
}
function illInitImages(){
  if(typeof fetch !== 'function' || typeof document === 'undefined') return;
  fetch('ex-img/manifest.json', {cache:'no-cache'})
    .then(r => r.ok ? r.json() : null)
    .then(m => {
      if(m && typeof m === 'object' && Object.keys(m).length){
        _illImg = m;
        // repinta la sección de deporte si ya está montada
        try{ if(typeof renderSportActive === 'function') renderSportActive(); }catch(e){}
      }
    })
    .catch(()=>{});   // sin manifest → pictogramas, sin ruido
}

/* Envuelto en su contenedor (para tarjetas): imagen real si existe,
   si no el pictograma SVG. Incluye acento por músculo. */
function exIllusBox(id, opts){
  opts = opts || {};
  const ex = (typeof EXERCISES!=='undefined') ? EXERCISES[id] : null;
  const accent = ex && ex.muscles && ex.muscles[0] && typeof EX_MUSCLES!=='undefined' && EX_MUSCLES[ex.muscles[0]]
    ? EX_MUSCLES[ex.muscles[0]].c : '';
  // La ficha/detalle (hero) carga la imagen de ALTA; el resto, la miniatura.
  const isHero = /\bhero\b/.test(opts.cls||'');
  const full   = illImageFor(id);
  const thumb  = isHero ? null : illThumbFor(id);
  const src    = isHero ? full : (thumb || full);
  let inner;
  if(src){
    const alt = ((ex&&ex.name)||'').replace(/"/g,'');
    const toSvg = `this.replaceWith(document.createRange().createContextualFragment(window.exIllus?exIllus('${id}',{}):''))`;
    // si falla la miniatura, primero prueba la imagen de alta; si también falla, pictograma
    const onerr = (thumb && full && thumb !== full)
      ? `if(this.dataset.f){${toSvg}}else{this.dataset.f=1;this.src='${full}'}`
      : toSvg;
    // hero: carga prioritaria (la miras de cerca); miniatura: diferida
    const load = isHero ? 'fetchpriority="high"' : 'loading="lazy"';
    inner = `<img class="ex-illus-img" src="${src}" alt="${alt}" ${load} decoding="async" onerror="${onerr}">`;
  } else {
    inner = exIllus(id, opts);
  }
  return `<span class="ex-illus ${opts.cls||''}${src?' has-img':''}"${accent?` style="--il:${accent}"`:''}>${inner}</span>`;
}
/* ¿la pose es genérica? (para saber cuáles conviene afinar luego) */
function illIsGeneric(id){ const ex=EXERCISES[id]; return ex ? illPoseKey(ex,id)==='generic' : true; }

/* ── Mapa muscular ────────────────────────────────────────────
   Silueta frontal + dorsal con los músculos implicados resaltados
   (el primero de la lista = primario, más intenso). Es la MISMA
   información que muestran las guías de ejercicios (qué músculos
   trabaja), pero como imagen original nuestra: hechos, no copyright.

   Las regiones se colorean sobre una silueta tenue. Cada músculo se
   asocia a una o varias manchas anatómicas aproximadas por vista.
══════════════════════════════════════════════════════════ */
/* Manchas por músculo: {f:[frente], b:[espalda]} en dos figuras
   (frente centrada en x≈30, espalda en x≈90; alto útil 8..92). */
const ILL_MUSCLE_SHAPES = {
  pecho:     {f:['<ellipse cx="26" cy="30" rx="4.5" ry="3"/>','<ellipse cx="34" cy="30" rx="4.5" ry="3"/>'], b:[]},
  espalda:   {f:[], b:['<ellipse cx="90" cy="30" rx="7.5" ry="6"/>','<ellipse cx="90" cy="42" rx="5" ry="5"/>']},
  hombro:    {f:['<circle cx="21" cy="25" r="3.2"/>','<circle cx="39" cy="25" r="3.2"/>'], b:['<circle cx="81" cy="25" r="3.2"/>','<circle cx="99" cy="25" r="3.2"/>']},
  biceps:    {f:['<ellipse cx="19" cy="33" rx="2.4" ry="4"/>','<ellipse cx="41" cy="33" rx="2.4" ry="4"/>'], b:[]},
  triceps:   {f:[], b:['<ellipse cx="79" cy="33" rx="2.4" ry="4"/>','<ellipse cx="101" cy="33" rx="2.4" ry="4"/>']},
  antebrazo: {f:['<ellipse cx="17" cy="43" rx="2.2" ry="4"/>','<ellipse cx="43" cy="43" rx="2.2" ry="4"/>'], b:['<ellipse cx="77" cy="43" rx="2.2" ry="4"/>','<ellipse cx="103" cy="43" rx="2.2" ry="4"/>']},
  core:      {f:['<ellipse cx="30" cy="40" rx="4.5" ry="6"/>'], b:['<ellipse cx="90" cy="40" rx="4" ry="5"/>']},
  cuadriceps:{f:['<ellipse cx="27" cy="60" rx="3" ry="8"/>','<ellipse cx="33" cy="60" rx="3" ry="8"/>'], b:[]},
  isquios:   {f:[], b:['<ellipse cx="87" cy="60" rx="3" ry="8"/>','<ellipse cx="93" cy="60" rx="3" ry="8"/>']},
  gluteo:    {f:[], b:['<ellipse cx="87" cy="50" rx="4" ry="4"/>','<ellipse cx="93" cy="50" rx="4" ry="4"/>']},
  gemelo:    {f:['<ellipse cx="27" cy="76" rx="2.4" ry="5"/>','<ellipse cx="33" cy="76" rx="2.4" ry="5"/>'], b:['<ellipse cx="87" cy="76" rx="2.4" ry="5"/>','<ellipse cx="93" cy="76" rx="2.4" ry="5"/>']},
  fullbody:  {f:['<rect x="24" y="20" width="12" height="26" rx="5"/>'], b:['<rect x="84" y="20" width="12" height="26" rx="5"/>']}
};
/* Silueta tenue de una figura (frente o espalda idénticas de forma) */
function _illSilhouette(cx){
  return `<g class="bm-sil">`
    + `<circle cx="${cx}" cy="12" r="6"/>`
    + `<rect x="${cx-7}" y="18" width="14" height="28" rx="6"/>`
    + `<rect x="${cx-13}" y="20" width="5" height="26" rx="2.5"/>`
    + `<rect x="${cx+8}" y="20" width="5" height="26" rx="2.5"/>`
    + `<rect x="${cx-6.5}" y="46" width="6" height="34" rx="3"/>`
    + `<rect x="${cx+0.5}" y="46" width="6" height="34" rx="3"/>`
    + `</g>`;
}
/* SVG del mapa muscular para una lista de músculos */
function muscleMapSVG(muscles, opts){
  opts = opts || {};
  muscles = (muscles||[]).filter(m=> ILL_MUSCLE_SHAPES[m]);
  const primary = muscles[0];
  const front = [], back = [];
  muscles.forEach(m=>{
    const s = ILL_MUSCLE_SHAPES[m]; if(!s) return;
    const cls = (m===primary) ? 'bm-hi prim' : 'bm-hi sec';
    (s.f||[]).forEach(sh=> front.push(sh.replace('/>', ` class="${cls}"/>`)));
    (s.b||[]).forEach(sh=> back.push(sh.replace('/>', ` class="${cls}"/>`)));
  });
  return `<svg viewBox="0 0 120 96" class="bm-svg${opts.cls?' '+opts.cls:''}" role="img" aria-label="Músculos trabajados">`
    + _illSilhouette(30) + _illSilhouette(90)
    + front.join('') + back.join('')
    + `<text x="30" y="94" class="bm-lbl">frente</text><text x="90" y="94" class="bm-lbl">espalda</text>`
    + `</svg>`;
}
/* Caja del mapa muscular con leyenda de primario/secundario */
function muscleMapBox(muscles){
  const named = (muscles||[]).filter(m=> typeof EX_MUSCLES!=='undefined' && EX_MUSCLES[m]);
  const primary = named[0];
  const legend = named.map(m=> `<span class="bm-leg ${m===primary?'prim':'sec'}"><i style="--mc:${(EX_MUSCLES[m]||{}).c||'#888'}"></i>${(EX_MUSCLES[m]||{}).lbl||m}${m===primary?' · principal':''}</span>`).join('');
  return `<div class="muscle-map">${muscleMapSVG(muscles)}<div class="bm-legend">${legend}</div></div>`;
}

window.exIllus = exIllus;
window.exIllusBox = exIllusBox;
window.illPoseKey = illPoseKey;
window.illIsGeneric = illIsGeneric;
window.illImageFor = illImageFor;
window.illThumbFor = illThumbFor;
window.illInitImages = illInitImages;
window.illUseManifest = illUseManifest;
window.muscleMapSVG = muscleMapSVG;
window.muscleMapBox = muscleMapBox;

/* carga el manifest de imágenes al arrancar (si lo hay) */
if(typeof document !== 'undefined'){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', illInitImages, {once:true});
  else illInitImages();
}
