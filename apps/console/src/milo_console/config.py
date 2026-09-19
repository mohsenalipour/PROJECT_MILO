"""Environment configuration for the console application."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import load_dotenv

from .errors import ConfigError


@dataclass(frozen=True, slots=True)
class Settings:
    api_key: str
    model: str
    base_url: str | None = None


def load_settings(*, load_env_file: bool = True) -> Settings:
    """Load and validate the three supported environment variables."""
    if load_env_file:
        load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "").strip() or None

    missing: list[str] = []
    if not api_key:
        missing.append("OPENAI_API_KEY")
    if not model:
        missing.append("OPENAI_MODEL")
    if missing:
        raise ConfigError(f"تنظیمات الزامی کامل نیست: {', '.join(missing)}")

    if base_url:
        parsed = urlparse(base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ConfigError("مقدار OPENAI_BASE_URL باید یک نشانی معتبر http/https باشد.")

    return Settings(api_key=api_key, model=model, base_url=base_url)

