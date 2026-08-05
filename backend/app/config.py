import os
import re
import tempfile
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict





class Settings(BaseSettings):

    model_config = SettingsConfigDict(

        env_file=".env",

        env_file_encoding="utf-8",

        extra="ignore",

    )



    app_name: str = "AI Resume Analyzer"

    app_env: str = "development"

    secret_key: str = "dev-secret-change-in-production"

    algorithm: str = "HS256"

    access_token_expire_minutes: int = 1440



    database_url: str = "sqlite+aiosqlite:///./resume_analyzer.db"



    gemini_api_key: str = ""

    gemini_model: str = "gemini-2.0-flash-lite"

    embedding_model: str = "models/embedding-001"



    chunk_size: int = 500

    chunk_overlap: int = 50



    cors_origins: str = "http://localhost:5173,http://localhost:3000,https://resume-ai-frontend-red.vercel.app"


    upload_dir: str = "uploads"



    # Supabase vector store (pgvector)

    supabase_url: str = ""

    supabase_service_role_key: str = ""

    supabase_table_name: str = "documents"

    supabase_query_name: str = "match_documents"

    @field_validator("supabase_url", mode="before")
    @classmethod
    def normalize_supabase_url(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            return ""
        url = v.strip().rstrip("/")
        # Fix common typo: https:https://project.supabase.co
        url = re.sub(r"^(https?:)+", "https://", url, count=1)
        if url.startswith("https://https://"):
            url = url.replace("https://https://", "https://", 1)
        if url.startswith("http://http://"):
            url = url.replace("http://http://", "http://", 1)
        if url and not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        return url

    @property
    def cors_origin_list(self) -> list[str]:

        raw = self.cors_origins.replace(";", ",")

        return [o.strip() for o in raw.split(",") if o.strip()]



    @property

    def base_path(self) -> Path:

        return Path(__file__).resolve().parent.parent



    @property

    def upload_path(self) -> Path:

        path = self.base_path / self.upload_dir
        try:
            path.mkdir(parents=True, exist_ok=True)
            return path
        except OSError:
            temp_path = Path(tempfile.gettempdir()) / self.upload_dir
            temp_path.mkdir(parents=True, exist_ok=True)
            return temp_path



    @property

    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_url.startswith("https://")
            and "supabase.co" in self.supabase_url
            and self.supabase_service_role_key
            and not self.supabase_service_role_key.startswith("sb_publishable_")
        )





@lru_cache

def get_settings() -> Settings:

    return Settings()

