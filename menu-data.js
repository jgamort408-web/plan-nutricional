/* ══════════════════════════════════════════════════════════
   MENU DATA · platos extraídos del plan nutricional
   diet tags: sg=sin gluten · sl=sin lactosa · vg=vegano
              vt=vegetariano · ps=pescado/marisco · cn=carne · lg=legumbre
   food tags (para guía semanal):
     leg=legumbre · cb=carne blanca · cr=carne roja
     pb=pescado blanco · pa=pescado azul
     apq=arroz/pasta/quinoa · hv=huevo · pv=proteína vegetal
     qs=queso · js=jamón · lac=lácteo · fs=frutos secos
     v=verdura · fr=fruta · pic=picnic · lb=libre
══════════════════════════════════════════════════════════ */
const DISHES = {
/* ── DESAYUNOS ────────────────────────────────────────── */
D1:{cat:'des',short:'Huevos revueltos',nom:'Huevos revueltos con tostada integral',icon:'🍳',t:'10 min',eq:'Sartén antiadherente',tags:[],tipo:null,diet:['vt'],
  desc:'Huevos cremosos a fuego bajo sobre tostada integral. Tomate aliñado y fruta de temporada. Un clásico contundente para empezar el día.',
  kcal:[535,340],mac:{p:[43,27],f:[22,13],c:[50,32]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Huevos enteros',A:'3 uds (180g)',B:'2 uds (120g)'},{n:'AOVE',A:'10g',B:'7g'},{n:'Tomate en rodajas',A:'150g',B:'100g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Huevos revueltos a fuego bajo removiendo constantemente. Pan tostado en sandwichera. Tomate aliñado con sal.'},
D2:{cat:'des',short:'Queso fresco + jamón',nom:'Tostada con queso fresco y jamón serrano',icon:'🧀',t:'5 min',eq:'Tostadora · Sandwichera',tags:[],tipo:null,diet:['cn'],
  desc:'Tostada untable con queso fresco generoso, jamón serrano y tomate. Perfecto cuando hay prisa.',
  kcal:[510,325],mac:{p:[40,25],f:[18,11],c:[52,33]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Queso fresco',A:'80g',B:'50g'},{n:'Jamón serrano',A:'50g',B:'35g'},{n:'Tomate en rodajas',A:'150g',B:'100g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Tostar pan. Extender queso fresco generosamente. Colocar jamón y tomate encima.'},
D3:{cat:'des',short:'Salmón + aguacate',nom:'Tostada con salmón ahumado, aguacate y huevo cocido',icon:'🐠',t:'10 min',eq:'Tostadora',tags:[],tipo:null,diet:['ps'],
  desc:'Aguacate machacado con limón, salmón ahumado en lonchas y huevo cocido laminado. Brunch en versión exprés.',
  kcal:[545,345],mac:{p:[44,28],f:[26,16],c:[44,28]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Salmón ahumado',A:'60g',B:'40g'},{n:'Huevo cocido',A:'2 uds (100g)',B:'1 ud (50g)'},{n:'Aguacate',A:'50g',B:'30g'},{n:'Tomate',A:'100g',B:'80g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Hervir huevo 10 min. Machacar aguacate con limón y sal. Tostar pan, extender aguacate, cubrir con salmón y huevo laminado.'},
D4:{cat:'des',short:'Jamón + AOVE',nom:'Tostada con jamón serrano y AOVE al tomate',icon:'🥓',t:'5 min',eq:'Tostadora',tags:[],tipo:null,diet:['sl','cn'],
  desc:'El desayuno andaluz por antonomasia: pan tostado frotado con tomate, AOVE y jamón serrano de calidad.',
  kcal:[505,320],mac:{p:[38,24],f:[20,12],c:[52,33]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Jamón serrano',A:'60g',B:'40g'},{n:'AOVE',A:'10g',B:'7g'},{n:'Tomate frotado + sal',A:'150g',B:'100g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Pan tostado, frotar tomate maduro, aliñar con AOVE y sal. Cubrir con jamón serrano en lonchas.'},
D5:{cat:'des',short:'Queso curado',nom:'Tostada con queso curado y tomate',icon:'🧀',t:'5 min',eq:'Tostadora',tags:[],tipo:null,diet:['vt'],
  desc:'Láminas finas de queso curado, tomate maduro y pimienta negra recién molida. Sabor concentrado y simple.',
  kcal:[530,338],mac:{p:[36,23],f:[22,14],c:[52,33]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Queso curado (láminas)',A:'40g',B:'25g'},{n:'AOVE',A:'8g',B:'5g'},{n:'Tomate',A:'150g',B:'100g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Pan tostado. Queso curado en láminas finas, tomate en rodajas, hilo de AOVE y pimienta negra.'},
D6:{cat:'des',short:'Avena overnight',nom:'Avena overnight con proteína y frutos rojos',icon:'🥣',t:'5 min + noche',eq:'Frigorífico',tags:[],tipo:null,diet:['vt'],
  desc:'Prepara la noche anterior y desayuna en 30 segundos. Avena cremosa, proteína, yogur y frutos rojos frescos.',
  kcal:[520,330],mac:{p:[45,28],f:[14,9],c:[62,40]},
  ing:[{n:'Avena en copos',A:'60g',B:'40g'},{n:'Proteína whey',A:'30g',B:'20g'},{n:'Yogur natural',A:'150g',B:'100g'},{n:'Bebida de avena',A:'100ml',B:'70ml'},{n:'Frutos rojos (F1)',A:'150g',B:'100g'},{n:'Fruta (F2) — elección',A:'150g',B:'150g'}],
  nota:'La noche anterior: mezclar avena + proteína + yogur + bebida de avena. Refrigerar. Por la mañana añadir frutos rojos frescos.'},
D7:{cat:'des',short:'Cottage + sardinas',nom:'Tostada con queso cottage, sardinas y huevo cocido',icon:'🐟',t:'10 min',eq:'Tostadora',tags:[],tipo:null,diet:['ps'],
  desc:'Una tostada nórdica-mediterránea: cottage cremoso, sardinas en aceite escurridas y huevo. Omega-3 a tope.',
  kcal:[525,333],mac:{p:[46,29],f:[20,12],c:[45,29]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Queso cottage',A:'100g',B:'70g'},{n:'Sardinas en lata (escurridas)',A:'80g',B:'55g'},{n:'Huevo cocido',A:'1 ud (50g)',B:'1 ud (50g)'},{n:'Tomate',A:'100g',B:'80g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Tostar pan, extender cottage, colocar sardinas escurridas y huevo cocido laminado. Añadir tomate y AOVE.'},
D8:{cat:'des',short:'Tortilla + queso',nom:'Tortilla francesa con queso curado y tostada',icon:'🍳',t:'10 min',eq:'Sartén antiadherente',tags:[],tipo:null,diet:['vt'],
  desc:'Tortilla francesa con queso curado rallado fundido en el interior. Tostada y tomate al lado.',
  kcal:[528,336],mac:{p:[40,25],f:[24,15],c:[48,31]},
  ing:[{n:'Pan integral',A:'80g',B:'50g'},{n:'Huevos',A:'3 uds (180g)',B:'2 uds (120g)'},{n:'Queso curado rallado',A:'30g',B:'20g'},{n:'AOVE',A:'8g',B:'5g'},{n:'Tomate',A:'150g',B:'100g'},{n:'Fruta (F1) — elección',A:'150g',B:'150g'}],
  nota:'Batir huevos con queso rallado y pimienta. Cuajar en sartén antiadherente a fuego medio. Servir con tostada y tomate.'},

/* ── COMIDAS ──────────────────────────────────────────── */
C1:{cat:'com',short:'Merluza papillote',nom:'Merluza al papillote con verduras y gazpacho',icon:'🐟',t:'20 min',eq:'Horno 180°C · Lekué microondas',tags:['bl'],tipo:'completa',diet:['sg','sl','ps'],
  desc:'Pescado blanco al vapor en su jugo con calabacín, brócoli y pimiento. Acompañado de patata y gazpacho frío.',
  kcal:[740,470],mac:{p:[70,44],f:[22,14],c:[64,41]},
  ing:[{n:'Merluza filetes',A:'300g cr.→255g',B:'200g cr.→170g'},{n:'Patata',A:'180g cr.→144g',B:'110g cr.→88g'},{n:'Calabacín (V1)',A:'150g',B:'150g'},{n:'Brócoli (V2)',A:'150g',B:'150g'},{n:'Pimiento rojo (V3)',A:'100g',B:'80g'},{n:'AOVE',A:'15g',B:'10g'},{n:'Limón + perejil + sal',A:'c.s.',B:'c.s.'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Horno 180°C / 20 min envuelto en papel. Lekué microondas 12 min. Patata precocida 5 min. Gazpacho frío al servir.'},
C2:{cat:'com',short:'Lentejas + pollo',nom:'Lentejas estofadas con pollo a la plancha y salmorejo',icon:'🌱',t:'35 min',eq:'Olla + vitrocerámica',tags:['leg'],tipo:'completa',diet:['sg','sl','cn','lg'],
  desc:'Lentejas pardinas guisadas con sofrito tradicional y pechuga de pollo a la plancha. Salmorejo cordobés de acompañamiento.',
  kcal:[745,472],mac:{p:[73,46],f:[20,13],c:[66,42]},
  ing:[{n:'Lentejas pardinas',A:'90g cr.→225g',B:'60g cr.→150g'},{n:'Pechuga de pollo',A:'150g cr.→120g',B:'100g cr.→80g'},{n:'Zanahoria (V1)',A:'100g',B:'80g'},{n:'Cebolla',A:'80g',B:'60g'},{n:'Pimiento rojo (V2)',A:'100g',B:'80g'},{n:'Tomate triturado + espinacas (V3)',A:'100g + 80g',B:'80g + 60g'},{n:'AOVE + pimentón + laurel + ajo',A:'15g · c.s.',B:'10g · c.s.'},{n:'Salmorejo (frío al servir)',A:'200ml',B:'150ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Lentejas pardinas sin remojo. Sofrito 5 min, añadir lentejas + caldo, 30 min. Pollo plancha aparte 4 min/lado.'},
C3:{cat:'com',short:'Salmón + quinoa',nom:'Salmón a la plancha con quinoa y espárragos',icon:'🐠',t:'20 min',eq:'Vitrocerámica',tags:['az'],tipo:'completa',diet:['sg','sl','ps'],
  desc:'Salmón salvaje a la plancha sobre cama de quinoa esponjosa con espárragos trigueros y cebolla morada.',
  kcal:[755,478],mac:{p:[68,43],f:[28,18],c:[60,38]},
  ing:[{n:'Salmón filetes',A:'250g cr.→213g',B:'165g cr.→140g'},{n:'Quinoa cruda',A:'60g cr.→180g',B:'40g cr.→120g'},{n:'Espárragos verdes (V1)',A:'200g',B:'150g'},{n:'Calabacín plancha (V2)',A:'150g',B:'150g'},{n:'Cebolla morada (V3)',A:'80g',B:'60g'},{n:'AOVE',A:'15g',B:'10g'},{n:'Salmorejo (frío al servir)',A:'200ml',B:'150ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Salmón vitrocerámica 4 min/lado fuego medio-alto. Quinoa hervida 15 min (×3 en volumen). Espárragos plancha 5 min.'},
C4:{cat:'com',short:'Garbanzos + atún',nom:'Ensalada templada de garbanzos con atún y gazpacho',icon:'🌱',t:'15 min',eq:'Sartén',tags:['leg'],tipo:'completa',diet:['sg','sl','ps','lg'],
  desc:'Garbanzos tibios, atún al natural, pimientos asados, espinacas y pepino. Cierra con gazpacho.',
  kcal:[720,456],mac:{p:[70,44],f:[22,14],c:[58,37]},
  ing:[{n:'Garbanzos (bote escurrido)',A:'100g cr.→250g',B:'65g cr.→163g'},{n:'Atún al natural (escurrido)',A:'120g',B:'80g'},{n:'Pimiento asado (V1)',A:'150g',B:'120g'},{n:'Espinacas baby (V2)',A:'100g',B:'80g'},{n:'Pepino + cebolla morada (V3)',A:'80g + 50g',B:'60g + 40g'},{n:'AOVE + limón + comino',A:'15g · c.s.',B:'10g · c.s.'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Garbanzos de bote (lavados). Calentar 2 min en sartén. Montar ensalada fría. Pimientos asados: horno previo o bote.'},
C5:{cat:'com',short:'Bacalao + pisto',nom:'Bacalao con pisto de verduras y salmorejo',icon:'🐟',t:'30 min',eq:'Vitrocerámica · Freidora aire',tags:['bl'],tipo:'completa',diet:['sg','sl','ps'],
  desc:'Bacalao confitado sobre pisto manchego de calabacín, berenjena y pimiento. Salmorejo de cierre.',
  kcal:[730,463],mac:{p:[72,46],f:[22,14],c:[58,37]},
  ing:[{n:'Bacalao desalado / fresco',A:'280g cr.→238g',B:'185g cr.→157g'},{n:'Calabacín (V1)',A:'150g',B:'120g'},{n:'Berenjena (V2)',A:'150g',B:'120g'},{n:'Pimiento rojo + cebolla (V3)',A:'100g + 60g',B:'80g + 50g'},{n:'Tomate triturado + ajo',A:'150g · 1d.',B:'100g · 1d.'},{n:'AOVE + pimentón',A:'15g · c.s.',B:'10g · c.s.'},{n:'Salmorejo (frío al servir)',A:'200ml',B:'150ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Pisto sartén 20 min. Bacalao encima tapado 8 min. Alternativa: freidora de aire 200°C/10 min + pisto aparte.'},
C6:{cat:'com',short:'Fabada ligera',nom:'Fabada ligera con lomo magro y gazpacho',icon:'🌱',t:'35 min',eq:'Olla',tags:['leg'],tipo:'completa',diet:['sg','sl','cn','lg'],
  desc:'Versión ligera de la fabada asturiana, con lomo magro de cerdo en lugar de embutidos grasos.',
  kcal:[750,475],mac:{p:[70,44],f:[22,14],c:[68,43]},
  ing:[{n:'Alubias blancas',A:'100g cr.→250g',B:'65g cr.→163g'},{n:'Lomo magro de cerdo',A:'150g cr.→120g',B:'100g cr.→80g'},{n:'Cebolla (V1)',A:'80g',B:'60g'},{n:'Pimiento verde (V2)',A:'100g',B:'80g'},{n:'Zanahoria (V3)',A:'80g',B:'60g'},{n:'Tomate triturado',A:'100g',B:'80g'},{n:'AOVE + pimentón + laurel + ajo',A:'15g · c.s.',B:'10g · c.s.'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Alubias de bote escurridas reduce a 20 min. Lomo en dados, sofreír, añadir verduras, luego alubias + caldo.'},
C7:{cat:'com',short:'Potaje bacalao',nom:'Potaje de alubias blancas con bacalao y gazpacho',icon:'🐟',t:'35 min',eq:'Olla',tags:['leg','bl'],tipo:'completa',diet:['sg','sl','ps','lg'],
  desc:'Potaje cuaresmero: alubias blancas guisadas con espinacas y bacalao desalado. Plato único de fondo.',
  kcal:[740,469],mac:{p:[72,45],f:[20,13],c:[64,41]},
  ing:[{n:'Alubias blancas',A:'100g cr.→250g',B:'65g cr.→163g'},{n:'Bacalao desalado',A:'200g cr.→170g',B:'130g cr.→110g'},{n:'Espinacas (V1)',A:'150g',B:'120g'},{n:'Cebolla (V2)',A:'80g',B:'60g'},{n:'Pimiento verde + tomate (V3)',A:'80g + 100g',B:'60g + 80g'},{n:'AOVE + ajo + pimentón',A:'15g · c.s.',B:'10g · c.s.'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Alubias cocidas + sofrito 20 min. Añadir bacalao los últimos 8 min. No sobrecocinar el bacalao.'},
C8:{cat:'com',short:'Lentejas al curry',nom:'Lentejas rojas al curry con pavo y verduras',icon:'🌱',t:'30 min',eq:'Olla',tags:['leg'],tipo:'completa',diet:['sg','sl','cn','lg'],
  desc:'Inspiración indo-mediterránea: lentejas rojas cremosas con pasta de curry suave, leche de coco light y pavo plancha.',
  kcal:[738,467],mac:{p:[72,45],f:[21,13],c:[64,41]},
  ing:[{n:'Lentejas rojas (sin remojo)',A:'90g cr.→225g',B:'60g cr.→150g'},{n:'Pechuga pavo',A:'150g cr.→120g',B:'100g cr.→80g'},{n:'Calabacín (V1)',A:'150g',B:'120g'},{n:'Cebolla (V2)',A:'100g',B:'80g'},{n:'Pimiento rojo (V3)',A:'100g',B:'80g'},{n:'Pasta de curry + leche de coco light',A:'1 cda · 50ml',B:'1 cda · 40ml'},{n:'AOVE',A:'12g',B:'8g'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Lentejas rojas: 15-20 min hervidas sin remojo. Pavo plancha aparte. Curry suave con leche de coco light.'},
C9:{cat:'com',short:'Ternera guisada',nom:'Ternera magra guisada con verduras y gazpacho',icon:'🥩',t:'50 min',eq:'Vitrocerámica · Olla exprés',tags:['roja'],tipo:'completa',diet:['sg','sl','cn'],
  desc:'Ternera magra guisada a fuego bajo con patata, zanahoria y vino tinto. Carne tierna que se deshace.',
  kcal:[745,472],mac:{p:[68,43],f:[22,14],c:[68,43]},
  ing:[{n:'Ternera magra troceada',A:'220g cr.→176g',B:'145g cr.→116g'},{n:'Patata',A:'150g cr.→120g',B:'100g cr.→80g'},{n:'Zanahoria (V1)',A:'100g',B:'80g'},{n:'Pimiento rojo (V2)',A:'100g',B:'80g'},{n:'Cebolla (V3)',A:'80g',B:'60g'},{n:'Tomate triturado + laurel',A:'100g · c.s.',B:'80g · c.s.'},{n:'Vino tinto cocción',A:'50ml',B:'40ml'},{n:'AOVE',A:'15g',B:'10g'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Dorar ternera 5 min, añadir verduras y vino, guisar a fuego bajo 40 min. Olla exprés: 22 min.'},
C10:{cat:'com',short:'Garbanzos + pollo',nom:'Bowl de garbanzos con pollo plancha y pimientos asados',icon:'🌱',t:'20 min',eq:'Freidora de aire',tags:['leg'],tipo:'completa',diet:['sg','sl','cn','lg'],
  desc:'Bowl mediterráneo: garbanzos tibios de base, pollo crujiente por fuera y jugoso por dentro, pimientos asados y tomate cherry.',
  kcal:[730,463],mac:{p:[73,46],f:[20,13],c:[58,37]},
  ing:[{n:'Garbanzos (bote escurrido)',A:'100g cr.→250g',B:'65g cr.→163g'},{n:'Pechuga pollo',A:'180g cr.→144g',B:'120g cr.→96g'},{n:'Pimiento asado (V1)',A:'150g',B:'120g'},{n:'Zanahoria + cebolla morada (V2)',A:'100g + 60g',B:'80g + 50g'},{n:'Tomate cherry (V3)',A:'100g',B:'80g'},{n:'AOVE + comino + limón',A:'15g · c.s.',B:'10g · c.s.'},{n:'Salmorejo (frío al servir)',A:'200ml',B:'150ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Pollo freidora de aire 200°C/12 min. Garbanzos de bote tibios. Servir como bowl sobre base de garbanzos.'},
C11:{cat:'com',short:'Caballa al horno',nom:'Caballa al horno con brócoli y patata',icon:'🐠',t:'25 min',eq:'Horno · Freidora aire',tags:['az'],tipo:'completa',diet:['sg','sl','ps'],
  desc:'Pescado azul rico en omega-3 al horno con hierbas provenzales, sobre cama de patata y brócoli al vapor.',
  kcal:[758,480],mac:{p:[66,42],f:[28,18],c:[60,38]},
  ing:[{n:'Caballa (filetes o entera)',A:'250g cr.→213g',B:'165g cr.→140g'},{n:'Brócoli (V1)',A:'200g',B:'150g'},{n:'Patata',A:'150g cr.→120g',B:'100g cr.→80g'},{n:'Pimiento rojo + cebolla (V2+V3)',A:'100g + 80g',B:'80g + 60g'},{n:'AOVE + limón + hierbas provenzales',A:'15g · c.s.',B:'10g · c.s.'},{n:'Salmorejo (frío al servir)',A:'200ml',B:'150ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Horno 200°C / 20 min. Freidora de aire 190°C / 12 min. Patata precocida en microondas 4 min.'},
C12:{cat:'com',short:'Chili vegetal',nom:'Chili de lentejas y alubias con arroz integral',icon:'🌶️',t:'35 min',eq:'Olla',tags:['leg'],tipo:'completa',diet:['sg','sl','vg','vt','lg'],
  desc:'Chili 100% vegetal con dos legumbres, especiado con comino y pimentón. Arroz integral para una proteína completa.',
  kcal:[742,470],mac:{p:[70,44],f:[20,13],c:[68,43]},
  ing:[{n:'Lentejas pardinas',A:'60g cr.→150g',B:'40g cr.→100g'},{n:'Alubias rojas',A:'30g cr.→75g',B:'20g cr.→50g'},{n:'Tomate triturado (V1)',A:'100g',B:'65g'},{n:'Pimiento rojo + cebolla (V2)',A:'100g + 50g',B:'65g + 33g'},{n:'Arroz integral crudo (V3)',A:'40g cr.→140g',B:'26g cr.→91g'},{n:'Comino + pimentón + ajo',A:'c.s.',B:'c.s.'},{n:'AOVE',A:'12g',B:'8g'},{n:'Gazpacho (frío al servir)',A:'250ml',B:'200ml'},{n:'Fruta postre (F2)',A:'150g',B:'150g'}],
  nota:'Sofrito 5 min, añadir legumbres + tomate + especias, guisar 25 min. Arroz aparte en paralelo.'},

/* ── MERIENDAS ────────────────────────────────────────── */
M1:{cat:'mer',short:'Yogur + proteína',nom:'Yogur natural con proteína, fruta y frutos secos',icon:'🥛',t:'3 min',eq:'Sin cocción',tags:[],tipo:null,diet:['vt'],
  desc:'Yogur cremoso con extra de proteína, fruta troceada y un puñado de frutos secos. La merienda rápida por defecto.',
  kcal:[425,272],mac:{p:[50,32],f:[16,10],c:[30,19]},
  ing:[{n:'Yogur natural',A:'200g',B:'150g'},{n:'Proteína whey',A:'30g',B:'20g'},{n:'Fruta (F3) — elección',A:'150g',B:'100g'},{n:'Frutos secos (almendras/pistachos/anacardos)',A:'35g',B:'20g'}],
  nota:'Mezclar yogur con proteína. Fruta troceada encima y frutos secos. Evitar cacahuetes, nueces y avellanas.'},
M2:{cat:'mer',short:'Queso cabra',nom:'Tostada con queso de cabra, tomate y fruta',icon:'🧀',t:'5 min',eq:'Tostadora',tags:[],tipo:null,diet:['vt'],
  desc:'Queso de cabra cremoso sobre tostada caliente, tomate cherry partido y fruta como postre dulce.',
  kcal:[415,263],mac:{p:[20,12],f:[16,10],c:[44,28]},
  ing:[{n:'Pan integral',A:'60g',B:'40g'},{n:'Queso de cabra',A:'60g',B:'40g'},{n:'Tomate cherry',A:'100g',B:'80g'},{n:'Fruta (F3) — elección',A:'150g',B:'100g'},{n:'Frutos secos opcionales',A:'20g',B:'15g'}],
  nota:'Pan tostado, queso de cabra en rodajas, tomate cherry partido. Fruta como postre de la merienda.'},
M3:{cat:'mer',short:'Hummus + crudités',nom:'Hummus con crudités de zanahoria y pepino',icon:'🥕',t:'3 min',eq:'Sin cocción',tags:[],tipo:null,diet:['sg','sl','vg','vt','lg'],
  desc:'Hummus cremoso de garbanzo con bastones crujientes de zanahoria y pepino. Fruta y frutos secos para cerrar.',
  kcal:[390,248],mac:{p:[14,9],f:[16,10],c:[48,30]},
  ing:[{n:'Hummus',A:'60g',B:'40g'},{n:'Zanahoria en bastones',A:'100g',B:'80g'},{n:'Pepino en rodajas',A:'80g',B:'60g'},{n:'Fruta (F3) — elección',A:'150g',B:'100g'},{n:'Frutos secos',A:'25g',B:'15g'}],
  nota:'Cortar verduras en bastones. Hummus como dip. Fruta como cierre. Opciones de dip: tzatziki con yogur y pepino.'},
M4:{cat:'mer',short:'Queso batido + fruta',nom:'Queso batido / cottage con fruta y frutos secos',icon:'🍶',t:'3 min',eq:'Sin cocción',tags:[],tipo:null,diet:['vt'],
  desc:'Queso batido cremoso, fruta y frutos secos con un toque de canela. Proteína silenciosa y fácil.',
  kcal:[420,267],mac:{p:[28,18],f:[18,11],c:[38,24]},
  ing:[{n:'Queso fresco batido / cottage',A:'200g',B:'130g'},{n:'Fruta (F3) — elección',A:'150g',B:'100g'},{n:'Frutos secos (almendras/anacardos)',A:'35g',B:'20g'},{n:'Proteína whey (opcional)',A:'15g',B:'10g'}],
  nota:'Mezclar queso con proteína si se añade. Fruta troceada encima. Frutos secos. Canela al gusto.'},

/* ── CENAS ────────────────────────────────────────────── */
N1:{cat:'cen',short:'Revuelto espinacas',nom:'Revuelto de espinacas con queso fresco y ensalada de pepino',icon:'🍳',t:'10 min',eq:'Sartén antiadherente',tags:[],tipo:'ligera',diet:['sg','vt'],
  desc:'Revuelto cremoso de espinacas con ajo, rematado con queso fresco fuera del fuego. Ensalada de pepino con menta.',
  kcal:[408,260],mac:{p:[38,24],f:[27,17],c:[8,5]},
  ing:[{n:'Huevos',A:'3 uds (180g)',B:'2 uds (120g)'},{n:'Espinacas frescas (V1)',A:'150g',B:'150g'},{n:'Queso fresco (topping)',A:'50g',B:'30g'},{n:'AOVE',A:'8g',B:'5g'},{n:'Pepino (ensalada V2)',A:'150g',B:'150g'},{n:'Cebolla morada + limón + menta (V3)',A:'40g · c.s.',B:'30g · c.s.'},{n:'AOVE ensalada',A:'5g',B:'3g'}],
  nota:'Saltear espinacas con ajo 2 min. Añadir huevos batidos, fuego suave removiendo. Queso fresco al final fuera del fuego.'},
N2:{cat:'cen',short:'Tortilla + caprese',nom:'Tortilla francesa con ensalada caprese',icon:'🥗',t:'10 min',eq:'Sartén antiadherente',tags:[],tipo:'ligera',diet:['sg','vt'],
  desc:'Tortilla francesa fina con ensalada caprese de tomate, mozzarella light y albahaca fresca. Frescor en plato.',
  kcal:[415,264],mac:{p:[36,23],f:[28,18],c:[10,6]},
  ing:[{n:'Huevos',A:'3 uds (180g)',B:'2 uds (120g)'},{n:'AOVE',A:'8g',B:'5g'},{n:'Tomate caprese (V1)',A:'200g',B:'150g'},{n:'Mozzarella light',A:'60g',B:'40g'},{n:'Albahaca fresca',A:'c.s.',B:'c.s.'},{n:'Espinacas baby / rúcula (V2)',A:'80g',B:'60g'},{n:'AOVE caprese',A:'5g',B:'3g'}],
  nota:'Tortilla en sartén antiadherente con mínimo AOVE. Caprese: tomate + mozzarella + albahaca + AOVE + sal en escamas.'},
N3:{cat:'cen',short:'Crema calabaza',nom:'Crema de calabaza con jamón crujiente',icon:'🎃',t:'25 min',eq:'Olla + batidora de mano',tags:[],tipo:'ligera',diet:['sg','cn'],
  desc:'Crema sedosa de calabaza con nuez moscada, coronada con jamón serrano crujiente y queso fresco desmenuzado.',
  kcal:[395,251],mac:{p:[32,20],f:[22,14],c:[22,14]},
  ing:[{n:'Calabaza cruda',A:'400g',B:'300g'},{n:'Cebolla (V1)',A:'80g',B:'60g'},{n:'Caldo vegetal',A:'300ml',B:'200ml'},{n:'AOVE + nuez moscada',A:'8g · c.s.',B:'5g · c.s.'},{n:'Jamón serrano (topping)',A:'60g',B:'40g'},{n:'Queso fresco (topping)',A:'30g',B:'20g'},{n:'Ensalada verde (V2+V3)',A:'150g',B:'120g'}],
  nota:'Calabaza + cebolla en caldo 20 min. Triturar. Tostar jamón en sartén seca 2 min. Servir con queso fresco y jamón crujiente.'},
N4:{cat:'cen',short:'Mejillones vapor',nom:'Mejillones al vapor con ensalada de espinacas y pepino',icon:'🐚',t:'15 min',eq:'Vitrocerámica',tags:['bl'],tipo:'ligera',diet:['sg','ps'],
  desc:'Mejillones al vapor con vino blanco y laurel. Ensalada fresca de espinacas baby, pepino y cebolla morada.',
  kcal:[390,248],mac:{p:[38,24],f:[18,11],c:[16,10]},
  ing:[{n:'Mejillones (frescos o bolsa)',A:'300g → ~120g carne',B:'200g → ~80g carne'},{n:'Vino blanco + laurel',A:'c.s.',B:'c.s.'},{n:'Queso fresco (topping)',A:'40g',B:'25g'},{n:'Espinacas baby (V1)',A:'100g',B:'80g'},{n:'Pepino (V2)',A:'100g',B:'80g'},{n:'Cebolla morada (V3)',A:'50g',B:'40g'},{n:'AOVE + limón + sal marina',A:'8g · c.s.',B:'5g · c.s.'}],
  nota:'Mejillones al vapor 5-7 min hasta abrir. Desechar los cerrados. Servir con ensalada fría y queso fresco.'},
N5:{cat:'cen',short:'Revuelto gambas',nom:'Revuelto de gambas con espárragos y ensalada de tomate',icon:'🦐',t:'12 min',eq:'Sartén antiadherente',tags:[],tipo:'ligera',diet:['sg','ps'],
  desc:'Gambas salteadas con ajo, espárragos verdes y huevo cremoso. Ensalada de tomate con orégano para terminar.',
  kcal:[410,261],mac:{p:[42,27],f:[22,14],c:[10,6]},
  ing:[{n:'Gambas peladas',A:'150g cr.→130g',B:'100g cr.→87g'},{n:'Espárragos verdes (V1)',A:'150g',B:'120g'},{n:'Huevos',A:'2 uds (120g)',B:'1 ud (60g)'},{n:'Queso fresco batido',A:'50g',B:'30g'},{n:'AOVE + ajo laminado',A:'8g · 1d.',B:'5g · 1d.'},{n:'Tomate (ensalada V2)',A:'150g',B:'120g'},{n:'Cebolla morada + orégano (V3)',A:'40g · c.s.',B:'30g · c.s.'}],
  nota:'Saltear gambas con ajo 2 min, añadir espárragos 3 min, incorporar huevos + queso batido al final a fuego suave.'},
N6:{cat:'cen',short:'Ternera plancha',nom:'Ternera a la plancha con ensalada verde clásica',icon:'🥩',t:'15 min',eq:'Vitrocerámica',tags:['roja'],tipo:'ligera',diet:['sg','sl','cn'],
  desc:'Filete de ternera magra a la plancha con romero, ensalada verde de lechuga romana y vinagre de Jerez.',
  kcal:[405,258],mac:{p:[40,25],f:[24,15],c:[6,4]},
  ing:[{n:'Ternera magra (filete)',A:'200g cr.→160g',B:'130g cr.→104g'},{n:'AOVE + ajo + romero',A:'10g · c.s.',B:'7g · c.s.'},{n:'Lechuga romana (V1)',A:'100g',B:'100g'},{n:'Tomate (V2)',A:'100g',B:'80g'},{n:'Cebolla morada (V3)',A:'50g',B:'40g'},{n:'AOVE + vinagre de Jerez',A:'5g · c.s.',B:'3g · c.s.'}],
  nota:'Ternera vitrocerámica 3 min/lado fuego alto. Reposar 2 min antes de cortar. Ensalada aliñada al momento de servir.'},
N7:{cat:'cen',short:'Sopa juliana',nom:'Sopa juliana con huevo pochado y parmesano',icon:'🍲',t:'20 min',eq:'Olla',tags:[],tipo:'ligera',diet:['sg','vt'],
  desc:'Sopa ligera y reconfortante de juliana de verduras, huevo pochado y parmesano rallado. La cena de un día complicado.',
  kcal:[380,242],mac:{p:[28,18],f:[14,9],c:[32,20]},
  ing:[{n:'Caldo vegetal',A:'400ml',B:'300ml'},{n:'Juliana: zanahoria+puerro+apio (V1+V2)',A:'250g',B:'200g'},{n:'Patata (V3)',A:'80g cr.→64g',B:'60g cr.→48g'},{n:'Huevos pochados',A:'2 uds',B:'1 ud'},{n:'AOVE + perejil',A:'8g · c.s.',B:'5g · c.s.'},{n:'Queso parmesano rallado',A:'20g',B:'12g'}],
  nota:'Hervir juliana en caldo 15 min. Pochar huevos 3 min en agua con vinagre. Servir con parmesano y AOVE.'},
N8:{cat:'cen',short:'🏖 Fajitas merluza',nom:'Fajitas de merluza con aguacate · picnic',icon:'🐟',t:'20 min',eq:'Freidora aire + sartén',tags:['bl','pic'],tipo:'completa',diet:['ps'],
  desc:'Fajitas portátiles ideales para llevar a la playa: merluza freidora de aire, pimientos salteados y aguacate. Se transportan envueltas.',
  kcal:[445,283],mac:{p:[45,28],f:[18,11],c:[38,24]},
  ing:[{n:'Tortillas integrales',A:'3 uds (90g)',B:'2 uds (60g)'},{n:'Merluza filetes',A:'200g cr.→170g',B:'130g cr.→110g'},{n:'Pimiento rojo + verde (V1)',A:'150g',B:'100g'},{n:'Cebolla (V2)',A:'80g',B:'50g'},{n:'Aguacate (V3)',A:'50g',B:'30g'},{n:'Queso rallado light',A:'30g',B:'20g'},{n:'AOVE + comino + pimentón',A:'10g · c.s.',B:'7g · c.s.'}],
  nota:'Merluza freidora de aire 200°C/8 min. Verduras salteadas 8 min. Montar y envolver en papel film. Transportar en tupper refrigerado.'},
N9:{cat:'cen',short:'Fajitas de pavo',nom:'Fajitas de pavo con pimientos y queso rallado',icon:'🌮',t:'20 min',eq:'Freidora aire + sartén',tags:[],tipo:'completa',diet:['cn'],
  desc:'Tex-Mex saludable: pavo crujiente, pimientos, cebolla pochada y queso rallado light. Calentar tortillas en sandwichera.',
  kcal:[440,280],mac:{p:[44,28],f:[18,11],c:[36,23]},
  ing:[{n:'Tortillas integrales',A:'3 uds (90g)',B:'2 uds (60g)'},{n:'Pechuga pavo',A:'200g cr.→160g',B:'130g cr.→104g'},{n:'Pimiento rojo + verde (V1)',A:'150g',B:'100g'},{n:'Cebolla (V2)',A:'80g',B:'60g'},{n:'Queso rallado light',A:'30g',B:'20g'},{n:'Rúcula opcional (V3)',A:'60g',B:'50g'},{n:'AOVE + comino + pimentón',A:'10g · c.s.',B:'7g · c.s.'}],
  nota:'Pavo freidora de aire 200°C/10 min. Verduras salteadas en sartén 8 min. Calentar tortillas en sandwichera 1 min.'},
N10:{cat:'cen',short:'Pizza integral',nom:'Pizza integral casera con pollo y mozzarella',icon:'🍕',t:'20 min',eq:'Horno 220°C',tags:[],tipo:'completa',diet:['cn'],
  desc:'Pizza casera sobre base integral: tomate, pollo cocido, mozzarella light, champiñones y orégano. La cena de los viernes.',
  kcal:[435,277],mac:{p:[40,25],f:[20,13],c:[40,25]},
  ing:[{n:'Base pizza integral',A:'100g',B:'65g'},{n:'Tomate triturado',A:'80g',B:'60g'},{n:'Pollo / pavo cocido',A:'100g',B:'70g'},{n:'Mozzarella light',A:'60g',B:'40g'},{n:'Pimiento + champiñones (V1)',A:'150g total',B:'120g total'},{n:'Cebolla opcional (V2)',A:'50g',B:'40g'},{n:'Orégano + AOVE',A:'c.s. · 5g',B:'c.s. · 3g'}],
  nota:'Horno precalentado 220°C / 15 min. Montar sobre base fría: tomate, queso, pollo, verduras, orégano.'},
N11:{cat:'cen',short:'🏖 Wrap picnic',nom:'Wrap picnic de pollo con hummus y aguacate',icon:'🌯',t:'15 min',eq:'Freidora de aire',tags:['pic'],tipo:'completa',diet:['cn'],
  desc:'Wrap fresco transportable: hummus untado, pollo, aguacate, lechuga y tomate. Se puede preparar la noche anterior.',
  kcal:[450,286],mac:{p:[46,29],f:[18,11],c:[38,24]},
  ing:[{n:'Tortilla integral grande',A:'2 uds (70g)',B:'1 ud (45g)'},{n:'Pechuga pollo',A:'180g cr.→144g',B:'120g cr.→96g'},{n:'Hummus',A:'60g',B:'40g'},{n:'Aguacate',A:'60g',B:'40g'},{n:'Lechuga + tomate + pepino (V1+V2+V3)',A:'150g total',B:'120g total'},{n:'Queso fresco',A:'40g',B:'25g'}],
  nota:'Pollo freidora aire 200°C/12 min (puede ser noche anterior). Extender hummus, añadir ingredientes, enrollar y envolver en papel film.'},
N12:{cat:'cen',short:'Dorada al horno',nom:'Dorada al horno con ensalada zanahoria-manzana',icon:'🐟',t:'25 min',eq:'Horno',tags:['bl'],tipo:'ligera',diet:['sg','sl','ps'],
  desc:'Dorada en su jugo sobre cama de patata y calabacín. Ensalada cruda de zanahoria y manzana verde rallada con limón y comino.',
  kcal:[400,255],mac:{p:[38,24],f:[18,11],c:[22,14]},
  ing:[{n:'Dorada filetes',A:'220g cr.→187g',B:'145g cr.→123g'},{n:'Calabacín (V1)',A:'150g',B:'120g'},{n:'Patata (V2)',A:'120g cr.→96g',B:'80g cr.→64g'},{n:'AOVE + limón + hierbas',A:'10g · c.s.',B:'7g · c.s.'},{n:'Zanahoria rallada (ensalada V3)',A:'100g',B:'80g'},{n:'Manzana verde rallada',A:'80g',B:'60g'},{n:'Limón + comino + AOVE ensalada',A:'c.s. · 5g',B:'c.s. · 3g'}],
  nota:'Horno 190°C sobre cama de patata y calabacín / 20 min. Ensalada: zanahoria + manzana verde rallada + limón + comino.'},
N13:{cat:'cen',short:'Fajitas de pollo',nom:'Fajitas de pollo con pimientos y guacamole rápido',icon:'🌮',t:'20 min',eq:'Freidora aire + sartén',tags:[],tipo:'completa',diet:['cn'],
  desc:'Pollo especiado, pimientos a la plancha y guacamole rápido (aguacate chafado con limón y sal). Mexicano sin culpa.',
  kcal:[442,281],mac:{p:[44,28],f:[18,11],c:[37,24]},
  ing:[{n:'Tortillas integrales',A:'3 uds (90g)',B:'2 uds (60g)'},{n:'Pechuga pollo',A:'200g cr.→160g',B:'130g cr.→104g'},{n:'Pimiento rojo + verde (V1)',A:'150g',B:'100g'},{n:'Cebolla (V2)',A:'80g',B:'60g'},{n:'Aguacate — guacamole rápido (V3)',A:'60g',B:'40g'},{n:'Queso rallado light',A:'30g',B:'20g'},{n:'AOVE + comino + pimentón',A:'10g · c.s.',B:'7g · c.s.'}],
  nota:'Pollo freidora 200°C/12 min. Verduras salteadas. Aguacate chafado con limón y sal como guacamole rápido.'},
N14:{cat:'cen',short:'Ensalada César',nom:'Ensalada César con pollo plancha y picatostes',icon:'🥗',t:'20 min',eq:'Vitrocerámica',tags:[],tipo:'completa',diet:['cn'],
  desc:'Versión casera y ligera de la César: pollo plancha, lechuga romana, parmesano, picatostes integrales y aliño emulsionado con limón y mostaza.',
  kcal:[430,274],mac:{p:[42,27],f:[20,13],c:[28,18]},
  ing:[{n:'Pechuga pollo',A:'180g cr.→144g',B:'120g cr.→96g'},{n:'Lechuga romana (V1)',A:'150g',B:'120g'},{n:'Tomate cherry (V2)',A:'100g',B:'80g'},{n:'Queso parmesano rallado',A:'25g',B:'15g'},{n:'Pan integral — picatostes (V3)',A:'40g',B:'25g'},{n:'AOVE + limón + mostaza + ajo',A:'15g · c.s.',B:'10g · c.s.'}],
  nota:'Pollo plancha 4 min/lado. Picatostes: pan en cubos al horno o freidora aire hasta dorar. Aliño: AOVE + limón + mostaza + parmesano.'},
N15:{cat:'cen',short:'Crepes requesón',nom:'Crepes integrales rellenas de requesón y espinacas',icon:'🥞',t:'20 min',eq:'Sartén antiadherente',tags:[],tipo:'ligera',diet:['vt'],
  desc:'Crepes integrales rellenas de requesón cremoso, espinacas salteadas con ajo y tomate cherry. Cierre con albahaca.',
  kcal:[405,258],mac:{p:[30,19],f:[16,10],c:[42,27]},
  ing:[{n:'Crepes / masa integral',A:'80g',B:'50g'},{n:'Requesón',A:'120g',B:'80g'},{n:'Espinacas frescas (V1)',A:'150g',B:'100g'},{n:'Queso fresco / cottage (topping)',A:'30g',B:'20g'},{n:'AOVE + ajo',A:'8g · c.s.',B:'5g · c.s.'},{n:'Tomate cherry (V2)',A:'80g',B:'60g'},{n:'Albahaca + pimienta negra',A:'c.s.',B:'c.s.'}],
  nota:'Espinacas salteadas con ajo 3 min. Mezclar con requesón y queso. Rellenar crepes. Calentar en sartén 2 min/lado.'}
};

const CATEGORIES = [
  {key:'des', label:'Desayunos', icon:'☀️', time:'07:00'},
  {key:'com', label:'Comidas',   icon:'🍽',  time:'15:00'},
  {key:'mer', label:'Meriendas', icon:'🍎', time:'18:00'},
  {key:'cen', label:'Cenas',     icon:'🌙', time:'21:00'}
];

const FILTERS = [
  // Dieta — el filtro 'todos' va el primero
  {key:'todos', label:'Todos',         ico:'✦', cls:'todos', group:'all'},
  {key:'sg',    label:'Sin gluten',    ico:'🌾',           group:'diet'},
  {key:'sl',    label:'Sin lactosa',   ico:'🥛',           group:'diet'},
  {key:'vt',    label:'Vegetariano',   ico:'🥬',           group:'diet'},
  {key:'vg',    label:'Vegano',        ico:'🌱',           group:'diet'},
  // Tipos de alimento — para filtrar por categoría del PDF
  {key:'f:leg', label:'Legumbre',      ico:'🫘',           group:'food'},
  {key:'f:cb',  label:'Carne blanca',  ico:'🍗',           group:'food'},
  {key:'f:cr',  label:'Carne roja',    ico:'🥩',           group:'food'},
  {key:'f:pb',  label:'Pescado blanco',ico:'🐟',           group:'food'},
  {key:'f:pa',  label:'Pescado azul',  ico:'🐠',           group:'food'},
  {key:'f:apq', label:'Arroz/Pasta',   ico:'🍚',           group:'food'},
  {key:'f:hv',  label:'Huevo',         ico:'🥚',           group:'food'},
  {key:'f:pv',  label:'Prot. vegetal', ico:'🌱',           group:'food'},
  {key:'f:qs',  label:'Queso',         ico:'🧀',           group:'food'},
  {key:'f:js',  label:'Jamón',         ico:'🥓',           group:'food'},
  {key:'f:lac', label:'Lácteo',        ico:'🥛',           group:'food'},
  {key:'f:fs',  label:'Frutos secos',  ico:'🥜',           group:'food'},
  {key:'f:pic', label:'Picnic',        ico:'🏖',           group:'food'}
];

const TARGETS = {
  A:  {kcal:2100, p:200, f:85,  c:134, name:'135kg', sym:'♂', lbl:'♂ 135kg · 2100 kcal/día', restr:[]},
  B:  {kcal:1350, p:120, f:50,  c:105, name:'95kg',  sym:'♀', lbl:'♀ 95kg · 1350 kcal/día',  restr:[]},
  AB: {kcal:3450, p:320, f:135, c:239, lbl:'♂+♀ Total pareja · 3450 kcal/día',     restr:[]}
};

/* ── PERSONAS (flexible) ───────────────────────────────────
   PEOPLE = ids activos en orden (en TARGETS). Por defecto 2; se
   pueden añadir/quitar. Toda la app itera PEOPLE en vez de A/B fijos.
   La ración de cada persona = ración BASE (la de menor kcal) × modificador.
   El modificador por defecto = kcal_persona / kcal_base (editable). */
let PEOPLE = ['A','B'];
const PERSON_SYMS = ['♂','♀','🧑','👦','👧','🧒','👴','👵'];

function peopleObjs(){ return PEOPLE.map(id => TARGETS[id]).filter(Boolean); }
function basePersonId(){
  let id = PEOPLE[0], min = Infinity;
  PEOPLE.forEach(p => { const k = (TARGETS[p] && TARGETS[p].kcal) || 0; if(k && k < min){ min = k; id = p; } });
  return id;
}
function personModifier(id){
  const base = TARGETS[basePersonId()], t = TARGETS[id];
  if(!base || !t || !base.kcal) return 1;
  // modificador manual si se ha fijado; si no, ratio de kcal respecto a la base
  if(t.modifier != null && isFinite(t.modifier)) return t.modifier;
  return Math.round((t.kcal / base.kcal) * 100) / 100;
}

/* ══════════════════════════════════════════════════════════
   RESTRICCIONES NUTRICIONALES · alergias e intolerancias
   Cada restricción tiene una función violates(dish) → bool
══════════════════════════════════════════════════════════ */
const RESTRICTIONS = [
  {k:'sg',     lbl:'Sin gluten',      ico:'🌾',  desc:'Excluye platos con cereales con gluten',
   violates:(d)=> !(d.diet||[]).includes('sg')},
  {k:'sl',     lbl:'Sin lactosa',     ico:'🥛',  desc:'Excluye queso y lácteos',
   violates:(d)=> (d.food||[]).includes('qs') || (d.food||[]).includes('lac') && !(d.diet||[]).includes('sl')},
  {k:'vt',     lbl:'Vegetariano',     ico:'🥬',  desc:'Sin carne ni pescado',
   violates:(d)=>{
     const f = d.food||[]; const dt = d.diet||[];
     if(dt.includes('vg') || dt.includes('vt')) return false;
     return f.some(x=> ['cb','cr','pb','pa','js'].includes(x));
   }},
  {k:'vg',     lbl:'Vegano',          ico:'🌱',  desc:'Sin productos de origen animal',
   violates:(d)=>{
     const f = d.food||[]; const dt = d.diet||[];
     if(dt.includes('vg')) return false;
     return f.some(x=> ['cb','cr','pb','pa','js','qs','lac','hv'].includes(x));
   }},
  {k:'nocn',   lbl:'Sin carne',       ico:'🥩',  desc:'Excluye carne roja y blanca',
   violates:(d)=> (d.food||[]).some(x=> ['cb','cr','js'].includes(x))},
  {k:'nopx',   lbl:'Sin pescado',     ico:'🐟',  desc:'Excluye pescado y marisco',
   violates:(d)=> (d.food||[]).some(x=> ['pb','pa'].includes(x))},
  {k:'noleg',  lbl:'Sin legumbres',   ico:'🫘',  desc:'Excluye platos con legumbres',
   violates:(d)=> (d.food||[]).includes('leg')},
  {k:'nohv',   lbl:'Sin huevo',       ico:'🥚',  desc:'Excluye platos con huevo',
   violates:(d)=> (d.food||[]).includes('hv')},
  {k:'nofs',   lbl:'Sin frutos secos',ico:'🥜',  desc:'Excluye platos con frutos secos',
   violates:(d)=> (d.food||[]).includes('fs')},
  {k:'nolac',  lbl:'Sin lácteos',     ico:'🧀',  desc:'Excluye queso, yogur y bebidas lácteas',
   violates:(d)=> (d.food||[]).some(x=> ['qs','lac'].includes(x))},
  {k:'nocr',   lbl:'Sin carne roja',  ico:'🐂',  desc:'Permite carne blanca, pero no roja',
   violates:(d)=> (d.food||[]).includes('cr')}
];

const RESTRICTIONS_MAP = Object.fromEntries(RESTRICTIONS.map(r=>[r.k, r]));

/* ══════════════════════════════════════════════════════════
   FOOD TYPES · categorías de alimentos para guía semanal
══════════════════════════════════════════════════════════ */
const FOOD_TYPES = {
  leg: {ico:'🫘', lbl:'Legumbre',          short:'Legumbre',    color:'#6B4A10'},
  cb:  {ico:'🍗', lbl:'Carne blanca',      short:'C. blanca',   color:'#B98842'},
  cr:  {ico:'🥩', lbl:'Carne roja',        short:'C. roja',     color:'#8B3030'},
  pb:  {ico:'🐟', lbl:'Pescado blanco',    short:'P. blanco',   color:'#3A6E96'},
  pa:  {ico:'🐠', lbl:'Pescado azul',      short:'P. azul',     color:'#1F4E70'},
  apq: {ico:'🍚', lbl:'Arroz / Pasta / Quinoa', short:'Arroz/Pasta', color:'#C89328'},
  hv:  {ico:'🥚', lbl:'Huevo',             short:'Huevo',       color:'#C89328'},
  pv:  {ico:'🌱', lbl:'Proteína vegetal',  short:'Prot.vegetal',color:'#4E5E2C'},
  qs:  {ico:'🧀', lbl:'Queso',             short:'Queso',       color:'#A87830'},
  js:  {ico:'🥓', lbl:'Jamón serrano',     short:'Jamón',       color:'#8E441F'},
  lac: {ico:'🥛', lbl:'Lácteo',            short:'Lácteo',      color:'#7A6048'},
  fs:  {ico:'🥜', lbl:'Frutos secos',      short:'F. secos',    color:'#5A4530'},
  v:   {ico:'🥬', lbl:'Verdura',           short:'Verdura',     color:'#4E5E2C'},
  fr:  {ico:'🍎', lbl:'Fruta',             short:'Fruta',       color:'#B5603A'},
  pic: {ico:'🏖', lbl:'Picnic',            short:'Picnic',      color:'#D4896A'},
  lb:  {ico:'✨', lbl:'Libre',             short:'Libre',       color:'#8B3030'}
};

/* Asignación de tipos de alimento por receta (extraído del plan + guía PDF).
   Verdura y fruta están en casi todas las recetas — se omiten salvo ensaladas o platos donde son el protagonista. */
const FOOD_MAP = {
  // ─ DESAYUNOS ─
  D1:['hv','fr'],          D2:['qs','js','fr'],     D3:['pa','hv','fr'],
  D4:['js','fr'],          D5:['qs','fr'],          D6:['lac','fr'],
  D7:['qs','pa','hv','fr'],D8:['hv','qs','fr'],

  // ─ COMIDAS ─ (con guía semanal según PDF)
  C1:['pb','v'],           C2:['leg','cb','v'],     C3:['pa','apq','v'],
  C4:['leg','pa','v'],     C5:['pb','v'],           C6:['leg','cb','v'],
  C7:['leg','pb','v'],     C8:['leg','cb','v'],     C9:['cr','v'],
  C10:['leg','cb','v'],    C11:['pa','v'],          C12:['leg','pv','apq','v'],

  // ─ MERIENDAS ─
  M1:['lac','fr','fs'],    M2:['qs','fr'],          M3:['pv','v','fr','fs'],
  M4:['lac','fr','fs'],

  // ─ CENAS ─
  N1:['hv','qs','v'],      N2:['hv','qs','v'],      N3:['v','js','qs'],
  N4:['pb','qs','v'],      N5:['hv','pb','v'],      N6:['cr','v'],
  N7:['hv','v'],           N8:['pb','v','pic'],     N9:['cb','v'],
  N10:['cb','qs','v'],     N11:['cb','pv','v','pic'], N12:['pb','v'],
  N13:['cb','v'],          N14:['cb','qs','v'],     N15:['qs','v']
};

// Inyectar food[] en cada plato del catálogo base
Object.entries(FOOD_MAP).forEach(([id, foods])=>{
  if(DISHES[id]) DISHES[id].food = foods;
});
Object.values(DISHES).forEach(d=>{ if(!d.food) d.food = []; });

/* ══════════════════════════════════════════════════════════
   GUÍA SEMANAL · cantidades recomendadas por semana
   Se cuentan SOLO las comidas (no desayunos/meriendas)
   salvo donde se indica.
══════════════════════════════════════════════════════════ */
const WEEKLY_GUIDE = [
  // Comidas (medio día) — distribución según PDF
  {k:'leg', lbl:'Legumbre · comida',      target:2, max:3, scope:'com', rule:'2 días/sem (uno con patata)'},
  {k:'cb',  lbl:'Carne blanca · comida',  target:1, max:2, scope:'com', rule:'1 día/sem (pollo, pavo, conejo)'},
  {k:'cr',  lbl:'Carne roja · comida',    target:0, max:1, scope:'com', rule:'2-3 raciones/MES — máx 1 día/sem'},
  {k:'pb',  lbl:'Pescado blanco · comida',target:1, max:2, scope:'com', rule:'Al menos 1 día/sem en filete'},
  {k:'pa',  lbl:'Pescado azul · comida',  target:1, max:2, scope:'com', rule:'Al menos 1 día/sem en filete'},
  {k:'apq', lbl:'Arroz/Pasta/Quinoa · comida', target:1, max:2, scope:'com', rule:'1 día/sem como plato grande'},
  {k:'lb',  lbl:'Libre · comida',         target:1, max:1, scope:'com', rule:'1 día libre con cabeza'},
  // Total semanal (cualquier comida del día)
  {k:'leg_total', foodKey:'leg', lbl:'Legumbre · total semana', target:4, max:5, scope:'all', rule:'3-4 raciones/sem en cualquier formato'},
  {k:'pa_total',  foodKey:'pa',  lbl:'Pescado azul · semana',   target:2, max:4, scope:'all', rule:'Pescado > carne en la semana'},
  {k:'pb_total',  foodKey:'pb',  lbl:'Pescado blanco · semana', target:2, max:4, scope:'all', rule:'Pescado > carne en la semana'},
  {k:'v_total',   foodKey:'v',   lbl:'Verdura · raciones día',  target:14, max:21, scope:'all', rule:'2 raciones/día (½ plato mín): cruda + cocida'},
  {k:'fr_total',  foodKey:'fr',  lbl:'Fruta · raciones día',    target:14, max:21, scope:'all', rule:'Al menos 2 piezas/día, mejor entera'},
  // Comida real prioritaria (teoría): proteína de calidad y grasas saludables a diario
  {k:'hv_total',  foodKey:'hv',  lbl:'Huevo · semana',          target:4,  max:8,  scope:'all', rule:'Hasta ~1 al día: proteína completa y saciante'},
  {k:'fs_total',  foodKey:'fs',  lbl:'Frutos secos · semana',   target:4,  max:7,  scope:'all', rule:'Un puñado (≈25 g) la mayoría de días, sin freír ni salar'},
  {k:'lac_total', foodKey:'lac', lbl:'Lácteo · semana',         target:7,  max:14, scope:'all', rule:'1-2/día: yogur natural, leche o kéfir (sin azúcar)'}
];

/* Mensajes de aviso visual según relación cumplimiento vs límite */
const GUIDE_STATUS = {
  empty: {cls:'st-empty', lbl:'falta'},
  low:   {cls:'st-low',   lbl:'pendiente'},
  ok:    {cls:'st-on',    lbl:'cumplido'},
  near:  {cls:'st-near',  lbl:'al límite'},
  over:  {cls:'st-over',  lbl:'excedido'}
};

const WEEK_DAYS = [
  {k:'lun', lbl:'Lun', long:'Lunes'},
  {k:'mar', lbl:'Mar', long:'Martes'},
  {k:'mie', lbl:'Mié', long:'Miércoles'},
  {k:'jue', lbl:'Jue', long:'Jueves'},
  {k:'vie', lbl:'Vie', long:'Viernes'},
  {k:'sab', lbl:'Sáb', long:'Sábado'},
  {k:'dom', lbl:'Dom', long:'Domingo'}
];

/* Sugerencia semanal del PDF (informativa) */
const WEEK_TEMPLATE = {
  lun:{com:'LEGUMBRE + patata pequeña', cen:'Verdura + huevos / Salmorejo con huevo'},
  mar:{com:'Pescado AZUL + verdura',    cen:'Proteína vegetal (edamame/hummus/lenteja roja)'},
  mie:{com:'Arroz/Pasta/Quinoa/Cuscús', cen:'Verdura + carne blanca (hamburguesa, filete)'},
  jue:{com:'LEGUMBRE sin patata',       cen:'Verdura + huevo / Guisantes con jamón'},
  vie:{com:'Pescado BLANCO + verdura',  cen:'Ensalada con salmón ahumado, queso y nueces'},
  sab:{com:'LIBRE con cabeza',          cen:'—'},
  dom:{com:'Carne BLANCA (2ª sem: roja)',cen:'Verdura + atún/melva/salmón ahumado/gambas'}
};
