/* ══════════════════════════════════════════════════════════
   menu-onboard.js · Asistente de primer uso (onboarding)
   La primera vez que se abre la app, estudia las características de
   cada persona que va a seguir el plan y calcula sus kcal/macros con
   la teoría del curso (peso×22 → GET → objetivo → macros).
   Reutiliza calcFromInputs / ACTIVITY_LEVELS / GOALS de menu-forms.js.
══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  const FLAG = 'mnut:onboarded:v1';

  const CSS = `
  .ob-back{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;
    padding:18px;background:rgba(34,22,8,.55);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
    opacity:0;transition:opacity .2s}
  .ob-back.show{opacity:1}
  .ob{background:var(--white,#FFFDF7);width:100%;max-width:460px;border-radius:22px;overflow:hidden;
    box-shadow:0 30px 90px rgba(34,22,8,.5);display:flex;flex-direction:column;max-height:94vh;
    transform:translateY(14px) scale(.98);transition:transform .22s cubic-bezier(.2,.9,.3,1)}
  .ob-back.show .ob{transform:none}
  .ob-hd{background:var(--accent,#B5603A);color:#fff;padding:18px 22px 16px}
  .ob-hd .ob-step{font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
  .ob-hd h3{font-family:'Playfair Display',serif;font-weight:700;font-size:1.3rem;margin:4px 0 0}
  .ob-prog{display:flex;gap:5px;margin-top:12px}
  .ob-prog i{flex:1;height:4px;border-radius:3px;background:rgba(255,255,255,.3)}
  .ob-prog i.on{background:#fff}
  .ob-body{padding:20px 22px 6px;overflow-y:auto}
  .ob-body p.ob-lead{font-family:'Lora',serif;font-size:.96rem;line-height:1.55;color:var(--ink-70,rgba(44,31,14,.8));margin:0 0 14px}
  .ob-field{margin-bottom:14px}
  .ob-field label{display:block;font-family:'DM Mono',monospace;font-size:.62rem;text-transform:uppercase;
    letter-spacing:.08em;color:var(--ink-50);margin-bottom:6px;font-weight:600}
  .ob-field input[type=text],.ob-field input[type=number]{width:100%;border:1.5px solid rgba(44,31,14,.16);
    background:var(--cream,#F6EDD8);color:var(--warm,#2C1F0E);font-family:'Lora',serif;font-size:1rem;
    padding:11px 13px;border-radius:11px;transition:.15s}
  .ob-field input:focus{outline:none;border-color:var(--accent,#B5603A);box-shadow:0 0 0 3px rgba(181,96,58,.14);background:#fff}
  .ob-2col{display:flex;gap:10px}
  .ob-2col .ob-field{flex:1}
  .ob-chips{display:flex;flex-wrap:wrap;gap:6px}
  .ob-chip{border:1.5px solid rgba(44,31,14,.16);background:var(--white);color:var(--warm,#2C1F0E);
    font-family:'Lora',serif;font-size:.86rem;padding:9px 12px;border-radius:11px;cursor:pointer;transition:.15s;
    flex:1;min-width:120px;text-align:left;line-height:1.2}
  .ob-chip small{display:block;font-family:'DM Mono',monospace;font-size:.56rem;color:var(--ink-50);
    text-transform:none;letter-spacing:0;margin-top:3px;font-weight:400}
  .ob-chip.on{border-color:var(--accent,#B5603A);background:color-mix(in srgb,var(--accent,#B5603A) 10%,#fff);
    box-shadow:0 0 0 2px color-mix(in srgb,var(--accent,#B5603A) 25%,transparent)}
  .ob-chip.on small{color:var(--warm-2,#3D2C1A)}
  .ob-count{display:flex;align-items:center;justify-content:center;gap:18px;margin:16px 0}
  .ob-count button{width:46px;height:46px;border-radius:50%;border:1.5px solid rgba(44,31,14,.18);
    background:var(--white);font-size:1.4rem;cursor:pointer;color:var(--warm,#2C1F0E);transition:.15s}
  .ob-count button:hover{border-color:var(--accent,#B5603A);color:var(--accent,#B5603A)}
  .ob-count .ob-n{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:700;min-width:54px;text-align:center}
  .ob-preview{background:var(--cream,#F6EDD8);border-radius:13px;padding:12px 14px;margin-top:6px;
    font-family:'DM Mono',monospace;font-size:.72rem;color:var(--warm,#2C1F0E);text-align:center;line-height:1.5}
  .ob-preview b{font-size:1.1rem;color:var(--accent,#B5603A)}
  .ob-preview .ob-pm{color:var(--ink-50);margin-top:3px;font-size:.66rem}
  .ob-preview.empty{color:var(--ink-50)}
  .ob-sum{display:flex;flex-direction:column;gap:8px}
  .ob-sum-row{display:flex;align-items:center;gap:10px;background:var(--cream,#F6EDD8);border-radius:12px;padding:11px 13px}
  .ob-sum-row .ob-av{width:34px;height:34px;border-radius:50%;background:var(--accent,#B5603A);color:#fff;
    display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;flex-shrink:0}
  .ob-sum-row .ob-sn{flex:1;min-width:0;font-family:'Playfair Display',serif;font-weight:600;color:var(--warm,#2C1F0E)}
  .ob-sum-row .ob-sk{font-family:'DM Mono',monospace;font-size:.7rem;color:var(--ink-50);text-align:right}
  .ob-sum-row .ob-sk b{color:var(--accent,#B5603A);font-size:.82rem}
  .ob-foot{display:flex;gap:10px;padding:14px 20px 20px}
  .ob-btn{border:none;border-radius:13px;font-family:'DM Mono',monospace;font-size:.74rem;letter-spacing:.05em;
    text-transform:uppercase;font-weight:600;padding:14px 18px;cursor:pointer;transition:.15s}
  .ob-btn.prim{background:var(--accent,#B5603A);color:#fff;flex:1;box-shadow:0 4px 16px rgba(44,31,14,.2)}
  .ob-btn.prim:hover{filter:brightness(1.08);transform:translateY(-1px)}
  .ob-btn.prim:disabled{opacity:.4;cursor:default;transform:none;box-shadow:none}
  .ob-btn.ghost{background:transparent;border:1.5px solid rgba(44,31,14,.18);color:var(--warm,#2C1F0E)}
  .ob-btn.ghost:hover{border-color:var(--warm,#2C1F0E);background:var(--cream,#F6EDD8)}
  .ob-skip{display:block;width:100%;text-align:center;background:none;border:none;color:var(--ink-50);
    font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.06em;text-transform:uppercase;
    padding:0 0 14px;cursor:pointer}
  .ob-skip:hover{color:var(--accent,#B5603A)}
  @media(max-width:560px){ .ob{max-width:none} }
  `;
  function injectCSS(){
    if(document.getElementById('ob-css')) return;
    const s=document.createElement('style'); s.id='ob-css'; s.textContent=CSS;
    (document.head||document.documentElement).appendChild(s);
  }
  function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // Estado del asistente: lista de personas con sus datos
  let N = 2;
  let people = [];          // [{name,kg,cm,act,goal}]
  let step = 0;             // 0=intro, 1..N=personas, N+1=resumen
  let backEl = null;

  function defaultPerson(i){ return { name:'', sex:'M', age:'', kg:'', cm:'', act:'mod', goal:'man' }; }
  function ensurePeople(){
    while(people.length < N) people.push(defaultPerson(people.length));
    people.length = N;
  }
  function personIds(n){
    const ids=[]; for(let i=0;i<n;i++) ids.push(i===0?'A':i===1?'B':'P'+(i-1)); return ids;
  }
  const AV = ['🧑','👩','🧔','👧','👦','🧒'];

  function calc(p){
    if(typeof calcFromInputs!=='function') return null;
    return calcFromInputs(p.kg, p.cm, p.act, p.goal, p.sex, p.age);
  }

  function render(){
    ensurePeople();
    const total = N + 2;                  // intro + N + resumen
    const acts = (typeof ACTIVITY_LEVELS!=='undefined') ? ACTIVITY_LEVELS : [];
    const goals = (typeof GOALS!=='undefined') ? GOALS : [];
    let title='', body='', canNext=true, nextLbl='Siguiente';

    if(step === 0){
      title='¡Bienvenido!';
      body = `<p class="ob-lead">Vamos a preparar tu plan en un minuto. Primero, ¿cuántas
        personas van a seguir la dieta? Calcularemos las calorías y macros de cada una.</p>
        <div class="ob-count">
          <button data-c="-1" aria-label="Menos">−</button>
          <span class="ob-n">${N}</span>
          <button data-c="1" aria-label="Más">+</button>
        </div>
        <p class="ob-lead" style="text-align:center;font-size:.82rem;color:var(--ink-50)">
          Podrás añadir o quitar personas más adelante en Ajustes.</p>`;
      nextLbl='Empezar';
    } else if(step <= N){
      const i = step-1, p = people[i], r = calc(p);
      title = `Persona ${step} de ${N}`;
      body = `
        <div class="ob-field">
          <label>Nombre</label>
          <input type="text" data-f="name" value="${esc(p.name)}" placeholder="Ej.: ${esc(['Juan','Ana','Leo','Sara','Max','Eva'][i]||'Persona')}" maxlength="24">
        </div>
        <div class="ob-field">
          <label>Sexo</label>
          <div class="ob-chips">
            <button class="ob-chip ${p.sex==='M'?'on':''}" data-sex="M">♂ Hombre</button>
            <button class="ob-chip ${p.sex==='F'?'on':''}" data-sex="F">♀ Mujer</button>
          </div>
        </div>
        <div class="ob-2col">
          <div class="ob-field"><label>Peso (kg)</label>
            <input type="number" data-f="kg" value="${esc(p.kg)}" inputmode="decimal" min="20" max="300" placeholder="70"></div>
          <div class="ob-field"><label>Altura (cm)</label>
            <input type="number" data-f="cm" value="${esc(p.cm)}" inputmode="numeric" min="120" max="230" placeholder="170"></div>
          <div class="ob-field"><label>Edad</label>
            <input type="number" data-f="age" value="${esc(p.age)}" inputmode="numeric" min="12" max="100" placeholder="30"></div>
        </div>
        <div class="ob-field">
          <label>Nivel de actividad</label>
          <div class="ob-chips">
            ${acts.map(a=>`<button class="ob-chip ${p.act===a.k?'on':''}" data-act="${a.k}">${esc(a.lbl)}<small>${esc(a.ex)}</small></button>`).join('')}
          </div>
        </div>
        <div class="ob-field">
          <label>Objetivo</label>
          <div class="ob-chips">
            ${goals.map(g=>`<button class="ob-chip ${p.goal===g.k?'on':''}" data-goal="${g.k}">${esc(g.lbl)}<small>${esc(g.ex)}</small></button>`).join('')}
          </div>
        </div>
        ${r ? `<div class="ob-preview"><b>${r.goal} kcal/día</b>
            <div class="ob-pm">${r.macros.p}g P · ${r.macros.f}g G · ${r.macros.c}g C${r.corrected?' · peso corregido':''}</div></div>`
            : `<div class="ob-preview empty">Introduce peso y altura para ver el cálculo</div>`}`;
      canNext = !!(p.kg && p.cm);
      nextLbl = (step===N) ? 'Ver resumen' : 'Siguiente';
    } else {
      title='Todo listo';
      body = `<p class="ob-lead">Esto es lo que hemos calculado. Podrás ajustar cualquier dato
        cuando quieras en <strong>Ajustes ⚙</strong>.</p>
        <div class="ob-sum">
          ${people.map((p,i)=>{ const r=calc(p)||{goal:0,macros:{p:0,f:0,c:0}};
            const nm = p.name.trim()||('Persona '+(i+1));
            return `<div class="ob-sum-row"><span class="ob-av">${AV[i]||'🧑'}</span>
              <span class="ob-sn">${esc(nm)}</span>
              <span class="ob-sk"><b>${r.goal}</b> kcal<br>${r.macros.p}P · ${r.macros.f}G · ${r.macros.c}C</span></div>`;
          }).join('')}
        </div>`;
      nextLbl='¡Empezar a usar la app!';
    }

    const progress = Array.from({length:total}, (_,i)=>`<i class="${i<=step?'on':''}"></i>`).join('');
    backEl.querySelector('.ob').innerHTML = `
      <div class="ob-hd"><div class="ob-step">Paso ${step+1} de ${total}</div>
        <h3>${esc(title)}</h3><div class="ob-prog">${progress}</div></div>
      <div class="ob-body">${body}</div>
      <div class="ob-foot">
        ${step>0?`<button class="ob-btn ghost" data-nav="prev">Atrás</button>`:''}
        <button class="ob-btn prim" data-nav="next" ${canNext?'':'disabled'}>${esc(nextLbl)}</button>
      </div>
      ${step===0?`<button class="ob-skip" data-nav="skip">Saltar y usar valores por defecto</button>`:''}`;
    wire();
  }

  function wire(){
    const root = backEl;
    // contador de personas
    root.querySelectorAll('[data-c]').forEach(b=> b.onclick=()=>{
      N = Math.max(1, Math.min(6, N + (+b.dataset.c))); ensurePeople(); render();
    });
    // campos de texto/numero
    root.querySelectorAll('[data-f]').forEach(inp=> inp.oninput=()=>{
      const i=step-1; if(i<0||i>=people.length) return;
      people[i][inp.dataset.f] = inp.value;
      // refresca solo el preview y el estado del botón sin perder el foco
      const r = calc(people[i]);
      const pv = root.querySelector('.ob-preview');
      if(pv){ if(r){ pv.classList.remove('empty');
          pv.innerHTML=`<b>${r.goal} kcal/día</b><div class="ob-pm">${r.macros.p}g P · ${r.macros.f}g G · ${r.macros.c}g C${r.corrected?' · peso corregido':''}</div>`;
        } else { pv.classList.add('empty'); pv.textContent='Introduce peso y altura para ver el cálculo'; } }
      const nb = root.querySelector('[data-nav="next"]');
      if(nb) nb.disabled = !(people[i].kg && people[i].cm);
    });
    // chips sexo/actividad/objetivo
    root.querySelectorAll('[data-sex]').forEach(b=> b.onclick=()=>{ const i=step-1; people[i].sex=b.dataset.sex; render(); });
    root.querySelectorAll('[data-act]').forEach(b=> b.onclick=()=>{ const i=step-1; people[i].act=b.dataset.act; render(); });
    root.querySelectorAll('[data-goal]').forEach(b=> b.onclick=()=>{ const i=step-1; people[i].goal=b.dataset.goal; render(); });
    // navegación
    root.querySelectorAll('[data-nav]').forEach(b=> b.onclick=()=>{
      const a=b.dataset.nav;
      if(a==='prev'){ step=Math.max(0,step-1); render(); }
      else if(a==='skip'){ finish(true); }
      else if(a==='next'){
        if(step > N){ finish(false); }
        else { step++; render(); }
      }
    });
  }

  function finish(useDefaults){
    if(!useDefaults){
      try{ applyPeople(); }catch(e){ console.error(e); }
    }
    try{ localStorage.setItem(FLAG,'1'); }catch(e){}
    backEl.classList.remove('show');
    setTimeout(()=>{ backEl.remove(); backEl=null; }, 220);
    // Tras configurar, ofrece el tour de Nutrición (una sola vez)
    if(window.pnTutorial && window.pnTutorialSeen && !window.pnTutorialSeen('nutri')){
      setTimeout(()=>{ if(!window.pnCurrentSection || window.pnCurrentSection()==='nutri') window.pnTutorial('nutri'); }, 500);
    }
  }

  // Escribe PEOPLE y TARGETS a partir de los datos del asistente
  function applyPeople(){
    const ids = personIds(N);
    const calcInputs = (typeof getCalcInputs==='function') ? getCalcInputs() : {};
    // limpia ids que ya no se usan (deja AB)
    Object.keys(TARGETS).forEach(k=>{ if(k!=='AB' && !ids.includes(k)) delete TARGETS[k]; });
    ids.forEach((id,i)=>{
      const p = people[i]; const r = calc(p) || {goal:1800, macros:{p:120,f:60,c:200}};
      const name = (p.name||'').trim() || ('Persona '+(i+1));
      TARGETS[id] = Object.assign(TARGETS[id]||{}, {
        kcal: r.goal, p: r.macros.p, f: r.macros.f, c: r.macros.c,
        name, sym: (typeof PERSON_SYMS!=='undefined' ? PERSON_SYMS[i] : '🧑') || '🧑',
        restr: (TARGETS[id]&&TARGETS[id].restr)||[], modifier: i===0 ? null : undefined
      });
      calcInputs[id] = { kg:+p.kg||null, cm:+p.cm||null, act:p.act, goal:p.goal, sex:p.sex||'M', age:+p.age||null };
    });
    PEOPLE = ids;  // reasigna la lista global (binding léxico compartido entre scripts)
    // valida persona activa
    if(typeof S!=='undefined' && S){ if(!ids.includes(S.p) && S.p!=='AB') S.p = ids[0]; }
    if(typeof saveCalcInputs==='function') saveCalcInputs(calcInputs);
    if(typeof recomputeAB==='function') recomputeAB();
    if(typeof recomputeAllComp==='function') recomputeAllComp();
    if(typeof persistTargets==='function') persistTargets();
    if(typeof renderPersonToggle==='function') renderPersonToggle();
    if(typeof renderAll==='function') renderAll();
  }

  function open(force){
    injectCSS();
    // precarga datos existentes si los hay
    if(typeof PEOPLE!=='undefined' && PEOPLE.length && !force){
      N = PEOPLE.length;
      people = PEOPLE.map((id,i)=>{
        const ci = (typeof getCalcInputs==='function' ? getCalcInputs()[id] : {}) || {};
        const t = TARGETS[id]||{};
        return { name:(t.name||'').replace(/kg$/,''), sex:ci.sex||'M', age:ci.age||'', kg:ci.kg||'', cm:ci.cm||'', act:ci.act||'mod', goal:ci.goal||'man' };
      });
    } else { people = []; ensurePeople(); }
    step = 0;
    backEl = document.createElement('div');
    backEl.className='ob-back';
    backEl.innerHTML='<div class="ob" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(backEl);
    requestAnimationFrame(()=> backEl.classList.add('show'));
    render();
  }

  function seen(){ try{ return localStorage.getItem(FLAG)==='1'; }catch(e){ return true; } }

  window.pnOnboarding = { open, seen };

  // Auto-arranque la primera vez (tras cargar el resto de la app)
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!seen()) setTimeout(()=>{ try{ open(false); }catch(e){} }, 600);
  });
})();
