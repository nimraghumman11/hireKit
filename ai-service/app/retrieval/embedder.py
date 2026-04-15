"""Embedding wrapper supporting sentence-transformers or OpenAI."""
from __future__ import annotations
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings
from config import get_settings
import logging

logger = logging.getLogger(__name__)


def get_embeddings():
    settings = get_settings()
    if settings.openai_api_key:
        logger.info("Using OpenAI embeddings (text-embedding-3-small)")
        return OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=settings.openai_api_key,
        )
    logger.info("Using sentence-transformers/all-MiniLM-L6-v2 (local)")
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
