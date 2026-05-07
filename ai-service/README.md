# Mejengas AI Service

Servicio de inteligencia artificial para la aplicación **Mejengas**.

Este módulo recibe videos de partidos de fútbol, valida archivos, analiza información básica del video, detecta jugadores, intenta detectar el balón, analiza actividad cerca de zonas de marco, genera eventos deportivos preliminares, sugiere momentos de revisión, genera clips reales de revisión con overlays visuales, crea versiones web compatibles de los clips, genera un resumen compacto de revisión y devuelve resultados en formato JSON.

El servicio está diseñado como una capa independiente. Puede ser consumido por una app móvil, una app web, un backend o cualquier cliente capaz de enviar archivos por HTTP y leer respuestas JSON.

## Objetivo del módulo

El objetivo de este servicio es funcionar como una capa independiente de análisis de video para Mejengas.

Por ahora, el sistema no toma decisiones finales sobre el resultado oficial de un partido. Su función es apoyar el análisis, generar evidencia visual, detectar posibles eventos relevantes y ayudar a determinar si un video requiere revisión.

La IA no confirma goles oficialmente en esta etapa. Cuando detecta una posible jugada de gol, la marca como **candidato de gol** y solicita validación con cámaras de marco o revisión posterior.

## Compatibilidad

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
        ↓
Mejengas AI Service
        ↓
Procesamiento de video e IA
        ↓
Respuesta JSON
        ↓
La app muestra resultados, clips o decide si requiere revisión
```

## Funcionalidades actuales

Actualmente el servicio permite:

- Levantar una API con FastAPI.
- Verificar estado del servicio con `/health`.
- Consultar configuración general mediante `/metadata`.
- Subir videos mediante `/analyze-video`.
- Analizar partidos con múltiples cámaras mediante `/analyze-match`.
- Servir videos generados mediante `/output-videos`.
- Guardar videos en `input_videos/`.
- Guardar resultados del análisis en `output_json/`.
- Generar videos procesados en `output_videos/`.
- Generar clips reales de revisión en `output_videos/`.
- Generar clips de revisión con overlay visual.
- Generar una versión web compatible del clip usando H.264.
- Devolver una URL reproducible del clip mediante `web_clip_url`.
- Validar si el archivo subido es realmente un video.
- Leer información básica del video:
  - FPS.
  - Duración.
  - Cantidad de frames.
  - Resolución.
  - Si el video puede leerse correctamente.
- Evaluar calidad básica del video:
  - Orientación.
  - Resolución.
  - Duración.
  - FPS.
- Detectar jugadores usando YOLO.
- Generar video procesado con cajas sobre jugadores.
- Realizar tracking básico de jugadores.
- Generar video procesado con etiquetas tipo `P1`, `P2`, `P3`.
- Detectar experimentalmente el balón.
- Generar video procesado con marca visible sobre el balón.
- Mantener visible la marca del balón durante varios frames para facilitar revisión visual.
- Registrar timestamps de detección del balón.
- Registrar timestamps cuando el balón aparece cerca de zonas de marco.
- Registrar timestamps de jugadores cerca de zonas de marco.
- Cruzar timestamps de jugadores y balón para detectar coincidencias temporales.
- Activar o desactivar análisis opcionales mediante parámetros.
- Soportar cámaras separadas por rol:
  - `side_left`
  - `side_right`
  - `goal_left`
  - `goal_right`
  - `corner_left`
  - `corner_right`
  - `midfield_left`
  - `midfield_right`
  - `unknown`
- Validar ángulos de cámara permitidos.
- Validar modos de partido:
  - `casual`: no requiere video obligatorio.
  - `ranked`: requiere 4 cámaras obligatorias.
- Generar resumen de análisis mediante `analysis_events`.
- Generar eventos básicos de ataque mediante `attack_events`.
- Generar eventos de jugada peligrosa mediante `danger_events`.
- Generar eventos de posible tiro mediante `shot_events`.
- Generar candidatos de gol mediante `goal_candidate_events`.
- Generar resumen simplificado para app/backend mediante `match_event_summary`.
- Generar sugerencias de clips de revisión mediante `clip_suggestions`.
- Agrupar clips repetidos en momentos únicos mediante `review_moments`.
- Generar archivos MP4 reales de revisión mediante `review_clips`.
- Generar clips de revisión desde el video procesado con marcador de balón cuando `run_ball_detection=true`.
- Indicar mediante `clip_source` si el clip fue generado desde el video original o desde el video procesado con marcador de balón.
- Indicar mediante `overlay_applied` si el clip recibió overlay visual.
- Indicar mediante `overlay_type` qué tipo de overlay se aplicó.
- Indicar mediante `overlay_metadata` el estilo visual del overlay.
- Indicar mediante `web_clip` si se generó una versión compatible para navegador/app.
- Generar un resumen compacto para app/backend mediante `review_summary`.
- Separar advertencias críticas de advertencias informativas.

## Tecnologías utilizadas

- Python
- FastAPI
- Uvicorn
- OpenCV
- Ultralytics YOLO
- Pydantic
- NumPy
- imageio-ffmpeg
- FFmpeg

## Estructura del proyecto

```text
ai-service/
  app/
    main.py
    config.py
    api/
      routes.py
    services/
      video_processor.py
      video_quality_service.py
      detection_service.py
      tracking_service.py
      ball_service.py
      event_service.py
      field_zone_service.py
      goal_area_activity_service.py
      attack_event_service.py
      danger_event_service.py
      shot_event_service.py
      goal_candidate_service.py
      match_event_summary_service.py
      clip_suggestion_service.py
      review_moment_service.py
      clip_generation_service.py
      review_summary_service.py
      match_analysis_service.py
      camera_angle_service.py
      file_validation_service.py
      match_mode_service.py
    models/
      analysis_result.py
    utils/
      file_utils.py
      video_utils.py
      model_loader.py
  input_videos/
  output_videos/
  output_json/
  tests/
  requirements.txt
  README.md
  AGENTS.md
  .env.example
