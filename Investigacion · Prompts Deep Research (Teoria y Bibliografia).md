# Investigación para Teoría y Bibliografía · Prompts de *Deep Research* (Gemini)

Documento de trabajo para **ampliar y dar base científica** a las secciones
**Teoría** y **Bibliografía** de la app *Plan Nutricional*. Contiene:

1. **Qué información necesita la app** (inventario + huecos por rellenar).
2. **Formato de salida exacto** para que lo que devuelva la IA entre casi tal cual en la app.
3. **Prompts de Deep Research**, clasificados en varias investigaciones (Nutrición · Mente · Ejercicio), con criterios estrictos de **fiabilidad e independencia de la industria alimentaria**.

> Cómo usarlo: copia el **Preámbulo común** (bloque 3.0) + el **prompt de la investigación** que quieras y pégalos en *Gemini › Deep Research*. Lanza una investigación por tema. Al terminar, revisa y pásame el resultado para integrarlo en `menu-teoria.js` y `menu-biblio.js`.

---

## 1 · Qué información necesita la app

### 1.1 Estado actual (lo que YA hay)

**Teoría** — 8 temas, 18 artículos. Cobertura fuerte en *macros, energía, metabolismo y crononutrición*; **débil en Ejercicio (1 artículo) y Mente (1 artículo)**; *práctica* con poco.

| Tema | Cobertura actual | Prioridad de ampliación |
|---|---|---|
| 🌱 Fundamentos | media | media |
| ⚖️ Macronutrientes | alta | baja–media |
| 🔥 Energía y peso | alta | baja |
| ⚙️ Metabolismo | alta | baja |
| 🕒 Crononutrición | alta | baja |
| 🍽️ En la práctica | baja | **alta** |
| 🏋️ Ejercicio | **muy baja** | **alta** |
| 🧠 Mente y hábitos | **muy baja** | **alta** |

**Bibliografía** — temas: nutrición, metabolismo, proteína, grasas, hidratos, crono, ejercicio, salud mental, peso. Necesita **más entradas en ejercicio, salud mental, práctica/hábitos, micronutrientes e hidratación**, y fuentes de **guías/instituciones independientes**.

### 1.2 Huecos concretos por rellenar (temario objetivo)

**NUTRICIÓN**
- Patrones dietéticos con evidencia (mediterráneo, DASH, basado en plantas) vs. dietas de moda.
- Clasificación NOVA y ultraprocesados: qué dice la evidencia y sus límites/críticas.
- Proteína: cantidad por objetivo (mantenimiento, recomposición, mayores, deportistas), reparto, calidad y fuentes vegetales.
- Grasas: saturadas vs insaturadas, omega-3/6, aceites de semilla (debate y consenso actual), colesterol dietético.
- Hidratos: fibra, índice/carga glucémica, integrales vs refinados, azúcares libres.
- Micronutrientes clave y déficits frecuentes (vit. D, B12, hierro, yodo, calcio, omega-3), y **suplementación con evidencia** (qué sirve y qué no).
- Hidratación: necesidades reales, mitos de "2 litros", electrolitos.
- Crononutrición y ayuno intermitente / TRE: qué aporta y a quién.
- Microbiota y salud digestiva: fibra, fermentados, prebióticos/probióticos.
- Poblaciones: envejecimiento/sarcopenia, mujer (ciclo, embarazo, menopausia), vegetarianismo/veganismo bien planteados, niños/adolescentes.
- Seguridad, saciedad y regulación del apetito (hormonas: leptina, grelina, GLP-1).
- **Desinformación y conflictos de interés**: cómo la financiación de la industria sesga la ciencia nutricional; cómo leer un estudio.

