/* ══════════════════════════════════════════════════════════
   MENU FOODS · base de datos de alimentos + motor de cálculo
   ─────────────────────────────────────────────────────────
   · FOODS_BASE: tabla de composición (kcal y macros por 100 g,
     criterio tipo BEDCA / USDA). Algunos llevan equivalencia por
     UNIDAD (1 huevo ≈ 60 g, 1 cucharada AOVE ≈ 10 g…).
   · FOODS_EXTRA: alimentos "compuestos / preparados" que usan las
     recetas del plan (gazpacho, caldo, tortilla integral, etc.).
   · FOODS = base + extra + alimentos del usuario (localStorage).
   · Las recetas (menu-comp.js) se definen como COMPOSICIÓN de
     estos alimentos y se ESCALAN a A y B por comida.
   Reparto del día: Desayuno 25 · Comida 35 · Merienda 15 · Cena 25
   depende de globals de menu-data.js (TARGETS)
══════════════════════════════════════════════════════════ */

/* Secciones de supermercado — para agrupar la lista de la compra */
const FOOD_SECTIONS = {
  verd: {lbl:'Verdura y hortalizas', ico:'🥬', order:1},
  fruta:{lbl:'Fruta',                ico:'🍎', order:2},
  carn: {lbl:'Carnicería',           ico:'🥩', order:3},
  pesc: {lbl:'Pescadería',           ico:'🐟', order:4},
  lact: {lbl:'Lácteos y huevos',     ico:'🧀', order:5},
  pan:  {lbl:'Panadería y cereales', ico:'🍞', order:6},
  desp: {lbl:'Despensa',             ico:'🫙', order:7}
};

/* Reparto de las kcal del día por comida (suma = 1) */
const MEAL_PCT = {des:0.25, com:0.35, mer:0.15, cen:0.25};

