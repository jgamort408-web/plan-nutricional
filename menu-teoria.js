/* ══════════════════════════════════════════════════════════
   TEORÍA · aprendizaje de nutrición por artículos encadenados
   ----------------------------------------------------------
   Estructura en árbol: temas → artículos. Cada artículo enlaza
   con OTROS artículos (ramificaciones) y con referencias de la
   Bibliografía (#11). Incluye imágenes ilustrativas indexadas
   (#15, carpeta /img-teoria) cuando existen.

   Para ampliar: añade artículos a ARTICULOS (o cárgalos desde
   JSON/BD con el mismo formato).
     {id, tema, titulo, nivel, lead, cuerpo(html), img?, verAlso:[ids], refs:[bibId]}
   ========================================================== */
(function(){
  'use strict';
  const esc = window.escHtml || (s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));

  const TEMAS = {
    fundamentos: {ico:'🌱', lbl:'Fundamentos', sub:'Qué es comer bien y por qué'},
    macros:      {ico:'⚖️', lbl:'Macronutrientes', sub:'Proteína, grasa e hidratos'},
    energia:     {ico:'🔥', lbl:'Energía y peso', sub:'Calorías, balance y composición'},
    practica:    {ico:'🍽️', lbl:'En la práctica', sub:'El plato, raciones y planificación'},
    ejercicio:   {ico:'🏋️', lbl:'Ejercicio', sub:'Mover el cuerpo y recuperar'},
    mente:       {ico:'🧠', lbl:'Mente y hábitos', sub:'Relación sana con la comida'}
  };
  const NIVELES = { basico:'Básico', medio:'Intermedio', avanzado:'Avanzado' };

  // Artículos encadenados. cuerpo admite HTML simple (<p>, <ul>, <strong>…).
  const ARTICULOS = [
    {id:'que-es-comer-bien', tema:'fundamentos', nivel:'basico',
     titulo:'¿Qué significa comer bien?',
     lead:'Comer bien no es una dieta perfecta, sino un patrón sostenible basado en comida real.',
     img:'plato-saludable',
     cuerpo:`<p>Comer bien es, sobre todo, <strong>comer comida real</strong> la mayor parte del tiempo: verduras, frutas, legumbres, cereales integrales, pescado, huevos, frutos secos y aceite de oliva. No depende de un alimento milagro ni de prohibiciones absolutas.</p>
       <p>La clave es el <strong>patrón global</strong>: lo que haces casi todos los días pesa más que un capricho puntual. Por eso la app organiza tu semana, no tus minutos.</p>
       <ul><li>Prioriza alimentos poco procesados.</li><li>Verdura y fruta a diario.</li><li>Bebe agua como bebida principal.</li><li>Disfruta: la comida también es cultura y placer.</li></ul>`,
     verAlso:['plato-ideal','energia-balance'], refs:['who-diet','harvard-plate']},

    {id:'plato-ideal', tema:'practica', nivel:'basico',
     titulo:'El plato ideal: una guía visual',
     lead:'Medio plato de verdura, un cuarto de proteína y un cuarto de hidratos de calidad.',
     img:'plato-ideal-diagrama',
     cuerpo:`<p>El "plato saludable" reparte tu comida principal así:</p>
       <ul><li><strong>½ verduras y hortalizas</strong> (crudas + cocidas).</li><li><strong>¼ proteína</strong> de calidad: pescado, huevo, legumbre, carne magra, tofu.</li><li><strong>¼ hidratos de calidad</strong>: integrales, patata, legumbre.</li></ul>
       <p>Añade una porción de <strong>grasa saludable</strong> (AOVE, aguacate, frutos secos) y fruta de postre. Es una guía flexible, no una regla rígida.</p>`,
     verAlso:['que-es-comer-bien','proteina-cuanta','grasas-buenas'], refs:['harvard-plate','aesan-recom']},

    {id:'macros-intro', tema:'macros', nivel:'basico',
     titulo:'Macronutrientes: las tres grandes piezas',
     lead:'Proteína, grasa e hidratos aportan energía y funciones distintas. Ninguno es el enemigo.',
     cuerpo:`<p>Los <strong>macronutrientes</strong> son proteína, grasa e hidratos de carbono. Aportan la energía (kcal) y los materiales que tu cuerpo necesita.</p>
       <ul><li><strong>Proteína</strong> (4 kcal/g): construye y repara.</li><li><strong>Grasa</strong> (9 kcal/g): hormonas, vitaminas, saciedad.</li><li><strong>Hidratos</strong> (4 kcal/g): energía, sobre todo para el músculo y el cerebro.</li></ul>
       <p>La proporción ideal depende de tu objetivo y actividad, pero todos cumplen un papel.</p>`,
     verAlso:['proteina-cuanta','grasas-buenas','hidratos-calidad'], refs:['efsa-dri']},

    {id:'proteina-cuanta', tema:'macros', nivel:'medio',
     titulo:'¿Cuánta proteína necesito?',
     lead:'Entre 1,4 y 2,2 g por kg al día cubre a la mayoría de personas activas.',
     cuerpo:`<p>Para personas activas, un rango razonable es <strong>1,4–2,2 g de proteína por kg de peso</strong> al día. Si entrenas fuerza y quieres ganar o conservar músculo, apunta a la parte alta.</p>
       <p>Reparte la proteína entre las comidas (≈20–40 g por toma) y prioriza fuentes de calidad: huevo, pescado, lácteos, legumbre, carne magra.</p>`,
     verAlso:['macros-intro','ejercicio-fuerza'], refs:['morton-prot','efsa-dri']},

    {id:'grasas-buenas', tema:'macros', nivel:'medio',
     titulo:'Grasas: cuáles priorizar',
     lead:'Prioriza grasas insaturadas (AOVE, pescado azul, frutos secos) y modera las saturadas.',
     cuerpo:`<p>La grasa es esencial. Prioriza las <strong>insaturadas</strong>: aceite de oliva virgen extra, aguacate, frutos secos y <strong>pescado azul</strong> (omega-3).</p>
       <p>Modera las grasas de ultraprocesados y embutidos. No necesitas eliminar la grasa: necesitas elegir mejor su origen.</p>`,
     verAlso:['macros-intro','plato-ideal'], refs:['mozaffarian-fat']},

    {id:'hidratos-calidad', tema:'macros', nivel:'medio',
     titulo:'Hidratos de calidad',
     lead:'No son el enemigo: elige integrales, legumbre, fruta y tubérculos.',
     cuerpo:`<p>Los hidratos son la principal fuente de energía. La calidad importa más que la cantidad absoluta: prioriza <strong>integrales, legumbres, fruta y tubérculos</strong> frente a azúcares y harinas refinadas.</p>
       <p>Ajusta la cantidad a tu actividad: más movimiento, más margen para hidratos.</p>`,
     verAlso:['macros-intro','energia-balance'], refs:['hall-energy']},

    {id:'energia-balance', tema:'energia', nivel:'medio',
     titulo:'Calorías y balance energético',
     lead:'El peso responde al balance entre lo que comes y lo que gastas, pero la calidad influye en el apetito.',
     img:'balance-energetico',
     cuerpo:`<p>El <strong>balance energético</strong> (energía que entra vs. que gastas) determina si ganas, mantienes o pierdes peso. Pero no todo es contar: la <strong>calidad</strong> de la comida influye en tu hambre, saciedad y energía.</p>
       <p>Comida real, suficiente proteína y fibra te ayudan a regular el apetito sin obsesionarte con los números.</p>`,
     verAlso:['hidratos-calidad','peso-composicion','mente-relacion'], refs:['hall-energy']},

    {id:'peso-composicion', tema:'energia', nivel:'avanzado',
     titulo:'Peso vs. composición corporal',
     lead:'La báscula no distingue músculo de grasa. Mira el conjunto, no solo el número.',
     cuerpo:`<p>El peso total mezcla músculo, grasa, agua y más. Por eso puedes mejorar tu <strong>composición corporal</strong> (más músculo, menos grasa) sin que la báscula se mueva mucho.</p>
       <p>Combina alimentación adecuada con <strong>entrenamiento de fuerza</strong> y valora también cómo te sientes, tu ropa y tu rendimiento.</p>`,
     verAlso:['energia-balance','ejercicio-fuerza'], refs:['hall-energy']},

    {id:'ejercicio-fuerza', tema:'ejercicio', nivel:'medio',
     titulo:'Por qué entrenar fuerza',
     lead:'La fuerza protege músculo, hueso y metabolismo a cualquier edad.',
     cuerpo:`<p>El <strong>entrenamiento de fuerza</strong> mantiene y construye músculo, fortalece el hueso y mejora tu metabolismo y autonomía con la edad. Combinado con suficiente proteína, es la mejor herramienta para tu composición corporal.</p>
       <p>La OMS recomienda actividad de fortalecimiento muscular al menos 2 días por semana, además de actividad aeróbica.</p>`,
     verAlso:['proteina-cuanta','peso-composicion'], refs:['who-pa','morton-prot']},

    {id:'mente-relacion', tema:'mente', nivel:'basico',
     titulo:'Una relación sana con la comida',
     lead:'Comer bien también es comer con calma, sin culpa y atendiendo a tu hambre real.',
     cuerpo:`<p>La alimentación no es solo nutrientes: tu <strong>relación con la comida</strong> importa. Evita las dietas extremas y la culpa; busca regularidad, variedad y flexibilidad.</p>
       <p>Mejorar la dieta también puede acompañar a un mejor estado de ánimo. Si la comida te genera ansiedad o malestar persistente, busca apoyo profesional.</p>`,
     verAlso:['que-es-comer-bien','energia-balance'], refs:['firth-mental']}
  ];

  window.TeoriaData = { TEMAS, NIVELES, ARTICULOS };
})();

