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
     refs:['lesser-funding-2007','bes-rastrollo-ssb-2013']}
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
