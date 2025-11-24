# Repository Guidelines

## Project Structure & Module Organization
- Reference product scope in `PRD.md`; treat it as the source of truth for flows and acceptance criteria.
- Keep extension code under `src/` with clear domains: `src/content/` (DOM hooks, `findPromptInput()`), `src/background/` (LLM requests, message routing), `src/popup/` and `src/options/` (UI), plus `manifest.json` at the root and `assets/` for icons.
- Share utilities (storage, API client, selectors) in `src/shared/` to avoid duplicating logic between popup and content scripts.
- Place unit/integration tests in `tests/` and any browser-driven checks (e.g., Playwright) in `e2e/`. Build artifacts should emit to `dist/` only.

## Build, Test, and Development Commands
- Install dependencies: `npm install` (prefer `pnpm i` if a lockfile is added).
- Local dev bundle (watch mode): `npm run dev` → writes to `dist/` for loading as an unpacked extension.
- Production bundle: `npm run build` → optimized output in `dist/`.
- Lint/format: `npm run lint` (and `npm run format` if configured).
- Tests: `npm test` for unit/integration; `npm run e2e` for browser automation once added. If a command is missing, align package scripts to these names when introducing the toolchain.

## Coding Style & Naming Conventions
- Use TypeScript for new code; ES modules only. Indent with 2 spaces, LF line endings.
- Filenames: `kebab-case` for scripts/styles (`find-prompt-input.ts`), `PascalCase` for React-like components if introduced.
- Prefer small, pure helpers; keep DOM selectors centralized (e.g., `src/shared/selectors.ts`).
- Keep comments focused on non-obvious decisions; avoid logging API keys or full prompts in production builds.

## Testing Guidelines
- Unit tests: name files `*.test.ts`; cover message payload shapes and storage helpers.
- Integration/UI: exercise popup/options flows and the content-script button states. Add Playwright specs under `e2e/` for host sites noted in `PRD.md`.
- Manual smoke before PR: load unpacked extension, validate ChatGPT input optimization, and confirm API-key error messaging.
- Aim for coverage on LLM request/response handling and DOM mounting fallbacks (MutationObserver).

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat: add content-script mount`, `fix: handle missing textbox`, `chore: deps`). Keep scope small and reversible.
- PR checklist: brief summary, linked issue/task, test results (`npm test`, `npm run build`), and screenshots/GIFs for UI changes (popup/options/content button). Note which target hosts were manually verified.
- Keep diffs focused; avoid reformatting untouched files. Update `AGENTS.md` when process or commands change.

## Security & Configuration Tips
- Never commit API keys or model endpoints. Store secrets in `chrome.storage.local` and guard them from exposure to page scripts.
- If adding environment samples, use placeholders (e.g., `config.example.ts`) and document required fields in options UI.
- Strip verbose logging from production builds; ensure errors returned to the UI are generic and do not echo secrets.

## Architecture Overview
- Canonical flow: content script reads the prompt → sends `OPTIMIZE_PROMPT` to background → background pulls config from storage → calls the LLM endpoint → returns optimized text → content script writes back to the target input. Popup and options share the same message contract and storage utilities.***
