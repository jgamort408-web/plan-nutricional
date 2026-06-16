/* ══════════════════════════════════════════════════════════
   MENU APP · interactions
══════════════════════════════════════════════════════════ */

/* ── LOCAL STORAGE LAYER ─────────────────────────────── */
const LS = {
  TARGETS: 'mnut:targets:v1',
  PEOPLE:  'mnut:people:v1',       // lista flexible de personas (N)
  CUSTOM:  'mnut:dishes:v1',
  CART:    'mnut:cart:v1',
  PERSONA: 'mnut:persona:v1',
  VIEW:    'mnut:view:v1',
  CAL:     'mnut:cal:v1',         // current working calendar
  SAVED:   'mnut:saved:v1',       // saved menus dictionary
  FB:      'mnut:feedback:v1'     // diner feedback log
};
function lsGet(k, def){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):def; }catch(e){ return def; } }
let _lsQuotaWarned = false;
function lsSet(k, v){
  try{ localStorage.setItem(k, JSON.stringify(v)); }
  catch(e){
    const quota = e && (e.name==='QuotaExceededError' || e.code===22 || /quota/i.test(e.message||''));
    if(quota && !_lsQuotaWarned){
      _lsQuotaWarned = true;
      try{ alert('⚠ El almacenamiento del navegador está lleno y no se han podido guardar los últimos cambios.\n\nExporta una copia (Ajustes → Copia de datos) y borra menús/planes antiguos para liberar espacio.'); }catch(_){}
    }
  }
}

