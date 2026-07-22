/* ══════════════════════════════════════════════════════════
   SPORT LOG · registro de entrenamientos ejecutados
   Es la pieza que convierte el plan en algo adaptativo: sin datos
   reales de series/kg/RPE no puede haber sobrecarga progresiva.

   Guarda una entrada por sesión ejecutada en `sport:log:v1`:
     {id, date:'2026-07-20', sessId, sessName, who, startTs, endTs,
      durSec, restSec, bodyweight, feel, notes,
      ex:[{e:'press_banca', sets:[{kg,reps,rpe,done}]}]}

   depende de sport-data.js (EXERCISES, EX_MUSCLES), lsGet/lsSet
══════════════════════════════════════════════════════════ */

var LS_SP_LOG     = 'sport:log:v1';
var LS_SP_TRAIN   = 'sport:train:v1';
var LS_SP_PROFILE = 'sport:profile:v1';

/* ── Perfil de entrenamiento (nivel, material, lesiones) ──── */
var SP_LEVELS = {
  novato:      {lbl:'Principiante', sets:[2,3], rpe:[6,7],  ex:'Menos de 1 año entrenando. Prioriza técnica y máquinas guiadas.', maxEx:6,  prog:1.0},
  intermedio:  {lbl:'Intermedio',   sets:[3,4], rpe:[7,8],  ex:'1-3 años. Peso libre con progresión semanal.',                   maxEx:7,  prog:0.7},
  avanzado:    {lbl:'Avanzado',     sets:[4,5], rpe:[8,9],  ex:'Más de 3 años. Periodización y progresión más lenta.',           maxEx:8,  prog:0.4}
};
/* Material disponible → qué palabras de `equip` habilita */
var SP_GEAR = {
  barra:     {lbl:'Barra y discos', ico:'🏋️', match:['barra','disco','rack','multipower','banco']},
  mancuernas:{lbl:'Mancuernas',     ico:'💪', match:['mancuern']},
  maquinas:  {lbl:'Máquinas y poleas',ico:'⚙️',match:['maquina','máquina','polea','cable','prensa','contractora','peck']},
  kettlebell:{lbl:'Kettlebell',     ico:'🔔', match:['kettlebell','pesa rusa']},
  bandas:    {lbl:'Bandas elásticas',ico:'🎗️',match:['banda','goma']},
  barrafija: {lbl:'Barra de dominadas',ico:'🤸',match:['barra fija','dominadas','paralelas']},
  cardio:    {lbl:'Máquinas de cardio',ico:'🚴',match:['cinta','bicicleta','eliptica','elíptica','remoergometro','skierg','remo']},
  ninguno:   {lbl:'Solo peso corporal',ico:'🧍', match:['peso corporal','esterilla','suelo','zapatillas','']}
};
/* Zonas lesionables → músculos que se evitan al marcarlas */
var SP_INJURIES = {
  hombro:  {lbl:'Hombro',          avoid:['hombro'],               avoidPat:['empuje_v']},
  codo:    {lbl:'Codo',            avoid:['triceps','biceps'],     avoidPat:[]},
  muneca:  {lbl:'Muñeca',          avoid:['antebrazo'],            avoidPat:['acarreo']},
  lumbar:  {lbl:'Espalda baja',    avoid:[],                       avoidPat:['bisagra','acarreo']},
  cadera:  {lbl:'Cadera',          avoid:['gluteo'],               avoidPat:['bisagra']},
  rodilla: {lbl:'Rodilla',         avoid:['cuadriceps'],           avoidPat:['sentadilla','pliometria','carrera']},
  tobillo: {lbl:'Tobillo',         avoid:['gemelo'],               avoidPat:['pliometria','carrera']}
};

