/* ══════════════════════════════════════════════════════════
   SPORT TRAIN · modo entrenamiento serie a serie
   Pantalla completa optimizada para usar con una mano en el gimnasio:
     · cronómetro de sesión (sobrevive a recargar la página)
     · cronómetro de descanso automático al cerrar cada serie
     · kg/reps prellenados con la progresión sugerida (1 toque = serie hecha)
     · RPE solo en la última serie de cada ejercicio (menos fricción)
     · estado persistido → si cierras la app a mitad, retoma donde ibas

   depende de sport-log.js, sport-data.js, sport-engine.js, pnToast
══════════════════════════════════════════════════════════ */

/* Estado en curso. `var` (no `const`) por el hoisting del bundle: ver DEPORTE.md §7 */
var TrainState = null;
var _trTick = null;      // intervalo del cronómetro de sesión
var _trRestTick = null;  // intervalo del cronómetro de descanso

/* ── Persistencia ─────────────────────────────────────────── */
function trSaveState(){ if(TrainState) lsSet(LS_SP_TRAIN, TrainState); }
function trLoadState(){
  const s = lsGet(LS_SP_TRAIN, null);
  if(!s || !s.sessId || !Array.isArray(s.ex)) return null;
  // descarta sesiones abandonadas hace más de 12 h
  if(Date.now() - (s.startTs||0) > 12*3600*1000){ lsSet(LS_SP_TRAIN, null); return null; }
  return s;
}
function trClearState(){ TrainState = null; lsSet(LS_SP_TRAIN, null); }
/* ¿hay un entreno a medias? (lo usa el calendario para ofrecer «Reanudar») */
function trHasPending(){ return !!trLoadState(); }

/* ── Arranque ─────────────────────────────────────────────── */
/* Crea el estado inicial a partir de una sesión del catálogo */
function trBuildState(sessId, who){
  const sess = SESSIONS[sessId];
  if(!sess) return null;
  who = who || 'A';
  const ex = (sess.items||[]).map(it=>{
    const e = EXERCISES[it.e]; if(!e) return null;
    const nSets  = it.sets || e.sets || 3;
    const isTime = (it.dur != null) || e.mode === 'time';
    const goal   = isTime ? null : (it.reps != null ? it.reps : (e.reps || 10));
    const dur0   = isTime ? (it.dur != null ? it.dur : (e.dur || 30)) : 0;
    let pre;
    if(isTime){
      const lt = (typeof logLastTimeFor === 'function') ? logLastTimeFor(it.e, who) : null;
      pre = {kg:0, reps:0, hint: lt ? `Última vez: ${logFmtDur(lt.dur)}${lt.dist?' · '+logFmtDist(lt.dist):''}` : ''};
    } else {
      pre = logPrefill(it.e, who, goal);
    }
    return {
      e: it.e,
      mode: isTime ? 'time' : 'reps',
      goalReps: goal,
      goalDur: isTime ? dur0 : null,
      dist: (typeof logExHasDist === 'function') && logExHasDist(it.e),   // ¿pide distancia?
      rest: it.rest != null ? it.rest : (e.rest || 60),
      hint: pre.hint,
      sets: Array.from({length:nSets}, ()=> ({kg:pre.kg, reps:isTime?0:pre.reps, rpe:0, done:false, dur:dur0, dist:0}))
    };
  }).filter(Boolean);
  if(!ex.length) return null;
  return {
    id: logNewId(), sessId, sessName: sess.name, who,
    startTs: Date.now(), pausedMs: 0, pauseAt: 0,
    cur: 0, restEnd: 0, restOf: 0,
    ex, feel: 0, notes: ''
  };
}

/* Punto de entrada: abre el modo entrenamiento para una sesión */
async function startTraining(sessId, who){
  const pend = trLoadState();
  if(pend && pend.sessId !== sessId){
    const ok = await pnConfirm(`Tienes «${pend.sessName}» a medias.\n\n¿Descartarlo y empezar este entrenamiento?`,
                               {danger:true, okText:'Descartar y empezar', cancelText:'Seguir con el anterior'});
    if(!ok){ TrainState = pend; renderTrain(); return; }
    trClearState();
  } else if(pend){
    TrainState = pend;             // misma sesión → retoma
    renderTrain();
    return;
  }
  const st = trBuildState(sessId, who);
  if(!st){ pnToast('Esa sesión no tiene ejercicios válidos', 'err'); return; }
  TrainState = st;
  trSaveState();
  renderTrain();
}
/* Reanudar el entreno pendiente */
function resumeTraining(){
  const pend = trLoadState();
  if(!pend){ pnToast('No hay ningún entrenamiento a medias', 'warn'); return; }
  TrainState = pend;
  renderTrain();
}