```

## Instalación

Crear entorno virtual:

```powershell
python -m venv .venv
```

Activar entorno virtual en Windows:

```powershell
.venv\Scripts\activate
```

Si PowerShell bloquea la activación, ejecutar:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Luego activar nuevamente:

```powershell
.venv\Scripts\activate
```

Instalar dependencias:

```powershell
pip install -r requirements.txt
```

## Ejecutar el servicio

Desde la carpeta `ai-service`, ejecutar:

```powershell
uvicorn app.main:app --reload
```

Luego abrir en el navegador:

```text
http://127.0.0.1:8000/docs
```

## Endpoints disponibles

Actualmente el servicio cuenta con estos endpoints principales:

```text
GET  /health
GET  /metadata
POST /analyze-video
POST /analyze-match
GET  /output-videos/{filename}
```

## GET `/health`

Verifica que la API esté funcionando.

Respuesta esperada:

```json
{
  "status": "ok"
}
```

## GET `/metadata`

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
  "service": "Mejengas AI Service",
  "version": "0.1.0",
  "camera_angles": {
    "allowed_angles": [
      "corner_left",
      "corner_right",
      "goal_left",
      "goal_right",
      "midfield_left",
      "midfield_right",
      "side_left",
      "side_right",
      "unknown"
    ]
  },
  "match_modes": {
    "valid_match_modes": [
      "casual",
      "ranked"
    ]
  }
}
```

## GET `/output-videos/{filename}`

Sirve archivos generados dentro de la carpeta:

```text
output_videos/
```

Este endpoint permite reproducir o descargar clips generados por la API.

Ejemplo:

```text
http://127.0.0.1:8000/output-videos/video_overlay_web.mp4
```

Para navegador, app móvil o frontend web, se recomienda usar:

```text
web_clip.web_clip_url
```

No se recomienda usar `generated_clip_url` como primera opción para reproducción web, porque el clip original puede estar codificado con un formato que algunos navegadores no reproducen correctamente.

## POST `/analyze-video`

Analiza un solo video.

Este endpoint sirve para pruebas individuales, análisis de un video específico o revisión básica de un archivo grabado con celular.

Parámetros:

```text
file
run_detection
run_tracking
run_ball_detection
```

Valores por defecto:

```text
run_detection = true
run_tracking = false
run_ball_detection = false
```

Ejemplo de respuesta parcial:

