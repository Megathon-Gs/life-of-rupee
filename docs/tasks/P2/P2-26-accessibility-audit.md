# Task brief: Accessibility audit and fixes

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-26 · Depends on: P2-25

## Target
`tests/a11y/**`, `docs/accessibility-audit.md`; fixes go to the owning paths as small follow-up PRs or bug issues on the relevant cards

## Change
- Audit every screen and all 12 levels: axe on every panel state, keyboard-only and screen-reader (TalkBack + Android Chrome) runs, reduced motion, mute, text scale 1.5, Telugu, contrast, touch target size.
- Record findings in `docs/accessibility-audit.md` with severity and owner; fix blockers directly where the fix is local to tests or tokens, otherwise file issues labelled `bug` against the owning task area.
- Confirm no star loss is tied to reading speed or accessibility settings (product plan §12, §15.7).

## Constraints
- Read and follow: AGENTS.md, `docs/product-plan.md` §12, SPEC.md §7 (Accessibility)
- Do-not-touch: `package.json`; component internals except via their own follow-up PRs
- Allowed dependencies: none new
- Non-goals: no redesigns

## Ownership
- You may edit: `tests/a11y/**`, `docs/accessibility-audit.md`
- Do not edit: anything else in this PR

## Observable acceptance
- [ ] `pnpm e2e tests/a11y` passes: 0 axe violations on every screen; every level completable keyboard-only and with reduced motion on
- [ ] Audit doc lists every finding with status; 0 open blockers
- [ ] TalkBack run notes attached

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated
