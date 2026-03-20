from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "heart_monitor"

    heart_api_key: str = "change-me-in-production"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3-flash"
    gemini_embedding_model: str = "gemini-embedding-2-preview"

    chroma_persist_dir: str = "./chroma_data"
    knowledge_pdf_path: str = "./knowledge/huong_dan_nhip_tim.pdf"
    knowledge_txt_fallback: str = "./knowledge/huong_dan_nhip_tim.txt"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