```json
{
  "filename": "partido.mp4",
  "file_validation": {
    "is_valid_video": true,
    "extension": ".mp4",
    "valid_extension": true,
    "valid_content_type": true
  },
  "video_info": {
    "readable": true,
    "fps": 29.3,
    "total_frames": 796,
    "duration_seconds": 27.16,
    "width": 848,
    "height": 478
  },
  "video_quality": {
    "quality_available": true,
    "quality_status": "usable",
    "orientation": "landscape",
    "resolution_quality": "basic",
    "duration_quality": "acceptable_sample",
    "fps_quality": "acceptable"
  },
  "needs_review": false
}
```

## POST `/analyze-match`

Analiza un partido usando una o varias cámaras.

Actualmente soporta hasta cuatro cámaras:

```text
cam_1
cam_2
cam_3
cam_4
```

Cada cámara puede tener un ángulo asociado:

```text
side_left
side_right
goal_left
goal_right
corner_left
corner_right
midfield_left
midfield_right
unknown
```

Parámetros principales:

```text
match_mode
cam_1
cam_2
cam_3
cam_4
cam_1_angle
cam_2_angle
cam_3_angle
cam_4_angle
run_detection
run_tracking
run_ball_detection
```

Ejemplo para ranked:

```text
match_mode = ranked
cam_1_angle = side_left
cam_2_angle = side_right
cam_3_angle = goal_left
cam_4_angle = goal_right
```

Ejemplo para casual:

```text
match_mode = casual
run_detection = false
```

Respuesta principal esperada para un ranked válido:

```json
{
  "match_analysis": true,
  "match_summary": {
    "camera_count": 4,
    "usable_cameras": 4,
    "side_cameras": 2,
    "goal_cameras": 2,
    "match_status": "ok"
  },
  "match_mode_validation": {
    "match_mode": "ranked",
    "is_valid_for_mode": true,
    "minimum_cameras": 4
  },
  "needs_review": false
}
```

## Modos de partido

El servicio distingue entre dos modos principales de partido:

```text
casual
ranked
```

## Casual

El modo casual no requiere video obligatorio.

Este modo puede usarse para partidos amistosos, pruebas internas o análisis opcional. Si el usuario no sube video, la app puede funcionar sin llamar al servicio de IA.

Si se sube un video casual, el servicio puede analizarlo como apoyo, pero la falta de detección, tracking o cámaras completas no debe invalidar el partido.

Reglas actuales:

```text
match_mode = casual
requires_video = false
minimum_cameras = 0
```

Ejemplo de validación casual:

```json
{
  "match_mode": "casual",
  "is_valid_for_mode": true,
  "requires_video": false,
  "minimum_cameras": 0,
  "warnings": []
}
```

## Ranked

El modo ranked sí requiere grabación obligatoria.

Para que un partido ranked sea considerado válido, se requiere un mínimo de cuatro cámaras:

```text
side_left
side_right
goal_left
goal_right
```

Esto permite cubrir el partido desde dos ángulos laterales y apoyar la validación de goles con cámaras detrás de los marcos.

Reglas actuales:

```text
match_mode = ranked
requires_video = true
minimum_cameras = 4
required_angles = side_left, side_right, goal_left, goal_right
```

Si un partido ranked se analiza con menos de cuatro cámaras, el servicio marca:

```json
{
  "needs_review": true
}
```

Ejemplo de validación ranked incompleta:

```json
{
  "match_mode": "ranked",
  "is_valid_for_mode": false,
  "requires_video": true,
  "camera_count": 1,
  "minimum_cameras": 4,
  "missing_required_angles": [
    "side_right",
    "goal_left",
    "goal_right"
  ],
  "warnings": [
    "ranked requires at least 4 camera(s). Only 1 camera(s) were provided.",
    "ranked is missing required camera angles: side_right, goal_left, goal_right."
  ]
}
```

## Configuración recomendada de cámaras para ranked

Para partidos ranked, Mejengas recomienda la siguiente configuración:

```text
cam_1 = side_left
cam_2 = side_right
cam_3 = goal_left
cam_4 = goal_right
```

Esta configuración permite:

- Analizar el movimiento general del partido.
- Cubrir mejor puntos muertos.
- Tener apoyo visual para validar goles.
- Usar cámaras detrás de los marcos para revisión.
- Usar cámaras laterales para análisis de jugadores y jugadas.

## Flujo actual de eventos

El flujo actual de análisis de eventos funciona de forma progresiva:

