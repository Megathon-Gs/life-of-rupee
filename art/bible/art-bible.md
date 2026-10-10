# Art bible: Chai-hour storybook (Direction A)

Owner: P0-03. Colour source of truth: [`palette.json`](palette.json). Examples live in
[`reference/`](reference/) (approved candidates) and [`reference/rejected/`](reference/rejected/).

**Status.** Direction A only. Directions B and C were never generated, which deviates from
issue #4 ("three directions, shortlist two"). The team chose A ("Direction A only, devs
approve", relayed verbally); there is no written product-owner sign-off yet. Every item marked
**GUESS** is unverified and needs a photo-reference pass and a Hyderabad/Telangana reviewer
(dress, architecture, signage colour mapping, skin and caste/religion-coding checks).

## 1. Grid and frame

- 16 px grid. Logical world height 270 px (16.875 tiles; the extra 14 px sits at the top as sky).
- Integer scale only: `s = floor(worldBandHeightDevicePx / 270)`. Desktop 1920x1080 gives s=4
  (480x270 logical, 30 tiles). Phone 390x844 at 3x DPR gives a world band of about 60% of the
  height, s=5, about 234 logical px (14.6 tiles) wide. Never use a fractional scale.
- Protagonist sprite 32x48. Every other asset is generated at its final native size.
- Whole-pixel offsets everywhere, including parallax. Parallax factors: sky 0.1, far skyline 0.3,
  mid trees/wires 0.6, street 1.0, foreground 1.2.

## 2. Perspective and baseline

- Side-on orthographic street, no vanishing point. Buildings are flat facades.
- Building bases at y=226. Sprite feet at y=232 (on the pavement), allowed drift 1 px between
  frames. Pavement to y=246, kerb, then road to y=270.
- Pavement is mid-ramp `dcb27f` with `b98260` seams, never cream. Road is `55507a`.

## 3. Palette

32 colours, exactly those in `palette.json`; any opaque pixel outside it fails lint, and alpha
must be 0 or 255.

| Role                  | Colours                                               |
| --------------------- | ----------------------------------------------------- |
| Ink / outline         | `191a33`, `2e3059`                                    |
| Road and shadow       | `55507a`, `8a86a8`                                    |
| Cream / sand / brown  | `fff1d0 f3d9a4 dcb27f b98260`                         |
| Terracotta / marigold | `e07b4f b9523c 823a3a 54283a`, `ffd34e f7a02a cc6a1e` |
| Coral / rose          | `f58f7c d9605d`                                       |
| Teal                  | `7ad6bd 2eab93 167b7c 0d4f60`                         |
| Greens                | `c4de6e 74b04c 3b8048 1f5242`                         |
| Sky                   | `d3eef0 9fd3e6 5fa3d6`                                |
| Skin ramp             | `f4c7a1 d89868 a96b45 6e4030` (deep shadow `54283a`)  |

Known low-contrast pairs (marigold vs sand pavement, coral vs leaf green, deep skin vs road):
outline every sprite in `191a33`, keep the road dark, and place deep-skinned characters against
lit walls.

## 4. Outline, shading, lighting

- Characters and interactables: ink `191a33` outline. Buildings and props: the darkest step of
  their own ramp. Far background layers: no outline, lighter haze ramp.
- Shading: 3 tones per material (light, base, shade), clusters of 2 to 4 px, plus a 1 px edge
  highlight on the tops of interactables. Shadows drift to ink-violet, highlights to cream or
  marigold.
- No dithering anywhere. The one exception is a 2x2 checker on the sky band between `d3eef0`
  and `9fd3e6`.
- Light: low, warm, late afternoon, from the upper left (as in all current reference pieces).
  Ground shadow `55507a`.
- Texture: plaster has sparse 2 to 3 px speckles (under 8% of pixels); brick has a course line
  every 3 to 4 px; roof tile has 2 px scallops; shutters have slat lines every 2 px (widen to
  3 px if they twinkle); foliage is 2 to 3 step blobs with no per-leaf noise.

## 5. Architecture kit (all GUESS)

Districts differ by accent colour only; they share outline and shading rules.

- **Urban:** cream and sand plaster blocks, flat parapet roofs, glass door with canopy, deep teal
  (`0d4f60`) bank plate.
- **Town high street:** 2 to 3 storeys, shop below and home above, marigold and terracotta
  fronts, roll-up shutters, striped or flat awnings.
