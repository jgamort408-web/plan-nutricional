/* ══════════════════════════════════════════════════════════
   SPORT GEAR · material necesario por ejercicio
   El campo `equip` del catálogo es texto libre ("Barra + rack",
   "Polea alta", "Piscina, gafas"), útil para leer pero inservible
   para comprobar si PUEDES hacer un ejercicio. Aquí se traduce a
   una lista de ítems normalizados y se define qué hay en cada sitio
   (casa sin material, casa equipada, gimnasio, parque, hotel…).

   `gearItemsOf(id)` → ['barra','banco'] · se calcula una vez y se cachea.

   depende de sport-data.js (EXERCISES)
══════════════════════════════════════════════════════════ */

/* Catálogo de ítems de material. `place` marca dónde suele haberlo. */
var GEAR_ITEMS = {
  ninguno:    {lbl:'Sin material',        ico:'🧍'},
  esterilla:  {lbl:'Esterilla',           ico:'🧘'},
  banda:      {lbl:'Banda elástica',      ico:'🎗️'},
  mancuernas: {lbl:'Mancuernas',          ico:'🏋️'},
  kettlebell: {lbl:'Kettlebell',          ico:'🔔'},
  barra:      {lbl:'Barra y discos',      ico:'🏋️'},
  barra_ez:   {lbl:'Barra EZ',            ico:'🏋️'},
  banco:      {lbl:'Banco',               ico:'🛋️'},
  rack:       {lbl:'Rack o jaula',        ico:'🗜️'},
  smith:      {lbl:'Multipower (Smith)',  ico:'⛓️'},
  polea:      {lbl:'Polea o cable',       ico:'🎣'},
  maquina:    {lbl:'Máquina guiada',      ico:'⚙️'},
  barra_fija: {lbl:'Barra de dominadas',  ico:'🤸'},
  paralelas:  {lbl:'Paralelas / fondos',  ico:'🤸'},
  cajon:      {lbl:'Cajón o step',        ico:'📦'},
  balon_med:  {lbl:'Balón medicinal',     ico:'⚽'},
  comba:      {lbl:'Comba',               ico:'🪢'},
  rueda_ab:   {lbl:'Rueda abdominal',     ico:'🎡'},
  trx:        {lbl:'TRX / anillas',       ico:'🪢'},
  trineo:     {lbl:'Trineo',              ico:'🛷'},
  cinta:      {lbl:'Cinta de correr',     ico:'🏃'},
  bici:       {lbl:'Bicicleta o rodillo', ico:'🚴'},
  eliptica:   {lbl:'Elíptica',            ico:'🌀'},
  remo_erg:   {lbl:'Remoergómetro',       ico:'🚣'},
  skierg:     {lbl:'SkiErg',              ico:'⛷️'},
  piscina:    {lbl:'Piscina',             ico:'🏊'},
  nat_acces:  {lbl:'Tabla/pull-buoy/palas',ico:'🥽'},
  saco:       {lbl:'Saco de boxeo',       ico:'🥊'},
  guantes:    {lbl:'Guantes y vendas',    ico:'🧤'},
  raqueta:    {lbl:'Raqueta o pala',      ico:'🎾'},
  pista:      {lbl:'Pista',               ico:'🏟️'},
  balon:      {lbl:'Balón',               ico:'⚽'},
  zapatillas: {lbl:'Zapatillas',          ico:'👟'},
  exterior:   {lbl:'Espacio exterior',    ico:'🌳'},
  escalera_ag:{lbl:'Escalera de agilidad',ico:'🪜'},
  kayak:      {lbl:'Kayak o tabla',       ico:'🛶'},
  otros:      {lbl:'Material específico', ico:'🎒'}
};

/* Reglas texto → ítems. Orden importante: la primera que casa manda
   para cada trozo, pero se acumulan todos los ítems que aparezcan. */
var GEAR_RULES = [
  [/multipower|smith/,                         'smith'],
  [/barra ez|barra z\b/,                       'barra_ez'],
  [/barra fija|dominadas/,                     'barra_fija'],
  [/paralelas|fondos/,                         'paralelas'],
  [/\bbarra\b|disco/,                          'barra'],
  [/rack|jaula|soporte/,                       'rack'],
  [/banco/,                                    'banco'],
  [/mancuern/,                                 'mancuernas'],
  [/kettlebell|pesa rusa/,                     'kettlebell'],
  [/polea|cable/,                              'polea'],
  [/m[aá]quina|prensa|contractora|peck|asistencia/, 'maquina'],
  [/banda|goma/,                               'banda'],
  [/esterilla|colchoneta/,                     'esterilla'],
  [/caj[oó]n|step|banqueta|silla/,             'cajon'],
  [/bal[oó]n medicinal|slam ball|wall ball/,   'balon_med'],
  [/comba|cuerda de saltar/,                   'comba'],
  [/rueda abdominal|ab wheel/,                 'rueda_ab'],
  [/trx|anillas|suspensi[oó]n/,                'trx'],
  [/trineo|sled/,                              'trineo'],
  [/cinta (de )?correr|cinta inclinada/,       'cinta'],
  [/bicicleta|bici|rodillo|spinning/,          'bici'],
  [/el[ií]ptica/,                              'eliptica'],
  [/remoerg[oó]metro|remo erg/,                'remo_erg'],
  [/skierg|ski erg/,                           'skierg'],
  [/piscina|aguas abiertas/,                   'piscina'],
  [/tabla|pull-?buoy|palas|aletas|gafas|poyete|churro|cintur[oó]n/, 'nat_acces'],
  [/saco/,                                     'saco'],
  [/guantes|vendas|espinilleras|manoplas|casco|bucal|protecciones/, 'guantes'],
  [/raqueta|pala\b|stick/,                     'raqueta'],
  [/pista|canasta|red\b|roc[oó]dromo|puerto/,  'pista'],
  [/bal[oó]n|pelota/,                          'balon'],
  [/zapatillas|pies de gato|zapatos/,          'zapatillas'],
  [/escalera de agilidad/,                     'escalera_ag'],
  [/kayak|piragu|sup|tabla de surf|surf/,      'kayak'],
  [/lastre|chaleco|cinta el[aá]stica/,         'otros']
];
/* Textos que significan "no hace falta nada" */
var GEAR_NONE = /^(peso corporal|sin material|ninguno|suelo|espacio libre|m[uú]sica[, ]*espacio libre|)$/;

