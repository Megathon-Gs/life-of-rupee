# Task brief: Art direction and art bible ⛩

Repo: megathon-gs-vanguard · Base: origin/main · Owner: <assign> · Card: P0-03 · Depends on: — · Gate: product owner picks the direction

## Target
`art/bible/` — `art-bible.md`, `palette.json`, `reference/*.png` + sidecar JSON

## Change
Follow product plan §13.4 Stage A and Prompt A, using the PixelLab MCP:
1. Generate **three** distinct pixel-art directions of the **same test scene**: one bank, one kirana store, one modest home, one street with vegetation and signage, one protagonist, one NPC, and a district transition (urban → rural-connected).
2. Render each at phone size (390×844 portrait crop) and desktop size. Critique each against plan §4 (contemporary India, dignity, no clichés, readable at phone size) and the aesthetic acceptance test.
3. Present the strongest **two** to the product owner in the PR. Stop and wait for the pick.
4. Freeze the chosen direction in `art-bible.md`: 16 px grid; logical world height 270 px; protagonist 32×48 px; perspective and street baseline; outline and shading rules; lighting; architecture kit; signage rules (no baked text); character diversity rules; negative prompts; accepted and rejected examples.
5. `palette.json`: the exact hex list used by the approved reference scene.
6. Sidecar per PNG: `{ tool, toolVersion, prompt, referenceIds, licence, date }`.

## Constraints
- Read and follow: `docs/product-plan.md` §4, §13; `docs/technical-implementation-plan.md` § World renderer, § Asset pipeline
- Do-not-touch: all code paths
- Allowed dependencies: none (MCP tools only)
- Non-goals: no full asset kit (P0-19); no UI screens; no imitation of any existing game; no text, numbers or Telugu rendered inside images; never send student data to any tool

## Ownership
- You may edit: `art/bible/**`
- Do not edit: anything else

## Observable acceptance
- [ ] PR shows 3 directions, the 2 shortlisted, and the product owner's written pick
- [ ] `art/bible/art-bible.md` covers every item listed in step 4
- [ ] Every opaque pixel in the approved reference scene uses a colour from `palette.json` (verify with a one-off script, output pasted in the PR)
- [ ] Every PNG has a sidecar with a licence field confirming commercial use is allowed

## Definition of Done
- [ ] acceptance passes · [ ] product owner sign-off in PR · [ ] comment+status updated
