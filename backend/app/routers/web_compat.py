import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.models import ChatCompatRequest, ChatCompatResponse, LatestBpmResponse
from app.services.mongodb_store import HeartMongoStore

logger = logging.getLogger(__name__)

router = APIRouter(tags=["web"])


def _mongo_store() -> HeartMongoStore:
    from app.state import app_state

    if app_state.mongo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Co so du lieu tam thoi khong san sang",
        )
    return app_state.mongo


@router.get("/bpm", response_model=LatestBpmResponse, summary="BPM moi nhat cho dashboard web")
async def get_latest_bpm(device_id: Optional[str] = Query(default=None)) -> LatestBpmResponse:
    store = _mongo_store()
    try:
        doc = await store.get_latest_reading(device_id=device_id)
    except Exception as e:
        logger.exception("MongoDB read failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Khong doc duoc du lieu. Kiem tra MongoDB.",
        ) from e
    if doc is None:
        return LatestBpmResponse(bpm=None, device_id=None, received_at=None)
    return LatestBpmResponse(
        bpm=int(doc["bpm"]) if doc.get("bpm") is not None else None,
        device_id=str(doc["device_id"]) if doc.get("device_id") is not None else None,
        received_at=doc["received_at"],
    )


@router.post(
    "/chat",
    response_model=ChatCompatResponse,
    summary="Chat web — goi RAG bac si ao (cung logic /api/v1/virtual-doctor)",
)
async def chat_compat(body: ChatCompatRequest) -> ChatCompatResponse:
    from app.state import app_state

    ctx = body.context or {}
    raw = ctx.get("current_bpm")
    bpm = 75
    if raw is not None and type(raw) is not bool and isinstance(raw, (int, float)):
        bpm = int(round(float(raw)))
        bpm = max(0, min(300, bpm))

    if app_state.rag is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG chua khoi tao. Kiem tra OPENAI_API_KEY va tai lieu knowledge.",
        )

    try:
        advice, n = app_state.rag.advise(bpm, extra_context=body.message)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        ) from e
    except Exception as e:
        logger.exception("RAG/LLM error (chat): %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Loi khi goi mo hinh hoac truy van vector. Thu lai sau.",
        ) from e

    return ChatCompatResponse(response=advice, sources_used=n)
