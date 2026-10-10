# Task brief: Capstone centre concept, behind a flag

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-11 · Depends on: P1-01, P1-05

## Target
`src/ui/screens/Capstone/**`, `src/content/capstone.ts`, `src/content/locales/*/capstone.json`

## Change
- A neutral "Financial Futures Centre" screen shown when `features.capstone` is on: a restrained reveal, a short interactive on long-term ideas (compounding via `src/core/finance` `compound`, diversification, risk vs time horizon), and a clearly labelled external-link slot for approved educational material — empty and hidden until branding is approved.
- All rates labelled as assumptions; no product names; "educate, do not recommend".

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §10
- Do-not-touch: other UI folders, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no partner logo, name or product references until approval; no automatic redirects

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/screens/Capstone` passes
- [ ] With the flag off, the screen and its strings are not reachable (test)
- [ ] No external link renders while the approved-link list is empty
- [ ] `pnpm lint:content` passes for `capstone` strings

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
