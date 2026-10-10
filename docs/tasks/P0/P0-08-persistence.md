# Task brief: IndexedDB persistence

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-08 · Depends on: P0-04

## Target
`src/persistence/**`

## Change
- `db.ts` — Dexie database with stores `profiles`, `saves`, `snapshots`, `quarantine`.
- `saveStore.ts` — `createSaveStore({ migrate })` implements `SaveStore`. `migrate` is injected (the app passes P0-07's migrator; tests pass identity), so this task does not depend on P0-07. `save` is debounced to 300 ms; `flush` writes immediately; keeps 3 rolling snapshots per profile; on `load`, a save that fails `migrate` or the `SaveFile` schema moves to `quarantine` and the newest valid snapshot loads.
- `lifecycle.ts` — `installLifecycleFlush(store)` flushes on `visibilitychange` (hidden) and `pagehide`.
- `profiles.ts` — create, list and remove local profiles. Display identity = avatar ID + a generated two-word fictional name ("Blue Kite") from a fixed word list. No real-name field exists anywhere.

## Constraints
- Read and follow: AGENTS.md, `docs/technical-implementation-plan.md` § Game state and persistence, § Privacy and security
- Do-not-touch: `src/core/**`, `package.json`
- Allowed dependencies: dexie (installed); fake-indexeddb for tests
- Non-goals: no sync (P2), no network calls

## Ownership
- You may edit: `src/persistence/**`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/persistence` passes (jsdom + fake-indexeddb + fake timers)
- [ ] save → new store instance → load returns a deep-equal save
- [ ] 50 `save` calls within 250 ms → exactly 1 write; `flush` → immediate write
- [ ] Corrupting the latest save → `load` returns the previous snapshot and the corrupt save is in `quarantine`
- [ ] `removeProfile(id)` leaves no rows for that profile in any store
- [ ] The persistence module issues no `fetch`/XHR (test stubs `fetch` to throw)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
