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
  // sesiones de gimnasio con máquinas · 60 min · verificación de duración
  const gymS = await evalJS(`
    var ids=['gym_maquinas_fullbody_princ','gym_maquinas_torso','gym_maquinas_pierna','gym_maquinas_fullbody_avz'];
    var r=ids.map(function(id){ var s=SESSIONS[id]; if(!s) return {id:id,falta:1};
      var t=sessionTotals(s,'A');
      var todasMaq=(s.items||[]).every(function(it){ var e=EXERCISES[it.e];
        return e && /maquina|máquina|polea|prensa|smith|contractora|peck|elíptica/i.test((e.equip||'')+' '+e.name); });
      return {id:id, min:t.min, ok60:t.min>=50&&t.min<=66, maq:todasMaq, niv:s.level}; });
    return JSON.stringify(r);`);
  const GY = JSON.parse(gymS||'[]');
  const gyOk = GY.length===4 && GY.every(x=>x.ok60 && x.maq && !x.falta);
  gyOk ? ok('4 sesiones de gimnasio máquinas 60 min', GY.map(x=>x.niv+' '+x.min+'min').join(' · '))
       : bad('sesiones gimnasio', gymS);

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
  (CV.total >= 330) ? ok('catálogo ampliado', CV.total + ' ejercicios') : bad('catálogo', CV.total);
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

  /* Los botones que abren un diálogo (Terminar, Cambiar, Saltar, Abandonar,
     y el RPE al cerrar el último set) estuvieron MUERTOS: .train-ov tenía
     z-index 9000 y los diálogos 300/4000, así que se abrían por detrás.
     Se comprueba que el diálogo queda por ENCIMA, no solo que exista. */
  const dlgOver = async (name, click) => {
    const r = await evalJS(`
      ${click}
      return new Promise(function(res){ setTimeout(function(){
        var ov = document.querySelector('.train-ov');
        var dlg = document.querySelector('.pn-dlg-back, #formBg.show, .modal-bg.show');
        if(!dlg) return res('SIN-DIALOGO');
        var zo = +getComputedStyle(ov).zIndex || 0, zd = +getComputedStyle(dlg).zIndex || 0;
        var vis = getComputedStyle(dlg).display !== 'none';
        res(JSON.stringify({zOverlay:zo, zDialog:zd, encima: zd > zo, visible: vis}));
      }, 320); });`);
    if(r === 'SIN-DIALOGO'){ bad(`botón ${name}`, 'no abre diálogo'); return; }
    const d = JSON.parse(r||'{}');
    (d.encima && d.visible) ? ok(`botón ${name}`, `diálogo z${d.zDialog} sobre overlay z${d.zOverlay}`)
                            : bad(`botón ${name}`, `diálogo z${d.zDialog} DETRÁS del overlay z${d.zOverlay}`);
    await evalJS(`var b=document.querySelector('.pn-dlg-btn.ghost,[data-act="cancel"],#trFinCancel,#trAltCancel,#trRpeSkip'); if(b) b.click(); else if(typeof closeForm==='function') closeForm();`);
    await sleep(280);
  };
  console.log('  · botones que abren diálogo:');
  await dlgOver('Terminar',  `var b=document.getElementById('trFin2'); if(b) b.click();`);
  await dlgOver('Cambiar',   `var b=document.getElementById('trSwap'); if(b) b.click();`);
  await dlgOver('Saltar',    `var b=document.getElementById('trSkip'); if(b) b.click();`);
  await dlgOver('Abandonar', `var b=document.getElementById('trQuit'); if(b) b.click();`);

  // botones sin diálogo: deshacer / serie extra / siguiente
  const plain = await evalJS(`
    // completa el ejercicio actual para que aparezcan Deshacer / Serie extra
    var x = TrainState.ex[TrainState.cur];
    x.sets.forEach(function(s){ s.done = true; });
    renderTrain();
    var hayUndo = !!document.getElementById('trUndo'), hayAdd = !!document.getElementById('trAdd');
    // Deshacer PRIMERO: al añadir serie la vista vuelve a modo entrada y
    // el botón #trUndo desaparece (correcto), así que probarlos al revés
    // daba un falso negativo.
    var d0 = x.sets.filter(function(s){return s.done;}).length;
    var u = document.getElementById('trUndo'); if(u) u.click();
    var d1 = TrainState.ex[TrainState.cur].sets.filter(function(s){return s.done;}).length;
    // vuelve a completarlas para recuperar el panel de "ejercicio completado"
    TrainState.ex[TrainState.cur].sets.forEach(function(s){ s.done = true; });
    renderTrain();
    var n0 = TrainState.ex[TrainState.cur].sets.length;
    var a = document.getElementById('trAdd'); if(a) a.click();
    var n1 = TrainState.ex[TrainState.cur].sets.length;
    return JSON.stringify({hayUndo:hayUndo, hayAdd:hayAdd, addOk:n1===n0+1, undoOk:d1===d0-1});`);
  const PL = JSON.parse(plain||'{}');
  (PL.hayAdd && PL.addOk)   ? ok('botón Serie extra') : bad('botón Serie extra', plain);
  (PL.hayUndo && PL.undoOk) ? ok('botón Deshacer')    : bad('botón Deshacer', plain);

  const commit = await evalJS(`
    var n0 = logAll().length;
    trCommit(4,'smoke test');
    var n1 = logAll().length;
    return JSON.stringify({antes:n0, despues:n1, limpio: trHasPending()?0:1, ov: document.getElementById('trainOverlay')?1:0});`);
  const CM = JSON.parse(commit||'{}');
  (CM.despues === CM.antes + 1) ? ok('guarda el entrenamiento en el historial') : bad('guardar entreno', commit);
  (CM.limpio === 1 && CM.ov === 0) ? ok('limpia el estado y cierra el overlay') : bad('limpieza post-entreno', commit);

  /* ── 5c. Pictogramas de ejercicios ──────────────────────── */
  console.log('\n\x1b[1m5c · Pictogramas\x1b[0m');
  const illus = await evalJS(`
    var ks=Object.keys(EXERCISES);
    var vacios=ks.filter(function(id){ var s=exIllus(id); return !s || s.indexOf('<path')<0 && s.indexOf('<circle')<0; });
    var genericos=ks.filter(function(id){ return illIsGeneric(id); });
    // que cada SVG sea autocontenido (sin http/src externos)
    var externos=ks.filter(function(id){ return /https?:|src=|<image/.test(exIllus(id)); });
    // muestra de coherencia
    var squat=illPoseKey(EXERCISES['sentadilla_trasera'], 'sentadilla_trasera');
    var swim=EXERCISES['nadar_crol']?illPoseKey(EXERCISES['nadar_crol'],'nadar_crol'):'';
    return JSON.stringify({total:ks.length, vacios:vacios.length, genericos:genericos.length, externos:externos.length, squat:squat, swim:swim});`);
  const IL = JSON.parse(illus||'{}');
  (IL.vacios===0) ? ok('todos los ejercicios tienen pictograma', IL.total) : bad('pictogramas vacíos', IL.vacios);
  (IL.externos===0) ? ok('pictogramas autocontenidos (offline)') : bad('pictogramas', IL.externos+' con recursos externos');
  (IL.genericos<=3) ? ok('cobertura de poses', IL.genericos+' genéricos') : bad('poses genéricas', IL.genericos);
  (IL.squat==='squat' && IL.swim==='swim') ? ok('resolución coherente (sentadilla→squat, crol→swim)') : bad('resolución', illus);
  // que aparezcan en las tarjetas del catálogo
  const inCards = await evalJS(`
    showSportView('ex');
    return new Promise(function(res){ setTimeout(function(){
      res(document.querySelectorAll('#spExGrid .sp-card .ex-illus, .sp-grid .sp-card .ex-illus').length);
    },400); });`);
  (inCards>5) ? ok('pictogramas en las tarjetas del catálogo', inCards+' visibles') : bad('pictogramas en catálogo', 'solo '+inCards);
  await shot('smoke-illus-cards');
  // mapa muscular (misma info que las guías externas, imagen nuestra)
  const mmap = await evalJS(`
    var svg = muscleMapSVG(['pecho','hombro','triceps']);
    var prim = (svg.match(/bm-hi prim/g)||[]).length;
    var sec  = (svg.match(/bm-hi sec/g)||[]).length;
    var ext  = /https?:|src=|<image/.test(svg);
    openExerciseDetail('press_banca_barra');
    var enDetalle = !!document.querySelector('.muscle-map .bm-svg');
    if(typeof closeForm==='function') closeForm();
    return JSON.stringify({prim:prim, sec:sec, externo:ext, enDetalle:enDetalle});`);
  const MM = JSON.parse(mmap||'{}');
  (MM.prim>0 && MM.sec>0 && !MM.externo) ? ok('mapa muscular (primario+secundarios, autocontenido)') : bad('mapa muscular', mmap);
  (MM.enDetalle) ? ok('mapa muscular en el detalle del ejercicio') : bad('mapa muscular en detalle', mmap);
  await sleep(200);
  // preferencia de imagen real (ex-img/) cuando existe manifest
  const imgPref = await evalJS(`
    var sinImg = /<svg/.test(exIllusBox('press_banca_barra',{}));       // por defecto: pictograma SVG
    var nullPath = illImageFor('press_banca_barra')===null;
    illUseManifest({press_banca_barra:'png'});                          // simula que el generador creó una
    var box = exIllusBox('press_banca_barra',{});
    var usaImg = /<img[^>]+ex-img\\/press_banca_barra\\.png/.test(box);
    illUseManifest(null);                                               // restaura
    var vuelveSvg = /<svg/.test(exIllusBox('press_banca_barra',{}));
    return JSON.stringify({sinImg:sinImg, nullPath:nullPath, usaImg:usaImg, vuelveSvg:vuelveSvg});`);
  const IP = JSON.parse(imgPref||'{}');
  (IP.sinImg && IP.nullPath && IP.vuelveSvg) ? ok('sin imágenes: usa el pictograma SVG (fallback)') : bad('fallback a SVG', imgPref);
  (IP.usaImg) ? ok('con manifest: la app prefiere la imagen real (ex-img/)') : bad('preferencia de imagen', imgPref);

  /* ── 6a. Menú de ayuda en móvil (no se sale de pantalla) ── */
  console.log('\n\x1b[1m6a · Menú de ayuda (móvil)\x1b[0m');
  const help = await evalJS(`
    var b=document.getElementById('helpBtn'); if(!b) return 'NOBTN';
    b.click();
    return new Promise(function(res){ setTimeout(function(){
      var m=document.getElementById('helpMenu'); var r=m.getBoundingClientRect();
      res(JSON.stringify({
        dentroX: r.left>=-1 && r.right<=window.innerWidth+1,
        dentroY: r.top>=0 && r.bottom<=window.innerHeight+1,
        scroll: getComputedStyle(m).overflowY,
        left:Math.round(r.left), right:Math.round(r.right), bottom:Math.round(r.bottom), winW:window.innerWidth, winH:window.innerHeight}));
    },350); });`);
  const H = JSON.parse(help||'{}');
  (H.dentroX) ? ok('menú de ayuda no se sale por los lados', `${H.left}–${H.right} en ${H.winW}`) : bad('menú ayuda horizontal', help);
  (H.dentroY && /auto|scroll/.test(H.scroll)) ? ok('menú de ayuda entra en alto (con scroll)', `bottom ${H.bottom} de ${H.winH}`) : bad('menú ayuda vertical', help);
  await evalJS(`document.getElementById('helpBtn').click(); return '1';`);
  await sleep(150);

  /* ── 6b. Material, selector y barra de acceso ───────────── */
  console.log('\n\x1b[1m6b · Material y accesos\x1b[0m');
  const gearT = await evalJS(`
    // el material se deriva del texto libre de equip
    var pruebas = [
      ['sf_jalon_con_agarre_ancho','polea'],
      ['dominadas','barra_fija'],
      ['nadar_crol','piscina']
    ];
    var fallos = pruebas.filter(function(p){ return gearItemsOf(p[0]).indexOf(p[1]) < 0; });
    // exige TODO el material, no solo una coincidencia
    var soloBarra = ['barra'];
    var bancoNecesario = Object.keys(EXERCISES).filter(function(id){
      return gearItemsOf(id).indexOf('banco')>=0 && gearItemsOf(id).indexOf('barra')>=0; });
    var colados = bancoNecesario.filter(function(id){ return gearCanDo(id, soloBarra); });
    var cCasa = gearCoverage(gearItemsOfPlace('casa_sin'));
    var cGym  = gearCoverage(gearItemsOfPlace('gimnasio'));
    return JSON.stringify({fallos:fallos.length, colados:colados.length, casa:cCasa.n, gym:cGym.n, total:cCasa.total});`);
  const G = JSON.parse(gearT||'{}');
  (G.fallos === 0)  ? ok('material derivado del catálogo') : bad('gearItemsOf', G.fallos + ' fallos');
  (G.colados === 0) ? ok('exige TODO el material (barra + banco)') : bad('gearCanDo', G.colados + ' colados con solo barra');
  (G.casa > 20 && G.gym > G.casa) ? ok('cobertura por lugar', `casa sin material ${G.casa} · gimnasio ${G.gym} de ${G.total}`)
                                  : bad('cobertura por lugar', gearT);

  // el generador respeta el material real
  const gen2 = await evalJS(`
    var owned = gearItemsOfPlace('casa_sin');
    var s = buildSessionByCriteria(['pecho','cuadriceps','core'], 40, 'media', 'all', {profile:{level:'novato', gear:owned, injuries:[]}});
    if(!s) return 'NULL';
    var imposibles = s.items.filter(function(i){ return !gearCanDo(i.e, owned); });
    return JSON.stringify({n:s.items.length, imposibles:imposibles.length,
      nombres:imposibles.slice(0,2).map(function(i){return EXERCISES[i.e].name;})});`);
  const G2 = JSON.parse(gen2||'{}');
  (G2.imposibles === 0) ? ok('sesión en casa sin material', G2.n + ' ejercicios, todos posibles')
                        : bad('sesión en casa', G2.imposibles + ' imposibles: ' + (G2.nombres||[]).join(', '));

  // selector de ejercicios: buscador, filtros y orden por parecido
  const pick = await evalJS(`
    var sid = Object.keys(SESSIONS)[0];
    startTraining(sid,'A');
    var ref = TrainState.ex[0].e;
    trOpenPicker({title:'test', refId:ref, exclude:[ref]});
    var lista = document.getElementById('trPickList');
    if(!lista) return 'NO-ABRE';
    var n0 = lista.querySelectorAll('[data-pick]').length;
    var seps = lista.querySelectorAll('.tr-pick-sep').length;
    var primeros = [].slice.call(lista.querySelectorAll('[data-pick]')).slice(0,3);
    var sim = primeros.filter(function(b){ return /sim[12]/.test(b.className); }).length;
    // buscar
    var q = document.getElementById('trPickQ'); q.value='sentadilla'; q.dispatchEvent(new Event('input'));
    var n1 = lista.querySelectorAll('[data-pick]').length;
    var todosCoinciden = [].slice.call(lista.querySelectorAll('[data-pick]')).every(function(b){
      return /sentadilla/i.test(EXERCISES[b.dataset.pick].name + ' ' + (EXERCISES[b.dataset.pick].equip||'')); });
    return JSON.stringify({n0:n0, seps:seps, simArriba:sim, n1:n1, filtraBien:todosCoinciden});`);
  const PK = JSON.parse(pick||'{}');
  (PK.n0 > 5) ? ok('selector de ejercicios abre', PK.n0 + ' opciones') : bad('selector', pick);
  (PK.simArriba >= 2 && PK.seps > 0) ? ok('parecidos primero y agrupados', PK.seps + ' grupos') : bad('orden por parecido', pick);
  (PK.n1 > 0 && PK.n1 < PK.n0 && PK.filtraBien) ? ok('buscador filtra', `${PK.n0} → ${PK.n1}`) : bad('buscador', pick);
  await evalJS(`if(typeof closeForm==='function') closeForm();`);
  await sleep(250);

  // añadir ejercicio extra
  const extra = await evalJS(`
    var n0 = TrainState.ex.length;
    trAddExtraEx();
    var b = document.querySelector('#trPickList [data-pick]'); if(!b) return 'SIN-OPCIONES';
    var elegido = b.dataset.pick;
    b.click();
    return JSON.stringify({antes:n0, despues:TrainState.ex.length,
      esUltimo: TrainState.ex[TrainState.ex.length-1].e===elegido,
      marcadoExtra: !!TrainState.ex[TrainState.ex.length-1].extra,
      saltaAEl: TrainState.cur===TrainState.ex.length-1});`);
  const EX2 = JSON.parse(extra||'{}');
  (EX2.despues === EX2.antes+1 && EX2.esUltimo && EX2.marcadoExtra && EX2.saltaAEl)
    ? ok('añade ejercicio extra', `${EX2.antes} → ${EX2.despues} ejercicios`) : bad('ejercicio extra', extra);

  // deshacer disponible en modo entrada (el hueco que detectó el usuario)
  const undo2 = await evalJS(`
    var x = TrainState.ex[TrainState.cur];
    x.sets.forEach(function(s){ s.done=false; });
    renderTrain();
    var antesNada = !!document.getElementById('trUndo2');
    document.getElementById('trDone').click();
    var trasUna = !!document.getElementById('trUndo2');
    var d0 = TrainState.ex[TrainState.cur].sets.filter(function(s){return s.done;}).length;
    document.getElementById('trUndo2').click();
    var d1 = TrainState.ex[TrainState.cur].sets.filter(function(s){return s.done;}).length;
    return JSON.stringify({ocultoSinSeries:!antesNada, visibleTrasUna:trasUna, deshace:d1===d0-1});`);
  const U = JSON.parse(undo2||'{}');
  (U.ocultoSinSeries && U.visibleTrasUna && U.deshace) ? ok('deshacer disponible al instante') : bad('deshacer en modo entrada', undo2);

  // modificar el nº de series planificado (añadir y quitar)
  const editSets = await evalJS(`
    var x = TrainState.ex[TrainState.cur];
    x.sets.forEach(function(s){ s.done=false; });   // todas pendientes
    renderTrain();
    var n0 = x.sets.length;
    document.getElementById('trAddSet').click();
    var n1 = TrainState.ex[TrainState.cur].sets.length;
    var hayRm = !!document.getElementById('trRmSet');
    document.getElementById('trRmSet').click();
    var n2 = TrainState.ex[TrainState.cur].sets.length;
    return JSON.stringify({add:n1===n0+1, hayRm:hayRm, rm:n2===n1-1});`);
  const ES = JSON.parse(editSets||'{}');
  (ES.add && ES.hayRm && ES.rm) ? ok('editar nº de series (+/−)') : bad('editar series', editSets);

  await evalJS(`trClearState(); trExit();`);
  await sleep(200);

  // barra «Entrenar hoy»
  await evalJS(`
    var hoy = spKey(new Date());
    SportPlan.days[hoy] = [{s:Object.keys(SESSIONS)[0], who:'AB', week:1, phase:'acumulacion'}];
    setSection('sport'); showSportView('scal');
    return '1';`);
  // la barra entra con una animación de 280 ms (translateY): si se mide antes
  // de que acabe, sale desplazada y parece solapada con la tabbar
  await sleep(450);
  const barra = await evalJS(`
    var b = document.getElementById('trTodayBar');
    if(!b) return 'SIN-BARRA';
    var cs = getComputedStyle(b);
    var tab = document.getElementById('appTabbar');
    var rb = b.getBoundingClientRect(), rt = tab ? tab.getBoundingClientRect() : null;
    return JSON.stringify({visible: cs.display!=='none',
      tieneBoton: !!document.getElementById('trBarGo'),
      sobreTabbar: rt ? rb.bottom <= rt.top + 2 : true,
      dentroPantalla: rb.top >= 0 && rb.bottom <= window.innerHeight + 1,
      _bar: {bottom:cs.bottom, top:Math.round(rb.top), bot:Math.round(rb.bottom)},
      _tab: {top: rt?Math.round(rt.top):null, h: rt?Math.round(rt.height):null, disp: tab?getComputedStyle(tab).display:null},
      _win: window.innerHeight});`);
  if(barra === 'SIN-BARRA') bad('barra Entrenar hoy', 'no aparece');
  else {
    const B = JSON.parse(barra||'{}');
    (B.visible && B.tieneBoton) ? ok('barra «Entrenar hoy» visible') : bad('barra Entrenar hoy', barra);
    (B.sobreTabbar && B.dentroPantalla) ? ok('barra no tapada por la tabbar') : bad('posición de la barra', barra);
  }
  const play = await evalJS(`
    document.getElementById('trBarGo').click();
    return new Promise(function(res){ setTimeout(function(){
      res(JSON.stringify({overlay: !!document.getElementById('trainOverlay'),
                          barraOculta: !document.getElementById('trTodayBar')}));
    }, 350); });`);
  const PY = JSON.parse(play||'{}');
  (PY.overlay && PY.barraOculta) ? ok('▶ arranca el entreno de hoy') : bad('botón ▶ de la barra', play);
  await evalJS(`trClearState(); trExit();`);
  await sleep(200);

  // panel «Elegir entrenamiento»: sesiones, filtro por músculo, generar a medida
  const chooser = await evalJS(`
    // sin nada programado: la barra debe ofrecer "Elegir entrenamiento"
    delete SportPlan.days[spKey(new Date())]; persistSportPlan(); trClearState();
    setSection('sport'); showSportView('scal');
    var barBtn = document.getElementById('trBarPick2');
    if(!barBtn) return 'SIN-BOTON-ELEGIR';
    trChooseWorkout();
    var nSess = document.querySelectorAll('#trChooseList [data-start]').length;
    var hayMusculos = document.querySelectorAll('#trChooseMus .trc-mchip').length;
    var genDisabled = document.getElementById('trChooseGen').disabled;
    // elige pecho → debe habilitar generar y filtrar la lista
    var pecho=[].slice.call(document.querySelectorAll('#trChooseMus .trc-mchip')).find(function(b){return b.dataset.m==='pecho';});
    pecho.click();
    var genTrasMus = document.getElementById('trChooseGen').disabled;
    var nTrasFiltro = document.querySelectorAll('#trChooseList [data-start]').length;
    return JSON.stringify({nSess:nSess, hayMusculos:hayMusculos, genDisabledIni:genDisabled, genHabilitado:!genTrasMus, nTrasFiltro:nTrasFiltro});`);
  const CH = JSON.parse(chooser||'{}');
  (CH.nSess >= 10) ? ok('panel · lista de sesiones preparadas', CH.nSess + ' sesiones') : bad('panel sesiones', chooser);
  (CH.hayMusculos > 8 && CH.genDisabledIni && CH.genHabilitado) ? ok('panel · filtro por grupo muscular habilita generar') : bad('panel músculos', chooser);
  await shot('smoke-chooser');
  const genTrain = await evalJS(`
    document.getElementById('trChooseGen').click();
    return new Promise(function(res){ setTimeout(function(){
      res(JSON.stringify({overlay:!!document.getElementById('trainOverlay'),
        adhoc: TrainState && /_adhoc_/.test(TrainState.sessId),
        ejercicios: TrainState?TrainState.ex.length:0}));
    },350); });`);
  const GT = JSON.parse(genTrain||'{}');
  (GT.overlay && GT.adhoc && GT.ejercicios>0) ? ok('panel · generar a medida entra a entrenar', GT.ejercicios+' ejercicios') : bad('generar a medida', genTrain);
  await evalJS(`trClearState(); trExit();`);
  await sleep(200);
  await shot('smoke-train2');
  await evalJS(`trAddExtraEx();`); await sleep(400); await shot('smoke-picker');
  await evalJS(`if(typeof closeForm==='function') closeForm();`); await sleep(250);
  await evalJS(`trClearState(); trExit(); delete SportPlan.days[spKey(new Date())]; persistSportPlan();`);
  await sleep(200);

  // captura del asistente (paso de lugar + material)
  await evalJS(`
    setSection('sport'); showSportView('scal');
    if(typeof openSportAssistant==='function') openSportAssistant();
    return '1';`);
  await sleep(400);
  // avanza pulsando la primera tarjeta de cada paso hasta llegar al de material
  // (sin depender del orden exacto de los pasos)
  let reachedGear = false;
  for(let step = 0; step < 8 && !reachedGear; step++){
    reachedGear = await evalJS(`return document.querySelector('.masst-gear-g') ? '1' : '0';`) === '1';
    if(reachedGear) break;
    await evalJS(`
      // paso de lugar → elige "casa sin material"; resto → primera tarjeta
      var casa = [].slice.call(document.querySelectorAll('.masst-card')).find(function(x){return /sin material/i.test(x.textContent);});
      var b = casa || document.querySelector('.masst-card');
      if(b){ b.click(); }
      else { var nx = document.querySelector('[data-nav="next"]'); if(nx) nx.click(); }
      return '1';`);
    await sleep(280);
  }
  const asstGear = await evalJS(`return document.querySelector('.masst-gear-g') && document.querySelector('.masst-cov') ? 'ok' : 'no';`);
  asstGear === 'ok' ? ok('asistente · paso de material con cobertura') : bad('asistente material', asstGear);
  if(asstGear === 'ok') await shot('smoke-asst-gear');
  await evalJS(`var x=document.querySelector('.masst-x, [data-close]'); if(x) x.click(); return '1';`);
  await sleep(250);

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

  /* ── 7b. Red de seguridad de arranque ───────────────────── */
  console.log('\n\x1b[1m7b · Guardián de arranque\x1b[0m');
  const guard = await evalJS(`
    function hayOverlay(){ return document.body.innerHTML.indexOf('La app no pudo arrancar') >= 0; }
    var antes = hayOverlay();
    // error tardío benigno (service worker): no debe tapar la app
    window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('Failed to update a ServiceWorker for scope')).catch(function(){return 0;}),
      reason: new TypeError('Failed to update a ServiceWorker for scope (x) with script (y): Not found')
    }));
    var trasSW = hayOverlay();
    // error tardío cualquiera, con la app ya arrancada: tampoco
    window.dispatchEvent(new ErrorEvent('error', {message:'Boom tardio de prueba', error:new Error('Boom tardio de prueba')}));
    var trasOtro = hayOverlay();
    return JSON.stringify({antes:antes, trasSW:trasSW, trasOtro:trasOtro});`);
  const GD = JSON.parse(guard||'{}');
  (!GD.antes && !GD.trasSW) ? ok('ignora fallos de service worker') : bad('guardián', 'el overlay salta con un fallo de SW');
  (!GD.trasOtro) ? ok('no tapa la app por errores tras el arranque') : bad('guardián', 'el overlay salta con la app ya arrancada');
  await sleep(150);
  errors.length = 0;   // los dos errores de arriba son sintéticos, los inyecta este test

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
