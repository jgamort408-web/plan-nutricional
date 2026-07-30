/* ═══════════════════════════════════════════════════════════════════════════
   APP SHARE · enlaces autocontenidos para recetas, menús y entrenamiento
   El contenido viaja comprimido en el fragmento #share= del enlace: no sale
   de la app hasta que la persona elige una red o copia el enlace.
═══════════════════════════════════════════════════════════════════════════ */

var _ashInstallEvent = null;

function _ashClone(v){ return JSON.parse(JSON.stringify(v)); }
function _ashEsc(v){ return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function _ashB64(bytes){
  let s=''; for(let i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function _ashUnb64(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='=';
  const raw=atob(s), out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
  return out;
}
async function _ashEncode(payload){
  const bytes=new TextEncoder().encode(JSON.stringify(payload));
  if(typeof CompressionStream==='function'){
    const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const zipped=new Uint8Array(await new Response(stream).arrayBuffer());
    return 'g.'+_ashB64(zipped);
  }
  return 'p.'+_ashB64(bytes);
}
async function _ashDecode(token){
  if(!token || token.length>500000) throw new Error('El enlace es demasiado grande o está incompleto.');
  const dot=token.indexOf('.'); if(dot<1) throw new Error('Formato de enlace no reconocido.');
  const mode=token.slice(0,dot), bytes=_ashUnb64(token.slice(dot+1));
  let data=bytes;
  if(mode==='g'){
    if(typeof DecompressionStream!=='function') throw new Error('Este navegador no puede descomprimir el enlace. Actualízalo o abre el enlace en la app.');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    data=new Uint8Array(await new Response(stream).arrayBuffer());
  } else if(mode!=='p') throw new Error('Versión de enlace no compatible.');
  const parsed=JSON.parse(new TextDecoder().decode(data));
  if(!parsed || parsed.v!==1 || !parsed.kind) throw new Error('El enlace no contiene información compatible.');
  return parsed;
}
function _ashToast(msg,type){
  if(typeof pnToast==='function') pnToast(msg,type); else alert(msg);
}
async function _ashCopy(text){
  try{ await navigator.clipboard.writeText(text); }
  catch(_){
    const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
}
function _ashReferencedRecipes(data){
  const ids=new Set();
  Object.values(data||{}).forEach(day=>Object.values(day||{}).forEach(arr=>(Array.isArray(arr)?arr:[arr]).forEach(id=>{if(id)ids.add(id);})));
  return ids;
}
function _ashRecipeDeps(data){
  const deps={};
  _ashReferencedRecipes(data).forEach(id=>{ if(id.startsWith('U') && DISHES[id]) deps[id]=_ashClone(DISHES[id]); });
  return deps;
}
function _ashExerciseDeps(sessionIds){
  const deps={};
  sessionIds.forEach(sid=>{
    const s=SESSIONS[sid]; if(!s)return;
    (s.items||[]).forEach(it=>{const ex=EXERCISES[it.e];if(ex&&ex.user)deps[it.e]=_ashClone(ex);});
  });
  return deps;
}
function _ashPayload(kind,id,extra){
  if(kind==='recipe'){
    const d=DISHES[id]; if(!d) throw new Error('No se encuentra la receta.');
    return {v:1,kind,title:d.nom,data:{id,item:_ashClone(d)}};
  }
  if(kind==='menu'){
    const saved=id&&SavedMenus[id];
    const name=saved?saved.name:CalState.name, data=saved?saved.data:CalState.data;
    return {v:1,kind,title:name||'Menú semanal',data:{name:name||'Menú compartido',calendar:_ashClone(data)},deps:{recipes:_ashRecipeDeps(data)}};
  }
  if(kind==='exercise'){
    const ex=EXERCISES[id]; if(!ex) throw new Error('No se encuentra el ejercicio.');
    return {v:1,kind,title:ex.name,data:{id,item:_ashClone(ex)}};
  }
  if(kind==='session'){
    const s=SESSIONS[id]; if(!s) throw new Error('No se encuentra la sesión.');
    return {v:1,kind,title:s.name,data:{id,item:_ashClone(s)},deps:{exercises:_ashExerciseDeps([id])}};
  }
  if(kind==='training'){
    const sids=new Set();
    Object.values(SportPlan.days||{}).forEach(arr=>(arr||[]).forEach(e=>{if(e&&e.s)sids.add(e.s);}));
    const sessions={}; sids.forEach(sid=>{if(SESSIONS[sid]?.user)sessions[sid]=_ashClone(SESSIONS[sid]);});
    return {v:1,kind,title:SportPlan.name||'Entrenamiento',data:_ashClone(SportPlan),deps:{sessions,exercises:_ashExerciseDeps(sids)}};
  }
  if(kind==='info'){
    const info=extra||{}; return {v:1,kind,title:info.title||'Información compartida',data:{text:String(info.text||'')}};
  }
  throw new Error('Este tipo de contenido no se puede compartir.');
}
function _ashShareText(kind,title){
  const labels={recipe:'esta receta',menu:'este menú',exercise:'este ejercicio',session:'esta sesión',training:'este entrenamiento',info:'esta información'};
  return `Te comparto ${labels[kind]||'este contenido'} desde Plan Nutricional: ${title}`;
}
async function shareAppItem(kind,id,extra){
  try{
    const payload=_ashPayload(kind,id,extra);
    const token=await _ashEncode(payload);
    const url=location.href.split('#')[0]+'#share='+token;
    const share={title:payload.title,text:_ashShareText(kind,payload.title),url};
    if(navigator.share){
      try{ await navigator.share(share); return; }
      catch(err){ if(err && err.name==='AbortError') return; }
    }
    await _ashCopy(url);
    _ashToast('Enlace copiado. Ya puedes pegarlo en cualquier red o chat.');
  }catch(err){ _ashToast(err.message||'No se pudo crear el enlace.','err'); }
}
function shareAppInfo(title,text){ return shareAppItem('info',null,{title,text}); }

function _ashSame(a,b){ try{return JSON.stringify(a)===JSON.stringify(b);}catch(_){return false;} }
function _ashNextRecipeId(){
  let n=1; while(DISHES['U'+n])n++; return 'U'+n;
}
function _ashImportRecipe(item,preferred){
  if(!item || typeof item!=='object' || !item.nom || !Array.isArray(item.ing)) throw new Error('La receta compartida no es válida.');
  if(preferred && DISHES[preferred] && _ashSame(DISHES[preferred],item)) return preferred;
  const id=preferred&&preferred.startsWith('U')&&!DISHES[preferred]?preferred:_ashNextRecipeId();
  DISHES[id]=_ashClone(item); persistCustom(); return id;
}
function _ashImportExercise(item,preferred){
  if(preferred && EXERCISES[preferred] && _ashSame(EXERCISES[preferred],item)) return preferred;
  const norm=normalizeExercise(item); if(norm.error) throw new Error(norm.error);
  const id=preferred&&!EXERCISES[preferred]?preferred:nextSpId(norm.data.name,EXERCISES);
  EXERCISES[id]=norm.data; return id;
}
function _ashImportSession(item,preferred,exMap){
  const raw=_ashClone(item);
  raw.items=(raw.items||[]).map(it=>Object.assign({},it,{e:exMap[it.e]||it.e}));
  if(preferred && SESSIONS[preferred] && _ashSame(SESSIONS[preferred].items,raw.items) && SESSIONS[preferred].name===raw.name) return preferred;
  const norm=normalizeSession(raw); if(norm.error) throw new Error(norm.error);
  const id=preferred&&!SESSIONS[preferred]?preferred:nextSpId(norm.data.name,SESSIONS);
  SESSIONS[id]=norm.data; return id;
}
function _ashImportRecipes(deps){
  const map={}; Object.entries(deps||{}).forEach(([id,d])=>{map[id]=_ashImportRecipe(d,id);}); return map;
}
function _ashImportExercises(deps){
  const map={}; Object.entries(deps||{}).forEach(([id,ex])=>{map[id]=_ashImportExercise(ex,id);}); persistExercises(); return map;
}
function _ashRemapCalendar(raw,map){
  const data=_ashClone(raw||{});
  Object.values(data).forEach(day=>Object.keys(day||{}).forEach(slot=>{
    const arr=Array.isArray(day[slot])?day[slot]:[day[slot]];
    day[slot]=arr.filter(Boolean).map(id=>map[id]||id);
  }));
  return data;
}
function _ashGoSport(view){
  if(typeof setSection==='function') setSection('sport');
  if(typeof showSportView==='function') showSportView(view);
}
function _ashImportPayload(p){
  if(p.kind==='recipe'){
    const id=_ashImportRecipe(p.data.item,p.data.id); closeForm(); renderMain(); openModal(id);
    return 'Receta guardada en tu catálogo.';
  }
  if(p.kind==='menu'){
    const rmap=_ashImportRecipes(p.deps?.recipes);
    const calendar=normalizeCalData(_ashRemapCalendar(p.data.calendar,rmap));
    const id=newMenuId(), stamp=nowStamp();
    SavedMenus[id]={id,name:p.data.name||p.title||'Menú compartido',data:calendar,createdAt:stamp,updatedAt:stamp};
    persistSaved(); closeForm(); loadMenu(id); return 'Menú cargado y guardado.';
  }
  if(p.kind==='exercise'){
    const id=_ashImportExercise(p.data.item,p.data.id); persistExercises(); closeForm(); _ashGoSport('ex'); renderExercises(); openExerciseDetail(id);
    return 'Ejercicio añadido al catálogo.';
  }
  if(p.kind==='session'){
    const emap=_ashImportExercises(p.deps?.exercises);
    const id=_ashImportSession(p.data.item,p.data.id,emap); persistSessions(); closeForm(); _ashGoSport('sess'); renderSessions(); openSessionDetail(id);
    return 'Sesión añadida al catálogo.';
  }
  if(p.kind==='training'){
    const emap=_ashImportExercises(p.deps?.exercises), smap={};
    Object.entries(p.deps?.sessions||{}).forEach(([id,s])=>{smap[id]=_ashImportSession(s,id,emap);});
    persistSessions();
    SportPlan.name=p.data.name||p.title||'Entrenamiento compartido';
    SportPlan.cadence=p.data.cadence||null; SportPlan.days={};
    Object.entries(p.data.days||{}).forEach(([day,entries])=>{
      const clean=(entries||[]).map(e=>({s:smap[e.s]||e.s,who:['A','B','AB'].includes(e.who)?e.who:'AB'})).filter(e=>SESSIONS[e.s]);
      if(clean.length)SportPlan.days[day]=clean;
    });
    persistSportPlan(); closeForm(); _ashGoSport('scal'); renderSportCalendar(); return 'Entrenamiento cargado en el calendario.';
  }
  throw new Error('Este contenido es solo informativo.');
}
function _ashKindMeta(kind){
  return {
    recipe:['🍽️','Receta','Guardar receta'],
    menu:['🗓️','Menú semanal','Cargar menú'],
    exercise:['🏋️','Ejercicio','Añadir ejercicio'],
    session:['▶️','Sesión','Añadir sesión'],
    training:['📆','Entrenamiento','Cargar entrenamiento'],
    info:['ℹ️','Información','Cerrar']
  }[kind]||['↗','Contenido','Cargar'];
}
function _ashIsStandalone(){ return matchMedia('(display-mode: standalone)').matches || navigator.standalone===true; }
async function _ashInstall(){
  const status=document.getElementById('ashInstallStatus');
  if(_ashInstallEvent){
    _ashInstallEvent.prompt(); await _ashInstallEvent.userChoice; _ashInstallEvent=null;
    if(status) status.textContent='La instalación se ha solicitado.';
  }else if(status){
    status.textContent='Abre el menú del navegador y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.';
  }
}
async function _ashOpenIncoming(){
  const m=location.hash.match(/^#share=(.+)$/); if(!m)return;
  let p;
  try{p=await _ashDecode(m[1]);}catch(err){_ashToast(err.message,'err');return;}
  const meta=_ashKindMeta(p.kind);
  const info=p.kind==='info'?`<div class="ash-info">${_ashEsc(p.data.text).replace(/\n/g,'<br>')}</div>`:'';
  const install=!_ashIsStandalone()?`<button class="btn-sec" id="ashInstall" type="button">⬇ Instalar app</button>`:'';
  const load=p.kind==='info'?'':`<button class="btn-prim" id="ashLoad" type="button">${meta[2]}</button>`;
  openForm(`<div class="form-hd ash-head"><div class="ash-icon">${meta[0]}</div><div><h2>${_ashEsc(p.title)}</h2><span class="form-sub">${meta[1]} compartido mediante un enlace</span></div></div>
    <div class="form-body"><div class="ash-note">Revisa el contenido antes de cargarlo. No sustituirá tus recetas, ejercicios o sesiones que tengan el mismo nombre.</div>${info}<div class="ash-install-note" id="ashInstallStatus">${_ashIsStandalone()?'Abierto en la aplicación.':'Puedes usarlo ahora en la web o instalar la aplicación en este dispositivo.'}</div></div>
    <div class="form-actions">${install}<button class="btn-sec" id="ashClose" type="button">${p.kind==='info'?'Cerrar':'Cancelar'}</button>${load}</div>`);
  document.getElementById('ashClose').addEventListener('click',()=>{closeForm();history.replaceState(null,'',location.href.split('#')[0]);});
  const ib=document.getElementById('ashInstall'); if(ib)ib.addEventListener('click',_ashInstall);
  const loadBtn=document.getElementById('ashLoad'); if(loadBtn) loadBtn.addEventListener('click',()=>{
    try{const msg=_ashImportPayload(p);history.replaceState(null,'',location.href.split('#')[0]);_ashToast(msg);}
    catch(err){_ashToast('No se pudo cargar: '+err.message,'err');}
  });
}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();_ashInstallEvent=e;});
function _ashBoot(){
  const b=document.getElementById('calShare'); if(b)b.addEventListener('click',()=>shareAppItem('menu',CalState.id));
  _ashOpenIncoming();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_ashBoot,{once:true});
else _ashBoot();
window.addEventListener('hashchange',_ashOpenIncoming);
window.shareAppItem=shareAppItem;
window.shareAppInfo=shareAppInfo;