```text
Detección de jugadores
        ↓
Actividad de jugadores cerca de zonas de marco
        ↓
Detección del balón
        ↓
Actividad del balón cerca de zonas de marco
        ↓
Correlación temporal entre jugadores y balón
        ↓
Eventos de ataque
        ↓
Eventos de peligro
        ↓
Posible tiro
        ↓
Candidato de gol
        ↓
Timeline de eventos
        ↓
Sugerencias de clips
        ↓
Momentos agrupados de revisión
        ↓
Clips reales de revisión
        ↓
Overlay visual de revisión
        ↓
Conversión a clip web H.264
        ↓
Metadata de fuente del clip
        ↓
Resumen compacto de revisión
        ↓
Respuesta lista para app/backend
```

## `detection_summary`

Resume la detección de jugadores.

Incluye:

```text
frames_analyzed
average_players_detected
max_players_detected
detection_confidence_average
analysis_quality
goal_area_activity
```

Dentro de `goal_area_activity`, el sistema registra actividad cerca de las zonas aproximadas de marco:

```json
{
  "activity_detected": true,
  "total_goal_area_detections": 58,
  "left_goal_area_detections": 33,
  "right_goal_area_detections": 25
}
```

También registra timestamps de jugadores cerca de cada zona:

```json
{
  "timestamp_seconds": 25.59,
  "center_x": 686,
  "center_y": 187,
  "confidence": 0.83
}
```

## `ball_summary`

Resume la detección experimental del balón.

Incluye:

```text
frames_analyzed
frames_with_ball
ball_detection_rate
ball_confidence_average
ball_detected
ball_detection_timestamps
ball_goal_area_activity
processed_ball_video_path
```

Ejemplo de timestamp de balón:

```json
{
  "frame_index": 765,
  "timestamp_seconds": 26.11,
  "center_x": 714,
  "center_y": 279,
  "confidence": 0.92
}
```

Ejemplo de balón cerca del área derecha:

```json
{
  "right_goal_area_timestamps": [
    {
      "frame_index": 765,
      "timestamp_seconds": 26.11,
      "center_x": 714,
      "center_y": 279,
      "confidence": 0.92
    }
  ]
}
```

Cuando `run_ball_detection=true`, el sistema también genera un video procesado con marcador visual del balón. Este archivo se indica en:

```json
{
  "processed_ball_video_path": "output_videos/video_ball.mp4"
}
```

Ese video puede usarse como fuente para clips de revisión, de modo que el clip final muestre la marca visual del balón.

## `attack_events`

Resume actividad de jugadores cerca de zonas de marco.

Ejemplo:

```json
{
  "attack_events_available": true,
  "possible_attack_detected": true,
  "events": [
    {
      "type": "right_goal_area_pressure",
      "side": "right",
      "confidence": "basic"
    }
  ]
}
```

## `danger_events`

Combina jugadores cerca del marco con balón cerca del marco.

Además, puede correlacionar timestamps para verificar si jugadores y balón estuvieron cerca del marco en una ventana de tiempo cercana.

Ventana actual:

```text
1.5 segundos
```

Ejemplo:

```json
{
  "danger_events_available": true,
  "possible_danger_play": true,
  "possible_shot_context": true,
  "time_correlation_available": true,
  "time_correlation_window_seconds": 1.5,
  "events": [
    {
      "type": "possible_right_goal_danger_play",
      "side": "right",
      "confidence": "time_correlated",
      "time_correlated": true
    }
  ]
}
```

Ejemplo de correlación temporal:

```json
{
  "player_timestamp_seconds": 25.59,
  "ball_timestamp_seconds": 26.11,
  "time_difference_seconds": 0.52,
  "player_confidence": 0.83,
  "ball_confidence": 0.92
}
```

## `shot_events`

Usa `danger_events` y detección de balón para marcar un posible contexto de tiro.

Si el evento de peligro tiene correlación temporal, el posible tiro hereda esa confianza.

Ejemplo:

```json
{
  "shot_events_available": true,
  "possible_shot_detected": true,
  "time_correlation_available": true,
  "events": [
    {
      "type": "possible_shot_event",
      "side": "right",
      "confidence": "time_correlated",
      "time_correlated": true,
      "source_event": "possible_right_goal_danger_play"
    }
  ]
}
```

## `goal_candidate_events`

Marca una posible jugada candidata a gol.

Este bloque no confirma goles. Solo indica que existe una posible jugada que requiere validación adicional.

Si el posible tiro tiene correlación temporal, el candidato de gol hereda esa confianza.

