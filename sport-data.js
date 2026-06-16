/* ══════════════════════════════════════════════════════════
   SPORT DATA · módulo de actividad física (independiente)
   ─────────────────────────────────────────────────────────
   Espeja la arquitectura de nutrición:
     · EXERCISES  ≈ alimentos (ejercicios simples, músculos, MET…)
     · SESSIONS   ≈ recetas  (sesiones = lista de ejercicios)
     · SportPlan  ≈ calendario (POR FECHAS REALES, hasta 1 año)
   Catálogo y patrones de movimiento basados en deep-research-report.md
   (ACSM/NSCA/World Athletics). Datos base inline para funcionar
   también en el HTML standalone/offline.
   depende de lsGet/lsSet y del perfil (peso) de menu-app.js
══════════════════════════════════════════════════════════ */

/* Grupos musculares (etiqueta + color de chip) */
const EX_MUSCLES = {
  pecho:     {lbl:'Pecho',      c:'#C0563B'},
  espalda:   {lbl:'Espalda',    c:'#2F6F4F'},
  hombro:    {lbl:'Hombro',     c:'#C8932B'},
  biceps:    {lbl:'Bíceps',     c:'#9C5BA8'},
  triceps:   {lbl:'Tríceps',    c:'#7A5BA8'},
  antebrazo: {lbl:'Antebrazo',  c:'#8A6BA8'},
  core:      {lbl:'Core',       c:'#C77D3A'},
  cuadriceps:{lbl:'Cuádriceps', c:'#3A6E96'},
  isquios:   {lbl:'Isquios',    c:'#3A8E96'},
  gluteo:    {lbl:'Glúteo',     c:'#B0506E'},
  gemelo:    {lbl:'Gemelo',     c:'#5C8030'},
  fullbody:  {lbl:'Full body',  c:'#6B5BD0'},
  cardio:    {lbl:'Cardio',     c:'#A52A1F'},
  movilidad: {lbl:'Movilidad',  c:'#8A8030'}
};

/* Tipos de ejercicio / sesión */
const EX_TYPES = {
  fuerza:    {lbl:'Fuerza',    ico:'🏋️'},
  cardio:    {lbl:'Cardio',    ico:'🏃'},
  hiit:      {lbl:'HIIT',      ico:'🔥'},
  core:      {lbl:'Core',      ico:'🧱'},
  movilidad: {lbl:'Movilidad', ico:'🧘'}
};

/* Patrones de movimiento (marco del informe: ordenar por patrón, no por músculo) */
const EX_PATTERNS = {
  sentadilla:       {lbl:'Sentadilla',          c:'#3A6E96'},
  bisagra:          {lbl:'Bisagra de cadera',   c:'#2F6F4F'},
  empuje_h:         {lbl:'Empuje horizontal',   c:'#C0563B'},
  empuje_v:         {lbl:'Empuje vertical',     c:'#C8932B'},
  traccion_h:       {lbl:'Tracción horizontal', c:'#3A8E96'},
  traccion_v:       {lbl:'Tracción vertical',   c:'#9C5BA8'},
  unilateral:       {lbl:'Unilateral',          c:'#B0506E'},
  core:             {lbl:'Core / anti-mov.',    c:'#C77D3A'},
  acarreo:          {lbl:'Acarreo',             c:'#7A5BA8'},
  accesorio:        {lbl:'Accesorio',           c:'#8A8030'},
  carrera:          {lbl:'Carrera',             c:'#A52A1F'},
  ergometro:        {lbl:'Ergómetro',           c:'#5C8030'},
  pliometria:       {lbl:'Pliometría',          c:'#6B5BD0'},
  condicionamiento: {lbl:'Acondicionamiento',   c:'#C8742E'},
  movilidad:        {lbl:'Movilidad',           c:'#8A8030'}
};