function escHtml(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* ── ¿El usuario está escribiendo en un campo? ───────────────
   Se usa para NO re-renderizar (y destruir el input/foco) mientras
   se teclea. Causa del bug "a veces no se puede escribir": un
   re-render (p.ej. por resize al abrir el teclado del móvil) recreaba
   el input justo mientras escribías. */
function isTypingField(el){
  el = el || document.activeElement;
  if(!el) return false;
  const tag = el.tagName;
  if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if(el.isContentEditable) return true;
  return false;
}
window.isTypingField = isTypingField;

/* ── Toast "Deshacer" para borrados ───────────────────────── */
let _undoTimer;
function showUndo(msg, restoreFn){
  let t = document.getElementById('undoToast');
  if(!t){ t = document.createElement('div'); t.id='undoToast'; t.className='undo-toast'; t.setAttribute('role','status'); t.setAttribute('aria-live','polite'); document.body.appendChild(t); }
  t.innerHTML = `<span class="ut-msg">${escHtml(msg)}</span><button class="ut-btn" id="undoBtn">↶ Deshacer</button>`;
  t.classList.add('show');
  clearTimeout(_undoTimer);
  _undoTimer = setTimeout(()=> t.classList.remove('show'), 6500);
  document.getElementById('undoBtn').onclick = ()=>{ try{ restoreFn(); }catch(e){} t.classList.remove('show'); clearTimeout(_undoTimer); };
}
window.showUndo = showUndo;

/* ── Favoritos de recetas ─────────────────────────────── */
const LS_DISH_FAV = 'mnut:favs:v1';
function getDishFavs(){ const f = lsGet(LS_DISH_FAV, []); return Array.isArray(f)?f:[]; }
function isDishFav(id){ return getDishFavs().includes(id); }
function toggleDishFav(id){ const f=getDishFavs(); const i=f.indexOf(id); if(i>=0) f.splice(i,1); else f.push(id); lsSet(LS_DISH_FAV, f); return i<0; }

/* default targets (snapshot before any user override) */
const DEFAULT_TARGETS = JSON.parse(JSON.stringify(TARGETS));

/* recompute combined (AB = todas las personas) + etiqueta de cada persona */
function recomputeAB(){
  PEOPLE.forEach((id, i)=>{
    const t = TARGETS[id]; if(!t) return;
    if(!t.sym) t.sym = PERSON_SYMS[i] || '🧑';
    t.lbl = `${(t.name||'').trim() || ('Persona '+(i+1))} · ${t.kcal} kcal/día`;
  });
  const sum = PEOPLE.reduce((a,id)=>{ const t=TARGETS[id]||{}; a.kcal+=t.kcal||0; a.p+=t.p||0; a.f+=t.f||0; a.c+=t.c||0; return a; }, {kcal:0,p:0,f:0,c:0});
  if(!TARGETS.AB) TARGETS.AB = {restr:[]};
  TARGETS.AB.kcal=sum.kcal; TARGETS.AB.p=sum.p; TARGETS.AB.f=sum.f; TARGETS.AB.c=sum.c;
  TARGETS.AB.lbl = `Todas · ${sum.kcal} kcal/día`;
}

/* Hydrate state from localStorage */
function hydrate(){
  const stP = lsGet(LS.PEOPLE, null);
  if(Array.isArray(stP) && stP.length){
    // Formato nuevo: lista flexible de personas
    PEOPLE = [];
    stP.forEach((pp, i)=>{
      const id = pp.id || ('P' + i);
      TARGETS[id] = Object.assign(TARGETS[id] || {}, {
        kcal: pp.kcal, p: pp.p, f: pp.f, c: pp.c,
        name: pp.name || '', sym: pp.sym || PERSON_SYMS[i] || '🧑',
        restr: Array.isArray(pp.restr) ? pp.restr : [],
        modifier: (pp.modifier != null && isFinite(pp.modifier)) ? pp.modifier : null
      });
      PEOPLE.push(id);
    });
  } else {
    // Compatibilidad: formato antiguo {A,B}
    const stT = lsGet(LS.TARGETS, null);
    if(stT && stT.A && stT.B){
      Object.assign(TARGETS.A, stT.A);
      Object.assign(TARGETS.B, stT.B);
    }
    PEOPLE = ['A','B'];
  }
  // Asegurar restr arrays
  PEOPLE.forEach(id=>{ if(TARGETS[id] && !Array.isArray(TARGETS[id].restr)) TARGETS[id].restr = []; });
  recomputeAB();

  const stC = lsGet(LS.CUSTOM, {});
  Object.entries(stC).forEach(([id, d])=>{ DISHES[id] = d; });

  // Recalcula kcal/macros/ingredientes desde la composición de alimentos
  if(typeof recomputeAllComp === 'function') recomputeAllComp();

  return {
    persona: lsGet(LS.PERSONA, 'A'),
    cart:    lsGet(LS.CART, [])
  };
}

function persistCart(){ lsSet(LS.CART, S.cart); }
function persistPersona(){ lsSet(LS.PERSONA, S.p); }
function persistTargets(){
  const people = PEOPLE.map(id=>{
    const t = TARGETS[id] || {};
    return { id, kcal:t.kcal, p:t.p, f:t.f, c:t.c, name:t.name||'', sym:t.sym||'', restr:t.restr||[], modifier:(t.modifier!=null?t.modifier:null) };
  });
  lsSet(LS.PEOPLE, people);
}
function persistCustom(){
  const out = {};
  Object.keys(DISHES).forEach(id=>{ if(id.startsWith('U')) out[id] = DISHES[id]; });
  lsSet(LS.CUSTOM, out);
}

const initialState = hydrate();

const S = {
  // persona activa válida: una de PEOPLE o 'AB' (todas); si no, la primera
  p: (initialState.persona === 'AB' || PEOPLE.includes(initialState.persona)) ? initialState.persona : PEOPLE[0],
  filters: [],            // multi-selección: ['favs','sg','f:leg', …]; vacío = todos
  search: '',
  cart: initialState.cart.filter(id => DISHES[id]),  // drop stale ids
  activeCat: 'des',
  view: lsGet(LS.VIEW, 'cat'),
  sort: lsGet('mnut:sort:v1', {key:'def', dir:'desc'}),
  viewMode: lsGet('mnut:viewmode:v1', 'small'),        // detail | big | small (compacta por defecto)
  collapsed: lsGet('mnut:collapsed:v1', [])            // categorías plegadas (claves)
};
function persistViewMode(){ lsSet('mnut:viewmode:v1', S.viewMode); }
function persistCollapsed(){ lsSet('mnut:collapsed:v1', S.collapsed); }
function dishMatchesSearch(id){
  const q = (S.search||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
  if(!q) return true;
  const d = DISHES[id]; if(!d) return false;
  const hay = ((d.nom||'')+' '+(d.short||'')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  return hay.includes(q);
}
function persistSort(){ lsSet('mnut:sort:v1', S.sort); }

/* Ordena una lista de ids de plato según S.sort (valores de la persona activa) */
const SORT_OPTS = [
  {key:'def',  lbl:'Catálogo', ico:'≣'},
  {key:'kcal', lbl:'kcal',     ico:'🔥'},
  {key:'p',    lbl:'Proteína', ico:'P'},
  {key:'f',    lbl:'Grasa',    ico:'G'},
  {key:'c',    lbl:'Carbo',    ico:'C'},
  {key:'az',   lbl:'A–Z',      ico:'↕'}
];
function sortIds(ids){
  const sk = S.sort.key;
  if(sk === 'def') return ids;
  const dir = S.sort.dir === 'asc' ? 1 : -1;
  return ids.slice().sort((a,b)=>{
    const da = DISHES[a], db = DISHES[b];
    if(sk === 'az') return da.nom.localeCompare(db.nom) * (S.sort.dir === 'asc' ? 1 : -1);
    let va, vb;
    if(sk === 'kcal'){ va = px(da.kcal); vb = px(db.kcal); }
    else { va = px(da.mac[sk]); vb = px(db.mac[sk]); }
    if(va === vb) return da.nom.localeCompare(db.nom);
    return (va - vb) * dir;
  });
}

const px = arr => {
  if(!Array.isArray(arr)) return arr || 0;
  if(S.p === 'AB') return PEOPLE.reduce((s,_,i)=> s + (+arr[i] || 0), 0);   // todos sumados
  const idx = PEOPLE.indexOf(S.p);
  return (+arr[idx >= 0 ? idx : 0]) || 0;
};

/* ── RESTRICCIONES NUTRICIONALES · helpers ─────────────────
   En modo A+B se combinan: una receta debe pasar las
   restricciones de AMBAS personas (más restrictivo). */
function getActiveRestrictions(){
  if(S.p === 'AB'){
    // unión de todas las personas (más restrictivo)
    const all = new Set();
    PEOPLE.forEach(id=> (TARGETS[id]?.restr || []).forEach(k=> all.add(k)));
    return [...all];
  }
  return [...new Set(TARGETS[S.p]?.restr || [])];
}

/* Devuelve la lista de restricciones violadas por una receta
   Si scope='A','B','AB' fuerza ese juego (sino usa el activo). */
function dishViolations(dishId, scope){
  const d = DISHES[dishId];
  if(!d) return [];
  let keys;
  if(scope === 'AB'){
    const all = new Set(); PEOPLE.forEach(id=> (TARGETS[id]?.restr||[]).forEach(k=> all.add(k)));
    keys = [...all];
  } else if(scope && TARGETS[scope]){
    keys = TARGETS[scope].restr || [];
  } else {
    keys = getActiveRestrictions();
  }
  const out = [];
  keys.forEach(k=>{
    const r = RESTRICTIONS_MAP[k];
    if(r && r.violates(d)) out.push(k);
  });
  return out;
}

function dishPassesActive(dishId){
  return dishViolations(dishId).length === 0;
}

/* Suma las cantidades de un ingrediente de TODAS las personas activas */
function sumQtyAll(ing){
  const vals = PEOPLE.map(id=> ing[id]).filter(x=> x != null && x !== '');
  if(!vals.length) return '';
  return vals.reduce((a,b)=> sumQty(a, b));
}

/* Sum two ingredient quantity strings — preserves units and structure */
function sumQty(a, b){  if(a === b && !/\d/.test(a)) return a;  // identical & non-numeric (e.g. "c.s.")
  const reNum = /(\d+(?:[.,]\d+)?)/g;
  const aNums = [...a.matchAll(reNum)].map(m => parseFloat(m[1].replace(',', '.')));
  const bNums = [...b.matchAll(reNum)].map(m => parseFloat(m[1].replace(',', '.')));
  if(!aNums.length || aNums.length !== bNums.length) return a;
  let i = 0;
  return a.replace(reNum, () => {
    const sum = aNums[i] + bNums[i]; i++;
    return Number.isInteger(sum) ? String(sum) : sum.toFixed(1).replace(/\.0$/, '');
  });
}

/* ── PLACEHOLDER SVG IMAGE ─────────────────────────────── */
const palettes = {
  des:['#F6EDD8','#EDE0C0','#E8C060'],
  com:['#EDE0C0','#D4896A','#B5603A'],
  mer:['#F2E4E0','#E8C060','#D4896A'],
  cen:['#3D2C1A','#5A4530','#7A6048']
};
function phSvg(cat){
  const c = palettes[cat] || palettes.des;
  return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="p-${cat}" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <rect width="22" height="22" fill="${c[0]}"/>
        <line x1="0" y1="0" x2="0" y2="22" stroke="${c[1]}" stroke-width="11" opacity=".5"/>
      </pattern>
      <radialGradient id="g-${cat}" cx="50%" cy="55%" r="60%">
        <stop offset="0%" stop-color="${c[2]}" stop-opacity=".18"/>
        <stop offset="100%" stop-color="${c[2]}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="320" height="200" fill="url(#p-${cat})"/>
    <rect width="320" height="200" fill="url(#g-${cat})"/>
  </svg>`;
}

/* ── HELPERS ──────────────────────────────────────────── */
// ¿hay algún filtro activo? (búsqueda no cuenta; solo las píldoras)
function anyFilter(){ return (S.filters||[]).length > 0; }

function passesFilter(id){
  const d = DISHES[id];
  if(!d) return false;
  if(!dishMatchesSearch(id)) return false;
  const fs = S.filters || [];
  if(!fs.length) return true;
  // Favoritos: obligatorio si está seleccionado
  if(fs.includes('favs') && !isDishFav(id)) return false;
  // Dieta (sg/sl/vt/vg): AND — debe cumplir TODAS las seleccionadas
  for(const k of fs){
    if(k==='favs' || k.startsWith('f:')) continue;
    if(!(d.diet||[]).includes(k)) return false;
  }
  // Tipo de alimento (f:xx): OR — basta con contener UNA de las seleccionadas
  const foods = fs.filter(k=> k.startsWith('f:')).map(k=> k.slice(2));
  if(foods.length && !foods.some(fk=> (d.food||[]).includes(fk))) return false;
  return true;
}

function tagHtml(d){
  let h = '';
  if(d.tipo === 'completa') h += `<span class="tag t-comp">⚑ Completa</span>`;
  if(d.tipo === 'ligera')   h += `<span class="tag t-lig">☽ Ligera</span>`;
  const diet = d.diet || [];
  const labels = {sg:'Sin gluten', sl:'Sin lactosa', vg:'Vegano', vt:'Vegetariano', ps:'Pescado', cn:'Carne', lg:'Legumbres'};
  const classes= {sg:'t-sg',       sl:'t-sl',        vg:'t-vg',   vt:'t-vt',         ps:'t-ps',     cn:'t-cn',  lg:'t-lg'};
  // priority order
  ['sg','sl','vg','vt','ps','cn','lg'].forEach(k=>{
    if(diet.includes(k)) h += `<span class="tag ${classes[k]}">${labels[k]}</span>`;
  });
  if((d.tags||[]).includes('pic')) h += `<span class="tag t-pic">🏖 Picnic</span>`;
  return h;
}

/* food-type chips — for dish cards + modal + calendar cells */
function foodChipsHtml(d, opts){
  opts = opts || {};
  const foods = (d.food || []).filter(k => FOOD_TYPES[k]);
  if(!foods.length) return '';
  // priority: protein-heavy first
  const order = ['leg','cb','cr','pb','pa','apq','hv','pv','qs','js','lac','fs','v','fr','pic','lb'];
  foods.sort((a,b)=> order.indexOf(a) - order.indexOf(b));
  const compact = opts.compact ? 'compact' : '';
  return foods.map(k=>{
    const f = FOOD_TYPES[k];
    return `<span class="food k-${k} ${compact}" title="${f.lbl}"><span class="fi">${f.ico}</span>${opts.compact?'':f.short}</span>`;
  }).join('');
}

/* ── RENDER: CATEGORY NAV ─────────────────────────────── */
function renderCatNav(){
  const counts = {};
  CATEGORIES.forEach(c=>{
    counts[c.key] = Object.values(DISHES).filter(d=>d.cat===c.key && passesFilter(getId(d))).length;
  });
  const el = document.getElementById('catnav');
  el.innerHTML = CATEGORIES.map(c=>`
    <button class="cbtn ${c.key===S.activeCat?'on':''}" data-cat="${c.key}" data-jump="${c.key}">
      ${c.label}<span class="cnum">${counts[c.key]}</span>
    </button>`).join('');
  el.querySelectorAll('.cbtn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k = b.dataset.jump;
      const t = document.getElementById('cat-'+k);
      if(t){
        const y = t.getBoundingClientRect().top + window.scrollY - 168;
        window.scrollTo({top:y, behavior:'smooth'});
      }
    });
  });
}

function getId(d){
  for(const k in DISHES) if(DISHES[k]===d) return k;
}

/* ── RENDER: FILTER ROW ───────────────────────────────── */
// Estado del bottom-sheet de filtros (móvil): se conserva entre re-renders.
let _nutSheetOpen = false, _nutSheetScroll = 0;
function nutResultCount(){
  return Object.keys(DISHES).filter(id=> DISHES[id] && !DISHES[id].libre && !DISHES[id].loose && passesFilter(id)).length;
}
function setNutSheet(open){
  _nutSheetOpen = open;
  const sheet = document.getElementById('nutFSheet');
  const back  = document.getElementById('nutFBack');
  if(sheet) sheet.classList.toggle('open', open);
  if(back)  back.classList.toggle('open', open);
  document.body.classList.toggle('sheet-lock', open);
  if(open){ const b = document.querySelector('#nutFSheet .fsheet-body'); if(b) b.scrollTop = _nutSheetScroll; }
}
function renderFilters(){
  const el = document.getElementById('frow');
  // Limpia restos del sheet portado al body en un render anterior (evita IDs duplicados)
  ['nutFSheet','nutFBack'].forEach(id=>{ const o=document.getElementById(id); if(o && o.parentElement===document.body) o.remove(); });
  const dietFilters = FILTERS.filter(f=> f.group==='all' || f.group==='diet');
  const foodFilters = FILTERS.filter(f=> f.group==='food');

  const isOn = (k)=> k==='todos' ? !anyFilter() : (S.filters||[]).includes(k);
  const pillHtml = (f)=>`
    <button class="fpill ${f.cls||''} ${isOn(f.key)?'on':''}" data-f="${f.key}">
      <span class="fico">${f.ico}</span>${f.label}
    </button>`;

  const nActive = (S.filters||[]).length;
  el.innerHTML = `
    <div class="fbar-quick">
      <input class="dish-search" id="dishSearch" type="search" placeholder="🔎 Buscar receta por nombre…" value="${(S.search||'').replace(/"/g,'&quot;')}">
      <button class="fbtn-open ${nActive?'has-active':''}" id="nutFOpen" type="button" aria-label="Filtros">
        <span class="ffunnel">⚙</span> Filtros<span class="fbadge">${nActive}</span>
      </button>
    </div>
    <div class="filter-sheet" id="nutFSheet">
      <div class="fsheet-hd"><strong>Filtros</strong><button class="fsheet-x" id="nutFClose" type="button" aria-label="Cerrar">✕</button></div>
      <div class="fsheet-body">
        <div class="frow-grp" data-grp="diet">
          <span class="frow-lbl">Dieta</span>
          <button class="fpill fav-pill ${isOn('favs')?'on':''}" data-f="favs"><span class="fico">${isOn('favs')?'★':'☆'}</span>Favoritos</button>
          ${dietFilters.map(pillHtml).join('')}
        </div>
        <div class="frow-grp" data-grp="food">
          <span class="frow-lbl">Tipo de alimento</span>
          ${foodFilters.map(pillHtml).join('')}
        </div>
        <div class="frow-grp frow-sort" data-grp="sort">
          <span class="frow-lbl">Ordenar</span>
          ${SORT_OPTS.map(o=>`
            <button class="fpill sort-pill ${S.sort.key===o.key?'on':''}" data-sort="${o.key}">
              <span class="fico">${o.ico}</span>${o.lbl}${o.key!=='def'&&S.sort.key===o.key?`<span class="sort-dir">${S.sort.dir==='asc'?'↑':'↓'}</span>`:''}
            </button>`).join('')}
        </div>
        <div class="frow-grp frow-vm" data-grp="vm">
          <span class="frow-lbl">Vista</span>
          ${[['detail','▤','Detalle'],['big','▦','Iconos'],['small','▪','Compacto']].map(([k,ic,lb])=>`
            <button class="fpill vm-pill ${S.viewMode===k?'on':''}" data-vm="${k}" title="${lb}"><span class="fico">${ic}</span>${lb}</button>`).join('')}
        </div>
      </div>
      <div class="fsheet-foot">
        <button class="fsheet-clear" id="nutFClear" type="button">Limpiar</button>
        <button class="fsheet-apply" id="nutFApply" type="button">Ver ${nutResultCount()} resultados</button>
      </div>
    </div>
    <div class="filter-backdrop" id="nutFBack"></div>`;

  // Portal: saca el sheet+backdrop del #frow (sticky, z-index bajo) al <body>,
  // si no, las estrellas de favoritos de las tarjetas (z-index 3) lo atraviesan.
  ['nutFSheet','nutFBack'].forEach(id=>{ const n=document.getElementById(id); if(n) document.body.appendChild(n); });

  // Apertura/cierre del bottom-sheet (móvil)
  const ob = document.getElementById('nutFOpen'); if(ob) ob.addEventListener('click', ()=> setNutSheet(true));
  const cb = document.getElementById('nutFClose'); if(cb) cb.addEventListener('click', ()=> setNutSheet(false));
  const bk = document.getElementById('nutFBack'); if(bk) bk.addEventListener('click', ()=> setNutSheet(false));
  const ap = document.getElementById('nutFApply'); if(ap) ap.addEventListener('click', ()=> setNutSheet(false));
  const cl = document.getElementById('nutFClear'); if(cl) cl.addEventListener('click', ()=>{ S.filters = []; renderAll(); });
  const sb = document.querySelector('#nutFSheet .fsheet-body'); if(sb) sb.addEventListener('scroll', ()=>{ _nutSheetScroll = sb.scrollTop; });

  const dishSearch = document.getElementById('dishSearch');
  // Búsqueda con debounce: re-renderiza la rejilla tras una breve pausa,
  // no en cada pulsación (evita lag y pérdida de teclas en catálogos grandes).
  if(dishSearch) dishSearch.addEventListener('input', ()=>{
    S.search = dishSearch.value;
    clearTimeout(window.__searchDeb);
    window.__searchDeb = setTimeout(()=>{ renderMain(); renderCatNav(); }, 120);   // solo grid+nav → no pierde foco
  });
  el.querySelectorAll('.fpill:not(.sort-pill):not(.vm-pill)').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k = b.dataset.f;
      if(k === 'todos'){ S.filters = []; }            // limpia todos
      else {
        const i = S.filters.indexOf(k);
        if(i >= 0) S.filters.splice(i, 1);            // toggle off
        else S.filters.push(k);                       // toggle on (multi)
      }
      renderAll();
    });
  });
  el.querySelectorAll('.vm-pill').forEach(b=>{
    b.addEventListener('click', ()=>{
      S.viewMode = b.dataset.vm;
      persistViewMode();
      el.querySelectorAll('.vm-pill').forEach(x=> x.classList.toggle('on', x===b));
      const main = document.getElementById('main'); if(main) main.dataset.vm = S.viewMode;
      renderMain();
    });
  });
  el.querySelectorAll('.sort-pill').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k = b.dataset.sort;
      if(k === 'def'){ S.sort = {key:'def', dir:'desc'}; }
      else if(S.sort.key === k){
        // segunda pulsación: invierte dirección
        S.sort = {key:k, dir: S.sort.dir==='asc' ? 'desc' : 'asc'};
      } else {
        // por defecto: kcal/macros de mayor a menor; A–Z ascendente
        S.sort = {key:k, dir: k==='az' ? 'asc' : 'desc'};
      }
      persistSort();
      renderAll();
    });
  });

  // Restaura el bottom-sheet abierto tras cualquier re-render (móvil)
  if(_nutSheetOpen) setNutSheet(true);
}

/* ── RENDER: DISH CARD ────────────────────────────────── */
function dishCard(id){
  const d = DISHES[id];
  const kc = px(d.kcal), mc = d.mac;
  const inCart = S.cart.includes(id);
  const isUser = id.startsWith('U');
  const viols = dishViolations(id);
  return `
    <article class="dish ${viols.length?'has-viol':''}" data-id="${id}">
      <button class="dish-fav ${isDishFav(id)?'on':''}" data-fav="${id}" aria-label="Favorito" title="Favorito">${isDishFav(id)?'★':'☆'}</button>
      ${isUser?`<span class="user-badge">Tuya</span>`:''}
      ${inCart?`<span class="added-mark" title="Añadido">✓</span>`:''}
      ${viols.length?`<span class="dish-viol" title="Rompe: ${viols.map(v=>RESTRICTIONS_MAP[v]?.lbl||v).join(', ')}">⚠ ${viols.map(v=>RESTRICTIONS_MAP[v]?.ico).join('')}</span>`:''}
      <div class="dish-img${d.img?' has-photo':''}">
        ${d.img ? `<img class="dish-photo" src="${escHtml(d.img)}" alt="" loading="lazy">` : phSvg(d.cat)}
        ${d.img ? '' : `<span class="dish-emoji">${d.icon}</span>`}
        <span class="ph-lbl">${d.cat==='cen'?'cena · noche':d.cat==='des'?'desayuno':d.cat==='mer'?'merienda':'plato principal'}</span>
      </div>
      <div class="dish-body">
        <div class="dish-name">${escHtml(d.nom)}</div>
        <div class="dish-tags">${tagHtml(d)}</div>
        <div class="dish-foods">${foodChipsHtml(d)}</div>
        <div class="dish-bot">
          <div class="dish-kcal">~${kc} kcal<small>${d.t}${S.p==='AB'?` · ${PEOPLE.length} raciones`:''}</small></div>
          <div class="dish-mac">
            <strong>${px(mc.p)}P</strong> · ${px(mc.f)}G · ${px(mc.c)}C
          </div>
        </div>
      </div>
    </article>`;
}

/* ── RENDER: MAIN ─────────────────────────────────────── */
const RENDER_BATCH = 24;          // recetas que se pintan por lote (render progresivo)
let _moreState = {};              // cat → ids aún por pintar
let _moreObserver = null;         // observa los botones "mostrar más"

// Engancha clicks (abrir ficha + favorito) en un conjunto de nodos .dish.
function wireDishNodes(nodes){
  nodes.forEach(a=>{
    if(!a.classList || !a.classList.contains('dish')) return;
    if(a.classList.contains('add-card')){
      a.addEventListener('click', ()=> openRecipeForm(a.dataset.cat));
      return;
    }
    a.addEventListener('click', ()=> openModal(a.dataset.id));
    const fav = a.querySelector('.dish-fav');
    if(fav) fav.addEventListener('click', e=>{ e.stopPropagation(); toggleDishFav(fav.dataset.fav); renderMain(); renderCatNav(); });
  });
}

// Pinta el siguiente lote de una categoría e inserta antes de la add-card.
function loadMoreCat(cat){
  const rest = _moreState[cat];
  if(!rest || !rest.length) return;
  const sec = document.getElementById('cat-'+cat);
  if(!sec) return;
  const grid = sec.querySelector('.grid');
  const addc = grid.querySelector('.add-card');
  const batch = rest.splice(0, RENDER_BATCH);
  const frag = document.createElement('div');
  frag.innerHTML = batch.map(dishCard).join('');
  const nodes = [...frag.children];
  nodes.forEach(n=> addc ? grid.insertBefore(n, addc) : grid.appendChild(n));
  wireDishNodes(nodes);
  const btn = sec.querySelector('.grid-more');
  if(!rest.length){ if(btn){ if(_moreObserver) _moreObserver.unobserve(btn); btn.remove(); } delete _moreState[cat]; }
  else if(btn){ btn.textContent = `Mostrar ${rest.length} receta${rest.length>1?'s':''} más`; }
}

function renderMain(){
  const el = document.getElementById('main');
  el.dataset.vm = S.viewMode || 'detail';            // modo de vista (detail|big|small)
  _moreState = {};
  if(_moreObserver) _moreObserver.disconnect();
  const sections = CATEGORIES.map(c=>{
    let ids = Object.keys(DISHES).filter(id=>DISHES[id].cat===c.key && !DISHES[id].libre && !DISHES[id].loose && passesFilter(id));
    if(!ids.length && anyFilter()) return '';
    ids = sortIds(ids);
    const sortNote = S.sort.key!=='def' ? ` · ${(SORT_OPTS.find(o=>o.key===S.sort.key)||{}).lbl} ${S.sort.dir==='asc'?'↑':'↓'}` : '';
    const isCol = (S.collapsed||[]).includes(c.key);
    const shown = ids.slice(0, RENDER_BATCH);
    const rest  = ids.slice(RENDER_BATCH);
    if(rest.length) _moreState[c.key] = rest;
    return `
      <section class="cat-section ${isCol?'collapsed':''}" id="cat-${c.key}">
        <header class="cat-hd" data-col="${c.key}" role="button" tabindex="0" aria-expanded="${!isCol}">
          <span class="cat-caret">▾</span>
          <h2>${c.label}</h2>
          <span class="cmeta">${c.icon} ${c.time} · ${ids.length} opciones${sortNote}</span>
          <span class="cline"></span>
        </header>
        <div class="grid">
          ${shown.map(dishCard).join('')}
          ${!anyFilter() ? addCard(c.key) : ''}
        </div>
        ${rest.length ? `<button class="grid-more" data-more="${c.key}">Mostrar ${rest.length} receta${rest.length>1?'s':''} más</button>` : ''}
      </section>`;
  }).join('');

  el.innerHTML = sections || `
    <div class="empty">
      <strong>Sin resultados</strong>
      Prueba con otro filtro o desactiva los activos.
    </div>`;

  // Plegar/desplegar comidas al pulsar la cabecera
  el.querySelectorAll('.cat-hd[data-col]').forEach(h=>{
    const toggle = ()=>{
      const k = h.dataset.col;
      const i = (S.collapsed||(S.collapsed=[])).indexOf(k);
      if(i>=0) S.collapsed.splice(i,1); else S.collapsed.push(k);
      persistCollapsed();
      const sec = h.closest('.cat-section');
      sec.classList.toggle('collapsed');
      h.setAttribute('aria-expanded', !sec.classList.contains('collapsed'));
    };
    h.addEventListener('click', toggle);
    h.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
  });

  wireDishNodes([...el.querySelectorAll('.dish')]);

  // Render progresivo: botón "mostrar más" + auto-carga al acercarse por scroll
  const moreBtns = el.querySelectorAll('.grid-more');
  if(moreBtns.length){
    moreBtns.forEach(b=> b.addEventListener('click', ()=> loadMoreCat(b.dataset.more)));
    if('IntersectionObserver' in window){
      _moreObserver = new IntersectionObserver((entries)=>{
        entries.forEach(en=>{ if(en.isIntersecting) loadMoreCat(en.target.dataset.more); });
      }, {rootMargin:'300px'});
      moreBtns.forEach(b=> _moreObserver.observe(b));
    }
  }
}

function addCard(cat){
  return `
    <article class="dish add-card" data-cat="${cat}">
      <div>
        <div class="ac-ico">＋</div>
        <div class="ac-t">Nueva receta</div>
        <div class="ac-s">Añadir a ${CATEGORIES.find(c=>c.key===cat).label.toLowerCase()}</div>
      </div>
    </article>`;
}

/* ── RENDER: CART BAR ─────────────────────────────────── */
function renderCartBar(){
  const bar = document.getElementById('cartBar');
  const fab = document.getElementById('cartFab');
  const count = document.getElementById('cartCount');

  if(!S.cart.length){
    bar.classList.remove('show');
    count.classList.add('hide');
    fab.style.background = 'var(--warm)';
    return;
  }

  // totals
  const tot = S.cart.reduce((a,id)=>{
    const d = DISHES[id];
    a.k += px(d.kcal); a.p += px(d.mac.p); a.f += px(d.mac.f); a.c += px(d.mac.c);
    return a;
  }, {k:0,p:0,f:0,c:0});

  const T = TARGETS[S.p];
  const pct  = (v,t)=> Math.min(100, Math.round(v/t*100));
  const over = (v,t)=> v > t*1.05;

  document.getElementById('cbMtots').innerHTML = `
    <div class="cb-mt">
      <div class="v">${tot.k}<span>/${T.kcal}</span></div>
      <div class="l">kcal</div>
    </div>
    <div class="cb-mt">
      <div class="v">${tot.p}<span>/${T.p}g</span></div>
      <div class="l">prot</div>
    </div>
    <div class="cb-mt">
      <div class="v">${tot.f}<span>/${T.f}g</span></div>
      <div class="l">grasa</div>
    </div>
    <div class="cb-mt">
      <div class="v">${tot.c}<span>/${T.c}g</span></div>
      <div class="l">carb</div>
    </div>`;

  document.getElementById('cbProg').innerHTML = `
    <div class="cb-bar cb-bk ${over(tot.k,T.kcal)?'over':''}"><div class="cb-fill" style="width:${pct(tot.k,T.kcal)}%"></div></div>
    <div class="cb-bar cb-bp ${over(tot.p,T.p)?'over':''}"><div class="cb-fill" style="width:${pct(tot.p,T.p)}%"></div></div>
    <div class="cb-bar cb-bf ${over(tot.f,T.f)?'over':''}"><div class="cb-fill" style="width:${pct(tot.f,T.f)}%"></div></div>
    <div class="cb-bar cb-bc ${over(tot.c,T.c)?'over':''}"><div class="cb-fill" style="width:${pct(tot.c,T.c)}%"></div></div>`;

  bar.classList.add('show');
  count.textContent = S.cart.length;
  count.classList.remove('hide');
}

/* ── RENDER: DRAWER ──────────────────────────────────── */

/* helpers para "Mi día" conectado al calendario */
const JS_DAY_TO_KEY = ['dom','lun','mar','mie','jue','vie','sab']; // Sunday=0 → dom
function getTodayKey(){ return JS_DAY_TO_KEY[new Date().getDay()]; }
function getTodayLabel(){
  const k = getTodayKey();
  const m = WEEK_DAYS.find(d=>d.k===k);
  return m ? m.long : '';
}
function getTodayDate(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

/* Feedback log */
const FB = (function(){
  const stored = lsGet(LS.FB, []);
  return Array.isArray(stored) ? stored : [];
})();
function persistFB(){ lsSet(LS.FB, FB); }
function getFB(date, slot, dishId, persona){
  return FB.find(e => e.date===date && e.slot===slot && e.dishId===dishId && e.persona===persona) || null;
}
function setFB(date, slot, dishId, persona, fields){
  let e = getFB(date, slot, dishId, persona);
  if(!e){
    e = {date, slot, dishId, persona, rating:0, note:'', ts:Date.now()};
    FB.push(e);
  }
  Object.assign(e, fields, {ts:Date.now()});
  persistFB();
}

/* Carga el día actual del calendario activo en S.cart */
function getTodayDishes(){
  if(typeof CalState === 'undefined' || !CalState.data) return [];
  const today = getTodayKey();
  const day = CalState.data[today];
  if(!day) return [];
  const list = [];
  ['des','com','mer','cen'].forEach(s => (day[s]||[]).forEach(id => { if(DISHES[id]) list.push(id); }));
  return list;
}

/* Comidas del calendario de hoy que aún NO están en "Mi día" */
function getPendingFromCalendar(){
  const today = getTodayDishes();
  const counts = {};
  S.cart.forEach(id => { counts[id] = (counts[id]||0) + 1; });
  // tolera duplicados: si el calendario tiene 2× la receta y mi día solo 1, falta 1
  const pending = [];
  today.forEach(id=>{
    const have = counts[id] || 0;
    if(have > 0){ counts[id] = have - 1; }
    else pending.push(id);
  });
  return pending;
}

/* Sincroniza Mi día con el calendario de hoy
   mode = 'merge'    → añade lo que falte (no destructivo)
   mode = 'replace'  → reemplaza el carrito completo */
function syncWithToday(mode){
  const today = getTodayDishes();
  if(!today.length) return false;
  if(mode === 'replace'){
    S.cart = today.slice();
  } else {
    // append missing (merge)
    const pending = getPendingFromCalendar();
    if(!pending.length) return false;
    S.cart.push(...pending);
  }
  persistCart();
  lsSet('mnut:cartDate:v1', getTodayDate());
  return true;
}

function loadDayFromCalendar(force){
  if(typeof CalState === 'undefined' || !CalState.data) return false;
  const today = getTodayDishes();
  if(!today.length){
    if(force) alert(`El día de hoy (${getTodayLabel()}) está vacío en el calendario.`);
    return false;
  }
  return syncWithToday('merge');
}

/* Recetas similares: misma cat, ranking por overlap de food + cercanía kcal */
function similarDishes(dishId, limit){
  limit = limit || 8;
  const d = DISHES[dishId];
  if(!d) return [];
  const myFoods = new Set(d.food || []);
  const myKcal = d.kcal[0] || 1;
  return Object.keys(DISHES)
    .filter(id => id !== dishId && DISHES[id].cat === d.cat)
    .map(id => {
      const o = DISHES[id];
      const overlap = (o.food||[]).filter(f => myFoods.has(f)).length;
      const kcalDiff = Math.abs((o.kcal[0]||0) - myKcal) / myKcal;
      const score = overlap * 100 - kcalDiff * 50;
      return {id, score, overlap, kcalDiff};
    })
    .sort((a,b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.id);
}

/* Mini-overlay dentro del drawer para cambiar receta por similar */
let _replacePicker = null;
function openReplacePicker(dishId){
  _replacePicker = dishId;
  renderDrawer();
}
function closeReplacePicker(){
  _replacePicker = null;
  renderDrawer();
}
function applyReplacement(oldId, newId){
  if(!DISHES[newId]) return;
  const idx = S.cart.indexOf(oldId);
  if(idx < 0) return;
  S.cart[idx] = newId;
  persistCart();
  // Si el calendario activo es de hoy, también lo reflejamos
  try{
    const today = getTodayKey();
    if(CalState && CalState.data && CalState.data[today]){
      ['des','com','mer','cen'].forEach(s=>{
        const arr = CalState.data[today][s];
        const i = arr.indexOf(oldId);
        if(i >= 0){ arr[i] = newId; CalState.modified = true; }
      });
      persistCal();
    }
  }catch(e){}
  closeReplacePicker();
  renderAll();
}

/* Sensaciones disponibles */
const RATINGS = [
  {v:1, ico:'😣', lbl:'Pesado / mal'},
  {v:2, ico:'😕', lbl:'Poco satisfecho'},
  {v:3, ico:'😐', lbl:'Normal'},
  {v:4, ico:'🙂', lbl:'Bien'},
  {v:5, ico:'😋', lbl:'Excelente'}
];

function renderDrawer(){
  const T = TARGETS[S.p];
  const tot = S.cart.reduce((a,id)=>{
    const d = DISHES[id]; if(!d) return a;
    a.k += px(d.kcal); a.p += px(d.mac.p); a.f += px(d.mac.f); a.c += px(d.mac.c);
    return a;
  }, {k:0,p:0,f:0,c:0});

  const today = getTodayKey();
  const todayLabel = getTodayLabel();
  const todayDate = getTodayDate();
  const calHasToday = (typeof CalState !== 'undefined' && CalState.data && CalState.data[today])
    ? Object.values(CalState.data[today]).some(a => Array.isArray(a) && a.length)
    : false;
  const pending = calHasToday ? getPendingFromCalendar() : [];

  // sub
  const sub = document.getElementById('drSub');
  if(sub){
    sub.textContent = `${todayLabel} · ${S.cart.length} plato${S.cart.length===1?'':'s'} · ${T.lbl}`;
  }

  // Header CTA: cargar día del calendario (sólo lo pendiente)
  let cta;
  if(!calHasToday){
    cta = `<div class="dr-cal-empty">No hay menú para ${todayLabel} en el calendario activo. Ve a Calendario para planificar.</div>`;
  } else if(pending.length > 0){
    cta = `<button class="dr-cal-cta" id="drLoadDay">📅 Añadir ${pending.length} comida${pending.length>1?'s':''} pendiente${pending.length>1?'s':''} de ${todayLabel}</button>
      <button class="dr-cal-replace" id="drReplaceDay" title="Reemplazar Mi día con el calendario completo de hoy">↻ Recargar</button>`;
  } else {
    cta = `<div class="dr-cal-synced">✓ Mi día está sincronizado con el calendario de ${todayLabel}
      <button class="dr-cal-replace inline" id="drReplaceDay">↻ Recargar</button>
    </div>`;
  }

  // status: under 80% deficit · 80-94% close · 95-105% on target · over 105% over
  const status = (v,t) => {
    const p = v/t;
    if(p < .80)  return {cls:'st-low',  ico:'',  lbl:'déficit'};
    if(p < .95)  return {cls:'st-near', ico:'',  lbl:'cerca'};
    if(p <=1.05) return {cls:'st-on',   ico:'✓', lbl:'objetivo'};
    return            {cls:'st-over', ico:'⚠', lbl:'excedido'};
  };
  const pctMin = (v,t)=> Math.min(100, Math.round(v/t*100));

  const tgt = (name, v, t, macroClr) => {
    const st = status(v, t);
    const rawPct = Math.round(v/t*100);
    return `
    <div class="tgt-block ${st.cls}">
      <div class="tgt-top">
        <span class="tgt-name">${name}</span>
        <span class="tgt-vals">
          <span class="tgt-cur">${v}</span><span class="tgt-tot">/${t}${name==='kcal'?'':'g'}</span>
        </span>
        <span class="tgt-pct">${rawPct}%${st.ico?' '+st.ico:''}</span>
      </div>
      <div class="tgt-bar">
        <div class="tgt-fill" style="width:${pctMin(v,t)}%;background:${macroClr}"></div>
        ${rawPct>105?`<div class="tgt-over" style="width:${Math.min(100,rawPct-100)}%"></div>`:''}
      </div>
      <div class="tgt-lbl">${st.lbl}</div>
    </div>`;
  };

  // ── Balance energético: objetivo + gasto de deporte (hoy) − ingerido ──
  let burned = 0;
  try{
    if(typeof spKey==='function' && typeof SportPlan!=='undefined' && typeof dayTotals==='function'){
      const ents = SportPlan.days[spKey(new Date())] || [];
      if(ents.length){ const dt = dayTotals(ents); burned = S.p==='A'?dt.kA : S.p==='B'?dt.kB : (dt.kA+dt.kB); }
    }
  }catch(e){}
  const allowance = T.kcal + burned;          // lo que puede comer hoy
  const remaining = allowance - tot.k;        // lo que le queda
  const remCls = remaining < -0.05*T.kcal ? 'bal-over' : remaining < 0 ? 'bal-near' : 'bal-ok';
  const balanceBlock = (S.cart.length || burned) ? `
    <div class="bal-card">
      <div class="bal-hd">Balance energético · hoy${S.p==='AB'?' (todas)':''}</div>
      <div class="bal-row"><span>🎯 Objetivo</span><b>${T.kcal}</b></div>
      ${burned? `<div class="bal-row burn"><span>🏋️ Deporte (gastado)</span><b>+${burned}</b></div>`:''}
      <div class="bal-row"><span>🍽 Ingerido</span><b>−${tot.k}</b></div>
      <div class="bal-net ${remCls}"><span>${remaining>=0?'Te quedan':'Te has pasado'}</span><b>${remaining>=0?remaining:-remaining} kcal</b></div>
    </div>` : '';

  // ── Total del día: UNA FILA POR PERSONA (kcal + P/C/G claros, sin desbordes) ──
  const totForIdx = (i)=> S.cart.reduce((a,id)=>{
    const d = DISHES[id]; if(!d) return a;
    a.k += d.kcal[i]; a.p += d.mac.p[i]; a.f += d.mac.f[i]; a.c += d.mac.c[i];
    return a;
  }, {k:0,p:0,f:0,c:0});
  const dayPersons = PEOPLE.map((id, i)=>({ key:id, sym:(TARGETS[id]||{}).sym||'🧑', tot: totForIdx(i), T: TARGETS[id]||{} }));
  const dtChip = (lbl, cls, v, t)=> `<span class="dt-chip ${cls}"><b>${lbl}</b>${v}<small>/${t}g</small></span>`;
  const dayTotHtml = dayPersons.map(pp=>{
    const kPct = pp.T.kcal ? Math.round(pp.tot.k/pp.T.kcal*100) : 0;
    const st = status(pp.tot.k, pp.T.kcal||1);
    return `
      <div class="dt-card ${st.cls} ${S.p===pp.key?'active':''}">
        <div class="dt-card-hd">
          <span class="dt-who">${escHtml((pp.T.name||'').trim() || ('Persona '+(PEOPLE.indexOf(pp.key)+1)))}</span>
          <span class="dt-kcal"><b>${pp.tot.k}</b><small>/${pp.T.kcal}</small><i class="dt-pct">${kPct}%${st.ico?' '+st.ico:''}</i></span>
        </div>
        <div class="dt-macros">
          ${dtChip('P','p', pp.tot.p, pp.T.p)}
          ${dtChip('C','c', pp.tot.c, pp.T.c)}
          ${dtChip('G','f', pp.tot.f, pp.T.f)}
        </div>
      </div>`;
  }).join('');

  document.getElementById('drTargets').innerHTML = `
    <div class="dr-cal-row">${cta}</div>
    ${balanceBlock}
    ${S.cart.length ? `
      <div class="tgt-hd">Total del día vs objetivo</div>
      <div class="day-tot">${dayTotHtml}</div>
    ` : ''}`;

  // items (grouped by slot)
  const items = document.getElementById('drItems');
  const SLOT_META = [
    {k:'des', lbl:'Desayuno', ico:'☀️'},
    {k:'com', lbl:'Comida',   ico:'🍽'},
    {k:'mer', lbl:'Merienda', ico:'🍎'},
    {k:'cen', lbl:'Cena',     ico:'🌙'}
  ];

  if(!S.cart.length){
    items.innerHTML = `
      <div class="dr-empty">
        <strong>Aún no has elegido nada</strong>
        Toca el botón de arriba para cargar el menú de hoy o ve al catálogo y elige platos.
      </div>`;
    document.getElementById('drClearWrap').style.display = 'none';
    return;
  }

  // Agrupa cart por slot
  const groups = {des:[], com:[], mer:[], cen:[]};
  S.cart.forEach(id=>{
    const d = DISHES[id]; if(!d) return;
    (groups[d.cat] || groups.des).push(id);
  });

  const personaKey = S.p === 'AB' ? 'AB' : S.p;

  let html = '';
  SLOT_META.forEach(sm=>{
    if(!groups[sm.k].length) return;
    html += `<div class="dr-sec"><div class="dr-sec-hd">${sm.ico} ${sm.lbl}</div>`;
    groups[sm.k].forEach((id, idxInGroup)=>{
      const d = DISHES[id];
      const fb = getFB(todayDate, sm.k, id, personaKey);
      const isReplacing = _replacePicker === id;
      html += `
        <div class="dr-item ${isReplacing?'replacing':''}" data-id="${id}" data-slot="${sm.k}">
          <div class="dr-it-top">
            <div class="dr-it-ico">${d.icon}</div>
            <div class="dr-it-body">
              <div class="dr-it-n">${d.nom}</div>
              <div class="dr-it-m">${px(d.kcal)} kcal · ${px(d.mac.p)}P · ${px(d.mac.f)}G · ${px(d.mac.c)}C</div>
            </div>
            <div class="dr-it-acts">
              <button class="dr-it-act" data-act="rep" title="Cambiar por similar">↻</button>
              <button class="dr-it-act" data-act="info" title="Ver receta">👁</button>
              <button class="dr-it-act danger" data-act="rm" title="Quitar">✕</button>
            </div>
          </div>
          ${isReplacing ? renderReplaceList(id) : ''}
          <div class="dr-fb">
            <div class="dr-fb-hd">¿Cómo te ha sentado? <small>${personaKey==='AB'?'(pareja)':personaKey==='A'?'(♂ A)':'(♀ B)'}</small></div>
            <div class="dr-fb-row">
              ${RATINGS.map(r=>`<button class="dr-fb-btn ${fb&&fb.rating===r.v?'on':''}" data-fb-r="${r.v}" title="${r.lbl}">${r.ico}</button>`).join('')}
              <input class="dr-fb-note" data-fb-note placeholder="Nota (opcional)" value="${(fb&&fb.note||'').replace(/"/g,'&quot;')}">
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
  });
  items.innerHTML = html;

  // bind
  items.querySelectorAll('.dr-item').forEach(row=>{
    const id = row.dataset.id;
    const slot = row.dataset.slot;
    row.querySelectorAll('[data-act]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        const act = b.dataset.act;
        if(act === 'rm'){
          S.cart.splice(S.cart.indexOf(id), 1);
          persistCart();
          renderAll();
        }
        if(act === 'rep') openReplacePicker(_replacePicker === id ? null : id);
        if(act === 'info'){ closeDrawer(); openModal(id); }
      });
    });
    row.querySelectorAll('[data-fb-r]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        const r = +b.dataset.fbR;
        const cur = getFB(todayDate, slot, id, personaKey);
        const newR = cur && cur.rating === r ? 0 : r; // pulsar el actual lo desmarca
        setFB(todayDate, slot, id, personaKey, {rating:newR});
        renderDrawer();
      });
    });
    const note = row.querySelector('[data-fb-note]');
    if(note){
      note.addEventListener('change', ()=>{
        setFB(todayDate, slot, id, personaKey, {note: note.value});
      });
    }
    // replacement candidates
    row.querySelectorAll('[data-rep-pick]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        applyReplacement(id, b.dataset.repPick);
      });
    });
    const rc = row.querySelector('[data-rep-cancel]');
    if(rc) rc.addEventListener('click', closeReplacePicker);
  });

  // Cargar día
  const dl = document.getElementById('drLoadDay');
  if(dl) dl.addEventListener('click', ()=>{
    syncWithToday('merge');
    renderAll();
  });
  const rl = document.getElementById('drReplaceDay');
  if(rl) rl.addEventListener('click', async ()=>{
    if(S.cart.length && !await pnConfirm('¿Reemplazar "Mi día" con el calendario de hoy?\nPerderás los platos añadidos manualmente.', {danger:true, okText:'Reemplazar'})) return;
    syncWithToday('replace');
    renderAll();
  });

  document.getElementById('drClearWrap').style.display = S.cart.length ? 'block' : 'none';
}

function renderReplaceList(currentId){
  const candidates = similarDishes(currentId, 6);
  if(!candidates.length) return `<div class="dr-rep-empty">No hay recetas similares</div>`;
  const cur = DISHES[currentId];
  return `
    <div class="dr-rep">
      <div class="dr-rep-hd">
        <span>Sustituir por algo similar (misma categoría${cur.food && cur.food.length?', mismo tipo de alimento':''}):</span>
        <button class="dr-rep-cx" data-rep-cancel="1" aria-label="Cerrar">✕</button>
      </div>
      <div class="dr-rep-list">
        ${candidates.map(id=>{
          const d = DISHES[id];
          return `<button class="dr-rep-it" data-rep-pick="${id}">
            <span class="rr-ic">${d.icon}</span>
            <span class="rr-b">
              <span class="rr-n">${escHtml(d.nom)}</span>
              <span class="rr-m">${px(d.kcal)} kcal · ${(d.food||[]).slice(0,4).map(f=>FOOD_TYPES[f]?.ico||'').join('')}</span>
            </span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
}

/* ── MODAL ───────────────────────────────────────────── */
function openModal(id){
  const d = DISHES[id];
  const inCart = S.cart.includes(id);
  const body = document.getElementById('modalBody');

  body.innerHTML = `
    <div class="m-img${d.img?' has-photo':''}">
      ${d.img ? `<img class="m-photo" src="${escHtml(d.img)}" alt="">` : phSvg(d.cat)}
      ${d.img ? '' : `<span class="m-emoji">${d.icon}</span>`}
      ${d.img ? '' : `<span class="ph-lbl">marcador · foto del plato</span>`}
    </div>
    <div class="m-body">
      <h2 class="m-title">${escHtml(d.nom)}</h2>
      <div class="m-meta">
        ${tagHtml(d)}
      </div>
      <div class="m-meta" style="margin-bottom:10px">
        ${foodChipsHtml(d)}
      </div>
      <div class="m-meta" style="margin-bottom:14px">
        <span class="ttime">⏱ ${d.t}</span>
        <span class="ttime">🍳 ${d.eq}</span>
      </div>

      <p style="font-size:.95rem;line-height:1.55;color:rgba(44,31,14,.78);margin-bottom:6px">${d.desc}</p>

      <div class="m-section-hd">Macros · ${S.p==='AB' ? 'Todas · ración combinada' : escHtml(((TARGETS[S.p]||{}).name||'').trim()||('Persona '+(PEOPLE.indexOf(S.p)+1)))}</div>
      <div class="m-kcal-row">
        <div class="m-k-cell"><div class="m-k-v">${px(d.kcal)}</div><div class="m-k-l">kcal</div></div>
        <div class="m-k-cell"><div class="m-k-v">${px(d.mac.p)}g</div><div class="m-k-l">proteína</div></div>
        <div class="m-k-cell"><div class="m-k-v">${px(d.mac.f)}g</div><div class="m-k-l">grasa</div></div>
        <div class="m-k-cell"><div class="m-k-v">${px(d.mac.c)}g</div><div class="m-k-l">carbohid</div></div>
      </div>

      <div class="m-section-hd">Ingredientes · por ración</div>
      <table class="itbl">
        <thead>
          <tr>
            <th>Ingrediente</th>
            ${PEOPLE.map((id,i)=>`<th class="qty">${escHtml(((TARGETS[id]||{}).name||'').trim()||('Persona '+(i+1)))}</th>`).join('')}
            ${PEOPLE.length>1?`<th class="qty ab">Todas</th>`:''}
          </tr>
        </thead>
        <tbody>
          ${d.ing.map(i=>`
            <tr>
              <td class="ing-n">${i.n}</td>
              ${PEOPLE.map(id=>`<td class="qty ${S.p===id?'hi':''}">${i[id]!=null?i[id]:''}</td>`).join('')}
              ${PEOPLE.length>1?`<td class="qty ab ${S.p==='AB'?'hi':''}">${sumQtyAll(i)}</td>`:''}
            </tr>`).join('')}
        </tbody>
      </table>

      <div class="m-section-hd">Preparación</div>
      ${(()=>{ const steps=(d.nota||'').split('\n').map(s=>s.trim()).filter(Boolean);
        return steps.length>1
          ? `<ol class="m-steps">${steps.map(s=>`<li>${escHtml(s)}</li>`).join('')}</ol>`
          : `<div class="pnote">📋 ${escHtml(d.nota||'—')}</div>`; })()}

      <div class="m-cta">
        <button id="ctaFav" class="m-fav-btn ${isDishFav(id)?'on':''}" data-id="${id}">
          ${isDishFav(id) ? '★ En favoritos' : '☆ Favorito'}
        </button>
        <button id="ctaAdd" class="${inCart?'added':''}" data-id="${id}">
          ${inCart ? '✓ Añadido a mi día · Quitar' : '＋ Añadir a mi día'}
        </button>
        ${id.startsWith('U') ? `
          <div class="user-actions">
            <button class="ua-edit" id="uaEdit">✎ Editar receta</button>
            <button class="ua-del"  id="uaDel">🗑 Eliminar</button>
          </div>` : ''}
      </div>
    </div>`;

  document.getElementById('ctaAdd').addEventListener('click', e=>{
    const k = e.currentTarget.dataset.id;
    if(S.cart.includes(k)) S.cart = S.cart.filter(x=>x!==k);
    else S.cart.push(k);
    persistCart();
    openModal(k);   // re-render modal
    renderMain();
    renderCartBar();
    renderDrawer();
  });

  document.getElementById('ctaFav').addEventListener('click', e=>{
    const k = e.currentTarget.dataset.id;
    const on = toggleDishFav(k);
    const b = e.currentTarget;
    b.textContent = on ? '★ En favoritos' : '☆ Favorito';
    b.classList.toggle('on', on);
    renderMain(); renderCatNav();
  });

  // user-recipe actions (only present if dish id starts with U)
  const uaEdit = document.getElementById('uaEdit');
  const uaDel  = document.getElementById('uaDel');
  if(uaEdit) uaEdit.addEventListener('click', ()=>{ closeModal(); openRecipeForm(DISHES[id].cat, id); });
  if(uaDel)  uaDel.addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Eliminar esta receta?', {danger:true, okText:'Eliminar'})) return;
    const snap = JSON.parse(JSON.stringify(DISHES[id]));
    const wasInCart = S.cart.includes(id);
    delete DISHES[id];
    S.cart = S.cart.filter(x=>x!==id);
    persistCustom(); persistCart();
    closeModal();
    renderAll();
    showUndo('Receta eliminada', ()=>{
      DISHES[id] = snap;
      if(wasInCart && !S.cart.includes(id)) S.cart.push(id);
      persistCustom(); persistCart(); renderAll();
    });
  });

  document.getElementById('modalBg').classList.add('show');
  document.body.classList.add('no-scroll');
}

function closeModal(){
  document.getElementById('modalBg').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

/* ── DRAWER OPEN/CLOSE ───────────────────────────────── */
function openDrawer(){
  // Sincronizar con el calendario de hoy antes de mostrar (añade pendientes)
  try{ syncWithToday('merge'); }catch(e){}
  renderDrawer();
  document.getElementById('drawerBg').classList.add('show');
  document.getElementById('drawer').classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeDrawer(){
  document.getElementById('drawerBg').classList.remove('show');
  document.getElementById('drawer').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

/* ── PERSONA: avatar único que cicla entre persona(s) ─── */
function personaSeq(){ const s=[...PEOPLE]; if(PEOPLE.length>1) s.push('AB'); return s; }
function personaLabel(id){
  if(id==='AB') return '👥 Todas';
  const t = TARGETS[id] || {};
  return (t.name||'').trim() || ('Persona '+(PEOPLE.indexOf(id)+1));
}
// Token mínimo para el avatar: icono si no hay nombre; el prefijo más corto
// (hasta 3 letras) que NO comparta ninguna otra persona; si ni con 3 letras se
// distingue, inicial + número de orden; 👥 para "Todas".
function personaToken(id){
  if(id==='AB') return {txt:'👥', emoji:true};
  const t = TARGETS[id] || {};
  const name = (t.name||'').trim();
  if(!name) return {txt: t.sym || '🧑', emoji:true};
  const U = s => (s||'').toUpperCase();
  const un = U(name);
  const others = PEOPLE.filter(o=> o!==id).map(o=> U(((TARGETS[o]||{}).name||'').trim())).filter(Boolean);
  const cap = Math.min(3, name.length);
  for(let len=1; len<=cap; len++){
    const pre = un.slice(0, len);
    if(!others.some(o=> o.slice(0, len) === pre)){
      return {txt: name[0].toUpperCase() + name.slice(1, len).toLowerCase(), emoji:false};
    }
  }
  // No distinguible en 3 letras → inicial + número de orden (garantiza diferencia)
  return {txt: name[0].toUpperCase() + (PEOPLE.indexOf(id) + 1), emoji:false};
}
function renderPersonToggle(){
  const tog = document.querySelector('.ptoggle');
  if(!tog) return;
  if(!PEOPLE.includes(S.p) && S.p !== 'AB') S.p = PEOPLE[0];
  const seq = personaSeq();
  const tk = personaToken(S.p), full = personaLabel(S.p);
  const longCls = (!tk.emoji && tk.txt.length >= 3) ? 'is-long' : '';
  // Avatar redondo: muestra la persona activa; al pulsar, cicla a la siguiente.
  tog.innerHTML = `<button class="pbtn pcycle on ${tk.emoji?'is-emoji':''} ${longCls}" id="personaCycle" title="${escHtml(full)} · pulsa para cambiar de persona" aria-label="Persona activa: ${escHtml(full)}. Pulsa para cambiar">${escHtml(tk.txt)}</button>`;
  const btn = document.getElementById('personaCycle');
  if(btn && seq.length>1) btn.addEventListener('click', ()=>{
    const i = seq.indexOf(S.p);
    setPersona(seq[(i+1) % seq.length]);
  });
}
function setPersona(p){
  S.p = p;
  persistPersona();
  renderPersonToggle();   // refresca la etiqueta del botón cíclico
  renderAll();
  if(typeof renderSportActive === 'function') renderSportActive();
  if(document.body.classList.contains('week-mode') && typeof renderWeek === 'function') renderWeek();
}

/* ── SCROLL SPY ──────────────────────────────────────── */
function setupScrollSpy(){
  const sections = CATEGORIES.map(c=>document.getElementById('cat-'+c.key)).filter(Boolean);
  if(!sections.length) return;
  window.addEventListener('scroll', ()=>{
    const y = window.scrollY + 180;
    let active = S.activeCat;
    sections.forEach(s=>{
      if(s.offsetTop <= y) active = s.id.replace('cat-','');
    });
    if(active !== S.activeCat){
      S.activeCat = active;
      document.querySelectorAll('.cbtn').forEach(b=>{
        b.classList.toggle('on', b.dataset.cat === active);
      });
    }
  }, {passive:true});
}

/* ── RENDER ALL ──────────────────────────────────────── */
function renderAll(){
  renderCatNav();
  renderFilters();
  renderMain();
  renderCartBar();
  if(document.getElementById('drawer').classList.contains('show')){
    renderDrawer();
  }
  setupScrollSpy();
  // refresh other views if active
  if(S.view === 'cal' && typeof renderCalendar === 'function') renderCalendar();
  if(S.view === 'saved' && typeof renderSaved === 'function') renderSaved();
  // actualiza la pestaña "Mi día" (badge del carrito) si estamos en Nutrición
  if(typeof renderTabbar === 'function' && !document.body.classList.contains('sec-sport')
     && !document.body.classList.contains('sec-mente') && !document.body.classList.contains('mente-mode')
     && !document.body.classList.contains('sec-week')) renderTabbar('nutri');
}

/* ── VIEW SWITCHING ───────────────────────────────────── */
const VIEWS = ['cat','cal','saved'];
function switchView(v){
  if(!VIEWS.includes(v)) v = 'cat';
  S.view = v;
  lsSet(LS.VIEW, v);
  document.querySelectorAll('.vtab').forEach(b=> b.classList.toggle('on', b.dataset.view === v));
  document.getElementById('view-cat').classList.toggle('hidden', v!=='cat');
  document.getElementById('view-cal').classList.toggle('hidden', v!=='cal');
  document.getElementById('view-saved').classList.toggle('hidden', v!=='saved');
  // catnav + cart bar only relevant in catalog view
  document.getElementById('catnav').style.display = v==='cat' ? '' : 'none';
  document.getElementById('cartFab').style.display = v==='cat' ? '' : 'none';
  if(v!=='cat'){
    document.getElementById('cartBar').classList.remove('show');
  } else {
    renderCartBar();
  }
  if(v==='cal' && typeof renderCalendar === 'function') renderCalendar();
  if(v==='saved' && typeof renderSaved === 'function') renderSaved();
  if(typeof renderTabbar === 'function') renderTabbar('nutri');
}
document.querySelectorAll('.vtab').forEach(b=>{
  if(b.id === 'vtabCreate') return;
  b.addEventListener('click', ()=> switchView(b.dataset.view));
});
const vtabCreate = document.getElementById('vtabCreate');
if(vtabCreate) vtabCreate.addEventListener('click', ()=> openRecipeForm('des'));

/* ── TABBAR INFERIOR ──────────────────────────────────────
   Subvistas de la sección activa en una barra inferior (móvil y
   escritorio). Delega en las funciones de navegación existentes. */
function renderTabbar(section){
  const tb = document.getElementById('appTabbar');
  if(!tb) return;
  const b = document.body;
  section = section || (b.classList.contains('sec-sport') ? 'sport'
            : b.classList.contains('sec-week') ? 'week'
            : (b.classList.contains('sec-mente') || b.classList.contains('mente-mode')) ? 'mente'
            : 'nutri');
  let tabs = [];
  if(section === 'nutri'){
    const n = (typeof S !== 'undefined' && S.cart) ? S.cart.length : 0;
    const cv = (typeof S !== 'undefined') ? S.view : 'cat';
    tabs = [
      {ico:'📖', lbl:'Catálogo',   on:cv==='cat',   fn:()=>switchView('cat')},
      {ico:'📅', lbl:'Calendario', on:cv==='cal',   fn:()=>switchView('cal')},
      {ico:'💾', lbl:'Guardados',  on:cv==='saved', fn:()=>switchView('saved')},
      {ico:'✚', lbl:'Crear',      fn:()=>openRecipeForm('des')},
      {ico:'🛒', lbl:'Mi día',     badge:n||null, fn:()=>openDrawer()}
    ];
  } else if(section === 'sport'){
    const sv = (typeof sportView !== 'undefined') ? sportView : 'ex';
    tabs = [
      {ico:'💪', lbl:'Ejercicios', on:sv==='ex',   fn:()=>showSportView('ex')},
      {ico:'📋', lbl:'Sesiones',   on:sv==='sess', fn:()=>showSportView('sess')},
      {ico:'🗓️', lbl:'Calendario', on:sv==='scal', fn:()=>showSportView('scal')}
    ];
  } // week y mente: sin tabbar (se oculta por CSS / tabs vacíos)
  if(!tabs.length){ tb.style.display = 'none'; tb.innerHTML = ''; return; }
  tb.style.display = '';
  tb.innerHTML = tabs.map((t,i)=>`<button class="tb ${t.on?'on':''}" data-i="${i}" role="tab" aria-selected="${!!t.on}">
      ${t.badge ? `<span class="tb-badge">${t.badge}</span>` : ''}
      <span class="tb-ico">${t.ico}</span><span class="tb-l">${t.lbl}</span>
    </button>`).join('');
  tb.querySelectorAll('.tb').forEach((btn,i)=> btn.addEventListener('click', ()=>{
    try{ tabs[i].fn(); }catch(e){}
    renderTabbar(section);
  }));
}
window.renderTabbar = renderTabbar;

/* ── INIT ────────────────────────────────────────────── */
renderPersonToggle();   // construye el selector de personas (dinámico)

/* Menú ☰ de secciones (Nutrición/Deporte/Semana/Mente) */
function wireSecMenu(){
  const btn = document.getElementById('secMenuBtn');
  const menu = document.getElementById('secMenu');
  if(!btn || !menu) return;
  const close = ()=>{ menu.hidden = true; btn.setAttribute('aria-expanded','false'); };
  const open = ()=>{
    const b = document.body;
    const cur = b.classList.contains('sec-sport') ? 'sport'
              : b.classList.contains('sec-week')  ? 'week'
              : (b.classList.contains('sec-mente') || b.classList.contains('mente-mode')) ? 'mente' : 'nutri';
    menu.querySelectorAll('.sec-mi').forEach(m=> m.classList.toggle('on', m.dataset.sec === cur));
    menu.hidden = false; btn.setAttribute('aria-expanded','true');
  };
  btn.addEventListener('click', e=>{ e.stopPropagation(); menu.hidden ? open() : close(); });
  menu.querySelectorAll('.sec-mi').forEach(m=> m.addEventListener('click', ()=>{
    close();
    if(m.dataset.page === 'measures'){ if(typeof window.openFoodMeasures === 'function') window.openFoodMeasures(); return; }
    if(m.dataset.page === 'info'){ if(typeof window.pnInfoLegal === 'function') window.pnInfoLegal(); return; }
    if(typeof window.setSection === 'function') window.setSection(m.dataset.sec);
    else { const sb = document.querySelector('.sec-btn[data-sec="'+m.dataset.sec+'"]'); if(sb) sb.click(); }
  }));
  document.addEventListener('click', e=>{ if(!menu.hidden && !menu.contains(e.target) && e.target !== btn) close(); });
}
wireSecMenu();

document.getElementById('settingsBtn').addEventListener('click', ()=> openSettings());

document.getElementById('mClose').addEventListener('click', closeModal);
document.getElementById('modalBg').addEventListener('click', e=>{
  if(e.target.id === 'modalBg') closeModal();
});

document.getElementById('cartFab').addEventListener('click', openDrawer);
document.getElementById('cbOpen').addEventListener('click', openDrawer);
document.getElementById('drClose').addEventListener('click', closeDrawer);
document.getElementById('drawerBg').addEventListener('click', closeDrawer);

document.getElementById('drClear').addEventListener('click', ()=>{
  S.cart = [];
  persistCart();
  renderAll();
});

// ── Añadir ALIMENTO SUELTO a Mi día (con su cantidad) ──
const drAddLooseBtn = document.getElementById('drAddLoose');
if(drAddLooseBtn) drAddLooseBtn.addEventListener('click', openLooseFoodForm);

function openLooseFoodForm(){
  openForm(`
    <div class="form-hd"><h2>Añadir alimento suelto</h2><span class="form-sub">Cuenta en el total del día con la cantidad que indiques</span></div>
    <div class="form-body">
      <div class="fgrp">
        <label class="flbl">Alimento</label>
        <div class="lf-field"><input class="finp" id="lfSearch" placeholder="Buscar alimento…" autocomplete="off"><div class="food-ac" id="lfAc"></div></div>
      </div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Cantidad</label><input class="finp mono" id="lfQty" type="number" min="0" step="any" placeholder="ej. 120"></div>
        <div class="fgrp"><label class="flbl">Unidad</label><select class="fsel" id="lfUnit"><option value="g">gramos</option></select></div>
      </div>
      <div class="fgrp">
        <label class="flbl">¿En qué comida?</label>
        <div class="fchips" id="lfSlot">
          <button type="button" class="fchip on" data-s="des">☀️ Desayuno</button>
          <button type="button" class="fchip" data-s="com">🍽 Comida</button>
          <button type="button" class="fchip" data-s="mer">🍎 Merienda</button>
          <button type="button" class="fchip" data-s="cen">🌙 Cena</button>
        </div>
      </div>
      <div id="lfPreview" class="lf-preview">Elige un alimento y una cantidad.</div>
      <div class="form-actions">
        <button class="btn-sec" id="lfCancel">Cancelar</button>
        <button class="btn-prim" id="lfAdd">Añadir a Mi día</button>
      </div>
    </div>`);

  let picked = null;
  const search  = document.getElementById('lfSearch');
  const ac      = document.getElementById('lfAc');
  const qty     = document.getElementById('lfQty');
  const unitSel = document.getElementById('lfUnit');
  const preview = document.getElementById('lfPreview');
  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const closeAc = ()=>{ ac.classList.remove('show'); ac.innerHTML=''; };

  const updatePreview = ()=>{
    if(!picked){ preview.textContent='Elige un alimento y una cantidad.'; return; }
    const q = +qty.value || 0;
    if(!q){ preview.textContent = `${picked.food.name}: indica la cantidad.`; return; }
    const it = {f:picked.id}; if(unitSel.value==='u') it.u=q; else it.g=q;
    const g = itemGrams(it);
    const m = gramMacros(picked.id, g);
    preview.innerHTML = `<strong>${escHtml(picked.food.name)}</strong> · ${Math.round(g)} g → <b>${Math.round(m.k)} kcal</b> · ${Math.round(m.p)}P ${Math.round(m.f)}G ${Math.round(m.c)}C`;
  };
  const selectFood = (id)=>{
    picked = {id, food: FOODS[id]};
    search.value = FOODS[id].name;
    const hasUnit = !!(FOODS[id].unit && FOODS[id].unit.g);
    unitSel.innerHTML = `<option value="g">gramos</option>` + (hasUnit ? `<option value="u">${escHtml(FOODS[id].unit.lbl||'unidad')}</option>` : '');
    closeAc(); updatePreview(); qty.focus();
  };
  const renderAc = ()=>{
    const q = norm(search.value.trim());
    if(!q){ closeAc(); return; }
    const matches = Object.keys(FOODS).filter(id=> norm(FOODS[id].name).includes(q)).slice(0,10);
    ac.innerHTML = matches.length
      ? matches.map(id=>`<div class="fa-it" data-id="${id}"><span>${escHtml(FOODS[id].name)}</span><span class="fa-mac">${FOODS[id].kcal} kcal/100g</span></div>`).join('')
      : `<div class="fa-it" style="opacity:.6">Sin resultados</div>`;
    ac.classList.add('show');
    ac.querySelectorAll('.fa-it[data-id]').forEach(el=> el.addEventListener('mousedown', e=>{ e.preventDefault(); selectFood(el.dataset.id); }));
  };
  search.addEventListener('input', ()=>{ picked=null; renderAc(); updatePreview(); });
  search.addEventListener('focus', renderAc);
  search.addEventListener('blur', ()=> setTimeout(closeAc, 160));
  qty.addEventListener('input', updatePreview);
  unitSel.addEventListener('change', updatePreview);
  document.querySelectorAll('#lfSlot .fchip').forEach(b=> b.addEventListener('click', ()=>{
    document.querySelectorAll('#lfSlot .fchip').forEach(x=> x.classList.toggle('on', x===b));
  }));
  document.getElementById('lfCancel').addEventListener('click', closeForm);
  document.getElementById('lfAdd').addEventListener('click', ()=>{
    if(!picked){ preview.className='lf-preview err'; preview.textContent='Elige un alimento de la lista.'; return; }
    const q = +qty.value || 0;
    if(q<=0){ preview.className='lf-preview err'; preview.textContent='Indica una cantidad mayor que 0.'; return; }
    const slotBtn = document.querySelector('#lfSlot .fchip.on');
    const slot = slotBtn ? slotBtn.dataset.s : 'com';
    const it = {f:picked.id, fx:true}; if(unitSel.value==='u') it.u=q; else it.g=q;
    const food = picked.food;
    const qLbl = unitSel.value==='u' ? `${q} ${(food.unit&&food.unit.lbl)||'ud'}` : `${q} g`;
    const id = nextUserId();
    DISHES[id] = {
      cat: slot, loose:true,
      short: food.name.slice(0,24), nom: `${food.name} · ${qLbl}`,
      icon: (FOOD_SECTIONS[food.sec]||{}).ico || '🍎',
      t:'—', eq:'—', tags:[], tipo:null, diet:[], desc:'Alimento suelto añadido manualmente.', nota:'—',
      comp:[it], food:[]
    };
    recomputeDish(DISHES[id]);
    S.cart.push(id);
    persistCustom(); persistCart();
    closeForm();
    renderAll();
  });
}

document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    closeModal();
    closeDrawer();
  }
});