/* ── BASE DE ALIMENTOS (valores por 100 g) ────────────────── */
const FOODS_BASE = {
"arroz_blanco": {"name":"Arroz blanco","sec":"pan","kcal":130,"p":2.7,"f":0.3,"c":28.2,"ft":["apq"]},
"avena": {"name":"Avena","sec":"pan","kcal":389,"p":16.9,"f":6.9,"c":66.3,"ft":["apq"]},
"trigo": {"name":"Trigo","sec":"pan","kcal":339,"p":13.2,"f":1.5,"c":71.2,"ft":["apq"]},
"maiz": {"name":"Maíz","sec":"pan","kcal":365,"p":9.4,"f":4.7,"c":74.3,"ft":["apq"]},
"patata": {"name":"Patata","sec":"pan","kcal":77,"p":2,"f":0.1,"c":17.5,"ft":["apq"],"unit":{"lbl":"unidad pequeña","g":100}},
"batata": {"name":"Batata","sec":"pan","kcal":86,"p":1.6,"f":0.1,"c":20.1,"ft":["apq"]},
"boniato": {"name":"Boniato","sec":"pan","kcal":86,"p":1.6,"f":0.1,"c":20.1,"ft":["apq"],"unit":{"lbl":"unidad mediana","g":160}},
"lentejas": {"name":"Lentejas cocidas","sec":"desp","kcal":116,"p":9,"f":0.4,"c":20,"ft":["leg"]},
"garbanzos": {"name":"Garbanzos cocidos","sec":"desp","kcal":164,"p":8.9,"f":2.6,"c":27.4,"ft":["leg"]},
"judias": {"name":"Judías cocidas","sec":"desp","kcal":127,"p":8.7,"f":0.5,"c":16.4,"ft":["leg"]},
"haba": {"name":"Haba cocida","sec":"desp","kcal":88,"p":7.6,"f":0.4,"c":14.1,"ft":["leg"]},
"guisantes": {"name":"Guisantes","sec":"desp","kcal":81,"p":5.4,"f":0.4,"c":14.5,"ft":["leg"]},
"guisante_verde_cocido": {"name":"Guisante verde cocido","sec":"desp","kcal":81,"p":5.4,"f":0.4,"c":14.5,"ft":["leg"]},
"frijol_negro_cocido": {"name":"Frijol negro cocido","sec":"desp","kcal":132,"p":8.9,"f":0.5,"c":23.7,"ft":["leg"]},
"frijol_rojo_cocido": {"name":"Frijol rojo cocido","sec":"desp","kcal":127,"p":8.7,"f":0.5,"c":22.8,"ft":["leg"]},
"alubias_blancas_cocidas": {"name":"Alubias blancas cocidas","sec":"desp","kcal":114,"p":7.3,"f":0.6,"c":20,"ft":["leg"]},
"alubias_pintas_cocidas": {"name":"Alubias pintas cocidas","sec":"desp","kcal":127,"p":8.7,"f":0.5,"c":22.8,"ft":["leg"]},
"harina_de_garbanzo": {"name":"Harina de garbanzo","sec":"desp","kcal":387,"p":22.4,"f":6.7,"c":57.8,"ft":["leg"]},
"altramuz_seco": {"name":"Altramuz seco","sec":"desp","kcal":371,"p":36.2,"f":5.9,"c":30.2,"ft":["leg"]},
"quinoa": {"name":"Quinoa","sec":"pan","kcal":368,"p":14.1,"f":6.1,"c":64.2,"ft":["apq"]},
"mijo": {"name":"Mijo","sec":"pan","kcal":378,"p":11,"f":4.2,"c":72.8,"ft":["apq"]},
"cebada": {"name":"Cebada","sec":"pan","kcal":354,"p":12.5,"f":2.3,"c":73.5,"ft":["apq"]},
"espelta_grano": {"name":"Espelta en grano","sec":"pan","kcal":338,"p":15,"f":2.4,"c":70.2,"ft":["apq"]},
"trigo_sarraceno_grano": {"name":"Trigo sarraceno en grano","sec":"pan","kcal":343,"p":13.3,"f":3.4,"c":71.5,"ft":["apq"]},
"pasta_espagueti_cocida": {"name":"Pasta cocida","sec":"pan","kcal":158,"p":5.8,"f":0.9,"c":30.6,"ft":["apq"]},
"pasta_integral_cocida": {"name":"Pasta integral cocida","sec":"pan","kcal":149,"p":5.5,"f":1.1,"c":30.1,"ft":["apq"]},
"pasta_de_garbanzo": {"name":"Pasta de garbanzo","sec":"pan","kcal":387,"p":22.2,"f":6.3,"c":57.6,"ft":["leg","apq"]},
"pasta_legumbre": {"name":"Pasta de legumbre","sec":"pan","kcal":347,"p":25,"f":3,"c":55,"ft":["leg","apq"]},
"cuscus_integral_cocido": {"name":"Cuscús integral cocido","sec":"pan","kcal":112,"p":3.8,"f":0.4,"c":21,"ft":["apq"]},
"semola_cuscus_clasico": {"name":"Sémola cuscús clásico","sec":"pan","kcal":360,"p":11.7,"f":1.2,"c":72,"ft":["apq"]},
"polenta_semola_de_maiz": {"name":"Polenta","sec":"pan","kcal":110,"p":5,"f":1,"c":23,"ft":["apq"]},
"arroz_integral_cocido": {"name":"Arroz integral cocido","sec":"pan","kcal":111,"p":2.6,"f":1,"c":23.5,"ft":["apq"]},
"harina_de_trigo_blanca": {"name":"Harina de trigo blanca","sec":"pan","kcal":364,"p":10.3,"f":1.5,"c":76.3,"ft":["apq"]},
"arroz_inflado": {"name":"Arroz inflado","sec":"pan","kcal":389,"p":6.8,"f":0.6,"c":85,"ft":["apq"]},
"copos_de_maiz": {"name":"Copos de maíz","sec":"pan","kcal":357,"p":7.5,"f":0.4,"c":84,"ft":["apq"]},
"tortitas_arroz": {"name":"Tortitas de arroz","sec":"pan","kcal":387,"p":8,"f":2.8,"c":81.5,"ft":["apq"],"unit":{"lbl":"tortita","g":8}},
"biscotes": {"name":"Biscotes","sec":"pan","kcal":407,"p":12,"f":6,"c":72,"ft":["apq"],"unit":{"lbl":"unidad","g":10}},
"pan_integral": {"name":"Pan integral","sec":"pan","kcal":254,"p":12.3,"f":3.5,"c":43.1,"ft":["apq"],"unit":{"lbl":"rebanada","g":40}},
"pan_de_centeno": {"name":"Pan de centeno","sec":"pan","kcal":259,"p":8.5,"f":3.3,"c":48.3,"ft":["apq"],"unit":{"lbl":"rebanada","g":40}},
"pan_de_centeno_integral": {"name":"Pan de centeno integral","sec":"pan","kcal":259,"p":8.5,"f":3.3,"c":48.3,"ft":["apq"],"unit":{"lbl":"rebanada","g":40}},
"pan_pita_integral": {"name":"Pan pita integral","sec":"pan","kcal":275,"p":9,"f":2.5,"c":48,"ft":["apq"],"unit":{"lbl":"unidad","g":60}},
"pan_barra": {"name":"Pan de barra","sec":"pan","kcal":270,"p":8.5,"f":1.5,"c":56,"ft":["apq"],"unit":{"lbl":"rebanada","g":40}},
"pan_bimbo": {"name":"Pan de molde","sec":"pan","kcal":252,"p":8.5,"f":3.8,"c":49,"ft":["apq"],"unit":{"lbl":"rebanada","g":25}},
"tofu": {"name":"Tofu","sec":"desp","kcal":76,"p":8,"f":4.8,"c":1.9,"ft":["pv"],"unit":{"lbl":"bloque","g":250}},
"tofu_firme": {"name":"Tofu firme","sec":"desp","kcal":76,"p":8.1,"f":4.8,"c":1.9,"ft":["pv"],"unit":{"lbl":"bloque","g":250}},
"tempeh": {"name":"Tempeh","sec":"desp","kcal":193,"p":19,"f":11,"c":9.4,"ft":["pv"]},
"soja_texturizada_seca": {"name":"Soja texturizada seca","sec":"desp","kcal":335,"p":50,"f":1.5,"c":33,"ft":["pv"]},
"proteina": {"name":"Proteína en polvo","sec":"desp","kcal":372,"p":93,"f":1,"c":1.2,"ft":["pv"],"unit":{"lbl":"scoop","g":20}},
"leche_de_soja_sin_azucar": {"name":"Leche de soja sin azúcar","sec":"desp","kcal":45,"p":3.6,"f":1.8,"c":5.1,"ft":["pv"]},
"leche_de_almendra_sin_azucar": {"name":"Leche de almendra sin azúcar","sec":"desp","kcal":17,"p":0.4,"f":2.5,"c":0.3,"ft":["fs"]},
"pechuga_de_pollo": {"name":"Pechuga de pollo","sec":"carn","kcal":165,"p":31,"f":3.6,"c":0,"ft":["cb"]},
"muslo_de_pollo": {"name":"Muslo de pollo","sec":"carn","kcal":174,"p":17.4,"f":8.9,"c":0,"ft":["cb"]},
"pollo_entero": {"name":"Pollo entero","sec":"carn","kcal":215,"p":18.6,"f":15.1,"c":0,"ft":["cb"]},
"pavo_pechuga": {"name":"Pavo pechuga","sec":"carn","kcal":135,"p":29,"f":1.7,"c":0,"ft":["cb"]},
"pavo_fiambre": {"name":"Fiambre de pavo","sec":"carn","kcal":104,"p":17,"f":2,"c":2,"ft":["cb"]},
"jamon_cocido": {"name":"Jamón cocido","sec":"carn","kcal":100,"p":15,"f":3,"c":0.6,"ft":["cb"]},
"salchicha_de_pollo": {"name":"Salchicha de pollo","sec":"carn","kcal":170,"p":12,"f":12,"c":1.5,"ft":["cb"]},
"conejo": {"name":"Conejo","sec":"carn","kcal":136,"p":20,"f":5.6,"c":0,"ft":["cb"]},
"ternera": {"name":"Ternera","sec":"carn","kcal":250,"p":26.1,"f":17.2,"c":0,"ft":["cr"]},
"ternera_magra": {"name":"Ternera magra","sec":"carn","kcal":158,"p":21.5,"f":7.5,"c":0,"ft":["cr"]},
"ternera_chuleta": {"name":"Chuleta de ternera","sec":"carn","kcal":220,"p":20,"f":15,"c":0,"ft":["cr"]},
"cerdo": {"name":"Cerdo","sec":"carn","kcal":263,"p":21.2,"f":21.5,"c":0,"ft":["cr"]},
"cerdo_lomo": {"name":"Lomo de cerdo","sec":"carn","kcal":143,"p":21,"f":5,"c":0,"ft":["cr"]},
"cerdo_chuleta": {"name":"Chuleta de cerdo","sec":"carn","kcal":231,"p":23.7,"f":14.7,"c":0,"ft":["cr"]},
"jamon_serrano": {"name":"Jamón serrano","sec":"carn","kcal":241,"p":30.9,"f":15.4,"c":0,"ft":["js"]},
"lomo_embuchado": {"name":"Lomo embuchado","sec":"carn","kcal":380,"p":50,"f":20,"c":1,"ft":["js"]},
"panceta_ahumada": {"name":"Panceta ahumada","sec":"carn","kcal":541,"p":14,"f":45,"c":1,"ft":["cr"]},
"hamburguesa_ternera": {"name":"Hamburguesa de ternera","sec":"carn","kcal":254,"p":17.2,"f":20,"c":0,"ft":["cr"],"unit":{"lbl":"unidad","g":100}},
"carne_de_bisonte": {"name":"Carne de bisonte","sec":"carn","kcal":143,"p":28,"f":2.4,"c":0,"ft":["cr"]},
"merluza": {"name":"Merluza","sec":"pesc","kcal":82,"p":17.6,"f":0.3,"c":0,"ft":["pb"]},
"bacalao": {"name":"Bacalao","sec":"pesc","kcal":105,"p":24.5,"f":0.7,"c":0,"ft":["pb"]},
"pescado_blanco": {"name":"Pescado blanco","sec":"pesc","kcal":82,"p":18,"f":0.7,"c":0,"ft":["pb"]},
"trucha_arcoiris": {"name":"Trucha arcoíris","sec":"pesc","kcal":162,"p":20.8,"f":7.5,"c":0,"ft":["pa"]},
"salmon": {"name":"Salmón","sec":"pesc","kcal":208,"p":20,"f":13,"c":0,"ft":["pa"]},
"salmon_ahumado": {"name":"Salmón ahumado","sec":"pesc","kcal":117,"p":18.3,"f":4.3,"c":0,"ft":["pa"]},
"atun": {"name":"Atún","sec":"pesc","kcal":132,"p":29,"f":3.6,"c":0,"ft":["pa"]},
"atun_al_natural": {"name":"Atún al natural","sec":"pesc","kcal":116,"p":25.5,"f":0.8,"c":0,"ft":["pa"],"unit":{"lbl":"lata pequeña","g":60}},
"sardinas_en_aceite_escurridas": {"name":"Sardinas en aceite escurridas","sec":"pesc","kcal":208,"p":24.6,"f":16.7,"c":0,"ft":["pa"]},
"gambas": {"name":"Gambas","sec":"pesc","kcal":99,"p":24,"f":0.3,"c":0.2,"ft":["pb"]},
"pulpo_cocido": {"name":"Pulpo cocido","sec":"pesc","kcal":82,"p":14.9,"f":1,"c":1,"ft":["pb"]},
"chipiron": {"name":"Chipirón","sec":"pesc","kcal":92,"p":15.6,"f":1.4,"c":1.4,"ft":["pb"]},
"mejillon_sin_cascara": {"name":"Mejillón sin cáscara","sec":"pesc","kcal":86,"p":11.9,"f":2.2,"c":3.7,"ft":["pb"]},
"berberecho_lata": {"name":"Berberecho en lata","sec":"pesc","kcal":79,"p":13.5,"f":1.1,"c":2.5,"ft":["pb"],"unit":{"lbl":"lata","g":65}},
"ostras_crudas": {"name":"Ostras crudas","sec":"pesc","kcal":68,"p":9,"f":1.5,"c":4.1,"ft":["pb"]},
"huevo": {"name":"Huevo","sec":"lact","kcal":155,"p":13,"f":11,"c":1.1,"ft":["hv"],"unit":{"lbl":"unidad","g":60}},
"clara_de_huevo": {"name":"Clara de huevo","sec":"lact","kcal":52,"p":10.8,"f":0.1,"c":0.7,"ft":["hv"],"unit":{"lbl":"clara","g":33}},
"leche_entera": {"name":"Leche entera","sec":"lact","kcal":60,"p":3.3,"f":3.4,"c":4.8,"ft":["lac"]},
"leche_desnatada": {"name":"Leche desnatada","sec":"lact","kcal":35,"p":3.4,"f":0.1,"c":5,"ft":["lac"]},
"yogur_natural": {"name":"Yogur natural","sec":"lact","kcal":61,"p":3.5,"f":3.3,"c":4.7,"ft":["lac"]},
"yogur_griego_natural_0_mg": {"name":"Yogur griego natural 0% MG","sec":"lact","kcal":59,"p":10,"f":0.3,"c":3.6,"ft":["lac"]},
"yogur_griego_2_mg": {"name":"Yogur griego 2% MG","sec":"lact","kcal":100,"p":10,"f":2,"c":4,"ft":["lac"]},
"yogur_natural_griego": {"name":"Yogur natural griego","sec":"lact","kcal":133,"p":10,"f":9,"c":3.6,"ft":["lac"]},
"yogur_proteico": {"name":"Yogur proteico natural","sec":"lact","kcal":60,"p":10,"f":0.2,"c":4,"ft":["lac"],"unit":{"lbl":"tarrina","g":200}},
"kefir_natural": {"name":"Kéfir natural","sec":"lact","kcal":49,"p":3.3,"f":2,"c":4,"ft":["lac"]},
"kefir_bajo_en_grasa": {"name":"Kéfir bajo en grasa","sec":"lact","kcal":56,"p":4.2,"f":1,"c":4,"ft":["lac"]},
"queso_fresco": {"name":"Queso fresco","sec":"lact","kcal":254,"p":18,"f":17,"c":2,"ft":["qs","lac"]},
"queso_fresco_0": {"name":"Queso fresco 0%","sec":"lact","kcal":46,"p":8,"f":0.2,"c":3.2,"ft":["qs","lac"],"unit":{"lbl":"tarrina","g":250}},
"requeson_cottage_cheese": {"name":"Requesón cottage cheese","sec":"lact","kcal":98,"p":11.1,"f":4.3,"c":3.4,"ft":["lac"]},
"ricotta": {"name":"Ricotta","sec":"lact","kcal":100,"p":7,"f":4.3,"c":3,"ft":["lac"]},
"queso_cheddar": {"name":"Queso cheddar","sec":"lact","kcal":403,"p":24.9,"f":33.1,"c":1.3,"ft":["qs","lac"]},
"queso_parmesano": {"name":"Queso parmesano","sec":"lact","kcal":431,"p":35.8,"f":25.8,"c":3.2,"ft":["qs","lac"]},
"queso_curado": {"name":"Queso curado","sec":"lact","kcal":420,"p":25,"f":34,"c":1.5,"ft":["qs","lac"]},
"crema_de_leche": {"name":"Crema de leche","sec":"lact","kcal":345,"p":2,"f":35,"c":3,"ft":["lac"]},
"aceite_de_oliva": {"name":"Aceite de oliva","sec":"desp","kcal":884,"p":0,"f":100,"c":0,"fx":true,"unit":{"lbl":"cucharada","g":10}},
"aceite_de_coco": {"name":"Aceite de coco","sec":"desp","kcal":892,"p":0,"f":100,"c":0,"fx":true,"unit":{"lbl":"cucharada","g":10}},
"mantequilla": {"name":"Mantequilla","sec":"desp","kcal":717,"p":0.5,"f":81.1,"c":0.1,"fx":true,"unit":{"lbl":"cucharada","g":15}},
"mayonesa": {"name":"Mayonesa","sec":"desp","kcal":680,"p":1,"f":75,"c":0.6,"fx":true,"unit":{"lbl":"cucharada","g":15}},
"miel": {"name":"Miel","sec":"desp","kcal":304,"p":0.3,"f":0,"c":82.4,"fx":true,"unit":{"lbl":"cucharada","g":20}},
"miel_de_cana": {"name":"Miel de caña","sec":"desp","kcal":300,"p":0.3,"f":0,"c":75,"fx":true},
"almendras": {"name":"Almendras","sec":"desp","kcal":579,"p":21.1,"f":49.4,"c":21.6,"ft":["fs"]},
"nueces": {"name":"Nueces","sec":"desp","kcal":654,"p":15.2,"f":65.2,"c":13.7,"ft":["fs"]},
"pistachos": {"name":"Pistachos","sec":"desp","kcal":562,"p":20.6,"f":45,"c":27.7,"ft":["fs"]},
"harina_de_almendra": {"name":"Harina de almendra","sec":"desp","kcal":579,"p":21.4,"f":54.3,"c":19,"ft":["fs"]},
"mantequilla_de_cacahuete": {"name":"Mantequilla de cacahuete","sec":"desp","kcal":588,"p":25,"f":50,"c":20,"ft":["fs"]},
"semillas_de_chia": {"name":"Semillas de chía","sec":"desp","kcal":486,"p":16.5,"f":30.7,"c":42.1,"ft":["fs"]},
"semillas_de_lino": {"name":"Semillas de lino","sec":"desp","kcal":534,"p":18.3,"f":42.2,"c":28.9,"ft":["fs"]},
"semillas_de_girasol": {"name":"Semillas de girasol","sec":"desp","kcal":584,"p":20.8,"f":51.5,"c":20,"ft":["fs"]},
"semillas_de_calabaza": {"name":"Semillas de calabaza","sec":"desp","kcal":559,"p":19,"f":45.8,"c":54.5,"ft":["fs"]},
"sesamo_semillas": {"name":"Sésamo semillas","sec":"desp","kcal":573,"p":17.7,"f":49.7,"c":23.5,"ft":["fs"]},
"chocolate_negro": {"name":"Chocolate negro","sec":"desp","kcal":546,"p":7.6,"f":43.1,"c":46.3},
"chocolate_con_leche": {"name":"Chocolate con leche","sec":"desp","kcal":535,"p":7.6,"f":31.9,"c":52.2},
"aguacate": {"name":"Aguacate","sec":"fruta","kcal":160,"p":2,"f":14.7,"c":8.5,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":150}},
"guacamole": {"name":"Guacamole","sec":"desp","kcal":157,"p":2,"f":14,"c":8.5,"fx":true},
"aceitunas_verdes": {"name":"Aceitunas verdes","sec":"verd","kcal":145,"p":0.8,"f":15.3,"c":3.8,"ft":["v"],"fx":true},
"aceitunas_negras": {"name":"Aceitunas negras","sec":"verd","kcal":145,"p":0.8,"f":15.3,"c":6.1,"ft":["v"],"fx":true},
"coco_fresco": {"name":"Coco fresco","sec":"fruta","kcal":354,"p":3.3,"f":33.5,"c":15.2,"ft":["fr"],"fx":true},
"manzana": {"name":"Manzana","sec":"fruta","kcal":52,"p":0.3,"f":0.2,"c":13.8,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":180}},
"platano": {"name":"Plátano","sec":"fruta","kcal":96,"p":1.1,"f":0.3,"c":22.8,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":120}},
"naranja": {"name":"Naranja","sec":"fruta","kcal":47,"p":0.9,"f":0.1,"c":11.8,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":160}},
"pera": {"name":"Pera","sec":"fruta","kcal":57,"p":0.4,"f":0.1,"c":15.2,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":170}},
"melocoton": {"name":"Melocotón","sec":"fruta","kcal":39,"p":0.9,"f":0.3,"c":9.5,"ft":["fr"],"fx":true},
"sandia": {"name":"Sandía","sec":"fruta","kcal":30,"p":0.6,"f":0.2,"c":7.6,"ft":["fr"],"fx":true},
"fresa": {"name":"Fresa","sec":"fruta","kcal":32,"p":0.8,"f":0.3,"c":7.7,"ft":["fr"],"fx":true},
"arandanos": {"name":"Arándanos","sec":"fruta","kcal":57,"p":0.7,"f":0.3,"c":14.5,"ft":["fr"],"fx":true},
"moras": {"name":"Moras","sec":"fruta","kcal":43,"p":1.4,"f":0.5,"c":9.6,"ft":["fr"],"fx":true},
"mandarina": {"name":"Mandarina","sec":"fruta","kcal":53,"p":0.8,"f":0.3,"c":13.3,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":80}},
"albaricoque": {"name":"Albaricoque","sec":"fruta","kcal":48,"p":1.4,"f":0.4,"c":11.1,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":35}},
"cereza": {"name":"Cereza","sec":"fruta","kcal":63,"p":1.1,"f":0.2,"c":16,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":8}},
"kiwi": {"name":"Kiwi","sec":"fruta","kcal":61,"p":1.1,"f":0.5,"c":14.7,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":75}},
"ciruela": {"name":"Ciruela","sec":"fruta","kcal":46,"p":0.7,"f":0.3,"c":11.4,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":65}},
"mango": {"name":"Mango","sec":"fruta","kcal":60,"p":0.8,"f":0.4,"c":15,"ft":["fr"],"fx":true},
"melon": {"name":"Melón","sec":"fruta","kcal":34,"p":0.8,"f":0.2,"c":8.2,"ft":["fr"],"fx":true},
"nectarina": {"name":"Nectarina","sec":"fruta","kcal":44,"p":1.1,"f":0.3,"c":10.6,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":140}},
"nispero": {"name":"Níspero","sec":"fruta","kcal":47,"p":0.4,"f":0.2,"c":12.1,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":30}},
"papaya": {"name":"Papaya","sec":"fruta","kcal":43,"p":0.5,"f":0.3,"c":10.8,"ft":["fr"],"fx":true},
"pina": {"name":"Piña","sec":"fruta","kcal":50,"p":0.5,"f":0.1,"c":13.1,"ft":["fr"],"fx":true},
"pomelo": {"name":"Pomelo","sec":"fruta","kcal":42,"p":0.8,"f":0.1,"c":10.7,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":230}},
"uvas": {"name":"Uvas","sec":"fruta","kcal":69,"p":0.7,"f":0.2,"c":18.1,"ft":["fr"],"fx":true},
"frambuesa": {"name":"Frambuesa","sec":"fruta","kcal":52,"p":1.2,"f":0.7,"c":11.9,"ft":["fr"],"fx":true},
"datil": {"name":"Dátil","sec":"fruta","kcal":282,"p":2.5,"f":0.4,"c":75,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":10}},
"ciruela_seca": {"name":"Ciruela seca","sec":"fruta","kcal":240,"p":2.2,"f":0.4,"c":64,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":10}},
"uva_pasa": {"name":"Uva pasa","sec":"fruta","kcal":299,"p":3.1,"f":0.5,"c":79,"ft":["fr"],"fx":true},
"higo_seco": {"name":"Higo seco","sec":"fruta","kcal":249,"p":3.3,"f":0.9,"c":64,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":13}},
"mango_deshidratado": {"name":"Mango deshidratado","sec":"fruta","kcal":319,"p":2.9,"f":1.1,"c":75.6,"ft":["fr"],"fx":true},
"espinaca": {"name":"Espinaca","sec":"verd","kcal":23,"p":2.9,"f":0.4,"c":3.6,"ft":["v"],"fx":true},
"espinacas_cocidas": {"name":"Espinacas cocidas","sec":"verd","kcal":23,"p":3,"f":0.4,"c":4.5,"ft":["v"],"fx":true},
"lechuga": {"name":"Lechuga","sec":"verd","kcal":15,"p":1.4,"f":0.2,"c":2.9,"ft":["v"],"fx":true},
"tomate": {"name":"Tomate","sec":"verd","kcal":18,"p":0.9,"f":0.2,"c":3.9,"ft":["v"],"fx":true,"unit":{"lbl":"unidad","g":125}},
"zanahoria": {"name":"Zanahoria","sec":"verd","kcal":41,"p":0.9,"f":0.2,"c":9.6,"ft":["v"],"fx":true,"unit":{"lbl":"unidad","g":80}},
"brocoli": {"name":"Brócoli","sec":"verd","kcal":34,"p":2.8,"f":0.4,"c":6.6,"ft":["v"],"fx":true},
"pimiento_rojo": {"name":"Pimiento rojo","sec":"verd","kcal":31,"p":0.9,"f":0.3,"c":6,"ft":["v"],"fx":true,"unit":{"lbl":"unidad","g":150}},
"pepino": {"name":"Pepino","sec":"verd","kcal":16,"p":0.7,"f":0.1,"c":3.6,"ft":["v"],"fx":true},
"berenjena": {"name":"Berenjena","sec":"verd","kcal":25,"p":1,"f":0.2,"c":5.9,"ft":["v"],"fx":true},
"calabacin": {"name":"Calabacín","sec":"verd","kcal":17,"p":1.2,"f":0.3,"c":3.1,"ft":["v"],"fx":true},
"calabacin_asado": {"name":"Calabacín asado","sec":"verd","kcal":20,"p":1.2,"f":0.5,"c":3.4,"ft":["v"],"fx":true},
"cebolla": {"name":"Cebolla","sec":"verd","kcal":40,"p":1.1,"f":0.1,"c":9.3,"ft":["v"],"fx":true,"unit":{"lbl":"unidad","g":150}},
"ajo": {"name":"Ajo","sec":"verd","kcal":149,"p":6.4,"f":0.5,"c":33.1,"ft":["v"],"fx":true},
"calabaza": {"name":"Calabaza","sec":"verd","kcal":26,"p":1,"f":0.1,"c":7,"ft":["v"],"fx":true},
"champinones": {"name":"Champiñones","sec":"verd","kcal":22,"p":3.1,"f":0.3,"c":3.3,"ft":["v"],"fx":true},
"setas_varios_tipos": {"name":"Setas varios tipos","sec":"verd","kcal":28,"p":3.1,"f":0.2,"c":3.8,"ft":["v"],"fx":true},
"coliflor": {"name":"Coliflor","sec":"verd","kcal":25,"p":1.9,"f":0.3,"c":4.9,"ft":["v"],"fx":true},
"repollo": {"name":"Repollo","sec":"verd","kcal":25,"p":1.3,"f":0.1,"c":5.8,"ft":["v"],"fx":true},
"esparragos": {"name":"Espárragos","sec":"verd","kcal":20,"p":2.2,"f":0.1,"c":3.9,"ft":["v"],"fx":true},
"acelga": {"name":"Acelga","sec":"verd","kcal":19,"p":1.8,"f":0.2,"c":3.7,"ft":["v"],"fx":true},
"alcachofa": {"name":"Alcachofa","sec":"verd","kcal":47,"p":3.3,"f":0.2,"c":10.5,"ft":["v"],"fx":true,"unit":{"lbl":"unidad","g":120}},
"chirivia": {"name":"Chirivía","sec":"verd","kcal":75,"p":1.2,"f":0.3,"c":18,"ft":["v"],"fx":true},
"col": {"name":"Col","sec":"verd","kcal":25,"p":1.3,"f":0.1,"c":5.8,"ft":["v"],"fx":true},
"coles_de_bruselas": {"name":"Coles de Bruselas","sec":"verd","kcal":43,"p":3.4,"f":0.3,"c":9,"ft":["v"],"fx":true},
"endivia": {"name":"Endivia","sec":"verd","kcal":17,"p":1.3,"f":0.2,"c":3.4,"ft":["v"],"fx":true},
"escarola": {"name":"Escarola","sec":"verd","kcal":17,"p":1.3,"f":0.2,"c":3.4,"ft":["v"],"fx":true},
"judia_verde": {"name":"Judía verde","sec":"verd","kcal":31,"p":1.8,"f":0.1,"c":7,"ft":["v"],"fx":true},
"puerro": {"name":"Puerro","sec":"verd","kcal":61,"p":1.5,"f":0.3,"c":14.2,"ft":["v"],"fx":true},
"rabano": {"name":"Rábano","sec":"verd","kcal":16,"p":0.7,"f":0.1,"c":3.4,"ft":["v"],"fx":true},
"perejil": {"name":"Perejil","sec":"verd","kcal":36,"p":3,"f":0.8,"c":6.3,"ft":["v"],"fx":true},
"zumo_de_manzana_natural": {"name":"Zumo de manzana natural","sec":"desp","kcal":46,"p":0.1,"f":0,"c":11.3},
"zumo_de_pina_natural": {"name":"Zumo de piña natural","sec":"desp","kcal":53,"p":0.5,"f":0.1,"c":12},
"te_negro_infusionado": {"name":"Té negro infusionado","sec":"desp","kcal":1,"p":0.1,"f":0,"c":0},
"sal": {"name":"Sal","sec":"desp","kcal":0,"p":0,"f":0,"c":0,"fx":true,"cond":true},
"pimienta": {"name":"Pimienta","sec":"desp","kcal":0,"p":0,"f":0,"c":0,"fx":true,"cond":true},
"oregano": {"name":"Orégano","sec":"desp","kcal":0,"p":0,"f":0,"c":0,"fx":true,"cond":true},
"comino": {"name":"Comino","sec":"desp","kcal":0,"p":0,"f":0,"c":0,"fx":true,"cond":true},
"pimenton": {"name":"Pimentón","sec":"desp","kcal":0,"p":0,"f":0,"c":0,"fx":true,"cond":true},
"vinagre": {"name":"Vinagre","sec":"desp","kcal":18,"p":0,"f":0,"c":0.9,"fx":true},
"limon": {"name":"Limón","sec":"fruta","kcal":29,"p":1.1,"f":0.3,"c":9.3,"ft":["fr"],"fx":true,"unit":{"lbl":"unidad","g":60}}
};

/* ── ALIMENTOS COMPUESTOS / PREPARADOS que usan las recetas ── */
const FOODS_EXTRA = {
  fruta_temporada:     {name:'Fruta de temporada',     sec:'fruta', kcal:60, p:0.6, f:0.2, c:14,   ft:['fr'], fx:true},
  frutos_rojos:        {name:'Frutos rojos',           sec:'fruta', kcal:50, p:1.0, f:0.4, c:11,   ft:['fr'], fx:true},
  frutos_secos:        {name:'Frutos secos (mezcla)',  sec:'desp',  kcal:600,p:20,  f:52,  c:16,   ft:['fs'], unit:{lbl:'puñado',g:25}},
  tomate_triturado:    {name:'Tomate triturado',       sec:'verd',  kcal:24, p:1.2, f:0.3, c:4,    ft:['v'],  fx:true},
  pimiento_verde:      {name:'Pimiento verde',         sec:'verd',  kcal:20, p:0.9, f:0.2, c:4.6,  ft:['v'],  fx:true, unit:{lbl:'unidad',g:150}},
  cebolla_morada:      {name:'Cebolla morada',         sec:'verd',  kcal:40, p:1.1, f:0.1, c:9.3,  ft:['v'],  fx:true},
  rucula:              {name:'Rúcula',                 sec:'verd',  kcal:25, p:2.6, f:0.7, c:3.7,  ft:['v'],  fx:true},
  apio:                {name:'Apio',                   sec:'verd',  kcal:16, p:0.7, f:0.2, c:3,    ft:['v'],  fx:true},
  dorada:              {name:'Dorada',                 sec:'pesc',  kcal:95, p:19,  f:2,   c:0,    ft:['pb']},
  caballa:             {name:'Caballa',                sec:'pesc',  kcal:205,p:19,  f:14,  c:0,    ft:['pa']},
  gazpacho:            {name:'Gazpacho',               sec:'desp',  kcal:35, p:1,   f:2.5, c:3,    fx:true},
  salmorejo:           {name:'Salmorejo',              sec:'desp',  kcal:80, p:2,   f:6,   c:5,    fx:true},
  caldo_vegetal:       {name:'Caldo vegetal',          sec:'desp',  kcal:4,  p:0.3, f:0,   c:0.6,  fx:true},
  leche_de_coco_light: {name:'Leche de coco light',    sec:'desp',  kcal:73, p:0.7, f:7,   c:1,    fx:true},
  pasta_de_curry:      {name:'Pasta de curry',         sec:'desp',  kcal:150,p:3,   f:10,  c:12,   fx:true},
  vino_coccion:        {name:'Vino (cocción)',         sec:'desp',  kcal:85, p:0,   f:0,   c:2.6,  fx:true},
  hummus:              {name:'Hummus',                 sec:'desp',  kcal:177,p:8,   f:9,   c:15,   ft:['pv']},
  mozzarella:          {name:'Mozzarella light',       sec:'lact',  kcal:170,p:20,  f:9,   c:2,    ft:['qs','lac']},
  bebida_de_avena:     {name:'Bebida de avena',        sec:'lact',  kcal:45, p:0.6, f:1.3, c:7,    ft:['lac']},
  crepes_integrales:   {name:'Crepes integrales',      sec:'pan',   kcal:220,p:8,   f:5,   c:35,   ft:['apq']},
  base_pizza_integral: {name:'Base pizza integral',    sec:'pan',   kcal:270,p:9,   f:4,   c:50,   ft:['apq']},
  tortilla_integral:   {name:'Tortilla integral (wrap)',sec:'pan',  kcal:300,p:9,   f:7,   c:49,   ft:['apq'], unit:{lbl:'tortilla',g:40}},
  queso_de_cabra:      {name:'Queso de cabra',         sec:'lact',  kcal:290,p:18,  f:22,  c:2,    ft:['qs','lac']},
  especias:            {name:'Especias y aliños',      sec:'desp',  kcal:0,  p:0,   f:0,   c:0,    fx:true, cond:true}
};

const FOODS = Object.assign({}, FOODS_BASE, FOODS_EXTRA);

/* ── MEDIDAS CASERAS aproximadas ────────────────────────────
   Para no tener que pesar a diario: cantidades típicas por pieza/medida.
   Se aplican a los alimentos que aún no tengan "unit" propia. */
const HOUSEHOLD_UNITS = {
  // Frutas (pieza comestible aprox.)
  manzana:{lbl:'pieza mediana',g:180}, pera:{lbl:'pieza mediana',g:170},
  platano:{lbl:'unidad',g:120}, banana:{lbl:'unidad',g:120}, platano_macho:{lbl:'unidad',g:150},
  naranja:{lbl:'pieza mediana',g:180}, mandarina:{lbl:'unidad',g:70}, clementina:{lbl:'unidad',g:70},
  kiwi:{lbl:'unidad',g:75}, melocoton:{lbl:'unidad',g:150}, nectarina:{lbl:'unidad',g:140},
  ciruela:{lbl:'unidad',g:60}, albaricoque:{lbl:'unidad',g:40}, higo:{lbl:'unidad',g:50},
  mango:{lbl:'unidad',g:200}, aguacate:{lbl:'media unidad',g:100}, granada:{lbl:'unidad',g:200},
  limon:{lbl:'unidad',g:60}, lima:{lbl:'unidad',g:45}, caqui:{lbl:'unidad',g:170},
  fresa:{lbl:'unidad',g:15}, datil:{lbl:'unidad',g:8},
  // Verduras/hortalizas de pieza
  tomate:{lbl:'pieza mediana',g:120}, tomate_pera:{lbl:'unidad',g:90},
  zanahoria:{lbl:'unidad',g:80}, cebolla:{lbl:'pieza mediana',g:110}, cebolla_morada:{lbl:'pieza mediana',g:110},
  pimiento_rojo:{lbl:'unidad',g:150}, pimiento_verde:{lbl:'unidad',g:130},
  calabacin:{lbl:'pieza mediana',g:200}, berenjena:{lbl:'unidad',g:250}, pepino:{lbl:'unidad',g:200},
  puerro:{lbl:'unidad',g:90}, alcachofa:{lbl:'unidad',g:120}, champinones:{lbl:'unidad',g:20},
  ajo:{lbl:'diente',g:5}, patata:{lbl:'pieza mediana',g:150},
  // Lácteos / huevos
  huevo:{lbl:'unidad (M)',g:55}, yogur_natural:{lbl:'unidad',g:125}, yogur_griego:{lbl:'unidad',g:125},
  // Otros
  pan_integral:{lbl:'rebanada',g:40}
};
Object.entries(HOUSEHOLD_UNITS).forEach(([id, u])=>{ if(FOODS[id] && !FOODS[id].unit) FOODS[id].unit = u; });

/* Alimentos propios del usuario (localStorage) */
const LS_FOODS = 'mnut:foods:v1';
(function loadUserFoods(){
  try{
    const stored = JSON.parse(localStorage.getItem(LS_FOODS) || '{}');
    Object.entries(stored).forEach(([id, f])=>{ FOODS[id] = f; });
  }catch(e){}
})();
function persistFoods(){
  const out = {};
  Object.keys(FOODS).forEach(id=>{ if(FOODS[id].user) out[id] = FOODS[id]; });
  try{ localStorage.setItem(LS_FOODS, JSON.stringify(out)); }catch(e){}
}
function nextFoodId(base){
  let s = (base||'food').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,20) || 'food';
  let id = s, n = 2;
  while(FOODS[id]) id = s + '_' + (n++);
  return id;
}

/* ══════════════════════════════════════════════════════════
   MOTOR DE CÁLCULO
══════════════════════════════════════════════════════════ */
function foodOf(it){ return FOODS[it.f] || null; }

/* Gramos base (de referencia) de un item de composición */
function itemGrams(it){
  if(it.cs) return 0;
  if(it.u != null){
    const f = foodOf(it);
    return it.u * ((f && f.unit && f.unit.g) || 0);
  }
  return +it.g || 0;
}

/* Macros de un alimento para X gramos */
function gramMacros(foodId, grams){
  const f = FOODS[foodId];
  if(!f || !grams) return {k:0, p:0, f:0, c:0};
  const r = grams / 100;
  return {k:f.kcal*r, p:f.p*r, f:f.f*r, c:f.c*r};
}

/* ¿El item escala con el objetivo, o es fijo (verdura, aliño…)? */
function itemScalable(it){
  if(it.cs) return false;
  if(it.fx != null) return !it.fx;
  const f = foodOf(it);
  return !(f && f.fx);
}

/* Escala una composición para alcanzar un objetivo de kcal.
   Los items fijos no se tocan; los escalables se ajustan con un
   único factor (acotado) para que el total ≈ objetivo. */
function scaleComp(comp, targetKcal){
  let fixedK = 0, scalK = 0;
  comp.forEach(it=>{
    const m = gramMacros(it.f, itemGrams(it));
    if(itemScalable(it)) scalK += m.k; else fixedK += m.k;
  });
  let factor = 1;
  if(scalK > 0 && targetKcal > 0){
    factor = (targetKcal - fixedK) / scalK;
    factor = Math.max(0.4, Math.min(1.8, factor));
  }
  const rows = [];
  const tot = {k:0, p:0, f:0, c:0};
  comp.forEach(it=>{
    const baseG = itemGrams(it);
    const g = it.cs ? 0 : (itemScalable(it) ? baseG * factor : baseG);
    const m = gramMacros(it.f, g);
    tot.k += m.k; tot.p += m.p; tot.f += m.f; tot.c += m.c;
    rows.push({it, grams: g, units: (it.u != null && foodOf(it) && foodOf(it).unit) ? g / foodOf(it).unit.g : null});
  });
  return {rows, tot, factor};
}

/* ── Solver de MACROS por receta ───────────────────────────────
   A diferencia de scaleComp (un único factor para clavar las kcal), este
   ajusta CADA ingrediente escalable por separado, dentro de límites, para
   acercar el total a un objetivo de {kcal, p, f, c} a la vez. Los ingredientes
   fijos (verdura, aliño, aromáticos 'cs') no se tocan. Usa descenso por
   coordenadas con solución cerrada por ingrediente (el objetivo es cuadrático):
   así la receta se modifica lo mínimo imprescindible.
     target : {kcal?, p?, f?, c?}  (gramos para p/f/c; los ausentes se ignoran)
     opts   : {lo, hi, reg, weights, maxIter}
   Devuelve {rows:[{it,grams,units,factor}], tot, tweaked, maxDev, ok}. */
function solveComp(comp, target, opts){
  opts = opts || {};
  const lo  = opts.lo  != null ? opts.lo  : 0.55;   // hasta -45% por ingrediente
  const hi  = opts.hi  != null ? opts.hi  : 1.6;    // hasta +60%
  const reg = opts.reg != null ? opts.reg : 0.04;   // prefiere cambios pequeños
  const W   = Object.assign({k:1.0, p:2.0, f:1.2, c:1.4}, opts.weights || {});
  const maxIter = opts.maxIter || 240;
  const MK = ['k','p','f','c'];
  // Objetivo por macro (con clave 'k' para kcal). Solo cuentan los presentes.
  const T = { k:+target.kcal||0, p:+target.p||0, f:+target.f||0, c:+target.c||0 };
  const active = MK.filter(m => T[m] > 0);
  // Ingredientes escalables (con su vector de macros base a factor 1) y fijos.
  const items = comp.map(it=>{
    const g0 = itemGrams(it);
    const base = gramMacros(it.f, g0);          // {k,p,f,c} a gramos base
    return { it, g0, base, scal: itemScalable(it) && g0 > 0 };
  });
  // Suma fija (ingredientes que no se tocan)
  const fixed = {k:0,p:0,f:0,c:0};
  items.forEach(x=>{ if(!x.scal) MK.forEach(m=> fixed[m]+= x.base[m]); });
  // Factores por ingrediente escalable (arranque en 1)
  const scal = items.filter(x=>x.scal);
  scal.forEach(x=> x.factor = 1);
  const denomScale = m => Math.max(T[m], 1) * Math.max(T[m], 1);   // error relativo
  // Suma total de una macro dada los factores actuales
  const totMacro = m => { let s = fixed[m]; scal.forEach(x=> s += x.factor * x.base[m]); return s; };
  for(let iter=0; iter<maxIter; iter++){
    let moved = 0;
    for(const x of scal){
      // total sin este ingrediente, por macro
      let num = reg, den = reg;   // regularización hacia factor 1
      for(const m of active){
        const others = totMacro(m) - x.factor * x.base[m];
        const b = x.base[m];
        if(b === 0) continue;
        const w = W[m] / denomScale(m);
        num += w * b * (T[m] - others);
        den += w * b * b;
      }
      let f = den > 0 ? num / den : x.factor;
      if(f < lo) f = lo; if(f > hi) f = hi;
      if(Math.abs(f - x.factor) > 1e-4) moved++;
      x.factor = f;
    }
    if(!moved) break;
  }
  // Construye filas y totales finales
  const rows = []; const tot = {k:0,p:0,f:0,c:0}; let maxDev = 0;
  items.forEach(x=>{
    const g = x.it.cs ? 0 : (x.scal ? x.g0 * x.factor : x.g0);
    const m = gramMacros(x.it.f, g);
    MK.forEach(k=> tot[k]+= m[k]);
    const f = foodOf(x.it);
    rows.push({ it:x.it, grams: Math.round(g), factor: x.scal ? x.factor : 1,
                units: (x.it.u != null && f && f.unit) ? g/f.unit.g : null });
  });
  active.forEach(m=>{ const dev = Math.abs(tot[m]-T[m])/Math.max(T[m],1); if(dev>maxDev) maxDev=dev; });
  const tweaked = scal.some(x=> Math.abs(x.factor-1) > 0.02);
  return { rows, tot, tweaked, maxDev, ok: maxDev <= (opts.okDev != null ? opts.okDev : 0.08) };
}

/* Objetivo de kcal de una persona para una franja */
function mealTargetKcal(personaKey, cat){
  // Ración = ración BASE (persona de menor kcal) × modificador de la persona.
  // El modificador por defecto = kcal_persona / kcal_base, así el resultado
  // coincide con escalar por kcal; pero puede fijarse a mano por persona.
  const base = TARGETS[typeof basePersonId==='function' ? basePersonId() : personaKey];
  const baseK = base ? base.kcal : (TARGETS[personaKey] ? TARGETS[personaKey].kcal : 0);
  const mod = (typeof personModifier==='function') ? personModifier(personaKey) : 1;
  return baseK * mod * (MEAL_PCT[cat] || 0.25);
}

/* ── Objetivos de MACROS por persona (auto + manual) ───────────
   Base automática = TARGETS[p] (kcal y P/F/C en gramos, que ya salen del
   perfil/GET). Si hay override manual guardado, manda: puede fijar kcal y los
   % de proteína/grasa/hidratos, de los que se derivan los gramos. */
var LS_MACRO_TGT = 'mnut:macro-targets';
function _macroTgtStore(){ try{ return JSON.parse(localStorage.getItem(LS_MACRO_TGT) || '{}') || {}; }catch(_){ return {}; } }
function personMacroTarget(p){
  const t = (typeof TARGETS!=='undefined' && TARGETS[p]) || {};
  let kcal=+t.kcal||0, pg=+t.p||0, fg=+t.f||0, cg=+t.c||0;
  const ov = _macroTgtStore()[p];
  if(ov && ov.mode==='manual'){
    if(+ov.kcal>0) kcal=+ov.kcal;
    if(ov.pPct!=null || ov.fPct!=null || ov.cPct!=null){
      const pp=+ov.pPct||0, ff=+ov.fPct||0; let cc=(ov.cPct==null||isNaN(+ov.cPct))?Math.max(0,100-pp-ff):+ov.cPct;
      pg=kcal*pp/100/4; fg=kcal*ff/100/9; cg=kcal*cc/100/4;
    }
  }
  return {kcal:Math.round(kcal), p:Math.round(pg), f:Math.round(fg), c:Math.round(cg),
          mode:(ov&&ov.mode)||'auto'};
}
function setPersonMacroTarget(p, ov){
  const all=_macroTgtStore(); if(ov) all[p]=ov; else delete all[p];
  try{ localStorage.setItem(LS_MACRO_TGT, JSON.stringify(all)); }catch(_){}
}
/* % actuales de P/F/C de un objetivo (para mostrar y precargar el editor) */
function macroPct(t){
  const k=Math.max(+t.kcal||0,1);
  return { p:Math.round((t.p*4)/k*100), f:Math.round((t.f*9)/k*100), c:Math.round((t.c*4)/k*100) };
}
/* Objetivo de macros de una persona para una franja (reparto por MEAL_PCT) */
function mealMacroTarget(p, cat){
  const d=personMacroTarget(p), q=MEAL_PCT[cat]||0.25;
  return {kcal:d.kcal*q, p:d.p*q, f:d.f*q, c:d.c*q};
}
/* Composición de una receta reajustada hacia las macros de la persona en su
   franja. Devuelve null si la receta no tiene composición estructurada. */
function dishSolvedForPerson(id, p, cat){
  const d=(typeof DISHES!=='undefined')&&DISHES[id]; if(!d||!d.comp||typeof solveComp!=='function') return null;
  return solveComp(d.comp, mealMacroTarget(p, cat||d.cat));
}

/* Escala una composición por un FACTOR directo (no por objetivo de kcal).
   Los ingredientes fijos (verduras, aliños, fx/cs) no se tocan; los
   escalables se multiplican por el factor. Con factor=1 se obtiene la
   receta TAL CUAL está escrita = 1 ración estándar. */
function scaleByFactor(comp, factor){
  const f = (isFinite(factor) && factor > 0) ? factor : 1;
  const rows = [];
  const tot = {k:0, p:0, f:0, c:0};
  comp.forEach(it=>{
    const baseG = itemGrams(it);
    const g = it.cs ? 0 : (itemScalable(it) ? baseG * f : baseG);
    const m = gramMacros(it.f, g);
    tot.k += m.k; tot.p += m.p; tot.f += m.f; tot.c += m.c;
    rows.push({it, grams: g, units: (it.u != null && foodOf(it) && foodOf(it).unit) ? g / foodOf(it).unit.g : null});
  });
  return {rows, tot, factor:f};
}

/* Composición escalada para una persona en su franja.
   MODELO "1 ración estándar": cada receta se escribe para UNA ración
   (la persona base, ×1). Cada persona escala su parte por su modificador
   (≈ ratio de kcal respecto a la base, editable). Así la ficha de la
   receta y el menú son coherentes: lo escrito es 1 ración real. */
function dishScaled(d, personaKey){
  if(!d || !d.comp) return null;
  const mod = (typeof personModifier === 'function') ? personModifier(personaKey) : 1;
  return scaleByFactor(d.comp, mod);
}

/* ── MODELO "POR NECESIDAD DE COMIDA" (Fase 2b) ──────────────
   La receta es una RACIÓN ESTÁNDAR de adulto. Cada persona escala
   la receta a su necesidad de ESA franja (kcal_día × % de la comida).
   Si la celda tiene varias recetas, la franja se reparte entre ellas
   proporcional a su tamaño estándar → factor = necesidad / Σ estándar.
   Así "quien menos necesita" es la base y el resto son múltiplos. */
function recipeStdKcal(d){
  if(!d) return 0;
  if(d.comp && d.comp.length){
    let k = 0;
    d.comp.forEach(it=>{ if(it.cs) return; k += gramMacros(it.f, itemGrams(it)).k; });
    return k;
  }
  return Array.isArray(d.kcal) ? (d.kcal[0]||0) : (d.kcal||0);
}
function personMealKcal(personaKey, slot){
  if(personaKey === 'AB') return PEOPLE.reduce((s,id)=> s + personMealKcal(id, slot), 0);
  const t = TARGETS[personaKey];
  return t ? (t.kcal||0) * (MEAL_PCT[slot] || 0.25) : 0;
}
function sumCellStd(ids){
  return (ids||[]).reduce((a,id)=> a + (DISHES[id] ? recipeStdKcal(DISHES[id]) : 0), 0) || 1;
}
/* Composición de una receta escalada para una persona en su celda (franja).
   El objetivo de ESTA receta es su parte proporcional de la franja (si la
   celda tiene varias recetas, se reparte por tamaño estándar). Se escala con
   scaleComp: los ingredientes fijos (🔒 verduras, aliños, alimentos sueltos)
   NO se escalan y el factor queda acotado (0.4–1.8) para que las raciones
   sigan siendo realistas aunque la receta no encaje del todo en la franja. */
function dishScaledMeal(d, personaKey, slot, sumStd){
  if(!d) return {rows:[], tot:{k:0,p:0,f:0,c:0}, factor:1};
  if(d.comp && d.comp.length){
    const own = recipeStdKcal(d) || 1;
    const std = sumStd || own;
    const targetK = personMealKcal(personaKey, slot) * (own / std);
    return scaleComp(d.comp, targetK);
  }
  // Sin composición (p. ej. "libre"): usa los kcal/macros precalculados de la persona.
  const idx = Math.max(0, PEOPLE.indexOf(personaKey));
  const pick = (a)=> Array.isArray(a) ? (a[idx]!=null?a[idx]:a[0]||0) : (a||0);
  return {rows:[], tot:{k:pick(d.kcal), p:pick(d.mac&&d.mac.p), f:pick(d.mac&&d.mac.f), c:pick(d.mac&&d.mac.c)}, factor:1};
}

/* ── Formato de cantidades ──────────────────────────────── */
function fmtNum(n){
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}
function roundGrams(g){
  if(g <= 0) return 0;
  if(g < 10) return Math.round(g);
  return Math.round(g / 5) * 5;
}
function roundUnits(u){ return Math.round(u * 2) / 2; }

function foodName(it){
  if(it.as) return it.as;
  const f = foodOf(it);
  return f ? f.name : (it.f || '?');
}

/* Texto de cantidad para mostrar (gramos o unidades) + nota */
function fmtQty(it, grams){
  if(it.cs) return 'c.s.' + (it.note ? ' · ' + it.note : '');
  const f = foodOf(it);
  let s;
  if(it.u != null && f && f.unit){
    const u = roundUnits(grams / f.unit.g);
    const lbl = f.unit.lbl + (Math.abs(u) === 1 ? '' : 's');
    s = `${fmtNum(u)} ${lbl}`;
  } else {
    s = `${roundGrams(grams)} g`;
    // Medida casera aproximada (para no pesar): "180 g · ≈1 pieza mediana"
    if(f && f.unit && f.unit.g){
      const u = roundUnits(grams / f.unit.g);
      if(u >= 0.5 && u <= 6){
        const lbl = f.unit.lbl + (Math.abs(u) === 1 ? '' : 's');
        s += ` · ≈${fmtNum(u)} ${lbl}`;
      }
    }
  }
  return s + (it.note ? ' · ' + it.note : '');
}

/* Tipos de alimento (guía) derivados de una composición */
function deriveFoodTypes(comp){
  const set = [];
  const order = ['leg','cb','cr','pb','pa','apq','hv','pv','qs','js','lac','fs','v','fr','pic','lb'];
  comp.forEach(it=>{
    const f = foodOf(it);
    if(!f || !f.ft) return;
    f.ft.forEach(t=>{ if(!set.includes(t)) set.push(t); });
  });
  return set.sort((a,b)=> order.indexOf(a) - order.indexOf(b));
}

/* ── Recalcula los campos cacheados (kcal/mac/ing/food) de un
   plato a partir de su composición. Mantiene compatibilidad con
   todo el código existente que lee d.kcal / d.mac / d.ing. ── */
function recomputeDish(d){
  if(!d || !d.comp || !d.comp.length) return;
  const r = Math.round;
  // Una columna por persona activa (PEOPLE), en orden.
  const scaled = PEOPLE.map(id => dishScaled(d, id));
  d.kcal = scaled.map(s => r(s.tot.k));
  d.mac = {
    p: scaled.map(s => r(s.tot.p)),
    f: scaled.map(s => r(s.tot.f)),
    c: scaled.map(s => r(s.tot.c))
  };
  d.ing = d.comp.map((it, i)=>{
    const o = { n: foodName(it) };
    PEOPLE.forEach((id, pi)=>{ o[id] = fmtQty(it, scaled[pi].rows[i].grams); });
    return o;
  });
  if(!d.food || !d.food.length) d.food = deriveFoodTypes(d.comp);
}

/* ── Comida libre: pseudo-platos que se contabilizan con el
   objetivo estimado de cada franja. Excluidos del autorelleno
   (flag libre), pero elegibles a mano en el calendario. ── */
function ensureLibreDishes(){
  ['des','com','mer','cen'].forEach(cat=>{
    const id = 'LIBRE_' + cat;
    const split = {p:0.25, f:0.30, c:0.45};   // reparto estimado de una comida libre
    const g = (k,m)=> Math.round(k * split[m] / (m==='f' ? 9 : 4));
    // Una columna por persona activa (mismo escalado base×modificador que las recetas)
    const ks = PEOPLE.map(pid => Math.round(mealTargetKcal(pid, cat)));
    DISHES[id] = Object.assign(DISHES[id] || {}, {
      cat, libre:true, short:'Libre', nom:'Comida libre', icon:'🎉',
      t:'—', eq:'—', tags:[], tipo:null, diet:[], food:['lb'],
      desc:'Comida libre: come lo que quieras. Se contabiliza con el objetivo estimado de esta franja para no descuadrar el día.',
      nota:'Comida libre — sin receta fija.',
      kcal: ks,
      mac:{ p: ks.map(k=>g(k,'p')), f: ks.map(k=>g(k,'f')), c: ks.map(k=>g(k,'c')) },
      ing:[]
    });
  });
}

function recomputeAllComp(){
  ensureLibreDishes();
  Object.values(DISHES).forEach(d=>{ if(d.comp && d.comp.length) recomputeDish(d); });
}

/* expose */
window.FOODS = FOODS;
window.FOOD_SECTIONS = FOOD_SECTIONS;
window.MEAL_PCT = MEAL_PCT;
window.scaleComp = scaleComp;
window.solveComp = solveComp;
window.personMacroTarget = personMacroTarget;
window.setPersonMacroTarget = setPersonMacroTarget;
window.mealMacroTarget = mealMacroTarget;
window.dishSolvedForPerson = dishSolvedForPerson;
window.macroPct = macroPct;
window.scaleByFactor = scaleByFactor;
window.dishScaled = dishScaled;
window.recomputeDish = recomputeDish;
window.recomputeAllComp = recomputeAllComp;

/* ══════════════════════════════════════════════════════════
   PÁGINA "MEDIDAS DE ALIMENTOS" (referencia + buscador + PDF)
   Para no tener que pesar/medir todo: equivalencias aproximadas.
══════════════════════════════════════════════════════════ */
const MEASURE_REFS = [
  ['🥄 Cucharada sopera rasa', '≈ 15 ml · aceite 13-14 g · azúcar 10-12 g · harina 8-10 g'],
  ['🥄 Cucharadita rasa',      '≈ 5 ml · aceite 4-5 g · azúcar o sal 4-5 g · especias 2-3 g'],
  ['🥛 Vaso doméstico',        '≈ 200-250 ml; compruébalo una vez llenándolo con una jarra medidora'],
  ['☕ Taza',                  'café 60-100 ml · café con leche 180-220 ml · taza grande 240-300 ml'],
  ['🥣 Cuenco o bol',          'pequeño 250-300 ml · mediano 350-450 ml; cambia mucho según la forma'],
  ['🥄 Cazo de servir',        '≈ 100-150 ml · útil para sopas, guisos y legumbres'],
  ['🤏 Puñado cerrado',        'frutos secos ≈ 20-30 g; la mano de cada persona sirve como escala propia'],
  ['👐 Dos manos juntas',      'verduras o ensalada ≈ una ración abundante'],
  ['✊ Puño',                  'arroz, pasta, patata o legumbre cocidos ≈ 120-180 g'],
  ['🖐️ Palma sin dedos',      'carne, pescado, tofu o tempeh ≈ 90-140 g según grosor'],
  ['👍 Pulgar',                'queso curado, crema de frutos secos o grasa untable ≈ 10-20 g'],
  ['🧀 Loncha',                'queso ≈ 15-25 g · fiambre ≈ 10-20 g; revisa el envase'],
  ['🍞 Rebanada',              'pan de molde ≈ 25-40 g · rodaja de barra ≈ 30-50 g'],
  ['🥚 Huevo con cáscara',     'S <53 g · M 53-63 g · L 63-73 g; la parte comestible pesa menos'],
  ['🍎 Pieza de fruta',        'pequeña 80-120 g · mediana 130-180 g · grande 200 g o más'],
  ['🥫 Lata o conserva',       'usa el peso escurrido de la etiqueta, no el peso neto total'],
  ['🍫 Onza',                  'no es universal: suele variar entre 5 y 12 g según la tableta'],
  ['🧴 Chorro de aceite',      'muy variable; para aprender, mídelo algunas veces con cuchara']
];
const MEASURE_EVERYDAY = [
  {title:'👀 Guía visual para montar un plato', items:[
    ['Verduras y hortalizas','½ plato o dos manos juntas; combina crudas y cocinadas cuando puedas.'],
    ['Proteína','¼ de plato o una palma; legumbre, huevo, pescado, carne, tofu o alternativas.'],
    ['Hidrato rico en almidón','¼ de plato o un puño cocido; ajusta a hambre, actividad y resto del día.'],
    ['Grasa culinaria','Una cantidad pequeña y consciente; el aceite “a ojo” es lo que más varía.']
  ]},
  {title:'🍚 Cantidades cocinadas fáciles de reconocer', items:[
    ['Arroz o pasta','½ taza ≈ 80-100 g · 1 taza ≈ 160-200 g, según producto y cocción.'],
    ['Legumbre','½ taza ≈ 80-110 g · 1 taza o cazo generoso ≈ 160-220 g.'],
    ['Patata o boniato','Una pieza mediana o un puño ≈ 150-220 g.'],
    ['Verdura cocinada','Un cuenco o dos cazos ≈ 180-300 g; en crudo ocupa mucho más volumen.']
  ]},
  {title:'🛒 Del envase al plato', items:[
    ['Yogur','Un envase habitual aporta 120-150 g; comprueba la etiqueta.'],
    ['Leche o bebida vegetal','Un vaso habitual ≈ 200-250 ml.'],
    ['Conservas','Divide el peso escurrido entre las porciones realmente servidas.'],
    ['Paquetes y bandejas','Peso total ÷ unidades o porciones usadas: suele ser más fiable que adivinar.']
  ]},
  {title:'🧭 Cómo usar estas medidas sin obsesionarse', items:[
    ['Primera semana','Mide solo tus utensilios habituales una vez y guarda la referencia mental.'],
    ['Crudo frente a cocinado','No compares gramos crudos con cocinados: el agua cambia peso y volumen.'],
    ['Consistencia','Para seguir cambios importa más medir de forma parecida que acertar al gramo.'],
    ['Cuándo sí pesar','Recetas nuevas, aceites, alimentos muy densos o cuando una pauta profesional lo pida.']
  ]}
];
function _fmNorm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function injectMeasuresCSS(){
  if(document.getElementById('fmCss')) return;
  const st=document.createElement('style'); st.id='fmCss';
  st.textContent=`
  .fm-back{position:fixed;top:var(--hdr-h,0);left:0;right:0;bottom:0;background:var(--cream,#f6edd8);z-index:180;display:flex;align-items:stretch;justify-content:center;opacity:0;transition:opacity .2s}
  .fm-back.show{opacity:1}
  .fm-page{background:var(--cream,#f6edd8);width:min(880px,100vw);height:100%;display:flex;flex-direction:column;box-shadow:0 0 60px rgba(0,0,0,.12);overflow:hidden;transform:translateY(8px);transition:transform .2s}
  .fm-back.show .fm-page{transform:none}
  .fm-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 18px 10px;flex-shrink:0;position:sticky;top:0;background:var(--cream,#f6edd8);border-bottom:1px solid rgba(var(--ink-rgb,44,31,14),.08)}
  .fm-hd h3{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--ink,#3a2c1a);margin:0}
  .fm-hd-actions{display:flex;gap:8px;flex-shrink:0}
  .fm-print{border:1.5px solid rgba(var(--ink-rgb,44,31,14),.18);background:var(--white,#fff);color:var(--ink,#3a2c1a);font-family:'DM Mono',monospace;font-size:.66rem;text-transform:uppercase;letter-spacing:.04em;font-weight:600;padding:8px 13px;border-radius:20px;cursor:pointer}
  .fm-print:hover{border-color:var(--terra,#b5603a);color:var(--terra,#b5603a)}
  .fm-x{border:none;background:rgba(var(--ink-rgb,44,31,14),.07);border-radius:10px;padding:8px 14px;min-height:40px;font-size:.85rem;cursor:pointer;color:var(--ink,#3a2c1a);flex-shrink:0;display:flex;align-items:center;gap:6px}
  .fm-x:hover{background:rgba(var(--ink-rgb,44,31,14),.14)}
  .fm-intro{padding:0 18px 8px;font-family:'Lora',serif;font-size:.86rem;color:var(--ink-50,#6b5d49)}
  .fm-search{margin:0 18px 10px;padding:9px 14px;border-radius:22px;border:1.5px solid rgba(var(--ink-rgb,44,31,14),.15);background:var(--white,#fff);font-family:'Lora',serif;font-size:.92rem;color:var(--ink,#3a2c1a)}
  .fm-search:focus{outline:none;border-color:var(--gold,#c8742e);box-shadow:0 0 0 3px rgba(200,116,46,.12)}
  /* Dentro del shell de página común: la barra de buscador + PDF y sin márgenes heredados */
  .app-page-body .fm-intro{padding:0 0 10px}
  .app-page-body .fm-search{margin:0;flex:1;min-width:0}
  .fm-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:14px}
  .fm-toolbar .fm-print{flex:0 0 auto;border:1.5px solid var(--accent,#b5603a);background:var(--white,#fff);color:var(--accent,#b5603a);font-family:'DM Mono',monospace;font-size:.66rem;text-transform:uppercase;letter-spacing:.04em;font-weight:600;padding:10px 14px;border-radius:22px;cursor:pointer;min-height:42px}
  .fm-toolbar .fm-print:hover{background:var(--accent,#b5603a);color:#fff}
  .fm-scroll{overflow-y:auto;padding:2px 18px 18px;-webkit-overflow-scrolling:touch}
  .fm-refs{display:grid;grid-template-columns:1fr;gap:6px;background:var(--white,#fff);border-radius:12px;padding:12px 14px;margin-bottom:16px;border:1px solid rgba(var(--ink-rgb,44,31,14),.07)}
  .fm-ref{display:flex;gap:10px;font-size:.84rem;line-height:1.4}
  .fm-ref b{flex:0 0 auto;min-width:158px;color:var(--ink,#3a2c1a);font-family:'Lora',serif;font-weight:600}
  .fm-ref span{color:var(--ink-50,#6b5d49);font-family:'DM Mono',monospace;font-size:.72rem;align-self:center}
  .fm-sec{margin-bottom:14px}
  .fm-sec-h{font-family:'DM Mono',monospace;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--terra,#b5603a);font-weight:700;margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid rgba(var(--ink-rgb,44,31,14),.1)}
  .fm-items{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}
  .fm-item{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:4px 0;border-bottom:1px dotted rgba(var(--ink-rgb,44,31,14),.1)}
  .fm-n{font-family:'Lora',serif;font-size:.88rem;color:var(--ink,#3a2c1a);min-width:0}
  .fm-m{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--ink-50,#6b5d49);text-align:right;white-space:nowrap;flex-shrink:0}
  .fm-m b{color:var(--olive,#5a6b2c)} .fm-m small{display:block;font-size:.6rem;color:var(--ink-30,#9b8d76)}
  .fm-m.fm-wrap{white-space:normal;max-width:64%;line-height:1.45}
  .fm-guide-note{font-family:'Lora',serif;font-size:.84rem;color:var(--ink-50,#6b5d49);margin:0 0 14px;line-height:1.5;padding:10px 12px;border-radius:10px;background:rgba(90,107,44,.08)}
  .fm-empty{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--ink-30,#9b8d76);padding:14px 0;text-align:center}
  @media(max-width:560px){ .fm-items{grid-template-columns:1fr} .fm-ref b{min-width:118px} }
  @media print{
    body>*:not(.fm-back){display:none!important}
    .fm-back{position:static!important;background:none!important;padding:0!important;display:block!important;backdrop-filter:none!important}
    .fm-page{box-shadow:none!important;max-height:none!important;width:100%!important;border-radius:0!important}
    .fm-no-print{display:none!important}
    .fm-scroll{overflow:visible!important}
    .fm-items{break-inside:avoid}
  }`;
  document.head.appendChild(st);
}
function openFoodMeasures(){
  injectMeasuresCSS();
  const esc = window.escHtml || (s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  const F = window.FOODS || FOODS, SEC = window.FOOD_SECTIONS || FOOD_SECTIONS;
  const withUnit = Object.keys(F).filter(id=> F[id] && F[id].unit && F[id].unit.g);
  const bySec = {};
  withUnit.forEach(id=>{ const s = SEC[F[id].sec] ? F[id].sec : 'desp'; (bySec[s]=bySec[s]||[]).push(id); });
  const secOrder = Object.keys(SEC).sort((a,b)=>(SEC[a].order||9)-(SEC[b].order||9));
  const listHtml = secOrder.filter(s=>bySec[s]).map(s=>{
    const items = bySec[s].sort((a,b)=> F[a].name.localeCompare(F[b].name, 'es'));
    return `<div class="fm-sec" data-sec="${s}">
      <h4 class="fm-sec-h">${SEC[s].ico||''} ${esc(SEC[s].lbl||s)}</h4>
      <div class="fm-items">${items.map(id=>{
        const f=F[id], u=f.unit, kc=Math.round((f.kcal||0)*u.g/100);
        return `<div class="fm-item fm-searchable" data-name="${esc(_fmNorm(`${f.name} ${u.lbl} ${SEC[s].lbl||''}`))}">
          <span class="fm-n">${esc(f.name)}</span>
          <span class="fm-m">1 ${esc(u.lbl)} ≈ <b>${u.g} g</b><small>${kc} kcal</small></span>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
  const refsHtml = MEASURE_REFS.map(([k,v])=>`<div class="fm-ref fm-searchable" data-name="${esc(_fmNorm(k+' '+v))}"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('');
  const everydayHtml = MEASURE_EVERYDAY.map(group=>`<div class="fm-sec fm-guide-sec">
    <h4 class="fm-sec-h">${esc(group.title)}</h4>
    <div class="fm-items">${group.items.map(([k,v])=>`<div class="fm-item fm-searchable" data-name="${esc(_fmNorm(k+' '+v))}">
      <span class="fm-n">${esc(k)}</span><span class="fm-m fm-wrap">${esc(v)}</span></div>`).join('')}</div>
  </div>`).join('');
  if(typeof AppPage==='undefined') return;
  AppPage.open({
    key:'measures', group:'info', title:'📏 Medidas de alimentos',
    render(body){
      body.innerHTML=`
        <div class="fm-intro">Referencias visuales y domésticas para estimar cantidades razonables en el día a día. Son rangos aproximados: el tamaño del alimento, el utensilio y la cocción cambian el resultado.</div>
        <div class="fm-toolbar"><input class="fm-search" type="search" placeholder="🔎 Buscar alimento…" aria-label="Buscar alimento"><button class="fm-print" type="button">🖨️ PDF</button></div>
        <p class="fm-guide-note">Consejo: calibra una vez tu vaso, taza, bol, cucharón y puñado. Después podrás repetir una referencia suficientemente consistente sin pesar cada comida.</p>
        <div class="fm-refs">${refsHtml}</div>
        ${everydayHtml}
        ${listHtml || '<div class="fm-empty">No hay medidas registradas.</div>'}
        <div class="fm-empty fm-noresult" style="display:none">Sin alimentos que coincidan con la búsqueda.</div>`;
      const search = body.querySelector('.fm-search');
      search.addEventListener('input', ()=>{
        const q = _fmNorm(search.value.trim()); let any=false;
        body.querySelectorAll('.fm-searchable').forEach(it=>{ const ok=!q||(it.dataset.name||'').includes(q); it.style.display=ok?'':'none'; if(ok)any=true; });
        body.querySelectorAll('.fm-sec').forEach(sec=>{ const vis=[...sec.querySelectorAll('.fm-searchable')].some(it=>it.style.display!=='none'); sec.style.display=vis?'':'none'; });
        const refsBox=body.querySelector('.fm-refs'); if(refsBox){ const vis=[...refsBox.querySelectorAll('.fm-searchable')].some(it=>it.style.display!=='none'); refsBox.style.display=vis?'':'none'; }
        const nr=body.querySelector('.fm-noresult'); if(nr) nr.style.display=(q&&!any)?'':'none';
      });
      const pr=body.querySelector('.fm-print'); if(pr) pr.addEventListener('click', ()=> printFoodMeasures());
    }
  });
}

/* PDF de medidas con el mismo método de la app: HTML aislado en un iframe + print */
function buildMeasuresPrintHtml(){
  const esc = window.escHtml || (s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  const F = window.FOODS || FOODS, SEC = window.FOOD_SECTIONS || FOOD_SECTIONS;
  const withUnit = Object.keys(F).filter(id=> F[id] && F[id].unit && F[id].unit.g);
  const bySec = {};
  withUnit.forEach(id=>{ const s = SEC[F[id].sec] ? F[id].sec : 'desp'; (bySec[s]=bySec[s]||[]).push(id); });
  const secOrder = Object.keys(SEC).sort((a,b)=>(SEC[a].order||9)-(SEC[b].order||9));
  const refsRows = MEASURE_REFS.map(([k,v])=>`<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const everydayRows = MEASURE_EVERYDAY.map(group=>`<h2>${esc(group.title)}</h2><table class="refs"><tbody>${
    group.items.map(([k,v])=>`<tr><td class="k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')
  }</tbody></table>`).join('');
  const secHtml = secOrder.filter(s=>bySec[s]).map(s=>{
    const items = bySec[s].sort((a,b)=> F[a].name.localeCompare(F[b].name,'es'));
    return `<h2>${SEC[s].ico||''} ${esc(SEC[s].lbl||s)}</h2>
      <table class="foods"><tbody>${items.map(id=>{
        const f=F[id], u=f.unit, kc=Math.round((f.kcal||0)*u.g/100);
        return `<tr><td class="n">${esc(f.name)}</td><td class="m">1 ${esc(u.lbl)} ≈ <b>${u.g} g</b></td><td class="kc">${kc} kcal</td></tr>`;
      }).join('')}</tbody></table>`;
  }).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Medidas de alimentos</title>
  <style>
    *{box-sizing:border-box} body{font-family:Georgia,'Times New Roman',serif;color:#2c1f0e;margin:26px 30px;font-size:12px}
    h1{font-size:22px;margin:0 0 2px} .intro{color:#6b5d49;font-size:12px;margin:0 0 16px}
    h2{font-size:13px;margin:18px 0 6px;padding-bottom:4px;border-bottom:1.5px solid #b5603a;color:#b5603a;page-break-after:avoid}
    table{width:100%;border-collapse:collapse;margin-bottom:8px}
    table.refs td{padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top}
    table.refs td.k{font-weight:bold;width:200px}
    table.foods{column-count:2;column-gap:26px;display:block}
    table.foods tbody{display:block} table.foods tr{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dotted #ddd;break-inside:avoid}
    table.foods td.n{flex:1} table.foods td.m{white-space:nowrap;color:#444} table.foods td.m b{color:#5a6b2c} table.foods td.kc{white-space:nowrap;color:#999;width:60px;text-align:right}
    footer{margin-top:22px;padding-top:10px;border-top:1px solid #ddd;color:#999;font-size:10px;text-align:center}
    @page{margin:14mm}
  </style></head><body>
    <h1>📏 Medidas de alimentos</h1>
    <p class="intro">Referencias visuales y domésticas para estimar cantidades en el día a día. Son rangos aproximados: utensilio, tamaño y cocción modifican el resultado.</p>
    <h2>Referencias generales</h2>
    <table class="refs"><tbody>${refsRows}</tbody></table>
    ${everydayRows}
    <h2>Catálogo de equivalencias de la app</h2>
    ${secHtml}
    <footer>Plan Nutricional · Generado el ${new Date().toLocaleDateString('es')}</footer>
  </body></html>`;
}
function printFoodMeasures(){
  const html = buildMeasuresPrintHtml();
  if(typeof pnPrintDoc === 'function'){ pnPrintDoc(html); return; }
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow.onload = ()=>{
    setTimeout(()=>{
      try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }
      catch(e){ alert('No se ha podido abrir el diálogo de impresión: '+e.message); }
      setTimeout(()=> iframe.remove(), 1000);
    }, 200);
  };
}
window.openFoodMeasures = openFoodMeasures;

/* ══════════════════════════════════════════════════════════
   PÁGINA "RECOMENDACIONES NUTRICIONALES Y CONSTRUCCIÓN DEL MENÚ"
   Mismo formato que Medidas: overlay + buscador + PDF.
══════════════════════════════════════════════════════════ */
const RECO_OBJETIVOS = [
  ['Pérdida de grasa',  'Déficit moderado y revisable · proteína suficiente, especialmente si entrenas fuerza · conserva grasas, fibra y variedad.'],
  ['Mantenimiento',     'Energía cercana al gasto real · patrón flexible que sostenga salud, rendimiento, vida social y preferencias.'],
  ['Recomposición',     'Fuerza progresiva + proteína suficiente + energía de mantenimiento o déficit leve; valora medidas y rendimiento, no solo peso.'],
  ['Ganancia muscular', 'Superávit pequeño, entrenamiento progresivo y tiempo · proteína orientativa 1,6–2,2 g/kg en adultos que entrenan.']
];
const RECO_CALC = [
  ['1 · Punto de partida', 'Las ecuaciones estiman, no miden. La app usa un cálculo rápido de gasto basal y actividad que puede desviarse bastante en una persona concreta.'],
  ['2 · Actividad completa', 'Cuenta trabajo, desplazamientos, tareas, pasos y deporte. El gimnasio no resume todo tu movimiento diario.'],
  ['3 · Objetivo prudente', 'Empieza cerca del mantenimiento o con cambios pequeños. Déficits y superávits grandes suelen empeorar hambre, recuperación o adherencia.'],
  ['4 · Proteína', 'Asegura fuentes repartidas durante el día. Quien entrena fuerza puede usar rangos deportivos; no son necesarios para toda la población.'],
  ['5 · Grasas e hidratos', 'Mantén grasas de calidad y ajusta hidratos a actividad, tolerancia y preferencias, priorizando fuentes ricas en fibra.'],
  ['6 · Revisión', 'Observa 2–4 semanas: tendencia de peso, perímetros, fuerza, energía, hambre, sueño, digestión y facilidad para mantenerlo.'],
  ['7 · Ajuste pequeño', 'Si la tendencia no encaja, cambia una variable cada vez: porciones, picoteo, bebidas, pasos o frecuencia de comidas.'],
  ['8 · Individualizar', 'En enfermedad, embarazo, lactancia, TCA, medicación o necesidades especiales, la pauta debe revisarla un profesional.']
];
const RECO_CLAVES = [
  'Lo “ideal” es una estructura adaptable: no un menú perfecto que obligue a comer igual cada día.',
  'No existe obligación de hacer cinco comidas. Elige un ritmo que evite llegar sin control y encaje con tus horarios.',
  'Prioriza alimentos poco procesados, pero deja espacio consciente para placer, cultura, celebración y comodidad.',
  'La báscula no lo es todo: digestión, energía, sueño, fuerza, hambre, analíticas y bienestar también cuentan.',
  'Un cambio pequeño y sostenible (5-10% del peso, y sobre todo de cintura) mejora la salud más que adelgazar mucho y rápido.',
  'Come sentado, sin pantallas y sin prisa: la señal de saciedad tarda unos 20 minutos en llegar.',
  'Mantener lo logrado es parte del plan: la actividad física regular y el autopesaje periódico previenen el efecto rebote.',
  'Una comida distinta no estropea la semana. Vuelve a la siguiente decisión útil sin compensaciones extremas.'
];
const RECO_DAILY = [
  ['1 · Elige anclas','Decide 2-3 desayunos, comidas y cenas fáciles que puedas repetir sin pensar demasiado.'],
  ['2 · Planifica lo justo','Revisa agenda, personas y entrenamientos; planifica primero los días complicados, no una semana imaginaria perfecta.'],
  ['3 · Compra por bloques','Verduras y fruta · proteínas · hidratos ricos en fibra · grasas y sabor · soluciones rápidas de despensa o congelador.'],
  ['4 · Cocina componentes','Deja preparada una verdura, una proteína y una base de arroz, patata, pasta o legumbre para combinarlas de varias formas.'],
  ['5 · Ten un plan B','Huevos, legumbre cocida, verduras congeladas, conserva, yogur, fruta, pan integral y frutos secos resuelven comidas reales.'],
  ['6 · Sirve y observa','Empieza con una ración razonable, come sin prisa y repite si sigues teniendo hambre; no necesitas acertar de antemano.'],
  ['7 · Ajusta el entorno','Deja visible y accesible lo que quieres usar más y reserva decisiones difíciles para cuando tengas energía.'],
  ['8 · Revisa sin castigo','Pregunta qué facilitó o dificultó la semana y cambia una sola cosa útil para la siguiente.']
];
const RECO_SCENARIOS = [
  ['Día con poco tiempo','Usa un plato de montaje: ensalada o verdura congelada + conserva/huevo/legumbre + pan, patata o arroz listo + AOVE.'],
  ['Tupper','Prioriza preparaciones que aguanten: guiso de legumbre, cereal con verdura y proteína, crema + bocadillo completo o sobras planificadas.'],
  ['Comer fuera','Busca verdura y una fuente de proteína, elige la guarnición que te apetezca, come hasta saciedad cómoda y evita “compensar” después.'],
  ['Antes de entrenar','Si han pasado horas, toma algo familiar y digerible con hidratos y, si encaja, algo de proteína; no estrenes comidas pesadas.'],
  ['Después de entrenar','Vuelve a una comida normal con líquido, proteína e hidratos. El total del día importa más que una ventana de minutos.'],
  ['Presupuesto ajustado','Legumbres, huevos, conservas, pollo, avena, arroz, patata, fruta de temporada y congelados suelen dar buena relación coste-nutrición.'],
  ['Varias personas','Comparte la misma base y adapta cantidad, guarnición y extras; no hace falta cocinar un menú completamente distinto para cada perfil.'],
  ['Semana irregular','Mantén mínimos: alguna verdura o fruta, proteína suficiente, agua y una comida preparada. Retoma estructura cuando sea posible.']
];
const RECO_THEORY_LINKS = [
  ['que-es-comer-bien','Qué significa comer bien'],
  ['plato-ideal','El plato ideal'],
  ['patrones-saludables','Patrones mediterráneo y DASH'],
  ['comida-real-vs-ultraprocesados','Comida real y ultraprocesados'],
  ['cuando-comer','Cómo repartir el día'],
  ['metas-realistas-peso','Metas realistas de peso'],
  ['comer-con-atencion','Comer con atención'],
  ['evitar-efecto-rebote','Evitar el efecto rebote'],
  ['diseno-del-entorno','Diseñar el entorno'],
  ['adherencia-habitos-ejercicio','Adherencia antes que perfección'],
  ['formulas-de-estimacion-y-fiabilidad','Límites de las fórmulas']
];
function injectRecoCSS(){
  if(document.getElementById('recoCss')) return;
  const st=document.createElement('style'); st.id='recoCss';
  st.textContent=`
  .reco-plate{display:flex;gap:8px;margin:2px 0 8px}
  .reco-plate .rp-seg{border-radius:10px;padding:11px 12px;color:#fff;font-family:'Lora',serif;font-size:.9rem;font-weight:600;line-height:1.2;display:flex;flex-direction:column;justify-content:center;min-height:84px}
  .reco-plate .rp-seg small{display:block;font-family:'DM Mono',monospace;font-size:.6rem;font-weight:400;opacity:.92;margin-top:4px;letter-spacing:.02em}
  .reco-plate .rp-verd{flex:1;background:#5a6b2c}
  .reco-plate .rp-col{flex:1;display:flex;flex-direction:column;gap:8px}
  .reco-plate .rp-prot{flex:1;background:#b5603a}
  .reco-plate .rp-carb{flex:1;background:#c8742e}
  .reco-note{font-family:'Lora',serif;font-size:.84rem;color:var(--ink-50,#6b5d49);margin:0 0 8px;line-height:1.5}
  .reco-bars{display:flex;flex-direction:column;gap:7px;margin-bottom:6px}
  .reco-bar{display:flex;align-items:center;gap:10px}
  .reco-bar .rb-l{font-family:'Lora',serif;font-size:.85rem;color:var(--ink,#3a2c1a);width:96px;flex-shrink:0}
  .reco-bar .rb-track{flex:1;height:14px;background:rgba(var(--ink-rgb,44,31,14),.08);border-radius:8px;overflow:hidden}
  .reco-bar .rb-fill{height:100%;background:var(--olive,#5a6b2c);border-radius:8px}
  .reco-bar .rb-p{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--terra,#b5603a);width:38px;text-align:right;flex-shrink:0;font-weight:600}
  .reco-prose ul{margin:2px 0 0;padding-left:18px} .reco-prose li{font-family:'Lora',serif;font-size:.86rem;color:var(--ink,#3a2c1a);line-height:1.5;margin-bottom:5px}`;
  st.textContent+=`
  .reco-links{display:flex;flex-wrap:wrap;gap:7px}
  .reco-link{border:1.5px solid rgba(var(--ink-rgb,44,31,14),.14);background:var(--white);color:var(--ink);border-radius:20px;padding:8px 12px;cursor:pointer;font-size:.78rem}
  .reco-link:hover{border-color:var(--accent,#b5603a);color:var(--accent,#b5603a)}
  .reco-bib{border-style:dashed}`;
  document.head.appendChild(st);
}
function _recoData(){
  const MP = window.MEAL_PCT || (typeof MEAL_PCT!=='undefined'?MEAL_PCT:{des:.25,com:.35,mer:.15,cen:.25});
  const meals = [['Desayuno',MP.des],['Comida',MP.com],['Merienda',MP.mer],['Cena',MP.cen]];
  const guide = (window.WEEKLY_GUIDE || (typeof WEEKLY_GUIDE!=='undefined'?WEEKLY_GUIDE:[]));
  return {meals, guide};
}
function openNutriReco(){
  injectMeasuresCSS(); injectRecoCSS();
  const esc = window.escHtml || (s=>String(s));
  const {meals, guide} = _recoData();
  const guideItems = guide.map(g=>`<div class="fm-item" data-name="${esc(_fmNorm(g.lbl+' '+(g.rule||'')))}">
      <span class="fm-n">${esc(g.lbl)}</span><span class="fm-m">${esc(g.rule||'')}</span></div>`).join('');
  const objItems = RECO_OBJETIVOS.map(([k,v])=>`<div class="fm-item" data-name="${esc(_fmNorm(k+' '+v))}">
      <span class="fm-n">${esc(k)}</span><span class="fm-m" style="white-space:normal;max-width:62%">${esc(v)}</span></div>`).join('');
  const barsHtml = meals.map(([lbl,p])=>`<div class="reco-bar"><span class="rb-l">${esc(lbl)}</span><span class="rb-track"><span class="rb-fill" style="width:${Math.round(p*100)}%"></span></span><span class="rb-p">${Math.round(p*100)}%</span></div>`).join('');
  const calcHtml = RECO_CALC.map(([k,v])=>`<div class="fm-item" data-name="${esc(_fmNorm(k+' '+v))}"><span class="fm-n">${esc(k)}</span><span class="fm-m" style="white-space:normal;max-width:64%">${esc(v)}</span></div>`).join('');
  const clavesHtml = RECO_CLAVES.map(c=>`<li>${esc(c)}</li>`).join('');
  const dailyHtml = RECO_DAILY.map(([k,v])=>`<div class="fm-item" data-name="${esc(_fmNorm(k+' '+v))}"><span class="fm-n">${esc(k)}</span><span class="fm-m fm-wrap">${esc(v)}</span></div>`).join('');
  const scenariosHtml = RECO_SCENARIOS.map(([k,v])=>`<div class="fm-item" data-name="${esc(_fmNorm(k+' '+v))}"><span class="fm-n">${esc(k)}</span><span class="fm-m fm-wrap">${esc(v)}</span></div>`).join('');
  const theoryHtml = RECO_THEORY_LINKS.map(([id,lbl])=>`<button class="reco-link" type="button" data-theory="${id}">📖 ${esc(lbl)}</button>`).join('');

  if(typeof AppPage==='undefined') return;
  AppPage.open({
    key:'reco', group:'info', title:'🥗 Recomendaciones y menú ideal',
    render(body){
      body.innerHTML=`
        <div class="fm-intro">Una guía para convertir la teoría de la app en comidas posibles: estructura flexible, compra, cocina, imprevistos, vida social y ajustes según tu día.</div>
        <div class="fm-toolbar"><input class="fm-search" type="search" placeholder="🔎 Buscar (legumbre, proteína, déficit…)" aria-label="Buscar recomendación"><button class="fm-print" type="button">🖨️ PDF</button></div>
        <div class="reco-prose">
          <div class="fm-sec"><h4 class="fm-sec-h">🧭 Qué significa “menú ideal”</h4>
            <p class="reco-note">No es un menú único ni perfecto. Es una estructura suficientemente nutritiva, agradable, asequible y flexible para repetirse la mayoría de semanas. Las cantidades y horarios se adaptan a cada persona.</p>
          </div>
          <div class="fm-sec"><h4 class="fm-sec-h">🍽️ El plato ideal</h4>
            <div class="reco-plate">
              <div class="rp-seg rp-verd">½ Verduras y hortalizas<small>crudas + cocidas</small></div>
              <div class="rp-col">
                <div class="rp-seg rp-prot">¼ Proteína<small>magra, pescado, huevo, legumbre, tofu</small></div>
                <div class="rp-seg rp-carb">¼ Hidratos de calidad<small>integral, patata, legumbre</small></div>
              </div>
            </div>
            <p class="reco-note">Añade una porción razonable de grasa saludable y usa agua como bebida habitual. La fruta puede ir de postre o en otro momento. En guisos, bocadillos o platos mezclados conserva la idea, aunque no se vean cuatro zonas.</p>
          </div>
          <div class="fm-sec"><h4 class="fm-sec-h">📊 Un reparto posible del día</h4><div class="reco-bars">${barsHtml}</div>
            <p class="reco-note">Es solo el reparto configurado en la app. Puedes mover, juntar o eliminar tomas según horarios, hambre, medicación, cultura y entrenamiento.</p>
          </div>
        </div>
        <div class="fm-sec"><h4 class="fm-sec-h">🧺 Del calendario a la compra y la cocina</h4><div class="fm-items">${dailyHtml}</div></div>
        <div class="fm-sec"><h4 class="fm-sec-h">🏙️ Soluciones para situaciones reales</h4><div class="fm-items">${scenariosHtml}</div></div>
        <div class="fm-sec"><h4 class="fm-sec-h">🗓️ Cuánto comer a la semana</h4><div class="fm-items">${guideItems}</div></div>
        <div class="fm-sec"><h4 class="fm-sec-h">🎯 Ajustes según objetivo</h4><div class="fm-items">${objItems}</div></div>
        <div class="fm-sec"><h4 class="fm-sec-h">🧮 Cómo interpretar calorías y macros</h4><div class="fm-items">${calcHtml}</div></div>
        <div class="reco-prose"><div class="fm-sec"><h4 class="fm-sec-h">🔑 Claves</h4><ul>${clavesHtml}</ul></div></div>
        <div class="reco-prose"><div class="fm-sec"><h4 class="fm-sec-h">📚 Profundiza en la teoría y las fuentes</h4>
          <div class="reco-links">${theoryHtml}<button class="reco-link reco-bib" type="button" data-biblio="aesan-recom">📚 Recomendaciones AESAN</button></div>
        </div></div>
        <div class="fm-empty fm-noresult" style="display:none">Sin recomendaciones que coincidan con la búsqueda.</div>`;
      const search = body.querySelector('.fm-search');
      search.addEventListener('input', ()=>{
        const q=_fmNorm(search.value.trim()); let any=false;
        body.querySelectorAll('.fm-item').forEach(it=>{ const ok=!q||it.dataset.name.includes(q); it.style.display=ok?'':'none'; if(ok)any=true; });
        body.querySelectorAll('.fm-sec').forEach(sec=>{ const items=sec.querySelectorAll('.fm-item'); if(items.length){ const vis=[...items].some(it=>it.style.display!=='none'); sec.style.display=vis?'':'none'; } });
        body.querySelectorAll('.reco-prose').forEach(p=> p.style.display=q?'none':'');
        const nr=body.querySelector('.fm-noresult'); if(nr) nr.style.display=(q&&!any)?'':'none';
      });
      const pr=body.querySelector('.fm-print'); if(pr) pr.addEventListener('click', ()=> printNutriReco());
      body.addEventListener('click',e=>{
        const theory=e.target.closest('[data-theory]');
        if(theory && typeof openTeoriaArticle==='function'){ openTeoriaArticle(theory.dataset.theory); return; }
        const bib=e.target.closest('[data-biblio]');
        if(bib && typeof openBibliografia==='function') openBibliografia(bib.dataset.biblio);
      });
    }
  });
}
function printNutriReco(){
  const esc = window.escHtml || (s=>String(s));
  const {meals, guide} = _recoData();
  const guideRows = guide.map(g=>`<tr><td class="n">${esc(g.lbl)}</td><td>${esc(g.rule||'')}</td></tr>`).join('');
  const objRows = RECO_OBJETIVOS.map(([k,v])=>`<tr><td class="n">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const calcRows = RECO_CALC.map(([k,v])=>`<tr><td class="n">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const dailyRows = RECO_DAILY.map(([k,v])=>`<tr><td class="n">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const scenarioRows = RECO_SCENARIOS.map(([k,v])=>`<tr><td class="n">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('');
  const barRows = meals.map(([l,p])=>`<tr><td class="n">${esc(l)}</td><td>${Math.round(p*100)}%</td></tr>`).join('');
  const claves = RECO_CLAVES.map(c=>`<li>${esc(c)}</li>`).join('');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Recomendaciones nutricionales</title>
  <style>*{box-sizing:border-box}body{font-family:Georgia,serif;color:#2c1f0e;margin:24px 30px;font-size:12px}
  h1{font-size:21px;margin:0 0 2px}.intro{color:#6b5d49;margin:0 0 14px}
  h2{font-size:13px;margin:16px 0 6px;padding-bottom:4px;border-bottom:1.5px solid #b5603a;color:#b5603a;page-break-after:avoid}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}td{padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top}td.n{font-weight:bold;width:210px}
  ul{margin:2px 0 0;padding-left:18px}li{margin-bottom:4px}
  footer{margin-top:20px;padding-top:10px;border-top:1px solid #ddd;color:#999;font-size:10px;text-align:center}@page{margin:14mm}</style></head><body>
    <h1>🥗 Recomendaciones y construcción del menú</h1>
    <p class="intro">Cómo convertir una estructura saludable en comidas posibles, flexibles y adaptadas a la vida diaria.</p>
    <h2>Qué significa “menú ideal”</h2><p>No es un menú único ni perfecto: debe ser nutritivo, agradable, asequible, flexible y suficientemente fácil de repetir.</p>
    <h2>El plato ideal</h2><table><tr><td class="n">½ del plato</td><td>Verduras y hortalizas (crudas + cocidas)</td></tr><tr><td class="n">¼ del plato</td><td>Proteína magra: pescado, huevo, carne magra, legumbre, tofu</td></tr><tr><td class="n">¼ del plato</td><td>Hidratos de calidad: integral, patata, legumbre</td></tr><tr><td class="n">Extra</td><td>Grasa saludable (AOVE, aguacate, frutos secos) · agua · fruta de postre</td></tr></table>
    <h2>Del calendario a la compra y la cocina</h2><table>${dailyRows}</table>
    <h2>Situaciones reales</h2><table>${scenarioRows}</table>
    <h2>Un reparto posible del día</h2><table>${barRows}</table>
    <h2>Cuánto comer a la semana</h2><table>${guideRows}</table>
    <h2>Ajustes según objetivo</h2><table>${objRows}</table>
    <h2>Cómo interpretar calorías y macros</h2><table>${calcRows}</table>
    <h2>Claves</h2><ul>${claves}</ul>
    <footer>Plan Nutricional · Generado el ${new Date().toLocaleDateString('es')}</footer>
  </body></html>`;
  if(typeof pnPrintDoc === 'function'){ pnPrintDoc(html); return; }
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  iframe.contentWindow.onload = ()=>{ setTimeout(()=>{ try{ iframe.contentWindow.focus(); iframe.contentWindow.print(); }catch(e){ alert('No se pudo imprimir: '+e.message);} setTimeout(()=>iframe.remove(),1000); },200); };
}
window.openNutriReco = openNutriReco;
if(typeof AppPage!=='undefined'){ AppPage.register('measures', openFoodMeasures); AppPage.register('reco', openNutriReco); }
