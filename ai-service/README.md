\# Mejengas AI Service



Servicio de inteligencia artificial para la aplicación \*\*Mejengas\*\*.



Este módulo recibe videos de partidos de fútbol, valida archivos, analiza información básica del video, detecta jugadores, intenta detectar el balón, analiza actividad cerca de zonas de marco, genera eventos deportivos preliminares, sugiere momentos de revisión, genera clips reales de revisión y devuelve resultados en formato JSON.



El servicio está diseñado como una capa independiente. Puede ser consumido por una app móvil, una app web, un backend o cualquier cliente capaz de enviar archivos por HTTP y leer respuestas JSON.



\## Objetivo del módulo



El objetivo de este servicio es funcionar como una capa independiente de análisis de video para Mejengas.



Por ahora, el sistema no toma decisiones finales sobre el resultado oficial de un partido. Su función es apoyar el análisis, generar evidencia visual, detectar posibles eventos relevantes y ayudar a determinar si un video requiere revisión.



La IA no confirma goles oficialmente en esta etapa. Cuando detecta una posible jugada de gol, la marca como \*\*candidato de gol\*\* y solicita validación con cámaras de marco o revisión posterior.



\## Compatibilidad



Este servicio no es exclusivo de Flutter.



Puede ser consumido por cualquier tecnología que pueda enviar videos y leer respuestas JSON, por ejemplo:



```text

Flutter

React Native

Ionic

Android nativo

iOS nativo

Aplicaciones web

Backends en Node.js

Backends en Python

Backends en Java

Supabase Edge Functions

Cualquier cliente compatible con APIs REST

```



Arquitectura general:



```text

App móvil / App web / Backend

&#x20;       ↓

Mejengas AI Service

&#x20;       ↓

Procesamiento de video e IA

&#x20;       ↓

Respuesta JSON

&#x20;       ↓

La app muestra resultados o decide si requiere revisión

```



\## Funcionalidades actuales



Actualmente el servicio permite:



\- Levantar una API con FastAPI.

\- Verificar estado del servicio con `/health`.

\- Consultar configuración general mediante `/metadata`.

\- Subir videos mediante `/analyze-video`.

\- Analizar partidos con múltiples cámaras mediante `/analyze-match`.

\- Guardar videos en `input\_videos/`.

\- Guardar resultados del análisis en `output\_json/`.

\- Generar videos procesados en `output\_videos/`.

\- Generar clips reales de revisión en `output\_videos/`.

\- Validar si el archivo subido es realmente un video.

\- Leer información básica del video:

&#x20; - FPS.

&#x20; - Duración.

&#x20; - Cantidad de frames.

&#x20; - Resolución.

&#x20; - Si el video puede leerse correctamente.

\- Evaluar calidad básica del video:

&#x20; - Orientación.

&#x20; - Resolución.

&#x20; - Duración.

&#x20; - FPS.

\- Detectar jugadores usando YOLO.

\- Generar video procesado con cajas sobre jugadores.

\- Realizar tracking básico de jugadores.

\- Generar video procesado con etiquetas tipo `P1`, `P2`, `P3`.

\- Detectar experimentalmente el balón.

\- Generar video procesado con marca visible sobre el balón.

\- Mantener visible la marca del balón durante varios frames para facilitar revisión visual.

\- Registrar timestamps de detección del balón.

\- Registrar timestamps cuando el balón aparece cerca de zonas de marco.

\- Registrar timestamps de jugadores cerca de zonas de marco.

\- Cruzar timestamps de jugadores y balón para detectar coincidencias temporales.

\- Activar o desactivar análisis opcionales mediante parámetros.

\- Soportar cámaras separadas por rol:

&#x20; - `side\_left`

&#x20; - `side\_right`

&#x20; - `goal\_left`

&#x20; - `goal\_right`

&#x20; - `corner\_left`

&#x20; - `corner\_right`

&#x20; - `midfield\_left`

&#x20; - `midfield\_right`

&#x20; - `unknown`

\- Validar ángulos de cámara permitidos.

\- Validar modos de partido:

&#x20; - `casual`: no requiere video obligatorio.

&#x20; - `ranked`: requiere 4 cámaras obligatorias.

