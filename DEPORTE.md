# Sección Deporte · auditoría, diseño y checklist

> Documento vivo. Estado a **21 julio 2026**.
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
| `sport-gear.js` | — | **NUEVO** · material por ejercicio (ítems normalizados) y lugares |
| `sport-illus.js` | — | **NUEVO** · pictogramas SVG por ejercicio (`exIllus`, offline) |
| `sport-log.js` | — | **NUEVO** · registro de entrenamientos, PRs, 1RM, volumen |
| `sport-train.js` | — | **NUEVO** · modo entrenamiento serie a serie |
| `sport-progress.js` | — | **NUEVO** · pantalla de progreso |

**Arquitectura**: scripts NO-módulo que comparten scope global vía `window`. Se concatenan
con `build.mjs` → `app.min.js`. Ver §7 para las trampas de este modelo.

---

## 2. Auditoría · estado inicial

### Catálogo: 242 → 341 ejercicios · 17 sesiones

Una primera versión de esta auditoría dijo «43 ejercicios». **Era incorrecta**: no se
contabilizó `sport-catalog.js`, que aportaba 199 más. El total de partida era **242**.
Tras la ampliación de disciplinas (+99), quitar 7 duplicados y añadir 7 máquinas de
gimnasio son **341**. Y **17 sesiones** preparadas (13 base + 4 de gimnasio con
máquinas de 60 min por nivel).

| Disciplina | Antes | Ahora | |
|---|---|---|---|
| Gimnasio | 118 | 137 | ✅ |
| En casa | 46 | 41 | ✅ |
| **Natación** | **6** | **30** | ✅ |
| **Ciclismo** | **4** | **20** | ✅ |
| **Raqueta** | **4** | **17** | ✅ |
| **Combate** | **4** | **15** | ✅ |
| **Remo/palas** | **6** | **15** | ✅ |
| Carrera/marcha | 14 | 14 | ✅ |
| Yoga/movilidad | 10 | 14 | ✅ |
| Funcional | 11 | 11 | ✅ |
| **Baile** | **2** | **10** | ✅ |
| Deporte de equipo | 9 | 9 | ⚠️ |
| Aventura | 7 | 7 | ⚠️ |
| Otros | 1 | 1 | — |

Patrones dentro de Gimnasio: tracción vertical **2 → 15**, core **3 → 7**.
Siguen flojos **unilateral (6)** y **acarreo (2)**.
Solo **10 de 341** ejercicios tienen `visual` (animación 3D, hoy desactivada).

#### Bug de datos encontrado al ampliar

Seis ejercicios importados tenían `equip: "Peso corporal"` cuando su nombre exige
material: los cinco jalones (`sf_jalon_*`, necesitan polea alta) y
`sf_press_banca_con_agarre_cerrado` (barra). Con `exDisc` inferiendo la disciplina
del equipo, aparecían como «En casa»; y **con el filtro de material nuevo se los
habría ofrecido a alguien que marcara «solo peso corporal»**. Corregidos.

