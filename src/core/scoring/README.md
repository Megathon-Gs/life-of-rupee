# Scoring

Import `score`, `defaultRubric`, `reviewItems` and `errorCategories` from this directory.
Call `score(events, rubric)` with one attempt's events in emission order. Override
`defaultRubric.decisionStepId` and `transferStepId` with the level's step IDs; the defaults
are `decision` and `transfer`. The result follows the frozen `ScoreResult` contract.
The same function also implements `ScoreFn`: `score({ events, rubric, errorDefs })`
uses the supplied category definitions for scoring and review cards.

Each critical error needs a later correct choice on the same step. Penalties count
wrong choices and hints, including repeated mistakes; opening explanations is free.
Only the first transfer choice controls the transfer cap. Event order matters;
timestamps are neither required nor read. Inputs are not mutated.

Wrong choices use their explicit severity, falling back to the category registry when
omitted; a wrong choice with neither a severity nor a category throws. Review cards
use that same severity, keep the highest severity for repeated
categories, and sort critical before major before minor (ties keep first-seen order).
Uncategorized choices have no review card. Unknown categories throw rather than silently
dropping feedback. Register new categories here before content emits them.

The initial Level 2 codes are `kyc.wrong_document` and `bank.wrong_document`, already
used in repository fixtures. Review keys follow `<error code>.review`; their text belongs
to level content. This module contains no UI, translated strings or financial claims.

Run `pnpm test src/core/scoring` for the acceptance table and edge cases.
