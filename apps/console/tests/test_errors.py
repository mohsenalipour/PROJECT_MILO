from milo_console.errors import translate_provider_error


def test_unknown_provider_error_is_safe() -> None:
    secret = "TEST_SECRET_VALUE"

    result = translate_provider_error(RuntimeError(f"provider leaked {secret}"))

    assert result.code == "PROVIDER_ERROR"
    assert result.retryable is True
    assert secret not in result.user_message