El validador de `validate-catalog.cjs` comprueba esta coherencia
(`equip` vs. material que implica el nombre) además de taxonomías, MET y campos
obligatorios. Conviene pasarlo al añadir ejercicios.

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
| A10 | Disciplinas pobres (natación 6, ciclismo 4, baile 2) | 🟠 | ✅ resuelto (+99 ej.) |
| A15 | 6 ejercicios con `equip: "Peso corporal"` que exigen polea o barra | 🟠 | ✅ resuelto |
| A16 | **`.train-ov` con `z-index:9000`**: los diálogos (300 y 4000) se abrían detrás. Terminar, Cambiar, Saltar y Abandonar parecían botones muertos | 🔴 | ✅ resuelto |
| A17 | Sin forma rápida de entrenar: Entrenamientos → abrir día → ▶ (3 pasos) | 🟠 | ✅ barra «Entrenar hoy» |
| A18 | No se podía añadir un ejercicio no previsto durante la sesión | 🟠 | ✅ resuelto |
| A19 | Deshacer solo aparecía al completar el ejercicio entero | 🟠 | ✅ resuelto |
| A20 | `spGearOk` comparaba subcadenas: «Barra + banco» pasaba teniendo solo barra | 🟠 | ✅ `sport-gear.js` |
| A21 | 3 ejercicios «con propio peso» etiquetados `equip:"Barra"` → excluidos justo para quien entrena sin material | 🟠 | ✅ resuelto |
| A22 | 7 ejercicios duplicados entre `EXERCISES_BASE` y `EXTRA_EXERCISES` | 🟡 | ✅ resuelto |
| A23 | El guardián de arranque mostraba «La app no pudo arrancar» ante cualquier error **posterior** al arranque (p. ej. fallo puntual del service worker) | 🟠 | ✅ resuelto |
| A24 | **Menú de ayuda (❔) se salía de la pantalla en móvil**: el botón se reordena a la izquierda pero el menú abría con `right:0` (hacia la izquierda) → `left:-132`. Sin tope de altura tampoco | 🔴 | ✅ resuelto |
| A25 | No había sesiones de gimnasio con máquinas de 60 min preparadas | 🟠 | ✅ 4 sesiones por nivel |
| A26 | Sin forma de elegir qué entrenar (hoy / preparada / por músculo / a medida) desde un único sitio | 🟠 | ✅ panel «Elegir entrenamiento» |
| A11 | **Fallback silencioso**: si no hay ejercicios de la disciplina, `sport-calendar.js:412` cae a `'all'` y genera gimnasio llamándolo natación | 🟠 | ✅ resuelto |
| A12 | Calentamiento no suma a la duración estimada | 🟡 | ✅ resuelto |
| A13 | `alert()` nativo en `sport-calendar.js:391,420` y `sport-ui.js:607,608,726,732` | 🟡 | ✅ resuelto |
| A14 | Solo 10/242 ejercicios con `visual` (animación 3D) | 🟡 | ➖ sustituido por A27 |
| A27 | Sin imagen para identificar cada ejercicio | 🟠 | ✅ pictogramas SVG (`sport-illus.js`) |

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
- [x] Catálogo 242 → **334** ejercicios (natación, ciclismo, raqueta, combate, remo,
      baile, tracción vertical y core de gimnasio)
- [x] Corregidos 6 `equip` erróneos que rompían el filtro de material
- [x] **Arreglados los botones muertos** del modo entrenamiento (z-index, A16)
- [x] Barra fija **«Entrenar hoy»** con ▶ en toda la sección de Deporte
- [x] Añadir ejercicio extra en mitad de la sesión (buscador + filtros)
- [x] Cambiar ejercicio con los **más parecidos primero**, agrupados y resaltados
- [x] Deshacer la última serie disponible en todo momento
- [x] `sport-gear.js`: material normalizado por ejercicio y perfiles de lugar
- [x] Asistente: paso **«¿dónde entrenas?»** + confirmación de material con
      contador en vivo de ejercicios disponibles
- [x] Guardián de arranque acotado a fallos reales de arranque (A23)
- [x] **Pictogramas SVG por ejercicio** (`sport-illus.js`) en tarjetas, detalle,
      modo entrenamiento y selectores

### Pictogramas de ejercicios (`sport-illus.js`)

No se pueden empaquetar 341 fotos reales (la app funciona offline y el service
worker bloquea imágenes externas: justo en el gimnasio con mala cobertura
fallarían). En su lugar, `exIllus(id)` genera una **ilustración SVG esquemática**
(silueta + material) por ejercicio, elegida por patrón de movimiento + equipo +
nombre. ~35 poses cubren los 341 (solo 1 genérico). Autocontenido, hereda el
color del músculo (`--il`) y tema claro/oscuro. Se muestra en las tarjetas del
catálogo, el detalle, el modo entrenamiento y los selectores.

Para afinar una pose: añadir/editar en `ILL_POSES` y su regla en `illPoseKey`.
Para una foto real de un ejercicio concreto en el futuro: se podría añadir un
campo `img` (data URI) al ejercicio y que `exIllus` lo prefiera.

**Mapa muscular** (`muscleMapBox`): silueta frontal + dorsal con los músculos
implicados resaltados (primario intenso, secundarios tenues) + leyenda. Es la
misma información que dan las guías externas (qué músculos trabaja el ejercicio)
pero como imagen original nuestra. Se muestra en el detalle, junto al pictograma.

> **Nota sobre guías externas** (SimplyFitness u otras): no se pueden **incrustar**
> — envían `X-Frame-Options: DENY` y `frame-ancestors 'none'`, el navegador
> rechaza el iframe. Y **no se deben copiar sus ilustraciones** (ni «rehacerlas con
> IA a partir de las suyas»: sería obra derivada, sigue con copyright). Lo legal es
> reusar la **información** (hechos: movimiento, músculos) en arte propio — que es
> lo que hacen `sport-illus.js` y el mapa muscular.

### Sistema de material (`sport-gear.js`)

