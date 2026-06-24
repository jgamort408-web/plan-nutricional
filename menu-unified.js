/* ══════════════════════════════════════════════════════════
   MENU UNIFIED · Calendario unificado por SEMANA (fechas reales)
   Modelo HÍBRIDO:
     · La plantilla semanal de nutrición (CalState.data por día de
       la semana) sigue siendo el "patrón".
     · Se puede materializar/sobre-escribir por FECHA real en
       NutDates ('YYYY-MM-DD' → {des,com,mer,cen}).
     · resolveMeals(fecha) = override de la fecha, o si no, el
       patrón de ese día de la semana.
   La vista muestra los 7 días de la semana con comidas + entreno
   (SportPlan) + balance energético por día.
   depende de: CalState, DISHES, TARGETS, S, px, SportPlan,
     dayTotals, spKey, openModal, openSessionDetail (globals)
══════════════════════════════════════════════════════════ */

const LS_NUT_DATES = 'mnut:caldates:v1';
function getNutDates(){ return lsGet(LS_NUT_DATES, {}); }
let NutDates = getNutDates();
function persistNutDates(){ lsSet(LS_NUT_DATES, NutDates); }

/* fecha → clave 'YYYY-MM-DD' */
function uDateKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function uFromKey(k){ const p=(k||'').split('-').map(Number); return new Date(p[0],(p[1]||1)-1,p[2]||1); }
function uWeekdayKey(dateKey){ return JS_DAY_TO_KEY[uFromKey(dateKey).getDay()]; }
function uAddDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }
function uMonday(d){ const r=new Date(d); r.setHours(0,0,0,0); const wd=(r.getDay()+6)%7; r.setDate(r.getDate()-wd); return r; }
const U_MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

/* comidas resueltas para una fecha: override o patrón del día de la semana */
function resolveMeals(dateKey){
  if(NutDates[dateKey]) return NutDates[dateKey];
  const wk = uWeekdayKey(dateKey);
  return (typeof CalState!=='undefined' && CalState.data && CalState.data[wk]) ? CalState.data[wk] : {des:[],com:[],mer:[],cen:[]};
}
function dateHasOverride(dateKey){ return !!NutDates[dateKey]; }
function ensureNutDate(dateKey){
  if(!NutDates[dateKey]){
    const base = resolveMeals(dateKey);
    NutDates[dateKey] = {des:(base.des||[]).slice(), com:(base.com||[]).slice(), mer:(base.mer||[]).slice(), cen:(base.cen||[]).slice()};
  }
  return NutDates[dateKey];
}
/* materializa la plantilla semanal sobre un rango de fechas reales */
function applyTemplateToDates(startKey, days){
  const start = uFromKey(startKey);
  for(let i=0;i<days;i++){
    const k = uDateKey(uAddDays(start,i));
    const wk = JS_DAY_TO_KEY[uAddDays(start,i).getDay()];
    const tpl = (CalState.data && CalState.data[wk]) || {des:[],com:[],mer:[],cen:[]};
    NutDates[k] = {des:(tpl.des||[]).slice(), com:(tpl.com||[]).slice(), mer:(tpl.mer||[]).slice(), cen:(tpl.cen||[]).slice()};
  }
  persistNutDates();
}

/* ── Estado de la vista ─────────────────────────────────────── */
let _weekCursor = (function(){ const d=new Date(); d.setHours(0,0,0,0); return d; })();
const U_SLOTS = [
  {k:'des', lbl:'Desayuno', ico:'☀️'},
  {k:'com', lbl:'Comida',   ico:'🍽'},
  {k:'mer', lbl:'Merienda', ico:'🍎'},
  {k:'cen', lbl:'Cena',     ico:'🌙'}
];

function uEsc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* totales de comidas de un día — MISMO modelo que el Plan Semanal (Fase 2b):
   cada receta escala a la necesidad de esa comida de la persona activa, y si una
   franja tiene varias recetas se reparte entre ellas (sumCellStd + dishScaledMeal). */
function dayMealKcal(meals){
  let k=0;
  U_SLOTS.forEach(sm=>{
    const ids = (meals[sm.k]||[]).filter(id=>DISHES[id]);
    if(!ids.length) return;
    const sumStd = (typeof sumCellStd==='function') ? sumCellStd(ids) : 0;
    ids.forEach(id=>{
      const d = DISHES[id];
      if(typeof dishScaledMeal==='function' && d.comp && d.comp.length){
        k += dishScaledMeal(d, (S.p==='AB'?'AB':S.p), sm.k, sumStd).tot.k;
      } else {
        k += px(d.kcal);   // recetas sin composición: valor precalculado
      }
    });
  });
  return Math.round(k);
}
function daySportKcal(dateKey){
  if(typeof SportPlan==='undefined' || typeof dayTotals!=='function') return 0;
  const ents = SportPlan.days[dateKey] || [];
  if(!ents.length) return 0;
  const t = dayTotals(ents);
  return S.p==='A'? t.kA : S.p==='B'? t.kB : (t.kA+t.kB);
}

