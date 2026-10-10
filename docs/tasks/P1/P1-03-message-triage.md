# Task brief: MessageTriage interaction

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P1-03 · Depends on: P1-01

## Target
`src/ui/interactions/MessageTriage/**`

## Change
- An inbox of fictional SMS, chat messages and call transcripts. The student sorts each into Safe or Fraud and taps the warning signs (urgency, impersonation, link, OTP/PIN request, prize).
- Feedback per message names the signs the student missed.
- Same event contract and conventions as the P0 interactions: `choice`/`hint`/`explanationOpened` events with configured error category and severity; "Simulated — never enter real details" banner; two hint levels; renders in `PanelShell`; tokens from P0-11; 360 px wide works.
- Do **not** register it in `src/ui/interactions/index.ts` (P1-14 does).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §5, §6, §11; `docs/technical-implementation-plan.md` § Level runner and content model
- Do-not-touch: other interactions, `src/ui/interactions/index.ts`, `src/core/**`, `package.json`
- Allowed dependencies: none new
- Non-goals: no free-text inputs; no level content

## Ownership
- You may edit: `src/ui/interactions/MessageTriage/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui/interactions/MessageTriage` passes:
  - marking a fraud message Safe → configured `fraud.*` category, severity from config
  - a message asking to share an OTP marked Safe → severity critical
  - all sorted correctly with required signs tapped → `onComplete`
  - message order is the config order (deterministic)
- [ ] No `<input type="text">`, `<textarea>` or `contenteditable` rendered
- [ ] axe 0 violations; targets ≥ 44×44 CSS px; fully keyboard-operable

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
