/* ══════════════════════════════════════════════════════════
   EVOLUCIÓN · sensaciones de "Mi día" (feedback de comidas/recetas)
   ──────────────────────────────────────────────────────────
   El feedback ya se guarda en mnut:feedback:v1 (getFeedbackLog()).
   Aquí lo visualizamos como una EVOLUCIÓN con gráficos:
     · Vistas SELECCIONABLES: tendencia diaria · media por comida ·
       ranking de recetas.
     · FILTROS: rango (7/30/90/todo) · persona · tipo de comida.
   Sin librerías externas: canvas 2D, coherente con el resto de la app.
   Depende de: getFeedbackLog, FB_RATINGS, DISHES, AppPage.
══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const esc = s => (typeof escHtml==='function') ? escHtml(s) : String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const SLOTS = [ {k:'des',lbl:'Desayuno',ico:'☀️'},{k:'com',lbl:'Comida',ico:'🍽'},{k:'mer',lbl:'Merienda',ico:'🍎'},{k:'cen',lbl:'Cena',ico:'🌙'} ];
  const SLOT_LBL = SLOTS.reduce((a,s)=>(a[s.k]=s.lbl,a),{});
  const PERSONA_LBL = {A:'♂ A', B:'♀ B', AB:'Pareja'};
  const RANGES = [ {v:7,lbl:'7 días'},{v:30,lbl:'30 días'},{v:90,lbl:'3 meses'},{v:0,lbl:'Todo'} ];
  const VIEWS = [ {v:'trend',lbl:'Tendencia diaria'},{v:'slot',lbl:'Por comida'},{v:'dish',lbl:'Ranking de recetas'} ];

  const _f = { range:30, persona:'all', slot:'all', view:'trend' };
  let _root=null;

  function log(){ try{ const a = (typeof getFeedbackLog==='function') ? getFeedbackLog() : []; return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function ratings(){ try{ return (typeof FB_RATINGS==='function') ? FB_RATINGS() : []; }catch(e){ return []; } }
  function ratingIco(v){ const R=ratings(); const m=R.find(r=>r.v===Math.round(v)); return m?m.ico:'•'; }
  function dishName(id){ const d=(typeof DISHES!=='undefined')?DISHES[id]:null; return d ? (d.nom||d.short||id) : id; }
  function dishIco(id){ const d=(typeof DISHES!=='undefined')?DISHES[id]:null; return d ? (d.icon||'🍽') : '🍽'; }
  function accent(){ try{ const c=getComputedStyle(document.body).getPropertyValue('--accent').trim(); return c||'#B5603A'; }catch(e){ return '#B5603A'; } }

  function dateKeyDaysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  // Entradas VALORADAS (rating>0) que cumplen los filtros activos.
  function filtered(){
    const from = _f.range ? dateKeyDaysAgo(_f.range-1) : '0000-00-00';
    return log().filter(e=>{
      if(!e || !e.rating) return false;
      if(e.date < from) return false;
      if(_f.persona!=='all' && e.persona!==_f.persona) return false;
      if(_f.slot!=='all' && e.slot!==_f.slot) return false;
      return true;
    });
  }
  // Personas presentes en el registro (para el filtro).
  function personasPresent(){ const s=new Set(); log().forEach(e=>{ if(e&&e.persona) s.add(e.persona); }); return [...s]; }

  function injectCSS(){
    if(document.getElementById('fbevo-css')) return;
    const s=document.createElement('style'); s.id='fbevo-css'; s.textContent=`
    .dr-hd-acts{display:flex;align-items:center;gap:6px}
    .dr-evo{background:rgba(44,31,14,.06);border:none;border-radius:12px;width:40px;height:40px;font-size:1.05rem;cursor:pointer;line-height:1}
    .dr-evo:hover{background:var(--accent,#B5603A);filter:none}
    .fbe-tools{display:flex;flex-direction:column;gap:12px;margin-bottom:14px}
    .fbe-frow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .fbe-lbl{font-family:'DM Mono',monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-50,#6b5d49);margin-right:4px;min-width:58px}
    .fbe-chip{border:1.5px solid rgba(44,31,14,.14);background:var(--white,#fff);border-radius:16px;padding:6px 12px;min-height:36px;cursor:pointer;font-size:.8rem;color:var(--warm,#2C1F0E);font-family:inherit}
    .fbe-chip.on{border-color:var(--accent,#B5603A);background:rgba(181,96,58,.12);font-weight:600;color:var(--accent,#B5603A)}
    .fbe-views{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
    .fbe-view{flex:1;min-width:110px;border:1.5px solid rgba(44,31,14,.14);background:var(--white,#fff);border-radius:12px;padding:9px 10px;cursor:pointer;font-size:.82rem;color:var(--warm,#2C1F0E);font-family:inherit}
    .fbe-view.on{border-color:var(--accent,#B5603A);background:var(--accent,#B5603A);color:#fff;font-weight:600}
    .fbe-card{background:var(--white,#FFFDF7);border:1px solid rgba(44,31,14,.1);border-radius:16px;padding:14px 14px 16px;margin-bottom:14px}
    .fbe-card h3{font-family:'Playfair Display',serif;font-size:1rem;color:var(--accent,#B5603A);margin:0 0 4px}
    .fbe-card .fbe-sub{font-size:.76rem;color:var(--ink-50,#6b5d49);margin:0 0 10px}
    .fbe-canvas-wrap{width:100%}
    .fbe-canvas-wrap canvas{width:100%;height:auto;display:block}
    .fbe-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:.72rem;color:var(--ink-50,#6b5d49);margin-top:8px;font-family:'DM Mono',monospace}
    .fbe-legend .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
    .fbe-stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
    .fbe-stat{flex:1;min-width:90px;background:var(--white,#fff);border:1px solid rgba(44,31,14,.1);border-radius:14px;padding:10px 12px;text-align:center}
    .fbe-stat b{display:block;font-family:'Playfair Display',serif;font-size:1.35rem;color:var(--accent,#B5603A);line-height:1.1}
    .fbe-stat span{font-size:.68rem;color:var(--ink-50,#6b5d49);text-transform:uppercase;letter-spacing:.04em}
    .fbe-rank{list-style:none;margin:0;padding:0}
    .fbe-rank li{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid rgba(44,31,14,.07)}
    .fbe-rank li:last-child{border-bottom:none}
    .fbe-rank .rk-ico{font-size:1.3rem;flex:none}
    .fbe-rank .rk-body{flex:1;min-width:0}
    .fbe-rank .rk-n{font-size:.9rem;color:var(--warm,#2C1F0E);line-height:1.25}
    .fbe-rank .rk-m{font-size:.72rem;color:var(--ink-50,#6b5d49)}
    .fbe-rank .rk-avg{flex:none;font-size:1.25rem}
    .fbe-empty{text-align:center;color:var(--ink-50,#6b5d49);padding:32px 12px;font-style:italic}
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  function chipRow(lbl, opts, cur, attr){
    return `<div class="fbe-frow"><span class="fbe-lbl">${lbl}</span>${
      opts.map(o=>`<button class="fbe-chip ${cur===o.v?'on':''}" data-${attr}="${o.v}">${esc(o.lbl)}</button>`).join('')
    }</div>`;
  }

  function shell(){
    const personaOpts = [{v:'all',lbl:'Todas'}].concat(personasPresent().map(p=>({v:p,lbl:PERSONA_LBL[p]||p})));
    const slotOpts = [{v:'all',lbl:'Todas'}].concat(SLOTS.map(s=>({v:s.k,lbl:s.lbl})));
    return `
      <div class="fbe-tools">
        ${chipRow('Rango', RANGES, _f.range, 'range')}
        ${personaOpts.length>2 ? chipRow('Persona', personaOpts, _f.persona, 'persona') : ''}
        ${chipRow('Comida', slotOpts, _f.slot, 'slot')}
      </div>
      <div class="fbe-views">
        ${VIEWS.map(v=>`<button class="fbe-view ${_f.view===v.v?'on':''}" data-view="${v.v}">${esc(v.lbl)}</button>`).join('')}
      </div>
      <div class="fbe-stats" id="fbeStats"></div>
      <div id="fbeBody"></div>`;
  }

  function wire(body){
    body.addEventListener('click', e=>{
      const set=(k,val)=>{ _f[k]=val; body.innerHTML=shell(); wire(body); draw(); };
      const r=e.target.closest('[data-range]'); if(r){ set('range', +r.dataset.range); return; }
      const p=e.target.closest('[data-persona]'); if(p){ set('persona', p.dataset.persona); return; }
      const s=e.target.closest('[data-slot]'); if(s){ set('slot', s.dataset.slot); return; }
      const v=e.target.closest('[data-view]'); if(v){ set('view', v.dataset.view); return; }
    });
  }

  // ── Cálculos ──
  function byDay(list){
    const m={}; list.forEach(e=>{ (m[e.date]=m[e.date]||[]).push(e.rating); });
    const days = _f.range ? Array.from({length:_f.range},(_,i)=>dateKeyDaysAgo(_f.range-1-i))
                          : Object.keys(m).sort();
    return days.map(d=>{ const arr=m[d]||[]; return {date:d, avg: arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : null, n:arr.length}; });
  }
  function bySlot(list){
    return SLOTS.map(s=>{ const arr=list.filter(e=>e.slot===s.k).map(e=>e.rating);
      return {lbl:s.lbl, ico:s.ico, avg: arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0, n:arr.length}; });
  }
  function byDish(list){
    const m={}; list.forEach(e=>{ (m[e.dishId]=m[e.dishId]||[]).push(e.rating); });
    return Object.entries(m).map(([id,arr])=>({id, avg:arr.reduce((a,b)=>a+b,0)/arr.length, n:arr.length}))
      .sort((a,b)=> b.avg-a.avg || b.n-a.n);
  }

  function renderStats(list){
    const el=document.getElementById('fbeStats'); if(!el) return;
    if(!list.length){ el.innerHTML=''; return; }
    const avg = list.reduce((a,e)=>a+e.rating,0)/list.length;
    const sb = bySlot(list).filter(s=>s.n).sort((a,b)=>b.avg-a.avg);
    const best = sb[0];
    const dishes = new Set(list.map(e=>e.dishId)).size;
    el.innerHTML = `
      <div class="fbe-stat"><b>${avg.toFixed(1)} ${ratingIco(avg)}</b><span>Sensación media</span></div>
      <div class="fbe-stat"><b>${list.length}</b><span>Valoraciones</span></div>
      <div class="fbe-stat"><b>${dishes}</b><span>Recetas</span></div>
      ${best?`<div class="fbe-stat"><b>${best.ico}</b><span>Mejor: ${esc(best.lbl)}</span></div>`:''}`;
  }

  // ── Dibujo ──
  function prep(canvas, cssH){
    const wrap=canvas.parentElement; const W=Math.max(260, wrap.clientWidth||320); const H=cssH;
    const dpr=window.devicePixelRatio||1;
    canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.height=H+'px';
    const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.clearRect(0,0,W,H);
    return {ctx,W,H};
  }
  function drawLine(canvas, pts){
    const {ctx,W,H}=prep(canvas,240); const pad=30, padB=34;
    const ac=accent();
    // ejes horizontales 1..5
    ctx.font='10px "DM Mono", monospace'; ctx.textBaseline='middle';
    for(let g=1;g<=5;g++){ const y=H-padB-((g-1)/4)*(H-pad-padB);
      ctx.strokeStyle='rgba(44,31,14,.08)'; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-8,y); ctx.stroke();
      ctx.fillStyle='rgba(44,31,14,.4)'; ctx.textAlign='right'; ctx.fillText(String(g), pad-6, y);
    }
    const valid = pts.filter(p=>p.avg!=null);
    if(!valid.length){ ctx.fillStyle='rgba(44,31,14,.4)'; ctx.textAlign='center'; ctx.fillText('Sin valoraciones en este rango', W/2, H/2); return; }
    const x=i=> pad + i*((W-pad-8)/(pts.length-1||1));
    const y=v=> H-padB-((v-1)/4)*(H-pad-padB);
    // línea (une puntos válidos)
    ctx.strokeStyle=ac; ctx.lineWidth=2.5; ctx.lineJoin='round'; ctx.beginPath(); let started=false;
    pts.forEach((p,i)=>{ if(p.avg==null){ started=false; return; } const px=x(i),py=y(p.avg); if(!started){ctx.moveTo(px,py);started=true;} else ctx.lineTo(px,py); });
    ctx.stroke();
    // puntos
    pts.forEach((p,i)=>{ if(p.avg==null) return; ctx.fillStyle=ac; ctx.beginPath(); ctx.arc(x(i),y(p.avg),3.5,0,7); ctx.fill(); });
    // etiquetas extremos de fecha
    ctx.fillStyle='rgba(44,31,14,.5)'; ctx.textAlign='left';
    const fmt=d=>{ const [Y,M,D]=d.split('-'); return D+'/'+M; };
    ctx.fillText(fmt(pts[0].date), pad, H-12);
    ctx.textAlign='right'; ctx.fillText(fmt(pts[pts.length-1].date), W-8, H-12);
  }
  function drawBars(canvas, bars){
    const {ctx,W,H}=prep(canvas,230); const pad=30, padB=40; const ac=accent();
    ctx.font='10px "DM Mono", monospace';
    for(let g=1;g<=5;g++){ const y=H-padB-((g-1)/4)*(H-pad-padB);
      ctx.strokeStyle='rgba(44,31,14,.08)'; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-8,y); ctx.stroke();
      ctx.fillStyle='rgba(44,31,14,.4)'; ctx.textAlign='right'; ctx.textBaseline='middle'; ctx.fillText(String(g), pad-6, y);
    }
    const n=bars.length; const slotW=(W-pad-8)/n; const bw=Math.min(58, slotW*0.6);
    bars.forEach((b,i)=>{ const cx=pad + slotW*i + slotW/2;
      const yTop = b.n? H-padB-((b.avg-1)/4)*(H-pad-padB) : H-padB;
      ctx.fillStyle = b.n? ac : 'rgba(44,31,14,.12)';
      const h=Math.max(0, (H-padB)-yTop);
      if(b.n){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(cx-bw/2,yTop,bw,h,6); else ctx.rect(cx-bw/2,yTop,bw,h); ctx.fill(); }
      ctx.fillStyle='rgba(44,31,14,.7)'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.font='11px "DM Mono", monospace';
      ctx.fillText(b.ico, cx, H-padB+6);
      ctx.fillStyle='rgba(44,31,14,.45)'; ctx.font='9px "DM Mono", monospace';
      ctx.fillText(b.lbl, cx, H-padB+22);
      if(b.n){ ctx.fillStyle=ac; ctx.font='bold 11px "DM Mono", monospace'; ctx.textBaseline='bottom'; ctx.fillText(b.avg.toFixed(1), cx, yTop-3); }
    });
  }

  function draw(){
    if(!_root) return;
    const list=filtered();
    renderStats(list);
    const body=document.getElementById('fbeBody'); if(!body) return;
    if(!list.length){
      body.innerHTML = `<div class="fbe-card"><div class="fbe-empty">Aún no hay valoraciones que coincidan con estos filtros.<br>Valora tus comidas en <b>Mi día</b> con las caritas y ve viendo tu evolución aquí.</div></div>`;
      return;
    }
    if(_f.view==='trend'){
      body.innerHTML = `<div class="fbe-card"><h3>Tendencia diaria</h3><p class="fbe-sub">Sensación media por día (1 = pesado · 5 = excelente)</p>
        <div class="fbe-canvas-wrap"><canvas id="fbeCanvas" role="img" aria-label="Gráfico de la sensación media por día."></canvas></div>
        <div class="fbe-legend"><span><span class="dot" style="background:${accent()}"></span>Sensación media diaria</span></div></div>`;
      requestAnimationFrame(()=>{ const c=document.getElementById('fbeCanvas'); if(c) drawLine(c, byDay(list)); });
    } else if(_f.view==='slot'){
      body.innerHTML = `<div class="fbe-card"><h3>Media por comida</h3><p class="fbe-sub">¿Qué momento del día te sienta mejor?</p>
        <div class="fbe-canvas-wrap"><canvas id="fbeCanvas" role="img" aria-label="Gráfico de la sensación media por tipo de comida."></canvas></div></div>`;
      requestAnimationFrame(()=>{ const c=document.getElementById('fbeCanvas'); if(c) drawBars(c, bySlot(list)); });
    } else {
      const rank=byDish(list);
      body.innerHTML = `<div class="fbe-card"><h3>Ranking de recetas</h3><p class="fbe-sub">Ordenadas por tu sensación media (con nº de veces valoradas)</p>
        <ul class="fbe-rank">${rank.map(r=>`
          <li><span class="rk-ico">${dishIco(r.id)}</span>
            <span class="rk-body"><span class="rk-n">${esc(dishName(r.id))}</span>
              <span class="rk-m">${r.avg.toFixed(1)} de media · ${r.n} ${r.n===1?'valoración':'valoraciones'}${SLOT_LBL[(DISHES[r.id]||{}).cat]?' · '+SLOT_LBL[(DISHES[r.id]||{}).cat]:''}</span></span>
            <span class="rk-avg">${ratingIco(r.avg)}</span></li>`).join('')}</ul></div>`;
    }
  }

  injectCSS();
  window.openFeedbackEvolution = function(){
    injectCSS();
    if(typeof AppPage==='undefined') return;
    AppPage.open({ key:'fbevo', title:'📊 Evolución de tus sensaciones', subtitle:'Tu evolución',
      render(body){ _root=body; body.innerHTML=shell(); wire(body); draw();
        window.addEventListener('resize', _onResize);
      }
    });
  };
  let _rz=null;
  function _onResize(){ clearTimeout(_rz); _rz=setTimeout(()=>{ if(document.getElementById('fbeBody')) draw(); }, 180); }
})();
