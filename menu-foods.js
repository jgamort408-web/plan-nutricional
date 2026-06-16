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
window.scaleByFactor = scaleByFactor;
window.dishScaled = dishScaled;
window.recomputeDish = recomputeDish;
window.recomputeAllComp = recomputeAllComp;

/* ══════════════════════════════════════════════════════════
   PÁGINA "MEDIDAS DE ALIMENTOS" (referencia + buscador + PDF)
   Para no tener que pesar/medir todo: equivalencias aproximadas.
══════════════════════════════════════════════════════════ */
const MEASURE_REFS = [
  ['🥄 Cucharada sopera',  '≈ 15 ml · aceite 14 g · azúcar 12 g · harina 9 g · miel 20 g'],
  ['🥄 Cucharadita (café)', '≈ 5 ml · sal 5 g · azúcar 4 g · aceite 4,5 g · levadura 3 g'],
  ['🥛 Vaso de agua',       '≈ 200 ml (vaso de agua) · 100 ml el vaso pequeño'],
  ['☕ Taza',               '≈ 240 ml · taza de café con leche ≈ 200 ml'],
  ['🤏 Puñado',             '≈ 25-30 g (frutos secos) · 20 g de hojas verdes'],
  ['✊ Puño cerrado',       '≈ 1 ración de hidratos cocidos (arroz/pasta) ≈ 150 g'],
  ['🖐️ Palma de la mano',  '≈ 1 ración de proteína (carne/pescado) ≈ 100-120 g'],
  ['👍 Pulgar',             '≈ 1 ración de grasa (aceite/mantequilla) ≈ 10-15 g'],
  ['🧀 Loncha de queso',    '≈ 20 g · 🥓 loncha de jamón ≈ 15 g'],
  ['🍞 Rebanada de pan molde','≈ 25-30 g · pan de barra (rodaja) ≈ 30 g'],
  ['🥚 Huevo',              'pequeño ≈ 45 g · mediano (M) ≈ 55 g · grande (L) ≈ 65 g'],
  ['🍫 Onza de chocolate',  '≈ 5-7 g']
];
function _fmNorm(s){ return (s||'').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function injectMeasuresCSS(){
  if(document.getElementById('fmCss')) return;
  const st=document.createElement('style'); st.id='fmCss';
  st.textContent=`
  .fm-back{position:fixed;inset:0;background:rgba(20,12,4,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);z-index:340;display:flex;align-items:center;justify-content:center;padding:18px;opacity:0;transition:opacity .2s}
  .fm-back.show{opacity:1}
  .fm-page{background:var(--cream,#f6edd8);width:min(680px,96vw);max-height:90vh;display:flex;flex-direction:column;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.4);overflow:hidden;transform:translateY(10px) scale(.99);transition:transform .2s}
  .fm-back.show .fm-page{transform:none}
  .fm-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 18px 9px;flex-shrink:0}
  .fm-hd h3{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;color:var(--warm,#3a2c1a);margin:0}
  .fm-hd-actions{display:flex;gap:8px;flex-shrink:0}
  .fm-print{border:1.5px solid rgba(44,31,14,.18);background:var(--white,#fff);color:var(--warm,#3a2c1a);font-family:'DM Mono',monospace;font-size:.66rem;text-transform:uppercase;letter-spacing:.04em;font-weight:600;padding:8px 13px;border-radius:20px;cursor:pointer}
  .fm-print:hover{border-color:var(--terra,#b5603a);color:var(--terra,#b5603a)}
  .fm-x{border:none;background:rgba(44,31,14,.07);width:30px;height:30px;border-radius:50%;font-size:.95rem;cursor:pointer;color:var(--warm,#3a2c1a);flex-shrink:0}
  .fm-intro{padding:0 18px 8px;font-family:'Lora',serif;font-size:.86rem;color:var(--ink-50,#6b5d49)}
  .fm-search{margin:0 18px 10px;padding:9px 14px;border-radius:22px;border:1.5px solid rgba(44,31,14,.15);background:var(--white,#fff);font-family:'Lora',serif;font-size:.92rem;color:var(--warm,#3a2c1a)}
  .fm-search:focus{outline:none;border-color:var(--gold,#c8742e);box-shadow:0 0 0 3px rgba(200,116,46,.12)}
  .fm-scroll{overflow-y:auto;padding:2px 18px 18px;-webkit-overflow-scrolling:touch}
  .fm-refs{display:grid;grid-template-columns:1fr;gap:6px;background:var(--white,#fff);border-radius:12px;padding:12px 14px;margin-bottom:16px;border:1px solid rgba(44,31,14,.07)}
  .fm-ref{display:flex;gap:10px;font-size:.84rem;line-height:1.4}
  .fm-ref b{flex:0 0 auto;min-width:158px;color:var(--warm,#3a2c1a);font-family:'Lora',serif;font-weight:600}
  .fm-ref span{color:var(--ink-50,#6b5d49);font-family:'DM Mono',monospace;font-size:.72rem;align-self:center}
  .fm-sec{margin-bottom:14px}
  .fm-sec-h{font-family:'DM Mono',monospace;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--terra,#b5603a);font-weight:700;margin:0 0 7px;padding-bottom:5px;border-bottom:1px solid rgba(44,31,14,.1)}
  .fm-items{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}
  .fm-item{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:4px 0;border-bottom:1px dotted rgba(44,31,14,.1)}
  .fm-n{font-family:'Lora',serif;font-size:.88rem;color:var(--warm,#3a2c1a);min-width:0}
  .fm-m{font-family:'DM Mono',monospace;font-size:.72rem;color:var(--ink-50,#6b5d49);text-align:right;white-space:nowrap;flex-shrink:0}
  .fm-m b{color:var(--olive,#5a6b2c)} .fm-m small{display:block;font-size:.6rem;color:var(--ink-30,#9b8d76)}
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
        return `<div class="fm-item" data-name="${esc(_fmNorm(f.name))}">
          <span class="fm-n">${esc(f.name)}</span>
          <span class="fm-m">1 ${esc(u.lbl)} ≈ <b>${u.g} g</b><small>${kc} kcal</small></span>
        </div>`;
      }).join('')}</div>
    </div>`;
  }).join('');
  const refsHtml = MEASURE_REFS.map(([k,v])=>`<div class="fm-ref"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('');
  const back=document.createElement('div'); back.className='fm-back';
  back.innerHTML=`<div class="fm-page" role="dialog" aria-modal="true" aria-label="Medidas de alimentos">
    <div class="fm-hd fm-no-print">
      <h3>📏 Medidas de alimentos</h3>
      <div class="fm-hd-actions">
        <button class="fm-print" data-print>🖨️ PDF</button>
        <button class="fm-x" data-x aria-label="Cerrar">✕</button>
      </div>
    </div>
    <div class="fm-intro">Equivalencias aproximadas para no tener que pesar a diario. Usa el buscador o imprime esta página como PDF.</div>
    <input class="fm-search fm-no-print" type="search" placeholder="🔎 Buscar alimento…" aria-label="Buscar alimento">
    <div class="fm-scroll">
      <div class="fm-refs">${refsHtml}</div>
      ${listHtml || '<div class="fm-empty">No hay medidas registradas.</div>'}
      <div class="fm-empty fm-noresult" style="display:none">Sin alimentos que coincidan con la búsqueda.</div>
    </div>
  </div>`;
  document.body.appendChild(back);
  requestAnimationFrame(()=> back.classList.add('show'));

  const search = back.querySelector('.fm-search');
  search.addEventListener('input', ()=>{
    const q = _fmNorm(search.value.trim());
    let any = false;
    back.querySelectorAll('.fm-item').forEach(it=>{
      const ok = !q || it.dataset.name.includes(q);
      it.style.display = ok ? '' : 'none'; if(ok) any = true;
    });
    back.querySelectorAll('.fm-sec').forEach(sec=>{
      const vis = [...sec.querySelectorAll('.fm-item')].some(it=> it.style.display !== 'none');
      sec.style.display = vis ? '' : 'none';
    });
    const refsBox = back.querySelector('.fm-refs'); if(refsBox) refsBox.style.display = q ? 'none' : '';
    const nr = back.querySelector('.fm-noresult'); if(nr) nr.style.display = (q && !any) ? '' : 'none';
  });
  const pr = back.querySelector('[data-print]'); if(pr) pr.addEventListener('click', ()=> window.print());
  function close(){ back.classList.remove('show'); setTimeout(()=> back.remove(), 200); document.removeEventListener('keydown', onKey, true); }
  function onKey(e){ if(e.key==='Escape') close(); }
  back.addEventListener('click', e=>{ if(e.target.closest('[data-x]') || e.target===back) close(); });
  document.addEventListener('keydown', onKey, true);
}
window.openFoodMeasures = openFoodMeasures;
