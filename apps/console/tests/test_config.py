import pytest

from milo_console.config import load_settings
from milo_console.errors import ConfigError


def test_missing_required_settings_are_reported(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_MODEL", raising=False)
    monkeypatch.delenv("OPENAI_BASE_URL", raising=False)

    with pytest.raises(ConfigError) as raised:
        load_settings(load_env_file=False)

    assert "OPENAI_API_KEY" in raised.value.user_message
    assert "OPENAI_MODEL" in raised.value.user_message


def test_optional_base_url_is_not_required(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-only-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setenv("OPENAI_BASE_URL", "")

    settings = load_settings(load_env_file=False)

    assert settings.base_url is None


def test_invalid_base_url_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-only-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setenv("OPENAI_BASE_URL", "not-a-url")

    with pytest.raises(ConfigError):
        load_settings(load_env_file=False)