\- Generar resumen de análisis mediante `analysis\_events`.

\- Generar eventos básicos de ataque mediante `attack\_events`.

\- Generar eventos de jugada peligrosa mediante `danger\_events`.

\- Generar eventos de posible tiro mediante `shot\_events`.

\- Generar candidatos de gol mediante `goal\_candidate\_events`.

\- Generar resumen simplificado para app/backend mediante `match\_event\_summary`.

\- Generar sugerencias de clips de revisión mediante `clip\_suggestions`.

\- Agrupar clips repetidos en momentos únicos mediante `review\_moments`.

\- Generar archivos MP4 reales de revisión mediante `review\_clips`.

\- Generar clips de revisión desde el video procesado con marcador de balón cuando `run\_ball\_detection=true`.

\- Indicar mediante `clip\_source` si el clip fue generado desde el video original o desde el video procesado con marcador de balón.

\- Separar advertencias críticas de advertencias informativas.



\## Tecnologías utilizadas



\- Python

\- FastAPI

\- Uvicorn

\- OpenCV

\- Ultralytics YOLO

\- Pydantic

\- NumPy



\## Estructura del proyecto



```text

ai-service/

&#x20; app/

&#x20;   main.py

&#x20;   config.py

&#x20;   api/

&#x20;     routes.py

&#x20;   services/

&#x20;     video\_processor.py

&#x20;     video\_quality\_service.py

&#x20;     detection\_service.py

&#x20;     tracking\_service.py

&#x20;     ball\_service.py

&#x20;     event\_service.py

&#x20;     field\_zone\_service.py

&#x20;     goal\_area\_activity\_service.py

&#x20;     attack\_event\_service.py

&#x20;     danger\_event\_service.py

&#x20;     shot\_event\_service.py

&#x20;     goal\_candidate\_service.py

&#x20;     match\_event\_summary\_service.py

&#x20;     clip\_suggestion\_service.py

&#x20;     review\_moment\_service.py

&#x20;     clip\_generation\_service.py

&#x20;     match\_analysis\_service.py

&#x20;     camera\_angle\_service.py

&#x20;     file\_validation\_service.py

&#x20;     match\_mode\_service.py

&#x20;   models/

&#x20;     analysis\_result.py

&#x20;   utils/

&#x20;     file\_utils.py

&#x20;     video\_utils.py

&#x20;     model\_loader.py

&#x20; input\_videos/

&#x20; output\_videos/

&#x20; output\_json/

&#x20; tests/

&#x20; requirements.txt

&#x20; README.md

&#x20; AGENTS.md

&#x20; .env.example

```



\## Instalación



Crear entorno virtual:



```powershell

python -m venv .venv

```



Activar entorno virtual en Windows:



```powershell

.venv\\Scripts\\activate

```



Si PowerShell bloquea la activación, ejecutar:



```powershell

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

```



Luego activar nuevamente:



```powershell

.venv\\Scripts\\activate

```



Instalar dependencias:



```powershell

pip install -r requirements.txt

```



\## Ejecutar el servicio



Desde la carpeta `ai-service`, ejecutar:



```powershell

uvicorn app.main:app --reload

```



Luego abrir en el navegador:



```text

http://127.0.0.1:8000/docs

```



\## Endpoints disponibles



Actualmente el servicio cuenta con estos endpoints principales:



```text

GET  /health

GET  /metadata

POST /analyze-video

POST /analyze-match

```



\## GET `/health`



Verifica que la API esté funcionando.



Respuesta esperada:



```json

{

&#x20; "status": "ok"

}

```



\## GET `/metadata`



Devuelve información de configuración del servicio.



Este endpoint está pensado para que una app móvil, app web o backend pueda consultar las opciones disponibles sin tenerlas escritas manualmente.



Incluye:



```text

Ángulos de cámara permitidos

Descripción de cada ángulo

Modos de partido

Reglas de ranked y casual

Opciones de análisis disponibles

Configuración recomendada para ranked

```



Ejemplo de uso:



```text

http://127.0.0.1:8000/metadata

```



Ejemplo parcial de respuesta:



```json

{

&#x20; "service": "Mejengas AI Service",

&#x20; "version": "0.1.0",

&#x20; "camera\_angles": {

&#x20;   "allowed\_angles": \[

&#x20;     "corner\_left",

&#x20;     "corner\_right",

&#x20;     "goal\_left",

&#x20;     "goal\_right",

&#x20;     "midfield\_left",

&#x20;     "midfield\_right",

&#x20;     "side\_left",

&#x20;     "side\_right",

&#x20;     "unknown"

&#x20;   ]

&#x20; },

&#x20; "match\_modes": {

&#x20;   "valid\_match\_modes": \[

&#x20;     "casual",

&#x20;     "ranked"

&#x20;   ]

&#x20; }

}

```



\## POST `/analyze-video`



Analiza un solo video.



Este endpoint sirve para pruebas individuales, análisis de un video específico o revisión básica de un archivo grabado con celular.



Parámetros:



```text

file

run\_detection

run\_tracking

run\_ball\_detection

```



Valores por defecto:



```text

run\_detection = true

run\_tracking = false

run\_ball\_detection = false

```



Ejemplo de respuesta parcial:



```json

{

&#x20; "filename": "partido.mp4",

&#x20; "file\_validation": {

&#x20;   "is\_valid\_video": true,

&#x20;   "extension": ".mp4",

&#x20;   "valid\_extension": true,

&#x20;   "valid\_content\_type": true

&#x20; },

&#x20; "video\_info": {

&#x20;   "readable": true,

&#x20;   "fps": 29.3,

&#x20;   "total\_frames": 796,

&#x20;   "duration\_seconds": 27.16,

&#x20;   "width": 848,

&#x20;   "height": 478

&#x20; },

&#x20; "video\_quality": {

&#x20;   "quality\_available": true,

&#x20;   "quality\_status": "usable",

&#x20;   "orientation": "landscape",

&#x20;   "resolution\_quality": "basic",

&#x20;   "duration\_quality": "acceptable\_sample",

&#x20;   "fps\_quality": "acceptable"

&#x20; },

&#x20; "needs\_review": false

}

```



\## POST `/analyze-match`



Analiza un partido usando una o varias cámaras.



Actualmente soporta hasta cuatro cámaras:



```text

cam\_1

cam\_2

cam\_3

cam\_4

```



Cada cámara puede tener un ángulo asociado:



```text

side\_left

side\_right

goal\_left

goal\_right

corner\_left

corner\_right

midfield\_left

midfield\_right

unknown

```



Parámetros principales:



```text

match\_mode

cam\_1

cam\_2

cam\_3

cam\_4

cam\_1\_angle

cam\_2\_angle

cam\_3\_angle

cam\_4\_angle

run\_detection

run\_tracking

run\_ball\_detection

```



Ejemplo para ranked:



```text

match\_mode = ranked

cam\_1\_angle = side\_left

cam\_2\_angle = side\_right

cam\_3\_angle = goal\_left

cam\_4\_angle = goal\_right

```



Ejemplo para casual:



```text

match\_mode = casual

run\_detection = false

```



Respuesta principal esperada para un ranked válido:



```json

{

&#x20; "match\_analysis": true,

&#x20; "match\_summary": {

&#x20;   "camera\_count": 4,

&#x20;   "usable\_cameras": 4,

&#x20;   "side\_cameras": 2,

&#x20;   "goal\_cameras": 2,

&#x20;   "match\_status": "ok"

&#x20; },

&#x20; "match\_mode\_validation": {

&#x20;   "match\_mode": "ranked",

&#x20;   "is\_valid\_for\_mode": true,

&#x20;   "minimum\_cameras": 4

&#x20; },

&#x20; "needs\_review": false

}

```



\## Modos de partido



El servicio distingue entre dos modos principales de partido:



```text

casual

ranked

```



\## Casual



El modo casual no requiere video obligatorio.



Este modo puede usarse para partidos amistosos, pruebas internas o análisis opcional. Si el usuario no sube video, la app puede funcionar sin llamar al servicio de IA.



Si se sube un video casual, el servicio puede analizarlo como apoyo, pero la falta de detección, tracking o cámaras completas no debe invalidar el partido.



Reglas actuales:



```text

match\_mode = casual

requires\_video = false

minimum\_cameras = 0

```



Ejemplo de validación casual:



```json

{

&#x20; "match\_mode": "casual",

&#x20; "is\_valid\_for\_mode": true,

&#x20; "requires\_video": false,

&#x20; "minimum\_cameras": 0,

&#x20; "warnings": \[]

}

```



\## Ranked



El modo ranked sí requiere grabación obligatoria.



Para que un partido ranked sea considerado válido, se requiere un mínimo de cuatro cámaras:



```text

side\_left

side\_right

goal\_left

goal\_right

```



Esto permite cubrir el partido desde dos ángulos laterales y apoyar la validación de goles con cámaras detrás de los marcos.



Reglas actuales:



```text

match\_mode = ranked

requires\_video = true

minimum\_cameras = 4

required\_angles = side\_left, side\_right, goal\_left, goal\_right

```



Si un partido ranked se analiza con menos de cuatro cámaras, el servicio marca:



```json

{

&#x20; "needs\_review": true

}

```



Ejemplo de validación ranked incompleta:



```json

{

&#x20; "match\_mode": "ranked",

&#x20; "is\_valid\_for\_mode": false,

&#x20; "requires\_video": true,

&#x20; "camera\_count": 1,

&#x20; "minimum\_cameras": 4,

&#x20; "missing\_required\_angles": \[

&#x20;   "side\_right",

&#x20;   "goal\_left",

&#x20;   "goal\_right"

&#x20; ],

&#x20; "warnings": \[

&#x20;   "ranked requires at least 4 camera(s). Only 1 camera(s) were provided.",

&#x20;   "ranked is missing required camera angles: side\_right, goal\_left, goal\_right."

&#x20; ]

}

```



\## Configuración recomendada de cámaras para ranked



Para partidos ranked, Mejengas recomienda la siguiente configuración:



```text

cam\_1 = side\_left

cam\_2 = side\_right

cam\_3 = goal\_left

cam\_4 = goal\_right

```



Esta configuración permite:



\- Analizar el movimiento general del partido.

\- Cubrir mejor puntos muertos.

\- Tener apoyo visual para validar goles.

\- Usar cámaras detrás de los marcos para revisión.

\- Usar cámaras laterales para análisis de jugadores y jugadas.



\## Flujo actual de eventos



El flujo actual de análisis de eventos funciona de forma progresiva:



```text

Detección de jugadores

&#x20;       ↓

Actividad de jugadores cerca de zonas de marco

&#x20;       ↓

Detección del balón

&#x20;       ↓

Actividad del balón cerca de zonas de marco

&#x20;       ↓

Correlación temporal entre jugadores y balón

&#x20;       ↓

Eventos de ataque

&#x20;       ↓

Eventos de peligro

&#x20;       ↓

Posible tiro

&#x20;       ↓

Candidato de gol

&#x20;       ↓

Timeline de eventos

&#x20;       ↓

Sugerencias de clips

&#x20;       ↓

Momentos agrupados de revisión

&#x20;       ↓

Clips reales de revisión

&#x20;       ↓

Metadata de fuente del clip

&#x20;       ↓

Resumen simplificado para app/backend

```



\## `detection\_summary`



Resume la detección de jugadores.



Incluye:



```text

frames\_analyzed

average\_players\_detected

max\_players\_detected

detection\_confidence\_average

analysis\_quality

goal\_area\_activity

```



Dentro de `goal\_area\_activity`, el sistema registra actividad cerca de las zonas aproximadas de marco:



```json

{

&#x20; "activity\_detected": true,

&#x20; "total\_goal\_area\_detections": 58,

&#x20; "left\_goal\_area\_detections": 33,

&#x20; "right\_goal\_area\_detections": 25

}

```



También registra timestamps de jugadores cerca de cada zona:



```json

{

&#x20; "timestamp\_seconds": 25.59,

&#x20; "center\_x": 686,

&#x20; "center\_y": 187,

&#x20; "confidence": 0.83

}

```



\## `ball\_summary`



Resume la detección experimental del balón.



Incluye:



```text

frames\_analyzed

frames\_with\_ball

ball\_detection\_rate

ball\_confidence\_average

ball\_detected

ball\_detection\_timestamps

ball\_goal\_area\_activity

processed\_ball\_video\_path

```



Ejemplo de timestamp de balón:



```json

{

&#x20; "frame\_index": 765,

&#x20; "timestamp\_seconds": 26.11,

&#x20; "center\_x": 714,

&#x20; "center\_y": 279,

&#x20; "confidence": 0.92

}

```



Ejemplo de balón cerca del área derecha:



```json

{

&#x20; "right\_goal\_area\_timestamps": \[

&#x20;   {

&#x20;     "frame\_index": 765,

&#x20;     "timestamp\_seconds": 26.11,

&#x20;     "center\_x": 714,

&#x20;     "center\_y": 279,

&#x20;     "confidence": 0.92

&#x20;   }

&#x20; ]

}

```



Cuando `run\_ball\_detection=true`, el sistema también genera un video procesado con marcador visual del balón. Este archivo se indica en:



```json

{

&#x20; "processed\_ball\_video\_path": "output\_videos/video\_ball.mp4"

}

```



Ese video puede usarse como fuente para clips de revisión, de modo que el clip final muestre la marca visual del balón.



\## `attack\_events`



Resume actividad de jugadores cerca de zonas de marco.



Ejemplo:



```json

{

&#x20; "attack\_events\_available": true,

&#x20; "possible\_attack\_detected": true,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "right\_goal\_area\_pressure",

&#x20;     "side": "right",

&#x20;     "confidence": "basic"

&#x20;   }

&#x20; ]

}

```



\## `danger\_events`



Combina jugadores cerca del marco con balón cerca del marco.



Además, puede correlacionar timestamps para verificar si jugadores y balón estuvieron cerca del marco en una ventana de tiempo cercana.



Ventana actual:



```text

1.5 segundos

```



Ejemplo:



```json

{

&#x20; "danger\_events\_available": true,

&#x20; "possible\_danger\_play": true,

&#x20; "possible\_shot\_context": true,

&#x20; "time\_correlation\_available": true,

&#x20; "time\_correlation\_window\_seconds": 1.5,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "possible\_right\_goal\_danger\_play",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "time\_correlated": true

&#x20;   }

&#x20; ]

}

```



Ejemplo de correlación temporal:



```json

{

&#x20; "player\_timestamp\_seconds": 25.59,

&#x20; "ball\_timestamp\_seconds": 26.11,

&#x20; "time\_difference\_seconds": 0.52,

&#x20; "player\_confidence": 0.83,

&#x20; "ball\_confidence": 0.92

}

```



\## `shot\_events`



Usa `danger\_events` y detección de balón para marcar un posible contexto de tiro.



Si el evento de peligro tiene correlación temporal, el posible tiro hereda esa confianza.



Ejemplo:



```json

{

&#x20; "shot\_events\_available": true,

&#x20; "possible\_shot\_detected": true,

&#x20; "time\_correlation\_available": true,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "possible\_shot\_event",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "time\_correlated": true,

&#x20;     "source\_event": "possible\_right\_goal\_danger\_play"

&#x20;   }

&#x20; ]

}

```



\## `goal\_candidate\_events`



Marca una posible jugada candidata a gol.



Este bloque no confirma goles. Solo indica que existe una posible jugada que requiere validación adicional.



Si el posible tiro tiene correlación temporal, el candidato de gol hereda esa confianza.



Ejemplo:



```json

{

&#x20; "goal\_candidate\_events\_available": true,

&#x20; "possible\_goal\_candidate\_detected": true,

&#x20; "requires\_goal\_camera\_validation": true,

&#x20; "is\_confirmed\_goal": false,

&#x20; "time\_correlation\_available": true,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "possible\_goal\_candidate",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "time\_correlated": true,

&#x20;     "description": "Possible goal candidate detected near the right goal area. This is not a confirmed goal."

&#x20;   }

&#x20; ]

}

```



\## `analysis\_events`



Resume los mensajes principales del análisis en una lista de texto.



Ejemplo:



