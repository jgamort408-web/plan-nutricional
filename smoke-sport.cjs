/* Smoke test de la sección Deporte por CDP (sin npm, WebSocket nativo de Node 22).
   Verifica que la app arranca SIN errores y que el flujo nuevo funciona:
   generador → plan con fases → modo entrenamiento → registro → progreso.

   Comprueba el arranque en CADA vista guardada (ex/sess/scal/prog): un bug
   anterior solo aparecía con la vista 'cal' persistida en localStorage y los
   tests con almacenamiento limpio no lo detectaban.

   Uso:  python -m http.server 8000    (en otra terminal)
         node smoke-sport.js
*/
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:8000/Menu%20Nutricional.html';
const PORT = 9344;
const OUT = path.join(__dirname, '.shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getJSON(url){
  return new Promise((res, rej) => {
    http.get(url, r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d))}catch(e){rej(e)} }); }).on('error', rej);
  });
}
class CDP {
  constructor(ws){ this.ws=ws; this.id=0; this.waiters=new Map(); this.handlers=new Map();
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.waiters.has(m.id)){ const w=this.waiters.get(m.id); this.waiters.delete(m.id); m.error?w.rej(new Error(JSON.stringify(m.error))):w.res(m.result); }
      else if (m.method && this.handlers.has(m.method)){ this.handlers.get(m.method)(m.params); }
    });
  }
  send(method, params={}){ const id=++this.id; this.ws.send(JSON.stringify({id,method,params}));
    return new Promise((res,rej)=>{ this.waiters.set(id,{res,rej}); setTimeout(()=>{ if(this.waiters.has(id)){this.waiters.delete(id);rej(new Error('timeout '+method))} },30000); }); }
  on(method, fn){ this.handlers.set(method, fn); }
}
function connect(wsUrl){
  return new Promise((res,rej)=>{ const ws=new WebSocket(wsUrl); ws.addEventListener('open',()=>res(new CDP(ws))); ws.addEventListener('error',rej); });
}

let pass = 0, fail = 0;
const ok  = (n, extra) => { pass++; console.log(`  \x1b[32m✔\x1b[0m ${n}${extra?' · '+extra:''}`); };
const bad = (n, why)  => { fail++; console.log(`  \x1b[31m✘ ${n}\x1b[0m${why?' · '+why:''}`); };

