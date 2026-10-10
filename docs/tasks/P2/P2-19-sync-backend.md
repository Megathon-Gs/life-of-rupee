# Task brief: Sync backend — schema, RLS and learner codes

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P2-19 · Depends on: P2-01, P2-02

## Target
`supabase/**` (migrations, edge functions, seed), `tests/rls/**`

## Change
Per tech plan § Privacy and security:
- Tables: `classes`, `learners` (`learner_id`, `class_id`, `code_hash` only), `attempts` (append-only, unique attempt ID), `settings`. No name, contact, roll-number or free-text column anywhere.
- Edge function `issue-codes`: an educator token creates N learner codes for a class, each with ≥ 40 bits of entropy (`WORD-XXXX` style), returned once for printing; only hashes are stored.
- Edge function `exchange-code`: learner code → short-lived JWT carrying `learner_id`, rate-limited per IP and per code prefix; failed attempts reveal nothing about which part was wrong.
- RLS: every learner row restricted to `learner_id = auth.jwt() ->> 'learner_id'`; educator tokens carry `class_id` and read only `class_summary` views that return `'<5'` for any count below 5.
- Logs redact codes; no table stores IP addresses beyond the rate-limit window.
- Deployment target: Mumbai region (per ADR 0008).

## Constraints
- Read and follow: AGENTS.md, ADR 0008, `docs/technical-implementation-plan.md` § Privacy and security, `docs/product-plan.md` §11
- Do-not-touch: `src/**`, `package.json`
- Allowed dependencies: none beyond P2-02
- Non-goals: no client code; no educator UI

## Ownership
- You may edit: the target paths above
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm test:rls` against local Supabase passes:
  - learner A's token cannot select, insert or update learner B's rows
  - an educator token for class X reads class X's summary only; class Y returns nothing
  - a class summary cell with 3 learners returns `'<5'`
  - inserting an attempt with an existing ID is a no-op (idempotent push)
  - 20 wrong codes in a minute → further exchanges rejected
- [ ] Schema review: no column can hold a name, phone, email or free text (test lists columns and types)

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
