# ADR 0004 — Zustand, Zod and Dexie for state and persistence

Status: accepted · Date: 2026-10-10 · Owner: Lifeof₹ team

## Context

The canonical saved state is an append-only attempt log plus settings and position; stars,
skills, world flags and the wallet are all recomputed from it by a pure `derive()`. The reducer
must be unit-testable with no DOM, the same schemas must validate level content and saves,
and the save must survive a tab close and work offline.

## Decision

Keep a pure reducer in `core/`, expose it to React through a Zustand store, validate all
boundary data with Zod, and persist to IndexedDB with Dexie.

## Consequences

- Positive: the reducer is testable in isolation; Zustand gives React bindings with little
  ceremony; one Zod schema set guards content and saves; Dexie is transactional and
  offline-first and survives tab close.
- Negative / cost: three libraries to learn and keep current; migrations must be written and
  tested against fixture saves for every released schema version.
- Follow-ups: P0-07 builds the reducer/derive/merge; P0-08 adds Dexie with rolling snapshots.

## Alternatives considered

- Redux Toolkit — rejected as more ceremony than the small reducer needs.
- localStorage — rejected: size-limited, synchronous and easy to corrupt.
