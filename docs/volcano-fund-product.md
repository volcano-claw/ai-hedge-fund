# Volcano Fund product surface

## Current live slice

Volcano Fund now has a first branded private landing surface on top of the existing AI Hedge Fund workflow UI.

A guided research brief panel is available on the landing surface. It lets the operator choose a template, edit the owner, edit the ticker watchlist, write a research question, and create/open a real workflow tab seeded from that brief. The draft brief itself is still persisted in browser local storage only; created flows are persisted through the existing `/flows/` backend API.

Live URL:

- `https://volcanofund.heiries.fr`

The surface is intentionally positioned as an **AI investment research cockpit** for Raphaël and Alix, not as a trading or investment-advice product.

## What changed

- Browser title changed from `AI Hedge Fund` to `Volcano Fund`.
- Empty workspace welcome screen now presents Volcano Fund branding, status, and private-access framing.
- Landing screen includes research brief templates for Raphaël and Alix, editable tickers, editable owner, a generated run draft, and a `Créer et ouvrir le flow` action.
- The create/open action persists a real flow through the backend with a seeded Stock Input node, analyst nodes, Portfolio Manager node, edges, tags, and brief metadata.
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

Build the next Volcano Fund persistence/history slice:

1. persist research brief drafts server-side before flow creation,
2. add a brief/run history panel for Raphaël and Alix,
3. add editable run templates and analyst presets,
4. connect accepted briefs to execution preparation and reviewed run status,
5. then app-level auth if multi-user usage becomes important.