```json

{

&#x20; "events": \[

&#x20;   "Video is readable.",

&#x20;   "Player detection quality is useful.",

&#x20;   "Possible danger play detected near goal areas.",

&#x20;   "Possible shot event detected near the right goal area.",

&#x20;   "Possible goal candidate detected.",

&#x20;   "Goal camera validation is required.",

&#x20;   "Goal is not confirmed by the AI service."

&#x20; ],

&#x20; "overall\_status": "ok"

}

```



\## `match\_event\_summary`



Resume los eventos importantes en un bloque más fácil de consumir por una app, web o backend.



Ejemplo:



```json

{

&#x20; "summary\_available": true,

&#x20; "summary\_status": "goal\_candidate\_review",

&#x20; "has\_attack\_activity": true,

&#x20; "has\_danger\_play": true,

&#x20; "has\_possible\_shot": true,

&#x20; "has\_goal\_candidate": true,

&#x20; "requires\_goal\_camera\_validation": true,

&#x20; "confirmed\_goals": 0,

&#x20; "important\_event\_count": 5

}

```



Valores posibles de `summary\_status`:



```text

normal

attack\_activity

danger\_play

possible\_shot

goal\_candidate\_review

```



\## `timeline\_events`



Dentro de `match\_event\_summary`, el sistema genera una línea de tiempo con eventos importantes que tienen timestamp principal.



Ejemplo:



```json

{

&#x20; "timeline\_event\_count": 3,

&#x20; "timeline\_events": \[

&#x20;   {

&#x20;     "category": "danger",

&#x20;     "type": "possible\_right\_goal\_danger\_play",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "primary\_timestamp\_seconds": 26.11

&#x20;   },

&#x20;   {

&#x20;     "category": "shot",

&#x20;     "type": "possible\_shot\_event",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "primary\_timestamp\_seconds": 26.11

&#x20;   },

&#x20;   {

&#x20;     "category": "goal\_candidate",

&#x20;     "type": "possible\_goal\_candidate",

&#x20;     "side": "right",

&#x20;     "confidence": "time\_correlated",

&#x20;     "primary\_timestamp\_seconds": 26.11,

&#x20;     "is\_confirmed\_goal": false

&#x20;   }

&#x20; ]

}

```



Este bloque permite que una app muestre una línea de tiempo de eventos importantes.



\## `clip\_suggestions`



Genera rangos sugeridos de video alrededor de eventos importantes.



Actualmente usa:



```text

3 segundos antes del evento

3 segundos después del evento

```



Ejemplo:



```json

{

&#x20; "clip\_suggestions\_available": true,

&#x20; "seconds\_before\_event": 3,

&#x20; "seconds\_after\_event": 3,

&#x20; "suggestion\_count": 3,

&#x20; "suggestions": \[

&#x20;   {

&#x20;     "clip\_id": "clip\_1",

&#x20;     "category": "danger",

&#x20;     "primary\_timestamp\_seconds": 26.11,

&#x20;     "start\_time\_seconds": 23.11,

&#x20;     "end\_time\_seconds": 27.16,

&#x20;     "duration\_seconds": 4.05

&#x20;   }

&#x20; ]

}

```



El sistema ajusta automáticamente el final del clip si el evento ocurre cerca del final del video.



\## `review\_moments`



Agrupa sugerencias de clips que ocurren en momentos muy cercanos.



Esto evita que la app muestre varios clips repetidos cuando `danger`, `shot` y `goal\_candidate` ocurren en el mismo timestamp.



Ventana actual de agrupación:



```text

1 segundo

```



Ejemplo:



```json

{

&#x20; "review\_moments\_available": true,

&#x20; "group\_window\_seconds": 1,

&#x20; "moment\_count": 1,

&#x20; "moments": \[

&#x20;   {

&#x20;     "review\_moment\_id": "review\_moment\_1",

&#x20;     "primary\_timestamp\_seconds": 26.11,

&#x20;     "start\_time\_seconds": 23.11,

&#x20;     "end\_time\_seconds": 27.16,

&#x20;     "duration\_seconds": 4.05,

&#x20;     "main\_category": "goal\_candidate",

&#x20;     "categories": \[

&#x20;       "danger",

&#x20;       "shot",

&#x20;       "goal\_candidate"

&#x20;     ],

&#x20;     "event\_count": 3,

&#x20;     "requires\_goal\_camera\_validation": true,

&#x20;     "is\_confirmed\_goal": false

&#x20;   }

&#x20; ]

}

```



