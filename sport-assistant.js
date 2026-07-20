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

  /* Reparte los slots entre los días elegidos evitando que dos días
     CONSECUTIVOS del calendario compartan grupo muscular (regla de las
     48 h de recuperación). Devuelve un array de slots alineado con
     `days`. Si no hay combinación perfecta, deja la que menos solape. */
  function spaceSlots(slotsDef, days){
    const n = days.length;
    const base = Array.from({length:n}, (_, k)=> slotsDef[k % slotsDef.length]);
    if(n < 2) return base;
    const overlap = (a, b)=> (a.m||[]).filter(m=> (b.m||[]).includes(m) && m!=='core').length;
    // ¿cuántos días naturales separan dos días de entreno? (idx lunes-base)
    const gap = (i, j)=>{ const d = days[j] - days[i]; return d > 0 ? d : d + 7; };
    let best = base, bestCost = Infinity;
    // permutaciones (n ≤ 7 → como mucho 5040, instantáneo)
    const perm = (arr, cur)=>{
      if(!arr.length){
        let cost = 0;
        for(let i=0;i<cur.length;i++){
          const j = (i+1) % cur.length;
          if(gap(i, j) < 2) cost += overlap(cur[i], cur[j]) * 10;   // días pegados
          else if(gap(i, j) < 3) cost += overlap(cur[i], cur[j]);   // 2 días: penaliza poco
        }
        if(cost < bestCost){ bestCost = cost; best = cur.slice(); }
        return;
      }
      if(bestCost === 0) return;
      for(let i=0;i<arr.length;i++){
        const rest = arr.slice(0,i).concat(arr.slice(i+1));
        perm(rest, cur.concat([arr[i]]));
      }
    };
    if(n <= 7) perm(base, []); else return base;
    return best;
  }

  function steps(){
    const list = [
      {key:'objetivo', type:'single', ico:'🎯', title:'¿Cuál es tu objetivo?', hint:'Ajusto intensidad y cómo repartir el trabajo.', options:OBJETIVOS},
      {key:'level',    type:'single', ico:'📊', title:'¿Cuánto llevas entrenando?', hint:'Determina cuántas series aguantas y si conviene peso libre o máquinas guiadas.',
        options:Object.entries(typeof SP_LEVELS!=='undefined'?SP_LEVELS:{}).map(([k,v])=>({v:k, ico:'📊', lbl:v.lbl, sub:v.ex}))},
      {key:'place',    type:'single', ico:'📍', title:'¿Dónde vas a entrenar?', hint:'Marco el material típico de ese sitio. En el paso siguiente lo puedes afinar.',
        options:Object.entries(typeof GEAR_PLACES!=='undefined'?GEAR_PLACES:{}).map(([k,v])=>({v:k, ico:v.ico, lbl:v.lbl, sub:v.sub}))},
      {key:'gear',     type:'gear',   ico:'🏋️', title:'Confirma tu material', hint:'Quita o añade lo que haga falta. Solo propondré ejercicios que puedas hacer de verdad.', options:[]},
      {key:'disc',     type:'single', ico:'🏟️', title:'¿Qué deporte o tipo de entreno?', hint:'El foco principal. Luego podrás poner un deporte distinto cada día.', options:sportsList()},
      {key:'injuries', type:'multi',  ico:'🩹', title:'¿Alguna zona que cuidar?', hint:'Opcional. Evitaré los ejercicios que carguen esas zonas. Si no tienes molestias, pasa al siguiente paso.',
        options:Object.entries(typeof SP_INJURIES!=='undefined'?SP_INJURIES:{}).map(([k,v])=>({v:k, ico:'🩹', lbl:v.lbl}))},
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
    // Defaults COMPLETOS: el usuario puede pulsar "⚡ Valores por defecto" en cualquier
    // paso y generar sin rellenar nada (objetivo "estar en forma" 3 días/sem, 45 min, 8 sem).
    // arranca con lo que ya sepamos del perfil guardado
    const prof = (typeof spProfile==='function') ? spProfile() : {level:'intermedio', gear:[], injuries:[]};
    // gear puede venir con las claves antiguas (SP_GEAR) o ya con ítems
    // normalizados (GEAR_ITEMS): si no reconozco ninguna, uso el gimnasio.
    let gear = (prof.gear||[]).filter(k=> typeof GEAR_ITEMS!=='undefined' && GEAR_ITEMS[k]);
    if(!gear.length && typeof gearItemsOfPlace==='function') gear = gearItemsOfPlace('gimnasio');
    const place = (typeof gearGuessPlace==='function') ? gearGuessPlace(gear) : 'gimnasio';
    _i = 0; _A = {objetivo:'forma', level:prof.level, place:place, gear:gear, injuries:(prof.injuries||[]).slice(),
                  disc:'gimnasio', days:[0,2,4], measure:'time', amount:45, weeks:8, daySport:{}};
    if(!_root){ _root = document.createElement('div'); _root.id='sportAsst'; _root.className='masst'; document.body.appendChild(_root); _root.addEventListener('click', onClick);
      // Swipe móvil: izquierda = siguiente, derecha = atrás (reutiliza los botones de navegación).
      if(typeof pnSwipe==='function') pnSwipe(_root,
        ()=>{ const b=_root.querySelector('[data-nav="next"]'); if(b) b.click(); },
        ()=>{ const b=_root.querySelector('[data-nav="back"]'); if(b) b.click(); },
        { guard:(t)=> !!(t.closest && t.closest('select, .masst-pd-sel')) });
    }
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
      const lvlLbl = ((typeof SP_LEVELS!=='undefined' && SP_LEVELS[_A.level])||{}).lbl || '—';
      const placeLbl = ((typeof GEAR_PLACES!=='undefined' && GEAR_PLACES[_A.place])||{}).lbl || '—';
      const covR = (typeof gearCoverage==='function') ? gearCoverage(_A.gear||[]) : null;
      const gearLbl = covR ? `${covR.n} ejercicios disponibles` : ((_A.gear||[]).length+' tipos');
      const injLbl = (_A.injuries||[]).map(g=>((typeof SP_INJURIES!=='undefined'&&SP_INJURIES[g])||{}).lbl||g).join(', ');
      bodyHtml = `<ul class="masst-sum">
        <li><span>🎯 Objetivo</span><b>${esc(objLbl)}</b></li>
        <li><span>📊 Nivel</span><b>${esc(lvlLbl)}</b></li>
        <li><span>🏟️ Deporte base</span><b>${esc(discLbl)}</b></li>
        <li><span>📍 Lugar</span><b>${esc(placeLbl)}</b></li>
        <li><span>🏋️ Material</span><b>${esc(gearLbl)}</b></li>
        ${injLbl?`<li><span>🩹 A cuidar</span><b>${esc(injLbl)}</b></li>`:''}
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
    } else if(st.type==='gear'){
      // Material agrupado, con el recuento real de ejercicios disponibles:
      // así se ve al momento lo que abre o cierra cada ítem.
      const owned = _A.gear||[];
      const cov = (typeof gearCoverage==='function') ? gearCoverage(owned) : {n:0,total:0,pct:0};
      const GRUPOS = [
        ['Básico',      ['ninguno','esterilla','banda','comba','cajon']],
        ['Peso libre',  ['mancuernas','kettlebell','barra','barra_ez','banco','rack','smith','balon_med']],
        ['Gimnasio',    ['polea','maquina','barra_fija','paralelas','trx','rueda_ab','trineo']],
        ['Cardio',      ['cinta','bici','eliptica','remo_erg','skierg']],
        ['Específico',  ['piscina','nat_acces','saco','guantes','raqueta','pista','balon','zapatillas','exterior','escalera_ag','kayak']]
      ];
      bodyHtml = `
        <div class="masst-cov"><b>${cov.n}</b> de ${cov.total} ejercicios disponibles <span>(${cov.pct} %)</span></div>
        ${GRUPOS.map(([g, items])=>`
          <div class="masst-gear-g">
            <span class="masst-gear-h">${esc(g)}</span>
            <div class="masst-gear-row">${items.filter(k=> GEAR_ITEMS[k]).map(k=>{
              const it = GEAR_ITEMS[k], on = owned.indexOf(k)>=0;
              return `<button class="masst-gear-b ${on?'on':''}" data-multi="gear" data-val="${k}">
                <span>${it.ico}</span>${esc(it.lbl)}</button>`;
            }).join('')}</div>
          </div>`).join('')}`;
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
            ${!isReview ? `<button class="masst-btn ghost" data-nav="quickdefault" title="Salta al resumen con los valores por defecto">⚡ Por defecto</button>` : ''}
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
    if(single){
      let v=single.dataset.val; const k=single.dataset.set;
      if(k==='amount'||k==='weeks') v=+v;
      _A[k]=v;
      // elegir lugar precarga su material típico (el paso siguiente lo afina)
      if(k==='place' && typeof gearItemsOfPlace==='function') _A.gear = gearItemsOfPlace(v);
      if(_i<steps().length-1) _i++;
      render(); return;
    }
    const multi = e.target.closest('[data-multi]');
    if(multi){
      const k=multi.dataset.multi;
      // 'days' son índices numéricos; 'gear'/'injuries' son claves de texto
      const v = (k==='days') ? +multi.dataset.val : multi.dataset.val;
      const arr=_A[k]||(_A[k]=[]); const j=arr.indexOf(v);
      if(j>=0) arr.splice(j,1); else arr.push(v);
      render(); return;
    }
    const nav = e.target.closest('[data-nav]');
    if(nav){
      const a=nav.dataset.nav;
      if(a==='back'){ if(_i>0){ _i--; render(); } return; }
      if(a==='quickdefault'){ _i = steps().length-1; render(); return; }   // salta al resumen con defaults
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
      // guarda el perfil: lo usarán el generador y el modo entrenamiento
      const prof = (typeof spProfileSet==='function')
        ? spProfileSet({level:_A.level, gear:(_A.gear&&_A.gear.length)?_A.gear:['ninguno'], injuries:_A.injuries||[]})
        : null;

      // Recuperación 48 h: reordena los slots para que dos días seguidos
      // no repitan grupo muscular. Con 4 días seguidos de pecho no se
      // adapta nada: el músculo necesita ~48 h para resintetizar proteína.
      const order = spaceSlots(slotsDef, days);

      days.forEach((wd, k)=>{
        const disc = _A.daySport[wd] || _A.disc;
        const slot = order[k];
        let sess = buildSessionByCriteria(slot.m, dur, intensity, disc, {profile:prof});
        if(!sess) sess = buildSessionByCriteria(slot.m, dur, intensity, 'all', {profile:prof});
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
