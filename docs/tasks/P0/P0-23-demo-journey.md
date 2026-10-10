# Task brief: Demo journey test and gate G0 ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-23 · Depends on: P0-14, P0-18, P0-21, P0-22 · Gate: product owner plays it on a real phone

## Target
`tests/e2e/demo-journey.spec.ts`, `tests/visual/**`, `docs/tasks/G0-checklist.md`

## Change
- Automate the demo journey from the technical plan on all 3 projects, against real Level 2 content:
  1. Fresh profile; one swipe → next building, never two.
  2. Arrive at the bank, enter, complete the lesson.
  3. Scripted mistake (from P0-18) → 2 stars and the matching review item.
  4. Retry → 3 stars; best 3, first attempt still 2.
  5. Skill node lit; teller variant visible.
  6. Reload → same location, stars, skill, town change.
  7. No request left the app's origin.
- Visual baselines (test mode) for street, bank panel, results, skill tree.
- Keyboard-only and reduced-motion variants of the journey; axe on every screen.
- `G0-checklist.md` for the real-phone session: swipe feel, readability, resume after killing the browser, Telugu toggle.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Testing, quality gates and demo, `docs/product-plan.md` §15
- Do-not-touch: `src/**` (file bugs on the owning cards), `package.json`
- Allowed dependencies: none new
- Non-goals: no P1 levels

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e tests/e2e/demo-journey.spec.ts` green on all 3 projects, including keyboard-only and reduced-motion runs
- [ ] Lighthouse CI budgets pass
- [ ] FPS probe ≥ 45 during travel under 4× CPU throttle
- [ ] ⛩ G0: product owner completes the checklist on a real Android phone; result recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] G0 signed · [ ] comment+status updated