**MENTE**
- Psicología del comer: hambre física vs emocional, saciedad, comer con atención (*mindful eating*).
- Formación de hábitos (ciencia del hábito, señales-rutina-recompensa, tamaño mínimo, ambiente).
- Motivación, autocompasión y adherencia a largo plazo; por qué fallan las dietas restrictivas.
- Imagen corporal y relación sana con la comida; señales de alerta de TCA (con cautela y derivación a profesional).
- Sueño y estrés: su impacto en apetito, antojos, peso y decisiones alimentarias.
- Regulación emocional sin usar la comida; manejo de recaídas.

**EJERCICIO**
- Entrenamiento de fuerza: por qué, dosis mínima eficaz, progresión, para principiantes y mayores.
- Hipertrofia y recomposición: volumen, intensidad, frecuencia, proximidad al fallo.
- Cardio y salud cardiometabólica; HIIT vs continuo; combinar fuerza y cardio.
- NEAT y actividad diaria: pasos, sedentarismo, "snacks" de movimiento.
- Proteína y *timing* en torno al ejercicio; recuperación, sueño y descanso.
- Prevención de lesiones, movilidad y adherencia; ejercicio en mayores y mujeres.

---

## 2 · Formato de salida (para que entre en la app)

La IA debe devolver **dos bloques por cada tema**: *artículos de Teoría* y *entradas de Bibliografía*, en JSON, siguiendo estos esquemas exactos.

### 2.1 Artículo de Teoría

```json
{
  "id": "kebab-case-unico",
  "tema": "fundamentos | macros | energia | metabolismo | crono | practica | ejercicio | mente",
  "nivel": "basico | medio | avanzado",
  "titulo": "Título claro y atractivo",
  "lead": "Una frase gancho que resume la idea central.",
  "cuerpo": "<p>HTML sencillo: solo <p>, <ul>, <li>, <strong>. 3–5 párrafos. Cifras con su matiz. Sin tecnicismos innecesarios.</p>",
  "nota": "Aviso prudente: recuerda que es información general, no consejo médico; individualiza; consulta a un profesional.",
  "verAlso": ["ids-de-otros-articulos-relacionados"],
  "refs": ["ids-de-la-bibliografia-que-lo-respaldan"]
}
```

### 2.2 Entrada de Bibliografía

```json
{
  "id": "kebab-case-unico",
  "tipo": "guia | articulo | libro | web",
  "titulo": "Título original de la fuente",
  "autores": "Apellido AA, Apellido BB, et al.",
  "fuente": "Revista / institución / editorial",
  "year": 2023,
  "cita": "1 frase con el hallazgo principal + identificador (PMID/DOI).",
  "temas": ["nutricion | metabolismo | proteina | grasas | hidratos | crono | ejercicio | saludmental | peso"],
  "url": "https://enlace-permanente-al-paper-o-guia (DOI, PubMed/PMC o web oficial)",
  "independencia": "Financiación y conflictos de interés declarados (p. ej. 'Fondos públicos; sin CoI' o 'Financiado por X; posible sesgo')."
}
```

> `independencia` es un campo **de trabajo** para que yo filtre; no se muestra en la app, pero me permite descartar fuentes con sesgo de industria antes de integrarlas.

### 2.3 Estilo editorial obligatorio (tono de la app)

- **Español**, cercano y **equilibrado**; nada de alarmismo ni lenguaje militante ("veneno", "fraude", "dogma"…).
- Da **cifras con su contexto** y reconoce la **incertidumbre** cuando la evidencia está en debate.
- Cada afirmación fuerte va **enlazada a una referencia** (`refs`).
- Incluye siempre una **`nota` de cautela** y el recordatorio de consultar a un profesional; la app es informativa, no sustituye a un dietista-nutricionista ni a un médico.
- Nada de recomendar marcas, suplementos concretos ni "milagros".

---

## 3 · Prompts de *Deep Research* para Gemini

### 3.0 · PREÁMBULO COMÚN (pégalo SIEMPRE antes de cada investigación)

