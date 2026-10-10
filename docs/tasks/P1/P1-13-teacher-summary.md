# Task brief: On-device teacher summary (optional)

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-13 · Depends on: P1-01

## Target
`src/ui/screens/TeacherSummary/**`, `src/content/locales/{en,te}/teacher.json`

## Change
- A "Show my teacher" screen built from local derived state as a `TeacherSummary`: stars per skill branch, levels completed, and the top error categories in plain words. Displayed on screen only; nothing is sent or stored elsewhere.
- Opened from settings; readable at arm's length on a phone.

New strings go in the `teacher` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §11, `docs/technical-implementation-plan.md` § Privacy and security
- Do-not-touch: other UI folders, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no network, no QR export, no names or profile IDs on screen

## Ownership
- You may edit: `src/ui/screens/TeacherSummary/**`, `src/content/locales/{en,te}/teacher.json`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/screens/TeacherSummary` passes with fixture state
- [ ] The screen shows no profile ID, fictional name or timestamps (test asserts)
- [ ] The network allowlist test passes with the screen open

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
