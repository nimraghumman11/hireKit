"""FAISS-backed retriever for RAG pipeline."""
from __future__ import annotations
from pathlib import Path
import logging
import threading
from functools import lru_cache

from langchain_community.vectorstores import FAISS
from langchain.schema import Document

from app.retrieval.embedder import get_embeddings
from app.retrieval.loader import load_documents, chunk_documents
from config import get_settings

logger = logging.getLogger(__name__)


class KitRetriever:
    def __init__(self) -> None:
        self._store: FAISS | None = None
        self._cache: dict[str, str] = {}
        self._lock = threading.Lock()

    def _build(self) -> None:
        settings = get_settings()
        index_path = Path(settings.faiss_index_path)

        embeddings = get_embeddings()

        if index_path.exists():
            try:
                logger.info("Loading FAISS index from %s", index_path)
                self._store = FAISS.load_local(
                    str(index_path), embeddings, allow_dangerous_deserialization=True
                )
                return
            except Exception as exc:
                logger.warning("Failed to load FAISS index, rebuilding: %s", exc)

        logger.info("Building FAISS index from documents")
        docs = load_documents()
        chunks = chunk_documents(docs)
        self._store = FAISS.from_documents(chunks, embeddings)

        index_path.mkdir(parents=True, exist_ok=True)
        self._store.save_local(str(index_path))
        logger.info("FAISS index saved to %s", index_path)

    def search(self, query: str, top_k: int = 5) -> str:
        """Return joined chunk texts relevant to the query. Results are cached by query string."""
        cache_key = f"{query}:{top_k}"
        with self._lock:
            if cache_key in self._cache:
                logger.debug("RAG cache hit for query: %s", query[:60])
                return self._cache[cache_key]
        try:
            if self._store is None:
                self._build()
            docs: list[Document] = self._store.similarity_search(query, k=top_k)  # type: ignore[union-attr]
            result = "\n\n".join(d.page_content for d in docs)
            with self._lock:
                self._cache[cache_key] = result
            return result
        except Exception as exc:
            logger.error("Retrieval failed, returning empty context: %s", exc)
            return ""


_retriever_instance: KitRetriever | None = None


def get_retriever() -> KitRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = KitRetriever()
    return _retriever_instance