var _gearCache = null;
/* Ítems de material que exige un ejercicio → ['barra','banco'] */
function gearItemsOf(id){
  if(!_gearCache) _gearCache = {};
  if(_gearCache[id]) return _gearCache[id];
  const ex = (typeof EXERCISES !== 'undefined') ? EXERCISES[id] : null;
  if(!ex) return (_gearCache[id] = ['ninguno']);
  if(Array.isArray(ex.gear) && ex.gear.length) return (_gearCache[id] = ex.gear.slice());

  const raw = (ex.equip||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const out = [];
  if(!GEAR_NONE.test(raw.trim())){
    GEAR_RULES.forEach(([re, item])=>{ if(re.test(raw) && !out.includes(item)) out.push(item); });
  }
  if(!out.length) out.push('ninguno');
  return (_gearCache[id] = out);
}
/* Etiqueta legible del material de un ejercicio */
function gearLabelOf(id){
  return gearItemsOf(id).map(k=> (GEAR_ITEMS[k]||{lbl:k}).lbl).join(' + ');
}

/* ── Lugares ──────────────────────────────────────────────────
   Qué material hay normalmente en cada sitio. El usuario elige el
   lugar y se marcan sus ítems; luego puede afinar uno a uno.
══════════════════════════════════════════════════════════ */
var GEAR_PLACES = {
  casa_sin: {
    lbl:'En casa, sin material', ico:'🏠',
    sub:'Solo tu cuerpo y, como mucho, una esterilla',
    items:['ninguno','esterilla']
  },
  casa_basico: {
    lbl:'En casa, con lo básico', ico:'🏡',
    sub:'Esterilla, bandas, un par de mancuernas',
    items:['ninguno','esterilla','banda','mancuernas','cajon','comba']
  },
  casa_equipada: {
    lbl:'Casa equipada', ico:'🏋️',
    sub:'Barra, banco, dominadas… un pequeño gimnasio',
    items:['ninguno','esterilla','banda','mancuernas','kettlebell','barra','banco','rack','barra_fija','cajon','comba','rueda_ab','trx']
  },
  gimnasio: {
    lbl:'Gimnasio completo', ico:'🏢',
    sub:'Máquinas, poleas, peso libre y cardio',
    items:['ninguno','esterilla','banda','mancuernas','kettlebell','barra','barra_ez','banco','rack','smith','polea','maquina','barra_fija','paralelas','cajon','balon_med','comba','rueda_ab','trx','cinta','bici','eliptica','remo_erg','skierg']
  },
  parque: {
    lbl:'Parque / calistenia', ico:'🌳',
    sub:'Barras, paralelas y espacio para correr',
    items:['ninguno','esterilla','banda','barra_fija','paralelas','cajon','comba','zapatillas','exterior']
  },
  hotel: {
    lbl:'Hotel / viaje', ico:'🧳',
    sub:'Poco espacio y material improvisado',
    items:['ninguno','esterilla','banda','cajon','comba','cinta','mancuernas']
  }
};

/* ¿tengo TODO el material que pide este ejercicio? */
function gearCanDo(id, owned){
  const need = gearItemsOf(id);
  if(need.length === 1 && need[0] === 'ninguno') return true;
  return need.every(k=> k === 'ninguno' || (owned||[]).includes(k));
}
/* Qué me falta para poder hacerlo */
function gearMissingFor(id, owned){
  return gearItemsOf(id).filter(k=> k !== 'ninguno' && !(owned||[]).includes(k));
}
/* Ítems del lugar elegido */
function gearItemsOfPlace(place){ return ((GEAR_PLACES[place]||{}).items || []).slice(); }
/* Qué lugar encaja mejor con una lista de ítems (para preseleccionar) */
function gearGuessPlace(owned){
  let best = null, bestScore = -1;
  Object.keys(GEAR_PLACES).forEach(p=>{
    const it = GEAR_PLACES[p].items;
    const inter = it.filter(k=> (owned||[]).includes(k)).length;
    const score = inter - Math.abs(it.length - (owned||[]).length) * 0.5;
    if(score > bestScore){ bestScore = score; best = p; }
  });
  return best || 'gimnasio';
}
/* Cuántos ejercicios del catálogo se pueden hacer con este material */
function gearCoverage(owned){
  const ids = Object.keys(typeof EXERCISES!=='undefined' ? EXERCISES : {});
  const n = ids.filter(id=> gearCanDo(id, owned)).length;
  return {n, total: ids.length, pct: ids.length ? Math.round(n/ids.length*100) : 0};
}

window.GEAR_ITEMS = GEAR_ITEMS;
window.GEAR_PLACES = GEAR_PLACES;
window.gearItemsOf = gearItemsOf;
window.gearLabelOf = gearLabelOf;
window.gearCanDo = gearCanDo;
window.gearMissingFor = gearMissingFor;
window.gearItemsOfPlace = gearItemsOfPlace;
window.gearGuessPlace = gearGuessPlace;
window.gearCoverage = gearCoverage;
