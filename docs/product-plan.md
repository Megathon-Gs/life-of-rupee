# Paisa Street — Product, Experience & Design Plan

> **Working title:** Paisa Street (subject to team approval)  
> **Format:** Mobile-first, scroll-driven, illustrated financial-learning web game  
> **Audience:** Primarily Grades 11–12 students, initially through an NGO serving approximately 1,500 students in Hyderabad, Telangana  
> **Status:** Revised product, creative and AI-production brief (10 October 2026)  
> **Purpose of this document:** Establish the vision, user experience, educational outcomes, design system, AI-led design-production workflow, safeguards, and quality bar. **It deliberately does not prescribe a directory structure, database schema, API design, or mandatory technical architecture.** The implementation team/model should select the strongest technical approach to meet these requirements.

---

## 1. Vision

**A beautiful, living Indian town where students learn financial fundamentals through short levels, solve practical problems inside recognizable places, and see their choices change the world around them.**

The game begins as a structured journey through financial literacy. Each completed level reveals a new lesson, unlocks a skill-tree node and a meaningful world interaction, and presents a scenario that the student resolves by returning to the town. Levels are rated with up to three stars. Mistakes reduce the initial rating, but are explained constructively and can be corrected through replay.

At the end of the guided curriculum, the town remains explorable. A special **Vanguard Financial Futures Centre** opens as an educational capstone. If time permits, returning to familiar institutions introduces fresh, context-aware scenarios through bounded AI NPCs. **The guided game must feel complete and valuable without any LLM features.**

**One-sentence pitch:** *Swipe through a vibrant Indian world, learn how money really works, and build financial confidence one decision at a time.*

### The real problem

Many students recognize words such as *Aadhaar, bank account, UPI, EMI, insurance, mutual fund,* and *inflation* without necessarily understanding how to navigate the associated processes, compare options, spot risks, or explain the consequences of a decision. Conventional reading material can struggle to bridge that gap. This game must teach practical understanding, not merely terminology or investment performance.

### Success is not wealth

A student does **not** win by being the richest, owning a house, buying a car, or beating poorer players. Completion means demonstrating sound understanding of banking, planning, saving, investing fundamentals, and financial safety. Visible possessions and environment upgrades are narrative consequences and optional rewards, **not proof of financial competence or human worth**.

---

## 2. Audience and Non-Negotiable Product Principles

1. **Mobile first, desktop excellent.** The phone experience is the primary design target; the laptop experience must be equally usable, not an enlarged phone mockup.
2. **Absolutely no personal information leakage.** Do not require or expose real Aadhaar/PAN numbers, bank-account details, OTPs, passwords, real addresses, financial histories, or other sensitive student information. All financial identities and transactions in gameplay are fictional. See the privacy section for release gates.
3. **Short, purposeful sessions.** The game should work well in brief, interruptible sessions and resume seamlessly. Reduce passive reading; make learners act, inspect, compare, and decide.
4. **Financially accurate, age-appropriate, and non-prescriptive.** Explain risks and trade-offs. Never position simulations as guaranteed outcomes or recommend particular securities or products.
5. **Visually unified and modular.** Reuse an approved art kit, character proportions, movement language, dialogue treatment, and interaction patterns. New places should look authored in the same universe.
6. **Culturally authentic without stereotypes.** Show modern and rural India as connected, contemporary, and diverse—not rural life as backward or cities as exclusively glass towers.
7. **Meaningful persistence.** Important choices and completed learning stay visible across sessions. The world acknowledges what the player has done.
8. **Understandable without AI.** Every required lesson, calculation, scoring decision, and world change works as a deterministic, testable learning experience. AI may enrich it later.
9. **Accessible by default.** Clear controls, readable text, keyboard alternatives, reduced motion, sensible touch targets, and a pathway toward Telugu and English narration/text.
10. **NGO-ready.** The experience must eventually support rollout, progress visibility, and learning evaluation without unnecessary collection of student identities.

---

## 3. Product Structure: Two Acts, One Continuous World

### Act I — The Guided Journey (must ship first)

- A sequence of approximately **12 curated levels** covering financial fundamentals.
- After a level is completed, the student receives the next compact learning reveal and an actionable scenario.
- The student is returned to the scrollable town and travels to the appropriate institution to resolve that scenario.
- A result screen awards **0–3 stars** according to a clear rubric, explains mistakes, updates the skill tree, and shows any new unlocks.
- Players may revisit completed locations, replay challenges, and see the cumulative effects of earlier decisions.
- Levels share a consistent interaction language but contain different, purposeful financial mechanics.

### Act II — The Living Town (post-completion)

- The town stays open after finishing the main journey; familiar buildings remain useful.
- **The Vanguard Financial Futures Centre** opens as a capstone for long-term financial fundamentals and approved educational resources.
- The initial postgame can be a curated collection of repeatable, variable financial scenarios. This must work even if AI NPCs are not ready.
- **Stretch goal:** An NPC remembers relevant in-game milestones and offers an appropriate new scenario or explanation when the player revisits a location.
- Postgame interaction must not degrade into endless generic chatbot advice. When possible, deliver new situations through the same interactive components used in the main game.

### The core loop

**Reveal a concept → Return to the world → Travel by scroll/swipe → Interact with a location → Make a financial decision → See its consequence → Get stars and mistake feedback → Grow the skill tree → Unlock the next situation.**

The character and environment are the connective tissue; the learning challenges are the substance.

---

## 4. Art Direction: Contemporary India, Urban and Rural

### Creative north star

**A polished, expressive 2D pixel-art storybook world with the warmth of an indie adventure game and the specificity of everyday India.** It should feel charming and contemporary, not infantilizing. Build original art; existing games are aesthetic references only, not material to imitate or copy.

### Show multiple Indias in one coherent journey

The scrollable world may transition between neighboring districts rather than becoming a huge open map:

- **Urban neighborhood:** Bank branch, apartments, grocery stores, pharmacy, transit stop, mobile shop, repaired pavements, cafés, offices.
- **Town/peri-urban high street:** Kirana market, small workshops, mixed-use homes, local businesses, bus stop, neighborhood financial services.
- **Rural-connected neighborhood:** Well-maintained village street, homes, agricultural supply outlet, local market, cooperative/community touchpoints, roads, smartphones, digital payments, and modern everyday infrastructure.

