"""LangChain-like adapters for local authenticated CLI LLM providers.

These providers use the user's already-authenticated local CLI tools instead of
API keys. They are intentionally configurable: command templates, models,
timeouts, and prompts are supplied at runtime via model selection/env.
"""

from __future__ import annotations

import json
import os
import shlex
import subprocess
from dataclasses import dataclass, replace
from typing import Any

from pydantic import BaseModel


@dataclass
class CLIMessage:
    content: str


@dataclass
class CLIChatModel:
    provider_name: str
    model_name: str
    command_template: str
    timeout_seconds: int = 180
    structured_model: type[BaseModel] | None = None

    def with_structured_output(self, model: type[BaseModel], method: str | None = None) -> "CLIChatModel":
        return replace(self, structured_model=model)

    def invoke(self, prompt: Any) -> BaseModel | CLIMessage:
        prompt_text = self._stringify_prompt(prompt)
        if self.structured_model:
            prompt_text = self._append_json_instruction(prompt_text, self.structured_model)

        output = self._run_cli(prompt_text)
        if self.structured_model:
            return self.structured_model(**self._extract_json(output))
        return CLIMessage(content=output)

    def _run_cli(self, prompt_text: str) -> str:
        command = self.command_template.format(model=shlex.quote(self.model_name))
        completed = subprocess.run(
            command,
            input=prompt_text,
            text=True,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=self.timeout_seconds,
            check=False,
        )
        if completed.returncode != 0:
            stderr = completed.stderr.strip()
            raise RuntimeError(f"{self.provider_name} CLI failed with exit code {completed.returncode}: {stderr}")
        return completed.stdout.strip()

    @staticmethod
    def _stringify_prompt(prompt: Any) -> str:
        if isinstance(prompt, str):
            return prompt
        if isinstance(prompt, list):
            parts: list[str] = []
            for item in prompt:
                content = getattr(item, "content", None)
                if content is None and isinstance(item, dict):
                    content = item.get("content")
                parts.append(str(content if content is not None else item))
            return "\n\n".join(parts)
        return str(prompt)

    @staticmethod
    def _append_json_instruction(prompt_text: str, model: type[BaseModel]) -> str:
        schema = model.model_json_schema()
        return (
            f"{prompt_text}\n\n"
            "Return only valid JSON matching this schema. Do not include markdown fences or commentary.\n"
            f"JSON schema:\n{json.dumps(schema, ensure_ascii=False)}"
        )

    @staticmethod
    def _extract_json(content: str) -> dict[str, Any]:
        stripped = content.strip()
        try:
            parsed = json.loads(stripped)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

        start = stripped.find("{")
        if start == -1:
            raise ValueError("CLI provider did not return a JSON object")

        depth = 0
        for index, char in enumerate(stripped[start:], start):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    parsed = json.loads(stripped[start : index + 1])
                    if isinstance(parsed, dict):
                        return parsed
                    break
        raise ValueError("CLI provider response did not contain a valid JSON object")


def _timeout_from_env(name: str) -> int:
    value = os.getenv(name)
    if not value:
        return 180
    return int(value)


def create_codex_cli_model(model_name: str) -> CLIChatModel:
    command_template = os.getenv("VOLCANO_CODEX_CLI_COMMAND", "codex exec -m {model} -")
    return CLIChatModel(
        provider_name="Codex CLI",
        model_name=model_name,
        command_template=command_template,
        timeout_seconds=_timeout_from_env("VOLCANO_CODEX_CLI_TIMEOUT_SECONDS"),
    )


def create_claude_cli_model(model_name: str) -> CLIChatModel:
    command_template = os.getenv("VOLCANO_CLAUDE_CLI_COMMAND", "claude -p --model {model}")
    return CLIChatModel(
        provider_name="Claude CLI",
        model_name=model_name,
        command_template=command_template,
        timeout_seconds=_timeout_from_env("VOLCANO_CLAUDE_CLI_TIMEOUT_SECONDS"),
    )
