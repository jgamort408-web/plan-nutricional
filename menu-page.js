/* ══════════════════════════════════════════════════════════
   APP PAGE · shell común para las páginas de contenido
   ----------------------------------------------------------
   Recomendaciones, Medidas, Teoría, Bibliografía, Información y
   Descargo comparten este "marco de página": ocupan el área bajo
   el header (que se mantiene con su aspecto, dejando visible solo
   el botón de ayuda), sin cabecera interna ni botón "Atrás" propio,
   con el color de acento de la sección activa, y son navegables a
   izquierda/derecha por swipe en móvil. Se cierran con el botón
   Atrás del navegador/dispositivo (pushState/popstate) o Escape.
   ========================================================== */
(function(){
  'use strict';

  // Orden de navegación por swipe entre páginas del mismo grupo.
  const GROUPS = { info: ['reco','measures','teoria','biblio','infolegal','descargo'] };
  const OPENERS = {};        // key → función que abre esa página
  let _cur = null;           // página actual {el, key, group, close}
  let _savedSub = null;      // subtítulo del logo previo a abrir una página

  // Subtítulo del logo (#logoSub) contextual mientras hay una página abierta.
  // Guarda el original la PRIMERA vez (no al navegar entre páginas del grupo).
  function setSubtitle(text){
    const el=document.getElementById('logoSub'); if(!el) return;
    if(_savedSub===null) _savedSub=el.textContent;
    if(text!=null) el.textContent=text;
  }
  function restoreSubtitle(){
    const el=document.getElementById('logoSub');
    if(el && _savedSub!==null) el.textContent=_savedSub;
    _savedSub=null;
  }

  function injectCSS(){
    if(document.getElementById('app-page-css')) return;
    const s=document.createElement('style'); s.id='app-page-css'; s.textContent=`
    .app-page{position:fixed;top:var(--hdr-h,0);left:0;right:0;bottom:0;z-index:150;
      background:var(--cream,#F5EEE4);display:flex;justify-content:center;opacity:0;transition:opacity .2s}
    .app-page.show{opacity:1}
    .app-page.slide-l{animation:apSlideL .22s ease} .app-page.slide-r{animation:apSlideR .22s ease}
    @keyframes apSlideL{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}
    @keyframes apSlideR{from{transform:translateX(-28px);opacity:.4}to{transform:none;opacity:1}}
    .app-page-inner{background:var(--white,#FFFDF7);width:100%;max-width:900px;height:100%;overflow:hidden;
      box-shadow:0 0 60px rgba(34,22,8,.10);display:flex;flex-direction:column;
      border-top:4px solid var(--accent,#B5603A)}
    .app-page-scroll{flex:1;overflow:auto;padding:20px 22px 40px;font-family:'Lora',Georgia,serif}
    .app-page-title{font-family:'Playfair Display',serif;font-weight:700;font-size:clamp(1.35rem,4.5vw,1.7rem);
      color:var(--accent,#B5603A);line-height:1.2;margin:0 0 14px;padding-bottom:12px;
      border-bottom:1px solid rgba(44,31,14,.1)}
    .app-page-swipe-hint{display:none;text-align:center;font-size:.72rem;color:var(--ink-50,#6b5d49);
      padding:6px 0 0;font-family:'DM Mono',monospace;letter-spacing:.04em}
    @media(max-width:760px){ .app-page-inner{max-width:none;border-top-width:3px} .app-page-swipe-hint{display:block} }
    /* Evita el scroll de fondo (doble barra de scroll) mientras hay una página abierta. */
    body.app-page-open{overflow:hidden !important}
    /* En una página de contenido el header conserva su aspecto pero deja visible solo Ayuda. */
    body.app-page-open .ptoggle,
    body.app-page-open .hdr-ctx,
    body.app-page-open .sec-switch,
    body.app-page-open #nutriVtabs,
    body.app-page-open #sportVtabs,
    body.app-page-open .catnav,
    body.app-page-open .cart-fab,
    body.app-page-open .app-tabbar{ display:none !important; }
    /* Acción contextual en la cabecera (p. ej. "← Índice" en Teoría), a la derecha junto a Ayuda. */
    .app-hdr-action{flex:0 0 auto;border:none;background:rgba(255,255,255,.16);color:var(--hdr-ink,#FBF7EC);
      border-radius:18px;padding:7px 13px;min-height:36px;cursor:pointer;font-size:.82rem;
      display:inline-flex;align-items:center;gap:6px;transition:.15s;white-space:nowrap}
    .app-hdr-action:hover{background:rgba(255,255,255,.3)}
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  // Recalcula --hdr-h con el alto REAL del header (que cambia al ocultar/mostrar
  // sus filas contextuales con body.app-page-open) → la página encaja justo debajo.
  function syncHdrH(){
    requestAnimationFrame(()=>{ const h=document.querySelector('.hdr'); if(h) document.documentElement.style.setProperty('--hdr-h', h.offsetHeight+'px'); });
  }

  function close(silent){
    const cur=_cur; if(!cur || cur.closed) return; cur.closed=true;
    cur.el.classList.remove('show'); const el=cur.el; setTimeout(()=>el.remove(),200);
    document.removeEventListener('keydown', cur.onKey, true);
    window.removeEventListener('popstate', cur.onPop);
    _cur=null;
    // No condicionar al querySelector: el elemento aún está en el DOM (se quita a los 200ms).
    // Como no apilamos páginas, al cerrar siempre se restablece el fondo.
    if(!document.getElementById('formBg') || !document.getElementById('formBg').classList.contains('users-mode')){
      document.body.classList.remove('app-page-open');
    }
    document.body.classList.remove('page-info');
    clearHeaderAction();
    restoreSubtitle();
    syncHdrH();
    if(!silent){ try{ history.back(); }catch(e){} }
  }

  // Abre una página. opts: {key, group, icon, title, render(bodyEl, pageEl), titleHidden}
  function open(opts){
    opts = opts || {};
    injectCSS();
    // Si estaba abierta la página de Usuarios/Configuración, ciérrala (no superponer).
    try{ const bg=document.getElementById('formBg'); if(bg && bg.classList.contains('users-mode') && bg.classList.contains('show') && typeof closeForm==='function') closeForm(true); }catch(e){}
    const replacing = !!_cur;          // venimos de otra página del grupo → no apilar history
    if(_cur){ const c=_cur; c.closed=true; c.el.classList.remove('show'); const el=c.el;
      document.removeEventListener('keydown', c.onKey, true); window.removeEventListener('popstate', c.onPop);
      setTimeout(()=>el.remove(),180); _cur=null; }

    const back=document.createElement('div'); back.className='app-page';
    back.innerHTML=`<div class="app-page-inner"><div class="app-page-scroll" tabindex="-1">
      ${opts.titleHidden?'':`<h1 class="app-page-title">${opts.icon?opts.icon+' ':''}${opts.title||''}</h1>`}
      <div class="app-page-body"></div>
      ${opts.group?'<div class="app-page-swipe-hint">‹ desliza para cambiar de página ›</div>':''}
    </div></div>`;
    document.body.appendChild(back);
    document.body.classList.add('app-page-open');
    // Color de cabecera propio de las páginas de info (ciruela), distinto de las secciones.
    if(opts.group==='info' || opts.bodyClass) document.body.classList.add(opts.bodyClass || 'page-info');
    setSubtitle(opts.subtitle!=null ? opts.subtitle : (opts.group==='info' ? 'Guía y referencias' : null));
    syncHdrH();
    const bodyEl = back.querySelector('.app-page-body');
    try{ if(opts.render) opts.render(bodyEl, back); }catch(e){ console.error('AppPage render', e); }
    requestAnimationFrame(()=> back.classList.add('show'));

    const cur = { el:back, key:opts.key, group:opts.group, closed:false };
    function onKey(e){ if(e.key==='Escape') close(); }
    function onPop(){ close(true); }
    cur.onKey=onKey; cur.onPop=onPop;
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('popstate', onPop);
    if(!replacing){ try{ history.pushState({appPage:opts.key||1}, ''); }catch(e){} }
    _cur = cur;
    enableSwipe(back, opts);
    return { el:back, body:bodyEl, close };
  }

  // Swipe izquierda/derecha entre páginas del grupo (móvil).
  function enableSwipe(el, opts){
    const order = opts.group && GROUPS[opts.group]; if(!order) return;
    let x0=null,y0=null,t0=0;
    el.addEventListener('touchstart', e=>{ const t=e.changedTouches[0]; x0=t.clientX; y0=t.clientY; t0=Date.now(); }, {passive:true});
    el.addEventListener('touchend', e=>{
      if(x0==null) return; const t=e.changedTouches[0]; const dx=t.clientX-x0, dy=t.clientY-y0; const dt=Date.now()-t0; x0=null;
      if(Math.abs(dx)<70 || Math.abs(dx)<Math.abs(dy)*1.4 || dt>700) return;   // gesto horizontal claro
      const i=order.indexOf(opts.key); if(i<0) return;
      const j = dx<0 ? i+1 : i-1; if(j<0 || j>=order.length) return;
      const fn = OPENERS[order[j]]; if(!fn) return;
      _navDir = dx<0 ? 'l' : 'r'; fn();
    }, {passive:true});
  }
  let _navDir=null;

  function register(key, fn){ OPENERS[key]=fn; }

  // Acción contextual en la cabecera de la app (p. ej. "← Índice" en Teoría).
  // Aparece a la derecha, junto al botón de ayuda. Se limpia al cerrar la página.
  function setHeaderAction(label, onClick){
    clearHeaderAction();
    const top = document.querySelector('.hdr-top'); const help = document.getElementById('helpBtn');
    if(!top) return;
    const b = document.createElement('button');
    b.className = 'app-hdr-action'; b.type='button'; b.innerHTML = label;
    b.addEventListener('click', onClick);
    if(help) top.insertBefore(b, help); else top.appendChild(b);
  }
  function clearHeaderAction(){ const b=document.querySelector('.app-hdr-action'); if(b) b.remove(); }

  injectCSS();   // inyecta ya las reglas (incluido body.app-page-open) para que Ajustes también las use

  // Helper reutilizable de swipe horizontal (móvil). Ignora gestos verticales,
  // lentos o cortos. onLeft = deslizar a la izquierda (→ siguiente).
  function pnSwipe(el, onLeft, onRight, opts){
    opts = opts || {}; if(!el) return;
    let x0=null,y0=null,t0=0;
    el.addEventListener('touchstart', e=>{
      if(opts.guard && opts.guard(e.target)) { x0=null; return; }
      const t=e.changedTouches[0]; x0=t.clientX; y0=t.clientY; t0=Date.now();
    }, {passive:true});
    el.addEventListener('touchend', e=>{
      if(x0==null) return; const t=e.changedTouches[0]; const dx=t.clientX-x0, dy=t.clientY-y0, dt=Date.now()-t0; x0=null;
      if(Math.abs(dx)<(opts.min||70) || Math.abs(dx)<Math.abs(dy)*1.5 || dt>(opts.maxT||650)) return;
      if(dx<0){ onLeft&&onLeft(); } else { onRight&&onRight(); }
    }, {passive:true});
  }
  window.pnSwipe = pnSwipe;

  // Swipe global entre SECCIONES principales (Nutrición ↔ Deporte ↔ Agenda ↔ Mente) en móvil.
  (function(){
    const SECS=['nutri','sport','week','mente'];
    function curSec(){ const b=document.body; return b.classList.contains('sec-sport')?'sport':b.classList.contains('sec-week')?'week':(b.classList.contains('sec-mente')||b.classList.contains('mente-mode'))?'mente':'nutri'; }
    const NOSWIPE='input,textarea,select,button,a,label,.cal-grid,.rc-grid,.wk-board,#spCalGrid,.frow,.fbar,.masst,.app-page,.modal,.drawer,[data-noswipe]';
    pnSwipe(document.documentElement,
      ()=>{ if(!okSwipe())return; const i=SECS.indexOf(curSec()); if(i<SECS.length-1 && typeof setSection==='function') setSection(SECS[i+1]); },
      ()=>{ if(!okSwipe())return; const i=SECS.indexOf(curSec()); if(i>0 && typeof setSection==='function') setSection(SECS[i-1]); },
      { min:80, guard:(t)=> window.innerWidth>820 || hasOverlay() || (t.closest && t.closest(NOSWIPE)) });
    function okSwipe(){ return window.innerWidth<=820 && !hasOverlay(); }
    function hasOverlay(){ return !!document.querySelector('.app-page, .masst.show, #sportAsst.show, .mv.show, .modal-bg.show, .drawer.show, .pn-tut-back, .ob-back'); }
  })();

  window.AppPage = { open, close, register, GROUPS, setHeaderAction, clearHeaderAction,
    setSubtitle, restoreSubtitle,
    get current(){ return _cur; },
    consumeDir(){ const d=_navDir; _navDir=null; return d; } };
})();
