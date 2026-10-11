# SPEC: Lifeof₹

Status: draft · Owner: Parth · Updated: 2026-10-10

Sources: [`docs/product-plan.md`](docs/product-plan.md) (the "plan", what and why) · [`docs/technical-implementation-plan.md`](docs/technical-implementation-plan.md) (the "tech plan", how). This SPEC condenses both. Where they conflict, stop and ask (AGENTS.md).

## 1. Problem & goal
Grade 11–12 students served by an NGO in Hyderabad (about 1,500 learners) rarely meet money decisions (opening a bank account, paying by UPI, spotting fraud, judging a loan) in a safe place to practise. Lifeof₹ is a mobile-first, offline-capable illustrated web game: the student swipes through an Indian town, enters recognisable places, solves a short financial problem with an interactive panel, earns up to three stars, lights a skill-tree node and sees the town change. Success is demonstrated understanding of banking, planning, saving, safety and borrowing, never wealth (plan §1). The guided game is complete with no backend and no LLM.

## 2. Non-goals (explicitly out of scope)
- Wealth leaderboards or any ranking by money, possessions or status (plan §7).
- Real personal or financial data: no Aadhaar/PAN, real bank or UPI IDs, OTPs, passwords, names, phone, email (plan §11).
- Any LLM dependency for core play, scoring or world change (plan §1, §14).
- Economy simulation, 3D movement, arbitrary LLM-generated interfaces, or more empty buildings before P0/P1 polish (plan §14).
- Recommending specific securities or products; presenting simulations as guaranteed outcomes (plan §2).
- Time-based or reaction-speed scoring (plan §7).
- A backend or AI NPCs in P0/P1 (tech plan, phases).

## 3. Users & user stories
- As a **student on a phone**, I want to swipe to the next building and enter it so that I can start a lesson without a tutorial.
- As a **student on a phone**, I want to close the tab mid-level and resume at the same step so that short, interrupted sessions still count.
- As a **student on a lab desktop**, I want to use wheel, trackpad, keyboard or buttons to move so that the game is as usable as on a phone.
- As a **student on a shared device**, I want to pick my own fictional player ("Blue Kite") so that nobody sees my progress or needs my real name.
- As an **NGO educator**, I want financial claims sourced and reviewed so that I can trust what students are taught, and (from P1) see a student's stars per skill so that I know who needs help.
- As the **product owner**, I want the demo journey to pass as an automated test so that every merge keeps the demo working.

## 4. Scope
**P0 (playable slice, gate G0):** one street (urban to rural-connected); one bank; Level 2 (identity and bank account) with FormFiller and DocumentInspector; protagonist walk cycle; travel controller; pure core (money in paise, interest, scoring, save, `derive`); IndexedDB persistence with mid-level resume; UI shell (HUD, dialogue, panel, results, skill tree); one world change (teller recognises the player); English and Telugu strings; content, asset and e2e gates; no backend, no AI.
**P1 (hackathon demo, gate G1):** UpiPayment, MessageTriage, OfferComparator; Levels 4 (UPI), 5 (fraud), 9 (loans) with one clear negative borrowing outcome; a return visit that remembers an earlier choice; full skill-tree screen and replay-to-improve; capstone centre concept behind the branding flag; Telugu for all P1 strings; if capacity allows, an on-device "Show my teacher" summary.
**Out (until their phase):** P2: remaining 8 levels, BudgetAllocator, ReceiptInspector, TimeSlider, ScenarioChain, NGO pilot (gate G2). P3: curated postgame scenarios, AI NPC proxy after the privacy review.

## 5. Interfaces & contracts (define first)
Not duplicated here. Types and Zod schemas live in `src/core/contracts/` (task P0-04) and are frozen for the wave once merged; a change needs its own small PR approved by the coordinator. Definitions of record, in the tech plan:
- `LevelDef`, `InteractionEvent`, interaction kit table: tech plan § Level runner and content model.
- `SaveFile`, `AttemptRecord`, `derive`: § Game state and persistence.
- Scoring rubric and error-category codes (`upi.pin_to_receive` style): § Scoring.
- Finance formulas (EMI, compound growth, inflation): § Finance maths.
- Repository layout and module ownership: § Tech stack and repository layout. `core/` imports nothing from DOM, Pixi or React.
- Test mode `?test=1` (fixed seed, manual ticker, GSAP jumped to end): § Testing.

