# Task brief: Level 5 content — Fraud and financial safety ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-07 · Depends on: P1-01 · Gate: NGO educator signs off the content

## Target
`src/content/levels/l05/**` (`level.ts`, `sources.ts`), `src/content/locales/en/l05.json`, `src/content/locales/te/l05.json`

## Change
Write Level 5 (product plan §6 table row 5) as data, same shape as Level 2:
- Hook (≤ 3 NPC lines), interactive micro-lesson, Travel to `phone-shop`, Decision using `MessageTriage` config, Consequence, Transfer pool with ≥ 2 variants.
- Teach: urgency, impersonation, links, OTP/PIN requests, too-good-to-be-true prizes; never share an OTP or PIN; where to report (official channels from the sources).
- Critical errors: sharing an OTP or PIN, paying a fraud request.
- Set a world flag `fraud.seenWarningSigns` that Level 9 can reference.
- Every factual statement is a `ClaimRef` backed by a current official source in `l05/sources.ts`, fetched and read (NPCI, RBI, SEBI or NCFE as relevant).
- Error categories with review text; one scripted mistake path scoring 2 stars.
- Telugu draft marked `needsReview`.
- Do **not** register the level in `src/content/levels/index.ts` (P1-14 does).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §6, §11, §13.7; `docs/technical-implementation-plan.md` § Content, language and accuracy
- Do-not-touch: other levels, `src/content/sources.ts`, `src/content/levels/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none
- Non-goals: fictional names, handles and numbers only; no real company, bank or product names; no recommendations

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes
- [ ] `pnpm test src/content/levels/l05` passes: clean path → 3 stars, scripted mistake → 2 stars (via `score()`)
- [ ] No string matches a real phone number, UPI handle of a real provider, Aadhaar, PAN or IFSC pattern (test asserts)
- [ ] ⛩ NGO educator's sign-off recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] educator sign-off · [ ] comment+status updated · [ ] PR small
