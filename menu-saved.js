/* ══════════════════════════════════════════════════════════
   MENU SAVED · gestión de menús guardados + import/export JSON
   depende de globals de menu-app.js + menu-calendar.js
══════════════════════════════════════════════════════════ */

/* ── STATE ───────────────────────────────────────────── */
const SavedMenus = (function(){
  const stored = lsGet(LS.SAVED, {});
  return stored && typeof stored === 'object' ? stored : {};
})();

function persistSaved(){ lsSet(LS.SAVED, SavedMenus); }

function newMenuId(){
  let n = 1;
  while(SavedMenus['m'+n]) n++;
  return 'm'+n;
}

function nowStamp(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── RENDER ──────────────────────────────────────────── */
function renderSaved(){
  const grid = document.getElementById('savedGrid');
  const meta = document.getElementById('savedMeta');
  if(!grid) return;
  const ids = Object.keys(SavedMenus).sort((a,b)=>
    (SavedMenus[b].updatedAt||'').localeCompare(SavedMenus[a].updatedAt||'')
  );
  meta.textContent = `${ids.length} menú${ids.length===1?'':'s'}`;

  let html = `
    <div class="sm-new" id="smNew">
      <div>
        <div class="smn-ico">＋</div>
        <div class="smn-t">Nuevo menú vacío</div>
        <div class="smn-s">Empezar desde cero en calendario</div>
      </div>
    </div>`;

  ids.forEach(id=>{
    html += smCardHtml(id);
  });

  grid.innerHTML = html;

  // bind
  document.getElementById('smNew').addEventListener('click', ()=>{
    CalState.id = null;
    CalState.name = 'Semana sin guardar';
    CalState.data = emptyCal();
    CalState.modified = false;
    persistCal();
    switchView('cal');
  });

  grid.querySelectorAll('.sm-card').forEach(card=>{
    const id = card.dataset.id;
    card.querySelectorAll('[data-act]').forEach(b=>{
      b.addEventListener('click', e=>{
        e.stopPropagation();
        const act = b.dataset.act;
        if(act==='load')      loadMenu(id);
        if(act==='dup')       duplicateMenu(id);
        if(act==='ren')       renameMenu(id);
        if(act==='del')       deleteMenu(id);
        if(act==='pdf')       exportMenuPdf(SavedMenus[id].data, SavedMenus[id].name);
        if(act==='json')      exportMenuJson(id);
      });
    });
    card.addEventListener('click', ()=> loadMenu(id));
  });
}

function smCardHtml(id){
  const m = SavedMenus[id];
  const data = normalizeCalData(m.data);
  m.data = data; // migra en sitio para futuras lecturas
  const isActive = CalState.id === id;
  const counts = countMenu(data);
  const slots = ['des','com','mer','cen'];
  const days = WEEK_DAYS.map(d=>{
    const cells = slots.map(s=>{
      const arr = (data[d.k] && data[d.k][s]) || [];
      const cls = arr.length>1 ? 'f m' : (arr.length===1 ? 'f' : '');
      return `<div class="sm-pd-cell ${cls}"></div>`;
    }).join('');
    return `<div class="sm-pday"><div class="sm-pd-cells">${cells}</div><div class="sm-pd-lbl">${d.lbl[0]}</div></div>`;
  }).join('');
  return `
    <article class="sm-card ${isActive?'active':''}" data-id="${id}">
      ${isActive ? '<span class="sm-active-pill">Activo</span>' : ''}
      <h3>${escAttr(m.name)}</h3>
      <div class="sm-meta">${m.updatedAt || ''}</div>
      <div class="sm-pre">${days}</div>
      <div class="sm-stats">
        <span class="sm-stat"><strong>${counts.filled}</strong>/28 franjas${counts.dishes>counts.filled?` · ${counts.dishes} recetas`:''}</span>
        <span class="sm-stat">🫘 <strong>${counts.leg}</strong></span>
        <span class="sm-stat">🐟 <strong>${counts.pb+counts.pa}</strong></span>
        <span class="sm-stat">🍗 <strong>${counts.cb}</strong></span>
        ${counts.cr ? `<span class="sm-stat">🥩 <strong>${counts.cr}</strong></span>` : ''}
      </div>
      <div class="sm-acts">
        <button data-act="load" class="primary">Cargar</button>
        <button data-act="pdf">PDF</button>
        <button data-act="json">JSON</button>
        <button data-act="dup">Duplicar</button>
        <button data-act="ren">Renombrar</button>
        <button data-act="del" class="danger">Eliminar</button>
      </div>
    </article>`;
}

function countMenu(data){
  const r = {filled:0, dishes:0, leg:0, cb:0, cr:0, pb:0, pa:0, apq:0};
  if(!data) return r;
  Object.values(data).forEach(day=>{
    Object.values(day).forEach(arr=>{
      if(!Array.isArray(arr) || !arr.length) return;
      r.filled++;
      r.dishes += arr.length;
      const seen = new Set();
      arr.forEach(dishId=>{
        const d = DISHES[dishId]; if(!d) return;
        (d.food||[]).forEach(k=>{
          if(k in r && !seen.has(k)){ r[k]++; seen.add(k); }
        });
      });
    });
  });
  return r;
}

/* ══════════════════════════════════════════════════════════
   ACCIONES — load/save/dup/del/rename
══════════════════════════════════════════════════════════ */
function loadMenu(id){
  const m = SavedMenus[id];
  if(!m) return;
  CalState.id = id;
  CalState.name = m.name;
  CalState.data = normalizeCalData(JSON.parse(JSON.stringify(m.data)));
  CalState.modified = false;
  persistCal();
  switchView('cal');
}

function duplicateMenu(id){
  const m = SavedMenus[id];
  if(!m) return;
  const newId = newMenuId();
  SavedMenus[newId] = {
    id: newId,
    name: m.name + ' (copia)',
    data: JSON.parse(JSON.stringify(m.data)),
    createdAt: nowStamp(),
    updatedAt: nowStamp()
  };
  persistSaved();
  renderSaved();
}

function renameMenu(id){
  const m = SavedMenus[id];
  if(!m) return;
  openPrompt({
    title: 'Renombrar menú',
    sub: `“${m.name}” → nuevo nombre`,
    value: m.name,
    confirmLabel: 'Guardar',
    onConfirm: (val)=>{
      m.name = val || m.name;
      m.updatedAt = nowStamp();
      persistSaved();
      if(CalState.id === id){ CalState.name = m.name; persistCal(); }
      renderSaved();
    }
  });
}

async function deleteMenu(id){
  const m = SavedMenus[id];
  if(!m) return;
  if(!await pnConfirm(`¿Eliminar el menú “${m.name}”?`, {danger:true, okText:'Eliminar'})) return;
  const snap = JSON.parse(JSON.stringify(m));
  delete SavedMenus[id];
  persistSaved();
  if(CalState.id === id){
    CalState.id = null;
    CalState.name = 'Semana sin guardar';
    CalState.modified = false;
    persistCal();
  }
  renderSaved();
  if(typeof showUndo==='function') showUndo('Menú guardado eliminado', ()=>{ SavedMenus[id]=snap; persistSaved(); renderSaved(); });
}

/* Save current calendar — invoked from calendar toolbar */
function savePromptModal(){
  const isUpdate = !!CalState.id && !!SavedMenus[CalState.id];
  openPrompt({
    title: isUpdate ? 'Guardar cambios' : 'Guardar menú',
    sub: isUpdate ? 'Actualizar o guardar como copia nueva' : 'Dale un nombre a este menú',
    value: CalState.name === 'Semana sin guardar' ? '' : CalState.name,
    confirmLabel: isUpdate ? 'Actualizar' : 'Guardar',
    secondary: isUpdate ? {label:'Guardar como nuevo', onClick:(val)=>saveAsNew(val)} : null,
    onConfirm: (val)=>{
      const name = val.trim();
      if(!name){ alert('Pon un nombre al menú'); return false; }
      if(isUpdate){
        SavedMenus[CalState.id].name = name;
        SavedMenus[CalState.id].data = JSON.parse(JSON.stringify(CalState.data));
        SavedMenus[CalState.id].updatedAt = nowStamp();
        CalState.name = name;
        CalState.modified = false;
      } else {
        saveAsNew(name);
      }
      persistSaved(); persistCal();
      updateCalSub();
      return true;
    }
  });
}

function saveAsNew(name){
  const id = newMenuId();
  SavedMenus[id] = {
    id,
    name: name || ('Menú '+id),
    data: JSON.parse(JSON.stringify(CalState.data)),
    createdAt: nowStamp(),
    updatedAt: nowStamp()
  };
  CalState.id = id;
  CalState.name = SavedMenus[id].name;
  CalState.modified = false;
  persistSaved(); persistCal();
  updateCalSub();
  return true;
}

/* ══════════════════════════════════════════════════════════
   PROMPT MODAL — pequeño diálogo de texto
══════════════════════════════════════════════════════════ */
function openPrompt(opts){
  const body = document.getElementById('promptBody');
  body.innerHTML = `
    <div class="form-hd">
      <h2>${escAttr(opts.title||'')}</h2>
      <span class="form-sub">${escAttr(opts.sub||'')}</span>
    </div>
    <div class="prompt-body">
      <label class="flbl">Nombre</label>
      <input id="promptInput" type="text" value="${escAttr(opts.value||'')}" placeholder="Ej. Semana 1">
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="promptCancel">Cancelar</button>
      ${opts.secondary ? `<button class="btn-sec" id="promptSecondary">${escAttr(opts.secondary.label)}</button>` : ''}
      <button class="btn-prim" id="promptOk">${escAttr(opts.confirmLabel||'Aceptar')}</button>
    </div>`;
  document.getElementById('promptBg').classList.add('show');
  document.body.classList.add('no-scroll');
  const inp = document.getElementById('promptInput');
  setTimeout(()=>{ inp.focus(); inp.select(); }, 50);

  const close = ()=>{
    document.getElementById('promptBg').classList.remove('show');
    document.body.classList.remove('no-scroll');
  };
  document.getElementById('promptCancel').addEventListener('click', close);
  if(opts.secondary){
    document.getElementById('promptSecondary').addEventListener('click', ()=>{
      const r = opts.secondary.onClick(inp.value);
      if(r !== false) close();
      renderSaved();
    });
  }
  const submit = ()=>{
    const r = opts.onConfirm(inp.value);
    if(r !== false) close();
    renderSaved();
  };
  document.getElementById('promptOk').addEventListener('click', submit);
  inp.addEventListener('keydown', e=>{
    if(e.key === 'Enter'){ e.preventDefault(); submit(); }
    if(e.key === 'Escape'){ close(); }
  });
}

document.getElementById('promptClose').addEventListener('click', ()=>{
  document.getElementById('promptBg').classList.remove('show');
  document.body.classList.remove('no-scroll');
});
document.getElementById('promptBg').addEventListener('click', e=>{
  if(e.target.id === 'promptBg'){
    document.getElementById('promptBg').classList.remove('show');
    document.body.classList.remove('no-scroll');
  }
});

/* Renombrar el menú activo (título del calendario) */
function renameActiveMenu(){
  openPrompt({
    title: 'Nombre del menú',
    sub: CalState.id ? 'Renombra este menú guardado' : 'Ponle un nombre a este menú (borrador)',
    value: CalState.name === 'Semana sin guardar' ? '' : CalState.name,
    confirmLabel: 'Guardar nombre',
    onConfirm: (val)=>{
      const name = (val||'').trim();
      if(!name) return false;
      CalState.name = name;
      if(CalState.id && SavedMenus[CalState.id]){
        SavedMenus[CalState.id].name = name;
        SavedMenus[CalState.id].updatedAt = nowStamp();
        persistSaved();
      } else {
        CalState.modified = true;
      }
      persistCal();
      if(typeof renderCalendar === 'function') renderCalendar();
    }
  });
}
(function bindRename(){
  const btn = document.getElementById('calRename');
  if(btn) btn.addEventListener('click', e=>{ e.stopPropagation(); renameActiveMenu(); });
})();

/* ══════════════════════════════════════════════════════════
   JSON IMPORT / EXPORT
══════════════════════════════════════════════════════════ */
const JSON_SAMPLE = [
  {
    "cat":"com",
    "nom":"Ensalada de quinoa con pollo (ejemplo)",
    "short":"Ensalada quinoa",
    "icon":"🥗",
    "t":"15 min",
    "eq":"Vitrocerámica",
    "tipo":"completa",
    "diet":["sg","cn"],
    "food":["cb","apq","v"],
    "desc":"Una ensalada fresca y saciante.",
    "kcal":[640,420],
    "mac":{"p":[58,38],"f":[18,12],"c":[58,38]},
    "ing":[
      {"n":"Quinoa cruda","A":"60g","B":"40g"},
      {"n":"Pollo plancha","A":"180g","B":"120g"},
      {"n":"Hortalizas mixtas","A":"200g","B":"150g"},
      {"n":"AOVE","A":"15g","B":"10g"}
    ],
    "nota":"Hervir la quinoa 15 min. Pollo plancha 4 min/lado. Mezclar en frío."
  }
];

function openJsonImport(){
  const body = document.getElementById('jsonBody');
  body.innerHTML = `
    <div class="form-hd">
      <h2>Importar recetas (JSON)</h2>
      <span class="form-sub">Sube un archivo, pega el código o arrastra el JSON al recuadro</span>
    </div>
    <div class="form-body">
      <div class="json-help">
        Acepta <code>array</code>, <code>diccionario {id: receta}</code> o una sola receta.
        <strong>Formato recomendado (composición):</strong> <code>cat</code>, <code>nom</code>, <code>comp</code> (lista de alimentos
        <code>{"f":"pollo","g":180}</code> · <code>{"f":"huevo","u":2}</code> · <code>{"f":"especias","cs":true}</code>),
        <code>diet</code>, <code>tipo</code>, <code>nota</code>. Las kcal y macros se calculan solas.
        También se admite el formato antiguo con <code>kcal</code>/<code>mac</code>/<code>ing</code>.
      </div>
      <div class="json-file-row">
        <button class="btn-sec" id="jsonPickFile" type="button">📁 Cargar archivo .json…</button>
        <button class="btn-sec" id="jsonSample" type="button">📋 Insertar ejemplo</button>
        <input type="file" id="jsonFile" accept="application/json,.json" hidden>
        <span id="jsonFileName" class="json-file-name"></span>
      </div>
      <textarea class="json-area" id="jsonInput" spellcheck="false" placeholder="…o pega/arrastra aquí el contenido JSON"></textarea>
      <div id="jsonStatus"></div>
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="jsonValidate">Validar</button>
      <button class="btn-prim" id="jsonImport">Importar</button>
    </div>`;
  document.getElementById('jsonBg').classList.add('show');
  document.body.classList.add('no-scroll');

  const inp = document.getElementById('jsonInput');
  const fileInput = document.getElementById('jsonFile');
  const fileName = document.getElementById('jsonFileName');

  document.getElementById('jsonSample').addEventListener('click', ()=>{
    inp.value = JSON.stringify(JSON_SAMPLE, null, 2);
    fileName.textContent = '';
  });

  // Archivo: click → abrir selector
  document.getElementById('jsonPickFile').addEventListener('click', ()=> fileInput.click());

  // Lee un fichero y lo pone en el textarea
  const readJsonFile = (file)=>{
    if(!file) return;
    if(file.size > 5 * 1024 * 1024){
      alert('El archivo es muy grande (máx 5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev=>{
      inp.value = ev.target.result;
      fileName.textContent = `📄 ${file.name} · ${Math.round(file.size/10.24)/100} KB`;
      // Auto-validar al cargar archivo
      jsonRun(inp.value, false);
    };
    reader.onerror = ()=> alert('No se ha podido leer el archivo.');
    reader.readAsText(file);
  };

  fileInput.addEventListener('change', e=>{
    if(e.target.files[0]) readJsonFile(e.target.files[0]);
  });

  // Drag-and-drop sobre el textarea
  ['dragenter','dragover'].forEach(ev=>{
    inp.addEventListener(ev, e=>{
      e.preventDefault(); e.stopPropagation();
      inp.classList.add('drag-over');
    });
  });
  ['dragleave','drop'].forEach(ev=>{
    inp.addEventListener(ev, e=>{
      e.preventDefault(); e.stopPropagation();
      inp.classList.remove('drag-over');
    });
  });
  inp.addEventListener('drop', e=>{
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if(file && (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json'))){
      readJsonFile(file);
    } else if(file){
      // intenta leerlo como texto igualmente
      readJsonFile(file);
    }
  });

  document.getElementById('jsonValidate').addEventListener('click', ()=> jsonRun(inp.value, false));
  document.getElementById('jsonImport').addEventListener('click', ()=> jsonRun(inp.value, true));
}

function closeJsonModal(){
  document.getElementById('jsonBg').classList.remove('show');
  document.body.classList.remove('no-scroll');
}
document.getElementById('jsonClose').addEventListener('click', closeJsonModal);
document.getElementById('jsonBg').addEventListener('click', e=>{
  if(e.target.id === 'jsonBg') closeJsonModal();
});

async function jsonRun(text, doImport){
  const statusEl = document.getElementById('jsonStatus');
  statusEl.className = 'json-status';
  statusEl.innerHTML = '';
  if(!text.trim()){
    statusEl.classList.add('err');
    statusEl.textContent = 'Pega algo de JSON antes';
    return;
  }
  let parsed;
  try{
    parsed = JSON.parse(text);
  }catch(e){
    statusEl.classList.add('err');
    statusEl.innerHTML = '✘ JSON inválido<pre>'+escAttr(e.message)+'</pre>';
    return;
  }

  // normalize to dict {id: recipe}
  let recipes = [];
  if(Array.isArray(parsed)){
    recipes = parsed.map(r => [null, r]);
  } else if(parsed && typeof parsed === 'object'){
    // could be {id: recipe, ...} OR a single recipe (heuristic: has 'nom' or 'cat')
    if(parsed.nom || parsed.cat){
      recipes = [[null, parsed]];
    } else {
      recipes = Object.entries(parsed);
    }
  }
  if(!recipes.length){
    statusEl.classList.add('err');
    statusEl.textContent = 'Estructura no reconocida';
    return;
  }

  const normalized = [];
  const errors = [];
  recipes.forEach(([id, raw], idx)=>{
    const r = normalizeRecipe(raw);
    if(r.error){
      errors.push(`#${idx+1}${id?' ('+id+')':''}: ${r.error}`);
    } else {
      normalized.push([id, r.data]);
    }
  });

  if(errors.length){
    statusEl.classList.add('err');
    statusEl.innerHTML = `✘ ${errors.length} error${errors.length>1?'es':''} <pre>${escAttr(errors.join('\n'))}</pre>`;
    if(!doImport) return;
    if(!await pnConfirm(`Hay ${errors.length} errores.\n¿Importar solo las ${normalized.length} válidas?`, {okText:'Importar válidas'})) return;
  }

  if(!doImport){
    statusEl.classList.add('ok');
    statusEl.innerHTML = `✓ ${normalized.length} receta${normalized.length>1?'s':''} válida${normalized.length>1?'s':''}. Pulsa "Importar" para añadirlas.`;
    return;
  }

  let added = 0;
  normalized.forEach(([id, data])=>{
    const useId = (id && id.startsWith('U') && !DISHES[id]) ? id : nextUserIdImport();
    DISHES[useId] = data;
    if(data.comp && data.comp.length && typeof recomputeDish === 'function') recomputeDish(DISHES[useId]);
    added++;
  });
  persistCustom();
  statusEl.classList.add('ok');
  statusEl.textContent = `✓ Importadas ${added} receta${added>1?'s':''}.`;
  renderAll();
  setTimeout(closeJsonModal, 900);
}

function nextUserIdImport(){
  let n = 1;
  while(DISHES['U'+n]) n++;
  return 'U'+n;
}

/* normaliza una receta cruda — devuelve {data} o {error} */
function normalizeRecipe(r){
  if(!r || typeof r !== 'object') return {error:'no es un objeto'};
  // Formato nuevo por composición de alimentos
  if(Array.isArray(r.comp) && r.comp.length && typeof normalizeBuilderRecipe === 'function'){
    return normalizeBuilderRecipe(r);
  }
  if(!r.nom && !r.name) return {error:'falta "nom"'};
  const VALID_CATS = ['des','com','mer','cen'];
  const cat = (r.cat||'').toLowerCase();
  if(!VALID_CATS.includes(cat)) return {error:`"cat" debe ser des/com/mer/cen (no "${r.cat}")`};

  const pair = (v, def) => {
    if(v == null) return [def, def];
    if(Array.isArray(v) && v.length === 2) return [Number(v[0])||0, Number(v[1])||0];
    if(typeof v === 'number') return [v, Math.round(v*0.65)];
    if(typeof v === 'object'){
      const a = Number(v.A ?? v.a ?? v[0]) || 0;
      const b = Number(v.B ?? v.b ?? v[1]) || Math.round(a*0.65);
      return [a, b];
    }
    return [def, def];
  };
  const kcal = pair(r.kcal, 0);

  const mac = r.mac || r.macros || {};
  const p = pair(mac.p ?? mac.protein ?? mac.prot ?? r.p, 0);
  const f = pair(mac.f ?? mac.fat ?? mac.grasa ?? r.f, 0);
  const c = pair(mac.c ?? mac.carb ?? mac.carbs ?? mac.carbohidratos ?? r.c, 0);

  let ing = [];
  if(Array.isArray(r.ing)) ing = r.ing.map(i=>({
    n: (i.n || i.name || i.nombre || '').toString(),
    A: (i.A ?? i.a ?? i.cantidadA ?? '').toString(),
    B: (i.B ?? i.b ?? i.cantidadB ?? i.A ?? i.a ?? '').toString()
  })).filter(x => x.n);
  if(!ing.length) ing = [{n:'—',A:'',B:''}];

  const validDiet = ['sg','sl','vg','vt','ps','cn','lg'];
  const diet = Array.isArray(r.diet) ? r.diet.filter(x => validDiet.includes(x)) : [];
  const validFood = Object.keys(FOOD_TYPES);
  const food = Array.isArray(r.food) ? r.food.filter(x => validFood.includes(x)) : [];

  const data = {
    cat,
    short: (r.short || r.nom || r.name || '').toString().slice(0,40),
    nom:   (r.nom || r.name || '').toString(),
    icon:  (r.icon || '🍴').toString().slice(0,4),
    t:     (r.t || r.time || '—').toString(),
    eq:    (r.eq || r.equipment || '—').toString(),
    tags:  Array.isArray(r.tags) ? r.tags : [],
    tipo:  ['ligera','completa'].includes(r.tipo) ? r.tipo : null,
    diet,
    food,
    desc:  (r.desc || r.description || '').toString(),
    kcal,
    mac:   {p, f, c},
    ing,
    nota:  (r.nota || r.notes || r.preparacion || '—').toString()
  };
  return {data};
}

function exportRecipesJson(){
  const out = {};
  Object.keys(DISHES).forEach(id=>{
    if(id.startsWith('U')){
      const {short, nom, icon, cat, t, eq, tipo, diet, food, desc, kcal, mac, ing, nota, comp} = DISHES[id];
      out[id] = comp && comp.length
        ? {short, nom, icon, cat, t, eq, tipo, diet, desc, comp, nota}
        : {short, nom, icon, cat, t, eq, tipo, diet, food, desc, kcal, mac, ing, nota};
    }
  });
  const cnt = Object.keys(out).length;
  if(!cnt){ alert('No hay recetas propias para exportar (las del plan base no se exportan).'); return; }
  const blob = new Blob([JSON.stringify(out, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recetas-plan-nutricional-${(new Date()).toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

/* ══════════════════════════════════════════════════════════
   EXPORT MENU JSON · descarga un menú semanal completo
══════════════════════════════════════════════════════════ */
function exportMenuJson(id){
  let payload;
  let fname;
  if(id && SavedMenus[id]){
    const m = SavedMenus[id];
    payload = {
      kind: 'plan-nutricional-menu',
      version: 1,
      name: m.name,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      data: m.data
    };
    fname = `menu-${m.name.replace(/[^a-z0-9-_ ]/gi,'').replace(/\s+/g,'_')||'sin-nombre'}.json`;
  } else {
    payload = {
      kind: 'plan-nutricional-menu',
      version: 1,
      name: CalState.name,
      data: CalState.data
    };
    fname = `menu-${(CalState.name||'actual').replace(/[^a-z0-9-_ ]/gi,'').replace(/\s+/g,'_')}.json`;
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function importMenuJson(){
  // input file picker
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.addEventListener('change', e=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev=>{
      try{
        const parsed = JSON.parse(ev.target.result);
        const data = parsed.data || parsed; // tolerante: acepta data directa o wrapper
        const normalized = normalizeCalData(data);
        const filled = Object.values(normalized).reduce((a,d)=>a+Object.values(d).reduce((b,arr)=>b+arr.length,0), 0);
        if(!filled){ alert('El JSON no contiene recetas válidas (los IDs deben existir en el catálogo).'); return; }
        const name = parsed.name || file.name.replace(/\.json$/i,'') || 'Menú importado';
        const newId = newMenuId();
        SavedMenus[newId] = {
          id:newId,
          name,
          data: normalized,
          createdAt: nowStamp(),
          updatedAt: nowStamp()
        };
        persistSaved();
        renderSaved();
        alert(`✓ Importado: "${name}" (${filled} recetas)`);
      }catch(err){
        alert('JSON inválido: '+err.message);
      }
    };
    reader.readAsText(file);
  });
  inp.click();
}

/* ══════════════════════════════════════════════════════════
   EXPORT PDF · imprime el calendario semanal en hoja A4
══════════════════════════════════════════════════════════ */
function exportMenuPdf(sourceData, sourceName){
  // Usa el calendario activo si no se pasa otra cosa
  const data = sourceData ? normalizeCalData(sourceData) : CalState.data;
  const name = sourceName || CalState.name || 'Menú semanal';
  const persona = TARGETS[S.p];

  // Construye HTML imprimible aislado en un iframe nuevo
  const html = buildPrintHtml(data, name, persona);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // Dar tiempo a que renderice y abrir el diálogo de impresión
  iframe.contentWindow.onload = ()=>{
    setTimeout(()=>{
      try{
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }catch(e){
        alert('No se ha podido abrir el diálogo de impresión: '+e.message);
      }
      // Eliminar tras imprimir (el diálogo es bloqueante en la mayoría de navegadores)
      setTimeout(()=> iframe.remove(), 1000);
    }, 200);
  };
}

/* PDF COMPLETO: semana + recetas (del menú) + entrenamientos (del plan de deporte),
   combinando los dos documentos imprimibles en uno solo. */
function exportFullPdf(){
  try{
    const persona = TARGETS[S.p];
    const menuHtml = buildPrintHtml(CalState.data, CalState.name || 'Menú semanal', persona);
    const sportHtml = (typeof buildSportPrintHtml === 'function') ? buildSportPrintHtml() : '';
    const bodyOf = h => { const m = h.match(/<body[^>]*>([\s\S]*?)<\/body>/i); return m ? m[1] : ''; };
    const stylesOf = h => { const out = []; const re = /<style[^>]*>([\s\S]*?)<\/style>/gi; let m; while(m = re.exec(h)) out.push(m[1]); return out.join('\n'); };
    const combined = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Plan completo · semana, recetas y entrenamientos</title>
      <style>${stylesOf(menuHtml)}
${stylesOf(sportHtml)}
.full-sep{page-break-before:always}</style></head><body>
      ${bodyOf(menuHtml)}
      ${sportHtml ? `<div class="full-sep"></div>${bodyOf(sportHtml)}` : ''}
      </body></html>`;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(combined); doc.close();
    iframe.contentWindow.onload = ()=>{ setTimeout(()=>{ try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(e){ alert('No se pudo imprimir: '+e.message); } setTimeout(()=> iframe.remove(), 1000); }, 300); };
  }catch(e){ alert('No se pudo generar el PDF completo: ' + (e && e.message || e)); }
}
window.exportFullPdf = exportFullPdf;

function buildPrintHtml(data, name, persona){
  // Calcula contadores semanales
  const com = {};
  const all = {};
  Object.entries(data).forEach(([dayK, day])=>{
    Object.entries(day).forEach(([slot, arr])=>{
      const seen = new Set();
      arr.forEach(id=>{
        const d = DISHES[id]; if(!d) return;
        (d.food||[]).forEach(f=>{
          if(seen.has(slot+':'+f)) return;
          seen.add(slot+':'+f);
          if(slot === 'com') com[f] = (com[f]||0)+1;
          all[f] = (all[f]||0)+1;
        });
      });
    });
  });

  // Totales calóricos por persona
  const totsByPerson = {A:{k:0,p:0,f:0,c:0}, B:{k:0,p:0,f:0,c:0}};
  Object.values(data).forEach(day=>{
    Object.values(day).forEach(arr=>{
      arr.forEach(id=>{
        const d = DISHES[id]; if(!d) return;
        totsByPerson.A.k += d.kcal[0]; totsByPerson.A.p += d.mac.p[0]; totsByPerson.A.f += d.mac.f[0]; totsByPerson.A.c += d.mac.c[0];
        totsByPerson.B.k += d.kcal[1]; totsByPerson.B.p += d.mac.p[1]; totsByPerson.B.f += d.mac.f[1]; totsByPerson.B.c += d.mac.c[1];
      });
    });
  });
  const days = Object.keys(data).length || 7;

  const slotsMeta = {des:'☀ Desayuno', com:'🍽 Comida', mer:'🍎 Merienda', cen:'🌙 Cena'};

  // Tabla semanal — filas: comidas, columnas: días
  const cellsHtml = (slot)=>{
    return WEEK_DAYS.map(d=>{
      const arr = data[d.k][slot] || [];
      if(!arr.length) return `<td class="empty">—</td>`;
      const items = arr.map(id=>{
        const dish = DISHES[id]; if(!dish) return '';
        const foods = (dish.food||[]).slice(0,4).map(f=>FOOD_TYPES[f]?.ico||'').join('');
        return `<div class="pi-it">
          <div class="pi-it-n">${escAttr(dish.short || dish.nom)}</div>
          <div class="pi-it-m">${foods} <span>${dish.kcal[0]}/${dish.kcal[1]} kcal</span></div>
        </div>`;
      }).join('');
      return `<td>${items}</td>`;
    }).join('');
  };

  const guideHtml = WEEKLY_GUIDE.map(g=>{
    const fk = g.foodKey || g.k;
    const v = (g.scope === 'com' ? com[fk] : all[fk]) || 0;
    const st = guideStatus(v, g.target, g.max);
    const ft = FOOD_TYPES[fk] || {ico:'•'};
    let cls = 'g-ok';
    if(st.cls === 'st-over') cls = 'g-over';
    else if(st.cls === 'st-empty' && g.target>0) cls = 'g-empty';
    else if(st.cls === 'st-near') cls = 'g-near';
    else if(st.cls === 'st-low') cls = 'g-low';
    return `<div class="g-it ${cls}">
      <span class="g-ic">${ft.ico}</span>
      <span class="g-n">${escAttr(g.lbl)}</span>
      <span class="g-v">${v}/${g.target}</span>
    </div>`;
  }).join('');

  // Lista compacta de recetas usadas con receta completa
  const usedSet = new Set();
  Object.values(data).forEach(day=>Object.values(day).forEach(arr=>arr.forEach(id=> usedSet.add(id))));
  const recipesList = [...usedSet].map(id=>{
    const d = DISHES[id]; if(!d) return '';
    const foods = (d.food||[]).map(f=>{
      const ft = FOOD_TYPES[f]; if(!ft) return '';
      return `<span class="r-fchip">${ft.ico} ${escAttr(ft.short)}</span>`;
    }).join('');
    const ing = (d.ing||[]).map(i=>`<tr><td>${escAttr(i.n)}</td><td>${escAttr(i.A)}</td><td>${escAttr(i.B)}</td></tr>`).join('');
    return `<section class="r-card">
      <header class="r-hd">
        <span class="r-ic">${d.icon}</span>
        <div class="r-tt">
          <h3>${escAttr(d.nom)}</h3>
          <div class="r-meta">${escAttr(d.t)} · ${escAttr(d.eq||'')}</div>
        </div>
        <div class="r-kcal">${d.kcal[0]}/${d.kcal[1]} kcal</div>
      </header>
      ${d.desc?`<p class="r-desc">${escAttr(d.desc)}</p>`:''}
      <div class="r-foods">${foods}</div>
      <table class="r-ing">
        <thead><tr><th>Ingrediente</th><th>♂ A</th><th>♀ B</th></tr></thead>
        <tbody>${ing}</tbody>
      </table>
      ${d.nota?`<div class="r-note"><strong>Preparación.</strong> ${escAttr(d.nota)}</div>`:''}
    </section>`;
  }).join('');

  return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8">
<title>${escAttr(name)} · Menú semanal</title>
<style>
  @page{size:A4 landscape;margin:14mm 12mm}
  @page recipes{size:A4 portrait;margin:14mm 14mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#2C1F0E;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .doc{padding:0}

  h1{font-size:22pt;font-weight:700;letter-spacing:-.01em;margin-bottom:2pt}
  h1 small{display:block;font-size:9pt;color:#666;font-weight:400;letter-spacing:.05em;text-transform:uppercase;margin-top:3pt;font-family:'Courier New',monospace}

  .head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:10pt;border-bottom:2pt solid #2C1F0E;padding-bottom:6pt}
  .head .hr-r{font-family:'Courier New',monospace;font-size:8pt;color:#666;text-align:right;line-height:1.4}
  .head .hr-r strong{color:#2C1F0E;font-size:9pt;display:block}

  table.week{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:12pt;font-size:8.5pt}
  table.week th, table.week td{border:.5pt solid #BBB;padding:5pt 6pt;vertical-align:top;text-align:left;line-height:1.3}
  table.week thead th{background:#2C1F0E;color:#fff;font-family:'Courier New',monospace;font-size:8pt;letter-spacing:.05em;text-transform:uppercase;font-weight:600}
  table.week th.row-lbl{background:#EDE0C0;color:#2C1F0E;width:60pt;text-align:center;font-family:'Courier New',monospace;font-size:8pt;letter-spacing:.05em;text-transform:uppercase}
  table.week td.empty{color:#bbb;text-align:center;font-style:italic;background:repeating-linear-gradient(45deg,#fff 0,#fff 4px,#fafafa 4px,#fafafa 8px)}
  .pi-it{border-bottom:.3pt dashed #ccc;padding:2pt 0}
  .pi-it:last-child{border-bottom:none}
  .pi-it-n{font-weight:600;font-size:8.5pt;line-height:1.2}
  .pi-it-m{font-family:'Courier New',monospace;font-size:7pt;color:#666;margin-top:1pt}
  .pi-it-m span{color:#888}

  .summary{display:flex;gap:14pt;margin-bottom:12pt;page-break-inside:avoid}
  .sum-block{flex:1;border:.5pt solid #BBB;border-radius:3pt;padding:7pt 9pt}
  .sum-block h2{font-size:10pt;font-weight:700;margin-bottom:4pt;letter-spacing:.02em}
  .sum-block h2 small{font-family:'Courier New',monospace;font-size:7pt;color:#888;font-weight:400;text-transform:uppercase;letter-spacing:.06em;margin-left:6pt}
  .sum-tot{font-family:'Courier New',monospace;font-size:8pt;line-height:1.5}
  .sum-tot strong{display:inline-block;min-width:42pt;color:#666;font-weight:400}
  .sum-tot em{font-style:normal;color:#2C1F0E;font-weight:600}

  .guide{display:grid;grid-template-columns:repeat(4,1fr);gap:3pt}
  .g-it{font-family:'Courier New',monospace;font-size:7.5pt;padding:2pt 5pt;border-radius:2pt;display:flex;align-items:center;gap:3pt;border-left:2pt solid transparent;background:#FAF6EB}
  .g-it .g-ic{font-size:9pt;font-family:inherit}
  .g-it .g-n{flex:1;line-height:1.2}
  .g-it .g-v{font-weight:700}
  .g-it.g-ok{border-left-color:#5C8030}
  .g-it.g-near{border-left-color:#C89328;background:#FEF6E0}
  .g-it.g-over{border-left-color:#A52A1F;background:#FAEAE5}
  .g-it.g-empty{border-left-color:#aaa}

  /* Página 2+: recetas detalladas */
  .recipes-pg{page-break-before:always;page:recipes}
  .recipes-h{font-size:16pt;font-weight:700;margin-bottom:10pt;padding-bottom:4pt;border-bottom:1.5pt solid #2C1F0E}
  .recipes-h small{font-family:'Courier New',monospace;font-size:8pt;color:#666;font-weight:400;letter-spacing:.06em;text-transform:uppercase;margin-left:8pt}
  .r-card{border:.5pt solid #BBB;border-radius:3pt;padding:8pt 10pt;margin-bottom:9pt;page-break-inside:avoid}
  .r-hd{display:flex;align-items:flex-start;gap:8pt;margin-bottom:4pt}
  .r-hd .r-ic{font-size:18pt;line-height:1}
  .r-hd .r-tt{flex:1}
  .r-hd h3{font-size:12pt;font-weight:700;line-height:1.2}
  .r-hd .r-meta{font-family:'Courier New',monospace;font-size:7.5pt;color:#666;letter-spacing:.04em;margin-top:1pt}
  .r-hd .r-kcal{font-family:'Courier New',monospace;font-size:9pt;color:#B5603A;font-weight:700;white-space:nowrap}
  .r-desc{font-size:9pt;line-height:1.4;color:#444;font-style:italic;margin:3pt 0 4pt}
  .r-foods{margin-bottom:5pt}
  .r-fchip{display:inline-block;font-family:'Courier New',monospace;font-size:7pt;letter-spacing:.03em;background:#EDE0C0;padding:1pt 5pt;border-radius:7pt;margin:1pt 2pt 1pt 0}
  table.r-ing{width:100%;border-collapse:collapse;font-size:8.5pt;margin:4pt 0}
  table.r-ing th{font-family:'Courier New',monospace;font-size:7pt;text-transform:uppercase;letter-spacing:.05em;color:#888;font-weight:500;padding:2pt 5pt;text-align:left;border-bottom:.5pt solid #ccc}
  table.r-ing th:not(:first-child){text-align:right;width:64pt}
  table.r-ing td{padding:2pt 5pt;border-bottom:.3pt solid #eee;vertical-align:top}
  table.r-ing td:not(:first-child){text-align:right;font-family:'Courier New',monospace;font-size:8pt;color:#666;white-space:nowrap}
  .r-note{font-size:8.5pt;line-height:1.45;background:#FAF6EB;border-left:2pt solid #C89328;padding:5pt 7pt;margin-top:4pt}
  .r-note strong{color:#7A4800}

  .foot{margin-top:6pt;text-align:right;font-family:'Courier New',monospace;font-size:7pt;color:#999;letter-spacing:.04em}

  @media screen{
    body{padding:20px;background:#eee}
    .doc{max-width:1100px;margin:0 auto;background:#fff;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
  }
</style>
</head><body>
<div class="doc">

  <header class="head">
    <h1>${escAttr(name)}<small>Plan nutricional · menú semanal</small></h1>
    <div class="hr-r">
      <strong>Persona ${S.p === 'AB' ? 'A+B (pareja)' : S.p} · ${persona.kcal} kcal/día objetivo</strong>
      Generado ${nowStamp()}
    </div>
  </header>

  <table class="week">
    <thead>
      <tr>
        <th class="row-lbl">&nbsp;</th>
        ${WEEK_DAYS.map(d=>`<th>${d.long}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${MEAL_ROWS.map(row=>`<tr>
        <th class="row-lbl">${slotsMeta[row.k]}</th>
        ${cellsHtml(row.k)}
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="sum-block">
      <h2>Promedio diario <small>(suma semana / ${days})</small></h2>
      <div class="sum-tot">
        <strong>♂ Persona A</strong> <em>${Math.round(totsByPerson.A.k/days)} kcal</em> · ${Math.round(totsByPerson.A.p/days)}P · ${Math.round(totsByPerson.A.f/days)}G · ${Math.round(totsByPerson.A.c/days)}C<br>
        <strong>♀ Persona B</strong> <em>${Math.round(totsByPerson.B.k/days)} kcal</em> · ${Math.round(totsByPerson.B.p/days)}P · ${Math.round(totsByPerson.B.f/days)}G · ${Math.round(totsByPerson.B.c/days)}C
      </div>
    </div>
    <div class="sum-block" style="flex:1.5">
      <h2>Guía semanal <small>según PDF</small></h2>
      <div class="guide">${guideHtml}</div>
    </div>
  </div>

  ${recipesList ? `<div class="recipes-pg">
    <h2 class="recipes-h">Recetas del menú<small>${usedSet.size} recetas únicas</small></h2>
    ${recipesList}
  </div>` : ''}

  <div class="foot">Plan nutricional · menú generado el ${nowStamp()}</div>
</div>
</body></html>`;
}

/* ── BIND BOTONES TOP ──────────────────────────────── */
document.getElementById('importJsonBtn').addEventListener('click', openJsonImport);
document.getElementById('exportJsonBtn').addEventListener('click', exportRecipesJson);
const importMenuBtn = document.getElementById('importMenuBtn');
if(importMenuBtn) importMenuBtn.addEventListener('click', importMenuJson);
const calExportPdfBtn = document.getElementById('calExportPdf');
if(calExportPdfBtn) calExportPdfBtn.addEventListener('click', ()=> exportMenuPdf());
const calExportFullBtn = document.getElementById('calExportFull');
if(calExportFullBtn) calExportFullBtn.addEventListener('click', ()=> exportFullPdf());
const calExportJsonBtn = document.getElementById('calExportJson');
if(calExportJsonBtn) calExportJsonBtn.addEventListener('click', ()=> exportMenuJson());

/* expose for menu-calendar.js */
window.savePromptModal = savePromptModal;
window.renderSaved = renderSaved;
window.exportMenuPdf = exportMenuPdf;
window.exportMenuJson = exportMenuJson;

// final init: restore last view now that calendar + saved are defined
switchView(S.view);
