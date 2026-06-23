/* ══════════════════════════════════════════════════════════
   SESIÓN · autoguardado, copias restaurables y versionado
   ──────────────────────────────────────────────────────────
   · El estado ya se persiste en cada cambio (claves mnut:/sport:).
     Este módulo añade ADEMÁS:
       - Copias restaurables (anillo de las últimas N) cada 5 min
         y al ocultar/cerrar la app, para poder volver atrás.
       - Guardado manual "en cualquier momento" (botón cabecera).
       - Versionado de esquema + migraciones, para no perder la
         sesión al actualizar la app a una versión nueva.
══════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  const SCHEMA_VERSION = 2;                 // súbelo cuando cambie el FORMATO de datos
  const LS_SCHEMA   = 'mnut:schema:v1';
  const LS_SNAPS    = 'mnut:snapshots:v1';  // anillo de copias restaurables
  const LS_LASTSAVE = 'mnut:lastSave:v1';
  const MAX_SNAPS   = 6;
  const AUTOSAVE_MS = 5 * 60 * 1000;        // 5 minutos
  const PREFIXES    = ['mnut:', 'sport:', 'mente:'];

  const isOwn = k => k === LS_SNAPS;        // no metas el propio anillo dentro de las copias

  /* ── Recolecta TODO el estado de la app ─────────────────── */
  function collectState(){
    const store = {};
    for(let i=0; i<localStorage.length; i++){
      const k = localStorage.key(i);
      if(k && !isOwn(k) && PREFIXES.some(p=>k.startsWith(p))) store[k] = localStorage.getItem(k);
    }
    return store;
  }
  function sig(store){ let n=0; for(const k in store){ n += k.length + (store[k]?store[k].length:0); } return n; }

  /* ── Migraciones de esquema entre versiones ─────────────── */
  function runMigrations(){
    let v = parseInt(localStorage.getItem(LS_SCHEMA) || '0', 10) || 0;
    // Las migraciones futuras van aquí, en orden:
    //   if(v < 3){ ...transforma datos...; v = 3; }
    // De momento solo sellamos la versión actual.
    if(v !== SCHEMA_VERSION){
      try{ localStorage.setItem(LS_SCHEMA, String(SCHEMA_VERSION)); }catch(e){}
    }
  }

  /* ── Copias restaurables (anillo) ───────────────────────── */
  function getSnaps(){ try{ const a = JSON.parse(localStorage.getItem(LS_SNAPS)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function writeSnaps(arr){
    while(arr.length > MAX_SNAPS) arr.shift();
    try{ localStorage.setItem(LS_SNAPS, JSON.stringify(arr)); return true; }
    catch(e){
      // Sin espacio: recorta las más antiguas y reintenta
      while(arr.length > 1){ arr.shift(); try{ localStorage.setItem(LS_SNAPS, JSON.stringify(arr)); return true; }catch(_){} }
      return false;
    }
  }

  // reason: 'auto' | 'manual' | 'hide'
  function saveNow(reason){
    const store = collectState();
    const s = sig(store);
    const snaps = getSnaps();
    const last = snaps[snaps.length-1];
    // Evita copias idénticas seguidas (salvo guardado manual explícito)
    if(reason !== 'manual' && last && last.sig === s) { stampSaved(last.ts); return last; }
    const snap = { id: Date.now(), ts: new Date().toISOString(), v: SCHEMA_VERSION, reason: reason||'auto', sig: s, store };
    snaps.push(snap);
    writeSnaps(snaps);
    stampSaved(snap.ts);
    return snap;
  }

  async function restoreSnap(id){
    const snap = getSnaps().find(s=> s.id === id);
    if(!snap){ return false; }
    if(!await pnConfirm('¿Restaurar la copia del '+fmtTs(snap.ts)+'?\nSe sustituirá el estado actual de la app y se recargará.', {danger:true, okText:'Restaurar'})) return false;
    // Borra el estado actual (menos el anillo de copias) y aplica el de la copia
    for(let i=localStorage.length-1; i>=0; i--){
      const k = localStorage.key(i);
      if(k && !isOwn(k) && PREFIXES.some(p=>k.startsWith(p))) localStorage.removeItem(k);
    }
    Object.entries(snap.store).forEach(([k,v])=>{ if(typeof v==='string'){ try{ localStorage.setItem(k,v); }catch(e){} } });
    location.reload();
    return true;
  }

  /* ── Indicador "última copia" + toast ───────────────────── */
  function stampSaved(ts){
    try{ localStorage.setItem(LS_LASTSAVE, ts); }catch(e){}
    const btn = document.getElementById('saveNowBtn');
    if(btn) btn.title = 'Guardar avance · última copia ' + fmtTs(ts);
    const ind = document.getElementById('saveStamp');
    if(ind) ind.textContent = fmtClock(ts);
  }
  function fmtTs(iso){ try{ const d=new Date(iso); return d.toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }catch(e){ return iso; } }
  function fmtClock(iso){ try{ const d=new Date(iso); return d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }

  function toast(msg){
    let t = document.getElementById('pnToast');
    if(!t){ t=document.createElement('div'); t.id='pnToast'; t.className='pn-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(()=> t.classList.remove('show'), 2200);
  }

  function manualSave(){
    saveNow('manual');
    toast('✓ Avance guardado · ' + fmtClock(new Date().toISOString()));
  }

  /* ── Arranque ───────────────────────────────────────────── */
  function init(){
    runMigrations();

    // Indicador inicial
    const last = localStorage.getItem(LS_LASTSAVE);
    if(last) stampSaved(last);

    // Botón "Guardar" en la cabecera
    const btn = document.getElementById('saveNowBtn');
    if(btn) btn.addEventListener('click', manualSave);

    // Autoguardado cada 5 min
    setInterval(()=> saveNow('auto'), AUTOSAVE_MS);

    // Guarda al ocultar/cerrar (cambiar de app, cerrar pestaña)
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden') saveNow('hide'); });
    window.addEventListener('pagehide', ()=> saveNow('hide'));

    // Primera copia de seguridad de la sesión actual
    saveNow('auto');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* expose */
  window.PNSession = { saveNow, manualSave, getSnaps, restoreSnap, fmtTs, SCHEMA_VERSION };
})();