## 6. Behavior & edge cases
| Case | Expected behavior |
|---|---|
| Offline | After first load the app shell and first level work with no network; no feature errors on a dropped connection. Optional services never block play (plan §15.10). |
| Reload mid-level | Resumes at the same location and `stepIndex` with prior events; stars, skills and town changes are identical (state saved debounced 300 ms, flushed on `visibilitychange` hidden and `pagehide`). |
| Corrupt save | A save failing Zod validation after migration goes to quarantine; the last of three snapshots loads. Progress is not lost silently. |
| Shared device | Start screen lists local fictional players; Switch player and Remove from this device; no real names asked; one player's state is never shown to another. |
| Reduced motion (OS or in-game toggle) | Travel becomes a 150 ms cross-fade with camera cuts; level fully playable. |
| Panel open while swiping or wheeling | World band is `inert`, the travel controller is disabled, panel scroll is contained; the town never moves. |
| One flick or trackpad inertia | Exactly one `travel` per gesture (wheel sum ≥ 60 px, swipe ≥ 40 px or 0.3 px/ms); lock lasts until 200 ms after the last wheel event; never skips a building. |
| Tap a distant building | Travels straight to it. |
| Mistake in a level | Deduction applied by the rubric and explained at once in a "What changed my result?" card; no shaming; retry allowed. |
| Retry after a mistake | Best stars = max over attempts; the first attempt stays recorded and is never overwritten. |
| Critical safety error (shared PIN/OTP, paid a fraud request) | 0 stars if unresolved, capped at 1 star if corrected; explained seriously, not humiliatingly. |
| Missing Telugu string | Falls back to English with a dev-only marker; CI fails the missing key. |
| Content with no source or review stamp | content-lint fails the build. |
| Any request to a non-allowlisted origin | e2e privacy test fails. |

## 7. Constraints
- Compatibility: Android Chrome and desktop browsers; Playwright viewports 360×740 touch, 412×915 touch, 1440×900. Phone quality takes precedence. English and Telugu from day one; text only in the DOM, never in the canvas.
- Performance: initial JS ≤ 250 KB gzipped; first-level assets ≤ 1.5 MB; LCP ≤ 3.0 s on simulated 4G (Lighthouse mobile; product-owner-approved P2-29 exception from 2.5 s); ≥ 45 fps during travel under 4× CPU throttle.
- Accessibility: zero `@axe-core/playwright` violations on key screens; a level completable by keyboard alone and with reduced motion on; finger-sized targets; no star loss tied to reading speed or accessibility needs.
- Security/privacy (plan §11): nothing ever leaves the device; no names, contact details or real financial data; free text from students is not collected (pickers and pre-filled fictional values); only educational error categories are recorded; no analytics, ads, trackers or third-party scripts; strict CSP; self-hosted fonts; all financial claims traceable to RBI, NPCI, SEBI or NCFE sources, with educator sign-off on sensitive ones before a level ships. Privacy is a release blocker.
- Allowed dependencies: those listed in the tech plan stack, installed once by P0-01 (TypeScript, Vite, pnpm, PixiJS, React, GSAP, Zustand, Zod, Dexie, vite-plugin-pwa, i18next, AssetPack, sharp, Vitest, fast-check, Playwright, axe-core). New deps require an ADR.
- Do-not-touch paths: `src/core/contracts/` after P0-04 merges (except via an approved contracts PR); `src/ui/interactions/index.ts` and `src/content/levels/index.ts` outside their single owner task; `package.json` and lockfile outside P0-01; paths owned by another task (docs/tasks/README.md rule 3).

