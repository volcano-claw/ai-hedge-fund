import json

from src.llm.config import get_action_model_config, load_llm_runtime_config


def test_action_config_uses_exact_action_override_without_hardcoded_default(monkeypatch):
    monkeypatch.setenv(
        "VOLCANO_LLM_ACTION_CONFIG_JSON",
        json.dumps(
            {
                "risk_manager": {
                    "model_name": "claude-custom-risk",
                    "model_provider": "Claude CLI",
                }
            }
        ),
    )
    monkeypatch.setenv("VOLCANO_LLM_DEFAULT_MODEL_NAME", "codex-default")
    monkeypatch.setenv("VOLCANO_LLM_DEFAULT_MODEL_PROVIDER", "Codex CLI")

    config = load_llm_runtime_config()

    assert get_action_model_config("risk_manager", config=config) == (
        "claude-custom-risk",
        "Claude CLI",
    )


def test_action_config_falls_back_to_env_default(monkeypatch):
    monkeypatch.delenv("VOLCANO_LLM_ACTION_CONFIG_JSON", raising=False)
    monkeypatch.setenv("VOLCANO_LLM_DEFAULT_MODEL_NAME", "gpt-user-selected")
    monkeypatch.setenv("VOLCANO_LLM_DEFAULT_MODEL_PROVIDER", "Codex CLI")

    assert get_action_model_config("portfolio_manager") == (
        "gpt-user-selected",
        "Codex CLI",
    )


def test_missing_runtime_default_returns_empty_values_not_a_hardcoded_model(monkeypatch):
    monkeypatch.delenv("VOLCANO_LLM_ACTION_CONFIG_JSON", raising=False)
    monkeypatch.delenv("VOLCANO_LLM_DEFAULT_MODEL_NAME", raising=False)
    monkeypatch.delenv("VOLCANO_LLM_DEFAULT_MODEL_PROVIDER", raising=False)

    assert get_action_model_config("unknown_action") == (None, None)
