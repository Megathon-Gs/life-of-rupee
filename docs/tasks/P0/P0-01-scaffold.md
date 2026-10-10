# Task brief: Scaffold, toolchain and stack ADRs

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-01 · Depends on: —

## Target
Repo root config files, `src/main.tsx`, `.github/workflows/ci.yml`, `docs/adr/`, `tools/content-lint/index.ts` (stub), `tools/asset-lint/index.ts` (stub), `.gitattributes`.

## Change
- pnpm + Vite + React 19 + TypeScript (strict) app whose `src/main.tsx` renders a placeholder "Paisa Street" page.
- Install **every P0 dependency** below. After this PR, no other P0 task edits `package.json` or the lockfile.
- Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test` (vitest run), `e2e` (playwright test), `lint:content` (runs `tools/content-lint/index.ts`), `lint:assets` (runs `tools/asset-lint/index.ts`), `build:assets` (runs `tools/assetpack/build.ts`). Tool entry files are stubs that print "not configured yet" and exit 0; P0-12 and P0-13 replace them.
- Path alias `@/` → `src/`.
- **Core purity fence:** `tsconfig.core.json` covers `src/core/**` with `lib: ["ES2022"]` (no DOM), included in `pnpm typecheck`. ESLint `no-restricted-imports` in `src/core/**` blocks `react`, `react-dom`, `pixi.js`, `gsap`, `dexie`, `i18next`.
- CI (`.github/workflows/ci.yml`): replace the smoke step with pnpm install (frozen lockfile), `typecheck`, `lint`, `test`, `build`, `lint:content`, `lint:assets`. Leave e2e to P0-14's separate workflow.
- `.gitattributes`: Git LFS for `art/raw/**/*.png`.
- ADRs from `templates/ADR.md` (status accepted, date today), taking reasons from `docs/technical-implementation-plan.md` § Tech stack: 0001 Vite + React + TS + pnpm; 0002 PixiJS v8 for the world (vs Phaser 3); 0003 GSAP for animation; 0004 Zustand + Zod + Dexie for state and persistence; 0005 test toolchain (Vitest, fast-check, Playwright, axe, Lighthouse CI); 0006 i18next for English and Telugu.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` (§ Tech stack and repository layout), templates/ADR.md
- Do-not-touch: `docs/orca-kit/`, `templates/`, `AGENTS.md`
- Allowed dependencies (runtime): react, react-dom, pixi.js@8, gsap@3, zustand, zod, dexie, i18next, react-i18next, i18next-icu, intl-messageformat. (dev): typescript, vite, @vitejs/plugin-react, vite-plugin-pwa, vitest, jsdom, @testing-library/react, @testing-library/user-event, fake-indexeddb, fast-check, @playwright/test, @axe-core/playwright, @lhci/cli, eslint (+ typescript-eslint, eslint-plugin-react-hooks), prettier, tsx, sharp, @assetpack/core. Pin exact versions.
- Non-goals: no app features, no game code, no Playwright config (P0-14).

## Ownership
- You may edit: `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `.github/workflows/ci.yml`, `.gitattributes`, `docs/adr/**`, `tools/content-lint/index.ts`, `tools/asset-lint/index.ts`, `tools/assetpack/build.ts`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build` passes (vitest runs with `passWithNoTests`)
- [ ] A scratch file `src/core/probe.ts` containing `import 'react'` makes `pnpm lint` fail, and `document.title` in it makes `pnpm typecheck` fail (show both in the PR, then delete the file)
- [ ] `pnpm dev` serves a page showing "Paisa Street"
- [ ] CI workflow runs all listed steps and is green on the PR
- [ ] Six ADRs exist in `docs/adr/` following the template

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] docs/ADR updated · [ ] comment+status updated · [ ] PR small (lockfile excluded)
