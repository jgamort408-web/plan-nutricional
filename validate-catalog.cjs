/* Valida el catálogo completo: campos obligatorios, taxonomías válidas,
   MET plausibles, coherencia entre `equip` y el material que exige el
   nombre, y que la disciplina inferida sea la esperada. */
const fs=require('fs'), path=require('path');
const ROOT='h:/APP Comida';
global.window=global; global.lsGet=()=>null; global.lsSet=()=>{};
require(path.join(ROOT,'sport-catalog.js'));
let src=fs.readFileSync(path.join(ROOT,'sport-data.js'),'utf8').split('function loadSportPlan')[0];
src+='\n;global.EXERCISES=EXERCISES;global.EX_SPORTS=EX_SPORTS;global.EX_MUSCLES=EX_MUSCLES;global.EX_TYPES=EX_TYPES;global.EX_PATTERNS=EX_PATTERNS;global.exDisc=exDisc;';
(0,eval)(src);

const E=EXERCISES, errs=[], warns=[];
const ok = (c,m)=>{ if(!c) errs.push(m); };

Object.keys(E).forEach(id=>{
  const x=E[id], n=`${id} (${x.name||'?'})`;
  ok(x.name,                       n+': sin name');
  ok(EX_TYPES[x.type],             n+': type inválido "'+x.type+'"');
  ok(EX_PATTERNS[x.pat],           n+': pat inválido "'+x.pat+'"');
  ok(Array.isArray(x.muscles)&&x.muscles.length, n+': sin muscles');
  (x.muscles||[]).forEach(m=> ok(EX_MUSCLES[m], n+': músculo inválido "'+m+'"'));
  ok(x.met>0 && x.met<=16,         n+': MET fuera de rango ('+x.met+')');
  ok(x.equip!=null,                n+': sin equip');
  ok(x.mode==='reps'||x.mode==='time', n+': mode inválido "'+x.mode+'"');
  ok(x.sets>0,                     n+': sets inválidos');
  if(x.mode==='reps') ok(x.reps>0, n+': reps inválidas');
  if(x.mode==='time') ok(x.dur>0,  n+': dur inválida');
  ok(x.rest>=0,                    n+': rest inválido');
  ok(x.cues && x.cues.length>20,   n+': cues ausentes o muy cortas');
  if(x.disc) ok(EX_SPORTS[x.disc], n+': disc inválida "'+x.disc+'"');
  // coherencia equip ↔ nombre
  const eq=(x.equip||'').toLowerCase(), nm=(x.name||'').toLowerCase();
  const sinMat=/^(peso corporal|sin material|ninguno|esterilla|suelo|)$/.test(eq.trim());
  if(sinMat && /jal[oó]n|polea|mancuern|m[aá]quina|kettlebell|remoerg|skierg|saco|piscina/.test(nm))
    errs.push(n+': equip="'+x.equip+'" pero el nombre exige material');
  // duración de una serie razonable
  if(x.mode==='time' && x.dur>3600) warns.push(n+': serie de '+x.dur+'s (>1 h)');
  if(x.rest>300) warns.push(n+': descanso de '+x.rest+'s');
});

console.log('TOTAL: '+Object.keys(E).length+' ejercicios');
console.log('\n── por disciplina ──');
const byDisc={};
Object.keys(E).forEach(k=>{const d=exDisc(E[k]);byDisc[d]=(byDisc[d]||0)+1;});
Object.keys(EX_SPORTS).forEach(d=>{
  const n=byDisc[d]||0;
  const flag = n<10 ? ' ⚠' : '';
  console.log('  '+(EX_SPORTS[d].lbl+'                    ').slice(0,22)+String(n).padStart(3)+flag);
});
console.log('\n── patrones en gimnasio ──');
const gp={};
Object.keys(E).filter(k=>exDisc(E[k])==='gimnasio').forEach(k=>gp[E[k].pat]=(gp[E[k].pat]||0)+1);
Object.keys(gp).sort().forEach(p=> console.log('  '+(p+'                 ').slice(0,20)+String(gp[p]).padStart(3)+(gp[p]<8?' ⚠':'')));

if(warns.length){ console.log('\n── avisos ('+warns.length+') ──'); warns.slice(0,10).forEach(w=>console.log('  '+w)); }
if(errs.length){ console.log('\n\x1b[31m── ERRORES ('+errs.length+') ──\x1b[0m'); errs.slice(0,25).forEach(e=>console.log('  '+e)); process.exit(1); }
console.log('\n\x1b[32m✔ catálogo válido\x1b[0m');
