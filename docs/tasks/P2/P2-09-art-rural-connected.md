# Task brief: Art for P2 — rural-connected district and learning centre ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-09 · Depends on: gate G1 (P1-14) · Gate: product owner approves the contact sheet

## Target
`art/raw/**`, `art/approved/**` (new files only)

## Change
With the PixelLab MCP and `art/bible/` references, extend the kit:
- Rural-connected neighbourhood: well-kept village street, homes, agricultural supply outlet, local market, cooperative/community touchpoint, with smartphones and digital payments visible.
- Insurance desk beside a vehicle workshop (Level 10), with a covered and an uncovered incident prop (e.g. a damaged two-wheeler and a worn part).
- Financial learning centre (Level 11), neutral and distinct from the capstone centre.
- Two NPCs (insurance agent, learning-centre guide): idle + talk.
- Interior backdrops (static, same spec as IN-01: 384×288, key subject in the central 384×128 band, ≤ 60 KB) for `insurance-desk` and `learning-centre`, under `art/approved/interiors/`.
- Lit/unlit variants where a building unlocks; one reusable street-furniture set for the district (lamps, planters, signboard blanks, two-wheelers).
- Sidecars, `pnpm lint:assets` clean, and a contact sheet showing the new district beside the P0 street at phone size.

## Constraints
- Read and follow: `art/bible/art-bible.md`, `art/README.md`, `docs/product-plan.md` §4 (no "poor rural versus successful urban" framing; no poverty as scenery or clichés), §13.7
- Do-not-touch: existing approved files, `art/bible/**`, `src/**`
- Allowed dependencies: none
- Non-goals: no logos or names of real companies, banks or insurers; no baked text

## Ownership
- You may edit: new files under `art/raw/**`, `art/approved/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:assets` reports 0 failures
- [ ] Contact sheet attached; ⛩ product owner approval recorded
- [ ] Aesthetic acceptance test (product plan §4): the new buildings beside the bank and kirana read as one art director's work

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated
