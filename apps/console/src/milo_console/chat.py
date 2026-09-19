"""Provider adapter and in-memory conversation state."""

from __future__ import annotations

from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from typing import Literal, Protocol

from openai import OpenAI

from .config import Settings
from .errors import MiloError, translate_provider_error

SYSTEM_PROMPT = (
    "You are MILO, the helpful AI companion of PROJECT_MILO. "
    "Always speak as MILO in the first person and never claim to be another assistant. "
    "Always reply in English because this console targets terminals without reliable "
    "bidirectional text support. Be warm, clear and concise, and never pretend "
    "that you performed actions you did not perform."
)
MAX_MESSAGES = 20
MAX_CONTENT_LENGTH = 4_000


@dataclass(frozen=True, slots=True)
class Message:
    role: Literal["user", "assistant"]
    content: str


class Provider(Protocol):
    def stream(self, messages: Sequence[Message]) -> Iterator[str]: ...


class OpenAIProvider:
    """Keep Responses-vs-Chat-Completions details behind one interface."""

    def __init__(self, settings: Settings, *, client: OpenAI | None = None) -> None:
        self.settings = settings
        if client is not None:
            self.client = client
            return

        client_options: dict[str, object] = {
            "api_key": settings.api_key,
            "timeout": 30.0,
            "max_retries": 0,
        }
        if settings.base_url:
            client_options["base_url"] = settings.base_url
        self.client = OpenAI(**client_options)

    def stream(self, messages: Sequence[Message]) -> Iterator[str]:
        safe_messages = list(messages)[-MAX_MESSAGES:]
        emitted = False
        try:
            if self.settings.base_url:
                stream = self.client.chat.completions.create(
                    model=self.settings.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        *[
                            {"role": message.role, "content": message.content}
                            for message in safe_messages
                        ],
                    ],
                    stream=True,
                )
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    content = chunk.choices[0].delta.content
                    if content:
                        emitted = True
                        yield content
            else:
                stream = self.client.responses.create(
                    model=self.settings.model,
                    instructions=SYSTEM_PROMPT,
                    input=[
                        {"role": message.role, "content": message.content}
                        for message in safe_messages
                    ],
                    stream=True,
                )
                for event in stream:
                    if event.type == "response.output_text.delta" and event.delta:
                        emitted = True
                        yield event.delta
                    elif event.type == "response.refusal.delta" and event.delta:
                        emitted = True
                        yield event.delta
        except MiloError:
            raise
        except Exception as error:
            raise translate_provider_error(error) from None

        if not emitted:
            raise MiloError(
                "PROVIDER_ERROR",
                "The model did not return a valid text response. Please try again.",
                True,
            )

    def complete(self, messages: Sequence[Message]) -> str:
        """Non-streaming convenience wrapper used by tests and integrations."""
        return "".join(self.stream(messages)).strip()


class ChatSession:
    def __init__(self, provider: Provider) -> None:
        self.provider = provider
        self.history: list[Message] = []

    def send(self, content: str) -> Message:
        return Message("assistant", "".join(self.send_stream(content)).strip())

    def send_stream(self, content: str) -> Iterator[str]:
        clean_content = content.strip()
        if not clean_content:
            raise MiloError("INVALID_INPUT", "The message cannot be empty.")
        if len(clean_content) > MAX_CONTENT_LENGTH:
            raise MiloError(
                "INVALID_INPUT",
                f"The message must be at most {MAX_CONTENT_LENGTH} characters.",
            )

        user_message = Message("user", clean_content)
        request_messages = [*self.history[-(MAX_MESSAGES - 1) :], user_message]
        chunks: list[str] = []
        for chunk in self.provider.stream(request_messages):
            if chunk:
                chunks.append(chunk)
                yield chunk

        answer = "".join(chunks).strip()
        if not answer:
            raise MiloError(
                "PROVIDER_ERROR",
                "The model did not return a valid text response. Please try again.",
                True,
            )
        assistant_message = Message("assistant", answer)
        self.history.extend((user_message, assistant_message))
        self.history = self.history[-MAX_MESSAGES:]

    def clear(self) -> None:
        self.history.clear()
