# ADR 0006 — i18next for English and Telugu

Status: accepted · Date: 2026-10-10 · Owner: Lifeof₹ team

## Context

English and Telugu must both work from day one, and all player-facing text lives in the DOM
(never baked into canvas art) so Telugu shapes correctly and screen readers work. CI must fail
when an English key has no Telugu entry, and the app must not call a font CDN.

## Decision

Use i18next with ICU message formatting (`i18next-icu`) and self-hosted Noto Sans / Noto Sans
Telugu fonts. Content strings live in `src/content/locales/{en,te}/`, one namespace per owning
task.

## Consequences

- Positive: pluralisation and number/date formatting via ICU; real DOM text for Telugu shaping
  and a11y; no third-party font or script calls, which keeps the strict CSP and privacy gate.
- Negative / cost: every key needs a Telugu translation and a padded pseudo-locale screenshot
  pass to catch clipping; self-hosted fonts add to the asset budget.
- Follow-ups: P0-11 owns the `ui` namespace; P0-12 owns `common` and the i18n wiring; content
  lint fails on missing Telugu keys.

## Alternatives considered

- Canvas-baked text — rejected: poor Indic shaping and inaccessible.
- A hosted font/translation CDN — rejected: leaks requests and breaks the strict CSP.
