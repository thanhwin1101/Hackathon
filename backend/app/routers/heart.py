import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import verify_api_key
from app.models import HeartRateIn, HeartRateOut
from app.services.mongodb_store import HeartMongoStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["heart-rate"])


def get_store() -> HeartMongoStore:
    from app.state import app_state

    if app_state.mongo is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Co so du lieu tam thoi khong san sang",
        )
    return app_state.mongo


@router.post(
    "/heart-rate",
    response_model=HeartRateOut,
    dependencies=[Depends(verify_api_key)],
    summary="Nhan du lieu nhip tim tho tu ESP32",
)
async def post_heart_rate(payload: HeartRateIn) -> HeartRateOut:
    store = get_store()
    try:
        oid = await store.insert_heart_reading(
            bpm=payload.bpm,
            device_id=payload.device_id,
            sensor=payload.sensor,
            raw_note=payload.raw_note,
        )
    except Exception as e:
        logger.exception("MongoDB insert failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Khong luu duoc du lieu. Kiem tra MongoDB.",
        ) from e

    from datetime import datetime, timezone

    return HeartRateOut(
        id=oid,
        bpm=payload.bpm,
        device_id=payload.device_id,
        received_at=datetime.now(timezone.utc),
    )
