/* ══════════════════════════════════════════════════════════
   SPORT CALENDAR · calendario por FECHAS REALES (hasta 1 año)
   · navegación mes a mes
   · generador de cadencia: semanal · cíclica (días) · mensual
   · varias sesiones por día · asignación ♂A / ♀B / ambos
   · suma de kcal diarias por persona (según quién entrena)
   · biblioteca de planes guardados + export JSON y PDF detallado
   depende de sport-data.js, sport-engine.js, sport-ui.js,
   openForm/closeForm (menu-forms)
══════════════════════════════════════════════════════════ */

let spCursor = (function(){ const d=spToday(); return new Date(d.getFullYear(), d.getMonth(), 1); })();

const WHO_LBL = {A:'♂', B:'♀', AB:'♂♀'};
const WHO_FULL = {A:'Solo ♂ A', B:'Solo ♀ B', AB:'♂ A + ♀ B'};

function renderSportCalendar(){
  const tEl = document.getElementById('spCalTitle');
  if(tEl && tEl.childNodes[0]) tEl.childNodes[0].nodeValue = SportPlan.name + ' ';
  renderSpCalSummary();
  renderSpCalMonth();
}

/* ── Resumen (mes visible + plan completo) ─────────────────── */
function spMonthRange(){
  const first = new Date(spCursor.getFullYear(), spCursor.getMonth(), 1);
  const last  = new Date(spCursor.getFullYear(), spCursor.getMonth()+1, 0);
  return {fromKey: spKey(first), toKey: spKey(last)};
}
function renderSpCalSummary(){
  const el = document.getElementById('spCalSummary'); if(!el) return;
  const r = spMonthRange();
  const m = planTotals(SportPlan.days, r.fromKey, r.toKey);   // mes visible
  const all = planTotals(SportPlan.days);                      // plan entero
  if(!all.sessions){
    el.innerHTML = `<div class="sp-sum empty">Plan vacío · usa <strong>⚙ Cadencia</strong> para generarlo automáticamente (días · semanas · meses, hasta 1 año), o toca un día para añadir una sesión.</div>`;
    return;
  }
  const topM = Object.keys(m.muscles).sort((a,b)=>m.muscles[b]-m.muscles[a]).slice(0,7);
  const noWeight = (typeof weightIsExplicit==='function') && !weightIsExplicit('A') && !weightIsExplicit('B');
  const weightHint = noWeight ? `<div class="sp-warn">⚖️ Para kcal precisas, indica tu <strong>peso</strong> en Ajustes ⚙ › Personas (calculadora). Ahora se usa un valor estimado.</div>` : '';
  el.innerHTML = weightHint + `<div class="sp-sum">
    <div class="sp-sum-cells">
      <div class="ssc"><b>${m.sessions}</b><i>sesiones · mes</i></div>
      <div class="ssc"><b>${Math.floor(m.min/60)}h ${m.min%60}m</b><i>volumen · mes</i></div>
      <div class="ssc nutr"><b>♂ ${m.kA}</b><i>kcal mes ♂A</i></div>
      <div class="ssc nutr"><b>♀ ${m.kB}</b><i>kcal mes ♀B</i></div>
    </div>
    <div class="sp-sum-foot">Plan completo: <strong>${all.sessions}</strong> sesiones · <strong>${Math.floor(all.min/60)}h ${all.min%60}m</strong><span class="nutr"> · ♂ ${all.kA} · ♀ ${all.kB} kcal</span></div>
    ${topM.length?`<div class="msc-row" style="margin-top:8px">${muscleChips(topM,{dot:true})}</div>`:''}
  </div>`;
}

