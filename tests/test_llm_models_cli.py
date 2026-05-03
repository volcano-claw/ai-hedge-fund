from src.llm.cli_providers import CLIChatModel
from src.llm.models import ModelProvider, get_model, get_model_info


def test_get_model_creates_codex_cli_provider_with_user_selected_model():
    model = get_model("gpt-user-choice", ModelProvider.CODEX_CLI)

    assert isinstance(model, CLIChatModel)
    assert model.provider_name == "Codex CLI"
    assert model.model_name == "gpt-user-choice"


def test_cli_custom_models_are_listed_for_ui_selection():
    assert get_model_info("-", "Codex CLI") is not None
    assert get_model_info("-", "Claude CLI") is not None
