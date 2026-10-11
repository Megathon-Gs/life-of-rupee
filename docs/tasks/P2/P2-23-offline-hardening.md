# Task brief: Offline hardening

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-23 · Depends on: P2-01

## Target
`src/platform/pwa/**`, `vite.config.ts` (PWA plugin block only), `tests/e2e/offline/**`

## Change
- Precache the app shell, fonts and the first level's assets; lazy-cache each later level's chunk and district atlas on first visit, keyed by the content-hashed manifest.
- Update flow: a new version waits until the player is outside a level, then offers "Update" (no reload mid-level).
- Storage pressure: request persistent storage; on quota errors keep the save and drop cached assets first.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Tech stack (Offline), SPEC.md §6 (Offline row)
- Do-not-touch: `package.json` (vite-plugin-pwa is already installed), `src/persistence/**`
- Allowed dependencies: none new
- Non-goals: no background upload of learning data

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm e2e tests/e2e/offline` passes on all 3 projects:
  - load once, go offline, reload → shell and Level 1 playable
  - a level visited once online is playable offline afterwards
  - a deploy mid-level does not reload the page until the level ends
  - no cross-origin response is present in Cache Storage
- [ ] Lighthouse budgets unchanged

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
