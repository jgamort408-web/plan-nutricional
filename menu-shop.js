/* ══════════════════════════════════════════════════════════
   MENU SHOP · lista de la compra desde el calendario semanal
   Suma los alimentos de todas las franjas (escalados a A y B),
   agrupados por sección de supermercado. Exportable.
   depende de FOODS, FOOD_SECTIONS, dishScaled, fmtNum, roundGrams,
   DISHES, WEEK_DAYS, TARGETS, CalState
══════════════════════════════════════════════════════════ */
let _shopScope = 'AB';          // 'A' | 'B' | 'AB'
let _shopChecked = {};          // {foodId: true}

function buildShoppingData(calData){
  const acc = {};               // id → {gA,gB,cs,unit}
  const legacy = [];            // recetas sin composición
  let dishes = 0;
  WEEK_DAYS.forEach(d=>{
    const day = calData[d.k]; if(!day) return;
    ['des','com','mer','cen'].forEach(slot=>{
      (day[slot]||[]).forEach(id=>{
        const dish = DISHES[id]; if(!dish) return;
        dishes++;
        if(!dish.comp || !dish.comp.length){ if(!legacy.includes(dish.nom)) legacy.push(dish.nom); return; }
        const A = dishScaled(dish,'A'), B = dishScaled(dish,'B');
        dish.comp.forEach((it,i)=>{
          const f = FOODS[it.f]; if(!f) return;
          const a = acc[it.f] = acc[it.f] || {gA:0, gB:0, cs:false, unit:false};
          if(it.cs){ a.cs = true; return; }
          a.gA += A.rows[i].grams;
          a.gB += B.rows[i].grams;
          if(it.u != null && f.unit) a.unit = true;
        });
      });
    });
  });
  return {acc, legacy, dishes};
}

function fmtShopQty(f, grams, useUnit){
  if(grams <= 0) return '';
  if(useUnit && f.unit){
    const u = Math.round(grams / f.unit.g * 2) / 2;
    const lbl = f.unit.lbl + (Math.abs(u)===1 ? '' : 's');
    return `${fmtNum(u)} ${lbl} · ${roundGrams(grams)} g`;
  }
  if(grams >= 1000){
    const kg = grams/1000;
    return `${(Math.round(kg*10)/10).toString().replace('.', ',')} kg`;
  }
  return `${roundGrams(grams)} g`;
}

function shopGrams(a){
  if(_shopScope === 'A') return a.gA;
  if(_shopScope === 'B') return a.gB;
  return a.gA + a.gB;
}

function openShopList(){
  if(typeof CalState === 'undefined' || !CalState.data){ alert('No hay calendario activo.'); return; }
  renderShopList();
  document.getElementById('shopBg').classList.add('show');
  document.body.classList.add('no-scroll');
}
function closeShopList(){
  document.getElementById('shopBg').classList.remove('show');
  document.body.classList.remove('no-scroll');
}

