/* ══════════════════════════════════════════════════════════
   PREFERENCIAS DE ACCESIBILIDAD · tamaño de letra · contraste · idioma
   ----------------------------------------------------------
   Se aplican lo antes posible (en el <head>, antes de pintar) para
   evitar parpadeos. Persisten en localStorage y se controlan desde
   Usuarios → Configuración.
     mnut:fontsize:v1  → 's' | 'm' | 'l' | 'xl'   (escala con zoom)
     mnut:contrast:v1  → 'normal' | 'alto'
     mnut:lang:v1      → código de idioma (lo usa el traductor, #17)
   ========================================================== */
(function(){
  'use strict';
  const K_FS='mnut:fontsize:v1', K_CT='mnut:contrast:v1', K_LANG='mnut:lang:v1', K_TH='mnut:theme:v1';
  const FS_ZOOM = { s:0.9, m:1, l:1.12, xl:1.25 };
  const THEMES = { auto:1, light:1, dark:1 };

  function g(k,def){ try{ return localStorage.getItem(k) || def; }catch(e){ return def; } }
  function s(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  let _fs   = g(K_FS,'m');   if(!FS_ZOOM[_fs]) _fs='m';
  let _ct   = g(K_CT,'normal');
  let _lang = g(K_LANG,'es');
  let _th   = g(K_TH,'auto'); if(!THEMES[_th]) _th='auto';

  function applyFont(){ document.documentElement.style.zoom = FS_ZOOM[_fs] || 1; document.documentElement.setAttribute('data-fs', _fs); }
  function applyContrast(){ document.documentElement.setAttribute('data-contrast', _ct); }
  function sysDark(){ try{ return window.matchMedia('(prefers-color-scheme:dark)').matches; }catch(e){ return false; } }
  function isDark(){ return _th==='dark' || (_th==='auto' && sysDark()); }
  function applyTheme(){
    const dark = isDark();
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const m = document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', dark ? '#141109' : '#2C1F0E');
  }

  applyFont(); applyContrast(); applyTheme();
  // En modo "auto", seguir los cambios del sistema en caliente.
  try{ window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', ()=>{ if(_th==='auto') applyTheme(); }); }catch(e){}

  window.AppPrefs = {
    FS_OPTS: [['s','A−','Pequeño'],['m','A','Normal'],['l','A+','Grande'],['xl','A++','Muy grande']],
    THEME_OPTS: [['auto','🖥️','Automático'],['light','☀️','Claro'],['dark','🌙','Oscuro']],
    fontSize: ()=> _fs,
    setFontSize(v){ if(!FS_ZOOM[v]) return; _fs=v; s(K_FS,v); applyFont(); },
    contrast: ()=> _ct,
    setContrast(v){ _ct=(v==='alto'?'alto':'normal'); s(K_CT,_ct); applyContrast(); },
    lang: ()=> _lang,
    setLang(v){ _lang=v||'es'; s(K_LANG,_lang); },
    theme: ()=> _th,
    isDark,
    setTheme(v){ _th=THEMES[v]?v:'auto'; s(K_TH,_th); applyTheme(); }
  };
})();