This is **not** a “poor rural versus successful urban” progression. Each district has economic activity, technology, dignity, and attractive design. Avoid poverty as scenery, cartoon accents, religious clichés, compulsory cows/bullock carts, and generic tourist imagery. Inspired by Hyderabad/Telangana, but sufficiently representative for a wider Indian audience. Telugu/English details may appear naturally and should be legible and reviewed.

### World composition

- A **side-on, scrollable streetscape** with consistent perspective, street line, horizon, and character scale.
- Buildings should have inviting, readable silhouettes; key services must be identifiable even before a sign is read.
- Rich but controlled environmental detail: trees, street lamps, signboards, awnings, parked two-wheelers, doors, shutters, bus stops, wires, rooftop water tanks, planters, stone/brick/plaster/glass textures.
- Avoid a world consisting only of shiny glass buildings **or** only of old, dusty buildings.
- Use modular facades, doors, windows, roof families, signage, pavement pieces, greenery, and lighting treatments so new locations inherit the same visual language.
- Keep backgrounds sophisticated, but foreground learning interactions visually clear.

### Consistent pixel-art rules

- Select a single logical pixel scale, character proportion system, perspective, and outline style for **all** world assets; never mix pixel densities casually.
- Use clustered shading, a limited coordinated palette, and crisp edges. Avoid photoreal textures pasted behind pixel sprites.
- Use a small, reviewed set of character archetypes with authentic variation in appearance and dress; avoid caricatures.
- Motion should be readable at phone size. Slightly exaggerate meaningful poses and silhouettes rather than adding more tiny detail.
- The world is pixel art; **financial forms, text, charts, and accessibility controls can be clean modern UI**, provided they use the same palette, corner language, icon system, spacing, and transition style.
- No random AI-generated assets should enter the final game unless they pass the visual consistency review.

### Suggested palette and tone (direction, not a compulsory set of codes)

Warm cream and sand; deep blue-ink; jade/teal; marigold; muted coral; leaf green; soft sky blue; earthy terracotta. Urban and rural locations share this family, with location-specific accents. Daylight-first with warm late-afternoon variants is preferable to a highly complex time-of-day system for the first release.

### Aesthetic acceptance test

Lay out a bank, a kirana shop, a rural-connected market, a player sprite, an NPC, and one financial modal side by side. An independent viewer should believe they were designed by the same art director and should be able to identify each place at a glance on a phone.

---

## 5. Motion Language: The Website Scroll *Is* the Game Controller

Motion is central to the identity, not incidental decoration.

### Movement between locations

- **One meaningful swipe** on a phone or an intentional scroll/trackpad gesture on desktop moves the player to the next destination or scroll snap-point.
- The character visibly turns, walks/runs/rides to the next place, and the camera travels with them. Do not simply replace one static background with another.
- Foreground, midground, and distant scenery move at different speeds to suggest depth; the road and building perspective stay consistent.
- Aim for a satisfying travel transition in approximately **0.7–1.1 seconds** under normal conditions; tune using real-phone testing rather than rigidly adhering to a number.
- Prevent accidental skipping of multiple locations from one wheel burst or swipe. Never trap the user in uncontrollable scrolling.
- When a level or modal is active, ordinary scrolling must work *inside that experience*, not inadvertently move the whole town.
- Use a clear interaction cue as the character arrives. Tapping a visible destination should also work.

### Signature transitions (different purposes, same visual grammar)

| Trigger | Transition direction | Learning/UX purpose |
|---|---|---|
| Arrive at a bank | Character slows; entrance light/shutter activates; camera gently approaches the door; interface takes over | Feels like physically entering the institution |
| Open a bank form | A document or counter surface unfolds into the interactive UI | Introduces the task without plain-text scene switching |
| Enter a UPI challenge | Phone emerges from the scene and expands into a legible transaction interface | Connects real-world objects to financial actions |
| Explore inflation | Market price tags shift while the scene changes between illustrative time points | Visualize purchasing power, not just define inflation |
| Compare loans | Offer cards fan out, then show principal, interest, and total repayment | Reveal the hidden cost of borrowing |
| Finish a level | Stars appear individually; skill-tree branch glows; a new world destination lights up | Make progress tangible |
| Return after a major decision | A limited persistent visual detail changes (vehicle, home item, institution recognition) | Reinforce cause and effect |
| Finish the guided journey | The Vanguard capstone location opens via a distinct but restrained reveal | Mark completion and introduce further learning |

### Motion discipline

- Animations should communicate **travel, cause, consequence, unlock, or focus**, not merely decorate every button.
- Passive dialogue motion should never delay students. Keep scene transitions short and skippable after the first viewing.
- Use subtle idle life (blinking windows, swaying leaves, moving signage), not endless motion competing with educational text.
- Honor reduced-motion preferences with instant or cross-fade transitions. Provide visible Previous/Next location controls and desktop keyboard options.
- Optional sound design: light footsteps, soft arrival cues, paper/coin feedback, restrained star chime; easy global mute, no sound-dependent assessment.

---

## 6. Level Design and Curriculum

### Level shape

Every core level should have:

1. **Hook:** An NPC or situation makes the financial problem immediately understandable.
2. **Micro-lesson:** A short and accessible demonstration of the necessary idea—ideally interactive rather than a lecture.
3. **Town return:** The student navigates to the institution and begins the task.
4. **Decision:** The student manipulates an authentic-feeling *fictional* interface, document, number, or financial option.
5. **Consequence:** The result is visualized and explained. Not every situation has a single simplistic “richest” answer.
6. **Feedback:** The game identifies exactly what was misunderstood.
7. **Assessment:** A small variation checks whether the student can apply the concept without merely memorizing the first answer.
8. **Stars + skill tree + unlock:** Progress is saved; a new concept or town state becomes available.

Target a typical **3–6-minute level**, with the first meaningful action appearing quickly. A difficult lesson may take longer if the interaction is engaging. Avoid lengthy mandatory narration or walls of text; pause/resume is essential.

### Proposed twelve-level foundation

