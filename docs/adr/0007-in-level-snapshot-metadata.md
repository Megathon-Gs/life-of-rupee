# ADR 0007 — Preserve level seed and start time in snapshots

Status: accepted · Date: 2026-10-10 · Owner: Paisa Street team

## Context

`InLevelSnapshot` is strict, so the level runner cannot persist its transfer seed or the
attempt's original start time without extending the save contract. A resumed transfer could
otherwise show another variant, and a resumed attempt could record a later start time.

## Decision

Add optional integer `seed` and string `startedAt` fields to `InLevelSnapshot`. Keeping both
optional lets existing saves continue to validate.

## Consequences

- Positive: snapshots can preserve transfer selection and attempt timing across reloads.
- Negative / cost: none beyond extending the frozen contract.
- Follow-ups: the level runner can persist and restore these values in a separate change.

## Alternatives considered

- Keep the fields only in `resume` options — rejected because the save has nowhere to retain
  them across a reload.