El campo `equip` es texto libre («Barra + rack», «Piscina, gafas»): sirve para leer,
no para comprobar. `gearItemsOf(id)` lo traduce a ítems normalizados
(`['barra','rack']`) mediante reglas, y `gearCanDo(id, tengo)` exige **todos**.
La versión anterior comparaba subcadenas y bastaba con una coincidencia: «Barra +
banco» pasaba el filtro teniendo solo barra.

`GEAR_PLACES` define qué hay normalmente en cada sitio — casa sin material, casa
con lo básico, casa equipada, gimnasio, parque, hotel — y el asistente lo usa para
precargar el material. Cobertura actual: **71 ejercicios sin nada**, 247 en gimnasio
completo, de 341.

### Pendiente
- [ ] Deporte de equipo (9) y aventura (7) → mínimo 15 cada uno.
      Formato: añadir a `EXTRA_EXERCISES` en `sport-catalog.js` con los campos
      `name, type, muscles, met, equip, mode, sets, reps|dur, rest, cues, pat`
      y `disc` explícito si el nombre no permite inferir la disciplina.
- [ ] Unilateral (6) y acarreo (2) en gimnasio → mínimo 10 cada uno
- [ ] `visual` para los ejercicios principales (hoy 10/341) y reactivar `ANIM_ENABLED`
- [ ] Exportar el historial de entrenamientos a CSV
- [ ] Integrar kcal de entrenamiento registradas con el balance de Nutrición
- [ ] Gráfica de peso corporal en Progreso (hoy solo fuerza)
- [ ] Plantillas de mesociclo predefinidas (5/3/1, PPL, Upper-Lower, GZCLP)
- [ ] Test automatizado del generador (que ninguna combinación de criterios devuelva `null`)

---

## 5. Lista de ejercicios a añadir

Las disciplinas de la lista original (natación, ciclismo, raqueta, combate, remo,
baile) y los huecos de gimnasio **ya están hechos** (+99 ejercicios). Queda:

**Deporte de equipo (9 → 15)** — Fútbol: pase y control · Fútbol: finalización ·
Baloncesto: entrada a canasta · Baloncesto: rebote · Balonmano: lanzamiento en
suspensión · Voleibol: saque en salto · Rugby: placaje técnico (con protecciones) ·
Hockey: conducción de stick

**Aventura / aire libre (7 → 15)** — Escalada: bloque · Escalada: vías de resistencia ·
Trail running: bajadas técnicas · Esquí de fondo · Vía ferrata · Barranquismo:
desplazamiento · Orientación · Slackline

**Unilateral en gimnasio (6 → 10)** — Zancada caminando con mancuernas · Sentadilla
búlgara con barra · Peso muerto rumano a una pierna · Step-up al cajón con carga ·
Sentadilla a una pierna (pistol) asistida

**Acarreo en gimnasio (2 → 10)** — Farmer's walk con mancuernas · Farmer's walk con
barra hexagonal · Acarreo frontal (front rack) · Acarreo overhead · Yoke walk ·
Acarreo en zigzag

> Al añadirlos, pasar `validate-catalog.cjs` (coherencia de `equip`, taxonomías,
> MET) y después `node build.mjs && node smoke-sport.cjs`.

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
node validate-catalog.cjs   # valida los datos del catálogo (rápido, sin navegador)
node build.mjs              # regenera app.min.js + sella sw.js y el HTML

# smoke test en Chrome headless (70 comprobaciones)
python -m http.server 8000  # en otra terminal
node smoke-sport.cjs
```

`validate-catalog.cjs` comprueba, para los 334 ejercicios: campos obligatorios,
taxonomías válidas (`type`/`pat`/`muscles`/`disc`), MET en rango 0-16, coherencia
entre `equip` y el material que implica el nombre, y `cues` presentes. Sale con
código 1 si hay errores. **Pásalo siempre que toques el catálogo.**

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
| 6b | **Material y accesos**: `gearItemsOf`, exigir todo el material, sesión en casa sin nada, selector con buscador/filtros/parecidos, ejercicio extra, deshacer, barra «Entrenar hoy» y su ▶ |
| 7b | **Guardián de arranque**: ignora fallos de SW y errores posteriores al arranque |
| 8 | Modo oscuro (luminancia real de las superficies) |

El bloque 3 incluye **cobertura por disciplina**: verifica que cada deporte genere
una sesión propia sin colar ejercicios de otras disciplinas (el fallo original de
natación).

Debe salir **70 OK · 0 fallos**. Las capturas quedan en `.shots/`.
Si tocas el generador o el registro, ejecútalo antes de mergear.

> ⚠️ El archivo es `.cjs` a propósito: `package.json` tiene `"type":"module"`
> y el harness CDP usa `require`.