/* ── Grid del mes visible ──────────────────────────────────── */
function renderSpCalMonth(){
  const host = document.getElementById('spCalGrid'); if(!host) return;
  const year = spCursor.getFullYear(), month = spCursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = spWeekdayMon(first);                 // celdas vacías antes del día 1
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today = spToday();

  let cells = '';
  // huecos previos
  for(let i=0;i<startOffset;i++) cells += `<div class="rc-cell pad"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const date = new Date(year, month, d);
    const key = spKey(date);
    const entries = SportPlan.days[key] || [];
    const isToday = spSameDay(date, today);
    const t = dayTotals(entries);
    const chips = entries.map((e, idx)=>{
      const s = SESSIONS[e.s]; if(!s) return '';
      const ty = EX_TYPES[s.type]||{ico:'•'};
      return `<div class="rc-s" data-key="${key}" data-idx="${idx}" title="${spEsc(s.name)}">
        <span class="rc-s-ico">${ty.ico}</span>
        <span class="rc-s-n">${spEsc(s.short||s.name)}</span>
        <span class="rc-s-who">${WHO_LBL[e.who]||'♂♀'}</span>
      </div>`;
    }).join('');
    const kcalFoot = entries.length ? `<div class="rc-kcal nutr">${t.kA?`<span>♂${t.kA}</span>`:''}${t.kB?`<span>♀${t.kB}</span>`:''}</div>` : '';
    cells += `<div class="rc-cell ${isToday?'today':''} ${entries.length?'has':''}" data-key="${key}">
      <div class="rc-dnum">${d}${isToday?'<em>hoy</em>':''}</div>
      <div class="rc-stack">${chips}</div>
      ${kcalFoot}
      <button class="rc-add" data-add="${key}" title="Añadir sesión">＋</button>
    </div>`;
  }

  host.innerHTML = `
    <div class="rc-nav">
      <button class="rc-navbtn" id="spPrev" aria-label="Mes anterior">‹</button>
      <div class="rc-month">${SP_MONTHS[month]} ${year}</div>
      <button class="rc-navbtn" id="spNext" aria-label="Mes siguiente">›</button>
      <button class="rc-today" id="spToday">Hoy</button>
    </div>
    <div class="rc-grid">
      ${SP_DAYS.map(d=>`<div class="rc-dh">${d.s}<small>${d.long.slice(0,3)}</small></div>`).join('')}
      ${cells}
    </div>`;

  document.getElementById('spPrev').addEventListener('click', ()=>{ spCursor=new Date(year, month-1, 1); renderSportCalendar(); });
  document.getElementById('spNext').addEventListener('click', ()=>{ spCursor=new Date(year, month+1, 1); renderSportCalendar(); });
  document.getElementById('spToday').addEventListener('click', ()=>{ const t=spToday(); spCursor=new Date(t.getFullYear(), t.getMonth(), 1); renderSportCalendar(); });

  host.querySelectorAll('.rc-s').forEach(c=> c.addEventListener('click', e=>{
    e.stopPropagation();
    const arr = SportPlan.days[c.dataset.key];
    if(arr && arr[+c.dataset.idx]) openSessionDetail(arr[+c.dataset.idx].s, {key:c.dataset.key, idx:+c.dataset.idx});
  }));
  host.querySelectorAll('.rc-cell:not(.pad)').forEach(cell=>{
    cell.addEventListener('click', e=>{
      if(e.target.closest('.rc-s')) return;
      openSpDayPicker(cell.dataset.key);
    });
  });
}

/* ── Picker de día (añadir/gestionar sesiones + quién) ─────── */
function whoSeg(curWho, idAttr){
  return `<div class="who-seg" ${idAttr||''}>
    ${['A','B','AB'].map(w=>`<button type="button" class="who-b ${curWho===w?'on':''}" data-who="${w}">${WHO_LBL[w]}</button>`).join('')}
  </div>`;
}
function openSpDayPicker(key){
  const date = spFromKey(key);
  const cur = SportPlan.days[key] || [];
  const ids = Object.keys(SESSIONS);
  const html = `
    <div class="form-hd"><h2>🗓️ ${spFmtLong(date)}</h2><span class="form-sub">${SP_DAYS[spWeekdayMon(date)].long} · añade una o varias sesiones e indica quién entrena</span></div>
    <div class="picker-body">
      <div class="picker-current">
        ${cur.length ? `<div class="picker-cur-list">${cur.map((e,idx)=>{const s=SESSIONS[e.s];if(!s)return'';return `<div class="picker-cur-it"><span class="pi-ico-sm">${(EX_TYPES[s.type]||{ico:'•'}).ico}</span><span class="pi-n-sm">${spEsc(s.name)}</span>${whoSeg(e.who,`data-cwho="${idx}"`)}<button class="picker-cur-info" data-info="${idx}" title="Ver ejercicios">ⓘ</button><button class="picker-cur-rm" data-rm="${idx}" title="Quitar">✕</button></div>`;}).join('')}</div>`
                       : `<div class="picker-cur-empty">Día de descanso — sin sesión asignada</div>`}
      </div>
      <div class="picker-addhd">Catálogo de sesiones</div>
      <div class="picker-list">
        ${ids.map(id=>{const s=SESSIONS[id];const t=EX_TYPES[s.type]||{ico:'•',lbl:s.type};const tt=sessionTotals(s,'A');return `<div class="picker-it" data-pick="${id}"><div class="pi-ico">${t.ico}</div><div class="pi-body"><div class="pi-n">${spEsc(s.name)}</div><div class="pi-m"><span>${t.lbl}${s.level?' · '+spEsc(s.level):''}</span><span>·</span><span>${tt.min} min · ${(s.items||[]).length} ej.</span></div></div><span class="pi-plus">＋</span></div>`;}).join('')}
      </div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="spPkRest">🛌 Descanso (vaciar)</button><button class="btn-prim" id="spPkDone">Listo</button></div>`;
  openForm(html);
  const reopen = ()=>{ persistSportPlan(); renderSportCalendar(); openSpDayPicker(key); };
  // añadir sesión (who por defecto AB)
  formBody().querySelectorAll('.picker-it').forEach(it=> it.addEventListener('click', ()=>{
    if(!SportPlan.days[key]) SportPlan.days[key]=[];
    SportPlan.days[key].push({s:it.dataset.pick, who:'AB'});
    reopen();
  }));
  // quitar
  formBody().querySelectorAll('[data-rm]').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation(); SportPlan.days[key].splice(+b.dataset.rm,1);
    if(!SportPlan.days[key].length) delete SportPlan.days[key];
    reopen();
  }));
  // ver ejercicios
  formBody().querySelectorAll('[data-info]').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation(); const idx=+b.dataset.info; const ent=SportPlan.days[key][idx];
    if(ent) openSessionDetail(ent.s, {key, idx});
  }));
  // cambiar quién entrena
  formBody().querySelectorAll('[data-cwho] .who-b').forEach(b=> b.addEventListener('click', e=>{
    e.stopPropagation(); const idx=+b.closest('[data-cwho]').dataset.cwho;
    SportPlan.days[key][idx].who = b.dataset.who; reopen();
  }));
  document.getElementById('spPkRest').addEventListener('click', ()=>{ delete SportPlan.days[key]; persistSportPlan(); closeForm(); renderSportCalendar(); });
  document.getElementById('spPkDone').addEventListener('click', ()=>{ closeForm(); renderSportCalendar(); });
}

/* ── Generador de cadencia ─────────────────────────────────── */
let _cadType = 'weekly';     // weekly · cyclic · monthly
let _cadCycle = 3;           // longitud del ciclo (cíclica)
let _cadSlots = [];          // [{idx, s, who}]

function cadPosOptions(sel){
  if(_cadType==='weekly') return SP_DAYS.map(d=>`<option value="${d.k}" ${+sel===d.k?'selected':''}>${d.long}</option>`).join('');
  if(_cadType==='cyclic') return Array.from({length:_cadCycle},(_,i)=>`<option value="${i}" ${+sel===i?'selected':''}>Día ${i+1}</option>`).join('');
  return Array.from({length:31},(_,i)=>`<option value="${i+1}" ${+sel===(i+1)?'selected':''}>Día ${i+1} del mes</option>`).join('');
}
function cadSlotRowHtml(slot, i){
  const sessOpts = Object.keys(SESSIONS).map(id=>`<option value="${id}" ${slot.s===id?'selected':''}>${spEsc(SESSIONS[id].name)}</option>`).join('');
  return `<div class="cad-slot" data-si="${i}">
    <select class="fsel cs-pos">${cadPosOptions(slot.idx)}</select>
    <select class="fsel cs-sess"><option value="">— sesión —</option>${sessOpts}</select>
    <div class="who-seg cs-who">${['A','B','AB'].map(w=>`<button type="button" class="who-b ${slot.who===w?'on':''}" data-who="${w}">${WHO_LBL[w]}</button>`).join('')}</div>
    <button type="button" class="cs-rm" title="Quitar">✕</button>
  </div>`;
}
function openSpCadence(){
  // precarga desde la última cadencia si existe
  const c = SportPlan.cadence;
  if(c){ _cadType=c.type||'weekly'; _cadCycle=c.cycleLen||3; _cadSlots=(c.slots||[]).map(s=>({idx:s.idx, s:s.s, who:s.who||'AB'})); }
  if(!_cadSlots.length) _cadSlots=[{idx:0, s:'', who:'AB'}];
  const start = (c && c.start) ? c.start : spKey(spToday());
  const rangeVal = (c && c.rangeVal) ? c.rangeVal : 4;
  const rangeUnit = (c && c.rangeUnit) ? c.rangeUnit : 'weeks';

  const html = `
    <div class="form-hd"><h2>⚙ Generador de cadencia</h2><span class="form-sub">Define el patrón y el rango. Se estampa sobre fechas reales (hasta 1 año).</span></div>
    <div class="form-body" id="cadForm">
      <div class="fgrp"><label class="flbl">Tipo de cadencia</label>
        <div class="seg-row" id="cadTypeSeg">
          <button type="button" class="seg-b ${_cadType==='weekly'?'on':''}" data-ct="weekly">Semanal</button>
          <button type="button" class="seg-b ${_cadType==='cyclic'?'on':''}" data-ct="cyclic">Cíclica (días)</button>
          <button type="button" class="seg-b ${_cadType==='monthly'?'on':''}" data-ct="monthly">Mensual</button>
        </div>
        <div class="cad-help" id="cadTypeHelp"></div>
      </div>
      <div class="fgrp" id="cadCycleWrap" style="${_cadType==='cyclic'?'':'display:none'}">
        <label class="flbl">Longitud del ciclo (días)</label>
        <input class="finp mono" type="number" id="cadCycleLen" min="2" max="14" value="${_cadCycle}">
      </div>
      <div class="frow-3">
        <div class="fgrp"><label class="flbl">Desde</label><input class="finp" type="date" id="cadStart" value="${start}"></div>
        <div class="fgrp"><label class="flbl">Duración</label><input class="finp mono" type="number" id="cadRangeVal" min="1" max="366" value="${rangeVal}"></div>
        <div class="fgrp"><label class="flbl">Unidad</label><select class="fsel" id="cadRangeUnit">
          <option value="days" ${rangeUnit==='days'?'selected':''}>días</option>
          <option value="weeks" ${rangeUnit==='weeks'?'selected':''}>semanas</option>
          <option value="months" ${rangeUnit==='months'?'selected':''}>meses</option>
        </select></div>
      </div>
      <div class="fgrp"><label class="flbl">Patrón <span class="flbl-ex">— añade varias filas para entrenar varias cosas el mismo día</span></label>
        <div id="cadSlots">${_cadSlots.map(cadSlotRowHtml).join('')}</div>
        <button type="button" class="ing-add-btn" id="cadAddSlot">＋ Añadir sesión al patrón</button>
      </div>
      <label class="flbl" style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer"><input type="checkbox" id="cadKeep"> Conservar los días que ya tengan sesiones</label>
      <div class="cad-preview" id="cadPreview"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="cadCancel">Cancelar</button><button class="btn-prim" id="cadGen">🎲 Generar plan</button></div>`;
  openForm(html);

  const readSlots = ()=>{
    const out=[];
    formBody().querySelectorAll('.cad-slot').forEach(row=>{
      const idx = +row.querySelector('.cs-pos').value;
      const s = row.querySelector('.cs-sess').value;
      const who = row.querySelector('.cs-who .who-b.on')?.dataset.who || 'AB';
      out.push({idx, s, who});
    });
    return out;
  };
  const rangeDays = ()=>{
    const v = +document.getElementById('cadRangeVal').value||1;
    const u = document.getElementById('cadRangeUnit').value;
    let days = u==='days'? v : u==='weeks'? v*7 : v*30;
    return Math.min(366, Math.max(1, days));
  };
  const updatePreview = ()=>{
    _cadSlots = readSlots();
    const valid = _cadSlots.filter(s=>s.s && SESSIONS[s.s]);
    const days = rangeDays();
    const help = {weekly:'Un patrón por día de la semana, se repite cada 7 días.', cyclic:`Un ciclo de ${_cadCycle} días que se repite ignorando el día de la semana (ideal para PPL, etc.).`, monthly:'Asignación por día del mes (1–31), se repite cada mes.'};
    document.getElementById('cadTypeHelp').textContent = help[_cadType];
    // estimación de sesiones generadas
    let est=0;
    if(_cadType==='weekly') est = Math.round(valid.length * days/7);
    else if(_cadType==='cyclic') est = Math.round(valid.length * days/_cadCycle);
    else est = Math.round(valid.length * days/30);
    document.getElementById('cadPreview').innerHTML = valid.length
      ? `≈ <strong>${est}</strong> sesiones en <strong>${days}</strong> días (desde ${spFmtLong(spFromKey(document.getElementById('cadStart').value))})`
      : `<span style="color:var(--rose)">Añade al menos una sesión al patrón.</span>`;
  };
  const rerenderSlots = ()=>{
    _cadSlots = readSlots();
    document.getElementById('cadSlots').innerHTML = _cadSlots.map(cadSlotRowHtml).join('');
    wireSlots(); updatePreview();
  };
  const wireSlots = ()=>{
    formBody().querySelectorAll('.cad-slot').forEach(row=>{
      row.querySelectorAll('select').forEach(el=> el.addEventListener('input', updatePreview));
      row.querySelectorAll('.cs-who .who-b').forEach(b=> b.addEventListener('click', ()=>{ row.querySelectorAll('.cs-who .who-b').forEach(x=>x.classList.toggle('on', x===b)); }));
      row.querySelector('.cs-rm').addEventListener('click', ()=>{ if(formBody().querySelectorAll('.cad-slot').length>1){ row.remove(); updatePreview(); } });
    });
  };
  formBody().querySelectorAll('#cadTypeSeg .seg-b').forEach(b=> b.addEventListener('click', ()=>{
    _cadType=b.dataset.ct;
    formBody().querySelectorAll('#cadTypeSeg .seg-b').forEach(x=>x.classList.toggle('on', x===b));
    document.getElementById('cadCycleWrap').style.display = _cadType==='cyclic'?'':'none';
    rerenderSlots();
  }));
  document.getElementById('cadCycleLen').addEventListener('input', ()=>{ _cadCycle=Math.min(14,Math.max(2,+document.getElementById('cadCycleLen').value||3)); rerenderSlots(); });
  document.getElementById('cadAddSlot').addEventListener('click', ()=>{ _cadSlots=readSlots(); _cadSlots.push({idx:0,s:'',who:'AB'}); document.getElementById('cadSlots').insertAdjacentHTML('beforeend', cadSlotRowHtml({idx:0,s:'',who:'AB'}, _cadSlots.length-1)); wireSlots(); updatePreview(); });
  ['cadStart','cadRangeVal','cadRangeUnit'].forEach(id=> document.getElementById(id).addEventListener('input', updatePreview));
  document.getElementById('cadCancel').addEventListener('click', closeForm);
  document.getElementById('cadGen').addEventListener('click', ()=>{
    const slots = readSlots().filter(s=>s.s && SESSIONS[s.s]);
    if(!slots.length){ alert('Añade al menos una sesión al patrón.'); return; }
    const cfg = {type:_cadType, cycleLen:_cadCycle, start:document.getElementById('cadStart').value, rangeUnit:document.getElementById('cadRangeUnit').value, rangeVal:+document.getElementById('cadRangeVal').value||1, slots};
    generateSportPlan(cfg, document.getElementById('cadKeep').checked);
    closeForm();
    spCursor = new Date(spFromKey(cfg.start).getFullYear(), spFromKey(cfg.start).getMonth(), 1);
    renderSportCalendar();
  });
  wireSlots(); updatePreview();
}

/* ── PLAN AUTOMÁTICO (asistente) ────────────────────────────
   Detalla deporte, días/semana, reparto (split), duración e
   intensidad → genera una sesión DISTINTA por día de entreno y
   las estampa como cadencia semanal sobre fechas reales.
══════════════════════════════════════════════════════════ */
const AP_DAYSETS = {1:[2], 2:[1,3], 3:[0,2,4], 4:[0,1,3,4], 5:[0,1,2,3,4], 6:[0,1,2,3,4,5], 7:[0,1,2,3,4,5,6]};
const AP_SPLITS = {
  fullbody: {lbl:'Full body', slots:[{l:'Full body', m:['cuadriceps','gluteo','pecho','espalda','core']}]},
  torso_pierna: {lbl:'Torso / Pierna', slots:[
    {l:'Torso', m:['pecho','espalda','hombro','biceps','triceps','core']},
    {l:'Pierna', m:['cuadriceps','isquios','gluteo','gemelo','core']}]},
  ppl: {lbl:'Empuje / Tirón / Pierna', slots:[
    {l:'Empuje', m:['pecho','hombro','triceps','core']},
    {l:'Tirón', m:['espalda','biceps','antebrazo','core']},
    {l:'Pierna', m:['cuadriceps','isquios','gluteo','gemelo','core']}]},
  cardio: {lbl:'Cardio / resistencia', slots:[{l:'Cardio', m:['cardio','cuadriceps','gluteo','isquios','gemelo','core']}]},
  personalizado: {lbl:'Personalizado', slots:null}
};
let _apMuscles = ['pecho','espalda','cuadriceps','gluteo','core'];

function openSpAutoPlan(){
  const c = SportPlan.cadence;
  const start = (c && c.start) ? c.start : spKey(spToday());
  const html = `
    <div class="form-hd"><h2>🧠 Plan automático</h2><span class="form-sub">Genera un programa con una sesión distinta cada día de entreno</span></div>
    <div class="form-body" id="apForm">
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Deporte / contexto</label>
          <select class="fsel" id="apDisc">${Object.entries(EX_SPORTS).map(([k,v])=>`<option value="${k}" ${k==='gimnasio'?'selected':''}>${v.ico} ${v.lbl}</option>`).join('')}<option value="all">🏅 Cualquiera</option></select></div>
        <div class="fgrp"><label class="flbl">Días por semana</label>
          <select class="fsel" id="apDays">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${n===4?'selected':''}>${n} día${n>1?'s':''}/semana</option>`).join('')}</select></div>
      </div>
      <div class="fgrp"><label class="flbl">Reparto (qué se trabaja cada día)</label>
        <select class="fsel" id="apSplit">${Object.entries(AP_SPLITS).map(([k,v])=>`<option value="${k}">${v.lbl}</option>`).join('')}</select>
      </div>
      <div class="fgrp" id="apMuscWrap" style="display:none"><label class="flbl">Músculos a repartir entre los días</label>
        <div class="fchips" id="apMuscles">${Object.entries(EX_MUSCLES).map(([k,v])=>`<button type="button" class="fchip ${_apMuscles.includes(k)?'on':''}" data-m="${k}">${v.lbl}</button>`).join('')}</div>
      </div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Duración/sesión (min)</label><input class="finp mono" type="number" id="apDur" min="15" max="120" step="5" value="50"></div>
        <div class="fgrp"><label class="flbl">Intensidad</label>
          <div class="seg-row" id="apInten">${Object.entries(SP_INTENSITY).map(([k,v])=>`<button type="button" class="seg-b ${k==='media'?'on':''}" data-int="${k}">${v.lbl}</button>`).join('')}</div></div>
      </div>
      <div class="fgrp"><label class="flbl">Quién entrena</label>${whoSeg('AB','data-apwho')}</div>
      <div class="frow-3">
        <div class="fgrp"><label class="flbl">Desde</label><input class="finp" type="date" id="apStart" value="${start}"></div>
        <div class="fgrp"><label class="flbl">Duración</label><input class="finp mono" type="number" id="apRangeVal" min="1" max="366" value="8"></div>
        <div class="fgrp"><label class="flbl">Unidad</label><select class="fsel" id="apRangeUnit"><option value="weeks" selected>semanas</option><option value="months">meses</option></select></div>
      </div>
      <label class="flbl" style="display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer"><input type="checkbox" id="apKeep"> Conservar los días que ya tengan sesiones</label>
      <div class="cad-preview" id="apPreview"></div>
    </div>
    <div class="form-actions"><button class="btn-sec" id="apCancel">Cancelar</button><button class="btn-prim" id="apRun">🧠 Generar plan</button></div>`;
  openForm(html);
  const splitSel = document.getElementById('apSplit');
  const updateMuscVis = ()=>{ document.getElementById('apMuscWrap').style.display = splitSel.value==='personalizado'?'':'none'; updatePreview(); };
  const updatePreview = ()=>{
    const days=+document.getElementById('apDays').value; const u=document.getElementById('apRangeUnit').value; const v=+document.getElementById('apRangeVal').value||1;
    const weeks = u==='months'? Math.round(v*30/7) : v;
    document.getElementById('apPreview').innerHTML = `Generará <strong>${days}</strong> sesiones distintas/semana durante <strong>${Math.min(53,weeks)}</strong> semanas (≈ <strong>${Math.min(366, days*Math.min(53,weeks))}</strong> entrenos).`;
  };
  splitSel.addEventListener('change', updateMuscVis);
  ['apDays','apRangeVal','apRangeUnit'].forEach(id=> document.getElementById(id).addEventListener('input', updatePreview));
  formBody().querySelectorAll('#apMuscles .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));
  formBody().querySelectorAll('#apInten .seg-b').forEach(b=> b.addEventListener('click', ()=> formBody().querySelectorAll('#apInten .seg-b').forEach(x=>x.classList.toggle('on', x===b))));
  formBody().querySelectorAll('[data-apwho] .who-b').forEach(b=> b.addEventListener('click', ()=> formBody().querySelectorAll('[data-apwho] .who-b').forEach(x=>x.classList.toggle('on', x===b))));
  document.getElementById('apCancel').addEventListener('click', closeForm);
  document.getElementById('apRun').addEventListener('click', ()=> runAutoPlan());
  updateMuscVis();
}

/* runAutoPlan() lee del formulario "Plan auto".
   runAutoPlan(P) usa los parámetros de P (lo usa el Asistente de entrenamiento),
   con P = {disc, nDays, splitKey, dur, intensity, who, start, u, rangeVal, keep, muscles}. */
function runAutoPlan(P){
  P = (P && typeof P === 'object' && typeof P.splitKey === 'string') ? P : null;
  const disc = P ? P.disc : document.getElementById('apDisc').value;
  const nDays = P ? (+P.nDays||4) : (+document.getElementById('apDays').value || 4);
  const splitKey = P ? P.splitKey : document.getElementById('apSplit').value;
  const dur = Math.min(120, Math.max(15, P ? (+P.dur||50) : (+document.getElementById('apDur').value||50)));
  const intensity = P ? (P.intensity||'media') : (formBody().querySelector('#apInten .seg-b.on')?.dataset.int || 'media');
  const who = P ? (P.who||'AB') : (formBody().querySelector('[data-apwho] .who-b.on')?.dataset.who || 'AB');
  const start = P ? P.start : document.getElementById('apStart').value;
  const u = P ? (P.u||'weeks') : document.getElementById('apRangeUnit').value;
  const rangeVal = P ? (+P.rangeVal||8) : (+document.getElementById('apRangeVal').value || 8);
  const keep = P ? !!P.keep : document.getElementById('apKeep').checked;

  // 1) slots de reparto
  let slots;
  if(splitKey==='personalizado'){
    const ms = P ? (P.muscles||[]) : [...formBody().querySelectorAll('#apMuscles .fchip.on')].map(b=>b.dataset.m);
    if(!ms.length){ alert('Elige al menos un músculo para repartir.'); return; }
    _apMuscles = ms;
    // reparte los músculos entre los días (round-robin); cada día ≥3 músculos
    slots = Array.from({length:nDays},(_,i)=>({l:`Día ${i+1}`, m:[]}));
    ms.forEach((m,idx)=> slots[idx%nDays].m.push(m));
    slots.forEach(s=>{ if(s.m.length<3) s.m=[...new Set([...s.m,'core',...ms])].slice(0,5); });
  } else {
    const base = AP_SPLITS[splitKey].slots;
    slots = Array.from({length:nDays},(_,i)=> base[i%base.length]);
  }

  // 2) días de la semana
  const weekdays = AP_DAYSETS[nDays] || AP_DAYSETS[4];

  // 3) genera una sesión distinta por día y construye la cadencia
  const cfgSlots = [];
  const discLbl = (EX_SPORTS[disc]||{}).lbl || '';
  let failed = 0;
  weekdays.forEach((wd, i)=>{
    const slot = slots[i] || slots[slots.length-1];
    let sess = buildSessionByCriteria(slot.m, dur, intensity, disc);
    if(!sess) sess = buildSessionByCriteria(slot.m, dur, intensity, 'all');   // fallback sin filtro de deporte
    if(!sess){ failed++; return; }
    sess.name = `${discLbl?discLbl+' · ':''}${slot.l} · ${SP_DAYS[wd].long}`;
    sess.level = `Plan auto · ${(SP_INTENSITY[intensity]||{}).lbl.toLowerCase()}`;
    const id = nextSpId('auto_'+slot.l, SESSIONS);
    SESSIONS[id] = sess;
    cfgSlots.push({idx:wd, s:id, who});
  });
  if(!cfgSlots.length){ alert('No se han podido generar sesiones con esos criterios. Prueba otro deporte o músculos.'); return; }
  persistSessions();

  // 4) cadencia semanal + generación sobre fechas
  const cfg = {type:'weekly', cycleLen:7, start, rangeUnit:u, rangeVal, slots:cfgSlots};
  SportPlan.name = `${discLbl||'Entreno'} · ${AP_SPLITS[splitKey].lbl} · ${nDays}d/sem`;
  generateSportPlan(cfg, keep);
  closeForm();
  spCursor = new Date(spFromKey(start).getFullYear(), spFromKey(start).getMonth(), 1);
  renderSportCalendar();
  if(typeof renderSportActive==='function') renderSportActive();
  alert(`✓ Plan generado: ${cfgSlots.length} sesiones distintas por semana${failed?` (${failed} día/s sin candidatos)`:''}.`);
}

function generateSportPlan(cfg, keep){
  SportPlan.cadence = cfg;
  const start = spFromKey(cfg.start); start.setHours(0,0,0,0);
  let days = cfg.rangeUnit==='days'? cfg.rangeVal : cfg.rangeUnit==='weeks'? cfg.rangeVal*7 : cfg.rangeVal*30;
  days = Math.min(366, Math.max(1, days));
  // patrón idx → entradas
  const pat = {};
  cfg.slots.forEach(sl=>{ (pat[sl.idx] = pat[sl.idx] || []).push({s:sl.s, who:sl.who||'AB'}); });
  for(let i=0;i<days;i++){
    const date = spAddDays(start, i);
    const key = spKey(date);
    let idx;
    if(cfg.type==='weekly') idx = spWeekdayMon(date);
    else if(cfg.type==='cyclic') idx = i % (cfg.cycleLen||1);
    else idx = date.getDate();
    const entries = pat[idx];
    if(!entries) continue;
    if(keep && SportPlan.days[key] && SportPlan.days[key].length) continue;
    SportPlan.days[key] = entries.map(e=>({s:e.s, who:e.who}));
  }
  persistSportPlan();
}

/* ── Acciones de toolbar ─────────────────────────────────── */
async function spCalClear(){
  if(!Object.keys(SportPlan.days).length){ pnAlert('El plan ya está vacío.'); return; }
  if(!await pnConfirm('¿Vaciar TODO el plan de entrenamiento?', {danger:true, okText:'Vaciar'})) return;
  SportPlan.days = {}; persistSportPlan(); renderSportCalendar();
}
function spCalRename(){
  const cur = SportPlan.name;
  const html = `
    <div class="form-hd"><h2>Nombre del plan</h2><span class="form-sub">Plan de entrenamiento</span></div>
    <div class="form-body"><div class="fgrp"><label class="flbl">Nombre</label><input class="finp" id="spRenameInp" value="${spEsc(cur)}"></div></div>
    <div class="form-actions"><button class="btn-sec" id="spRenameCancel">Cancelar</button><button class="btn-prim" id="spRenameOk">Guardar</button></div>`;
  openForm(html);
  const inp=document.getElementById('spRenameInp'); setTimeout(()=>{inp.focus();inp.select();},50);
  document.getElementById('spRenameCancel').addEventListener('click', closeForm);
  const ok=()=>{ const n=(inp.value||'').trim(); if(n){ SportPlan.name=n; persistSportPlan(); } closeForm(); renderSportCalendar(); };
  document.getElementById('spRenameOk').addEventListener('click', ok);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();ok();} });
}

