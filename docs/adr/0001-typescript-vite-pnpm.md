# ADR 0001 — TypeScript (strict), Vite and pnpm as the language and build base

Status: accepted · Date: 2026-10-10 · Owner: Paisa Street team

## Context

Paisa Street is one TypeScript codebase that ships the pure core, the React UI, the PixiJS
world and the build/lint tooling. The core must run identically in tests, offline, and (later)
in a server check, so the language and build choices have to keep one language across every
layer and give a fast edit–see loop.

## Decision

Use TypeScript in strict mode everywhere, build and serve with Vite, and install/manage
packages with pnpm. Pin exact dependency versions and commit the lockfile; after P0-01, no
other P0 task touches `package.json` or the lockfile.

## Consequences

- Positive: one language for core, UI and tools; strict typing catches contract drift early;
  Vite gives fast HMR and an optimised static build; pnpm installs are fast and deterministic.
- Negative / cost: the toolchain moves quickly (Vite 8, TypeScript 7), so `typescript-eslint`
  is pinned to a TypeScript version it supports; upgrades need their own small change.
- Follow-ups: P0-04 freezes shared types; no new runtime dependency without an ADR.

## Alternatives considered

- webpack — rejected because it needs more configuration for a slower dev loop than Vite.
- npm / yarn — rejected because their installs and workspace handling are slower and less
  strict than pnpm for the tool packages this repo adds.
