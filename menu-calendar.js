/* ══════════════════════════════════════════════════════════
   MENU CALENDAR · planificación semanal manual
   Estructura: CalState.data[day][slot] = [dishId, dishId, …]
   (array vacío = franja sin nada)
══════════════════════════════════════════════════════════ */

function emptyDay(){ return {des:[], com:[], mer:[], cen:[]}; }
function emptyCal(){
  const o = {};
  WEEK_DAYS.forEach(d => { o[d.k] = emptyDay(); });
  return o;
}

/* Normaliza un calendario en cualquier formato (legacy string|null o array)
   a la estructura nueva con arrays, descartando IDs inexistentes */
function normalizeCalData(raw){
  const out = emptyCal();
  if(!raw || typeof raw !== 'object') return out;
  WEEK_DAYS.forEach(d=>{
    const day = raw[d.k];
    if(!day) return;
    ['des','com','mer','cen'].forEach(s=>{
      const v = day[s];
      let arr = [];
      if(Array.isArray(v)) arr = v.slice();
      else if(typeof v === 'string') arr = [v];
      // limpia ids inexistentes
      out[d.k][s] = arr.filter(id => id && DISHES[id]);
    });
  });
  return out;
}

var CalState = (function(){
  const stored = lsGet(LS.CAL, null);
  const base = {
    id: null,
    name: 'Semana sin guardar',
    data: emptyCal(),
    modified: false
  };
  if(stored && stored.data){
    return Object.assign(base, stored, { data: normalizeCalData(stored.data) });
  }
  return base;
})();

function persistCal(){ lsSet(LS.CAL, CalState); }

function updateCalSub(){
  const sub = document.getElementById('calSub');
  if(!sub) return;
  let filledSlots = 0, totalDishes = 0;
  Object.values(CalState.data).forEach(day=>{
    Object.values(day).forEach(arr=>{
      if(arr.length){ filledSlots++; totalDishes += arr.length; }
    });
  });
  const isDefault = (CalState.name === 'Semana sin guardar');
  const base = CalState.id
    ? `Editando «${CalState.name}»`
    : (isDefault ? 'Menú sin guardar' : `Borrador «${CalState.name}»`);
  const extra = totalDishes > filledSlots ? ` · ${totalDishes} recetas` : '';
  // No repetir "sin guardar" cuando el propio estado ya es "Menú sin guardar"
  const dirty = (CalState.modified && !isDefault) ? ' · sin guardar' : '';
  sub.textContent = `${base} · ${filledSlots}/28 franjas${extra}${dirty}`;
  const title = document.getElementById('calTitle');
  if(title){
    // El H1 muestra el nombre del menú; si aún no tiene, el rótulo de la sección
    title.childNodes[0].nodeValue = isDefault ? 'Plan Semanal' : CalState.name;
  }
}

/* ══════════════════════════════════════════════════════════
   WEEKLY COUNTERS
══════════════════════════════════════════════════════════ */
function weeklyCounts(scope){
  // scope: 'com' (solo comida) | 'all' | 'cen'
  // Cuenta por DÍA (no por ración): si un día tiene legumbre+pescado en la
  // comida cuenta 1 día de legumbre y 1 de pescado.
  const counts = {};
  Object.values(CalState.data).forEach(day=>{
    Object.entries(day).forEach(([slot, arr])=>{
      if(!arr.length) return;
      if(scope === 'com' && slot !== 'com') return;
      if(scope === 'cen' && slot !== 'cen') return;
      const seen = new Set();
      arr.forEach(dishId=>{
        const d = DISHES[dishId];
        if(!d) return;
        (d.food||[]).forEach(k=>{
          if(seen.has(slot+':'+k)) return;
          seen.add(slot+':'+k);
          counts[k] = (counts[k]||0) + 1;
        });
      });
    });
  });
  return counts;
}

function guideStatus(v, target, max){
  if(v === 0 && target === 0) return GUIDE_STATUS.ok;
  if(v === 0) return GUIDE_STATUS.empty;
  if(target === 0 && v > 0) return GUIDE_STATUS.over;
  if(v > max) return GUIDE_STATUS.over;
  if(v >= target && v <= max) return v === max ? GUIDE_STATUS.near : GUIDE_STATUS.ok;
  if(v < target) return GUIDE_STATUS.low;
  return GUIDE_STATUS.ok;
}

/* ══════════════════════════════════════════════════════════
   RENDER CALENDAR
══════════════════════════════════════════════════════════ */
const MEAL_ROWS = [
  {k:'des', lbl:'Desayuno', ico:'☀️'},
  {k:'com', lbl:'Comida',   ico:'🍽'},
  {k:'mer', lbl:'Merienda', ico:'🍎'},
  {k:'cen', lbl:'Cena',     ico:'🌙'}
];

function renderCalendar(){
  const grid = document.getElementById('calGrid');
  if(!grid) return;
  renderRestrictionsBanner();
  const isMobile = window.matchMedia('(max-width:760px)').matches;
  grid.innerHTML = isMobile ? renderCalMobile() : renderCalDesktop();
  bindCalCells();
  renderGuide();
  updateCalSub();
}

function renderRestrictionsBanner(){
  const wrap = document.getElementById('calRestrBanner');
  if(!wrap) return;
  if(!CalState || !CalState.data) return;   // módulo aún no inicializado
  const all = [...new Set([...(TARGETS.A.restr||[]), ...(TARGETS.B.restr||[])])];
  if(!all.length){ wrap.innerHTML = ''; return; }

  // Cuenta violaciones en el calendario actual
  let viols = 0;
  Object.values(CalState.data).forEach(day=>{
    Object.values(day).forEach(arr=>{
      arr.forEach(id=>{ if(dishViolations(id, 'AB').length) viols++; });
    });
  });

  const aLbls = (TARGETS.A.restr||[]).map(k=>RESTRICTIONS_MAP[k]?.lbl).filter(Boolean);
  const bLbls = (TARGETS.B.restr||[]).map(k=>RESTRICTIONS_MAP[k]?.lbl).filter(Boolean);
  const allLbl = all.map(k=>{
    const r = RESTRICTIONS_MAP[k]; if(!r) return '';
    return `<span class="rb-chip">${r.ico} ${r.lbl}</span>`;
  }).join('');

  wrap.innerHTML = `
    <div class="restr-banner ${viols?'warn':''}">
      <div class="rb-icon">${viols?'⚠':'🚫'}</div>
      <div class="rb-body">
        <div class="rb-t">Restricciones activas · se aplican al autocompletar</div>
        <div class="rb-chips">${allLbl}</div>
        ${viols ? `<div class="rb-warn">${viols} receta${viols>1?'s':''} actual${viols>1?'es':''} rompe${viols>1?'n':''} alguna restricción. Pulsa <strong>✨ Autocompletar</strong> para resolverlas.</div>` : ''}
      </div>
      <button class="rb-edit" id="rbEdit" title="Editar restricciones">✎ Editar</button>
    </div>`;

  const btn = document.getElementById('rbEdit');
  if(btn) btn.addEventListener('click', ()=> openSettings('personas'));
}

function renderCalDesktop(){
  let html = '<div class="cal-grid">';
  html += '<div class="cal-corner"></div>';
  WEEK_DAYS.forEach(d=>{
    const t = WEEK_TEMPLATE[d.k];
    html += `<div class="cal-dayh">${d.long}<small>${escAttr((t&&t.com)||'')}</small></div>`;
  });
  MEAL_ROWS.forEach(row=>{
    html += `<div class="cal-rowh"><div class="rhi">${row.ico}</div>${row.lbl}</div>`;
    WEEK_DAYS.forEach(d=>{
      html += calCellHtml(d.k, row.k);
    });
  });
  // Fila de totales diarios
  html += `<div class="cal-rowh totals-h"><div class="rhi">∑</div>Total día</div>`;
  WEEK_DAYS.forEach(d=>{
    html += dayTotalsCellHtml(d.k);
  });
  html += '</div>';
  return html;
}

function dayTotalsCellHtml(day){
  const totals = dayTotalsFor(CalState.data, day);
  const filled = Object.values(CalState.data[day]||{}).some(a=>Array.isArray(a)&&a.length);
  if(!filled){
    return `<div class="cal-dtot empty">—</div>`;
  }
  // Calcula desviación principal (kcal) para A, B, AB según persona activa
  const stKcal = (val, target) => {
    if(!target) return 'st-empty';
    const r = val / target;
    if(r < .85)  return 'st-low';
    if(r > 1.10) return 'st-over';
    if(r > 1.03) return 'st-near';
    return 'st-on';
  };
  let scope, vA, vB, tA, tB;
  vA = totals.A.k; vB = totals.B.k;
  tA = TARGETS.A.kcal; tB = TARGETS.B.kcal;
  let cls;
  if(S.p === 'A') cls = stKcal(vA, tA);
  else if(S.p === 'B') cls = stKcal(vB, tB);
  else {
    const a = stKcal(vA, tA), b = stKcal(vB, tB);
    // peor de los dos
    const order = {'st-on':0,'st-near':1,'st-low':2,'st-over':3};
    cls = order[a] >= order[b] ? a : b;
  }
  const showVal = S.p === 'A' ? `${vA}` : S.p === 'B' ? `${vB}` : `${vA}·${vB}`;
  const showTgt = S.p === 'A' ? `/${tA}` : S.p === 'B' ? `/${tB}` : `/${tA}·${tB}`;
  // ratio del macro principal para mostrar en pequeñito
  const pctA = tA ? Math.round(vA/tA*100) : 0;
  const pctB = tB ? Math.round(vB/tB*100) : 0;
  const pct = S.p === 'A' ? pctA : S.p === 'B' ? pctB : Math.round((pctA+pctB)/2);
  // macros sumados del día (P/F/C) para la persona activa + objetivo
  const macTarget = (val, tgt)=>{
    if(!tgt) return 'm-on';
    const r = val/tgt;
    if(r < .80) return 'm-low';
    if(r > 1.15) return 'm-over';
    return 'm-on';
  };
  const macCell = (lbl, vA2, vB2, tA2, tB2)=>{
    const v = S.p==='B' ? vB2 : vA2;
    const t = S.p==='B' ? tB2 : tA2;
    const show = S.p==='AB' ? `${vA2}·${vB2}` : `${v}`;
    const cls = S.p==='AB'
      ? (['m-over','m-low','m-on'].find(c=> c===macTarget(vA2,tA2) || c===macTarget(vB2,tB2)) || 'm-on')
      : macTarget(v,t);
    return `<span class="cdt-m ${cls}"><i>${lbl}</i>${show}</span>`;
  };
  const macsHtml = `<div class="cdt-macs">
    ${macCell('P', totals.A.p, totals.B.p, TARGETS.A.p, TARGETS.B.p)}
    ${macCell('G', totals.A.f, totals.B.f, TARGETS.A.f, TARGETS.B.f)}
    ${macCell('C', totals.A.c, totals.B.c, TARGETS.A.c, TARGETS.B.c)}
  </div>`;
  const macTitle = `Macros día — A: P${totals.A.p}/${TARGETS.A.p} G${totals.A.f}/${TARGETS.A.f} C${totals.A.c}/${TARGETS.A.c} · B: P${totals.B.p}/${TARGETS.B.p} G${totals.B.f}/${TARGETS.B.f} C${totals.B.c}/${TARGETS.B.c}`;
  return `<div class="cal-dtot ${cls}" title="A: ${vA}/${tA} (${pctA}%) · B: ${vB}/${tB} (${pctB}%)&#10;${macTitle}">
    <div class="cdt-k">${showVal}<span class="cdt-t">${showTgt}</span></div>
    <div class="cdt-pct">${pct}%</div>
    ${macsHtml}
  </div>`;
}