```
Actúa como un equipo de revisión de evidencia científica (nutrición humana, ciencias
del ejercicio y psicología de la salud) que prepara material divulgativo riguroso para
una app en español. Vas a realizar una investigación profunda (deep research) sobre el
tema que te indico más abajo.

OBJETIVO
Reunir la información MÁS ACTUAL y FIABLE para dar base teórica a la app y ayudar a que
las personas estén mejor informadas, con total independencia de intereses comerciales.

JERARQUÍA Y CALIDAD DE LAS FUENTES (de mayor a menor prioridad)
1. Revisiones sistemáticas y metaanálisis (Cochrane, Campbell, umbrella reviews).
2. Guías de práctica y posicionamientos de organismos públicos e independientes
   (OMS/WHO, EFSA, EFSA, sistemas nacionales de salud, PAHO/OPS, agencias públicas
   de nutrición) y de sociedades científicas con conflictos de interés declarados.
3. Ensayos controlados aleatorizados (ECA) recientes y de calidad.
4. Estudios observacionales grandes y bien diseñados (solo como apoyo, señalando su
   limitación causal).
Evita: blogs sin fuentes, notas de prensa, contenido de influencers, revistas
depredadoras, y white papers o materiales de marketing de la industria.

INDEPENDENCIA (requisito crítico)
- Prioriza estudios y guías con FINANCIACIÓN PÚBLICA o de fundaciones sin ánimo de lucro.
- Para cada fuente relevante, INDICA su financiación y conflictos de interés (CoI).
- SEÑALA explícitamente cuando un estudio, guía o autor tenga vínculos con la industria
  alimentaria, de bebidas, de suplementos o farmacéutica, y trátalo con cautela o
  descártalo si sesga la conclusión (comenta el "sesgo de financiación").
- Cuando exista controversia, presenta las POSTURAS ENFRENTADAS y el peso de la evidencia
  de cada una, sin escoger un bando de forma dogmática.

ACTUALIDAD
Prioriza publicaciones de los últimos 5–7 años (2018–2025). Incluye trabajos clásicos
o fundacionales solo cuando sigan siendo la mejor referencia.

RIGOR
- Distingue correlación de causalidad.
- Indica el nivel de certeza de la evidencia (alta/moderada/baja; usa GRADE si procede).
- Da cifras con su intervalo/contexto y evita el "titular" simplista.
- Cada afirmación relevante debe llevar su referencia con DOI o PMID/PMCID y enlace.

IDIOMA Y TONO
Español. Divulgativo, cercano y EQUILIBRADO. Sin alarmismo ni lenguaje militante.
Reconoce la incertidumbre. No recomiendes marcas ni suplementos concretos. Recuerda que
el material es informativo y no sustituye el consejo de un profesional sanitario.

FORMATO DE SALIDA (obligatorio)
Devuelve DOS bloques en JSON:
(A) "articulos": lista de fichas de Teoría con este esquema exacto:
    { "id","tema","nivel","titulo","lead","cuerpo" (HTML solo con <p><ul><li><strong>),
      "nota","verAlso":[ids],"refs":[ids de bibliografía] }
(B) "bibliografia": lista de fuentes con este esquema exacto:
    { "id","tipo"(guia|articulo|libro|web),"titulo","autores","fuente","year",
      "cita"(hallazgo + PMID/DOI),"temas":[...],"url","independencia"(financiación y CoI) }
Los "id" en kebab-case y únicos; enlaza cada artículo con su bibliografía por "refs".
Añade al final un apartado "sintesis" con los 5–8 mensajes clave y las controversias
abiertas. No inventes referencias: si no encuentras una fuente sólida, dilo.

--- TEMA DE ESTA INVESTIGACIÓN: ---
```

---

### NUTRICIÓN

#### Investigación N1 · Fundamentos y patrones dietéticos
```
Patrones dietéticos con mejor evidencia para salud y longevidad (mediterráneo, DASH,
basado en plantas) frente a dietas de moda. Concepto de "comida real" y clasificación
NOVA de ultraprocesados: qué muestra la evidencia sobre ultraprocesados y salud, y
cuáles son sus LÍMITES y críticas metodológicas. Cómo la matriz del alimento y el grado
de procesado afectan a saciedad, absorción y peso. Papel de la industria alimentaria en
la investigación nutricional y cómo detectar sesgos de financiación.
Público: personas no expertas que quieren comer mejor sin dogmas.
Temas app sugeridos: fundamentos, practica, energia.
```

#### Investigación N2 · Macronutrientes y calidad (proteína · grasas · hidratos)
```
Síntesis actualizada sobre: (a) PROTEÍNA: necesidades por objetivo (mantenimiento,
pérdida de grasa, ganancia muscular, mayores/sarcopenia, deportistas), reparto diario,
umbral de leucina, calidad y proteína vegetal; (b) GRASAS: saturadas vs insaturadas,
omega-3 y omega-6, el DEBATE sobre los aceites de semilla/refinados (posturas y consenso
actual), colesterol dietético; (c) HIDRATOS: fibra, índice y carga glucémica, integrales
vs refinados, azúcares libres y recomendaciones de la OMS. Señala controversias y el
peso real de la evidencia en cada una.
Temas app: macros, metabolismo.
```

#### Investigación N3 · Energía, metabolismo y composición corporal
```
Balance energético y sus matices: gasto total (TDEE = BMR + NEAT + TEF + ejercicio),
por qué el metabolismo en reposo no es proporcional al peso (masa de órganos y músculo),
efecto térmico según el procesado, adaptaciones metabólicas al déficit, "set point" y
recuperación de peso. Peso vs. composición corporal, calidad de la pérdida de peso y
preservación de músculo. Fórmulas de estimación y su fiabilidad.
Temas app: energia, metabolismo, peso.
```

#### Investigación N4 · Crononutrición, ayuno y ritmos circadianos
```
Evidencia sobre el momento de comer: ritmos circadianos y metabolismo, sensibilidad a la
insulina a lo largo del día, melatonina y páncreas, distribución de comidas. Ayuno
intermitente y alimentación con restricción horaria (TRE): qué beneficios tienen respaldo,
para quién, y qué es marketing. Desayuno "sí o no", comer de noche, y a quién NO conviene.
Temas app: crono, energia.
```

#### Investigación N5 · Micronutrientes, hidratación y suplementación con evidencia
```
Déficits frecuentes y micronutrientes clave (vitamina D, B12, hierro, yodo, calcio,
folato, omega-3): a quién afectan, fuentes alimentarias y cuándo tiene sentido suplementar
según evidencia (y cuándo NO). Suplementos populares con y sin respaldo (creatina, proteína
en polvo, multivitamínicos, probióticos, colágeno, etc.), priorizando revisiones
independientes. Hidratación: necesidades reales, el mito de "2 litros", electrolitos y sed.
Evita recomendar marcas.
Temas app: nutricion, metabolismo, practica.
```

#### Investigación N6 · Poblaciones, microbiota y contexto
```
Adaptaciones por población: envejecimiento y sarcopenia (proteína y fuerza), mujer (ciclo
menstrual, embarazo/lactancia a grandes rasgos, menopausia), vegetarianismo y veganismo
bien planteados (nutrientes críticos), y microbiota/salud digestiva (fibra, fermentados,
prebióticos y probióticos: qué está probado). Regulación del apetito (leptina, grelina,
GLP-1) y saciedad. Mantén cautela y remite a profesional en temas clínicos.
Temas app: nutricion, metabolismo, saludmental.
```

---

### MENTE

#### Investigación M1 · Psicología de la alimentación
```
Ciencia de la conducta alimentaria: hambre física vs emocional, señales de saciedad,
comer con atención plena (mindful eating) y su evidencia, alimentación emocional y
antojos. Por qué las dietas muy restrictivas fallan (restricción-atracón, efecto de lo
prohibido). Relación sana con la comida e imagen corporal. Señales de alerta de trastornos
de la conducta alimentaria, SIEMPRE con enfoque prudente y derivación a profesionales
(no diagnóstico). Prioriza psicología clínica y de la salud basada en evidencia.
Temas app: mente, saludmental.
```

