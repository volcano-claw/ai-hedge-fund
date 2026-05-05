# Volcano Fund product surface

## Current live slice

Volcano Fund has a branded private landing surface on top of the existing AI Hedge Fund workflow UI.

The landing includes a guided research brief panel with **server-side persistence**, a lightweight **brief → flow → run history** view, and a persistent **operator run review** panel. It lets the operator choose a template, edit the owner, edit the ticker watchlist, write a research question, save the draft to the backend, reload recent briefs from server history, create/open a real workflow tab seeded from that brief, see linked flow/run status, and save review notes for the latest run.

Live URL:

- `https://volcanofund.heiries.fr`

The surface is intentionally positioned as an **AI investment research cockpit** for Raphaël and Alix, not as a trading or investment-advice product.

## What changed

- Browser title changed from `AI Hedge Fund` to `Volcano Fund`.
- Empty workspace welcome screen presents Volcano Fund branding, status, and private-access framing.
- Landing screen includes research brief templates for Raphaël and Alix, editable tickers, editable owner, a generated run draft, and a `Créer et ouvrir le flow` action.
- Research briefs are persisted server-side through `POST/GET/PUT/DELETE /research-briefs/`.
- Enriched history endpoint `GET /research-briefs/history/` returns each recent brief with linked `flow_name`, `run_count`, `latest_run_id`, `latest_run_status`, latest run timestamp, and review summary when available.
- Operator run reviews are persisted server-side through `GET/PUT/DELETE /run-reviews/{run_id}` in table `volcano_run_reviews`.
- The brief panel loads recent server history, can restore a recent brief into the form, displays linked flow/run status, and opens a review panel for the latest run.
- The run review panel stores `review_status`, `decision`, `reviewer`, and free-form notes.
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
- Run status: read-only aggregation from existing `/flows/{flow_id}/runs` data.
- Run review: operator notes/status persisted in `volcano_run_reviews`; this is human review metadata, not automated financial advice.
- Trading: no real trading execution is enabled.

This is still a research/education cockpit. A future application-auth slice may add real in-app users, roles, sessions, and audit trails.

## Next recommended slice

Build the next Volcano Fund results-review slice:

1. surface analyst outputs/results summary per run,
2. add a dedicated run detail/review drawer instead of only the landing panel,
3. add before/after decision snapshots for reviewed runs,
4. add editable analyst presets per brief template,
5. then app-level auth if multi-user usage becomes important.
