# Level 12 — financial independence capstone

Issue #79 / P2-17. Do not register here: P2-25 owns the level registry and learning-centre wiring.

## Scripted paths

- Clean: Hook → Lesson (`needs`, then `assumption`) → arrive at `home` → Decision chain
  (budget → UPI check → 12-month loan → savings `assumption`) → Consequence → either Transfer
  month = **3 stars**.
- Mistake: same path, but choose the 36-month loan in the Decision
  (`loan.ignored_total_cost`), correct it, then answer the Transfer correctly = **2 stars**.
- A wrong first Transfer answer caps the attempt at 2 stars; a critical fraud error caps it at 1.

## Decision chain (ScenarioChain)

One connected month mixes the earlier levels' interactions:

1. `budgetAllocator` — fund needs and the existing instalment, then savings.
2. `upiPayment` — the bill's name and handle are not verified, so the safer action is to decline.
3. `offerComparator` — the 12-month loan repays less overall than the 36-month loan that has the
   lower EMI.
4. `timeSlider` — the assumed savings range is an illustration, not a promise.

Each Transfer month is also a chain with a **fraud attempt in the middle** (`messageTriage`):
Meera gets an OTP request, Arjun gets a prize-link chat message. All people, balances and rates
are fictional assumptions, not recommendations.

## Source reading (2026-10-11)

`sources.ts` records official pages already fetched and read for Levels 1–11 and reused here; no
claim is new. Budgeting/saving (NCFE Financial Planning), deposits (NCFE Banking), UPI PIN and
beneficiary checks (NPCI BHIM FAQ), fraud (RBI cyber-threats advisory), loan total cost (RBI Key
Facts Statement), investment risk (SEBI Factors to Consider Before Investing) and interest (RBI
Financial Literacy Guide).

The Consequence text quotes only `core/finance` output for the decision config — income, needs
plus the existing instalment, the chosen loan's EMI and total repayment, and the savings range
endpoints — checked in `level.test.ts`. It is labelled an assumption, not a forecast.

## Error categories

The budget link uses `budget.no_essentials` and `budget.no_savings`, registered in
`src/core/scoring/errorCategories.ts` (the registry the module documents as the place to register
content error codes before content emits them). Every other link reuses an existing code.

## Validation and release gates

`pnpm test src/content/levels/l12`, `pnpm lint:content`, `pnpm typecheck`, `pnpm lint`.

Claims are marked **source check by coding agent; NGO educator sign-off pending**. That is not
educator approval. Telugu is a `needsReview` draft; translator and educator approval remain
release gates. No real identities, phone numbers, provider handles or product names are used.
