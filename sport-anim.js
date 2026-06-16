/* ══════════════════════════════════════════════════════════
   SPORT ANIM · motor de animación 3D por POSES (Three.js)
   ─────────────────────────────────────────────────────────
   · Un único maniquí de primitivas (esferas + cilindros)
   · Plantillas de movimiento en JSON (ANIM_TEMPLATES) reutilizables
   · Interpolación procedural entre poses + equipamiento simple
   · Resalta los músculos trabajados del ejercicio
   Cada ejercicio sólo añade un campo `visual`:
     visual:{ template:'sentadilla', equipment:['barbell'], camera:'side' }
   DEMO: sólo hay 2 plantillas (sentadilla · press_horizontal).
══════════════════════════════════════════════════════════ */

/* ── Plantillas de movimiento (ángulos en grados, marco local del cuerpo) ──
   joints: shoulder_l/r, elbow_l/r, hip_l/r, knee_l/r, spine
   rootY: desplazamiento vertical de la cadera (sentadilla)
══════════════════════════════════════════════════════════ */
const ANIM_TEMPLATES = {
  /* SENTADILLA TRASERA · barra en trapecio · IK de pierna planta los pies */
  sentadilla: {
    body:'standing', camera:'side', equipment:['barbell'], barbell:'back', period:3.0, legIK:true,
    poses:[
      { t:0,   rootY:0,     joints:{ spine:[3,0,0], shoulder_l:[42,0,15], shoulder_r:[42,0,-15], elbow_l:[120,0,0], elbow_r:[120,0,0] } },
      { t:0.5, rootY:-0.32, joints:{ spine:[15,0,0], shoulder_l:[42,0,15], shoulder_r:[42,0,-15], elbow_l:[120,0,0], elbow_r:[120,0,0] } },
      { t:1,   rootY:0,     joints:{ spine:[3,0,0], shoulder_l:[42,0,15], shoulder_r:[42,0,-15], elbow_l:[120,0,0], elbow_r:[120,0,0] } }
    ]
  },
  /* SENTADILLA FRONTAL · barra en deltoides anteriores, codos altos, torso más vertical */
  sentadilla_frontal: {
    body:'standing', camera:'side', equipment:['barbell'], barbell:'front', period:3.0, legIK:true,
    poses:[
      { t:0,   rootY:0,     joints:{ spine:[0,0,0], shoulder_l:[-92,0,12], shoulder_r:[-92,0,-12], elbow_l:[-148,0,0], elbow_r:[-148,0,0] } },
      { t:0.5, rootY:-0.33, joints:{ spine:[8,0,0], shoulder_l:[-92,0,12], shoulder_r:[-92,0,-12], elbow_l:[-148,0,0], elbow_r:[-148,0,0] } },
      { t:1,   rootY:0,     joints:{ spine:[0,0,0], shoulder_l:[-92,0,12], shoulder_r:[-92,0,-12], elbow_l:[-148,0,0], elbow_r:[-148,0,0] } }
    ]
  },
  /* PESO MUERTO CONVENCIONAL · cadera baja + rodilla flexionada + tirón desde el suelo */
  peso_muerto: {
    body:'standing', camera:'side', equipment:['barbell'], barbell:'hands', period:3.2, legIK:true,
    poses:[
      { t:0,   rootY:0,     joints:{ spine:[5,0,0], shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } },
      { t:0.5, rootY:-0.20, joints:{ spine:[48,0,0], shoulder_l:[-44,0,6], shoulder_r:[-44,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } },
      { t:1,   rootY:0,     joints:{ spine:[5,0,0], shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } }
    ]
  },
  /* PRESS HORIZONTAL · tumbado en banco (cuerpo y piernas sobre el banco/suelo) */
  press_horizontal: {
    body:'supine', camera:'front_45', equipment:['bench','barbell'], barbell:'hands', period:2.6,
    poses:[
      { t:0,   joints:{ shoulder_l:[-90,0,-6], shoulder_r:[-90,0,6], elbow_l:[-8,0,0], elbow_r:[-8,0,0], hip_l:[50,0,5], hip_r:[50,0,-5], knee_l:[-15,0,0], knee_r:[-15,0,0], spine:[0,0,0] } },
      { t:0.5, joints:{ shoulder_l:[-66,0,-8], shoulder_r:[-66,0,8], elbow_l:[-95,0,0], elbow_r:[-95,0,0], hip_l:[50,0,5], hip_r:[50,0,-5], knee_l:[-15,0,0], knee_r:[-15,0,0], spine:[0,0,0] } },
      { t:1,   joints:{ shoulder_l:[-90,0,-6], shoulder_r:[-90,0,6], elbow_l:[-8,0,0], elbow_r:[-8,0,0], hip_l:[50,0,5], hip_r:[50,0,-5], knee_l:[-15,0,0], knee_r:[-15,0,0], spine:[0,0,0] } }
    ]
  },
  /* PRESS VERTICAL · press militar de pie */
  press_vertical: {
    body:'standing', camera:'front', equipment:['barbell'], barbell:'hands', period:2.6,
    poses:[
      { t:0,   joints:{ spine:[-3,0,0], shoulder_l:[118,0,16], shoulder_r:[118,0,-16], elbow_l:[-92,0,0], elbow_r:[-92,0,0] } },
      { t:0.5, joints:{ spine:[-2,0,0], shoulder_l:[165,0,7], shoulder_r:[165,0,-7], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:1,   joints:{ spine:[-3,0,0], shoulder_l:[118,0,16], shoulder_r:[118,0,-16], elbow_l:[-92,0,0], elbow_r:[-92,0,0] } }
    ]
  },
  /* REMO · tronco inclinado, tirón hacia el abdomen (rodillas con flexión leve) */
  remo: {
    body:'standing', camera:'side', equipment:['barbell'], barbell:'hands', period:2.6,
    poses:[
      { t:0,   joints:{ spine:[72,0,0], knee_l:[12,0,0], knee_r:[12,0,0], shoulder_l:[-60,0,6], shoulder_r:[-60,0,-6], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:0.5, joints:{ spine:[72,0,0], knee_l:[12,0,0], knee_r:[12,0,0], shoulder_l:[-30,0,10], shoulder_r:[-30,0,-10], elbow_l:[-105,0,0], elbow_r:[-105,0,0] } },
      { t:1,   joints:{ spine:[72,0,0], knee_l:[12,0,0], knee_r:[12,0,0], shoulder_l:[-60,0,6], shoulder_r:[-60,0,-6], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } }
    ]
  },
  /* CURL · flexión de bíceps de pie */
  curl: {
    body:'standing', camera:'front', equipment:['dumbbells'], period:2.4,
    poses:[
      { t:0,   joints:{ shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-8,0,0], elbow_r:[-8,0,0] } },
      { t:0.5, joints:{ shoulder_l:[10,0,8], shoulder_r:[10,0,-8], elbow_l:[-130,0,0], elbow_r:[-130,0,0] } },
      { t:1,   joints:{ shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-8,0,0], elbow_r:[-8,0,0] } }
    ]
  },
  /* BISAGRA DE CADERA · peso muerto / rumano (rodillas con flexión leve) */
  bisagra: {
    body:'standing', camera:'side', equipment:['barbell'], barbell:'hands', period:3.0,
    poses:[
      { t:0,   joints:{ spine:[4,0,0], knee_l:[6,0,0], knee_r:[6,0,0], shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } },
      { t:0.5, joints:{ spine:[74,0,0], knee_l:[16,0,0], knee_r:[16,0,0], shoulder_l:[-64,0,6], shoulder_r:[-64,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } },
      { t:1,   joints:{ spine:[4,0,0], knee_l:[6,0,0], knee_r:[6,0,0], shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0] } }
    ]
  },
  /* TRACCIÓN VERTICAL · jalón / dominada (overhead → al pecho) */
  jalon: {
    body:'standing', camera:'front', equipment:['barbell'], barbell:'hands', period:2.6,
    poses:[
      { t:0,   joints:{ spine:[-2,0,0], shoulder_l:[150,0,12], shoulder_r:[150,0,-12], elbow_l:[-12,0,0], elbow_r:[-12,0,0] } },
      { t:0.5, joints:{ spine:[-4,0,0], shoulder_l:[116,0,20], shoulder_r:[116,0,-20], elbow_l:[-92,0,0], elbow_r:[-92,0,0] } },
      { t:1,   joints:{ spine:[-2,0,0], shoulder_l:[150,0,12], shoulder_r:[150,0,-12], elbow_l:[-12,0,0], elbow_r:[-12,0,0] } }
    ]
  },
  /* UNILATERAL · zancada / split squat (rodillas flexionan hacia atrás) */
  zancada: {
    body:'standing', camera:'side', equipment:[], period:2.8, lungeIK:true,
    poses:[
      { t:0,   rootY:-0.02, feet:{ l:[0.34,0.0], r:[-0.30,0.02] }, joints:{ spine:[5,0,0], shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:0.5, rootY:-0.26, feet:{ l:[0.36,0.0], r:[-0.34,0.07] }, joints:{ spine:[7,0,0], shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:1,   rootY:-0.02, feet:{ l:[0.34,0.0], r:[-0.30,0.02] }, joints:{ spine:[5,0,0], shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } }
    ]
  },
  /* CORE · plancha frontal (boca abajo, isométrico con respiración) */
  plancha: {
    body:'prone', camera:'side', equipment:[], period:5.0,
    poses:[
      { t:0,   joints:{ spine:[0,0,0], shoulder_l:[92,0,8], shoulder_r:[92,0,-8], elbow_l:[-150,0,0], elbow_r:[-150,0,0], hip_l:[2,0,4], hip_r:[2,0,-4], knee_l:[4,0,0], knee_r:[4,0,0] } },
      { t:0.5, joints:{ spine:[2,0,0], shoulder_l:[92,0,8], shoulder_r:[92,0,-8], elbow_l:[-150,0,0], elbow_r:[-150,0,0], hip_l:[2,0,4], hip_r:[2,0,-4], knee_l:[4,0,0], knee_r:[4,0,0] } },
      { t:1,   joints:{ spine:[0,0,0], shoulder_l:[92,0,8], shoulder_r:[92,0,-8], elbow_l:[-150,0,0], elbow_r:[-150,0,0], hip_l:[2,0,4], hip_r:[2,0,-4], knee_l:[4,0,0], knee_r:[4,0,0] } }
    ]
  },
  /* CORE · crunch / abdominales (tumbado, rodillas arriba, sube el tronco) */
  crunch: {
    body:'supine_floor', camera:'side', equipment:[], period:2.6,
    poses:[
      { t:0,   joints:{ spine:[2,0,0], hip_l:[60,0,5], hip_r:[60,0,-5], knee_l:[80,0,0], knee_r:[80,0,0], shoulder_l:[-120,0,-8], shoulder_r:[-120,0,8], elbow_l:[-70,0,0], elbow_r:[-70,0,0] } },
      { t:0.5, joints:{ spine:[34,0,0], hip_l:[60,0,5], hip_r:[60,0,-5], knee_l:[80,0,0], knee_r:[80,0,0], shoulder_l:[-120,0,-8], shoulder_r:[-120,0,8], elbow_l:[-70,0,0], elbow_r:[-70,0,0] } },
      { t:1,   joints:{ spine:[2,0,0], hip_l:[60,0,5], hip_r:[60,0,-5], knee_l:[80,0,0], knee_r:[80,0,0], shoulder_l:[-120,0,-8], shoulder_r:[-120,0,8], elbow_l:[-70,0,0], elbow_r:[-70,0,0] } }
    ]
  },
  /* ACARREO · farmer carry (de pie, peso a los lados, ligero balanceo) */
  carry: {
    body:'standing', camera:'front', equipment:['dumbbells'], period:2.0,
    poses:[
      { t:0,   rootY:0,     joints:{ spine:[2,0,0], shoulder_l:[2,0,5], shoulder_r:[2,0,-5], elbow_l:[-3,0,0], elbow_r:[-3,0,0], hip_l:[10,0,4], knee_l:[16,0,0], hip_r:[-8,0,-4], knee_r:[6,0,0] } },
      { t:0.5, rootY:-0.02, joints:{ spine:[2,0,0], shoulder_l:[2,0,5], shoulder_r:[2,0,-5], elbow_l:[-3,0,0], elbow_r:[-3,0,0], hip_l:[-8,0,4], knee_l:[6,0,0], hip_r:[10,0,-4], knee_r:[16,0,0] } },
      { t:1,   rootY:0,     joints:{ spine:[2,0,0], shoulder_l:[2,0,5], shoulder_r:[2,0,-5], elbow_l:[-3,0,0], elbow_r:[-3,0,0], hip_l:[10,0,4], knee_l:[16,0,0], hip_r:[-8,0,-4], knee_r:[6,0,0] } }
    ]
  },
  /* ACCESORIO · elevación de gemelos (sube de puntillas) */
  gemelo: {
    body:'standing', camera:'side', equipment:[], period:1.8,
    poses:[
      { t:0,   rootY:0,    joints:{ shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0], ankle_l:[0,0,0], ankle_r:[0,0,0] } },
      { t:0.5, rootY:0.08, joints:{ shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0], ankle_l:[42,0,0], ankle_r:[42,0,0] } },
      { t:1,   rootY:0,    joints:{ shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0], ankle_l:[0,0,0], ankle_r:[0,0,0] } }
    ]
  },
  /* ACCESORIO · elevación lateral de hombro (abducción) */
  elevacion_lateral: {
    body:'standing', camera:'front', equipment:['dumbbells'], period:2.4,
    poses:[
      { t:0,   joints:{ shoulder_l:[2,0,8], shoulder_r:[2,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:0.5, joints:{ shoulder_l:[2,0,92], shoulder_r:[2,0,-92], elbow_l:[-8,0,0], elbow_r:[-8,0,0] } },
      { t:1,   joints:{ shoulder_l:[2,0,8], shoulder_r:[2,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } }
    ]
  },
  /* ACCESORIO · extensión de tríceps por encima de la cabeza */
  extension_triceps: {
    body:'standing', camera:'side_high', equipment:['dumbbells'], period:2.4,
    poses:[
      { t:0,   joints:{ shoulder_l:[168,0,8], shoulder_r:[168,0,-8], elbow_l:[-120,0,0], elbow_r:[-120,0,0] } },
      { t:0.5, joints:{ shoulder_l:[170,0,6], shoulder_r:[170,0,-6], elbow_l:[-8,0,0], elbow_r:[-8,0,0] } },
      { t:1,   joints:{ shoulder_l:[168,0,8], shoulder_r:[168,0,-8], elbow_l:[-120,0,0], elbow_r:[-120,0,0] } }
    ]
  },
  /* CARRERA · ciclo de zancada (piernas alternan, brazos opuestos) */
  carrera: {
    body:'standing', camera:'side', equipment:[], period:1.1,
    poses:[
      { t:0,    rootY:-0.02, joints:{ spine:[8,0,0], hip_l:[-48,0,4], knee_l:[70,0,0], hip_r:[26,0,-4], knee_r:[34,0,0], shoulder_l:[34,0,6], elbow_l:[-80,0,0], shoulder_r:[-40,0,-6], elbow_r:[-80,0,0] } },
      { t:0.5,  rootY:-0.02, joints:{ spine:[8,0,0], hip_r:[-48,0,-4], knee_r:[70,0,0], hip_l:[26,0,4], knee_l:[34,0,0], shoulder_r:[34,0,-6], elbow_r:[-80,0,0], shoulder_l:[-40,0,6], elbow_l:[-80,0,0] } },
      { t:1,    rootY:-0.02, joints:{ spine:[8,0,0], hip_l:[-48,0,4], knee_l:[70,0,0], hip_r:[26,0,-4], knee_r:[34,0,0], shoulder_l:[34,0,6], elbow_l:[-80,0,0], shoulder_r:[-40,0,-6], elbow_r:[-80,0,0] } }
    ]
  },
  /* PLIOMETRÍA · salto (crouch → extensión explosiva) */
  salto: {
    body:'standing', camera:'side', equipment:[], period:2.0, legIK:true,
    poses:[
      { t:0,    rootY:0,     joints:{ spine:[4,0,0], shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-10,0,0], elbow_r:[-10,0,0] } },
      { t:0.35, rootY:-0.26, joints:{ spine:[20,0,0], shoulder_l:[-40,0,8], shoulder_r:[-40,0,-8], elbow_l:[-30,0,0], elbow_r:[-30,0,0] } },
      { t:0.6,  rootY:0.05,  joints:{ spine:[2,0,0], shoulder_l:[150,0,8], shoulder_r:[150,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:1,    rootY:0,     joints:{ spine:[4,0,0], shoulder_l:[6,0,8], shoulder_r:[6,0,-8], elbow_l:[-10,0,0], elbow_r:[-10,0,0] } }
    ]
  },
  /* ACONDICIONAMIENTO · jumping jacks (brazos y piernas dentro/fuera) */
  jumping: {
    body:'standing', camera:'front', equipment:[], period:1.0,
    poses:[
      { t:0,   joints:{ shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0], hip_l:[0,0,4], hip_r:[0,0,-4] } },
      { t:0.5, joints:{ shoulder_l:[2,0,150], shoulder_r:[2,0,-150], elbow_l:[-6,0,0], elbow_r:[-6,0,0], hip_l:[0,0,22], hip_r:[0,0,-22] } },
      { t:1,   joints:{ shoulder_l:[2,0,6], shoulder_r:[2,0,-6], elbow_l:[-4,0,0], elbow_r:[-4,0,0], hip_l:[0,0,4], hip_r:[0,0,-4] } }
    ]
  },
  /* MOVILIDAD · estiramiento suave (brazos arriba y respiración) */
  movilidad: {
    body:'standing', camera:'front', equipment:[], period:4.5,
    poses:[
      { t:0,   joints:{ spine:[2,0,0], shoulder_l:[8,0,8], shoulder_r:[8,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:0.5, joints:{ spine:[2,0,0], shoulder_l:[160,0,10], shoulder_r:[160,0,-10], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } },
      { t:1,   joints:{ spine:[2,0,0], shoulder_l:[8,0,8], shoulder_r:[8,0,-8], elbow_l:[-6,0,0], elbow_r:[-6,0,0] } }
    ]
  },
  /* ERGÓMETRO · bici (sentado, piernas pedaleando, manos al frente) */
  bici: {
    body:'standing', camera:'side', equipment:['bike'], period:1.4,
    poses:[
      { t:0,    rootY:-0.30, joints:{ spine:[26,0,0], hip_l:[-70,0,4], knee_l:[60,0,0], hip_r:[-30,0,-4], knee_r:[100,0,0], shoulder_l:[-58,0,6], shoulder_r:[-58,0,-6], elbow_l:[-20,0,0], elbow_r:[-20,0,0] } },
      { t:0.5,  rootY:-0.30, joints:{ spine:[26,0,0], hip_r:[-70,0,-4], knee_r:[60,0,0], hip_l:[-30,0,4], knee_l:[100,0,0], shoulder_l:[-58,0,6], shoulder_r:[-58,0,-6], elbow_l:[-20,0,0], elbow_r:[-20,0,0] } },
      { t:1,    rootY:-0.30, joints:{ spine:[26,0,0], hip_l:[-70,0,4], knee_l:[60,0,0], hip_r:[-30,0,-4], knee_r:[100,0,0], shoulder_l:[-58,0,6], shoulder_r:[-58,0,-6], elbow_l:[-20,0,0], elbow_r:[-20,0,0] } }
    ]
  }
};

/* Postura del cuerpo según el ejercicio (orientación + altura) */
const ANIM_BODY = {
  standing:     { rotX:0,    pos:[0, 0,    0]    },
  supine:       { rotX:-90,  pos:[0, 0.62, 1.18] },   // banco (tumbado boca arriba)
  supine_floor: { rotX:-90,  pos:[0, 0.18, 0.95] },   // suelo boca arriba (crunch)
  prone:        { rotX:90,   pos:[0, 0.30, -0.95] }   // boca abajo (plancha)
};

const ANIM_CAMERAS = {
  side:      { pos:[3.1, 0.95, 0.0], tgt:[0, 0.85, 0.05] },
  side_high: { pos:[3.2, 1.25, 0.0], tgt:[0, 1.15, 0] },
  front_45:  { pos:[2.4, 1.8, 2.7], tgt:[0, 0.7, 0] },
  front:     { pos:[0, 1.3, 3.8],   tgt:[0, 1.05, 0] }
};

/* Qué músculos resalta cada parte del maniquí */
const ANIM_PART_MUSCLES = {
  torso:     ['pecho','espalda','core'],
  pelvis:    ['gluteo','core'],
  upperArm:  ['hombro','triceps','biceps'],
  forearm:   ['biceps','antebrazo','triceps'],
  thigh:     ['cuadriceps','isquios','gluteo'],
  shin:      ['gemelo']
};

/* IK de 2 huesos (plano sagital Y-Z): coloca el pie en (footZ,footY) desde la cadera.
   Devuelve rotaciones para hip.x y knee.x (calibrado: thighSign=+1, kneeSign=+1). */
function solveLegIK(hipY, footZ, footY){
  const a=0.46, b=0.46;
  let dz=footZ, dy=footY-hipY;
  let d=Math.hypot(dz,dy); d=Math.min(d, a+b-0.004); d=Math.max(d, 0.05);
  const phi=Math.atan2(dz, -dy);
  const alpha=Math.acos(Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))));
  const kneeInt=Math.acos(Math.max(-1,Math.min(1,(a*a+b*b-d*d)/(2*a*b))));
  return { hipX: -(phi+alpha), kneeX: (Math.PI-kneeInt) };
}

let _THREE = null;
async function loadThree(){
  if(_THREE) return _THREE;
  _THREE = await import('./vendor/three.module.js');
  return _THREE;
}

/* ── Construye el maniquí; devuelve grupos de articulación nombrados ── */
function buildMannequin(THREE, highlight){
  const hl = new Set(highlight || []);
  const skin    = new THREE.MeshStandardMaterial({ color:0xc7ccd4, roughness:0.68, metalness:0.03 });
  const hlMat   = new THREE.MeshStandardMaterial({ color:0xC0563B, roughness:0.5, metalness:0.04, emissive:0x3a140c, emissiveIntensity:0.25 });
  const jointMat= new THREE.MeshStandardMaterial({ color:0x8b919b, roughness:0.55 });
  const matFor = (part)=> (ANIM_PART_MUSCLES[part]||[]).some(m=>hl.has(m)) ? hlMat : skin;
  const cast = m=>{ m.castShadow=true; m.receiveShadow=true; return m; };

  // Extremidad con forma de músculo: cápsula con vientre más grueso (r medio mayor que extremos)
  const limb = (len, r, part)=>{
    const g = new THREE.Group();
    const mesh = cast(new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01,len-2*r), 10, 18), matFor(part)));
    mesh.position.y = -len/2;
    mesh.scale.set(1, 1, 0.92);
    g.add(mesh);
    return g;
  };
  const ball = (r, mat)=> cast(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), mat||jointMat));

  const joints = {};
  const model = new THREE.Group();
  const root  = new THREE.Group();
  model.add(root);

  // Pelvis / cadera
  const pelvisY = 0.92;
  const pelvis = cast(new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.12, 10, 18), matFor('pelvis')));
  pelvis.position.set(0, pelvisY-0.04, 0); pelvis.rotation.z = Math.PI/2; pelvis.scale.set(1,1,0.85); root.add(pelvis);

  // Columna / torso (cónico: más ancho arriba = pecho)
  const spine = new THREE.Group(); spine.position.set(0, pelvisY, 0); root.add(spine); joints.spine = spine;
  const torsoLen = 0.52;
  const torsoGeo = new THREE.CylinderGeometry(0.155, 0.12, torsoLen, 20, 1);
  const torso = cast(new THREE.Mesh(torsoGeo, matFor('torso'))); torso.position.y = torsoLen/2; torso.scale.set(1,1,0.72); spine.add(torso);
  // hombros (bultos deltoides)
  [-0.2,0.2].forEach(x=>{ const d = ball(0.085, matFor('upperArm')); d.position.set(x, torsoLen-0.03, 0); spine.add(d); });

  // Cuello + cabeza
  const neck = new THREE.Group(); neck.position.y = torsoLen; spine.add(neck); joints.neck = neck;
  const neckMesh = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.10,12), skin)); neckMesh.position.y=0.05; neck.add(neckMesh);
  const head = ball(0.14, skin); head.position.y = 0.20; head.scale.set(0.92,1,0.95); neck.add(head);
  // FRENTE (mirando +Z): nariz, ojos y placa de pecho clara
  const faceMat = new THREE.MeshStandardMaterial({ color:0xF2E6C8, roughness:0.55 });
  const nose = cast(new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8), faceMat)); nose.position.set(0,0.19,0.125); neck.add(nose);
  const eyeMat = new THREE.MeshStandardMaterial({ color:0x2c2620 });
  [-0.05,0.05].forEach(x=>{ const eye=cast(new THREE.Mesh(new THREE.SphereGeometry(0.02,8,6), eyeMat)); eye.position.set(x,0.24,0.115); neck.add(eye); });
  const chest = cast(new THREE.Mesh(new THREE.BoxGeometry(0.19,0.24,0.04), faceMat)); chest.position.set(0, torsoLen*0.6, 0.115); spine.add(chest);

  // Brazos: hombro → codo → muñeca → mano
  const armY = torsoLen - 0.03, armX = 0.205;
  ['l','r'].forEach(s=>{
    const sign = s==='l' ? 1 : -1;
    const sh = new THREE.Group(); sh.position.set(sign*armX, armY, 0); spine.add(sh); joints['shoulder_'+s]=sh;
    const ua = limb(0.30, 0.055, 'upperArm'); sh.add(ua);
    const el = new THREE.Group(); el.position.y = -0.30; ua.add(el); joints['elbow_'+s]=el; el.add(ball(0.05, matFor('forearm')));
    const fa = limb(0.28, 0.046, 'forearm'); el.add(fa);
    const wr = new THREE.Group(); wr.position.y = -0.28; fa.add(wr); joints['wrist_'+s]=wr;
    const hand = cast(new THREE.Mesh(new THREE.BoxGeometry(0.07,0.11,0.04), skin)); hand.position.y = -0.05; wr.add(hand);
    joints['hand_'+s] = hand;
  });

  // Piernas: cadera → rodilla → tobillo → pie
  const hipX = 0.11;
  ['l','r'].forEach(s=>{
    const sign = s==='l' ? 1 : -1;
    const hip = new THREE.Group(); hip.position.set(sign*hipX, pelvisY-0.04, 0); root.add(hip); joints['hip_'+s]=hip;
    hip.add(ball(0.075, matFor('thigh')));
    const th = limb(0.46, 0.072, 'thigh'); hip.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.46; th.add(kn); joints['knee_'+s]=kn; kn.add(ball(0.058, matFor('shin')));
    const sh2 = limb(0.46, 0.055, 'shin'); kn.add(sh2);
    const ank = new THREE.Group(); ank.position.y = -0.46; sh2.add(ank); joints['ankle_'+s]=ank;
    const foot = cast(new THREE.Mesh(new THREE.BoxGeometry(0.10,0.06,0.24), skin)); foot.position.set(0,-0.03,0.07); ank.add(foot);
  });

  return { model, root, joints, THREE };
}

