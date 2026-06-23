/* ══════════════════════════════════════════════════════════
   ASISTENTE DE ENTRENAMIENTO · plan a medida paso a paso
   ----------------------------------------------------------
   Guía al usuario por pequeñas decisiones (objetivo, deporte,
   días/semana, duración y cuánto tiempo) y con ellas genera un
   plan completo reutilizando el motor existente: runAutoPlan(P)
   -> buildSessionByCriteria + generateSportPlan.

   Lo que el programa necesita para elaborar un entreno a medida:
     · objetivo      → define intensidad y reparto (split)
     · deporte       → filtra los ejercicios por contexto
     · días/semana   → cuántas sesiones distintas y qué split encaja
     · duración      → nº de ejercicios/series por sesión
     · horizonte     → durante cuántas semanas repetir la cadencia
   El "quién entrena" se deja en Todas por defecto (ajustable luego).
   ========================================================== */
(function(){
  'use strict';

  const OBJETIVOS = [
    {v:'fuerza',      ico:'💪', lbl:'Ganar fuerza y músculo', sub:'Series algo más pesadas, más descanso'},
    {v:'forma',       ico:'🤸', lbl:'Estar en forma',          sub:'Equilibrio entre carga y volumen'},
    {v:'grasa',       ico:'🔥', lbl:'Perder grasa',            sub:'Ritmo alto, full body, algo de cardio'},
    {v:'resistencia', ico:'🏃', lbl:'Resistencia / cardio',    sub:'Sesiones de fondo y condición física'}
  ];
  const DIAS = [2,3,4,5,6];
  const DUR  = [30,45,60,75];
  const SEMANAS = [4,8,12,16];

  let _i = 0, _A = {}, _root = null, _first = false;

  function esc(s){ return (typeof escHtml==='function') ? escHtml(s) : String(s==null?'':s); }
  function sportsList(){
    const arr = Object.entries(typeof EX_SPORTS!=='undefined'?EX_SPORTS:{}).map(([k,v])=>({v:k, ico:v.ico, lbl:v.lbl}));
    arr.push({v:'all', ico:'🏅', lbl:'Cualquiera'});
    return arr;
  }

  // Deriva intensidad y reparto (split) a partir de objetivo + días.
  function deriveIntensity(obj){ return (obj==='fuerza'||obj==='grasa') ? 'alta' : 'media'; }
  function deriveSplit(obj, nDays){
    if(obj==='resistencia') return 'cardio';
    if(nDays<=2) return 'fullbody';
    if(nDays===3) return 'ppl';
    return obj==='fuerza' ? 'torso_pierna' : 'ppl';
  }
  function splitLbl(k){ return (typeof AP_SPLITS!=='undefined' && AP_SPLITS[k]) ? AP_SPLITS[k].lbl : k; }

  // Definición de pasos (single-select; el último es revisión).
  function steps(){
    return [
      {key:'objetivo', ico:'🎯', title:'¿Cuál es tu objetivo?', hint:'Con esto ajusto la intensidad y cómo repartir el trabajo.', options:OBJETIVOS},
      {key:'disc',     ico:'🏟️', title:'¿Dónde entrenas?',      hint:'Filtro los ejercicios según tu contexto o material.', options:sportsList()},
      {key:'nDays',    ico:'📅', title:'¿Cuántos días por semana?', hint:'Elegiré un reparto que encaje con esos días.', options:DIAS.map(n=>({v:n, ico:'🗓️', lbl:`${n} días/semana`}))},
      {key:'dur',      ico:'⏱️', title:'¿Cuánto dura cada sesión?', hint:'Define cuántos ejercicios y series entran.', options:DUR.map(m=>({v:m, ico:'⏱️', lbl:`${m} minutos`}))},
      {key:'weeks',    ico:'🗓️', title:'¿Durante cuántas semanas?', hint:'Repetiré la cadencia desde hoy.', options:SEMANAS.map(w=>({v:w, ico:'🗓️', lbl:`${w} semanas`}))},
      {key:'review',   ico:'✅', title:'Resumen', hint:'Revisa y genera tu plan.'}
    ];
  }

  function open(){
    if(typeof runAutoPlan!=='function'){ return; }
    _i = 0; _A = {disc:'gimnasio', nDays:4, dur:50, weeks:8};
    if(!_root){
      _root = document.createElement('div');
      _root.id = 'sportAsst'; _root.className = 'masst';
      document.body.appendChild(_root);
      _root.addEventListener('click', onClick);
    }
    document.body.classList.add('no-scroll');
    _first = true;
    render();
  }
  function close(){ if(_root) _root.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  function render(){
    const S = steps();
    const st = S[_i];
    let bodyHtml;
    if(st.key === 'review'){
      const intensity = deriveIntensity(_A.objetivo);
      const split = deriveSplit(_A.objetivo, +_A.nDays);
      const objLbl = (OBJETIVOS.find(o=>o.v===_A.objetivo)||{}).lbl || '—';
      const discLbl = _A.disc==='all' ? 'Cualquiera' : ((EX_SPORTS[_A.disc]||{}).lbl||_A.disc);
      const intLbl = (typeof SP_INTENSITY!=='undefined' && SP_INTENSITY[intensity]) ? SP_INTENSITY[intensity].lbl : intensity;
      bodyHtml = `
        <ul class="masst-sum">
          <li><span>🎯 Objetivo</span><b>${esc(objLbl)}</b></li>
          <li><span>🏟️ Dónde</span><b>${esc(discLbl)}</b></li>
          <li><span>📅 Frecuencia</span><b>${esc(_A.nDays)} días/semana</b></li>
          <li><span>🧩 Reparto</span><b>${esc(splitLbl(split))}</b></li>
          <li><span>🔥 Intensidad</span><b>${esc(intLbl)}</b></li>
          <li><span>⏱️ Sesión</span><b>${esc(_A.dur)} min</b></li>
          <li><span>🗓️ Duración</span><b>${esc(_A.weeks)} semanas</b></li>
        </ul>
        <p class="masst-hint">Generaré una sesión distinta por día de entreno y la repartiré por el calendario de Entrenamientos. Podrás editar o regenerar cualquier día después.</p>`;
    } else {
      const cur = _A[st.key];
      bodyHtml = `<div class="masst-grid">${st.options.map(o=>`
        <button class="masst-card ${String(cur)===String(o.v)?'on':''}" data-set="${st.key}" data-val="${esc(o.v)}">
          <span class="masst-card-ic">${o.ico||st.ico}</span>
          <span class="masst-card-b">
            <span class="masst-card-n">${esc(o.lbl)}</span>
            ${o.sub?`<span class="masst-card-sub">${esc(o.sub)}</span>`:''}
          </span>
          <span class="masst-card-chk">${String(cur)===String(o.v)?'✓':'＋'}</span>
        </button>`).join('')}</div>`;
    }

    const isReview = st.key==='review';
    _root.innerHTML = `
      <div class="masst-bg" data-close="1"></div>
      <div class="masst-panel${_first?' anim':''}" role="dialog" aria-label="Asistente de entrenamiento">
        <div class="masst-hd">
          <div class="masst-steps">${S.map((s,idx)=>`<span class="masst-dot ${idx===_i?'on':''} ${idx<_i?'done':''}">${s.ico}</span>`).join('')}</div>
          <button class="masst-x" data-close="1" aria-label="Cerrar">✕</button>
        </div>
        <div class="masst-body">
          <h2 class="masst-title">${st.ico} ${esc(st.title)} <small>paso ${_i+1} de ${S.length}</small></h2>
          <p class="masst-hint">${esc(st.hint)}</p>
          ${bodyHtml}
        </div>
        <div class="masst-foot">
          <span class="masst-count">${isReview?'Listo para generar':'Elige una opción'}</span>
          <div class="masst-actions">
            ${_i>0 ? `<button class="masst-btn ghost" data-nav="back">← Atrás</button>` : ''}
            ${isReview ? `<button class="masst-btn primary" data-nav="generate">🧭 Generar plan</button>`
                        : `<button class="masst-btn primary" data-nav="next">Siguiente →</button>`}
          </div>
        </div>
      </div>`;
    _root.classList.add('show');
    _first = false;
    const b = _root.querySelector('.masst-body'); if(b) b.scrollTop = 0;
  }

  function onClick(e){
    if(e.target.closest('[data-close]')){ close(); return; }
    const opt = e.target.closest('[data-set]');
    if(opt){
      const key = opt.dataset.set; let val = opt.dataset.val;
      if(key==='nDays'||key==='dur'||key==='weeks') val = +val;
      _A[key] = val;
      // avanzar automáticamente al elegir (flujo guiado)
      if(_i < steps().length-1){ _i++; }
      render(); return;
    }
    const nav = e.target.closest('[data-nav]');
    if(nav){
      const a = nav.dataset.nav;
      if(a==='back'){ if(_i>0){ _i--; render(); } return; }
      if(a==='next'){
        const st = steps()[_i];
        if(st.key!=='review' && _A[st.key]==null){ return; }   // exige elección
        if(_i < steps().length-1){ _i++; render(); }
        return;
      }
      if(a==='generate'){ generate(); return; }
    }
  }

  function generate(){
    const intensity = deriveIntensity(_A.objetivo);
    const split = deriveSplit(_A.objetivo, +_A.nDays);
    const start = (typeof spKey==='function' && typeof spToday==='function') ? spKey(spToday()) : '';
    const P = {
      disc: _A.disc, nDays: +_A.nDays, splitKey: split, dur: +_A.dur,
      intensity, who: 'AB', start, u: 'weeks', rangeVal: +_A.weeks, keep: false
    };
    close();
    try{ runAutoPlan(P); }
    catch(err){ if(typeof pnAlert==='function') pnAlert('No se pudo generar el plan.\n'+(err&&err.message||err)); else alert('No se pudo generar el plan.'); }
  }

  function wire(){
    const b = document.getElementById('spCalAssistant');
    if(b && !b._asstWired){ b._asstWired = true; b.addEventListener('click', open); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, {once:true});
  else wire();

  window.openSportAssistant = open;
})();