Ejemplo:

```json
{
  "goal_candidate_events_available": true,
  "possible_goal_candidate_detected": true,
  "requires_goal_camera_validation": true,
  "is_confirmed_goal": false,
  "time_correlation_available": true,
  "events": [
    {
      "type": "possible_goal_candidate",
      "side": "right",
      "confidence": "time_correlated",
      "time_correlated": true,
      "description": "Possible goal candidate detected near the right goal area. This is not a confirmed goal."
    }
  ]
}
```

## `analysis_events`

Resume los mensajes principales del análisis en una lista de texto.

Ejemplo:

```json
{
  "events": [
    "Video is readable.",
    "Player detection quality is useful.",
    "Possible danger play detected near goal areas.",
    "Possible shot event detected near the right goal area.",
    "Possible goal candidate detected.",
    "Goal camera validation is required.",
    "Goal is not confirmed by the AI service."
  ],
  "overall_status": "ok"
}
```

## `match_event_summary`

Resume los eventos importantes en un bloque más fácil de consumir por una app, web o backend.

Ejemplo:

```json
{
  "summary_available": true,
  "summary_status": "goal_candidate_review",
  "has_attack_activity": true,
  "has_danger_play": true,
  "has_possible_shot": true,
  "has_goal_candidate": true,
  "requires_goal_camera_validation": true,
  "confirmed_goals": 0,
  "important_event_count": 5
}
```

Valores posibles de `summary_status`:

```text
normal
attack_activity
danger_play
possible_shot
goal_candidate_review
```

## `timeline_events`

Dentro de `match_event_summary`, el sistema genera una línea de tiempo con eventos importantes que tienen timestamp principal.

Ejemplo:

```json
{
  "timeline_event_count": 3,
  "timeline_events": [
    {
      "category": "danger",
      "type": "possible_right_goal_danger_play",
      "side": "right",
      "confidence": "time_correlated",
      "primary_timestamp_seconds": 26.11
    },
    {
      "category": "shot",
      "type": "possible_shot_event",
      "side": "right",
      "confidence": "time_correlated",
      "primary_timestamp_seconds": 26.11
    },
    {
      "category": "goal_candidate",
      "type": "possible_goal_candidate",
      "side": "right",
      "confidence": "time_correlated",
      "primary_timestamp_seconds": 26.11,
      "is_confirmed_goal": false
    }
  ]
}
```

Este bloque permite que una app muestre una línea de tiempo de eventos importantes.

## `clip_suggestions`

Genera rangos sugeridos de video alrededor de eventos importantes.

Actualmente usa:

```text
3 segundos antes del evento
3 segundos después del evento
```

Ejemplo:

```json
{
  "clip_suggestions_available": true,
  "seconds_before_event": 3,
  "seconds_after_event": 3,
  "suggestion_count": 3,
  "suggestions": [
    {
      "clip_id": "clip_1",
      "category": "danger",
      "primary_timestamp_seconds": 26.11,
      "start_time_seconds": 23.11,
      "end_time_seconds": 27.16,
      "duration_seconds": 4.05
    }
  ]
}
```

El sistema ajusta automáticamente el final del clip si el evento ocurre cerca del final del video.

## `review_moments`

Agrupa sugerencias de clips que ocurren en momentos muy cercanos.

Esto evita que la app muestre varios clips repetidos cuando `danger`, `shot` y `goal_candidate` ocurren en el mismo timestamp.

Ventana actual de agrupación:

```text
1 segundo
```

Ejemplo:

```json
{
  "review_moments_available": true,
  "group_window_seconds": 1,
  "moment_count": 1,
  "moments": [
    {
      "review_moment_id": "review_moment_1",
      "primary_timestamp_seconds": 26.11,
      "start_time_seconds": 23.11,
      "end_time_seconds": 27.16,
      "duration_seconds": 4.05,
      "main_category": "goal_candidate",
      "categories": [
        "danger",
        "shot",
        "goal_candidate"
      ],
      "event_count": 3,
      "requires_goal_camera_validation": true,
      "is_confirmed_goal": false
    }
  ]
}
```

Este bloque es útil para mostrar “momentos importantes” al usuario final o a una pantalla administrativa de revisión.

## `review_clips`

Genera clips reales en formato `.mp4` a partir de los `review_moments`.

El sistema toma el rango sugerido del momento de revisión:

