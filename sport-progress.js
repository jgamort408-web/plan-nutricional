/* ══════════════════════════════════════════════════════════
   SPORT PROGRESS · pantalla de progreso
   Lee `sport:log:v1` y muestra:
     · resumen del periodo (entrenos, racha, tonelaje, tiempo)
     · volumen semanal por grupo muscular vs. rango recomendado
     · curva de fuerza por ejercicio (1RM estimado) en SVG
     · récords personales
     · historial completo, editable y borrable
   Sin librerías externas: las gráficas son SVG generado a mano.

   depende de sport-log.js, sport-data.js, pnConfirm/pnToast
══════════════════════════════════════════════════════════ */

var _pgWho    = 'A';
var _pgRange  = 30;                      // días hacia atrás
var _pgExSel  = null;                    // ejercicio de la curva de fuerza
var _pgOpen   = {};                      // entradas del historial desplegadas

function pgFrom(days){ return spKey(spAddDays(new Date(), -(days-1))); }
function pgToday(){ return spKey(new Date()); }

/* Nombre corto de cada persona para el selector.
   Los nombres por defecto son "Persona A"/"Persona B": quedarse con la
   primera palabra dejaba dos botones iguales ("Persona"/"Persona"), así
   que se usa la última si la primera se repite. */
function pgWhoLabel(w){
  const nm = ((typeof TARGETS!=='undefined' && TARGETS[w] && TARGETS[w].name) || '').toString().trim();
  if(!nm) return w;
  const parts = nm.split(/\s+/);
  if(parts.length === 1) return parts[0].slice(0, 12);
  const other = ((typeof TARGETS!=='undefined' && TARGETS[w==='A'?'B':'A'] && TARGETS[w==='A'?'B':'A'].name) || '').toString().trim();
  const otherFirst = other.split(/\s+/)[0];
  return (parts[0] === otherFirst ? parts[parts.length-1] : parts[0]).slice(0, 12);
}

/* ── Gráfica de líneas (1RM estimado) ─────────────────────── */
function pgLineChart(points, opts){
  opts = opts || {};
  const W = 320, H = 140, PL = 34, PR = 8, PT = 12, PB = 20;
  if(points.length < 2){
    return `<div class="pg-empty-chart">Necesitas al menos 2 registros con carga para ver la evolución.</div>`;
  }
  const xs = points.map(p=> spFromKey(p.date).getTime());
  const ys = points.map(p=> p.rm);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1-y0) * 0.15 || Math.max(2, y1*0.05);
  y0 = Math.max(0, y0-pad); y1 = y1+pad;
  const sx = t=> PL + ((t-x0)/((x1-x0)||1)) * (W-PL-PR);
  const sy = v=> PT + (1-(v-y0)/((y1-y0)||1)) * (H-PT-PB);

  const d = points.map((p,i)=> `${i?'L':'M'}${sx(xs[i]).toFixed(1)},${sy(p.rm).toFixed(1)}`).join(' ');
  const area = `${d} L${sx(x1).toFixed(1)},${(H-PB).toFixed(1)} L${sx(x0).toFixed(1)},${(H-PB).toFixed(1)} Z`;
  const gridY = [y0, (y0+y1)/2, y1].map(v=>
    `<line x1="${PL}" y1="${sy(v).toFixed(1)}" x2="${W-PR}" y2="${sy(v).toFixed(1)}" class="pg-grid"/>
     <text x="${PL-5}" y="${(sy(v)+3.5).toFixed(1)}" class="pg-axis" text-anchor="end">${Math.round(v)}</text>`).join('');
  const dots = points.map((p,i)=>
    `<circle cx="${sx(xs[i]).toFixed(1)}" cy="${sy(p.rm).toFixed(1)}" r="3.2" class="pg-dot"><title>${p.date} · ${p.kg} kg × ${p.reps} → 1RM ≈ ${p.rm} kg</title></circle>`).join('');
  const first = points[0], last = points[points.length-1];
  const delta = Math.round((last.rm - first.rm)*10)/10;
  const pct = first.rm ? Math.round((delta/first.rm)*100) : 0;

  return `
    <svg class="pg-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Evolución de fuerza">
      ${gridY}
      <path d="${area}" class="pg-area"/>
      <path d="${d}" class="pg-line"/>
      ${dots}
    </svg>
    <div class="pg-chart-foot">
      <span>${first.date}</span>
      <b class="${delta>=0?'up':'down'}">${delta>=0?'▲':'▼'} ${Math.abs(delta)} kg (${delta>=0?'+':''}${pct}%)</b>
      <span>${last.date}</span>
    </div>`;
}

