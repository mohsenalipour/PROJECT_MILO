from collections.abc import Sequence

import pytest

from milo_console.chat import MAX_MESSAGES, ChatSession, Message
from milo_console.errors import MiloError


class FakeProvider:
    def __init__(self, answer: str = "پاسخ آزمایشی") -> None:
        self.answer = answer
        self.calls: list[list[Message]] = []

    def stream(self, messages: Sequence[Message]):
        self.calls.append(list(messages))
        midpoint = max(1, len(self.answer) // 2)
        yield self.answer[:midpoint]
        yield self.answer[midpoint:]


def test_empty_message_does_not_call_provider() -> None:
    provider = FakeProvider()
    session = ChatSession(provider)

    with pytest.raises(MiloError, match="empty"):
        session.send("   ")

    assert provider.calls == []
    assert session.history == []


def test_successful_exchange_is_added_to_history() -> None:
    provider = FakeProvider("سلام!")
    session = ChatSession(provider)

    response = session.send("  سلام  ")

    assert response == Message("assistant", "سلام!")
    assert session.history == [Message("user", "سلام"), response]


def test_failed_request_does_not_change_history() -> None:
    class FailingProvider:
        def stream(self, messages: Sequence[Message]):
            raise MiloError("PROVIDER_TIMEOUT", "ارتباط برقرار نشد", True)
            yield  # pragma: no cover

    session = ChatSession(FailingProvider())

    with pytest.raises(MiloError):
        session.send("سلام")

    assert session.history == []


def test_history_sent_to_provider_is_bounded() -> None:
    provider = FakeProvider()
    session = ChatSession(provider)

    for turn in range(12):
        session.send(f"پیام {turn}")

    assert len(session.history) == MAX_MESSAGES
    assert all(len(call) <= MAX_MESSAGES for call in provider.calls)


def test_clear_removes_history() -> None:
    session = ChatSession(FakeProvider())
    session.send("سلام")

    session.clear()

    assert session.history == []


def test_stream_yields_deltas_and_commits_only_after_completion() -> None:
    session = ChatSession(FakeProvider("مایلو اینجاست"))

    stream = session.send_stream("سلام")
    first = next(stream)

    assert first
    assert session.history == []
    assert first + "".join(stream) == "مایلو اینجاست"
    assert session.history[-1] == Message("assistant", "مایلو اینجاست")
