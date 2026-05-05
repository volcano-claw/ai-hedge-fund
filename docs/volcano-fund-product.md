# Volcano Fund product surface

## Current live slice

Volcano Fund has a branded private landing surface on top of the existing AI Hedge Fund workflow UI.

The landing now includes a guided research brief panel with **server-side persistence**. It lets the operator choose a template, edit the owner, edit the ticker watchlist, write a research question, save the draft to the backend, reload recent briefs from server history, and create/open a real workflow tab seeded from that brief.

Live URL:

- `https://volcanofund.heiries.fr`

The surface is intentionally positioned as an **AI investment research cockpit** for Raphaël and Alix, not as a trading or investment-advice product.

## What changed

- Browser title changed from `AI Hedge Fund` to `Volcano Fund`.
- Empty workspace welcome screen presents Volcano Fund branding, status, and private-access framing.
- Landing screen includes research brief templates for Raphaël and Alix, editable tickers, editable owner, a generated run draft, and a `Créer et ouvrir le flow` action.
- Research briefs are persisted server-side through `POST/GET/PUT/DELETE /research-briefs/`.
- The brief panel loads recent server history and can restore a recent brief into the form.
- The create/open action saves or updates the server brief, creates a real flow through `/flows/`, then links the brief to the generated `flow_id` with status `flow_created`.
- Generated flows include a seeded Stock Input node, analyst nodes, Portfolio Manager node, edges, tags, and brief metadata.
- Top bar shows a compact Volcano Fund mark.
- Existing flow workspace, sidebars, tabs, settings, backend API, and runtime ports remain unchanged.

## Product truth

Current status:

- Private access: Caddy Basic Auth.
- Runtime: backend and UI are Docker/Compose managed and healthy.
- Health: backend exposes `GET /healthz`; UI exposes `GET /healthz`.
- Brief persistence: server-side SQLite table `volcano_research_briefs` plus local browser backup.
- Flow persistence: existing server-side `/flows/` storage.
- Trading: no real trading execution is enabled.

This is still a research/education cockpit. A future application-auth slice may add real in-app users, roles, sessions, and audit trails.

## Next recommended slice

Build the next Volcano Fund run-history slice:

1. show linked flow/run status next to each saved brief,
2. add a dedicated run review/history panel for Raphaël and Alix,
3. add editable analyst presets per brief template,
4. connect accepted briefs to execution preparation and reviewed run status,
5. then app-level auth if multi-user usage becomes important.
