/* ══════════════════════════════════════════════════════════
   COCINAS · paquetes de recetas activables/desactivables
   ----------------------------------------------------------
   "Tipos de comida" = cocinas (Española/Base, Italiana, Turca…).
   Cada cocina extra es un PAQUETE de recetas que se carga desde
   un JSON (o, en el futuro, desde una base de datos) y que el
   usuario puede ACTIVAR o DESACTIVAR desde Configuración.

   Formato de paquete (recipe-pack):
     {
       "kind": "recipe-pack",
       "cuisine": { "id":"ita", "ico":"🇮🇹", "lbl":"Comida italiana" },
       "dishes": {
         "ITA_C1": { cat:'com', nom:'…', short:'…', icon:'🍝', t:'25 min',
                     eq:'…', diet:['vt'], food:['apq','qs','v'],
                     kcal:[700,450], mac:{p:[..],f:[..],c:[..]},
                     ing:[{n:'…',A:'…',B:'…'}], nota:'…', desc:'…' }
       }
     }

   Estado persistido:
     mnut:cuisines-off:v1   → ids de cocinas DESACTIVADAS
     mnut:cuisine-packs:v1  → paquetes importados (se re-funden al arrancar)

   Helpers globales:
     dishHiddenByCuisine(id) → ¿oculta esta receta por cocina apagada?
     Cuisines.*              → API (list/isOn/setOn/loadPack/importFile…)
   ========================================================== */
