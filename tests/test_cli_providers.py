from pydantic import BaseModel

from src.llm.cli_providers import CLIChatModel


class Decision(BaseModel):
    signal: str
    confidence: float


def test_cli_provider_passes_selected_model_to_configured_command(monkeypatch):
    calls = {}

    def fake_run(command, input, text, shell, stdout, stderr, timeout, check):
        calls["command"] = command
        calls["input"] = input
        calls["timeout"] = timeout

        class Result:
            returncode = 0
            stdout = '{"signal":"bullish","confidence":0.7}'
            stderr = ""

        return Result()

    monkeypatch.setattr("subprocess.run", fake_run)

    model = CLIChatModel(
        provider_name="Codex CLI",
        model_name="user-selected-model",
        command_template="codex exec -m {model} -",
        timeout_seconds=12,
    ).with_structured_output(Decision)

    result = model.invoke("Analyse AAPL")

    assert calls["command"] == "codex exec -m user-selected-model -"
    assert calls["timeout"] == 12
    assert "Analyse AAPL" in calls["input"]
    assert result == Decision(signal="bullish", confidence=0.7)
