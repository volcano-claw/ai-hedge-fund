"""Runtime LLM configuration helpers.

This module intentionally does not hardcode a concrete model. Defaults can come
from environment variables or from a JSON config file, and callers can override
per action/agent.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class ModelSelection:
    model_name: str | None = None
    model_provider: str | None = None

    @classmethod
    def from_mapping(cls, data: dict[str, Any] | None) -> "ModelSelection":
        if not data:
            return cls()
        return cls(
            model_name=data.get("model_name") or data.get("model"),
            model_provider=data.get("model_provider") or data.get("provider"),
        )

    def as_tuple(self) -> tuple[str | None, str | None]:
        return self.model_name, self.model_provider


@dataclass(frozen=True)
class LLMRuntimeConfig:
    default: ModelSelection = field(default_factory=ModelSelection)
    actions: dict[str, ModelSelection] = field(default_factory=dict)


def _load_json_file(path: str | None) -> dict[str, Any]:
    if not path:
        return {}
    config_path = Path(path).expanduser()
    if not config_path.exists():
        raise FileNotFoundError(f"LLM config file not found: {config_path}")
    with config_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("LLM config file must contain a JSON object")
    return data


def _load_json_env(name: str) -> dict[str, Any]:
    raw = os.getenv(name)
    if not raw:
        return {}
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError(f"{name} must contain a JSON object")
    return data


def load_llm_runtime_config() -> LLMRuntimeConfig:
    """Load model routing from env/file.

    Supported inputs:
    - VOLCANO_LLM_CONFIG_FILE: JSON file with {"default": ..., "actions": ...}
    - VOLCANO_LLM_DEFAULT_MODEL_NAME / VOLCANO_LLM_DEFAULT_MODEL_PROVIDER
    - VOLCANO_LLM_ACTION_CONFIG_JSON: JSON object keyed by action/agent name
    """

    file_config = _load_json_file(os.getenv("VOLCANO_LLM_CONFIG_FILE"))
    env_actions = _load_json_env("VOLCANO_LLM_ACTION_CONFIG_JSON")

    file_default = ModelSelection.from_mapping(file_config.get("default"))
    env_default = ModelSelection(
        model_name=os.getenv("VOLCANO_LLM_DEFAULT_MODEL_NAME") or None,
        model_provider=os.getenv("VOLCANO_LLM_DEFAULT_MODEL_PROVIDER") or None,
    )

    default = ModelSelection(
        model_name=env_default.model_name or file_default.model_name,
        model_provider=env_default.model_provider or file_default.model_provider,
    )

    file_actions = file_config.get("actions") or {}
    if not isinstance(file_actions, dict):
        raise ValueError("LLM config 'actions' must be a JSON object")

    merged_actions = {**file_actions, **env_actions}
    actions = {
        action: ModelSelection.from_mapping(selection)
        for action, selection in merged_actions.items()
        if isinstance(selection, dict)
    }

    return LLMRuntimeConfig(default=default, actions=actions)


def get_action_model_config(
    action_name: str | None,
    *,
    config: LLMRuntimeConfig | None = None,
) -> tuple[str | None, str | None]:
    """Resolve a model/provider for one action.

    Returns (None, None) when the runtime has not been configured. The caller can
    then fail with a clear message or ask the user to choose; it must not invent a
    concrete model.
    """

    runtime_config = config or load_llm_runtime_config()
    if action_name and action_name in runtime_config.actions:
        action_selection = runtime_config.actions[action_name]
        return (
            action_selection.model_name or runtime_config.default.model_name,
            action_selection.model_provider or runtime_config.default.model_provider,
        )
    return runtime_config.default.as_tuple()
