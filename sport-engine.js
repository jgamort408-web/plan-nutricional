/* ══════════════════════════════════════════════════════════
   SPORT ENGINE · duración, gasto calórico, músculos y agregados
   kcal ≈ MET · peso(kg) · horas (activo) + descanso a MET~1.3
   El peso corporal se lee del PERFIL de cada persona (calculadora
   de Ajustes › Personas) y, en su defecto, de la etiqueta o un
   valor por defecto razonable.
   depende de EXERCISES, SESSIONS, EX_MUSCLES (sport-data.js)
══════════════════════════════════════════════════════════ */

/* Peso corporal de una persona (kg) según su perfil */
function personWeight(p){
  // 1) Calculadora de perfil (Ajustes › Personas): dato más fiable
  try{
    if(typeof getCalcInputs === 'function'){
      const kg = (getCalcInputs()[p]||{}).kg;
      if(kg > 0) return +kg;
    }
  }catch(e){}
  // 2) Etiqueta "135kg" en el nombre
  const n = parseFloat(((TARGETS[p] && TARGETS[p].name) || '').toString().replace(',', '.'));
  if(n > 0) return n;
  // 3) Fallback
  return p === 'A' ? 80 : 65;
}

/* ¿el peso de la persona p es un dato real (no el valor por defecto)? */
function weightIsExplicit(p){
  try{ if(typeof getCalcInputs==='function'){ const kg=(getCalcInputs()[p]||{}).kg; if(kg>0) return true; } }catch(e){}
  const n = parseFloat((((typeof TARGETS!=='undefined' && TARGETS[p] && TARGETS[p].name)||'')).toString().replace(',','.'));
  return n>0;
}

function exOf(it){ return EXERCISES[it.e] || null; }

/* Segundos ACTIVOS de un item de sesión (sin descansos) */
function itemActiveSec(it){
  const ex = exOf(it); if(!ex) return 0;
  const sets = it.sets || ex.sets || 1;
  if((it.dur != null) || ex.mode === 'time'){
    const dur = it.dur != null ? it.dur : (ex.dur || 0);
    return sets * dur;
  }
  const reps = it.reps != null ? it.reps : (ex.reps || 0);
  return sets * reps * 3;          // ~3 s por repetición
}
/* Segundos de DESCANSO de un item */
function itemRestSec(it){
  const ex = exOf(it); if(!ex) return 0;
  const sets = it.sets || ex.sets || 1;
  const rest = it.rest != null ? it.rest : (ex.rest || 0);
  return Math.max(0, sets - 1) * rest;
}
function itemTotalSec(it){ return itemActiveSec(it) + itemRestSec(it); }

/* kcal de un item para un peso dado */
function itemKcal(it, weight){
  const ex = exOf(it); if(!ex) return 0;
  const act = itemActiveSec(it) / 3600;
  const rst = itemRestSec(it) / 3600;
  return (ex.met * weight * act) + (1.3 * weight * rst);
}

/* Totales de una sesión para una persona ('A'|'B') */
function sessionTotals(sess, p){
  const weight = personWeight(p);
  let sec = 0, kcal = 0;
  const muscles = new Set();
  (sess.items || []).forEach(it=>{
    const ex = exOf(it); if(!ex) return;
    sec += itemTotalSec(it);
    kcal += itemKcal(it, weight);
    (ex.muscles || []).forEach(m => muscles.add(m));
  });
  return {sec, min: Math.round(sec/60), kcal: Math.round(kcal), muscles:[...muscles]};
}

/* Resumen de músculos de una sesión (orden estable) */
function sessionMuscles(sess){
  const order = Object.keys(EX_MUSCLES);
  const set = new Set();
  (sess.items||[]).forEach(it=>{ const ex=exOf(it); if(ex) (ex.muscles||[]).forEach(m=>set.add(m)); });
  return [...set].sort((a,b)=> order.indexOf(a)-order.indexOf(b));
}

/* ── Agregados por DÍA (entradas {s,who}) ──────────────────── */
/* kcal de una sesión imputadas a cada persona según 'who' */
function entryKcal(entry){
  const s = SESSIONS[entry.s]; if(!s) return {A:0, B:0};
  const who = entry.who || 'AB';
  return {
    A: (who==='A'||who==='AB') ? sessionTotals(s,'A').kcal : 0,
    B: (who==='B'||who==='AB') ? sessionTotals(s,'B').kcal : 0
  };
}
/* Totales de un día: lista de entradas → {sessions, min, kA, kB} */
function dayTotals(entries){
  let sessions=0, min=0, kA=0, kB=0;
  (entries||[]).forEach(e=>{
    const s = SESSIONS[e.s]; if(!s) return;
    sessions++;
    const k = entryKcal(e);
    kA += k.A; kB += k.B;
    // minutos: el mayor de ambos (mismo entreno, distinto peso ≈ misma duración)
    min += sessionTotals(s,'A').min;
  });
  return {sessions, min, kA, kB};
}
/* Totales de un rango de fechas del plan (incl.) */
function planTotals(days, fromKey, toKey){
  let sessions=0, min=0, kA=0, kB=0; const muscles={};
  Object.keys(days||{}).forEach(k=>{
    if(fromKey && k < fromKey) return;
    if(toKey && k > toKey) return;
    (days[k]||[]).forEach(e=>{
      const s = SESSIONS[e.s]; if(!s) return;
      sessions++;
      const t = dayTotals([e]); min += t.min; kA += t.kA; kB += t.kB;
      sessionMuscles(s).forEach(m=> muscles[m]=(muscles[m]||0)+1);
    });
  });
  return {sessions, min, kA, kB, muscles};
}

/* ── Formato ─────────────────────────────────────────────── */
function fmtDur(sec){
  const m = Math.round(sec/60);
  if(m < 60) return m + ' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
/* Pauta de un item: "4×10 · 90s" o "3×45s · 45s" */
function itemScheme(it){
  const ex = exOf(it); if(!ex) return '';
  const sets = it.sets || ex.sets || 1;
  const rest = it.rest != null ? it.rest : (ex.rest || 0);
  let core;
  if((it.dur != null) || ex.mode === 'time'){
    const dur = it.dur != null ? it.dur : (ex.dur || 0);
    core = `${sets}×${dur}s`;
  } else {
    const reps = it.reps != null ? it.reps : (ex.reps || 0);
    core = `${sets}×${reps}`;
  }
  return rest ? `${core} · ${rest}s desc.` : core;
}

function muscleChips(ids, opts){
  opts = opts || {};
  return (ids||[]).map(m=>{
    const mm = EX_MUSCLES[m]; if(!mm) return '';
    return `<span class="msc-chip" style="--mc:${mm.c}">${opts.dot?'<i></i>':''}${mm.lbl}</span>`;
  }).join('');
}

window.personWeight = personWeight;
window.weightIsExplicit = weightIsExplicit;
window.sessionTotals = sessionTotals;
window.sessionMuscles = sessionMuscles;
window.dayTotals = dayTotals;
window.planTotals = planTotals;
