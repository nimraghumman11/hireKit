from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_base_url: str | None = Field(
        default=None,
        description="Override OpenAI API base URL (Azure / proxy / local). Must resolve inside Docker.",
    )
    anthropic_api_key: str = ""
    faiss_index_path: str = "./data/faiss_index"
    pdf_storage_path: str = "./data/pdfs"
    #: Override RAG seed documents directory (default: ``app/retrieval/docs``). Env: ``RAG_DOCS_DIR``.
    rag_docs_dir: str = ""
    ai_service_base_url: str = "http://localhost:8000"
    llm_provider: str = "openai"  # "openai" or "anthropic"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
