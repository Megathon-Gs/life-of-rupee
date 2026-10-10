# Task brief: Contracts and schemas (interface freeze)

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-04 · Depends on: P0-01

## Target
`src/core/contracts/**`, plus empty registries `src/content/levels/index.ts` and `src/ui/interactions/index.ts`

## Change
Types **and** Zod schemas (one source of truth: export the schema and `z.infer` the type) for:
- `ids.ts` — branded `LevelId`, `LocationId`, `SkillNodeId`, `InteractionId`, `SourceId`; `ErrorCategory` as a dotted string.
- `content.ts` — `LevelDef` and its steps (Hook, Lesson, Travel, Decision, Consequence, Transfer with a variant pool), `WorldEffect`, `ClaimRef { textKey, sourceIds, reviewerRole, reviewedOn }`, `SourceDef`, `LocationDef { id, x, district, doorX, buildingAsset, labelKey }`, `WorldDef`, `SkillTreeDef` (5 branches, nodes, edges).
- `events.ts` — `InteractionEvent` exactly as in the technical plan.
- `scoring.ts` — `Rubric` (penalty weights, critical cap, transfer cap), `ScoreResult { stars, penalty, capsApplied, reviewItems }`, `ReviewItem`, `ErrorCategoryDef { code, severity, skillNode, reviewKey }`, `ScoreFn` signature.
- `save.ts` — `SaveFile`, `AttemptRecord`, `Settings` (add `updatedAt: string`), `seen: string[]` (transitions already watched), `Derived`. All objects `.strict()`.
- `world.ts` — `WorldVisuals`, `WorldRenderer` interface: `mount(el)`, `resize()`, `travelTo(id, { reducedMotion }) => Promise<void>`, `applyVisuals(v)`, `onArrive(cb)`, `setPaused(b)`, `destroy()`.
- `input.ts` — `TravelCommand` (`step ±1` | `goto id`), `TravelInput` normalized events, `TravelConfig` with defaults: wheel threshold 60 px, quiet window 200 ms, swipe 40 CSS px or 0.3 px/ms.
- `ui.ts` — `InteractionProps<C> { config, locale, onEvent, onComplete }`, `InteractionComponent<C>`, config types `FormFillerConfig` and `DocumentInspectorConfig`.
- `persistence.ts` — `SaveStore` interface: `load`, `save`, `flush`, `listProfiles`, `createProfile`, `removeProfile`.
- `runner.ts` — `LevelRunner` interface: `start(level, seed, now)`, `resume(snapshot)`, `current()`, `dispatch(event)`, `onComplete(cb)`.
- `index.ts` — barrel export.
- Registries: `src/content/levels/index.ts` exports `levels: LevelDef[] = []`; `src/ui/interactions/index.ts` exports an empty typed registry map.

## Constraints
- Read and follow: SPEC.md (if merged), AGENTS.md, docs/adr/, `docs/technical-implementation-plan.md` § Detailed component design (its code blocks are the starting point)
- Do-not-touch: `package.json`, lockfile
- Allowed dependencies: zod (already installed)
- Non-goals: no logic beyond schemas; no implementations; no UI

## Ownership
- You may edit: `src/core/contracts/**`, `src/content/levels/index.ts`, `src/ui/interactions/index.ts`
- Do not edit: anything else

## Observable acceptance
- [ ] `pnpm typecheck && pnpm lint` pass (contracts compile under the no-DOM core config)
- [ ] `pnpm test src/core/contracts` parses fixture `LevelDef`, `WorldDef`, `SkillTreeDef` and `SaveFile` objects
- [ ] A `SaveFile` with an extra top-level key (e.g. `name`) is rejected — the guard against personal data creeping in
- [ ] Every exported type has a one-line doc comment

## Definition of Done
- [ ] acceptance passes · [ ] tests added · [ ] comment+status updated · [ ] PR small
After merge: contracts are frozen for the wave. Changes go through a separate PR approved by the coordinator.