renderAll();
// el estado activo del selector de personas ya lo fija renderPersonToggle()

// Auto-sincronización con el día actual del calendario:
//  · Si cambió la fecha desde el último uso → reemplaza con el calendario de hoy (limpia comidas viejas)
//  · Si es el mismo día y Mi día está vacío → carga el calendario de hoy
//  · Si es el mismo día y ya hay platos → añade SOLO lo pendiente del calendario (no duplica)
(function syncMiDiaOnStartup(){
  const lastDate = lsGet('mnut:cartDate:v1', null);
  const today    = getTodayDate();
  if(lastDate && lastDate !== today){
    // cambió el día — reemplaza con el menú de hoy
    if(syncWithToday('replace')){
      // si no había nada en el calendario, dejamos el cart como esté
    } else {
      // calendario sin nada para hoy: limpia los restos de ayer
      S.cart = []; persistCart();
    }
    lsSet('mnut:cartDate:v1', today);
    renderAll();
  } else {
    syncWithToday(S.cart.length ? 'merge' : 'replace');
    if(S.cart.length) renderAll();
  }
})();

// Re-sincroniza cada vez que el drawer se abre (refleja cambios hechos en Calendario)
// Nota: la sincronización ya ocurre dentro de openDrawer().

// view restoration happens in menu-saved.js (loaded last) so calendar/saved
// functions are defined by the time switchView runs

/* ── PWA · registro del service worker (offline) ─────────── */
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

/* ── A11y · cerrar el modal/cajón visible con la tecla Escape ─ */
document.addEventListener('keydown', (e)=>{
  if(e.key !== 'Escape') return;
  const overlays = ['promptBg','formBg','modalBg','pickerBg'];
  for(const idd of overlays){
    const el = document.getElementById(idd);
    if(el && el.classList.contains('show')){ el.classList.remove('show'); document.body.classList.remove('no-scroll'); return; }
  }
  const dr = document.getElementById('drawer');
  if(dr && dr.classList.contains('show')){
    if(typeof closeDrawer === 'function') closeDrawer();
    else { dr.classList.remove('show'); const b=document.getElementById('drawerBg'); if(b) b.classList.remove('show'); document.body.classList.remove('no-scroll'); }
  }
});
