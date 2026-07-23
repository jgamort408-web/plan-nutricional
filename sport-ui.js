/* ══════════════════════════════════════════════════════════
   SPORT UI · conmutador de sección + catálogos + detalle + editor
   depende de sport-data.js, sport-engine.js, openForm/closeForm,
   switchView/S (menu-app.js)
══════════════════════════════════════════════════════════ */
function spEsc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/* Animación 3D EN STANDBY · pon true para reactivar el visor y la etiqueta ▶3D */
const ANIM_ENABLED = false;

/* ── Conmutador Nutrición / Deporte ──────────────────────── */
let sportMode = false;
var sportView = lsGet('sport:view', 'ex');
const SPORT_VIEWS = ['ex','sess','scal','prog'];

function setSection(sec){
  // Cambiar de sección es navegar: cierra cualquier página de contenido o de Usuarios
  // que estuviera abierta (no deben quedar superpuestas sobre la sección).
  try{ if(window.AppPage && AppPage.current) AppPage.close(true); }catch(e){}
  try{ var _bg=document.getElementById('formBg'); if(_bg && _bg.classList.contains('users-mode') && _bg.classList.contains('show') && typeof closeForm==='function') closeForm(true); }catch(e){}
  try{ if(window.AppPage && AppPage.current) AppPage.close(true); }catch(e){}
  sportMode = (sec === 'sport');
  const weekMode = (sec === 'week');
  const menteMode = (sec === 'mente');
  document.body.classList.toggle('sport-mode', sportMode);
  document.body.classList.toggle('week-mode', weekMode);
  document.body.classList.toggle('mente-mode', menteMode);
  // Clase de sección para el color de acento (estilo común, acento por sección)
  document.body.classList.remove('sec-nutri','sec-sport','sec-week','sec-mente');
  document.body.classList.add('sec-' + sec);
  // Subtítulo del logo según la sección (header más profesional/equilibrado)
  const _sub = document.getElementById('logoSub');
  if(_sub) _sub.textContent =
    sec==='sport' ? 'Entrenamiento' :
    sec==='week'  ? 'Planificación por fechas' :
    sec==='mente' ? 'Bienestar mental' : 'Menú semanal';
  document.querySelectorAll('.sec-btn').forEach(b=> b.classList.toggle('on', b.dataset.sec === sec));
  document.getElementById('nutriVtabs').classList.toggle('hidden', sportMode || weekMode || menteMode);
  document.getElementById('sportVtabs').classList.toggle('hidden', !sportMode);
  document.getElementById('catnav').style.display = (sportMode || weekMode || menteMode || S.view !== 'cat') ? 'none' : '';

  // Sección "Mente" (psicodiet incrustada) — se muestra/oculta el iframe
  const mv = document.getElementById('view-mente');
  if(mv) mv.classList.toggle('hidden', !menteMode);
  if(menteMode){
    const fr = document.getElementById('menteFrame');
    if(fr && !fr.getAttribute('src')) fr.setAttribute('src', 'psicodiet.html');  // carga perezosa
    const hdr = document.querySelector('.hdr');
    if(hdr && mv) mv.style.top = hdr.offsetHeight + 'px';                          // panel bajo la cabecera
    const wk2 = document.getElementById('view-week'); if(wk2) wk2.classList.add('hidden');
    ['view-cat','view-cal','view-saved'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.add('hidden'); });
    document.querySelectorAll('.sportview').forEach(el=> el.classList.add('hidden'));
    const cf=document.getElementById('cartFab'); if(cf) cf.style.display='none';
    const cb=document.getElementById('cartBar'); if(cb) cb.classList.remove('show');
    if(typeof renderTabbar === 'function') renderTabbar('mente');   // oculta la tabbar (Mente usa la suya)
    lsSet('sport:section', sec);
    return;
  }

  const wk = document.getElementById('view-week');
  if(weekMode){
    ['view-cat','view-cal','view-saved'].forEach(id=> document.getElementById(id).classList.add('hidden'));
    document.querySelectorAll('.sportview').forEach(el=> el.classList.add('hidden'));
    document.getElementById('cartFab').style.display = 'none';
    document.getElementById('cartBar').classList.remove('show');
    if(wk) wk.classList.remove('hidden');
    if(typeof renderWeek === 'function') renderWeek();
    if(typeof renderTabbar === 'function') renderTabbar('week');   // Semana: sin subvistas
  } else if(sportMode){
    if(wk) wk.classList.add('hidden');
    ['view-cat','view-cal','view-saved'].forEach(id=> document.getElementById(id).classList.add('hidden'));
    document.getElementById('cartFab').style.display = 'none';
    document.getElementById('cartBar').classList.remove('show');
    showSportView(sportView);
  } else {
    if(wk) wk.classList.add('hidden');
    document.querySelectorAll('.sportview').forEach(el=> el.classList.add('hidden'));
    document.body.classList.remove('spv-ex','spv-sess','spv-scal','spv-prog');   // fuera de Deporte: sin vista de deporte
    if(typeof renderTrainBar === 'function') renderTrainBar();                   // retira la barra «Entrenar hoy»
    switchView(S.view);
  }
  lsSet('sport:section', sec);
}

function showSportView(v){
  if(!SPORT_VIEWS.includes(v)) v = 'ex';
  sportView = v;
  lsSet('sport:view', v);
  document.querySelectorAll('#sportVtabs .svtab').forEach(b=> b.classList.toggle('on', b.dataset.sview === v));
  document.querySelectorAll('.sportview').forEach(el=> el.classList.add('hidden'));
  document.getElementById('sportview-' + v).classList.remove('hidden');
  document.body.classList.remove('spv-ex','spv-sess','spv-scal','spv-prog');
  document.body.classList.add('spv-' + v);
  if(v === 'ex')   renderExercises();
  if(v === 'sess') renderSessions();
  if(v === 'scal' && typeof renderSportCalendar === 'function') renderSportCalendar();
  if(v === 'prog' && typeof renderProgress === 'function') renderProgress();
  if(typeof renderTrainBar === 'function') renderTrainBar();   // barra «Entrenar hoy»
  if(typeof renderTabbar === 'function') renderTabbar('sport');
}

/* refresca la vista de deporte activa */
function renderSportActive(){ if(sportMode) showSportView(sportView); }

