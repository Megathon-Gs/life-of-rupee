# Task board

**Megathon GS Vanguard — Task Board**
https://github.com/users/JAGUARAVI/projects/2

- Repo: `IIIT-ECell/megathon26-megathon-gs`
- Fields: **Status** (Todo / In Progress / Done · built-in), **Owner** (person), **Worktree** (Orca worktree name).
- Seeded cards cover the P0 slice, the spec/interfaces work, and the open decisions.

## How we use it (see `docs/orca-kit/10-board-and-agents.md` and `15-…`)
1. Take a card → set **Owner** → create a worktree → paste the worktree name into **Worktree**.
2. Move **Status** to *In Progress*.
3. Link the PR on the card; label the PR `merge-ready`.
4. Move to *Done* when merged.

> Note: a **user** project cannot link an **org-owned** repo (GitHub requires the same owner),
> and org project creation is disabled for this account. So the board lives under `JAGUARAVI`
> and is referenced here; the **Repository** column stays empty. If IIIT-ECell enables org
> project creation, we can move/relink it.