- **Rural-connected:** same plaster family, leaf greens, a civic block (Rythu Vedika-style hall)
  as landmark, solar panels, overhead water tank, tractor-trolley as normal equipment. Flat
  parapet roofs, not pitched tile.
- **No-text identification:** one silhouette, one colour field and one prop per service. Bank =
  teal plate, canopy and ATM alcove; kirana = marigold plate, open shutter, hanging strips;
  pharmacy = jade plate with a cross-like shape; agri-supply = terracotta plate with sacks and
  coiled pipe. Never validated with viewers.
- Module sizes: facade 6 to 10 tiles wide; storey about 48 px.

## 6. Signage

No text, numerals, Telugu or logos are ever baked into art. Signboards are blank fascia plates
(trade colour field, optional icon). Labels are DOM overlays. Every generation prompt ends with:

> No text, no letters, no numerals, no logos, no watermark, no signage lettering; signboards are blank.

Lettering still appears on small signs and wall notices. Inspect every output at 8x and record
any repair in the sidecar `notes`.

## 7. Characters

- 32x48, about 4 to 4.5 heads (head about 10 to 11 px), 2x2 eyes, 1 px mouth, no nose beyond a
  shade pixel. Identity comes from hair shape, clothing block colour, prop and posture.
- Skin uses the four-tone ramp; never let status, role or virtue correlate with the lightest tone.
- Cast is diverse in age, build, hair and dress. Dress is contemporary (tee or kurta with jeans,
  saree or salwar with sneakers, co-ords). Avoid: religious dress as a generic "Indian" marker,
  caste-coded appearance and occupation pairs, one character standing for a community.
- Starter cast (GUESS): protagonist (student, backpack, mid-range skin), bank teller (tall,
  lanyard), college friend, delivery rider, kirana owner, pharmacist, farmer-entrepreneur, co-op
  worker, elders.
- Sprite feet baseline is the same in every frame.

## 8. Tone and negative prompts

Contemporary, dignified India. Technology and infrastructure are visible in every district.
Exclude: poverty as scenery, slums, beggars, rags, cows, bullock carts, snake charmers, temples
and religious icons as decoration, saffron or turbans as decoration, caricature, chibi or
childlike proportions, sexualised clothing, lightened skin, glass-only or dust-only worlds,
Western-small-town cues (shingle roofs, picket fences, cypress trees), any text.

Prompt exclusion sentence (the tools have no negative-prompt field):

> Not a tourist postcard; no religious icons, temples, cows, snake charmers, slums, beggars, rags, saffron or turbans as decoration; no caricature, no chibi or childlike proportions, no sexualised clothing, no lightened skin; no text, letters, numerals, logos or Telugu on any sign.

## 9. Generation workflow (PixelLab)

- `create_image_pixflux`, `view=side`, `outline="single color outline"`,
  `shading="basic shading"`, `detail="medium detail"` (low for 32x48 sprites),
  `no_background=true`, fixed seed per piece. Enums are weak guidance.
- Pass the palette strip as `color_image_url`: output is then palette-exact with no post-pass.
  Do not call `reduce_colors` (billed as a full generation).
- `no_background` is sometimes ignored: flood-fill the edge-connected sky to alpha 0 locally and
  note it in the sidecar.
- Generate pieces and compose at 1:1. Whole-scene generation ignores the prompt.
- Use `init_image_strength` around 300 for variants that must match an existing piece.
- For animation cycles use a character tool with a fixed seed (or hand-edit); pixflux will not
  keep a character identical across frames.
- Every PNG has a sidecar JSON (see `art/README.md`) with the licence string
  `Owned by us under PixelLab ToS §1.3/§3.3; commercial use allowed; outputs not used to train other models`.

## 10. Accepted and rejected examples

Accepted (`reference/`, palette-exact): `cand-a-bank`, `cand-a-kirana`, `cand-a-home`,
`cand-a-street`, `cand-a-rural`, `cand-a-protagonist`, `cand-a-npc-kirana`, `cand-a-npc-elder`,
and the composed `scene-a-world` with desktop and phone renders.

Known defects in the accepted set: sprite speckle and blank or dark faces; only three cast
members; the first critic scored urban-rural parity 2 before improvements; rural strip keeps a
wooden fence and one pitched tiled roof.

Rejected (`reference/rejected/`):

- `cand-a-bank-v1`: weak bank cue, confetti glass noise.
- `cand-a-transition-v1`: reads as a Western small town (shingle roofs, picket fence, cypress),
  no rural-connected cues.