Este bloque es útil para mostrar “momentos importantes” al usuario final o a una pantalla administrativa de revisión.



\## `review\_clips`



Genera clips reales en formato `.mp4` a partir de los `review\_moments`.



El sistema toma el rango sugerido del momento de revisión:



```text

start\_time\_seconds

end\_time\_seconds

```



y crea un archivo de video corto dentro de:



```text

output\_videos/

```



Ejemplo:



```json

{

&#x20; "review\_clips\_available": true,

&#x20; "clip\_count": 1,

&#x20; "clips": \[

&#x20;   {

&#x20;     "review\_moment\_id": "review\_moment\_1",

&#x20;     "main\_category": "goal\_candidate",

&#x20;     "side": "right",

&#x20;     "primary\_timestamp\_seconds": 26.11,

&#x20;     "start\_time\_seconds": 23.11,

&#x20;     "end\_time\_seconds": 27.16,

&#x20;     "duration\_seconds": 4.05,

&#x20;     "requires\_goal\_camera\_validation": true,

&#x20;     "is\_confirmed\_goal": false,

&#x20;     "clip\_generation": {

&#x20;       "clip\_generated": true,

&#x20;       "generated\_clip\_path": "output\_videos/video\_ball\_review\_moment\_1\_goal\_candidate\_right.mp4",

&#x20;       "start\_frame": 677,

&#x20;       "end\_frame": 795,

&#x20;       "frames\_written": 119

&#x20;     }

&#x20;   }

&#x20; ]

}

```



Este bloque permite que una app o backend use directamente el clip generado para revisión visual.



\## `clip\_source`



Dentro de `review\_clips`, el sistema incluye metadata para indicar desde cuál video se generaron los clips.



Esto evita que la app o backend tenga que adivinar la fuente revisando el nombre del archivo.



Ejemplo cuando `run\_ball\_detection=true` y existe video procesado con marcador de balón:



```json

{

&#x20; "review\_clips": {

&#x20;   "review\_clips\_available": true,

&#x20;   "clip\_source": {

&#x20;     "source\_type": "processed\_ball\_video",

&#x20;     "source\_path": "output\_videos/video\_ball.mp4",

&#x20;     "uses\_ball\_marker": true

&#x20;   },

&#x20;   "clip\_count": 1

&#x20; }

}

```



Ejemplo cuando `run\_ball\_detection=false` o no existe video procesado con balón:



```json

{

&#x20; "review\_clips": {

&#x20;   "review\_clips\_available": true,

&#x20;   "clip\_source": {

&#x20;     "source\_type": "original\_video",

&#x20;     "source\_path": "input\_videos/video\_original.mp4",

&#x20;     "uses\_ball\_marker": false

&#x20;   },

&#x20;   "clip\_count": 0

&#x20; }

}

```



Valores actuales de `source\_type`:



```text

original\_video

processed\_ball\_video

```



Campos principales:



```text

source\_type

source\_path

uses\_ball\_marker

```



\## Fuente usada para generar `review\_clips`



El servicio puede generar clips desde diferentes versiones del video.



Actualmente la prioridad es:



```text

1\. Video procesado con marcador del balón, si existe.

2\. Video original subido, si no existe video procesado con balón.

```



Eso significa que si se ejecuta:



```text

run\_ball\_detection = true

```



y el sistema genera:



```text

processed\_ball\_video\_path

```



entonces `review\_clips` se genera desde ese video procesado. Por eso el clip final puede incluir el tracker rojo del balón.



Ejemplo de ruta esperada:



```text

output\_videos/video\_ball\_review\_moment\_1\_goal\_candidate\_right.mp4

```



Esto mejora la revisión visual porque el administrador, capitán o sistema de revisión puede ver no solo el tramo del partido, sino también la marca visual que explica por qué la IA detectó una posible jugada importante.



