# Task brief: Level 12 content — Financial independence capstone ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-17 · Depends on: P2-01, P2-03, P2-06 · Gate: NGO educator signs off the content

## Target
`src/content/levels/l12/**` (`level.ts`, `sources.ts`), `src/content/locales/en/l12.json`, `src/content/locales/te/l12.json`

## Change
Write Level 12 (product plan §6 table row 12) as data, same shape as Level 2, with level ID `l12-capstone`:
- Hook (≤ 3 NPC lines), interactive micro-lesson, Travel to `home`, Decision using `ScenarioChain` config linking a budget, a bank or UPI check, a loan or insurance choice and a savings decision, Consequence, Transfer pool with ≥ 2 variants.
- Teach: connected reasoning: one month of a fictional young adult's life where choices carry forward.
- Transfer: a different month with a fraud attempt in the middle of the chain.
- `worldEffects`: `{ key: 'curriculum.completed', value: 'true' }` on completion (P2-18 opens the capstone centre from it).
- Every factual statement is a `ClaimRef` backed by a current official source in `l12/sources.ts`, fetched and read (the sources already cited by Levels 1–11; add new ones only where a claim is new), not from memory. Every rate is labelled as an assumption.
- Error categories with review text (your choice, the safer choice, the concept, why it matters); one scripted mistake path scoring 2 stars.
- Telugu draft marked `needsReview`.
- Do **not** register the level in `src/content/levels/index.ts` (P2-25 does).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §6, §8, §11, §13.7; `docs/technical-implementation-plan.md` § Content, language and accuracy
- Do-not-touch: other levels, `src/content/sources.ts`, `src/content/levels/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none
- Non-goals: fictional names, handles and numbers only; no real company, bank, insurer or product names; no recommendations

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes
- [ ] `pnpm test src/content/levels/l12` passes: clean path → 3 stars, scripted mistake → 2 stars (via `score()`)
- [ ] Every number shown in the Consequence step equals the `src/core/finance` output for the config (test asserts)
- [ ] No string matches a real phone number, UPI handle of a real provider, Aadhaar, PAN or IFSC pattern (test asserts)
- [ ] ⛩ NGO educator's sign-off recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] educator sign-off · [ ] comment+status updated · [ ] PR small
