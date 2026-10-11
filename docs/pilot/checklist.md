# Pilot checklist (P2-27)

Tick items on the day. Nothing here records anything about an individual student.

## Per device, before session 1

- [ ] Production build at `<pilot-tag>` loaded on wifi; used once in airplane mode to confirm it opens
- [ ] Site data cleared; profile picker shows "new profile"
- [ ] Text size and reduced-motion settings are the phone's defaults

## Session 1

- [ ] Facilitator gave no instructions beyond "play the game"
- [ ] Tally: first mission finished with no help `__` · with help `__` · not finished `__` (per class)

## Session 2 (resume)

- [ ] Each device reopened; saved place is shown without re-doing a level
- [ ] Tally: resumed and continued `__` · did not `__` (per class)

## After session 3, on each device

- [ ] Run `docs/pilot/tally.js` in DevTools; copy the printed counts to the class sheet; close DevTools
- [ ] Clear site data or hand the profile back per the NGO's retention rule

## Educator interview (15 min)

1. Which part of the progress information, if any, did you use to decide what to do next with a student or class?
2. What did you need that was missing or hard to read?
3. Would you want the same information weekly? In what form?
4. Did any level content look wrong, unclear or sensitive for your students?
5. Anything students found confusing that the numbers will not show?

Record answers as short notes in `results.md` (usefulness: yes / partly / no, plus themes).

## Sign-off (⛩ G2)

- [ ] Privacy gate green in CI: `pnpm e2e tests/e2e/g2`
- [ ] `results.md` filled from the sheets, all counts below 5 shown as "<5"
- [ ] Each recommended fix filed as an issue and linked
- [ ] Product owner sign-off recorded in the PR: `<name, date>`
- [ ] NGO educator sign-off recorded in the PR: `<name, date>`
