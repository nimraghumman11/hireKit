"""LLM factory — returns a fresh OpenAI or Anthropic chat model per call.

Note: We intentionally do NOT cache the model instance. When LLM calls run
in a thread-pool executor (via asyncio.run_in_executor), sharing a single
ChatOpenAI/ChatAnthropic instance across threads causes httpx connection-pool
conflicts and intermittent 'Connection error' failures.  A new instance per
call is cheap — the cost is negligible compared to the LLM round-trip.
"""
from __future__ import annotations
from config import get_settings


def get_llm(temperature: float = 0.3):
    settings = get_settings()
    if settings.anthropic_api_key and not settings.openai_api_key:
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model="claude-sonnet-4-6",
            anthropic_api_key=settings.anthropic_api_key,
            temperature=temperature,
        )
    from langchain_openai import ChatOpenAI

    # Bound HTTP wait so a bad API host / network issue fails in ~2m instead of hanging the
    # browser request (POST …/regenerate/… stays "pending" until upstream timeouts).
    kwargs: dict = {
        "model": "gpt-4o-mini",
        "openai_api_key": settings.openai_api_key,
        "temperature": temperature,
        "request_timeout": 120.0,
    }
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url.rstrip("/")
    return ChatOpenAI(**kwargs)
