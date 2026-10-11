# Accessibility audit (P2-26)

Scope: SPEC.md §7, product plan §12. Automated checks live in `tests/a11y/`
(`pnpm e2e -c tests/a11y/playwright.config.ts`; the root config's `testDir` is `tests/e2e`, which this PR may not edit).

## Coverage

| Area | Method | Status |
| --- | --- | --- |
| Picker, street, level panels (keyboard-only walk of each reachable door) | axe, Playwright | automated |
| Reduced motion | `reducedMotion: reduce` run of the same walk | automated |
| Text scale 1.5 | root font-size 24px, axe | automated (layout overflow not asserted) |
| Touch targets >= 24px | picker buttons | automated (picker only) |
| Telugu, contrast beyond axe, mute | not yet automated | open (A11Y-1) |
| TalkBack + Android Chrome | manual | **not run** (A11Y-2) |

## Findings

| ID | Severity | Finding | Owner | Status |
| --- | --- | --- | --- | --- |
| A11Y-1 | minor | Telugu, mute and per-level touch-target checks not automated | P2-26 follow-up | open |
| A11Y-2 | major | TalkBack run notes missing: needs a physical Android device | assignee | open, blocks acceptance |
| A11Y-3 | minor | Locked-door levels (unlockedBy) are not entered by the generic walker; full 12-level completion keyboard-only needs per-level scripts (see `tests/e2e/p1`) | P2-26 follow-up | open |
| A11Y-4 | info | Street location labels trip axe `region` (waived, same as demo-journey) | world owner | open |
| A11Y-5 | minor | Desktop text-scale and touch-target checks failed once under parallel load, then passed | P2-26 follow-up | open |

## Stars and settings

Reduced motion shows all stars at once (`Results`), and no scoring code reads timing or settings:
`src/core` only stores the `reducedMotion` setting in state; scoring does not read it. Confirmed by grep, not yet by test.

## Not verified

The specs pass on phone-small, phone-large and desktop (run singly). Under a three-project parallel run two desktop checks (text scale, touch target) failed once and passed on rerun; cause not diagnosed (A11Y-5, minor, suspected load timing).
