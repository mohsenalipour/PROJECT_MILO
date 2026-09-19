"""Safe, user-facing error translation."""

from __future__ import annotations

from dataclasses import dataclass

import openai


@dataclass(eq=False)
class MiloError(Exception):
    code: str
    user_message: str
    retryable: bool = False

    def __str__(self) -> str:
        return self.user_message


class ConfigError(MiloError):
    def __init__(self, message: str = "تنظیمات سرویس کامل نیست؛ فایل `.env` را بررسی کنید."):
        super().__init__("CONFIG_MISSING", message, False)


def translate_provider_error(error: Exception) -> MiloError:
    """Convert SDK/network failures without exposing raw provider details."""
    if isinstance(error, openai.AuthenticationError):
        return MiloError("AUTH_FAILED", "کلید API پذیرفته نشد؛ تنظیمات را بررسی کنید.")
    if isinstance(error, (openai.BadRequestError, openai.NotFoundError)):
        return MiloError(
            "MODEL_NOT_FOUND",
            "شناسهٔ مدل یا نشانی سرویس برای این ارائه‌دهنده معتبر نیست.",
        )
    if isinstance(error, openai.RateLimitError):
        return MiloError(
            "RATE_LIMITED",
            "سرویس موقتاً شلوغ است یا اعتبار کافی نیست؛ کمی بعد دوباره تلاش کنید.",
            True,
        )
    if isinstance(error, (openai.APITimeoutError, openai.APIConnectionError)):
        return MiloError(
            "PROVIDER_TIMEOUT",
            "ارتباط با سرویس برقرار نشد؛ اینترنت و Base URL را بررسی کنید.",
            True,
        )
    return MiloError(
        "PROVIDER_ERROR",
        "سرویس مدل پاسخ معتبری نداد؛ کمی بعد دوباره تلاش کنید.",
        True,
    )