async function run(){
  const args = ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(OUT,'profile-smoke')}`, '--window-size=390,844', 'about:blank'];
  const chrome = spawn(CHROME, args, { stdio:'ignore' });

  let target=null;
  for (let i=0;i<40;i++){ try{ const list=await getJSON(`http://127.0.0.1:${PORT}/json`); target=list.find(t=>t.type==='page'); if(target&&target.webSocketDebuggerUrl) break; }catch(e){} await sleep(250); }
  if(!target){ console.error('no CDP target · ¿está Chrome instalado en esa ruta?'); process.exit(1); }

  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable'); await cdp.send('Runtime.enable'); await cdp.send('Log.enable').catch(()=>{});
  await cdp.send('Network.enable').catch(()=>{});
  await cdp.send('Network.setCacheDisabled', { cacheDisabled:true }).catch(()=>{});
  await cdp.send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:2, mobile:true });

  // Captura TODO error de consola / excepción no capturada.
  // Se ignora un único caso, provocado por el propio test: el seed
  // desregistra el service worker al cargar, y el reg.update() de la app
  // se encuentra sin registro. No ocurre en uso real.
  const IGNORE = /Failed to update a ServiceWorker/;
  const errors = [];
  const note = m => { if(m && !IGNORE.test(m)) errors.push(m); };
  cdp.on('Runtime.exceptionThrown', p => {
    const d = p.exceptionDetails || {};
    note((d.exception && d.exception.description) || d.text || 'excepción');
  });
  cdp.on('Runtime.consoleAPICalled', p => {
    if(p.type === 'error') note('console.error: ' + (p.args||[]).map(a=>a.value||a.description||'').join(' '));
  });

  const evalJS = async (expr) => {
    const r = await cdp.send('Runtime.evaluate', { expression:`(function(){try{${expr}}catch(e){return 'ERR:'+e.message}})()`, awaitPromise:true, returnByValue:true });
    return r.result && r.result.value;
  };
  const waitFor = async (expr, tries=60, gap=250) => { for(let i=0;i<tries;i++){ const v = await evalJS(`return (${expr})?'1':'0';`); if(v==='1') return true; await sleep(gap); } return false; };
  const shot = async (name) => { const r = await cdp.send('Page.captureScreenshot', {format:'png'}); fs.writeFileSync(path.join(OUT, name+'.png'), Buffer.from(r.data,'base64')); };

  const seed = (view) => `try{
    localStorage.setItem('mnut:onboarded:v1','1');
    ['nutri','sport','week','mente'].forEach(k=>localStorage.setItem('mnut:tut:'+k,'1'));
    localStorage.setItem('sport:section','"sport"');
    localStorage.setItem('sport:view',${JSON.stringify(JSON.stringify(view))});
  }catch(e){}
  // el SW se limpia en 'load': llamarlo en document-start lanza InvalidStateError
  addEventListener('load', function(){
    try{ if(navigator.serviceWorker) navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){}); }catch(e){}
    try{ if(window.caches) caches.keys().then(function(ks){ks.forEach(function(k){caches.delete(k);});}).catch(function(){}); }catch(e){}
  });`;

  /* ── 1. Arranque en cada vista guardada ─────────────────── */
  console.log('\n\x1b[1m1 · Arranque con cada vista persistida\x1b[0m');
  let seedId = null;
  for(const view of ['ex','sess','scal','prog','cal']){
    errors.length = 0;
    // sustituye el seed anterior (si no, se acumulan uno por vuelta)
    if(seedId) await cdp.send('Page.removeScriptToEvaluateOnNewDocument', {identifier:seedId}).catch(()=>{});
    seedId = (await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: seed(view) })).identifier;
    await new Promise(async res=>{ cdp.on('Page.loadEventFired', ()=>res()); await cdp.send('Page.navigate', {url: BASE + '?t=' + Date.now()}); setTimeout(res, 9000); });
    const ready = await waitFor(`typeof window.logAll==='function' && typeof window.renderProgress==='function' && document.querySelector('.hdr')`);
    // la splash se quita ~950 ms después de `load`: hay que esperarla, no
    // mirarla al instante (si sigue ahí a los 6 s, es que la app no arrancó)
    const gone = await waitFor(`(function(){var s=document.getElementById('splash'); return !s || s.classList.contains('hide') || getComputedStyle(s).opacity==='0';})()`, 24, 250);
    const splash = gone ? 'ok' : 'STUCK';
    const overlay = await evalJS(`return document.body.innerHTML.indexOf('La app no pudo arrancar')>=0?'BOOTFAIL':'ok';`);
    if(!ready)             bad(`vista '${view}'`, 'la API no quedó lista');
    else if(splash==='STUCK') bad(`vista '${view}'`, 'splash colgado');
    else if(overlay==='BOOTFAIL') bad(`vista '${view}'`, 'overlay de error de arranque');
    else if(errors.length) bad(`vista '${view}'`, errors[0].split('\n')[0]);
    else ok(`vista '${view}'`);
  }

  /* ── 2. Catálogo y perfil ───────────────────────────────── */
  console.log('\n\x1b[1m2 · Datos y perfil\x1b[0m');
  const nEx = await evalJS(`return Object.keys(EXERCISES).length;`);
  (nEx > 200) ? ok('catálogo cargado', nEx + ' ejercicios') : bad('catálogo', 'solo ' + nEx);
  const prof = await evalJS(`return JSON.stringify(spProfile());`);
  prof && prof.indexOf('level') >= 0 ? ok('perfil por defecto', prof) : bad('perfil');

  /* ── 3. Generador · ninguna combinación debe fallar ─────── */
  console.log('\n\x1b[1m3 · Generador (robustez)\x1b[0m');
  const genTest = await evalJS(`
    var mus = Object.keys(EX_MUSCLES), discs = ['all'].concat(Object.keys(EX_SPORTS));
    var nulls = [], total = 0, dur = [30,45,60], inten = ['suave','media','alta'];
    for(var d=0; d<discs.length; d++){
      for(var i=0;i<mus.length;i++){
        for(var k=0;k<dur.length;k++){
          total++;
          var s = buildSessionByCriteria([mus[i]], dur[k], inten[k%3], discs[d]);
          if(!s && discs[d]==='all') nulls.push(mus[i]+'/'+discs[d]+'/'+dur[k]);
        }
      }
    }
    return JSON.stringify({total:total, nulls:nulls.length, ej:nulls.slice(0,3)});`);
  const g = JSON.parse(genTest || '{}');
  g.nulls === 0 ? ok('generador sin nulos en "cualquiera"', g.total + ' combinaciones')
                : bad('generador', g.nulls + ' nulos, p.ej. ' + (g.ej||[]).join(', '));

  // determinismo: dos llamadas iguales → mismo resultado
  const det = await evalJS(`
    var a = buildSessionByCriteria(['pecho','espalda','core'], 45, 'media', 'gimnasio');
    var b = buildSessionByCriteria(['pecho','espalda','core'], 45, 'media', 'gimnasio');
    return (a.items.map(i=>i.e).join()===b.items.map(i=>i.e).join())?'det':'random';`);
  det === 'det' ? ok('selección determinista') : bad('selección', 'sigue siendo aleatoria');

  // equilibrio empuje/tracción
  const bal = await evalJS(`
    var s = buildSessionByCriteria(['pecho','espalda','hombro','biceps','triceps'], 60, 'media', 'gimnasio');
    var p = {}; s.items.forEach(function(i){ var e=EXERCISES[i.e]; p[e.pat]=(p[e.pat]||0)+1; });
    var dh = Math.abs((p.empuje_h||0)-(p.traccion_h||0)), dv = Math.abs((p.empuje_v||0)-(p.traccion_v||0));
    return JSON.stringify({pat:p, okH:dh<=1, okV:dv<=1});`);
  const b2 = JSON.parse(bal||'{}');
  (b2.okH && b2.okV) ? ok('equilibrio empuje:tracción', JSON.stringify(b2.pat)) : bad('equilibrio', JSON.stringify(b2.pat));

  // el perfil filtra por material
  const gear = await evalJS(`
    var s = buildSessionByCriteria(['pecho','cuadriceps','core'], 45, 'media', 'all', {profile:{level:'novato', gear:['ninguno'], injuries:[]}});
    if(!s) return 'NULL';
    var bad = s.items.filter(function(i){ var eq=(EXERCISES[i.e].equip||'').toLowerCase();
      return /barra|mancuern|maquina|polea|prensa/.test(eq); });
    return JSON.stringify({n:s.items.length, conMaterial:bad.length});`);
  const gg = JSON.parse(gear||'{}');
  (gg.conMaterial === 0) ? ok('filtro de material (solo peso corporal)', gg.n + ' ejercicios')
                         : bad('filtro de material', gg.conMaterial + ' requieren material');

  // Cobertura por disciplina: el generador debe montar una sesión REAL de
  // cada deporte, sin caer al fallback de gimnasio. Antes fallaba en
  // natación (6 ejercicios), ciclismo (4) y baile (2).
  const cov = await evalJS(`
    var flojas = [], sinSesion = [];
    Object.keys(EX_SPORTS).forEach(function(d){
      var n = Object.keys(EXERCISES).filter(function(k){ return exDisc(EXERCISES[k])===d; }).length;
      if(n < 10) flojas.push(d+':'+n);
      // ¿puede montar una sesión con los músculos típicos de ese deporte?
      var s = buildSessionByCriteria(['cardio','core','espalda'], 45, 'media', d);
      if(!s) s = buildSessionByCriteria(['cardio'], 45, 'media', d);
      if(!s) sinSesion.push(d);
      else if(s.items.some(function(i){ return exDisc(EXERCISES[i.e])!==d; })) sinSesion.push(d+'(mezcla)');
    });
    return JSON.stringify({flojas:flojas, sinSesion:sinSesion, total:Object.keys(EXERCISES).length});`);
  const CV = JSON.parse(cov||'{}');
  (CV.total >= 340) ? ok('catálogo ampliado', CV.total + ' ejercicios') : bad('catálogo', CV.total);
  (CV.sinSesion.length === 0) ? ok('cada disciplina genera sesión propia', 'sin mezclas')
                              : bad('sesión por disciplina', CV.sinSesion.join(', '));
  (CV.flojas.length <= 3) ? ok('disciplinas con catálogo suficiente', CV.flojas.length + ' flojas: ' + CV.flojas.join(', '))
                          : bad('disciplinas pobres', CV.flojas.join(', '));

  // lesión: rodilla debe excluir sentadillas
  const inj = await evalJS(`
    var s = buildSessionByCriteria(['cuadriceps','gluteo','core'], 45, 'media', 'all', {profile:{level:'intermedio', gear:['barra','mancuernas','maquinas'], injuries:['rodilla']}});
    if(!s) return 'NULL';
    var bad = s.items.filter(function(i){ return ['sentadilla','pliometria','carrera'].indexOf(EXERCISES[i.e].pat)>=0; });
    return JSON.stringify({n:s.items.length, prohibidos:bad.length});`);
  const ii = JSON.parse(inj||'{}');
  (ii.prohibidos === 0) ? ok('filtro de lesión (rodilla)', ii.n + ' ejercicios') : bad('filtro de lesión', ii.prohibidos + ' prohibidos');

  /* ── 4. Periodización ───────────────────────────────────── */
  console.log('\n\x1b[1m4 · Periodización\x1b[0m');
  const ph = await evalJS(`return [1,2,3,4,5,8].map(spPhaseOf).join(',');`);
  ph === 'acumulacion,acumulacion2,intensificacion,deload,acumulacion,deload'
    ? ok('fases del mesociclo', ph) : bad('fases', ph);
  const dl = await evalJS(`
    var s = {items:[{e:Object.keys(EXERCISES)[0], sets:4, reps:10}]};
    var d = spApplyPhase(s,'deload'), i = spApplyPhase(s,'intensificacion');
    return JSON.stringify({deloadSets:d.items[0].sets, intenSets:i.items[0].sets, intenReps:i.items[0].reps});`);
  const dd = JSON.parse(dl||'{}');
  (dd.deloadSets === 2 && dd.intenSets === 5 && dd.intenReps < 10)
    ? ok('descarga e intensificación', JSON.stringify(dd)) : bad('fases aplicadas', JSON.stringify(dd));

  /* ── 5. Registro y progresión de cargas ─────────────────── */
  console.log('\n\x1b[1m5 · Registro y progresión\x1b[0m');
  const logT = await evalJS(`
    localStorage.removeItem('sport:log:v1');
    var id = Object.keys(EXERCISES).filter(function(k){return EXERCISES[k].pat==='empuje_h';})[0];
    // sesión 1: completa 3x8 con RPE 7 → debe sugerir +2,5 kg
    logSave({id:'t1', date:'2026-07-01', sessName:'T1', who:'A', durSec:3000,
      ex:[{e:id, sets:[{kg:60,reps:8,rpe:7,done:true},{kg:60,reps:8,rpe:7,done:true},{kg:60,reps:8,rpe:7,done:true}]}]});
    var s1 = logSuggestLoad(id,'A',8);
    // sesión 2: falla reps con RPE 10 → debe bajar
    logSave({id:'t2', date:'2026-07-08', sessName:'T2', who:'A', durSec:3000,
      ex:[{e:id, sets:[{kg:80,reps:4,rpe:10,done:true},{kg:80,reps:3,rpe:10,done:true}]}]});
    var s2 = logSuggestLoad(id,'A',8);
    var pr = logBestFor(id,'A');
    var vol = logVolumeByMuscle('2026-07-01','2026-07-31','A');
    var ton = logTonnage(logGet('t1'));
    return JSON.stringify({sug1:s1&&s1.kg, sug2:s2&&s2.kg, prKg:pr&&pr.kg, rm:pr&&pr.rm, ton:ton, volN:Object.keys(vol).length});`);
  const L = JSON.parse(logT||'{}');
  (L.sug1 === 62.5) ? ok('progresión sube tras completar', '60 → ' + L.sug1 + ' kg') : bad('progresión al alza', 'sugirió ' + L.sug1);
  (L.sug2 === 72.5) ? ok('progresión baja tras fallar', '80 → ' + L.sug2 + ' kg') : bad('progresión a la baja', 'sugirió ' + L.sug2);
  (L.ton === 1440)  ? ok('tonelaje', L.ton + ' kg') : bad('tonelaje', L.ton);
  (L.rm > 0)        ? ok('1RM estimado', L.rm + ' kg') : bad('1RM');
  (L.volN > 0)      ? ok('volumen por músculo', L.volN + ' grupos') : bad('volumen');

  const csv = await evalJS(`var c=logToCSV('A'); return JSON.stringify({lineas:c.split('\\n').length, cab:c.split('\\n')[0]});`);
  const C = JSON.parse(csv||'{}');
  (C.lineas > 5) ? ok('exportación CSV', C.lineas + ' líneas') : bad('CSV', csv);

  /* ── 6. Modo entrenamiento ──────────────────────────────── */
  console.log('\n\x1b[1m6 · Modo entrenamiento\x1b[0m');
  const tr = await evalJS(`
    localStorage.removeItem('sport:train:v1');
    var sid = Object.keys(SESSIONS)[0];
    startTraining(sid,'A');
    return JSON.stringify({overlay: !!document.getElementById('trainOverlay'),
                           ejercicios: TrainState ? TrainState.ex.length : 0,
                           reloj: !!document.getElementById('trClock'),
                           boton: !!document.getElementById('trDone')});`);
  const T = JSON.parse(tr||'{}');
  (T.overlay && T.ejercicios > 0 && T.reloj) ? ok('abre el modo entrenamiento', T.ejercicios + ' ejercicios') : bad('modo entrenamiento', tr);
  await sleep(400);
  await shot('smoke-train');

  const setFlow = await evalJS(`
    var before = TrainState.ex[0].sets.filter(function(s){return s.done;}).length;
    document.getElementById('trKg') && (function(){ var i=document.getElementById('trKg'); i.value='50'; i.dispatchEvent(new Event('input')); })();
    document.getElementById('trReps') && (function(){ var i=document.getElementById('trReps'); i.value='10'; i.dispatchEvent(new Event('input')); })();
    var btn = document.getElementById('trDone'); if(btn) btn.click();
    var after = TrainState.ex[0].sets.filter(function(s){return s.done;}).length;
    return JSON.stringify({antes:before, despues:after, descanso: trHasPending()?1:0, kg:TrainState.ex[0].sets[0].kg});`);
  const SF = JSON.parse(setFlow||'{}');
  (SF.despues === SF.antes + 1) ? ok('cierra una serie', SF.kg + ' kg registrados') : bad('cerrar serie', setFlow);
  (SF.descanso === 1) ? ok('estado persistido (reanudable)') : bad('persistencia del entreno');

  const commit = await evalJS(`
    var n0 = logAll().length;
    trCommit(4,'smoke test');
    var n1 = logAll().length;
    return JSON.stringify({antes:n0, despues:n1, limpio: trHasPending()?0:1, ov: document.getElementById('trainOverlay')?1:0});`);
  const CM = JSON.parse(commit||'{}');
  (CM.despues === CM.antes + 1) ? ok('guarda el entrenamiento en el historial') : bad('guardar entreno', commit);
  (CM.limpio === 1 && CM.ov === 0) ? ok('limpia el estado y cierra el overlay') : bad('limpieza post-entreno', commit);

  /* ── 7. Pantalla de progreso ────────────────────────────── */
  console.log('\n\x1b[1m7 · Pantalla de progreso\x1b[0m');
  errors.length = 0;
  const pg = await evalJS(`
    showSportView('prog');
    var h = document.getElementById('sportview-prog');
    return JSON.stringify({visible: !h.classList.contains('hidden'),
                           kpis: h.querySelectorAll('.pg-kpi').length,
                           barras: h.querySelectorAll('.pg-bar-row').length,
                           entradas: h.querySelectorAll('.pg-entry').length,
                           grafica: h.querySelectorAll('.pg-chart').length});`);
  const P = JSON.parse(pg||'{}');
  (P.visible && P.kpis === 4) ? ok('renderiza la vista de progreso', P.kpis + ' KPIs') : bad('vista de progreso', pg);
  (P.barras > 0) ? ok('barras de volumen', P.barras + ' grupos') : bad('barras de volumen');
  (P.entradas > 0) ? ok('historial', P.entradas + ' entradas') : bad('historial');
  await sleep(400);
  await shot('smoke-progress');

  // desplegar una entrada del historial
  const exp = await evalJS(`
    var b = document.querySelector('#sportview-prog [data-toggle]'); if(!b) return 'NOBTN';
    b.click();
    return JSON.stringify({abierta: document.querySelectorAll('#sportview-prog .pg-entry.open').length,
                           series: document.querySelectorAll('#sportview-prog .pg-e-set').length});`);
  const E = JSON.parse(exp||'{}');
  (E.abierta === 1 && E.series > 0) ? ok('despliega una entrada', E.series + ' series') : bad('desplegar entrada', exp);

  // sin datos → estado de bienvenida
  const empty = await evalJS(`
    localStorage.removeItem('sport:log:v1');
    renderProgress();
    return document.querySelector('#sportview-prog .pg-onboard')?'onboard':'sin-onboard';`);
  empty === 'onboard' ? ok('estado vacío con instrucciones') : bad('estado vacío', empty);

  /* ── 8. Modo oscuro ─────────────────────────────────────── */
  console.log('\n\x1b[1m8 · Modo oscuro\x1b[0m');
  const dark = await evalJS(`
    document.documentElement.setAttribute('data-theme','dark');
    localStorage.setItem('sport:log:v1', JSON.stringify([{id:'d1',date:'2026-07-15',sessName:'Dark',who:'A',durSec:3000,
      ex:[{e:Object.keys(EXERCISES)[0], sets:[{kg:50,reps:10,rpe:8,done:true}]}]}]));
    renderProgress();
    var k = document.querySelector('#sportview-prog .pg-kpi');
    var cs = getComputedStyle(k);
    function lum(c){ var m=c.match(/\\d+/g); if(!m) return -1; return (0.299*m[0]+0.587*m[1]+0.114*m[2])/255; }
    return JSON.stringify({fondo:cs.backgroundColor, lum:lum(cs.backgroundColor).toFixed(2)});`);
  const D = JSON.parse(dark||'{}');
  (+D.lum < 0.4) ? ok('superficies oscuras en modo oscuro', D.fondo) : bad('modo oscuro', 'fondo claro: ' + D.fondo);
  await sleep(300);
  await shot('smoke-progress-dark');
  await evalJS(`document.documentElement.removeAttribute('data-theme');`);

  if(errors.length) bad('errores de consola durante 6-8', errors[0].split('\n')[0]);
  else ok('sin errores de consola');

  /* ── Resumen ────────────────────────────────────────────── */
  console.log(`\n\x1b[1m${pass} pruebas OK · ${fail} fallos\x1b[0m`);
  if(fail) console.log('Capturas en .shots/');
  try{ chrome.kill(); }catch(e){}
  process.exit(fail ? 1 : 0);
}

run().catch(e => { console.error('smoke falló:', e.message); process.exit(1); });
