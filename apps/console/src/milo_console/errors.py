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
    def __init__(self, message: str = "Provider settings are incomplete. Check the .env file."):
        super().__init__("CONFIG_MISSING", message, False)


def translate_provider_error(error: Exception) -> MiloError:
    """Convert SDK/network failures without exposing raw provider details."""
    if isinstance(error, openai.AuthenticationError):
        return MiloError("AUTH_FAILED", "The API key was rejected. Check your settings.")
    if isinstance(error, (openai.BadRequestError, openai.NotFoundError)):
        return MiloError(
            "MODEL_NOT_FOUND",
            "The model ID or provider URL is not valid.",
        )
    if isinstance(error, openai.RateLimitError):
        return MiloError(
            "RATE_LIMITED",
            "The service is busy or has insufficient credit. Please try again later.",
            True,
        )
    if isinstance(error, (openai.APITimeoutError, openai.APIConnectionError)):
        return MiloError(
            "PROVIDER_TIMEOUT",
            "Could not reach the provider. Check your connection and Base URL.",
            True,
        )
    return MiloError(
        "PROVIDER_ERROR",
        "The model service did not return a valid response. Please try again later.",
        True,
    )
