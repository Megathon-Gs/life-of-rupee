# Level 11 — investment instruments

Issue #78 / P2-16. Requires the investment comparator prerequisite PR #158.
Do not register here: P2-25 owns the level registry and learning-centre wiring.

## Scripted paths

- Clean: Hook → Lesson (`assumption`) → arrive at `learning-centre` → Decision
  (`mutualFunds`) → Consequence → either Transfer (`fd`) = **3 stars**.
- Mistake: same path, but choose `equities` in Decision, then correct to
  `mutualFunds` = **2 stars**, `investing.concentrated_risk.review`.
- A wrong first transfer choice caps the attempt at 2 stars even after correction.

The long-horizon question identifies a truthful description of pooled diversified
equity holdings; it does **not** assert that a mutual fund is best for everyone.
The book-budget and course-fee variants explicitly assume a lower-risk deposit
with suitable maturity/withdrawal terms. They do not recommend a real product.
Deliberately false Decision statements and the Lesson `promise` distractor are
misconceptions, corrected by the sourced explanations and review cards.

## Source reading (2026-10-11)

`sources.ts` records pages fetched and read, not remembered claims:

- SEBI **Factors to Consider Before Investing**: goals, horizon, risk appetite,
  liquidity, past returns not guaranteed, diversification and asset allocation.
- SEBI **How to Manage Investment Risks**: diversification cannot remove
  market-wide losses; money needed soon should avoid volatile/illiquid assets.
- SEBI **Understanding Bonds**: fixed coupons do not fix resale prices; issuer
  default, interest-rate and liquidity risks.
- SEBI **Understanding Mutual Funds**: pooling, objectives, holdings and diversification.
- SEBI **Avenues for Investments**: shares represent ownership; asset classes
  differ in risk and return.
- NCFE **Banking**: fixed-period term deposits; early withdrawal may reduce
  interest or attract a penalty. No real bank examples are copied into the lesson.
- NCFE **Mutual Funds**: differing scheme risks/maturities; redemption and exit
  terms must be read. Only general concepts are used, not dated legal deadlines,
  rates, named schemes or historical examples from this FAQ.

The TimeSlider range is a **toy calculation**, not a probability interval or a
floor on losses. Assumptions: ₹10,000, 6% model rate ±2 percentage points, 4%
inflation, annual compounding, 8 years. Its nominal endpoints (4% and 8%) are
₹13,685.69 and ₹18,509.30, checked against `core/finance/compound`. No fees or
taxes are modelled; real capital losses and results outside the range are
explicitly stated. Frozen OfferComparator loan inputs are ignored in investment
mode and must never be shown as investment figures.

## Validation and release gates

`pnpm test src/content/levels/l11`, `pnpm lint:content`, `pnpm typecheck`, `pnpm lint`.

Claims are marked **source check by coding agent; NGO educator sign-off pending**.
That is not educator approval. Record educator role/date and approval in the PR
before release, then update the stamps. Telugu is a `needsReview` draft for P2-24;
translator approval and phone layout review remain required. No player data,
real company names or product names are collected or recommended.
