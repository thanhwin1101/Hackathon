from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ChatCompatRequest(BaseModel):
    message: str = Field(..., max_length=4000)
    context: Optional[dict[str, Any]] = None


class ChatCompatResponse(BaseModel):
    response: str
    sources_used: Optional[int] = None


class LatestBpmResponse(BaseModel):
    bpm: Optional[int] = None
    device_id: Optional[str] = None
    received_at: Optional[datetime] = None


class HeartRateIn(BaseModel):
    bpm: int = Field(..., ge=0, le=300, description="Nhịp tim (beats per minute)")
    device_id: str = Field(default="unknown", max_length=128)
    sensor: Optional[str] = Field(default=None, max_length=64)
    raw_note: Optional[str] = Field(default=None, max_length=512)


class HeartRateOut(BaseModel):
    id: str
    bpm: int
    device_id: str
    received_at: datetime


class VirtualDoctorRequest(BaseModel):
    bpm: int = Field(..., ge=0, le=300)
    device_id: Optional[str] = None
    extra_context: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Triệu chứng / bối cảnh thêm (tùy chọn)",
    )


class VirtualDoctorResponse(BaseModel):
    bpm: int
    advice: str
    sources_used: int


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
