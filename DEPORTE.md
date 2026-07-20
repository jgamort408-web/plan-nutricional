# Sección Deporte · auditoría, diseño y checklist

> Documento vivo. Estado a **20 julio 2026**.
> Sirve para que cualquier programador pueda continuar el trabajo sin contexto previo.

---

## 1. Mapa de archivos

| Archivo | Líneas | Qué hace |
|---|---|---|
| `sport-data.js` | 337 | Taxonomías (`EX_MUSCLES`, `EX_TYPES`, `EX_PATTERNS`, `EX_SPORTS`), `EXERCISES_BASE` (43), `SESSIONS_BASE` (13), `exDisc()`, persistencia del plan |
| `sport-catalog.js` | 3.678 | `EXTRA_EXERCISES` (199 ejercicios importados). Se fusiona en `EXERCISES_BASE` |
| `sport-engine.js` | 160 | Solo cálculo: duración, kcal (MET·kg·h), agregados por día/plan |
| `sport-ui.js` | 861 | Catálogo, filtros, editor, **generador de sesiones** (`buildSessionByCriteria`) |
| `sport-calendar.js` | 638 | Calendario de entrenamientos, `generateSportPlan()` |
| `sport-assistant.js` | 226 | Asistente de 8 pasos para crear plan |
| `sport-anim.js` | 606 | Visor 3D (en standby, `ANIM_ENABLED = false`) |
| `sport-log.js` | — | **NUEVO** · registro de entrenamientos, PRs, 1RM, volumen |
| `sport-train.js` | — | **NUEVO** · modo entrenamiento serie a serie |
| `sport-progress.js` | — | **NUEVO** · pantalla de progreso |

**Arquitectura**: scripts NO-módulo que comparten scope global vía `window`. Se concatenan
con `build.mjs` → `app.min.js`. Ver §7 para las trampas de este modelo.

---

## 2. Auditoría · estado inicial

### Catálogo: 242 ejercicios (no 43)

Una primera versión de esta auditoría dijo «43 ejercicios». **Era incorrecta**: no se
contabilizó `sport-catalog.js`, que aporta 199 más. El total real es **242**.

Reparto por disciplina:

| Disciplina | Ejercicios | |
|---|---|---|
| Gimnasio | 118 | ✅ |
| En casa | 46 | ✅ |
| Carrera/marcha | 14 | ✅ |
| Funcional | 11 | ✅ |
| Yoga/movilidad | 10 | ✅ |
| Deporte de equipo | 9 | ⚠️ |
| Aventura | 7 | ⚠️ |
| **Natación** | **6** | 🔴 |
| **Remo/palas** | **6** | 🔴 |
| **Ciclismo** | **4** | 🔴 |
| **Raqueta** | **4** | 🔴 |
| **Combate** | **4** | 🔴 |
| **Baile** | **2** | 🔴 |

Huecos por patrón dentro de Gimnasio: **tracción vertical 2**, **core 3**, acarreo 1.
Solo **10 de 242** ejercicios tienen `visual` (animación 3D, hoy desactivada).

### Hallazgos

| # | Hallazgo | Gravedad | Estado |
|---|---|---|---|
| A1 | **No existe registro de entrenamientos.** Las 8 claves `sport:*` son todas de planificación. No se guarda ni una serie, ni un kg, ni un RPE | 🔴 Crítico | ✅ resuelto |
| A2 | **El plan no progresa.** `generateSportPlan()` copia la misma sesión a las 16 semanas. Sin sobrecarga progresiva no hay adaptación | 🔴 Crítico | ✅ resuelto |
| A3 | Sin **deload** | 🔴 | ✅ resuelto |
| A4 | Selección **aleatoria** (`sort(()=>Math.random()-0.5)`): no distingue básico de accesorio | 🟠 | ✅ resuelto |
| A5 | Sin control de **volumen semanal** por grupo muscular (referencia: 10-20 series/sem) | 🟠 | ✅ resuelto |
| A6 | Sin **recuperación 48 h**: puede poner pecho lunes y martes | 🟠 | ✅ resuelto |
| A7 | Sin ratio **empuje:tracción** (debe ser ≈1:1, salud del hombro) | 🟠 | ✅ resuelto |
| A8 | El asistente **no pregunta experiencia, lesiones ni material** | 🟠 | ✅ resuelto |
| A9 | No propone **cargas en kg** | 🟠 | ✅ resuelto |
| A10 | Disciplinas pobres (natación 6, ciclismo 4, baile 2) | 🟠 | 🔲 pendiente |
| A11 | **Fallback silencioso**: si no hay ejercicios de la disciplina, `sport-calendar.js:412` cae a `'all'` y genera gimnasio llamándolo natación | 🟠 | ✅ resuelto |
| A12 | Calentamiento no suma a la duración estimada | 🟡 | ✅ resuelto |
| A13 | `alert()` nativo en `sport-calendar.js:391,420` y `sport-ui.js:607,608,726,732` | 🟡 | ✅ resuelto |
| A14 | Solo 10/242 ejercicios con `visual` | 🟡 | 🔲 pendiente |