| Level | Financial skill | Scene / institution | Example player task | Risk or misconception to address |
|---|---|---|---|---|
| 1 | Money, needs/wants, budgeting | Home / market | Allocate a fictional allowance or scholarship | Spending all funds on wants leaves no room for essentials |
| 2 | Financial identity and banking | Bank | Explore accepted identity documents and open a fictional eligible account | Aadhaar is **not** universally compulsory for every financial task; minors have distinct rules |
| 3 | Saving, deposits, interest | Bank | Compare saving decisions over time | Balance growth, liquidity, and financial goals differ |
| 4 | UPI basics | Mobile shop / payment counter | Authorize a fictional transfer and check recipient details | A UPI PIN authorizes a payment; it is not needed to receive money |
| 5 | Fraud and financial safety | Phone shop | Investigate messages, links, requests, OTP/PIN prompts | Urgency, impersonation, and unsafe authorizations |
| 6 | Spending, receipts, taxes | Kirana/high street market | Follow a budget and inspect a receipt | Price, discounts, and taxes can change total cost |
| 7 | Inflation and purchasing power | Market | Compare a basket of goods across time | Money's numerical value is not its purchasing power |
| 8 | Earnings and basic taxation | Workplace / services | Read a fictional payslip or income breakdown | Gross pay, take-home pay, and deductions differ |
| 9 | Loans and EMI | Vehicle showroom / lender | Compare borrowing offers and total repayment | Low EMI may hide longer tenure, fees, and a larger total cost |
| 10 | Insurance and emergency planning | Insurance desk / workshop | Inspect a policy and handle a covered or uncovered event | Exclusions, deductibles, maintenance, and emergency savings all matter |
| 11 | Investment instruments | Financial learning centre | Compare FD, bonds, mutual funds, equities, and risk/time horizons | Return is not guaranteed; liquidity and risk differ; no stock picking |
| 12 | Financial independence fundamentals | Town-wide capstone | Resolve connected budgeting, banking, borrowing, safety, and savings choices | Sound financial reasoning across different situations |

The twelve levels are a curricular **starting proposal**, not an inflexible storyboard. Validate the order and scenarios with NGO educators, especially students' prior exposure and language preferences. Explicitly cover Vanguard's four learning pillars: **plan and budget; save and manage; understand investing; stay financially safe**.

### Especially important: teach the downsides of loans

The borrowing level must make the costs and risks tangible—not just explain that an EMI makes a purchase affordable. Students should interactively discover:

