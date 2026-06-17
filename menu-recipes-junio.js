/* ══════════════════════════════════════════════════════════
   MENU RECIPES · "Menú Junio" (PDF)
   ─────────────────────────────────────────────────────────
   16 recetas del menú semanal de junio, por COMPOSICIÓN de
   alimentos a RACIÓN ESTÁNDAR de adulto (~2000 kcal/día
   repartido por comida: des 25% · com 35% · mer 15% · cen 25%).
   Cada persona escala desde aquí según su necesidad (motor).
   Se inyectan en DISHES con IDs RJ001…  (base, permanentes).
   Scalable = núcleo energético (proteína/carbohidrato); fx =
   verduras, aceite, salsas y fruta (ración fija); cs = al gusto.
   depende de DISHES (menu-data.js) y FOODS (menu-foods.js).
══════════════════════════════════════════════════════════ */
const RECIPES_JUNIO = [
  /* ── DESAYUNO (mismo a diario) ── */
  {"cat":"des","nom":"Tostada de huevo y jamón con tomate y fruta","short":"Huevo, jamón y tomate","icon":"🍳","t":"10 min","eq":"Tostadora · Sartén","diet":["sl","cn"],"tipo":"completa","desc":"Pan integral con tomate, huevos, jamón serrano y fruta de temporada. Desayuno salado completo.","nota":"Tuesta el pan, frota el tomate, cuaja los huevos al gusto y acompaña con el jamón y la fruta.","comp":[
    {"f":"pan_integral","g":60},{"f":"huevo","g":110,"note":"2 ud"},{"f":"jamon_serrano","g":25},
    {"f":"tomate","g":100,"fx":true},{"f":"fruta_temporada","g":150,"fx":true},
    {"f":"especias","cs":true,"as":"Sal y AOVE al gusto"}]},

  /* ── MERIENDAS ── */
  {"cat":"mer","nom":"Yogur proteico con proteína y fruta","short":"Yogur proteico + fruta","icon":"🥛","t":"3 min","eq":"Bol","diet":["sg","vt"],"tipo":"ligera","desc":"Yogur griego/proteico con un cacito de proteína en polvo y fruta de temporada.","nota":"Mezcla el yogur con la proteína hasta integrar y añade la fruta troceada.","comp":[
    {"f":"yogur_proteico","g":200},{"f":"proteina","g":25},{"f":"fruta_temporada","g":150,"fx":true}]},

  {"cat":"mer","nom":"Tostada de jamón y queso con tomate","short":"Jamón y queso","icon":"🥪","t":"6 min","eq":"Tostadora","diet":["cn"],"tipo":"ligera","desc":"Pan integral con tomate, jamón serrano y queso curado.","nota":"Tuesta el pan, frota el tomate y monta con el jamón y el queso.","comp":[
    {"f":"pan_integral","g":50},{"f":"jamon_serrano","g":40},{"f":"queso_curado","g":20},
    {"f":"tomate","g":100,"fx":true},{"f":"especias","cs":true,"as":"AOVE al gusto"}]},

  /* ── COMIDAS ── */
  {"cat":"com","nom":"Guisillo de pollo con patata y verduras","short":"Guisillo de pollo","icon":"🍗","t":"35 min","eq":"Olla","diet":["sg","sl","cn"],"tipo":"completa","desc":"Pollo guisado con patata y verduras, con gazpacho y fruta de postre.","nota":"Sofríe la verdura, añade el pollo y la patata, cubre con caldo y cuece 25 min. Gazpacho frío al servir.","comp":[
    {"f":"pechuga_de_pollo","g":150},{"f":"patata","g":200},
    {"f":"zanahoria","g":100,"fx":true},{"f":"cebolla","g":80,"fx":true},{"f":"pimiento_verde","g":80,"fx":true},
    {"f":"aceite_de_oliva","g":10,"fx":true},{"f":"gazpacho","g":200,"fx":true},{"f":"fruta_temporada","g":150,"fx":true},
    {"f":"especias","cs":true,"as":"Ajo, laurel, sal y pimienta"}]},

  {"cat":"com","nom":"Ensalada templada de garbanzos con huevo","short":"Garbanzos templados","icon":"🥗","t":"20 min","eq":"Cazo · Bol","diet":["sg","sl","vt","lg"],"tipo":"completa","desc":"Garbanzos cocidos templados con verduras, salsa de tomate y huevo, con gazpacho y fruta.","nota":"Saltea las verduras con la salsa de tomate, añade los garbanzos y corona con el huevo. Gazpacho frío y fruta de postre.","comp":[
    {"f":"garbanzos","g":230,"note":"cocidos"},{"f":"huevo","g":55,"note":"1 ud"},
    {"f":"tomate_triturado","g":80,"fx":true},{"f":"lechuga","g":100,"fx":true},{"f":"tomate","g":100,"fx":true},{"f":"pepino","g":80,"fx":true},
    {"f":"aceite_de_oliva","g":10,"fx":true},{"f":"gazpacho","g":200,"fx":true},{"f":"fruta_temporada","g":150,"fx":true},
    {"f":"especias","cs":true,"as":"Sal, pimienta y comino"}]},

  {"cat":"com","nom":"Bacalao con guisantes y arroz","short":"Bacalao, guisantes y arroz","icon":"🐟","t":"30 min","eq":"Cazuela","diet":["sg","sl","ps","lg"],"tipo":"completa","desc":"Bacalao desalado guisado con guisantes, arroz y verduras.","nota":"Sofríe cebolla y pimiento, añade guisantes y arroz con caldo, y termina con el bacalao 8-10 min.","comp":[
    {"f":"bacalao","g":180,"note":"desalado"},{"f":"arroz_integral_cocido","g":180,"note":"cocido"},
    {"f":"guisantes","g":150,"fx":true},{"f":"cebolla","g":60,"fx":true},{"f":"pimiento_rojo","g":80,"fx":true},
    {"f":"aceite_de_oliva","g":10,"fx":true},{"f":"especias","cs":true,"as":"Ajo, pimentón, sal y perejil"}]},

  {"cat":"com","nom":"Pescado blanco con verduras y patata","short":"Pescado blanco y patata","icon":"🐟","t":"25 min","eq":"Horno · Cazo","diet":["sg","sl","ps"],"tipo":"completa","desc":"Merluza o lenguado al horno con patata y verduras.","nota":"Hornea el pescado con la patata en rodajas y las verduras, regado con AOVE, 20 min a 180°C.","comp":[
    {"f":"merluza","g":180},{"f":"patata","g":200},
    {"f":"zanahoria","g":100,"fx":true},{"f":"calabacin","g":100,"fx":true},{"f":"cebolla","g":50,"fx":true},
    {"f":"aceite_de_oliva","g":10,"fx":true},{"f":"especias","cs":true,"as":"Limón, ajo, sal y perejil"}]},

  {"cat":"com","nom":"Potaje de garbanzos con bacalao","short":"Potaje garbanzos y bacalao","icon":"🥘","t":"40 min","eq":"Olla","diet":["sg","sl","ps","lg"],"tipo":"completa","desc":"Potaje tradicional de garbanzos con bacalao desalado, patata y verduras.","nota":"Sofríe la verdura, añade garbanzos, patata y bacalao, cubre con caldo y cuece 30 min.","comp":[
    {"f":"garbanzos","g":220,"note":"cocidos"},{"f":"bacalao","g":140,"note":"desalado"},{"f":"patata","g":120},
    {"f":"zanahoria","g":80,"fx":true},{"f":"cebolla","g":60,"fx":true},{"f":"pimiento_rojo","g":60,"fx":true},{"f":"espinaca","g":60,"fx":true},
    {"f":"aceite_de_oliva","g":10,"fx":true},{"f":"especias","cs":true,"as":"Ajo, pimentón, laurel y sal"}]},

  {"cat":"com","nom":"Pescado azul con quinoa y verduras","short":"Pescado azul y quinoa","icon":"🐠","t":"20 min","eq":"Plancha · Cazo","diet":["sg","sl","ps"],"tipo":"completa","desc":"Trucha o salmón a la plancha con quinoa y verduras salteadas.","nota":"Cuece la quinoa, saltea las verduras y marca el pescado 3-4 min por lado.","comp":[
    {"f":"salmon","g":160},{"f":"quinoa","g":65,"note":"60 g en seco"},
    {"f":"esparragos","g":150,"fx":true},{"f":"calabacin","g":100,"fx":true},{"f":"cebolla_morada","g":60,"fx":true},
    {"f":"aceite_de_oliva","g":5,"fx":true},{"f":"especias","cs":true,"as":"Limón, sal y pimienta"}]},

  /* ── CENAS ── */
  {"cat":"cen","nom":"Guisantes con jamón y ensalada","short":"Guisantes con jamón","icon":"🟢","t":"15 min","eq":"Sartén","diet":["sg","sl","cn","lg"],"tipo":"completa","desc":"Guisantes salteados con jamón serrano y ensalada de acompañamiento.","nota":"Saltea los guisantes con un poco de cebolla y el jamón en taquitos. Sirve con ensalada.","comp":[
    {"f":"guisantes","g":200},{"f":"jamon_serrano","g":60},
    {"f":"cebolla","g":40,"fx":true},{"f":"lechuga","g":60,"fx":true},{"f":"tomate","g":100,"fx":true},
    {"f":"aceite_de_oliva","g":8,"fx":true},{"f":"especias","cs":true,"as":"Sal y pimienta"}]},

  {"cat":"cen","nom":"Ensalada templada de pollo, huevo y pasta","short":"Pollo, huevo y pasta","icon":"🥗","t":"20 min","eq":"Olla · Plancha","diet":["cn"],"tipo":"completa","desc":"Ensalada templada con pollo a la plancha, pasta, huevo y verduras crudas.","nota":"Cuece la pasta y el huevo, marca el pollo y mezcla con las verduras y un chorrito de AOVE.","comp":[
    {"f":"pechuga_de_pollo","g":120},{"f":"pasta_integral_cocida","g":150,"note":"cocida"},{"f":"huevo","g":55,"note":"1 ud"},
    {"f":"lechuga","g":80,"fx":true},{"f":"tomate","g":100,"fx":true},{"f":"pepino","g":60,"fx":true},{"f":"zanahoria","g":60,"fx":true},
    {"f":"aceite_de_oliva","g":5,"fx":true},{"f":"especias","cs":true,"as":"Sal, pimienta y orégano"}]},

  {"cat":"cen","nom":"Ensalada completa con jamón, huevo y queso","short":"Ensalada completa","icon":"🥗","t":"15 min","eq":"Cazo · Bol","diet":["cn"],"tipo":"completa","desc":"Ensalada de verduras con jamón, huevos, claras y queso fresco, con pan integral.","nota":"Cuece los huevos, monta la ensalada con el jamón, el queso fresco en dados y las claras. Pan tostado aparte.","comp":[
    {"f":"huevo","g":110,"note":"2 ud"},{"f":"clara_de_huevo","g":60},{"f":"jamon_serrano","g":40},{"f":"queso_fresco","g":60},{"f":"pan_integral","g":30},
    {"f":"lechuga","g":100,"fx":true},{"f":"tomate","g":120,"fx":true},{"f":"zanahoria","g":80,"fx":true},{"f":"pepino","g":60,"fx":true},
    {"f":"aceite_de_oliva","g":8,"fx":true},{"f":"especias","cs":true,"as":"Sal, pimienta y vinagre"}]},

  {"cat":"cen","nom":"Wrap de ternera con verduras y queso","short":"Wrap de ternera","icon":"🌯","t":"15 min","eq":"Plancha","diet":["cn"],"tipo":"completa","desc":"Wrap integral relleno de ternera magra a la plancha, verduras, queso y salsa de yogur.","nota":"Marca la ternera, calienta el wrap, rellena con las verduras, el queso y una cucharada de salsa de yogur.","comp":[
    {"f":"tortilla_integral","g":60,"note":"1 wrap"},{"f":"ternera_magra","g":110},{"f":"queso_curado","g":25},
    {"f":"lechuga","g":60,"fx":true},{"f":"tomate","g":80,"fx":true},{"f":"cebolla_morada","g":30,"fx":true},{"f":"yogur_natural","g":40,"fx":true,"note":"salsa"},
    {"f":"especias","cs":true,"as":"Sal, pimienta y comino"}]},

  {"cat":"cen","nom":"Tortilla rápida con ensalada y gazpacho","short":"Tortilla y ensalada","icon":"🍳","t":"12 min","eq":"Sartén","diet":["vt"],"tipo":"completa","desc":"Tortilla de huevos y claras con queso, ensalada, gazpacho y pan integral.","nota":"Bate los huevos con las claras, cuaja la tortilla con el queso y sirve con ensalada, gazpacho frío y pan.","comp":[
    {"f":"huevo","g":110,"note":"2 ud"},{"f":"clara_de_huevo","g":120},{"f":"queso_curado","g":25},{"f":"pan_integral","g":30},
    {"f":"lechuga","g":80,"fx":true},{"f":"tomate","g":120,"fx":true},{"f":"pepino","g":60,"fx":true},{"f":"gazpacho","g":200,"fx":true},
    {"f":"especias","cs":true,"as":"Sal y pimienta"}]},

  {"cat":"cen","nom":"Tortilla de queso y jamón con verduras y gazpacho","short":"Tortilla queso y jamón","icon":"🍳","t":"14 min","eq":"Sartén","diet":["cn"],"tipo":"completa","desc":"Tortilla de huevos y claras con queso y jamón, verduras salteadas, gazpacho y pan.","nota":"Cuaja la tortilla con el queso y el jamón, acompaña con verduras a la plancha, gazpacho y pan integral.","comp":[
    {"f":"huevo","g":110,"note":"2 ud"},{"f":"clara_de_huevo","g":100},{"f":"queso_curado","g":25},{"f":"jamon_serrano","g":40},{"f":"pan_integral","g":30},
    {"f":"calabacin","g":100,"fx":true},{"f":"cebolla","g":50,"fx":true},{"f":"pimiento_rojo","g":60,"fx":true},{"f":"gazpacho","g":200,"fx":true},
    {"f":"especias","cs":true,"as":"Sal y pimienta"}]},

  {"cat":"cen","nom":"Falso kebab casero de pollo","short":"Falso kebab de pollo","icon":"🌯","t":"18 min","eq":"Plancha","diet":["cn"],"tipo":"completa","desc":"Pan de pita integral con pollo especiado, verduras y salsa de yogur.","nota":"Marca el pollo en tiras con especias, calienta la pita y rellena con verduras y salsa de yogur.","comp":[
    {"f":"pan_pita_integral","g":70,"note":"1 pita"},{"f":"pechuga_de_pollo","g":120},
    {"f":"lechuga","g":80,"fx":true},{"f":"tomate","g":100,"fx":true},{"f":"cebolla_morada","g":30,"fx":true},{"f":"yogur_natural","g":50,"fx":true,"note":"salsa"},
    {"f":"especias","cs":true,"as":"Comino, pimentón, ajo y sal"}]}
];

RECIPES_JUNIO.forEach((r, i)=>{
  const id = 'RJ' + String(i + 1).padStart(3, '0');
  if(!DISHES[id]){
    DISHES[id] = Object.assign({ tags:[], food:[], tipo:null, t:'—', eq:'—', desc:'', nota:'—' }, r);
  }
});

window.RECIPES_JUNIO = RECIPES_JUNIO;
