from collections.abc import Sequence

from milo_console.chat import ChatSession, Message
from milo_console.main import run_repl


class FakeProvider:
    def stream(self, messages: Sequence[Message]):
        yield "باشه"


def test_clear_command_clears_the_active_session() -> None:
    session = ChatSession(FakeProvider())
    answers = iter(["سلام", "/clear", "exit"])
    output: list[str] = []

    run_repl(session, input_fn=lambda _: next(answers), output_fn=output.append)

    assert session.history == []
    assert any("تاریخچه پاک شد" in line for line in output)