/* ── Página de Teoría (overlay a pantalla completa, estilo app) ── */
(function(){
  'use strict';
  const esc = window.escHtml || (s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));

  let _root=null, _closed=false, _view='index', _articleId=null, _crumbs=[];

  function art(id){ return window.TeoriaData.ARTICULOS.find(a=>a.id===id); }
  function imgSrc(name){ return name ? `img-teoria/${name}.svg` : ''; }

  function injectCSS(){
    if(document.getElementById('pn-teo-css')) return;
    const s=document.createElement('style'); s.id='pn-teo-css'; s.textContent=`
    .teo-back{position:fixed;top:var(--hdr-h,0);left:0;right:0;bottom:0;z-index:180;background:var(--cream,#F5EEE4);display:flex;justify-content:center;opacity:0;transition:opacity .2s}
    .teo-back.show{opacity:1}
    .teo-page{background:var(--white,#FFFDF7);width:100%;max-width:880px;height:100%;display:flex;flex-direction:column;box-shadow:0 0 60px rgba(34,22,8,.12)}
    .teo-hd{background:var(--accent,#B5603A);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0}
    .teo-hd h3{font-family:'Playfair Display',serif;font-weight:700;font-size:1.2rem;margin:0;flex:1;line-height:1.2}
    .teo-back-btn{border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:10px;padding:8px 13px;min-height:40px;cursor:pointer;font-size:.85rem;white-space:nowrap}
    .teo-back-btn:hover{background:rgba(255,255,255,.32)}
    .teo-scroll{flex:1;overflow:auto;padding:18px 22px 32px}
    .teo-intro{font-size:.9rem;color:var(--ink-50);line-height:1.55;margin-bottom:16px}
    .teo-tema{margin-bottom:20px}
    .teo-tema-h{display:flex;align-items:baseline;gap:8px;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--warm);margin:0 0 4px}
    .teo-tema-sub{font-size:.76rem;color:var(--ink-50);margin-bottom:10px}
    .teo-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}
    .teo-card{text-align:left;border:1px solid rgba(44,31,14,.12);border-radius:14px;padding:14px;cursor:pointer;background:linear-gradient(160deg,rgba(255,255,255,.8),rgba(245,238,228,.5));transition:.15s}
    .teo-card:hover{border-color:var(--accent,#B5603A);transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.06)}
    .teo-card-t{font-family:'Lora',serif;font-weight:600;font-size:.96rem;color:var(--warm);line-height:1.3;margin-bottom:5px}
    .teo-card-l{font-size:.8rem;color:var(--ink-50);line-height:1.4}
    .teo-card-n{display:inline-block;margin-top:8px;font-size:.62rem;text-transform:uppercase;letter-spacing:.06em;color:var(--accent,#B5603A);font-family:'DM Mono',monospace}
    .teo-article{max-width:680px;margin:0 auto}
    .teo-crumbs{font-size:.74rem;color:var(--ink-50);margin-bottom:10px}
    .teo-crumbs a{color:var(--accent,#B5603A);cursor:pointer}
    .teo-a-t{font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--warm);line-height:1.2;margin:0 0 8px}
    .teo-a-lead{font-size:1rem;color:var(--ink-70,rgba(44,31,14,.8));font-style:italic;line-height:1.5;margin-bottom:14px}
    .teo-a-img{width:100%;border-radius:14px;border:1px solid rgba(44,31,14,.1);background:#fff;margin:0 0 16px;display:block}
    .teo-a-body{font-family:'Lora',serif;font-size:.98rem;line-height:1.65;color:var(--warm)}
    .teo-a-body p{margin:0 0 12px} .teo-a-body ul{margin:0 0 14px;padding-left:22px} .teo-a-body li{margin-bottom:6px}
    .teo-a-body strong{color:var(--warm-2,#3D2C1A)}
    .teo-sec{margin-top:22px;padding-top:14px;border-top:1px solid rgba(44,31,14,.1)}
    .teo-sec-h{font-family:'DM Mono',monospace;font-size:.64rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-50);margin-bottom:8px}
    .teo-links{display:flex;flex-wrap:wrap;gap:8px}
    .teo-link{border:1.5px solid rgba(44,31,14,.14);background:#fff;border-radius:10px;padding:9px 13px;min-height:42px;cursor:pointer;font-size:.84rem;color:var(--warm);text-align:left}
    .teo-link:hover{border-color:var(--accent,#B5603A);color:var(--accent,#B5603A)}
    .teo-link.ref{border-style:dashed}
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  function indexHtml(){
    const {TEMAS,ARTICULOS,NIVELES}=window.TeoriaData;
    const byTema={}; ARTICULOS.forEach(a=>{ (byTema[a.tema]=byTema[a.tema]||[]).push(a); });
    const blocks = Object.keys(TEMAS).filter(t=>byTema[t]).map(t=>{
      const tm=TEMAS[t];
      const cards = byTema[t].map(a=>`<button class="teo-card" data-art="${a.id}">
        <div class="teo-card-t">${esc(a.titulo)}</div>
        <div class="teo-card-l">${esc(a.lead)}</div>
        <span class="teo-card-n">${esc(NIVELES[a.nivel]||a.nivel)}</span>
      </button>`).join('');
      return `<div class="teo-tema">
        <h4 class="teo-tema-h">${tm.ico} ${esc(tm.lbl)}</h4>
        <div class="teo-tema-sub">${esc(tm.sub)}</div>
        <div class="teo-cards">${cards}</div>
      </div>`;
    }).join('');
    return `<div class="teo-intro">Aprende la teoría de la nutrición paso a paso. Cada artículo enlaza con otros relacionados (para seguir el hilo) y con la <strong>bibliografía</strong> que lo respalda. Empieza por <strong>Fundamentos</strong> si es tu primera vez.</div>${blocks}`;
  }

  function articleHtml(a){
    const {NIVELES,TEMAS}=window.TeoriaData;
    const verAlso = (a.verAlso||[]).map(id=>{ const o=art(id); return o?`<button class="teo-link" data-art="${id}">→ ${esc(o.titulo)}</button>`:''; }).join('');
    const refs = (a.refs||[]).map(rid=>{
      const r = (window.BiblioData?window.BiblioData.BIBLIO:[]).find(x=>x.id===rid);
      return r?`<button class="teo-link ref" data-ref="${rid}">📚 ${esc(r.autores.split(',')[0])} · ${r.year}</button>`:'';
    }).join('');
    const img = a.img ? `<img class="teo-a-img" src="${imgSrc(a.img)}" alt="${esc(a.titulo)}" onerror="this.style.display='none'">` : '';
    return `<div class="teo-article">
      <div class="teo-crumbs"><a data-home>Teoría</a> › ${TEMAS[a.tema]?esc(TEMAS[a.tema].lbl):''}</div>
      <h2 class="teo-a-t">${esc(a.titulo)}</h2>
      <div class="teo-a-lead">${esc(a.lead)}</div>
      ${img}
      <div class="teo-a-body">${a.cuerpo}</div>
      ${verAlso?`<div class="teo-sec"><div class="teo-sec-h">Sigue aprendiendo</div><div class="teo-links">${verAlso}</div></div>`:''}
      ${refs?`<div class="teo-sec"><div class="teo-sec-h">Bibliografía relacionada</div><div class="teo-links">${refs}</div></div>`:''}
    </div>`;
  }

  function render(){
    if(!_root) return;
    _root.innerHTML = (_view==='article' && art(_articleId)) ? articleHtml(art(_articleId)) : indexHtml();
    const sc=_root.closest('.app-page-scroll'); if(sc) sc.scrollTop=0;
  }

  function goArticle(id){ if(!art(id)) return; _view='article'; _articleId=id; render(); }
  function goIndex(){ _view='index'; _articleId=null; render(); }

  function open(){
    injectCSS();
    if(typeof AppPage==='undefined') return;
    _view='index'; _articleId=null;
    AppPage.open({
      key:'teoria', group:'info', title:'📖 Teoría de la nutrición',
      render(body){
        _root = body; render();
        body.addEventListener('click', e=>{
          const a=e.target.closest('[data-art]'); if(a){ goArticle(a.dataset.art); return; }
          const home=e.target.closest('[data-home]'); if(home){ goIndex(); return; }
          const ref=e.target.closest('[data-ref]'); if(ref){ if(typeof openBibliografia==='function') openBibliografia(); return; }
        });
      }
    });
  }

  window.openTeoria = open;
  if(typeof AppPage!=='undefined') AppPage.register('teoria', open);
})();
