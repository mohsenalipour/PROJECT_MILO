"""Terminal entry point for MILO_COMM."""

from __future__ import annotations

import sys
from collections.abc import Callable

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .chat import ChatSession, OpenAIProvider
from .config import load_settings
from .errors import ConfigError, MiloError

HELP_TEXT = (
    "Commands: /help show help | /history show conversation | "
    "/clear start a new conversation | exit or quit close MILO"
)
EXIT_COMMANDS = {"exit", "quit", "خروج"}


def configure_utf8_stdio() -> None:
    """Keep Unicode input/output reliable on Windows terminals and pipes."""
    for stream in (sys.stdin, sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            reconfigure(encoding="utf-8", errors="replace")


def run_repl(
    session: ChatSession,
    *,
    input_fn: Callable[[str], str] = input,
    output_fn: Callable[[str], None] | None = None,
) -> None:
    console = Console()
    emit = output_fn or console.print
    if output_fn is None:
        console.print(
            Panel.fit(
                "[bold #83f0a5]MILO_COMM[/]\n[dim]PROJECT_MILO · secure streaming channel[/]",
                border_style="#3ddc84",
                padding=(1, 4),
            )
        )
        console.print("[dim]Type /help to see the available commands.[/]\n")
    else:
        emit("MILO_COMM is ready. Type /help for commands.")

    while True:
        try:
            raw = (
                console.input("[bold #83f0a5]YOU[/] [dim]›[/] ")
                if output_fn is None and input_fn is input
                else input_fn("YOU: ")
            )
        except (EOFError, KeyboardInterrupt):
            emit("\nGoodbye!")
            return

        command = raw.strip().lower()
        if command in EXIT_COMMANDS:
            emit("Goodbye!")
            return
        if command == "/help":
            emit(HELP_TEXT)
            continue
        if command == "/clear":
            session.clear()
            emit("Conversation cleared. Start a new message.")
            continue
        if command == "/history":
            if not session.history:
                emit("Conversation history is empty.")
            elif output_fn is None:
                table = Table(show_header=False, box=None, pad_edge=False)
                table.add_column(style="bold #83f0a5", no_wrap=True)
                table.add_column()
                for message in session.history:
                    table.add_row("YOU" if message.role == "user" else "MILO", message.content)
                console.print(Panel(table, title="HISTORY", border_style="#315c43"))
            else:
                for message in session.history:
                    emit(f"{'YOU' if message.role == 'user' else 'MILO'}: {message.content}")
            continue

        try:
            if output_fn is None:
                console.print("[bold #83f0a5]MILO[/] [dim]›[/] ", end="")
                for delta in session.send_stream(raw):
                    console.print(delta, end="", markup=False, highlight=False)
                console.print()
            else:
                response = session.send(raw)
                emit(f"MILO: {response.content}")
        except MiloError as error:
            if output_fn is None:
                console.print()
                console.print(f"[bold red]ERROR:[/] {error.user_message}")
            else:
                emit(f"ERROR: {error.user_message}")
            continue


def main() -> int:
    configure_utf8_stdio()
    try:
        settings = load_settings()
    except ConfigError as error:
        print(f"ERROR: {error.user_message}")
        return 1

    run_repl(ChatSession(OpenAIProvider(settings)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