## 8. Acceptance criteria (verifiable)
**G0 — demo journey (P0-23), `pnpm test:e2e` green on 360×740, 412×915 and 1440×900, and manually on one real Android phone:**
- [ ] 1. Fresh profile; one swipe moves the player to exactly the next building, never two.
- [ ] 2. Arriving at the bank, entering and completing the Level 2 lesson works.
- [ ] 3. The scripted mistake yields a result of exactly 2 stars and the matching "What changed my result?" card.
- [ ] 4. Retry yields 3 stars; stored best stars = 3 and first-attempt stars = 2.
- [ ] 5. The Level 2 skill-tree node is lit and the bank-teller variant is visible in the town.
- [ ] 6. After a page reload the location, stars, lit skill node and teller variant are unchanged.
- [ ] 7. The recorded network log contains no request to any origin other than the app's own.

**G0 supporting gates, all in CI:**
- [ ] `pnpm test` passes, including fast-check properties: longer tenure gives lower EMI and higher total interest; total repaid ≥ principal; positive inflation buys strictly less each year; integer-paise results match a high-precision reference within 1 paisa.
- [ ] content-lint passes: schemas valid, every claim has a source ID and review stamp, every English key has a Telugu entry.
- [ ] asset-lint passes on `art/approved/` (16 px grid, palette, alpha 0/255, seams, frame drift ≤ 1 px, licence sidecar).
- [ ] axe-core reports no violations; keyboard-only and reduced-motion runs complete Level 2.
- [ ] Performance budgets in section 7 are met in Lighthouse CI and the FPS probe.
- [ ] Visual screenshots in Telugu and the +40% pseudo-locale show no clipped text.

**G1 — P1 list (educator sign-off required), each verified by e2e or component test:**
- [ ] UpiPayment, MessageTriage and OfferComparator each have component tests emitting the correct events for right and wrong answers.
- [ ] Levels 4, 5 and 9 are completable end to end; Level 9 shows a negative borrowing outcome whose numbers match `core/finance` output.
- [ ] A return visit shows the Level 5 fraud warning-sign callback inside Level 9's offer after the earlier choice was made, and does not show it on a fresh profile.
- [ ] The skill-tree screen shows all five branches with unlocked and locked nodes; replaying a level can raise best stars without altering the first attempt.
- [ ] The capstone centre concept is visible only with the branding flag on and uses the neutral "Financial Futures Centre" name by default.
- [ ] `content-lint` reports 100% Telugu coverage for P1 strings.
- [ ] An NGO educator has signed off each P1 level's claims in the PR.
- [ ] If built: the "Show my teacher" summary renders stars per skill from local data with zero network requests.

## 9. Open questions
- [ ] What is the hackathon deadline and team size? This sets each phase's length. — owner: Parth — decide by: before P0 planning ends
- [ ] Who translates and reviews Telugu, and is Hindi or Urdu needed? — owner: Parth (ask NGO) — decide by: before P1 Telugu task
- [ ] pen.dev or Google Stitch as the single UI design tool? — owner: Parth — decide by: before P0-11
- [ ] Has Vanguard approved its name and branding for the capstone? — owner: Parth — decide by: before P1 capstone (neutral placeholder until then)
- [ ] Which NGO educator signs off financial content, and how fast can they turn around a level? — owner: Parth — decide by: before P0-18 merge

Owners and dates are proposals for the coordinator to confirm; the questions are copied from the tech plan § Risks.

## 10. Milestones (smallest releasable slices)
1. **P0 Playable slice** — one street, bank, Level 2, save, resume, no backend or AI. Gate **G0**: demo journey test passes on all three viewports and on a real phone.
2. **P1 Hackathon demo** — Levels 4, 5, 9, full skill tree, capstone concept. Gate **G1**: section 8 G1 list passes and an educator signs off.
3. **P2 Full journey and pilot** — all 12 levels and an accessibility audit. Gate **G2**: privacy gate (the demo journey proves no real student financial data is needed and no request leaves the device, tested in CI) and a pilot with NGO students.
4. **P3 Postgame** — curated scenarios, then AI NPCs behind a flag only after the privacy review.

Each gate must pass before the next phase starts; nothing from a later phase starts early.
