from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="Mejengas AI Service",
    description="Servicio de IA para analizar videos de partidos de Mejengas.",
    version="0.1.0"
)

app.include_router(router)
