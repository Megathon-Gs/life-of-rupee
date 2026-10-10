# Task brief: Level 3 content — Saving, deposits and interest ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-11 · Depends on: P2-01, P2-05, P2-07 · Gate: NGO educator signs off the content

## Target
`src/content/levels/l03/**` (`level.ts`, `sources.ts`), `src/content/locales/en/l03.json`, `src/content/locales/te/l03.json`

## Change
Write Level 3 (product plan §6 table row 3) as data, same shape as Level 2, with level ID `l03-saving`:
- Hook (≤ 3 NPC lines), interactive micro-lesson, Travel to `bank`, Decision using `TimeSlider` config comparing a savings account, a recurring deposit and a fixed deposit, Consequence, Transfer pool with ≥ 2 variants.
- Teach: balance growth, liquidity and goals differ; locking money earns more only if you will not need it early; compounding frequency matters.
- Transfer: a different goal and timeline where the liquid option is the right one.
- `worldEffects`: `{ key: 'savings.goalMet', value: 'true' }` when the fictional goal is met (P2-18 maps it to the home upgrade).
- Every factual statement is a `ClaimRef` backed by a current official source in `l03/sources.ts`, fetched and read (RBI and NCFE), not from memory. Every rate is labelled as an assumption.
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
- [ ] `pnpm test src/content/levels/l03` passes: clean path → 3 stars, scripted mistake → 2 stars (via `score()`)
- [ ] Every number shown in the Consequence step equals the `src/core/finance` output for the config (test asserts)
- [ ] No string matches a real phone number, UPI handle of a real provider, Aadhaar, PAN or IFSC pattern (test asserts)
- [ ] ⛩ NGO educator's sign-off recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] educator sign-off · [ ] comment+status updated · [ ] PR small
