# App Mejengas AI Service — Demo API Guide

## Estado actual de la demo

El AI service de App Mejengas permite consumir una demo MVP desde el frontend para:

- Analizar un video individual con `POST /analyze-video`.
- Analizar un partido multicamara con `POST /analyze-match`.
- Detectar eventos importantes del juego.
- Generar clips de revision.
- Recomendar una camara principal para revisar la jugada.
- Devolver un resumen listo para frontend en `frontend_match_summary`.
- Recibir una decision manual/admin con `POST /review-decision`.

## Como levantar el servidor

Desde PowerShell:

```powershell
cd C:\Users\Kendall Delgado\Documents\GitHub\mejenga\ai-service
uvicorn app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## Endpoints principales

- `GET /health`: verifica que el servicio este activo.
- `GET /metadata`: devuelve metadata de camaras, modos de partido y opciones de analisis.
- `POST /analyze-video`: analiza un video individual.
- `POST /analyze-match`: analiza un partido con una o varias camaras.
- `POST /review-decision`: recibe una decision humana/admin sobre un evento recomendado.

## POST /analyze-match

Este endpoint recibe videos de camaras y opciones de analisis para generar un resultado completo del partido.

Campos importantes:

- `match_mode`: modo del partido. Valores principales: `casual` o `ranked`.
- `run_detection`: activa deteccion de jugadores.
- `run_tracking`: activa tracking de jugadores.
- `run_ball_detection`: activa deteccion experimental de balon.
- `cam_1`, `cam_2`, `cam_3`, `cam_4`: archivos de video para cada camara.
- `cam_1_angle`, `cam_2_angle`, `cam_3_angle`, `cam_4_angle`: angulo asignado a cada camara.

Modos:

- `casual` puede funcionar con menos camaras.
- `ranked` espera 4 camaras: `side_left`, `side_right`, `goal_left`, `goal_right`.

## Que debe leer primero el frontend

Para la demo MVP, el frontend deberia priorizar:

```js
response.frontend_match_summary
```

Campos principales:

- `frontend_status`
- `main_message`
- `primary_action`
- `primary_video_url`
- `primary_camera_id`
- `primary_camera_angle`
- `has_review_clips`
- `has_multicamera_event`
- `requires_human_review`
- `review_decision_endpoint`
- `review_decision_type`
- `review_decision_options`
- `camera_setup_valid`
- `missing_required_angles`
- `warnings`

## Estados de `frontend_status`

- `camera_setup_required`: faltan camaras o angulos requeridos para validar el partido.
- `human_review_required`: hay un evento multicamara que requiere decision humana.
- `review_ready`: hay clips de revision listos para mostrar.
- `no_review_needed`: el analisis termino y no requiere revision.
- `analysis_ready`: estado general de fallback cuando el analisis termino.

## Como mostrar el video recomendado

Usar:

```js
response.frontend_match_summary.primary_video_url
```

Si `primary_video_url` no es `null`, el frontend puede mostrar un reproductor de video usando esa URL.

## Como pedir decision humana

Si:

```js
response.frontend_match_summary.requires_human_review === true
```

Entonces el frontend debe mostrar las opciones disponibles usando:

```js
response.frontend_match_summary.review_decision_options
```

Y enviar la decision seleccionada a:

```text
POST /review-decision
```

## Ejemplo de request para `/review-decision`

```json
{
  "match_analysis_id": "test_match_1",
  "event_id": "multicamera_event_2",
  "decision": "confirm_goal",
  "camera_id": "cam_2",
  "camera_angle": "side_right",
  "playback_url": "http://127.0.0.1:8000/output-videos/example.mp4",
  "notes": "Reviewed manually from recommended camera."
}
```

## Ejemplo de respuesta de `/review-decision`

```json
{
  "decision_received": true,
  "decision_status": "accepted",
  "event_id": "multicamera_event_2",
  "decision": "confirm_goal",
  "manual_goal_status": "confirmed_by_human",
  "manual_event_status": "confirmed_by_human",
  "requires_persistence": true,
  "persistence_status": "not_implemented",
  "message": "Manual review decision received. Persistence is not implemented yet."
}
```

## Advertencias actuales

- No hay persistencia todavia.
- Confirmar gol no guarda ni cambia el analisis todavia.
- La correlacion multicamara asume videos sincronizados.
- La deteccion de goles sigue requiriendo revision humana.
- En `ranked` faltan camaras si no se suben `side_left`, `side_right`, `goal_left` y `goal_right`.
