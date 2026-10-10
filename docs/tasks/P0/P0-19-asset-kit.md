# Task brief: Asset kit generation ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-19 · Depends on: P0-03, P0-13 · Gate: product owner approves the contact sheet

## Target
`art/raw/**`, `art/approved/**`

## Change
Follow product plan §13.4 Stage B and Prompt B with the PixelLab MCP, using `art/bible/` references (never prompts alone):
- Protagonist 32×48: idle, walk, run, arrive, interact; both directions.
- One NPC (bank teller): idle and greet.
- Facades: home, bank (default + `greets` variant detail), kirana, two fillers — one urban-to-rural-connected stretch.
- Street and pavement tiles (repeat-x), greenery, awnings, blank signboards, props.
- Parallax layers: sky, far skyline, mid trees/wires, foreground props.
- Sidecar JSON per file. Run `pnpm lint:assets --path art/raw`; repair or regenerate failures; copy passing files to `art/approved/`.
- Build a contact sheet of the plan's aesthetic acceptance scene for review.

## Constraints
- Read and follow: `art/bible/art-bible.md`, `art/README.md`, `docs/product-plan.md` §4, §13.7–13.8
- Do-not-touch: `art/bible/**`, `src/**`, `tools/**`
- Allowed dependencies: none
- Non-goals: no text, numbers or Telugu in images; no P1 buildings

## Ownership
- You may edit: `art/raw/**`, `art/approved/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:assets` reports 0 failures on `art/approved/`
- [ ] Every approved file has a sidecar with a commercial-use licence
- [ ] Contact sheet attached to the PR; ⛩ product owner approval recorded

## Definition of Done
- [ ] acceptance passes · [ ] sign-off · [ ] comment+status updated
