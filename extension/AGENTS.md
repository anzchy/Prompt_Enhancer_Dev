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

## Site Handler Pattern (Content Script Multi-Site Support)

The content script uses a handler-based architecture to support multiple chat platforms:

### Handler Structure
- **Location**: `src/content/sites/` - each site gets its own handler file
  - `chatgpt.ts` - ChatGPT handler
  - `manus.ts` - Manus.im handler
  - `gemini.ts` - Gemini handler
- **Interface**: All handlers implement `SiteHandler` interface defined in `src/content/shared/types.ts`
- **Base Class**: `BaseSiteHandler` provides common functionality (selector matching, strategy logging)

### How to Add Support for a New Site

1. **Create handler file** in `src/content/sites/newsite.ts`:
   ```typescript
   import { BaseSiteHandler } from '../shared/types';

   export class NewSiteHandler extends BaseSiteHandler {
     hostPatterns = ['newsite.com'];
     name = 'NewSite';
     inputSelectors = [
       'textarea[placeholder="..."]',  // Priority 1: Most specific
       'textarea',                     // Priority 2: Fallback
     ];

     insertButton(button: HTMLButtonElement, input: HTMLElement): boolean {
       // Strategy 1: Ideal placement
       // Strategy 2: Acceptable placement
       // Strategy 3+: Last resorts
     }
   }
   ```

2. **Update manifest.json** - add host permissions:
   ```json
   "host_permissions": [
     "https://newsite.com/*"
   ]
   ```

3. **Import in index.ts** and add to handlers array:
   ```typescript
   import { NewSiteHandler } from './sites/newsite.ts';

   const handlers: SiteHandler[] = [
     new ChatGptHandler(),
     new ManusHandler(),
     new GeminiHandler(),
     new NewSiteHandler()
   ];
   ```

4. **Test**:
   - Run `npm run build` to verify compilation
   - Load unpacked extension (`extension/dist/`)
   - Navigate to newsite.com and verify button appears
   - Test prompt optimization works end-to-end
   - Verify fallback strategies work (check console logs)

### Fallback Strategy Pattern

Each site implements multiple insertion strategies to handle DOM variations:

**Example: ChatGPT (4-level fallback)**
1. Find specific button (composer-plus-btn) and append next to it
2. Find grid-area container and append to flex element
3. Insert before target's parent element
4. Use insertAdjacentElement as last resort

**Example: Manus (4-level fallback)**
1. Find flex container with buttons, insert next to plus button
2. Append to flex.gap-2.items-center container
3. Append to action bar (.px-3.flex.gap-2)
4. Insert before textarea parent

**Example: Gemini (5-level fallback)**
1. Find leading-actions-wrapper, insert after upload button
2. Append to leading-actions-wrapper
3. Insert after rich-textarea in text-input-field wrapper
4. Insert before ql-editor parent
5. Use insertAdjacentElement as fallback

Each strategy is logged to console for debugging (`Strategy N succeeded/failed`)

### Input Selector Priority

Handlers define `inputSelectors` array with priority order:
- **Index 0**: Most specific selector (exact attribute match)
- **Middle indices**: Partial matches with `*=` operator for robustness
- **Last index**: Generic fallback that always matches

Example (Manus):
```typescript
inputSelectors = [
  'textarea[placeholder="Assign a task or ask anything"]',  // Exact
  'textarea[placeholder*="Assign"]',                         // Partial
  'textarea[placeholder*="ask"]',                            // Partial (case-insensitive)
  'textarea'                                                  // Generic fallback
];
```

This ensures robustness against placeholder text changes (i18n, UI updates) while maintaining preferential matching for current selectors.

### Custom Value Getters/Setters

Override `getPromptValue()` and `setPromptValue()` for non-standard input types:

**Example: Gemini Quill Editor**
```typescript
getPromptValue(el: HTMLElement): string {
  // Quill uses contenteditable div, not textarea
  return (el.textContent || '').trim();
}

setPromptValue(el: HTMLElement, value: string): void {
  // Update HTML and dispatch events for framework detection
  el.innerHTML = `<p>${escapeHtml(value)}</p>`;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
```