---

## 3. Lo construido

### 3.1 `sport-log.js` · registro

Clave `sport:log:v1`. Un registro por sesión ejecutada:

```js
{ id:'lg_1721...', date:'2026-07-20', sessId:'push_a', sessName:'Empuje A',
  who:'A', startTs:1721..., endTs:1721..., durSec:3720, restSec:900,
  bodyweight:78, feel:4, notes:'',
  ex:[ { e:'press_banca_barra',
         sets:[ {kg:60, reps:8, rpe:8, done:true},
                {kg:60, reps:7, rpe:9, done:true} ] } ] }
```

API pública (todas en `window`):

| Función | Qué devuelve |
|---|---|
| `logAll()` / `logSave(entry)` / `logDelete(id)` | CRUD |
| `logLastFor(exId, who)` | Última ejecución de un ejercicio → prellenar kg/reps |
| `logBestFor(exId, who)` | Mejor serie histórica (por 1RM estimado) |
| `est1RM(kg, reps)` | Epley: `kg · (1 + reps/30)`, tope 12 reps |
| `logVolumeByMuscle(from, to, who)` | Series efectivas por grupo muscular |
| `logTonnage(entry)` | Σ kg × reps |
| `logPRs(who)` | PRs por ejercicio |
| `logStreak(who)` | Racha de semanas con ≥1 entreno |
| `logSuggestLoad(exId, who, targetReps)` | **kg sugeridos** para la próxima sesión |

**Progresión** (`logSuggestLoad`): si en la última ejecución se completaron todas las
series al rango de reps objetivo con RPE ≤ 8 → sube +2,5 kg (tren superior) o +5 kg
(tren inferior). Si RPE ≥ 9,5 o falló reps → mantiene. Dos sesiones fallidas → baja 10 %.

### 3.2 `sport-train.js` · modo entrenamiento

Pantalla a pantalla, optimizada para el móvil con una mano:

- Cronómetro de sesión (persistente: sobrevive a recargar la página).
- **Cronómetro de descanso automático** al cerrar serie, con aviso sonoro/vibración.
- kg y reps **preprellenados** con la última ejecución → confirmar es 1 toque.
- Botones grandes: `✓ Serie` · `+2,5` · `−2,5` · `Saltar` · `Sustituir ejercicio`.
- RPE solo en la última serie de cada ejercicio (menos fricción).
- Estado en `sport:train:v1` → si cierras la app a mitad, retoma donde ibas.
- Al terminar: resumen con tonelaje, duración, PRs conseguidos y sensación (1-5).

### 3.3 `sport-progress.js` · pantalla de progreso

Nueva pestaña 📈 **Progreso** en la barra de Deporte:

- **Resumen**: entrenos del mes, racha, tonelaje total, tiempo entrenado.
- **Volumen semanal por grupo muscular** en barras, con la franja 10-20 series marcada.
- **Curva de fuerza** por ejercicio (1RM estimado en el tiempo) — SVG sin librerías.
- **PRs** con fecha.
- **Historial** completo, desplegable por sesión, editable y borrable.

### 3.4 Generador infalible

`buildSessionByCriteria()` reescrito. Cambios:

1. **Scoring determinista** en vez de `Math.random()`:
   `score = cobertura×10 + prioridadPatrón×6 + básico×4 − penalizaciónRepetición×3 + noRecienteBonus×2`
   Los compuestos multiarticulares entran primero; los accesorios rellenan.
