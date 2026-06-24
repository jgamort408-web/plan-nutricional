/* ══════════════════════════════════════════════════════════
   VISTA MENSUAL · nutrición
   ----------------------------------------------------------
   Visión por mes. A cada SEMANA del mes se le puede asignar uno
   de los MENÚS GUARDADOS del usuario (persistente). Desde cada
   semana se puede "Cargar" su menú en el Plan Semanal.

   Arranque: asignación + carga. (La aplicación por fechas reales
   del menú asignado se puede ampliar después.)
   Datos: mnut:monthassign:v1 = { lunesKey(YYYY-MM-DD): savedMenuId }
   ========================================================== */
(function(){
  'use strict';
  const LS_ASSIGN = 'mnut:monthassign:v1';
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let _cursor = (function(){ const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  let _root = null;

  function esc(s){ return (typeof escHtml==='function') ? escHtml(s) : String(s==null?'':s); }
  function getAssign(){ try{ const v=localStorage.getItem(LS_ASSIGN); return v?JSON.parse(v):{}; }catch(e){ return {}; } }
  function setAssign(a){ try{ localStorage.setItem(LS_ASSIGN, JSON.stringify(a)); }catch(e){} }

  function key(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
  function monday(d){ const x=new Date(d); const wd=(x.getDay()+6)%7; x.setDate(x.getDate()-wd); x.setHours(0,0,0,0); return x; }
  function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
  function fmt(d){ return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`; }

  function weeksOfMonth(cur){
    const first=new Date(cur.getFullYear(), cur.getMonth(), 1);
    const last=new Date(cur.getFullYear(), cur.getMonth()+1, 0);
    const weeks=[]; let w=monday(first);
    while(w<=last){ weeks.push({start:new Date(w), end:addDays(w,6), key:key(w)}); w=addDays(w,7); }
    return weeks;
  }
  function savedList(){
    if(typeof SavedMenus==='undefined') return [];
    return Object.keys(SavedMenus).map(id=>({id, name:(SavedMenus[id]||{}).name||id}));
  }

  function open(){
    if(!_root){ _root=document.createElement('div'); _root.id='monthView'; _root.className='mv'; document.body.appendChild(_root); _root.addEventListener('click', onClick); _root.addEventListener('change', onChange); }
    document.body.classList.add('no-scroll'); render();
  }
  function close(){ if(_root) _root.classList.remove('show'); document.body.classList.remove('no-scroll'); }

  function render(){
    const weeks = weeksOfMonth(_cursor);
    const assign = getAssign();
    const menus = savedList();
    const todayK = key(monday(new Date()));
    const optsFor = (sel)=> `<option value="">— sin menú —</option>` + menus.map(m=>`<option value="${m.id}" ${sel===m.id?'selected':''}>${esc(m.name)}</option>`).join('');
    const rows = weeks.map((wk,i)=>{
      const sel = assign[wk.key] || '';
      const isThis = wk.key===todayK;
      const mname = sel && SavedMenus[sel] ? SavedMenus[sel].name : '';
      return `<div class="mv-week ${isThis?'now':''}">
        <div class="mv-wk-h"><span class="mv-wk-n">Semana ${i+1}${isThis?' · actual':''}</span><span class="mv-wk-r">${fmt(wk.start)} – ${fmt(wk.end)}</span></div>
        <div class="mv-wk-pick">
          <select class="mv-sel" data-wk="${wk.key}">${optsFor(sel)}</select>
          <button class="mv-load" data-load="${wk.key}" ${sel?'':'disabled'} title="Cargar este menú en el Plan Semanal">Cargar →</button>
        </div>
      </div>`;
    }).join('');

    const emptyMenus = menus.length ? '' : `<p class="mv-note">Aún no tienes menús guardados. Crea uno en el Plan Semanal y guárdalo (💾) para poder asignarlo por semanas.</p>`;

    _root.innerHTML = `
      <div class="mv-bg" data-close="1"></div>
      <div class="mv-panel" role="dialog" aria-label="Vista mensual">
        <div class="mv-hd">
          <button class="mv-nav" data-mv="prev" aria-label="Mes anterior">‹</button>
          <h2 class="mv-title">${MONTHS[_cursor.getMonth()]} ${_cursor.getFullYear()}</h2>
          <button class="mv-nav" data-mv="next" aria-label="Mes siguiente">›</button>
          <button class="mv-x" data-close="1" aria-label="Cerrar">✕</button>
        </div>
        <div class="mv-body">
          <p class="mv-intro">Asigna a cada semana uno de tus menús guardados. Pulsa <strong>Cargar</strong> para abrirlo en el Plan Semanal.</p>
          ${emptyMenus}
          <div class="mv-weeks">${rows}</div>
        </div>
      </div>`;
    _root.classList.add('show');
  }

  function onClick(e){
    if(e.target.closest('[data-close]')){ close(); return; }
    const nav = e.target.closest('[data-mv]');
    if(nav){ _cursor = new Date(_cursor.getFullYear(), _cursor.getMonth() + (nav.dataset.mv==='next'?1:-1), 1); render(); return; }
    const load = e.target.closest('[data-load]');
    if(load){
      const id = getAssign()[load.dataset.load];
      if(id && typeof loadMenu==='function'){ close(); loadMenu(id); }
      return;
    }
  }
  function onChange(e){
    const sel = e.target.closest('.mv-sel');
    if(sel){
      const a = getAssign();
      if(sel.value) a[sel.dataset.wk] = sel.value; else delete a[sel.dataset.wk];
      setAssign(a);
      // habilita/inhabilita el botón Cargar de esa fila
      const row = sel.closest('.mv-week'); const btn = row && row.querySelector('.mv-load');
      if(btn){ if(sel.value) btn.removeAttribute('disabled'); else btn.setAttribute('disabled',''); }
    }
  }

  function wire(){ const b=document.getElementById('calMonthly'); if(b && !b._mvWired){ b._mvWired=true; b.addEventListener('click', open); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire, {once:true}); else wire();
  window.openMonthView = open;
})();