/* ── EJERCICIOS (catálogo) ───────────────────────────────── */
let _spExFilter = 'all';
let _spExMuscle = 'all';
let _spExDisc   = 'all';
let _spFavOnly  = false;
let _spExSearch = '';
let _spExView   = lsGet('sport:exview', 'compact');   // 'detail' | 'compact' (compacta por defecto)
// Estado del bottom-sheet de filtros de deporte (móvil)
let _spSheetOpen = false, _spSheetScroll = 0;
function spActiveCount(){
  return (_spExFilter!=='all'?1:0) + (_spExMuscle!=='all'?1:0) + (_spExDisc!=='all'?1:0) + (_spFavOnly?1:0);
}
function spResultCount(){
  const q = _norm(_spExSearch).trim();
  return Object.keys(EXERCISES).filter(id=>{
    const ex = EXERCISES[id];
    if(_spExFilter!=='all' && ex.type!==_spExFilter) return false;
    if(_spExMuscle!=='all' && !(ex.muscles||[]).includes(_spExMuscle)) return false;
    if(_spExDisc!=='all' && exDisc(ex)!==_spExDisc) return false;
    if(_spFavOnly && !isFav(id)) return false;
    if(q && !_norm(ex.name).includes(q)) return false;
    return true;
  }).length;
}
function setSpSheet(open){
  _spSheetOpen = open;
  const sheet = document.getElementById('spFSheet');
  const back  = document.getElementById('spFBack');
  if(sheet) sheet.classList.toggle('open', open);
  if(back)  back.classList.toggle('open', open);
  document.body.classList.toggle('sheet-lock', open);
  if(open){ const b = document.querySelector('#spFSheet .fsheet-body'); if(b) b.scrollTop = _spSheetScroll; }
}
function renderExercises(){
  const types = ['all', ...Object.keys(EX_TYPES)];
  const typeRow = `<div class="frow-grp"><span class="frow-lbl">Tipo</span>${types.map(t=>{
    const lbl = t==='all' ? 'Todos' : EX_TYPES[t].lbl;
    const ico = t==='all' ? '◇' : EX_TYPES[t].ico;
    return `<button class="fpill ${_spExFilter===t?'on':''}" data-spf="${t}"><span class="fico">${ico}</span>${lbl}</button>`;
  }).join('')}</div>`;
  const discRow = `<div class="frow-grp sp-disc-row">
    <span class="frow-lbl">Deporte</span>
    <select class="fsel sp-disc-sel" id="spExDiscSel">
      <option value="all">🏅 Todos los deportes</option>
      ${Object.entries(EX_SPORTS).map(([k,v])=>`<option value="${k}" ${_spExDisc===k?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}
    </select>
    <button class="fpill fav ${_spFavOnly?'on':''}" data-favtog>${_spFavOnly?'★':'☆'} Favoritos</button>
  </div>`;
  const muscles = ['all', ...Object.keys(EX_MUSCLES)];
  const muscRow = `<div class="frow-grp"><span class="frow-lbl">Músculo</span>${muscles.map(m=>{
      const lbl = m==='all' ? 'Todo el cuerpo' : EX_MUSCLES[m].lbl;
      return `<button class="fpill ${_spExMuscle===m?'on':''}" data-spm="${m}">${lbl}</button>`;
    }).join('')}</div>`;
  const viewRow = `<div class="frow-grp"><span class="frow-lbl">Vista</span>${[['detail','▤','Detalle'],['compact','▪','Compacto']].map(([k,ic,lb])=>`<button class="fpill spvm-pill ${_spExView===k?'on':''}" data-spvm="${k}"><span class="fico">${ic}</span>${lb}</button>`).join('')}</div>`;
  const nActive = spActiveCount();
  const cont = document.getElementById('spExFilters');
  cont.innerHTML = `
    <div class="fbar-quick">
      <input class="sp-search" id="spExSearch" type="search" placeholder="🔎 Buscar ejercicio por nombre…" value="${spEsc(_spExSearch)}">
      <button class="fbtn-open ${nActive?'has-active':''}" id="spFOpen" type="button" aria-label="Filtros">
        <span class="ffunnel">⚙</span> Filtros<span class="fbadge">${nActive}</span>
      </button>
    </div>
    <div class="filter-sheet" id="spFSheet">
      <div class="fsheet-hd"><strong>Filtros</strong><button class="fsheet-x" id="spFClose" type="button" aria-label="Cerrar">✕</button></div>
      <div class="fsheet-body">${typeRow}${discRow}${muscRow}${viewRow}</div>
      <div class="fsheet-foot">
        <button class="fsheet-clear" id="spFClear" type="button">Limpiar</button>
        <button class="fsheet-apply" id="spFApply" type="button">Ver ${spResultCount()} resultados</button>
      </div>
    </div>
    <div class="filter-backdrop" id="spFBack"></div>`;

  cont.querySelectorAll('[data-spf]').forEach(b=> b.addEventListener('click', ()=>{ _spExFilter=b.dataset.spf; renderExercises(); }));
  cont.querySelectorAll('[data-spm]').forEach(b=> b.addEventListener('click', ()=>{ _spExMuscle=b.dataset.spm; renderExercises(); }));
  const ds = document.getElementById('spExDiscSel'); if(ds) ds.addEventListener('change', ()=>{ _spExDisc=ds.value; renderExercises(); });
  const ft = cont.querySelector('[data-favtog]'); if(ft) ft.addEventListener('click', ()=>{ _spFavOnly=!_spFavOnly; renderExercises(); });
  cont.querySelectorAll('[data-spvm]').forEach(b=> b.addEventListener('click', ()=>{ _spExView=b.dataset.spvm; lsSet('sport:exview',_spExView); renderExercises(); }));
  const se = document.getElementById('spExSearch'); if(se) se.addEventListener('input', ()=>{ _spExSearch=se.value; renderExGrid(); });   // solo rejilla → no pierde foco

  // Bottom-sheet (móvil)
  const ob = document.getElementById('spFOpen'); if(ob) ob.addEventListener('click', ()=> setSpSheet(true));
  const cb = document.getElementById('spFClose'); if(cb) cb.addEventListener('click', ()=> setSpSheet(false));
  const bk = document.getElementById('spFBack'); if(bk) bk.addEventListener('click', ()=> setSpSheet(false));
  const ap = document.getElementById('spFApply'); if(ap) ap.addEventListener('click', ()=> setSpSheet(false));
  const cl = document.getElementById('spFClear'); if(cl) cl.addEventListener('click', ()=>{ _spExFilter='all'; _spExMuscle='all'; _spExDisc='all'; _spFavOnly=false; renderExercises(); });
  const sb = document.querySelector('#spFSheet .fsheet-body'); if(sb) sb.addEventListener('scroll', ()=>{ _spSheetScroll = sb.scrollTop; });
  if(_spSheetOpen) setSpSheet(true);

  renderExGrid();
}
function _norm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function renderExGrid(){
  const q = _norm(_spExSearch).trim();
  const ids = Object.keys(EXERCISES).filter(id=>{
    const ex = EXERCISES[id];
    if(_spExFilter!=='all' && ex.type!==_spExFilter) return false;
    if(_spExMuscle!=='all' && !(ex.muscles||[]).includes(_spExMuscle)) return false;
    if(_spExDisc!=='all' && exDisc(ex)!==_spExDisc) return false;
    if(_spFavOnly && !isFav(id)) return false;
    if(q && !_norm(ex.name).includes(q)) return false;
    return true;
  });
  const grid = document.getElementById('spExGrid');
  grid.dataset.spvm = _spExView;
  grid.innerHTML = ids.length ? ids.map(exCardHtml).join('')
    : `<div class="sp-empty">${q?`Sin ejercicios que coincidan con “${spEsc(_spExSearch)}”.`:(_spFavOnly?'No tienes ejercicios marcados como favoritos para este filtro.':'Sin ejercicios para este filtro.')}</div>`;
  grid.querySelectorAll('.sp-card').forEach(c=> c.addEventListener('click', ()=> openExerciseDetail(c.dataset.id)));
}
function exCardHtml(id){
  const ex = EXERCISES[id];
  const t = EX_TYPES[ex.type] || {ico:'•',lbl:ex.type};
  const isUser = !!ex.user;
  const fav = isFav(id);
  const illus = (typeof exIllusBox==='function') ? exIllusBox(id,{cls:'card'}) : '';
  return `<article class="sp-card ex${fav?' is-fav':''}" data-id="${id}">
    ${fav?'<span class="sp-fav-mark" title="En favoritos" aria-label="En favoritos">★</span>':''}
    ${isUser?'<span class="sp-badge">Tuyo</span>':''}
    ${illus}
    <div class="sp-card-body">
      <div class="sp-card-hd"><span class="sp-ico">${t.ico}</span><span class="sp-type">${t.lbl}</span>${(()=>{const di=(EX_SPORTS[exDisc(ex)]||{}).ico||''; return di&&di!==t.ico?`<span class="sp-disc">${di}</span>`:'';})()}</div>
      <div class="sp-card-n">${spEsc(ex.name)}</div>
      <div class="msc-row">${muscleChips(ex.muscles,{dot:true})}</div>
      <div class="sp-card-meta">
        <span>${itemScheme({e:id})}</span>
        <span>·</span>
        <span>${ex.met} MET</span>
        ${(ANIM_ENABLED && typeof hasAnimFor==='function'&&hasAnimFor(ex))?'<span>·</span><span class="anim-tag">▶ 3D</span>':''}
        ${ex.pat&&EX_PATTERNS[ex.pat]?`<span>·</span><span>${EX_PATTERNS[ex.pat].lbl}</span>`:''}
        ${ex.equip?`<span>·</span><span>${spEsc(ex.equip)}</span>`:''}
      </div>
    </div>
  </article>`;
}

function openExerciseDetail(id){
  const ex = EXERCISES[id]; if(!ex) return;
  const t = EX_TYPES[ex.type] || {ico:'•',lbl:ex.type};
  const kcalA = Math.round(itemKcal({e:id}, personWeight('A')));
  const kcalB = Math.round(itemKcal({e:id}, personWeight('B')));
  const pat = ex.pat && EX_PATTERNS[ex.pat] ? EX_PATTERNS[ex.pat] : null;
  const hasAnim = ANIM_ENABLED && ((typeof hasAnimFor==='function') ? hasAnimFor(ex) : !!(ex.visual && typeof ANIM_TEMPLATES!=='undefined' && ANIM_TEMPLATES[ex.visual.template]));
  const html = `
    <div class="form-hd"><h2>${t.ico} ${spEsc(ex.name)}</h2><span class="form-sub">${t.lbl}${pat?' · '+pat.lbl:''} · ${spEsc(ex.equip||'—')}</span></div>
    <div class="form-body">
      ${hasAnim?`<div class="anim-wrap"><div class="anim-canvas" id="exAnimMount"><div class="anim-msg">Cargando 3D…</div></div><div class="anim-bar"><button class="anim-btn" id="exAnimToggle">⏸ Pausar</button><span class="anim-hint">🖱️ Arrastra para girar · maniquí 3D</span></div></div>`
        : (typeof exIllusBox==='function' ? `<div class="ex-visual-row">
            <div class="ex-illus-hero">${exIllusBox(id,{cls:'hero'})}<span class="ex-illus-cap">Movimiento</span></div>
            ${typeof muscleMapBox==='function' ? `<div class="ex-musclemap">${muscleMapBox(ex.muscles)}</div>` : ''}
          </div>` : '')}
      <div class="msc-row big">${muscleChips(sessionMuscles({items:[{e:id}]}),{dot:true})}</div>
      <div class="sp-detail-grid">
        <div class="sdg-cell"><b>${itemScheme({e:id})}</b><i>pauta</i></div>
        <div class="sdg-cell"><b>${ex.met}</b><i>MET</i></div>
        <div class="sdg-cell"><b>${fmtDur(itemTotalSec({e:id}))}</b><i>≈ duración</i></div>
        <div class="sdg-cell"><b>${kcalA}·${kcalB}</b><i>kcal A·B</i></div>
      </div>
      ${ex.cues?`<div class="sp-cues"><span class="scl">Técnica</span>${spEsc(ex.cues)}</div>`:''}
      <details class="sp-guide"><summary>Dosis orientativa por objetivo</summary>
        <table class="og-tbl">${OBJECTIVE_GUIDE.map(o=>`<tr><th>${o.lbl}</th><td>${o.dose}</td></tr>`).join('')}</table>
        <span class="og-src">Marco de prescripción · ACSM/NSCA (deep-research-report)</span>
      </details>
    </div>
    <div class="form-actions">
      ${ex.user?`<button class="btn-danger" id="exDel">🗑 Eliminar</button>`:''}
      <button class="btn-sec" id="exFav">${isFav(id)?'★ Favorito':'☆ Favorito'}</button>
      <button class="btn-sec" id="exEdit">✎ ${ex.user?'Editar':'Duplicar y editar'}</button>
      <button class="btn-prim" id="exClose">Cerrar</button>
    </div>`;
  openForm(html);
  if(hasAnim && typeof startExerciseAnim==='function'){
    const mount = document.getElementById('exAnimMount');
    startExerciseAnim(ex, mount);
    const tg = document.getElementById('exAnimToggle');
    if(tg) tg.addEventListener('click', ()=>{ if(mount._animApi){ const playing=mount._animApi.toggle(); tg.textContent = playing?'⏸ Pausar':'▶ Reproducir'; } });
  }
  document.getElementById('exClose').addEventListener('click', closeForm);
  document.getElementById('exFav').addEventListener('click', ()=>{ const on=toggleFav(id); const b=document.getElementById('exFav'); b.textContent=on?'★ Favorito':'☆ Favorito'; b.classList.toggle('on-fav', on); });
  document.getElementById('exEdit').addEventListener('click', ()=> openExerciseEditor(ex.user?id:null, ex.user?null:ex));
  const del = document.getElementById('exDel');
  if(del) del.addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Eliminar este ejercicio?', {danger:true, okText:'Eliminar'})) return;
    const snap = JSON.parse(JSON.stringify(EXERCISES[id]));
    delete EXERCISES[id]; persistExercises(); closeForm(); renderExercises();
    if(typeof showUndo==='function') showUndo('Ejercicio eliminado', ()=>{ EXERCISES[id]=snap; persistExercises(); renderExercises(); });
  });
}

/* ── Crear ejercicios/sesiones con IA (genera prompt → copiar → importar JSON) ── */
function spCopyText(text){
  const ok = ()=> alert('✅ Prompt copiado.\n\nPégalo en tu IA (ChatGPT, Claude…), guarda lo que te devuelva como archivo .json y luego impórtalo en Ajustes → Usuarios → Copia de datos → «Importar ejercicios / Importar sesiones».');
  const fallback = ()=>{ const ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.focus(); ta.select(); try{ document.execCommand('copy'); ok(); }catch(e){ alert('Copia el prompt manualmente.'); } ta.remove(); };
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(ok).catch(fallback); return; } }catch(e){}
  fallback();
}
function buildExercisePrompt(idea){
  const types = Object.entries(EX_TYPES).map(([k,v])=>`${k} (${v.lbl})`).join(', ');
  const pats  = Object.entries(EX_PATTERNS).map(([k,v])=>`${k} (${v.lbl})`).join(', ');
  const musc  = Object.entries(EX_MUSCLES).map(([k,v])=>`${k} (${v.lbl})`).join(', ');
  return [
`Actúa como entrenador personal experto y como experto en seguir formatos de salida al pie de la letra.`,
``,
`OBJETIVO: diseña uno o varios EJERCICIOS de entrenamiento según la petición y devuélvelos EXCLUSIVAMENTE como un único JSON válido (un array de objetos). No escribas nada antes ni después del JSON.`,
``,
`PETICIÓN: ${idea || '(libre: propón ejercicios útiles y seguros)'}`,
``,
`FORMATO de cada ejercicio (usa SOLO los ids válidos que se indican):`,
`{`,
`  "name": "Nombre del ejercicio",`,
`  "type": "uno de: ${types}",`,
`  "pat": "patrón, uno de: ${pats}",`,
`  "muscles": ["ids de músculos, de: ${musc}"],`,
`  "met": número (gasto metabólico aprox, p.ej. 6),`,
`  "equip": "material (texto libre, puede ir vacío)",`,
`  "mode": "reps" o "time",`,
`  "sets": número de series,`,
`  "reps": número de repeticiones (0 si mode=time),`,
`  "dur": segundos por serie (0 si mode=reps),`,
`  "rest": segundos de descanso entre series,`,
`  "cues": "técnica e indicaciones de ejecución"`,
`}`,
``,
`DEVUELVE: un array JSON, p. ej. [ {…}, {…} ]. Solo el JSON.`
  ].join('\n');
}
function buildSessionPrompt(idea){
  const types = Object.entries(EX_TYPES).map(([k,v])=>`${k} (${v.lbl})`).join(', ');
  const catalog = Object.keys(EXERCISES).map(id=>`${id} — ${EXERCISES[id].name}`).join('\n');
  return [
`Actúa como entrenador personal experto y como experto en seguir formatos de salida al pie de la letra.`,
``,
`OBJETIVO: diseña una SESIÓN de entrenamiento según la petición y devuélvela EXCLUSIVAMENTE como un único JSON válido. No escribas nada antes ni después del JSON.`,
``,
`PETICIÓN: ${idea || '(libre: propón una sesión equilibrada)'}`,
``,
`IMPORTANTE: en "items[].e" usa SOLO ids de ejercicios que ya existen en la app (lista abajo). No inventes ids.`,
``,
`FORMATO:`,
`{`,
`  "name": "Nombre de la sesión",`,
`  "focus": "enfoque breve",`,
`  "type": "uno de: ${types}",`,
`  "level": "Principiante | Intermedio | Avanzado",`,
`  "warmup": "calentamiento sugerido",`,
`  "notes": "notas",`,
`  "items": [ { "e": "id_de_ejercicio_existente", "sets": 4, "reps": 10, "dur": 0, "rest": 75 } ]`,
`}`,
``,
`EJERCICIOS DISPONIBLES (id — nombre):`,
catalog,
``,
`DEVUELVE: solo el JSON de la sesión.`
  ].join('\n');
}

/* ── Editor de ejercicio ─────────────────────────────────── */
function openExerciseEditor(editId, prefill){
  const ex = editId ? EXERCISES[editId] : (prefill ? Object.assign({}, prefill) : {name:'', type:'fuerza', muscles:[], met:5, equip:'', mode:'reps', sets:3, reps:10, dur:40, rest:60, cues:''});
  const html = `
    <div class="form-hd"><h2>${editId?'Editar ejercicio':'Nuevo ejercicio'}</h2><span class="form-sub">Bloque básico de entrenamiento</span></div>
    <div class="form-body" id="exForm">
      <div class="fgrp"><label class="flbl">Nombre</label><input class="finp" name="name" value="${spEsc(ex.name)}" placeholder="Ej. Sentadilla búlgara"></div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Tipo</label><select class="fsel" name="type">${Object.entries(EX_TYPES).map(([k,v])=>`<option value="${k}" ${ex.type===k?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}</select></div>
        <div class="fgrp"><label class="flbl">MET (gasto)</label><input class="finp mono" type="number" step="0.1" min="1" name="met" value="${ex.met}"></div>
      </div>
      <div class="fgrp"><label class="flbl">Patrón de movimiento</label><select class="fsel" name="pat">${Object.entries(EX_PATTERNS).map(([k,v])=>`<option value="${k}" ${ex.pat===k?'selected':''}>${v.lbl}</option>`).join('')}</select></div>
      <div class="fgrp"><label class="flbl">Músculos implicados</label><div class="fchips" id="exMuscles">${Object.entries(EX_MUSCLES).map(([k,v])=>`<button type="button" class="fchip ${ex.muscles.includes(k)?'on':''}" data-m="${k}">${v.lbl}</button>`).join('')}</div></div>
      <div class="fgrp"><label class="flbl">Material</label><input class="finp" name="equip" value="${spEsc(ex.equip||'')}" placeholder="Ej. Mancuernas, banco"></div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Medición</label><select class="fsel" name="mode"><option value="reps" ${ex.mode==='reps'?'selected':''}>Repeticiones</option><option value="time" ${ex.mode==='time'?'selected':''}>Tiempo</option></select></div>
        <div class="fgrp"><label class="flbl">Series</label><input class="finp mono" type="number" min="1" name="sets" value="${ex.sets||3}"></div>
      </div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Reps (si aplica)</label><input class="finp mono" type="number" min="0" name="reps" value="${ex.reps||0}"></div>
        <div class="fgrp"><label class="flbl">Duración s (si tiempo)</label><input class="finp mono" type="number" min="0" name="dur" value="${ex.dur||0}"></div>
      </div>
      <div class="fgrp"><label class="flbl">Descanso entre series (s)</label><input class="finp mono" type="number" min="0" name="rest" value="${ex.rest||60}"></div>
      <div class="fgrp"><label class="flbl">Técnica / notas</label><textarea class="ftxt" name="cues" placeholder="Indicaciones de ejecución">${spEsc(ex.cues||'')}</textarea></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="exAiPrompt" type="button" title="Genera un prompt para crear ejercicios con IA y copiarlo">✨ Crear con IA</button><button class="btn-sec" id="exCancel">Cancelar</button><button class="btn-prim" id="exSave">${editId?'Guardar':'Crear ejercicio'}</button></div>`;
  openForm(html);
  const form = document.getElementById('exForm');
  form.querySelectorAll('#exMuscles .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));
  const exAi = document.getElementById('exAiPrompt');
  if(exAi) exAi.addEventListener('click', ()=>{ const idea=(form.querySelector('[name="name"]').value||'').trim(); spCopyText(buildExercisePrompt(idea)); });
  document.getElementById('exCancel').addEventListener('click', closeForm);
  document.getElementById('exSave').addEventListener('click', ()=>{
    const v = n => (form.querySelector(`[name="${n}"]`).value||'').trim();
    const num = n => +form.querySelector(`[name="${n}"]`).value || 0;
    const name = v('name'); if(!name){ alert('Pon un nombre'); return; }
    const muscles = [...form.querySelectorAll('#exMuscles .fchip.on')].map(b=>b.dataset.m);
    const obj = {name, type:v('type')||'fuerza', pat:v('pat')||'accesorio', muscles, met:num('met')||5, equip:v('equip'), mode:v('mode')||'reps', sets:num('sets')||3, reps:num('reps'), dur:num('dur'), rest:num('rest'), cues:v('cues'), user:true};
    const id = editId || nextSpId(name, EXERCISES);
    EXERCISES[id] = obj; persistExercises();
    closeForm(); renderExercises();
  });
}

/* ── SESIONES (catálogo) ─────────────────────────────────── */
let _spSessFilter = 'all';
let _spSessSheetOpen = false, _spSessSheetScroll = 0;
function spSessResultCount(){
  return Object.keys(SESSIONS).filter(id=> _spSessFilter==='all' || SESSIONS[id].type===_spSessFilter).length;
}
function setSpSessSheet(open){
  _spSessSheetOpen = open;
  const sheet = document.getElementById('spSessSheet');
  const back  = document.getElementById('spSessBack');
  if(sheet) sheet.classList.toggle('open', open);
  if(back)  back.classList.toggle('open', open);
  document.body.classList.toggle('sheet-lock', open);
  if(open){ const b = document.querySelector('#spSessSheet .fsheet-body'); if(b) b.scrollTop = _spSessSheetScroll; }
}
function renderSessions(){
  const types = ['all', ...Object.keys(EX_TYPES)];
  const typeRow = `<div class="frow-grp"><span class="frow-lbl">Tipo</span>${types.map(t=>{
    const lbl = t==='all' ? 'Todas' : EX_TYPES[t].lbl;
    const ico = t==='all' ? '◇' : EX_TYPES[t].ico;
    return `<button class="fpill ${_spSessFilter===t?'on':''}" data-spf="${t}"><span class="fico">${ico}</span>${lbl}</button>`;
  }).join('')}</div>`;
  const nActive = _spSessFilter!=='all' ? 1 : 0;
  const cont = document.getElementById('spSessFilters');
  cont.innerHTML = `
    <div class="fbar-quick fbar-end">
      <button class="fbtn-open ${nActive?'has-active':''}" id="spSessOpen" type="button" aria-label="Filtros">
        <span class="ffunnel">⚙</span> Filtros<span class="fbadge">${nActive}</span>
      </button>
    </div>
    <div class="filter-sheet" id="spSessSheet">
      <div class="fsheet-hd"><strong>Filtros</strong><button class="fsheet-x" id="spSessClose" type="button" aria-label="Cerrar">✕</button></div>
      <div class="fsheet-body">${typeRow}</div>
      <div class="fsheet-foot">
        <button class="fsheet-clear" id="spSessClear" type="button">Limpiar</button>
        <button class="fsheet-apply" id="spSessApply" type="button">Ver ${spSessResultCount()} resultados</button>
      </div>
    </div>
    <div class="filter-backdrop" id="spSessBack"></div>`;
  cont.querySelectorAll('[data-spf]').forEach(b=> b.addEventListener('click', ()=>{ _spSessFilter=b.dataset.spf; renderSessions(); }));
  const ob = document.getElementById('spSessOpen'); if(ob) ob.addEventListener('click', ()=> setSpSessSheet(true));
  const cb = document.getElementById('spSessClose'); if(cb) cb.addEventListener('click', ()=> setSpSessSheet(false));
  const bk = document.getElementById('spSessBack'); if(bk) bk.addEventListener('click', ()=> setSpSessSheet(false));
  const ap = document.getElementById('spSessApply'); if(ap) ap.addEventListener('click', ()=> setSpSessSheet(false));
  const cl = document.getElementById('spSessClear'); if(cl) cl.addEventListener('click', ()=>{ _spSessFilter='all'; renderSessions(); });
  const sb = document.querySelector('#spSessSheet .fsheet-body'); if(sb) sb.addEventListener('scroll', ()=>{ _spSessSheetScroll = sb.scrollTop; });
  if(_spSessSheetOpen) setSpSessSheet(true);

  const ids = Object.keys(SESSIONS).filter(id=> _spSessFilter==='all' || SESSIONS[id].type===_spSessFilter);
  const grid = document.getElementById('spSessGrid');
  grid.innerHTML = ids.length ? ids.map(sessCardHtml).join('') : `<div class="sp-empty">Sin sesiones para este filtro.</div>`;
  grid.querySelectorAll('.sp-card').forEach(c=> c.addEventListener('click', ()=> openSessionDetail(c.dataset.id)));
}
function sessTotalsLabel(sess){
  const tA = sessionTotals(sess,'A'), tB = sessionTotals(sess,'B');
  const kc = S.p==='A' ? tA.kcal : S.p==='B' ? tB.kcal : `${tA.kcal}·${tB.kcal}`;
  return `${tA.min} min · ${kc} kcal`;
}
function sessCardHtml(id){
  const s = SESSIONS[id];
  const t = EX_TYPES[s.type] || {ico:'•',lbl:s.type};
  return `<article class="sp-card sess" data-id="${id}">
    ${s.user?'<span class="sp-badge">Tuya</span>':''}
    <div class="sp-card-hd"><span class="sp-ico">${t.ico}</span><span class="sp-type">${t.lbl}${s.level?' · '+spEsc(s.level):''}</span></div>
    <div class="sp-card-n">${spEsc(s.name)}</div>
    ${s.focus?`<div class="sp-focus">${spEsc(s.focus)}</div>`:''}
    <div class="msc-row">${muscleChips(sessionMuscles(s),{dot:true})}</div>
    <div class="sp-card-bot"><span class="sp-exn">${(s.items||[]).length} ejercicios</span><span class="sp-tot">${sessTotalsLabel(s)}</span></div>
  </article>`;
}

function openSessionDetail(id, ctx){
  const s = SESSIONS[id]; if(!s) return;
  const t = EX_TYPES[s.type] || {ico:'•',lbl:s.type};
  const tA = sessionTotals(s,'A'), tB = sessionTotals(s,'B');
  const rows = (s.items||[]).map(it=>{
    const ex = EXERCISES[it.e]; if(!ex) return '';
    return `<div class="sd-ex" data-exid="${it.e}" role="button" tabindex="0">
      <div class="sd-ex-top"><span class="sd-ex-n">${spEsc(ex.name)} <span class="sd-ex-go">›</span></span><span class="sd-ex-sch">${itemScheme(it)}</span></div>
      <div class="msc-row sm">${muscleChips(ex.muscles,{dot:true})}</div>
      ${ex.cues?`<div class="sd-ex-cue">${spEsc(ex.cues)}</div>`:''}
    </div>`;
  }).join('');
  const inCal = ctx && ctx.key != null;
  const curWho = inCal && SportPlan.days[ctx.key] && SportPlan.days[ctx.key][ctx.idx] ? SportPlan.days[ctx.key][ctx.idx].who : null;
  const html = `
    <div class="form-hd"><h2>${t.ico} ${spEsc(s.name)}</h2><span class="form-sub">${t.lbl}${s.level?' · '+spEsc(s.level):''}${s.focus?' · '+spEsc(s.focus):''}</span></div>
    <div class="form-body">
      ${inCal?`<div class="sd-cal-bar"><span class="scl">Entrena este día</span>${whoSeg(curWho||'AB','data-detwho')}<button class="sd-cal-rm" id="sdRemoveDay">Quitar del día</button></div>`:''}
      <div class="sp-detail-grid">
        <div class="sdg-cell"><b>${tA.min}</b><i>min</i></div>
        <div class="sdg-cell"><b>${(s.items||[]).length}</b><i>ejercicios</i></div>
        <div class="sdg-cell"><b>${tA.kcal}</b><i>kcal ♂A</i></div>
        <div class="sdg-cell"><b>${tB.kcal}</b><i>kcal ♀B</i></div>
      </div>
      <div class="msc-row big">${muscleChips(sessionMuscles(s),{dot:true})}</div>
      ${s.warmup?`<div class="sp-cues"><span class="scl">Calentamiento</span>${spEsc(s.warmup)}</div>`:''}
      <div class="sd-list">${rows}</div>
      ${s.notes?`<div class="sp-cues"><span class="scl">Notas</span>${spEsc(s.notes)}</div>`:''}
    </div>
    <div class="form-actions">
      ${s.user?`<button class="btn-danger" id="sessDel">🗑 Eliminar</button>`:''}
      <button class="btn-sec" id="sessEdit">✎ ${s.user?'Editar':'Duplicar y editar'}</button>
      <button class="btn-prim" id="sessClose">Cerrar</button>
    </div>`;
  openForm(html);
  document.getElementById('sessClose').addEventListener('click', closeForm);
  document.getElementById('sessEdit').addEventListener('click', ()=> openSessionEditor(s.user?id:null, s.user?null:s));
  // abrir cada ejercicio
  formBody().querySelectorAll('.sd-ex').forEach(r=>{
    const open = ()=> openExerciseDetail(r.dataset.exid);
    r.addEventListener('click', open);
    r.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } });
  });
  // contexto de calendario: cambiar quién entrena / quitar del día
  if(inCal){
    formBody().querySelectorAll('[data-detwho] .who-b').forEach(b=> b.addEventListener('click', ()=>{
      formBody().querySelectorAll('[data-detwho] .who-b').forEach(x=>x.classList.toggle('on', x===b));
      if(SportPlan.days[ctx.key] && SportPlan.days[ctx.key][ctx.idx]){ SportPlan.days[ctx.key][ctx.idx].who=b.dataset.who; persistSportPlan(); if(typeof renderSportCalendar==='function') renderSportCalendar(); }
    }));
    const rm=document.getElementById('sdRemoveDay');
    if(rm) rm.addEventListener('click', ()=>{
      if(SportPlan.days[ctx.key]){ SportPlan.days[ctx.key].splice(ctx.idx,1); if(!SportPlan.days[ctx.key].length) delete SportPlan.days[ctx.key]; persistSportPlan(); }
      closeForm(); if(typeof renderSportCalendar==='function') renderSportCalendar();
    });
  }
  const del = document.getElementById('sessDel');
  if(del) del.addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Eliminar esta sesión?', {danger:true, okText:'Eliminar'})) return;
    const snap = JSON.parse(JSON.stringify(SESSIONS[id]));
    const planSnap = (typeof SportPlan!=='undefined') ? JSON.parse(JSON.stringify(SportPlan.days||{})) : null;
    delete SESSIONS[id]; persistSessions();
    // limpia el plan (quita las entradas que usaban esta sesión)
    if(typeof cleanSportPlan === 'function'){ cleanSportPlan(); persistSportPlan(); }
    closeForm(); renderSessions();
    if(typeof showUndo==='function') showUndo('Sesión eliminada', ()=>{
      SESSIONS[id]=snap; persistSessions();
      if(planSnap && typeof SportPlan!=='undefined'){ SportPlan.days=planSnap; if(typeof persistSportPlan==='function') persistSportPlan(); if(typeof renderSportCalendar==='function') renderSportCalendar(); }
      renderSessions();
    });
  });
}

