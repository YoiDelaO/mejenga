from fastapi import FastAPI
from app.api.routes import router
from pathlib import Path
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Mejengas AI Service",
    description="Servicio de IA para analizar videos de partidos de Mejengas.",
    version="0.1.0"
)

BASE_DIR = Path(__file__).resolve().parents[1]
OUTPUT_VIDEOS_DIR = BASE_DIR / "output_videos"

OUTPUT_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/output-videos",
    StaticFiles(directory=str(OUTPUT_VIDEOS_DIR)),
    name="output_videos",
)

app.include_router(router)
