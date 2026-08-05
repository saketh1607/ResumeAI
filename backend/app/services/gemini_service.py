import json
import re
import time
from functools import lru_cache
from typing import Any

import google.generativeai as genai
from loguru import logger

from app.config import get_settings

settings = get_settings()

# Free-tier friendly models first (lighter quota use)
PREFERRED_MODELS = (
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash-002",
)

# Fallback order when current model hits 429 quota
QUOTA_FALLBACK_MODELS = (
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-lite-001",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
)


def _normalize_model_name(name: str) -> str:
    return name.removeprefix("models/")


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "quota" in msg or "rate" in msg or "resource_exhausted" in msg


def _retry_delay_seconds(exc: Exception) -> float:
    match = re.search(r"retry in ([\d.]+)s", str(exc), re.IGNORECASE)
    if match:
        return min(float(match.group(1)) + 1.0, 60.0)
    return 12.0


@lru_cache(maxsize=1)
def _discover_available_models() -> tuple[str, ...]:
    available: list[str] = []
    try:
        for model in genai.list_models():
            methods = getattr(model, "supported_generation_methods", None) or []
            if "generateContent" not in methods:
                continue
            short = _normalize_model_name(model.name)
            if short and short not in available:
                available.append(short)
    except Exception as exc:
        logger.warning(f"Could not list Gemini models: {exc}")
    return tuple(available)


def _pick_model(requested: str) -> str:
    available = _discover_available_models()
    requested = _normalize_model_name(requested.strip())

    if available:
        if requested in available:
            return requested
        for preferred in PREFERRED_MODELS:
            if preferred in available:
                logger.info(f"Using Gemini model: {preferred}")
                return preferred
        for name in available:
            if "flash" in name.lower() and "lite" in name.lower():
                return name
        for name in available:
            if "flash" in name.lower():
                return name
        return available[0]

    for name in (requested, *PREFERRED_MODELS):
        if name:
            return name
    return "gemini-2.0-flash-lite"


class GeminiService:
    def __init__(self) -> None:
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
        self._resolved_model: str | None = None
        self._quota_blocked: set[str] = set()

    @property
    def model_name(self) -> str:
        if not self._resolved_model:
            self._resolved_model = _pick_model(settings.gemini_model)
        return self._resolved_model

    def _models_to_try(self) -> list[str]:
        primary = self.model_name
        candidates = [primary]
        for m in QUOTA_FALLBACK_MODELS:
            if m not in candidates and m not in self._quota_blocked:
                candidates.append(m)
        available = set(_discover_available_models())
        if available:
            candidates = [c for c in candidates if c in available]
        return candidates or [primary]

    def _call_model(self, model_name: str, prompt: str, temperature: float) -> str:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": temperature,
                "max_output_tokens": 4096,
            },
        )
        if not response.text:
            raise ValueError("Gemini returned an empty response")
        return response.text

    def generate(self, prompt: str, temperature: float = 0.3) -> str:
        if not settings.gemini_api_key:
            raise ValueError(
                "GEMINI_API_KEY is not set. Add it to backend/.env and restart the server."
            )

        last_error: Exception | None = None
        for model_name in self._models_to_try():
            for attempt in range(2):
                try:
                    text = self._call_model(model_name, prompt, temperature)
                    self._resolved_model = model_name
                    return text
                except Exception as exc:
                    last_error = exc
                    if _is_quota_error(exc):
                        self._quota_blocked.add(model_name)
                        logger.warning(f"Quota/rate limit on {model_name}: {exc}")
                        if attempt == 0:
                            delay = _retry_delay_seconds(exc)
                            logger.info(f"Waiting {delay:.0f}s before retry...")
                            time.sleep(delay)
                            continue
                        break  # try next model
                    raise

        available = _discover_available_models()
        hint = ", ".join(available[:8]) if available else "gemini-2.0-flash-lite"
        raise ValueError(
            f"Gemini quota exceeded or unavailable ({last_error}). "
            "Wait a few minutes, switch GEMINI_MODEL=gemini-2.0-flash-lite in .env, "
            "or create a new API key from another Google account. "
            f"Models you can try: {hint}"
        ) from last_error

    def generate_json(self, prompt: str) -> dict[str, Any]:
        text = self.generate(prompt + "\n\nRespond with valid JSON only, no markdown.")
        cleaned = re.sub(r"^```json\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise ValueError("Failed to parse Gemini JSON response") from None


gemini_service = GeminiService()