```text
start_time_seconds
end_time_seconds
```

y crea un archivo de video corto dentro de:

```text
output_videos/
```

Ejemplo:

```json
{
  "review_clips_available": true,
  "clip_count": 1,
  "clips": [
    {
      "review_moment_id": "review_moment_1",
      "main_category": "goal_candidate",
      "side": "right",
      "primary_timestamp_seconds": 26.11,
      "start_time_seconds": 23.11,
      "end_time_seconds": 27.16,
      "duration_seconds": 4.05,
      "requires_goal_camera_validation": true,
      "is_confirmed_goal": false,
      "clip_generation": {
  "clip_generated": true,
  "generated_clip_path": "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
  "generated_clip_url": "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
  "generated_clip_full_url": "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
  "web_clip": {
    "web_clip_generated": true,
    "web_clip_path": "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "web_clip_url": "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "web_clip_full_url": "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "codec": "h264",
    "pixel_format": "yuv420p"
  },
  "start_frame": 677,
  "end_frame": 795,
  "frames_written": 119,
  "overlay_applied": true,
  "overlay_type": "basic_review_moment"
	}
    }
  ]
}
```

Este bloque permite que una app o backend use directamente el clip generado para revisión visual.

## `clip_source`

Dentro de `review_clips`, el sistema incluye metadata para indicar desde cuál video se generaron los clips.

Esto evita que la app o backend tenga que adivinar la fuente revisando el nombre del archivo.

Ejemplo cuando `run_ball_detection=true` y existe video procesado con marcador de balón:

```json
{
  "review_clips": {
    "review_clips_available": true,
    "clip_source": {
      "source_type": "processed_ball_video",
      "source_path": "output_videos/video_ball.mp4",
      "uses_ball_marker": true
    },
    "clip_count": 1
  }
}
```

Ejemplo cuando `run_ball_detection=false` o no existe video procesado con balón:

```json
{
  "review_clips": {
    "review_clips_available": true,
    "clip_source": {
      "source_type": "original_video",
      "source_path": "input_videos/video_original.mp4",
      "uses_ball_marker": false
    },
    "clip_count": 0
  }
}
```

Valores actuales de `source_type`:

```text
original_video
processed_ball_video
```

Campos principales:

```text
source_type
source_path
uses_ball_marker
```

## Overlay visual de revisión

El servicio puede aplicar un overlay visual básico encima de los clips de revisión.

Actualmente el overlay muestra:

```text
REVIEW
Categoría principal | lado
Tiempo del evento
Requisito de validación con cámara de marco
Estado del gol
```

Ejemplo visual esperado:

```text
REVIEW
Goal Candidate | Right
Time: 26.11s
Needs goal camera review
Not confirmed
```

El overlay se aplica directamente al clip generado y queda indicado en el JSON mediante:

```json
{
  "overlay_applied": true,
  "overlay_type": "basic_review_moment"
}
```

Actualmente el nombre del archivo generado con overlay termina en:

```text
_overlay.mp4
```

Ejemplo:

```text
video_ball_review_moment_1_goal_candidate_right_overlay.mp4
```

Este overlay ayuda a que el administrador, capitán o revisor pueda entender rápidamente por qué el clip fue marcado como importante.

## `overlay_metadata`

Dentro de `clip_generation`, el sistema incluye metadata del overlay aplicado.

Ejemplo:

```json
{
  "overlay_metadata": {
    "style": "compact",
    "background": "semi_transparent",
    "position": "top_left",
    "text_color": "white",
    "includes": [
      "main_category",
      "side",
      "timestamp",
      "goal_camera_validation",
      "goal_status"
    ]
  }
}
```

Campos actuales:

```text
style
background
position
text_color
includes
```

Esto permite que la app/backend sepa qué tipo de información visual aparece en el clip generado.

## `web_clip`

`web_clip` es la versión compatible para navegador, app o frontend web.

El clip original generado por OpenCV puede no reproducirse correctamente en algunos navegadores. Por eso el servicio genera una segunda versión usando H.264 y formato de píxel `yuv420p`.

Ejemplo:

```json
{
  "web_clip": {
    "web_clip_generated": true,
    "web_clip_path": "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "web_clip_url": "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "codec": "h264",
    "pixel_format": "yuv420p"
  }
}
```

Campos principales:

