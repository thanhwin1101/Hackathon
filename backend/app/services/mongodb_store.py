from datetime import datetime, timezone
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import Settings


class HeartMongoStore:
    def __init__(self, settings: Settings) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None
        self._settings = settings

    async def connect(self) -> None:
        self._client = AsyncIOMotorClient(
            self._settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
        )
        self._db = self._client[self._settings.mongodb_db]
        await self._client.admin.command("ping")

    async def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
            self._db = None

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("MongoDB chua ket noi")
        return self._db

    async def insert_heart_reading(
        self,
        *,
        bpm: int,
        device_id: str,
        sensor: Optional[str],
        raw_note: Optional[str],
    ) -> str:
        doc: dict[str, Any] = {
            "bpm": bpm,
            "device_id": device_id,
            "sensor": sensor,
            "raw_note": raw_note,
            "received_at": datetime.now(timezone.utc),
        }
        result = await self.db["heart_readings"].insert_one(doc)
        return str(result.inserted_id)

    async def get_latest_reading(
        self, *, device_id: Optional[str] = None
    ) -> Optional[dict[str, Any]]:
        q: dict[str, Any] = {}
        if device_id:
            q["device_id"] = device_id
        doc = await self.db["heart_readings"].find_one(
            q,
            sort=[("received_at", -1)],
        )
        if not doc:
            return None
        return {
            "bpm": doc.get("bpm"),
            "device_id": doc.get("device_id"),
            "received_at": doc["received_at"],
        }
