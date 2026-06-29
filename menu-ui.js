/* ══════════════════════════════════════════════════════════
   menu-ui.js · Diálogos y avisos con el diseño de la app
   Sustituye los alert()/confirm()/prompt() nativos por modales
   coherentes con la paleta y tipografía de Plan Nutricional.

   API global:
     pnToast(msg, type)        → aviso flotante breve (no bloquea)
     pnAlert(msg, opts)        → Promise, modal con un botón OK
     pnConfirm(msg, opts)      → Promise<boolean>, OK / Cancelar
     pnPrompt(msg, def, opts)  → Promise<string|null>, campo de texto

   Además sobreescribe window.alert para que CUALQUIER alert() del
   código quede con el estilo de la app sin tocar la llamada.
══════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__pnUiLoaded) return;
  window.__pnUiLoaded = true;

  /* ── Estilos (autoinyectados para que el módulo sea portable) ── */
  const CSS = `
  .pn-dlg-back{position:fixed;inset:0;z-index:4000;display:flex;align-items:center;
    justify-content:center;padding:22px;background:rgba(34,22,8,.46);
    backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
    opacity:0;transition:opacity .18s ease}
  .pn-dlg-back.show{opacity:1}
  .pn-dlg{background:var(--white,#FFFDF7);color:var(--warm,#2C1F0E);
    width:100%;max-width:380px;border-radius:18px;
    box-shadow:0 24px 70px rgba(34,22,8,.4);overflow:hidden;
    transform:translateY(10px) scale(.98);transition:transform .2s cubic-bezier(.2,.9,.3,1);
    border:1px solid rgba(44,31,14,.08)}
  .pn-dlg-back.show .pn-dlg{transform:none}
  .pn-dlg-top{height:5px;background:var(--accent,var(--terra,#B5603A))}
  .pn-dlg-body{padding:22px 22px 8px;text-align:center}
  .pn-dlg-ico{font-size:2rem;line-height:1;margin-bottom:10px}
  .pn-dlg-title{font-family:'Playfair Display',serif;font-weight:700;font-size:1.18rem;
    margin:0 0 6px;color:var(--warm,#2C1F0E)}
  .pn-dlg-msg{font-family:'Lora',Georgia,serif;font-size:.95rem;line-height:1.5;
    color:var(--ink-70,rgba(44,31,14,.78));white-space:pre-line;margin:0}
  .pn-dlg-input{width:100%;margin-top:14px;border:1.5px solid rgba(44,31,14,.18);
    background:var(--cream,#F6EDD8);color:var(--warm,#2C1F0E);font-family:'Lora',serif;
    font-size:1rem;padding:11px 13px;border-radius:11px;transition:.18s}
  .pn-dlg-input:focus{outline:none;border-color:var(--accent,var(--terra,#B5603A));
    box-shadow:0 0 0 3px rgba(181,96,58,.14);background:#fff}
  .pn-dlg-acts{display:flex;gap:9px;padding:16px 18px 18px}
  .pn-dlg-btn{flex:1;border:none;border-radius:12px;font-family:'DM Mono',monospace;
    font-size:.74rem;letter-spacing:.05em;text-transform:uppercase;font-weight:600;
    padding:13px 14px;cursor:pointer;transition:.15s;line-height:1}
  .pn-dlg-btn.prim{background:var(--accent,var(--terra,#B5603A));color:#fff;
    box-shadow:0 4px 14px rgba(181,96,58,.3)}
  .pn-dlg-btn.prim:hover{filter:brightness(1.07);transform:translateY(-1px)}
  .pn-dlg-btn.ghost{background:transparent;border:1.5px solid rgba(44,31,14,.18);
    color:var(--warm,#2C1F0E)}
  .pn-dlg-btn.ghost:hover{border-color:var(--warm,#2C1F0E);background:var(--cream,#F6EDD8)}
  .pn-dlg-btn.danger{background:var(--rose,#C0584A);color:#fff;box-shadow:0 4px 14px rgba(192,88,74,.3)}
  .pn-dlg-btn.danger:hover{filter:brightness(1.07);transform:translateY(-1px)}

  /* Toast flotante (reutiliza .pn-toast si menu-session ya lo definió) */
  .pn-toast2{position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateY(16px);
    z-index:4200;background:var(--warm,#2C1F0E);color:var(--cream,#F6EDD8);
    font-family:'Lora',serif;font-size:.9rem;padding:12px 20px;border-radius:30px;
    box-shadow:0 12px 36px rgba(0,0,0,.34);opacity:0;transition:.26s cubic-bezier(.2,.9,.3,1);
    pointer-events:none;max-width:88vw;text-align:center;display:flex;align-items:center;gap:9px}
  .pn-toast2.show{opacity:1;transform:translateX(-50%) translateY(0)}
  .pn-toast2 .pt-ico{font-size:1.05rem;line-height:1}
  .pn-toast2.ok{background:#3E6B3A}
  .pn-toast2.err{background:#9B3528}
  .pn-toast2.warn{background:#9A6B1E}
  @media (max-width:560px){ .pn-dlg{max-width:none} }
  `;
  function injectCSS(){
    if(document.getElementById('pn-ui-css')) return;
    const s = document.createElement('style');
    s.id = 'pn-ui-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  if(document.head) injectCSS();
  else document.addEventListener('DOMContentLoaded', injectCSS);

  /* ── Color de acento: el body lleva la sección activa (sec-*) y por
     tanto la variable --accent correcta. Usamos esa directamente. ── */
  function accentFor(){
    return 'var(--accent, var(--terra, #B5603A))';
  }

  /* ── Núcleo: construye y muestra un diálogo, devuelve Promise ── */
  let _open = 0;
  function dialog(cfg){
    return new Promise(resolve=>{
      injectCSS();
      const back = document.createElement('div');
      back.className = 'pn-dlg-back';
      back.style.setProperty('--accent', cfg.accent || accentFor());

      const ico   = cfg.icon ? `<div class="pn-dlg-ico">${cfg.icon}</div>` : '';
      const title = cfg.title ? `<h3 class="pn-dlg-title">${esc(cfg.title)}</h3>` : '';
      const msg   = cfg.message ? `<p class="pn-dlg-msg">${esc(cfg.message)}</p>` : '';
      const input = cfg.input
        ? `<input class="pn-dlg-input" id="pnDlgInput" type="${cfg.inputType||'text'}"
              placeholder="${esc(cfg.placeholder||'')}" value="${esc(cfg.default||'')}">`
        : '';

      const okCls = cfg.danger ? 'danger' : 'prim';
      const okBtn = `<button class="pn-dlg-btn ${okCls}" data-act="ok">${esc(cfg.okText||'Aceptar')}</button>`;
      const cancelBtn = cfg.cancel
        ? `<button class="pn-dlg-btn ghost" data-act="cancel">${esc(cfg.cancelText||'Cancelar')}</button>`
        : '';
      // En confirmaciones, el botón de cancelar va primero (a la izquierda)
      const acts = cfg.cancel ? cancelBtn + okBtn : okBtn;

      back.innerHTML = `<div class="pn-dlg" role="dialog" aria-modal="true">
        <div class="pn-dlg-top"></div>
        <div class="pn-dlg-body">${ico}${title}${msg}${input}</div>
        <div class="pn-dlg-acts">${acts}</div>
      </div>`;
      document.body.appendChild(back);
      _open++;
      requestAnimationFrame(()=> back.classList.add('show'));

      const inputEl = back.querySelector('#pnDlgInput');
      function close(val){
        back.classList.remove('show');
        document.removeEventListener('keydown', onKey, true);
        setTimeout(()=>{ back.remove(); _open=Math.max(0,_open-1); }, 200);
        resolve(val);
      }
      function onKey(e){
        if(e.key === 'Escape'){ e.preventDefault(); close(cfg.cancel ? (cfg.input?null:false) : (cfg.input?null:true)); }
        else if(e.key === 'Enter' && (cfg.input || !cfg.cancel)){
          e.preventDefault();
          close(cfg.input ? (inputEl?inputEl.value:'') : true);
        }
      }
      document.addEventListener('keydown', onKey, true);
      back.addEventListener('click', e=>{
        const b = e.target.closest('[data-act]');
        if(b){
          if(b.dataset.act === 'ok')      close(cfg.input ? (inputEl?inputEl.value:'') : true);
          else                            close(cfg.input ? null : false);
        } else if(e.target === back && cfg.dismissable !== false){
          close(cfg.input ? null : (cfg.cancel ? false : true));
        }
      });
      if(inputEl){ inputEl.focus(); inputEl.select(); }
      else { const ok = back.querySelector('[data-act="ok"]'); if(ok) ok.focus(); }
    });
  }

  function esc(s){
    return (s==null?'':String(s))
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  /* Separa un mensaje "Título\n\ncuerpo" en title + message si procede */
  function splitMsg(raw){
    const txt = (raw==null?'':String(raw)).trim();
    const nl = txt.indexOf('\n');
    if(nl > 0 && nl < 60){
      const first = txt.slice(0, nl).trim();
      const rest  = txt.slice(nl).trim();
      if(rest) return { title:first, message:rest };
    }
    return { title:'', message:txt };
  }

  /* ── API pública ── */
  function pnAlert(message, opts){
    opts = opts || {};
    const parts = opts.title ? {title:opts.title, message} : splitMsg(message);
    return dialog({
      icon: opts.icon || (opts.type==='error'?'⚠️':opts.type==='ok'?'✅':'💬'),
      title: parts.title || opts.title || '',
      message: parts.message,
      okText: opts.okText || 'Entendido',
      accent: opts.accent,
      cancel: false
    });
  }

  function pnConfirm(message, opts){
    opts = opts || {};
    const parts = opts.title ? {title:opts.title, message} : splitMsg(message);
    return dialog({
      icon: opts.icon || (opts.danger?'🗑️':'❓'),
      title: parts.title || opts.title || '',
      message: parts.message,
      okText: opts.okText || 'Sí, continuar',
      cancelText: opts.cancelText || 'Cancelar',
      danger: !!opts.danger,
      accent: opts.accent,
      cancel: true
    });
  }

  function pnPrompt(message, def, opts){
    opts = opts || {};
    const parts = opts.title ? {title:opts.title, message} : splitMsg(message);
    return dialog({
      icon: opts.icon || '✏️',
      title: parts.title || opts.title || '',
      message: parts.message,
      input: true,
      inputType: opts.inputType || 'text',
      placeholder: opts.placeholder || '',
      default: def || '',
      okText: opts.okText || 'Guardar',
      cancelText: opts.cancelText || 'Cancelar',
      accent: opts.accent,
      cancel: true
    });
  }

  /* ── Toast ── */
  let _toastEl, _toastT;
  function pnToast(msg, type){
    if(!_toastEl){
      _toastEl = document.createElement('div');
      _toastEl.className = 'pn-toast2';
      document.body.appendChild(_toastEl);
    }
    const ico = type==='ok'?'✅':type==='err'?'⚠️':type==='warn'?'⚠️':'💬';
    _toastEl.className = 'pn-toast2' + (type?(' '+type):'');
    _toastEl.innerHTML = `<span class="pt-ico">${ico}</span><span>${esc(msg)}</span>`;
    requestAnimationFrame(()=> _toastEl.classList.add('show'));
    clearTimeout(_toastT);
    _toastT = setTimeout(()=> _toastEl.classList.remove('show'), type==='err'?3600:2400);
  }

  /* ── Drop-in: sustituye window.alert (no toca las llamadas) ──
     Mantiene el nativo accesible por si acaso. confirm/prompt nativos
     no se pueden hacer asíncronos de forma transparente, así que esos
     se migran a pnConfirm/pnPrompt en el código. */
  window.__nativeAlert = window.alert;
  window.alert = function(m){ pnAlert(m); };

  window.pnAlert   = pnAlert;
  window.pnConfirm = pnConfirm;
  window.pnPrompt  = pnPrompt;
  window.pnToast   = pnToast;

  /* ══════════════════════════════════════════════════════════
     TUTORIALES POR SECCIÓN
     Carrusel guiado con el estilo de la app. Cada sección tiene
     sus pasos. El botón ❔ del header abre el de la sección activa.
  ══════════════════════════════════════════════════════════ */
  const TUT_CSS = `
  .pn-tut-back{position:fixed;inset:0;z-index:4500;display:flex;align-items:center;
    justify-content:center;padding:20px;background:rgba(34,22,8,.5);
    backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .2s}
  .pn-tut-back.show{opacity:1}
  .pn-tut{background:var(--white,#FFFDF7);width:100%;max-width:440px;border-radius:20px;
    overflow:hidden;box-shadow:0 28px 80px rgba(34,22,8,.45);
    transform:translateY(12px) scale(.98);transition:transform .22s cubic-bezier(.2,.9,.3,1);
    display:flex;flex-direction:column;max-height:92vh}
  .pn-tut-back.show .pn-tut{transform:none}
  .pn-tut-head{background:var(--accent,#B5603A);color:#fff;padding:16px 20px 14px;
    display:flex;align-items:center;justify-content:space-between;gap:10px}
  .pn-tut-head .pn-tut-sec{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.12em;
    text-transform:uppercase;opacity:.85}
  .pn-tut-x{border:none;background:rgba(255,255,255,.18);color:#fff;width:30px;height:30px;
    border-radius:50%;cursor:pointer;font-size:.9rem;line-height:1;flex-shrink:0;transition:.15s}
  .pn-tut-x:hover{background:rgba(255,255,255,.32)}
  .pn-tut-body{padding:26px 24px 8px;text-align:center;overflow-y:auto}
  .pn-tut-ico{font-size:2.8rem;line-height:1;margin-bottom:14px}
  .pn-tut-title{font-family:'Playfair Display',serif;font-weight:700;font-size:1.32rem;
    color:var(--warm,#2C1F0E);margin:0 0 10px}
  .pn-tut-txt{font-family:'Lora',Georgia,serif;font-size:.98rem;line-height:1.6;
    color:var(--ink-70,rgba(44,31,14,.78));margin:0 auto;max-width:340px;white-space:pre-line}
  .pn-tut-dots{display:flex;gap:7px;justify-content:center;padding:16px 0 6px}
  .pn-tut-dot{width:8px;height:8px;border-radius:50%;background:rgba(44,31,14,.16);transition:.2s;cursor:pointer}
  .pn-tut-dot.on{background:var(--accent,#B5603A);transform:scale(1.25)}
  .pn-tut-foot{display:flex;gap:10px;padding:14px 20px 20px;align-items:center}
  .pn-tut-btn{border:none;border-radius:12px;font-family:'DM Mono',monospace;font-size:.74rem;
    letter-spacing:.05em;text-transform:uppercase;font-weight:600;padding:13px 18px;cursor:pointer;transition:.15s}
  .pn-tut-btn.prim{background:var(--accent,#B5603A);color:#fff;flex:1;box-shadow:0 4px 14px rgba(44,31,14,.18)}
  .pn-tut-btn.prim:hover{filter:brightness(1.08);transform:translateY(-1px)}
  .pn-tut-btn.ghost{background:transparent;border:1.5px solid rgba(44,31,14,.18);color:var(--warm,#2C1F0E)}
  .pn-tut-btn.ghost:hover{border-color:var(--warm,#2C1F0E);background:var(--cream,#F6EDD8)}
  .pn-tut-btn:disabled{opacity:.35;cursor:default;transform:none;box-shadow:none}
  @media(max-width:560px){ .pn-tut{max-width:none} .pn-tut-title{font-size:1.18rem} }
  `;
  function injectTutCSS(){
    if(document.getElementById('pn-tut-css')) return;
    const s = document.createElement('style'); s.id='pn-tut-css'; s.textContent=TUT_CSS;
    (document.head||document.documentElement).appendChild(s);
  }

  const TUTORIALS = {
    nutri: { sec:'Nutrición', steps:[
      {ico:'🥗', t:'Tu menú, a tu medida', x:'En Nutrición construyes el menú de cada persona según sus objetivos de kcal y macros. Cada receta se escala automáticamente a quien la coma, así que un mismo plato sirve para todos.'},
      {ico:'👥', t:'Elige a quién ves', x:'Con los botones de persona (arriba) cambias entre cada comensal o ves a todos juntos. Las cantidades y los totales se recalculan al instante.'},
      {ico:'📖', t:'Catálogo de recetas', x:'Las recetas están por categoría (desayuno, comida, merienda, cena). Toca el título de una categoría para desplegarla y toca una receta para ver su ficha.'},
      {ico:'🔎', t:'Busca y filtra', x:'Usa el buscador y el botón ⚙ Filtros para acotar por dieta (sin gluten, vegetariano…) o tipo de alimento. La ★ marca tus favoritas.'},
      {ico:'🧭', t:'Asistente de menú', x:'En Plan Semanal, el 🧭 Asistente te guía paso a paso: eliges las recetas que te apetecen y él reparte la semana. Te avisa en rojo si te pasas de alguna recomendación, pero nunca te lo impide.'},
      {ico:'✨', t:'Plan Semanal', x:'Planifica la semana a mano o con ✨ Autocompletar (rellena solo las franjas vacías). En ⋯ Más acciones tienes Generar de cero, Con mis favoritos, Plantilla base, PDF y lista de la compra.'},
      {ico:'🍽️', t:'Mi día', x:'El botón 📋 flotante abre "Mi día": añade platos o alimentos sueltos y comprueba cómo va tu balance de kcal y macros de hoy.'},
      {ico:'✚', t:'Crea tus recetas', x:'En Usuarios → Mis recetas añades las tuyas con ingredientes y cantidades, o generas un prompt para pedírselas a una IA y pegar el resultado.'},
      {ico:'🌍', t:'Cocinas (paquetes)', x:'En Usuarios → Configuración activas paquetes de cocina (italiana, etc.) para que aparezcan más recetas, o instalas los tuyos desde un archivo.'},
      {ico:'💾', t:'Todo se guarda solo', x:'Tus cambios se guardan en el dispositivo automáticamente (copia cada 5 min). En Usuarios → Copia de datos exportas o restauras todo.'}
    ]},
    sport: { sec:'Deporte', steps:[
      {ico:'🏋️', t:'Tu entrenamiento', x:'En Deporte gestionas ejercicios, sesiones y tu plan de Entrenamientos. El gasto calórico se conecta con tu balance de Nutrición en la Agenda.'},
      {ico:'💪', t:'Ejercicios', x:'La librería completa de ejercicios. Márcalos con la ★, crea los tuyos o impórtalos por JSON. Toca uno para ver técnica y músculos.'},
      {ico:'📋', t:'Sesiones', x:'Agrupa ejercicios en rutinas reutilizables. Puedes crearlas a mano o generarlas con ayuda de una IA mediante un prompt.'},
      {ico:'🧭', t:'Asistente con valores por defecto', x:'En Entrenamientos, el 🧭 Asistente te guía por objetivo, días y duración. ¿Con prisa? Pulsa "⚡ Por defecto" en cualquier paso y genera un plan equilibrado al instante.'},
      {ico:'🗓️', t:'Plan por fechas', x:'Asigna sesiones a tus días. La barra está despejada: lo principal a la vista y el resto en ⋯ Más acciones (cadencia, regenerar, PDF…).'},
      {ico:'📂', t:'Guardados', x:'Guarda planes completos en 📂 Guardados y cárgalos cuando quieras para reutilizarlos.'}
    ]},
    week: { sec:'Agenda', steps:[
      {ico:'📆', t:'Comida + entreno por fechas', x:'La Agenda reúne tu plan de comida y de entreno en fechas reales, con el balance de cada día de un vistazo. Navega entre semanas con ‹ ›.'},
      {ico:'📚', t:'PDF completo', x:'Aquí está el botón 📚 PDF completo: exporta en un solo documento la semana, las recetas y los entrenamientos. Todo concentrado en un sitio.'},
      {ico:'🔀', t:'Accesos rápidos', x:'La fila "Ir a:" te lleva en un toque a Plan Semanal, Entrenamientos o Mente, sin pasar por el menú. También están en esas páginas para volver.'},
      {ico:'📌', t:'Aplica tu plantilla', x:'Vuelca tu plantilla semanal a 7 fechas concretas. Quedan como copias editables por día, sin tocar la plantilla original.'},
      {ico:'🍽️', t:'Detalle por día', x:'Toca cualquier comida o entreno para ver su ficha completa con ingredientes, macros o ejercicios.'}
    ]},
    mente: { sec:'Mente', steps:[
      {ico:'🧠', t:'Mente en Forma', x:'Esta sección cuida tu bienestar mientras haces la dieta: estado de ánimo, hábitos y herramientas psicológicas. Funciona dentro de la misma app, con su barra de pestañas abajo.'},
      {ico:'🏠', t:'Hoy', x:'Cada día marcas cómo te sientes con una carita y registras tus hábitos. Un anillo te muestra tu progreso del día, sin presión. También puedes grabar un mensaje de ánimo y escucharlo cuando lo necesites.'},
      {ico:'📖', t:'Diario', x:'Graba notas de voz, haz fotos de seguimiento y escribe cómo va tu día. Todo queda guardado en tu dispositivo.'},
      {ico:'📊', t:'Tendencia', x:'Revisa tu evolución con calma: gráficos, calendario de días pasados y mensajes amables sobre cómo te sientes.'},
      {ico:'💚', t:'Apoyo', x:'Tu caja de herramientas: respiración guiada 4-7-8, técnicas para la ansiedad sin recurrir a la comida y recursos para los días flojos.'},
      {ico:'🔒', t:'Privado y local', x:'Todos tus datos de Mente se guardan solo en tu dispositivo. Nada sale de aquí.'}
    ]}
  };

  function currentSection(){
    const b = document.body;
    if(b.classList.contains('sec-mente') || b.classList.contains('mente-mode')) return 'mente';
    if(b.classList.contains('sec-sport')) return 'sport';
    if(b.classList.contains('sec-week'))  return 'week';
    return 'nutri';
  }

  function pnTutorial(secKey){
    injectTutCSS();
    const key = secKey || currentSection();
    const tut = TUTORIALS[key] || TUTORIALS.nutri;
    let i = 0;
    const back = document.createElement('div');
    back.className = 'pn-tut-back';
    back.innerHTML = `<div class="pn-tut" role="dialog" aria-modal="true">
      <div class="pn-tut-head">
        <span class="pn-tut-sec">Tutorial · ${esc(tut.sec)}</span>
        <button class="pn-tut-x" data-act="close" aria-label="Cerrar">✕</button>
      </div>
      <div class="pn-tut-body">
        <div class="pn-tut-ico"></div>
        <h3 class="pn-tut-title"></h3>
        <p class="pn-tut-txt"></p>
        <div class="pn-tut-dots"></div>
      </div>
      <div class="pn-tut-foot">
        <button class="pn-tut-btn ghost" data-act="prev">Atrás</button>
        <button class="pn-tut-btn prim" data-act="next">Siguiente</button>
      </div>
    </div>`;
    document.body.appendChild(back);
    requestAnimationFrame(()=> back.classList.add('show'));

    const icoEl  = back.querySelector('.pn-tut-ico');
    const titEl  = back.querySelector('.pn-tut-title');
    const txtEl  = back.querySelector('.pn-tut-txt');
    const dotsEl = back.querySelector('.pn-tut-dots');
    const prevB  = back.querySelector('[data-act="prev"]');
    const nextB  = back.querySelector('[data-act="next"]');

    function render(){
      const s = tut.steps[i];
      icoEl.textContent = s.ico;
      titEl.textContent = s.t;
      txtEl.textContent = s.x;
      dotsEl.innerHTML = tut.steps.map((_,j)=>`<span class="pn-tut-dot ${j===i?'on':''}" data-go="${j}"></span>`).join('');
      prevB.disabled = (i===0);
      nextB.textContent = (i===tut.steps.length-1) ? '¡Entendido!' : 'Siguiente';
    }
    function close(){
      back.classList.remove('show');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(()=> back.remove(), 220);
      try{ localStorage.setItem('mnut:tut:'+key, '1'); }catch(e){}
    }
    function onKey(e){
      if(e.key==='Escape') close();
      else if(e.key==='ArrowRight' && i<tut.steps.length-1){ i++; render(); }
      else if(e.key==='ArrowLeft'  && i>0){ i--; render(); }
    }
    back.addEventListener('click', e=>{
      const go = e.target.closest('[data-go]');
      if(go){ i = +go.dataset.go; render(); return; }
      const b = e.target.closest('[data-act]');
      if(!b){ if(e.target===back) close(); return; }
      if(b.dataset.act==='close') close();
      else if(b.dataset.act==='prev'){ if(i>0){ i--; render(); } }
      else if(b.dataset.act==='next'){ if(i<tut.steps.length-1){ i++; render(); } else close(); }
    });
    document.addEventListener('keydown', onKey, true);
    render();
  }

  /* ¿Se ha visto ya el tutorial de una sección? (para autoabrir 1ª vez) */
  function tutorialSeen(key){ try{ return localStorage.getItem('mnut:tut:'+key)==='1'; }catch(e){ return true; } }

  window.pnTutorial   = pnTutorial;
  window.pnTutorialSeen = tutorialSeen;
  window.pnCurrentSection = currentSection;

  /* ══════════════════════════════════════════════════════════
     INFORMACIÓN Y AVISO LEGAL
  ══════════════════════════════════════════════════════════ */
  const INFO_CSS = `
  .pn-info-back{position:fixed;top:var(--hdr-h,0);left:0;right:0;bottom:0;z-index:180;display:flex;align-items:stretch;
    justify-content:center;background:var(--cream,#F5EEE4);opacity:0;transition:opacity .2s}
  .pn-info-back.show{opacity:1}
  .pn-info{background:var(--white,#FFFDF7);width:100%;max-width:860px;overflow:hidden;
    box-shadow:0 0 60px rgba(34,22,8,.12);display:flex;flex-direction:column;height:100%;
    transform:translateY(8px);transition:transform .22s cubic-bezier(.2,.9,.3,1)}
  .pn-info-back.show .pn-info{transform:none}
  .pn-info-hd{background:var(--accent,#B5603A);color:#fff;padding:16px 22px;display:flex;
    align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0}
  .pn-info-back-btn{border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:10px;
    padding:8px 14px;min-height:40px;cursor:pointer;font-size:.85rem;display:flex;align-items:center;gap:6px;transition:.15s}
  .pn-info-back-btn:hover{background:rgba(255,255,255,.32)}
  .pn-info-link{border:1.5px solid var(--accent,#B5603A);background:rgba(181,96,58,.08);color:var(--accent,#B5603A);
    border-radius:10px;padding:10px 14px;min-height:42px;cursor:pointer;font-size:.88rem;font-weight:600;transition:.15s}
  .pn-info-link:hover{background:var(--accent,#B5603A);color:#fff}
  .pn-info-hd h3{font-family:'Playfair Display',serif;font-weight:700;font-size:1.25rem;margin:0}
  .pn-info-x{border:none;background:rgba(255,255,255,.18);color:#fff;width:32px;height:32px;border-radius:50%;
    cursor:pointer;font-size:.95rem;flex-shrink:0;transition:.15s}
  .pn-info-x:hover{background:rgba(255,255,255,.32)}
  .pn-info-body{padding:20px 22px 8px;overflow-y:auto;font-family:'Lora',Georgia,serif;
    font-size:.95rem;line-height:1.62;color:var(--ink-70,rgba(44,31,14,.82))}
  .pn-info-body h4{font-family:'Playfair Display',serif;font-size:1.05rem;color:var(--warm,#2C1F0E);
    margin:16px 0 6px;font-weight:700}
  .pn-info-body p{margin:0 0 10px}
  .pn-info-body ul{margin:0 0 12px;padding-left:20px}
  .pn-info-body li{margin-bottom:5px}
  .pn-info-body strong{color:var(--warm-2,#3D2C1A)}
  .pn-info-foot{padding:14px 22px 20px}
  .pn-info-foot button{width:100%;border:none;border-radius:12px;background:var(--accent,#B5603A);color:#fff;
    font-family:'DM Mono',monospace;font-size:.74rem;letter-spacing:.05em;text-transform:uppercase;
    font-weight:600;padding:13px;cursor:pointer;transition:.15s}
  .pn-info-foot button:hover{filter:brightness(1.08)}
  @media(max-width:560px){ .pn-info{max-width:none} }
  `;
  const INFO_HTML = `
    <p><strong>Plan Nutricional</strong> es una herramienta personal de organización
    creada por <strong>Juan María Gámez Ortiz</strong>. Su objetivo es ayudarte a
    orientarte de forma coherente y razonada con tu alimentación, tu entrenamiento y
    tu bienestar.</p>

    <h4>No es una aplicación de uso exclusivo ni profesional</h4>
    <p>Esta app <strong>no sustituye</strong> el consejo de un médico, dietista-nutricionista,
    entrenador ni psicólogo. Es una guía orientativa: úsala con criterio y nunca al pie
    de la letra.</p>

    <h4>La información puede contener errores</h4>
    <ul>
      <li>Los valores nutricionales, cálculos de calorías y macros son <strong>estimaciones</strong>
      y pueden no ser exactos.</li>
      <li>Parte del contenido (recetas, textos, sugerencias) puede estar
      <strong>generado por inteligencia artificial</strong> o aportado por
      <strong>otros usuarios</strong>, por lo que puede contener imprecisiones.</li>
      <li>Mantén siempre el <strong>espíritu crítico</strong>: contrasta, ajusta a tu caso
      y consulta a un profesional ante cualquier duda de salud.</li>
    </ul>

    <h4>Tus datos</h4>
    <p>Todos tus datos se guardan <strong>localmente en tu dispositivo</strong>. La app no
    los envía a ningún servidor.</p>

    <h4>Descargo de responsabilidad</h4>
    <p>Esta app es <strong>solo una herramienta</strong> orientativa y <strong>no está
    pensada para personas con enfermedad</strong>. Lee el descargo completo:</p>
    <p><button class="pn-info-link" data-go="descargo">⚖️ Ver descargo de responsabilidad →</button></p>

    <p style="font-size:.82rem;color:var(--ink-50,rgba(44,31,14,.5));margin-top:14px">
    © <span class="pn-info-year">2026</span> Juan María Gámez Ortiz · Licencia CC BY-NC 4.0 ·
    Desarrollado con la ayuda de Claude.</p>
  `;
  const DESCARGO_HTML = `
    <h4>Esta aplicación no es para tratar enfermedades</h4>
    <p><strong>Esta aplicación no está pensada para personas que padezcan algún tipo de
    enfermedad</strong> (metabólica, digestiva, renal, cardiovascular, trastornos de la
    conducta alimentaria u otras), ni para mujeres embarazadas o en lactancia, ni para
    personas en tratamiento médico o farmacológico. En esos casos, la alimentación y el
    ejercicio deben estar supervisados por un profesional sanitario.</p>

    <h4>Solo es una herramienta</h4>
    <p>Conviene insistir: esto es <strong>únicamente una herramienta</strong> de
    organización orientativa, no un consejo médico ni un plan terapéutico. Antes de
    aplicar cualquier cambio en tu dieta o tu actividad física, y especialmente ante
    cualquier síntoma o duda de salud, <strong>consulta con tu médico/a de familia</strong>.</p>

    <h4>Responsabilidad del usuario</h4>
    <p>El uso de esta aplicación y de la información que contiene es
    <strong>responsabilidad exclusiva del usuario</strong>. El autor no se hace
    responsable de decisiones, daños o perjuicios derivados de su uso. Si tienes una
    condición médica, alergias, intolerancias o sigues un tratamiento, consulta con un
    profesional antes de aplicar cualquier cambio.</p>
  `;
  function injectInfoCSS(){
    if(document.getElementById('pn-info-css')) return;
    const s=document.createElement('style'); s.id='pn-info-css'; s.textContent=INFO_CSS;
    (document.head||document.documentElement).appendChild(s);
  }
  const LEGAL_PAGES = {
    info:     { title:'ℹ️ Información y aviso legal', html:()=>INFO_HTML },
    descargo: { title:'⚖️ Descargo de responsabilidad', html:()=>DESCARGO_HTML }
  };
  // Página legal a pantalla completa, con botón Volver e integración con el
  // botón Atrás del navegador (pushState/popstate) → se comporta como una página.
  function pnLegalPage(key){
    key = LEGAL_PAGES[key] ? key : 'info';
    injectInfoCSS();
    const page = LEGAL_PAGES[key];
    const back=document.createElement('div'); back.className='pn-info-back';
    back.innerHTML=`<div class="pn-info" role="region" aria-label="${page.title}">
      <div class="pn-info-hd">
        <button class="pn-info-back-btn" data-x aria-label="Volver">← Volver</button>
        <h3>${page.title}</h3>
        <span style="width:70px"></span>
      </div>
      <div class="pn-info-body">${page.html()}</div>
    </div>`;
    document.body.appendChild(back);
    const yr=back.querySelector('.pn-info-year'); if(yr) yr.textContent=new Date().getFullYear();
    requestAnimationFrame(()=> back.classList.add('show'));
    let closed=false;
    try{ history.pushState({pnLegal:key}, ''); }catch(e){}
    function close(fromPop){
      if(closed) return; closed=true;
      back.classList.remove('show'); setTimeout(()=>back.remove(),200);
      document.removeEventListener('keydown',onKey,true);
      window.removeEventListener('popstate',onPop);
      if(!fromPop){ try{ history.back(); }catch(e){} }
    }
    function onKey(e){ if(e.key==='Escape') close(); }
    function onPop(){ close(true); }
    // Navegación entre páginas legales (enlace al descargo)
    back.addEventListener('click', e=>{
      const go = e.target.closest('[data-go]');
      if(go){ close(); setTimeout(()=> pnLegalPage(go.dataset.go), 60); return; }
      if(e.target.closest('[data-x]')) close();
    });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', onPop);
  }
  function pnInfoLegal(){ pnLegalPage('info'); }
  function pnDescargo(){ pnLegalPage('descargo'); }
  window.pnInfoLegal = pnInfoLegal;
  window.pnDescargo  = pnDescargo;
  window.pnLegalPage = pnLegalPage;

  /* Botón ❔ del header → tutorial de la sección activa.
     Además, la PRIMERA vez que se entra a una sección, se abre solo. */
  document.addEventListener('DOMContentLoaded', ()=>{
    const help = document.getElementById('helpBtn');
    if(help) help.addEventListener('click', ()=> pnTutorial(currentSection()));
    const info = document.getElementById('infoLegalBtn');
    if(info) info.addEventListener('click', pnInfoLegal);
    // Tutorial de Nutrición la primera vez — pero NO si aún está el onboarding
    // pendiente (primero el asistente, luego el tour; lo lanza el propio onboarding al acabar).
    const obDone = !window.pnOnboarding || window.pnOnboarding.seen();
    if(obDone && !tutorialSeen('nutri')){
      setTimeout(()=>{ if(currentSection()==='nutri') pnTutorial('nutri'); }, 900);
    }
  });

  /* Engancha el cambio de sección para autoabrir su tutorial la 1ª vez.
     setSection() vive en sport-ui; lo envolvemos cuando exista. */
  function hookSectionTutorial(){
    if(typeof window.setSection !== 'function'){ return setTimeout(hookSectionTutorial, 300); }
    if(window.__pnSecHooked) return; window.__pnSecHooked = true;
    const orig = window.setSection;
    window.setSection = function(sec){
      const r = orig.apply(this, arguments);
      if(sec && sec!=='nutri' && !tutorialSeen(sec)){
        setTimeout(()=>{ if(currentSection()===sec) pnTutorial(sec); }, 500);
      }
      return r;
    };
  }
  hookSectionTutorial();
})();
