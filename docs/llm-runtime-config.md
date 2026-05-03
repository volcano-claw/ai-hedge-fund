# LLM runtime configuration

Volcano Finance Lab must not hardcode a concrete LLM model in code. The model is selected by the caller, the UI, CLI flags, or runtime environment.

## Providers added by the Volcano fork

- `Codex CLI`: uses the locally authenticated `codex` CLI.
- `Claude CLI`: uses the locally authenticated `claude` CLI.

These providers are useful when the operator wants to use existing CLI/OAuth authentication instead of API keys.

## CLI usage

```bash
python src/main.py \
  --tickers AAPL,MSFT \
  --analysts-all \
  --model-provider "Codex CLI" \
  --model "gpt-5.5"
```

```bash
python src/main.py \
  --tickers AAPL,MSFT \
  --analysts risk_manager,portfolio_manager \
  --model-provider "Claude CLI" \
  --model "sonnet"
```

## Environment defaults

Use these only as runtime defaults. They are not required if the UI/API request supplies model selections.

```bash
export VOLCANO_LLM_DEFAULT_MODEL_PROVIDER="Codex CLI"
export VOLCANO_LLM_DEFAULT_MODEL_NAME="gpt-5.5"
```

## Per-action / per-agent routing

```bash
export VOLCANO_LLM_ACTION_CONFIG_JSON='{
  "risk_manager": {"model_provider": "Claude CLI", "model_name": "sonnet"},
  "portfolio_manager": {"model_provider": "Codex CLI", "model_name": "gpt-5.5"}
}'
```

Or use a file:

```bash
export VOLCANO_LLM_CONFIG_FILE=/app/config/llm-runtime.json
```

Example file:

```json
{
  "default": {
    "model_provider": "Codex CLI",
    "model_name": "gpt-5.4"
  },
  "actions": {
    "risk_manager": {
      "model_provider": "Claude CLI",
      "model_name": "sonnet"
    },
    "portfolio_manager": {
      "model_provider": "Codex CLI",
      "model_name": "gpt-5.5"
    }
  }
}
```

## CLI command templates

The default command templates are:

```bash
VOLCANO_CODEX_CLI_COMMAND='codex exec -m {model} -'
VOLCANO_CLAUDE_CLI_COMMAND='claude -p --model {model}'
```

Timeouts:

```bash
VOLCANO_CODEX_CLI_TIMEOUT_SECONDS=180
VOLCANO_CLAUDE_CLI_TIMEOUT_SECONDS=180
```

## Rule

No Python or frontend code should pick a concrete model like `gpt-*` or `claude-*` as a hidden default. If no model is supplied, the runtime returns a clear configuration error instead of silently choosing one.
