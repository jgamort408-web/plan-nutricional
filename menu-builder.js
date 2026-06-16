/* ══════════════════════════════════════════════════════════
   MENU BUILDER · crear receta por COMPOSICIÓN de alimentos
   · buscador de alimentos + cantidades + macros en vivo
   · pestaña JSON (pegar composición)
   · editor de alimentos + gestor de alimentos (Ajustes)
   depende de FOODS, FOOD_SECTIONS, MEAL_PCT, scaleComp, recomputeDish,
   gramMacros, itemGrams, foodName, fmtQty (menu-foods.js) y de
   DISHES, TARGETS, CATEGORIES, DIET_OPTS, TIPO_OPTS, openForm, closeForm,
   openModal, persistCustom, renderAll, openSettings (menu-forms/app)
══════════════════════════════════════════════════════════ */

function esc(s){ return (s||'').toString().replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

/* paleta de emojis representativos para recetas */
const RECIPE_EMOJIS = [
  '🍴','🍽️','🥗','🥘','🍲','🍳','🥣','🫕','🍛','🍜','🍝','🌮','🌯','🥙','🫔','🥪','🍔','🌭','🍕','🥟',
  '🍗','🍖','🥩','🥓','🍤','🦐','🦑','🐙','🐟','🐠','🐡','🦪','🦞','🦀','🍣','🍱','🍙','🍚','🍘','🥡',
  '🥚','🧀','🥛','🧈','🥞','🧇','🥯','🥐','🍞','🥖','🥨','🫓','🥦','🥬','🥒','🫑','🌶️','🍅','🥕','🌽',
  '🥔','🍠','🧅','🧄','🍄','🫛','🫘','🥜','🌰','🥑','🫒','🍆','🥥','🍎','🍏','🍐','🍌','🍓','🫐','🍇',
  '🍊','🍋','🍉','🍈','🍑','🍒','🥝','🍍','🥭','🍠','🍯','🫙','🥤','🧃','☕','🍵','🥂','🍷','🧂','🌿'
];

function wireEmojiPicker(form){
  const btn = form.querySelector('#emojiBtn');
  const pop = form.querySelector('#emojiPop');
  const cur = form.querySelector('#emojiCur');
  const hidden = form.querySelector('[name=icon]');
  if(!btn || !pop) return;
  pop.innerHTML = RECIPE_EMOJIS.map(e=>`<button type="button" class="emoji-opt ${e===hidden.value?'on':''}" data-e="${e}">${e}</button>`).join('');
  const close = ()=> pop.classList.remove('show');
  btn.addEventListener('click', e=>{ e.stopPropagation(); pop.classList.toggle('show'); });
  pop.querySelectorAll('.emoji-opt').forEach(o=> o.addEventListener('click', ()=>{
    hidden.value = o.dataset.e; cur.textContent = o.dataset.e;
    pop.querySelectorAll('.emoji-opt').forEach(x=> x.classList.toggle('on', x===o));
    close();
  }));
  document.addEventListener('click', function docClose(ev){
    if(!form.contains(document.getElementById('emojiPop'))){ document.removeEventListener('click', docClose); return; }
    if(!pop.contains(ev.target) && ev.target !== btn) close();
  });
}

/* índice de alimentos para el buscador */
function builderFoodIndex(){
  return Object.keys(FOODS).map(id=>({id, name:FOODS[id].name}));
}

/* ── fila de composición ───────────────────────────────── */
function compRowHtml(it){
  const f = (it && it.f) ? FOODS[it.f] : null;
  const mode = it ? (it.cs ? 'cs' : (it.u != null ? 'u' : 'g')) : 'g';
  const qty  = it ? (it.cs ? '' : (it.u != null ? it.u : it.g)) : '';
  const fixed = it ? (it.fx != null ? it.fx : (f && f.fx)) : false;
  const unitLbl = mode==='cs' ? 'c.s.' : (mode==='u' ? 'ud' : 'g');
  const name = it && it.f ? (it.as || (f ? f.name : it.f)) : '';
  return `<div class="comp-row ${it&&it.f&&!f?'unknown':''}" data-food="${esc(it&&it.f||'')}" data-unit="${mode}">
    <div class="cr-food">
      <input class="finp cr-name" placeholder="Buscar alimento…" value="${esc(name)}" autocomplete="off">
      <div class="food-ac"></div>
    </div>
    <input class="finp mono cr-qty" type="number" min="0" step="any" placeholder="cant." value="${qty}" ${mode==='cs'?'disabled':''}>
    <button type="button" class="cr-unit" data-mode="${mode}">${unitLbl}</button>
    <button type="button" class="cr-fix ${fixed?'on':''}" title="Cantidad fija — no se escala con el objetivo de cada persona">🔒</button>
    <button type="button" class="cr-rm" title="Quitar">✕</button>
    <div class="cr-kcal"></div>
  </div>`;
}

// Códigos de dieta para el generador de prompt (coinciden con normalizeBuilderRecipe)
const AI_DIETS = [
  {k:'sg', lbl:'Sin gluten'},   {k:'sl', lbl:'Sin lactosa'},
  {k:'vg', lbl:'Vegano'},       {k:'vt', lbl:'Vegetariano'},
  {k:'ps', lbl:'Pescetariano'}, {k:'cn', lbl:'Con carne'},
  {k:'lg', lbl:'Con legumbre'}
];

function openRecipeForm(catKey, editId){
  const editing = !!editId;
  const d = editing ? DISHES[editId] : {
    cat: catKey || 'des', short:'', nom:'', icon:'🍴', t:'10 min', eq:'',
    tags:[], tipo:null, diet:[], desc:'', comp:[], nota:''
  };
  const comp = (editing && d.comp && d.comp.length) ? d.comp : [null, null, null];
  const legacyNoComp = editing && (!d.comp || !d.comp.length);

  const html = `
    <div class="form-hd">
      <h2>${editing?'Editar receta':'Nueva receta'}</h2>
      <span class="form-sub">${editing?`ID ${editId}`:'Composición de alimentos · se guarda en este navegador'}</span>
    </div>
    <div class="builder-tabs">
      <button type="button" class="btab on" data-btab="visual">✍️ Manual</button>
      <button type="button" class="btab" data-btab="json">✨ Con IA</button>
    </div>
    <div class="form-body" id="recipeForm">
      <div id="builderVisual">
        ${legacyNoComp?`<div class="comp-hint" style="color:var(--rose)">Esta receta es antigua y no tiene desglose por alimentos. Añádelos abajo para recalcular sus macros automáticamente.</div>`:''}
        <div class="frow-2">
          <div class="fgrp">
            <label class="flbl">Categoría</label>
            <select class="fsel" name="cat">
              ${CATEGORIES.map(c=>`<option value="${c.key}" ${c.key===d.cat?'selected':''}>${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="fgrp">
            <label class="flbl">Icono representativo</label>
            <div class="emoji-field">
              <button type="button" class="emoji-btn" id="emojiBtn" aria-label="Elegir emoji"><span id="emojiCur">${esc(d.icon||'🍴')}</span> <span class="emoji-caret">▾</span></button>
              <input type="hidden" name="icon" value="${esc(d.icon||'🍴')}">
              <div class="emoji-pop" id="emojiPop"></div>
            </div>
          </div>
        </div>

        <div class="fgrp">
          <label class="flbl">Nombre del plato</label>
          <input class="finp" name="nom" placeholder="Ej. Ensalada de quinoa con salmón" value="${esc(d.nom)}">
        </div>
        <div class="fgrp">
          <label class="flbl">Etiqueta corta</label>
          <input class="finp" name="short" placeholder="2-3 palabras (para la tarjeta)" value="${esc(d.short)}">
        </div>
        <div class="fgrp">
          <label class="flbl">Descripción</label>
          <textarea class="ftxt" name="desc" placeholder="Una o dos frases sobre el plato">${esc(d.desc)}</textarea>
        </div>
        <div class="frow-2">
          <div class="fgrp">
            <label class="flbl">Tiempo</label>
            <input class="finp mono" name="t" placeholder="ej. 20 min" value="${esc(d.t)}">
          </div>
          <div class="fgrp">
            <label class="flbl">Equipamiento</label>
            <input class="finp mono" name="eq" placeholder="ej. Horno · Sartén" value="${esc(d.eq)}">
          </div>
        </div>
        <div class="fgrp">
          <label class="flbl">Etiquetas dietéticas</label>
          <div class="fchips" id="dietChips">
            ${DIET_OPTS.map(o=>`<button type="button" class="fchip ${d.diet.includes(o.k)?'on':''}" data-k="${o.k}">${o.lbl}</button>`).join('')}
          </div>
        </div>
        <div class="fgrp">
          <label class="flbl">Tipo de comida</label>
          <div class="fchips" id="tipoChips">
            ${TIPO_OPTS.map(o=>`<button type="button" class="fchip ${(d.tipo||'')===o.k?'on':''}" data-k="${o.k}">${o.lbl}</button>`).join('')}
          </div>
        </div>

        <div class="fgrp">
          <label class="flbl">Ingredientes · ración de referencia</label>
          <div class="comp-hint">Cantidad para <strong>1 ración estándar</strong>. La app calcula las de ♂ A y ♀ B escalando al objetivo de cada comida. Marca <span class="legend-fix">🔒</span> en verduras y aliños para que no se escalen.</div>
          <div class="comp-list" id="compList">
            ${comp.map(compRowHtml).join('')}
          </div>
          <button type="button" class="ing-add-btn" id="addCompBtn">＋ Añadir alimento</button>
        </div>

        <div class="comp-live" id="compLive">
          <div class="cl-hd">Ración de referencia · cálculo automático</div>
          <div class="cl-base" id="clBase"></div>
          <div class="cl-ab" id="clAb"></div>
        </div>

        <div class="fgrp" style="margin-top:14px">
          <label class="flbl">Preparación</label>
          <textarea class="ftxt" name="nota" placeholder="Pasos breves de cocinado">${esc(d.nota)}</textarea>
        </div>
      </div>

      <div id="builderJsonPane" style="display:none">
        <ol class="ai-steps">
          <li><strong>Rellena</strong> lo que quieras abajo y pulsa <strong>Copiar prompt</strong>.</li>
          <li><strong>Pégalo</strong> en una IA (ChatGPT, Claude o Gemini).</li>
          <li>La IA te dará un <strong>archivo .json</strong>: descárgalo y <strong>súbelo aquí</strong> con el botón “Subir archivo”.</li>
        </ol>
        <div class="ai-prompt-box">
          <button type="button" class="btn-prim" id="aiPromptToggle" style="width:100%">✨ Preparar el prompt para la IA</button>
          <div id="aiPromptPanel" style="display:none;margin-top:10px">
            <p class="ai-help">Todo es opcional. Pulsa <strong>Copiar prompt</strong>, pégalo en tu IA y sube el archivo que te devuelva. (Si lo prefieres, también puedes pegar el texto en “Opciones avanzadas”.)</p>
            <div class="fgrp">
              <label class="flbl">Idea / nombre de la receta</label>
              <input class="finp" id="aiIdea" placeholder="Ej. Bowl de salmón y quinoa (o déjalo en blanco)">
            </div>
            <div class="frow-2">
              <div class="fgrp">
                <label class="flbl">Tipo de comida</label>
                <select class="fsel" id="aiCat">${CATEGORIES.map(c=>`<option value="${c.key}" ${c.key===(catKey||'com')?'selected':''}>${c.label}</option>`).join('')}</select>
              </div>
              <div class="fgrp">
                <label class="flbl">Contexto <span class="flbl-ex">opcional</span></label>
                <input class="finp" id="aiServ" placeholder="Ej. rápido, barato, batch cooking">
              </div>
            </div>
            <div class="fgrp">
              <label class="flbl">Ingredientes que quieres incluir <span class="flbl-ex">escribe y pulsa Enter · 🟢 ya en la app · 🟡 nuevo (lo creará la IA)</span></label>
              <div class="ai-ing-field">
                <input class="finp" id="aiIngInput" placeholder="Ej. salmón… (Enter para añadir)" autocomplete="off">
                <div class="food-ac" id="aiIngAc"></div>
              </div>
              <div class="ai-ing-chips" id="aiIngChips"></div>
            </div>
            <div class="fgrp">
              <label class="flbl">Dieta / restricciones</label>
              <div class="fchips" id="aiDietChips">
                ${AI_DIETS.map(d=>`<button type="button" class="fchip" data-d="${d.k}">${d.lbl}</button>`).join('')}
              </div>
            </div>
            <div class="fgrp">
              <label class="flbl">Estilo / notas <span class="flbl-ex">opcional</span></label>
              <textarea class="ftxt" id="aiNotes" placeholder="Ej. menos de 20 min, sin horno, sabor mediterráneo, alto en proteína…"></textarea>
            </div>
            <button type="button" class="btn-prim" id="aiPromptCopy" style="width:100%">📋 Copiar prompt para la IA</button>
            <div id="aiPromptMsg" class="data-msg"></div>
          </div>
        </div>
        <div class="ai-upload">
          <label class="flbl" style="text-align:center;display:block">2 · Sube el archivo que te dio la IA</label>
          <input type="file" id="builderJsonFile" accept="application/json,.json" hidden>
          <button type="button" class="btn-prim" id="builderJsonFileBtn" style="width:100%">📁 Subir archivo .json</button>
          <div id="builderJsonStatus" style="margin-top:8px"></div>
        </div>

        <details class="ai-advanced">
          <summary>⚙️ Opciones avanzadas · pegar el JSON a mano</summary>
          <div class="json-help">
            Pega el JSON que te dé la IA y pulsa “Cargar”. Acepta el formato combinado <code>{"foods":{…}, "recipes":[…]}</code> o una sola receta suelta como este ejemplo:
            <pre style="font-family:'DM Mono',monospace;font-size:.68rem;white-space:pre-wrap;margin-top:6px;line-height:1.45">{
  "cat":"com", "nom":"Pollo con arroz", "icon":"🍗",
  "diet":["sg"], "tipo":"completa",
  "comp":[
    {"f":"pechuga_de_pollo","g":180},
    {"f":"arroz_integral_cocido","g":110},
    {"f":"brocoli","g":150,"fx":true},
    {"f":"aceite_de_oliva","g":12},
    {"f":"especias","cs":true,"as":"Sal y pimienta"}
  ],
  "nota":"Pollo a la plancha; arroz hervido."
}</pre>
          </div>
          <textarea class="json-area" id="builderJson" spellcheck="false" placeholder="Pega aquí el JSON de la receta"></textarea>
          <button type="button" class="btn-sec" id="builderJsonLoad" style="width:100%;margin-top:8px">↧ Cargar JSON pegado</button>
        </details>
      </div>
    </div>
    <div class="form-actions">
      ${editing?'<button class="btn-danger" id="delBtn">🗑 Eliminar</button>':'<button class="btn-sec" id="cancelBtn">Cancelar</button>'}
      <button class="btn-prim" id="saveBtn">${editing?'Guardar cambios':'Crear receta'}</button>
    </div>`;

  openForm(html);
  wireRecipeForm(editId);
}

function wireRecipeForm(editId){
  const form = document.getElementById('recipeForm');
  const live = ()=> recomputeBuilderLive(form);

  wireEmojiPicker(form);

  // builder tabs
  form.parentNode.querySelectorAll('.btab').forEach(b=>{
    b.addEventListener('click', ()=>{
      form.parentNode.querySelectorAll('.btab').forEach(x=>x.classList.toggle('on', x===b));
      document.getElementById('builderVisual').style.display = b.dataset.btab==='visual' ? '' : 'none';
      document.getElementById('builderJsonPane').style.display = b.dataset.btab==='json' ? '' : 'none';
    });
  });

  // diet + tipo chips
  form.querySelectorAll('#dietChips .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));
  form.querySelectorAll('#tipoChips .fchip').forEach(b=> b.addEventListener('click', ()=>{
    form.querySelectorAll('#tipoChips .fchip').forEach(x=> x.classList.toggle('on', x===b));
  }));
  form.querySelector('[name=cat]').addEventListener('change', live);

  // comp rows
  form.querySelectorAll('.comp-row').forEach(row=> wireCompRow(row, live));
  document.getElementById('addCompBtn').addEventListener('click', ()=>{
    const list = document.getElementById('compList');
    list.insertAdjacentHTML('beforeend', compRowHtml(null));
    wireCompRow(list.lastElementChild, live);
    live();
  });

  // ── Importación de JSON (compartida por "subir archivo" y "pegar") ──
  function builderImportParsed(raw){
    const st = document.getElementById('builderJsonStatus');
    st.className = 'json-status';
    const hasFoods   = raw && raw.foods && typeof raw.foods==='object' && !Array.isArray(raw.foods);
    const hasRecipes = raw && Array.isArray(raw.recipes);

    if(hasFoods || hasRecipes || (raw && raw.recipe)){
      // ── Formato combinado {foods, recipes} ──
      // 1) Alimentos nuevos primero (para que comp encuentre sus ids)
      let addedFoods = 0;
      if(hasFoods){
        Object.entries(raw.foods).forEach(([id, f])=>{ if(registerAIFood(id, f)) addedFoods++; });
        if(addedFoods) persistFoods();
      }
      const foodPrefix = addedFoods ? `✓ ${addedFoods} alimento(s) nuevo(s) añadido(s). ` : '';
      // 2) Recetas
      const list = hasRecipes ? raw.recipes : (raw.recipe ? [raw.recipe] : []);
      if(list.length === 1){
        // Una sola: cargar en el formulario para revisar antes de guardar
        const r = normalizeBuilderRecipe(list[0]);
        if(r.error){ st.className='json-status err'; st.textContent=foodPrefix+'✘ Receta: '+r.error; if(addedFoods) renderAll(); return; }
        fillFormFromData(form, r.data);
        form.parentNode.querySelector('.btab[data-btab="visual"]').click();
        st.className='json-status ok'; st.textContent=foodPrefix+'Receta cargada en el formulario: revísala y pulsa Guardar.';
        if(addedFoods) renderAll();
        return;
      }
      // Varias: añadirlas directamente al catálogo
      let addedR = 0; const errs = [];
      list.forEach((rc, i)=>{ const r = normalizeBuilderRecipe(rc); if(r.error){ errs.push(`receta ${i+1}: ${r.error}`); return; } recomputeDish(r.data); DISHES[nextUserId()] = r.data; addedR++; });
      if(addedR) persistCustom();
      if(addedFoods || addedR) renderAll();
      st.className = errs.length ? 'json-status err' : 'json-status ok';
      st.textContent = `✓ ${addedFoods} alimento(s) y ${addedR} receta(s) añadidas al catálogo` + (errs.length ? `. Errores: ${errs.join('; ')}` : '.');
      return;
    }

    // ── Formato antiguo: una receta a nivel raíz ──
    const r = normalizeBuilderRecipe(raw);
    if(r.error){ st.className='json-status err'; st.textContent='✘ '+r.error; return; }
    fillFormFromData(form, r.data);
    form.parentNode.querySelector('.btab[data-btab="visual"]').click();
  }

  // Pegar JSON (avanzado)
  const jsonLoadBtn = document.getElementById('builderJsonLoad');
  if(jsonLoadBtn) jsonLoadBtn.addEventListener('click', ()=>{
    const st = document.getElementById('builderJsonStatus');
    st.className = 'json-status';
    let raw;
    try{ raw = JSON.parse(document.getElementById('builderJson').value); }
    catch(e){ st.className='json-status err'; st.textContent='JSON inválido: '+e.message; return; }
    builderImportParsed(raw);
  });

  // Subir archivo .json (flujo principal de la IA)
  const fileBtn = document.getElementById('builderJsonFileBtn');
  const fileInp = document.getElementById('builderJsonFile');
  if(fileBtn && fileInp){
    fileBtn.addEventListener('click', ()=> fileInp.click());
    fileInp.addEventListener('change', ()=>{
      const st = document.getElementById('builderJsonStatus');
      const file = fileInp.files && fileInp.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        let raw;
        try{ raw = JSON.parse(reader.result); }
        catch(e){ st.className='json-status err'; st.textContent='✘ El archivo no es un JSON válido: '+e.message; fileInp.value=''; return; }
        builderImportParsed(raw);
        fileInp.value='';
      };
      reader.onerror = ()=>{ st.className='json-status err'; st.textContent='✘ No se pudo leer el archivo.'; };
      reader.readAsText(file);
    });
  }

  // ── Generador de prompt para IA ──
  const aiToggle = document.getElementById('aiPromptToggle');
  if(aiToggle) aiToggle.addEventListener('click', ()=>{
    const panel = document.getElementById('aiPromptPanel');
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    aiToggle.classList.toggle('on', !open);
  });
  document.querySelectorAll('#aiDietChips .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));

  // ── Ingredientes como chips (existentes con autocompletado + nuevos) ──
  const aiIngInput = document.getElementById('aiIngInput');
  const aiIngAc    = document.getElementById('aiIngAc');
  const aiIngChips = document.getElementById('aiIngChips');
  if(aiIngInput && aiIngChips){
    const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    const hasChip = (id, name)=> [...aiIngChips.children].some(c=> (id && c.dataset.id===id) || (!id && norm(c.dataset.name)===norm(name)));
    const addChip = (id, name, isNew)=>{
      name = (name||'').trim(); if(!name) return;
      if(hasChip(id, name)) return;
      const chip = document.createElement('span');
      chip.className = 'ai-ing-chip ' + (isNew ? 'new' : 'exist');
      chip.dataset.name = name;
      if(id) chip.dataset.id = id;
      chip.dataset.new = isNew ? '1' : '';
      chip.innerHTML = `<span class="ai-ing-dot"></span>${esc(name)}<button type="button" class="ai-ing-x" aria-label="Quitar">✕</button>`;
      chip.querySelector('.ai-ing-x').addEventListener('click', ()=> chip.remove());
      aiIngChips.appendChild(chip);
    };
    const closeAc = ()=>{ aiIngAc.classList.remove('show'); aiIngAc.innerHTML=''; };
    const renderAc = ()=>{
      const q = norm(aiIngInput.value.trim());
      if(!q){ closeAc(); return; }
      let matches = builderFoodIndex().filter(o=> norm(o.name).includes(q)).slice(0,8);
      aiIngAc.innerHTML = matches.map(o=>`<div class="fa-it" data-id="${o.id}"><span>${esc(o.name)}</span></div>`).join('')
        + `<div class="fa-new" data-new="1">🟡 Añadir «${esc(aiIngInput.value.trim())}» como alimento nuevo</div>`;
      aiIngAc.classList.add('show');
      aiIngAc.querySelectorAll('.fa-it').forEach(el=> el.addEventListener('mousedown', e=>{ e.preventDefault(); const f=FOODS[el.dataset.id]; addChip(el.dataset.id, f?f.name:el.dataset.id, false); aiIngInput.value=''; closeAc(); aiIngInput.focus(); }));
      aiIngAc.querySelector('[data-new]').addEventListener('mousedown', e=>{ e.preventDefault(); addChip(null, aiIngInput.value, true); aiIngInput.value=''; closeAc(); aiIngInput.focus(); });
    };
    aiIngInput.addEventListener('input', renderAc);
    aiIngInput.addEventListener('focus', renderAc);
    aiIngInput.addEventListener('blur', ()=> setTimeout(closeAc, 160));
    aiIngInput.addEventListener('keydown', e=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        const q = norm(aiIngInput.value.trim()); if(!q) return;
        const exact = builderFoodIndex().find(o=> norm(o.name)===q);
        if(exact) addChip(exact.id, FOODS[exact.id].name, false);
        else addChip(null, aiIngInput.value, true);
        aiIngInput.value=''; closeAc();
      }
    });
  }

  const aiCopy = document.getElementById('aiPromptCopy');
  if(aiCopy) aiCopy.addEventListener('click', ()=>{
    const prompt = buildRecipePrompt();
    const msg = document.getElementById('aiPromptMsg');
    const ok = ()=>{ if(msg){ msg.className='data-msg ok'; msg.textContent='✓ Prompt copiado. Pégalo en tu IA; cuando te dé el archivo .json, súbelo con el botón “Subir archivo”.'; } };
    const manual = ()=>{ const ta=document.getElementById('builderJson'); if(ta){ ta.value=prompt; ta.focus(); ta.select(); } if(msg){ msg.className='data-msg'; msg.textContent='El prompt está ahora en el recuadro de abajo: selecciónalo y cópialo (Ctrl/Cmd+C).'; } };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(prompt).then(ok).catch(manual);
    } else manual();
  });

  // cancel / delete
  const cancelBtn = document.getElementById('cancelBtn');
  if(cancelBtn) cancelBtn.addEventListener('click', ()=>{ closeForm(); });
  const delBtn = document.getElementById('delBtn');
  if(delBtn) delBtn.addEventListener('click', async ()=>{
    if(!await pnConfirm('¿Eliminar esta receta?\nNo se puede deshacer.', {danger:true, okText:'Eliminar'})) return;
    delete DISHES[editId];
    S.cart = S.cart.filter(x=>x!==editId);
    persistCustom(); persistCart();
    closeForm(); renderAll();
  });

  // save
  document.getElementById('saveBtn').addEventListener('click', ()=> saveRecipeForm(form, editId));

  live();
}

function wireCompRow(row, onChange){
  const nameInp = row.querySelector('.cr-name');
  const ac      = row.querySelector('.food-ac');
  const qty     = row.querySelector('.cr-qty');
  const unitBtn = row.querySelector('.cr-unit');
  const fixBtn  = row.querySelector('.cr-fix');

  const closeAc = ()=>{ ac.classList.remove('show'); ac.innerHTML=''; };
  const renderAc = ()=>{
    const q = nameInp.value.trim().toLowerCase();
    let matches = builderFoodIndex().filter(o=> o.name.toLowerCase().includes(q));
    matches.sort((a,b)=> a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q));
    matches = matches.slice(0,8);
    ac.innerHTML = matches.map(o=>{
      const f=FOODS[o.id];
      return `<div class="fa-it" data-id="${o.id}"><span class="fa-sec">${(FOOD_SECTIONS[f.sec]||{}).ico||'•'}</span><span>${esc(f.name)}</span><span class="fa-mac">${f.kcal} kcal · ${f.p}/${f.f}/${f.c} /100g</span></div>`;
    }).join('') + `<div class="fa-new" data-new="1">➕ Crear alimento «${esc(nameInp.value.trim()||'nuevo')}»</div>`;
    ac.classList.add('show');
    ac.querySelectorAll('.fa-it').forEach(el=> el.addEventListener('mousedown', e=>{ e.preventDefault(); selectFood(el.dataset.id); }));
    ac.querySelector('[data-new]').addEventListener('mousedown', e=>{
      e.preventDefault();
      openFoodEditor(null, nameInp.value.trim(), id=> selectFood(id));
    });
  };
  const selectFood = (id)=>{
    const f = FOODS[id]; if(!f) return;
    row.dataset.food = id;
    nameInp.value = f.name;
    row.classList.remove('unknown');
    if(!fixBtn.dataset.touched) fixBtn.classList.toggle('on', !!f.fx);
    // si el alimento no tiene unidad y el modo era 'u', vuelve a 'g'
    if(!(f.unit) && unitBtn.dataset.mode==='u') setMode('g');
    closeAc(); onChange();
  };
  const setMode = (m)=>{
    unitBtn.dataset.mode = m; row.dataset.unit = m;
    unitBtn.textContent = m==='cs' ? 'c.s.' : (m==='u' ? 'ud' : 'g');
    qty.disabled = (m==='cs');
  };

  nameInp.addEventListener('input', ()=>{ row.dataset.food=''; row.classList.add('unknown'); renderAc(); onChange(); });
  nameInp.addEventListener('focus', renderAc);
  nameInp.addEventListener('blur', ()=> setTimeout(closeAc, 160));
  qty.addEventListener('input', onChange);
  unitBtn.addEventListener('click', ()=>{
    const f = FOODS[row.dataset.food];
    const cycle = (f && f.unit) ? ['g','u','cs'] : ['g','cs'];
    let m = cycle[(cycle.indexOf(unitBtn.dataset.mode)+1) % cycle.length];
    setMode(m); onChange();
  });
  fixBtn.addEventListener('click', ()=>{ fixBtn.classList.toggle('on'); fixBtn.dataset.touched='1'; onChange(); });
  row.querySelector('.cr-rm').addEventListener('click', ()=>{
    const list = row.parentNode;
    if(list.querySelectorAll('.comp-row').length > 1){ row.remove(); onChange(); }
  });
}

/* lee la composición del formulario */
function readBuilderComp(form){
  const out = [];
  form.querySelectorAll('.comp-row').forEach(row=>{
    const id = row.dataset.food;
    if(!id || !FOODS[id]) return;
    const m = row.dataset.unit;
    const qty = +row.querySelector('.cr-qty').value || 0;
    const fix = row.querySelector('.cr-fix').classList.contains('on');
    const it = {f:id, fx:fix};
    if(m==='cs') it.cs = true;
    else if(m==='u') it.u = qty;
    else it.g = qty;
    out.push(it);
  });
  return out;
}

function recomputeBuilderLive(form){
  // por fila
  form.querySelectorAll('.comp-row').forEach(row=>{
    const id = row.dataset.food;
    const cell = row.querySelector('.cr-kcal');
    if(!id || !FOODS[id]){ cell.textContent=''; return; }
    const m = row.dataset.unit;
    const qty = +row.querySelector('.cr-qty').value || 0;
    const it = {f:id}; if(m==='cs') it.cs=true; else if(m==='u') it.u=qty; else it.g=qty;
    const g = itemGrams(it);
    const mm = gramMacros(id, g);
    cell.textContent = it.cs ? 'c.s. · sin macros relevantes'
      : `${Math.round(g)} g → ${Math.round(mm.k)} kcal · ${Math.round(mm.p)}P ${Math.round(mm.f)}G ${Math.round(mm.c)}C`;
  });

  const comp = readBuilderComp(form);
  const cat = form.querySelector('[name=cat]').value;
  let base = {k:0,p:0,f:0,c:0};
  comp.forEach(it=>{ const mm = gramMacros(it.f, itemGrams(it)); base.k+=mm.k; base.p+=mm.p; base.f+=mm.f; base.c+=mm.c; });

  document.getElementById('clBase').innerHTML = `
    <div class="cl-cell"><div class="cl-v">${Math.round(base.k)}</div><div class="cl-l">kcal</div></div>
    <div class="cl-cell"><div class="cl-v">${Math.round(base.p)}</div><div class="cl-l">prot</div></div>
    <div class="cl-cell"><div class="cl-v">${Math.round(base.f)}</div><div class="cl-l">grasa</div></div>
    <div class="cl-cell"><div class="cl-v">${Math.round(base.c)}</div><div class="cl-l">carb</div></div>`;

  if(comp.length){
    const catLbl = (CATEGORIES.find(c=>c.key===cat)||{}).label || '';
    // Modelo "1 ración estándar": el bloque base ya muestra 1 ración (×1);
    // aquí cada persona = 1 ración × su modificador (fijos no escalan).
    const list = (typeof PEOPLE !== 'undefined' ? PEOPLE : ['A','B']);
    document.getElementById('clAb').innerHTML = list.map((id,i)=>{
      const mod = (typeof personModifier==='function') ? personModifier(id) : 1;
      const s = scaleByFactor(comp, mod);
      const T = (typeof TARGETS!=='undefined' && TARGETS[id]) ? TARGETS[id] : {};
      const sym = T.sym || (id==='A'?'♂':id==='B'?'♀':'🧑');
      const name = T.name || id;
      return `<div class="cl-ab-i${i%2?' b':''}"><strong>${sym} ${name}</strong> ·${mod!==1?` ×${mod} ·`:''} ${catLbl}: ${Math.round(s.tot.k)} kcal · ${Math.round(s.tot.p)}P ${Math.round(s.tot.f)}G ${Math.round(s.tot.c)}C</div>`;
    }).join('');
  } else {
    document.getElementById('clAb').innerHTML = `<div class="cl-ab-i">Añade alimentos para ver el cálculo por persona</div>`;
  }
}

function saveRecipeForm(form, editId){
  const get = n => (form.querySelector(`[name="${n}"]`).value||'').trim();
  const nom = get('nom');
  if(!nom){ alert('Pon un nombre al plato'); return; }
  const comp = readBuilderComp(form);
  if(!comp.length){ alert('Añade al menos un alimento con cantidad'); return; }

  const diet = [...form.querySelectorAll('#dietChips .fchip.on')].map(b=>b.dataset.k);
  const tipoBtn = form.querySelector('#tipoChips .fchip.on');
  const tipo = (tipoBtn && tipoBtn.dataset.k) ? tipoBtn.dataset.k : null;

  const data = {
    cat: get('cat'), short: get('short') || nom.slice(0,28), nom,
    icon: get('icon') || '🍴', t: get('t') || '—', eq: get('eq') || '—',
    tags: [], tipo, diet, desc: get('desc'),
    comp, nota: get('nota') || '—', food: []
  };
  recomputeDish(data);              // calcula kcal/mac/ing/food desde comp
  const id = editId || nextUserId();
  DISHES[id] = data;
  persistCustom();
  closeForm();
  renderAll();
  setTimeout(()=> openModal(id), 80);
}

/* rellena el formulario visual a partir de un objeto receta normalizado */
function fillFormFromData(form, data){
  const set = (n,v)=>{ const el=form.querySelector(`[name="${n}"]`); if(el) el.value = v||''; };
  set('cat', data.cat); set('icon', data.icon); set('nom', data.nom);
  set('short', data.short); set('desc', data.desc); set('t', data.t);
  set('eq', data.eq); set('nota', data.nota);
  form.querySelectorAll('#dietChips .fchip').forEach(b=> b.classList.toggle('on', (data.diet||[]).includes(b.dataset.k)));
  form.querySelectorAll('#tipoChips .fchip').forEach(b=> b.classList.toggle('on', (data.tipo||'')===b.dataset.k));
  const list = document.getElementById('compList');
  const comp = (data.comp&&data.comp.length) ? data.comp : [null];
  list.innerHTML = comp.map(compRowHtml).join('');
  list.querySelectorAll('.comp-row').forEach(row=> wireCompRow(row, ()=>recomputeBuilderLive(form)));
  recomputeBuilderLive(form);
}

/* normaliza una receta JSON con composición → {data}|{error} */
function normalizeBuilderRecipe(raw){
  if(!raw || typeof raw !== 'object') return {error:'no es un objeto'};
  const nom = (raw.nom || raw.name || '').toString();
  if(!nom) return {error:'falta "nom"'};
  const VALID = ['des','com','mer','cen'];
  const cat = (raw.cat||'').toLowerCase();
  if(!VALID.includes(cat)) return {error:`"cat" debe ser des/com/mer/cen`};
  if(!Array.isArray(raw.comp) || !raw.comp.length) return {error:'falta "comp" (composición de alimentos)'};
  const unknown = [];
  const comp = raw.comp.map(it=>{
    if(!it || !it.f) return null;
    if(!FOODS[it.f]){ unknown.push(it.f); return null; }
    const o = {f:it.f};
    if(it.cs) o.cs = true;
    else if(it.u != null) o.u = +it.u || 0;
    else o.g = +it.g || 0;
    if(it.fx != null) o.fx = !!it.fx;
    if(it.as) o.as = (''+it.as).slice(0,40);
    if(it.note) o.note = (''+it.note).slice(0,40);
    return o;
  }).filter(Boolean);
  if(!comp.length) return {error: unknown.length ? `alimentos desconocidos: ${unknown.join(', ')}` : 'composición vacía'};
  const validDiet = ['sg','sl','vg','vt','ps','cn','lg'];
  const data = {
    cat, short: (raw.short||nom).toString().slice(0,40), nom,
    icon: (raw.icon||'🍴').toString().slice(0,4),
    t: (raw.t||raw.time||'—').toString(), eq: (raw.eq||raw.equipment||'—').toString(),
    tags: [], tipo: ['ligera','completa'].includes(raw.tipo)?raw.tipo:null,
    diet: Array.isArray(raw.diet)?raw.diet.filter(x=>validDiet.includes(x)):[],
    desc: (raw.desc||raw.description||'').toString(),
    comp, nota: (raw.nota||raw.notes||raw.preparacion||'—').toString(), food: []
  };
  if(unknown.length) data._warn = `Ignorados alimentos desconocidos: ${unknown.join(', ')}`;
  return {data};
}
window.normalizeBuilderRecipe = normalizeBuilderRecipe;

/* ══════════════════════════════════════════════════════════
   EDITOR DE ALIMENTOS · añadir / editar un alimento
══════════════════════════════════════════════════════════ */
const FT_OPTS = [
  ['leg','Legumbre'],['cb','Carne blanca'],['cr','Carne roja'],['pb','Pescado blanco'],
  ['pa','Pescado azul'],['apq','Arroz/Pasta'],['hv','Huevo'],['pv','Prot. vegetal'],
  ['qs','Queso'],['js','Jamón'],['lac','Lácteo'],['fs','Frutos secos'],['v','Verdura'],['fr','Fruta']
];

function _showPrompt(){ document.getElementById('promptBg').classList.add('show'); document.body.classList.add('no-scroll'); }
function _closePrompt(){ document.getElementById('promptBg').classList.remove('show'); }

function openFoodEditor(foodId, prefillName, cb){
  const editing = !!foodId;
  const f = editing ? FOODS[foodId] : {name:prefillName||'', sec:'desp', kcal:'', p:'', f:'', c:'', ft:[], fx:false};
  const body = document.getElementById('promptBody');
  body.innerHTML = `
    <div class="form-hd"><h2>${editing?'Editar alimento':'Nuevo alimento'}</h2>
      <span class="form-sub">Valores por 100 g</span></div>
    <div class="form-body" id="foodEditor">
      <div class="fgrp"><label class="flbl">Nombre</label>
        <input class="finp" name="fname" value="${esc(f.name)}" placeholder="Ej. Tofu firme"></div>
      <div class="fgrp"><label class="flbl">Sección de supermercado</label>
        <select class="fsel" name="fsec">
          ${Object.entries(FOOD_SECTIONS).map(([k,s])=>`<option value="${k}" ${f.sec===k?'selected':''}>${s.ico} ${s.lbl}</option>`).join('')}
        </select></div>
      <div class="frow-4">
        <div class="fgrp"><label class="flbl">kcal</label><input class="finp mono" type="number" name="fk" min="0" value="${f.kcal}"></div>
        <div class="fgrp"><label class="flbl">Prot</label><input class="finp mono" type="number" name="fp" min="0" step="any" value="${f.p}"></div>
        <div class="fgrp"><label class="flbl">Grasa</label><input class="finp mono" type="number" name="ff" min="0" step="any" value="${f.f}"></div>
        <div class="fgrp"><label class="flbl">Carb</label><input class="finp mono" type="number" name="fc" min="0" step="any" value="${f.c}"></div>
      </div>
      <div class="frow-2">
        <div class="fgrp"><label class="flbl">Unidad (opcional)</label>
          <input class="finp" name="funit" value="${esc(f.unit?f.unit.lbl:'')}" placeholder="ej. huevo, cucharada"></div>
        <div class="fgrp"><label class="flbl">Gramos / unidad</label>
          <input class="finp mono" type="number" name="fung" min="0" step="any" value="${f.unit?f.unit.g:''}" placeholder="ej. 58"></div>
      </div>
      <div class="fgrp"><label class="flbl">Tipo para la guía semanal (opcional)</label>
        <div class="fchips" id="ftChips">
          ${FT_OPTS.map(([k,l])=>`<button type="button" class="fchip ${(f.ft||[]).includes(k)?'on':''}" data-k="${k}">${l}</button>`).join('')}
        </div></div>
      <label class="flbl" style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" name="ffx" ${f.fx?'checked':''}> Cantidad fija por defecto (verdura, aliño… no se escala)
      </label>
    </div>
    <div class="form-actions">
      <button class="btn-sec" id="foodCancel">Cancelar</button>
      <button class="btn-prim" id="foodSave">${editing?'Guardar':'Crear alimento'}</button>
    </div>`;
  _showPrompt();
  const ed = document.getElementById('foodEditor');
  ed.querySelectorAll('#ftChips .fchip').forEach(b=> b.addEventListener('click', ()=> b.classList.toggle('on')));
  document.getElementById('foodCancel').addEventListener('click', _closePrompt);
  document.getElementById('promptClose').onclick = _closePrompt;
  document.getElementById('foodSave').addEventListener('click', ()=>{
    const v = n => ed.querySelector(`[name="${n}"]`).value.trim();
    const num = n => +ed.querySelector(`[name="${n}"]`).value || 0;
    const name = v('fname');
    if(!name){ alert('Pon un nombre'); return; }
    const ft = [...ed.querySelectorAll('#ftChips .fchip.on')].map(b=>b.dataset.k);
    const obj = {name, sec:v('fsec')||'desp', kcal:num('fk'), p:num('fp'), f:num('ff'), c:num('fc'), user:true};
    if(ft.length) obj.ft = ft;
    if(ed.querySelector('[name=ffx]').checked) obj.fx = true;
    const ulbl = v('funit'), ung = num('fung');
    if(ulbl && ung>0) obj.unit = {lbl:ulbl, g:ung};
    const id = editing ? foodId : nextFoodId(name);
    FOODS[id] = obj;
    persistFoods();
    if(editing){ recomputeAllComp(); renderAll(); }   // un alimento editado afecta recetas que lo usan
    _closePrompt();
    if(cb) cb(id);
  });
}

/* ══════════════════════════════════════════════════════════
   GESTOR DE ALIMENTOS · pestaña Alimentos en Ajustes
══════════════════════════════════════════════════════════ */
let _foodSearch = '';
function renderFoodsManager(){
  const q = _foodSearch.toLowerCase();
  const ids = Object.keys(FOODS).filter(id=> !q || FOODS[id].name.toLowerCase().includes(q));
  const bySec = {};
  ids.forEach(id=>{ const s=FOODS[id].sec||'desp'; (bySec[s]=bySec[s]||[]).push(id); });
  const secOrder = Object.keys(FOOD_SECTIONS).sort((a,b)=>FOOD_SECTIONS[a].order-FOOD_SECTIONS[b].order);
  const sections = secOrder.filter(s=>bySec[s]).map(s=>{
    const sm = FOOD_SECTIONS[s];
    const rows = bySec[s].sort((a,b)=>FOODS[a].name.localeCompare(FOODS[b].name)).map(id=>{
      const f = FOODS[id];
      const unitTxt = f.unit ? ` · 1 ${f.unit.lbl} ≈ ${f.unit.g} g` : '';
      return `<div class="fm-it ${f.user?'is-user':''}" data-id="${id}">
        <div class="fm-n">${esc(f.name)} ${f.user?'<span class="fm-badge">tuyo</span>':''}<small>${id}${unitTxt}</small></div>
        <div class="fm-mac">${f.kcal} kcal<br>${f.p}P · ${f.f}G · ${f.c}C</div>
        <button class="fm-edit" data-edit="${id}" title="Editar">✎</button>
      </div>`;
    }).join('');
    return `<div class="fm-sec"><div class="fm-sec-hd">${sm.ico} ${sm.lbl}</div><div class="fm-list">${rows}</div></div>`;
  }).join('');
  return `
    <p style="font-size:.86rem;color:var(--ink-50);margin-bottom:12px;line-height:1.55">
      Base de datos de alimentos (kcal y macros por 100 g). Edita cualquiera o crea los tuyos
      <span style="background:var(--olive);color:#fff;font-family:'DM Mono',monospace;font-size:.55rem;padding:2px 6px;border-radius:3px">TUYO</span>.
      Las recetas se recalculan al cambiar un alimento.
    </p>
    <div class="fm-tools">
      <input class="finp fm-search" id="fmSearch" placeholder="Buscar alimento…" value="${esc(_foodSearch)}">
      <button class="btn-prim" id="fmNew" style="white-space:nowrap">＋ Nuevo</button>
    </div>
    ${sections || '<div class="ur-empty">Sin resultados.</div>'}`;
}

function wireFoodsManager(){
  const s = document.getElementById('fmSearch');
  if(s) s.addEventListener('input', ()=>{
    _foodSearch = s.value;
    const caret = s.selectionStart;
    const sc = formBody().scrollTop;
    renderSettings();
    const ns = document.getElementById('fmSearch');
    if(ns){ ns.focus(); try{ ns.setSelectionRange(caret, caret); }catch(e){} }
    formBody().scrollTop = sc;
  });
  const nb = document.getElementById('fmNew');
  if(nb) nb.addEventListener('click', ()=> openFoodEditor(null, '', ()=> renderSettings()));
  formBody().querySelectorAll('[data-edit]').forEach(b=> b.addEventListener('click', ()=> openFoodEditor(b.dataset.edit, null, ()=> renderSettings())));
}

/* Registra un alimento NUEVO (de la respuesta de la IA) en el catálogo de
   usuario. Usa el id tal cual lo da la IA (así "comp" lo encuentra). No
   sobreescribe alimentos existentes. Devuelve true si lo añadió. */
function registerAIFood(rawId, f){
  if(!f || typeof f !== 'object') return false;
  const name = (f.name||'').toString().trim();
  if(!name) return false;
  let id = (rawId||'').toString().trim();
  if(!id) id = nextFoodId(name);
  if(FOODS[id]) return false;   // ya existe: no lo tocamos (comp lo resolverá igual)
  const validSec = ['verd','fruta','carn','pesc','lact','pan','desp'];
  const sec = validSec.includes(f.sec) ? f.sec : 'desp';
  const num = v => { const n = +v; return (isFinite(n) && n>=0) ? n : 0; };
  FOODS[id] = { name: name.slice(0,40), sec, kcal:num(f.kcal), p:num(f.p), f:num(f.f), c:num(f.c), user:true };
  return true;
}

/* ── Generador de prompt detallado para crear una receta con IA ──────
   Construye un prompt (estilo experto en prompt-engineering) que pide a la
   IA devolver la receta en el JSON EXACTO que importa la app, usando solo
   IDs de alimentos reales del catálogo. */
function buildRecipePrompt(){
  const val = id => (document.getElementById(id)?.value || '').trim();
  const idea  = val('aiIdea');
  const catSel= document.getElementById('aiCat');
  const catKey= catSel ? catSel.value : 'com';
  const catLbl= (CATEGORIES.find(c=>c.key===catKey)||{}).label || catKey;
  const notes = val('aiNotes');
  const ctx   = val('aiServ');
  const diets = [...document.querySelectorAll('#aiDietChips .fchip.on')]
                  .map(b=>{ const d=AI_DIETS.find(x=>x.k===b.dataset.d); return d?`${d.k} (${d.lbl})`:b.dataset.d; });

  // Ingredientes seleccionados: existentes (con id) y nuevos (a crear)
  const ingChips = [...document.querySelectorAll('#aiIngChips .ai-ing-chip')];
  const existIngs = ingChips.filter(c=> !c.dataset.new).map(c=>`${c.dataset.name} → usa el id "${c.dataset.id}"`);
  const newIngs   = ingChips.filter(c=>  c.dataset.new).map(c=> c.dataset.name);

  const catalog = Object.keys(FOODS).map(fid=>`${fid} — ${FOODS[fid].name}`).join('\n');

  const lines = [
`Actúa como nutricionista y chef experto y, además, como experto en seguir formatos de salida al pie de la letra.`,
``,
`OBJETIVO: diseña una o varias recetas saludables según la petición de abajo y devuélvelas EXCLUSIVAMENTE como un único objeto JSON válido con el formato exacto que se especifica. No escribas absolutamente nada antes ni después del JSON.`,
``,
`PETICIÓN DEL USUARIO`,
`- Idea / nombre: ${idea || '(libre: elige tú una receta saludable y sabrosa)'}`,
`- Tipo de comida: ${catLbl} (cat = "${catKey}")`,
`- Dieta / restricciones: ${diets.length ? diets.join(', ') : '(ninguna en particular)'}`,
`- Estilo / notas: ${notes || '—'}`,
...(ctx ? [`- Contexto: ${ctx}`] : []),
``,
`INGREDIENTES QUE EL USUARIO QUIERE`,
`· Ya existen en la app (usa su id tal cual en "comp[].f"):`,
(existIngs.length ? existIngs.map(s=>'   - '+s).join('\n') : '   - (ninguno indicado; usa los del catálogo que mejor encajen)'),
`· Nuevos, NO existen en la app (debes CREARLOS en "foods" e inventar un id en minúsculas_con_guion_bajo y usarlo en "comp"):`,
(newIngs.length ? newIngs.map(s=>'   - '+s).join('\n') : '   - (ninguno)'),
``,
`RACIONES (IMPORTANTE): define la composición ("comp") con cantidades para UNA ración estándar. NO incluyas kcal ni macros en la receta: la app los calcula desde los alimentos y genera dos tamaños de ración. Los macros SÍ se indican, pero en "foods" (por 100 g) para cada alimento NUEVO.`,
``,
`FORMATO JSON EXACTO (devuelve este objeto, con estas dos claves):`,
`{`,
`  "foods": {`,
`    "<id_nuevo>": { "name": "Nombre legible", "sec": "desp", "kcal": 0, "p": 0, "f": 0, "c": 0 }`,
`    // SOLO los alimentos nuevos. Valores por 100 g. Deja {} si no hay nuevos.`,
`  },`,
`  "recipes": [`,
`    {`,
`      "nom": "Nombre del plato",`,
`      "short": "2-3 palabras",`,
`      "cat": "${catKey}",`,
`      "icon": "🍽",`,
`      "tipo": "completa",`,
`      "diet": [],`,
`      "desc": "una o dos frases",`,
`      "comp": [`,
`        {"f": "<id_alimento>", "g": 120},`,
`        {"f": "<id_alimento>", "u": 1},`,
`        {"f": "<id_alimento>", "cs": true, "as": "al gusto"}`,
`      ],`,
`      "nota": "pasos breves de preparación"`,
`    }`,
`  ]`,
`}`,
``,
`REGLAS para "foods" (alimentos NUEVOS):`,
`- "id": minúsculas, sin tildes ni espacios, con guion_bajo. Ej.: "salsa_de_yogur".`,
`- "sec" (categoría de compra) debe ser uno de: verd (verdura), fruta, carn (carne), pesc (pescado), lact (lácteos/huevos), pan (panadería/cereales), desp (despensa).`,
`- "kcal", "p" (proteína), "f" (grasa), "c" (carbohidratos): valores por 100 g, realistas.`,
``,
`REGLAS para "comp" (de cada receta):`,
`1. Cada "f" DEBE ser un id: o uno de la lista "ALIMENTOS DISPONIBLES", o uno que hayas creado en "foods".`,
`2. Usa "g" (gramos) por defecto; "u" para piezas/unidades; "cs" para cantidades simbólicas (especias, sal, vinagre…).`,
`3. Cantidades realistas para UNA ración de "${catLbl}".`,
`4. "tipo" es "ligera" o "completa"; "icon" un solo emoji.`,
``,
`CÓDIGOS DE DIETA válidos para "diet": ${AI_DIETS.map(d=>`${d.k}=${d.lbl}`).join(', ')}.`,
``,
`ALIMENTOS DISPONIBLES (ids ya existentes; úsalos en "comp[].f" cuando encajen; formato "id — nombre"):`,
catalog,
``,
`ENTREGA (MUY IMPORTANTE): genera el objeto JSON anterior y entrégamelo como un ARCHIVO DESCARGABLE llamado "receta.json" (un archivo de texto con extensión .json y solo el JSON dentro). Si no puedes adjuntar archivos, muéstrame el JSON en un bloque de código para copiarlo. No añadas explicaciones fuera del archivo/bloque.`
];
  return lines.join('\n');
}
