# Volcano Fund deployment security

## Current production access control

The public Volcano Fund UI is published at:

- `https://volcanofund.heiries.fr`

Access is protected at the reverse-proxy layer with Caddy Basic Auth.

Current accounts:

- `raphael` — admin/operator access
- `alix` — collaborator access

Secrets are not stored in this repository.

## Secret handling

Basic Auth passwords and generated hashes are infrastructure secrets and must remain outside Git.

Runtime credential material is stored on the server under `/opt/data/secrets/` and should never be copied into commits, tickets, chat messages, docs, or logs.

If credentials are exposed, rotate them immediately and reload Caddy.

## Protected surfaces

The proxy-level protection intentionally covers the full domain, including:

- `/`
- `/docs`
- `/openapi.json`
- `/language-models/`
- `/api-keys/`

This is a short-term production guardrail. A future application-level auth layer may add users, roles, sessions, audit logs, and per-user permissions inside the app itself.

## Runtime health checks

The backend exposes:

- `GET /healthz`

Expected response shape:

```json
{"ok": true, "service": "ai-hedge-fund-backend"}
```

The UI exposes:

- `GET /healthz`

Expected response body:

```txt
ok
```

The Compose healthcheck should use backend `/healthz`, not `/docs`, so operational health does not depend on the interactive OpenAPI documentation page.

## Deployment notes

Canonical runtime path on the server:

- repo: `/srv/openclaw/app/ai-hedge-fund`
- compose: `/srv/openclaw/app/docker-compose.yml`
- backend local port: `127.0.0.1:3021`
- UI local port: `127.0.0.1:3020`
- Caddy public route: `volcanofund.heiries.fr -> 127.0.0.1:3020`

Canonical DNS:

- `volcanofund.heiries.fr A 212.227.39.195`
- no stale `AAAA` record unless it points to the active VPS IPv6
