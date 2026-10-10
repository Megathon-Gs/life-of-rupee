# Task brief: UI shell, design tokens and screens

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-11 · Depends on: P0-04

## Target
`src/ui/**` except `src/ui/interactions/**`, `src/content/locales/{en,te}/ui.json`

## Change
1. Design first (product plan §13.4 Stage C, Prompt C): in pen.dev **or** Stitch (one tool only), generate phone and desktop frames for HUD, dialogue sheet, panel, results with star loss and review, skill tree, settings. Use `art/bible/palette.json` if P0-03 has merged, otherwise the plan §4 palette direction. Attach frames to the PR.
2. `tokens/` — colours, type scale, spacing, radii, motion durations as CSS custom properties; self-hosted Noto Sans and Noto Sans Telugu.
3. Components: `Hud` (chapter, location, Previous/Next, settings), `DialogueSheet` (≤ 3 lines, continue/skip), `PanelShell` (focus trap, Escape closes, `overscroll-behavior: contain`, calls `onOpenChange` so the app can make the world `inert`), `ResultsScreen` (stars reveal one by one, review items list, retry), `SkillTreeScreen` (from `SkillTreeDef` + completed nodes), `SettingsPanel` (language, reduced motion, mute, text size).
4. Folder layout: `src/ui/tokens/`, `src/ui/shell/` (Hud, DialogueSheet, PanelShell, SettingsPanel), `src/ui/screens/<Name>/` (Results, SkillTree). Later phases own individual screen folders.
5. Dev gallery page `src/ui/dev/` rendering every component with fixture data in English and Telugu.

New strings go in the `ui` namespace only (English + a Telugu draft marked `needsReview`); never edit another namespace.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Tech stack, `docs/product-plan.md` §4, §12
- Do-not-touch: `src/ui/interactions/**`, `src/core/**`, `package.json`
- Allowed dependencies: react, react-i18next (installed); CSS Modules only
- Non-goals: no generic SaaS cards or dashboard look; no game logic; no data fetching

## Ownership
- You may edit: `src/ui/**` except `src/ui/interactions/**`, `src/content/locales/{en,te}/ui.json`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/ui` passes
- [ ] axe reports 0 violations on the gallery (light test via Testing Library + axe, or Playwright once P0-14 lands)
- [ ] Every interactive element is ≥ 44×44 CSS px (test measures)
- [ ] Keyboard: Tab order follows reading order; Escape closes `PanelShell` and focus returns to the opener
- [ ] Telugu fixture strings render without clipping at 360 px wide (screenshot in PR)
- [ ] With reduced motion, `ResultsScreen` shows all stars at once

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small (split tokens+shell / screens into two PRs if > 400 lines)
