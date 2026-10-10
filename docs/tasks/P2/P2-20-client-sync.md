# Task brief: Opt-in client sync

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-20 · Depends on: P2-01, P2-02, P2-19

## Target
`src/persistence/sync/**`, `src/core/state/migrations/**` (the `ConsentState` settings migration only)

## Change
- `createSync({ endpoint, store })`: off by default. Turned on only after consent is `granted` and a learner code is entered (code entry UI belongs to P2-22's screen; this task exposes `link(code)`, `unlink()`, `status`).
- Push: unsent attempts by ID, settings and position as a `SyncPush`; pull: union by attempt ID via P0-07 `merge`; settings last-writer-wins by `updatedAt`.
- Offline queue: pushes wait for `online`; retries with backoff; never blocks play or a save.
- Lazy-loads the Supabase client so it never enters the initial bundle.
- `unlink()` removes the code and token from the device; local progress stays.
- Save migration adding `settings.consent` (default `unknown`).

## Constraints
- Read and follow: AGENTS.md, ADR 0008, `docs/technical-implementation-plan.md` § Game state and persistence, § Privacy and security
- Do-not-touch: `supabase/**`, `src/ui/**`, `src/core/contracts/**`, `package.json`
- Allowed dependencies: `@supabase/supabase-js` (from P2-02)
- Non-goals: no educator features; nothing syncs without consent

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test src/persistence/sync src/core/state` passes:
  - consent `unknown` or `declined` → zero network calls (test with a fetch spy)
  - two devices with overlapping attempts converge to the same union after push+pull
  - offline push is queued and sent once on reconnect; a duplicate send is harmless
  - the token and code never appear in a save file, a log line or an error message
- [ ] Initial JS budget still met (Supabase client in a lazy chunk)
- [ ] Migration test: a v1 save loads with `consent.status === 'unknown'`

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
