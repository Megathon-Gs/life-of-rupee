# Level 4 — UPI basics

Data only, intentionally unregistered. P1-14 owns level registration and app integration.
All transactions are fictional; `@demo.invalid` handles are not real provider handles.

## Source check (2026-10-10)

The agent fetched and read the official NPCI/BHIM homepage and FAQs listed in
`sources.ts`. The homepage explicitly says receiving money does not require a PIN.
The FAQ sections “What Is UPI PIN?”, “While sending money via UPI ID, the account
holder name and UPI ID are different” and “What is a request?” explain payment
authorization, confirming beneficiary details, and approving/declining a collect
request. The lesson uses a **merchant** request, not a person-to-person collect
feature; it makes no claim about current P2P availability, limits or app setup.
Source links are references, not runtime network dependencies.

Every factual explanation, hint and financial review card has a `ClaimRef`.
Review stamps distinguish the **agent source check** from **human educator
approval reported by the user** on 2026-10-10; the agent did not independently
verify the human reviewers' identities or sign-off.

## Acceptance and review

- Clean path: decline the disguised refund request; approve the independently
  verified shop payment; decline either mismatched transfer. Result: **3 stars**.
- Scripted mistake: safe lesson; decline the verified decision payment once,
  then approve on retry; safe transfer. Result: **2 stars**, declined-payment review.
- The verified payment is mandatory: always declining cannot complete the level.
  Approving a mismatched transfer then correcting it earns **2 stars**, with a
  wrong-payee review and transfer cap.
- PIN-to-receive: **0 stars** while unresolved, at most **1** after correction.
- English financial claims: **human educator approval reported by the user**.
- Telugu: the AI review's collect-request clarification is applied; **human
  translator approval reported by the user**. The `needsReview` marker is cleared
  on that basis, not on the AI review alone.
- Actual 360px Telugu layout validation remains outstanding for P1-12/P1-14.

Checks: `pnpm lint:content` and `pnpm test src/content/levels/l04`.
Record the user-reported approval in the PR; app registration and UI validation
remain owned by the integration tasks.