```text
web_clip_generated
web_clip_path
web_clip_url
codec
pixel_format
web_clip_full_url
```
`web_clip_full_url` contiene la URL absoluta lista para reproducirse desde navegador, app móvil o frontend web.

Ejemplo:

```text
http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4

Para navegador, app móvil o frontend web, se debe usar:

```text
web_clip.web_clip_url
```

Ejemplo:

```text
http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4
```

Regla recomendada:

```text
Para reproducción en navegador/app:
usar web_clip_url.

Para depuración local:
usar web_clip_path.

Para referencia al clip original:
usar generated_clip_path o generated_clip_url.
```



## `review_summary`

`review_summary` es un bloque compacto pensado para que la app, backend o dashboard pueda saber rápidamente si hay algo que revisar.

Este bloque evita que la app tenga que recorrer todo el JSON para saber si debe mostrar una alerta.

Ejemplo:

```json
{
  "review_summary": {
    "review_summary_available": true,
    "review_required": true,
    "main_reason": "goal_candidate",
    "summary_status": "goal_candidate_review",
    "review_moment_count": 1,
    "clip_count": 1,
    "has_overlay_clip": true,
    "uses_ball_marker": true,
    "requires_goal_camera_validation": true,
    "confirmed_goals": 0,
    "primary_review_clip_available": true,
"frontend_ready": true,
"recommended_playback_url": "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
"primary_generated_clip_path": "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
"primary_generated_clip_url": "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
"primary_generated_clip_full_url": "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4",
"primary_web_clip_path": "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
"primary_web_clip_url": "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
"primary_web_clip_full_url": "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4",
    "generated_clip_paths": [
  "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4"
],
"generated_clip_urls": [
  "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4"
],
"generated_clip_full_urls": [
  "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4"
],
"web_clip_paths": [
  "output_videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4"
],
"web_clip_urls": [
  "/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4"
],
"web_clip_full_urls": [
  "http://127.0.0.1:8000/output-videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4"
]
  }
}
```

Campos principales:

```text
review_summary_available
review_required
main_reason
summary_status
review_moment_count
clip_count
has_overlay_clip
uses_ball_marker
requires_goal_camera_validation
confirmed_goals
generated_clip_paths
generated_clip_urls
web_clip_paths
web_clip_urls
generated_clip_full_urls
web_clip_full_urls
frontend_ready
recommended_playback_url
```
Para integración con frontend, app móvil o dashboard administrativo, el campo más simple de usar es:

```text
review_summary.recommended_playback_url

Para reproducción rápida desde app móvil, frontend web o dashboard administrativo, se recomienda usar:

```text
review_summary.web_clip_full_urls

Para reproducción en navegador, app móvil o frontend web, se recomienda usar:

```text
review_summary.web_clip_urls
Valores posibles de `main_reason`:

```text
normal
danger_play
possible_shot
goal_candidate
review_moment
```

Este bloque es especialmente útil para pantallas de administración, notificaciones internas o flujos donde la app solo necesita saber si debe abrir una revisión.

## Fuente usada para generar `review_clips`

El servicio puede generar clips desde diferentes versiones del video.

Actualmente la prioridad es:

```text
1. Video procesado con marcador del balón, si existe.
2. Video original subido, si no existe video procesado con balón.
```

Eso significa que si se ejecuta:

```text
run_ball_detection = true
```

y el sistema genera:

```text
processed_ball_video_path
```

entonces `review_clips` se genera desde ese video procesado. Por eso el clip final puede incluir el tracker rojo del balón.

Ejemplo de ruta esperada:

```text
output_videos/video_ball_review_moment_1_goal_candidate_right_overlay.mp4
```

Luego se genera una versión web:

```text
output_videos/video_ball_review_moment_1_goal_candidate_right_overlay_web.mp4
```

Esto mejora la revisión visual porque el administrador, capitán o sistema de revisión puede ver no solo el tramo del partido, sino también la marca visual que explica por qué la IA detectó una posible jugada importante.

Si `run_ball_detection=false`, el clip se genera desde el video original.

Más adelante se puede decidir si los clips deben generarse desde:

```text
video original
video con detección de jugadores
video con tracking
video con marca del balón
video combinado con overlays avanzados
```

## Archivos generados

El sistema puede generar archivos en estas carpetas:

```text
input_videos/
output_videos/
output_json/
```

Tipos de archivos generados:

