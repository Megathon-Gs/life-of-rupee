# NGO pilot plan (P2-27)

Scope: gate G2 (SPEC §10), product plan §11 and §15. The pilot measures; it does not assume results. Fields in `<angle brackets>` are for the product owner and the NGO to fill in before session 1. They are not guessed here.

## Before any student plays

- [ ] Privacy gate green: `pnpm e2e tests/e2e/g2` passes in CI (no typing field, no request leaves the device, stored data is the strict save schema).
- [ ] NGO consent and age-appropriate policy approved by `<NGO contact>`; retention and deletion rules agreed (product plan §11).
- [ ] Educator has reviewed the financial claims of every level taught in the pilot.
- [ ] Students are told the game never asks for a name, number or password, and that they should not type or share any in the room.

## Devices

| Item          | Plan                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phones        | `<number>` Android phones with Chrome, a mix of the NGO's own and budget loaners, `<models>`                                                                           |
| Build         | Production build from `main` at tag `<pilot-tag>`, loaded once on wifi, then used offline                                                                              |
| Profiles      | One "new profile" per student on a shared device is allowed; profiles hold no name, so a student is "profile on device N" to the facilitator only and never in results |
| Backup device | `<one spare phone>`                                                                                                                                                    |

## Classes and schedule

| Item               | Plan                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Classes            | `<number>` classes, `<age range>`, at `<centre>`                                         |
| Session 1          | 45 min: free exploration, no tutorial, then the first mission (first navigation measure) |
| Session 2          | 45 min, `<days>` later: reopen the device, resume, play further levels (resume measure)  |
| Session 3          | 45 min: free play, replays allowed, no prompting to replay (voluntary replay measure)    |
| Educator interview | 15 min after session 3, questions in `checklist.md`                                      |
| Dates              | `<dates>`                                                                                |

Replays are never prompted or rewarded by the facilitator, so the replay count stays voluntary.

## Roles and support

| Role                            | Person                                            |
| ------------------------------- | ------------------------------------------------- |
| Facilitator in room             | `<name, role>`                                    |
| NGO educator (sign-off)         | `<name>`                                          |
| Product owner (sign-off)        | `<name>`                                          |
| Support contact during sessions | `<phone or chat handle>`, answers within `<time>` |

Support never asks a student for personal information, and a student who is stuck is helped by the facilitator, not the support contact.

## What is measured, and how

| Product plan §15 measure                  | Source                             | How it is counted                                                                                                                                      |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent first navigation and mission  | Facilitator observation, session 1 | Tally: finished the first mission with no help / with help / not finished                                                                              |
| Completion and voluntary replay by level  | On-device save, `tally.js`         | `learners_finished`, `learners_replayed` per level                                                                                                     |
| Error categories before vs after practice | On-device save, `tally.js`         | `errors.<code>.first_attempt` vs `.last_attempt` (replayers only)                                                                                      |
| Transfer-step performance                 | On-device save, `tally.js`         | Proxy: `first_attempt_3_stars` (a wrong transfer answer caps stars). The save does not record the transfer step alone; see finding F-1 in `results.md` |
| Successful resumes                        | Facilitator observation, session 2 | Tally: device reopened and student continued from the saved place / did not                                                                            |
| Educator usefulness                       | Interview                          | Short interview, answers summarised without quotes that identify a student                                                                             |

Data handling: `tally.js` runs on one device at a time in DevTools, prints counts only (no id, no time) and sends nothing. The facilitator copies counts to the class tally sheet. Sheets hold counts per class, never per student. No screen recordings, photos of screens with progress, or exports of the save file.

## Reporting rules

- Aggregate over all pilot classes. Every count below 5, including zero, is written "<5" so no small group can be singled out. When a "<5" cell sits in a sum, the sum is also written "<5" or the sibling cell is merged.
- No claim of learning outcome beyond what a row measures. Before/after error counts show change in recorded mistakes, not in understanding.
- Findings that need a code fix become issues (one per fix), linked from `results.md`.
