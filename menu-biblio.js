/* ══════════════════════════════════════════════════════════
   BIBLIOGRAFÍA · página con buscador, filtros e índice
   ----------------------------------------------------------
   Referencias en normativa (estilo Vancouver/APA abreviado) con
   enlaces que abren en el navegador tras un AVISO DE REDIRECCIÓN.
   Indexada por: tipo, tema y año. Buscador por texto libre.

   Para añadir referencias: edita BIBLIO[] (o, en el futuro, cárgalas
   desde un JSON / base de datos con el mismo formato).
     {id, tipo, temas:[], year, autores, titulo, fuente, url, cita}
   tipo ∈ TIPOS · temas ∈ TEMAS
   ========================================================== */
(function(){
  'use strict';

  const TIPOS = {
    guia:    {ico:'📕', lbl:'Guía / institución'},
    articulo:{ico:'📄', lbl:'Artículo científico'},
    libro:   {ico:'📗', lbl:'Libro'},
    web:     {ico:'🌐', lbl:'Web divulgativa'}
  };
  const TEMAS = {
    nutricion: {ico:'🥗', lbl:'Nutrición'},
    metabolismo:{ico:'🔥', lbl:'Metabolismo y energía'},
    proteina:  {ico:'🥩', lbl:'Proteína'},
    grasas:    {ico:'🫒', lbl:'Grasas'},
    hidratos:  {ico:'🌾', lbl:'Hidratos'},
    crono:     {ico:'🕒', lbl:'Crononutrición'},
    ejercicio: {ico:'🏋️', lbl:'Ejercicio'},
    saludmental:{ico:'🧠', lbl:'Salud mental'},
    peso:      {ico:'⚖️', lbl:'Peso y composición'}
  };

  // Referencias base (ampliables). Las citas usan formato abreviado.
  const BIBLIO = [
    {id:'who-diet', tipo:'guia', temas:['nutricion'], year:2020,
     autores:'Organización Mundial de la Salud (OMS)',
     titulo:'Alimentación sana — Datos y cifras',
     fuente:'who.int',
     url:'https://www.who.int/es/news-room/fact-sheets/detail/healthy-diet',
     cita:'Organización Mundial de la Salud. Alimentación sana [Internet]. Ginebra: OMS; 2020.'},
    {id:'efsa-dri', tipo:'guia', temas:['nutricion','proteina','grasas','hidratos'], year:2017,
     autores:'European Food Safety Authority (EFSA)',
     titulo:'Dietary Reference Values for nutrients — Summary report',
     fuente:'EFSA Supporting Publications',
     url:'https://www.efsa.europa.eu/en/efsajournal/pub/e15121',
     cita:'EFSA. Dietary Reference Values for nutrients: Summary report. EFSA Supporting Publication; 2017.'},
    {id:'aesan-recom', tipo:'guia', temas:['nutricion'], year:2022,
     autores:'AESAN (Agencia Española de Seguridad Alimentaria y Nutrición)',
     titulo:'Recomendaciones dietéticas sostenibles y actividad física para la población española',
     fuente:'aesan.gob.es',
     url:'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/ampliacion/recomendaciones_dieteticas.htm',
     cita:'AESAN. Recomendaciones dietéticas sostenibles y de actividad física para la población española. Madrid; 2022.'},
    {id:'morton-prot', tipo:'articulo', temas:['proteina','ejercicio'], year:2018,
     autores:'Morton RW, et al.',
     titulo:'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength',
     fuente:'Br J Sports Med. 2018;52(6):376-384',
     url:'https://bjsm.bmj.com/content/52/6/376',
     cita:'Morton RW, et al. Br J Sports Med. 2018;52(6):376-384.'},
    {id:'who-pa', tipo:'guia', temas:['ejercicio'], year:2020,
     autores:'Organización Mundial de la Salud (OMS)',
     titulo:'Directrices de la OMS sobre actividad física y hábitos sedentarios',
     fuente:'who.int',
     url:'https://www.who.int/es/publications/i/item/9789240015128',
     cita:'OMS. Directrices sobre actividad física y hábitos sedentarios. Ginebra; 2020.'},
    {id:'mozaffarian-fat', tipo:'articulo', temas:['grasas'], year:2011,
     autores:'Mozaffarian D, Wu JHY',
     titulo:'Omega-3 fatty acids and cardiovascular disease',
     fuente:'J Am Coll Cardiol. 2011;58(20):2047-2067',
     url:'https://www.jacc.org/doi/10.1016/j.jacc.2011.06.063',
     cita:'Mozaffarian D, Wu JHY. J Am Coll Cardiol. 2011;58(20):2047-67.'},
    {id:'firth-mental', tipo:'articulo', temas:['saludmental','nutricion'], year:2019,
     autores:'Firth J, et al.',
     titulo:'The effects of dietary improvement on symptoms of depression and anxiety: a meta-analysis of randomized controlled trials',
     fuente:'Psychosom Med. 2019;81(3):265-280',
     url:'https://journals.lww.com/psychosomaticmedicine/abstract/2019/04000/the_effects_of_dietary_improvement_on_symptoms_of.4.aspx',
     cita:'Firth J, et al. Psychosom Med. 2019;81(3):265-80.'},
    {id:'hall-energy', tipo:'articulo', temas:['peso','hidratos'], year:2017,
     autores:'Hall KD, Guo J',
     titulo:'Obesity energetics: body weight regulation and the effects of diet composition',
     fuente:'Gastroenterology. 2017;152(7):1718-1727',
     url:'https://www.gastrojournal.org/article/S0016-5085(17)30152-X/fulltext',
     cita:'Hall KD, Guo J. Gastroenterology. 2017;152(7):1718-27.'},
    {id:'harvard-plate', tipo:'web', temas:['nutricion','hidratos','proteina'], year:2011,
     autores:'Harvard T.H. Chan School of Public Health',
     titulo:'The Healthy Eating Plate (El Plato para Comer Saludable)',
     fuente:'nutritionsource.hsph.harvard.edu',
     url:'https://www.hsph.harvard.edu/nutritionsource/healthy-eating-plate/',
     cita:'Harvard T.H. Chan School of Public Health. The Healthy Eating Plate. 2011.'},

    /* ── Fisiología metabólica, macronutrientes y crononutrición ── */
    {id:'bmr-organ-model', tipo:'articulo', temas:['metabolismo'],
     autores:'Estudio mecanístico (calorimetría/RMN)',
     titulo:'Mechanistic model of mass-specific basal metabolic rate: evaluation in healthy young adults',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4192648/',
     cita:'Mechanistic model of mass-specific basal metabolic rate: evaluation in healthy young adults. PMC4192648.'},
    {id:'organ-metabolic-rates', tipo:'articulo', temas:['metabolismo'],
     autores:'Estudio de composición corporal',
     titulo:'Evaluation of specific metabolic rates of major organs and tissues: comparison between men and women',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3139779/',
     cita:'Specific metabolic rates of major organs and tissues. PMC3139779.'},
    {id:'ree-anatomy', tipo:'articulo', temas:['metabolismo','peso'],
     autores:'Revisión de gasto en reposo',
     titulo:'The anatomy of resting energy expenditure: body composition mechanisms',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6410366/',
     cita:'The anatomy of resting energy expenditure: body composition mechanisms. PMC6410366.'},
    {id:'katch-mcardle-tdee', tipo:'articulo', temas:['metabolismo','ejercicio'],
     autores:'Sports Science & Bodybuilding Research',
     titulo:'The Katch-McArdle formula for TDEE estimation: applications in sports science and bodybuilding research',
     fuente:'ResearchGate',
     url:'https://www.researchgate.net/publication/400838949_The_Katch-McArdle_Formula_for_TDEE_Estimation_Applications_in_Sports_Science_and_Bodybuilding_Research',
     cita:'The Katch-McArdle formula for TDEE estimation. ResearchGate.'},
    {id:'tef-whole-vs-processed', tipo:'articulo', temas:['metabolismo','nutricion'], year:2010,
     autores:'Barr SB, Wright JC',
     titulo:'Postprandial energy expenditure in whole-food and processed-food meals: implications for daily energy expenditure',
     fuente:'Food Nutr Res. 2010',
     url:'https://pubmed.ncbi.nlm.nih.gov/20613890/',
     cita:'Barr SB, Wright JC. Postprandial energy expenditure in whole-food and processed-food meals. Food Nutr Res. 2010. PMID 20613890.'},
    {id:'tef-glutenfree', tipo:'articulo', temas:['metabolismo'], year:2020,
     autores:'Ensayo cruzado aleatorizado',
     titulo:'A gluten-free meal produces a lower postprandial thermogenic response compared to an iso-energetic whole food or processed food meal',
     fuente:'Nutrients (MDPI). 2020;12(7):2035',
     url:'https://www.mdpi.com/2072-6643/12/7/2035',
     cita:'A gluten-free meal vs whole/processed food meal: postprandial thermogenesis. Nutrients. 2020;12(7):2035.'},
    {id:'upf-weight-gain', tipo:'articulo', temas:['peso','nutricion'], year:2019,
     autores:'Hall KD, et al.',
     titulo:'Ultra-processed diets cause excess calorie intake and weight gain: an inpatient randomized controlled trial of ad libitum food intake',
     fuente:'Cell Metab. 2019 (PMC7946062)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7946062/',
     cita:'Hall KD, et al. Ultra-processed diets cause excess calorie intake and weight gain. Cell Metab. 2019.'},
    {id:'energy-balance-hidden', tipo:'articulo', temas:['peso','metabolismo'], year:2025,
     autores:'Revisión de balance energético',
     titulo:'The human energy balance: uncovering the hidden variables of obesity',
     fuente:'Diseases (MDPI). 2025;13(2):55',
     url:'https://www.mdpi.com/2079-9721/13/2/55',
     cita:'The human energy balance: uncovering the hidden variables of obesity. Diseases. 2025;13(2):55.'},
    {id:'sarcopenia-nutrition', tipo:'articulo', temas:['proteina','ejercicio'],
     autores:'Revisión sobre sarcopenia',
     titulo:'Nutrition in the prevention and treatment of skeletal muscle ageing and sarcopenia: a single nutrient, a whole food and a whole diet approach',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7616828/',
     cita:'Nutrition in the prevention and treatment of skeletal muscle ageing and sarcopenia. PMC7616828.'},
    {id:'protein-elderly-optimal', tipo:'articulo', temas:['proteina'],
     autores:'Revisión sobre proteína en mayores',
     titulo:'Protein consumption and the elderly: what is the optimal level of intake?',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4924200/',
     cita:'Protein consumption and the elderly: what is the optimal level of intake? PMC4924200.'},
    {id:'protein-aging', tipo:'articulo', temas:['proteina'],
     autores:'Revisión proteína y envejecimiento',
     titulo:'Protein and aging: practicalities and practice',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12348035/',
     cita:'Protein and aging: practicalities and practice. PMC12348035.'},
    {id:'anabolic-resistance', tipo:'articulo', temas:['proteina','ejercicio'],
     autores:'Revisión de resistencia anabólica',
     titulo:'Age-related anabolic resistance: nutritional and exercise strategies, and potential relevance to life-long exercisers',
     fuente:'PubMed',
     url:'https://pubmed.ncbi.nlm.nih.gov/41305554/',
     cita:'Age-related anabolic resistance: nutritional and exercise strategies. PMID 41305554.'},
    {id:'leucine-trigger', tipo:'articulo', temas:['proteina'],
     autores:'Revisión sistemática',
     titulo:'Evaluating the leucine trigger hypothesis to explain the post-prandial regulation of muscle protein synthesis in young and older adults',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8295465/',
     cita:'Evaluating the leucine trigger hypothesis... muscle protein synthesis. PMC8295465.'},
    {id:'leucine-mps', tipo:'articulo', temas:['proteina','ejercicio'],
     autores:'Revisión sistemática',
     titulo:'Association of postprandial postexercise muscle protein synthesis rates with dietary leucine: a systematic review',
     fuente:'PubMed',
     url:'https://pubmed.ncbi.nlm.nih.gov/37537134/',
     cita:'Association of muscle protein synthesis rates with dietary leucine: systematic review. PMID 37537134.'},
    {id:'linoleic-acid-review', tipo:'articulo', temas:['grasas'],
     autores:'Revisión narrativa',
     titulo:'Linoleic acid: a narrative review of the effects of increased intake in the standard American diet and associations with chronic disease',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10386285/',
     cita:'Linoleic acid: narrative review and associations with chronic disease. PMC10386285.'},
    {id:'melatonin-islets', tipo:'articulo', temas:['crono'],
     autores:'Revisión melatonina-páncreas',
     titulo:'Melatonin and pancreatic islets: interrelationships between melatonin, insulin and glucagon',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3645673/',
     cita:'Melatonin and pancreatic islets: melatonin, insulin and glucagon. PMC3645673.'},
    {id:'melatonin-circadian-t2d', tipo:'articulo', temas:['crono'],
     autores:'Revisión mecanística',
     titulo:'Molecular mechanisms of the melatonin receptor pathway linking circadian rhythm to type 2 diabetes mellitus',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10052080/',
     cita:'Molecular mechanisms of the melatonin receptor pathway linking circadian rhythm to T2DM. PMC10052080.'},
    {id:'melatonin-betacell', tipo:'articulo', temas:['crono'],
     autores:'Estudio celular (INS-1)',
     titulo:'Melatonin protects pancreatic β-cells from apoptosis and senescence induced by glucotoxicity and glucolipotoxicity',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7527021/',
     cita:'Melatonin protects β-cells from glucotoxicity and glucolipotoxicity. PMC7527021.'},
    {id:'lat1-bbb', tipo:'articulo', temas:['crono','saludmental'],
     autores:'Revisión sobre LAT1',
     titulo:'The multifaceted role of L-type amino acid transporter 1 at the blood-brain barrier: structural implications and therapeutic potential',
     fuente:'PubMed',
     url:'https://pubmed.ncbi.nlm.nih.gov/39325101/',
     cita:'The multifaceted role of LAT1 at the blood-brain barrier. PMID 39325101.'},
    {id:'tryptophan-carb', tipo:'articulo', temas:['crono','saludmental'], year:1984,
     autores:'Wurtman RJ, et al.',
     titulo:'Recent research on the behavioral effects of tryptophan and carbohydrate',
     fuente:'PubMed',
     url:'https://pubmed.ncbi.nlm.nih.gov/6400041/',
     cita:'Recent research on the behavioral effects of tryptophan and carbohydrate. PMID 6400041.'},
    {id:'tryptophan-gutbrain', tipo:'articulo', temas:['crono','saludmental'],
     autores:'Revisión metabolismo del triptófano',
     titulo:'Tryptophan metabolism and gut-brain homeostasis',
     fuente:'PMC (NIH)',
     url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8000752/',
     cita:'Tryptophan metabolism and gut-brain homeostasis. PMC8000752.'},

    /* ── N1 · Patrones dietéticos, ultraprocesados y determinantes comerciales ── */
    {id:'cochrane-med-diet-2019', tipo:'articulo', temas:['nutricion','peso'], year:2019,
     autores:'Rees K, Takeda A, Martin N, et al.',
     titulo:'Mediterranean-style diet for the primary and secondary prevention of cardiovascular disease',
     fuente:'Cochrane Database of Systematic Reviews',
     url:'https://doi.org/10.1002/14651858.CD009825.pub3',
     cita:'Revisión Cochrane: la dieta mediterránea reduce factores de riesgo cardiovascular; certeza baja-moderada para eventos duros y mortalidad. DOI: 10.1002/14651858.CD009825.pub3'},
    {id:'cochrane-dash-2025', tipo:'articulo', temas:['nutricion','peso'], year:2025,
     autores:'Bensaaud A, Seery S, Gibson I, et al.',
     titulo:'Dietary Approaches to Stop Hypertension (DASH) for the primary and secondary prevention of cardiovascular diseases',
     fuente:'Cochrane Database of Systematic Reviews',
     url:'https://pubmed.ncbi.nlm.nih.gov/40326569/',
     cita:'Revisión Cochrane: DASH baja la presión arterial, pero la evidencia sobre eventos cardiovasculares mayores sigue siendo limitada. PMID: 40326569'},
    {id:'popiolek-keto-2024', tipo:'articulo', temas:['nutricion','hidratos'], year:2024,
     autores:'Popiolek-Kalisz J',
     titulo:'Ketogenic diet and cardiovascular risk — state of the art review',
     fuente:'Current Problems in Cardiology',
     url:'https://pubmed.ncbi.nlm.nih.gov/38232923/',
     cita:'La dieta cetogénica mejora marcadores a corto plazo pero no cumple criterios de dieta saludable a largo plazo; posibles efectos adversos sobre el LDL-C. PMID: 38232923'},
    {id:'monteiro-nova-2019', tipo:'articulo', temas:['nutricion'], year:2019,
     autores:'Monteiro CA, Cannon G, Levy RB, et al.',
     titulo:'Ultra-processed foods: what they are and how to identify them',
     fuente:'Public Health Nutrition',
     url:'https://pubmed.ncbi.nlm.nih.gov/30744710/',
     cita:'Definición canónica de los 4 grupos del sistema NOVA de procesamiento de alimentos. PMID: 30744710'},
    {id:'louie-nova-critiques-2025', tipo:'articulo', temas:['nutricion'], year:2025,
     autores:'Louie JCY',
     titulo:'Are all ultra-processed foods bad? A critical review of the NOVA classification system',
     fuente:'Proceedings of the Nutrition Society',
     url:'https://pubmed.ncbi.nlm.nih.gov/40757421/',
     cita:'Crítica a NOVA: su carácter binario ignora la densidad nutricional y penaliza alimentos fortificados y alternativas vegetales. PMID: 40757421'},
    {id:'lesser-funding-2007', tipo:'articulo', temas:['nutricion'], year:2007,
     autores:'Lesser LI, Ebbeling CB, Goozner M, Wypij D, Ludwig DS',
     titulo:'Relationship between Funding Source and Conclusion among Nutrition-Related Scientific Articles',
     fuente:'PLoS Medicine',
     url:'https://pubmed.ncbi.nlm.nih.gov/17214504/',
     cita:'Los estudios financiados por la industria tienen ~8 veces más probabilidad de concluir a favor del producto del patrocinador (OR 7,61). PMID: 17214504'},
    {id:'bes-rastrollo-ssb-2013', tipo:'articulo', temas:['nutricion','hidratos'], year:2013,
     autores:'Bes-Rastrollo M, Schulze MB, Ruiz-Canela M, Martínez-González MA',
     titulo:'Financial conflicts of interest and reporting bias regarding sugar-sweetened beverages and weight gain',
     fuente:'PLoS Medicine',
     url:'https://pubmed.ncbi.nlm.nih.gov/24391479/',
     cita:'Las revisiones sobre refrescos financiadas por la industria tienen 5 veces más probabilidad de negar su relación con el aumento de peso. PMID: 24391479'}
  ];

  // Orden de índice: por tema (factor principal), luego año desc.
  const SORTS = {
    tema:  {lbl:'Tema'},
    year:  {lbl:'Año (recientes)'},
    tipo:  {lbl:'Tipo'},
    autor: {lbl:'Autor (A-Z)'}
  };

  window.BiblioData = { TIPOS, TEMAS, BIBLIO, SORTS };
})();

