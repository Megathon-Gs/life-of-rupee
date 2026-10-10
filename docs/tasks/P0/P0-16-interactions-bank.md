# Task brief: FormFiller and DocumentInspector interactions

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-16 · Depends on: P0-04, P0-11

## Target
`src/ui/interactions/FormFiller/**`, `src/ui/interactions/DocumentInspector/**`, `src/ui/interactions/index.ts`, `src/content/locales/{en,te}/interactions.json`

## Change
- `FormFiller` (`FormFillerConfig`): a fictional account-opening form. Every field is chosen from options (pickers, toggles, cards); each option carries correctness, error category and severity from config. Emits `choice`, `hint` and `explanationOpened` events; calls `onComplete` when all required fields are correct.
- `DocumentInspector` (`DocumentInspectorConfig`): a fictional document (e.g. an ID list or form) with tappable regions; the student answers prompts by tapping regions. Same event contract.
- Both: a persistent "Simulated — never enter real details" banner; two hint levels; render inside `PanelShell`; use P0-11 tokens; work at 360 px wide.
- Register both in `src/ui/interactions/index.ts`.

New strings go in the `interactions` namespace only (English + a Telugu draft marked `needsReview`); never edit another namespace.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Level runner and content model, § Privacy and security; `docs/product-plan.md` §11
- Do-not-touch: `src/ui/` outside `interactions/`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: **no free-text inputs**; no Level 2 content (P0-18 supplies config); no scoring

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions` passes with fixture configs:
  - all correct picks → `choice` events with `correct: true` and one `onComplete`
  - a wrong pick → `choice` with the configured error category and severity
  - hint button pressed twice → `hint` level 1 then level 2
- [ ] Neither component renders `<input type="text">`, `<textarea>` or `contenteditable` (test asserts)
- [ ] axe reports 0 violations; all targets ≥ 44×44 CSS px; full keyboard operation

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
