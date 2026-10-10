# Task brief: Level 6 content — Spending, receipts and taxes ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-12 · Depends on: P2-01, P2-03, P2-04, P2-07 · Gate: NGO educator signs off the content

## Target
`src/content/levels/l06/**` (`level.ts`, `sources.ts`), `src/content/locales/en/l06.json`, `src/content/locales/te/l06.json`

## Change
Write Level 6 (product plan §6 table row 6) as data, same shape as Level 2, with level ID `l06-receipts`:
- Hook (≤ 3 NPC lines), interactive micro-lesson, Travel to `market`, Decision using `ReceiptInspector` config, then a short `BudgetAllocator` follow-up, Consequence, Transfer pool with ≥ 2 variants.
- Teach: the price on the tag, discounts and taxes can each change what you pay; check the receipt total against the budget.
- Transfer: a different receipt with a discount applied before tax.
- If `loan.activeInstallment` is set, the budget follow-up shows the fictional EMI as a fixed commitment (product plan §8).
- Every factual statement is a `ClaimRef` backed by a current official source in `l06/sources.ts`, fetched and read (official GST and NCFE material), not from memory. Every rate is labelled as an assumption.
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
- [ ] `pnpm test src/content/levels/l06` passes: clean path → 3 stars, scripted mistake → 2 stars (via `score()`)
- [ ] Every number shown in the Consequence step equals the `src/core/finance` output for the config (test asserts)
- [ ] No string matches a real phone number, UPI handle of a real provider, Aadhaar, PAN or IFSC pattern (test asserts)
- [ ] ⛩ NGO educator's sign-off recorded in the PR

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] educator sign-off · [ ] comment+status updated · [ ] PR small
