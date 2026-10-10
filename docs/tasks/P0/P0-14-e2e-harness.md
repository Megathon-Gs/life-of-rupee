# Task brief: E2E harness and CI quality gates

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-14 · Depends on: P0-01

## Target
`playwright.config.ts`, `tests/e2e/harness/**`, `tests/e2e/smoke.spec.ts`, `tests/privacy/**`, `lighthouserc.json`, `.github/workflows/e2e.yml`

## Change
- Playwright projects: `phone-small` 360×740 touch (Android UA), `phone-large` 412×915 touch, `desktop` 1440×900. `webServer` runs `pnpm build && pnpm preview`.
- Harness helpers: `swipe(page, dir, px)`, `wheelBurst(page, events, deltaPx, ms)`, `gotoTestMode(page, path)` (appends `?test=1`), `expectNoAxeViolations(page)`, `measureFps(page, fn)` (rAF counter under 4× CPU throttle via CDP).
- `tests/privacy/network-allowlist.ts` — fixture that records every request and fails the test on any origin other than the app's own.
- `lighthouserc.json` — mobile preset; budgets: initial JS ≤ 250 KB gzipped, LCP ≤ 2.5 s.
- `.github/workflows/e2e.yml` — separate workflow running `pnpm e2e` and Lighthouse CI on PRs.
- `tests/e2e/smoke.spec.ts` — loads the app on all 3 projects with the allowlist fixture.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Testing, quality gates and demo
- Do-not-touch: `.github/workflows/ci.yml`, `src/**`, `package.json`
- Allowed dependencies: @playwright/test, @axe-core/playwright, @lhci/cli (installed)
- Non-goals: no feature tests (P0-23)

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e` runs the smoke test green on all 3 projects
- [ ] A temporary `fetch('https://example.com')` in a fixture page makes the allowlist test fail (shown in PR, then removed)
- [ ] `npx lhci autorun` runs locally against the build and reports the budgets
- [ ] `e2e.yml` is green on the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