function renderShopList(){
  const {acc, legacy, dishes} = buildShoppingData(CalState.data);
  const body = document.getElementById('shopBody');
  const ids = Object.keys(acc);

  const scopeLbl = _shopScope==='A' ? `♂ ${TARGETS.A.name||'A'}`
                 : _shopScope==='B' ? `♀ ${TARGETS.B.name||'B'}`
                 : '♂+♀ Pareja (total)';

  // agrupa por sección
  const bySec = {};
  ids.forEach(id=>{ const s = FOODS[id].sec||'desp'; (bySec[s]=bySec[s]||[]).push(id); });
  const secOrder = Object.keys(FOOD_SECTIONS).sort((a,b)=>FOOD_SECTIONS[a].order-FOOD_SECTIONS[b].order);

  let sectionsHtml = '';
  secOrder.filter(s=>bySec[s]).forEach(s=>{
    const sm = FOOD_SECTIONS[s];
    // separa condimentos (cs sin gramos) al final de la sección
    const rows = bySec[s]
      .sort((a,b)=> FOODS[a].name.localeCompare(FOODS[b].name))
      .map(id=>{
        const f = FOODS[id];
        const a = acc[id];
        const grams = shopGrams(a);
        const checked = _shopChecked[id];
        let qHtml;
        if(grams <= 0 && a.cs){
          qHtml = `<span class="sr-q shop-cond">al gusto</span>`;
        } else {
          const main = fmtShopQty(f, grams, a.unit);
          const ab = _shopScope==='AB'
            ? `<span class="sr-ab">A ${fmtShopQty(f,a.gA,a.unit)||'—'} · B ${fmtShopQty(f,a.gB,a.unit)||'—'}</span>`
            : '';
          qHtml = `<span class="sr-q">${main}${ab}</span>`;
        }
        return `<div class="shop-row ${checked?'checked':''}" data-id="${id}">
          <span class="sr-chk ${checked?'on':''}"></span>
          <span class="sr-n">${esc(f.name)}${a.cs&&grams>0?'<span class="sr-note">+ al gusto</span>':''}</span>
          ${qHtml}
        </div>`;
      }).join('');
    sectionsHtml += `<div class="shop-sec">
      <div class="shop-sec-hd"><span class="ssh-ico">${sm.ico}</span>${sm.lbl}<span class="ssh-n">${bySec[s].length}</span></div>
      ${rows}</div>`;
  });

  const legacyHtml = legacy.length ? `<div class="shop-sec">
    <div class="shop-sec-hd"><span class="ssh-ico">📝</span>Sin desglose<span class="ssh-n">${legacy.length}</span></div>
    <div class="shop-cond" style="padding:4px 2px">Estas recetas no tienen composición de alimentos: ${legacy.map(esc).join(', ')}.</div>
  </div>` : '';

  body.innerHTML = `
    <div class="shop-hd">
      <h2>🛒 Lista de la compra</h2>
      <span class="form-sub">${CalState.name||'Semana actual'} · ${dishes} recetas · ${scopeLbl}</span>
    </div>
    <div class="shop-scope">
      <button class="ss-btn ${_shopScope==='A'?'on':''}" data-scope="A">♂ Solo A</button>
      <button class="ss-btn ${_shopScope==='B'?'on':''}" data-scope="B">♀ Solo B</button>
      <button class="ss-btn ${_shopScope==='AB'?'on':''}" data-scope="AB">♂+♀ Pareja</button>
    </div>
    <div class="shop-body">
      ${ids.length ? sectionsHtml + legacyHtml : `<div class="shop-empty">El calendario está vacío. Planifica comidas en la pestaña Calendario para generar la lista.</div>`}
    </div>
    <div class="shop-actions">
      <button class="btn-sec" id="shopCopy">📋 Copiar</button>
      <button class="btn-prim" id="shopDownload">↧ Descargar .txt</button>
    </div>`;

  body.querySelectorAll('.ss-btn').forEach(b=> b.addEventListener('click', ()=>{ _shopScope = b.dataset.scope; renderShopList(); }));
  body.querySelectorAll('.shop-row').forEach(r=>{
    r.addEventListener('click', ()=>{
      const id = r.dataset.id;
      _shopChecked[id] = !_shopChecked[id];
      r.classList.toggle('checked', _shopChecked[id]);
      r.querySelector('.sr-chk').classList.toggle('on', _shopChecked[id]);
    });
  });
  const cp = document.getElementById('shopCopy');
  if(cp) cp.addEventListener('click', ()=> copyShopText(acc, legacy));
  const dl = document.getElementById('shopDownload');
  if(dl) dl.addEventListener('click', ()=> downloadShopText(acc, legacy));
}

function shopAsText(acc, legacy){
  const scopeLbl = _shopScope==='A' ? 'Persona A' : _shopScope==='B' ? 'Persona B' : 'Pareja (A+B)';
  const lines = [`LISTA DE LA COMPRA · ${CalState.name||'Semana'} · ${scopeLbl}`, ''];
  const bySec = {};
  Object.keys(acc).forEach(id=>{ const s=FOODS[id].sec||'desp'; (bySec[s]=bySec[s]||[]).push(id); });
  const secOrder = Object.keys(FOOD_SECTIONS).sort((a,b)=>FOOD_SECTIONS[a].order-FOOD_SECTIONS[b].order);
  secOrder.filter(s=>bySec[s]).forEach(s=>{
    lines.push(FOOD_SECTIONS[s].lbl.toUpperCase());
    bySec[s].sort((a,b)=>FOODS[a].name.localeCompare(FOODS[b].name)).forEach(id=>{
      const f=FOODS[id], a=acc[id], g=shopGrams(a);
      const q = (g<=0 && a.cs) ? 'al gusto' : fmtShopQty(f,g,a.unit);
      lines.push(`  [ ] ${f.name} — ${q}`);
    });
    lines.push('');
  });
  if(legacy.length){ lines.push('SIN DESGLOSE'); legacy.forEach(n=> lines.push(`  [ ] ${n}`)); }
  return lines.join('\n');
}

function copyShopText(acc, legacy){
  const txt = shopAsText(acc, legacy);
  navigator.clipboard?.writeText(txt).then(
    ()=>{ const b=document.getElementById('shopCopy'); if(b){ b.textContent='✓ Copiado'; setTimeout(()=>b.textContent='📋 Copiar',1500);} },
    ()=> alert('No se pudo copiar automáticamente.')
  );
}
function downloadShopText(acc, legacy){
  const txt = shopAsText(acc, legacy);
  const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compra-${(CalState.name||'semana').replace(/[^a-z0-9-_ ]/gi,'').replace(/\s+/g,'_')||'semana'}.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

/* ── BIND ── */
(function(){
  const btn = document.getElementById('calShopList');
  if(btn) btn.addEventListener('click', openShopList);
  const cl = document.getElementById('shopClose');
  if(cl) cl.addEventListener('click', closeShopList);
  const bg = document.getElementById('shopBg');
  if(bg) bg.addEventListener('click', e=>{ if(e.target.id==='shopBg') closeShopList(); });
})();
