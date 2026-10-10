# megathon-gs-vanguard

> Working project repo. Orca multi-agent workflow enabled.

This repository is set up for the **Orca multi-agent workflow**: each feature is built in its own
git worktree by an agent, lands via a PR, and is merged by the automated merge agent. The process
rules and templates live in this repo.

## Read first
- **`AGENTS.md`** — rules every agent follows here.
- **`docs/orca-kit/00-index.md`** — the full process docs (features, specs, delegation, agent rules).
- **`templates/`** — copy `SPEC.md`, `ADR.md`, `AGENTS.md`, `TASK-BRIEF.md` for each feature.

## How we work (short)
1. **Spec first** — `SPEC.md`: goal, non-goals, interfaces, verifiable acceptance; decisions as ADRs.
2. **Split** — one card per slice; one worktree per card.
3. **Delegate** — brief an agent with a self-contained task brief (`templates/TASK-BRIEF.md`).
4. **Review** — check against acceptance criteria.
5. **Ship** — PR → label `merge-ready` → merge agent lands it.

## Status
- **GitHub remote:** not added yet (add later, then enable protection + the merge agent).
- Once a remote exists: `orca-kit/setup-existing-repo.sh` finishes labels, protection, and the merge agent.
