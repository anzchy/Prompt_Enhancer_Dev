# How to Develop Like an Expert (Milestone Playbook)

## Versioned Scoping
- Keep each milestone frozen in its own PRD/plan: `docs/prd/v0.x.md`, `docs/plans/v0.x-plan.md`.
- When starting a new version, copy the prior files and trim only what carries forward; never rewrite history.
- Maintain a short `docs/roadmap.md` to show upcoming milestones and dependency ordering.

## Branching & PR Hygiene
- One branch per milestone or feature slice; keep diffs tight and reversible.
- Follow Conventional Commits and enforce PR checklists (scope summary, linked issue, test/build results, screenshots/GIFs for UI).
- Prefer small, fast PRs that land behind flags/config; avoid long-lived branches.

## Dev Loop
- Work inside `extension/`. Run `npm run dev` for watch; `npm run build` before loading unpacked.
- Add/maintain tooling: ESLint + Prettier, Vitest for units, Playwright for e2e; wire them into CI.
- Centralize selectors/config in `src/shared/` and keep content-script mounts resilient (MutationObserver + retries).

## Milestone Updates
- At milestone start: update `docs/prd/v0.x.md` and `docs/plans/v0.x-plan.md`; link them in `extension/README.md`.
- During execution: tick progress in the plan (✅/⬜), note risks, and capture decisions in `docs/decisions/adr-xxxx.md`.
- At milestone close: freeze PRD/plan, tag the repo, record release notes (changes, tests, known issues), and set next milestone’s PRD/plan drafts.

## Quality & Security
- Keep secrets in `chrome.storage.local`; never log keys or full prompts. Strip verbose logs in production builds.
- Test matrix: unit (shared logic), integration (popup/options flow), manual/e2e on target hosts (`chatgpt.com`, etc.). Fail fast on API errors and empty responses.
- Document any deviations from PRD/plan in the PR description; update docs immediately after merging.
