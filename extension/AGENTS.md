# Repository Guidelines

## Project Structure & Module Organization
- Product scope lives in `../docs/prd/v0.1.md` (versioned per milestone). Keep plans in `../docs/plans/`.
- Extension code sits in `extension/`: `manifest.json`, `src/` domains (`content`, `background`, `popup`, `options`, `shared`), `scripts/` for tooling, `dist/` for builds, `assets/` for icons if added.
- Share utilities (storage, API client, selectors) in `src/shared/` to avoid duplication between popup and content scripts.
- Place unit/integration tests in `tests/` and browser-driven checks (e.g., Playwright) in `e2e/`. Build artifacts should emit to `dist/` only.

## Build, Test, and Development Commands
- From `extension/`: `npm install` (or `pnpm i`), then `npm run dev` (watch) or `npm run build` (prod) to `dist/`.
- Lint/format: `npm run lint` (and `npm run format` if configured).
- Tests: `npm test` for unit/integration; `npm run e2e` for browser automation once added. Align package scripts to these names when introducing tooling.

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
- Canonical flow: content script reads the prompt → sends `OPTIMIZE_PROMPT` to background → background pulls config from storage → calls the LLM endpoint → returns optimized text → content script writes back to the target input. Popup and options share the same message contract and storage utilities.
