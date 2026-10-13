> **Note:** this is a **full-history mirror** of the *Paisa Street* project built at Megathon by
> Team 47 with a self-hosted multi-agent fleet (Orca + Claude Code / Codex / OpenCode / Cursor).
> The reusable system that built it is open-sourced at **https://github.com/JAGUARAVI/orca-kit**.
> Every branch and commit is preserved from the original private repo.

---

# Lifeof₹

Live demo: https://life-of-rupee-megathon-47.netlify.app

## Set up and run

Requires Node.js 22 or newer and pnpm 12.10.1. From the repository root:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. For a production build and local preview:

```sh
pnpm build
pnpm preview
```

The production app supports offline play after its first successful load. Progress is stored on the device; no account or server is required. There are no external datasets or model weights to download.

## Third-party acknowledgments

The JavaScript libraries and build/test tools are listed in `package.json`, including React, PixiJS, GSAP, Zustand, Zod, Dexie, i18next, Vite, Vitest, Playwright, axe-core, and AssetPack. The bundled Noto Sans fonts use the SIL Open Font License in `src/ui/tokens/fonts/OFL.txt`; the report's Silkscreen font uses the licence in `deliverables/fonts/OFL.txt`. Game artwork was made for this project with PixelLab assistance; each approved asset has a provenance and licence sidecar in `art/approved/`. The final report's rupee coin was generated with OpenAI image generation from a team-provided reference. The reusable Orca workflow documents and templates under `docs/orca-kit/` and `templates/` are general-purpose project scaffolding, not game content.
