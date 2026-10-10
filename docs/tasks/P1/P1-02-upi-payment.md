# Task brief: UpiPayment interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-02 · Depends on: P1-01

## Target
`src/ui/interactions/UpiPayment/**`

## Change
- A mock phone that emerges from the scene into a legible payment screen (product plan §5 "Enter a UPI challenge"). The student checks payee name and handle, amount and note, then decides to approve with a PIN prompt or decline.
- Teaches: the PIN authorizes a payment; it is never needed to receive money (a "request" screen asking for a PIN to receive is the trap).
- PIN entry is a mock keypad producing no stored value; the digits typed are discarded immediately.
- Same event contract and conventions as the P0 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P1-14 does).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: `src/ui/interactions/UpiPayment/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/UpiPayment` passes:
  - entering the PIN on a "receive money" request → `upi.pin_to_receive`, severity critical
  - mismatched payee approved → `upi.wrong_payee`
  - correct payee + amount approved → `choice` correct and `onComplete`
  - no PIN digits appear in emitted events or component state after completion
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
