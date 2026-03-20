import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.deps import verify_api_key
from app.models import VirtualDoctorRequest, VirtualDoctorResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["virtual-doctor"])


@router.post(
    "/virtual-doctor",
    response_model=VirtualDoctorResponse,
    dependencies=[Depends(verify_api_key)],
    summary="Bac si ao (RAG): khuyen ca nhan hoa dua tren BPM + tai lieu PDF/TXT",
)
async def virtual_doctor(body: VirtualDoctorRequest) -> VirtualDoctorResponse:
    from app.state import app_state

    if app_state.rag is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG chua khoi tao. Kiem tra OPENAI_API_KEY va tai lieu knowledge.",
        )

    try:
        advice, n = app_state.rag.advise(
            body.bpm,
            extra_context=body.extra_context,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.exception("RAG/LLM error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Loi khi goi mo hinh hoac truy van vector. Thu lai sau.",
        ) from e

    return VirtualDoctorResponse(bpm=body.bpm, advice=advice, sources_used=n)


@router.get(
    "/virtual-doctor/health-rag",
    dependencies=[Depends(verify_api_key)],
    summary="Kiem tra nhanh vector store (khong goi LLM)",
)
async def rag_health() -> dict:
    settings = get_settings()
    from pathlib import Path

    p = Path(settings.chroma_persist_dir)
    return {
        "chroma_dir": str(p.resolve()),
        "chroma_exists": p.exists() and any(p.iterdir()) if p.exists() else False,
        "pdf": settings.knowledge_pdf_path,
        "txt_fallback": settings.knowledge_txt_fallback,
    }
