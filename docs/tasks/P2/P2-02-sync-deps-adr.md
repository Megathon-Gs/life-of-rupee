# Task brief: Sync dependencies and ADR

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-02 · Depends on: gate G1 (P1-14)

## Target
`package.json`, `pnpm-lock.yaml`, `docs/adr/0008-supabase-sync.md`, `.github/workflows/ci.yml` (local Supabase service for the RLS test job only)

## Change
- ADR 0008: Supabase Postgres with Row Level Security in the Mumbai region for opt-in sync, against the alternative of Cloudflare D1 + Workers (tech plan § Tech stack). Record data residency, what the server stores (hashed learner codes, attempt log, settings), and what it never stores.
- Install exactly: `@supabase/supabase-js` (client) and the Supabase CLI as a dev dependency for local RLS tests. Pin exact versions at least two weeks old.
- Add a CI job that starts local Supabase and runs `pnpm test:rls` (script added here, test files owned by P2-19).
- This is the only P2 task that edits `package.json` or the lockfile.

## Constraints
- Read and follow: AGENTS.md (new dependency needs an ADR), `docs/technical-implementation-plan.md` § Privacy and security
- Do-not-touch: `src/**`, other ADRs
- Allowed dependencies: the two named above only
- Non-goals: no schema, no client code

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test` pass
- [ ] Initial JS budget (≤ 250 KB gzipped) still met: the Supabase client is not imported by any eagerly loaded module
- [ ] CI job `rls` starts local Supabase and exits 0 with an empty test set

## Definition of Done
- [ ] acceptance passes · [ ] ADR added · [ ] comment+status updated · [ ] PR small
