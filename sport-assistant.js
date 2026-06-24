/* ══════════════════════════════════════════════════════════
   ASISTENTE DE ENTRENAMIENTO · plan a medida paso a paso
   ----------------------------------------------------------
   Guía por pequeñas decisiones y genera un plan reutilizando el
   motor existente (buildSessionByCriteria + generateSportPlan):
     · objetivo  → intensidad + reparto (split)
     · deporte   → contexto/material principal
     · DÍAS de la semana (concretos: p. ej. lunes y viernes)
     · medir cada sesión por TIEMPO (min) o por KCAL a gastar
     · combinar TIPOS: cada día puede tener un deporte distinto
     · horizonte (semanas)
   ========================================================== */
(function(){
  'use strict';

  const OBJETIVOS = [
    {v:'fuerza',      ico:'💪', lbl:'Ganar fuerza y músculo', sub:'Series más pesadas, más descanso'},
    {v:'forma',       ico:'🤸', lbl:'Estar en forma',          sub:'Equilibrio carga-volumen'},
    {v:'grasa',       ico:'🔥', lbl:'Perder grasa',            sub:'Ritmo alto, full body, algo de cardio'},
    {v:'resistencia', ico:'🏃', lbl:'Resistencia / cardio',    sub:'Sesiones de fondo y condición'}
  ];
  const WD = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];       // idx 0..6 (lunes-base, como spWeekdayMon)
  const TIME_OPTS = [30,45,60,75];
  const KCAL_OPTS = [250,400,550,700];
  const SEMANAS = [4,8,12,16];

  let _i = 0, _A = {}, _root = null, _first = false;

  function esc(s){ return (typeof escHtml==='function') ? escHtml(s) : String(s==null?'':s); }
  function sportsList(){
    const arr = Object.entries(typeof EX_SPORTS!=='undefined'?EX_SPORTS:{}).map(([k,v])=>({v:k, ico:v.ico, lbl:v.lbl}));
    arr.push({v:'all', ico:'🏅', lbl:'Cualquiera'});
    return arr;
  }
  function deriveIntensity(obj){ return (obj==='fuerza'||obj==='grasa') ? 'alta' : 'media'; }
  function deriveSplit(obj, nDays){
    if(obj==='resistencia') return 'cardio';
    if(nDays<=2) return 'fullbody';
    if(nDays===3) return 'ppl';
    return obj==='fuerza' ? 'torso_pierna' : 'ppl';
  }
  function splitObj(k){ return (typeof AP_SPLITS!=='undefined' && AP_SPLITS[k]) ? AP_SPLITS[k] : {lbl:k, slots:[{l:'Sesión', m:['pecho','espalda','cuadriceps','gluteo','core']}]}; }
  // kcal objetivo → minutos aprox (≈8 kcal/min a intensidad moderada)
  function kcalToMin(k){ return Math.max(15, Math.min(120, Math.round((+k||400)/8))); }

  function steps(){
    const list = [
      {key:'objetivo', type:'single', ico:'🎯', title:'¿Cuál es tu objetivo?', hint:'Ajusto intensidad y cómo repartir el trabajo.', options:OBJETIVOS},
      {key:'disc',     type:'single', ico:'🏟️', title:'¿Dónde entrenas (por defecto)?', hint:'Filtra los ejercicios por contexto. Luego podrás poner un deporte distinto cada día.', options:sportsList()},
      {key:'days',     type:'multi',  ico:'📅', title:'¿Qué días entrenas?', hint:'Elige los días concretos de la semana (p. ej. lunes y viernes).', options:WD.map((d,i)=>({v:i, lbl:d}))},
      {key:'measure',  type:'single', ico:'📏', title:'¿Cómo mides cada sesión?', hint:'Por duración o por las calorías que quieras gastar.', options:[{v:'time',ico:'⏱️',lbl:'Por tiempo (minutos)'},{v:'kcal',ico:'🔥',lbl:'Por kcal a gastar'}]},
      {key:'amount',   type:'single', ico:'⏱️', title:'', hint:'', options:[]},   // se rellena según measure
      {key:'combine',  type:'perday', ico:'🧩', title:'Combinar deportes (opcional)', hint:'Asigna un deporte a cada día si quieres variar. Por defecto usan el principal.', options:[]},
      {key:'weeks',    type:'single', ico:'🗓️', title:'¿Durante cuántas semanas?', hint:'Repetiré la cadencia desde hoy.', options:SEMANAS.map(w=>({v:w, ico:'🗓️', lbl:`${w} semanas`}))},
      {key:'review',   type:'review', ico:'✅', title:'Resumen', hint:'Revisa y genera tu plan.'}
    ];
    // amount depende de measure
    const am = list.find(s=>s.key==='amount');
    if(_A.measure==='kcal'){ am.ico='🔥'; am.title='¿Cuántas kcal por sesión?'; am.hint='Lo convierto a una duración aproximada.'; am.options=KCAL_OPTS.map(k=>({v:k,ico:'🔥',lbl:`~${k} kcal`})); }
    else { am.ico='⏱️'; am.title='¿Cuánto dura cada sesión?'; am.hint='Define cuántos ejercicios/series entran.'; am.options=TIME_OPTS.map(m=>({v:m,ico:'⏱️',lbl:`${m} minutos`})); }
    return list;
  }

  function open(){
    if(typeof generateSportPlan!=='function' || typeof buildSessionByCriteria!=='function'){ return; }
    _i = 0; _A = {disc:'gimnasio', days:[0,2,4], measure:'time', amount:45, weeks:8, daySport:{}};
    if(!_root){ _root = document.createElement('div'); _root.id='sportAsst'; _root.className='masst'; document.body.appendChild(_root); _root.addEventListener('click', onClick); }
    document.body.classList.add('no-scroll'); _first = true; render();
  }
  function close(){ if(_root) _root.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  function render(){
    const S = steps(); const st = S[_i];
    let bodyHtml = '';
    if(st.type==='review'){
      const intensity = deriveIntensity(_A.objetivo);
      const split = deriveSplit(_A.objetivo, (_A.days||[]).length);
      const objLbl = (OBJETIVOS.find(o=>o.v===_A.objetivo)||{}).lbl || '—';
      const discLbl = _A.disc==='all'?'Cualquiera':((EX_SPORTS[_A.disc]||{}).lbl||_A.disc);
      const dur = _A.measure==='kcal' ? kcalToMin(_A.amount) : _A.amount;
      const daysLbl = (_A.days||[]).slice().sort((a,b)=>a-b).map(i=>{
        const ds = _A.daySport[i] && _A.daySport[i]!==_A.disc ? ` (${(EX_SPORTS[_A.daySport[i]]||{}).lbl||_A.daySport[i]})` : '';
        return WD[i]+ds;
      }).join(', ') || '—';
      bodyHtml = `<ul class="masst-sum">
        <li><span>🎯 Objetivo</span><b>${esc(objLbl)}</b></li>
        <li><span>🏟️ Deporte base</span><b>${esc(discLbl)}</b></li>
        <li><span>📅 Días</span><b>${esc(daysLbl)}</b></li>
        <li><span>🧩 Reparto</span><b>${esc(splitObj(split).lbl)}</b></li>
        <li><span>${_A.measure==='kcal'?'🔥 Por kcal':'⏱️ Por tiempo'}</span><b>${_A.measure==='kcal'?('~'+_A.amount+' kcal · ≈'+dur+' min'):(_A.amount+' min')}</b></li>
        <li><span>🗓️ Duración</span><b>${esc(_A.weeks)} semanas</b></li>
      </ul>
      <p class="masst-hint">Generaré una sesión por día elegido y la repartiré por el calendario de Entrenamientos. Podrás editar o regenerar cualquier día.</p>`;
    } else if(st.type==='multi'){
      const sel = _A[st.key]||[];
      bodyHtml = `<div class="masst-grid masst-grid-wd">${st.options.map(o=>`
        <button class="masst-card ${sel.indexOf(o.v)>=0?'on':''}" data-multi="${st.key}" data-val="${o.v}">
          <span class="masst-card-n">${esc(o.lbl)}</span>
          <span class="masst-card-chk">${sel.indexOf(o.v)>=0?'✓':'＋'}</span>
        </button>`).join('')}</div>`;
    } else if(st.type==='perday'){
      const days = (_A.days||[]).slice().sort((a,b)=>a-b);
      if(!days.length){ bodyHtml = `<p class="masst-hint">Primero elige días en el paso anterior.</p>`; }
      else{
        const opts = sportsList();
        bodyHtml = `<div class="masst-perday">${days.map(i=>`
          <div class="masst-pd-row">
            <span class="masst-pd-d">${WD[i]}</span>
            <select class="masst-pd-sel" data-day="${i}">
              ${opts.map(o=>`<option value="${o.v}" ${(_A.daySport[i]||_A.disc)===o.v?'selected':''}>${o.ico} ${esc(o.lbl)}</option>`).join('')}
            </select>
          </div>`).join('')}</div>`;
      }
    } else { // single
      const cur = _A[st.key];
      bodyHtml = `<div class="masst-grid">${st.options.map(o=>`
        <button class="masst-card ${String(cur)===String(o.v)?'on':''}" data-set="${st.key}" data-val="${esc(o.v)}">
          <span class="masst-card-ic">${o.ico||st.ico}</span>
          <span class="masst-card-b"><span class="masst-card-n">${esc(o.lbl)}</span>${o.sub?`<span class="masst-card-sub">${esc(o.sub)}</span>`:''}</span>
          <span class="masst-card-chk">${String(cur)===String(o.v)?'✓':'＋'}</span>
        </button>`).join('')}</div>`;
    }

    const isReview = st.type==='review';
    const showNext = st.type!=='single' || isReview; // single auto-avanza; multi/perday/review llevan botón
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
          <span class="masst-count">${isReview?'Listo para generar':(st.type==='multi'?'Elige uno o varios':'Elige una opción')}</span>
          <div class="masst-actions">
            ${_i>0 ? `<button class="masst-btn ghost" data-nav="back">← Atrás</button>` : ''}
            ${isReview ? `<button class="masst-btn primary" data-nav="generate">🧭 Generar plan</button>`
                       : (showNext ? `<button class="masst-btn primary" data-nav="next">Siguiente →</button>` : `<button class="masst-btn ghost" data-nav="next">Siguiente →</button>`)}
          </div>
        </div>
      </div>`;
    _root.classList.add('show'); _first = false;
    const b=_root.querySelector('.masst-body'); if(b) b.scrollTop=0;
    // wiring de selects (per-day)
    _root.querySelectorAll('.masst-pd-sel').forEach(sel=> sel.addEventListener('change', ()=>{ _A.daySport[+sel.dataset.day] = sel.value; }));
  }

  function onClick(e){
    if(e.target.closest('[data-close]')){ close(); return; }
    const single = e.target.closest('[data-set]');
    if(single){ let v=single.dataset.val; const k=single.dataset.set; if(k==='amount'||k==='weeks') v=+v; _A[k]=v; if(_i<steps().length-1) _i++; render(); return; }
    const multi = e.target.closest('[data-multi]');
    if(multi){ const k=multi.dataset.multi; const v=+multi.dataset.val; const arr=_A[k]||(_A[k]=[]); const j=arr.indexOf(v); if(j>=0) arr.splice(j,1); else arr.push(v); render(); return; }
    const nav = e.target.closest('[data-nav]');
    if(nav){
      const a=nav.dataset.nav;
      if(a==='back'){ if(_i>0){ _i--; render(); } return; }
      if(a==='next'){
        const st=steps()[_i];
        if(st.key==='days' && !(_A.days||[]).length){ return; }   // exige al menos un día
        if(_i<steps().length-1){ _i++; render(); }
        return;
      }
      if(a==='generate'){ generate(); return; }
    }
  }

  function generate(){
    try{
      const intensity = deriveIntensity(_A.objetivo);
      const split = deriveSplit(_A.objetivo, (_A.days||[]).length);
      const slotsDef = splitObj(split).slots || [{l:'Sesión', m:['pecho','espalda','cuadriceps','gluteo','core']}];
      const dur = _A.measure==='kcal' ? kcalToMin(_A.amount) : _A.amount;
      const days = (_A.days||[]).slice().sort((a,b)=>a-b);
      if(!days.length){ close(); return; }
      const who = 'AB';
      const cfgSlots = [];
      let n = 0;
      days.forEach((wd, k)=>{
        const disc = _A.daySport[wd] || _A.disc;
        const slot = slotsDef[k % slotsDef.length];
        let sess = buildSessionByCriteria(slot.m, dur, intensity, disc);
        if(!sess) sess = buildSessionByCriteria(slot.m, dur, intensity, 'all');
        if(!sess) return;
        const discLbl = (EX_SPORTS[disc]||{}).lbl || '';
        sess.name = `${discLbl?discLbl+' · ':''}${slot.l} · ${WD[wd]}`;
        sess.level = `Asistente · ${intensity}`;
        const id = (typeof nextSpId==='function') ? nextSpId('asst_'+WD[wd], SESSIONS) : ('asst_'+wd+'_'+Date.now());
        SESSIONS[id] = sess;
        cfgSlots.push({idx:wd, s:id, who});
        n++;
      });
      if(!n){ alert('No se han podido generar sesiones con esos criterios. Prueba otro deporte o más días.'); return; }
      if(typeof persistSessions==='function') persistSessions();
      const start = (typeof spKey==='function' && typeof spToday==='function') ? spKey(spToday()) : '';
      const cfg = {type:'weekly', cycleLen:7, start, rangeUnit:'weeks', rangeVal:+_A.weeks||8, slots:cfgSlots};
      if(typeof SportPlan!=='undefined') SportPlan.name = `Asistente · ${days.length} día/sem · ${_A.weeks} sem`;
      generateSportPlan(cfg, false);
      close();
      if(typeof spCursor!=='undefined' && typeof spFromKey==='function' && start){ try{ spCursor = new Date(spFromKey(start).getFullYear(), spFromKey(start).getMonth(), 1); }catch(e){} }
      if(typeof renderSportCalendar==='function') renderSportCalendar();
      if(typeof renderSportActive==='function') renderSportActive();
      if(typeof pnToast==='function') pnToast(`Plan generado: ${n} sesiones/semana · ${_A.weeks} semanas`, 'ok');
      else alert(`✓ Plan generado: ${n} sesiones/semana durante ${_A.weeks} semanas.`);
    }catch(err){ if(typeof pnAlert==='function') pnAlert('No se pudo generar el plan.\n'+(err&&err.message||err), {type:'error'}); else alert('No se pudo generar el plan.'); }
  }

  function wire(){ const b=document.getElementById('spCalAssistant'); if(b && !b._asstWired){ b._asstWired=true; b.addEventListener('click', open); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire, {once:true}); else wire();
  window.openSportAssistant = open;
})();
