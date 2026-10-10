# Task brief: Consent flow and data policies ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-22 · Depends on: P2-01 · Gate: NGO (as data fiduciary, with its counsel) approves the policy text and flow

## Target
`src/ui/screens/Consent/**`, `src/content/locales/{en,te}/consent.json`, `docs/privacy/**` (policy, retention, deletion, incident response)

## Change
- A consent screen shown before sync can be enabled: plain-language explanation of what leaves the device (attempt log, settings, under a learner code) and what never does; Accept / Not now; learner code entry after Accept. "Not now" keeps the full game working locally.
- Settings entry to withdraw consent → calls P2-20 `unlink()` and records `declined`.
- `docs/privacy/`: data inventory, retention period, deletion on request (by learner code), vendor access, incident response — drafted for the NGO's counsel; learners are minors under the DPDP Act 2023, so the NGO decides how verifiable parental consent is collected (outside the app).
- `policyVersion` bump forces the screen to show again.

New strings go in the `consent` namespace only (English + a Telugu draft marked `needsReview`).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §11; `docs/technical-implementation-plan.md` § Privacy and security (Legal)
- Do-not-touch: `src/persistence/**`, `supabase/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no collection of parent or student names or contacts in the app

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/screens/Consent` passes: Accept → `granted` with `policyVersion`; Not now → `declined` and no code field shown; withdraw → `declined` and unlink called
- [ ] axe 0 violations; readable at 360 px in English and Telugu
- [ ] ⛩ NGO approval of `docs/privacy/` and the flow recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated
