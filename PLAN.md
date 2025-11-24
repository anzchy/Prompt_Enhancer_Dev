# Development Plan

## Goals
- Deliver a Chrome MV3 extension that optimizes prompts in-page and via popup, following the UX and acceptance criteria in `PRD.md`.
- Support configurable API base/model/system prompt; keep storage local/sync per sensitivity.
- Ship iteratively: MVP for ChatGPT, then expand to other hosts and UX polish.

## Scope & Milestones
- **v0.1 (MVP)**: Manifest + skeleton modules; options page for API/model/system prompt; background `OPTIMIZE_PROMPT` handler calling LLM; content script for chatgpt.com with button inject + writeback; popup flow (input → optimize → copy); basic error states; build pipeline to `dist/`.
- **v0.2 (Multi-host & UX)**: Extend selectors for manus.im and gemini.google.com; improve button styling + loading/toast; popup style presets; options UI for presets; resilience via `MutationObserver` and throttled retries.
- **v0.3 (Advanced/optional)**: Prompt diff view; shortcut trigger; lightweight local metrics; deeper error surfaces.

## Work Breakdown
1) **Project setup**: init repo/package, add `manifest.json`, base `src/` layout (`content/`, `background/`, `popup/`, `options/`, `shared/`), assets folder, build scripts (`npm run dev/build/lint/test`), env stubs.  
2) **Config & storage**: typed config models; chrome storage wrappers; options UI for API base/key/model/system prompt; validation + save/load.  
3) **Background service**: message contract; LLM client (OpenAI-style chat completions); error mapping; secret-safe logging.  
4) **Content script**: host-based `findPromptInput`; safe button injection; loading/error states; message send/receive; writeback with fallback positioning.  
5) **Popup**: dual textareas, optimize/clear/copy buttons; preset dropdown placeholder; message plumbing; empty-state handling.  
6) **Styles & assets**: light-touch CSS for button/popup/options; icons.  
7) **Testing & QA**: unit tests for storage, message schema, client; integration for popup/options flows; manual smoke on chatgpt.com; prep Playwright scaffolding for target hosts.

## Risks & Mitigations
- **Selector drift**: centralize selectors, add retries and observer-based remount.  
- **LLM errors/latency**: surface clear UI errors; timeouts and cancellation; guard empty responses.  
- **Key leakage**: keep keys in `chrome.storage.local`; avoid exposing to page context; strip verbose logs in prod.

## Delivery & Validation
- CI: lint, unit tests, build.  
- Manual: load unpacked `dist/`, verify acceptance criteria in `PRD.md` for chatgpt.com; capture GIFs for UI changes.  
- Update docs (`AGENTS.md`, this `PLAN.md`) when commands or flows change.***