- Principal versus interest versus fees, and the **total amount repaid**.
- Why extending a loan term may lower monthly EMI but increase total interest.
- How repayments compete with rent, essentials, savings, and emergencies.
- The consequences of missing repayments, late charges, and harmful overborrowing (under the fictional scenario's stated assumptions).
- Why an advertised “easy loan” can be misleading; encourage examination of the complete terms and borrowing only for understood, manageable purposes.
- When borrowing can be useful versus when declining or postponing is safer. **Do not teach that all loans are inherently bad.**

Do not present borrowing a large loan or buying a car as a mandatory achievement for every student. Such choices can be explored through a fictional future-adulthood scenario. Likewise, lack of insurance does **not** cause a car to break down: insured events, policy coverage, mechanical maintenance, and financial preparedness must be modeled and explained correctly.

---

## 7. Skill Tree and Stars

### Skill tree: visible growth after every level

Create a satisfying, illustrated skill-tree screen that gradually fills as students progress. Use a small number of intelligible branches rather than dozens of tiny skills:

- **Money Management:** needs/wants, budgeting, saving.
- **Financial Access:** identity, banking, digital payments.
- **Financial Safety:** fraud, consumer awareness, insurance.
- **Borrowing & Responsibilities:** income, taxes, loan costs.
- **Understanding Growth & Economy:** inflation, investment instruments, risk.

A completed mission lights the relevant node, visually connects it to previously acquired concepts, and previews the next available skill. Some nodes unlock a new building; others unlock a new challenge in an existing building. Unlock rules should be easy to explain and not force perfection before continuing.

### Three-star scoring

- **3 stars:** The student handles the core decision safely/correctly and transfers the principle to a new situation with little or no help.
- **2 stars:** The student reaches a sound outcome after a meaningful mistake, correction, or limited hints.
- **1 star:** The student completes the learning objective with substantial help, or recovers from repeated mistakes.
- **0 stars / Try again:** The essential learning outcome is not yet demonstrated, or a critical safety misconception remains unresolved.

**Mistakes reduce the stars earned on that attempt.** Explain the deduction immediately and constructively, without shaming. A student can replay the level to improve their **best-star rating**; preserve the initial attempt privately so improvement can be measured. No penalties based on reaction time, disability, language proficiency, starting virtual wealth, or random events. Financial safety mistakes should be treated seriously without humiliating players.

### End-of-level mistake review

At the end, show a short **“What changed my result?”** review:

- The player's decision and the correct/safer alternative.
- The financial concept involved.
- Why the original choice could create risk or cost.
- A chance to retry or revisit an explanation.
- A small pointer to the relevant skill-tree node.

Record only **educational error categories and progress information**, not sensitive personal data or raw private conversations. These categories may later inform optional AI-generated practice within the approved curriculum.

### No unhealthy leaderboard

Do not rank students by wealth, possessions, or financial status. Stars, skill-tree progress, and personal improvement are sufficient for the initial release. Optional future community challenges should reward financial reasoning and cooperation, never greed or exclusion.

---

## 8. Meaningful Persistence and World Change

The world should feel like the **same place over time**. A completed level, past choice, or earned capability must be remembered when the student comes back.

Possible visible consequences:

| Earlier choice or learning | What changes later |
|---|---|
| Opened fictional bank account | Bank becomes a usable recurring institution; teller acknowledges previous progress |
| Learned saving and met a small fictional goal | Savings information and a modest home detail evolve |
| Reached a skill milestone | New institution, service, or chapter becomes available |
| Entered a fictional installment obligation | Later budgeting cases acknowledge recurring repayment pressure |
| Experienced fraud safely in a lesson | Later scenarios may contain a recognizable warning-sign callback |
| Inspected insurance coverage | A future incident distinguishes covered and uncovered costs |
| Acquired an optional fictional vehicle | Traversal can change from walking to riding; realistic setbacks may restore walking temporarily |
| Completed the core curriculum | The Vanguard capstone opens and the town becomes a place for continued exploration |

**Don't build an entire simulated national economy.** Curate a limited number of causally clear consequences. Avoid surprises that make it impossible to know whether an outcome was caused by the student's decision or by randomness.

Players must be able to leave, return, and continue at the correct location with their skill tree, star records, virtual finances, and visible upgrades intact. Support interruption and unreliable connectivity gracefully. Students must not lose progress just because they close the browser.

---

## 9. Postgame and Optional AI NPCs — Strictly Later

**AI NPCs are explicitly a lower-priority feature.** Do not sacrifice the scrollable world, polished level loop, mobile support, privacy, or saved progress to build them early.

### First ship the no-AI postgame

- Revisit familiar institutions.
- Offer a rotating library of verified short challenges and new variations using existing interaction patterns.
- Reference the player's fictional milestones using established game state.
- Make the Vanguard centre an optional ongoing educational destination.

### If time permits: contextual AI NPCs

- NPCs may recognize completed skills and selected **non-sensitive** mistakes and choose an appropriate follow-up topic.
- The NPC should ask useful questions and lead students into a relevant interactive challenge rather than merely deliver generic advice.
- Reuse existing financial interaction templates. **Do not require newly generated custom interfaces for every line an LLM invents.**
- The model may personalize dialogue and select from approved learning situations; it must not invent authoritative banking requirements, alter account balances, assign grades independently, or make personalized investment recommendations.
- The educational rules, calculations, allowed actions, and critical safety guidance remain verified outside model-generated prose.
- A full fallback experience must exist whenever an AI response is absent, slow, inappropriate, or unavailable.

### Mistakes as future practice signals

The end-of-level educational mistake categories may support additional practice—for example, *confuses amount received with amount paid*, *overlooks total loan cost*, or *misunderstands inflation*. Only the **minimum anonymous category and appropriate difficulty** should be exposed to any external AI service, and **only after provider, privacy, and NGO approval**. Never submit student identity, credentials, raw student interactions, or unnecessary financial history to an external model.

---

## 10. Vanguard Integration

Treat Vanguard as the **educational partner and capstone**, not as a store selling financial products.

- The player should see appropriate partner acknowledgment in the overall experience if Vanguard approves it.
- Completing the core skill tree unlocks the **Vanguard Financial Futures Centre** in the town.
- The centre provides approachable, interactive foundations of long-term planning, risk, diversification, compounding, and financial decision-making.
- Students may choose to open **official, approved Vanguard educational material** through a clearly labeled external link. Never send them unexpectedly to an external website or simulate a product purchase.
- Obtain permission for branding, logos, names, the centre's wording, and any references to a specific Vanguard product.
- Follow the brief's explicit guardrail: **educate, do not recommend investments; simulated outcomes are assumptions, not promises.**

The finale should feel like a graduation into further learning, **not an advertisement interrupting the story**.

---

## 11. Privacy, Safety, and Trust — Release Blocker

**No personal information leak is acceptable.** Treat this as a launch requirement, not a polish task. No team can honestly guarantee that software is invulnerable, so the product must use data minimization, appropriate protections, review, and testing—and **must not launch if significant leakage risks remain**.

### Required safeguards

- **Never request real financial identifiers:** Aadhaar/PAN, real bank account or UPI IDs, OTPs, passwords, real income, real loan details, or actual payment credentials.
- All forms, screens, balances, and identities involved in teaching financial mechanics must be unmistakably **fictional/simulated**.
- Prefer pseudonymous student progress; collect only what the NGO genuinely needs, under approved consent and age-appropriate policies.
- Students must not be able to see each other's progress or records unless there is a deliberate, approved, privacy-safe educational reason.
- Educator reporting should emphasize aggregate skill growth and necessary individual assistance, not unnecessary personal profiles.
- Avoid third-party analytics, trackers, ads, unnecessary SDKs, and external model calls that transmit identifiable student activity.
- Test authorization, session handling, shared-device behavior, logout, browser back/resume, and accidental exposure through links, logs, error screens, exports, and prompts.
- Establish clear policies for retention, deletion, vendor access, and incident response before any NGO deployment.
- AI features remain disabled until an explicit data-flow and safety review has been completed.
- Financial calculations and advice must be checked against reliable Indian sources and reviewed for accuracy, including RBI, NPCI, SEBI, and relevant official educational materials.

**Privacy acceptance gate:** Demonstrate that the game works without any real student financial information and that no student can access another student's learning state. Validate deployment and any optional external-provider data flow before involving real NGO learners.

---

## 12. Mobile-First Experience and Accessibility

Mobile is the primary target. Desktop must feel intentionally designed, not merely compatible.

### Mobile priorities

- A portrait-friendly default with a clear focal building and usable swipe gestures; support varying phone aspect ratios and browser UI.
- Legible text and financial numbers without pinch-zoom.
- Financial tasks displayed in focused panels/sheets that do not interfere with town swiping.
- Finger-sized tap targets, comfortable spacing, minimal typing, and clear back/close states.
- Quick initial meaningful interaction, compact assets, and stable animation on ordinary Android phones.
- Graceful pauses, app switching, reconnecting, and resuming; avoid heavy mandatory downloads before the first lesson.

### Desktop priorities

- Wider view of the same coherent environment; nearby destinations can be visible.
- Natural wheel/trackpad, click, and keyboard navigation, with predictable snap-to-location behavior.
- Financial interfaces can use the additional space without becoming too wide or difficult to scan.

### Inclusive interaction

- Reduced-motion mode, mute controls, alternative navigation buttons, keyboard focus, accessible contrast, and readable content.
- Plan for Telugu and English; support Hindi/Urdu or other local languages based on the NGO's actual audience rather than assumptions.
- Avoid making reading speed or reaction speed a source of star loss.
- Try the game with real students on real devices, including people unfamiliar with games.

---

## 13. AI-First Design and Production Workflow — Research-Backed Recommendations

**Creative production mandate: AI should perform the actual design and implementation work.** The team should not have to manually draw characters, animate sprites frame by frame, lay out every screen in a design application, or hand-rebuild visual mockups. A human product owner supplies the brief, chooses between AI-generated directions, verifies cultural/educational accuracy, and approves a small number of key milestones. **Zero human drawing is the goal; zero human taste, oversight, or verification is not realistic.**

This section recommends optional, interoperable tools, not a compulsory technical implementation. The implementation model may substitute demonstrably better tools, provided it produces original, coherent, licensable assets and achieves the acceptance criteria. Verify current access, pricing, credentials, licensing, and compatibility before selecting vendors. Features cited here were checked against public tool/vendor documentation in October 2026; availability may change.

### 13.1 Recommended lean setup (do not install everything)

**Primary recommendation: one world-asset generator + one AI design canvas + one agent-driven browser-quality loop.**

| Job | First choice | Why it fits this project | When to switch / caveat |
|---|---|---|---|
| Pixel-art characters, run/idle sprites, side-scrolling tiles, props | **[PixelLab MCP](https://www.pixellab.ai/mcp)** | Dedicated pixel-art tool with MCP for Claude Code, Codex CLI, Cursor; supports characters, sprite animations, sidescroller tilesets, map objects, image editing, and reference-based style matching. The agent can request assets instead of someone drawing them. | Requires an account/subscription for agent tools. Generated frames may still need automated or occasionally manual QA/correction. |
| AI-operated design canvas for level cards, HUD, dialogs, skill tree, banking interfaces | **[pen.dev](https://pen.dev/) (formerly Pencil)** | An agentic visual canvas with integrated agents and an MCP bridge for external coding agents; agents can generate, inspect and edit reusable layouts while maintaining a shared direction. | Requires its application/extension and MCP connection for external agents. **Choose this OR Stitch as the primary UI design system; do not run parallel design systems.** |
| Alternative AI UI design and agent skills | **[Google Stitch](https://stitch.withgoogle.com/) + [Stitch Skills](https://github.com/google-labs-code/stitch-skills)** | Generates/refines interface designs and exposes agent skills/plugins for Codex, Claude Code, Cursor, and other agents. Useful for responsive financial interaction panels and game menus. | A UI generator, **not** a replacement for consistent pixel sprite/tileset production or an actual game renderer. |
| Visual screenshot testing and iteration | **[Playwright for Codex](https://developers.openai.com/codex/use-cases/frontend-designs)** or equivalent agent browser tooling | Automates screenshots, navigation, responsive comparison, and corrective iterations. Official Codex guidance specifically recommends comparing design references on mobile and desktop. | Automated visual checks are necessary but don't replace a real-device test. |
| Stronger consistency for a large asset library | **[Scenario](https://www.scenario.com/)** | Supports custom style/character models and sprite production, useful if reference-driven PixelLab output drifts as more locations are generated. | Optional second-stage tool; model training and licensing/access may have costs. Don't introduce it until PixelLab's results have been tested. |
| Shared editable design files / agent handoff | **[Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)** | Agents can read design context and, where supported, create/edit native design content; connects to Claude Code, Codex, and Cursor. | Optional, especially if pen.dev/Stitch already keeps the visual system coherent. Check plan and client-dependent features. |
| Distinctive interface taste on Claude Code | **[Anthropic frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)** | Anthropic's own design skill emphasizes intentional palette, typography, layout, motion, and rejecting template-like aesthetics. | A design-guidance skill, not a pixel-art generator. Pair it with PixelLab and an actual visual QA loop. |

**If the team wants the fewest services:** start with **PixelLab MCP + pen.dev MCP + one coding agent with screenshot/browser validation**. If pen.dev is unavailable, choose **Google Stitch MCP + Stitch Skills** instead. Add Scenario or Figma only when a concrete production problem justifies them.

### 13.2 Recommendations by development environment

| Environment | Most useful agent additions | Role |
|---|---|---|
| **Claude Code** | PixelLab MCP; pen.dev MCP **or** Stitch MCP + Stitch Skills; Anthropic's frontend-design skill; browser/screenshot testing capability | Generate pixel-art content from prompts, lay out screens visually, produce non-generic interface code, compare with the approved reference. |
| **OpenAI Codex / Codex CLI** | PixelLab MCP; pen.dev MCP **or** [Google Stitch plugin suite](https://github.com/google-labs-code/stitch-skills); [Playwright interactive skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright-interactive) | Execute AI art and UI workflows, test the actual web app at mobile/desktop sizes, fix visual mismatches. |
| **Cursor** | PixelLab MCP; pen.dev MCP **or** Stitch MCP + Stitch Skills; browser testing tool | Same creative workflow from the IDE, with access to reference assets and design guidance. |
| **Other MCP/skills-capable AI agents** | Prefer portable MCP integrations and [Agent Skills](https://agentskills.io/) descriptions when supported; PixelLab and Stitch offer compatible workflows across multiple clients | Use the exact same art bible, character references, UI tokens and visual tests regardless of which model writes the code. |

A **plugin** is not the same thing as an MCP server or a skill. PixelLab provides a remote MCP design tool; the Google repository distributes agent plugins/skills that require Stitch access; `frontend-design` is a design-guidance skill; browser skills test the result. Confirm installation from each tool's current **official** instructions—avoid unmaintained look-alike MCP packages. Never paste access tokens into the repository, prompts destined for public logs, or screenshots.

### 13.3 Official setup references (agent should follow current docs)

- **PixelLab:** [MCP integration](https://www.pixellab.ai/mcp) and [ways to use PixelLab](https://www.pixellab.ai/docs/ways-to-use-pixellab). The provider documents ready-made client configurations for **Claude Code, Codex CLI, and Cursor**. It provides remote HTTP MCP tooling; some clients may need the documented transport bridge. Keep token values in secure configuration.
- **Stitch:** [Official Stitch skills and installation guide](https://github.com/google-labs-code/stitch-skills). The repo documents `stitch-design`, `stitch-build`, and `stitch-utilities`, including installation guidance for Codex, Claude Code and Cursor. The underlying **Stitch MCP connection must also be configured**.
- **pen.dev:** [AI integration documentation](https://docs.pencil.dev/getting-started/ai-integration). Open the intended design document in the app/extension, then connect the agent through its documented MCP flow. Availability of certain canvas/browser/parallel-agent tools depends on the active host/settings.
- **Figma:** [Official Figma MCP guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server). Available operations depend on access level and client support; don't assume every agent can perform every write-to-canvas action.
- **Claude Code:** [Anthropic's frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md).
- **Codex:** [Official responsive frontend workflow](https://developers.openai.com/codex/use-cases/frontend-designs) and [agent skills documentation](https://developers.openai.com/codex/build-skills).
- **Scenario:** [Official game-asset site](https://www.scenario.com/) and [sprite-generation discussion](https://www.scenario.com/blog/ai-sprite-generator). Test frame accuracy and intellectual-property/licensing terms before shipping.

### 13.4 The AI production process: from brief to a reproducible world

**Stage A — Generate the canonical art direction (before generating a dozen shops)**

1. Give an agent this plan and ask for **three intentionally different** pixel-art interpretations that all preserve the non-negotiables: contemporary, aspirational India; urban plus rural-connected settings; side-scrolling world; teen-appropriate, warm but not childish; original work rather than imitation of any specific game.
2. For each direction, have the agent generate the *same test scene*: one bank, one kirana store, one modest home, one street with vegetation and signage, one protagonist, one NPC, and a background transition. This makes the candidates comparable.
3. Have the agent evaluate and revise the candidates against readability on a small phone, coherent lighting, sprite proportions, visual density, contemporary/rural balance, and cultural authenticity. Present the strongest two for **one human selection**, not an endless manually designed moodboard.
4. Freeze an **art bible** containing: canonical full-scene reference, source pixel density/scale, perspective, character proportions, outline and shading rules, exact palette/token families, lighting, architectural kit, signage rules, character diversity rules, negative prompts, and examples of acceptable vs rejected visuals.
5. Version the approved reference assets. New AI generations must use them as references; never rely on prompts alone to recreate the house style.

**Stage B — Automatically generate a reusable modular asset kit**

Ask the agent, using PixelLab, to generate **coordinated** assets rather than unrelated complete scenes:

- One protagonist with consistent **idle, walk, run, arrival, interaction** cycles; both travel directions, plus optional vehicle pose later.
- A small recurring NPC cast with consistent proportions, silhouettes, and expressive but readable idle loops.
- Rural-connected and urban facade modules sharing the same pixel grid, material ramps, street baseline, doorway size, and lighting model.
- Repeatable side-scroller road/pavement tiles, greenery, awnings, windows, shutters, signs, planters, rooftops, and street props.
- A few unique institution-specific foreground pieces, not one entirely separate art style per institution.
- Foreground, middle-ground, and distant scenery suitable for subtle parallax.

The agent must automatically check dimensions, transparency, sprite-sheet frame layout, animation pose continuity, tile-edge seams, palette drift, outlines, unwanted generated lettering, collisions/placement, and phone-scale readability. Regenerate or repair failures, including with available image-edit/inpaint operations. Use authored vector/text overlays for institution names and Telugu/English labels rather than trusting generative image text.

**Stage C — Generate the real financial UI using an AI design canvas**

Give pen.dev **or** Stitch the approved art bible and a small reference bundle from the pixel world. Ask the agent to produce the following **as one coherent design family**:

- Mobile-first town HUD with chapter, progress, location and accessible navigation.
- NPC dialogue card, skip/continue states, and readable multilingual text areas.
- Bank form/document inspector, UPI payment interface, savings and EMI calculator, financial option comparison, fraud investigation panel.
- Three-star results with mistake deductions and review; illustrative skill-tree with unlock transitions.
- World-loading state, low-connectivity/error state, resume state, and Vanguard capstone entrance.

Require **phone and desktop versions of every key screen**, not a desktop image scaled down. Financial figures, labels and forms must be easy to read; pixel-world art may be retro while controls remain crisp, accessible modern UI. Feed the generated screens back into the coding agent as concrete implementation references.

**Stage D — Animate and integrate through the agent**

The AI coding agent should implement the actual scroll-triggered character travel, camera motion, scene entry/exit, price-tag transformations, object-to-interface morphs, skill-tree reveals, star-loss feedback, and persistent visual consequences from the assets and interaction designs. The agent should choose the most appropriate browser-capable rendering/animation tools; **do not impose an arbitrary animation library or build a custom engine unless justified**.

Motion brief remains fixed: **one deliberate wheel/swipe = one destination**; character visibly travels rather than the screen simply switching; ~0.7–1.1-second normal travel as a starting feel target; modal scrolling doesn't accidentally move the town; reduced motion is supported. Build and evaluate on a phone-sized viewport first.

**Stage E — Agent-operated visual QA, not manual pixel pushing**

1. Start the actual web experience and capture screenshots at representative narrow phone, larger phone, and desktop sizes, plus key motion/video frames where possible.
2. Compare against the art bible and approved layouts. Automatically log discrepancies: non-matching sprite grid, misaligned shops, blurry nearest-neighbor scaling, inconsistent art style, clipped forms, overlapping tap targets, unreadable Telugu, transitions that end in the wrong spot, and dropped frames.
3. Ask the agent to fix the **highest-impact visual defect** and repeat. Do multiple evidence-based passes instead of hoping the first generated mockup looks good.
4. Test touch/swipe semantics, scrolling inside forms, browser back/resume, keyboard alternatives, reduced motion, and persistence.
5. Review on at least one real Android phone. Automated screenshots alone cannot prove swipe feel or device performance.

**Stage F — Freeze approved design primitives**

Once a component or sprite family passes QA, store it in the canonical asset/design library and instruct all future agents to **extend it, never reinvent it**. A newly generated building must pass the same pixel/art/style rules before it enters the town. This is how AI-made designs become distinctive and consistent over dozens of levels.

### 13.5 Reusable prompts to hand to Claude Code, Codex, or Cursor

The following are **creative task prompts**, not source code or forced architecture. Agents should work in small iterations and produce viewable evidence.

**Prompt A — Art-direct the world**

> Read `plan.md` as the product and design contract. Using the available pixel-art generation tools, create three distinct, high-quality concepts of a side-scrolling Indian financial-learning town for older teenagers. Show authentic contemporary urban streets, town high streets and dignified rural-connected neighborhoods in one cohesive world. Avoid clichéd rustic, dusty, impoverished, caricatured, or glass-only environments. Use a fixed pixel grid, consistent perspective and character scale. Include a bank, market, home, player and NPC in every concept. Produce mobile-sized previews, critique them against the plan, refine, then recommend one direction. Don't implement all levels yet.

**Prompt B — Generate the modular world kit**

> Take the approved world image and art bible as **immutable visual references**. Use PixelLab's agent tools to produce a small reusable asset family: protagonist idle/walk/run cycles; one NPC; one bank exterior; one kirana facade; road, pavement, roof, window, door, signage and vegetation tiles. Keep the source pixel scale, palette, material shading, lighting and outline exactly consistent. Inspect animation frames and tile seams; repair inconsistencies before integrating. Show the resulting town on a phone viewport and a desktop viewport.

**Prompt C — Design the financial interfaces with AI**

> Use the approved world art bible in the connected pen.dev or Stitch design tool. Design one coherent mobile-first interface family for the bank-account challenge, UPI safety challenge, NPC dialogue, three-star results, mistake review and skill tree. These should feel like they belong inside the pixel-art game while keeping text and financial controls crisp and accessible. Generate responsive phone and desktop versions and test realistic long text/Telugu layouts. Avoid generic SaaS cards and dashboard patterns. Provide design frames for implementation.

**Prompt D — Implement travel and verify it visually**

> Implement the world as a browser-playable mobile-first experience using the generated modular art. A single swipe/wheel gesture moves the character to the next building with a natural run/walk loop, aligned camera movement, a distinctive arrival and an interactable entrance. Do not substitute a slideshow or plain text transition. Provide reduced-motion controls and desktop alternatives. Run automated browser screenshots and interaction tests at phone and desktop sizes, identify visual defects, fix and repeat until the result matches the approved references.

**Prompt E — Finish one production-quality educational level**

> Build one complete simulated banking lesson, including context, concise teaching, an interactive fictional form, correct financial identity/KYC explanations, safe mistakes, proportional star deductions, end-of-level review, a visible skill-tree unlock, and persistent progress. The user must be able to leave and resume. Test that no real financial personal information is required or exposed. Prioritize polished behavior and accurate educational feedback over adding another empty location.

**Prompt F — Run the anti-generic art review**

> Compare the playable game, sprite sheets and UI against the canonical references. Reject mismatched pixel density, blurry sprites, inconsistent lighting, duplicated generic glass buildings, stereotyped rural imagery, cluttered phone screens, template-like gradients/cards, unreadable text, fake financial flows, and transitions without meaningful character movement. Propose and implement the three most important fixes, then capture before/after evidence.

### 13.6 Specific roles for AI agents (logical responsibilities, not required separate models)

- **Art Director Agent:** Owns visual consistency, art bible, negative references, and output acceptance criteria.
- **Pixel Asset Agent:** Drives PixelLab; produces/refines sprites, scenes, props and reusable tiles from approved references.
- **UI/UX Agent:** Uses pen.dev or Stitch to create consistent gameplay and financial interaction screens for mobile and desktop.
- **Motion/Frontend Agent:** Makes the town swipeable/scrollable with expressive, purposeful transitions and integrates the screens.
- **Learning/Finance Reviewer Agent:** Checks that explanations are understandable, Indian financial examples are accurate and loan risks are not minimized. Defers legal/current claims to official sources and human review.
- **Visual QA/Privacy Agent:** Takes screenshots, checks real-device behavior, tests edge cases and scans proposed external AI/design workflows for accidental student-data disclosure.

These roles may be handled by **one agent working sequentially**. Running several creative agents at once is not automatically better; competing aesthetics will cause style drift unless a single art bible and sign-off system govern them.

### 13.7 What not to outsource blindly to AI

- **Student data:** No real student identities, grades tied to names, raw conversations, IDs, images or financial details should be sent to design tools, image generators or LLM vendors. Design prompts use only fictional characters, fictional cases, and synthetic examples. Any external AI feature requires a separate privacy assessment and NGO approval.
- **Licensing:** Check commercial-use, derivative-use, training/reference-upload, and output ownership terms before importing generated game assets. Do not ask a tool to duplicate a copyrighted game's sprites or another studio's visual assets.
- **Financial accuracy:** AI-generated diagrams and dialogue about KYC, minors, UPI, loans, inflation, insurance and investment risk are drafts until checked against current RBI, NPCI, SEBI, NCFE and relevant educational guidance.
- **Text in images:** Generated sign text, phone numbers, account identifiers and regional scripts are error-prone. Generate the art, then render actual text as controlled app content.
- **Accessibility:** An impressive screenshot is not proof of legibility, control size, contrast, multilingual support or keyboard usability.
- **Claims of exactness:** No current generator guarantees pixel-perfect style matching from prompts alone; reference locking, repeatable generation, inspection, and refinement are still essential. The user should choose the canonical visual direction, not draw the artwork.

### 13.8 Art and UI acceptance criteria for the AI pipeline

A proposed asset/screen passes only if it satisfies all relevant points:

1. Clearly recognizable as the **same original game's** art across town, interiors, UI and skill tree.
2. Current urban and rural-connected settings shown with equal care and modern dignity; no stereotypes.
3. Character remains recognizably identical through each animation frame and state.
4. Pixel density, outlines, palette, lighting and perspective match the canonical reference.
5. Navigation genuinely animates the character and street; it is not a carousel of static screenshots masquerading as gameplay.
6. Actual gameplay remains readable and tappable on a representative phone in portrait orientation.
7. Loan/fraud consequences are educationally correct, explained, and not merely punitive.
8. Star loss and mistake review are visible, fair and do not discourage replay.
9. Nothing asks the student for real Aadhaar/PAN, account, OTP, phone or other financial personal information.
10. Agent-generated assets are licensed/approved for intended use, and the app runs without the design-generation service connected.

### 13.9 Optional implementation suggestions — explicitly non-binding

A coding model may consider a browser-native game renderer plus a responsive interface layer and a secure persistence backend. Examples previously considered include Phaser for 2D scenes, React/TypeScript for financial interfaces, and a hosted database service for safe progress synchronization. **These are reference options, not requirements.** Choose the approach that best preserves mobile performance, modular sprite production, reliable persistence, maintainable lesson content and privacy. **Do not derive directory trees, database schemas, API specifications or forced package lists from this document.**

---

## 14. Product Execution: Priorities and Checkpoints

### P0 — Prove the game feels like a game

First use an AI design agent to generate and approve one canonical art direction and reference screen family. Then build a short playable slice containing:

- One attractive urban-to-rural-connected stretch of town using the approved art system.
- One character with a satisfying scroll/swipe-triggered movement cycle.
- Smooth entry/exit animations for **one** institution.
- One complete educational scenario with an interactive financial interface.
- A result screen with star loss for mistakes, a concise mistake review, and one skill-tree unlock.
- Saved progression and a demonstrated visible world change.
- Working phone and desktop interaction; phone quality takes precedence.

**Do not expand the world until this slice is genuinely polished and independently understandable.** Use the AI-first generation + reference-locking + automated visual-QA workflow in Section 13 to reach that quality bar.

### P1 — The credible hackathon product

- Add 2–4 polished, varied levels across a small set of locations.
- Demonstrate at least one repeated visit that remembers an earlier decision.
- Show one clear negative borrowing outcome or equivalent financial consequence using accurate assumptions.
- Complete the skill-tree presentation and replay-to-improve-star experience.
- Show a respectful, approved concept of the Vanguard capstone even if not all main levels are implemented.
- Demonstrate a simple privacy-safe educator progress summary if capacity allows.

### P2 — Full guided journey

- Complete, validate, and polish the ~12-level curriculum.
- Expand the modular world thoughtfully with rural and urban environments.
- Add appropriate languages, accessibility refinements, and robust NGO rollout support.
- Test comprehension, transfer, player enjoyment, and reliability with representative learners.

### P3 — Postgame intelligence, only after the above works

- Release curated postgame experiences first.
- If approved and feasible, add bounded NPCs that personalize dialogue and choose additional verified scenarios using safe learning-mistake categories.
- Prove that postgame advice is relevant, financially accurate, non-repetitive, privacy-safe, and more useful than an ordinary chatbot.

### Protect these priorities from scope creep

**Never trade away P0/P1 polish to create more empty buildings, elaborate AI conversations, economy simulations, leaderboards, full 3D movement, or arbitrary LLM-generated interfaces.**

---

## 15. Playtesting and Definition of Done

### Essential tests

1. **First-time comprehension:** A student can understand how to move, enter a shop, and begin the first interaction without a long tutorial.
2. **Mobile usability:** The main game works on representative Android phones with responsive swipes, readable forms, stable transitions, and reliable session recovery.
3. **Desktop usability:** Keyboard, wheel, trackpad, and mouse paths all work predictably.
4. **Art consistency:** Urban, peri-urban, rural, interiors, NPCs, HUD, and star screens visibly belong to the same world.
5. **Educational correctness:** An educator reviews financial explanations, loan downside simulations, fraud examples, and age-sensitive banking/identity claims.
6. **Learning transfer:** After instruction, students can solve a related but different scenario—not just repeat memorized clicks.
7. **Fair scoring:** Mistakes lower stars with clear explanations; hints and retries allow recovery; students are not punished for accessibility needs.
8. **Continuity:** Reloading or returning later preserves levels, stars, selected relevant consequences, and the next unlocked skill.
9. **Privacy:** No real financial identifiers are entered or needed; no unauthorized exposure of student activity or progress; all external data flows are reviewed.
10. **Graceful failure:** Weak connections or unavailable optional AI never corrupt progress or strand a student.

### Success measures to pilot (not assumed results)

- Students who can independently complete the first navigation and mission.
- Completion and voluntary replay rates by level, without rewarding excessive screen time.
- Concept-specific mistakes before versus after practice.
- Performance on **new** scenarios testing the same financial concept.
- Whether students return and can resume successfully.
- Whether NGO educators find the progress information actionable.

### When the demo is ready

A new player can **swipe through an attractive Indian street; enter a bank; learn and solve a financial problem; make a realistic mistake; lose a star; understand why; retry; earn a skill-tree unlock; see the town change; and return later to find that change still present.** It must work convincingly on a phone. The complete experience must not depend on an LLM response.

---

## 16. Instructions for the Implementation Model / Team

This document describes the **product contract**, not a fixed engineering solution.

You are empowered to select or adapt the rendering approach, animation strategy, application framework, state management, storage, hosting, authoring workflow, and optional AI integrations. Choose the simplest maintainable approach that best meets the experience, privacy, educational, mobile, and design requirements.

Do **not** read this as permission to substitute generic cards for a living scroll-driven world, to neglect responsive mobile interaction, or to replace tested financial lessons with unverified LLM-generated content.

**Make thoughtful trade-offs, but preserve these non-negotiable outcomes:**

- Beautiful, cohesive, modular pixel-art India including contemporary **urban and rural** life.
- Website scroll/swipe visibly triggers character travel and interesting state transitions.
- Guided levels with practical Indian financial fundamentals, including the **risks of loans**.
- Transparent 0–3-star scoring, constructive mistake review, and a skill-tree unlock after every level.
- Meaningful saved world/player progression and at least one visible consequence.
- **Mobile-first** performance and strong desktop support.
- **No real financial personal information and no unauthorized data exposure.**
- The Vanguard educational capstone follows verified learning outcomes and approved branding.
- LLM-driven NPC revisits remain **optional and late**; the game must succeed without them.

**Creative ambition is welcome. Unnecessary complexity is not.**

---

## Reference and review links

- Vanguard hackathon brief: *Empowering the Next Generation Through Financial Literacy* (provided PDF; four pillars, accessible game-based learning, NGO integration, no investment recommendations).
- [PixelLab MCP](https://www.pixellab.ai/mcp) — agent-operated pixel-art characters, animations, tilesets and props; see [PixelLab documentation](https://www.pixellab.ai/docs/ways-to-use-pixellab).
- [pen.dev MCP](https://docs.pencil.dev/getting-started/ai-integration) — AI-operated design canvas for mobile/desktop game and financial interfaces.
- [Google Stitch Skills](https://github.com/google-labs-code/stitch-skills) — agent-ready UI design/build skills, alternative to pen.dev.
- [Anthropic frontend-design skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) — intentional, non-generic front-end art direction.
- [OpenAI Codex responsive design and Playwright](https://developers.openai.com/codex/use-cases/frontend-designs) — screenshot-driven mobile/desktop visual verification.
- [Figma MCP](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) — optional shared design system and direct agent canvas editing.
- [Scenario](https://www.scenario.com/) — optional consistency-focused game asset model training and production.
- Official financial education and safety content to review with educators: [RBI](https://www.rbi.org.in/), [NPCI](https://www.npci.org.in/), [SEBI Investor Education](https://investor.sebi.gov.in/), and [NCFE](https://ncfe.org.in/).

*Working plan. Product examples are illustrative, not promises about legal eligibility, financial returns, insurance coverage, or actual economic outcomes.*
