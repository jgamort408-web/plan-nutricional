/* ══════════════════════════════════════════════════════════
   MENU SHOP · lista de la compra desde el calendario semanal
   Suma los alimentos de todas las franjas (escalados a A y B),
   agrupados por sección de supermercado. Exportable.
   depende de FOODS, FOOD_SECTIONS, dishScaled, fmtNum, roundGrams,
   DISHES, WEEK_DAYS, TARGETS, CalState
══════════════════════════════════════════════════════════ */
let _shopScope = 'AB';          // id de persona (PEOPLE) | 'AB' (todas)
let _shopChecked = {};          // {foodId: true}

// Personas actuales (generalizado desde el viejo A/B)
function shopPeople(){ return (typeof PEOPLE !== 'undefined' && PEOPLE.length) ? PEOPLE : ['A','B']; }
function shopName(pid){
  if(typeof personaLabel === 'function') return personaLabel(pid);
  return ((TARGETS[pid]||{}).name || '').trim() || pid;
}
function shopToken(pid){
  if(typeof personaToken === 'function'){ const t = personaToken(pid); return t.txt; }
  return pid;
}

function buildShoppingData(calData){
  const acc = {};               // id → {g:{pid:grams}, cs, unit}
  const legacy = [];            // recetas sin composición
  let dishes = 0;
  const ppl = shopPeople();
  WEEK_DAYS.forEach(d=>{
    const day = calData[d.k]; if(!day) return;
    ['des','com','mer','cen'].forEach(slot=>{
      const cellIds = (day[slot]||[]).filter(id=>DISHES[id]);
      if(!cellIds.length) return;
      // Fase 2b: cada receta escala a la necesidad de esa comida; si la celda tiene
      // varias recetas, la franja se reparte entre ellas (proporcional al tamaño estándar).
      const sumStd = (typeof sumCellStd === 'function') ? sumCellStd(cellIds) : 0;
      cellIds.forEach(id=>{
        const dish = DISHES[id];
        dishes++;
        if(!dish.comp || !dish.comp.length){ if(!legacy.includes(dish.nom)) legacy.push(dish.nom); return; }
        const scaled = {};
        ppl.forEach(pid=>{ scaled[pid] = (typeof dishScaledMeal === 'function') ? dishScaledMeal(dish, pid, slot, sumStd) : dishScaled(dish, pid); });
        dish.comp.forEach((it,i)=>{
          const f = FOODS[it.f]; if(!f) return;
          const a = acc[it.f] = acc[it.f] || {g:{}, cs:false, unit:false};
          if(it.cs){ a.cs = true; return; }
          ppl.forEach(pid=>{ a.g[pid] = (a.g[pid]||0) + (scaled[pid] && scaled[pid].rows[i] ? scaled[pid].rows[i].grams : 0); });
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
  if(_shopScope === 'AB') return shopPeople().reduce((s,pid)=> s + (a.g[pid]||0), 0);
  return a.g[_shopScope] || 0;
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

  const ppl = shopPeople();
  if(_shopScope !== 'AB' && !ppl.includes(_shopScope)) _shopScope = 'AB';
  const scopeLbl = _shopScope==='AB' ? 'Todas (total)' : shopName(_shopScope);

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
          const ab = (_shopScope==='AB' && ppl.length>1)
            ? `<span class="sr-ab">${ppl.map(pid=> `${esc(shopToken(pid))} ${fmtShopQty(f,a.g[pid]||0,a.unit)||'—'}`).join(' · ')}</span>`
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
      ${ppl.map(pid=>`<button class="ss-btn ${_shopScope===pid?'on':''}" data-scope="${pid}">${esc(shopName(pid))}</button>`).join('')}
      ${ppl.length>1 ? `<button class="ss-btn ${_shopScope==='AB'?'on':''}" data-scope="AB">👥 Todas</button>` : ''}
    </div>
    <div class="shop-body">
      ${ids.length ? sectionsHtml + legacyHtml : `<div class="shop-empty">El calendario está vacío. Planifica comidas en la pestaña Plan Semanal para generar la lista.</div>`}
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
  const scopeLbl = _shopScope==='AB' ? 'Todas (total)' : shopName(_shopScope);
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