/* ── Página de Bibliografía (overlay a pantalla completa, estilo app) ── */
(function(){
  'use strict';
  const esc = window.escHtml || (s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  function norm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

  let _state = { q:'', tipo:'all', tema:'all', sort:'tema', root:null, closed:false };

  function injectCSS(){
    if(document.getElementById('pn-bib-css')) return;
    const s=document.createElement('style'); s.id='pn-bib-css'; s.textContent=`
    .bib-back{position:fixed;top:var(--hdr-h,0);left:0;right:0;bottom:0;z-index:180;background:var(--cream,#F5EEE4);display:flex;justify-content:center;opacity:0;transition:opacity .2s}
    .bib-back.show{opacity:1}
    .bib-page{background:var(--white,#FFFDF7);width:100%;max-width:900px;height:100%;display:flex;flex-direction:column;box-shadow:0 0 60px rgba(34,22,8,.12)}
    .bib-hd{background:var(--accent,#B5603A);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:12px;position:sticky;top:0}
    .bib-hd h3{font-family:'Playfair Display',serif;font-weight:700;font-size:1.25rem;margin:0;flex:1}
    .bib-back-btn{border:none;background:rgba(255,255,255,.18);color:#fff;border-radius:10px;padding:8px 14px;min-height:40px;cursor:pointer;font-size:.85rem}
    .bib-back-btn:hover{background:rgba(255,255,255,.32)}
    .bib-tools{padding:0 0 12px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid rgba(44,31,14,.08);margin-bottom:6px;position:sticky;top:0;background:var(--white,#FFFDF7);z-index:2}
    .app-page-body .bib-scroll{padding:0;overflow:visible}
    .bib-searchrow{display:flex;gap:8px;align-items:center}
    .bib-searchrow .bib-search{flex:1;min-width:0}
    .bib-filterbtn{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border:1.5px solid rgba(44,31,14,.16);background:var(--white);color:var(--warm);border-radius:12px;padding:10px 14px;min-height:44px;cursor:pointer;font-size:.84rem;white-space:nowrap}
    .bib-filterbtn:hover,.bib-filterbtn[aria-expanded="true"]{border-color:var(--accent,#B5603A);color:var(--accent,#B5603A)}
    .bib-filterbtn.has{border-color:var(--accent,#B5603A);background:rgba(181,96,58,.08)}
    .bib-fbadge{background:var(--accent,#B5603A);color:#fff;border-radius:10px;font-size:.66rem;font-weight:700;min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;padding:0 4px}
    .bib-filters{display:flex;flex-direction:column;gap:10px;padding-top:4px}
    .bib-filters[hidden]{display:none}
    .bib-search{width:100%;border:1.5px solid rgba(44,31,14,.15);border-radius:12px;padding:11px 14px;font-size:.95rem;font-family:'Lora',serif;background:var(--white)}
    .bib-search:focus{outline:none;border-color:var(--accent,#B5603A)}
    .bib-frow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
    .bib-frow .bib-lbl{font-family:'DM Mono',monospace;font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-50);margin-right:2px}
    .bib-chip{border:1.5px solid rgba(44,31,14,.14);background:var(--white);border-radius:18px;padding:6px 11px;min-height:36px;cursor:pointer;font-size:.78rem;color:var(--warm)}
    .bib-chip.on{border-color:var(--accent,#B5603A);background:rgba(181,96,58,.12);font-weight:600}
    .bib-sort{margin-left:auto;border:1.5px solid rgba(44,31,14,.15);border-radius:10px;padding:7px 10px;min-height:38px;background:var(--white);font-size:.8rem;color:var(--warm)}
    .bib-scroll{flex:1;overflow:auto;padding:14px 20px 28px}
    .bib-count{font-size:.76rem;color:var(--ink-50);margin-bottom:10px}
    .bib-group-h{font-family:'Playfair Display',serif;font-size:1rem;color:var(--accent,#B5603A);margin:16px 0 8px;padding-bottom:4px;border-bottom:1.5px solid rgba(181,96,58,.25)}
    .bib-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-bottom:6px}
    .bib-item{border:1px solid rgba(44,31,14,.1);border-radius:14px;padding:13px 15px;background:linear-gradient(160deg,rgba(255,255,255,.7),rgba(245,238,228,.4));display:flex;flex-direction:column}
    .bib-it-top{display:flex;gap:8px;align-items:flex-start;margin-bottom:5px}
    .bib-it-ic{font-size:1.2rem;flex:none}
    .bib-it-t{font-family:'Lora',serif;font-weight:600;font-size:.96rem;color:var(--warm);line-height:1.3;flex:1}
    .bib-it-meta{font-size:.78rem;color:var(--ink-50);margin-bottom:8px}
    .bib-it-cita{font-size:.8rem;color:var(--ink-70,rgba(44,31,14,.8));font-style:italic;line-height:1.45;margin-bottom:10px;
      border-left:3px solid rgba(181,96,58,.3);padding-left:10px}
    .bib-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
    .bib-tag{font-size:.66rem;background:rgba(44,31,14,.06);border-radius:8px;padding:3px 7px;color:var(--warm)}
    .bib-open{border:1.5px solid var(--accent,#B5603A);background:var(--white);color:var(--accent,#B5603A);border-radius:10px;
      padding:9px 14px;min-height:42px;cursor:pointer;font-size:.82rem;font-weight:600;align-self:flex-start;margin-top:auto}
    .bib-open:hover{background:var(--accent,#B5603A);color:#fff}
    .bib-empty{text-align:center;color:var(--ink-50);padding:40px 10px}
    `;
    (document.head||document.documentElement).appendChild(s);
  }

  function filtered(){
    const {TIPOS,TEMAS,BIBLIO}=window.BiblioData;
    const q = norm(_state.q);
    return BIBLIO.filter(r=>{
      if(_state.tipo!=='all' && r.tipo!==_state.tipo) return false;
      if(_state.tema!=='all' && !(r.temas||[]).includes(_state.tema)) return false;
      if(q){ const hay = norm([r.titulo,r.autores,r.fuente,r.cita,(r.temas||[]).join(' ')].join(' ')); if(!hay.includes(q)) return false; }
      return true;
    });
  }

  function groupAndSort(list){
    const {TEMAS,TIPOS}=window.BiblioData;
    const s=_state.sort;
    if(s==='year') return [['', list.slice().sort((a,b)=>b.year-a.year)]];
    if(s==='autor') return [['', list.slice().sort((a,b)=>(a.autores||'').localeCompare(b.autores||'','es'))]];
    const key = s==='tipo' ? (r=>r.tipo) : (r=> (r.temas||[])[0] || 'otros');
    const dict = s==='tipo'?TIPOS:TEMAS;
    const groups={};
    list.forEach(r=>{ const k=key(r); (groups[k]=groups[k]||[]).push(r); });
    return Object.keys(groups).sort().map(k=>{
      const meta = dict[k] || {ico:'•', lbl:k};
      return [`${meta.ico} ${meta.lbl}`, groups[k].sort((a,b)=>b.year-a.year)];
    });
  }

  function itemHtml(r){
    const {TIPOS,TEMAS}=window.BiblioData;
    const tmeta = TIPOS[r.tipo]||{ico:'📄',lbl:r.tipo};
    const tags = (r.temas||[]).map(t=> TEMAS[t]?`<span class="bib-tag">${TEMAS[t].ico} ${esc(TEMAS[t].lbl)}</span>`:'').join('');
    return `<div class="bib-item">
      <div class="bib-it-top"><span class="bib-it-ic">${tmeta.ico}</span><span class="bib-it-t">${esc(r.titulo)}</span></div>
      <div class="bib-it-meta">${esc(r.autores)} · ${esc(r.fuente)}${r.year?(' · '+r.year):''}</div>
      <div class="bib-it-cita">${esc(r.cita)}</div>
      <div class="bib-tags">${tags}</div>
      ${r.url?`<button class="bib-open" data-url="${esc(r.url)}">🔗 Abrir documento</button>`:''}
    </div>`;
  }

  function renderBody(){
    const root=_state.root; if(!root) return;
    const list=filtered();
    const groups=groupAndSort(list);
    const body = groups.map(([h,items])=>`${h?`<h3 class="bib-group-h">${h}</h3>`:''}<div class="bib-grid">${items.map(itemHtml).join('')}</div>`).join('');
    const scroll = root.querySelector('.bib-scroll');
    scroll.innerHTML = `<div class="bib-count">${list.length} referencia${list.length===1?'':'s'}</div>${body||'<div class="bib-empty">No hay referencias que coincidan con tu búsqueda o filtros.</div>'}`;
  }

  // Aviso de redirección antes de abrir en el navegador.
  async function openExternal(url){
    const msg = `Vas a salir de la app y abrir en tu navegador:\n\n${url}\n\nEs una web externa que no controlamos.`;
    const ok = (typeof pnConfirm==='function')
      ? await pnConfirm(msg, {okText:'Abrir en el navegador'})
      : window.confirm(msg);
    if(ok){ try{ window.open(url, '_blank', 'noopener,noreferrer'); }catch(e){ location.href=url; } }
  }

  function open(){
    injectCSS();
    const {TIPOS,TEMAS,SORTS}=window.BiblioData;
    _state.closed=false;
    const tipoChips = [`<button class="bib-chip ${_state.tipo==='all'?'on':''}" data-tipo="all">Todos</button>`]
      .concat(Object.entries(TIPOS).map(([k,v])=>`<button class="bib-chip ${_state.tipo===k?'on':''}" data-tipo="${k}">${v.ico} ${esc(v.lbl)}</button>`)).join('');
    const temaChips = [`<button class="bib-chip ${_state.tema==='all'?'on':''}" data-tema="all">Todos</button>`]
      .concat(Object.entries(TEMAS).map(([k,v])=>`<button class="bib-chip ${_state.tema===k?'on':''}" data-tema="${k}">${v.ico} ${esc(v.lbl)}</button>`)).join('');
    const sortOpts = Object.entries(SORTS).map(([k,v])=>`<option value="${k}" ${_state.sort===k?'selected':''}>Ordenar: ${esc(v.lbl)}</option>`).join('');

    if(typeof AppPage==='undefined') return;
    AppPage.open({
      key:'biblio', group:'info', title:'📚 Bibliografía',
      render(body){
        _state.root = body;
        const activeN = (_state.tipo!=='all'?1:0)+(_state.tema!=='all'?1:0);
        body.innerHTML=`
          <div class="bib-tools">
            <div class="bib-searchrow">
              <input class="bib-search" type="search" placeholder="🔎 Buscar por título, autor, fuente o tema…" value="${esc(_state.q)}">
              <button class="bib-filterbtn ${activeN?'has':''}" type="button" aria-expanded="false">⚙ Filtros y orden${activeN?`<span class="bib-fbadge">${activeN}</span>`:''}</button>
            </div>
            <div class="bib-filters" hidden>
              <div class="bib-frow"><span class="bib-lbl">Tipo</span>${tipoChips}</div>
              <div class="bib-frow"><span class="bib-lbl">Tema</span>${temaChips}</div>
              <div class="bib-frow"><span class="bib-lbl">Orden</span><select class="bib-sort">${sortOpts}</select></div>
            </div>
          </div>
          <div class="bib-scroll"></div>`;
        renderBody();
        const fbtn=body.querySelector('.bib-filterbtn'), fpanel=body.querySelector('.bib-filters');
        fbtn.addEventListener('click', ()=>{ const open=fpanel.hasAttribute('hidden'); if(open) fpanel.removeAttribute('hidden'); else fpanel.setAttribute('hidden',''); fbtn.setAttribute('aria-expanded', open); });
        const refreshBadge=()=>{ const n=(_state.tipo!=='all'?1:0)+(_state.tema!=='all'?1:0); fbtn.classList.toggle('has', !!n); let b=fbtn.querySelector('.bib-fbadge'); if(n){ if(!b){ b=document.createElement('span'); b.className='bib-fbadge'; fbtn.appendChild(b);} b.textContent=n; } else if(b){ b.remove(); } };
        body.querySelector('.bib-search').addEventListener('input', e=>{ _state.q=e.target.value; renderBody(); });
        body.querySelector('.bib-sort').addEventListener('change', e=>{ _state.sort=e.target.value; renderBody(); });
        body.addEventListener('click', e=>{
          const t=e.target.closest('[data-tipo]'); if(t){ _state.tipo=t.dataset.tipo; body.querySelectorAll('[data-tipo]').forEach(b=>b.classList.toggle('on', b===t)); refreshBadge(); renderBody(); return; }
          const m=e.target.closest('[data-tema]'); if(m){ _state.tema=m.dataset.tema; body.querySelectorAll('[data-tema]').forEach(b=>b.classList.toggle('on', b===m)); refreshBadge(); renderBody(); return; }
          const u=e.target.closest('[data-url]'); if(u){ openExternal(u.dataset.url); return; }
        });
      }
    });
  }

  window.openBibliografia = open;
  if(typeof AppPage!=='undefined') AppPage.register('biblio', open);
})();

