# Megathon X rules and submission checklist

Sources of truth: [official guidelines](megathon-x-guidelines.pdf) (submission policy §8, originality §10, licensing §11) and [official deliverables](megathon-x-deliverables.pdf). This checklist summarizes those supplied PDFs; organizer updates take precedence.

## Deadlines and artifacts

Times below are reproduced as printed. The supplied PDFs do not explicitly state a timezone; confirm the event timezone through the helpdesk or Discord.

| Stage  | Deadline                   | Required artifact                                                                                                                                                                                                                                                                                                                            |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1     | October 10, 2026, 10:00 PM | `deliverables/M1.pdf`, at most 2 pages: problem and understanding, idea/abstract, high-level approach/pipeline/architecture, planned testing methodology                                                                                                                                                                                     |
| M2     | October 11, 2026, 4:00 AM  | `deliverables/M2.pdf`, at most 2 pages: approach and changes since M1, experiments/results, testing progress, remaining plan; all code so far on `main`                                                                                                                                                                                      |
| Final  | October 11, 2026, 11:00 AM | Full code on `main`; setup/run-only `README.md` plus external dataset/weight links; MIT `LICENSE`; `deliverables/final_report.pdf`, at most 3 pages; demo video at most 4 minutes on Google Drive with “Anyone with the link” access; code zip via submission form excluding dependencies, virtual environments, datasets, and model weights |
| Slides | October 11, 2026, 11:30 AM | Slides PDF through the slides form, covering problem, approach, solution, results; repositories are archived at 11:00 AM, so do not plan a slides push                                                                                                                                                                                       |

The final README instruction must also accommodate the guidelines' required acknowledgments for third-party code, libraries, and reused general-purpose assets. Confirm the permitted placement with organizers before the final README is prepared.

## Before every deadline

- Use the organizer-provided private team repository in `IIIT-ECell`; do not create a replacement submission repository.
- Ensure every member has accepted their repository invitation by M1.
- Put the official **team number at the top of every PDF**. R0 is double-blind: no team name, member names, or college names in any PDF or video. Check visible content and PDF metadata.
- Commit every required PDF except slides to `deliverables/`; use exact case-sensitive filenames and preserve earlier deliverables.
- Have the PR reviewed and merged to **`main` before the deadline**. Organizers record its latest commit; a branch, open PR, or local commit does not count. Do not merge your own PR under this repository's workflow.
- There is no grace period. Missing/late M1 or M2 directly disqualifies the team; missing/late final submissions are excluded from further evaluation.
- Preserve full incremental history; no force-pushes or history squashing/importing. The recorded commit must remain working; organizers will not substitute another commit.
- Keep large datasets and model weights external and link them as required. Do not commit secrets or files larger than GitHub's 100 MB limit.

## Build and participation rules

- Only a solution built during the hackathon window is eligible. Pre-existing projects, forks, clones, ports, and rebrands cannot be submitted as the solution, even after extensive modification.
- Correctly licensed third-party dependencies and boilerplate are permitted with acknowledgment. Reused general-purpose team utilities/assets must be disclosed and cannot supply the substance of the solution.
- AI assistance, programming languages, libraries, and external cloud platforms are permitted unless the allocated problem statement restricts them. A live deployment is not required.
- Include an MIT license file with submitted code/materials. Participants retain ownership while granting the problem sponsor the license described in guidelines §11.
- Teams have at most five eligible, registered students; allocation and team composition cannot be changed after their specified cutoffs. Participation is in person, with mandatory overnight attendance unless organizers approve an exemption.
- Respect conduct, infrastructure-access, safety, and intellectual-property rules in the full guidelines. Organizer notices, forms, and updates are shared via the helpdesk or Discord.

These rules do not establish that invitations, originality, licensing, branding, or a deadline merge have already been verified.
