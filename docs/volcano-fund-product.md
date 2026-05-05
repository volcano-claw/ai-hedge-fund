# Volcano Fund product surface

## Current live slice

Volcano Fund now has a first branded private landing surface on top of the existing AI Hedge Fund workflow UI.

Live URL:

- `https://volcanofund.heiries.fr`

The surface is intentionally positioned as an **AI investment research cockpit** for Raphaël and Alix, not as a trading or investment-advice product.

## What changed

- Browser title changed from `AI Hedge Fund` to `Volcano Fund`.
- Empty workspace welcome screen now presents Volcano Fund branding, status, and private-access framing.
- Top bar now shows a compact Volcano Fund mark.
- Existing flow workspace, sidebars, tabs, settings, backend API, and runtime ports remain unchanged.

## Product truth

Current status:

- Private access: Caddy Basic Auth.
- Runtime: backend and UI are Docker/Compose managed and healthy.
- Health: backend exposes `GET /healthz`; UI exposes `GET /healthz`.
- Trading: no real trading execution is enabled.

This is still a research/education cockpit. A future application-auth slice may add real in-app users, roles, sessions, and audit trails.

## Next recommended slice

Build a true Volcano Fund workspace entry flow:

1. a guided research brief panel,
2. predefined watchlists/tickers,
3. run templates for Raphaël and Alix,
4. persisted research notes/history,
5. then app-level auth if multi-user usage becomes important.
