# Task brief: Level 2 content — financial identity and bank account ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-18 · Depends on: P0-04, P0-12 · Gate: NGO educator signs off the content

## Target
`src/content/levels/l02/**` (`level.ts`, `sources.ts`), `src/content/levels/index.ts`, `src/content/locales/en/l02.json`, `src/content/locales/te/l02.json`

## Change
Write Level 2 (product plan §6 table row 2; Prompt E) as data:
- Hook (≤ 3 NPC lines), interactive micro-lesson, Travel to `bank`, Decision using `FormFiller` and `DocumentInspector` configs, Consequence, Transfer pool with ≥ 2 variants (new fictional person and documents).
- Teach: accepted identity documents, that Aadhaar is not universally compulsory for every financial task, and the distinct rules for minors' accounts — each as a `ClaimRef` backed by a current official source (RBI KYC Master Direction and related RBI pages) in `l02/sources.ts`, fetched and read, not from memory.
- Error categories (`kyc.*`, `bank.*`) with review text: your choice, the safer choice, the concept, why it matters.
- `worldEffects`: the flag that makes the teller greet the player.
- One scripted "realistic mistake" path that scores 2 stars, documented for P0-23.
- Telugu: a machine-assisted draft clearly marked `needsReview` for the NGO translator.
- Register the level in `src/content/levels/index.ts`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §6, §11, §13.7; `docs/technical-implementation-plan.md` § Content, language and accuracy
- Do-not-touch: `src/content/sources.ts`, other levels, `src/core/**`, `package.json`
- Allowed dependencies: none
- Non-goals: fictional identities and numbers only — no real-looking Aadhaar/PAN/account numbers (use obviously fake formats like `XXXX-DEMO`); no product recommendations

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm lint:content` passes (every claim sourced and review-stamped; all keys present in en and te)
- [ ] `pnpm test src/content/levels/l02` passes: the scripted mistake path scored with `score()` gives 2 stars; the clean path gives 3
- [ ] No string in `l02` matches a real Aadhaar (12 digits), PAN (`[A-Z]{5}[0-9]{4}[A-Z]`) or IFSC pattern (test asserts)
- [ ] ⛩ NGO educator's sign-off recorded in the PR (name or role, date)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] educator sign-off · [ ] comment+status updated · [ ] PR small