function spProfile(){
  const d = lsGet(LS_SP_PROFILE, null);
  return Object.assign({level:'intermedio', gear:['barra','mancuernas','maquinas','barrafija'], injuries:[]}, d||{});
}
function spProfileSet(patch){
  const p = Object.assign(spProfile(), patch||{});
  lsSet(LS_SP_PROFILE, p);
  return p;
}

/* ── CRUD del historial ───────────────────────────────────── */
function logAll(){
  const a = lsGet(LS_SP_LOG, []);
  return Array.isArray(a) ? a : [];
}
function logSave(entry){
  const all = logAll();
  const i = all.findIndex(x=> x.id === entry.id);
  if(i >= 0) all[i] = entry; else all.push(entry);
  all.sort((a,b)=> (b.date||'').localeCompare(a.date||'') || (b.startTs||0)-(a.startTs||0));
  lsSet(LS_SP_LOG, all);
  return entry;
}
function logDelete(id){
  lsSet(LS_SP_LOG, logAll().filter(x=> x.id !== id));
}
function logGet(id){ return logAll().find(x=> x.id === id) || null; }
function logNewId(){ return 'lg_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

/* Entradas de una persona ('A'|'B'), más recientes primero */
function logFor(who){
  const all = logAll();
  return who ? all.filter(e=> !e.who || e.who === who || e.who === 'AB') : all;
}
/* Entradas dentro de un rango de fechas (claves 'YYYY-MM-DD', incl.) */
function logRange(from, to, who){
  return logFor(who).filter(e=> (!from || e.date >= from) && (!to || e.date <= to));
}

/* ── Métricas de una serie ────────────────────────────────── */
/* 1RM estimado (Epley). Por encima de 12 reps la fórmula se dispara,
   así que se tope a 12 para no inflar los récords con series largas. */
function est1RM(kg, reps){
  kg = +kg || 0; reps = Math.min(12, Math.max(1, +reps || 0));
  if(!kg) return 0;
  return Math.round(kg * (1 + reps/30) * 10) / 10;
}
/* Una serie cuenta como trabajo si está hecha y tiene reps (fuerza) o
   duración (tiempo: carrera, plancha, natación…). */
function setIsWork(s){ return s && s.done !== false && ((+s.reps > 0) || (+s.dur > 0)); }

/* ── Medidas: tiempo vs repeticiones, y distancia ─────────────
   Cada ejercicio registra lo que le corresponde: series×reps(+kg) en
   fuerza, o duración (y opcionalmente distancia) en lo que va por tiempo
   (senderismo, carrera, nado, remo…). Estas ayudas leen tanto el estado
   nuevo como entradas antiguas (compatibilidad). */
var SP_DIST_DISC = ['carrera','ciclismo','natacion','remo'];   // disciplinas con distancia
/* ¿este bloque de ejercicio va por TIEMPO? (por su `mode`, o por el del
   catálogo, o porque sus series traen duración) */
function logExIsTime(x){
  if(x && x.mode) return x.mode === 'time';
  const ex = EXERCISES[x && x.e];
  if(ex && ex.mode) return ex.mode === 'time';
  return !!(x && (x.sets||[]).some(s=> +s.dur > 0));
}
/* ¿tiene sentido pedir distancia para este ejercicio? */
function logExHasDist(exId){
  const ex = EXERCISES[exId]; if(!ex) return false;
  if(ex.mode !== 'time') return false;
  try{ return SP_DIST_DISC.includes(exDisc(ex)); }catch(e){ return false; }
}
/* Duración legible: "45 s", "12 min", "1 h 30 min" */
function logFmtDur(sec){
  sec = Math.max(0, Math.round(+sec||0));
  if(sec < 60) return sec + ' s';
  const m = Math.round(sec/60);
  if(m < 60) return m + ' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
/* Distancia legible: metros por debajo de 1 km, si no km con 1 decimal */
function logFmtDist(m){
  m = +m||0; if(!m) return '';
  return m >= 1000 ? (Math.round(m/100)/10) + ' km' : Math.round(m) + ' m';
}
/* Etiqueta de una serie registrada (fuerza o tiempo) para el historial */
function logSetLabel(x, s){
  if(logExIsTime(x)){
    const t = logFmtDur(+s.dur||0);
    const d = (+s.dist > 0) ? ' · ' + logFmtDist(s.dist) : '';
    return t + d;
  }
  return (s.kg ? s.kg + '×' : '') + (+s.reps||0);
}
/* Segundos ACTIVOS realmente registrados en una entrada (sin descansos):
   tiempo → duración anotada; fuerza → ~3 s por repetición. */
function logActiveSec(entry){
  let sec = 0;
  (entry && entry.ex || []).forEach(x=>{
    const time = logExIsTime(x);
    (x.sets||[]).forEach(s=>{
      if(!setIsWork(s)) return;
      sec += time ? (+s.dur||0) : (+s.reps||0) * 3;
    });
  });
  return sec;
}
/* Distancia total registrada en una entrada (metros) */
function logDistanceOf(entry){
  let m = 0;
  (entry && entry.ex || []).forEach(x=> (x.sets||[]).forEach(s=>{ if(setIsWork(s)) m += +s.dist||0; }));
  return m;
}
/* kcal de una entrada para un peso dado.
   kcal ≈ Σ MET_ejercicio · peso(kg) · horas_activas  +  descanso a ~1.3 MET.
   El tiempo activo sale de las DURACIONES/REPS reales registradas, y el
   descanso de la diferencia con la duración total de la sesión. Depende
   del peso corporal del usuario (perfil) → cada persona gasta distinto. */
function logEntryKcal(entry, weight){
  weight = +weight || +(entry && entry.bodyweight) || 70;
  let kcal = 0, active = 0;
  (entry && entry.ex || []).forEach(x=>{
    const ex = EXERCISES[x.e]; const met = (ex && ex.met) || 4;
    const time = logExIsTime(x);
    (x.sets||[]).forEach(s=>{
      if(!setIsWork(s)) return;
      const sec = time ? (+s.dur||0) : (+s.reps||0) * 3;
      active += sec;
      kcal += met * weight * (sec/3600);
    });
  });
  const rest = Math.max(0, (+(entry && entry.durSec)||0) - active);
  kcal += 1.3 * weight * (rest/3600);
  return Math.round(kcal);
}

/* Tonelaje (Σ kg × reps) de una entrada */
function logTonnage(entry){
  let t = 0;
  (entry.ex||[]).forEach(x=> (x.sets||[]).forEach(s=>{ if(setIsWork(s)) t += (+s.kg||0) * (+s.reps||0); }));
  return Math.round(t);
}
/* Series efectivas (las completadas) de una entrada */
function logSetCount(entry){
  let n = 0;
  (entry.ex||[]).forEach(x=> (x.sets||[]).forEach(s=>{ if(setIsWork(s)) n++; }));
  return n;
}

/* ── Consultas por ejercicio ──────────────────────────────── */
/* Última ejecución de un ejercicio → para prellenar el modo entrenamiento */
function logLastFor(exId, who){
  const all = logFor(who);
  for(const e of all){                              // ya vienen ordenadas desc
    const x = (e.ex||[]).find(x=> x.e === exId);
    if(x && (x.sets||[]).some(setIsWork)) return {entry:e, ex:x};
  }
  return null;
}
/* Mejor serie histórica de un ejercicio (por 1RM estimado) */
function logBestFor(exId, who){
  let best = null;
  logFor(who).forEach(e=>{
    (e.ex||[]).filter(x=> x.e === exId).forEach(x=>{
      (x.sets||[]).forEach(s=>{
        if(!setIsWork(s) || !(+s.kg > 0)) return;
        const rm = est1RM(s.kg, s.reps);
        if(!best || rm > best.rm) best = {rm, kg:+s.kg, reps:+s.reps, date:e.date};
      });
    });
  });
  return best;
}
/* Serie de puntos {date, rm, kg, reps} de un ejercicio, orden cronológico */
function logSeriesFor(exId, who){
  const pts = [];
  logFor(who).forEach(e=>{
    let bestRm = 0, bk = 0, br = 0;
    (e.ex||[]).filter(x=> x.e === exId).forEach(x=>{
      (x.sets||[]).forEach(s=>{
        if(!setIsWork(s) || !(+s.kg > 0)) return;
        const rm = est1RM(s.kg, s.reps);
        if(rm > bestRm){ bestRm = rm; bk = +s.kg; br = +s.reps; }
      });
    });
    if(bestRm > 0) pts.push({date:e.date, rm:bestRm, kg:bk, reps:br});
  });
  return pts.sort((a,b)=> a.date.localeCompare(b.date));
}
/* Ejercicios con al menos `min` registros con carga (para el selector de gráficas) */
function logTrackedExercises(who, min){
  min = min || 2;
  const count = {};
  logFor(who).forEach(e=> (e.ex||[]).forEach(x=>{
    if((x.sets||[]).some(s=> setIsWork(s) && +s.kg > 0)) count[x.e] = (count[x.e]||0) + 1;
  }));
  return Object.keys(count)
    .filter(id=> count[id] >= min && EXERCISES[id])
    .sort((a,b)=> count[b]-count[a]);
}

/* ── Volumen por grupo muscular ───────────────────────────── */
/* Series efectivas por músculo en un rango. El músculo primario (el
   primero de la lista) cuenta 1 serie; los secundarios cuentan 0,5,
   que es como se contabiliza el volumen indirecto en la literatura. */
function logVolumeByMuscle(from, to, who){
  const vol = {};
  logRange(from, to, who).forEach(e=>{
    (e.ex||[]).forEach(x=>{
      const ex = EXERCISES[x.e]; if(!ex) return;
      const n = (x.sets||[]).filter(setIsWork).length;
      if(!n) return;
      (ex.muscles||[]).forEach((m, i)=>{
        if(m === 'cardio' || m === 'fullbody' || m === 'movilidad') return;
        vol[m] = (vol[m]||0) + n * (i === 0 ? 1 : 0.5);
      });
    });
  });
  Object.keys(vol).forEach(m=> vol[m] = Math.round(vol[m]*10)/10);
  return vol;
}
/* Rangos de referencia de series semanales por grupo (MacNaughton/Schoenfeld) */
var SP_VOL_TARGET = {min:10, max:20};

/* ── Récords personales ───────────────────────────────────── */
function logPRs(who){
  const prs = [];
  const ids = new Set();
  logFor(who).forEach(e=> (e.ex||[]).forEach(x=> ids.add(x.e)));
  ids.forEach(id=>{
    if(!EXERCISES[id]) return;
    const b = logBestFor(id, who);
    if(b) prs.push({e:id, name:EXERCISES[id].name, kg:b.kg, reps:b.reps, rm:b.rm, date:b.date});
  });
  return prs.sort((a,b)=> b.rm - a.rm);
}
/* ¿esta serie es un récord respecto al histórico previo? */
function logIsPR(exId, kg, reps, who){
  if(!(+kg > 0)) return false;
  const b = logBestFor(exId, who);
  return !b || est1RM(kg, reps) > b.rm;
}

/* ── Adherencia ───────────────────────────────────────────── */
/* Racha de semanas consecutivas (hacia atrás desde hoy) con ≥1 entreno */
function logStreak(who){
  const days = new Set(logFor(who).map(e=> e.date));
  if(!days.size) return 0;
  const monday = d=>{ const r = new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate() - ((r.getDay()+6)%7)); return r; };
  let cur = monday(new Date()), streak = 0;
  for(let guard = 0; guard < 260; guard++){       // tope 5 años
    let hit = false;
    for(let i = 0; i < 7; i++){
      if(days.has(spKey(spAddDays(cur, i)))){ hit = true; break; }
    }
    if(!hit){
      // la semana en curso aún puede completarse: no rompe la racha
      if(streak === 0 && spSameDay(cur, monday(new Date()))){ cur = spAddDays(cur, -7); continue; }
      break;
    }
    streak++;
    cur = spAddDays(cur, -7);
  }
  return streak;
}
/* Resumen de un periodo */
function logSummary(from, to, who){
  const rows = logRange(from, to, who);
  return {
    sessions: rows.length,
    sec:      rows.reduce((a,e)=> a + (+e.durSec||0), 0),
    tonnage:  rows.reduce((a,e)=> a + logTonnage(e), 0),
    sets:     rows.reduce((a,e)=> a + logSetCount(e), 0),
    dist:     rows.reduce((a,e)=> a + logDistanceOf(e), 0),
    // kcal guardado al registrar (con el peso de la persona); si falta
    // en una entrada antigua, se recalcula al vuelo.
    kcal:     rows.reduce((a,e)=> a + (+e.kcal || logEntryKcal(e)), 0)
  };
}
/* Última vez por TIEMPO de un ejercicio → prellena duración/distancia */
function logLastTimeFor(exId, who){
  for(const e of logFor(who)){
    const x = (e.ex||[]).find(x=> x.e === exId);
    if(x && logExIsTime(x)){
      const s = (x.sets||[]).filter(setIsWork).pop();
      if(s) return {dur:+s.dur||0, dist:+s.dist||0, date:e.date};
    }
  }
  return null;
}

/* ── Progresión de cargas ─────────────────────────────────────
   Regla de doble progresión: primero subes reps dentro del rango,
   y cuando completas el tope del rango con RPE cómodo, subes peso.
   Incremento: +2,5 kg en tren superior, +5 kg en tren inferior
   (los saltos mínimos realistas con discos de gimnasio).
══════════════════════════════════════════════════════════ */
var SP_LOWER_MUSCLES = ['cuadriceps','isquios','gluteo','gemelo'];

function spIsLowerBody(exId){
  const ex = EXERCISES[exId]; if(!ex) return false;
  const m = (ex.muscles||[])[0];
  return SP_LOWER_MUSCLES.includes(m) || ex.pat === 'sentadilla' || ex.pat === 'bisagra';
}
function spLoadStep(exId){ return spIsLowerBody(exId) ? 5 : 2.5; }
/* Redondea a un múltiplo cargable con discos (2,5 kg) */
function spRoundLoad(kg){ return Math.round((+kg||0) / 2.5) * 2.5; }

/* Sugerencia de carga para la próxima sesión de `exId`.
   Devuelve {kg, reps, why} o null si nunca se ha registrado. */
function logSuggestLoad(exId, who, targetReps){
  const last = logLastFor(exId, who);
  if(!last) return null;
  const sets = (last.ex.sets||[]).filter(setIsWork);
  if(!sets.length) return null;

  const ex   = EXERCISES[exId] || {};
  const goal = +targetReps || +ex.reps || 8;
  const kg   = Math.max(...sets.map(s=> +s.kg || 0));
  const step = spLoadStep(exId);
  // RPE máximo registrado (si no se anotó, se asume 8: ni fácil ni al fallo)
  const rpes = sets.map(s=> +s.rpe).filter(r=> r > 0);
  const rpe  = rpes.length ? Math.max(...rpes) : 8;
  const allDone = sets.every(s=> (+s.reps||0) >= goal);
  const minReps = Math.min(...sets.map(s=> +s.reps||0));

  if(!kg) return {kg:0, reps:goal, why:'Sin carga registrada · ajusta a sensación'};

  // 1) completó el rango con margen → sube peso
  if(allDone && rpe <= 8){
    return {kg: spRoundLoad(kg + step), reps: goal, why:`Completaste ${sets.length}×${goal} con RPE ${rpe} · +${step} kg`};
  }
  // 2) completó pero al límite → repite carga, consolida
  if(allDone){
    return {kg: spRoundLoad(kg), reps: goal, why:`Completado pero al límite (RPE ${rpe}) · repite carga`};
  }
  // 3) se quedó muy corto o RPE al fallo → baja un 10 %
  if(minReps < goal - 2 || rpe >= 9.5){
    return {kg: spRoundLoad(kg * 0.9), reps: goal, why:`Serie fallida (${minReps} reps, RPE ${rpe}) · −10 % para recuperar técnica`};
  }
  // 4) a medio camino → misma carga, a por las reps que faltan
  return {kg: spRoundLoad(kg), reps: goal, why:`Te faltaron reps · misma carga hasta cerrar ${goal}`};
}

/* Prellenado del modo entrenamiento: qué mostrar en la casilla de
   cada serie antes de que el usuario toque nada. */
function logPrefill(exId, who, targetReps){
  const sug = logSuggestLoad(exId, who, targetReps);
  if(sug) return {kg:sug.kg, reps:sug.reps, hint:sug.why};
  const ex = EXERCISES[exId] || {};
  return {kg:0, reps:+targetReps || +ex.reps || 10, hint:'Primera vez · anota lo que hagas'};
}

/* ── Exportación ──────────────────────────────────────────── */
function logToCSV(who){
  const rows = [['fecha','sesion','ejercicio','tipo','serie','kg','reps','segundos','distancia_m','rpe','1RM_est']];
  logFor(who).slice().reverse().forEach(e=>{
    (e.ex||[]).forEach(x=>{
      const nm = (EXERCISES[x.e]||{}).name || x.e;
      const time = logExIsTime(x);
      (x.sets||[]).forEach((s, i)=>{
        if(!setIsWork(s)) return;
        rows.push(time
          ? [e.date, e.sessName||'', nm, 'tiempo', i+1, '', '', s.dur||'', s.dist||'', s.rpe||'', '']
          : [e.date, e.sessName||'', nm, 'reps',   i+1, s.kg||'', s.reps||'', '', '', s.rpe||'', est1RM(s.kg, s.reps)||'']);
      });
    });
  });
  return rows.map(r=> r.map(c=> /[",;\n]/.test(String(c)) ? '"'+String(c).replace(/"/g,'""')+'"' : c).join(';')).join('\n');
}

window.logAll = logAll;
window.logSave = logSave;
window.logDelete = logDelete;
window.logGet = logGet;
window.logNewId = logNewId;
window.logFor = logFor;
window.logRange = logRange;
window.logLastFor = logLastFor;
window.logBestFor = logBestFor;
window.logSeriesFor = logSeriesFor;
window.logTrackedExercises = logTrackedExercises;
window.logVolumeByMuscle = logVolumeByMuscle;
window.logTonnage = logTonnage;
window.logSetCount = logSetCount;
window.logExIsTime = logExIsTime;
window.logExHasDist = logExHasDist;
window.logActiveSec = logActiveSec;
window.logDistanceOf = logDistanceOf;
window.logEntryKcal = logEntryKcal;
window.logFmtDur = logFmtDur;
window.logFmtDist = logFmtDist;
window.logSetLabel = logSetLabel;
window.logLastTimeFor = logLastTimeFor;
window.logPRs = logPRs;
window.logIsPR = logIsPR;
window.logStreak = logStreak;
window.logSummary = logSummary;
window.logSuggestLoad = logSuggestLoad;
window.logPrefill = logPrefill;
window.logToCSV = logToCSV;
window.est1RM = est1RM;
window.spProfile = spProfile;
window.spProfileSet = spProfileSet;
window.spIsLowerBody = spIsLowerBody;
window.spLoadStep = spLoadStep;
window.spRoundLoad = spRoundLoad;