function renderCalMobile(){
  let html = '<div class="cal-grid">';
  WEEK_DAYS.forEach(d=>{
    const t = WEEK_TEMPLATE[d.k];
    const totals = dayTotalsFor(CalState.data, d.k);
    const filled = Object.values(CalState.data[d.k]||{}).some(a=>Array.isArray(a)&&a.length);
    const tA = TARGETS.A.kcal, tB = TARGETS.B.kcal;
    const pctA = tA ? Math.round(totals.A.k/tA*100) : 0;
    const pctB = tB ? Math.round(totals.B.k/tB*100) : 0;
    const macroBadge = filled
      ? `<span class="cdh-macro" title="A: ${totals.A.k}/${tA}kcal · B: ${totals.B.k}/${tB}kcal">${totals.A.k}/${totals.B.k} kcal · ${pctA}/${pctB}%</span>`
      : '';
    const macroLine = filled
      ? `<div class="cal-day-macs"><span><i>P</i> ${totals.A.p}/${totals.B.p}g</span><span><i>G</i> ${totals.A.f}/${totals.B.f}g</span><span><i>C</i> ${totals.A.c}/${totals.B.c}g</span></div>`
      : '';
    html += `<div class="cal-day-block">
      <div class="cal-day-hd">${d.long} <small>${escAttr((t&&t.com)||'')}</small> ${macroBadge}</div>
      ${macroLine}`;
    MEAL_ROWS.forEach(row=>{
      html += `<div class="row">
        <div class="row-lbl"><div class="rhi">${row.ico}</div>${row.lbl}</div>
        ${calCellHtml(d.k, row.k)}
      </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function calCellHtml(day, slot){
  const arr = CalState.data[day][slot] || [];
  if(!arr.length){
    return `<div class="cal-cell empty" data-day="${day}" data-slot="${slot}" tabindex="0" role="button" aria-label="Añadir comida">
      <span class="ce-plus">＋</span>
    </div>`;
  }
  // merge food chips (unique) across all dishes in this slot
  const foodSet = new Set();
  arr.forEach(id=>{
    const d = DISHES[id];
    if(d) (d.food||[]).forEach(f => foodSet.add(f));
  });
  const foodOrder = ['leg','cb','cr','pb','pa','apq','hv','pv','qs','js','lac','fs','v','fr','pic','lb'];
  const foods = [...foodSet].sort((a,b)=> foodOrder.indexOf(a) - foodOrder.indexOf(b));
  const foodsHtml = foods.map(k=>{
    const f = FOOD_TYPES[k];
    if(!f) return '';
    return `<span class="food k-${k} compact" title="${f.lbl}"><span class="fi">${f.ico}</span></span>`;
  }).join('');

  // dishes stacked + per-dish violation check (AB scope = both personas)
  let cellViolations = new Set();
  const items = arr.map((id, idx)=>{
    const d = DISHES[id];
    if(!d) return '';
    const viols = dishViolations(id, 'AB');
    viols.forEach(v => cellViolations.add(v));
    const badge = viols.length
      ? `<span class="ce-viol" title="Rompe: ${viols.map(v=>RESTRICTIONS_MAP[v]?.lbl||v).join(', ')}">⚠</span>`
      : '';
    const expKey = `${day}|${slot}|${id}`;
    const isExp = _calExpanded.has(expKey);
    return `<div class="ce-item ${viols.length?'has-viol':''} ${d.libre?'is-libre':''}" data-dish-idx="${idx}">
      <span class="ce-ico">${d.icon}</span>
      <span class="ce-name">${escAttr(d.short || d.nom)}</span>
      ${badge}
      <button class="ce-exp ${isExp?'on':''}" data-exp="${escAttr(expKey)}" title="Ver/ocultar receta" aria-label="Ver receta">▾</button>
    </div>${isExp ? renderCellDetail(id, day, slot) : ''}`;
  }).join('');

  return `<div class="cal-cell filled ${arr.length>1?'multi':''} ${cellViolations.size?'has-viol':''}" data-day="${day}" data-slot="${slot}" tabindex="0" role="button">
    <button class="ce-rm" data-rm="all" aria-label="Vaciar franja">✕</button>
    <div class="ce-stack">${items}</div>
    ${foodsHtml ? `<div class="ce-foods">${foodsHtml}${arr.length>1?`<span class="ce-count">×${arr.length}</span>`:''}</div>` : (arr.length>1?`<div class="ce-foods"><span class="ce-count">×${arr.length}</span></div>`:'')}
  </div>`;
}

function escAttr(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ── Expansión inline de recetas en la celda del calendario ── */
const LS_CAL_EXP = 'mnut:calexp:v1';
let _calExpanded = new Set();
try{ _calExpanded = new Set(JSON.parse(localStorage.getItem(LS_CAL_EXP) || '[]')); }catch(e){}
function persistCalExp(){ try{ localStorage.setItem(LS_CAL_EXP, JSON.stringify([..._calExpanded])); }catch(e){} }

function renderCellDetail(id, day, slot){
  const d = DISHES[id]; if(!d) return '';
  // Escalado por necesidad de comida, con reparto entre las recetas de la celda.
  const ids = (CalState.data[day] && CalState.data[day][slot]) ? CalState.data[day][slot].filter(x=>DISHES[x]) : [id];
  const sStd = sumCellStd(ids);
  const pA = PEOPLE[0] || 'A', pB = PEOPLE[1] || pA;
  const scFor = (pk)=> dishScaledMeal(d, pk, slot, sStd);
  const rnd = n => Math.round(n);
  let kc, mp, mf, mc;
  if(S.p === 'AB'){
    const a = scFor(pA).tot, b = scFor(pB).tot;
    kc = `${rnd(a.k)}·${rnd(b.k)}`; mp = `${rnd(a.p)}·${rnd(b.p)}`; mf = `${rnd(a.f)}·${rnd(b.f)}`; mc = `${rnd(a.c)}·${rnd(b.c)}`;
  } else {
    const t = scFor(S.p).tot; kc = rnd(t.k); mp = rnd(t.p); mf = rnd(t.f); mc = rnd(t.c);
  }
  const persLbl = S.p==='AB' ? 'Todas' : escAttr(((TARGETS[S.p]||{}).name||'').trim() || ('P'+((typeof PEOPLE!=='undefined'?PEOPLE.indexOf(S.p):0)+1)));
  let ingHtml;
  if(d.comp && d.comp.length){
    const scA = scFor(pA), scB = scFor(pB), scOne = (S.p!=='AB') ? scFor(S.p) : null;
    ingHtml = d.comp.map((it, i)=>{
      const nm = foodName(it);
      if(it.cs) return `<li><span class="cd-n">${escAttr(nm)}</span><span class="cd-q">al gusto</span></li>`;
      const q = S.p==='AB'
        ? `${fmtQty(it, scA.rows[i].grams)} / ${fmtQty(it, scB.rows[i].grams)}`
        : fmtQty(it, scOne.rows[i].grams);
      return `<li><span class="cd-n">${escAttr(nm)}</span><span class="cd-q">${escAttr(q)}</span></li>`;
    }).join('');
  } else {
    ingHtml = `<li class="cd-free">${escAttr(d.desc || 'Comida libre — sin desglose.')}</li>`;
  }
  return `<div class="ce-detail">
    <div class="cd-mac"><span class="nutr">${kc} kcal · <b>${mp}</b>P · ${mf}G · ${mc}C </span><small>${persLbl}</small></div>
    <ul class="cd-ings">${ingHtml}</ul>
    <button class="cd-full" data-full="${id}">Ver ficha completa →</button>
  </div>`;
}

function bindCalCells(){
  document.querySelectorAll('.cal-cell').forEach(cell=>{
    const day = cell.dataset.day, slot = cell.dataset.slot;
    cell.addEventListener('click', async e=>{
      if(e.target.dataset.rm === 'all'){
        e.stopPropagation();
        if(CalState.data[day][slot].length === 0) return;
        if(CalState.data[day][slot].length > 1){
          if(!await pnConfirm('¿Vaciar esta franja?\nQuitará '+CalState.data[day][slot].length+' recetas.', {danger:true, okText:'Vaciar'})) return;
        }
        CalState.data[day][slot] = [];
        CalState.modified = true;
        persistCal();
        renderCalendar();
        return;
      }
      // expandir/ocultar receta dentro de la celda
      const expBtn = e.target.closest('.ce-exp');
      if(expBtn){
        e.stopPropagation();
        const key = expBtn.dataset.exp;
        if(_calExpanded.has(key)) _calExpanded.delete(key); else _calExpanded.add(key);
        persistCalExp();
        renderCalendar();
        return;
      }
      // abrir ficha completa
      const fullBtn = e.target.closest('.cd-full');
      if(fullBtn){ e.stopPropagation(); openModal(fullBtn.dataset.full); return; }
      // clic dentro del detalle: no abrir el picker
      if(e.target.closest('.ce-detail')){ return; }
      openPicker(day, slot);
    });
    cell.addEventListener('keydown', e=>{
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPicker(day, slot); }
      if(e.key === 'Delete' || e.key === 'Backspace'){
        if(CalState.data[day][slot].length){
          CalState.data[day][slot] = [];
          CalState.modified = true;
          persistCal();
          renderCalendar();
        }
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════
   PICKER · ahora soporta añadir/quitar varias recetas
══════════════════════════════════════════════════════════ */
let _picker = {day:null, slot:null, search:'', fav:false, mode:'recetas', foodPick:null};

function openPicker(day, slot){
  _picker.day = day;
  _picker.slot = slot;
  _picker.search = '';
  _picker.fav = false;
  _picker.mode = 'recetas';
  _picker.foodPick = null;
  renderPicker();
  document.getElementById('pickerBg').classList.add('show');
  document.body.classList.add('no-scroll');
  setTimeout(()=>{ const s = document.getElementById('pickerSearch'); if(s) s.focus(); }, 50);
}

function closePicker(){
  document.getElementById('pickerBg').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

function renderPicker(){
  const slot = _picker.slot;
  const day = _picker.day;
  const cat = CATEGORIES.find(c => c.key === slot);
  const dayMeta = WEEK_DAYS.find(d => d.k === day);
  const current = CalState.data[day][slot] || [];

  const favOn = !!_picker.fav;
  const dishIds = Object.keys(DISHES)
    .filter(id => DISHES[id].cat === slot && !DISHES[id].loose)
    .filter(id => !(typeof dishHiddenByCuisine === 'function' && dishHiddenByCuisine(id)))
    .filter(id => !favOn || (typeof isDishFav === 'function' && isDishFav(id)))
    .filter(id => {
      if(!_picker.search) return true;
      const q = _picker.search.toLowerCase();
      const d = DISHES[id];
      return (d.nom||'').toLowerCase().includes(q)
          || (d.short||'').toLowerCase().includes(q)
          || (d.food||[]).some(f => (FOOD_TYPES[f]?.lbl||'').toLowerCase().includes(q));
    });

  const tplHint = WEEK_TEMPLATE[day] && WEEK_TEMPLATE[day][slot] ? WEEK_TEMPLATE[day][slot] : '';

  // totales actuales de la franja
  let totK=0,totP=0,totF=0,totC=0;
  current.forEach(id=>{
    const d = DISHES[id]; if(!d) return;
    totK += px(d.kcal); totP += px(d.mac.p); totF += px(d.mac.f); totC += px(d.mac.c);
  });
  const personaLbl = S.p==='AB' ? 'Todas' : (((TARGETS[S.p]||{}).name||'').trim() || ('Persona '+((typeof PEOPLE!=='undefined'?PEOPLE.indexOf(S.p):0)+1)));

  // Controles: favoritos + recetas/alimentos
  const controlsHtml = `
    <div class="picker-ctrls">
      <div class="pk-seg">
        <button class="pk-seg-b ${_picker.mode==='recetas'?'on':''}" data-mode="recetas">🍽️ Recetas</button>
        <button class="pk-seg-b ${_picker.mode==='alimentos'?'on':''}" data-mode="alimentos">🍎 Alimentos</button>
      </div>
      ${_picker.mode==='recetas' ? `<button class="pk-fav ${favOn?'on':''}" data-favtog>${favOn?'★':'☆'} Favoritos</button>` : ''}
    </div>`;

  // Lista de alimentos sueltos (modo alimentos)
  const FOODS_ = window.FOODS || (typeof FOODS!=='undefined'?FOODS:{});
  const norm = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  let foodListHtml = '';
  if(_picker.mode === 'alimentos'){
    const q = norm(_picker.search);
    const fids = Object.keys(FOODS_)
      .filter(id => !FOODS_[id].loose)
      .filter(id => !q || norm(FOODS_[id].name).includes(q))
      .sort((a,b)=> FOODS_[a].name.localeCompare(FOODS_[b].name,'es'))
      .slice(0, 200);
    foodListHtml = fids.length ? fids.map(id=>{
      const f = FOODS_[id];
      const hasUnit = !!(f.unit && f.unit.g);
      const open = _picker.foodPick === id;
      const sec = (typeof FOOD_SECTIONS!=='undefined' && FOOD_SECTIONS[f.sec]) ? FOOD_SECTIONS[f.sec].ico : '🍎';
      return `<div class="pk-food ${open?'open':''}" data-food="${id}">
        <div class="pk-food-row">
          <span class="pi-ico">${sec}</span>
          <span class="pk-food-n">${escAttr(f.name)}</span>
          <span class="pk-food-k">${f.kcal||0} kcal/100g</span>
        </div>
        ${open ? `<div class="pk-food-add">
          <input class="pk-qty" type="number" min="0" step="any" value="${hasUnit?1:100}" inputmode="decimal">
          <select class="pk-unit">${hasUnit?`<option value="u">${escAttr(f.unit.lbl||'ud')}</option>`:''}<option value="g">gramos</option></select>
          <button class="pk-add-b" data-add="${id}">Añadir</button>
        </div>` : ''}
      </div>`;
    }).join('') : `<div class="picker-empty">Sin alimentos para “${escAttr(_picker.search)}”</div>`;
  }

  const body = document.getElementById('pickerBodyOuter');
  body.innerHTML = `
    <div class="form-hd">
      <h2>${cat.icon} ${cat.label} · ${dayMeta.long}</h2>
      <span class="form-sub">${tplHint ? 'Sugerencia PDF: '+escAttr(tplHint) : 'Puedes añadir varias recetas en la misma franja'}</span>
    </div>
    <div class="picker-body">

      <div class="picker-current" id="pickerCurrent">
        ${current.length ? `
          <div class="picker-cur-hd">
            <span class="pch-t">En esta franja · ${current.length} receta${current.length>1?'s':''}</span>
            <span class="pch-tot"><span class="nutr">${totK} kcal · ${totP}P · ${totF}G · ${totC}C </span><small>(${personaLbl})</small></span>
          </div>
          <div class="picker-cur-list">
            ${current.map((id, idx)=>{
              const d = DISHES[id]; if(!d) return '';
              return `<div class="picker-cur-it">
                <span class="pi-ico-sm">${d.icon}</span>
                <span class="pi-n-sm">${escAttr(d.nom)}</span>
                <span class="pi-k nutr">${px(d.kcal)} kcal</span>
                <button class="picker-cur-rm" data-rm-idx="${idx}" aria-label="Quitar">✕</button>
              </div>`;
            }).join('')}
          </div>
        ` : `<div class="picker-cur-empty">Franja vacía — elige una o varias recetas</div>`}
      </div>

      ${controlsHtml}
      <div class="picker-search">
        <input id="pickerSearch" type="text" placeholder="${_picker.mode==='alimentos'?'Buscar alimento (manzana, yogur, arroz…)':'Buscar receta o tipo (legumbre, pescado azul…)'}" value="${escAttr(_picker.search)}">
      </div>
      <div class="picker-list">
        ${_picker.mode==='alimentos' ? foodListHtml : (dishIds.length ? dishIds.map(id=>{
          const d = DISHES[id];
          const added = current.includes(id);
          const viols = dishViolations(id, 'AB');
          const violBadge = viols.length
            ? `<span class="pi-viol" title="${viols.map(v=>RESTRICTIONS_MAP[v]?.lbl||v).join(', ')}">⚠ ${viols.map(v=>RESTRICTIONS_MAP[v]?.ico).join('')}</span>`
            : '';
          return `
            <div class="picker-it ${added?'sel':''} ${viols.length?'has-viol':''}" data-pick="${id}">
              <div class="pi-ico">${d.icon}</div>
              <div class="pi-body">
                <div class="pi-n">${escHtml(d.nom)}${added?' <span class="pi-added">✓ añadido</span>':''}${violBadge}</div>
                <div class="pi-m">
                  <span class="nutr">${d.kcal[0]}/${d.kcal[1]} kcal</span>
                  <span class="nutr">·</span>
                  <span>${d.t}</span>
                </div>
              </div>
              <div class="pi-foods">${foodChipsHtml(d, {compact:true})}</div>
            </div>`;
        }).join('') : `<div class="picker-empty">Sin recetas para “${escAttr(_picker.search)}”</div>`)}
      </div>
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="pickerNew">＋ Nueva receta</button>
      <button class="btn-sec" id="pickerSuggest" title="Rellena esta franja con una sugerencia del generador, teniendo en cuenta el resto de la semana">🎲 Sugerir</button>
      <button class="btn-prim" id="pickerDone">Listo</button>
    </div>`;

  // search
  const sInput = document.getElementById('pickerSearch');
  sInput.addEventListener('input', ()=>{
    _picker.search = sInput.value;
    const caret = sInput.selectionStart;
    const scrollTop = body.scrollTop;
    renderPicker();
    const ns = document.getElementById('pickerSearch');
    if(ns){ ns.focus(); try{ ns.setSelectionRange(caret, caret); }catch(e){} }
    body.scrollTop = scrollTop;
  });

  // toggle (click on a recipe → add or remove)
  body.querySelectorAll('.picker-it').forEach(it=>{
    it.addEventListener('click', ()=>{
      const id = it.dataset.pick;
      const arr = CalState.data[_picker.day][_picker.slot];
      const i = arr.indexOf(id);
      if(i >= 0) arr.splice(i, 1);
      else arr.push(id);
      CalState.modified = true;
      persistCal();
      renderPicker();
      renderCalendar();
    });
  });

  // remove specific from current
  body.querySelectorAll('[data-rm-idx]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.stopPropagation();
      const idx = +b.dataset.rmIdx;
      CalState.data[_picker.day][_picker.slot].splice(idx, 1);
      CalState.modified = true;
      persistCal();
      renderPicker();
      renderCalendar();
    });
  });

  document.getElementById('pickerDone').addEventListener('click', closePicker);
  const nw = document.getElementById('pickerNew');
  if(nw) nw.addEventListener('click', ()=>{
    closePicker();
    openRecipeForm(_picker.slot);
  });

  // 🎲 Sugerencia automática para esta franja (respeta el resto de la semana)
  const sg = document.getElementById('pickerSuggest');
  if(sg) sg.addEventListener('click', ()=>{
    const id = suggestForSlot(_picker.day, _picker.slot);
    if(!id){ if(typeof pnToast==='function') pnToast('No hay recetas candidatas para esta franja.', 'warn'); return; }
    CalState.data[_picker.day][_picker.slot] = [id];
    CalState.modified = true;
    persistCal();
    renderPicker();
    renderCalendar();
  });

  // Segmento Recetas/Alimentos
  body.querySelectorAll('[data-mode]').forEach(b=>{
    b.addEventListener('click', ()=>{ _picker.mode = b.dataset.mode; _picker.foodPick = null; renderPicker(); });
  });
  // Toggle Favoritos (modo recetas)
  const favT = body.querySelector('[data-favtog]');
  if(favT) favT.addEventListener('click', ()=>{ _picker.fav = !_picker.fav; renderPicker(); });
  // Expandir/contraer un alimento para indicar cantidad
  body.querySelectorAll('.pk-food-row').forEach(row=>{
    row.addEventListener('click', ()=>{
      const id = row.parentElement.dataset.food;
      _picker.foodPick = (_picker.foodPick === id) ? null : id;
      const sc = body.scrollTop; renderPicker(); body.scrollTop = sc;
    });
  });
  // Añadir alimento suelto a la franja
  body.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      const id = btn.dataset.add;
      const food = FOODS_[id]; if(!food) return;
      const wrap = btn.closest('.pk-food');
      const q = +wrap.querySelector('.pk-qty').value || 0;
      const unit = wrap.querySelector('.pk-unit').value;
      if(q <= 0){ wrap.querySelector('.pk-qty').focus(); return; }
      const it = {f:id, fx:true}; if(unit === 'u') it.u = q; else it.g = q;
      const qLbl = unit === 'u' ? `${q} ${(food.unit&&food.unit.lbl)||'ud'}` : `${q} g`;
      const newId = (typeof nextUserId === 'function') ? nextUserId() : ('U' + Date.now());
      DISHES[newId] = {
        cat: _picker.slot, loose:true,
        short: food.name.slice(0,24), nom: `${food.name} · ${qLbl}`,
        icon: ((typeof FOOD_SECTIONS!=='undefined' && FOOD_SECTIONS[food.sec]) || {}).ico || '🍎',
        t:'—', eq:'—', tags:[], tipo:null, diet:[], desc:'Alimento suelto.', nota:'—',
        comp:[it], food:[]
      };
      if(typeof recomputeDish === 'function') recomputeDish(DISHES[newId]);
      if(typeof persistCustom === 'function') persistCustom();
      CalState.data[_picker.day][_picker.slot].push(newId);
      CalState.modified = true;
      persistCal();
      _picker.foodPick = null;
      renderPicker();
      renderCalendar();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   WEEKLY GUIDE PANEL
══════════════════════════════════════════════════════════ */
function renderGuide(){
  const wrap = document.getElementById('guidePanel');
  if(!wrap) return;

  const comCounts = weeklyCounts('com');
  const allCounts = weeklyCounts('all');

  let warnings = 0;
  const items = WEEKLY_GUIDE.map(g=>{
    const fk = g.foodKey || g.k;
    const src = g.scope === 'com' ? comCounts : allCounts;
    const v = src[fk] || 0;
    const st = guideStatus(v, g.target, g.max);
    if(st.cls === 'st-over' || (st.cls === 'st-empty' && g.target > 0)) warnings++;
    const ft = FOOD_TYPES[fk] || {ico:'•', lbl:g.lbl};
    const pct = Math.min(100, Math.round((v / Math.max(g.max,1)) * 100));
    const warnMsg = st.cls === 'st-over'
      ? (g.target === 0
          ? `Esta semana ya hay ${v}. Recomendado: 2-3 raciones al MES.`
          : `Por encima del máximo (${g.max}).`)
      : '';
    return `
      <div class="gitem ${st.cls}" title="${escAttr(g.rule)}">
        <div class="gih">
          <span class="gico">${ft.ico}</span>
          <span class="gname">${g.lbl}</span>
          <span class="gval" title="Llevas ${v} esta semana · recomendado ${g.target===0?('máx '+g.max):g.target}${g.max>g.target?' · máximo '+g.max:''}">${v} <small>${g.target===0?`· máx ${g.max}/sem`:`de ${g.target}${g.max>g.target?` · máx ${g.max}`:''}`}</small></span>
        </div>
        <div class="gbar"><div class="gfill" style="width:${pct}%"></div></div>
        <div class="grule">${escAttr(g.rule)}</div>
        ${warnMsg ? `<div class="gwarn">⚠ ${warnMsg}</div>` : ''}
      </div>`;
  }).join('');

  // Panel promedio semanal vs objetivo de kcal/macros
  const avg = weekTotalsAvg(CalState.data);
  const macroPanel = avg ? renderMacroAvg(avg) : '';

  wrap.innerHTML = `
    ${macroPanel}
    <div class="guide-panel ${warnings?'warn':''}">
      <div class="guide-hd">
        <h3>Guía semanal · cantidades recomendadas</h3>
        <span class="gsub">Legumbre, pescado, carne, verdura, fruta, huevo, frutos secos, lácteos…</span>
        <span class="gpill ${warnings?'warn':'ok'}">${warnings?warnings+' aviso'+(warnings>1?'s':''):'todo en orden'}</span>
      </div>
      <div class="guide-grid">${items}</div>
    </div>`;
}

function renderMacroAvg(avg){
  const macroStatus = (v, target)=>{
    if(!target) return 'st-empty';
    const r = v / target;
    if(r < .85)  return 'st-low';
    if(r > 1.10) return 'st-over';
    if(r > 1.03) return 'st-near';
    return 'st-on';
  };
  const bar = (lbl, v, t, unit, statusFn)=>{
    const st = (statusFn || macroStatus)(v, t);
    const pct = t ? Math.min(140, Math.round(v/t*100)) : 0;
    const wPct = Math.min(100, pct);
    return `<div class="ma-bar ${st}">
      <div class="ma-bar-hd">
        <span class="ma-l">${lbl}</span>
        <span class="ma-v">${v}<span class="ma-t">/${t}${unit}</span></span>
        <span class="ma-pct">${pct}%</span>
      </div>
      <div class="ma-track"><div class="ma-fill" style="width:${wPct}%"></div></div>
    </div>`;
  };
  const personBlock = (p, sym, label)=>{
    const t = TARGETS[p];
    const a = avg[p];
    return `
      <div class="ma-person">
        <div class="ma-ph">${sym} ${escAttr(label||t.name||p)} <small>media diaria vs objetivo</small></div>
        ${bar('kcal',    a.k, t.kcal||0, '',  macroStatus)}
        ${bar('proteína',a.p, t.p   ||0, 'g', macroStatus)}
        ${bar('grasa',   a.f, t.f   ||0, 'g', macroStatus)}
        ${bar('carbohidr', a.c, t.c ||0, 'g', macroStatus)}
      </div>`;
  };
  const persons = (S.p === 'A')  ? [['A','♂',TARGETS.A.name]]
                : (S.p === 'B')  ? [['B','♀',TARGETS.B.name]]
                : [['A','♂',TARGETS.A.name], ['B','♀',TARGETS.B.name]];
  return `
    <div class="macro-avg">
      <div class="ma-hd">
        <h3>Media diaria vs objetivo</h3>
        <span class="ma-sub">Calculado sobre ${avg.days} día${avg.days>1?'s':''} con comidas planificadas</span>
      </div>
      <div class="ma-grid ${persons.length>1?'two':''}">
        ${persons.map(([p,sym,name])=> personBlock(p, sym, name)).join('')}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════
   TOOLBAR · plantilla manual
══════════════════════════════════════════════════════════ */
const TEMPLATE_RECIPES = {
  lun:{com:['C2'],  cen:['N1']},
  mar:{com:['C3'],  cen:['M3']},
  mie:{com:['C12'], cen:['N6']},
  jue:{com:['C4'],  cen:['N5']},
  vie:{com:['C1'],  cen:['N4']},
  sab:{com:[],      cen:['N6']},
  dom:{com:['C10'], cen:['N5']}
};

async function loadTemplate(){
  if(!await pnConfirm('¿Aplicar la plantilla semanal del PDF?\nSe sobreescribirá el calendario actual.', {okText:'Aplicar plantilla'})) return;
  CalState.data = emptyCal();
  Object.entries(TEMPLATE_RECIPES).forEach(([day, slots])=>{
    Object.entries(slots).forEach(([slot, ids])=>{
      CalState.data[day][slot] = ids.filter(id => DISHES[id]).slice();
    });
  });
  const desayunos = Object.keys(DISHES).filter(id => DISHES[id].cat === 'des' && !DISHES[id].libre && !DISHES[id].loose);
  const meriendas = Object.keys(DISHES).filter(id => DISHES[id].cat === 'mer' && !DISHES[id].libre && !DISHES[id].loose);
  WEEK_DAYS.forEach((day,i)=>{
    if(!CalState.data[day.k].des.length) CalState.data[day.k].des = [desayunos[i % desayunos.length]].filter(Boolean);
    if(!CalState.data[day.k].mer.length) CalState.data[day.k].mer = [meriendas[i % meriendas.length]].filter(Boolean);
  });
  CalState.modified = true;
  persistCal();
  renderCalendar();
}

async function clearCalendar(){
  if(!await pnConfirm('¿Vaciar el calendario actual?', {danger:true, okText:'Vaciar'})) return;
  CalState.data = emptyCal();
  CalState.modified = true;
  persistCal();
  renderCalendar();
}

function openSavePrompt(){
  if(typeof savePromptModal === 'function') savePromptModal();
}

/* ══════════════════════════════════════════════════════════
   AUTOCOMPLETADO INTELIGENTE
   Asigna recetas a cada franja maximizando:
   · ajuste al food-type del día (plantilla PDF)
   · variedad (sin repetir recetas)
   · cumplimiento de la guía semanal (legumbre 3-4, pescado azul/blanco 1+1…)
══════════════════════════════════════════════════════════ */

/* Para cada día.com y día.cen: tipos de alimento PREFERIDOS según PDF */
const AUTO_SLOT_HINTS = {
  lun:{com:['leg'],         cen:['hv','js']      },     // legumbre comida → huevo+jamón cena
  mar:{com:['pa'],          cen:['pv']           },     // pescado azul → proteína vegetal
  mie:{com:['apq'],         cen:['cb','hv']      },     // arroz/pasta → carne blanca/huevo
  jue:{com:['leg'],         cen:['hv']           },     // legumbre sin patata → huevo
  vie:{com:['pb'],          cen:['pa','qs','fs'] },     // pescado blanco → ensalada salmón ahumado + queso + nueces
  sab:{com:['lb'],          cen:['cb','pv']      },     // libre → suave
  dom:{com:['cb','cr'],     cen:['pb','pa']      }      // carne blanca/roja → pescado en lata
};

/* Distribución objetivo por semana (días). Carne roja sólo a partir de 2ª sem,
   por defecto la asignamos en domingo si no hay otro tipo más prioritario. */
const AUTO_WEEKLY_QUOTA = {
  com: { leg:2, pb:1, pa:1, cb:1, apq:1, cr:0, lb:1 }
};

/* Cuota semanal de "comida real" en CUALQUIER franja (días con ese tipo).
   Alineada con WEEKLY_GUIDE: 2 raciones/día de verdura y fruta, frutos
   secos y lácteo la mayoría de días. El generador da un bonus suave a las
   recetas que aportan estos tipos mientras la cuota no esté cubierta. */
const AUTO_ALL_QUOTA = { v:14, fr:14, fs:4, lac:7 };

/* Plantillas del generador. La 'pdf' reproduce el plan España (legumbre
   lunes/jueves, azul martes…); 'balanced' mantiene las cuotas semanales
   pero sin fijar días; 'none' sólo optimiza macros, variedad y guía. */
const AUTO_TEMPLATES = {
  pdf:      { lbl:'España · plantilla PDF', hints: AUTO_SLOT_HINTS, quotaCom: AUTO_WEEKLY_QUOTA.com },
  balanced: { lbl:'Equilibrada · sin días fijos', hints: {}, quotaCom: { leg:2, pb:1, pa:1, cb:1, apq:1, cr:0 } },
  none:     { lbl:'Libre · sólo macros y variedad', hints: {}, quotaCom: {} }
};

/* Tiempo máximo (min) que declara una receta; '—' o sin número = 0 (pasa). */
function recipeMaxMinutes(d){
  const nums = String(d && d.t || '').match(/\d+/g);
  if(!nums) return 0;
  return Math.max(...nums.map(Number));
}
const WEEKDAYS_SET = new Set(['lun','mar','mie','jue','vie']);

/* Helpers · totales diarios para un día específico (A o B) */
function dayTotalsFor(data, day){
  // Modelo por necesidad de comida: cada receta escala a lo que necesita la
  // persona en esa franja, repartiendo la franja entre las recetas (proporcional).
  const r = {A:{k:0,p:0,f:0,c:0}, B:{k:0,p:0,f:0,c:0}};
  const arr = data[day];
  if(!arr) return r;
  const pA = PEOPLE[0] || 'A', pB = PEOPLE[1] || PEOPLE[0] || 'B';
  ['des','com','mer','cen'].forEach(s=>{
    const ids = (arr[s]||[]).filter(id=>DISHES[id]);
    if(!ids.length) return;
    const sStd = sumCellStd(ids);
    ids.forEach(id=>{
      const d = DISHES[id];
      const ta = dishScaledMeal(d, pA, s, sStd).tot;
      const tb = dishScaledMeal(d, pB, s, sStd).tot;
      r.A.k+=ta.k; r.A.p+=ta.p; r.A.f+=ta.f; r.A.c+=ta.c;
      r.B.k+=tb.k; r.B.p+=tb.p; r.B.f+=tb.f; r.B.c+=tb.c;
    });
  });
  ['A','B'].forEach(p=>['k','p','f','c'].forEach(m=>{ r[p][m] = Math.round(r[p][m]); }));
  return r;
}

function weekTotalsAvg(data){
  const sum = {A:{k:0,p:0,f:0,c:0}, B:{k:0,p:0,f:0,c:0}};
  let days = 0;
  WEEK_DAYS.forEach(d=>{
    const t = dayTotalsFor(data, d.k);
    const filled = Object.values(data[d.k]||{}).some(a=>Array.isArray(a)&&a.length);
    if(!filled) return;
    days++;
    ['A','B'].forEach(p=>{ ['k','p','f','c'].forEach(m=>{ sum[p][m] += t[p][m]; }); });
  });
  if(!days) return null;
  const avg = {A:{}, B:{}};
  ['A','B'].forEach(p=>['k','p','f','c'].forEach(m=>{ avg[p][m] = Math.round(sum[p][m]/days); }));
  avg.days = days;
  return avg;
}

function scoreCandidate(dishId, ctx){
  const d = DISHES[dishId];
  if(!d) return -Infinity;

  // 0) Restricciones — descarta absolutamente las que violan
  if(ctx.restrictions && ctx.restrictions.length){
    for(const k of ctx.restrictions){
      const r = RESTRICTIONS_MAP[k];
      if(r && r.violates(d)) return -Infinity;
    }
  }

  let score = 0;

  // 0b) Sesgo a favoritos (generador "menú con favoritos")
  if(ctx.favSet && ctx.favSet.has(dishId)) score += (ctx.favBoost || 0);

  // 1) Coincide categoría de comida del día (hints de la plantilla activa)
  //    Pesos altos A PROPÓSITO: la variedad semanal (legumbre, pescado…)
  //    debe imponerse al ajuste fino de macros de una franja — las macros
  //    se compensan en el resto del día, la variedad no.
  const hints = (ctx.hints && ctx.hints[ctx.day] && ctx.hints[ctx.day][ctx.slot]) || [];
  const foods = d.food || [];
  if(hints.length){
    const overlap = hints.filter(h => foods.includes(h)).length;
    if(overlap > 0) score += 450 * overlap;
    else score -= 120; // no encaja con la sugerencia del día
  }

  // 2) Cumple cuotas semanales pendientes (más puntos si esta receta aporta tipos que aún faltan)
  if(ctx.slot === 'com'){
    foods.forEach(f=>{
      const need = (ctx.quota[f] || 0);
      const got  = (ctx.gotCom[f] || 0);
      if(need > 0 && got < need) score += 320 * (need - got);
      if(need > 0 && got >= need) score -= 650; // ya tenemos esa cuota cubierta
      // Cuota 0 (carne roja): tolera 1 día/semana, castiga fuerte el 2º
      if(need === 0 && (f in ctx.quota) && got >= 1) score -= 900;
    });
  }

  // 2b) Cuota de "comida real" en cualquier franja: bonus suave a recetas
  //     con verdura/fruta/frutos secos/lácteo mientras la semana vaya corta.
  if(ctx.quotaAll){
    foods.forEach(f=>{
      const need = ctx.quotaAll[f] || 0;
      if(need > 0 && (ctx.gotAll[f] || 0) < need) score += 50;
    });
  }

  // 2c) Modo "recetas rápidas": entre semana penaliza recetas de > 30 min.
  if(ctx.quick && WEEKDAYS_SET.has(ctx.day) && recipeMaxMinutes(d) > 30) score -= 350;

  // 3) Penaliza repetición de receta en la semana
  const reps = ctx.usedCount[dishId] || 0;
  if(reps > 0) score -= 500 * reps;

  // 4) Penaliza la misma receta usada el día anterior en la misma franja
  if(ctx.lastBySlot[ctx.slot] === dishId) score -= 200;

  // 5) Si la comida del día tiene carne/pescado, intenta variedad en cena
  if(ctx.slot === 'cen' && ctx.todaysComFoods){
    const c = ctx.todaysComFoods;
    if(c.includes('leg') && (foods.includes('leg') || foods.includes('apq'))) score -= 80;
    if((c.includes('cb')||c.includes('cr')) && (foods.includes('cb')||foods.includes('cr'))) score -= 100;
    if((c.includes('pb')||c.includes('pa')) && (foods.includes('pb')||foods.includes('pa'))) score -= 80;
  }

  // 6) Picnic preferido para fin de semana
  if((d.tags||[]).includes('pic') || foods.includes('pic')){
    if(ctx.day === 'sab' || ctx.day === 'dom') score += 60;
    else score -= 30;
  }

  // 7) Cena: pequeño bonus a tipo "ligera"
  if(ctx.slot === 'cen' && d.tipo === 'ligera') score += 25;

  // 8) Ajuste a kcal y MACROS objetivo (acota P/F/C, no sólo kcal).
  //    Clave del modelo: cada receta se ESCALA para cubrir las kcal de su
  //    franja (dishScaledMeal), así que las kcal del día siempre cuadran; lo
  //    que varía —y hay que acotar— es el REPARTO de macros según el perfil
  //    de la receta elegida. Por eso comparamos la contribución REAL escalada
  //    (no los valores crudos d.kcal[i]) contra el % esperado tras esta franja.
  //    Tratamos la proteína como SUELO (penaliza quedarse corto) y grasa/
  //    carbohidratos/kcal como TECHO (penaliza pasarse), que es como el propio
  //    panel marca los límites.
  //    El % esperado se calcula DINÁMICAMENTE: MEAL_PCT de las franjas que ya
  //    están contabilizadas en dayTotals (rellenas antes o preexistentes) más
  //    la actual. Con el SLOT_CUM_PCT fijo anterior, al "rellenar sólo vacías"
  //    un día con des+mer ya puestos comparaba contra el 35% y sesgaba todo
  //    hacia recetas hipocalóricas.
  if(ctx.dayTotals && ctx.dayTotals[ctx.day] && !d.libre){
    let expectedPct = MEAL_PCT[ctx.slot] || 0.25;
    const counted = ctx.countedSlots && ctx.countedSlots[ctx.day];
    if(counted) counted.forEach(s=>{ if(s !== ctx.slot) expectedPct += MEAL_PCT[s] || 0.25; });
    expectedPct = Math.min(1, expectedPct);
    const std = (typeof recipeStdKcal === 'function' ? recipeStdKcal(d) : 0) || 1;
    const perPerson = [];
    PEOPLE.forEach((p)=>{
      const tgt = TARGETS[p];
      if(!tgt || !tgt.kcal) return;
      let penP = 0;
      const cur = (ctx.dayTotals[ctx.day] && ctx.dayTotals[ctx.day][p]) || {k:0,p:0,f:0,c:0};
      // Contribución REAL de esta receta a la franja para esta persona.
      const mm = (typeof dishScaledMeal === 'function')
        ? dishScaledMeal(d, p, ctx.slot, std).tot
        : {k:0,p:0,f:0,c:0};
      const k  = cur.k + mm.k;
      const pp = cur.p + mm.p;
      const ff = cur.f + mm.f;
      const cc = cur.c + mm.c;
      // Objetivos esperados acumulados tras esta franja
      const tK = expectedPct * tgt.kcal;
      const tP = expectedPct * (tgt.p || 0);
      const tF = expectedPct * (tgt.f || 0);
      const tC = expectedPct * (tgt.c || 0);
      // Desviación relativa (sobre el objetivo diario completo de cada macro)
      const dK = (k  - tK) / Math.max(tgt.kcal, 1);
      const dP = (pp - tP) / Math.max(tgt.p || 1, 1);
      const dF = (ff - tF) / Math.max(tgt.f || 1, 1);
      const dC = (cc - tC) / Math.max(tgt.c || 1, 1);
      // pen(x, pasarse, quedarse-corto): asimétrico según techo/suelo.
      const pen = (x, over, under) => x > 0 ? x * over : -x * under;
      penP =
        1.0 * pen(dK, 1.6, 0.6) +   // kcal → techo suave (ya casi fijo)
        2.4 * pen(dP, 0.5, 3.2) +   // proteína → SUELO (hay que alcanzarla)
        1.5 * pen(dF, 1.8, 0.7) +   // grasa → techo
        2.5 * pen(dC, 2.6, 0.5);    // carbohidratos → techo (tendían a dispararse)
      perPerson.push(penP);
    });
    if(perPerson.length){
      // Las recetas se comparten entre personas (misma receta, distinta escala):
      // sus objetivos pueden entrar en conflicto y no hay receta que satisfaga a
      // ambas a la vez. Promediar reparte el compromiso de forma equilibrada.
      const macroPenalty = perPerson.reduce((a,b)=>a+b,0) / perPerson.length;
      // 0 desviación → +320 ; penaliza fuerte los repartos que se salen de la banda.
      score += 320 - macroPenalty * 900;
    }
  }

  // 9) NB: la aleatoriedad real se aplica en pickBest (selección entre los
  //    mejores candidatos), no aquí, para que regenerar dé menús distintos.
  return score;
}

/* Selección ALEATORIA entre las mejores recetas registradas.
   En vez de coger siempre el máximo (menú idéntico cada vez), puntuamos
   todos los candidatos válidos, nos quedamos con los que están dentro de un
   margen del mejor (o el top-N), y elegimos uno al azar ponderando por
   calidad. Resultado: variedad real respetando guía, cuotas y restricciones. */
/* Cocina "efectiva" de una receta para la acotación por paquetes:
   las recetas propias del usuario cuentan como 'user'. */
function dishCuisineKey(id){
  if(typeof id === 'string' && id[0] === 'U') return 'user';
  const d = DISHES[id];
  return (d && d.cuisine && d.cuisine !== 'base') ? d.cuisine : 'base';
}

/* ¿Es candidata esta receta para el generador en esta franja?
   Mismo criterio para pickBest y para el chequeo previo de categorías:
   · su categoría coincide y no es un alimento suelto
   · "Comida libre" sólo si la plantilla del día lo pide (hint 'lb')
   · su cocina está activada en Configuración
   · si el usuario acotó a packs concretos, pertenece a uno de ellos */
function autofillEligible(id, slot, day, ctx){
  const d = DISHES[id];
  if(!d || d.cat !== slot || d.loose) return false;
  if(d.libre){
    const hints = (day && ctx && ctx.hints && ctx.hints[day] && ctx.hints[day][slot]) || [];
    if(!hints.includes('lb')) return false;
  }
  if(typeof dishHiddenByCuisine === 'function' && dishHiddenByCuisine(id)) return false;
  if(ctx && ctx.allowedCuisines && !ctx.allowedCuisines.has(dishCuisineKey(id))) return false;
  return true;
}

function pickBest(slot, day, ctx, currentDayCom){
  let candidates = Object.keys(DISHES).filter(id => autofillEligible(id, slot, day, ctx));
  // Modo "sólo favoritos": limita los candidatos a los favoritos activos.
  // Si no hay ninguno para esta franja, se deja vacía (no se rellena con otras).
  if(ctx.strictFav && ctx.favSet){ candidates = candidates.filter(id => ctx.favSet.has(id)); }
  if(!candidates.length) return null;
  ctx.day = day;
  ctx.slot = slot;
  ctx.todaysComFoods = currentDayCom;

  // Puntúa y descarta los inviables (-Infinity por restricciones)
  const scored = [];
  candidates.forEach(id=>{
    const s = scoreCandidate(id, ctx);
    if(isFinite(s)) scored.push({ id, s });
  });
  if(!scored.length) return null;
  scored.sort((a,b)=> b.s - a.s);

  const best = scored[0].s;
  const worst = scored[scored.length-1].s;
  const range = Math.max(1, best - worst);
  // Pool = candidatos dentro del 25% superior del rango de puntuación,
  // con un mínimo de 3 y un máximo de 6. Un pool más estrecho que antes:
  // el mínimo de 4 metía candidatos muy inferiores y diluía las cuotas
  // de la plantilla (salía carne blanca 3 días y legumbre 1, p. ej.).
  const margin = range * 0.25;
  let pool = scored.filter(c => c.s >= best - margin);
  if(pool.length < 3) pool = scored.slice(0, Math.min(3, scored.length));
  if(pool.length > 6) pool = pool.slice(0, 6);

  // Ponderación suave por calidad: el mejor pesa más, pero todos entran.
  // peso = (rank decreciente)^1.5 para no aplanar del todo.
  const weights = pool.map((_, i) => Math.pow(pool.length - i, 1.5));
  const totalW = weights.reduce((a,b)=>a+b, 0);
  let r = Math.random() * totalW;
  for(let i=0; i<pool.length; i++){
    r -= weights[i];
    if(r <= 0) return pool[i].id;
  }
  return pool[pool.length-1].id;
}

/* Construye el contexto de puntuación del generador a partir de las opciones:
   plantilla, cuotas, restricciones, packs permitidos, favoritos… */
function buildAutofillCtx(opts){
  opts = opts || {};
  const restrictions = [...new Set(PEOPLE.flatMap(id => (TARGETS[id]||{}).restr || []))];
  const tpl = AUTO_TEMPLATES[opts.template] || AUTO_TEMPLATES.pdf;
  const ctx = {
    usedCount: {},     // {dishId: count}
    gotCom:    {},     // {foodKey: count} acumulado en comidas
    gotAll:    {},     // {foodKey: count} acumulado en todas las franjas
    lastBySlot:{},     // {slot: lastDishId}
    quota:     Object.assign({}, tpl.quotaCom),
    quotaAll:  Object.assign({}, AUTO_ALL_QUOTA),
    hints:     tpl.hints,
    tplKey:    AUTO_TEMPLATES[opts.template] ? opts.template : 'pdf',
    quick:     !!opts.quick,
    restrictions,
    allowedCuisines: (Array.isArray(opts.cuisines) && opts.cuisines.length) ? new Set(opts.cuisines) : null,
    favSet:    opts.favorites ? new Set(opts.favList || getDishFavs()) : null,
    favBoost:  opts.favorites ? 4000 : 0,
    strictFav: !!opts.favoritesStrict,   // sólo favoritos: no rellenar con otras recetas
    dayTotals: {},     // {day: {persona:{k,p,f,c}}}
    countedSlots: {}   // {day: Set(slots ya sumados en dayTotals)}
  };
  const blankTotals = ()=>{ const o={}; PEOPLE.forEach(id=>{ o[id]={k:0,p:0,f:0,c:0}; }); return o; };
  WEEK_DAYS.forEach(d=>{ ctx.dayTotals[d.k] = blankTotals(); ctx.countedSlots[d.k] = new Set(); });
  return ctx;
}

/* Suma la contribución REAL (escalada a la franja) de un plato a los totales
   por persona. Debe coincidir con dayTotalsFor para que el proyectado durante
   el autocompletado refleje lo que finalmente se muestra. */
function autofillAddTotals(ctx, day, slot, d, sumStd){
  const totals = ctx.dayTotals[day];
  if(!totals || !d) return;
  const std = sumStd || (typeof recipeStdKcal === 'function' ? recipeStdKcal(d) : 0) || 1;
  PEOPLE.forEach((id)=>{
    const t = totals[id]; if(!t) return;
    const mm = (typeof dishScaledMeal === 'function')
      ? dishScaledMeal(d, id, slot, std).tot
      : {k:0,p:0,f:0,c:0};
    t.k += mm.k; t.p += mm.p; t.f += mm.f; t.c += mm.c;
  });
  ctx.countedSlots[day] && ctx.countedSlots[day].add(slot);
}

/* Registra una elección: contadores de uso, cuotas y totales del día. */
function autofillRegister(ctx, day, slot, id){
  const d = DISHES[id];
  if(!d) return;
  ctx.usedCount[id] = (ctx.usedCount[id]||0) + 1;
  ctx.lastBySlot[slot] = id;
  const foods = d.food || [];
  if(slot === 'com') foods.forEach(f=>{ ctx.gotCom[f] = (ctx.gotCom[f]||0) + 1; });
  foods.forEach(f=>{ ctx.gotAll[f] = (ctx.gotAll[f]||0) + 1; });
  autofillAddTotals(ctx, day, slot, d, recipeStdKcal(d));
}

/* Precarga en el contexto lo que YA hay en el calendario (contadores,
   cuotas y totales por día). skipDay/skipSlot excluye una franja (se usa
   al pedir una sugerencia para esa franja concreta). */
function autofillPreload(ctx, skipDay, skipSlot){
  Object.entries(CalState.data).forEach(([day, dayObj])=>{
    Object.entries(dayObj).forEach(([slot, arr])=>{
      if(day === skipDay && slot === skipSlot) return;
      const ids = (arr||[]).filter(id => DISHES[id]);
      if(!ids.length) return;
      const sStd = sumCellStd(ids);
      ids.forEach(id=>{
        ctx.usedCount[id] = (ctx.usedCount[id]||0) + 1;
        const foods = DISHES[id].food || [];
        if(slot === 'com') foods.forEach(f=>{ ctx.gotCom[f] = (ctx.gotCom[f]||0) + 1; });
        foods.forEach(f=>{ ctx.gotAll[f] = (ctx.gotAll[f]||0) + 1; });
        autofillAddTotals(ctx, day, slot, DISHES[id], sStd);
      });
    });
  });
}

/* Modo tupper: estas cenas reutilizan la comida del día anterior. */
const BATCH_LEFTOVER = { mar:'lun', jue:'mie', sab:'vie' };

function autofillCalendar(opts){
  opts = opts || {};
  const respectExisting = opts.respectExisting !== false; // por defecto sí
  const ctx = buildAutofillCtx(opts);

  // Comprueba si quedará alguna categoría sin candidatos.
  // Mismo criterio de elegibilidad que usará pickBest (cocinas, packs…).
  const blocked = [];
  CATEGORIES.forEach(c=>{
    const ok = Object.keys(DISHES).some(id => autofillEligible(id, c.key, null, ctx) &&
      !ctx.restrictions.some(k=>{ const r = RESTRICTIONS_MAP[k]; return r && r.violates(DISHES[id]); }));
    if(!ok) blocked.push(c.label);
  });
  if(blocked.length){
    pnAlert(`Con las restricciones y cocinas actuales no hay recetas disponibles para: ${blocked.join(', ')}.\n\nActiva más cocinas, ajusta las restricciones o crea recetas nuevas.`);
    return;
  }

  // Si respetamos lo existente, precarga contadores y totales por día
  if(respectExisting){
    autofillPreload(ctx);
  } else {
    CalState.data = emptyCal();
  }

  // Orden de relleno: COMIDAS primero (más restrictivo por plantilla),
  // luego CENAS (dependen de la comida del mismo día), luego DESAYUNOS y MERIENDAS.
  const orderedDays = WEEK_DAYS.map(d => d.k);

  // — COMIDAS —
  orderedDays.forEach(day=>{
    if(CalState.data[day].com.length && respectExisting) return;
    // Día LIBRE de la plantilla (sábado en la del PDF): se coloca directo,
    // sin puntuar por macros — el sentido del día libre es no contarlos.
    const hints = (ctx.hints[day] && ctx.hints[day].com) || [];
    if(hints.includes('lb')){
      const libreId = 'LIBRE_com';
      if(autofillEligible(libreId, 'com', day, ctx) && (!ctx.strictFav)){
        CalState.data[day].com = [libreId];
        autofillRegister(ctx, day, 'com', libreId);
        return;
      }
    }
    const id = pickBest('com', day, ctx, []);
    if(!id) return;
    CalState.data[day].com = [id];
    autofillRegister(ctx, day, 'com', id);
  });

  // — CENAS — (modo tupper: mar/jue/sáb cenan la comida del día anterior)
  ctx.batchUsed = [];
  orderedDays.forEach(day=>{
    if(CalState.data[day].cen.length && respectExisting) return;
    if(opts.batch && BATCH_LEFTOVER[day]){
      const src = (CalState.data[BATCH_LEFTOVER[day]].com || []).filter(id=>{
        const d = DISHES[id];
        return d && !d.libre && !d.loose && !(typeof dishViolations==='function' && dishViolations(id,'AB').length);
      });
      if(src.length){
        CalState.data[day].cen = [src[0]];
        autofillRegister(ctx, day, 'cen', src[0]);
        ctx.batchUsed.push(day);
        return;
      }
    }
    const todaysComFoods = (CalState.data[day].com||[]).flatMap(id => DISHES[id]?.food || []);
    const id = pickBest('cen', day, ctx, todaysComFoods);
    if(!id) return;
    CalState.data[day].cen = [id];
    autofillRegister(ctx, day, 'cen', id);
  });

  // — DESAYUNOS — (rotar para variedad)
  orderedDays.forEach(day=>{
    if(CalState.data[day].des.length && respectExisting) return;
    const id = pickBest('des', day, ctx, []);
    if(!id) return;
    CalState.data[day].des = [id];
    autofillRegister(ctx, day, 'des', id);
  });

  // — MERIENDAS —
  orderedDays.forEach(day=>{
    if(CalState.data[day].mer.length && respectExisting) return;
    const id = pickBest('mer', day, ctx, []);
    if(!id) return;
    CalState.data[day].mer = [id];
    autofillRegister(ctx, day, 'mer', id);
  });

  CalState.modified = true;
  persistCal();
  renderCalendar();

  // Resumen al usuario
  showAutofillReport(opts, ctx);
}

/* ── INFORME de generación (modal persistente, no toast) ─── */
function showAutofillReport(opts, ctx){
  opts = opts || {}; ctx = ctx || {};
  const com = weeklyCounts('com');
  const all = weeklyCounts('all');
  const get = (src, k) => src[k] || 0;
  const tpl = AUTO_TEMPLATES[ctx.tplKey] || AUTO_TEMPLATES.pdf;

  // Opciones aplicadas
  const chips = [`🗓️ ${tpl.lbl}`];
  if(ctx.allowedCuisines){
    const names = [...ctx.allowedCuisines].map(id=>{
      if(id === 'user') return 'Mis recetas';
      const c = (typeof Cuisines !== 'undefined') ? Cuisines.list().find(x=>x.id===id) : null;
      return c ? c.lbl : id;
    });
    chips.push(`🍱 Sólo: ${names.join(', ')}`);
  }
  if(ctx.quick) chips.push('⏱ Rápidas entre semana');
  if(opts.batch) chips.push(`🥡 Tuppers: ${(ctx.batchUsed||[]).length} cena(s) con sobras de la comida`);
  if(ctx.strictFav) chips.push('⭐ Sólo favoritos');
  else if(ctx.favSet) chips.push('⭐ Prioridad a favoritos');
  if((ctx.restrictions||[]).length) chips.push('🚫 ' + ctx.restrictions.map(k=>RESTRICTIONS_MAP[k]?.lbl||k).join(', '));

  // Cuotas de la plantilla (si las hay)
  const quotaRows = [];
  const q = ctx.quota || {};
  const qRow = (k, lbl)=>{ if(q[k] > 0) quotaRows.push(`${lbl}: <b>${get(com,k)}</b>/${q[k]} días`); };
  qRow('leg','Legumbre · comida'); qRow('pa','Pescado azul · comida');
  qRow('pb','Pescado blanco · comida'); qRow('cb','Carne blanca · comida');
  qRow('apq','Arroz/Pasta · comida'); qRow('lb','Día libre · comida');
  if(get(com,'cr')) quotaRows.push(`⚠ Carne roja · comida: <b>${get(com,'cr')}</b> (recomendado 2-3/MES)`);
  quotaRows.push(`Verdura · semana: <b>${get(all,'v')}</b>/${AUTO_ALL_QUOTA.v} · Fruta: <b>${get(all,'fr')}</b>/${AUTO_ALL_QUOTA.fr}`);

  // Franjas que quedaron vacías (p. ej. sólo-favoritos sin recetas de esa categoría)
  const emptySlots = [];
  WEEK_DAYS.forEach(d=>{
    ['des','com','mer','cen'].forEach(s=>{
      if(!(CalState.data[d.k][s]||[]).length) emptySlots.push(`${d.lbl} ${(CATEGORIES.find(c=>c.key===s)||{}).label||s}`);
    });
  });

  // Recetas únicas
  const used = {};
  Object.values(CalState.data).forEach(day=>Object.values(day).forEach(arr=>arr.forEach(id=>{used[id]=(used[id]||0)+1;})));
  const unique = Object.keys(used).length;
  const total  = Object.values(used).reduce((a,b)=>a+b,0);

  const body = document.getElementById('promptBody');
  if(!body){ if(typeof pnToast==='function') pnToast('Menú generado.'); return; }
  body.innerHTML = `
    <div class="form-hd"><h2>✨ Menú generado</h2>
      <span class="form-sub">Revisa la guía semanal bajo el calendario y ajusta lo que quieras</span></div>
    <div class="form-body">
      <div class="fchips" style="margin-bottom:12px">${chips.map(c=>`<span class="fchip on" style="cursor:default">${escAttr(c)}</span>`).join('')}</div>
      <div class="fgrp"><label class="flbl">Cumplimiento de la semana</label>
        <ul style="margin:6px 0 0 18px;line-height:1.7;font-size:.88rem">${quotaRows.map(r=>`<li>${r}</li>`).join('')}
          <li>Recetas únicas: <b>${unique}</b> · usos totales: <b>${total}</b></li>
        </ul>
      </div>
      ${emptySlots.length ? `<div class="fgrp"><label class="flbl">⚠ Franjas sin rellenar (${emptySlots.length})</label>
        <div style="font-size:.84rem;color:var(--ink-50);line-height:1.6">${emptySlots.map(escAttr).join(' · ')}<br>Complétalas a mano desde el calendario o con 🎲 Sugerir.</div></div>` : ''}
    </div>
    <div class="form-actions">
      <button class="btn-prim" id="afReportOk" style="width:100%">Entendido</button>
    </div>`;
  _showPrompt();
  const ok = document.getElementById('afReportOk');
  if(ok) ok.addEventListener('click', _closePrompt);
  const x = document.getElementById('promptClose');
  if(x) x.onclick = _closePrompt;
}

function safeAutofill(opts){
  try{ autofillCalendar(opts); }
  catch(e){ console.error('autofill', e); if(typeof pnAlert==='function') pnAlert('No se pudo autocompletar.\n'+(e&&e.message||e)); }
}

/* ══════════════════════════════════════════════════════════
   OPCIONES DE GENERACIÓN · diálogo único
   Modo (rellenar/desde cero/sólo favoritos) + plantilla + acotación
   a cocinas/packs + rápidas entre semana + modo tupper. Persistente.
══════════════════════════════════════════════════════════ */
const LS_AUTO_OPTS = 'mnut:autofill-opts:v1';
function loadAutoPrefs(){
  try{ const o = JSON.parse(localStorage.getItem(LS_AUTO_OPTS)); return (o && typeof o==='object') ? o : {}; }
  catch(e){ return {}; }
}
function saveAutoPrefs(p){ try{ localStorage.setItem(LS_AUTO_OPTS, JSON.stringify(p)); }catch(e){} }

/* Cocinas elegibles para acotar: las ACTIVAS en Configuración con recetas,
   más "Mis recetas" si el usuario tiene recetas propias. */
function autofillCuisineChoices(){
  const out = [];
  if(typeof Cuisines !== 'undefined'){
    Cuisines.list().forEach(c=>{ if(c.on && c.count > 0) out.push({id:c.id, ico:c.ico, lbl:c.lbl, count:c.count}); });
  }
  const userCount = Object.keys(DISHES).filter(id => id[0]==='U' && !DISHES[id].loose && !DISHES[id].libre).length;
  if(userCount) out.push({id:'user', ico:'✍️', lbl:'Mis recetas', count:userCount});
  return out;
}

const AUTO_MODES = [
  {k:'fill', ico:'✨', lbl:'Rellenar vacías', hint:'Completa sólo las franjas vacías; respeta lo que ya hay.'},
  {k:'new',  ico:'🔄', lbl:'Desde cero',      hint:'Borra el menú actual y genera la semana completa.'},
  {k:'fav',  ico:'⭐', lbl:'Sólo favoritos',  hint:'Borra el menú y usa únicamente tus recetas ★; sin favoritos de una categoría, esa franja queda vacía.'}
];

function openAutofillOptions(mode){
  const body = document.getElementById('promptBody');
  if(!body){ safeAutofill({respectExisting: mode !== 'new'}); return; }
  const prefs = loadAutoPrefs();
  const st = {
    mode: AUTO_MODES.some(m=>m.k===mode) ? mode : 'fill',
    template: AUTO_TEMPLATES[prefs.template] ? prefs.template : 'pdf',
    quick: !!prefs.quick,
    batch: !!prefs.batch,
    favBoost: !!prefs.favBoost,
    cuisines: Array.isArray(prefs.cuisines) ? prefs.cuisines.slice() : null   // null = todas
  };
  const choices = autofillCuisineChoices();
  // limpia selecciones guardadas que ya no existan (pack quitado, etc.)
  if(st.cuisines){
    st.cuisines = st.cuisines.filter(id => choices.some(c=>c.id===id));
    if(!st.cuisines.length) st.cuisines = null;
  }

  const render = ()=>{
    const modeHint = (AUTO_MODES.find(m=>m.k===st.mode)||{}).hint || '';
    body.innerHTML = `
      <div class="form-hd"><h2>✨ Generar menú</h2>
        <span class="form-sub">Elige cómo quieres que se rellene el Plan Semanal</span></div>
      <div class="form-body">
        <div class="fgrp"><label class="flbl">Modo</label>
          <div class="fchips" id="afModes">
            ${AUTO_MODES.map(m=>`<button type="button" class="fchip ${st.mode===m.k?'on':''}" data-mode="${m.k}">${m.ico} ${m.lbl}</button>`).join('')}
          </div>
          <div style="font-size:.8rem;color:var(--ink-50);margin-top:6px">${escAttr(modeHint)}</div>
        </div>
        <div class="fgrp"><label class="flbl">Plantilla semanal</label>
          <select class="fsel" id="afTemplate">
            ${Object.entries(AUTO_TEMPLATES).map(([k,t])=>`<option value="${k}" ${st.template===k?'selected':''}>${t.lbl}</option>`).join('')}
          </select>
        </div>
        ${choices.length > 1 ? `
        <div class="fgrp"><label class="flbl">Cocinas a usar <span class="flbl-ex">todas marcadas = sin acotar</span></label>
          <div class="fchips" id="afCuisines">
            ${choices.map(c=>{
              const on = !st.cuisines || st.cuisines.includes(c.id);
              return `<button type="button" class="fchip ${on?'on':''}" data-cuis="${escAttr(c.id)}">${c.ico} ${escAttr(c.lbl)} <small style="opacity:.6">· ${c.count}</small></button>`;
            }).join('')}
          </div>
        </div>` : ''}
        <div class="fgrp"><label class="flbl">Preferencias</label>
          <label style="display:flex;gap:8px;align-items:center;font-size:.88rem;margin:6px 0;cursor:pointer">
            <input type="checkbox" id="afQuick" ${st.quick?'checked':''}> ⏱ Entre semana, sólo recetas rápidas (≤ 30 min)</label>
          <label style="display:flex;gap:8px;align-items:center;font-size:.88rem;margin:6px 0;cursor:pointer">
            <input type="checkbox" id="afBatch" ${st.batch?'checked':''}> 🥡 Modo tupper: mar/jue/sáb se cena la comida del día anterior</label>
          ${st.mode!=='fav' ? `<label style="display:flex;gap:8px;align-items:center;font-size:.88rem;margin:6px 0;cursor:pointer">
            <input type="checkbox" id="afFavBoost" ${st.favBoost?'checked':''}> ⭐ Dar prioridad a mis favoritos</label>` : ''}
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-sec" id="afCancel">Cancelar</button>
        <button class="btn-prim" id="afGo">${st.mode==='fill' ? '✨ Rellenar' : '✨ Generar'}</button>
      </div>`;
    wire();
  };

  const readChecks = ()=>{
    const g = id => { const el = document.getElementById(id); return !!(el && el.checked); };
    st.quick = g('afQuick'); st.batch = g('afBatch');
    if(st.mode !== 'fav') st.favBoost = g('afFavBoost');
    const sel = document.getElementById('afTemplate');
    if(sel) st.template = sel.value;
  };

  function wire(){
    body.querySelectorAll('#afModes .fchip').forEach(b=> b.addEventListener('click', ()=>{
      readChecks(); st.mode = b.dataset.mode; render();
    }));
    body.querySelectorAll('#afCuisines .fchip').forEach(b=> b.addEventListener('click', ()=>{
      b.classList.toggle('on');
    }));
    const cancel = document.getElementById('afCancel');
    if(cancel) cancel.addEventListener('click', _closePrompt);
    const x = document.getElementById('promptClose');
    if(x) x.onclick = _closePrompt;
    const go = document.getElementById('afGo');
    if(go) go.addEventListener('click', onGenerate);
  }

  function onGenerate(){
    readChecks();
    // Cocinas marcadas (si el selector existe)
    let cuisines = null;
    const cWrap = document.getElementById('afCuisines');
    if(cWrap){
      const onIds = [...cWrap.querySelectorAll('.fchip.on')].map(b=>b.dataset.cuis);
      if(!onIds.length){ pnAlert('Marca al menos una cocina para generar el menú.'); return; }
      if(onIds.length < choices.length) cuisines = onIds;   // todas marcadas = sin acotar
    }
    saveAutoPrefs({template:st.template, quick:st.quick, batch:st.batch, favBoost:st.favBoost, cuisines});

    const opts = {
      respectExisting: st.mode === 'fill',
      template: st.template, quick: st.quick, batch: st.batch,
      cuisines
    };
    if(st.mode === 'fav'){
      const favs = getDishFavs().filter(id => DISHES[id] && !(typeof dishHiddenByCuisine==='function' && dishHiddenByCuisine(id)));
      if(!favs.length){ pnAlert('Aún no tienes recetas favoritas activas.\nMarca algunas con la ★ en el catálogo y vuelve a intentarlo.'); return; }
      opts.favorites = true; opts.favoritesStrict = true; opts.favList = favs;
    } else if(st.favBoost){
      opts.favorites = true;
    }
    _closePrompt();
    safeAutofill(opts);
  }

  render();
  _showPrompt();
}

/* Sugerencia automática para UNA franja (botón 🎲 del picker):
   usa el mismo motor respetando el resto de la semana ya planificada. */
function suggestForSlot(day, slot){
  const prefs = loadAutoPrefs();
  const ctx = buildAutofillCtx({template:prefs.template, quick:prefs.quick, cuisines:prefs.cuisines, favorites:prefs.favBoost});
  autofillPreload(ctx, day, slot);
  const todaysComFoods = slot === 'cen'
    ? (CalState.data[day].com||[]).flatMap(id => DISHES[id]?.food || [])
    : [];
  return pickBest(slot, day, ctx, todaysComFoods);
}

/* ── BIND ──────────────────────────────────────────── */
document.getElementById('pickerClose').addEventListener('click', closePicker);
document.getElementById('pickerBg').addEventListener('click', e=>{
  if(e.target.id === 'pickerBg') closePicker();
});
document.getElementById('calLoadTpl').addEventListener('click', loadTemplate);
document.getElementById('calClear').addEventListener('click', clearCalendar);
document.getElementById('calSave').addEventListener('click', openSavePrompt);

// auto-fill buttons (wired after DOM exists) — abren el diálogo de opciones
const calAutoFillBtn = document.getElementById('calAutoFill');
if(calAutoFillBtn) calAutoFillBtn.addEventListener('click', ()=> openAutofillOptions('fill'));
const calAutoNewBtn = document.getElementById('calAutoNew');
if(calAutoNewBtn) calAutoNewBtn.addEventListener('click', ()=> openAutofillOptions('new'));
const calAutoFavBtn = document.getElementById('calAutoFav');
if(calAutoFavBtn) calAutoFavBtn.addEventListener('click', ()=> openAutofillOptions('fav'));

// "⋯ Más acciones": despliega/oculta las acciones secundarias del calendario
const calMoreBtn = document.getElementById('calMoreBtn');
const calMorePanel = document.getElementById('calMore');
if(calMoreBtn && calMorePanel){
  calMoreBtn.addEventListener('click', ()=>{
    const open = calMorePanel.classList.toggle('hidden') === false;
    calMoreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Al elegir una acción secundaria, repliega el panel (móvil sobre todo)
  calMorePanel.addEventListener('click', (e)=>{
    if(e.target.closest('.cal-btn')){
      calMorePanel.classList.add('hidden');
      calMoreBtn.setAttribute('aria-expanded','false');
    }
  });
}

// Re-render del calendario al cambiar el tamaño REAL de la ventana.
// Importante: NO re-renderizar si el usuario está escribiendo en un campo
// (al abrir el teclado del móvil cambia la altura del viewport y se
// disparaba un resize que recreaba el input → "no se puede escribir").
let _calLastW = window.innerWidth;
window.addEventListener('resize', ()=>{
  if(S.view !== 'cal') return;
  // Si solo cambió la altura (teclado) y el ancho es el mismo, ignóralo.
  const widthChanged = window.innerWidth !== _calLastW;
  _calLastW = window.innerWidth;
  if(!widthChanged) return;
  // Si hay un campo enfocado, no reconstruyas el DOM bajo sus pies.
  if(typeof isTypingField === 'function' && isTypingField()) return;
  clearTimeout(window.__calRz);
  window.__calRz = setTimeout(()=>{
    if(typeof isTypingField === 'function' && isTypingField()) return;
    renderCalendar();
  }, 150);
});

/* expose */
window.CalState = CalState;
window.renderCalendar = renderCalendar;
window.emptyCal = emptyCal;
window.persistCal = persistCal;
window.normalizeCalData = normalizeCalData;