/* ── Render ─────────────────────────────────────────────────── */
function renderWeek(){
  const host = document.getElementById('weekBoard'); if(!host) return;
  const mon = uMonday(_weekCursor);
  const dates = Array.from({length:7},(_,i)=> uAddDays(mon,i));
  const today = uDateKey(new Date());
  const last = uAddDays(mon,6);

  // título
  const titleEl = document.getElementById('weekTitle');
  if(titleEl){ titleEl.textContent = `${mon.getDate()} ${U_MONTHS[mon.getMonth()]} – ${last.getDate()} ${U_MONTHS[last.getMonth()]} ${last.getFullYear()}`; }
  const T = TARGETS[S.p];

  let cols = '';
  dates.forEach(date=>{
    const key = uDateKey(date);
    const wd = WEEK_DAYS[(date.getDay()+6)%7];
    const meals = resolveMeals(key);
    const isToday = key===today;
    const override = dateHasOverride(key);

    const slotsHtml = U_SLOTS.map(sm=>{
      const arr = meals[sm.k]||[];
      const chips = arr.map(id=>{ const d=DISHES[id]; if(!d) return ''; return `<div class="wk-meal" data-dish="${id}" title="${uEsc(d.nom)}"><span class="wk-emoji">${d.icon||'🍽'}</span><span class="wk-mn">${uEsc(d.short||d.nom)}</span><button class="wk-x" data-rm-meal data-date="${key}" data-slot="${sm.k}" data-id="${id}" aria-label="Quitar">✕</button></div>`; }).join('');
      return `<div class="wk-slot"><span class="wk-slot-h">${sm.ico} ${sm.lbl} <button class="wk-add" data-add-meal data-date="${key}" data-slot="${sm.k}" aria-label="Añadir ${sm.lbl}">＋</button></span>${chips || '<span class="wk-empty">—</span>'}</div>`;
    }).join('');

    const ents = (typeof SportPlan!=='undefined' && SportPlan.days[key]) ? SportPlan.days[key] : [];
    const sportHtml = ents.length ? ents.map((e,idx)=>{ const s=SESSIONS[e.s]; if(!s) return ''; const ty=(EX_TYPES[s.type]||{ico:'•'}); const who=({A:'♂',B:'♀',AB:'♂♀'})[e.who]||'♂♀'; return `<div class="wk-sport" data-skey="${key}" data-sidx="${idx}" title="${uEsc(s.name)}"><span>${ty.ico}</span><span class="wk-sn">${uEsc(s.short||s.name)}</span><span class="wk-who">${who}</span></div>`; }).join('') : '<span class="wk-empty">descanso</span>';

    const ing = dayMealKcal(meals);
    const burn = daySportKcal(key);
    const rem = (T.kcal||0) + burn - ing;
    const remCls = rem < -0.05*(T.kcal||1) ? 'over' : rem < 0 ? 'near' : 'ok';

    cols += `<div class="wk-col ${isToday?'today':''}">
      <div class="wk-dh"><span class="wk-dname">${wd.long}</span><span class="wk-dnum">${date.getDate()} ${U_MONTHS[date.getMonth()]}${override?` <em title="Editado para esta fecha">✎</em><button class="wk-revert" data-revert="${key}" title="Volver a la plantilla de ${wd.long}">↺</button>`:''}${isToday?' <b>hoy</b>':''}</span></div>
      <div class="wk-meals">${slotsHtml}</div>
      <div class="wk-sec-h">🏋️ Entreno <button class="wk-add" data-add-sport data-date="${key}" aria-label="Añadir entreno">＋</button></div>
      <div class="wk-sports">${sportHtml}</div>
      <div class="wk-bal nutr ${remCls}">
        <div class="wk-bal-row"><span>🍽 ${ing}</span>${burn?`<span>🏋️ +${burn}</span>`:''}</div>
        <div class="wk-bal-net">${rem>=0?'quedan':'exceso'} <b>${Math.abs(rem)}</b></div>
      </div>
    </div>`;
  });

  host.innerHTML = cols;
  // interacciones
  host.querySelectorAll('.wk-meal').forEach(el=> el.addEventListener('click', (e)=>{ if(e.target.closest('.wk-x')) return; if(typeof openModal==='function') openModal(el.dataset.dish); }));
  host.querySelectorAll('.wk-sport').forEach(el=> el.addEventListener('click', ()=>{
    const arr = SportPlan.days[el.dataset.skey]; const ent = arr && arr[+el.dataset.sidx];
    if(ent && typeof openSessionDetail==='function') openSessionDetail(ent.s, {key:el.dataset.skey, idx:+el.dataset.sidx});
  }));
  // edición por fecha
  host.querySelectorAll('[data-rm-meal]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); removeMeal(b.dataset.date, b.dataset.slot, b.dataset.id); }));
  host.querySelectorAll('[data-add-meal]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); openMealPicker(b.dataset.date, b.dataset.slot); }));
  host.querySelectorAll('[data-add-sport]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); addSportToDate(b.dataset.date); }));
  host.querySelectorAll('[data-revert]').forEach(b=> b.addEventListener('click', e=>{ e.stopPropagation(); revertDay(b.dataset.revert); }));

  // resumen objetivo
  const objEl = document.getElementById('weekObjetivo');
  if(objEl){ objEl.textContent = `Objetivo ${S.p}: ${T.kcal} kcal/día`; objEl.classList.add('nutr'); }
}

/* navegación */
function weekGo(deltaDays){ _weekCursor = uAddDays(_weekCursor, deltaDays); renderWeek(); }
function weekToday(){ _weekCursor = new Date(); _weekCursor.setHours(0,0,0,0); renderWeek(); }
async function weekApplyTemplate(){
  const mon = uMonday(_weekCursor);
  if(!await pnConfirm('¿Aplicar tu plantilla semanal a estas 7 fechas?\nQuedarán fijadas como copias editables por día (no cambia la plantilla).', {okText:'Aplicar'})) return;
  applyTemplateToDates(uDateKey(mon), 7);
  renderWeek();
}

/* bind toolbar (una vez) */
(function bindWeek(){
  const b=(id,fn)=>{ const el=document.getElementById(id); if(el) el.addEventListener('click', fn); };
  b('weekPrev', ()=>weekGo(-7));
  b('weekNext', ()=>weekGo(7));
  b('weekToday', weekToday);
  b('weekApply', weekApplyTemplate);
})();

/* ── Edición por fecha ──────────────────────────────────────── */
function uNorm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

function openMealPicker(dateKey, slot){
  const sm = U_SLOTS.find(s=>s.k===slot) || {ico:'',lbl:slot};
  const cands = Object.keys(DISHES).filter(id=> DISHES[id].cat===slot && !DISHES[id].libre);
  let q='';
  const cur = ()=> (NutDates[dateKey] ? NutDates[dateKey][slot] : (resolveMeals(dateKey)[slot]||[]));
  function listHtml(){
    const arr=cur();
    const out = cands.filter(id=> !q || uNorm(DISHES[id].nom).includes(q)).map(id=>{ const d=DISHES[id]; const inc=arr.includes(id); return `<div class="picker-it ${inc?'sel':''}" data-pick="${id}"><div class="pi-ico">${d.icon||'🍽'}</div><div class="pi-body"><div class="pi-n">${uEsc(d.nom)}${inc?' <span class="pi-added">✓</span>':''}</div><div class="pi-m"><span class="nutr">${px(d.kcal)} kcal</span></div></div></div>`; }).join('');
    return out || '<div class="sp-empty">Sin recetas para esta franja.</div>';
  }
  const wd = WEEK_DAYS[(uFromKey(dateKey).getDay()+6)%7];
  openForm(`<div class="form-hd"><h2>${sm.ico} ${sm.lbl}</h2><span class="form-sub">${wd.long} · ${dateKey} · toca para añadir o quitar</span></div>
    <div class="picker-body"><input class="dish-search" id="mpSearch" type="search" placeholder="🔎 Buscar receta…"><div class="picker-list" id="mpList">${listHtml()}</div></div>
    <div class="form-actions"><button class="btn-prim" id="mpDone">Listo</button></div>`);
  const listEl=document.getElementById('mpList');
  function bindItems(){ listEl.querySelectorAll('.picker-it').forEach(it=> it.addEventListener('click', ()=>{
    const id=it.dataset.pick; const day=ensureNutDate(dateKey); const i=day[slot].indexOf(id);
    if(i>=0) day[slot].splice(i,1); else day[slot].push(id);
    persistNutDates(); listEl.innerHTML=listHtml(); bindItems(); renderWeek();
  })); }
  bindItems();
  const se=document.getElementById('mpSearch'); if(se) se.addEventListener('input', ()=>{ q=uNorm(se.value); listEl.innerHTML=listHtml(); bindItems(); });
  document.getElementById('mpDone').addEventListener('click', ()=>{ closeForm(); renderWeek(); });
}
function removeMeal(dateKey, slot, id){
  const day=ensureNutDate(dateKey); const i=day[slot].indexOf(id); if(i<0) return;
  day[slot].splice(i,1); persistNutDates(); renderWeek();
  if(typeof showUndo==='function') showUndo('Receta quitada del día', ()=>{ ensureNutDate(dateKey)[slot].push(id); persistNutDates(); renderWeek(); });
}
function revertDay(dateKey){
  if(!NutDates[dateKey]) return;
  const snap=JSON.parse(JSON.stringify(NutDates[dateKey]));
  delete NutDates[dateKey]; persistNutDates(); renderWeek();
  if(typeof showUndo==='function') showUndo('Día restablecido a la plantilla', ()=>{ NutDates[dateKey]=snap; persistNutDates(); renderWeek(); });
}
function addSportToDate(key){
  if(typeof openSpDayPicker!=='function'){ alert('Abre Deporte › Calendario para añadir entrenos.'); return; }
  openSpDayPicker(key);
  const bg=document.getElementById('formBg');
  if(bg){ const obs=new MutationObserver(()=>{ if(!bg.classList.contains('show')){ obs.disconnect(); renderWeek(); } }); obs.observe(bg,{attributes:true,attributeFilter:['class']}); }
}

window.renderWeek = renderWeek;
window.NutDates = NutDates;
