import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import doctor, heart, web_compat
from app.services.mongodb_store import HeartMongoStore
from app.services.rag_doctor import VirtualDoctorRAG
from app.state import app_state

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    store = HeartMongoStore(settings)
    try:
        await store.connect()
        app_state.mongo = store
        logger.info("MongoDB: ket noi OK")
    except Exception as e:
        logger.error("MongoDB: khong ket noi duoc: %s", e)
        app_state.mongo = None

    app_state.rag = None
    if settings.openai_api_key or settings.gemini_api_key:
        try:
            rag = VirtualDoctorRAG(settings)
            rag.ensure_ready()
            app_state.rag = rag
            logger.info("RAG / Chroma: san sang")
        except Exception as e:
            logger.warning("RAG chua san sang (co the thieu tai lieu hoac loi API): %s", e)
            app_state.rag = None
    else:
        logger.warning("Bo qua khoi tao RAG: thieu OPENAI_API_KEY hoac GEMINI_API_KEY")

    yield

    if app_state.mongo:
        await app_state.mongo.close()
        app_state.mongo = None
    app_state.rag = None


app = FastAPI(
    title="Heart Monitor API",
    description="Nhan BPM tu ESP32 (MongoDB) + bac si ao RAG (LangChain + Chroma).",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
if settings.cors_origins:
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if not isinstance(detail, str):
            detail = str(detail)
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})
    if isinstance(exc, RequestValidationError):
        return await request_validation_exception_handler(request, exc)
    logger.exception("Unhandled: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Loi may chu noi bo. Vui long thu lai sau."},
    )


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "ok",
        "mongodb": app_state.mongo is not None,
        "rag_ready": app_state.rag is not None,
    }


app.include_router(heart.router)
app.include_router(doctor.router)
app.include_router(web_compat.router)