2. **Equilibrio obligatorio**: si entra un empuje, se fuerza una tracción del mismo plano.
3. **Cuota de volumen** por grupo muscular según objetivo y días/semana.
4. **Separación 48 h**: al repartir en el calendario, no se repite grupo muscular en días consecutivos.
5. **Filtro por material y lesiones**: excluye ejercicios cuyo `equip` no esté disponible
   o que carguen una zona marcada como lesionada.
6. **Nivel de experiencia**: novato → máquinas y patrones simples, 2-3 series, RPE 6-7;
   avanzado → peso libre, 4-5 series, RPE 8-9.
7. **Calentamiento contabilizado** en la duración (8 min).
8. **Sin fallback silencioso**: si la disciplina no da candidatos, avisa con `pnToast`.

### 3.5 Progresión del plan

`generateSportPlan()` ahora genera **bloques de mesociclo**:

- Semanas 1→N: volumen e intensidad crecientes (`+1 serie` cada 2 semanas, hasta el techo del nivel).
- Cada **4ª semana (o 6ª en avanzados): deload** −40 % volumen, −20 % intensidad.
- Cada semana lleva `week` y `phase` (`acumulacion` | `intensificacion` | `deload`) en el plan.

---

## 4. Checklist

### Hecho
- [x] Auditoría completa de los 7 módulos
- [x] `sport-log.js` · modelo de datos + progresión de cargas
- [x] `sport-train.js` · modo entrenamiento con cronómetros
- [x] `sport-progress.js` · pantalla de progreso con gráficas
- [x] Generador determinista con scoring, equilibrio y cuotas
- [x] Progresión semanal + deload en `generateSportPlan()`
- [x] Asistente: pasos de experiencia, material y lesiones
- [x] Sustituir `alert()` por `pnToast`/`pnConfirm` en la sección
- [x] Nueva pestaña 📈 Progreso + botón ▶ Entrenar
- [x] Estilos claro y oscuro
- [x] `build.mjs` actualizado con los 3 archivos nuevos

### Pendiente
- [ ] **Ampliar catálogo de disciplinas pobres** (A10): natación 6→30, ciclismo 4→20,
      raqueta 4→15, combate 4→15, baile 2→10, remo 6→15.
      Formato: añadir a `EXTRA_EXERCISES` en `sport-catalog.js` con los campos
      `name, type, muscles, met, equip, mode, sets, reps|dur, rest, cues, pat`.
- [ ] Tracción vertical y core en gimnasio (hoy 2 y 3) → mínimo 8 cada uno
- [ ] `visual` para los ejercicios principales (hoy 10/242) y reactivar `ANIM_ENABLED`
- [ ] Exportar el historial de entrenamientos a CSV
- [ ] Integrar kcal de entrenamiento registradas con el balance de Nutrición
- [ ] Gráfica de peso corporal en Progreso (hoy solo fuerza)
- [ ] Plantillas de mesociclo predefinidas (5/3/1, PPL, Upper-Lower, GZCLP)
- [ ] Test automatizado del generador (que ninguna combinación de criterios devuelva `null`)

---

## 5. Lista de ejercicios a añadir

Formato de trabajo: lista plana, se completan los campos al implementarlos.

**Natación** — Crol continuo · Series 50/100/200/400 · Pies con tabla (crol/espalda) ·
Brazos con pull-buoy · Técnica de respiración bilateral · Hipoxia · Palas · Aletas ·
Viraje · Salida de bloque · Aguas abiertas · Estilos (IM) · Nado de recuperación

**Ciclismo** — Rodaje base Z2 · Intervalos 4×4 min · Cuestas de pie/sentado · Cadencia
alta (100+ rpm) · Sprints 30 s · Sweet spot · Contrarreloj 20 min · Rodillo · Spinning

**Raqueta** — Derecha/revés cruzado · Voleas · Smash · Servicio plano/liftado · Dejada ·
Desplazamiento en escalera · Multibola · Pared · Bandeja (pádel) · Víbora (pádel)

**Combate** — Sombra por rounds · Saco pesado · Manoplas · Comba de boxeo · Esquivas ·
Rodillas en clinch · Patadas circulares/frontales · Trabajo de guardia · Sparring técnico

**Remo/palas** — Remo 500 m · Remo 2 km · Intervalos 250 m · SkiErg · Técnica de pasada ·
Kayak plano · Piragüismo · Remada con palas cortas