(function(){
  'use strict';
  const LS_OFF   = 'mnut:cuisines-off:v1';
  const LS_PACKS = 'mnut:cuisine-packs:v1';

  // Cocina base implícita: todas las recetas que vienen con la app.
  const BASE = { id:'base', ico:'🥘', lbl:'Base · Variada (España)', builtin:true };

  const _registry = { base: BASE };   // id → {id,ico,lbl,builtin?}
  let _off = new Set(loadArr(LS_OFF));

  function loadArr(k){ try{ const a = JSON.parse(localStorage.getItem(k)); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function saveOff(){ try{ localStorage.setItem(LS_OFF, JSON.stringify([..._off])); }catch(e){} }
  function loadPacksLS(){ try{ const a = JSON.parse(localStorage.getItem(LS_PACKS)); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function savePacksLS(arr){ try{ localStorage.setItem(LS_PACKS, JSON.stringify(arr)); }catch(e){} }

  function isOn(id){ return !_off.has(id); }
  function setOn(id, on){
    if(on) _off.delete(id); else _off.add(id);
    saveOff();
  }

  // Oculta una receta si su cocina está desactivada. La cocina "base"
  // (recetas que vienen con la app) también puede desactivarse, pero las
  // recetas PROPIAS del usuario (ids "U…") nunca se ocultan por cocina.
  function dishHiddenByCuisine(id){
    const D = (typeof DISHES!=='undefined') ? DISHES[id] : null;
    if(!D) return false;
    if(typeof id==='string' && id[0]==='U') return false;   // recetas del usuario: siempre visibles
    const cui = (D.cuisine && D.cuisine!=='base') ? D.cuisine : 'base';
    return !isOn(cui);
  }

  // Funde un paquete en el catálogo (sin persistir). Devuelve nº de recetas.
  function mergePack(pack){
    if(!pack || pack.kind!=='recipe-pack' || !pack.cuisine || !pack.dishes) return 0;
    const c = pack.cuisine;
    if(!c.id || c.id==='base') return 0;
    _registry[c.id] = { id:c.id, ico:c.ico||'🍽️', lbl:c.lbl||c.id, builtin:!!pack.builtin };
    // 1) Alimentos propios del paquetes → se funden en la base FOODS (mismo objeto que usa
    //    el motor) para que las recetas con `comp` calculen macros/kcal fiables y ESCALEN.
    if(pack.foods && window.FOODS){
      Object.entries(pack.foods).forEach(([fid, f])=>{ if(f && !window.FOODS[fid]) window.FOODS[fid] = Object.assign({pack:c.id}, f); });
    }
    // 2) Recetas
    let n = 0;
    Object.entries(pack.dishes).forEach(([id, d])=>{
      if(typeof DISHES==='undefined' || !d) return;
      const dish = Object.assign({}, d, { cuisine:c.id });
      if(!dish.food) dish.food = [];
      if(!dish.tags) dish.tags = [];
      if(!dish.diet) dish.diet = [];
      DISHES[id] = dish;
      if(d.comp && typeof RECIPE_COMP!=='undefined'){ RECIPE_COMP[id] = d.comp; DISHES[id].comp = d.comp; }
      n++;
    });
    // 3) Recalcula composiciones (kcal/macros desde los ingredientes) si hay motor.
    if(n>0 && typeof recomputeAllComp==='function'){ try{ recomputeAllComp(); }catch(e){} }
    return n;
  }

  // Carga + persiste un paquete importado por el usuario.
  function loadPack(pack){
    const n = mergePack(pack);
    if(n>0){
      const arr = loadPacksLS().filter(p=> !(p.cuisine && pack.cuisine && p.cuisine.id===pack.cuisine.id));
      arr.push(pack); savePacksLS(arr);
      if(typeof renderAll==='function') renderAll();
    }
    return n;
  }

  function removePack(cuisineId){
    if(cuisineId==='base') return;
    // quita recetas de esa cocina del catálogo
    if(typeof DISHES!=='undefined') Object.keys(DISHES).forEach(id=>{ if(DISHES[id].cuisine===cuisineId) delete DISHES[id]; });
    delete _registry[cuisineId];
    _off.delete(cuisineId); saveOff();
    savePacksLS(loadPacksLS().filter(p=> !(p.cuisine && p.cuisine.id===cuisineId)));
    if(typeof renderAll==='function') renderAll();
  }

  // Importar paquete desde un File (input type=file)
  function importFile(file){
    return new Promise((resolve)=>{
      const r = new FileReader();
      r.onload = ()=>{ try{ resolve(loadPack(JSON.parse(r.result))); }catch(e){ resolve(0); } };
      r.onerror = ()=> resolve(0);
      r.readAsText(file);
    });
  }

  // Descargar paquete incluido con la app (carpeta /packs)
  async function fetchPack(url){
    try{ const res = await fetch(url); if(!res.ok) return 0; return loadPack(await res.json()); }
    catch(e){ return 0; }
  }

  // Lista para la UI: base + cocinas cargadas, con nº de recetas y estado.
  function list(){
    const counts = {};
    if(typeof DISHES!=='undefined') Object.entries(DISHES).forEach(([id,d])=>{
      if(typeof id==='string' && id[0]==='U') return;      // recetas propias: no cuentan para cocinas
      const k = (d.cuisine && d.cuisine!=='base') ? d.cuisine : 'base';
      counts[k]=(counts[k]||0)+1;
    });
    return Object.values(_registry).map(c=> Object.assign({}, c, { count:counts[c.id]||0, on:isOn(c.id) }));
  }

  // Paquetes incluidos con la app que aún no se han cargado (catálogo descargable).
  const BUNDLED = [
    { id:'cas', ico:'🏠', lbl:'Cocina casera', url:'packs/casera.json' },
    { id:'ita', ico:'🇮🇹', lbl:'Comida italiana', url:'packs/italiana.json' },
    { id:'mex', ico:'🇲🇽', lbl:'Comida mexicana', url:'packs/mexicana.json' },
    { id:'jap', ico:'🇯🇵', lbl:'Comida japonesa', url:'packs/japonesa.json' },
    { id:'gri', ico:'🇬🇷', lbl:'Comida griega', url:'packs/griega.json' },
    { id:'ind', ico:'🇮🇳', lbl:'Comida india', url:'packs/india.json' },
    { id:'ome', ico:'🧆', lbl:'Oriente Medio', url:'packs/oriente-medio.json' },
    { id:'tai', ico:'🇹🇭', lbl:'Comida tailandesa', url:'packs/tailandesa.json' },
    { id:'per', ico:'🇵🇪', lbl:'Comida peruana', url:'packs/peru.json' },
    { id:'cor', ico:'🇰🇷', lbl:'Comida coreana', url:'packs/corea.json' }
  ];
  function bundledAvailable(){ return BUNDLED.filter(b=> !_registry[b.id]); }

  // ── Arranque: re-funde los paquetes guardados ──
  loadPacksLS().forEach(mergePack);

  window.dishHiddenByCuisine = dishHiddenByCuisine;
  window.Cuisines = { list, isOn, setOn, loadPack, removePack, importFile, fetchPack, bundledAvailable, mergePack };
})();