/* ── Biblioteca de planes guardados ───────────────────────── */
function spCalSave(){
  const html = `
    <div class="form-hd"><h2>💾 Guardar plan</h2><span class="form-sub">Se añade a tu biblioteca de entrenamientos</span></div>
    <div class="form-body"><div class="fgrp"><label class="flbl">Nombre</label><input class="finp" id="spSaveInp" value="${spEsc(SportPlan.name)}" placeholder="Ej. Bloque fuerza · verano"></div></div>
    <div class="form-actions"><button class="btn-sec" id="spSaveCancel">Cancelar</button><button class="btn-prim" id="spSaveOk">Guardar</button></div>`;
  openForm(html);
  const inp=document.getElementById('spSaveInp'); setTimeout(()=>{inp.focus();inp.select();},50);
  document.getElementById('spSaveCancel').addEventListener('click', closeForm);
  const ok=()=>{
    const n=(inp.value||'').trim(); if(!n){ alert('Pon un nombre'); return; }
    const saved=getSavedPlans();
    const id = 'p'+Date.now();
    saved[id]={name:n, date:spKey(spToday()), plan:{name:n, days:JSON.parse(JSON.stringify(SportPlan.days)), cadence:SportPlan.cadence}};
    setSavedPlans(saved);
    closeForm();
    alert('✓ Plan guardado en la biblioteca.');
  };
  document.getElementById('spSaveOk').addEventListener('click', ok);
  inp.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();ok();} });
}
function spCalLibrary(){
  const saved=getSavedPlans();
  const ids=Object.keys(saved).sort((a,b)=> (saved[b].date||'').localeCompare(saved[a].date||''));
  const list = ids.length ? ids.map(id=>{
    const p=saved[id]; const t=planTotals(p.plan.days);
    return `<div class="lib-it"><div class="lib-main" data-load="${id}">
        <div class="lib-n">${spEsc(p.name)}</div>
        <div class="lib-m">${t.sessions} sesiones · ${Math.floor(t.min/60)}h ${t.min%60}m · ♂${t.kA}/♀${t.kB} kcal · guardado ${spEsc(p.date||'')}</div>
      </div><button class="lib-rm" data-del="${id}" title="Eliminar">🗑</button></div>`;
  }).join('') : `<div class="sp-empty">No hay planes guardados todavía.</div>`;
  const html = `
    <div class="form-hd"><h2>📂 Biblioteca de planes</h2><span class="form-sub">Carga o elimina entrenamientos guardados</span></div>
    <div class="form-body"><div class="lib-list">${list}</div></div>
    <div class="form-actions"><button class="btn-prim" id="libClose">Cerrar</button></div>`;
  openForm(html);
  document.getElementById('libClose').addEventListener('click', closeForm);
  formBody().querySelectorAll('[data-load]').forEach(b=> b.addEventListener('click', async ()=>{
    const p=saved[b.dataset.load]; if(!p) return;
    if(!await pnConfirm(`¿Cargar "${p.name}"?\nReemplaza el plan actual (guárdalo antes si quieres conservarlo).`, {okText:'Cargar'})) return;
    SportPlan.name=p.plan.name||p.name; SportPlan.days=JSON.parse(JSON.stringify(p.plan.days||{})); SportPlan.cadence=p.plan.cadence||null;
    cleanSportPlan(); persistSportPlan(); closeForm(); renderSportCalendar();
  }));
  formBody().querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', async e=>{
    e.stopPropagation(); if(!await pnConfirm('¿Eliminar este plan guardado?', {danger:true, okText:'Eliminar'})) return;
    const did=b.dataset.del; const s=getSavedPlans(); const snap=JSON.parse(JSON.stringify(s[did])); delete s[did]; setSavedPlans(s); spCalLibrary();
    if(typeof showUndo==='function') showUndo('Plan guardado eliminado', ()=>{ const s2=getSavedPlans(); s2[did]=snap; setSavedPlans(s2); spCalLibrary(); });
  }));
}

