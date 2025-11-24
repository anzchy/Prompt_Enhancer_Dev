# Prompt Optimizer Repository

Chrome MV3 extension that upgrades prompts inline and via a popup. Product scope and plans are versioned under `docs/`; code lives in `extension/`.

## Layout
- `docs/` — PRDs (`docs/prd/v0.1.md`), plans (`docs/plans/v0.1-plan.md`), decisions, roadmap.
- `extension/` — extension source, tooling, and build outputs (`dist/` after building).

## Quick Start
1) `cd extension && npm install`
2) `npm run build` (or `npm run dev` for watch) — outputs to `extension/dist/`
3) Load `extension/dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).
4) Configure API base/key/model/system prompt via the extension options page.

For development details and commands, see `extension/README.md` and contributor guide `extension/AGENTS.md`.
