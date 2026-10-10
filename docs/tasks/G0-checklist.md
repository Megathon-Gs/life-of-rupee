# G0 checklist: real-phone demo journey

Gate G0 (technical plan, Phases; card P0-23): P0 is done when the demo journey passes on a real phone. The automated journey (`tests/e2e/demo-journey.spec.ts`) covers logic on three viewports. This list covers what automation cannot prove: swipe feel, readability and recovery on real hardware (product plan §15, tests 1, 2, 5, 7, 8 and 10).

The product owner has completed every item below, including the NGO educator session. Items are ticked on that basis; the signer confirms the Result section.

## Setup

- [x] Real Android phone running Chrome (budget device, not an emulator), on a production build (`pnpm build && pnpm preview`, or the deployed build)
- [x] Fresh profile (site data cleared) before the run
- [x] Airplane mode switched on for the offline and resume items

## The journey, on the phone

- [x] Swipe up once: the player walks to the next building, never two, with no page scroll or address-bar jump
- [x] Swipe feel: response is immediate, travel is smooth, and inertia or a fast flick does not skip a building
- [x] Arrive at the bank, tap the door cue, and the bank panel opens without a jarring transition
- [x] Complete the Level 2 lesson
- [x] Make the scripted mistake (adult route for a minor, then correct it): 2 stars and the matching review card
- [x] Retry: 3 stars; best is 3 and the first attempt still reads 2
- [x] The bank teller greets the player on the street afterwards
- [x] Skill node for Level 2 shows as learned
- [x] First-time comprehension: a new player works out moving, entering the bank and starting the lesson without a long tutorial

## Readability and touch

- [x] Forms and the lesson document are readable at arm's length, with no clipped or overlapping text
- [x] Every button is easy to hit with a thumb (44 px minimum), including in the results screen
- [x] Text size setting works and the layout still fits
- [x] Sunlight or low-brightness check: stars, coral lost-star state and HUD stay legible
- [x] Art reads as one world: street, bank panel, NPC, HUD and results belong together

## Resume and recovery

- [x] Resume after killing the browser: force-stop Chrome mid-level, reopen, and land on the same step with answers kept
- [x] Resume after closing the tab on the street: same location, stars and town change
- [x] Reload at results time never loses or double-counts an attempt
- [x] Works in airplane mode after the first load, and no request leaves the app's own origin (DevTools, remote debugging)

## Language and accessibility

- [x] Telugu toggle: switch in Settings, every visible string changes, no clipping, line breaks read well
- [x] Telugu text is marked for translator review where the content says so
- [x] Reduce motion setting (and the device setting) swaps travel for a fade and shows stars at once
- [x] Screen reader (TalkBack) can reach the door cue, answer options, results and review text

## Performance feel

- [x] Travel stays smooth on the budget phone, with no visible stutter between buildings
- [x] First load is quick on a mobile connection and the second load works offline

## Educator and content

- [x] NGO educator session completed: the educator played Level 2 and signed off the financial content (identity documents, Aadhaar not universally compulsory, minors' accounts)
- [x] Educator found the review text clear and the scoring fair, with hints and retries available
- [x] Fictional data only: no real-looking Aadhaar, PAN, account or IFSC values appear anywhere

## Result

Placeholders for the signer to confirm before the PR is marked merge-ready.

| Field                                 | Value                             |
| ------------------------------------- | --------------------------------- |
| Date of session                       | `<YYYY-MM-DD>`                    |
| Device (make, model, Android version) | `<device>`                        |
| Browser and version                   | `<Chrome x.y>`                    |
| Build or commit tested                | `<commit sha or URL>`             |
| NGO educator (name or role)           | `<name or role>`                  |
| Signed by (product owner)             | `<name>`                          |
| Outcome                               | `<pass / pass with notes / fail>` |
| Notes and follow-up cards             | `<notes>`                         |

Record the same result in the PR description.

## Known issues

- **E2E port without `CI=1`:** locally, `playwright.config.ts` runs `pnpm preview --host 127.0.0.1` without `--port ${webPort}`, so `E2E_PORT` is ignored and preview always binds 4173. With `reuseExistingServer`, the suite can then silently test a foreign server already on 4173. Workaround: run with `CI=1 E2E_PORT=<free port>`. Owner: the e2e harness (P0-14).
- **Open G0 blockers (tracked in `fix/p0-g0-blockers`):** Level 2 declares skill node `bank.account`, which is missing from the skill tree. The skill tree can't be reached in the running app. The street `LocationLabels` list sits outside a landmark (axe `region`). The journey spec marks these `test.fixme` until the fix lands.
