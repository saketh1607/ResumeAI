"""Lazy-loaded Gemini embeddings (API only — no local ML models)."""
from typing import TYPE_CHECKING

from app.config import get_settings

if TYPE_CHECKING:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

_embeddings: "GoogleGenerativeAIEmbeddings | None" = None


def get_embeddings() -> "GoogleGenerativeAIEmbeddings":
    global _embeddings
    if _embeddings is None:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required for embeddings")
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        _embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.embedding_model,
            google_api_key=settings.gemini_api_key,
        )
    return _embeddings
