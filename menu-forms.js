/* ══════════════════════════════════════════════════════════
   MENU FORMS · settings + custom recipes
   depends on globals from menu-app.js (DISHES, TARGETS, S,
   DEFAULT_TARGETS, recomputeAB, persistTargets, persistCustom,
   persistCart, renderAll, openModal)
══════════════════════════════════════════════════════════ */

const formBg    = () => document.getElementById('formBg');
const formBody  = () => document.getElementById('formBody');

function openForm(html){
  formBody().innerHTML = html;
  formBg().classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeForm(){
  formBg().classList.remove('show');
  document.body.classList.remove('no-scroll');
}

document.getElementById('formClose').addEventListener('click', closeForm);
document.getElementById('formBg').addEventListener('click', e=>{
  if(e.target.id === 'formBg') closeForm();
});

/* ══════════════════════════════════════════════════════════
   SETTINGS · personas + my recipes (tabs)
══════════════════════════════════════════════════════════ */
let _settingsTab = 'personas';

function openSettings(tab){
  if(tab) _settingsTab = tab;
  renderSettings();
  formBg().classList.add('show');
  document.body.classList.add('no-scroll');
}

function renderSettings(){
  const html = `
    <div class="form-hd">
      <h2>Ajustes</h2>
      <span class="form-sub">Objetivos diarios y recetas propias</span>
    </div>
    <div class="form-tabs">
      <button class="ftab ${_settingsTab==='personas'?'on':''}" data-tab="personas">Personas</button>
      <button class="ftab ${_settingsTab==='recetas'?'on':''}" data-tab="recetas">Mis recetas</button>
      <button class="ftab ${_settingsTab==='alimentos'?'on':''}" data-tab="alimentos">Alimentos</button>
      <button class="ftab ${_settingsTab==='datos'?'on':''}" data-tab="datos">Copia de datos</button>
    </div>
    <div class="form-body">
      ${_settingsTab==='personas' ? renderPersonasForm()
        : _settingsTab==='alimentos' ? renderFoodsManager()
        : _settingsTab==='datos' ? renderDataManager()
        : renderRecipesList()}
    </div>`;

  formBody().innerHTML = html;

  formBody().querySelectorAll('.ftab').forEach(b=>{
    b.addEventListener('click', ()=>{
      _settingsTab = b.dataset.tab;
      renderSettings();
    });
  });

  if(_settingsTab === 'personas') wirePersonasForm();
  else if(_settingsTab === 'alimentos') wireFoodsManager();
  else if(_settingsTab === 'datos') wireDataManager();
  else wireRecipesList();
}

/* ── COPIA DE SEGURIDAD (exportar/importar TODO) ─────────── */
const BACKUP_PREFIXES = ['mnut:', 'sport:'];
function collectBackup(){
  const store = {};
  for(let i=0; i<localStorage.length; i++){
    const k = localStorage.key(i);
    if(k && BACKUP_PREFIXES.some(p=>k.startsWith(p))) store[k] = localStorage.getItem(k);
  }
  return {kind:'plan-backup', version:1, date:new Date().toISOString(), keys:Object.keys(store).length, store};
}
function renderDataManager(){
  const b = collectBackup();
  const approxKB = Math.round(JSON.stringify(b.store).length/1024);
  return `
    <p style="font-size:.86rem;color:var(--ink-50);line-height:1.55;margin-bottom:14px">
      Todos tus datos (perfiles, recetas, menús, calendario, planes de entreno, favoritos…) se guardan <strong>solo en este navegador</strong>.
      Haz una <strong>copia</strong> regularmente y para pasar a otro dispositivo.
    </p>
    <div class="data-stat">📦 <strong>${b.keys}</strong> conjuntos de datos · ~${approxKB} KB</div>
    <div class="data-actions">
      <button class="btn-prim" id="dataExport">⤓ Exportar copia (.json)</button>
      <label class="btn-sec data-import-lbl">⤒ Importar copia<input type="file" id="dataImport" accept="application/json,.json" hidden></label>
    </div>
    <div id="dataMsg" class="data-msg"></div>
    <p style="font-size:.74rem;color:var(--ink-30);margin-top:14px;line-height:1.5">
      Al importar se <strong>sustituyen</strong> los datos actuales por los de la copia. La app se recargará.
    </p>
    <div class="snap-sec">
      <h3 class="snap-h">📥 Importar por lote (JSON) <small>añade o actualiza ejercicios y sesiones sin borrar lo demás</small></h3>
      <div class="data-actions">
        <button class="btn-sec" id="impSportEx">🏋️ Importar ejercicios</button>
        <button class="btn-sec" id="impSportSess">📋 Importar sesiones</button>
      </div>
    </div>
    ${renderSnapshotsBlock()}`;
}

/* ── Copias automáticas restaurables (sesión) ──────────────── */
function renderSnapshotsBlock(){
  const PN = window.PNSession;
  const snaps = PN ? PN.getSnaps().slice().reverse() : [];
  const reasonLbl = { manual:'manual', auto:'auto', hide:'al salir' };
  const rows = snaps.length ? snaps.map(s=>`
      <div class="snap-row">
        <div class="snap-info"><strong>${PN.fmtTs(s.ts)}</strong> <span class="snap-tag">${reasonLbl[s.reason]||s.reason}</span></div>
        <button class="btn-sec snap-restore" data-snap="${s.id}">↩ Restaurar</button>
      </div>`).join('')
    : `<div class="snap-empty">Aún no hay copias automáticas. Se crean cada 5 minutos y al cerrar la app.</div>`;
  return `
    <div class="snap-sec">
      <h3 class="snap-h">⏱ Autoguardado <small>copia cada 5 min · se conservan las últimas 6</small></h3>
      <div class="data-actions" style="margin-bottom:10px">
        <button class="btn-prim" id="snapSaveNow">💾 Guardar avance ahora</button>
      </div>
      <div class="snap-list">${rows}</div>
    </div>`;
}
function wireDataManager(){
  const msg = document.getElementById('dataMsg');
  document.getElementById('dataExport').addEventListener('click', ()=>{
    const payload = collectBackup();
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a');
    const stamp = new Date().toISOString().slice(0,10);
    a.href=url; a.download=`copia-plan-nutricional-${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(msg){ msg.className='data-msg ok'; msg.textContent='✓ Copia exportada.'; }
  });
  document.getElementById('dataImport').addEventListener('change', (e)=>{
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async ()=>{
      let obj; try{ obj = JSON.parse(reader.result); }catch(err){ if(msg){msg.className='data-msg err'; msg.textContent='✘ Archivo no válido (JSON).';} return; }
      if(!obj || obj.kind!=='plan-backup' || !obj.store || typeof obj.store!=='object'){ if(msg){msg.className='data-msg err'; msg.textContent='✘ No es una copia de Plan Nutricional.';} return; }
      const n = Object.keys(obj.store).length;
      if(!await pnConfirm(`¿Restaurar ${n} conjuntos de datos?\nSe sustituirán los datos actuales y la app se recargará.`, {danger:true, okText:'Restaurar'})) { e.target.value=''; return; }
      try{
        // borra los datos actuales de la app
        for(let i=localStorage.length-1; i>=0; i--){ const k=localStorage.key(i); if(k && BACKUP_PREFIXES.some(p=>k.startsWith(p))) localStorage.removeItem(k); }
        Object.entries(obj.store).forEach(([k,v])=>{ if(typeof v==='string') localStorage.setItem(k, v); });
        location.reload();
      }catch(err){ if(msg){msg.className='data-msg err'; msg.textContent='✘ No se pudo restaurar: '+err.message;} }
    };
    reader.readAsText(file);
  });

  // Importar ejercicios / sesiones por lote (centralizado aquí)
  const impEx = document.getElementById('impSportEx');
  if(impEx) impEx.addEventListener('click', ()=>{ if(typeof openSportImport==='function') openSportImport('ex'); });
  const impSess = document.getElementById('impSportSess');
  if(impSess) impSess.addEventListener('click', ()=>{ if(typeof openSportImport==='function') openSportImport('sess'); });

  // Autoguardado: guardar ahora + restaurar copias
  const saveNowBtn = document.getElementById('snapSaveNow');
  if(saveNowBtn) saveNowBtn.addEventListener('click', ()=>{
    if(window.PNSession){ window.PNSession.manualSave(); renderSettings(); }
  });
  document.querySelectorAll('.snap-restore').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = +b.dataset.snap;
      if(window.PNSession) window.PNSession.restoreSnap(id);
    });
  });
}

/* ── PERSONAS FORM ───────────────────────────────────── */
// Factores de actividad (incluye deporte + NEAT/vida diaria), según la teoría.
const ACTIVITY_LEVELS = [
  {k:'sed', f:1.4,  lbl:'Sedentario',         ex:'Trabajo sentado, poco movimiento. Menos de ~8.000-10.000 pasos/día.'},
  {k:'lig', f:1.6,  lbl:'Ligeramente activo', ex:'Más movimiento diario, desplazamientos a pie. ~10.000-15.000 pasos.'},
  {k:'mod', f:1.75, lbl:'Activo',             ex:'Vida diaria demandante + entreno. Alrededor de ~20.000 pasos.'},
  {k:'alt', f:1.95, lbl:'Muy activo',         ex:'Trabajo físico intenso o deporte largo/intenso. Más de 20.000 pasos.'},
  {k:'mxa', f:2.1,  lbl:'Atleta / máximo',    ex:'Doble sesión diaria, competición o trabajo físico pesado.'}
];
// Objetivos como MULTIPLICADOR del gasto (GET), con proteína y grasa por g/kg
// (peso de cálculo). Carbohidratos = el resto de kcal. Según la teoría del curso.
const GOALS = [
  {k:'cut',  m:0.80, lbl:'Adelgazar',       ex:'Déficit 20% sobre el gasto (GET × 0,80)',          pPerKg:2.2, fPerKg:0.9},
  {k:'mild', m:0.90, lbl:'Adelgazar suave', ex:'Déficit 10% (GET × 0,90), más sostenible',         pPerKg:2.0, fPerKg:0.9},
  {k:'recmp',m:0.90, lbl:'Recomposición',   ex:'Déficit leve + proteína alta y fuerza (GET × 0,90)',pPerKg:2.1, fPerKg:0.9},
  {k:'man',  m:1.00, lbl:'Mantener',        ex:'Mantenimiento, igual al gasto (= GET)',            pPerKg:1.7, fPerKg:1.0},
  {k:'bulk', m:1.08, lbl:'Ganar masa',      ex:'Superávit pequeño ~8% (GET × 1,08)',               pPerKg:1.9, fPerKg:1.0}
];

const LS_CALC = 'mnut:calcInputs:v1';
function getCalcInputs(){ return lsGet(LS_CALC, {A:{}, B:{}}); }
function saveCalcInputs(o){ lsSet(LS_CALC, o); }

// Peso de cálculo: peso real, o "peso corregido" si hay sobrepeso/obesidad
// (IMC > 25), para no sobreestimar las kcal con mucha masa grasa.
//   peso ideal     = 22 × altura(m)²
//   peso corregido = ideal + 0,25 × (peso real − ideal)
const IMC_CORRECT = 27;   // a partir de este IMC se usa peso corregido (teoría: 25-26)
function pesoCalculo(kg, cm){
  if(!kg) return 0;
  if(!cm) return kg;
  const m = cm/100;
  const imc = kg/(m*m);
  if(imc <= IMC_CORRECT) return kg;
  const ideal = 22 * m * m;
  return ideal + 0.25 * (kg - ideal);
}
// Gasto Metabólico Basal (teoría): peso de cálculo × 22.
function calcGMB(kg, cm){
  const pc = pesoCalculo(kg, cm);
  if(!pc) return 0;
  return Math.round(pc * 22);
}

function renderPersonasForm(){
  const calcInputs = getCalcInputs();

  const personRow = (k, sym, idx) => {
    const t = TARGETS[k];
    const ci = calcInputs[k] || {};
    const defaultSex = idx === 0 ? 'M' : 'F';
    const sex = ci.sex || defaultSex;
    const isBase = (k === basePersonId());
    return `
      <div class="fcard" data-pkey="${k}">
        <div class="fcard-hd">
          <span>${sym} ${(t.name||('Persona '+(idx+1))).replace(/</g,'&lt;')} <small>${t.kcal} kcal/día</small></span>
          ${PEOPLE.length>1 ? `<button type="button" class="person-rm" data-rm="${k}" title="Quitar persona">🗑</button>` : ''}
        </div>
        <div class="fgrp">
          <label class="flbl">Nombre / etiqueta</label>
          <input class="finp" name="name" value="${(t.name||'').replace(/"/g,'&quot;')}" placeholder="ej. ${idx===0?'135kg':'95kg'}">
        </div>
        <div class="fgrp">
          <label class="flbl">Modificador de ración ${isBase?'<span class="flbl-ex">— ración BASE (la de menor kcal): ×1</span>':'<span class="flbl-ex">× sobre la ración base. Por defecto = ratio de kcal; edítalo si quieres</span>'}</label>
          <input class="finp mono" type="number" name="modifier" min="0.3" max="3" step="0.05" value="${personModifier(k)}" ${isBase?'disabled title="La persona base es ×1"':''}>
        </div>
        <div class="frow-4">
          <div class="fgrp">
            <label class="flbl">kcal/día</label>
            <input class="finp mono" type="number" name="kcal" min="800" max="5000" step="50" value="${t.kcal}">
          </div>
          <div class="fgrp">
            <label class="flbl">Prot (g)</label>
            <input class="finp mono" type="number" name="p" min="40" max="400" value="${t.p}">
          </div>
          <div class="fgrp">
            <label class="flbl">Grasa (g)</label>
            <input class="finp mono" type="number" name="f" min="20" max="200" value="${t.f}">
          </div>
          <div class="fgrp">
            <label class="flbl">Carb (g)</label>
            <input class="finp mono" type="number" name="c" min="40" max="500" value="${t.c}">
          </div>
        </div>
        <div class="fgrp">
          <label class="flbl">Restricciones / intolerancias <span class="flbl-ex">— se aplican al autocompletar y marcan recetas conflictivas en rojo</span></label>
          <div class="fchips restr-chips" data-restr-for="${k}">
            ${RESTRICTIONS.map(r=>{
              const on = (t.restr||[]).includes(r.k);
              return `<button type="button" class="fchip ${on?'on':''}" data-r="${r.k}" title="${r.desc.replace(/"/g,'&quot;')}"><span class="ch-ic">${r.ico}</span>${r.lbl}</button>`;
            }).join('')}
          </div>
        </div>
        <button type="button" class="calc-toggle" data-ctog="${k}">🧮 Calcular kcal según mis datos <span class="ct-tip">o introduce manualmente arriba ↑</span></button>
        <div class="calc-panel" data-cpanel="${k}" style="display:none">
          <div class="calc-hd">Calculadora · GMB = peso × 22 (peso corregido si hay sobrepeso) → GET = GMB × actividad → ajuste por objetivo. Macros por g/kg.</div>

          <div class="calc-row">
            <label class="flbl">Sexo</label>
            <div class="calc-seg">
              <button type="button" class="cseg ${sex==='M'?'on':''}" data-sex="M">♂ Hombre</button>
              <button type="button" class="cseg ${sex==='F'?'on':''}" data-sex="F">♀ Mujer</button>
            </div>
          </div>

          <div class="frow-3 calc-3">
            <div class="fgrp">
              <label class="flbl">Edad (años)</label>
              <input class="finp mono" type="number" name="age" min="14" max="100" placeholder="35" value="${ci.age||''}">
            </div>
            <div class="fgrp">
              <label class="flbl">Peso (kg)</label>
              <input class="finp mono" type="number" name="kg" min="30" max="250" step="0.1" placeholder="80" value="${ci.kg||''}">
            </div>
            <div class="fgrp">
              <label class="flbl">Altura (cm)</label>
              <input class="finp mono" type="number" name="cm" min="120" max="220" placeholder="175" value="${ci.cm||''}">
            </div>
          </div>

          <div class="calc-row">
            <label class="flbl">Nivel de actividad</label>
            <div class="calc-radios">
              ${ACTIVITY_LEVELS.map(a=>`
                <label class="cradio">
                  <input type="radio" name="act-${k}" value="${a.k}" ${(ci.act||'mod')===a.k?'checked':''}>
                  <span class="cr-lbl">${a.lbl} <em>×${a.f}</em></span>
                  <span class="cr-ex">${a.ex}</span>
                </label>`).join('')}
            </div>
          </div>

          <div class="calc-row">
            <label class="flbl">Objetivo</label>
            <div class="calc-radios calc-radios-grid">
              ${GOALS.map(g=>`
                <label class="cradio">
                  <input type="radio" name="goal-${k}" value="${g.k}" ${(ci.goal||'man')===g.k?'checked':''}>
                  <span class="cr-lbl">${g.lbl} <em>${g.m===1?'= gasto':(g.m>1?'+'+Math.round((g.m-1)*100)+'%':'−'+Math.round((1-g.m)*100)+'%')}</em></span>
                  <span class="cr-ex">${g.ex}</span>
                </label>`).join('')}
            </div>
          </div>

          <div class="calc-result" id="calcResult-${k}">
            <div class="cr-blocks">
              <div class="cr-blk"><span class="cr-v" data-result="bmr">—</span><span class="cr-l">GMB · gasto basal</span></div>
              <div class="cr-blk"><span class="cr-v" data-result="tdee">—</span><span class="cr-l">GET · mantenimiento</span></div>
              <div class="cr-blk hi"><span class="cr-v" data-result="goal">—</span><span class="cr-l">kcal objetivo</span></div>
            </div>
            <div class="cr-macros" data-result="macros">Indica edad, peso y altura para calcular</div>
          </div>

          <div class="calc-actions">
            <button type="button" class="btn-sec" data-capply="kcal">Aplicar sólo kcal</button>
            <button type="button" class="btn-prim" data-capply="all">Aplicar kcal + macros</button>
          </div>
        </div>
      </div>`;
  };

  const sum = PEOPLE.reduce((a,id)=>{ const t=TARGETS[id]||{}; a.k+=t.kcal||0;a.p+=t.p||0;a.f+=t.f||0;a.c+=t.c||0; return a; }, {k:0,p:0,f:0,c:0});
  return `
    <p style="font-size:.86rem;color:var(--ink-50);margin-bottom:14px;line-height:1.55">
      Ajusta los objetivos de cada persona. Puedes <strong>añadir o quitar personas</strong> (mínimo 1). La ración de cada una = ración <strong>base</strong> (la de menor kcal) × su <strong>modificador</strong>. El modo <strong style="color:var(--warm)">Todas</strong> es la suma.
    </p>
    <button type="button" class="btn-sec" id="reOnboard" style="width:100%;margin-bottom:12px">🧮 Asistente de cálculo (peso, altura, objetivo…)</button>
    ${PEOPLE.map((id,i)=> personRow(id, (TARGETS[id]||{}).sym || PERSON_SYMS[i] || '🧑', i)).join('')}
    <button type="button" class="btn-sec" id="addPerson" style="width:100%;margin-bottom:10px">➕ Añadir persona</button>
    <div style="font-family:'DM Mono',monospace;font-size:.62rem;color:var(--ink-50);text-transform:uppercase;letter-spacing:.08em;text-align:center;padding:6px">
      → Total (todas): <span id="abPreview">${sum.k} kcal · ${sum.p}P · ${sum.f}G · ${sum.c}C</span>
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="resetTargets">Restaurar valores</button>
      <button class="btn-prim" id="saveTargets">Guardar</button>
    </div>`;
}

/* Lee el formulario de personas y vuelca a TARGETS/PEOPLE.
   Modificador: si lo dejas como está (= ratio de kcal) sigue siendo
   automático; si lo cambias, queda fijo para esa persona. */
function savePeopleFromForm(opts){
  opts = opts || {};
  formBody().querySelectorAll('.fcard').forEach(c=>{
    const k = c.dataset.pkey; const t = TARGETS[k]; if(!t) return;
    t.name = (c.querySelector('[name=name]').value||'').trim();
    t.kcal = +c.querySelector('[name=kcal]').value || t.kcal;
    t.p    = +c.querySelector('[name=p]').value    || t.p;
    t.f    = +c.querySelector('[name=f]').value    || t.f;
    t.c    = +c.querySelector('[name=c]').value    || t.c;
    t.restr = [...c.querySelectorAll('.restr-chips .fchip.on')].map(b=>b.dataset.r);
  });
  // Modificadores (con las kcal ya actualizadas y la base recalculada)
  const baseId = basePersonId();
  const baseK = (TARGETS[baseId]||{}).kcal || 0;
  formBody().querySelectorAll('.fcard').forEach(c=>{
    const k = c.dataset.pkey; const t = TARGETS[k]; if(!t) return;
    if(k === baseId){ t.modifier = null; return; }
    const inp = c.querySelector('[name=modifier]');
    const entered = inp ? +inp.value : NaN;
    const autoMod = baseK ? Math.round((t.kcal/baseK)*100)/100 : 1;
    t.modifier = (!isFinite(entered) || Math.abs(entered - autoMod) < 0.02) ? null : entered;
  });
  // Datos de la calculadora
  const calcInputs = getCalcInputs();
  formBody().querySelectorAll('.fcard').forEach(c=>{
    const k = c.dataset.pkey;
    const sexBtn = c.querySelector('.cseg.on');
    calcInputs[k] = {
      sex: sexBtn ? sexBtn.dataset.sex : 'M',
      age: +c.querySelector('[name=age]').value || null,
      kg:  +c.querySelector('[name=kg]').value || null,
      cm:  +c.querySelector('[name=cm]').value || null,
      act: c.querySelector(`[name="act-${k}"]:checked`)?.value || 'mod',
      goal:c.querySelector(`[name="goal-${k}"]:checked`)?.value || 'man'
    };
  });
  saveCalcInputs(calcInputs);
  recomputeAB();
  if(!opts.silent){
    if(typeof recomputeAllComp === 'function') recomputeAllComp();
    persistTargets();
    if(typeof renderPersonToggle === 'function') renderPersonToggle();
    renderAll();
  }
}

function wirePersonasForm(){
  const refreshPreview = ()=>{
    const tot = {k:0,p:0,f:0,c:0};
    formBody().querySelectorAll('.fcard').forEach(c=>{
      tot.k += +c.querySelector('[name=kcal]').value || 0;
      tot.p += +c.querySelector('[name=p]').value || 0;
      tot.f += +c.querySelector('[name=f]').value || 0;
      tot.c += +c.querySelector('[name=c]').value || 0;
    });
    const el = document.getElementById('abPreview');
    if(el) el.textContent = `${tot.k} kcal · ${tot.p}P · ${tot.f}G · ${tot.c}C`;
  };
  formBody().querySelectorAll('.finp').forEach(i=> i.addEventListener('input', refreshPreview));

  // Añadir persona
  const reOb = document.getElementById('reOnboard');
  if(reOb) reOb.addEventListener('click', ()=>{
    if(window.pnOnboarding){ if(typeof closeForm==='function') closeForm(); window.pnOnboarding.open(true); }
  });
  const addBtn = document.getElementById('addPerson');
  if(addBtn) addBtn.addEventListener('click', ()=>{
    // guarda lo editado actualmente, luego añade una persona nueva y re-renderiza
    savePeopleFromForm({silent:true});
    const base = TARGETS[basePersonId()] || {kcal:1800,p:120,f:60,c:180};
    let n = 1; let id = 'P' + n;
    while(TARGETS[id] || PEOPLE.includes(id)) id = 'P' + (++n);
    TARGETS[id] = { kcal:base.kcal, p:base.p, f:base.f, c:base.c, name:'', sym: PERSON_SYMS[PEOPLE.length] || '🧑', restr:[], modifier:1 };
    PEOPLE.push(id);
    recomputeAB();
    renderSettings();
  });
  // Quitar persona
  formBody().querySelectorAll('.person-rm').forEach(b=> b.addEventListener('click', async ()=>{
    if(PEOPLE.length <= 1) return;
    const id = b.dataset.rm;
    if(!await pnConfirm('¿Quitar esta persona?\nSus objetivos se eliminan.', {danger:true, okText:'Quitar'})) return;
    savePeopleFromForm({silent:true});
    PEOPLE = PEOPLE.filter(x=> x!==id);
    if(id.startsWith('P') || id==='A' || id==='B'){ /* deja el objeto pero fuera de PEOPLE */ }
    if(S.p === id) S.p = PEOPLE[0];
    recomputeAB();
    renderSettings();
  }));

  // Toggle chips de restricciones
  formBody().querySelectorAll('.restr-chips .fchip').forEach(b=>{
    b.addEventListener('click', ()=> b.classList.toggle('on'));
  });

  // Toggle panel calculadora
  formBody().querySelectorAll('[data-ctog]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.dataset.ctog;
      const panel = formBody().querySelector(`[data-cpanel="${k}"]`);
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      btn.classList.toggle('on', !open);
      if(!open) recalcPanel(k);
    });
  });

  // Cambio en sexo
  formBody().querySelectorAll('.cseg').forEach(b=>{
    b.addEventListener('click', ()=>{
      const card = b.closest('.fcard');
      card.querySelectorAll('.cseg').forEach(x=> x.classList.toggle('on', x === b));
      recalcPanel(card.dataset.pkey);
    });
  });

  // Inputs de la calculadora (cualquiera dispara recálculo)
  ['age','kg','cm'].forEach(name=>{
    formBody().querySelectorAll(`[name="${name}"]`).forEach(i=>{
      i.addEventListener('input', ()=>{
        const k = i.closest('.fcard').dataset.pkey;
        recalcPanel(k);
      });
    });
  });
  formBody().querySelectorAll('.cradio input').forEach(r=>{
    r.addEventListener('change', ()=>{
      const k = r.closest('.fcard').dataset.pkey;
      recalcPanel(k);
    });
  });

  // Aplicar resultados a los campos kcal/macros
  formBody().querySelectorAll('[data-capply]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.fcard');
      if(!card) return;
      const k = card.dataset.pkey;
      const r = computeCalc(k);
      if(!r){
        // Mensaje inline en vez de alert (más cómodo en móvil)
        showCalcMsg(card, 'Indica edad, peso y altura antes de aplicar', 'err');
        return;
      }
      // Actualizar inputs y dispatcher de eventos (por si algo escucha)
      const setVal = (n, v) => {
        const el = card.querySelector(`[name="${n}"]`);
        if(!el) return;
        el.value = v;
        el.dispatchEvent(new Event('input',  {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      };
      setVal('kcal', r.goal);
      if(btn.dataset.capply === 'all'){
        setVal('p', r.macros.p);
        setVal('f', r.macros.f);
        setVal('c', r.macros.c);
      }
      refreshPreview();
      // Animación + scroll al campo kcal
      const fields = btn.dataset.capply === 'all'
        ? ['kcal','p','f','c'] : ['kcal'];
      fields.forEach(n=>{
        const inp = card.querySelector(`[name="${n}"]`);
        if(!inp) return;
        inp.classList.remove('flash');
        // forzar reflow para reiniciar animación
        void inp.offsetWidth;
        inp.classList.add('flash');
        setTimeout(()=> inp.classList.remove('flash'), 900);
      });
      // Mensaje de confirmación inline
      showCalcMsg(card,
        btn.dataset.capply === 'all'
          ? `✓ Aplicado: ${r.goal} kcal · ${r.macros.p}P · ${r.macros.f}G · ${r.macros.c}C`
          : `✓ Aplicado: ${r.goal} kcal/día`,
        'ok');
      // Scroll al campo kcal si está fuera de vista
      const kcalInput = card.querySelector('[name="kcal"]');
      if(kcalInput){
        const rect = kcalInput.getBoundingClientRect();
        const modal = card.closest('.modal');
        if(modal){
          const modalRect = modal.getBoundingClientRect();
          if(rect.top < modalRect.top + 60 || rect.bottom > modalRect.bottom - 20){
            kcalInput.scrollIntoView({block:'center', behavior:'smooth'});
          }
        }
      }
    });
  });

  // Recalc inicial si los paneles tienen datos
  PEOPLE.forEach(k=>{
    const ci = getCalcInputs()[k] || {};
    if(ci.age || ci.kg || ci.cm) recalcPanel(k);
  });

  document.getElementById('saveTargets').addEventListener('click', ()=>{
    savePeopleFromForm({silent:false});
    closeForm();
  });

  document.getElementById('resetTargets').addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Restaurar las 2 personas por defecto (A y B)?', {okText:'Restaurar'})) return;
    Object.assign(TARGETS.A, DEFAULT_TARGETS.A, {name:'', modifier:null});
    Object.assign(TARGETS.B, DEFAULT_TARGETS.B, {name:'', modifier:null});
    PEOPLE = ['A','B'];
    if(!PEOPLE.includes(S.p) && S.p!=='AB') S.p = 'A';
    recomputeAB();
    if(typeof recomputeAllComp === 'function') recomputeAllComp();
    persistTargets();
    if(typeof renderPersonToggle === 'function') renderPersonToggle();
    renderSettings();
    renderAll();
  });
}

/* Peso ideal según la teoría: 22 × altura². Sirve para el peso corregido. */
function pesoIdeal(cm){ const m=(+cm||0)/100; return m ? 22*m*m : 0; }

/* ¿Conviene usar peso corregido? Según la teoría: sobrepeso/obesidad.
   Criterio por IMC (umbral por sexo, más laxo en hombres por más masa magra). */
function usaPesoCorregido(kg, cm, sex){
  if(!kg || !cm) return false;
  const m=cm/100, imc = kg/(m*m);
  return imc > (sex === 'F' ? 26 : 27);
}

/* Peso de cálculo teniendo en cuenta el sexo (teoría: %graso/IMC por sexo). */
function pesoCalculoSex(kg, cm, sex){
  if(!kg) return 0; if(!cm) return kg;
  if(!usaPesoCorregido(kg, cm, sex)) return kg;
  const ideal = pesoIdeal(cm);
  return ideal + 0.25 * (kg - ideal);                // peso corregido (teoría)
}

/* Cálculo PURO (sin DOM), FIEL A LA TEORÍA "kcal" de la carpeta:
     1) Peso de cálculo (real, o corregido si hay sobrepeso — umbral por sexo).
     2) GMB = peso de cálculo × 22.
     3) GET = GMB × factor de actividad.
     4) Objetivo = GET × multiplicador del objetivo.
     5) Macros (método B): proteína y grasa por g/kg; grasa ≥20% kcal; carbos el resto.
   El sexo afina el peso corregido; la edad se guarda como dato (la fórmula
   peso×22 de la teoría no la usa). */
function calcFromInputs(kg, cm, actK, goalK, sex, age){
  kg = +kg || 0; cm = +cm || 0;
  if(!kg || !cm) return null;                        // peso y altura imprescindibles
  const pc  = pesoCalculoSex(kg, cm, sex);           // peso de cálculo (real o corregido)
  const gmb = Math.round(pc * 22);                   // GMB = peso de cálculo × 22 (teoría)
  const actFactor = ACTIVITY_LEVELS.find(a=>a.k===actK)?.f || 1.6;
  const goalDef = GOALS.find(g=>g.k===goalK) || GOALS.find(g=>g.k==='man');

  const tdee = Math.round(gmb * actFactor);          // GET = GMB × FA
  const goal = Math.max(1000, Math.round((tdee * goalDef.m) / 25) * 25); // ajuste por objetivo

  const proteinG = Math.round(pc * goalDef.pPerKg);
  let   fatG     = Math.round(pc * goalDef.fPerKg);
  const minFatG  = Math.round((goal * 0.20) / 9);    // grasa nunca < 20% kcal
  if(fatG < minFatG) fatG = minFatG;
  const carbG = Math.max(0, Math.round((goal - proteinG*4 - fatG*9) / 4)); // carbos = resto

  return {bmr:gmb, tdee, goal, macros:{p:proteinG, f:fatG, c:carbG},
          pesoCalc:Math.round(pc), corrected: usaPesoCorregido(kg, cm, sex)};
}

function computeCalc(k){
  const card = document.querySelector(`.fcard[data-pkey="${k}"]`);
  if(!card) return null;
  // La fórmula peso×22 no necesita sexo ni edad (se conservan solo como dato).
  const kg  = +card.querySelector('[name=kg]')?.value  || 0;
  const cm  = +card.querySelector('[name=cm]')?.value  || 0;
  if(!kg || !cm) return null;   // peso y altura imprescindibles
  const actK = card.querySelector(`[name="act-${k}"]:checked`)?.value || 'mod';
  const goalK = card.querySelector(`[name="goal-${k}"]:checked`)?.value || 'man';
  const sex = card.querySelector('.cseg.on')?.dataset.sex || 'M';
  const age = +card.querySelector('[name=age]')?.value || null;
  return calcFromInputs(kg, cm, actK, goalK, sex, age);
}
window.calcFromInputs = calcFromInputs;
window.ACTIVITY_LEVELS = ACTIVITY_LEVELS;
window.GOALS = GOALS;

function recalcPanel(k){
  const card = document.querySelector(`.fcard[data-pkey="${k}"]`);
  if(!card) return;
  const r = computeCalc(k);
  const setV = (key, val) => {
    const el = card.querySelector(`[data-result="${key}"]`);
    if(el) el.textContent = val;
  };
  if(!r){
    setV('bmr','—'); setV('tdee','—'); setV('goal','—');
    setV('macros','Indica peso y altura para calcular');
    return;
  }
  setV('bmr',  r.bmr  + ' kcal');
  setV('tdee', r.tdee + ' kcal');
  setV('goal', r.goal + ' kcal');
  const corr = r.corrected ? ` · peso de cálculo ${r.pesoCalc} kg (corregido por sobrepeso)` : '';
  setV('macros', `Reparto sugerido · ${r.macros.p}g proteína · ${r.macros.f}g grasa · ${r.macros.c}g carbohidrato${corr}`);
}

/* Mensaje inline en el panel de la calculadora */
function showCalcMsg(card, msg, kind){
  let el = card.querySelector('.calc-msg');
  if(!el){
    el = document.createElement('div');
    el.className = 'calc-msg';
    const actions = card.querySelector('.calc-actions');
    if(actions) actions.insertAdjacentElement('afterend', el);
    else card.appendChild(el);
  }
  el.className = 'calc-msg ' + (kind || 'ok') + ' show';
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(()=>{
    el.classList.remove('show');
  }, 3500);
}

/* ── MY RECIPES LIST ─────────────────────────────────── */
function renderRecipesList(){
  const userIds = Object.keys(DISHES).filter(id => id.startsWith('U') && !DISHES[id].loose);
  const catLbl = {des:'Desayuno', com:'Comida', mer:'Merienda', cen:'Cena'};
  const rows = userIds.length ? userIds.map(id=>{
    const d = DISHES[id];
    return `
      <div class="ur" data-id="${id}">
        <div class="ur-ico">${d.icon||'🍴'}</div>
        <div class="ur-body">
          <div class="ur-n">${d.nom}</div>
          <div class="ur-m"><span class="cat">${catLbl[d.cat]}</span> · ${d.kcal[0]} / ${d.kcal[1]} kcal</div>
        </div>
        <div class="ur-acts">
          <button data-act="view" title="Ver">👁</button>
          <button data-act="edit" title="Editar">✎</button>
          <button data-act="del"  title="Eliminar">🗑</button>
        </div>
      </div>`;
  }).join('') : `<div class="ur-empty">Aún no has creado recetas propias.<br>Pulsa el botón “+ Nueva receta” al final de cualquier categoría.</div>`;

  return `
    <p style="font-size:.86rem;color:var(--ink-50);margin-bottom:14px;line-height:1.55">
      Tus recetas se guardan en este navegador y aparecen en su categoría junto a las del plan, marcadas como <span style="background:var(--olive);color:#fff;font-family:'DM Mono',monospace;font-size:.55rem;padding:2px 6px;border-radius:3px;letter-spacing:.05em;text-transform:uppercase;font-weight:500">Tuya</span>.
    </p>
    <div class="ur-toolbar">
      <span class="ur-count">${userIds.length} receta${userIds.length===1?'':'s'} propia${userIds.length===1?'':'s'}</span>
      ${userIds.length ? `<button class="btn-danger ur-clear" id="clearRecipesBtn" title="Borrar todas tus recetas">🗑 Borrar todas</button>` : ''}
    </div>
    <div class="urlist">${rows}</div>
    <div class="form-actions" style="margin-top:14px">
      <button class="btn-sec" id="newRecipeBtn" style="flex:1">＋ Nueva receta</button>
    </div>`;
}

function wireRecipesList(){
  formBody().querySelectorAll('.ur').forEach(row=>{
    const id = row.dataset.id;
    row.querySelectorAll('[data-act]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const act = btn.dataset.act;
        if(act === 'view'){ closeForm(); openModal(id); }
        if(act === 'edit'){ openRecipeForm(DISHES[id].cat, id); }
        if(act === 'del' ){
          if(!await pnConfirm('¿Eliminar esta receta?\nNo se puede deshacer.', {danger:true, okText:'Eliminar'})) return;
          delete DISHES[id];
          S.cart = S.cart.filter(x=>x!==id);
          persistCustom(); persistCart();
          renderSettings();
          renderAll();
        }
      });
    });
  });
  const cb = document.getElementById('clearRecipesBtn');
  if(cb) cb.addEventListener('click', async ()=>{
    const ids = Object.keys(DISHES).filter(id => id.startsWith('U'));
    if(!ids.length) return;
    if(!await pnConfirm(`¿Borrar TODAS tus recetas propias (${ids.length})?\nNo afecta a las recetas del plan ni a la librería base. No se puede deshacer.`, {danger:true, okText:'Borrar todas'})) return;
    ids.forEach(id=>{ delete DISHES[id]; });
    S.cart = S.cart.filter(x=>DISHES[x]);
    // limpia los menús/calendario de referencias a recetas borradas
    if(typeof CalState !== 'undefined' && CalState.data){
      Object.values(CalState.data).forEach(day=>{
        if(!day) return;
        ['des','com','mer','cen'].forEach(s=>{ if(Array.isArray(day[s])) day[s] = day[s].filter(x=>DISHES[x]); });
      });
      if(typeof persistCal === 'function') persistCal();
    }
    persistCustom(); persistCart();
    renderSettings();
    renderAll();
  });
  const nb = document.getElementById('newRecipeBtn');
  if(nb) nb.addEventListener('click', ()=> openRecipeForm('des'));
}

/* ══════════════════════════════════════════════════════════
   RECIPE FORM · create + edit
══════════════════════════════════════════════════════════ */
const DIET_OPTS = [
  {k:'sg', lbl:'Sin gluten'}, {k:'sl', lbl:'Sin lactosa'},
  {k:'vt', lbl:'Vegetariano'}, {k:'vg', lbl:'Vegano'},
  {k:'ps', lbl:'Pescado'}, {k:'cn', lbl:'Carne'}, {k:'lg', lbl:'Legumbres'}
];
const TIPO_OPTS = [{k:'',lbl:'—'},{k:'ligera',lbl:'☽ Ligera'},{k:'completa',lbl:'⚑ Completa'}];

function nextUserId(){
  let n = 1;
  while(DISHES['U'+n]) n++;
  return 'U'+n;
}

/* openRecipeForm, food editor y gestor de alimentos → menu-builder.js */