/* ── Barras de volumen por músculo ────────────────────────── */
function pgVolumeBars(vol, weeks){
  const ms = Object.keys(vol).filter(m=> vol[m] > 0)
                   .sort((a,b)=> vol[b]-vol[a]);
  if(!ms.length) return `<div class="pg-empty-chart">Aún no hay series registradas en este periodo.</div>`;
  const perWeek = m=> Math.round((vol[m]/Math.max(1,weeks))*10)/10;
  const max = Math.max(SP_VOL_TARGET.max + 4, ...ms.map(perWeek));
  return `<div class="pg-bars">${ms.map(m=>{
    const mm = EX_MUSCLES[m] || {lbl:m, c:'#888'};
    const v  = perWeek(m);
    const w  = Math.max(2, (v/max)*100);
    const lo = (SP_VOL_TARGET.min/max)*100, hi = (SP_VOL_TARGET.max/max)*100;
    const state = v < SP_VOL_TARGET.min ? 'low' : v > SP_VOL_TARGET.max ? 'high' : 'ok';
    return `<div class="pg-bar-row">
      <span class="pg-bar-lbl">${spEsc(mm.lbl)}</span>
      <div class="pg-bar-track">
        <i class="pg-bar-zone" style="left:${lo}%;width:${Math.max(0,hi-lo)}%"></i>
        <i class="pg-bar-fill ${state}" style="width:${w}%;--bc:${mm.c}"></i>
      </div>
      <span class="pg-bar-v mono ${state}">${v}</span>
    </div>`;
  }).join('')}
  <div class="pg-bars-key">Series efectivas por semana · la franja marca el rango recomendado (${SP_VOL_TARGET.min}–${SP_VOL_TARGET.max})</div>
  </div>`;
}

/* ── Tarjeta de una entrada del historial ─────────────────── */
function pgEntryCard(e){
  const open = !!_pgOpen[e.id];
  const d = spFromKey(e.date);
  const feel = ['','😫','😕','🙂','💪','🔥'][e.feel||0] || '';
  return `<article class="pg-entry ${open?'open':''}" data-eid="${e.id}">
    <button class="pg-entry-hd" data-toggle="${e.id}">
      <span class="pg-e-date"><b>${d.getDate()}</b><i>${SP_MONTHS[d.getMonth()].slice(0,3)}</i></span>
      <span class="pg-e-mid">
        <b>${spEsc(e.sessName||'Entrenamiento')}</b>
        <span>${(()=>{ const n=logSetCount(e), tn=logTonnage(e), di=(typeof logDistanceOf==='function')?logDistanceOf(e):0, kc=(+e.kcal||((typeof logEntryKcal==='function')?logEntryKcal(e):0));
          return `${n} ${n===1?'serie':'series'}${tn?` · ${tn.toLocaleString('es-ES')} kg`:''}${di?` · ${logFmtDist(di)}`:''} · ${trFmtClock(e.durSec||0)}${kc?` · ${kc} kcal`:''}`; })()}</span>
      </span>
      <span class="pg-e-feel">${feel}</span>
      <span class="pg-e-caret">${open?'▾':'▸'}</span>
    </button>
    ${open ? `<div class="pg-entry-body">
      ${(e.ex||[]).map(x=>{
        const ex = EXERCISES[x.e] || {name:x.e};
        return `<div class="pg-e-ex">
          <b>${spEsc(ex.name)}</b>
          <div class="pg-e-sets">${(x.sets||[]).map(s=>
            `<span class="pg-e-set mono">${(typeof logSetLabel==='function')?logSetLabel(x,s):((s.kg?s.kg+'×':'')+(s.reps||0))}${s.rpe?` <i>@${s.rpe}</i>`:''}</span>`).join('')}</div>
        </div>`;
      }).join('')}
      ${e.notes ? `<p class="pg-e-notes">📝 ${spEsc(e.notes)}</p>` : ''}
      <div class="pg-e-acts"><button class="btn-sec sm" data-del="${e.id}">🗑️ Borrar</button></div>
    </div>` : ''}
  </article>`;
}