```text
Videos originales subidos
Videos con detección de jugadores
Videos con tracking
Videos con marca del balón
Clips reales de revisión
Clips reales de revisión con overlay
Clips web compatibles en H.264
Resultados JSON del análisis
```

Estas carpetas no deben subir videos ni resultados generados a GitHub. Solo deben conservar el archivo `.gitkeep`.

## Estado actual

El módulo actualmente funciona como una primera demo técnica.

Ya permite:

- Subir video.
- Validar si el archivo es un video.
- Leer metadatos del video.
- Evaluar calidad básica del video.
- Detectar jugadores.
- Generar video con detecciones.
- Hacer tracking básico.
- Detectar experimentalmente el balón.
- Mostrar la marca del balón de forma visible.
- Exportar resultados en JSON.
- Analizar múltiples cámaras.
- Diferenciar entre modo casual y modo ranked.
- Validar que ranked tenga 4 cámaras.
- Exponer metadata para integración futura con apps o backends.
- Servir archivos generados mediante `/output-videos`.
- Detectar actividad de jugadores cerca del marco.
- Detectar actividad del balón cerca del marco.
- Registrar timestamps de jugadores y balón.
- Correlacionar jugadores y balón por tiempo.
- Generar eventos básicos de ataque.
- Generar eventos de peligro.
- Generar posibles eventos de tiro.
- Generar candidatos de gol sin confirmar gol.
- Resumir eventos importantes en `match_event_summary`.
- Generar línea de tiempo con `timeline_events`.
- Generar sugerencias de clips con `clip_suggestions`.
- Agrupar clips repetidos en `review_moments`.
- Generar clips reales de revisión en `review_clips`.
- Indicar la fuente del clip mediante `clip_source`.
- Generar clips de revisión desde el video con marcador de balón cuando está disponible.
- Aplicar overlay visual básico a clips de revisión.
- Documentar metadata visual del overlay mediante `overlay_metadata`.
- Convertir clips de revisión a versión web H.264 mediante `web_clip`.
- Generar un resumen compacto de revisión mediante `review_summary`.

## Limitaciones actuales

- El tracking todavía puede generar muchos IDs para el mismo jugador.
- La detección del balón es experimental.
- El sistema todavía no identifica jugadores por nombre.
- El sistema todavía no identifica jugadores por número de camiseta.
- El sistema todavía no detecta goles oficialmente.
- El sistema todavía no confirma marcador.
- El sistema todavía no calcula pases, recuperaciones, atajadas, tiros oficiales o mapas de calor.
- La IA no debe usarse todavía como juez absoluto del partido.
- Las zonas de cancha son aproximadas y no detectan todavía los marcos reales.
- El análisis multicámara todavía no sincroniza eventos por tiempo entre cámaras.
- Los candidatos de gol todavía requieren validación con cámaras de marco, capitanes o revisión administrativa.
- Los clips con marcador de balón dependen de que `run_ball_detection=true` y de que exista `processed_ball_video_path`.
- `clip_source` solo indica la fuente usada; todavía no combina varias fuentes visuales en un mismo clip.
- El overlay actual es básico y no incluye todavía marcador oficial, nombres de jugadores, IDs de tracking, logos ni explicación visual avanzada.
- El overlay actual se aplica sobre todo el clip generado.
- `review_summary` resume el estado de revisión, pero no reemplaza los bloques detallados del análisis.
- `web_clip` mejora la reproducción web, pero todavía no gestiona almacenamiento remoto ni URLs públicas externas.

## Próximos pasos

Posibles mejoras futuras:

- Mejorar tracking para reducir IDs duplicados.
- Agregar sincronización entre cámaras.
- Detectar zonas reales de cancha y porterías.
- Detectar eventos básicos por tiempo.
- Detectar posibles tiros con mayor precisión.
- Detectar momentos donde el balón aparece cerca de la línea de gol.
- Generar clips con overlays visuales avanzados.
- Generar clips desde videos procesados con jugadores y balón al mismo tiempo.
- Agregar logos, marcador y etiquetas al overlay.
- Agregar metadata del partido al overlay.
- Mejorar detección del balón con modelos personalizados.
- Conectar el servicio con Supabase u otro backend.
- Enviar resultados al backend principal de Mejengas.
- Integrar el flujo con una app móvil o web.
- Calcular estadísticas avanzadas por jugador.