/* Disciplinas / contextos deportivos (para filtrar y generar) */
const EX_SPORTS = {
  gimnasio:  {lbl:'Gimnasio',    ico:'🏋️'},
  casa:      {lbl:'En casa',     ico:'🏠'},
  funcional: {lbl:'Funcional',   ico:'🤸'},
  carrera:   {lbl:'Carrera/marcha', ico:'🏃'},
  ciclismo:  {lbl:'Ciclismo',    ico:'🚴'},
  natacion:  {lbl:'Natación',    ico:'🏊'},
  remo:      {lbl:'Remo/palas',  ico:'🚣'},
  movilidad: {lbl:'Yoga/movilidad', ico:'🧘'},
  raqueta:   {lbl:'Raqueta',     ico:'🎾'},
  equipo:    {lbl:'Deporte de equipo', ico:'⚽'},
  combate:   {lbl:'Combate',     ico:'🥊'},
  aventura:  {lbl:'Aventura/aire libre', ico:'🧗'},
  baile:     {lbl:'Baile',       ico:'💃'},
  otros:     {lbl:'Otros',       ico:'🎯'}
};
/* Clasifica un ejercicio en una disciplina (usa ex.disc si está, si no lo infiere) */
function exDisc(ex){
  if(!ex) return 'otros';
  if(ex.disc && EX_SPORTS[ex.disc]) return ex.disc;
  const n = (ex.name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const eq = (ex.equip||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const has = (s,...w)=> w.some(x=> s.includes(x));
  // por nombre (disciplinas concretas primero)
  if(has(n,'natacion','crol','braza','mariposa','aquagym','piscina')) return 'natacion';
  if(has(n,'tenis','padel','badminton','raqueta','squash')) return 'raqueta';
  if(has(n,'futbol','baloncesto','voleibol','volei','hockey','rugby','beisbol','balonmano')) return 'equipo';
  if(has(n,'boxeo','kickboxing','artes marciales','muay','karate','judo','combat')) return 'combate';
  if(has(n,'escalada','rocodromo','surf','snowboard','esqui','ski','patinaje','kayak','piragu','remada')) return has(n,'kayak','piragu','remada')?'remo':'aventura';
  if(has(n,'yoga','pilates','animal flow','beast','movilidad','estiramiento','estira','rotacion','cat-cow','cat cow','cobra','kata','tai chi','foam')) return 'movilidad';
  if(has(n,'zumba','baile','danza')) return 'baile';
  if(has(n,'golf')) return 'otros';
  if(has(n,'bici','bicicleta','ciclismo','spinning','eliptica')) return 'ciclismo';
  if(has(n,'remoergometro','remo ergometro','skierg','ski erg','remo continuo','remo en')) return 'remo';
  if(has(n,'caminar','correr','carrera','sprint','fartlek','trote','cuesta','escalera','senderismo','marcha','footing','comba','saltar a la comba')) return has(n,'comba')?'funcional':'carrera';
  if(has(n,'kettlebell','battle','cuerdas de batalla','trineo','sled','wall ball','slam','bear crawl','burpee','box jump','salto al cajon','thruster','mountain climber','jumping jack')) return 'funcional';
  // por equipo
  if(has(eq,'piscina')) return 'natacion';
  if(has(eq,'bicicleta','eliptica')) return 'ciclismo';
  if(has(eq,'remoergometro','skierg')) return 'remo';
  if(has(eq,'barra','mancuern','maquina','polea','cable','rack','banco','multipower','disco','peck','contractora')) return 'gimnasio';
  if(has(eq,'esterilla','suelo')) return 'movilidad';
  if(has(eq,'banda','peso corporal') || eq==='') {
    if(ex.type==='movilidad') return 'movilidad';
    if(ex.type==='core') return 'casa';
    if(ex.type==='hiit') return 'funcional';
    return 'casa';
  }
  if(has(eq,'zapatillas','pista','cinta','cuesta','botas','bastones')) return 'carrera';
  // por tipo
  if(ex.type==='movilidad') return 'movilidad';
  if(ex.type==='cardio') return 'carrera';
  if(ex.type==='hiit') return 'funcional';
  if(ex.type==='core') return 'casa';
  return 'gimnasio';
}

/* Dosis orientativa por objetivo (tabla de prescripción del informe · ACSM) */
const OBJECTIVE_GUIDE = [
  {lbl:'Fuerza',              dose:'3–6 series · 1–6 reps en básicos · descanso 2–5 min · cargas altas'},
  {lbl:'Hipertrofia',        dose:'2–6 series · 6–15 reps · descanso 60–120 s · esfuerzo alto'},
  {lbl:'Resistencia muscular', dose:'2–4 series · 12–20+ reps · descanso 30–60 s'},
  {lbl:'Pérdida de grasa',   dose:'circuitos/superseries 2–4 · 6–15 reps · prioriza el volumen semanal y la adherencia'},
  {lbl:'Fitness general',    dose:'2–4 series · 6–15 reps en 5–8 patrones/semana · RPE 6–8'},
  {lbl:'Cardio (salud)',     dose:'150–300 min moderados o 75–150 vigorosos/semana + fuerza 2+ días'}
];

/* Días de la semana (Lun→Dom) */
const SP_DAYS = [
  {k:0, s:'L', long:'Lunes'},
  {k:1, s:'M', long:'Martes'},
  {k:2, s:'X', long:'Miércoles'},
  {k:3, s:'J', long:'Jueves'},
  {k:4, s:'V', long:'Viernes'},
  {k:5, s:'S', long:'Sábado'},
  {k:6, s:'D', long:'Domingo'}
];
const SP_MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ── EJERCICIOS (≈ alimentos) ──────────────────────────────
   Campos: name · type · pat(patrón) · muscles[] · met (gasto) ·
   equip · mode 'reps'|'time' · sets·reps·rest(s) | dur(s) · cues
══════════════════════════════════════════════════════════ */
const EXERCISES_BASE = {
  /* Sentadilla */
  sentadilla_trasera:{name:'Sentadilla trasera', type:'fuerza', pat:'sentadilla', muscles:['cuadriceps','gluteo','core'], met:6, equip:'Barra + rack', mode:'reps', sets:4, reps:6, rest:150, cues:'Brace fuerte, pies firmes, rodillas siguen la línea del pie, baja controlado y sube empujando el suelo.', visual:{template:'sentadilla', equipment:['barbell'], camera:'side', highlight:['cuadriceps','gluteo','core']}},
  sentadilla_frontal:{name:'Sentadilla frontal', type:'fuerza', pat:'sentadilla', muscles:['cuadriceps','gluteo','core'], met:6, equip:'Barra o mancuernas', mode:'reps', sets:4, reps:8, rest:120, cues:'Codos altos, torso vertical, abdomen firme y profundidad sin perder la espalda neutra.', visual:{template:'sentadilla_frontal', equipment:['barbell'], camera:'side', highlight:['cuadriceps','gluteo','core']}},
  sentadilla_goblet:{name:'Sentadilla goblet', type:'fuerza', pat:'sentadilla', muscles:['cuadriceps','gluteo','core'], met:5, equip:'Mancuerna o kettlebell', mode:'reps', sets:3, reps:12, rest:75, cues:'Carga pegada al pecho, codos hacia abajo, baja entre las piernas y mantén talones apoyados.'},
  /* Bisagra de cadera */
  peso_muerto_convencional:{name:'Peso muerto convencional', type:'fuerza', pat:'bisagra', muscles:['gluteo','isquios','espalda','core'], met:6, equip:'Barra + discos', mode:'reps', sets:4, reps:5, rest:180, cues:'Barra pegada al cuerpo, bisagra de cadera, espalda neutra, empuja el suelo y bloquea con glúteos.', visual:{template:'peso_muerto', equipment:['barbell'], camera:'side', highlight:['gluteo','isquios','espalda','core']}},
  peso_muerto_rumano:{name:'Peso muerto rumano', type:'fuerza', pat:'bisagra', muscles:['isquios','gluteo','espalda','core'], met:5.5, equip:'Barra o mancuernas', mode:'reps', sets:4, reps:8, rest:120, cues:'Rodillas semibloqueadas, cadera atrás, barra cerca de los muslos y tensión en isquios sin redondear la espalda.', visual:{template:'bisagra', equipment:['barbell'], camera:'side', highlight:['isquios','gluteo','espalda','core']}},
  hip_thrust:{name:'Hip thrust', type:'fuerza', pat:'bisagra', muscles:['gluteo','isquios','core'], met:5, equip:'Barra + banco', mode:'reps', sets:4, reps:10, rest:90, cues:'Barbilla ligeramente metida, pelvis neutra, empuja con talones y aprieta glúteo arriba sin hiperextender lumbar.'},
  kettlebell_swing:{name:'Kettlebell swing', type:'hiit', pat:'bisagra', muscles:['gluteo','isquios','espalda','core','cardio'], met:8, equip:'Kettlebell', mode:'reps', sets:5, reps:15, rest:60, cues:'Bisagra explosiva, no sentadilla, la cadera impulsa la kettlebell y los brazos solo guían.'},
  /* Unilateral */
  zancadas:{name:'Zancadas', type:'fuerza', pat:'unilateral', muscles:['cuadriceps','gluteo','isquios','core'], met:5.5, equip:'Peso corporal o mancuernas', mode:'reps', sets:3, reps:10, rest:75, cues:'Paso estable, rodilla alineada con el pie, tronco controlado y empuje fuerte con la pierna delantera.'},
  bulgara:{name:'Sentadilla búlgara', type:'fuerza', pat:'unilateral', muscles:['cuadriceps','gluteo','core'], met:6, equip:'Banco + mancuernas opcionales', mode:'reps', sets:3, reps:8, rest:90, cues:'Pie trasero elevado, baja vertical, rodilla estable y controla el equilibrio en cada repetición.'},
  step_up:{name:'Step-up', type:'fuerza', pat:'unilateral', muscles:['cuadriceps','gluteo','gemelo','core'], met:5, equip:'Cajón o banco', mode:'reps', sets:3, reps:10, rest:60, cues:'Sube empujando con la pierna de apoyo, evita impulsarte con la pierna trasera y controla la bajada.'},
  /* Empuje horizontal */
  press_banca_barra:{name:'Press banca con barra', type:'fuerza', pat:'empuje_h', muscles:['pecho','hombro','triceps'], met:5.5, equip:'Banco + barra', mode:'reps', sets:4, reps:6, rest:150, cues:'Escápulas firmes, pies apoyados, baja controlado al pecho y empuja sin perder la trayectoria.', visual:{template:'press_horizontal', equipment:['bench','barbell'], camera:'front_45', highlight:['pecho','triceps','hombro']}},
  press_mancuernas:{name:'Press de pecho con mancuernas', type:'fuerza', pat:'empuje_h', muscles:['pecho','hombro','triceps'], met:5, equip:'Banco + mancuernas', mode:'reps', sets:3, reps:10, rest:90, cues:'Muñecas neutras, controla la bajada, abre sin forzar hombro y empuja juntando ligeramente las mancuernas.', visual:{template:'press_horizontal', equipment:['bench','dumbbells'], camera:'front_45', highlight:['pecho','triceps','hombro']}},
  flexiones:{name:'Flexiones', type:'fuerza', pat:'empuje_h', muscles:['pecho','hombro','triceps','core'], met:8, equip:'Peso corporal', mode:'reps', sets:4, reps:12, rest:60, cues:'Cuerpo en bloque, manos bajo hombros, baja controlado y empuja el suelo manteniendo abdomen activo.'},
  /* Empuje vertical */
  press_militar:{name:'Press militar', type:'fuerza', pat:'empuje_v', muscles:['hombro','triceps','core'], met:5.5, equip:'Barra o mancuernas', mode:'reps', sets:4, reps:8, rest:120, cues:'Glúteos y abdomen activos, costillas abajo, empuja vertical y evita arquear la zona lumbar.', visual:{template:'press_vertical', equipment:['barbell'], camera:'front', highlight:['hombro','triceps','core']}},
  fondos_triceps:{name:'Fondos de tríceps', type:'fuerza', pat:'empuje_v', muscles:['triceps','pecho','hombro'], met:6, equip:'Paralelas o banco', mode:'reps', sets:3, reps:10, rest:75, cues:'Hombros estables, codos hacia atrás, baja hasta rango cómodo y empuja sin encoger hombros.'},
  /* Tracción horizontal */
  remo_barra:{name:'Remo con barra', type:'fuerza', pat:'traccion_h', muscles:['espalda','biceps','core'], met:5.5, equip:'Barra', mode:'reps', sets:4, reps:8, rest:100, cues:'Bisagra sólida, cuello neutro, tira hacia costillas y evita convertirlo en tirón lumbar.', visual:{template:'remo', equipment:['barbell'], camera:'side', highlight:['espalda','biceps','core']}},
  remo_mancuerna:{name:'Remo con mancuerna', type:'fuerza', pat:'traccion_h', muscles:['espalda','biceps'], met:5, equip:'Mancuerna + banco', mode:'reps', sets:3, reps:10, rest:75, cues:'Espalda estable, hombro lejos de la oreja, tira con el codo hacia la cadera y baja controlado.', visual:{template:'remo', equipment:['dumbbells'], camera:'side', highlight:['espalda','biceps']}},
  reverse_fly:{name:'Reverse fly', type:'fuerza', pat:'traccion_h', muscles:['hombro','espalda'], met:4, equip:'Mancuernas o banda', mode:'reps', sets:3, reps:15, rest:45, cues:'Carga ligera, abre en plano escapular, no encogas hombros y controla el retorno.'},
  /* Tracción vertical */
  dominadas:{name:'Dominadas', type:'fuerza', pat:'traccion_v', muscles:['espalda','biceps','core'], met:8, equip:'Barra de dominadas', mode:'reps', sets:4, reps:6, rest:120, cues:'Cuerpo firme, inicia con escápulas, sube sin balanceo y baja con control hasta extensión completa.'},
  jalon_banda:{name:'Jalón con banda', type:'fuerza', pat:'traccion_v', muscles:['espalda','biceps'], met:4.5, equip:'Banda elástica', mode:'reps', sets:3, reps:15, rest:60, cues:'Ancla alto, tira llevando codos hacia abajo, pecho alto y hombros lejos de las orejas.'},
  /* Accesorios */
  gemelos_pie:{name:'Elevación de gemelos de pie', type:'fuerza', pat:'accesorio', muscles:['gemelo'], met:4, equip:'Escalón, mancuernas opcionales', mode:'reps', sets:4, reps:15, rest:45, cues:'Sube completo, pausa arriba, baja lento y evita que el tobillo colapse hacia dentro.'},
  curl_biceps:{name:'Curl de bíceps', type:'fuerza', pat:'accesorio', muscles:['biceps'], met:4, equip:'Mancuernas, barra o banda', mode:'reps', sets:3, reps:12, rest:60, cues:'Codos cerca del cuerpo, sin balancear el torso, sube controlado y baja lento.', visual:{template:'curl', equipment:['dumbbells'], camera:'front', highlight:['biceps','antebrazo']}},
  /* Core */
  plancha:{name:'Plancha frontal', type:'core', pat:'core', muscles:['core','hombro','gluteo'], met:3.5, equip:'Peso corporal', mode:'time', sets:3, reps:0, dur:45, rest:45, cues:'Codos bajo hombros, pelvis neutra, glúteos activos y respiración controlada.'},
  plancha_lateral:{name:'Plancha lateral', type:'core', pat:'core', muscles:['core','gluteo'], met:3.5, equip:'Peso corporal', mode:'time', sets:3, reps:0, dur:30, rest:30, cues:'Línea recta de cabeza a pies, cadera alta, hombro estable y evita rotar el tronco.'},
  dead_bug:{name:'Dead bug', type:'core', pat:'core', muscles:['core'], met:3, equip:'Peso corporal', mode:'reps', sets:3, reps:10, rest:30, cues:'Zona lumbar estable, mueve brazo y pierna contraria lento y no pierdas la respiración.'},
  pallof_press:{name:'Pallof press', type:'core', pat:'core', muscles:['core','hombro'], met:3.5, equip:'Banda o cable', mode:'reps', sets:3, reps:12, rest:40, cues:'Resiste la rotación, pelvis neutra, presiona al frente y vuelve sin que el tronco gire.'},
  bird_dog:{name:'Bird-dog', type:'core', pat:'core', muscles:['core','gluteo','espalda'], met:3, equip:'Peso corporal', mode:'reps', sets:3, reps:10, rest:30, cues:'Extiende brazo y pierna contraria, pelvis estable, pausa un segundo y vuelve controlado.'},
  /* Acarreo */
  farmer_carry:{name:'Farmer carry', type:'fuerza', pat:'acarreo', muscles:['core','espalda','hombro','fullbody'], met:6, equip:'Mancuernas o kettlebells', mode:'time', sets:4, reps:0, dur:40, rest:60, cues:'Camina alto, costillas abajo, agarre fuerte, pasos cortos y evita inclinarte lateralmente.'},
  /* Carrera */
  carrera_suave:{name:'Carrera suave', type:'cardio', pat:'carrera', muscles:['cardio','cuadriceps','isquios','gluteo','gemelo'], met:9, equip:'Zapatillas', mode:'time', sets:1, reps:0, dur:2400, rest:0, cues:'Ritmo conversacional, postura alta, hombros relajados y apoyo cómodo bajo el centro de masas.'},
  series_carrera:{name:'Series de carrera', type:'hiit', pat:'carrera', muscles:['cardio','cuadriceps','isquios','gluteo','gemelo','core'], met:10, equip:'Zapatillas, pista o cinta', mode:'time', sets:8, reps:0, dur:60, rest:90, cues:'Corre fuerte pero controlado, mantén técnica en todas las repeticiones y recupera suave.'},
  tempo_carrera:{name:'Carrera tempo / umbral', type:'cardio', pat:'carrera', muscles:['cardio','cuadriceps','isquios','gluteo','gemelo'], met:9.5, equip:'Zapatillas', mode:'time', sets:1, reps:0, dur:1800, rest:0, cues:'Esfuerzo cómodamente duro, ritmo estable, sin sprintar al inicio y respiración intensa pero controlada.'},
  cuestas:{name:'Cuestas cortas', type:'hiit', pat:'carrera', muscles:['cardio','gluteo','isquios','gemelo','cuadriceps'], met:10, equip:'Cuesta moderada', mode:'time', sets:8, reps:0, dur:20, rest:90, cues:'Zancada corta, postura alta, apoyo reactivo y recuperación completa bajando caminando.'},
  /* Ergómetro */
  bici_estatica:{name:'Bici estática moderada', type:'cardio', pat:'ergometro', muscles:['cardio','cuadriceps','gluteo','gemelo'], met:7, equip:'Bicicleta estática', mode:'time', sets:1, reps:0, dur:2700, rest:0, cues:'Cadencia fluida, tronco estable, resistencia moderada y respiración controlada.'},
  remoergometro_intervalos:{name:'Intervalos en remoergómetro', type:'hiit', pat:'ergometro', muscles:['cardio','cuadriceps','gluteo','espalda','core','biceps'], met:9, equip:'Remoergómetro', mode:'time', sets:6, reps:0, dur:90, rest:90, cues:'Secuencia piernas-tronco-brazos, espalda firme, retorno controlado y potencia desde las piernas.'},
  /* Pliometría */
  box_jump:{name:'Salto al cajón', type:'hiit', pat:'pliometria', muscles:['cuadriceps','gluteo','gemelo','core'], met:8, equip:'Cajón', mode:'reps', sets:5, reps:5, rest:90, cues:'Salta con potencia, aterriza silencioso, caja segura y baja caminando para proteger articulaciones.'},
  /* Acondicionamiento */
  burpees:{name:'Burpees', type:'hiit', pat:'condicionamiento', muscles:['fullbody','cardio','pecho','cuadriceps','gluteo','core'], met:10, equip:'Peso corporal', mode:'time', sets:6, reps:0, dur:30, rest:45, cues:'Mantén ritmo sostenible, cae con control, abdomen activo y evita perder técnica por fatiga.'},
  jumping_jacks:{name:'Jumping jacks', type:'cardio', pat:'condicionamiento', muscles:['cardio','gemelo','hombro','gluteo'], met:8, equip:'Peso corporal', mode:'time', sets:4, reps:0, dur:45, rest:20, cues:'Aterriza suave, brazos coordinados, abdomen activo y mantén ritmo constante.'},
  mountain_climbers:{name:'Mountain climbers', type:'hiit', pat:'condicionamiento', muscles:['core','cardio','hombro','cuadriceps'], met:8, equip:'Peso corporal', mode:'time', sets:4, reps:0, dur:30, rest:20, cues:'Cadera baja, manos bajo hombros, lleva rodillas al pecho rápido sin hundir la zona lumbar.'},
  battle_ropes:{name:'Battle ropes', type:'hiit', pat:'condicionamiento', muscles:['hombro','biceps','triceps','core','cardio'], met:9, equip:'Cuerdas de batalla', mode:'time', sets:8, reps:0, dur:20, rest:40, cues:'Posición atlética, abdomen firme, genera olas regulares y no bloquees la respiración.'},
  /* Movilidad */
  movilidad_tobillo:{name:'Movilidad de tobillo', type:'movilidad', pat:'movilidad', muscles:['movilidad','gemelo'], met:2.5, equip:'Banda opcional', mode:'time', sets:2, reps:0, dur:45, rest:15, cues:'Rodilla avanza sobre el pie sin levantar talón, movimiento lento y sin dolor.'},
  estiramiento_flexor_cadera:{name:'Estiramiento de flexor de cadera', type:'movilidad', pat:'movilidad', muscles:['movilidad','cuadriceps','gluteo'], met:2.5, equip:'Peso corporal', mode:'time', sets:2, reps:0, dur:40, rest:15, cues:'Media rodilla, retroversión pélvica suave, glúteo activo y evita arquear la espalda.'},
  rotacion_toracica:{name:'Rotación torácica', type:'movilidad', pat:'movilidad', muscles:['movilidad','espalda','core'], met:2.5, equip:'Peso corporal', mode:'reps', sets:2, reps:8, rest:15, cues:'Pelvis estable, gira desde la caja torácica y acompaña con respiración.'},
  cat_cow:{name:'Cat-cow', type:'movilidad', pat:'movilidad', muscles:['movilidad','espalda','core'], met:2.5, equip:'Peso corporal', mode:'reps', sets:2, reps:10, rest:15, cues:'Mueve la columna segmento a segmento, exhala al redondear e inhala al extender suave.'}
};

/* ── SESIONES (≈ recetas) ──────────────────────────────────
   items: {e:'exerciseId', sets, reps|dur, rest}  (override del ejercicio)
══════════════════════════════════════════════════════════ */
const SESSIONS_BASE = {
  fullbody_principiante_a:{name:'Full-body principiante A', type:'fuerza', level:'Principiante', focus:'Base general: piernas, empuje, tracción y core',
    warmup:'5-8 min de movilidad general + sentadillas sin peso + activación de core.', notes:'Mantén 2-3 repeticiones en reserva. Prioriza técnica antes que carga.',
    items:[{e:'sentadilla_goblet',sets:3,reps:10,rest:75},{e:'peso_muerto_rumano',sets:3,reps:8,rest:90},{e:'flexiones',sets:3,reps:8,rest:60},{e:'remo_mancuerna',sets:3,reps:10,rest:75},{e:'plancha',sets:3,dur:35,rest:35}]},
  fullbody_principiante_b:{name:'Full-body principiante B', type:'fuerza', level:'Principiante', focus:'Unilateral, glúteo, espalda y estabilidad',
    warmup:'5 min de bici suave + movilidad de tobillo y cadera.', notes:'Usa cargas fáciles y aumenta repeticiones antes de aumentar peso.',
    items:[{e:'zancadas',sets:3,reps:8,rest:75},{e:'hip_thrust',sets:3,reps:12,rest:75},{e:'press_mancuernas',sets:3,reps:10,rest:75},{e:'jalon_banda',sets:3,reps:15,rest:60},{e:'dead_bug',sets:3,reps:10,rest:30}]},
  tren_inferior_fuerza:{name:'Tren inferior fuerza', type:'fuerza', level:'Intermedio', focus:'Sentadilla, bisagra, glúteo y core',
    warmup:'8-10 min: movilidad de tobillo, bisagras sin carga, sentadillas progresivas y activación de glúteo.', notes:'Descansa bien en los básicos. No sacrifiques profundidad ni espalda neutra por más carga.',
    items:[{e:'sentadilla_trasera',sets:5,reps:5,rest:180},{e:'peso_muerto_rumano',sets:4,reps:8,rest:120},{e:'bulgara',sets:3,reps:8,rest:90},{e:'hip_thrust',sets:3,reps:10,rest:90},{e:'pallof_press',sets:3,reps:12,rest:40}]},
  tren_superior_push:{name:'Tren superior empuje', type:'fuerza', level:'Intermedio', focus:'Pecho, hombro y tríceps',
    warmup:'5-8 min de movilidad torácica + activación escapular + series ligeras de press.', notes:'Combina empuje pesado con trabajo escapular para equilibrar el hombro.',
    items:[{e:'press_banca_barra',sets:5,reps:5,rest:150},{e:'press_militar',sets:4,reps:8,rest:120},{e:'press_mancuernas',sets:3,reps:10,rest:90},{e:'fondos_triceps',sets:3,reps:10,rest:75},{e:'reverse_fly',sets:3,reps:15,rest:45}]},
  tren_superior_pull:{name:'Tren superior tracción', type:'fuerza', level:'Intermedio', focus:'Espalda, bíceps, escápulas y agarre',
    warmup:'5 min de remo suave + movilidad torácica + activación escapular.', notes:'Evita tirar con cuello y hombros elevados. Busca control escapular.',
    items:[{e:'dominadas',sets:4,reps:6,rest:120},{e:'remo_barra',sets:4,reps:8,rest:100},{e:'remo_mancuerna',sets:3,reps:10,rest:75},{e:'curl_biceps',sets:3,reps:12,rest:60},{e:'farmer_carry',sets:4,dur:35,rest:60}]},
  posterior_gluteo_core:{name:'Cadena posterior, glúteo y core', type:'fuerza', level:'Intermedio', focus:'Peso muerto, glúteo, isquios y estabilidad lumbopélvica',
    warmup:'8 min de bisagras, movilidad de cadera y activación de glúteo.', notes:'Mantén la técnica limpia. En bisagras, corta la serie si la espalda pierde posición.',
    items:[{e:'peso_muerto_convencional',sets:4,reps:4,rest:180},{e:'hip_thrust',sets:4,reps:10,rest:90},{e:'step_up',sets:3,reps:10,rest:75},{e:'gemelos_pie',sets:4,reps:15,rest:45},{e:'bird_dog',sets:3,reps:10,rest:30},{e:'plancha_lateral',sets:3,dur:30,rest:30}]},
  running_base_suave:{name:'Running base suave', type:'cardio', level:'Todos', focus:'Base aeróbica y recuperación activa',
    warmup:'5 min caminando rápido + movilidad de tobillo y cadera.', notes:'Debe sentirse fácil. Puedes hablar en frases completas.',
    items:[{e:'movilidad_tobillo',sets:2,dur:35,rest:10},{e:'estiramiento_flexor_cadera',sets:2,dur:30,rest:10},{e:'carrera_suave',sets:1,dur:2400,rest:0},{e:'cat_cow',sets:2,reps:8,rest:15}]},
  running_series_400:{name:'Running series cortas', type:'hiit', level:'Intermedio', focus:'Velocidad aeróbica, técnica y tolerancia al ritmo',
    warmup:'10-15 min de trote suave + movilidad dinámica + 4 progresivos de 15 s.', notes:'No salgas demasiado rápido. Todas las repeticiones deben parecerse.',
    items:[{e:'movilidad_tobillo',sets:2,dur:35,rest:10},{e:'rotacion_toracica',sets:2,reps:8,rest:10},{e:'series_carrera',sets:8,dur:60,rest:90},{e:'carrera_suave',sets:1,dur:600,rest:0}]},
  running_tempo:{name:'Running tempo / umbral', type:'cardio', level:'Intermedio', focus:'Umbral, resistencia sostenida y control de ritmo',
    warmup:'10 min de trote fácil + 3 progresivos suaves.', notes:'Es duro pero controlado. No debe convertirse en una carrera máxima.',
    items:[{e:'carrera_suave',sets:1,dur:600,rest:0},{e:'tempo_carrera',sets:1,dur:1800,rest:0},{e:'carrera_suave',sets:1,dur:600,rest:0}]},
  hiit_fullbody_20min:{name:'HIIT full-body 20 min', type:'hiit', level:'Intermedio', focus:'Acondicionamiento global, core y potencia',
    warmup:'5 min de jumping jacks suaves, movilidad y 2 rondas fáciles del circuito.', notes:'Mantén técnica. Si se degrada, baja ritmo o alarga descanso.',
    items:[{e:'jumping_jacks',sets:3,dur:40,rest:20},{e:'kettlebell_swing',sets:5,reps:15,rest:45},{e:'flexiones',sets:4,reps:10,rest:45},{e:'mountain_climbers',sets:4,dur:30,rest:20},{e:'burpees',sets:5,dur:25,rest:45},{e:'plancha',sets:3,dur:40,rest:30}]},
  potencia_pierna:{name:'Potencia de pierna', type:'hiit', level:'Avanzado', focus:'Saltos, cuestas, glúteo y reactividad',
    warmup:'10 min de trote suave + movilidad de tobillo/cadera + 3 progresivos.', notes:'Calidad antes que fatiga. Descansa lo necesario para saltar y correr bien.',
    items:[{e:'movilidad_tobillo',sets:2,dur:40,rest:10},{e:'box_jump',sets:5,reps:4,rest:90},{e:'cuestas',sets:8,dur:20,rest:90},{e:'sentadilla_frontal',sets:4,reps:5,rest:150},{e:'plancha_lateral',sets:3,dur:30,rest:30}]},
  cardio_bici_remo:{name:'Cardio bici + remo', type:'cardio', level:'Todos', focus:'Cardio de bajo impacto y acondicionamiento',
    warmup:'5 min de bici suave + movilidad torácica.', notes:'Buena sesión para días sin impacto o como complemento de fuerza.',
    items:[{e:'bici_estatica',sets:1,dur:1800,rest:0},{e:'remoergometro_intervalos',sets:5,dur:90,rest:90},{e:'cat_cow',sets:2,reps:10,rest:15},{e:'estiramiento_flexor_cadera',sets:2,dur:40,rest:15}]},
  movilidad_recuperacion:{name:'Movilidad y recuperación', type:'movilidad', level:'Todos', focus:'Tobillo, cadera, columna torácica y descarga general',
    warmup:'Respiración nasal suave durante 2 min.', notes:'No fuerces rangos dolorosos. Busca sensación de tensión suave y control.',
    items:[{e:'cat_cow',sets:2,reps:10,rest:15},{e:'movilidad_tobillo',sets:3,dur:40,rest:15},{e:'estiramiento_flexor_cadera',sets:3,dur:40,rest:15},{e:'rotacion_toracica',sets:3,reps:8,rest:15},{e:'dead_bug',sets:2,reps:8,rest:20}]}
};

/* Catálogo importado (deportesvarios + SimplyFitness) → datos base */
if(typeof window !== 'undefined' && window.EXTRA_EXERCISES){
  Object.entries(window.EXTRA_EXERCISES).forEach(([id, ex])=>{ if(!EXERCISES_BASE[id]) EXERCISES_BASE[id] = ex; });
}

/* ── Mezcla base + datos de usuario (localStorage) ─────────── */
const EXERCISES = Object.assign({}, EXERCISES_BASE);
const SESSIONS  = Object.assign({}, SESSIONS_BASE);
const LS_SP_EX    = 'sport:ex:v1';
const LS_SP_SESS  = 'sport:sess:v1';
const LS_SP_CAL   = 'sport:plan:v2';     // nuevo modelo por fechas
const LS_SP_SAVED = 'sport:saved:v1';    // biblioteca de planes guardados

(function loadUserSport(){
  try{ const e = JSON.parse(localStorage.getItem(LS_SP_EX)||'{}');  Object.entries(e).forEach(([id,v])=>EXERCISES[id]=v); }catch(e){}
  try{ const s = JSON.parse(localStorage.getItem(LS_SP_SESS)||'{}'); Object.entries(s).forEach(([id,v])=>SESSIONS[id]=v); }catch(e){}
})();
function persistExercises(){
  const o={}; Object.keys(EXERCISES).forEach(id=>{ if(EXERCISES[id].user) o[id]=EXERCISES[id]; });
  try{ localStorage.setItem(LS_SP_EX, JSON.stringify(o)); }catch(e){}
}
function persistSessions(){
  const o={}; Object.keys(SESSIONS).forEach(id=>{ if(SESSIONS[id].user) o[id]=SESSIONS[id]; });
  try{ localStorage.setItem(LS_SP_SESS, JSON.stringify(o)); }catch(e){}
}
function nextSpId(base, store){
  let s=(base||'x').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,20)||'x';
  let id=s,n=2; while(store[id]) id=s+'_'+(n++); return id;
}

/* ── Helpers de fecha ──────────────────────────────────────── */
function spToday(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
function spKey(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
function spFromKey(k){ const p=(k||'').split('-').map(Number); return new Date(p[0], (p[1]||1)-1, p[2]||1); }
function spAddDays(d, n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function spWeekdayMon(d){ return (d.getDay()+6)%7; }   // Lun=0 … Dom=6
function spSameDay(a, b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function spFmtLong(d){ return `${d.getDate()} ${SP_MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

/* ── Estado del PLAN (calendario por fechas reales) ─────────
   days: { 'YYYY-MM-DD': [ {s:sessionId, who:'A'|'B'|'AB'} ] }
   cadence: configuración del último generador (para re-generar)
══════════════════════════════════════════════════════════ */
const SportPlan = {
  name: 'Mi entrenamiento',
  days: {},
  cadence: null
};
function loadSportPlan(){
  const saved = lsGet(LS_SP_CAL, null);
  if(saved && typeof saved === 'object'){
    SportPlan.name = saved.name || SportPlan.name;
    SportPlan.days = (saved.days && typeof saved.days==='object') ? saved.days : {};
    SportPlan.cadence = saved.cadence || null;
  }
  cleanSportPlan();
}
function cleanSportPlan(){
  Object.keys(SportPlan.days).forEach(k=>{
    const arr = (SportPlan.days[k]||[]).map(e=>{
      if(typeof e === 'string') e = {s:e, who:'AB'};       // compat
      if(!e || !SESSIONS[e.s]) return null;
      return {s:e.s, who:['A','B','AB'].includes(e.who)?e.who:'AB'};
    }).filter(Boolean);
    if(arr.length) SportPlan.days[k] = arr; else delete SportPlan.days[k];
  });
}
function persistSportPlan(){ lsSet(LS_SP_CAL, {name:SportPlan.name, days:SportPlan.days, cadence:SportPlan.cadence}); }
loadSportPlan();

/* ── Biblioteca de planes guardados ─────────────────────────── */
function getSavedPlans(){ return lsGet(LS_SP_SAVED, {}); }
function setSavedPlans(o){ lsSet(LS_SP_SAVED, o); }

/* ── Favoritos de ejercicios ────────────────────────────────── */
const LS_SP_FAV = 'sport:favs:v1';
function getFavs(){ const f = lsGet(LS_SP_FAV, []); return Array.isArray(f)?f:[]; }
function isFav(id){ return getFavs().includes(id); }
function toggleFav(id){ const f=getFavs(); const i=f.indexOf(id); if(i>=0) f.splice(i,1); else f.push(id); lsSet(LS_SP_FAV, f); return i<0; }

window.EX_MUSCLES = EX_MUSCLES;
window.EX_TYPES = EX_TYPES;
window.EX_PATTERNS = EX_PATTERNS;
window.EX_SPORTS = EX_SPORTS;
window.exDisc = exDisc;
window.EXERCISES = EXERCISES;
window.SESSIONS = SESSIONS;
window.SportPlan = SportPlan;