/* ── Equipamiento (primitivas con sombra y más detalle) ── */
function _steelMat(THREE){ return new THREE.MeshStandardMaterial({color:0xb4bac4, metalness:0.85, roughness:0.3}); }
function _plateMat(THREE){ return new THREE.MeshStandardMaterial({color:0x23262c, metalness:0.25, roughness:0.7}); }
function _cyl(THREE,r1,r2,h,seg,mat){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg||24), mat); m.rotation.z=Math.PI/2; m.castShadow=true; m.receiveShadow=true; return m; }
function makeBarbell(THREE){
  const g = new THREE.Group();
  const steel=_steelMat(THREE), plate=_plateMat(THREE);
  g.add(_cyl(THREE,0.018,0.018,1.55,20,steel));                 // barra
  [-1,1].forEach(s=>{
    const sleeve=_cyl(THREE,0.032,0.032,0.34,16,steel); sleeve.position.x=s*0.62; g.add(sleeve);
    [0.16,0.13].forEach((r,i)=>{ const p=_cyl(THREE,r,r,0.045,28,plate); p.position.x=s*(0.5+i*0.07); g.add(p); });
    const collar=_cyl(THREE,0.05,0.05,0.04,12,steel); collar.position.x=s*0.45; g.add(collar);
  });
  return g;
}
function makeBench(THREE){
  const g = new THREE.Group();
  const pad = new THREE.MeshStandardMaterial({color:0x47403a, roughness:0.85});
  const frameMat = new THREE.MeshStandardMaterial({color:0x3a3d44, metalness:0.6, roughness:0.45});
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.11,1.3), pad); top.position.y=0.45; top.castShadow=true; top.receiveShadow=true; g.add(top);
  // patas en A + travesaño
  [[-0.52],[0.52]].forEach(([z])=>{ ['l','r'].forEach((s,i)=>{ const leg=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.46,0.05), frameMat); leg.position.set((i?-1:1)*0.15,0.2,z); leg.rotation.z=(i?1:-1)*0.18; leg.castShadow=true; g.add(leg); }); });
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,1.05), frameMat); rail.position.set(0,0.04,0); rail.castShadow=true; g.add(rail);
  return g;
}
function makeDumbbell(THREE){
  const g = new THREE.Group();
  const steel=_steelMat(THREE), head=_plateMat(THREE);
  g.add(_cyl(THREE,0.018,0.018,0.24,14,steel));               // mango
  [-1,1].forEach(s=>{ [0.075,0.07].forEach((r,i)=>{ const d=_cyl(THREE,r,r,0.05,18,head); d.position.x=s*(0.12+i*0.05); g.add(d); }); });
  return g;
}
function makeKettlebell(THREE){
  const g = new THREE.Group();
  const cast = new THREE.MeshStandardMaterial({color:0x2b2e34, metalness:0.4, roughness:0.55});
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.11,20,16), cast); bell.scale.set(1,0.9,1); bell.castShadow=true; g.add(bell);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.07,0.018,10,20,Math.PI), cast); h.position.y=0.10; h.castShadow=true; g.add(h);
  return g;
}
function makeBox(THREE){
  const g = new THREE.Group();
  const w = new THREE.MeshStandardMaterial({color:0x9a7b4f, roughness:0.85});
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), w); b.position.y=0.25; b.castShadow=true; b.receiveShadow=true; g.add(b);
  return g;
}
function makeBike(THREE){
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({color:0x444a55, metalness:0.6, roughness:0.4});
  const tire  = new THREE.MeshStandardMaterial({color:0x1d1f24, roughness:0.8});
  // ruedas (en el plano Y-Z, vistas de lado)
  [[-0.42],[0.5]].forEach(([z])=>{ const w=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.035,12,28), tire); w.position.set(0,0.3,z); g.add(w); w.castShadow=true; });
  // sillín
  const seat=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.05,0.26), frame); seat.position.set(0,0.55,-0.05); seat.castShadow=true; g.add(seat);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.3,10), frame); post.position.set(0,0.4,-0.05); g.add(post);
  // manillar
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.5,10), frame); stem.position.set(0,0.55,0.42); stem.rotation.x=0.5; g.add(stem);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.34,10), frame); bar.rotation.z=Math.PI/2; bar.position.set(0,0.78,0.46); g.add(bar);
  // pedalier
  const cr=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,12), frame); cr.rotation.z=Math.PI/2; cr.position.set(0,0.28,0.02); g.add(cr);
  return g;
}

