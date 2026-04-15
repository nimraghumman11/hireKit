"""Tests for the RAG retrieval pipeline."""
import pytest
from unittest.mock import patch, MagicMock


def test_loader_returns_seed_documents():
    from app.retrieval.loader import load_documents
    docs = load_documents()
    assert len(docs) > 0
    assert all(hasattr(d, "page_content") for d in docs)


def test_loader_loads_packaged_txt_and_manifest():
    from app.retrieval.loader import DEFAULT_DOCS_DIR, load_documents, SEED_DOCUMENTS

    assert DEFAULT_DOCS_DIR.is_dir()
    txt_count = len(list(DEFAULT_DOCS_DIR.glob("*.txt")))
    assert txt_count == 29

    docs = load_documents()
    assert len(docs) == 29
    assert len(docs) == len(SEED_DOCUMENTS)
    assert all(d.metadata.get("source") == "seed" for d in docs)


def test_loader_falls_back_when_docs_dir_empty(tmp_path):
    from app.retrieval.loader import load_documents, SEED_DOCUMENTS

    docs = load_documents(str(tmp_path))
    assert len(docs) == len(SEED_DOCUMENTS)


def test_chunk_documents_splits_content():
    from app.retrieval.loader import load_documents, chunk_documents
    docs = load_documents()
    chunks = chunk_documents(docs)
    assert len(chunks) >= len(docs)


def test_retriever_returns_string_on_empty_store():
    """Retriever should degrade gracefully and return empty string."""
    from app.retrieval.retriever import KitRetriever
    retriever = KitRetriever()
    # Without building the index, search should catch exceptions and return ""
    with patch.object(retriever, "_store", None):
        with patch.object(retriever, "_build", side_effect=Exception("index unavailable")):
            result = retriever.search("anything")
            assert isinstance(result, str)
