/* ══════════════════════════════════════════════════════════
   TRADUCTOR · Google Website Translator (gratuito)
   ----------------------------------------------------------
   Traduce TODA la app al idioma elegido en Configuración y guarda
   la elección (mnut:lang:v1, vía AppPrefs). Muestra un overlay con
   el icono de la app + barra de estado mientras traduce. Volver a
   "Español" NO retraduce: quita la traducción (recargando sin la
   cookie googtrans) para dejar el texto original intacto.

   Usa el gadget oficial de Google (translate.google.com). Es la vía
   "traductor gratuito de Google" sin clave de API.
   ========================================================== */
(function(){
  'use strict';
  const ORIG = 'es';                       // idioma original de la app
  const COOKIE = 'googtrans';

  // Idiomas ofrecidos (selector en Configuración). Lista amplia de Google.
  window.APP_LANGS = [
    ['es','Español'],['en','English'],['fr','Français'],['de','Deutsch'],['it','Italiano'],
    ['pt','Português'],['ca','Català'],['gl','Galego'],['eu','Euskara'],['nl','Nederlands'],
    ['ar','العربية'],['zh-CN','中文 (简体)'],['ja','日本語'],['ko','한국어'],['ru','Русский'],
    ['pl','Polski'],['ro','Română'],['tr','Türkçe'],['uk','Українська'],['hi','हिन्दी'],
    ['sv','Svenska'],['el','Ελληνικά'],['cs','Čeština'],['da','Dansk'],['fi','Suomi'],['no','Norsk']
  ];

  function setCookie(val){
    // googtrans debe fijarse en host y en dominio para que el gadget lo lea.
    const v = val ? `${COOKIE}=${val}` : `${COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${v}; path=/`;
    try{ const h = location.hostname; if(h && h.indexOf('.')>0){ document.cookie = `${v}; path=/; domain=.${h}`; } }catch(e){}
  }

  // ── Overlay de progreso con icono de la app + barra de estado ──
  function injectCSS(){
    if(document.getElementById('pn-tr-css')) return;
    const s=document.createElement('style'); s.id='pn-tr-css'; s.textContent=`
    .pn-tr-back{position:fixed;inset:0;z-index:6000;background:rgba(34,22,8,.72);backdrop-filter:blur(4px);
      display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
    .pn-tr-back.show{opacity:1}
    .pn-tr-box{background:var(--white,#FFFDF7);border-radius:18px;padding:26px 30px;max-width:340px;width:86%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,.4)}
    .pn-tr-ic{font-size:2.6rem;animation:pnTrSpin 1.4s ease-in-out infinite;display:inline-block}
    @keyframes pnTrSpin{0%{transform:scale(1) rotate(0)}50%{transform:scale(1.12) rotate(8deg)}100%{transform:scale(1) rotate(0)}}
    .pn-tr-t{font-family:'Playfair Display',serif;font-size:1.2rem;color:var(--warm,#2C1F0E);margin:12px 0 4px}
    .pn-tr-s{font-size:.84rem;color:var(--ink-50,#6b5d49);margin-bottom:14px;min-height:1.2em}
    .pn-tr-bar{height:8px;border-radius:6px;background:rgba(44,31,14,.12);overflow:hidden}
    .pn-tr-fill{height:100%;width:5%;background:var(--accent,#B5603A);border-radius:6px;transition:width .3s ease}
    /* Oculta TODA la interfaz de Google Translate: barra superior, gadget,
       el globo de "¿te gusta la traducción?" y el tooltip al pasar el ratón. */
    .goog-te-banner-frame,.skiptranslate,iframe.skiptranslate,
    .goog-te-balloon-frame,#goog-gt-tt,#goog-gt-,.goog-tooltip,.goog-tooltip:hover,
    .jfk-bubble,.VIpgJd-yAWNEb-L7lbkb,.VIpgJd-yAWNEb-hvhgNd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{
      display:none!important;visibility:hidden!important}
    /* Neutraliza el resaltado/subrayado amarillo que Google pone al texto traducido. */
    .goog-text-highlight,font.goog-text-highlight{background:none!important;box-shadow:none!important}
    /* Evita el desplazamiento que Google añade al <body> con su barra. */
    body{top:0!important;position:static!important}
    #google_translate_element{position:absolute!important;left:-9999px!important;top:auto!important;height:0!important;width:0!important;overflow:hidden!important}
    `;
    (document.head||document.documentElement).appendChild(s);
  }
  let _box=null;
  function showProgress(title){
    injectCSS();
    if(_box) _box.remove();
    _box=document.createElement('div'); _box.className='pn-tr-back';
    const icon = (document.querySelector('link[rel*="icon"]') ? '🍎' : '🍎');
    _box.innerHTML=`<div class="pn-tr-box" role="status" aria-live="polite">
      <span class="pn-tr-ic">${icon}</span>
      <div class="pn-tr-t">${title}</div>
      <div class="pn-tr-s" id="pnTrStatus">Preparando…</div>
      <div class="pn-tr-bar"><div class="pn-tr-fill" id="pnTrFill"></div></div>
    </div>`;
    document.body.appendChild(_box);
    requestAnimationFrame(()=> _box.classList.add('show'));
  }
  function setProgress(pct, msg){
    const f=document.getElementById('pnTrFill'); if(f) f.style.width=Math.max(5,Math.min(100,pct))+'%';
    const s=document.getElementById('pnTrStatus'); if(s && msg) s.textContent=msg;
  }
  function hideProgress(){ if(_box){ _box.classList.remove('show'); const b=_box; setTimeout(()=>b.remove(),250); _box=null; } }

  // ── Carga del gadget de Google (una vez) ──
  let _loaded=false, _loading=null;
  function loadGadget(){
    if(_loaded) return Promise.resolve(true);
    if(_loading) return _loading;
    _loading = new Promise((resolve)=>{
      if(!document.getElementById('google_translate_element')){
        const d=document.createElement('div'); d.id='google_translate_element'; document.body.appendChild(d);
      }
      window.googleTranslateElementInit = function(){
        try{ new google.translate.TranslateElement({pageLanguage:ORIG, autoDisplay:false}, 'google_translate_element'); }catch(e){}
        _loaded=true; resolve(true);
      };
      const sc=document.createElement('script');
      sc.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      sc.onerror=()=>resolve(false);
      document.head.appendChild(sc);
      setTimeout(()=>{ if(!_loaded) resolve(_loaded); }, 8000);
    });
    return _loading;
  }

  // Aplica el idioma seleccionando en el combo oculto del gadget.
  function applyViaCombo(lang){
    return new Promise((resolve)=>{
      let tries=0;
      const tick=()=>{
        const combo=document.querySelector('.goog-te-combo');
        if(combo){ combo.value=lang; combo.dispatchEvent(new Event('change')); resolve(true); return; }
        if(++tries>40) return resolve(false);
        setTimeout(tick,150);
      };
      tick();
    });
  }

  // ── API principal ──
  // El cambio es INMEDIATO y fiable: fijamos la cookie googtrans y recargamos.
  // Al cargar de nuevo, el gadget de Google detecta la cookie y traduce sin
  // intervención (la vía del combo en caliente fallaba hasta reiniciar). Antes
  // de recargar guardamos el progreso para no perder cambios en memoria.
  function translateTo(lang){
    injectCSS();
    lang = lang || ORIG;
    try{ if(window.PNSession && PNSession.manualSave) PNSession.manualSave(); }catch(e){}
    if(lang===ORIG){
      setCookie('');
      showProgress('Quitando traducción'); setProgress(60,'Restaurando el texto original…');
    }else{
      setCookie(`/${ORIG}/${lang}`);
      showProgress('Cambiando idioma'); setProgress(60,'Aplicando la traducción…');
    }
    setTimeout(()=>{ try{ location.reload(); }catch(e){ location.href=location.href; } }, 320);
  }

  // Al arrancar: si hay idioma guardado distinto del original, reaplica en silencio.
  function bootApply(){
    injectCSS();   // oculta ya la interfaz de Google (banner, globos, tooltips)
    let lang = ORIG;
    try{ lang = (window.AppPrefs && AppPrefs.lang()) || localStorage.getItem('mnut:lang:v1') || ORIG; }catch(e){}
    if(lang && lang!==ORIG){
      // La cookie ya suele estar puesta (translateTo la fija antes de recargar);
      // el gadget traduce solo al detectarla. applyViaCombo queda de refuerzo.
      if(document.cookie.indexOf(`${COOKIE}=/`)<0) setCookie(`/${ORIG}/${lang}`);
      loadGadget().then(()=> applyViaCombo(lang));
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootApply, {once:true});
  else bootApply();

  window.AppTranslate = translateTo;
})();