/* ── Lanza el visor para un ejercicio en un contenedor ── */
async function startExerciseAnim(ex, container){
  const vis = ex && (ex.visual || (typeof defaultVisualFor==='function' ? defaultVisualFor(ex) : null));
  const tpl = vis && ANIM_TEMPLATES[vis.template];
  if(!tpl){ container.innerHTML = '<div class="anim-msg">Sin animación para este ejercicio.</div>'; return; }
  let THREE;
  try { THREE = await loadThree(); }
  catch(e){ container.innerHTML = '<div class="anim-msg">No se pudo cargar el motor 3D (Three.js). Revisa la conexión.</div>'; return; }
  if(!document.body.contains(container)) return;   // modal cerrado mientras cargaba

  container.innerHTML = '';
  const W = container.clientWidth || 320, H = 300;
  const scene = new THREE.Scene();
  const camCfg = ANIM_CAMERAS[vis.camera || tpl.camera] || ANIM_CAMERAS.front_45;
  const camera = new THREE.PerspectiveCamera(42, W/H, 0.1, 100);
  const target = new THREE.Vector3(...camCfg.tgt);

  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if(THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if('ACESFilmicToneMapping' in THREE){ renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  container.appendChild(renderer.domElement);

  // iluminación de 3 puntos + ambiente
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c7e62, 0.65));
  const key = new THREE.DirectionalLight(0xfff4e0, 1.15); key.position.set(3.2, 6, 4.5);
  key.castShadow = true; key.shadow.mapSize.set(1024,1024);
  const sc = key.shadow.camera; sc.near=0.5; sc.far=20; sc.left=-3; sc.right=3; sc.top=3.2; sc.bottom=-1; key.shadow.bias=-0.0005;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.35); fill.position.set(-4, 3, 2); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xffffff, 0.4); rim.position.set(-1, 4, -5); scene.add(rim);

  // suelo (recibe sombra)
  const ground = new THREE.Mesh(new THREE.CircleGeometry(3.0, 48), new THREE.MeshStandardMaterial({color:0xe9e0cb, roughness:0.95}));
  ground.rotation.x = -Math.PI/2; ground.position.y = 0; ground.receiveShadow = true; scene.add(ground);

  // maniquí
  const man = buildMannequin(THREE, (vis.highlight || ex.muscles || []));
  const bodyCfg = ANIM_BODY[tpl.body] || ANIM_BODY.standing;
  man.model.rotation.x = (bodyCfg.rotX||0) * Math.PI/180;
  man.model.position.set(bodyCfg.pos[0], bodyCfg.pos[1], bodyCfg.pos[2]);
  scene.add(man.model);
  const baseModelY = man.model.position.y;

  // equipamiento
  const equip = vis.equipment || tpl.equipment || [];
  let barbell=null, dumbbells=null;
  if(equip.includes('bench')) scene.add(makeBench(THREE));
  if(equip.includes('barbell')){
    barbell = makeBarbell(THREE);
    if(tpl.barbell === 'back'){ man.joints.spine.add(barbell); barbell.position.set(0, 0.50, -0.13); }
    else if(tpl.barbell === 'front'){ man.joints.spine.add(barbell); barbell.position.set(0, 0.50, 0.16); }   // sentadilla frontal: barra en deltoides anteriores
    else scene.add(barbell);    // 'hands' → se coloca cada frame
  }
  if(equip.includes('dumbbells')){
    ['l','r'].forEach(s=>{ const d=makeDumbbell(THREE); d.position.y=-0.05; man.joints['hand_'+s].add(d); });
    dumbbells = true;
  }
  let kettle=null;
  if(equip.includes('kettlebell')){ kettle = makeKettlebell(THREE); scene.add(kettle); }   // sigue las manos
  if(equip.includes('box')){ const box=makeBox(THREE); box.position.set(0,0,0.55); scene.add(box); }
  if(equip.includes('bike')){ scene.add(makeBike(THREE)); }

  // ── órbita simple con arrastre ──
  let az = Math.atan2(camCfg.pos[0]-camCfg.tgt[0], camCfg.pos[2]-camCfg.tgt[2]);
  let pol = Math.acos((camCfg.pos[1]-camCfg.tgt[1]) / Math.hypot(camCfg.pos[0]-camCfg.tgt[0], camCfg.pos[1]-camCfg.tgt[1], camCfg.pos[2]-camCfg.tgt[2]));
  const rad = Math.hypot(camCfg.pos[0]-camCfg.tgt[0], camCfg.pos[1]-camCfg.tgt[1], camCfg.pos[2]-camCfg.tgt[2]);
  const placeCam = ()=>{ pol=Math.max(0.35,Math.min(1.45,pol));
    camera.position.set(target.x+rad*Math.sin(pol)*Math.sin(az), target.y+rad*Math.cos(pol), target.z+rad*Math.sin(pol)*Math.cos(az));
    camera.lookAt(target); };
  let drag=false, px=0, py=0;
  const cv = renderer.domElement; cv.style.cursor='grab'; cv.style.touchAction='none';
  cv.addEventListener('pointerdown', e=>{ drag=true; px=e.clientX; py=e.clientY; cv.style.cursor='grabbing'; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e=>{ if(!drag) return; az -= (e.clientX-px)*0.01; pol -= (e.clientY-py)*0.008; px=e.clientX; py=e.clientY; placeCam(); });
  cv.addEventListener('pointerup', e=>{ drag=false; cv.style.cursor='grab'; });
  placeCam();

  // ── animación ──
  const poses = tpl.poses.slice().sort((a,b)=>a.t-b.t);
  const period = (tpl.period || 3) * 1000;
  let playing = true, t0 = performance.now(), pauseAt = 0;
  const _v3a=new THREE.Vector3(), _v3b=new THREE.Vector3(), _AXIS_X=new THREE.Vector3(1,0,0);
  const lerp = (a,b,k)=> a+(b-a)*k;
  const d2r = Math.PI/180;

  function sampleAt(phase){
    let i=0; while(i<poses.length-1 && poses[i+1].t < phase) i++;
    const A=poses[i], B=poses[Math.min(i+1,poses.length-1)];
    const span=Math.max(1e-6, B.t-A.t), k=Math.max(0,Math.min(1,(phase-A.t)/span));
    const ke = k*k*(3-2*k);                 // easing suave (acelera/frena)
    // joints
    const names = Object.keys(A.joints);
    names.forEach(n=>{
      const a=A.joints[n], b=(B.joints[n]||a);
      const j=man.joints[n]; if(!j) return;
      j.rotation.set(lerp(a[0],b[0],ke)*d2r, lerp(a[1],b[1],ke)*d2r, lerp(a[2],b[2],ke)*d2r);
    });
    const ra=A.rootY||0, rb=(B.rootY!=null?B.rootY:ra);
    man.model.position.y = baseModelY + lerp(ra,rb,ke);
    // IK de pierna: mantiene los pies plantados al bajar la cadera (sentadilla)
    if(tpl.legIK){
      const hipY = 0.90 + (man.model.position.y - baseModelY);   // altura de la cadera sobre el suelo
      const d = Math.max(0.12, Math.min(0.915, hipY));
      const alpha = Math.acos(Math.max(-1, Math.min(1, d/(2*0.46))));   // ley del coseno (thigh=shin=0.46)
      ['l','r'].forEach(s=>{
        man.joints['hip_'+s].rotation.set(-alpha, 0, s==='l'?0.10:-0.10);
        man.joints['knee_'+s].rotation.set(2*alpha, 0, 0);
      });
    }
    if(tpl.lungeIK && A.feet){
      const Bf = B.feet || A.feet;
      const hipY = 0.88 + (man.model.position.y - baseModelY);
      ['l','r'].forEach(s=>{
        const z = lerp(A.feet[s][0], Bf[s][0], ke), y = lerp(A.feet[s][1], Bf[s][1], ke);
        const ik = solveLegIK(hipY, z, y);
        man.joints['hip_'+s].rotation.set(ik.hipX, 0, s==='l'?0.06:-0.06);
        man.joints['knee_'+s].rotation.set(ik.kneeX, 0, 0);
      });
    }
  }

  function frame(now){
    if(!document.body.contains(cv) || cv.offsetParent===null){ cleanup(); return; }
    const elapsed = playing ? (now - t0) : pauseAt;
    const phase = (elapsed % period) / period;
    sampleAt(phase);
    // barra que sigue las manos (posición + orientación)
    if(barbell && tpl.barbell==='hands'){
      man.joints.hand_l.getWorldPosition(_v3a); man.joints.hand_r.getWorldPosition(_v3b);
      barbell.position.copy(_v3a).add(_v3b).multiplyScalar(0.5);
      const dir = _v3b.clone().sub(_v3a);
      if(dir.lengthSq() > 1e-4){ barbell.quaternion.setFromUnitVectors(_AXIS_X, dir.normalize()); }
    }
    if(kettle){   // kettlebell colgando entre las manos
      man.joints.hand_l.getWorldPosition(_v3a); man.joints.hand_r.getWorldPosition(_v3b);
      kettle.position.copy(_v3a).add(_v3b).multiplyScalar(0.5); kettle.position.y -= 0.12;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  let raf = requestAnimationFrame(frame);

  function cleanup(){
    cancelAnimationFrame(raf);
    renderer.dispose();
    scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } });
  }

  // controles externos (play/pausa)
  container._animApi = {
    toggle(){ if(playing){ pauseAt = performance.now()-t0; playing=false; } else { t0 = performance.now()-pauseAt; playing=true; } return playing; },
    dispose: cleanup
  };
  // re-encaja tamaño si cambia
  const ro = new ResizeObserver(()=>{ const w=container.clientWidth||W; renderer.setSize(w,H); camera.aspect=w/H; camera.updateProjectionMatrix(); });
  ro.observe(container);
}

