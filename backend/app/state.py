from typing import Optional

from app.services.mongodb_store import HeartMongoStore
from app.services.rag_doctor import VirtualDoctorRAG


class AppState:
    mongo: Optional[HeartMongoStore] = None
    rag: Optional[VirtualDoctorRAG] = None


app_state = AppState()
