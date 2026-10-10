# art/ — asset folders

Every image in the game passes through the same pipeline: **raw → lint → approved**.
Nothing in `approved/` may skip the lint gate.

```
art/
  bible/      art-bible.md, palette.json (the exact colour list), reference scenes
  raw/        generator output, one folder per family (e.g. raw/urban/). Git LFS.
  approved/   frozen, lint-passed assets. One folder per district.
```

## Folder rules

- **`bible/`** — owned by P0-03. `palette.json` is the single source of truth for
  colour; the linter rejects any opaque pixel that is not in it. Do not edit here
  from other tasks.
- **`raw/`** — untouched generator output plus a sidecar per PNG. Lint it in place
  with `pnpm lint:assets -- --path art/raw`.
- **`approved/`** — assets that passed `pnpm lint:assets`. Group by district
  (`approved/urban/…`, `approved/rural/…`) so the atlas build can pack one atlas per
  district. This folder is frozen: never edit an approved PNG in place, regenerate and
  re-lint instead.

## Sidecar format

Each PNG `foo.png` has a JSON sidecar `foo.json` beside it:

```json
{
  "tool": "pixellab",
  "toolVersion": "1.0.0",
  "prompt": "16px side-view bank facade, Indian town",
  "referenceIds": ["bank"],
  "licence": "commercial-use",
  "date": "2026-10-10",
  "kind": "tile",
  "tags": ["repeat-x"],
  "frameSize": [16, 16]
}
```

- `licence` — **required**. A missing or empty value fails the lint.
- `kind` — `tile` (single image) or `sheet` (animation strip).
- `frameSize` — `[w, h]` per frame, required for sheets; the sheet must be an exact
  multiple of it.
- `tags` — `repeat-x` marks a horizontally repeating tile whose left and right edge
  columns must match.
- The atlas manifest records each frame's last opaque row and facade ground row, so the
  renderer can bottom-anchor sprites without reading image pixels at runtime.

## Commands

| Command                                                                     | Does                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm lint:assets`                                                          | lint `art/approved/`; exits non-zero on any violation                |
| `pnpm lint:assets -- --path art/raw --json`                                 | lint `art/raw/` and print JSON                                       |
| `pnpm build:assets`                                                         | pack `art/approved/` into `public/assets/` atlases + `manifest.json` |
| `tsx tools/asset-lint/contact-sheet.ts --path art/approved --out sheet.png` | render assets onto one PNG for human review                          |

## Rules the linter enforces

1. Tile dimensions on the 16 px grid; sheet frames of equal size (`frameSize`).
2. Alpha is only `0` or `255` — no semi-transparent pixels.
3. Every opaque colour is in `bible/palette.json`.
4. A `repeat-x` tile's left and right edge columns match (no seam).
5. A sheet's feet baseline and opaque body height drift by at most 1 px between frames.
6. Every PNG has a sidecar with a `licence`.