/* ── Render principal ─────────────────────────────────────── */
function renderProgress(){
  const host = document.getElementById('sportview-prog');
  if(!host) return;

  const from = pgFrom(_pgRange), to = pgToday();
  const sum  = logSummary(from, to, _pgWho);
  const all  = logFor(_pgWho);
  const weeks = Math.max(1, Math.round(_pgRange/7));
  const vol  = logVolumeByMuscle(from, to, _pgWho);
  const prs  = logPRs(_pgWho).slice(0, 8);
  const tracked = logTrackedExercises(_pgWho, 2);
  if(_pgExSel && !tracked.includes(_pgExSel)) _pgExSel = null;
  if(!_pgExSel && tracked.length) _pgExSel = tracked[0];
  const rows = logRange(from, to, _pgWho);
  const pending = trHasPending();

  const RANGES = [[7,'7 días'],[30,'30 días'],[90,'3 meses'],[365,'1 año']];

  host.innerHTML = `
  <div class="pg-wrap">

    ${pending ? `<div class="pg-resume">
      <span>⏱️ Tienes un entrenamiento a medias</span>
      <button class="btn-prim sm" id="pgResume">Reanudar</button>
    </div>` : ''}

    <div class="pg-topbar">
      <div class="seg-row pg-range">${RANGES.map(([d,l])=>
        `<button class="seg-b ${_pgRange===d?'on':''}" data-pgr="${d}">${l}</button>`).join('')}</div>
      <div class="seg-row pg-who">${['A','B'].map(w=> `<button class="seg-b ${_pgWho===w?'on':''}" data-pgw="${w}">${spEsc(pgWhoLabel(w))}</button>`).join('')}</div>
    </div>

    ${!all.length ? `
      <div class="pg-onboard">
        <span class="pg-ob-ico">📈</span>
        <h3>Aún no has registrado ningún entrenamiento</h3>
        <p>Ve a <b>Entrenamientos</b>, abre un día con sesión y pulsa <b>▶ Entrenar</b>.
           La app te irá pidiendo el peso y las repeticiones de cada serie, y a partir del
           segundo entreno te sugerirá cuánto cargar.</p>
      </div>` : `

    <div class="pg-kpis">
      <div class="pg-kpi"><b>${sum.sessions}</b><span>entrenos</span></div>
      <div class="pg-kpi"><b>${logStreak(_pgWho)}</b><span>sem. seguidas</span></div>
      <div class="pg-kpi"><b>${Math.round(sum.sec/3600)}<i>h</i></b><span>entrenando</span></div>
      <div class="pg-kpi"><b>${(sum.kcal||0).toLocaleString('es-ES')}</b><span>kcal</span></div>
      ${sum.tonnage ? `<div class="pg-kpi"><b>${Math.round(sum.tonnage/1000)}<i>t</i></b><span>movidas</span></div>` : ''}
      ${sum.dist ? `<div class="pg-kpi"><b>${Math.round(sum.dist/100)/10}<i>km</i></b><span>recorridos</span></div>` : ''}
    </div>

    <section class="pg-sec">
      <h3 class="pg-h">Volumen semanal por grupo muscular</h3>
      ${pgVolumeBars(vol, weeks)}
    </section>

    ${tracked.length ? `
    <section class="pg-sec">
      <h3 class="pg-h">Evolución de fuerza</h3>
      <select class="fsel pg-exsel" id="pgExSel">
        ${tracked.map(id=> `<option value="${id}" ${_pgExSel===id?'selected':''}>${spEsc((EXERCISES[id]||{}).name||id)}</option>`).join('')}
      </select>
      ${pgLineChart(logSeriesFor(_pgExSel, _pgWho))}
      <p class="pg-note">1RM estimado con la fórmula de Epley a partir de tu mejor serie de cada día.</p>
    </section>` : ''}

    ${prs.length ? `
    <section class="pg-sec">
      <h3 class="pg-h">Récords personales</h3>
      <div class="pg-prs">${prs.map(p=> `
        <div class="pg-pr">
          <b>${spEsc(p.name)}</b>
          <span class="mono">${p.kg} kg × ${p.reps}</span>
          <i>${p.date}</i>
        </div>`).join('')}</div>
    </section>` : ''}

    <section class="pg-sec">
      <h3 class="pg-h">Historial <span class="pg-h-n">${rows.length}</span></h3>
      ${rows.length ? `<div class="pg-list">${rows.map(pgEntryCard).join('')}</div>`
                    : `<div class="pg-empty-chart">Sin entrenamientos en este periodo.</div>`}
      ${all.length ? `<button class="btn-sec pg-export" id="pgExport">⬇ Exportar historial (CSV)</button>` : ''}
    </section>`}
  </div>`;

  /* wiring */
  host.querySelectorAll('[data-pgr]').forEach(b=> b.addEventListener('click', ()=>{ _pgRange = +b.dataset.pgr; renderProgress(); }));
  host.querySelectorAll('[data-pgw]').forEach(b=> b.addEventListener('click', ()=>{ _pgWho = b.dataset.pgw; renderProgress(); }));
  host.querySelectorAll('[data-toggle]').forEach(b=> b.addEventListener('click', ()=>{
    const id = b.dataset.toggle; _pgOpen[id] = !_pgOpen[id]; renderProgress();
  }));
  host.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Borrar este entrenamiento del historial?', {danger:true, okText:'Borrar'})) return;
    logDelete(b.dataset.del); pnToast('Entrenamiento borrado', 'ok'); renderProgress();
  }));
  const sel = document.getElementById('pgExSel');
  if(sel) sel.addEventListener('change', ()=>{ _pgExSel = sel.value; renderProgress(); });
  const rz = document.getElementById('pgResume');
  if(rz) rz.addEventListener('click', ()=> resumeTraining());
  const xp = document.getElementById('pgExport');
  if(xp) xp.addEventListener('click', ()=>{
    try{
      const blob = new Blob(['﻿' + logToCSV(_pgWho)], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `entrenamientos-${pgToday()}.csv`;
      a.click();
      setTimeout(()=> URL.revokeObjectURL(a.href), 1000);
      pnToast('Historial exportado', 'ok');
    }catch(e){ pnToast('No se pudo exportar', 'err'); }
  });
}

window.renderProgress = renderProgress;