/* ── Auto-asignación de animación por PATRÓN de movimiento ──
   Todos los ejercicios obtienen animación sin editarlos uno a uno.
   Un `visual` explícito en el ejercicio tiene prioridad.
══════════════════════════════════════════════════════════ */
const PAT_TPL = {
  sentadilla:'sentadilla', bisagra:'bisagra', empuje_h:'press_horizontal', empuje_v:'press_vertical',
  traccion_h:'remo', traccion_v:'jalon', unilateral:'zancada', acarreo:'carry',
  carrera:'carrera', ergometro:'bici', pliometria:'salto', movilidad:'movilidad'
};
function defaultVisualFor(ex){
  if(!ex) return null;
  let tplName = PAT_TPL[ex.pat] || null;
  const n = (ex.name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if(ex.pat==='sentadilla'){
    tplName = /frontal|goblet|front|copa|jaca|hack/.test(n) ? 'sentadilla_frontal' : 'sentadilla';
  } else if(ex.pat==='bisagra'){
    tplName = /rumano|rdl|buenos dias|good morning|swing|hip thrust|puente|gluteo/.test(n) ? 'bisagra'
            : /muerto|deadlift/.test(n) ? 'peso_muerto' : 'bisagra';
  } else if(ex.pat==='accesorio'){
    const m = ex.muscles||[];
    if(m.includes('gemelo')) tplName='gemelo';
    else if(m.includes('triceps') && !m.includes('biceps')) tplName='extension_triceps';
    else if(m.includes('hombro') && !m.includes('biceps') && !m.includes('pecho')) tplName='elevacion_lateral';
    else tplName='curl';
  } else if(ex.pat==='core'){
    tplName = /crunch|abdominal|encogimiento|elevaci.n de piern|sit.?up|russian|giro|rueda|hollow/.test(n) ? 'crunch' : 'plancha';
  } else if(ex.pat==='condicionamiento'){
    tplName = /burpee|salto|jump|box/.test(n) ? 'salto' : 'jumping';
  }
  if(!tplName && ex.type){   // último recurso por tipo
    tplName = ex.type==='cardio' ? 'carrera' : ex.type==='hiit' ? 'jumping' : ex.type==='movilidad' ? 'movilidad' : ex.type==='core' ? 'plancha' : 'curl';
  }
  if(!tplName || !ANIM_TEMPLATES[tplName]) return null;
  const tpl = ANIM_TEMPLATES[tplName];
  const eq = (ex.equip||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const supportsBar = !!tpl.barbell || tplName==='press_horizontal';
  let equip;
  if(/kettlebell|kettle|pesa rusa/.test(eq+' '+n)) equip = ['kettlebell'];
  else if(tplName==='salto' && /box|cajon/.test(n)) equip = ['box'];
  else if(tplName==='press_horizontal') equip = /mancuern/.test(eq) ? ['bench','dumbbells'] : ['bench','barbell'];
  else if(/mancuern/.test(eq)) equip = ['dumbbells'];
  else if(/barra/.test(eq) && supportsBar) equip = ['barbell'];
  return { template:tplName, equipment:equip, camera:tpl.camera, highlight:ex.muscles||[] };
}
function hasAnimFor(ex){ return !!(ex && (ex.visual ? ANIM_TEMPLATES[ex.visual.template] : defaultVisualFor(ex))); }

window.startExerciseAnim = startExerciseAnim;
window.ANIM_TEMPLATES = ANIM_TEMPLATES;
window.ANIM_BODY = ANIM_BODY;
window.ANIM_CAMERAS = ANIM_CAMERAS;
window.defaultVisualFor = defaultVisualFor;
window.hasAnimFor = hasAnimFor;
