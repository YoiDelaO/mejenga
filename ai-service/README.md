\# Mejengas AI Service



Servicio de inteligencia artificial para la aplicación \*\*Mejengas\*\*.



Este módulo se encarga de recibir videos de partidos de fútbol, leer información básica del archivo, validar la calidad del video, detectar jugadores, realizar tracking básico, intentar detectar el balón, analizar actividad cerca de zonas de marco y devolver resultados en formato JSON.



El servicio está diseñado como una capa independiente, por lo que puede ser consumido por una app móvil, una app web, un backend o cualquier cliente que pueda realizar peticiones HTTP.



\## Objetivo del módulo



El objetivo inicial de este servicio es funcionar como una capa independiente de análisis de video para Mejengas.



Por ahora, el sistema no toma decisiones finales sobre el resultado de un partido. Su función es apoyar el análisis, generar evidencia visual, detectar posibles eventos relevantes y ayudar a determinar si un video puede ser útil para revisión.



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

\- Generar resumen simplificado para la app mediante `match\_event\_summary`.

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

Actividad cerca de zona de marco

&#x20;       ↓

Eventos de ataque

&#x20;       ↓

Eventos de peligro

&#x20;       ↓

Posible tiro

&#x20;       ↓

Candidato de gol

&#x20;       ↓

Resumen simplificado para la app/backend

```



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



Ejemplo:



```json

{

&#x20; "danger\_events\_available": true,

&#x20; "possible\_danger\_play": true,

&#x20; "possible\_shot\_context": true,

&#x20; "players\_near\_goal\_area": true,

&#x20; "ball\_near\_goal\_area": true

}

```



\## `shot\_events`



Usa `danger\_events` y detección de balón para marcar un posible contexto de tiro.



Ejemplo:



```json

{

&#x20; "shot\_events\_available": true,

&#x20; "possible\_shot\_detected": true,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "possible\_shot\_event",

&#x20;     "side": "right",

&#x20;     "confidence": "basic"

&#x20;   }

&#x20; ]

}

```



\## `goal\_candidate\_events`



Marca una posible jugada candidata a gol.



Este bloque no confirma goles. Solo indica que existe una posible jugada que requiere validación adicional.



Ejemplo:



```json

{

&#x20; "goal\_candidate\_events\_available": true,

&#x20; "possible\_goal\_candidate\_detected": true,

&#x20; "requires\_goal\_camera\_validation": true,

&#x20; "is\_confirmed\_goal": false,

&#x20; "events": \[

&#x20;   {

&#x20;     "type": "possible\_goal\_candidate",

&#x20;     "side": "right",

&#x20;     "confidence": "basic",

&#x20;     "description": "Possible goal candidate detected near the right goal area. This is not a confirmed goal."

&#x20;   }

&#x20; ]

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



\## Archivos generados



El sistema puede generar archivos en estas carpetas:



```text

input\_videos/

output\_videos/

output\_json/

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

\- Mostrar la marca del balón de forma más visible.

\- Exportar resultados en JSON.

\- Analizar múltiples cámaras.

\- Diferenciar entre modo casual y modo ranked.

\- Validar que ranked tenga 4 cámaras.

\- Exponer metadata para integración futura con apps o backends.

\- Detectar actividad cerca del marco.

\- Generar eventos básicos de ataque.

\- Generar eventos de peligro.

\- Generar posibles eventos de tiro.

\- Generar candidatos de gol sin confirmar gol.

\- Resumir eventos importantes en `match\_event\_summary`.



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



\## Próximos pasos



Posibles mejoras futuras:



\- Mejorar tracking para reducir IDs duplicados.

\- Agregar sincronización entre cámaras.

\- Detectar zonas reales de cancha y porterías.

\- Detectar eventos básicos por tiempo.

\- Detectar posibles tiros con mayor precisión.

\- Detectar momentos donde el balón aparece cerca de la línea de gol.

\- Crear clips automáticos de eventos importantes.

\- Mejorar detección del balón con modelos personalizados.

\- Conectar el servicio con Supabase u otro backend.

\- Enviar resultados al backend principal de Mejengas.

\- Integrar el flujo con una app móvil o web.

\- Calcular estadísticas avanzadas por jugador.