/* ── Export JSON ──────────────────────────────────────────── */
function spCalExportJson(){
  const payload = {kind:'sport-plan', version:2, name:SportPlan.name, cadence:SportPlan.cadence, days:SportPlan.days,
    exercises:Object.fromEntries(Object.entries(EXERCISES).filter(([id])=>EXERCISES[id].user)),
    sessions:Object.fromEntries(Object.entries(SESSIONS).filter(([id])=>SESSIONS[id].user)) };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=`entreno-${(SportPlan.name||'plan').replace(/[^a-z0-9-_ ]/gi,'').replace(/\s+/g,'_')||'plan'}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

/* ── Export PDF (calendario + sesiones pormenorizadas) ────── */
function spCalExportPdf(){
  const html = buildSportPrintHtml();
  if(typeof pnPrintDoc === 'function') pnPrintDoc(html);
  else { const w=window.open('','_blank'); if(w){ w.document.open(); w.document.write(html); w.document.close(); } }
}
function buildSportPrintHtml(){
  const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const keys = Object.keys(SportPlan.days).sort();
  const used = [];
  keys.forEach(k=> (SportPlan.days[k]||[]).forEach(e=>{ if(!used.includes(e.s) && SESSIONS[e.s]) used.push(e.s); }));
  const all = planTotals(SportPlan.days);

  // calendarios por mes (sólo meses con contenido)
  const months = [];
  keys.forEach(k=>{ const d=spFromKey(k); const tag=`${d.getFullYear()}-${d.getMonth()}`; if(!months.find(m=>m.tag===tag)) months.push({tag, y:d.getFullYear(), m:d.getMonth()}); });
  const monthTables = months.map(mo=>{
    const first=new Date(mo.y,mo.m,1); const off=spWeekdayMon(first); const dim=new Date(mo.y,mo.m+1,0).getDate();
    let cellsArr=[]; for(let i=0;i<off;i++) cellsArr.push('<td class="pad"></td>');
    for(let d=1;d<=dim;d++){
      const key=spKey(new Date(mo.y,mo.m,d)); const ents=SportPlan.days[key]||[];
      const inner = ents.map(e=>{const s=SESSIONS[e.s];if(!s)return'';return `<div class="pc-s"><b>${esc(s.short||s.name)}</b><span>${WHO_LBL[e.who]||'♂♀'}</span></div>`;}).join('');
      cellsArr.push(`<td class="${ents.length?'on':''}"><span class="pc-d">${d}</span>${inner}</td>`);
    }
    while(cellsArr.length%7) cellsArr.push('<td class="pad"></td>');
    let rows=''; for(let i=0;i<cellsArr.length;i+=7) rows+=`<tr>${cellsArr.slice(i,i+7).join('')}</tr>`;
    const mt = planTotals(SportPlan.days, spKey(first), spKey(new Date(mo.y,mo.m,dim)));
    return `<div class="month-blk"><h3>${SP_MONTHS[mo.m]} ${mo.y} <small>${mt.sessions} sesiones · ${Math.floor(mt.min/60)}h ${mt.min%60}m · ♂${mt.kA}/♀${mt.kB} kcal</small></h3>
      <table class="cal"><thead><tr>${SP_DAYS.map(d=>`<th>${d.long.slice(0,3)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');

  function sessBlock(id){
    const s=SESSIONS[id]; const tA=sessionTotals(s,'A'), tB=sessionTotals(s,'B');
    const rows=(s.items||[]).map(it=>{ const ex=EXERCISES[it.e]; if(!ex) return ''; return `<tr><td class="ex-n">${esc(ex.name)}</td><td>${itemScheme(it)}</td><td>${(ex.muscles||[]).map(m=>(EX_MUSCLES[m]||{}).lbl||m).join(', ')}</td><td class="ex-c">${esc(ex.cues||'')}</td></tr>`; }).join('');
    return `<div class="sess-block"><h3>${esc(s.name)} <small>${(EX_TYPES[s.type]||{lbl:s.type}).lbl}${s.level?' · '+esc(s.level):''} · ${tA.min} min · ♂${tA.kcal}/♀${tB.kcal} kcal</small></h3>
      ${s.focus?`<p class="warm"><b>Enfoque:</b> ${esc(s.focus)}</p>`:''}
      ${s.warmup?`<p class="warm"><b>Calentamiento:</b> ${esc(s.warmup)}</p>`:''}
      <table class="ex-tbl"><thead><tr><th>Ejercicio</th><th>Series</th><th>Músculos</th><th>Técnica / instrucciones</th></tr></thead><tbody>${rows}</tbody></table>
      ${s.notes?`<p class="notes"><b>Notas:</b> ${esc(s.notes)}</p>`:''}</div>`;
  }

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${esc(SportPlan.name)}</title>
  <style>
    @page{size:A4;margin:13mm}
    *{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#2C1F0E;margin:0}
    h1{font-size:22pt;margin:0 0 2mm} .sub{font-family:monospace;font-size:8pt;letter-spacing:.1em;text-transform:uppercase;color:#8a7a5a;margin-bottom:5mm}
    .mtot{display:flex;gap:4mm;font-family:monospace;font-size:9pt;margin-bottom:6mm;flex-wrap:wrap}
    .mtot span{background:#F3ECDB;padding:2mm 4mm;border-radius:2mm}
    .month-blk{margin-bottom:6mm;page-break-inside:avoid} .month-blk h3{font-size:12.5pt;margin:0 0 2mm}
    .month-blk h3 small{font-family:monospace;font-size:7.5pt;color:#8a7a5a;font-weight:normal}
    table.cal{width:100%;border-collapse:collapse;table-layout:fixed}
    table.cal th,table.cal td{border:.4pt solid #c9bfa6;padding:1.4mm;vertical-align:top;font-size:7pt;height:17mm}
    table.cal thead th{background:#2C1F0E;color:#fff;height:auto;font-family:monospace;font-size:7pt;text-transform:uppercase}
    table.cal td.pad{background:#faf7ef;border-color:#e5ddc8}
    table.cal td.on{background:#EEF2E2}
    .pc-d{font-family:monospace;font-size:7pt;color:#8a7a5a;display:block;margin-bottom:.6mm}
    .pc-s{background:#fff;border-radius:1.2mm;padding:.8mm 1.2mm;margin-bottom:.8mm;display:flex;justify-content:space-between;gap:1mm}
    .pc-s b{font-size:6.6pt;font-weight:bold;overflow:hidden} .pc-s span{font-size:6.2pt;color:#7a3a1f}
    h2.sec{font-size:14pt;border-bottom:1.5pt solid #C8742E;padding-bottom:1.5mm;margin:6mm 0 3mm;page-break-before:always}
    .sess-block{margin-bottom:6mm;page-break-inside:avoid}
    .sess-block h3{font-size:12pt;margin:0 0 1.5mm} .sess-block h3 small{font-family:monospace;font-size:7.5pt;color:#8a7a5a;font-weight:normal}
    .warm,.notes{font-size:8.5pt;margin:1.5mm 0}
    table.ex-tbl{width:100%;border-collapse:collapse;margin-top:1.5mm} table.ex-tbl th,table.ex-tbl td{border:.4pt solid #d8cfb8;padding:1.4mm 1.8mm;font-size:8pt;text-align:left;vertical-align:top}
    table.ex-tbl thead th{background:#F3ECDB;font-family:monospace;font-size:7pt;text-transform:uppercase} .ex-tbl .ex-n{font-weight:bold;width:24%} .ex-tbl .ex-c{width:38%;font-size:7.4pt;color:#5a4a30}
  </style></head><body>
    <h1>${esc(SportPlan.name)}</h1>
    <div class="sub">Plan de entrenamiento · calendario por fechas</div>
    <div class="mtot"><span>${all.sessions} sesiones</span><span>${Math.floor(all.min/60)} h ${all.min%60} min</span><span>♂ ${all.kA} kcal · ♀ ${all.kB} kcal</span></div>
    ${monthTables || '<p>Sin sesiones programadas.</p>'}
    ${used.length?`<h2 class="sec">Sesiones detalladas</h2>${used.map(sessBlock).join('')}`:''}
  </body></html>`;
}

/* ── BIND toolbar ────────────────────────────────────────── */
(function bindSpCalToolbar(){
  const b=(id,fn)=>{ const el=document.getElementById(id); if(el) el.addEventListener('click', fn); };
  b('spCalAuto', openSpAutoPlan);
  b('spCalCadence', openSpCadence);
  b('spCalGen', ()=>{ if(!SportPlan.cadence){ openSpCadence(); return; } generateSportPlan(SportPlan.cadence, true); renderSportCalendar(); });
  b('spCalSave', spCalSave);
  b('spCalLib', spCalLibrary);
  b('spCalClear', spCalClear);
  b('spCalPdf', spCalExportPdf);
  b('spCalJson', spCalExportJson);
  b('spCalRename', spCalRename);
})();

window.renderSportCalendar = renderSportCalendar;