**Baile** — Zumba · Salsa cardio · Hip-hop · Bachata · Danza contemporánea · Ballet fit ·
Batuka · Coreografía HIIT

**Tracción vertical (gimnasio)** — Dominada supina/prona/neutra · Dominada lastrada ·
Dominada asistida con banda/máquina · Jalón al pecho abierto/neutro/tras nuca · Pullover en polea

**Core (gimnasio)** — Rueda abdominal · Elevación de piernas colgado · Pallof press ·
Rotación en polea · Plancha con lastre · Hollow hold · Copenhagen · Suitcase carry ·
Dead bug con carga · Bird dog

---

## 6. Claves de localStorage

| Clave | Contenido |
|---|---|
| `sport:ex:v1` | Ejercicios creados por el usuario |
| `sport:sess:v1` | Sesiones del usuario |
| `sport:plan:v2` | Plan del calendario |
| `sport:saved:v1` | Planes guardados |
| `sport:favs:v1` | Ejercicios favoritos |
| `sport:view` / `sport:section` / `sport:exview` | Estado de navegación |
| **`sport:log:v1`** | **Historial de entrenamientos ejecutados** |
| **`sport:train:v1`** | **Sesión en curso (para retomarla)** |
| **`sport:profile:v1`** | **Nivel, material disponible, lesiones** |

---

## 7. Trampas de esta arquitectura (leer antes de tocar nada)

Los scripts **no son módulos ES**: `build.mjs` los **concatena** en `app.min.js`
preservando el scope global. Esto tiene tres consecuencias que ya han roto la app:

1. **TDZ (temporal dead zone)** — al concatenar, un `const`/`let` de nivel superior queda
   *hoisted pero sin inicializar*. Un guard tipo `typeof CalState === 'undefined'`
   **lanza** `ReferenceError` en vez de devolver `'undefined'`.
   → **Usa `var` para el estado global de un módulo.** `build.mjs` tiene un `checkTDZ()`
   que aborta el build si detecta el patrón.

2. **Hoisting de funciones entre archivos** — `typeof miFuncion === 'function'` pasa a ser
   `true` aunque el módulo aún no haya inicializado su estado. No uses ese guard para
   saber si un módulo está listo.

3. **Service worker** — `build.mjs` sella `sw.js` y el HTML con un hash del bundle. Si
   editas un `.js` y **no** ejecutas `node build.mjs`, los dispositivos ya instalados
   seguirán sirviendo la versión antigua desde caché.

`node --check` **no** detecta 1 ni 2 (son errores de runtime). **Prueba siempre en un
navegador real antes de mergear**, y con `localStorage` poblado: varios bugs solo
aparecían con una vista guardada concreta.

---

## 8. Cómo compilar y probar

```bash
node build.mjs        # regenera app.min.js + sella sw.js y el HTML

# smoke test en Chrome headless (32 comprobaciones)
python -m http.server 8000    # en otra terminal
node smoke-sport.cjs
```

`smoke-sport.cjs` es la red de seguridad contra los fallos de §7. Cubre:

| Bloque | Qué verifica |
|---|---|
| 1 | Arranque **con cada vista persistida** (`ex`/`sess`/`scal`/`prog`/`cal`): splash, overlay de error y consola limpia. Un bug anterior solo aparecía con `cal` guardada |
| 2 | Catálogo (242 ejercicios) y perfil por defecto |
| 3 | **630 combinaciones** músculo × disciplina × duración sin devolver `null`; determinismo; equilibrio empuje:tracción; filtros de material y de lesión |
| 4 | Fases del mesociclo y su aplicación (descarga = −2 series) |
| 5 | Progresión de cargas al alza y a la baja, tonelaje, 1RM, volumen, CSV |
| 6 | Modo entrenamiento: apertura, cierre de serie, persistencia, guardado y limpieza |
| 7 | Pantalla de progreso: KPIs, barras, historial, desplegable y estado vacío |
| 8 | Modo oscuro (luminancia real de las superficies) |

Debe salir **32 OK · 0 fallos**. Las capturas quedan en `.shots/`.
Si tocas el generador o el registro, ejecútalo antes de mergear.

> ⚠️ El archivo es `.cjs` a propósito: `package.json` tiene `"type":"module"`
> y el harness CDP usa `require`.
