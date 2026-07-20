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
    const pre    = isTime ? {kg:0, reps:0, hint:''} : logPrefill(it.e, who, goal);
    return {
      e: it.e,
      mode: isTime ? 'time' : 'reps',
      goalReps: goal,
      goalDur: isTime ? (it.dur != null ? it.dur : (e.dur||30)) : null,
      rest: it.rest != null ? it.rest : (e.rest || 60),
      hint: pre.hint,
      sets: Array.from({length:nSets}, ()=> ({kg:pre.kg, reps:isTime?0:pre.reps, rpe:0, done:false, dur:isTime?(it.dur!=null?it.dur:(e.dur||30)):0}))
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
  if(isLast) trAskRpe(x);
}
function trUndoSet(){
  const x = trCurEx(); if(!x) return;
  // deshace la última cerrada
  for(let i = x.sets.length-1; i >= 0; i--) if(x.sets[i].done){ x.sets[i].done = false; break; }
  trSkipRest(); trSaveState(); renderTrain();
}
function trAddSet(){
  const x = trCurEx(); if(!x) return;
  const last = x.sets[x.sets.length-1] || {kg:0, reps:x.goalReps||10};
  x.sets.push({kg:last.kg, reps:x.mode==='time'?0:last.reps, rpe:0, done:false, dur:x.goalDur||0});
  trSaveState(); renderTrain();
}
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
/* Sustituir el ejercicio actual por otro que trabaje lo mismo
   (máquina ocupada, molestia puntual…) */
function trSwapEx(){
  const x = trCurEx(); if(!x) return;
  const ex = EXERCISES[x.e] || {};
  const alts = Object.keys(EXERCISES).filter(id=>{
    if(id === x.e) return false;
    const c = EXERCISES[id];
    if(c.pat !== ex.pat) return false;
    return (c.muscles||[]).some(m=> (ex.muscles||[]).includes(m));
  }).slice(0, 40);
  if(!alts.length){ pnToast('No hay alternativas equivalentes en el catálogo', 'warn'); return; }
  openForm(`
    <div class="form-hd"><h2>🔄 Cambiar ejercicio</h2><span class="form-sub">Mismo patrón (${spEsc((EX_PATTERNS[ex.pat]||{}).lbl||ex.pat)}) y músculos parecidos</span></div>
    <div class="form-body"><div class="tr-alts">${alts.map(id=>{
      const c = EXERCISES[id];
      return `<button class="tr-alt" data-alt="${id}"><b>${spEsc(c.name)}</b><span>${spEsc(c.equip||'')}</span></button>`;
    }).join('')}</div></div>
    <div class="form-actions"><button class="btn-sec" id="trAltCancel">Cancelar</button></div>`);
  formBody().querySelectorAll('.tr-alt').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.dataset.alt;
    const pre = logPrefill(id, TrainState.who, x.goalReps);
    x.e = id; x.hint = pre.hint;
    x.sets.forEach(s=>{ if(!s.done){ s.kg = pre.kg; if(x.mode==='reps') s.reps = pre.reps; } });
    trSaveState(); closeForm(); renderTrain();
  }));
  document.getElementById('trAltCancel').addEventListener('click', closeForm);
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
    ex: st.ex.map(x=> ({e:x.e, sets:(x.sets||[]).filter(s=> s.done).map(s=> ({kg:+s.kg||0, reps:+s.reps||0, rpe:+s.rpe||0, done:true}))}))
             .filter(x=> x.sets.length)
  };
  // kcal reales: MET del ejercicio × peso × tiempo trabajado
  try{
    const w = entry.bodyweight || 70;
    let kcal = 0;
    entry.ex.forEach(x=>{
      const ex = EXERCISES[x.e]; if(!ex) return;
      kcal += (ex.met||4) * w * (x.sets.length * (x.sets[0].reps||10) * 3 / 3600);
    });
    kcal += 1.3 * w * (durSec/3600) * 0.5;      // descansos, aproximado
    entry.kcal = Math.round(kcal);
  }catch(e){ entry.kcal = 0; }

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
      <span class="tr-ex-n">Ejercicio ${st.cur+1} de ${st.ex.length}</span>
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
        <span class="tr-set-v mono">${x.mode==='time' ? (k.dur+'s') : `${k.kg?k.kg+' kg':'—'} × ${k.reps||'—'}`}</span>
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
      <div class="tr-input">
        <div class="tr-in-grp">
          <label>Peso (kg)</label>
          <div class="tr-stepper">
            <button data-kg="-${spLoadStep(x.e)}">−</button>
            <input class="mono" type="number" inputmode="decimal" step="0.5" id="trKg" value="${s.kg||''}" placeholder="0">
            <button data-kg="${spLoadStep(x.e)}">+</button>
          </div>
        </div>
        <div class="tr-in-grp">
          <label>${x.mode==='time'?'Segundos':'Repeticiones'}</label>
          <div class="tr-stepper">
            <button data-rp="-1">−</button>
            <input class="mono" type="number" inputmode="numeric" id="trReps" value="${x.mode==='time'?(s.dur||''):(s.reps||'')}" placeholder="0">
            <button data-rp="1">+</button>
          </div>
        </div>
      </div>
      <button class="tr-go" id="trDone">✓ Serie ${i+1} hecha</button>`}
  </div>

  <div class="tr-foot">
    <button class="tr-foot-b" id="trSwap">🔄 Cambiar</button>
    <button class="tr-foot-b" id="trSkip">⏭ Saltar</button>
    <button class="tr-foot-b danger" id="trQuit">✕ Abandonar</button>
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
  on('trAdd',  trAddSet);
  on('trNext', ()=> trGoEx(st.cur+1));
  el.querySelectorAll('[data-go]').forEach(b=> b.addEventListener('click', ()=> trGoEx(+b.dataset.go)));
  el.querySelectorAll('[data-kg]').forEach(b=> b.addEventListener('click', ()=> trBumpKg(+b.dataset.kg)));
  el.querySelectorAll('[data-rp]').forEach(b=> b.addEventListener('click', ()=> trBumpReps(+b.dataset.rp)));

  // los inputs escriben directamente en el estado (sin re-render, para no perder el foco)
  const kgI = document.getElementById('trKg'), rpI = document.getElementById('trReps');
  if(kgI) kgI.addEventListener('input', ()=>{
    const v = Math.max(0, +kgI.value||0);
    s.kg = v;
    for(let j=i+1;j<x.sets.length;j++) if(!x.sets[j].done) x.sets[j].kg = v;
    trSaveState();
  });
  if(rpI) rpI.addEventListener('input', ()=>{
    const v = Math.max(0, +rpI.value||0);
    if(x.mode==='time') s.dur = v; else s.reps = v;
    trSaveState();
  });
  on('trDone', trDoneSet);

  trStartTick();
  trRenderRest();
  if(trRestLeft() > 0) trRestTick();
}

window.startTraining = startTraining;
window.resumeTraining = resumeTraining;
window.trHasPending = trHasPending;
window.renderTrain = renderTrain;
window.trFmtClock = trFmtClock;
