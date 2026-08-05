from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api import analyze, auth, chat, dashboard, generate, jd, resume
from app.config import get_settings
from app.database import Base, engine
from app.middleware.logging_middleware import LoggingMiddleware

settings = get_settings()
print("CORS:", settings.cors_origin_list)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="RAG-powered AI Resume Analyzer with Gemini",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(resume.router, prefix=api_prefix)
app.include_router(jd.router, prefix=api_prefix)
app.include_router(analyze.router, prefix=api_prefix)
app.include_router(chat.router, prefix=api_prefix)
app.include_router(generate.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error: {exc}")
    detail = str(exc) if settings.app_env == "development" else "Internal server error"
    return JSONResponse(status_code=500, content={"detail": detail})


@app.get("/")
async def root():
    return {"message": "AI Resume Analyzer API", "docs": "/docs", "health": "/health"}


@app.get("/health")
async def health():
    gemini_model = None
    if settings.gemini_api_key:
        try:
            from app.services.gemini_service import gemini_service

            gemini_model = gemini_service.model_name
        except Exception:
            gemini_model = "unavailable"
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": gemini_model,
        "supabase_configured": settings.supabase_configured,
        "embeddings": "gemini-api",
    }
