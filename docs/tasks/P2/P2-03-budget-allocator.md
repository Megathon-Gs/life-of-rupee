# Task brief: BudgetAllocator interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-03 · Depends on: P2-01

## Target
`src/ui/interactions/BudgetAllocator/**`, `src/content/locales/{en,te}/budgetAllocator.json`

## Change
- Drag fictional money (a stipend, allowance or salary) into needs, wants and savings jars; the remaining amount and each jar update live in paise via `src/core/finance`. Keyboard and button alternatives move money in fixed steps (no drag required).
- Teaches: essentials come first; a plan with no savings is fragile; recurring commitments (e.g. an EMI from `loan.activeInstallment`) are pre-filled and cannot be removed.
- Same event contract and conventions as the P0/P1 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P2-25 does).

New strings go in the `budgetAllocator` namespace only (English + a Telugu draft marked `needsReview`); never edit `common.json`.

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11, §12; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/BudgetAllocator` passes:
  - all money to wants with essentials unmet → `budget.no_essentials`, severity major
  - essentials met, savings 0 → `budget.no_savings`, severity minor
  - a valid plan → `choice` correct and `onComplete`
  - totals never exceed the available amount; jars never go negative (property test)
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
