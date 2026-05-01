\# Mejengas AI Service



Servicio de inteligencia artificial para la aplicación \*\*Mejengas\*\*.



Este módulo se encarga de recibir videos de partidos de fútbol, leer información básica del archivo, detectar jugadores, realizar tracking básico, intentar detectar el balón y devolver un resultado en formato JSON.



\## Objetivo del módulo



El objetivo inicial de este servicio es funcionar como una capa independiente de análisis de video para Mejengas.



Por ahora, el sistema no toma decisiones finales sobre el resultado de un partido. Su función es apoyar el análisis, generar evidencia visual y ayudar a determinar si un video puede ser útil para revisión.



\## Funcionalidades actuales



Actualmente el servicio permite:



\- Levantar una API con FastAPI.

\- Verificar estado del servicio con `/health`.

\- Subir videos mediante `/analyze-video`.

\- Guardar videos en `input\_videos/`.

\- Leer información básica del video:

&#x20; - FPS.

&#x20; - Duración.

&#x20; - Cantidad de frames.

&#x20; - Resolución.

&#x20; - Si el video puede leerse correctamente.

\- Detectar jugadores usando YOLO.

\- Generar video procesado con cajas sobre jugadores.

\- Realizar tracking básico de jugadores.

\- Generar video procesado con etiquetas tipo `P1`, `P2`, `P3`.

\- Detectar experimentalmente el balón.

\- Generar video procesado con marca sobre el balón.

\- Guardar resultados del análisis en `output\_json/`.

\- Activar o desactivar análisis opcionales mediante parámetros.



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

&#x20;     detection\_service.py

&#x20;     tracking\_service.py

&#x20;     ball\_service.py

&#x20;     event\_service.py

&#x20;   models/

&#x20;     analysis\_result.py

&#x20;   utils/

&#x20;     file\_utils.py

&#x20;     video\_utils.py

&#x20; input\_videos/

&#x20; output\_videos/

&#x20; output\_json/

&#x20; tests/

&#x20; requirements.txt

&#x20; README.md

&#x20; AGENTS.md

&#x20; .env.example