/* ── Cronómetros ──────────────────────────────────────────── */
function trElapsedSec(){
  if(!TrainState) return 0;
  const paused = TrainState.pausedMs + (TrainState.pauseAt ? Date.now()-TrainState.pauseAt : 0);
  return Math.max(0, Math.floor((Date.now() - TrainState.startTs - paused)/1000));
}
function trFmtClock(sec){
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60;
  const p = n=> String(n).padStart(2,'0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
function trStartTick(){
  clearInterval(_trTick);
  _trTick = setInterval(()=>{
    const el = document.getElementById('trClock');
    if(!el){ clearInterval(_trTick); return; }
    if(!TrainState.pauseAt) el.textContent = trFmtClock(trElapsedSec());
  }, 1000);
}
function trTogglePause(){
  if(!TrainState) return;
  if(TrainState.pauseAt){ TrainState.pausedMs += Date.now()-TrainState.pauseAt; TrainState.pauseAt = 0; }
  else TrainState.pauseAt = Date.now();
  trSaveState(); renderTrain();
}

/* Descanso: se arranca solo al cerrar una serie */
function trStartRest(sec){
  if(!TrainState || !sec) return;
  TrainState.restEnd = Date.now() + sec*1000;
  TrainState.restOf  = sec;
  trSaveState();
  trRestTick();
}
function trSkipRest(){ if(TrainState){ TrainState.restEnd = 0; trSaveState(); } clearInterval(_trRestTick); trRenderRest(); }
function trAddRest(sec){ if(TrainState && TrainState.restEnd){ TrainState.restEnd += sec*1000; TrainState.restOf += sec; trSaveState(); trRenderRest(); } }
function trRestLeft(){ return TrainState && TrainState.restEnd ? Math.ceil((TrainState.restEnd - Date.now())/1000) : 0; }
function trRestTick(){
  clearInterval(_trRestTick);
  _trRestTick = setInterval(()=>{
    const left = trRestLeft();
    trRenderRest();
    if(left <= 0){
      clearInterval(_trRestTick);
      if(TrainState) TrainState.restEnd = 0;
      trSaveState();
      trBeep();
    }
  }, 250);
}
/* Aviso de fin de descanso: vibración + pitido corto (sin archivos externos) */
function trBeep(){
  try{ if(navigator.vibrate) navigator.vibrate([120,80,120]); }catch(e){}
  try{
    const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
    const ctx = new AC(), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.5);
    setTimeout(()=>{ try{ ctx.close(); }catch(e){} }, 900);
  }catch(e){}
}

/* ── Acciones sobre las series ────────────────────────────── */
function trCurEx(){ return TrainState ? TrainState.ex[TrainState.cur] : null; }
/* Índice de la primera serie sin cerrar del ejercicio actual */
function trNextSetIdx(x){ const i = (x.sets||[]).findIndex(s=> !s.done); return i < 0 ? (x.sets.length-1) : i; }

function trBumpKg(delta){
  const x = trCurEx(); if(!x) return;
  const i = trNextSetIdx(x);
  x.sets[i].kg = Math.max(0, spRoundLoad((+x.sets[i].kg||0) + delta));
  // arrastra el cambio a las series siguientes aún sin hacer
  for(let j = i+1; j < x.sets.length; j++) if(!x.sets[j].done) x.sets[j].kg = x.sets[i].kg;
  trSaveState(); renderTrain();
}
function trBumpReps(delta){
  const x = trCurEx(); if(!x) return;
  const i = trNextSetIdx(x);
  x.sets[i].reps = Math.max(0, (+x.sets[i].reps||0) + delta);
  trSaveState(); renderTrain();
}
/* ── Medidas por tiempo (duración) y distancia ────────────────
   Para lo que va por tiempo (senderismo, carrera, plancha…) el ± toca la
   DURACIÓN, no las repeticiones; y el salto se adapta a la magnitud para
   que no haya que pulsar mil veces en una caminata larga. */
function trDurUnit(x){ return (x.goalDur||0) >= 120 ? 'min' : 's'; }        // muestra minutos si es larga
function trDurStep(x){ return trDurUnit(x) === 'min' ? 60 : ((x.goalDur||0) >= 60 ? 15 : 5); }
function trDistStep(){ return 100; }                                        // 100 m por toque
function trBumpDur(delta){
  const x = trCurEx(); if(!x) return;
  const i = trNextSetIdx(x);
  x.sets[i].dur = Math.max(0, (+x.sets[i].dur||0) + delta);
  for(let j=i+1;j<x.sets.length;j++) if(!x.sets[j].done) x.sets[j].dur = x.sets[i].dur;
  trSaveState(); renderTrain();
}
function trBumpDist(delta){
  const x = trCurEx(); if(!x) return;
  const i = trNextSetIdx(x);
  x.sets[i].dist = Math.max(0, Math.round((+x.sets[i].dist||0) + delta));
  trSaveState(); renderTrain();
}
/* Cierra la serie en curso y arranca el descanso */
function trDoneSet(){
  const x = trCurEx(); if(!x) return;
  const i = trNextSetIdx(x);
  const s = x.sets[i];
  s.done = true;
  const pr = x.mode === 'reps' && logIsPR(x.e, s.kg, s.reps, TrainState.who);
  const isLast = i >= x.sets.length - 1;
  trSaveState();
  if(pr) pnToast(`🏆 ¡Récord en ${(EXERCISES[x.e]||{}).name}! ${s.kg} kg × ${s.reps}`, 'ok');
  if(!isLast) trStartRest(x.rest);
  renderTrain();
  if(isLast && x.mode === 'reps') trAskRpe(x);   // el RPE por reps no aplica a cardio por tiempo
}
function trUndoSet(){
  const x = trCurEx(); if(!x) return;
  // deshace la última cerrada
  for(let i = x.sets.length-1; i >= 0; i--) if(x.sets[i].done){ x.sets[i].done = false; break; }
  trSkipRest(); trSaveState(); renderTrain();
}
function trAddSet(){
  const x = trCurEx(); if(!x) return;
  const last = x.sets[x.sets.length-1] || {kg:0, reps:x.goalReps||10, dur:x.goalDur||0, dist:0};
  x.sets.push({
    kg: last.kg,
    reps: x.mode==='time' ? 0 : last.reps,
    rpe: 0, done: false,
    dur: x.mode==='time' ? (last.dur || x.goalDur || 0) : 0,
    dist: x.mode==='time' ? (+last.dist || 0) : 0
  });
  trSaveState(); renderTrain();
}
/* ¿hay alguna serie cerrada que se pueda deshacer? */
function trCanUndo(){ const x = trCurEx(); return !!(x && (x.sets||[]).some(s=>s.done)); }
/* Quita la última serie SIN completar (para ajustar el nº de series
   planificado a la baja). No borra las ya registradas. */
function trRemoveSet(){
  const x = trCurEx(); if(!x) return;
  const pend = (x.sets||[]).filter(s=>!s.done).length;
  if(pend <= 1){ pnToast('Debe quedar al menos una serie', 'warn'); return; }
  for(let i = x.sets.length-1; i >= 0; i--){ if(!x.sets[i].done){ x.sets.splice(i,1); break; } }
  trSaveState(); renderTrain();
}
/* ¿se puede quitar alguna serie pendiente? */
function trCanRemove(){ const x = trCurEx(); return !!(x && (x.sets||[]).filter(s=>!s.done).length > 1); }
function trSetRpe(v){
  const x = trCurEx(); if(!x) return;
  for(let i = x.sets.length-1; i >= 0; i--) if(x.sets[i].done){ x.sets[i].rpe = v; break; }
  trSaveState();
  closeForm();
  renderTrain();
}
/* Al terminar el último set: pregunta el esfuerzo percibido */
function trAskRpe(x){
  const rows = [
    {v:6,  t:'Fácil',        d:'Me sobraban 4+ repeticiones'},
    {v:7,  t:'Moderado',     d:'Me sobraban 3'},
    {v:8,  t:'Exigente',     d:'Me sobraban 2'},
    {v:9,  t:'Muy exigente', d:'Me sobraba 1'},
    {v:10, t:'Al fallo',     d:'No podía hacer ni una más'}
  ];
  openForm(`
    <div class="form-hd"><h2>¿Cómo fue la última serie?</h2><span class="form-sub">${spEsc((EXERCISES[x.e]||{}).name||'')} · sirve para ajustar la carga de la próxima vez</span></div>
    <div class="form-body"><div class="tr-rpe">${rows.map(r=>`
      <button class="tr-rpe-b" data-rpe="${r.v}"><b>${r.v}</b><span>${r.t}</span><i>${r.d}</i></button>`).join('')}</div></div>
    <div class="form-actions"><button class="btn-sec" id="trRpeSkip">Omitir</button></div>`);
  formBody().querySelectorAll('.tr-rpe-b').forEach(b=> b.addEventListener('click', ()=> trSetRpe(+b.dataset.rpe)));
  document.getElementById('trRpeSkip').addEventListener('click', ()=>{ closeForm(); renderTrain(); });
}

/* Navegación entre ejercicios */
function trGoEx(i){
  if(!TrainState) return;
  TrainState.cur = Math.max(0, Math.min(TrainState.ex.length-1, i));
  trSkipRest(); trSaveState(); renderTrain();
}
async function trSkipEx(){
  const x = trCurEx(); if(!x) return;
  if(!await pnConfirm(`¿Saltar «${(EXERCISES[x.e]||{}).name}»?\n\nLas series sin hacer no se registrarán.`, {okText:'Saltar'})) return;
  x.skipped = true;
  if(TrainState.cur < TrainState.ex.length-1) trGoEx(TrainState.cur+1); else trSaveState(), renderTrain();
}
/* ── Selector de ejercicios ───────────────────────────────────
   Compartido por «Cambiar ejercicio» y «Añadir ejercicio extra».
   Ordena por PARECIDO al ejercicio de referencia (mismo patrón y
   mismos músculos primero) y permite buscar y filtrar, porque con
   341 ejercicios una lista plana no sirve de nada.
══════════════════════════════════════════════════════════ */
var _trPick = {q:'', mus:'all', disc:'all', soloMat:true};

/* Puntúa cuánto se parece `id` al ejercicio de referencia `ref` */
function trSimScore(id, ref){
  const c = EXERCISES[id]; if(!c) return -1;
  if(!ref) return 0;
  let s = 0;
  if(c.pat === ref.pat) s += 100;                                   // mismo patrón: lo que más importa
  const shared = (c.muscles||[]).filter(m=> (ref.muscles||[]).includes(m));
  s += shared.length * 20;
  if((c.muscles||[])[0] === (ref.muscles||[])[0]) s += 30;          // mismo músculo principal
  if(c.type === ref.type) s += 10;
  if(exDisc(c) === exDisc(ref)) s += 5;
  return s;
}
/* Nivel de parecido para pintarlo: 2 = muy parecido, 1 = parecido, 0 = otro */
function trSimTier(score){ return score >= 130 ? 2 : score >= 100 ? 1 : 0; }

function trOpenPicker(opts){
  opts = opts || {};
  const ref     = opts.refId ? EXERCISES[opts.refId] : null;
  const prof    = spProfile();
  const title   = opts.title || 'Elegir ejercicio';
  const sub     = opts.sub || '';
  const onPick  = opts.onPick || function(){};
  _trPick.q = '';

  const render = ()=>{
    const q = (_trPick.q||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    let list = Object.keys(EXERCISES).filter(id=>{
      if(opts.exclude && opts.exclude.includes(id)) return false;
      const c = EXERCISES[id];
      if(_trPick.mus !== 'all' && !(c.muscles||[]).includes(_trPick.mus)) return false;
      if(_trPick.disc !== 'all' && exDisc(c) !== _trPick.disc) return false;
      if(_trPick.soloMat && !spGearOk(c, prof.gear, id)) return false;
      if(q){
        const n = (c.name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        const e = (c.equip||'').toLowerCase();
        if(!n.includes(q) && !e.includes(q)) return false;
      }
      return true;
    });
    // parecidos primero; sin referencia, alfabético
    if(ref) list.sort((a,b)=> trSimScore(b,ref)-trSimScore(a,ref) || EXERCISES[a].name.localeCompare(EXERCISES[b].name));
    else    list.sort((a,b)=> EXERCISES[a].name.localeCompare(EXERCISES[b].name));

    const body = document.getElementById('trPickList');
    if(!body) return;
    const total = list.length;
    list = list.slice(0, 80);
    const cnt = document.getElementById('trPickCount');
    if(cnt) cnt.textContent = total + (total===1?' ejercicio':' ejercicios') + (total>80?' · mostrando 80':'');

    if(!list.length){
      body.innerHTML = `<div class="tr-pick-empty">Sin resultados.${_trPick.soloMat?' Prueba a desactivar «solo con mi material».':''}</div>`;
      return;
    }
    let lastTier = -1;
    body.innerHTML = list.map(id=>{
      const c = EXERCISES[id];
      const tier = ref ? trSimTier(trSimScore(id, ref)) : -1;
      let head = '';
      if(ref && tier !== lastTier){
        lastTier = tier;
        head = `<div class="tr-pick-sep">${tier===2?'✅ Muy parecidos':tier===1?'↔ Parecidos':'· Otros ejercicios'}</div>`;
      }
      const mus = (c.muscles||[]).slice(0,3).map(m=>(EX_MUSCLES[m]||{}).lbl||m).join(' · ');
      const thumb = (typeof exIllusBox==='function') ? exIllusBox(id,{cls:'thumb'}) : `<span class="tr-pick-ico">${(EX_SPORTS[exDisc(c)]||{}).ico||'•'}</span>`;
      return `${head}<button class="tr-pick-it ${tier>0?'sim'+tier:''}" data-pick="${id}">
        ${thumb}
        <span class="tr-pick-b"><b>${spEsc(c.name)}</b><span>${spEsc(mus)}</span></span>
        <span class="tr-pick-eq">${spEsc(c.equip||'—')}</span>
      </button>`;
    }).join('');
    body.querySelectorAll('[data-pick]').forEach(b=> b.addEventListener('click', ()=>{
      closeForm(); onPick(b.dataset.pick);
    }));
  };

  openForm(`
    <div class="form-hd"><h2>${spEsc(title)}</h2><span class="form-sub">${spEsc(sub)}</span></div>
    <div class="form-body tr-pick-body">
      <input class="finp tr-pick-q" id="trPickQ" type="search" placeholder="Buscar por nombre o material…" autocomplete="off">
      <div class="tr-pick-filters">
        <select class="fsel" id="trPickMus">
          <option value="all">Todos los músculos</option>
          ${Object.entries(EX_MUSCLES).map(([k,v])=>`<option value="${k}" ${_trPick.mus===k?'selected':''}>${v.lbl}</option>`).join('')}
        </select>
        <select class="fsel" id="trPickDisc">
          <option value="all">Cualquier deporte</option>
          ${Object.entries(EX_SPORTS).map(([k,v])=>`<option value="${k}" ${_trPick.disc===k?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}
        </select>
      </div>
      <label class="tr-pick-gear"><input type="checkbox" id="trPickMat" ${_trPick.soloMat?'checked':''}> Solo con mi material <i>(${(prof.gear||[]).length} tipos)</i></label>
      <div class="tr-pick-count" id="trPickCount"></div>
      <div class="tr-pick-list" id="trPickList"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="trPickCancel">Cancelar</button></div>`);

  const qi = document.getElementById('trPickQ');
  if(qi) qi.addEventListener('input', ()=>{ _trPick.q = qi.value; render(); });
  const ms = document.getElementById('trPickMus');
  if(ms) ms.addEventListener('change', ()=>{ _trPick.mus = ms.value; render(); });
  const ds = document.getElementById('trPickDisc');
  if(ds) ds.addEventListener('change', ()=>{ _trPick.disc = ds.value; render(); });
  const mt = document.getElementById('trPickMat');
  if(mt) mt.addEventListener('change', ()=>{ _trPick.soloMat = mt.checked; render(); });
  document.getElementById('trPickCancel').addEventListener('click', closeForm);
  render();
}

/* Sustituir el ejercicio actual por otro parecido
   (máquina ocupada, molestia puntual…) */
function trSwapEx(){
  const x = trCurEx(); if(!x) return;
  const ex = EXERCISES[x.e] || {};
  trOpenPicker({
    title: '🔄 Cambiar ejercicio',
    sub: `Sustituye «${ex.name||''}» · los más parecidos salen primero`,
    refId: x.e,
    exclude: [x.e],
    onPick: id=>{
      const pre = logPrefill(id, TrainState.who, x.goalReps);
      x.e = id; x.hint = pre.hint;
      const nx = EXERCISES[id] || {};
      x.mode = (nx.mode === 'time') ? 'time' : 'reps';
      x.goalDur = x.mode === 'time' ? (nx.dur||30) : null;
      x.goalReps = x.mode === 'reps' ? (nx.reps||10) : null;
      x.dist = (typeof logExHasDist === 'function') && logExHasDist(id);
      x.rest = nx.rest != null ? nx.rest : x.rest;
      x.sets.forEach(s=>{ if(!s.done){ s.kg = pre.kg; if(x.mode==='reps'){ s.reps = pre.reps; } else { s.dur = x.goalDur; s.dist = 0; } } });
      trSaveState(); renderTrain();
      pnToast(`Cambiado a ${nx.name}`, 'ok');
    }
  });
}

/* Añadir un ejercicio EXTRA no previsto, en cualquier momento */
function trAddExtraEx(){
  if(!TrainState) return;
  const cur = trCurEx();
  trOpenPicker({
    title: '➕ Añadir ejercicio',
    sub: 'Se añade al final de la sesión de hoy',
    refId: cur ? cur.e : null,
    exclude: TrainState.ex.map(x=>x.e),
    onPick: id=>{
      const e = EXERCISES[id]; if(!e) return;
      const isTime = e.mode === 'time';
      const goal = isTime ? null : (e.reps||10);
      const pre  = isTime ? {kg:0, reps:0, hint:''} : logPrefill(id, TrainState.who, goal);
      TrainState.ex.push({
        e:id, extra:true,
        mode: isTime ? 'time' : 'reps',
        goalReps: goal, goalDur: isTime ? (e.dur||30) : null,
        dist: (typeof logExHasDist === 'function') && logExHasDist(id),
        rest: e.rest || 60, hint: pre.hint,
        sets: Array.from({length: e.sets||3}, ()=> ({kg:pre.kg, reps:isTime?0:pre.reps, rpe:0, done:false, dur:isTime?(e.dur||30):0, dist:0}))
      });
      TrainState.cur = TrainState.ex.length - 1;      // salta directo a él
      trSkipRest(); trSaveState(); renderTrain();
      pnToast(`${e.name} añadido`, 'ok');
    }
  });
}

/* ── Cierre de la sesión ──────────────────────────────────── */
async function trFinish(){
  if(!TrainState) return;
  const done = TrainState.ex.reduce((a,x)=> a + (x.sets||[]).filter(s=>s.done).length, 0);
  if(!done){
    if(await pnConfirm('No has registrado ninguna serie.\n\n¿Descartar este entrenamiento?', {danger:true, okText:'Descartar'})){
      trExit(); trClearState();
    }
    return;
  }
  const pend = TrainState.ex.reduce((a,x)=> a + (x.sets||[]).filter(s=>!s.done).length, 0);
  openForm(`
    <div class="form-hd"><h2>🏁 Terminar entrenamiento</h2><span class="form-sub">${done} series registradas${pend?` · ${pend} sin hacer`:''} · ${trFmtClock(trElapsedSec())}</span></div>
    <div class="form-body">
      <div class="fgrp"><label class="flbl">¿Cómo te has sentido?</label>
        <div class="tr-feel" id="trFeel">${[[1,'😫','Agotado'],[2,'😕','Flojo'],[3,'🙂','Normal'],[4,'💪','Fuerte'],[5,'🔥','Genial']].map(([v,i,l])=>
          `<button type="button" class="tr-feel-b" data-feel="${v}"><span>${i}</span><i>${l}</i></button>`).join('')}</div>
      </div>
      <div class="fgrp"><label class="flbl">Notas (opcional)</label>
        <textarea class="finp" id="trNotes" rows="2" placeholder="Molestias, sensaciones, qué ajustar la próxima vez…"></textarea></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="trFinCancel">Seguir entrenando</button><button class="btn-prim" id="trFinOk">Guardar</button></div>`);
  formBody().querySelectorAll('.tr-feel-b').forEach(b=> b.addEventListener('click', ()=>{
    formBody().querySelectorAll('.tr-feel-b').forEach(o=> o.classList.toggle('on', o===b));
  }));
  document.getElementById('trFinCancel').addEventListener('click', closeForm);
  document.getElementById('trFinOk').addEventListener('click', ()=>{
    const feel = +(formBody().querySelector('.tr-feel-b.on')||{dataset:{}}).dataset.feel || 0;
    trCommit(feel, (document.getElementById('trNotes').value||'').trim());
  });
}

/* Vuelca el estado a `sport:log:v1` */
function trCommit(feel, notes){
  const st = TrainState; if(!st) return;
  const durSec = trElapsedSec();
  const entry = {
    id: st.id,
    date: spKey(new Date(st.startTs)),
    sessId: st.sessId, sessName: st.sessName, who: st.who,
    startTs: st.startTs, endTs: Date.now(), durSec,
    bodyweight: (typeof personWeight === 'function') ? personWeight(st.who) : 0,
    feel: feel || 0, notes: notes || '',
    // conserva el TIPO de medida: series por tiempo guardan dur (+dist);
    // series de fuerza guardan kg×reps. Sin esto no se puede recalcular
    // el gasto ni mostrar bien el histórico de lo que va por tiempo.
    ex: st.ex.map(x=> ({
          e: x.e, mode: x.mode || 'reps',
          sets: (x.sets||[]).filter(s=> s.done).map(s=> x.mode === 'time'
            ? {dur:+s.dur||0, dist:+s.dist||0, rpe:+s.rpe||0, done:true}
            : {kg:+s.kg||0, reps:+s.reps||0, rpe:+s.rpe||0, done:true})
        })).filter(x=> x.sets.length)
  };
  // kcal reales: MET·peso·tiempo activo (duración o reps registradas) +
  // descansos, con el PESO CORPORAL del perfil de la persona.
  entry.kcal = (typeof logEntryKcal === 'function') ? logEntryKcal(entry, entry.bodyweight) : 0;

  logSave(entry);
  trClearState();
  closeForm();
  trExit();
  const ns = logSetCount(entry), tn = logTonnage(entry);
  // sin emoji: pnToast ya antepone el suyo según el tipo
  pnToast(`Entrenamiento guardado · ${ns} ${ns===1?'serie':'series'}${tn?` · ${tn.toLocaleString('es-ES')} kg movidos`:''}`, 'ok');
  if(typeof showSportView === 'function') showSportView('prog');
}

async function trAbandon(){
  if(!await pnConfirm('¿Salir sin guardar?\n\nSe perderá lo que llevas registrado.', {danger:true, okText:'Salir sin guardar', cancelText:'Seguir'})) return;
  trClearState(); trExit();
}
/* Salir del modo entrenamiento manteniendo el estado (para volver luego) */
function trExit(){
  clearInterval(_trTick); clearInterval(_trRestTick);
  document.body.classList.remove('train-mode');
  const el = document.getElementById('trainOverlay');
  if(el) el.remove();
  if(typeof renderSportActive === 'function') renderSportActive();
}
function trMinimize(){
  trSaveState();
  clearInterval(_trTick); clearInterval(_trRestTick);
  document.body.classList.remove('train-mode');
  const el = document.getElementById('trainOverlay'); if(el) el.remove();
  pnToast('Entrenamiento en pausa · reanúdalo desde Entrenamientos', 'ok');
  if(typeof renderSportActive === 'function') renderSportActive();
}

/* ── Render ───────────────────────────────────────────────── */
function trRenderRest(){
  const wrap = document.getElementById('trRest'); if(!wrap) return;
  const left = trRestLeft();
  if(left <= 0){ wrap.classList.remove('on'); wrap.innerHTML = ''; return; }
  const total = TrainState.restOf || 1;
  const pct = Math.max(0, Math.min(100, (left/total)*100));
  wrap.classList.add('on');
  wrap.innerHTML = `
    <div class="tr-rest-bar"><i style="width:${pct}%"></i></div>
    <div class="tr-rest-row">
      <span class="tr-rest-lbl">Descanso</span>
      <span class="tr-rest-t mono">${trFmtClock(left)}</span>
      <button class="tr-rest-b" data-rest="30">+30s</button>
      <button class="tr-rest-b" data-rest="skip">Saltar</button>
    </div>`;
  wrap.querySelectorAll('[data-rest]').forEach(b=> b.addEventListener('click', ()=>{
    if(b.dataset.rest === 'skip') trSkipRest(); else trAddRest(+b.dataset.rest);
  }));
}

/* Entrada de una serie de FUERZA: peso + repeticiones */
function trRepsInput(x, s){
  return `<div class="tr-input">
    <div class="tr-in-grp">
      <label>Peso (kg)</label>
      <div class="tr-stepper">
        <button data-kg="-${spLoadStep(x.e)}">−</button>
        <input class="mono" type="number" inputmode="decimal" step="0.5" id="trKg" value="${s.kg||''}" placeholder="0">
        <button data-kg="${spLoadStep(x.e)}">+</button>
      </div>
    </div>
    <div class="tr-in-grp">
      <label>Repeticiones</label>
      <div class="tr-stepper">
        <button data-rp="-1">−</button>
        <input class="mono" type="number" inputmode="numeric" id="trReps" value="${s.reps||''}" placeholder="0">
        <button data-rp="1">+</button>
      </div>
    </div>
  </div>`;
}
/* Entrada de una serie por TIEMPO: duración (min o s según magnitud) y,
   en carrera/bici/nado/remo, distancia opcional. Nunca pide kg. */
function trTimeInput(x, s){
  const unit = trDurUnit(x), step = trDurStep(x);
  const durVal = unit === 'min' ? (Math.round((+s.dur||0)/60*10)/10) : (+s.dur||0);
  const dur = `
    <div class="tr-in-grp">
      <label>${unit === 'min' ? 'Minutos' : 'Segundos'}</label>
      <div class="tr-stepper">
        <button data-dur="-${step}">−</button>
        <input class="mono" type="number" inputmode="decimal" id="trDur" value="${durVal||''}" placeholder="0">
        <button data-dur="${step}">+</button>
      </div>
      <span class="tr-in-sub mono">${logFmtDur(+s.dur||0)}</span>
    </div>`;
  const dist = x.dist ? `
    <div class="tr-in-grp">
      <label>Distancia (km) <i>opcional</i></label>
      <div class="tr-stepper">
        <button data-dist="-${trDistStep()}">−</button>
        <input class="mono" type="number" inputmode="decimal" step="0.1" id="trDist" value="${s.dist?(Math.round(+s.dist/10)/100):''}" placeholder="0">
        <button data-dist="${trDistStep()}">+</button>
      </div>
      <span class="tr-in-sub mono">${+s.dist>0?logFmtDist(s.dist):'—'}</span>
    </div>` : '';
  return `<div class="tr-input tr-input-time">${dur}${dist}</div>`;
}

function renderTrain(){
  if(!TrainState) return;
  const st = TrainState;
  const x  = trCurEx();
  const ex = EXERCISES[x.e] || {name:x.e};
  const i  = trNextSetIdx(x);
  const s  = x.sets[i];
  const doneAll = (x.sets||[]).every(k=> k.done);
  const totalSets = st.ex.reduce((a,k)=> a + k.sets.length, 0);
  const doneSets  = st.ex.reduce((a,k)=> a + k.sets.filter(z=>z.done).length, 0);
  const best = logBestFor(x.e, st.who);

  let el = document.getElementById('trainOverlay');
  if(!el){
    el = document.createElement('div');
    el.id = 'trainOverlay';
    el.className = 'train-ov';
    document.body.appendChild(el);
  }
  document.body.classList.add('train-mode');
  renderTrainBar();          // retira la barra «Entrenar hoy» mientras entrenas

  el.innerHTML = `
  <div class="tr-hd">
    <button class="tr-x" id="trMin" title="Minimizar">▾</button>
    <div class="tr-hd-mid">
      <b class="tr-sess">${spEsc(st.sessName||'Entrenamiento')}</b>
      <span class="tr-prog">${doneSets}/${totalSets} series</span>
    </div>
    <button class="tr-clock ${st.pauseAt?'paused':''}" id="trPause" title="Pausar/reanudar">
      <span class="mono" id="trClock">${trFmtClock(trElapsedSec())}</span>
      <i>${st.pauseAt?'▶':'❚❚'}</i>
    </button>
  </div>

  <div class="tr-steps">${st.ex.map((k,n)=>{
    const kd = k.sets.every(z=>z.done) || k.skipped;
    return `<button class="tr-step ${n===st.cur?'on':''} ${kd?'ok':''} ${k.skipped?'skip':''}" data-go="${n}" title="${spEsc((EXERCISES[k.e]||{}).name||'')}">${n+1}</button>`;
  }).join('')}</div>

  <div class="tr-rest" id="trRest"></div>

  <div class="tr-body">
    <div class="tr-ex">
      ${typeof exIllusBox==='function' ? `<div class="tr-ex-illus">${exIllusBox(x.e,{cls:'train'})}</div>` : ''}
      <span class="tr-ex-n">Ejercicio ${st.cur+1} de ${st.ex.length}${x.extra?' · añadido':''}</span>
      <h2>${spEsc(ex.name)}</h2>
      <div class="tr-ex-meta">
        <span>${spEsc(ex.equip||'')}</span>
        ${best ? `<span class="tr-best">🏆 ${best.kg} kg × ${best.reps}</span>` : ''}
      </div>
      ${x.hint ? `<div class="tr-hint">💡 ${spEsc(x.hint)}</div>` : ''}
      ${ex.cues ? `<details class="tr-cues"><summary>Técnica</summary><p>${spEsc(ex.cues)}</p></details>` : ''}
    </div>

    <div class="tr-sets">${x.sets.map((k,n)=>`
      <div class="tr-set ${k.done?'done':''} ${n===i&&!doneAll?'cur':''}">
        <span class="tr-set-n">${n+1}</span>
        <span class="tr-set-v mono">${x.mode==='time' ? (logFmtDur(k.dur) + (+k.dist>0?' · '+logFmtDist(k.dist):'')) : `${k.kg?k.kg+' kg':'—'} × ${k.reps||'—'}`}</span>
        ${k.rpe?`<span class="tr-set-rpe">RPE ${k.rpe}</span>`:''}
        <span class="tr-set-ok">${k.done?'✓':''}</span>
      </div>`).join('')}
    </div>

    ${doneAll ? `
      <div class="tr-done">
        <p>✅ Ejercicio completado</p>
        <div class="tr-done-row">
          <button class="btn-sec" id="trUndo">↩ Deshacer</button>
          <button class="btn-sec" id="trAdd">+ Serie extra</button>
          ${st.cur < st.ex.length-1
            ? `<button class="btn-prim" id="trNext">Siguiente ejercicio →</button>`
            : `<button class="btn-prim" id="trFin">🏁 Terminar</button>`}
        </div>
      </div>` : `
      ${x.mode === 'time' ? trTimeInput(x, s) : trRepsInput(x, s)}
      <button class="tr-go" id="trDone">✓ ${x.mode==='time' ? (x.sets.length>1?('Bloque '+(i+1)+' hecho'):'Registrar') : ('Serie '+(i+1)+' hecha')}</button>
      <div class="tr-set-edit">
        <button class="tr-set-edit-b" id="trAddSet">+ Serie</button>
        ${trCanRemove() ? `<button class="tr-set-edit-b" id="trRmSet">− Serie</button>` : ''}
        ${trCanUndo() ? `<button class="tr-set-edit-b" id="trUndo2">↩ Deshacer</button>` : ''}
      </div>`}

    <button class="tr-add-ex" id="trAddEx">➕ Añadir otro ejercicio</button>
  </div>

  <div class="tr-foot">
    <button class="tr-foot-b" id="trSwap">🔄 Cambiar</button>
    <button class="tr-foot-b" id="trSkip">⏭ Saltar</button>
    <button class="tr-foot-b danger" id="trQuit">✕ Salir</button>
    <button class="tr-foot-b prim" id="trFin2">🏁 Terminar</button>
  </div>`;

  /* wiring */
  const on = (id, fn)=>{ const b = document.getElementById(id); if(b) b.addEventListener('click', fn); };
  on('trMin', trMinimize);
  on('trPause', trTogglePause);
  on('trSwap', trSwapEx);
  on('trSkip', trSkipEx);
  on('trQuit', trAbandon);
  on('trFin',  trFinish);
  on('trFin2', trFinish);
  on('trUndo', trUndoSet);
  on('trUndo2',trUndoSet);
  on('trAdd',  trAddSet);
  on('trAddSet',trAddSet);
  on('trRmSet',trRemoveSet);
  on('trAddEx',trAddExtraEx);
  on('trNext', ()=> trGoEx(st.cur+1));
  el.querySelectorAll('[data-go]').forEach(b=> b.addEventListener('click', ()=> trGoEx(+b.dataset.go)));
  el.querySelectorAll('[data-kg]').forEach(b=> b.addEventListener('click', ()=> trBumpKg(+b.dataset.kg)));
  el.querySelectorAll('[data-rp]').forEach(b=> b.addEventListener('click', ()=> trBumpReps(+b.dataset.rp)));
  el.querySelectorAll('[data-dur]').forEach(b=> b.addEventListener('click', ()=> trBumpDur(+b.dataset.dur)));
  el.querySelectorAll('[data-dist]').forEach(b=> b.addEventListener('click', ()=> trBumpDist(+b.dataset.dist)));

  // los inputs escriben directamente en el estado (sin re-render, para no perder el foco)
  const kgI = document.getElementById('trKg'), rpI = document.getElementById('trReps');
  const durI = document.getElementById('trDur'), distI = document.getElementById('trDist');
  if(kgI) kgI.addEventListener('input', ()=>{
    const v = Math.max(0, +kgI.value||0);
    s.kg = v;
    for(let j=i+1;j<x.sets.length;j++) if(!x.sets[j].done) x.sets[j].kg = v;
    trSaveState();
  });
  if(rpI) rpI.addEventListener('input', ()=>{ s.reps = Math.max(0, +rpI.value||0); trSaveState(); });
  if(durI) durI.addEventListener('input', ()=>{
    const raw = Math.max(0, +durI.value||0);
    const sec = trDurUnit(x) === 'min' ? Math.round(raw*60) : Math.round(raw);
    s.dur = sec;
    for(let j=i+1;j<x.sets.length;j++) if(!x.sets[j].done) x.sets[j].dur = sec;
    trSaveState();
  });
  if(distI) distI.addEventListener('input', ()=>{ s.dist = Math.max(0, Math.round((+distI.value||0)*1000)); trSaveState(); });
  on('trDone', trDoneSet);

  trStartTick();
  trRenderRest();
  if(trRestLeft() > 0) trRestTick();
}

/* ── Acceso rápido: barra «Entrenar hoy» ──────────────────────
   Antes había que ir a Entrenamientos → abrir el día → pulsar ▶.
   Demasiados pasos para lo que se hace a diario y desde el móvil.
   Esta barra sale fija abajo en toda la sección de Deporte cuando
   hoy toca entrenar (o hay una sesión a medias).
══════════════════════════════════════════════════════════ */
function trTodayEntries(){
  if(typeof SportPlan === 'undefined' || !SportPlan || !SportPlan.days) return [];
  return (SportPlan.days[spKey(new Date())] || []).filter(e=> SESSIONS[e.s]);
}
/* Lanza el entreno de hoy: si hay varias sesiones, deja elegir */
function trStartToday(){
  const pend = trLoadState();
  if(pend){ resumeTraining(); return; }
  const list = trTodayEntries();
  if(!list.length){ pnToast('Hoy no tienes entrenamiento programado', 'warn'); return; }
  if(list.length === 1){ trStartEntry(list[0]); return; }
  openForm(`
    <div class="form-hd"><h2>▶ Entrenar hoy</h2><span class="form-sub">Tienes ${list.length} sesiones programadas</span></div>
    <div class="form-body"><div class="tr-pick-list">${list.map((e,i)=>{
      const s = SESSIONS[e.s], t = sessionTotals(s,'A');
      return `<button class="tr-pick-it" data-go="${i}">
        <span class="tr-pick-ico">${(EX_TYPES[s.type]||{ico:'•'}).ico}</span>
        <span class="tr-pick-b"><b>${spEsc(s.name)}</b><span>${t.min} min · ${(s.items||[]).length} ejercicios</span></span>
      </button>`;
    }).join('')}</div></div>
    <div class="form-actions"><button class="btn-sec" id="trTodayCancel">Cancelar</button></div>`);
  formBody().querySelectorAll('[data-go]').forEach(b=> b.addEventListener('click', ()=>{
    closeForm(); trStartEntry(list[+b.dataset.go]);
  }));
  document.getElementById('trTodayCancel').addEventListener('click', closeForm);
}
/* Arranca una entrada del plan aplicando la fase del mesociclo */
function trStartEntry(ent){
  const live = (typeof spSessionFor === 'function') ? spSessionFor(ent) : SESSIONS[ent.s];
  if(live && ent.phase){
    const tmpId = '_live_' + ent.s + '_' + (ent.week||1);
    SESSIONS[tmpId] = live;
    startTraining(tmpId, ent.who === 'B' ? 'B' : 'A');
  } else {
    startTraining(ent.s, ent.who === 'B' ? 'B' : 'A');
  }
}

/* Pinta / actualiza la barra. La llama showSportView en cada vista.
   Siempre visible en Deporte: entrena hoy, reanuda, o elige/genera. */
function renderTrainBar(){
  let bar = document.getElementById('trTodayBar');
  const inSport = document.body.classList.contains('sec-sport');
  const training = document.body.classList.contains('train-mode');
  const pend = trLoadState();
  const list = trTodayEntries();
  const show = inSport && !training;

  if(!show){ if(bar) bar.remove(); document.body.classList.remove('has-trainbar'); return; }
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'trTodayBar';
    bar.className = 'tr-bar';
    document.body.appendChild(bar);
  }
  document.body.classList.add('has-trainbar');

  if(pend){
    const done = (pend.ex||[]).reduce((a,x)=> a + (x.sets||[]).filter(s=>s.done).length, 0);
    const tot  = (pend.ex||[]).reduce((a,x)=> a + (x.sets||[]).length, 0);
    bar.innerHTML = `
      <span class="tr-bar-b">
        <b>Entrenamiento a medias</b>
        <span>${spEsc(pend.sessName||'')} · ${done}/${tot} series</span>
      </span>
      <button class="tr-bar-alt" id="trBarPick" title="Elegir otro">☰</button>
      <button class="tr-bar-go" id="trBarGo">▶ Reanudar</button>`;
  } else if(list.length){
    const s = SESSIONS[list[0].s];
    const t = sessionTotals(s, 'A');
    const ph = list[0].phase ? SP_PHASES[list[0].phase] : null;
    bar.innerHTML = `
      <span class="tr-bar-b">
        <b>Hoy: ${spEsc(s.name)}${list.length>1?` <i>+${list.length-1}</i>`:''}</b>
        <span>${t.min} min · ${(s.items||[]).length} ejercicios${ph?` · ${ph.ico} ${spEsc(ph.lbl)}`:''}</span>
      </span>
      <button class="tr-bar-alt" id="trBarPick" title="Elegir otro">☰</button>
      <button class="tr-bar-go" id="trBarGo">▶ Entrenar</button>`;
  } else {
    // sin nada programado: el botón principal abre el selector
    bar.innerHTML = `
      <span class="tr-bar-b">
        <b>¿Entrenamos?</b>
        <span>Elige una sesión, por músculo o genérala a medida</span>
      </span>
      <button class="tr-bar-go" id="trBarPick2">▶ Elegir entrenamiento</button>`;
  }
  const g = document.getElementById('trBarGo');
  if(g) g.addEventListener('click', trStartToday);
  const p1 = document.getElementById('trBarPick');
  if(p1) p1.addEventListener('click', trChooseWorkout);
  const p2 = document.getElementById('trBarPick2');
  if(p2) p2.addEventListener('click', trChooseWorkout);

  // La barra va JUSTO encima de la tabbar. Se mide en vez de asumir 84px:
  // la altura real depende de la fuente, del safe-area del móvil y de si
  // la tabbar está oculta en esa sección.
  const tab = document.getElementById('appTabbar');
  const th  = (tab && getComputedStyle(tab).display !== 'none') ? tab.getBoundingClientRect().height : 0;
  bar.style.bottom = th + 'px';
  document.body.style.setProperty('--trbar-h', bar.getBoundingClientRect().height + 'px');
}

/* ── Selector de entrenamiento ────────────────────────────────
   Una sola ventana para decidir qué entrenar hoy:
     · reanudar el que está a medias
     · el/los programados para hoy
     · una sesión preparada (filtrable por nivel y músculo)
     · generar una a medida por grupo muscular + duración + nivel
══════════════════════════════════════════════════════════ */
var _trChoose = {q:'', level:'all', muscles:[], dur:60};

/* Arranca una sesión ad-hoc (generada al vuelo): la registra con un id
   temporal y entra al modo entrenamiento. */
function trStartAdHoc(sess, who){
  if(!sess){ pnToast('No se pudo generar la sesión', 'err'); return; }
  const id = '_adhoc_' + Date.now().toString(36);
  SESSIONS[id] = sess;
  startTraining(id, who || 'A');
}

function trChooseWorkout(){
  const pend  = trLoadState();
  const today = trTodayEntries();
  _trChoose.q = '';

  const render = ()=>{
    const host = document.getElementById('trChooseList');
    if(!host) return;
    const q = (_trChoose.q||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    // sesiones preparadas: base primero (no user), luego las del usuario
    let ids = Object.keys(SESSIONS).filter(id=>{
      if(/^_(adhoc|live)_/.test(id)) return false;
      const s = SESSIONS[id];
      if(_trChoose.level!=='all' && (s.level||'').toLowerCase().indexOf(_trChoose.level)<0) return false;
      if(_trChoose.muscles.length){
        const mus = sessionMuscles(s);
        if(!_trChoose.muscles.every(m=> mus.includes(m))) return false;
      }
      if(q){
        const n=(s.name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        const f=(s.focus||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        if(!n.includes(q) && !f.includes(q)) return false;
      }
      return true;
    });
    ids.sort((a,b)=> (SESSIONS[a].user?1:0)-(SESSIONS[b].user?1:0));

    const cnt = document.getElementById('trChooseCount');
    if(cnt) cnt.textContent = ids.length + (ids.length===1?' sesión':' sesiones');

    host.innerHTML = ids.map(id=>{
      const s = SESSIONS[id], t = sessionTotals(s,'A');
      const lvl = s.level ? `<span class="trc-lvl">${spEsc(s.level)}</span>` : '';
      return `<button class="trc-sess" data-start="${id}">
        <span class="trc-ico">${(EX_TYPES[s.type]||{ico:'•'}).ico}</span>
        <span class="trc-b"><b>${spEsc(s.name)}</b><span>${t.min} min · ${(s.items||[]).length} ej${s.focus?' · '+spEsc(s.focus):''}</span></span>
        ${lvl}<span class="trc-play">▶</span>
      </button>`;
    }).join('') || `<div class="trc-empty">Ninguna sesión coincide. Prueba a generar una a medida abajo.</div>`;

    host.querySelectorAll('[data-start]').forEach(b=> b.addEventListener('click', ()=>{
      closeForm(); startTraining(b.dataset.start, 'A');
    }));

    // botón de generar según los músculos elegidos
    const gen = document.getElementById('trChooseGen');
    if(gen){
      const ms = _trChoose.muscles;
      gen.disabled = !ms.length;
      gen.textContent = ms.length
        ? `🎲 Generar ${_trChoose.dur} min con: ${ms.map(m=>(EX_MUSCLES[m]||{}).lbl||m).join(', ')}`
        : '🎲 Elige músculos para generar a medida';
    }
  };

  openForm(`
    <div class="form-hd"><h2>▶ Elegir entrenamiento</h2><span class="form-sub">El de hoy, uno preparado, por músculo o a tu medida</span></div>
    <div class="form-body tr-choose">
      ${pend ? `<button class="trc-resume" id="trcResume">⏱️ Reanudar «${spEsc(pend.sessName||'')}»</button>` : ''}
      ${today.length ? `<div class="trc-today">
        <div class="trc-lbl">Programado para hoy</div>
        ${today.map((e,i)=>{ const s=SESSIONS[e.s]; if(!s) return ''; const t=sessionTotals(s,'A');
          return `<button class="trc-sess hoy" data-today="${i}">
            <span class="trc-ico">${(EX_TYPES[s.type]||{ico:'•'}).ico}</span>
            <span class="trc-b"><b>${spEsc(s.name)}</b><span>${t.min} min · ${(s.items||[]).length} ej</span></span>
            <span class="trc-play">▶</span></button>`;}).join('')}
      </div>` : ''}

      <div class="trc-lbl">Filtrar</div>
      <input class="finp trc-q" id="trChooseQ" type="search" placeholder="Buscar sesión…" autocomplete="off">
      <div class="trc-filters">
        <select class="fsel" id="trChooseLevel">
          <option value="all">Cualquier nivel</option>
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
      </div>
      <div class="trc-lbl2">Por grupo muscular <small>(también genera a medida)</small></div>
      <div class="trc-muscles" id="trChooseMus">${Object.entries(EX_MUSCLES).filter(([k])=>!['fullbody','cardio','movilidad'].includes(k)).map(([k,v])=>
        `<button type="button" class="trc-mchip ${_trChoose.muscles.includes(k)?'on':''}" data-m="${k}">${v.lbl}</button>`).join('')}</div>

      <div class="trc-lbl">Sesiones preparadas <span class="trc-count" id="trChooseCount"></span></div>
      <div class="trc-list" id="trChooseList"></div>
    </div>
    <div class="form-actions trc-actions">
      <div class="trc-gen-row">
        <select class="fsel trc-dur" id="trChooseDur">
          ${[30,40,45,60,75].map(d=>`<option value="${d}" ${_trChoose.dur===d?'selected':''}>${d} min</option>`).join('')}
        </select>
        <button class="btn-prim trc-gen" id="trChooseGen" disabled>🎲 Elige músculos para generar a medida</button>
      </div>
      <button class="btn-sec" id="trChooseCancel">Cerrar</button>
    </div>`);

  // wiring
  const qi=document.getElementById('trChooseQ'); if(qi) qi.addEventListener('input',()=>{ _trChoose.q=qi.value; render(); });
  const lv=document.getElementById('trChooseLevel'); if(lv){ lv.value=_trChoose.level; lv.addEventListener('change',()=>{ _trChoose.level=lv.value; render(); }); }
  const du=document.getElementById('trChooseDur'); if(du) du.addEventListener('change',()=>{ _trChoose.dur=+du.value; render(); });
  formBody().querySelectorAll('#trChooseMus .trc-mchip').forEach(b=> b.addEventListener('click',()=>{
    const m=b.dataset.m, i=_trChoose.muscles.indexOf(m);
    if(i>=0) _trChoose.muscles.splice(i,1); else _trChoose.muscles.push(m);
    b.classList.toggle('on'); render();
  }));
  if(pend){ const r=document.getElementById('trcResume'); if(r) r.addEventListener('click',()=>{ closeForm(); resumeTraining(); }); }
  today.forEach(()=>{});
  formBody().querySelectorAll('[data-today]').forEach(b=> b.addEventListener('click',()=>{
    closeForm(); trStartEntry(today[+b.dataset.today]);
  }));
  const gen=document.getElementById('trChooseGen');
  if(gen) gen.addEventListener('click',()=>{
    const ms=_trChoose.muscles; if(!ms.length) return;
    const prof=spProfile();
    const sess=buildSessionByCriteria(ms, _trChoose.dur, 'media', 'all', {profile:prof});
    if(!sess){ pnToast('No hay ejercicios para esos músculos con tu material', 'warn'); return; }
    closeForm(); trStartAdHoc(sess, 'A');
  });
  document.getElementById('trChooseCancel').addEventListener('click', closeForm);
  render();
}

window.startTraining = startTraining;
window.resumeTraining = resumeTraining;
window.trHasPending = trHasPending;
window.renderTrain = renderTrain;
window.renderTrainBar = renderTrainBar;
window.trStartToday = trStartToday;
window.trStartEntry = trStartEntry;
window.trOpenPicker = trOpenPicker;
window.trAddExtraEx = trAddExtraEx;
window.trRemoveSet = trRemoveSet;
window.trChooseWorkout = trChooseWorkout;
window.trStartAdHoc = trStartAdHoc;
window.trFmtClock = trFmtClock;
