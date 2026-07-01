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
    metabolismo: {ico:'⚙️', lbl:'Metabolismo a fondo', sub:'Cómo gastas energía y por qué importa'},
    crono:       {ico:'🕒', lbl:'Crononutrición', sub:'El reloj del cuerpo y cuándo comer'},
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
     verAlso:['macros-intro','ejercicio-fuerza','proteina-musculo-edad'], refs:['morton-prot','efsa-dri']},

    {id:'grasas-buenas', tema:'macros', nivel:'medio',
     titulo:'Grasas: cuáles priorizar',
     lead:'Prioriza grasas insaturadas (AOVE, pescado azul, frutos secos) y modera las saturadas.',
     cuerpo:`<p>La grasa es esencial. Prioriza las <strong>insaturadas</strong>: aceite de oliva virgen extra, aguacate, frutos secos y <strong>pescado azul</strong> (omega-3).</p>
       <p>Modera las grasas de ultraprocesados y embutidos. No necesitas eliminar la grasa: necesitas elegir mejor su origen.</p>`,
     verAlso:['macros-intro','plato-ideal','grasas-calidad-fuentes'], refs:['mozaffarian-fat']},

    {id:'hidratos-calidad', tema:'macros', nivel:'medio',
     titulo:'Hidratos de calidad',
     lead:'No son el enemigo: elige integrales, legumbre, fruta y tubérculos.',
     cuerpo:`<p>Los hidratos son la principal fuente de energía. La calidad importa más que la cantidad absoluta: prioriza <strong>integrales, legumbres, fruta y tubérculos</strong> frente a azúcares y harinas refinadas.</p>
       <p>Ajusta la cantidad a tu actividad: más movimiento, más margen para hidratos.</p>`,
     verAlso:['macros-intro','energia-balance','hidratos-flexibilidad'], refs:['hall-energy']},

    {id:'energia-balance', tema:'energia', nivel:'medio',
     titulo:'Calorías y balance energético',
     lead:'El peso responde al balance entre lo que comes y lo que gastas, pero la calidad influye en el apetito.',
     img:'balance-energetico',
     cuerpo:`<p>El <strong>balance energético</strong> (energía que entra vs. que gastas) determina si ganas, mantienes o pierdes peso. Pero no todo es contar: la <strong>calidad</strong> de la comida influye en tu hambre, saciedad y energía.</p>
       <p>Comida real, suficiente proteína y fibra te ayudan a regular el apetito sin obsesionarte con los números.</p>`,
     verAlso:['hidratos-calidad','peso-composicion','gasto-energetico','calorias-calidad'], refs:['hall-energy']},

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
     verAlso:['que-es-comer-bien','energia-balance'], refs:['firth-mental']},

    /* ── Metabolismo a fondo y crononutrición ── */
    {id:'gasto-energetico', tema:'metabolismo', nivel:'medio',
     titulo:'¿Cuánta energía gastas cada día?',
     lead:'Tu gasto total (TDEE) es la suma de cuatro piezas, y no todas dependen del peso.',
     img:'balance-energetico',
     cuerpo:`<p>El <strong>gasto energético diario total (TDEE)</strong> se compone de cuatro partes:</p>
       <ul>
         <li><strong>Metabolismo basal (BMR)</strong>: lo que gastas en reposo solo por estar vivo. Suele ser el <strong>60–75%</strong> del total.</li>
         <li><strong>NEAT</strong>: el movimiento no deportivo del día (caminar, gesticular, mantener la postura).</li>
         <li><strong>Efecto térmico de los alimentos (TEF)</strong>: la energía que cuesta digerir lo que comes (~10%).</li>
         <li><strong>Ejercicio (EAT)</strong>: el entrenamiento estructurado.</li>
       </ul>
       <p>Un detalle clave: el gasto en reposo no es proporcional al peso. Órganos como el <strong>cerebro, el hígado, el corazón y los riñones</strong> pesan poco (≈5–6% del cuerpo) pero explican gran parte del BMR. El <strong>músculo</strong> consume bastante más energía que la <strong>grasa</strong> en reposo. Por eso quien tiene más masa muscular suele gastar más.</p>
       <p>Para estimar tus calorías, las fórmulas con solo peso y altura (como <strong>Mifflin-St Jeor</strong>) sirven para la mayoría. Si conoces tu composición corporal, las basadas en <strong>masa magra</strong> (Katch-McArdle, Cunningham) afinan más en personas muy musculadas o con mucha grasa. La app usa una estimación práctica que puedes ajustar a mano.</p>`,
     nota:'Toda fórmula es una estimación; ajústala según tu evolución real (peso medio, energía, fuerza).',
     verAlso:['calorias-calidad','peso-composicion','hidratos-flexibilidad'],
     refs:['ree-anatomy','organ-metabolic-rates','katch-mcardle-tdee','bmr-organ-model']},

    {id:'calorias-calidad', tema:'energia', nivel:'medio',
     titulo:'¿Cuenta igual toda caloría?',
     lead:'Las calorías importan, pero de dónde vienen también: la matriz del alimento cambia cuánta energía aprovechas.',
     cuerpo:`<p>Contar calorías es útil, pero la idea de que "una caloría es exactamente igual a otra" se queda corta. Tu cuerpo gasta energía en <strong>digerir</strong> (el efecto térmico de los alimentos), y ese coste depende de <strong>cómo de procesado</strong> esté lo que comes.</p>
       <p>En un estudio clásico (Barr y Wright, 2010), una comida con <strong>alimentos integrales</strong> requirió cerca del <strong>20% de su energía</strong> solo para digerirse; una comida ultraprocesada con las mismas calorías, apenas un <strong>11%</strong>. El ultraprocesado llega "predigerido": se absorbe rápido, cuesta menos trabajo y deja más energía disponible para almacenar.</p>
       <p>Además, en condiciones de libre elección, las dietas ultraprocesadas llevan a <strong>comer más y ganar peso</strong> que las basadas en comida real con los mismos nutrientes (Hall y cols., 2019). No es que un capricho engorde por sí solo: es el <strong>patrón</strong> el que cuenta.</p>
       <p>Conclusión práctica: prioriza <strong>comida real</strong>. No por contar mejor las calorías, sino porque sacia más, aporta más nutrientes y tu cuerpo la gestiona mejor.</p>`,
     verAlso:['gasto-energetico','que-es-comer-bien','crononutricion-reloj'],
     refs:['tef-whole-vs-processed','upf-weight-gain','energy-balance-hidden','tef-glutenfree']},

    {id:'proteina-musculo-edad', tema:'metabolismo', nivel:'avanzado',
     titulo:'Proteína, músculo y edad',
     lead:'La proteína no es solo combustible: es la señal que mantiene tu músculo, sobre todo al envejecer.',
     cuerpo:`<p>La proteína repara tejidos y actúa como <strong>señal</strong>: activa la maquinaria celular (la vía <strong>mTOR</strong>) que construye músculo, con la <strong>leucina</strong> (un aminoácido) como interruptor principal.</p>
       <p>La cantidad mínima oficial (0,8 g/kg) se fijó para <strong>no enfermar</strong>, no para optimizar la masa muscular. Para mantener músculo, recuperarte y envejecer con fuerza, la evidencia apunta a rangos más altos:</p>
       <ul>
         <li><strong>Mantenimiento general:</strong> ~1,2–1,6 g/kg al día.</li>
         <li><strong>Pérdida de grasa, deporte o personas mayores:</strong> ~1,5–2,0 g/kg.</li>
       </ul>
       <p>Con la edad aparece la <strong>resistencia anabólica</strong>: el músculo responde peor al mismo estímulo, así que hace falta <strong>más</strong> proteína y en <strong>tomas concentradas</strong>. Para "encender" bien la síntesis muscular se recomiendan unos <strong>30–45 g de proteína de calidad por comida</strong> (suficiente leucina), repartidos cada <strong>3–5 horas</strong>. Combinarlo con <strong>entrenamiento de fuerza</strong> es lo que mejor previene la pérdida de músculo (sarcopenia).</p>`,
     nota:'Si tienes enfermedad renal u otra condición, ajusta la proteína con tu médico antes de subirla.',
     verAlso:['proteina-cuanta','ejercicio-fuerza','cuando-comer','gasto-energetico'],
     refs:['protein-elderly-optimal','anabolic-resistance','leucine-trigger','leucine-mps','sarcopenia-nutrition','protein-aging']},

    {id:'grasas-calidad-fuentes', tema:'metabolismo', nivel:'avanzado',
     titulo:'La calidad de la grasa importa',
     lead:'La grasa es esencial para tus hormonas y tus células; prioriza fuentes estables y minimiza los ultraprocesados.',
     cuerpo:`<p>La grasa no es opcional: forma las <strong>membranas</strong> de tus células, permite absorber las <strong>vitaminas A, D, E y K</strong> y es la materia prima de hormonas como la testosterona o los estrógenos. Bajarla demasiado pasa factura hormonal.</p>
       <p>Un rango razonable para la mayoría está entre <strong>0,8 y 1,2 g/kg al día</strong>, sin bajar de ~0,5–0,6 g/kg. Pero más allá de la cantidad, importa la <strong>fuente</strong>:</p>
       <ul>
         <li><strong>Prioriza</strong>: aceite de oliva virgen extra, aguacate, frutos secos y <strong>pescado azul</strong> (omega-3). Son estables y bien tolerados.</li>
         <li><strong>Modera</strong>: las grasas que llegan sobre todo en <strong>ultraprocesados</strong> y fritos repetidos.</li>
       </ul>
       <p>El papel del <strong>ácido linoleico</strong> (omega-6) de los aceites de semillas refinados es hoy un <strong>tema en debate científico</strong>: algunos autores lo relacionan con inflamación y daño celular cuando se consume en exceso, mientras otros estudios no encuentran ese efecto en cantidades normales. Lo prudente y en lo que casi todos coinciden: <strong>basar la dieta en comida real</strong> y no en productos ultraprocesados, donde estos aceites abundan.</p>`,
     nota:'Este es un tema con evidencia en evolución; evita conclusiones extremas y prioriza el patrón global.',
     verAlso:['grasas-buenas','proteina-musculo-edad','que-es-comer-bien'],
     refs:['linoleic-acid-review','mozaffarian-fat']},

    {id:'hidratos-flexibilidad', tema:'metabolismo', nivel:'medio',
     titulo:'Hidratos: el "resto" y la flexibilidad metabólica',
     lead:'No son imprescindibles para sobrevivir, pero bien usados son una herramienta potente.',
     cuerpo:`<p>A diferencia de la proteína y la grasa, los <strong>carbohidratos</strong> no son estrictamente esenciales: el hígado puede fabricar la glucosa que el cuerpo necesita. Por eso, en un plan, se suelen calcular como el <strong>"resto energético"</strong>: primero se aseguran proteína y grasa, y los hidratos rellenan las calorías que faltan, <strong>ajustados a tu actividad</strong>.</p>
       <p>Que no sean esenciales no significa que no sean útiles. En una persona activa y con buena <strong>flexibilidad metabólica</strong> (capacidad de alternar entre quemar grasa y glucosa), los hidratos de calidad ayudan a:</p>
       <ul>
         <li>Mantener la <strong>hormona tiroidea</strong> activa y el gasto metabólico en dietas largas.</li>
         <li><strong>Recuperar</strong> el glucógeno tras entrenar y rendir mejor.</li>
         <li>Amortiguar el <strong>cortisol</strong> del entrenamiento intenso.</li>
       </ul>
       <p>Elige <strong>matrices complejas</strong>: tubérculos, legumbres, fruta entera e integrales. Ajusta la cantidad: más movimiento, más margen para hidratos.</p>`,
     verAlso:['hidratos-calidad','gasto-energetico','cuando-comer'],
     refs:['hall-energy','energy-balance-hidden']},

    {id:'crononutricion-reloj', tema:'crono', nivel:'medio',
     titulo:'El reloj de tu metabolismo',
     lead:'No procesas igual la comida a las 9 de la mañana que a medianoche.',
     cuerpo:`<p>Tu metabolismo no es constante 24 horas: sigue un <strong>ritmo circadiano</strong> marcado por un "reloj maestro" en el cerebro y por relojes en órganos como el hígado o el páncreas, que se sincronizan con <strong>cuándo</strong> comes.</p>
       <p>La pieza central es el equilibrio entre dos hormonas: la <strong>insulina</strong> (almacenamiento) y la <strong>melatonina</strong> (descanso). Por la <strong>mañana</strong>, tu sensibilidad a la insulina está en su punto alto: gestionas bien los hidratos. Al <strong>anochecer</strong>, al subir la melatonina, las células del páncreas que liberan insulina quedan parcialmente "frenadas" (a través de sus receptores MT1/MT2).</p>
       <p>Consecuencia práctica: una <strong>carga grande de azúcares por la noche</strong> se tolera peor y deja la glucosa alta más tiempo, lo que perjudica el descanso y, a la larga, la salud metabólica. No significa que cenar esté mal: significa concentrar los <strong>azúcares rápidos</strong> y las comidas muy copiosas mejor en la primera mitad del día.</p>`,
     nota:'Hay mucha variabilidad individual (cronotipo). Úsalo como guía, no como norma rígida.',
     verAlso:['carbos-noche','cuando-comer','calorias-calidad'],
     refs:['melatonin-islets','melatonin-circadian-t2d','melatonin-betacell']},

    {id:'carbos-noche', tema:'crono', nivel:'avanzado',
     titulo:'¿Carbohidratos por la noche?',
     lead:'Como norma, mejor no abusar; pero hay una excepción interesante para el sueño.',
     cuerpo:`<p>La regla general de la crononutrición es evitar <strong>grandes cargas de azúcar</strong> a última hora, porque por la noche toleras peor la glucosa.</p>
       <p>Existe, sin embargo, una <strong>excepción</strong> útil en personas con insomnio o mucho estrés. Una <strong>pequeña ración</strong> de carbohidratos por la noche (y con poca proteína a la vez) provoca una subida suave de insulina que retira de la sangre la mayoría de aminoácidos… <strong>menos el triptófano</strong>, que viaja "protegido" unido a una proteína de la sangre. Al quedarse casi solo, el triptófano cruza más fácilmente al cerebro (por un transportador llamado <strong>LAT1</strong>) y allí se convierte en <strong>serotonina</strong> y luego <strong>melatonina</strong>, favoreciendo el sueño.</p>
       <p>También tiene sentido algo de hidrato por la noche si <strong>entrenas fuerte por la tarde</strong>: el músculo capta glucosa para recuperar glucógeno incluso sin mucha insulina.</p>
       <p>En resumen: no es para todos los días ni para todo el mundo, pero una ración medida de hidratos de buena calidad por la noche puede <strong>ayudar a dormir</strong> en perfiles estresados.</p>`,
     nota:'Si tienes diabetes o alteraciones de la glucosa, consulta antes de aplicar pautas de horario.',
     verAlso:['crononutricion-reloj','cuando-comer','mente-relacion'],
     refs:['lat1-bbb','tryptophan-carb','tryptophan-gutbrain']},

    {id:'cuando-comer', tema:'crono', nivel:'medio',
     titulo:'Cuándo comer: repartir el día',
     lead:'El "desayuno obligatorio" es un mito; lo que importa es el reparto que mejor te encaje.',
     cuerpo:`<p>No hay una única forma correcta de repartir las comidas. Más que el número de ingestas, importa que el reparto encaje con <strong>tu día, tus hormonas y tu entrenamiento</strong>. Algunos modelos útiles:</p>
       <ul>
         <li><strong>Simétrico (33 / 33 / 33):</strong> tres comidas equilibradas. Da picos regulares de proteína para el músculo; muy recomendable en <strong>personas mayores</strong>.</li>
         <li><strong>Cargado por la mañana (50 / 30 / 20):</strong> más calorías e hidratos al principio del día, aprovechando la mejor sensibilidad a la insulina matutina.</li>
         <li><strong>Cargado por la tarde (20 / 30 / 50):</strong> tiene sentido si <strong>entrenas fuerte por la tarde-noche</strong> o buscas el efecto del triptófano sobre el sueño.</li>
         <li><strong>Alrededor del entreno:</strong> concentrar buena parte de los hidratos cerca de la sesión para recuperar mejor.</li>
       </ul>
       <p>Elige uno y dale semanas para valorarlo. La <strong>constancia</strong> y la <strong>adherencia</strong> pesan más que el horario perfecto.</p>`,
     verAlso:['crononutricion-reloj','proteina-musculo-edad','hidratos-flexibilidad'],
     refs:['leucine-trigger','melatonin-circadian-t2d']},

    /* ── N1 · Patrones dietéticos, ultraprocesados y determinantes comerciales ── */
    {id:'patrones-saludables', tema:'fundamentos', nivel:'basico',
     titulo:'El poder de la Dieta Mediterránea y DASH: mucho más que contar calorías',
     lead:'Los patrones ricos en plantas, grasas saludables y alimentos enteros superan a cualquier dieta de moda en prevención y longevidad.',
     cuerpo:`<p>La ciencia nutricional moderna ha demostrado que enfocar la salud en nutrientes aislados (como obsesionarse solo con las grasas o los carbohidratos) es un error. El cuerpo responde a <strong>patrones dietéticos completos</strong>.</p><p>La evidencia clínica más sólida a nivel mundial señala que la <strong>Dieta Mediterránea</strong>, el enfoque <strong>DASH</strong> (diseñado médicamente para reducir la presión arterial) y las dietas basadas en plantas no procesadas son el estándar de oro para vivir más y mejor.</p><ul><li><strong>Base vegetal predominante:</strong> los tres patrones se construyen sobre una base diaria de verduras, frutas, legumbres y cereales de grano entero (integrales).</li><li><strong>Grasas de alta calidad:</strong> priorizan el aceite de oliva virgen extra y los frutos secos, con efecto antiinflamatorio.</li><li><strong>Proteínas saludables:</strong> desplazan las carnes rojas y los embutidos en favor del pescado, las aves y las proteínas vegetales (legumbres).</li></ul><p>Frente a dietas restrictivas extremas como la cetogénica, que pueden ser útiles a corto plazo pero presentan riesgos cardiovasculares a largo plazo por la grasa saturada, la Dieta Mediterránea ha demostrado en estudios de décadas que previene infartos, ayuda a controlar la diabetes y protege frente al deterioro cognitivo.</p>`,
     nota:'Basado en metaanálisis de la Colaboración Cochrane y grandes estudios observacionales: certeza alta para el control de factores de riesgo y moderada para eventos graves. No sustituye el consejo de un profesional.',
     verAlso:['comida-real-vs-ultraprocesados','que-es-comer-bien'],
     refs:['cochrane-med-diet-2019','cochrane-dash-2025','popiolek-keto-2024']},

    {id:'comida-real-vs-ultraprocesados', tema:'practica', nivel:'medio',
     titulo:'La trampa de los ultraprocesados y el sistema NOVA',
     lead:'No importa cuánta vitamina añadan a unas galletas o a un refresco: el daño real está en cómo su procesamiento industrial confunde a tu biología.',
     cuerpo:`<p>En 2009, investigadores de salud pública propusieron la <strong>clasificación NOVA</strong>, que agrupa los alimentos no por sus calorías, sino por su nivel de procesamiento industrial.</p><ul><li><strong>Grupo 1 (comida real, mínimamente procesada):</strong> frutas, verduras, carnes magras, huevos, legumbres secas y leche. Son la base de la salud.</li><li><strong>Grupo 4 (ultraprocesados):</strong> formulaciones con aditivos (colorantes, texturizantes) y técnicas como la extrusión, diseñadas para ser rentables e hiperpalatables (refrescos, bollería, cereales azucarados, carnes reconstituidas).</li></ul><p><strong>El problema real:</strong> quienes basan su dieta en ultraprocesados tienen más riesgo de obesidad, infartos, cáncer y depresión. Ahora bien, el sistema NOVA no es perfecto: agrupa injustamente alimentos útiles (como bebidas vegetales fortificadas) junto a la comida basura. Por eso la regla de oro es sencilla: basa tu alimentación en ingredientes frescos del Grupo 1 y reduce de forma sistemática los ultraprocesados ricos en azúcares añadidos, grasas refinadas y sal.</p>`,
     nota:'La asociación entre ultraprocesados y mortalidad es fuerte, aunque los expertos aún debaten cómo afinar la clasificación para no penalizar procesados saludables.',
     verAlso:['impacto-matriz-alimentaria','patrones-saludables','calorias-calidad'],
     refs:['monteiro-nova-2019','louie-nova-critiques-2025','upf-weight-gain']},

    {id:'impacto-matriz-alimentaria', tema:'energia', nivel:'avanzado',
     titulo:'La matriz alimentaria: por qué no todas las calorías son iguales',
     lead:'La saciedad y el control del peso no dependen solo de qué comes, sino de la estructura física del alimento. La industria rompe esa "matriz" y te hace comer de más.',
     cuerpo:`<p>En nutrición, la <strong>matriz alimentaria</strong> es la arquitectura física microscópica de un alimento: cómo la fibra, el agua, las proteínas y las grasas están entretejidas dentro de sus células.</p><p>Al comer alimentos enteros (una manzana, frutos secos), el sistema digestivo trabaja para romper esa red celular. Eso ralentiza la digestión y lleva nutrientes al tramo final del intestino, disparando hormonas de saciedad potentes (como el GLP-1) que avisan al cerebro de que estamos llenos.</p><ul><li><strong>El colapso de la matriz:</strong> la industria aplica fuerzas extremas (molienda ultrafina, extrusión) que destruyen esa estructura.</li><li><strong>El efecto en el peso:</strong> un ensayo del NIH (Dr. Kevin Hall, 2019) mostró que con alimentos de matriz destruida (ultraprocesados) las personas comen involuntariamente <strong>unas 500 kcal extra al día</strong> frente a comida real, aun con el mismo azúcar, grasa y fibra.</li></ul><p>Al comer purés, panes industriales o batidos ultraprocesados, los nutrientes se absorben de golpe, con picos de insulina y señales de saciedad bloqueadas. Por eso reformular un ultraprocesado para que tenga "menos azúcar" no arregla el fondo: su estructura sigue colapsada.</p>`,
     nota:'Mecanismo respaldado por ensayos controlados en unidades metabólicas cerradas (certeza alta): relaciona el procesamiento físico del alimento con la sobreingesta.',
     verAlso:['comida-real-vs-ultraprocesados','calorias-calidad'],
     refs:['upf-weight-gain','tef-whole-vs-processed']},

    {id:'sesgos-industria-nutricion', tema:'fundamentos', nivel:'avanzado',
     titulo:'Conflictos de interés: cómo la industria distorsiona la ciencia',
     lead:'Distinguir la ciencia independiente del marketing encubierto es clave para decidir con libertad qué pones en el plato.',
     cuerpo:`<p>Buena parte de la investigación nutricional que llega a los medios está financiada por corporaciones de alimentación y bebidas. Las evaluaciones muestran que esto genera un profundo <strong>"sesgo de financiación"</strong>.</p><ul><li>Un estudio de referencia auditó más de 200 artículos y halló que los financiados por la industria tenían casi <strong>8 veces más probabilidad</strong> de concluir que el producto del patrocinador era saludable.</li><li>Con los refrescos azucarados, las revisiones pagadas por la industria fueron cinco veces más proclives a negar que el azúcar engordara, distorsionando el consenso científico.</li></ul><p>La industria rara vez inventa datos: manipula el diseño de los estudios (compara su producto con otros peores, usa dosis irreales, o entierra los resultados desfavorables sin publicarlos).</p><p>Por eso, para cuidarte sin dogmas, prioriza las recomendaciones de organismos públicos (OMS, AESAN) y la investigación de financiación independiente.</p>`,
     nota:'Sustentado en revisiones sistemáticas sobre conflictos de interés en la literatura nutricional.',
     verAlso:['patrones-saludables','comida-real-vs-ultraprocesados'],
     refs:['lesser-funding-2007','bes-rastrollo-ssb-2013']},

    /* -- N2 - Macronutrientes y calidad -- */
    {id:'proteina-necesidades-y-calidad', tema:'macros', nivel:'medio',
     titulo:'Proteína: cuánto, cómo repartirla y qué importa de verdad',
     lead:'La cantidad de proteína útil depende del objetivo, la edad y si hay entrenamiento de fuerza. Para salud general, la RDA de 0,8 g/kg/día evita deficiencia, pero suele quedarse corta para optimizar masa muscular, especialmente en mayores, en déficit calórico y cuando se busca hipertrofia. El total diario importa más que el “timing”, y la calidad proteica sigue contando, aunque una dieta vegetal bien planificada puede cubrir objetivos.',
     cuerpo:`<p><strong>Mantenimiento</strong>. Para población adulta sana, la referencia clásica sigue siendo 0,8 g/kg/día, pero revisiones y guías recientes sugieren que, para preservar mejor la masa magra y la función, muchas personas activas se benefician de rangos cercanos a 1,0–1,2 g/kg/día. En adultos mayores, ESPEN recomienda al menos 1,0 g/kg/día y recoge que 1,0–1,2 g/kg/día puede ser razonable en mayores sanos; 1,2–1,5 g/kg/día se ha sugerido en mayores con enfermedad aguda o crónica. </p><p><strong>Pérdida de grasa</strong>. Cuando hay déficit energético, subir la proteína ayuda a preservar masa muscular. La evidencia más reciente en personas con sobrepeso u obesidad indica que una mayor ingesta proteica reduce la pérdida de masa muscular durante el adelgazamiento; la literatura converge en que el rango práctico suele estar alrededor de 1,2–1,6 g/kg/día, y a veces algo más si el déficit es grande o la persona entrena mucho. El soporte causal aquí es moderado: hay metaanálisis de ECA, pero también heterogeneidad entre protocolos. </p><p><strong>Ganancia muscular y deportistas</strong>. En entrenamiento de fuerza, el metaanálisis de Morton situó el punto de rendimientos decrecientes en torno a 1,6 g/kg/día para maximizar ganancias de masa libre de grasa, y Nunes confirmó que las mejoras adicionales son pequeñas pero más probables con entrenamiento de resistencia y con ingestas altas. En deportistas de resistencia o de equipo, el rango práctico suele ser parecido o algo menor, pero el objetivo principal sigue siendo cubrir el total diario y repartirlo bien. </p><p><strong>Reparto diario y “timing”</strong>. La idea de repartir la proteína en 3–4 tomas de aproximadamente 0,25 g/kg por comida tiene base fisiológica y cierta coherencia con la literatura de síntesis proteica muscular; sin embargo, el metaanálisis de Wirth sugiere que el momento exacto alrededor del ejercicio aporta poco una vez que el total diario es adecuado. En otras palabras: primero importa llegar al total, luego evitar que toda la proteína quede concentrada en una sola comida. </p><p><strong>Umbral de leucina</strong>. La leucina activa rutas anabólicas y ayuda a predecir la respuesta aguda de síntesis proteica muscular, sobre todo en mayores. Como regla práctica divulgativa, muchas revisiones sitúan el objetivo por comida en unos 25–30 g de proteína de alta calidad y aproximadamente 2,5–3 g de leucina, pero esto es un umbral aproximado, no una ley biológica exacta. Además, trasladar respuestas agudas de laboratorio a resultados clínicos duraderos tiene incertidumbre. La suplementación aislada con leucina en sarcopenia ofrece señales prometedoras, pero la certeza global sigue siendo baja y parece funcionar peor si no se acompaña de fuerza o de una proteína total suficiente. </p><p><strong>Proteína vegetal y calidad</strong>. La evidencia no apoya el mensaje simplista de que “la proteína vegetal no sirve”. El metaanálisis de Reid-McCann encontró que, en general, no hubo diferencias claras entre proteína animal y vegetal para fuerza o rendimiento físico; para masa muscular, la proteína animal mostró una pequeña ventaja frente a proteínas vegetales no soja y frente a algunas dietas basadas en plantas, pero no frente a soja. En la práctica, las dietas vegetales pueden funcionar bien si cuidan cantidad total, variedad, digestibilidad y, si hace falta, una ligera “sobredosis” respecto a una dieta omnívora. </p><ul><li><strong>Resumen práctico</strong>: salud general 1,0–1,2 g/kg/día suele ser razonable; pérdida de grasa 1,2–1,6 g/kg/día; hipertrofia y fuerza, hasta alrededor de 1,6 g/kg/día como referencia útil; mayores, al menos 1,0 g/kg/día y con frecuencia 1,0–1,2 g/kg/día o más según fragilidad y ejercicio. </li><li><strong>Lo más importante</strong>: total diario suficiente, entrenamiento de fuerza y un reparto razonable entre comidas. </li><li><strong>Lo incierto</strong>: el “umbral de leucina” es útil como guía, pero no está cerrado para todos los contextos ni sustituye al patrón dietético completo. </li></ul>`,
     nota:'Esta ficha es informativa. En enfermedad renal, fragilidad avanzada, trastornos alimentarios o pérdida de peso no intencionada, la cifra adecuada puede cambiar y conviene individualizar con un profesional sanitario.',
     verAlso:['grasas-calidad-y-controversias','hidratos-calidad-fibra-y-azucares','controversias-interpretar-la-evidencia'],
     refs:['espen-geriatricos-2022','morton-prot','nunes-2022-proteina-musculo','wirth-2020-timing-proteina','reid-mccann-2025-proteina-vegetal','wilkinson-2023-leucina-mps','huang-2025-leucina-sarcopenia','kokura-2024-proteina-perdida-peso']},

    {id:'grasas-calidad-y-controversias', tema:'macros', nivel:'medio',
     titulo:'Grasas: más que la cantidad, importa con qué las sustituyes',
     lead:'La evidencia más sólida sigue favoreciendo desplazar grasa saturada por grasa insaturada, sobre todo poliinsaturada. La OMS recomienda que la grasa saturada no supere el 10% de la energía y que, al reducirla, se sustituya preferentemente por poliinsaturadas, luego por monoinsaturadas de origen vegetal o por hidratos ricos en fibra. En cambio, bajar saturadas para cambiarlas por harinas refinadas o azúcares no mejora el patrón global.',
     cuerpo:`<p><strong>Saturadas frente a insaturadas</strong>. La pregunta correcta no es solo “¿la grasa saturada es mala?”, sino “¿qué alimento o nutriente ocupa su lugar?”. La guía OMS 2023 recomienda reducir saturadas al 10% de la energía y reemplazarlas por poliinsaturadas, monoinsaturadas de origen vegetal o carbohidratos ricos en fibra; además, resume que los ECA apuntan a menor riesgo cardiovascular cuando baja la saturada y que el efecto es más claro cuando el reemplazo es de buena calidad. El metaanálisis Cochrane encontró una reducción del riesgo de eventos cardiovasculares, aunque no una caída clara de mortalidad total, y el umbrella review de 2024 llega a una conclusión parecida: señal favorable para eventos, más modesta para mortalidad. </p><p><strong>Omega-3</strong>. Los omega-3 marinos no son una varita mágica para toda la población, pero sí tienen una señal de beneficio cardiovascular modesta, más evidente en determinados contextos de alto riesgo y, en algunos análisis, mayor con EPA aislado que con mezclas EPA+DHA. También puede haber un pequeño aumento de fibrilación auricular o sangrado con dosis altas, por lo que no conviene venderlos como “siempre más es mejor”. La evidencia es moderada y dependiente del contexto clínico. </p><p><strong>Omega-6</strong>. El discurso de que el omega-6 “inflama” por definición no encaja bien con la evidencia humana. Un gran análisis de biomarcadores observó que niveles más altos de ácido linoleico se asociaron con menor riesgo de eventos cardiovasculares, y un metaanálisis de ECA encontró que aumentar ácido linoleico reduce LDL-colesterol. La relación omega-6/omega-3, por sí sola, parece menos útil que asegurar una ingesta suficiente de omega-3 y un patrón dietético global de calidad. </p><p><strong>El debate de los aceites de semilla</strong>. Aquí conviene separar tres capas. Primera: el consenso principal, apoyado por OMS, ensayos de sustitución y revisiones recientes, es que los aceites vegetales ricos en insaturadas son preferibles a mantequilla, grasas animales o grasas trans cuando sustituyen saturadas en un patrón razonable. Segunda: existe una postura crítica que argumenta que el ácido linoleico, la oxidación o el refinado podrían ser dañinos; pero gran parte de esa literatura reciente es narrativa, mecanicista o procede de autores con conflictos o agendas ideológicas, y pesa menos que la evidencia de ECA y cohortes grandes. Tercera: mucha gente asocia “aceites de semilla” con ultraprocesados, y ahí el problema suele ser el paquete completo del alimento, no el aceite aislado. </p><p><strong>Colesterol dietético</strong>. La evidencia actual es más ambigua que con las saturadas. La AHA resume que los estudios no apoyan de forma consistente una asociación independiente entre colesterol dietético y riesgo cardiovascular y que, en la práctica, los alimentos ricos en colesterol suelen venir acompañados de saturadas y sodio. A la vez, algunos metaanálisis observacionales recientes sí encuentran asociaciones con mortalidad, aunque pequeñas y heterogéneas. La lectura más prudente es esta: hoy el foco principal está en el patrón alimentario y en las saturadas/trans, no en contar miligramos de colesterol de forma aislada; aun así, un consumo muy alto sostenido de alimentos hipercolesterolémicos dentro de una dieta pobre no parece buena idea. </p><ul><li><strong>Consenso fuerte</strong>: sustituir saturadas por grasas insaturadas, especialmente poliinsaturadas, mejora LDL y reduce riesgo cardiovascular. </li><li><strong>Consenso moderado</strong>: omega-3 aporta beneficios modestos y contextuales; el omega-6 no muestra el patrón inflamatorio crónico que se le atribuye en redes. </li><li><strong>Controversia real pero sobredimensionada</strong>: los “aceites de semilla” generan mucho ruido online, pero el peso de la evidencia humana no apoya que sean tóxicos por sí mismos. </li></ul>`,
     nota:'En cocina real, la prioridad no es encontrar una grasa “perfecta”, sino desplazar grasas trans y exceso de saturadas, y reducir ultraprocesados. Entre aceites vegetales, el contexto culinario y el patrón total importan más que demonizar una semilla concreta.',
     verAlso:['proteina-necesidades-y-calidad','hidratos-calidad-fibra-y-azucares','controversias-interpretar-la-evidencia'],
     refs:['who-sfa-2023','hooper-2020-saturadas-cochrane','aramburu-2024-saturadas-umbrella','khan-2021-omega3-cv','marklund-2019-omega6-biomarcadores','wang-2023-linoleico-lipidos','carson-2020-colesterol-aha','zhao-2022-colesterol-mortalidad','mofrad-2022-huevos-colesterol-mortalidad','yamada-2025-restriccion-saturadas']},

    {id:'hidratos-calidad-fibra-y-azucares', tema:'metabolismo', nivel:'medio',
     titulo:'Hidratos: importa mucho más la calidad que el porcentaje',
     lead:'La mejor evidencia no apoya demonizar los hidratos en bloque. La OMS recomienda que procedan sobre todo de granos integrales, verduras, frutas y legumbres, y fija en adultos al menos 25 g/día de fibra naturalmente presente en alimentos. La calidad del carbohidrato, no solo la cantidad, es lo que mejor predice resultados de salud.',
     cuerpo:`<p><strong>Fibra</strong>. Es uno de los puntos con evidencia más robusta de toda la nutrición. La OMS recomienda al menos 25 g/día de fibra en adultos, y el gran paquete de revisiones liderado por Reynolds concluyó que los mayores consumos de fibra y de grano integral se asocian con menos mortalidad, enfermedad cardiovascular, diabetes tipo 2 y cáncer colorrectal; además, los ensayos mostraron mejoras en peso, colesterol y control glucémico. El mensaje práctico es claro: subir fibra suele ser una de las palancas con mejor relación beneficio-esfuerzo. </p><p><strong>Integrales frente a refinados</strong>. La OMS recomienda que los hidratos procedan principalmente de integrales, verduras, frutas y legumbres. El motivo no es ideológico: los alimentos integrales aportan fibra, estructura, saciedad y mejor respuesta metabólica global. Reynolds señala que sustituir refinados por integrales mejora la calidad del patrón; más recientemente, otras revisiones observacionales siguen encontrando asociaciones consistentes entre integrales y menor riesgo cardiometabólico. Causalmente, la parte más fuerte de la evidencia está en fibra y factores de riesgo; las asociaciones con enfermedad clínica proceden sobre todo de cohortes. </p><p><strong>Índice glucémico y carga glucémica</strong>. Son herramientas útiles, pero no deben absolutizarse. La propia síntesis de Reynolds concluye que GI y GL pueden ser menos útiles que fibra y contenido de grano integral como medidas globales de “calidad del carbohidrato”. Eso no significa que no sirvan: en diabetes, revisiones de ECA muestran pequeñas mejoras clínicamente relevantes en HbA1c y algunos factores cardiometabólicos con patrones de bajo GI/GL. En población general, sin embargo, la utilidad práctica es más limitada que la de priorizar alimentos mínimamente procesados y ricos en fibra. </p><p><strong>Azúcares libres</strong>. La OMS mantiene una recomendación fuerte de reducirlos por debajo del 10% de la energía total y sugiere que bajar al 5% puede aportar beneficios adicionales, sobre todo para caries y control del aumento de peso. La definición incluye azúcares añadidos y también los presentes en miel, siropes, zumos y concentrados de fruta. Una umbrella review de 2023 asoció consumos altos de azúcar con peores resultados en obesidad, diabetes, hígado graso, gota y enfermedad cardiovascular, con certeza desigual según el desenlace. </p><ul><li><strong>Idea clave</strong>: no todos los hidratos se parecen entre sí. Legumbres, fruta entera, avena, pan 100% integral o patata cocida no se comportan igual que bollería, bebidas azucaradas o cereales muy refinados. </li><li><strong>Para metabolismo</strong>: prioriza fibra, densidad nutricional y grado de procesamiento antes que perseguir un número mágico de porcentaje de carbohidratos. </li><li><strong>Para diabetes</strong>: patrones de menor GI/GL pueden ayudar, pero como complemento dentro de un patrón global bueno, no como sustituto de la calidad total de la dieta. </li></ul>`,
     nota:'Los estudios que relacionan integrales, fibra y GI/GL con enfermedad suelen ser en parte observacionales; por eso conviene evitar mensajes de causalidad absoluta. Aun así, la triangulación con ensayos y con guías OMS hace que la recomendación práctica sea bastante sólida.',
     verAlso:['proteina-necesidades-y-calidad','grasas-calidad-y-controversias','controversias-interpretar-la-evidencia'],
     refs:['who-carbohidratos-2023','who-azucares-2015','reynolds-2019-carb-quality','reynolds-2020-fibra-diabetes','ramezani-2024-fibra-mortalidad','chiavaroli-2021-bajo-gi-diabetes','huang-2023-azucares-umbrella']},

    {id:'controversias-interpretar-la-evidencia', tema:'metabolismo', nivel:'avanzado',
     titulo:'Cómo leer las controversias sin caer en titulares',
     lead:'En nutrición, muchas polémicas sobreviven porque mezclan mecanismos plausibles, estudios observacionales, conflictos de interés y mensajes simplificados. La forma más útil de orientarse es preguntar qué tipo de evidencia respalda el mensaje, con qué comparación se hizo y quién lo financió.',
     cuerpo:`<p><strong>Proteína</strong>. La controversia real no es si la proteína “sirve”, sino cuánto añade por encima de una ingesta ya suficiente y en qué contexto. En fuerza, los beneficios existen pero se aplanan; en personas mayores el valor práctico suele ser mayor; y el “timing” parece menos decisivo que muchos mensajes comerciales sugieren. El sesgo típico aquí es sobredimensionar hallazgos agudos de laboratorio o usar estudios financiados por la industria del suplemento para vender precisión artificial. </p><p><strong>Grasas y aceites de semilla</strong>. La controversia más ruidosa del momento enfrenta una literatura de guías, ECA de sustitución, biomarcadores y cohortes grandes, frente a revisiones narrativas basadas en mecanismos de oxidación o lecturas históricas/ecológicas. La segunda línea puede ser interesante como generación de hipótesis, pero hoy pesa menos para recomendaciones poblacionales. En esta revisión se ha marcado de forma explícita cuándo hay conflictos: por ejemplo, la revisión de 2025 que cuestiona restringir saturadas declara honorarios y acciones en una empresa, y la crítica de 2026 a los aceites de semilla es una síntesis narrativa de bajo escalón en la jerarquía. </p><p><strong>Hidratos</strong>. Aquí el sesgo típico es meter en la misma bolsa a todos los carbohidratos. La evidencia fuerte protege alimentos ricos en fibra y poco procesados, pero el debate público suele girar alrededor de azúcar, pan blanco y ultraprocesados, y después extiende esa crítica a fruta, legumbres o cereales integrales. La pregunta no es “hidratos sí o no”, sino qué alimentos concretos, en qué grado de procesamiento y con qué efecto sobre saciedad, calidad nutricional y control glucémico. </p><ul><li><strong>Regla 1</strong>: prioriza revisiones sistemáticas, metaanálisis y guías públicas. </li><li><strong>Regla 2</strong>: mira siempre la comparación. Reemplazar saturadas por poliinsaturadas no es igual que reemplazarlas por harina refinada; bajar GI no es lo mismo que subir fibra; subir proteína con fuerza no es lo mismo que subirla sin entrenamiento. </li><li><strong>Regla 3</strong>: pide financiación y conflictos de interés. No invalidan automáticamente un estudio, pero sí cambian el peso que le das. </li></ul>`,
     nota:'Cuando dos estudios parecen contradecirse, muchas veces no hablan de lo mismo: cambian el nutriente de comparación, el desenlace, la población o la calidad de la intervención. En nutrición, el contexto casi nunca es un detalle pequeño.',
     verAlso:['proteina-necesidades-y-calidad','grasas-calidad-y-controversias','hidratos-calidad-fibra-y-azucares'],
     refs:['who-carbohidratos-2023','who-sfa-2023','reynolds-2019-carb-quality','wirth-2020-timing-proteina','yamada-2025-restriccion-saturadas']},

    /* -- N3 - Energia, metabolismo y composicion corporal -- */
    {id:'energia-total-y-sus-componentes', tema:'energia', nivel:'medio',
     titulo:'Qué es el gasto energético total y por qué no depende solo del gimnasio',
     lead:'El gasto energético total diario no es una sola cifra “mágica”: combina el gasto en reposo, la actividad física planificada y no planificada, y el efecto térmico de los alimentos. En la mayoría de personas, el gasto en reposo es la parte más grande y la actividad es la parte más variable.',
     cuerpo:`<p><strong>Certeza global:</strong> alta para la estructura general del TDEE; moderada para cuantificar cuánto aporta cada componente en una persona concreta fuera del laboratorio. </p><p>La forma más útil de entender el metabolismo diario es como una suma de piezas que interactúan. En investigación suele hablarse de TEE o TDEE. El informe 2023 de las National Academies resume que el gasto en reposo suele aportar alrededor del 60–70% del gasto diario, el efecto térmico de los alimentos ronda de forma aproximada el 10%, y el resto depende sobre todo de la actividad física, incluida la actividad no planificada del día a día. </p><ul><li><strong>Gasto en reposo:</strong> es la energía necesaria para mantener funciones vitales en reposo. RMR/REE y BMR no son idénticos, aunque en divulgación muchas veces se usan casi como sinónimos; RMR suele ser algo mayor que BMR. </li><li><strong>Actividad física:</strong> incluye tanto el ejercicio estructurado como la actividad cotidiana. Aquí entra el <strong>NEAT</strong> o gasto por movimientos no deportivos: caminar por casa, subir escaleras, estar de pie, gesticular o moverse más durante el trabajo. Es la parte más variable entre personas. </li><li><strong>Efecto térmico de los alimentos:</strong> es el gasto asociado a digerir, absorber, metabolizar y almacenar nutrientes. Suele representar una fracción menor del total, pero no es irrelevante. </li></ul><p>Matiz importante: el organismo no siempre responde de manera “aditiva”. En la vida real, aumentar ejercicio o reducir ingesta puede provocar compensaciones en otras piezas del sistema, de modo que el cambio final en el gasto total o en el peso no siempre coincide con la cuenta teórica simple. </p>`,
     nota:'Material informativo para la app. Sirve para entender el concepto, pero no sustituye una valoración individual por un profesional sanitario o dietista-nutricionista.',
     verAlso:['metabolismo-en-reposo-y-composicion-corporal','adaptaciones-al-deficit-y-recuperacion-de-peso','formulas-de-estimacion-y-fiabilidad'],
     refs:['nasem-dri-energy-2023','health-council-energy-2022','fernandez-verdejo-2024-energy-expenditure']},

    {id:'metabolismo-en-reposo-y-composicion-corporal', tema:'metabolismo', nivel:'avanzado',
     titulo:'Por qué el metabolismo en reposo no crece en línea recta con el peso',
     lead:'Dos personas con el mismo peso pueden tener gastos en reposo distintos. La clave no es solo cuánto pesan, sino qué tejidos componen ese peso: algunos órganos pequeños gastan mucha más energía por kilo que el tejido adiposo y que gran parte del músculo esquelético.',
     cuerpo:`<p><strong>Certeza global:</strong> alta en el principio fisiológico; moderada-alta en la magnitud exacta en individuos concretos. </p><p>El gasto en reposo depende mucho de la <strong>masa libre de grasa</strong>, pero no toda la masa libre de grasa “cuesta” lo mismo. Los órganos de alta actividad metabólica —como cerebro, hígado, corazón y riñones— consumen mucha energía por kilo de tejido, muy por encima de la media corporal. Por eso el metabolismo en reposo no escala de forma proporcional con el peso total. </p><ul><li><strong>Órganos pequeños, impacto grande:</strong> una revisión clínica reciente resume que estos órganos pueden tener tasas metabólicas por kilo aproximadamente 10–20 veces superiores a la media del cuerpo, y explicar gran parte del gasto en reposo del adulto pese a representar una fracción modesta del peso total. </li><li><strong>Músculo sí importa, pero con matices:</strong> ganar o perder músculo influye en el gasto en reposo, pero el efecto por kilo es bastante menor que el de los órganos de alta tasa metabólica. Por eso el mensaje de “más músculo = metabolismo disparado” suele exagerarse en divulgación. </li><li><strong>Edad y composición:</strong> algunos cambios del gasto con la edad se explican, en parte, por cambios en la proporción y actividad metabólica de órganos y tejidos, no solo por “envejecer” sin más. </li></ul><p>Un estudio clásico todavía muy útil mostró que la variación en la masa de órganos de alta tasa metabólica explica una parte importante de las diferencias de REE entre adultos, incluso después de considerar edad, sexo o masa libre de grasa total. Es una referencia fundacional y sigue siendo la mejor explicación mecanística disponible para este punto. </p>`,
     nota:'Cuando la app hable de “metabolismo”, conviene evitar frases simplistas como “tu metabolismo es lento porque pesas poco” o “aceléralo con músculo”. El contexto de composición corporal importa mucho.',
     verAlso:['energia-total-y-sus-componentes','peso-frente-a-composicion-corporal','formulas-de-estimacion-y-fiabilidad'],
     refs:['fernandez-verdejo-2024-energy-expenditure','gitsi-2024-rmr-body-composition','javed-2010-organ-mass-ree']},

    {id:'efecto-termico-de-los-alimentos-y-procesado', tema:'metabolismo', nivel:'medio',
     titulo:'El efecto térmico de la comida existe, pero no convierte un alimento en milagro o veneno',
     lead:'Comer también gasta energía. Ese gasto suele ser pequeño frente al total diario, y varía según la composición y el contexto de la comida. La idea de que “el procesado por sí solo hunde o dispara el metabolismo” todavía tiene evidencia limitada y bastante heterogénea.',
     cuerpo:`<p><strong>Certeza global:</strong> alta para aceptar que el efecto térmico existe y suele rondar ~10% del gasto diario; baja-moderada para afirmar cuánto cambia solo por el grado de procesado en la vida real. </p><p>La revisión de 2024 sobre termogénesis inducida por la dieta resume que DIT/TEF es un componente potencialmente modificable, pero la literatura sigue siendo muy heterogénea: tamaños muestrales pequeños, metodologías distintas y resultados a veces contradictorios. También influyen la composición de la comida, el momento del día, el sueño y características individuales como obesidad o diabetes. </p><ul><li><strong>Lo más sólido:</strong> TEF importa, pero normalmente explica una parte modesta del gasto total. Cambiar una sola comida rara vez transformará el balance energético por sí mismo. </li><li><strong>Procesado y TEF agudo:</strong> pequeños ensayos cruzados en mujeres jóvenes encontraron respuestas termogénicas postprandiales distintas entre algunas comidas de alimentos enteros, procesados, sin gluten o sustitutivos de comida; son resultados útiles para generar hipótesis, pero tienen muestras pequeñas y poca generalización. </li><li><strong>Procesado y peso corporal:</strong> el mejor ensayo controlado de ingesta ad libitum encontró que una dieta ultraprocesada aumentó la ingesta energética y el peso corporal frente a una dieta no procesada, aun con menús emparejados en varios nutrientes presentados. Eso sugiere que mecanismos como textura, velocidad de ingesta, recompensa o facilidad para comer podrían importar tanto o más que el TEF por sí solo. </li></ul><p>Mensaje práctico para la app: el efecto térmico es real, pero no conviene venderlo como “truco metabólico”. La evidencia apoya más centrarse en el patrón dietético global y la facilidad para regular la ingesta que en perseguir alimentos “quema-calorías”. </p>`,
     nota:'Este tema es especialmente sensible a simplificaciones. Conviene hablar de tendencia media y de incertidumbre, no de reglas rígidas.',
     verAlso:['energia-total-y-sus-componentes','adaptaciones-al-deficit-y-recuperacion-de-peso'],
     refs:['tzeravini-2024-dit-review','mohr-2020-whole-food-meal-replacement-tef','dioneda-2020-gluten-free-whole-processed-tef','upf-weight-gain']},

    {id:'adaptaciones-al-deficit-y-recuperacion-de-peso', tema:'energia', nivel:'avanzado',
     titulo:'Qué pasa cuando comes menos durante un tiempo y por qué recuperar peso es tan frecuente',
     lead:'Al perder peso, el cuerpo suele gastar menos energía. Parte de esa caída es lógica porque hay menos masa que mantener; otra parte puede deberse a adaptaciones metabólicas y conductuales. Aun así, la magnitud de esa adaptación no siempre es tan grande ni tan permanente como se populariza.',
     cuerpo:`<p><strong>Certeza global:</strong> moderada para la existencia de adaptación metabólica tras pérdida de peso; baja-moderada para atribuirle por sí sola la mayor parte del estancamiento o de la recuperación de peso a largo plazo. </p><p>La revisión sistemática de Nunes y colaboradores incluyó 33 estudios y encontró adaptación termogénica en 27, pero con una conclusión clave: en los estudios mejor diseñados la magnitud tendía a ser menor o no significativa, y parecía atenuarse tras fases de estabilización del peso o balance energético neutro. Es decir, la adaptación existe, pero no siempre es enorme ni indefinida. </p><p>Además, la reducción del metabolismo en reposo tras adelgazar no se explica solo por “metabolismo dañado”. Un estudio mecanístico de 2022 mostró que <strong>las pérdidas de tejido</strong> y <strong>las adaptaciones metabólicas</strong> contribuyen ambas al descenso del RMR; reducir la explicación a una única causa simplifica demasiado el problema. </p><ul><li><strong>Adaptación fisiológica:</strong> puede bajar el gasto en reposo, cambiar la eficiencia del movimiento y coexistir con más hambre o más atención hacia la comida. </li><li><strong>Adaptación conductual:</strong> en la vida real también cuenta comer un poco más sin notarlo, moverse menos o sostener peor la adherencia con el paso del tiempo. El peso recuperado rara vez se explica por una sola variable. </li><li><strong>Modelos de regulación:</strong> la revisión de Speakman y Hall describe varios modelos —set point, settling point, dual intervention point, entre otros— y concluye que el peso corporal parece regulado por múltiples bucles biológicos y ambientales. La evidencia no obliga a aceptar un “set point” único y fijo para todas las personas. </li></ul><p>Por tanto, decir “si recuperas peso es por falta de voluntad” es científicamente pobre; pero decir “todo es culpa del set point y no se puede hacer nada” también lo es. La mejor lectura de la evidencia es que el mantenimiento del peso perdido es difícil porque confluyen biología, ambiente alimentario, actividad, sueño, estrés y adherencia. </p>`,
     nota:'Para educación sanitaria, conviene presentar la recuperación de peso como un fenómeno frecuente y multifactorial, no como un “fracaso moral”.',
     verAlso:['energia-total-y-sus-componentes','peso-frente-a-composicion-corporal','formulas-de-estimacion-y-fiabilidad'],
     refs:['nunes-2022-adaptive-thermogenesis','martin-2022-tissue-losses-rmr','speakman-hall-2023-models-body-weight','flanagan-2023-weight-loss-maintenance']},

    {id:'peso-frente-a-composicion-corporal', tema:'energia', nivel:'medio',
     titulo:'Bajar peso no es exactamente lo mismo que mejorar la composición corporal',
     lead:'La báscula resume el cambio de masa total, pero no dice cuánto de ese cambio es grasa, músculo, agua u otros tejidos. En salud y rendimiento suele importar mucho la “calidad” de la pérdida de peso: perder más grasa y preservar más masa magra.',
     cuerpo:`<p><strong>Certeza global:</strong> moderada-alta para el papel del ejercicio —sobre todo fuerza— en preservar masa magra; moderada para el beneficio adicional de elevar proteína durante pérdida de peso. </p><p>La evidencia de síntesis muestra que el ejercicio ayuda a mejorar la composición corporal incluso cuando el cambio de peso total es modesto. El overview de Bellicha y colaboradores resumió 12 revisiones sistemáticas y 149 estudios: el ejercicio produjo pérdidas significativas de peso, grasa total y grasa visceral, y el entrenamiento de fuerza redujo la pérdida de masa magra durante el adelgazamiento en torno a 0,8 kg frente a comparadores. </p><ul><li><strong>Ejercicio aeróbico:</strong> aporta gasto energético y mejora salud cardiometabólica, pero por sí solo no siempre maximiza la preservación de masa magra. </li><li><strong>Entrenamiento de fuerza:</strong> es la herramienta con mejor apoyo para amortiguar la pérdida de masa libre de grasa durante el déficit calórico. </li><li><strong>Proteína dietética:</strong> el metaanálisis de 2024 encontró que aumentar la ingesta proteica ayudó a prevenir la pérdida de masa muscular durante la pérdida de peso (SMD 0,75), pero no mostró una preservación igual de clara para fuerza o función física. </li><li><strong>Combinación dieta + ejercicio:</strong> las comparaciones de intervenciones sugieren que, para composición corporal, combinar restricción energética con ejercicio suele superar a la dieta sola, especialmente cuando el objetivo incluye preservar tejido magro. </li></ul><p>En lenguaje de app, “peso” es una señal útil, pero incompleta. Una persona puede bajar poco en la báscula y aun así mejorar mucho su proporción de grasa, cintura, condición física o fuerza; y otra puede bajar rápido perdiendo demasiada masa magra si el enfoque es muy agresivo o poco estructurado. </p>`,
     nota:'Informar sobre composición corporal reduce lecturas erróneas de la báscula y ayuda a plantear objetivos más realistas y saludables.',
     verAlso:['metabolismo-en-reposo-y-composicion-corporal','adaptaciones-al-deficit-y-recuperacion-de-peso','formulas-de-estimacion-y-fiabilidad'],
     refs:['bellicha-2021-exercise-training-overview','lopez-2022-resistance-training-obesity','kokura-2024-proteina-perdida-peso','xie-2024-exercise-diet-body-composition']},

    {id:'formulas-de-estimacion-y-fiabilidad', tema:'metabolismo', nivel:'medio',
     titulo:'Las fórmulas de calorías son útiles como punto de partida, no como verdad exacta',
     lead:'Las ecuaciones para estimar gasto en reposo o necesidades energéticas ayudan a orientarse, pero fallan bastante a nivel individual. Edad, sexo, adiposidad, masa libre de grasa y el PAL estimado pueden introducir errores relevantes.',
     cuerpo:`<p><strong>Certeza global:</strong> alta para afirmar que la medición directa es superior; moderada-alta para afirmar que las ecuaciones tienen utilidad clínica limitada a una primera aproximación. </p><p>Las National Academies señalan que el estándar de referencia para el gasto energético total en vida libre es el agua doblemente marcada, y el mejor método práctico para medir el gasto en reposo es la calorimetría indirecta. Las ecuaciones (Harris-Benedict, Mifflin-St Jeor, WHO/FAO/UNU, Henry, etc.) se usan porque son accesibles, pero su precisión varía con edad, sexo, IMC y otros factores. </p><p>El Health Council of the Netherlands es muy claro: los requerimientos medios sirven para grupos, pero <strong>no son adecuados para individuos</strong> sin supervisión y seguimiento. Recomienda interpretar cualquier cálculo individual con cautela, monitorear el peso y, cuando sea posible, medir el gasto en reposo directamente. </p><ul><li><strong>En sobrepeso u obesidad en general:</strong> la revisión con metaanálisis de Macena y colaboradores concluyó que la ecuación “menos mala” depende de la población y del resultado analizado; no existe una fórmula universal y exacta para todos los adultos con exceso de peso. </li><li><strong>En obesidad severa:</strong> la revisión de 2024 encontró que WHO y Harris-Benedict fueron las más precisas globalmente, pero subrayó que la mayoría de estudios incluidos tenían alto riesgo de sesgo. Esto impide vender una ecuación como solución definitiva. </li><li><strong>Comprobación en clínica:</strong> el estudio de Van Dessel comparó ecuaciones con calorimetría indirecta en personas con sobrepeso u obesidad y confirmó que la exactitud individual es limitada. </li></ul><p>En la práctica, la mejor forma de usar una fórmula es como <strong>estimación inicial</strong>. Después hay que ajustar con la evolución real del peso, la composición corporal, el hambre, la adherencia y el nivel real de actividad. Si la decisión clínica es importante, medir vale más que adivinar. </p>`,
     nota:'Para la app, conviene presentar los cálculos como “rango orientativo” y no como una prescripción exacta de calorías.',
     verAlso:['energia-total-y-sus-componentes','metabolismo-en-reposo-y-composicion-corporal','adaptaciones-al-deficit-y-recuperacion-de-peso'],
     refs:['nasem-dri-energy-2023','health-council-energy-2022','macena-2022-predictive-equations-obesity','campos-2024-bmr-equations-severe-obesity','van-dessel-2024-bmr-equations-accuracy']},

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
      return r?`<button class="teo-link ref" data-ref="${rid}">📚 ${esc(r.autores.split(',')[0])}${r.year?(' · '+r.year):''}</button>`:'';
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
    const inArticle = _view==='article' && art(_articleId);
    _root.innerHTML = inArticle ? articleHtml(art(_articleId)) : indexHtml();
    const sc=_root.closest('.app-page-scroll'); if(sc) sc.scrollTop=0;
    // Botón en la cabecera para volver SIEMPRE al índice mientras lees un artículo.
    if(typeof AppPage!=='undefined'){
      if(inArticle) AppPage.setHeaderAction('← Índice', goIndex);
      else AppPage.clearHeaderAction();
    }
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
