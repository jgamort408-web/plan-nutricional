/* ══════════════════════════════════════════════════════════
   MENU RECIPES COMP · composición de las 39 recetas base
   ─────────────────────────────────────────────────────────
   Convierte las recetas originales (C/D/M/N), que tenían kcal
   fijos A/B, a COMPOSICIÓN real de alimentos (ración estándar
   de adulto, columna A del plan). Así TODO el catálogo usa el
   mismo modelo y escala por necesidad de cada persona/comida.
   recomputeAllComp() (menu-foods.js) recalcula kcal/macros/ing.
   Bases: legumbres/arroz/pasta = peso COCIDO; carnes/pescados/
   quinoa/avena = peso en crudo (igual que su alimento en FOODS).
   Scalable = núcleo energético (proteína + carbohidrato);
   fx = verdura, aceite, salsas frías, fruta, toppings; cs = al gusto.
   depende de DISHES (menu-data.js) y FOODS (menu-foods.js).
══════════════════════════════════════════════════════════ */
const RECIPES_COMP = {
  /* ── DESAYUNOS ── */
  D1:[{"f":"pan_integral","g":58},{"f":"huevo","g":131,"note":"3 ud"},{"f":"aceite_de_oliva","g":7,"fx":true},{"f":"tomate","g":109,"fx":true},{"f":"fruta_temporada","g":109,"fx":true}],
  D2:[{"f":"pan_integral","g":62},{"f":"queso_fresco","g":62},{"f":"jamon_serrano","g":39},{"f":"tomate","g":116,"fx":true},{"f":"fruta_temporada","g":116,"fx":true}],
  D3:[{"f":"pan_integral","g":65},{"f":"salmon_ahumado","g":49},{"f":"huevo","g":81,"note":"2 ud"},{"f":"aguacate","g":41,"fx":true},{"f":"tomate","g":81,"fx":true},{"f":"fruta_temporada","g":122,"fx":true}],
  D4:[{"f":"pan_integral","g":72},{"f":"jamon_serrano","g":54},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"tomate","g":136,"fx":true},{"f":"fruta_temporada","g":136,"fx":true}],
  D5:[{"f":"pan_integral","g":72},{"f":"queso_curado","g":36},{"f":"aceite_de_oliva","g":7,"fx":true},{"f":"tomate","g":134,"fx":true},{"f":"fruta_temporada","g":134,"fx":true}],
  D6:[{"f":"avena","g":46},{"f":"proteina","g":23},{"f":"yogur_natural","g":116},{"f":"bebida_de_avena","g":77,"fx":true},{"f":"frutos_rojos","g":116,"fx":true},{"f":"fruta_temporada","g":116,"fx":true}],
  D7:[{"f":"pan_integral","g":61},{"f":"requeson_cottage_cheese","g":77},{"f":"sardinas_en_aceite_escurridas","g":61},{"f":"huevo","g":38,"note":"1 ud"},{"f":"tomate","g":77,"fx":true},{"f":"fruta_temporada","g":115,"fx":true}],
  D8:[{"f":"pan_integral","g":50},{"f":"huevo","g":113,"note":"3 ud"},{"f":"queso_curado","g":19},{"f":"aceite_de_oliva","g":5,"fx":true},{"f":"tomate","g":94,"fx":true},{"f":"fruta_temporada","g":94,"fx":true}],

  /* ── COMIDAS ── */
  C1:[{"f":"merluza","g":262,"note":"en crudo"},{"f":"patata","g":157},{"f":"calabacin","g":131,"fx":true},{"f":"brocoli","g":131,"fx":true},{"f":"pimiento_rojo","g":87,"fx":true},{"f":"aceite_de_oliva","g":13,"fx":true},{"f":"gazpacho","g":218,"fx":true},{"f":"fruta_temporada","g":131,"fx":true},{"f":"especias","cs":true,"as":"Limón, perejil y sal"}],
  C2:[{"f":"lentejas","g":152,"note":"cocidas"},{"f":"pechuga_de_pollo","g":101,"note":"en crudo"},{"f":"zanahoria","g":67,"fx":true},{"f":"cebolla","g":54,"fx":true},{"f":"pimiento_rojo","g":67,"fx":true},{"f":"tomate_triturado","g":67,"fx":true},{"f":"espinaca","g":54,"fx":true},{"f":"aceite_de_oliva","g":10,"fx":true},{"f":"salmorejo","g":135,"fx":true},{"f":"fruta_temporada","g":101,"fx":true},{"f":"especias","cs":true,"as":"Pimentón, laurel y ajo"}],
  C3:[{"f":"salmon","g":143,"note":"en crudo"},{"f":"quinoa","g":34,"note":"en seco"},{"f":"esparragos","g":115,"fx":true},{"f":"calabacin","g":86,"fx":true},{"f":"cebolla_morada","g":46,"fx":true},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"salmorejo","g":115,"fx":true},{"f":"fruta_temporada","g":86,"fx":true}],
  C4:[{"f":"garbanzos","g":182,"note":"cocidos"},{"f":"atun_al_natural","g":87,"note":"escurrido"},{"f":"pimiento_rojo","g":109,"fx":true},{"f":"espinaca","g":73,"fx":true},{"f":"pepino","g":58,"fx":true},{"f":"cebolla_morada","g":36,"fx":true},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"gazpacho","g":182,"fx":true},{"f":"fruta_temporada","g":109,"fx":true},{"f":"especias","cs":true,"as":"Limón y comino"}],
  C5:[{"f":"bacalao","g":236,"note":"desalado"},{"f":"calabacin","g":126,"fx":true},{"f":"berenjena","g":126,"fx":true},{"f":"pimiento_rojo","g":84,"fx":true},{"f":"cebolla","g":51,"fx":true},{"f":"tomate_triturado","g":126,"fx":true},{"f":"aceite_de_oliva","g":13,"fx":true},{"f":"salmorejo","g":169,"fx":true},{"f":"fruta_temporada","g":126,"fx":true},{"f":"especias","cs":true,"as":"Pimentón y ajo"}],
  C6:[{"f":"alubias_blancas_cocidas","g":191,"note":"cocidas"},{"f":"cerdo_lomo","g":114,"note":"en crudo"},{"f":"cebolla","g":61,"fx":true},{"f":"pimiento_verde","g":76,"fx":true},{"f":"zanahoria","g":61,"fx":true},{"f":"tomate_triturado","g":76,"fx":true},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"gazpacho","g":191,"fx":true},{"f":"fruta_temporada","g":114,"fx":true},{"f":"especias","cs":true,"as":"Pimentón, laurel y ajo"}],
  C7:[{"f":"alubias_blancas_cocidas","g":193,"note":"cocidas"},{"f":"bacalao","g":155,"note":"desalado"},{"f":"espinaca","g":116,"fx":true},{"f":"cebolla","g":62,"fx":true},{"f":"pimiento_verde","g":62,"fx":true},{"f":"tomate","g":77,"fx":true},{"f":"aceite_de_oliva","g":12,"fx":true},{"f":"gazpacho","g":193,"fx":true},{"f":"fruta_temporada","g":116,"fx":true},{"f":"especias","cs":true,"as":"Ajo y pimentón"}],
  C8:[{"f":"lentejas","g":174,"note":"cocidas"},{"f":"pavo_pechuga","g":116,"note":"en crudo"},{"f":"calabacin","g":116,"fx":true},{"f":"cebolla","g":78,"fx":true},{"f":"pimiento_rojo","g":78,"fx":true},{"f":"pasta_de_curry","g":12,"fx":true},{"f":"leche_de_coco_light","g":39,"fx":true},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"gazpacho","g":194,"fx":true},{"f":"fruta_temporada","g":116,"fx":true}],
  C9:[{"f":"ternera_magra","g":163,"note":"en crudo"},{"f":"patata","g":111},{"f":"zanahoria","g":74,"fx":true},{"f":"pimiento_rojo","g":74,"fx":true},{"f":"cebolla","g":59,"fx":true},{"f":"tomate_triturado","g":74,"fx":true},{"f":"vino_coccion","g":37,"fx":true},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"gazpacho","g":185,"fx":true},{"f":"fruta_temporada","g":111,"fx":true}],
  C10:[{"f":"garbanzos","g":144,"note":"cocidos"},{"f":"pechuga_de_pollo","g":103,"note":"en crudo"},{"f":"pimiento_rojo","g":86,"fx":true},{"f":"zanahoria","g":57,"fx":true},{"f":"cebolla_morada","g":34,"fx":true},{"f":"tomate","g":57,"fx":true},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"salmorejo","g":115,"fx":true},{"f":"fruta_temporada","g":86,"fx":true},{"f":"especias","cs":true,"as":"Comino y limón"}],
  C11:[{"f":"caballa","g":153,"note":"en crudo"},{"f":"brocoli","g":123,"fx":true},{"f":"patata","g":92},{"f":"pimiento_rojo","g":61,"fx":true},{"f":"cebolla","g":49,"fx":true},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"salmorejo","g":123,"fx":true},{"f":"fruta_temporada","g":92,"fx":true},{"f":"especias","cs":true,"as":"Limón y hierbas provenzales"}],
  C12:[{"f":"lentejas","g":134,"note":"cocidas"},{"f":"frijol_rojo_cocido","g":67,"note":"cocidas"},{"f":"tomate_triturado","g":89,"fx":true},{"f":"pimiento_rojo","g":89,"fx":true},{"f":"cebolla","g":45,"fx":true},{"f":"arroz_integral_cocido","g":125,"note":"cocido"},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"gazpacho","g":223,"fx":true},{"f":"fruta_temporada","g":134,"fx":true},{"f":"especias","cs":true,"as":"Comino, pimentón y ajo"}],

  /* ── MERIENDAS ── */
  M1:[{"f":"yogur_natural","g":112},{"f":"proteina","g":17},{"f":"fruta_temporada","g":84,"fx":true},{"f":"frutos_secos","g":20,"fx":true}],
  M2:[{"f":"pan_integral","g":32},{"f":"queso_de_cabra","g":32},{"f":"tomate","g":54,"fx":true},{"f":"fruta_temporada","g":81,"fx":true},{"f":"frutos_secos","g":11,"fx":true}],
  M3:[{"f":"hummus","g":45},{"f":"zanahoria","g":75,"fx":true},{"f":"pepino","g":60,"fx":true},{"f":"fruta_temporada","g":113,"fx":true},{"f":"frutos_secos","g":19,"fx":true}],
  M4:[{"f":"queso_fresco","g":69,"note":"batido"},{"f":"proteina","g":5},{"f":"fruta_temporada","g":52,"fx":true},{"f":"frutos_secos","g":12,"fx":true}],

  /* ── CENAS ── */
  N1:[{"f":"huevo","g":163,"note":"3 ud"},{"f":"espinaca","g":136,"fx":true},{"f":"queso_fresco","g":45,"fx":true},{"f":"aceite_de_oliva","g":7,"fx":true},{"f":"pepino","g":136,"fx":true},{"f":"cebolla_morada","g":36,"fx":true},{"f":"especias","cs":true,"as":"Limón y menta"}],
  N2:[{"f":"huevo","g":177,"note":"3 ud"},{"f":"aceite_de_oliva","g":8,"fx":true},{"f":"tomate","g":197,"fx":true},{"f":"mozzarella","g":59},{"f":"rucula","g":79,"fx":true},{"f":"especias","cs":true,"as":"Albahaca y sal en escamas"}],
  N3:[{"f":"calabaza","g":433,"fx":true},{"f":"cebolla","g":87,"fx":true},{"f":"caldo_vegetal","g":325,"fx":true},{"f":"jamon_serrano","g":65},{"f":"queso_fresco","g":32,"fx":true},{"f":"lechuga","g":162,"fx":true},{"f":"aceite_de_oliva","g":9,"fx":true},{"f":"especias","cs":true,"as":"Nuez moscada"}],
  N4:[{"f":"mejillon_sin_cascara","g":179,"note":"carne"},{"f":"queso_fresco","g":60,"fx":true},{"f":"espinaca","g":149,"fx":true},{"f":"pepino","g":149,"fx":true},{"f":"cebolla_morada","g":75,"fx":true},{"f":"aceite_de_oliva","g":12,"fx":true},{"f":"especias","cs":true,"as":"Vino blanco, laurel y limón"}],
  N5:[{"f":"gambas","g":124,"note":"peladas"},{"f":"huevo","g":99,"note":"2 ud"},{"f":"esparragos","g":124,"fx":true},{"f":"queso_fresco","g":41,"fx":true},{"f":"aceite_de_oliva","g":7,"fx":true},{"f":"tomate","g":124,"fx":true},{"f":"cebolla_morada","g":33,"fx":true},{"f":"especias","cs":true,"as":"Ajo y orégano"}],
  N6:[{"f":"ternera_magra","g":219,"note":"en crudo"},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"lechuga","g":109,"fx":true},{"f":"tomate","g":109,"fx":true},{"f":"cebolla_morada","g":55,"fx":true},{"f":"especias","cs":true,"as":"Ajo, romero y vinagre de Jerez"}],
  N7:[{"f":"patata","g":76},{"f":"huevo","g":114,"note":"2 ud"},{"f":"caldo_vegetal","g":380,"fx":true},{"f":"zanahoria","g":114,"fx":true},{"f":"puerro","g":76,"fx":true},{"f":"apio","g":47,"fx":true},{"f":"queso_parmesano","g":19,"fx":true},{"f":"aceite_de_oliva","g":8,"fx":true},{"f":"especias","cs":true,"as":"Perejil"}],
  N8:[{"f":"tortilla_integral","g":61,"note":"3 ud"},{"f":"merluza","g":137,"note":"en crudo"},{"f":"pimiento_rojo","g":102,"fx":true},{"f":"cebolla","g":55,"fx":true},{"f":"aguacate","g":34,"fx":true},{"f":"mozzarella","g":20,"fx":true},{"f":"aceite_de_oliva","g":7,"fx":true},{"f":"especias","cs":true,"as":"Comino y pimentón"}],
  N9:[{"f":"tortilla_integral","g":58,"note":"3 ud"},{"f":"pavo_pechuga","g":129,"note":"en crudo"},{"f":"pimiento_rojo","g":97,"fx":true},{"f":"cebolla","g":52,"fx":true},{"f":"mozzarella","g":19,"fx":true},{"f":"rucula","g":39,"fx":true},{"f":"aceite_de_oliva","g":6,"fx":true},{"f":"especias","cs":true,"as":"Comino y pimentón"}],
  N10:[{"f":"base_pizza_integral","g":76},{"f":"pechuga_de_pollo","g":76,"note":"cocido"},{"f":"mozzarella","g":46},{"f":"tomate_triturado","g":61,"fx":true},{"f":"champinones","g":76,"fx":true},{"f":"pimiento_rojo","g":38,"fx":true},{"f":"cebolla","g":38,"fx":true},{"f":"aceite_de_oliva","g":4,"fx":true},{"f":"especias","cs":true,"as":"Orégano"}],
  N11:[{"f":"tortilla_integral","g":42,"note":"2 ud"},{"f":"pechuga_de_pollo","g":108,"note":"en crudo"},{"f":"hummus","g":36,"fx":true},{"f":"aguacate","g":36,"fx":true},{"f":"lechuga","g":36,"fx":true},{"f":"tomate","g":30,"fx":true},{"f":"pepino","g":24,"fx":true},{"f":"queso_fresco","g":24,"fx":true}],
  N12:[{"f":"dorada","g":221,"note":"en crudo"},{"f":"patata","g":121},{"f":"calabacin","g":151,"fx":true},{"f":"zanahoria","g":100,"fx":true},{"f":"manzana","g":80,"fx":true},{"f":"aceite_de_oliva","g":10,"fx":true},{"f":"especias","cs":true,"as":"Limón, comino y hierbas"}],
  N13:[{"f":"tortilla_integral","g":49,"note":"3 ud"},{"f":"pechuga_de_pollo","g":109,"note":"en crudo"},{"f":"pimiento_rojo","g":82,"fx":true},{"f":"cebolla","g":44,"fx":true},{"f":"aguacate","g":33,"fx":true},{"f":"mozzarella","g":16,"fx":true},{"f":"aceite_de_oliva","g":5,"fx":true},{"f":"especias","cs":true,"as":"Comino, pimentón y limón"}],
  N14:[{"f":"pechuga_de_pollo","g":132,"note":"en crudo"},{"f":"pan_integral","g":29,"note":"picatostes"},{"f":"lechuga","g":110,"fx":true},{"f":"tomate","g":74,"fx":true},{"f":"queso_parmesano","g":18,"fx":true},{"f":"aceite_de_oliva","g":11,"fx":true},{"f":"especias","cs":true,"as":"Limón, mostaza y ajo"}],
  N15:[{"f":"crepes_integrales","g":82},{"f":"requeson_cottage_cheese","g":123},{"f":"espinaca","g":153,"fx":true},{"f":"queso_fresco","g":31,"fx":true},{"f":"tomate","g":82,"fx":true},{"f":"aceite_de_oliva","g":8,"fx":true},{"f":"especias","cs":true,"as":"Ajo, albahaca y pimienta"}]
};

if(typeof DISHES !== 'undefined'){
  Object.entries(RECIPES_COMP).forEach(([id, comp])=>{ if(DISHES[id]) DISHES[id].comp = comp; });
}
window.RECIPES_COMP = RECIPES_COMP;
