# Task brief: Telugu pass for P2 strings ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-24 · Depends on: P2-03, P2-04, P2-05, P2-06, P2-10, P2-11, P2-12, P2-13, P2-14, P2-15, P2-16, P2-17 · Gate: NGO translator approves

## Target
`src/content/locales/te/**`

## Change
- Work with the NGO translator to replace every `needsReview` Telugu string in the P2 namespaces (`budgetAllocator`, `receiptInspector`, `timeSlider`, `scenarioChain`, `l01`, `l03`, `l06`, `l07`, `l08`, `l10`, `l11`, `l12`) and any remaining marker in earlier namespaces; clear the markers.
- Run the pseudo-locale and Telugu screenshot sets at 360 px; fix clipping by shortening strings with the translator, not by shrinking type.
- Add Hindi or Urdu only if the NGO has asked for it by the time this starts; otherwise record "not requested" in the PR.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §12
- Do-not-touch: English strings, code, `package.json`
- Allowed dependencies: none
- Non-goals: no machine-only translations left unreviewed

## Ownership
- You may edit: `src/content/locales/te/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes and reports 0 `needsReview` strings
- [ ] Telugu screenshots of every P2 screen at 360 px show no clipping (attached)
- [ ] ⛩ Translator approval recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated
