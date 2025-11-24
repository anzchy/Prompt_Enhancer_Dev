# Prompt Optimizer (Chrome MV3)

Optimize prompts inline on chat-based sites and via a popup. Targets `chatgpt.com`, `chat.openai.com`, `manus.im`, and `gemini.google.com` per `../docs/prd/v0.1.md`.

## Requirements
- Node.js 18+ and npm (or pnpm).
- Chrome (latest stable) for loading the unpacked extension.

## Project Structure (repo root)
- `docs/` — versioned PRDs and plans (`docs/prd/v0.1.md`, `docs/plans/v0.1-plan.md`), decisions/roadmap.
- `extension/` — extension codebase (this folder).
- Future builds: `extension/dist/` (output), `extension/tests`, `extension/e2e` (as added).

## Install (from `extension/`)
```bash
npm install
```

## Development (from `extension/`)
Bundle source to `dist/` for Chrome to load.
```bash
# Watch mode
npm run dev

# One-off build
npm run build

# Clean dist
npm run clean
```
Scripts `lint` and `test` are placeholders; add ESLint/Vitest/Playwright and update package scripts as tooling arrives.

## Source Layout (inside `extension/`)
- `manifest.json` — MV3 manifest.
- `src/` — code.
  - `background/` — service worker, LLM calls.
  - `content/` — DOM hooks, injects optimize button.
  - `popup/` — popup UI.
  - `options/` — options UI.
  - `shared/` — config, messages, LLM client.
- `scripts/build.js` — esbuild bundler (TS → `dist/`).
- `AGENTS.md` — contributor guide for this folder.

## Configure (Options Page)
1) Load the unpacked extension (see next section).  
2) In Chrome, `Extensions` → `Details` → `Extension options` (or open `chrome-extension://<id>/options.html`).  
3) Fill fields:
   - API Base URL (e.g., `https://api.openai.com/v1` or your proxy, no trailing slash).
   - API Key (stored in `chrome.storage.local`, not synced).
   - Model (e.g., `gpt-4.1-mini`).
   - System Prompt (default is a concise prompt-upgrader).
4) Save. Errors will display inline if storage fails.

### Model options
- Common picks: `gpt-4.1-mini` (default), `gpt-4.1`, `gpt-4.1-preview`.
- If your provider exposes GPT-5 family, set the Model field accordingly, e.g., `gpt-5` or `gpt-5-mini` (exact IDs depend on your API gateway). Use the model name exactly as your endpoint expects.

## Use in Chrome
1) From `extension/`, run `npm run build` (or `npm run dev` while working).  
2) Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `extension/dist/`.  
3) On supported sites, a pill button “优化指令” appears near the prompt box. Click to optimize the current text; it overwrites the field.  
4) Popup: click the toolbar icon, paste a prompt, hit “✨ 优化”, then copy or edit the result.  
5) If API key is missing or a request fails, inline errors are shown.

## Tips & Troubleshooting
- If selectors fail on a site, adjust them in `src/content/index.ts`.  
- To change default prompts or endpoints, update `src/shared/config.ts` defaults, rebuild, and reload.  
- For CORS or proxy issues, prefer a compatible OpenAI-style endpoint that accepts browser requests.  
- After code changes, rebuild and click “Reload” in `chrome://extensions` for the unpacked entry.  
- For milestone-specific scope or decisions, see `../docs/prd/` and `../docs/plans/`.
