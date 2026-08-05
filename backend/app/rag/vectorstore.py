"""Supabase pgvector store — no FAISS or local embedding models."""
import re
import uuid
from typing import TYPE_CHECKING

# Valid keys: resume:12 or jd:3 (not old FAISS filesystem paths)
COLLECTION_KEY_RE = re.compile(r"^(resume|jd):\d+$")

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from loguru import logger

from app.config import get_settings
from app.rag.embeddings import get_embeddings

if TYPE_CHECKING:
    from langchain_community.vectorstores import SupabaseVectorStore
    from supabase import Client

settings = get_settings()


class VectorStoreManager:
    """Indexes and retrieves document chunks via Supabase + Gemini embeddings API."""

    def __init__(self) -> None:
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self._client: "Client | None" = None
        self._store: "SupabaseVectorStore | None" = None

    def _get_client(self) -> "Client":
        if self._client is None:
            if not settings.supabase_url or not settings.supabase_service_role_key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. "
                    "See docs/supabase_setup.sql"
                )
            from supabase import create_client

            self._client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key,
            )
        return self._client

    def _get_store(self) -> "SupabaseVectorStore":
        if self._store is None:
            from langchain_community.vectorstores import SupabaseVectorStore

            self._store = SupabaseVectorStore(
                client=self._get_client(),
                embedding=get_embeddings(),
                table_name=settings.supabase_table_name,
                query_name=settings.supabase_query_name,
            )
        return self._store

    def _build_documents(self, text: str, metadata: dict) -> list[Document]:
        chunks = self.splitter.split_text(text)
        return [
            Document(page_content=chunk, metadata={**metadata, "chunk": i})
            for i, chunk in enumerate(chunks)
        ]

    def _delete_by_metadata(self, metadata_filter: dict) -> None:
        try:
            client = self._get_client()
            result = (
                client.table(settings.supabase_table_name)
                .select("id")
                .contains("metadata", metadata_filter)
                .execute()
            )
            ids = [row["id"] for row in (result.data or [])]
            if ids:
                client.table(settings.supabase_table_name).delete().in_("id", ids).execute()
                logger.info(f"Deleted {len(ids)} vectors for {metadata_filter}")
        except Exception as exc:
            logger.warning(f"Vector delete skipped: {exc}")

    def index_document(
        self,
        text: str,
        user_id: int,
        doc_type: str,
        doc_id: int,
    ) -> str:
        """
        Chunk, embed via Gemini API, store in Supabase.
        Returns collection key: '{doc_type}:{doc_id}'
        """
        metadata_filter = {
            "user_id": user_id,
            "doc_type": doc_type,
            "doc_id": doc_id,
        }
        self._delete_by_metadata(metadata_filter)

        docs = self._build_documents(text, metadata_filter)
        if not docs:
            raise ValueError("No content to index")

        store = self._get_store()
        ids = [str(uuid.uuid4()) for _ in docs]
        store.add_documents(docs, ids=ids)
        collection_key = f"{doc_type}:{doc_id}"
        logger.info(f"Indexed {len(docs)} chunks in Supabase as {collection_key}")
        return collection_key

    def _parse_collection_key(self, key: str) -> dict | None:
        if not key or not COLLECTION_KEY_RE.match(key):
            if key and ("vectorstore" in key or "\\" in key or key.startswith("/")):
                logger.warning(
                    f"Skipping legacy FAISS path — re-upload resume/JD to index in Supabase: {key[:60]}..."
                )
            return None
        doc_type, doc_id_str = key.split(":", 1)
        return {"doc_type": doc_type, "doc_id": int(doc_id_str)}

    def similarity_search(
        self,
        query: str,
        collection_keys: list[str],
        k: int = 5,
    ) -> tuple[list[Document], list[str]]:
        if not collection_keys:
            return [], []

        if not settings.supabase_configured:
            logger.warning(
                "Supabase not configured — set SUPABASE_URL (https://xxx.supabase.co) "
                "and SUPABASE_SERVICE_ROLE_KEY (not publishable key)"
            )
            return [], []

        try:
            store = self._get_store()
        except Exception as exc:
            logger.warning(f"Supabase client unavailable: {exc}")
            return [], []

        all_docs: list[Document] = []
        sources: list[str] = []

        for key in collection_keys:
            filt = self._parse_collection_key(key)
            if not filt:
                continue
            try:
                docs = store.similarity_search(query, k=k, filter=filt)
                all_docs.extend(docs)
                sources.extend([d.page_content[:200] for d in docs])
            except Exception as exc:
                logger.warning(f"Supabase search failed for {key}: {exc}")

        return all_docs, sources


vectorstore_manager = VectorStoreManager()
