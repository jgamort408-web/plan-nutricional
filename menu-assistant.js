/* ══════════════════════════════════════════════════════════
   ASISTENTE DE MENÚ · creación guiada del Plan Semanal
   ----------------------------------------------------------
   Pregunta paso a paso (Desayuno → Comida → Merienda → Cena),
   ofrece recetas filtrables por característica (tipo de alimento)
   respetando las restricciones de las personas, y el usuario elige
   las que le apetecen. Al terminar, reparte las elecciones por los
   7 días de la semana (round-robin) y las escribe en el Plan Semanal.

   El escalado por necesidad de cada comida (y el reparto si una celda
   tuviera varias recetas) lo resuelve el motor del calendario (Fase 2b),
   así que aquí solo decidimos QUÉ recetas van en cada franja.
   ========================================================== */
(function(){
  'use strict';

  // Orden y textos de cada paso (usa las CATEGORIES reales del catálogo).
  const STEP_META = {
    des: {ico:'🌅', title:'Desayunos',  hint:'¿Qué te apetece desayunar esta semana? Elige una o varias y las repartiré por los días.'},
    com: {ico:'🍽️', title:'Comidas',    hint:'Elige tus platos principales. Te sugiero variar proteínas (legumbre, pescado, carne blanca…). Yo reparto por la semana.'},
    mer: {ico:'🍎', title:'Meriendas',  hint:'¿Qué quieres merendar? Si eliges pocas, las iré alternando.'},
    cen: {ico:'🌙', title:'Cenas',      hint:'Elige tus cenas. Quedan más ligeras y suelen complementar la comida del día.'}
  };

  let _steps = [];        // ['des','com','mer','cen'] (según CATEGORIES)
  let _i = 0;             // paso actual
  let _sel = {};          // {catKey: Set(ids)}
  let _filter = {};       // {catKey: foodTypeKey | 'all'}
  let _root = null;

  function esc(s){ return (typeof escHtml==='function') ? escHtml(s) : String(s==null?'':s); }

  // Restricciones combinadas de todas las personas activas.
  function activeRestrictions(){
    if(typeof PEOPLE==='undefined') return [];
    return [...new Set(PEOPLE.flatMap(id => (TARGETS[id]||{}).restr || []))];
  }
  function violates(id){
    if(typeof dishViolations === 'function') return dishViolations(id).length > 0;
    return false;
  }

  // Recetas candidatas de una categoría (sin "libre"/"loose", respetando restricciones).
  function candidates(cat){
    return Object.keys(DISHES).filter(id=>{
      const d = DISHES[id];
      return d && d.cat===cat && !d.libre && !d.loose && !violates(id);
    });
  }
  // Tipos de alimento presentes entre las candidatas (para los filtros).
  function typesFor(ids){
    const set = new Set();
    ids.forEach(id=> (DISHES[id].food||[]).forEach(f=>{ if(FOOD_TYPES[f]) set.add(f); }));
    // Orden estable según FOOD_TYPES
    return Object.keys(FOOD_TYPES).filter(k=> set.has(k));
  }

  function open(){
    if(typeof DISHES==='undefined' || typeof CATEGORIES==='undefined'){ return; }
    _steps = CATEGORIES.map(c=>c.key).filter(k=> STEP_META[k]);
    _i = 0; _sel = {}; _filter = {};
    _steps.forEach(k=>{ _sel[k] = new Set(); _filter[k] = 'all'; });

    // Precarga: si el plan ya tiene recetas en una franja, márcalas como elegidas.
    try{
      Object.values(CalState.data).forEach(day=>{
        _steps.forEach(k=>{ (day[k]||[]).forEach(id=>{ if(DISHES[id]) _sel[k].add(id); }); });
      });
    }catch(e){}

    if(!_root){
      _root = document.createElement('div');
      _root.id = 'menuAsst';
      _root.className = 'masst';
      document.body.appendChild(_root);
      _root.addEventListener('click', onClick);
    }
    document.body.classList.add('no-scroll');
    render();
  }

  function close(){
    if(_root){ _root.classList.remove('show'); }
    document.body.classList.remove('no-scroll');
  }

  function cat(){ return _steps[_i]; }

  function render(){
    const k = cat();
    const meta = STEP_META[k];
    const all = candidates(k);
    const types = typesFor(all);
    const ft = _filter[k];
    const list = all.filter(id => ft==='all' || (DISHES[id].food||[]).includes(ft));
    const selSet = _sel[k];

    const pills = [`<button class="masst-pill ${ft==='all'?'on':''}" data-ft="all">Todas</button>`]
      .concat(types.map(t=>`<button class="masst-pill ${ft===t?'on':''}" data-ft="${t}">${FOOD_TYPES[t].ico} ${esc(FOOD_TYPES[t].short||FOOD_TYPES[t].lbl)}</button>`))
      .join('');

    const cards = list.length ? list.map(id=>{
      const d = DISHES[id];
      const on = selSet.has(id);
      const foods = (d.food||[]).slice(0,4).map(f=>FOOD_TYPES[f]?FOOD_TYPES[f].ico:'').join('');
      return `<button class="masst-card ${on?'on':''}" data-pick="${id}">
        <span class="masst-card-ic">${d.icon||meta.ico}</span>
        <span class="masst-card-b">
          <span class="masst-card-n">${esc(d.nom)}</span>
          <span class="masst-card-f">${foods}</span>
        </span>
        <span class="masst-card-chk">${on?'✓':'＋'}</span>
      </button>`;
    }).join('') : `<div class="masst-empty">No hay recetas disponibles aquí con las restricciones actuales. Crea recetas o ajusta restricciones en Usuarios.</div>`;

    const nSel = selSet.size;
    const isLast = _i === _steps.length-1;

    _root.innerHTML = `
      <div class="masst-bg" data-close="1"></div>
      <div class="masst-panel" role="dialog" aria-label="Asistente de menú">
        <div class="masst-hd">
          <div class="masst-steps">${_steps.map((s,idx)=>`<span class="masst-dot ${idx===_i?'on':''} ${idx<_i?'done':''}">${STEP_META[s].ico}</span>`).join('')}</div>
          <button class="masst-x" data-close="1" aria-label="Cerrar">✕</button>
        </div>
        <div class="masst-body">
          <h2 class="masst-title">${meta.ico} ${esc(meta.title)} <small>paso ${_i+1} de ${_steps.length}</small></h2>
          <p class="masst-hint">${esc(meta.hint)}</p>
          <div class="masst-filters">${pills}</div>
          <div class="masst-grid">${cards}</div>
        </div>
        <div class="masst-foot">
          <span class="masst-count">${nSel} elegida${nSel===1?'':'s'}</span>
          <div class="masst-actions">
            ${_i>0 ? `<button class="masst-btn ghost" data-nav="back">← Atrás</button>` : ''}
            <button class="masst-btn ghost" data-nav="skip">Omitir</button>
            <button class="masst-btn primary" data-nav="next">${isLast ? '✓ Crear menú' : 'Siguiente →'}</button>
          </div>
        </div>
      </div>`;
    _root.classList.add('show');
    const body = _root.querySelector('.masst-body'); if(body) body.scrollTop = 0;
  }

  function onClick(e){
    const close1 = e.target.closest('[data-close]');
    if(close1){ close(); return; }
    const pill = e.target.closest('[data-ft]');
    if(pill){ _filter[cat()] = pill.dataset.ft; render(); return; }
    const card = e.target.closest('[data-pick]');
    if(card){
      const id = card.dataset.pick; const s = _sel[cat()];
      if(s.has(id)) s.delete(id); else s.add(id);
      render(); return;
    }
    const nav = e.target.closest('[data-nav]');
    if(nav){
      const act = nav.dataset.nav;
      if(act==='back'){ if(_i>0){ _i--; render(); } return; }
      if(act==='skip'){ advance(true); return; }
      if(act==='next'){ advance(false); return; }
    }
  }

  function advance(skip){
    if(skip) _sel[cat()] = new Set();   // omitir = no tocar esta franja
    if(_i < _steps.length-1){ _i++; render(); return; }
    finish();
  }

  // Reparte las elecciones por los 7 días (round-robin) y escribe el plan.
  function finish(){
    const days = (typeof WEEK_DAYS!=='undefined') ? WEEK_DAYS.map(d=>d.k) : ['lun','mar','mie','jue','vie','sab','dom'];
    let touched = 0;
    _steps.forEach(k=>{
      const sel = [..._sel[k]];
      if(!sel.length) return;            // franja omitida → se deja como estaba
      days.forEach((day, idx)=>{
        if(!CalState.data[day]) CalState.data[day] = {};
        CalState.data[day][k] = [ sel[idx % sel.length] ];
        touched++;
      });
    });
    if(touched){
      CalState.modified = true;
      if(typeof persistCal === 'function') persistCal();
      if(typeof renderCalendar === 'function') renderCalendar();
    }
    close();
    // Lleva al usuario al Plan Semanal para revisar.
    try{ if(typeof switchView==='function') switchView('cal'); }catch(e){}
    if(typeof pnToast === 'function' && touched) pnToast('Menú creado con tus elecciones. Revisa y ajusta lo que quieras.');
  }

  // Lanzador (botón del Plan Semanal).
  function wire(){
    const b = document.getElementById('calAssistant');
    if(b && !b._asstWired){ b._asstWired = true; b.addEventListener('click', open); }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, {once:true});
  else wire();

  window.openMenuAssistant = open;
})();
