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

const CalState = (function(){
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
                <div class="pi-n">${d.nom}${added?' <span class="pi-added">✓ añadido</span>':''}${violBadge}</div>
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

/* Porcentaje acumulado del objetivo kcal/macros que debería cubrirse tras
   añadir cada franja, en el orden de relleno (com → cen → des → mer). */
const SLOT_CUM_PCT = {com:0.35, cen:0.60, des:0.85, mer:1.0};

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

  // 1) Coincide categoría de comida del día (food hints)
  const hints = AUTO_SLOT_HINTS[ctx.day]?.[ctx.slot] || [];
  const foods = d.food || [];
  if(hints.length){
    const overlap = hints.filter(h => foods.includes(h)).length;
    if(overlap > 0) score += 300 * overlap;
    else score -= 60; // no encaja con la sugerencia del día
  }

  // 2) Cumple cuotas semanales pendientes (más puntos si esta receta aporta tipos que aún faltan)
  if(ctx.slot === 'com'){
    foods.forEach(f=>{
      const need = (ctx.quota[f] || 0);
      const got  = (ctx.gotCom[f] || 0);
      if(need > 0 && got < need) score += 200 * (need - got);
      if(got >= (AUTO_WEEKLY_QUOTA.com[f] ?? Infinity) && (AUTO_WEEKLY_QUOTA.com[f] ?? 0) > 0){
        score -= 250; // ya tenemos esa cuota cubierta
      }
    });
  }

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

  // 8) Ajuste a kcal y macros objetivo (la pieza nueva)
  //    Compara el total del día (incluyendo este candidato) con el % esperado
  //    para la franja, según el objetivo de cada persona. Penaliza más pasarse
  //    que quedarse corto.
  if(ctx.dayTotals && ctx.dayTotals[ctx.day] && SLOT_CUM_PCT[ctx.slot]){
    const expectedPct = SLOT_CUM_PCT[ctx.slot];
    let macroPenalty = 0;
    let counts = 0;
    PEOPLE.forEach((p, i)=>{
      const tgt = TARGETS[p];
      if(!tgt || !tgt.kcal) return;
      counts++;
      const cur = (ctx.dayTotals[ctx.day] && ctx.dayTotals[ctx.day][p]) || {k:0,p:0,f:0,c:0};
      // valores tras añadir este candidato
      const k  = cur.k + (+d.kcal[i]||0);
      const pp = cur.p + (+(d.mac.p[i])||0);
      const ff = cur.f + (+(d.mac.f[i])||0);
      const cc = cur.c + (+(d.mac.c[i])||0);
      // Objetivos esperados acumulados tras esta franja
      const tK = expectedPct * tgt.kcal;
      const tP = expectedPct * (tgt.p || 0);
      const tF = expectedPct * (tgt.f || 0);
      const tC = expectedPct * (tgt.c || 0);
      // Desviación relativa (sobre el objetivo diario completo)
      const wKcal  = (k  - tK) / Math.max(tgt.kcal, 1);
      const wProt  = (pp - tP) / Math.max(tgt.p || 1, 1);
      const wFat   = (ff - tF) / Math.max(tgt.f || 1, 1);
      const wCarb  = (cc - tC) / Math.max(tgt.c || 1, 1);
      // El kcal pesa más; las grasas un poco menos.
      // Pasarse pesa el doble (factor 2.0) que quedarse corto (factor 1.0)
      const w = (x, weight) => weight * (x > 0 ? x * 2.0 : -x * 1.0);
      macroPenalty +=
        w(wKcal, 2.5) +
        w(wProt, 1.2) +
        w(wFat,  0.9) +
        w(wCarb, 1.0);
    });
    if(counts) macroPenalty /= counts;
    // Aplica como penalización: 0 deviation → +250 ; 0.4 → -250
    score += 250 - macroPenalty * 1250;
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
function pickBest(slot, day, ctx, currentDayCom){
  let candidates = Object.keys(DISHES).filter(id => DISHES[id].cat === slot && !DISHES[id].libre && !DISHES[id].loose);
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
  // Pool = candidatos dentro del 35% superior del rango de puntuación,
  // con un mínimo de 4 y un máximo de 8 para que siempre haya variedad.
  const margin = range * 0.35;
  let pool = scored.filter(c => c.s >= best - margin);
  if(pool.length < 4) pool = scored.slice(0, Math.min(4, scored.length));
  if(pool.length > 8) pool = pool.slice(0, 8);

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

function autofillCalendar(opts){
  opts = opts || {};
  const respectExisting = opts.respectExisting !== false; // por defecto sí

  // Combina restricciones de TODAS las personas (la receta debe pasarlas todas)
  const restrictions = [...new Set(PEOPLE.flatMap(id => (TARGETS[id]||{}).restr || []))];

  const ctx = {
    usedCount: {},     // {dishId: count}
    gotCom:    {},     // {foodKey: count} acumulado en comidas
    lastBySlot:{},     // {slot: lastDishId}
    quota:     {...AUTO_WEEKLY_QUOTA.com},
    restrictions,
    favSet:    opts.favorites ? new Set(opts.favList || getDishFavs()) : null,
    favBoost:  opts.favorites ? 4000 : 0,
    strictFav: !!opts.favoritesStrict,   // sólo favoritos: no rellenar con otras recetas
    dayTotals: {}      // {day: {A:{k,p,f,c}, B:{k,p,f,c}}}
  };
  // Init per-day totals (una entrada por persona activa)
  const blankTotals = ()=>{ const o={}; PEOPLE.forEach(id=>{ o[id]={k:0,p:0,f:0,c:0}; }); return o; };
  WEEK_DAYS.forEach(d=>{ ctx.dayTotals[d.k] = blankTotals(); });

  // Comprueba si quedará alguna categoría sin candidatos
  const blocked = [];
  CATEGORIES.forEach(c=>{
    const ok = Object.keys(DISHES).some(id => DISHES[id].cat === c.key && !restrictions.some(k=>{
      const r = RESTRICTIONS_MAP[k]; return r && r.violates(DISHES[id]);
    }));
    if(!ok) blocked.push(c.label);
  });
  if(blocked.length){
    alert(`Con las restricciones actuales no hay recetas disponibles para: ${blocked.join(', ')}.\n\nAjusta las restricciones en Ajustes o crea recetas nuevas.`);
    return;
  }

  // Si respetamos lo existente, precarga contadores y totales por día
  if(respectExisting){
    Object.entries(CalState.data).forEach(([day, dayObj])=>{
      Object.entries(dayObj).forEach(([slot, arr])=>{
        arr.forEach(id=>{
          ctx.usedCount[id] = (ctx.usedCount[id]||0) + 1;
          if(slot === 'com'){
            (DISHES[id]?.food||[]).forEach(f=>{ ctx.gotCom[f] = (ctx.gotCom[f]||0) + 1; });
          }
          const d = DISHES[id];
          if(d && ctx.dayTotals[day]) addToTotals(ctx.dayTotals[day], d);
        });
      });
    });
  } else {
    CalState.data = emptyCal();
  }

  // Suma los macros de un plato a los totales por persona (clave = id de PEOPLE)
  function addToTotals(totals, d){
    PEOPLE.forEach((id, i)=>{
      const t = totals[id]; if(!t || !d.kcal) return;
      t.k += (+d.kcal[i]||0); t.p += (+(d.mac.p[i])||0); t.f += (+(d.mac.f[i])||0); t.c += (+(d.mac.c[i])||0);
    });
  }
  // Helper para registrar el pick y actualizar dayTotals
  const registerPick = (day, slot, id)=>{
    ctx.usedCount[id] = (ctx.usedCount[id]||0) + 1;
    ctx.lastBySlot[slot] = id;
    const d = DISHES[id];
    if(d && ctx.dayTotals[day]) addToTotals(ctx.dayTotals[day], d);
  };

  // Orden de relleno: COMIDAS primero (más restrictivo por plantilla),
  // luego CENAS (dependen de la comida del mismo día), luego DESAYUNOS y MERIENDAS.
  const orderedDays = WEEK_DAYS.map(d => d.k);

  // — COMIDAS —
  orderedDays.forEach(day=>{
    if(CalState.data[day].com.length && respectExisting) return;
    const id = pickBest('com', day, ctx, []);
    if(!id) return;
    CalState.data[day].com = [id];
    registerPick(day, 'com', id);
    (DISHES[id].food||[]).forEach(f=>{ ctx.gotCom[f] = (ctx.gotCom[f]||0) + 1; });
  });

  // — CENAS —
  orderedDays.forEach(day=>{
    if(CalState.data[day].cen.length && respectExisting) return;
    const todaysComFoods = (CalState.data[day].com||[]).flatMap(id => DISHES[id]?.food || []);
    const id = pickBest('cen', day, ctx, todaysComFoods);
    if(!id) return;
    CalState.data[day].cen = [id];
    registerPick(day, 'cen', id);
  });

  // — DESAYUNOS — (rotar para variedad)
  orderedDays.forEach(day=>{
    if(CalState.data[day].des.length && respectExisting) return;
    const id = pickBest('des', day, ctx, []);
    if(!id) return;
    CalState.data[day].des = [id];
    registerPick(day, 'des', id);
  });

  // — MERIENDAS —
  orderedDays.forEach(day=>{
    if(CalState.data[day].mer.length && respectExisting) return;
    const id = pickBest('mer', day, ctx, []);
    if(!id) return;
    CalState.data[day].mer = [id];
    registerPick(day, 'mer', id);
  });

  CalState.modified = true;
  persistCal();
  renderCalendar();

  // Resumen al usuario
  showAutofillReport();
}

function showAutofillReport(){
  const com = weeklyCounts('com');
  const all = weeklyCounts('all');
  const lines = [];
  const get = (src, k) => src[k] || 0;
  const restr = [...new Set(PEOPLE.flatMap(id => (TARGETS[id]||{}).restr || []))];
  if(restr.length){
    const labels = restr.map(k=> RESTRICTIONS_MAP[k]?.lbl || k).join(', ');
    lines.push(`🚫 Restricciones aplicadas: ${labels}`);
    lines.push('');
  }
  lines.push(`Legumbre · comida: ${get(com,'leg')}/2 días (semana: ${get(all,'leg')})`);
  lines.push(`Pescado azul · comida: ${get(com,'pa')}/1`);
  lines.push(`Pescado blanco · comida: ${get(com,'pb')}/1`);
  lines.push(`Carne blanca · comida: ${get(com,'cb')}/1`);
  lines.push(`Arroz/Pasta · comida: ${get(com,'apq')}/1`);
  if(get(com,'cr')) lines.push(`⚠ Carne roja · comida: ${get(com,'cr')} (sólo 1 cada 2ª semana)`);
  // recetas únicas
  const used = {};
  Object.values(CalState.data).forEach(day=>Object.values(day).forEach(arr=>arr.forEach(id=>{used[id]=(used[id]||0)+1;})));
  const unique = Object.keys(used).length;
  const total  = Object.values(used).reduce((a,b)=>a+b,0);
  lines.push('');
  lines.push(`Recetas únicas: ${unique} · usos totales: ${total}`);
  toastAutofill(lines.join('\n'));
}

function toastAutofill(msg){
  let t = document.getElementById('autoToast');
  if(!t){
    t = document.createElement('div');
    t.id = 'autoToast';
    t.className = 'auto-toast';
    t.setAttribute('role','status'); t.setAttribute('aria-live','polite');
    document.body.appendChild(t);
  }
  t.innerHTML = `<div class="at-hd">✨ Calendario autocompletado</div><pre>${escAttr(msg)}</pre>`;
  t.classList.add('show');
  clearTimeout(window.__autoToastT);
  window.__autoToastT = setTimeout(()=> t.classList.remove('show'), 6000);
  t.addEventListener('click', ()=> t.classList.remove('show'), {once:true});
}

function safeAutofill(opts){
  try{ autofillCalendar(opts); }
  catch(e){ console.error('autofill', e); if(typeof pnAlert==='function') pnAlert('No se pudo autocompletar.\n'+(e&&e.message||e)); }
}

async function autofillFromMenu(){
  if(!await pnConfirm('¿Autocompletar?\nSe rellenarán SÓLO las franjas vacías, respetando lo que ya hay. Usa "Vaciar" antes si quieres empezar desde cero.', {okText:'Autocompletar'})) return;
  safeAutofill({respectExisting:true});
}

async function autofillFromScratch(){
  if(!await pnConfirm('¿Generar un menú nuevo desde cero?\nSe borrará todo lo actual.', {danger:true, okText:'Generar nuevo'})) return;
  safeAutofill({respectExisting:false});
}

async function autofillFromFavorites(){
  // SÓLO favoritos ACTIVOS: existentes y no ocultos por una cocina desactivada.
  const favs = getDishFavs().filter(id => DISHES[id] && !(typeof dishHiddenByCuisine==='function' && dishHiddenByCuisine(id)));
  if(!favs.length){ pnAlert('Aún no tienes recetas favoritas activas.\nMarca algunas con la ★ en el catálogo (y comprueba que su cocina esté activada) y vuelve a intentarlo.'); return; }
  // ¿Hay favoritos para cada franja? Avisa de las que quedarán vacías.
  const byCat = {};
  favs.forEach(id=>{ const c = DISHES[id].cat; byCat[c] = (byCat[c]||0) + 1; });
  const missing = CATEGORIES.filter(c=> !byCat[c.key]).map(c=> c.label);
  const warn = missing.length ? `\n\nNo tienes favoritos para: ${missing.join(', ')}. Esas franjas quedarán vacías (puedes completarlas a mano).` : '';
  if(!await pnConfirm(`¿Generar un menú SÓLO con tus ${favs.length} recetas favoritas?\nSe usarán únicamente tus favoritos actuales; no se añadirá ninguna otra receta. Se borrará el menú actual.${warn}`, {danger:true, okText:'Generar'})) return;
  safeAutofill({respectExisting:false, favorites:true, favoritesStrict:true, favList:favs});
}

/* ── BIND ──────────────────────────────────────────── */
document.getElementById('pickerClose').addEventListener('click', closePicker);
document.getElementById('pickerBg').addEventListener('click', e=>{
  if(e.target.id === 'pickerBg') closePicker();
});
document.getElementById('calLoadTpl').addEventListener('click', loadTemplate);
document.getElementById('calClear').addEventListener('click', clearCalendar);
document.getElementById('calSave').addEventListener('click', openSavePrompt);

// auto-fill buttons (wired after DOM exists)
const calAutoFillBtn = document.getElementById('calAutoFill');
if(calAutoFillBtn) calAutoFillBtn.addEventListener('click', autofillFromMenu);
const calAutoNewBtn = document.getElementById('calAutoNew');
if(calAutoNewBtn) calAutoNewBtn.addEventListener('click', autofillFromScratch);
const calAutoFavBtn = document.getElementById('calAutoFav');
if(calAutoFavBtn) calAutoFavBtn.addEventListener('click', autofillFromFavorites);

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
