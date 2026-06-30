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
  let _first = false;     // sólo anima el panel en la primera pintura (evita repetir la animación en cada clic)

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
    const hidden = (typeof dishHiddenByCuisine==='function') ? dishHiddenByCuisine : ()=>false;
    return Object.keys(DISHES).filter(id=>{
      const d = DISHES[id];
      return d && d.cat===cat && !d.libre && !d.loose && !violates(id) && !hidden(id);
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
      // Swipe móvil: izquierda = siguiente paso, derecha = paso anterior.
      if(typeof pnSwipe==='function') pnSwipe(_root,
        ()=>{ if(_i<_steps.length-1) advance(false); },
        ()=>{ if(_i>0){ _i--; render(); } },
        { guard:(t)=> !!(t.closest && t.closest('.masst-pill')) });
    }
    document.body.classList.add('no-scroll');
    _first = true;
    render();
  }

  function close(){
    if(_root){ _root.classList.remove('show'); }
    document.body.classList.remove('no-scroll');
  }

  function cat(){ return _steps[_i]; }

  // ── Guía nutricional (no bloqueante) ──────────────────────
  // Simula el reparto round-robin de las elecciones en los 7 días (igual que finish())
  // para anticipar si alguna recomendación semanal se queda corta o se excede.
  function simulatedData(){
    const days = (typeof WEEK_DAYS!=='undefined') ? WEEK_DAYS.map(d=>d.k) : ['lun','mar','mie','jue','vie','sab','dom'];
    const data = {};
    _steps.forEach(s=>{
      const sel = [..._sel[s]];
      if(!sel.length) return;
      days.forEach((day, idx)=>{ (data[day]=data[day]||{})[s] = [ sel[idx % sel.length] ]; });
    });
    return data;
  }
  function countsFrom(data, scope){
    const counts = {};
    Object.values(data).forEach(day=>{
      Object.entries(day).forEach(([slot, arr])=>{
        if(!arr || !arr.length) return;
        if(scope==='com' && slot!=='com') return;
        const seen = new Set();
        arr.forEach(id=>{ const d=DISHES[id]; if(!d) return; (d.food||[]).forEach(t=>{ if(seen.has(slot+':'+t)) return; seen.add(slot+':'+t); counts[t]=(counts[t]||0)+1; }); });
      });
    });
    return counts;
  }
  // Evalúa WEEKLY_GUIDE sobre las elecciones actuales → tipos "excedidos" / "al límite".
  function guidance(){
    const empty = {over:new Set(), near:new Set(), items:[]};
    if(typeof WEEKLY_GUIDE==='undefined') return empty;
    const data = simulatedData();
    const com = countsFrom(data,'com'), all = countsFrom(data,'all');
    const over=new Set(), near=new Set(), items=[];
    WEEKLY_GUIDE.forEach(g=>{
      const fk = g.foodKey || g.k; const v = (g.scope==='com'?com:all)[fk] || 0;
      let status = null;
      if((g.target===0 && v>0) || v>g.max) status='over';
      else if(v===g.max && g.max>0) status='near';
      if(status==='over'){ over.add(fk); items.push({fk,g,v,status}); }
      else if(status==='near'){ near.add(fk); items.push({fk,g,v,status}); }
    });
    return {over, near, items};
  }
  function guidanceHtml(gd){
    if(!gd.items.length) return `<div class="masst-guide ok">✓ De momento tus elecciones encajan con las recomendaciones de la semana.</div>`;
    const chips = gd.items.slice(0,6).map(it=>{
      const ftd = FOOD_TYPES[it.fk] || {ico:'•', short:it.g.lbl};
      const lim = it.g.target===0 ? `máx ${it.g.max}/sem` : `${it.g.target}–${it.g.max}/sem`;
      return `<span class="mg-chip ${it.status}">${ftd.ico} ${esc(ftd.short||ftd.lbl)} <b>${it.v}</b> <small>${lim}</small></span>`;
    }).join('');
    return `<div class="masst-guide warn"><span class="mg-h">⚠ Revisa</span>${chips}<span class="mg-note">Puedes elegirlo igualmente.</span></div>`;
  }
  // Clase de aviso para una tarjeta según los tipos excedidos/al límite.
  function cardWarnClass(id, gd){
    const foods = (DISHES[id].food||[]);
    if(foods.some(f=> gd.over.has(f))) return 'warn-over';
    if(foods.some(f=> gd.near.has(f))) return 'warn-near';
    return '';
  }

  function render(){
    const k = cat();
    const meta = STEP_META[k];
    const all = candidates(k);
    const types = typesFor(all);
    const ft = _filter[k];
    const list = all.filter(id => ft==='all' || (DISHES[id].food||[]).includes(ft));
    const selSet = _sel[k];
    const gd = guidance();

    const pills = [`<button class="masst-pill ${ft==='all'?'on':''}" data-ft="all">Todas</button>`]
      .concat(types.map(t=>`<button class="masst-pill ${ft===t?'on':''}" data-ft="${t}">${FOOD_TYPES[t].ico} ${esc(FOOD_TYPES[t].short||FOOD_TYPES[t].lbl)}</button>`))
      .join('');

    const cards = list.length ? list.map(id=>{
      const d = DISHES[id];
      const on = selSet.has(id);
      const foods = (d.food||[]).slice(0,4).map(f=>FOOD_TYPES[f]?FOOD_TYPES[f].ico:'').join('');
      const warn = cardWarnClass(id, gd);
      return `<button class="masst-card ${on?'on':''} ${warn}" data-pick="${id}" data-foods="${(d.food||[]).join(',')}">
        <span class="masst-card-ic">${d.icon||meta.ico}</span>
        <span class="masst-card-b">
          <span class="masst-card-n">${esc(d.nom)}</span>
          <span class="masst-card-f">${foods}</span>
        </span>
        <span class="masst-card-warn">⚠</span>
        <span class="masst-card-chk">${on?'✓':'＋'}</span>
      </button>`;
    }).join('') : `<div class="masst-empty">No hay recetas disponibles aquí con las restricciones actuales. Crea recetas o ajusta restricciones en Usuarios.</div>`;

    const nSel = selSet.size;
    const isLast = _i === _steps.length-1;

    _root.innerHTML = `
      <div class="masst-bg" data-close="1"></div>
      <div class="masst-panel${_first?' anim':''}" role="dialog" aria-label="Asistente de menú">
        <div class="masst-hd">
          <div class="masst-steps">${_steps.map((s,idx)=>`<span class="masst-dot ${idx===_i?'on':''} ${idx<_i?'done':''}">${STEP_META[s].ico}</span>`).join('')}</div>
          <button class="masst-x" data-close="1" aria-label="Cerrar">✕</button>
        </div>
        <div class="masst-body">
          <h2 class="masst-title">${meta.ico} ${esc(meta.title)} <small>paso ${_i+1} de ${_steps.length}</small></h2>
          <p class="masst-hint">${esc(meta.hint)}</p>
          <div class="masst-guide-wrap">${guidanceHtml(gd)}</div>
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
    _first = false;
    const body = _root.querySelector('.masst-body'); if(body) body.scrollTop = 0;
  }

  function onClick(e){
    const close1 = e.target.closest('[data-close]');
    if(close1){ close(); return; }
    const pill = e.target.closest('[data-ft]');
    if(pill){ _filter[cat()] = pill.dataset.ft; render(); return; }
    const card = e.target.closest('[data-pick]');
    if(card){
      // Actualización in-situ: togglear solo esta tarjeta y el contador, SIN re-render
      // completo, para no perder la posición de scroll (el usuario no debe "volver arriba").
      const id = card.dataset.pick; const s = _sel[cat()];
      const on = !s.has(id);
      if(on) s.add(id); else s.delete(id);
      card.classList.toggle('on', on);
      const chk = card.querySelector('.masst-card-chk'); if(chk) chk.textContent = on ? '✓' : '＋';
      const nSel = s.size;
      const cnt = _root.querySelector('.masst-count');
      if(cnt) cnt.textContent = `${nSel} elegida${nSel===1?'':'s'}`;
      // Recalcula la guía nutricional y re-sombrea las tarjetas SIN re-render (conserva scroll).
      const gd = guidance();
      const gw = _root.querySelector('.masst-guide-wrap'); if(gw) gw.innerHTML = guidanceHtml(gd);
      _root.querySelectorAll('.masst-card[data-foods]').forEach(c=>{
        c.classList.remove('warn-over','warn-near');
        const w = cardWarnClass(c.dataset.pick, gd); if(w) c.classList.add(w);
      });
      return;
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