Si `run\_ball\_detection=false`, el clip se genera desde el video original.



Más adelante se puede decidir si los clips deben generarse desde:



```text

video original

video con detección de jugadores

video con tracking

video con marca del balón

video combinado con overlays avanzados

```



\## Archivos generados



El sistema puede generar archivos en estas carpetas:



```text

input\_videos/

output\_videos/

output\_json/

```



Tipos de archivos generados:



```text

Videos originales subidos

Videos con detección de jugadores

Videos con tracking

Videos con marca del balón

Clips reales de revisión

Resultados JSON del análisis

```



Estas carpetas no deben subir videos ni resultados generados a GitHub. Solo deben conservar el archivo `.gitkeep`.



\## Estado actual



El módulo actualmente funciona como una primera demo técnica.



Ya permite:



\- Subir video.

\- Validar si el archivo es un video.

\- Leer metadatos del video.

\- Evaluar calidad básica del video.

\- Detectar jugadores.

\- Generar video con detecciones.

\- Hacer tracking básico.

\- Detectar experimentalmente el balón.

\- Mostrar la marca del balón de forma visible.

\- Exportar resultados en JSON.

\- Analizar múltiples cámaras.

\- Diferenciar entre modo casual y modo ranked.

\- Validar que ranked tenga 4 cámaras.

\- Exponer metadata para integración futura con apps o backends.

\- Detectar actividad de jugadores cerca del marco.

\- Detectar actividad del balón cerca del marco.

\- Registrar timestamps de jugadores y balón.

\- Correlacionar jugadores y balón por tiempo.

\- Generar eventos básicos de ataque.

\- Generar eventos de peligro.

\- Generar posibles eventos de tiro.

\- Generar candidatos de gol sin confirmar gol.

\- Resumir eventos importantes en `match\_event\_summary`.

\- Generar línea de tiempo con `timeline\_events`.

\- Generar sugerencias de clips con `clip\_suggestions`.

\- Agrupar clips repetidos en `review\_moments`.

\- Generar clips reales de revisión en `review\_clips`.

\- Indicar la fuente del clip mediante `clip\_source`.

\- Generar clips de revisión desde el video con marcador de balón cuando está disponible.



\## Limitaciones actuales



\- El tracking todavía puede generar muchos IDs para el mismo jugador.

\- La detección del balón es experimental.

\- El sistema todavía no identifica jugadores por nombre.

\- El sistema todavía no identifica jugadores por número de camiseta.

\- El sistema todavía no detecta goles oficialmente.

\- El sistema todavía no confirma marcador.

\- El sistema todavía no calcula pases, recuperaciones, atajadas, tiros oficiales o mapas de calor.

\- La IA no debe usarse todavía como juez absoluto del partido.

\- Las zonas de cancha son aproximadas y no detectan todavía los marcos reales.

\- El análisis multicámara todavía no sincroniza eventos por tiempo entre cámaras.

\- Los candidatos de gol todavía requieren validación con cámaras de marco, capitanes o revisión administrativa.

\- Los clips generados todavía no incluyen overlays avanzados, marcador oficial, etiquetas de jugadores ni explicación visual automática.

\- Los clips con marcador de balón dependen de que `run\_ball\_detection=true` y de que exista `processed\_ball\_video\_path`.

\- `clip\_source` solo indica la fuente usada; todavía no combina varias fuentes visuales en un mismo clip.



\## Próximos pasos



Posibles mejoras futuras:



\- Mejorar tracking para reducir IDs duplicados.

\- Agregar sincronización entre cámaras.

\- Detectar zonas reales de cancha y porterías.

\- Detectar eventos básicos por tiempo.

\- Detectar posibles tiros con mayor precisión.

\- Detectar momentos donde el balón aparece cerca de la línea de gol.

\- Generar clips con overlays visuales avanzados.

\- Generar clips desde videos procesados con jugadores y balón al mismo tiempo.

\- Mejorar detección del balón con modelos personalizados.

\- Conectar el servicio con Supabase u otro backend.

\- Enviar resultados al backend principal de Mejengas.

\- Integrar el flujo con una app móvil o web.

\- Calcular estadísticas avanzadas por jugador.