/* ── Editor de sesión ────────────────────────────────────── */
function sessItemRowHtml(it){
  it = it || {e:'', sets:3, reps:10, rest:60};
  const opts = Object.keys(EXERCISES).map(eid=>`<option value="${eid}" ${it.e===eid?'selected':''}>${spEsc(EXERCISES[eid].name)}</option>`).join('');
  return `<div class="sess-it">
    <select class="fsel si-ex"><option value="">— ejercicio —</option>${opts}</select>
    <input class="finp mono si-sets" type="number" min="1" placeholder="ser" value="${it.sets||''}">
    <input class="finp mono si-rr" type="number" min="0" placeholder="rep/seg" value="${it.dur!=null?it.dur:(it.reps!=null?it.reps:'')}">
    <input class="finp mono si-rest" type="number" min="0" placeholder="desc" value="${it.rest!=null?it.rest:''}">
    <button type="button" class="si-rm" title="Quitar">✕</button>
  </div>`;
}
function openSessionEditor(editId, prefill){
  const s = editId ? SESSIONS[editId] : (prefill ? JSON.parse(JSON.stringify(prefill)) : {name:'', focus:'', type:'fuerza', level:'Intermedio', warmup:'', notes:'', items:[null,null,null]});
  const items = (s.items&&s.items.length)?s.items:[null];
  const html = `
    <div class="form-hd"><h2>${editId?'Editar sesión':'Nueva sesión'}</h2><span class="form-sub">Combinación de ejercicios</span></div>
    <div class="form-body" id="sessForm">
      <div class="fgrp"><label class="flbl">Nombre</label><input class="finp" name="name" value="${spEsc(s.name)}" placeholder="Ej. Tren superior B"></div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Tipo</label><select class="fsel" name="type">${Object.entries(EX_TYPES).map(([k,v])=>`<option value="${k}" ${s.type===k?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}</select></div>
        <div class="fgrp"><label class="flbl">Nivel</label><input class="finp" name="level" value="${spEsc(s.level||'')}" placeholder="Intermedio"></div>
      </div>
      <div class="fgrp"><label class="flbl">Enfoque</label><input class="finp" name="focus" value="${spEsc(s.focus||'')}" placeholder="Ej. Empuje y core"></div>
      <div class="fgrp"><label class="flbl">Calentamiento</label><input class="finp" name="warmup" value="${spEsc(s.warmup||'')}" placeholder="5 min movilidad…"></div>
      <div class="fgrp"><label class="flbl">Ejercicios · series · rep o seg · descanso(s)</label>
        <div class="comp-hint">Para ejercicios por tiempo, el 2º campo son <strong>segundos</strong>; para fuerza, son <strong>repeticiones</strong>.</div>
        <div id="sessItems">${items.map(sessItemRowHtml).join('')}</div>
        <button type="button" class="ing-add-btn" id="sessAddItem">＋ Añadir ejercicio</button>
      </div>
      <div class="fgrp"><label class="flbl">Notas</label><textarea class="ftxt" name="notes">${spEsc(s.notes||'')}</textarea></div>
      <div class="comp-live" id="sessLive"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="sessAiPrompt" type="button" title="Genera un prompt para crear una sesión con IA y copiarlo">✨ Crear con IA</button><button class="btn-sec" id="sessCancel">Cancelar</button><button class="btn-prim" id="sessSave">${editId?'Guardar':'Crear sesión'}</button></div>`;
  openForm(html);
  const form = document.getElementById('sessForm');
  const sessAi = document.getElementById('sessAiPrompt');
  if(sessAi) sessAi.addEventListener('click', ()=>{ const idea=(form.querySelector('[name="name"]')?.value||'').trim(); spCopyText(buildSessionPrompt(idea)); });
  const wireRow = row=>{
    row.querySelectorAll('select,input').forEach(el=> el.addEventListener('input', sessLive));
    row.querySelector('.si-rm').addEventListener('click', ()=>{ if(form.querySelectorAll('.sess-it').length>1){ row.remove(); sessLive(); } });
  };
  function readItems(){
    const out=[];
    form.querySelectorAll('.sess-it').forEach(row=>{
      const e = row.querySelector('.si-ex').value; if(!e || !EXERCISES[e]) return;
      const sets = +row.querySelector('.si-sets').value || EXERCISES[e].sets || 1;
      const rr = row.querySelector('.si-rr').value;
      const rest = row.querySelector('.si-rest').value;
      const it = {e, sets};
      if(EXERCISES[e].mode==='time'){ it.dur = rr!==''?+rr:EXERCISES[e].dur; }
      else { it.reps = rr!==''?+rr:EXERCISES[e].reps; }
      if(rest!=='') it.rest = +rest;
      out.push(it);
    });
    return out;
  }
  function sessLive(){
    const items = readItems();
    const sess = {items, type:form.querySelector('[name=type]').value};
    const tA = sessionTotals(sess,'A'), tB = sessionTotals(sess,'B');
    document.getElementById('sessLive').innerHTML = `<div class="cl-hd">Cálculo automático</div>
      <div class="cl-ab"><div class="cl-ab-i"><strong>${items.length}</strong> ejercicios · <strong>${tA.min}</strong> min</div>
      <div class="cl-ab-i"><strong>♂A</strong> ${tA.kcal} kcal · <strong>♀B</strong> ${tB.kcal} kcal</div></div>
      <div class="msc-row" style="margin-top:7px">${muscleChips(sessionMuscles(sess),{dot:true})}</div>`;
  }
  form.querySelectorAll('.sess-it').forEach(wireRow);
  document.getElementById('sessAddItem').addEventListener('click', ()=>{ const c=document.getElementById('sessItems'); c.insertAdjacentHTML('beforeend', sessItemRowHtml(null)); wireRow(c.lastElementChild); sessLive(); });
  document.getElementById('sessCancel').addEventListener('click', closeForm);
  document.getElementById('sessSave').addEventListener('click', ()=>{
    const v=n=>(form.querySelector(`[name="${n}"]`).value||'').trim();
    const name=v('name'); if(!name){ alert('Pon un nombre'); return; }
    const items=readItems(); if(!items.length){ alert('Añade al menos un ejercicio'); return; }
    const obj={name, focus:v('focus'), type:v('type')||'fuerza', level:v('level'), warmup:v('warmup'), notes:v('notes'), items, user:true};
    const id = editId || nextSpId(name, SESSIONS);
    SESSIONS[id]=obj; persistSessions();
    closeForm(); renderSessions();
  });
  sessLive();
}

/* ── Constructor de sesiones por criterios ───────────────────
   El usuario elige músculos/objetivo, duración e intensidad y se
   genera una sesión coherente y secuenciada de forma profesional
   (básicos compuestos primero, accesorios y core al final).

   La selección es DETERMINISTA y con puntuación (antes era un
   `sort(()=>Math.random()-0.5)`, que mezclaba básicos y accesorios
   sin criterio). Además respeta el perfil del usuario: nivel,
   material disponible y lesiones. Ver DEPORTE.md §3.4.
══════════════════════════════════════════════════════════ */
const SP_INTENSITY = {
  suave: {lbl:'Suave',  dSet:-1, repF:1.20, restF:0.85, minRest:30, ex:'Más reps, descansos cortos · técnica y volumen'},
  media: {lbl:'Media',  dSet:0,  repF:1.00, restF:1.00, minRest:40, ex:'Equilibrio carga-volumen · RPE 7-8'},
  alta:  {lbl:'Alta',   dSet:1,  repF:0.70, restF:1.25, minRest:45, ex:'Menos reps, más series y descanso · fuerza'}
};
const SP_PAT_ORDER = {movilidad:0, sentadilla:1, bisagra:1, pliometria:1, empuje_h:2, empuje_v:2, traccion_h:2, traccion_v:2, unilateral:3, acarreo:3, ergometro:4, carrera:4, condicionamiento:4, accesorio:5, core:6};
/* Patrones compuestos multiarticulares: son los que deben abrir la sesión */
const SP_COMPOUND = ['sentadilla','bisagra','empuje_h','empuje_v','traccion_h','traccion_v','unilateral'];
/* Pares que deben equilibrarse dentro de una sesión (salud articular) */
const SP_BALANCE = {empuje_h:'traccion_h', traccion_h:'empuje_h', empuje_v:'traccion_v', traccion_v:'empuje_v'};
/* Minutos de calentamiento que se descuentan del tiempo disponible */
const SP_WARMUP_MIN = 8;
let _genCriteria = null;

/* ¿el usuario tiene el material que pide este ejercicio?
   Usa los ítems normalizados de sport-gear.js (gearItemsOf), que
   exigen tener TODO lo necesario. La versión anterior comparaba
   subcadenas del texto libre de `equip` y bastaba con que coincidiera
   UNA palabra: "Barra + banco" pasaba el filtro con solo tener barra. */
function spGearOk(ex, gear, id){
  if(!gear || !gear.length) return true;
  if(typeof gearCanDo === 'function' && id) return gearCanDo(id, gear);
  // respaldo por texto si aún no está cargado sport-gear.js
  const eq = (ex.equip||'').toLowerCase();
  if(!eq || /peso corporal|sin material|ninguno|suelo/.test(eq)) return true;
  return gear.some(g=> (SP_GEAR[g]||{match:[]}).match.some(w=> w && eq.includes(w)));
}
/* ¿este ejercicio carga una zona lesionada? */
function spInjuryOk(ex, injuries){
  if(!injuries || !injuries.length) return true;
  return !injuries.some(k=>{
    const inj = SP_INJURIES[k]; if(!inj) return false;
    if((inj.avoidPat||[]).includes(ex.pat)) return true;
    // solo bloquea si la zona lesionada es el músculo PRINCIPAL del ejercicio
    return (inj.avoid||[]).includes((ex.muscles||[])[0]);
  });
}
/* Filtro combinado de perfil */
function spExAllowed(ex, prof, id){
  return spGearOk(ex, prof.gear, id) && spInjuryOk(ex, prof.injuries);
}

function genIntensityItem(id, intensity, prof){
  const ex = EXERCISES[id]; const r = SP_INTENSITY[intensity] || SP_INTENSITY.media;
  const lvl = SP_LEVELS[(prof||spProfile()).level] || SP_LEVELS.intermedio;
  const it = {e:id};
  // el nivel acota las series: un principiante no hace 5 series de nada
  const raw  = (ex.sets||3) + r.dSet;
  const sets = Math.max(lvl.sets[0], Math.min(lvl.sets[1], raw));
  if(ex.mode==='time'){
    it.sets = sets; it.dur = ex.dur||30; it.rest = Math.max(r.minRest, Math.round((ex.rest||30)*r.restF));
  } else {
    it.sets = sets; it.reps = Math.max(4, Math.round((ex.reps||10)*r.repF)); it.rest = Math.max(r.minRest, Math.round((ex.rest||60)*r.restF));
  }
  return it;
}

/* Puntuación determinista de un candidato.
   Manda la cobertura de los músculos pedidos; después el patrón
   (compuestos antes que accesorios) y, a igualdad, el que lleve más
   tiempo sin salir en una sesión, para que haya variedad sin azar. */
function spScoreCand(c, want, prof){
  const ex = c.ex;
  let s = c.matched.length * 10;
  if(SP_COMPOUND.includes(ex.pat)) s += 6;
  if(ex.pat === 'core' || ex.pat === 'accesorio') s -= 2;
  // principiante: prioriza guiado y estable; avanzado: prioriza peso libre
  const eq = (ex.equip||'').toLowerCase();
  const guided = /maquina|máquina|polea|cable|prensa|contractora|multipower/.test(eq);
  if(prof.level === 'novato')    s += guided ? 5 : 0;
  if(prof.level === 'avanzado')  s += guided ? 0 : 3;
  // desempate estable y variado: hace cuánto se registró por última vez
  try{
    const last = logLastFor(c.id, 'A');
    if(!last) s += 2;                                   // nunca hecho → aporta novedad
    else {
      const days = Math.round((Date.now() - spFromKey(last.entry.date).getTime())/86400000);
      s += Math.min(3, days/7);                         // +1 por semana sin hacerlo, tope 3
    }
  }catch(e){}
  // desempate final determinista (sin Math.random): hash del id
  let h = 0; for(let i=0;i<c.id.length;i++) h = (h*31 + c.id.charCodeAt(i)) % 97;
  return s + h/1000;
}

function buildSessionByCriteria(muscles, durMin, intensity, disc, opts){
  opts = opts || {};
  const want = (muscles||[]).slice();
  if(!want.length) return null;
  const prof = opts.profile || spProfile();
  const lvl  = SP_LEVELS[prof.level] || SP_LEVELS.intermedio;
  // el calentamiento ocupa tiempo real: se descuenta del objetivo
  const targetSec = Math.max(600, (durMin - SP_WARMUP_MIN) * 60);

  /* Degradación controlada: si el filtro de material deja el catálogo sin
     candidatos (p. ej. "antebrazo" con solo 1 ejercicio, y que necesita
     material que no tienes), se reintenta ignorando el material antes de
     rendirse. Las LESIONES nunca se ignoran: son seguridad, no comodidad. */
  const pick = (relaxGear)=> Object.keys(EXERCISES).map(id=>{
    const ex = EXERCISES[id];
    if(disc && disc!=='all' && exDisc(ex)!==disc) return null;
    if(!spInjuryOk(ex, prof.injuries)) return null;
    if(!relaxGear && !spGearOk(ex, prof.gear, id)) return null;
    const matched = (ex.muscles||[]).filter(m=>want.includes(m));
    return matched.length ? {id, ex, matched} : null;
  }).filter(Boolean);

  let cands = pick(false), relaxed = false;
  if(!cands.length){ cands = pick(true); relaxed = cands.length > 0; }
  if(!cands.length) return null;

  cands.forEach(c=> c.score = spScoreCand(c, want, prof));
  cands.sort((a,b)=> b.score - a.score);

  const covered=new Set(), usedIds=new Set(), chosen=[];
  const take = c=>{ chosen.push(c); usedIds.add(c.id); c.matched.forEach(x=>covered.add(x)); };

  // 1) cubrir cada músculo objetivo (el mejor candidato de cada uno)
  for(const m of want){
    if(covered.has(m)) continue;
    const pick = cands.find(c=>!usedIds.has(c.id) && c.matched.includes(m));
    if(pick) take(pick);
  }

  const estSec = ()=> chosen.reduce((a,c)=> a+itemTotalSec(genIntensityItem(c.id,intensity,prof)), 0);
  const patCount = ()=> chosen.reduce((a,c)=>{ a[c.ex.pat]=(a[c.ex.pat]||0)+1; return a; }, {});

  // 2) rellenar hasta la duración objetivo (tope de ejercicios según nivel).
  //    Si el patrón que toca ya está desequilibrado, prefiere su opuesto:
  //    así el relleno no rompe el equilibrio que ajustamos en el paso 3.
  while(estSec() < targetSec*0.9 && chosen.length < lvl.maxEx){
    const pc = patCount();
    const debt = Object.keys(SP_BALANCE).filter(p=> (pc[p]||0) > (pc[SP_BALANCE[p]]||0))
                       .map(p=> SP_BALANCE[p]);
    const next = (debt.length && cands.find(c=> !usedIds.has(c.id) && debt.includes(c.ex.pat)))
              || cands.find(c=> !usedIds.has(c.id));
    if(!next) break;
    take(next);
  }

  // 3) equilibrio empuje/tracción. Un plan que empuja más de lo que tira
  //    acaba en hombro dolorido: por cada empuje de más, mete su tracción.
  //    Va DESPUÉS del relleno; si fuera antes, el relleno lo desharía.
  Object.keys(SP_BALANCE).forEach(p=>{
    for(let guard=0; guard<4; guard++){
      const pc = patCount();
      if((pc[p]||0) <= (pc[SP_BALANCE[p]]||0)) break;
      const comp = cands.find(c=> !usedIds.has(c.id) && c.ex.pat === SP_BALANCE[p]);
      if(!comp) break;
      // si ya no cabe, cambia un accesorio por el compensador en vez de alargar
      if(chosen.length >= lvl.maxEx){
        let idx = -1;
        for(let i=chosen.length-1; i>=0; i--){
          if(!SP_COMPOUND.includes(chosen[i].ex.pat)){ idx = i; break; }
        }
        if(idx < 0) break;
        usedIds.delete(chosen[idx].id);
        chosen.splice(idx, 1);
      }
      take(comp);
    }
  });

  // 4) recortar si se pasa: quita primero accesorios, nunca los básicos
  while(estSec() > targetSec*1.15 && chosen.length > Math.max(1, Math.min(want.length, 3))){
    let idx = -1;
    for(let i=chosen.length-1; i>=0; i--){
      if(!SP_COMPOUND.includes(chosen[i].ex.pat)){ idx = i; break; }
    }
    chosen.splice(idx >= 0 ? idx : chosen.length-1, 1);
  }
  // secuenciación profesional: movilidad → compuestos → unilateral → cardio → accesorio → core
  chosen.sort((a,b)=> (SP_PAT_ORDER[a.ex.pat]??5)-(SP_PAT_ORDER[b.ex.pat]??5) || b.score-a.score);

  const items = chosen.map(c=>genIntensityItem(c.id,intensity,prof));
  const typeCount={}; chosen.forEach(c=> typeCount[c.ex.type]=(typeCount[c.ex.type]||0)+1);
  const type = Object.keys(typeCount).sort((a,b)=>typeCount[b]-typeCount[a])[0] || 'fuerza';
  const lblMus = want.map(m=>(EX_MUSCLES[m]||{}).lbl||m);
  const intLbl = (SP_INTENSITY[intensity]||SP_INTENSITY.media).lbl;
  const discLbl = (disc && disc!=='all' && EX_SPORTS[disc]) ? EX_SPORTS[disc].lbl : '';
  const rpe = lvl.rpe;
  return {
    name:`${discLbl?discLbl+' · ':''}${lblMus.slice(0,3).join(' · ')}`,
    type, level:`Generada · ${intLbl.toLowerCase()} · ${lvl.lbl.toLowerCase()}`,
    focus:lblMus.join(', '),
    disc: (disc && disc!=='all') ? disc : undefined,
    warmup:`${SP_WARMUP_MIN} min: movilidad articular general y 1-2 series de aproximación con poco peso en el primer ejercicio.`,
    relaxed: relaxed || undefined,
    notes:`Generada para ~${durMin} min (${SP_WARMUP_MIN} de calentamiento incluidos) · intensidad ${intLbl.toLowerCase()} · nivel ${lvl.lbl.toLowerCase()}.${discLbl?' Deporte: '+discLbl+'.':''} Trabaja a RPE ${rpe[0]}-${rpe[1]}: termina cada serie con ${10-rpe[1]}-${10-rpe[0]} repeticiones en reserva.${relaxed?' ⚠️ No había ejercicios para estos músculos con tu material: se han incluido algunos que requieren equipo que no marcaste.':''}`,
    items, user:true, generated:true
  };
}

function openSessionGenerator(){
  const sel = (_genCriteria && _genCriteria.muscles) || ['hombro','gluteo','core'];
  const dur = (_genCriteria && _genCriteria.dur) || 40;
  const inten = (_genCriteria && _genCriteria.intensity) || 'media';
  const disc = (_genCriteria && _genCriteria.disc) || 'gimnasio';
  const html = `
    <div class="form-hd"><h2>🎲 Generar sesión a medida</h2><span class="form-sub">Elige deporte, qué trabajar, cuánto tiempo y a qué intensidad</span></div>
    <div class="form-body" id="genForm">
      <div class="fgrp"><label class="flbl">Deporte / contexto</label>
        <select class="fsel" id="genDisc">
          <option value="all" ${disc==='all'?'selected':''}>🏅 Cualquiera</option>
          ${Object.entries(EX_SPORTS).map(([k,v])=>`<option value="${k}" ${disc===k?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}
        </select>
      </div>
      <div class="fgrp"><label class="flbl">Músculos / zonas a trabajar</label>
        <div class="fchips" id="genMuscles">${Object.entries(EX_MUSCLES).map(([k,v])=>`<button type="button" class="fchip ${sel.includes(k)?'on':''}" data-m="${k}">${v.lbl}</button>`).join('')}</div>
      </div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Duración objetivo (min)</label><input class="finp mono" type="number" id="genDur" min="10" max="120" step="5" value="${dur}"></div>
        <div class="fgrp"><label class="flbl">Intensidad</label>
          <div class="seg-row" id="genInten">${Object.entries(SP_INTENSITY).map(([k,v])=>`<button type="button" class="seg-b ${inten===k?'on':''}" data-int="${k}">${v.lbl}</button>`).join('')}</div>
        </div>
      </div>
      <div class="cad-help" id="genIntHelp">${SP_INTENSITY[inten].ex}</div>
      <div id="genPreview"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="genCancel">Cancelar</button><button class="btn-prim" id="genRun">🎲 Generar</button></div>`;
  openForm(html);
  formBody().querySelectorAll('#genMuscles .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));
  formBody().querySelectorAll('#genInten .seg-b').forEach(b=> b.addEventListener('click', ()=>{
    formBody().querySelectorAll('#genInten .seg-b').forEach(x=>x.classList.toggle('on', x===b));
    document.getElementById('genIntHelp').textContent = SP_INTENSITY[b.dataset.int].ex;
  }));
  document.getElementById('genCancel').addEventListener('click', closeForm);
  document.getElementById('genRun').addEventListener('click', ()=>{
    const muscles = [...formBody().querySelectorAll('#genMuscles .fchip.on')].map(b=>b.dataset.m);
    if(!muscles.length){ alert('Elige al menos un músculo o zona.'); return; }
    const durMin = Math.min(120, Math.max(10, +document.getElementById('genDur').value||40));
    const intensity = formBody().querySelector('#genInten .seg-b.on')?.dataset.int || 'media';
    const disc = document.getElementById('genDisc').value || 'all';
    _genCriteria = {muscles, dur:durMin, intensity, disc};
    const sess = buildSessionByCriteria(muscles, durMin, intensity, disc);
    if(!sess){ alert(`No hay ejercicios de "${disc==='all'?'cualquier deporte':(EX_SPORTS[disc]||{}).lbl}" para esos músculos. Prueba con otro deporte o más músculos.`); return; }
    showGeneratedSession(sess);
  });
}

function showGeneratedSession(sess){
  const t = EX_TYPES[sess.type] || {ico:'•',lbl:sess.type};
  const tA = sessionTotals(sess,'A'), tB = sessionTotals(sess,'B');
  const rows = sess.items.map(it=>{
    const ex = EXERCISES[it.e]; if(!ex) return '';
    return `<div class="sd-ex"><div class="sd-ex-top"><span class="sd-ex-n">${spEsc(ex.name)}</span><span class="sd-ex-sch">${itemScheme(it)}</span></div>
      <div class="msc-row sm">${muscleChips(ex.muscles,{dot:true})}</div>${ex.cues?`<div class="sd-ex-cue">${spEsc(ex.cues)}</div>`:''}</div>`;
  }).join('');
  const html = `
    <div class="form-hd"><h2>${t.ico} ${spEsc(sess.name)}</h2><span class="form-sub">${t.lbl} · ${spEsc(sess.level)}</span></div>
    <div class="form-body">
      <div class="sp-detail-grid">
        <div class="sdg-cell"><b>${tA.min}</b><i>min</i></div>
        <div class="sdg-cell"><b>${sess.items.length}</b><i>ejercicios</i></div>
        <div class="sdg-cell"><b>${tA.kcal}</b><i>kcal ♂A</i></div>
        <div class="sdg-cell"><b>${tB.kcal}</b><i>kcal ♀B</i></div>
      </div>
      <div class="msc-row big">${muscleChips(sessionMuscles(sess),{dot:true})}</div>
      <div class="sp-cues"><span class="scl">Calentamiento</span>${spEsc(sess.warmup)}</div>
      <div class="sd-list">${rows}</div>
      <div class="sp-cues"><span class="scl">Notas</span>${spEsc(sess.notes)}</div>
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="genBack">← Criterios</button>
      <button class="btn-sec" id="genAgain">🎲 Otra variante</button>
      <button class="btn-prim" id="genSave">💾 Guardar sesión</button>
    </div>`;
  openForm(html);
  document.getElementById('genBack').addEventListener('click', openSessionGenerator);
  document.getElementById('genAgain').addEventListener('click', ()=>{
    const s2 = buildSessionByCriteria(_genCriteria.muscles, _genCriteria.dur, _genCriteria.intensity, _genCriteria.disc);
    if(s2) showGeneratedSession(s2);
  });
  document.getElementById('genSave').addEventListener('click', ()=>{
    const id = nextSpId(sess.name, SESSIONS);
    SESSIONS[id] = sess; persistSessions();
    closeForm(); renderSessions();
  });
}

/* ── Import JSON (ejercicios o sesiones) ─────────────────── */
function openSportImport(kind){
  const isEx = kind==='ex';
  const sample = isEx
    ? `{\n  "sentadilla_frontal": {\n    "name":"Sentadilla frontal","type":"fuerza",\n    "muscles":["cuadriceps","core"],"met":6,\n    "equip":"Barra","mode":"reps","sets":4,"reps":8,"rest":120,\n    "cues":"Codos altos, tronco vertical."\n  }\n}`
    : `{\n  "push_b": {\n    "name":"Empuje B","type":"fuerza","level":"Avanzado",\n    "focus":"Pecho y hombro","warmup":"5 min banda",\n    "items":[\n      {"e":"press_banca_barra","sets":5,"reps":5,"rest":150},\n      {"e":"press_militar","sets":4,"reps":8,"rest":90}\n    ],\n    "notes":"Progresa carga semanal."\n  }\n}`;
  const html = `
    <div class="form-hd"><h2>Importar ${isEx?'ejercicios':'sesiones'} (JSON)</h2><span class="form-sub">Añade o actualiza por lote</span></div>
    <div class="form-body">
      <div class="json-help">Acepta <code>array</code>, <code>{id: objeto}</code> o un solo objeto. ${isEx?'IDs de músculo válidos: '+Object.keys(EX_MUSCLES).slice(0,8).map(m=>`<code>${m}</code>`).join(' ')+'…':'Cada item usa <code>e</code> = id de ejercicio existente.'}<pre style="font-family:'DM Mono',monospace;font-size:.66rem;white-space:pre-wrap;margin-top:6px;line-height:1.45">${spEsc(sample)}</pre></div>
      <textarea class="json-area" id="spImpArea" spellcheck="false" placeholder="Pega aquí el JSON"></textarea>
      <div id="spImpStatus"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="spImpCancel">Cancelar</button><button class="btn-prim" id="spImpLoad">Importar</button></div>`;
  openForm(html);
  document.getElementById('spImpCancel').addEventListener('click', closeForm);
  document.getElementById('spImpLoad').addEventListener('click', ()=>{
    const st = document.getElementById('spImpStatus'); st.className='json-status';
    let raw; try{ raw = JSON.parse(document.getElementById('spImpArea').value); }
    catch(e){ st.className='json-status err'; st.textContent='JSON inválido: '+e.message; return; }
    const res = importSport(kind, raw);
    if(res.error){ st.className='json-status err'; st.textContent='✘ '+res.error; return; }
    st.className='json-status ok'; st.textContent=`✓ ${res.count} ${isEx?'ejercicio(s)':'sesión/es'} importada(s).`;
    if(isEx){ persistExercises(); } else { persistSessions(); }
    setTimeout(()=>{ closeForm(); isEx?renderExercises():renderSessions(); }, 700);
  });
}

function importSport(kind, raw){
  let entries = [];
  if(Array.isArray(raw)) entries = raw.map(r=>[null, r]);
  else if(raw && typeof raw==='object' && (raw.name)) entries = [[null, raw]];
  else if(raw && typeof raw==='object') entries = Object.entries(raw);
  else return {error:'formato no reconocido'};
  let count=0;
  for(const [id, r] of entries){
    const norm = kind==='ex' ? normalizeExercise(r) : normalizeSession(r);
    if(norm.error) return {error:`"${(r&&(r.name||id))||'?'}": ${norm.error}`};
    const store = kind==='ex' ? EXERCISES : SESSIONS;
    const useId = (id && !store[id]) ? id : nextSpId(norm.data.name, store);
    store[useId] = norm.data; count++;
  }
  return {count};
}
function normalizeExercise(r){
  if(!r||typeof r!=='object') return {error:'no es objeto'};
  if(!r.name) return {error:'falta name'};
  const muscles = Array.isArray(r.muscles)? r.muscles.filter(m=>EX_MUSCLES[m]) : [];
  return {data:{name:''+r.name, type:EX_TYPES[r.type]?r.type:'fuerza', pat:EX_PATTERNS[r.pat]?r.pat:'accesorio', muscles, met:+r.met||5, equip:(''+(r.equip||'')), mode:r.mode==='time'?'time':'reps', sets:+r.sets||3, reps:+r.reps||0, dur:+r.dur||0, rest:+r.rest||60, cues:(''+(r.cues||'')), user:true}};
}
function normalizeSession(r){
  if(!r||typeof r!=='object') return {error:'no es objeto'};
  if(!r.name) return {error:'falta name'};
  if(!Array.isArray(r.items)||!r.items.length) return {error:'falta items'};
  const items=[]; const unknown=[];
  r.items.forEach(it=>{ if(!it||!it.e) return; if(!EXERCISES[it.e]){ unknown.push(it.e); return; } const o={e:it.e, sets:+it.sets||EXERCISES[it.e].sets||1}; if(it.dur!=null) o.dur=+it.dur; if(it.reps!=null) o.reps=+it.reps; if(it.rest!=null) o.rest=+it.rest; items.push(o); });
  if(!items.length) return {error: unknown.length?`ejercicios desconocidos: ${unknown.join(', ')}`:'items vacíos'};
  return {data:{name:''+r.name, focus:(''+(r.focus||'')), type:EX_TYPES[r.type]?r.type:'fuerza', level:(''+(r.level||'')), warmup:(''+(r.warmup||'')), notes:(''+(r.notes||'')), items, user:true}};
}

/* ── BIND (una vez) ──────────────────────────────────────── */
(function bindSport(){
  document.querySelectorAll('.sec-btn').forEach(b=> b.addEventListener('click', ()=> setSection(b.dataset.sec)));
  document.querySelectorAll('#sportVtabs .svtab').forEach(b=> b.addEventListener('click', ()=> showSportView(b.dataset.sview)));
  // Botones de contexto del header (Deporte): ✚ nuevo (ejercicio o sesión según vista) · 🎲 generar
  const hAdd = document.getElementById('hdrSportAdd');
  if(hAdd) hAdd.addEventListener('click', ()=>{ if(sportView==='sess') openSessionEditor(); else openExerciseEditor(); });
  const hGen = document.getElementById('hdrSportGen');
  if(hGen) hGen.addEventListener('click', ()=> openSessionGenerator());
  // restaura sección guardada (tras cargar el resto de scripts de deporte).
  // OJO: #appTabbar está en el HTML DESPUÉS de los <script>, así que al ejecutarse
  // este IIFE aún no existe. Diferimos a DOMContentLoaded para que renderTabbar
  // encuentre el elemento y la tabbar aparezca ya en el primer pintado (antes solo
  // salía tras navegar a otra pestaña y volver).
  const _bootSection = ()=>{
    const _sec0 = lsGet('sport:section','nutri');
    if(_sec0==='sport' || _sec0==='week' || _sec0==='mente') setSection(_sec0);
    else { document.body.classList.add('sec-nutri'); if(typeof renderTabbar==='function') renderTabbar('nutri'); }   // Nutrición: asegura la tabbar al cargar
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _bootSection, {once:true});
  else _bootSection();
})();

window.setSection = setSection;
window.renderSportActive = renderSportActive;