#### Investigación M2 · Hábitos, motivación y cambio de conducta
```
Ciencia de la formación de hábitos aplicada a la alimentación y el ejercicio: bucle
señal-rutina-recompensa, hábitos mínimos, diseño del entorno, apilamiento de hábitos,
implementación de intenciones. Motivación intrínseca vs extrínseca, autocompasión frente
a autocrítica, adherencia a largo plazo y manejo de recaídas. Qué técnicas de cambio de
conducta tienen más respaldo (revisiones y taxonomías de BCT).
Temas app: mente.
```

#### Investigación M3 · Sueño, estrés y su impacto en la alimentación
```
Cómo el SUEÑO y el ESTRÉS afectan al apetito, los antojos, las hormonas (grelina/leptina,
cortisol), la elección de alimentos y el peso. Evidencia sobre privación de sueño y
sobreingesta, estrés crónico y comer emocional, y estrategias con respaldo (higiene del
sueño, manejo del estrés, regulación emocional sin usar la comida). Enlaza con la sección
"Mente" de la app (registro de ánimo, hábitos, respiración).
Temas app: mente, saludmental, metabolismo.
```

---

### EJERCICIO

#### Investigación E1 · Entrenamiento de fuerza e hipertrofia
```
Evidencia actual sobre entrenamiento de fuerza: por qué es clave para salud, metabolismo
y longevidad; dosis mínima eficaz; variables (volumen, intensidad, frecuencia, proximidad
al fallo, descanso) para fuerza e hipertrofia. Recomposición corporal. Guías para
PRINCIPIANTES y para PERSONAS MAYORES (contra la sarcopenia). Diferencias y matices por
sexo. Prioriza metaanálisis y posicionamientos de sociedades de ciencias del ejercicio.
Temas app: ejercicio, metabolismo.
```

#### Investigación E2 · Cardio, NEAT y salud cardiometabólica
```
Ejercicio aeróbico y salud cardiometabólica: recomendaciones de actividad (p. ej. OMS),
HIIT vs continuo, cómo combinar fuerza y cardio sin interferencia. NEAT y actividad diaria:
pasos, sedentarismo, "snacks" de movimiento, y su papel en el gasto y la salud. Beneficios
del ejercicio más allá del peso (glucosa, tensión, ánimo, sueño).
Temas app: ejercicio, energia, metabolismo.
```

#### Investigación E3 · Recuperación, nutrición del ejercicio y prevención de lesiones
```
Nutrición en torno al ejercicio: proteína y su reparto/timing para recuperación e
hipertrofia, hidratos y rendimiento, hidratación. Papel del descanso y el sueño en la
recuperación y la adaptación. Prevención de lesiones, movilidad, progresión segura y
adherencia. Cautela con suplementos deportivos (qué tiene evidencia real). Enfoque
aplicable a personas normales, no solo atletas.
Temas app: ejercicio, proteina, practica.
```

---

## 4 · Cómo se integrará en la app

1. Lanzas cada investigación en Gemini (Preámbulo común + bloque del tema).
2. Me pasas el JSON resultante (o el informe).
3. Yo **reviso y filtro** por independencia y calidad, adapto el tono al de la app, evito
   duplicar artículos existentes, verifico que cada `url` resuelve (DOI/PMID) y **enlazo**
   `verAlso` y `refs`.
4. Integro los artículos en `menu-teoria.js` y las fuentes en `menu-biblio.js`, subo la
   versión del *service worker* y verifico (0 enlaces rotos, 0 referencias sin URL).

> Sugerencia de orden por impacto: **E1, M1, M2, N5, E2** (rellenan los huecos mayores:
> Ejercicio y Mente), luego el resto de Nutrición para profundizar.
