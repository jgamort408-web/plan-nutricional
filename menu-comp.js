/* ══════════════════════════════════════════════════════════
   MENU COMP · composición de cada receta del plan en ALIMENTOS
   ─────────────────────────────────────────────────────────
   Reformulado sobre la base de alimentos ampliada (menu-foods.js).
   Cada receta es una lista de items:
     {f:'foodId', g:gramos}      · {f:'foodId', u:unidades}
     {f:'foodId', cs:true}       (cantidad suficiente / al gusto)
   opcionales: as:'nombre a mostrar', note:'crudo / escurrido…', fx:bool
   Cantidades = ración de referencia ≈ A. menu-foods.js recalcula
   kcal/macros y ESCALA a A y B según el objetivo de cada comida.
   Legumbres y arroz van en COCIDO (valores cocidos en la base).
   depende de DISHES (menu-data.js) y recomputeAllComp (menu-foods.js)
══════════════════════════════════════════════════════════ */
const RECIPE_COMP = {
  /* ── DESAYUNOS ── */
  D1:[{f:'pan_integral',g:80},{f:'huevo',u:3},{f:'aceite_de_oliva',g:10},{f:'tomate',g:150,as:'Tomate en rodajas'},{f:'fruta_temporada',g:150}],
  D2:[{f:'pan_integral',g:80},{f:'queso_fresco',g:80},{f:'jamon_serrano',g:50},{f:'tomate',g:150,as:'Tomate en rodajas'},{f:'fruta_temporada',g:150}],
  D3:[{f:'pan_integral',g:80},{f:'salmon_ahumado',g:60},{f:'huevo',u:2,note:'cocido'},{f:'aguacate',g:50},{f:'tomate',g:100},{f:'fruta_temporada',g:150}],
  D4:[{f:'pan_integral',g:80},{f:'jamon_serrano',g:60},{f:'aceite_de_oliva',g:10},{f:'tomate',g:150,as:'Tomate frotado'},{f:'fruta_temporada',g:150}],
  D5:[{f:'pan_integral',g:80},{f:'queso_curado',g:40,as:'Queso curado (láminas)'},{f:'aceite_de_oliva',g:8},{f:'tomate',g:150},{f:'fruta_temporada',g:150}],
  D6:[{f:'avena',g:60},{f:'proteina',u:1},{f:'yogur_natural',g:150},{f:'bebida_de_avena',g:100},{f:'frutos_rojos',g:150},{f:'fruta_temporada',g:150}],
  D7:[{f:'pan_integral',g:80},{f:'requeson_cottage_cheese',g:100,as:'Requesón / cottage'},{f:'sardinas_en_aceite_escurridas',g:80,note:'escurridas'},{f:'huevo',u:1,note:'cocido'},{f:'tomate',g:100},{f:'fruta_temporada',g:150}],
  D8:[{f:'pan_integral',g:80},{f:'huevo',u:3},{f:'queso_curado',g:30,as:'Queso curado rallado'},{f:'aceite_de_oliva',g:8},{f:'tomate',g:150},{f:'fruta_temporada',g:150}],

  /* ── COMIDAS ── */
  C1:[{f:'merluza',g:300,note:'crudo'},{f:'patata',g:180,note:'crudo'},{f:'calabacin',g:150},{f:'brocoli',g:150},{f:'pimiento_rojo',g:100},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Limón, perejil y sal'},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C2:[{f:'lentejas',g:220,note:'cocidas'},{f:'pechuga_de_pollo',g:150,note:'crudo'},{f:'zanahoria',g:100},{f:'cebolla',g:80},{f:'pimiento_rojo',g:100},{f:'tomate_triturado',g:100},{f:'espinaca',g:80},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Pimentón, laurel y ajo'},{f:'salmorejo',g:200},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C3:[{f:'salmon',g:250,note:'crudo'},{f:'quinoa',g:60,note:'cruda'},{f:'esparragos',g:200},{f:'calabacin',g:150},{f:'cebolla_morada',g:80},{f:'aceite_de_oliva',g:15},{f:'salmorejo',g:200},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C4:[{f:'garbanzos',g:250,note:'cocidos · 1 bote escurrido'},{f:'atun_al_natural',g:120,note:'escurrido'},{f:'pimiento_rojo',g:150,as:'Pimiento asado'},{f:'espinaca',g:100,as:'Espinacas baby'},{f:'pepino',g:80},{f:'cebolla_morada',g:50},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Limón y comino'},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C5:[{f:'bacalao',g:280,note:'desalado'},{f:'calabacin',g:150},{f:'berenjena',g:150},{f:'pimiento_rojo',g:100},{f:'cebolla',g:60},{f:'tomate_triturado',g:150},{f:'ajo',cs:true},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Pimentón'},{f:'salmorejo',g:200},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C6:[{f:'alubias_blancas_cocidas',g:250,note:'cocidas'},{f:'cerdo_lomo',g:150,note:'crudo'},{f:'cebolla',g:80},{f:'pimiento_verde',g:100},{f:'zanahoria',g:80},{f:'tomate_triturado',g:100},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Pimentón, laurel y ajo'},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C7:[{f:'alubias_blancas_cocidas',g:250,note:'cocidas'},{f:'bacalao',g:200,note:'desalado'},{f:'espinaca',g:150},{f:'cebolla',g:80},{f:'pimiento_verde',g:80},{f:'tomate',g:100},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Ajo y pimentón'},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C8:[{f:'lentejas',g:220,note:'cocidas'},{f:'pavo_pechuga',g:150,note:'crudo'},{f:'calabacin',g:150},{f:'cebolla',g:100},{f:'pimiento_rojo',g:100},{f:'pasta_de_curry',g:20},{f:'leche_de_coco_light',g:50},{f:'aceite_de_oliva',g:12},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C9:[{f:'ternera_magra',g:220,note:'crudo'},{f:'patata',g:150,note:'crudo'},{f:'zanahoria',g:100},{f:'pimiento_rojo',g:100},{f:'cebolla',g:80},{f:'tomate_triturado',g:100},{f:'vino_coccion',g:50,as:'Vino tinto (cocción)'},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Laurel'},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C10:[{f:'garbanzos',g:250,note:'cocidos · 1 bote escurrido'},{f:'pechuga_de_pollo',g:180,note:'crudo'},{f:'pimiento_rojo',g:150,as:'Pimiento asado'},{f:'zanahoria',g:100},{f:'cebolla_morada',g:60},{f:'tomate',g:100,as:'Tomate cherry'},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Comino y limón'},{f:'salmorejo',g:200},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C11:[{f:'caballa',g:250,note:'crudo'},{f:'brocoli',g:200},{f:'patata',g:150,note:'crudo'},{f:'pimiento_rojo',g:100},{f:'cebolla',g:80},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Limón y hierbas provenzales'},{f:'salmorejo',g:200},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],
  C12:[{f:'lentejas',g:150,note:'cocidas'},{f:'frijol_rojo_cocido',g:100,note:'cocido'},{f:'tomate_triturado',g:100},{f:'pimiento_rojo',g:100},{f:'cebolla',g:50},{f:'arroz_integral_cocido',g:110,note:'cocido'},{f:'especias',cs:true,as:'Comino, pimentón y ajo'},{f:'aceite_de_oliva',g:12},{f:'gazpacho',g:250},{f:'fruta_temporada',g:150,as:'Fruta de postre'}],

  /* ── MERIENDAS ── */
  M1:[{f:'yogur_natural',g:200},{f:'proteina',u:1},{f:'fruta_temporada',g:150},{f:'frutos_secos',g:35,as:'Frutos secos (almendras/pistachos)'}],
  M2:[{f:'pan_integral',g:60},{f:'queso_de_cabra',g:60},{f:'tomate',g:100,as:'Tomate cherry'},{f:'fruta_temporada',g:150},{f:'frutos_secos',g:20}],
  M3:[{f:'hummus',g:60},{f:'zanahoria',g:100,as:'Zanahoria en bastones'},{f:'pepino',g:80},{f:'fruta_temporada',g:150},{f:'frutos_secos',g:25}],
  M4:[{f:'queso_fresco_0',g:200,as:'Queso fresco 0% / cottage'},{f:'fruta_temporada',g:150},{f:'frutos_secos',g:35},{f:'proteina',g:15}],

  /* ── CENAS ── */
  N1:[{f:'huevo',u:3},{f:'espinaca',g:150},{f:'queso_fresco',g:50,as:'Queso fresco (topping)'},{f:'aceite_de_oliva',g:13},{f:'pepino',g:150},{f:'cebolla_morada',g:40},{f:'especias',cs:true,as:'Limón y menta'}],
  N2:[{f:'huevo',u:3},{f:'aceite_de_oliva',g:13},{f:'tomate',g:200,as:'Tomate caprese'},{f:'mozzarella',g:60},{f:'especias',cs:true,as:'Albahaca'},{f:'rucula',g:80,as:'Espinacas baby / rúcula'}],
  N3:[{f:'calabaza',g:400},{f:'cebolla',g:80},{f:'caldo_vegetal',g:300},{f:'aceite_de_oliva',g:8},{f:'especias',cs:true,as:'Nuez moscada'},{f:'jamon_serrano',g:60,as:'Jamón serrano (crujiente)'},{f:'queso_fresco',g:30},{f:'lechuga',g:150,as:'Ensalada verde'}],
  N4:[{f:'mejillon_sin_cascara',g:120,note:'≈300 g con concha'},{f:'vino_coccion',cs:true,as:'Vino blanco y laurel'},{f:'queso_fresco',g:40},{f:'espinaca',g:100,as:'Espinacas baby'},{f:'pepino',g:100},{f:'cebolla_morada',g:50},{f:'aceite_de_oliva',g:8},{f:'especias',cs:true,as:'Limón y sal marina'}],
  N5:[{f:'gambas',g:150,note:'crudo'},{f:'esparragos',g:150},{f:'huevo',u:2},{f:'queso_fresco_0',g:50},{f:'aceite_de_oliva',g:8},{f:'ajo',cs:true},{f:'tomate',g:150},{f:'cebolla_morada',g:40},{f:'especias',cs:true,as:'Orégano'}],
  N6:[{f:'ternera_magra',g:200,note:'crudo'},{f:'aceite_de_oliva',g:10},{f:'ajo',cs:true},{f:'lechuga',g:100},{f:'tomate',g:100},{f:'cebolla_morada',g:50},{f:'especias',cs:true,as:'Romero y vinagre de Jerez'}],
  N7:[{f:'caldo_vegetal',g:400},{f:'zanahoria',g:130,as:'Juliana de zanahoria'},{f:'puerro',g:70},{f:'apio',g:50},{f:'patata',g:80,note:'crudo'},{f:'huevo',u:2,as:'Huevo pochado'},{f:'aceite_de_oliva',g:8},{f:'queso_parmesano',g:20},{f:'especias',cs:true,as:'Perejil'}],
  N8:[{f:'tortilla_integral',u:3},{f:'merluza',g:200,note:'crudo'},{f:'pimiento_rojo',g:100},{f:'pimiento_verde',g:50},{f:'cebolla',g:80},{f:'aguacate',g:50},{f:'queso_curado',g:30,as:'Queso rallado'},{f:'aceite_de_oliva',g:10},{f:'especias',cs:true,as:'Comino y pimentón'}],
  N9:[{f:'tortilla_integral',u:3},{f:'pavo_pechuga',g:200,note:'crudo'},{f:'pimiento_rojo',g:100},{f:'pimiento_verde',g:50},{f:'cebolla',g:80},{f:'queso_curado',g:30,as:'Queso rallado'},{f:'rucula',g:60,as:'Rúcula (opcional)'},{f:'aceite_de_oliva',g:10},{f:'especias',cs:true,as:'Comino y pimentón'}],
  N10:[{f:'base_pizza_integral',g:100},{f:'tomate_triturado',g:80},{f:'pechuga_de_pollo',g:100,as:'Pollo / pavo cocido'},{f:'mozzarella',g:60},{f:'pimiento_rojo',g:75},{f:'champinones',g:75},{f:'cebolla',g:50,as:'Cebolla (opcional)'},{f:'aceite_de_oliva',g:5},{f:'especias',cs:true,as:'Orégano'}],
  N11:[{f:'tortilla_integral',u:2,as:'Tortilla integral grande'},{f:'pechuga_de_pollo',g:180,note:'crudo'},{f:'hummus',g:60},{f:'aguacate',g:60},{f:'lechuga',g:60},{f:'tomate',g:50},{f:'pepino',g:40},{f:'queso_fresco',g:40}],
  N12:[{f:'dorada',g:220,note:'crudo'},{f:'calabacin',g:150},{f:'patata',g:120,note:'crudo'},{f:'aceite_de_oliva',g:15},{f:'zanahoria',g:100,as:'Zanahoria rallada'},{f:'manzana',g:80,as:'Manzana verde rallada'},{f:'especias',cs:true,as:'Limón, comino y hierbas'}],
  N13:[{f:'tortilla_integral',u:3},{f:'pechuga_de_pollo',g:200,note:'crudo'},{f:'pimiento_rojo',g:100},{f:'pimiento_verde',g:50},{f:'cebolla',g:80},{f:'aguacate',g:60,as:'Aguacate (guacamole)'},{f:'queso_curado',g:30,as:'Queso rallado'},{f:'aceite_de_oliva',g:10},{f:'especias',cs:true,as:'Comino y pimentón'}],
  N14:[{f:'pechuga_de_pollo',g:180,note:'crudo'},{f:'lechuga',g:150,as:'Lechuga romana'},{f:'tomate',g:100,as:'Tomate cherry'},{f:'queso_parmesano',g:25},{f:'pan_integral',g:40,as:'Picatostes integrales'},{f:'aceite_de_oliva',g:15},{f:'especias',cs:true,as:'Limón, mostaza y ajo'}],
  N15:[{f:'crepes_integrales',g:80},{f:'requeson_cottage_cheese',g:120},{f:'espinaca',g:150},{f:'queso_fresco',g:30,as:'Queso fresco / cottage'},{f:'aceite_de_oliva',g:8},{f:'ajo',cs:true},{f:'tomate',g:80,as:'Tomate cherry'},{f:'especias',cs:true,as:'Albahaca y pimienta'}]
};

/* Inyecta la composición en cada plato del catálogo base */
Object.entries(RECIPE_COMP).forEach(([id, comp])=>{
  if(DISHES[id]) DISHES[id].comp = comp;
});

window.RECIPE_COMP = RECIPE_COMP;
