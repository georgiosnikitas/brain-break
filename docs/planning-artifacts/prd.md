---
status: reviewed
sourceDocument: product-brief.md
date: 2026-03-07
author: George
inputDocuments:
  - docs/planning-artifacts/product-brief.md
classification:
  domain: general
  projectType: cli_tool
workflowType: prd
workflow: edit
stepsCompleted:
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
lastEdited: '2026-03-17'
editHistory:
  - date: '2026-03-17'
    changes: 'Multi-provider AI integration: Copilot SDK is no longer the sole AI backend; 5 providers supported (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama). Feature 2 rewritten as provider-agnostic. Feature 8 expanded with AI Provider setting and first-launch Provider Setup screen (non-blocking validation). NFR 2 rewritten with per-provider error handling. Project-Type Requirements updated with provider list, env var auth, and provider abstraction in Implementation Decisions. Executive Summary, Target Users, User Journeys, Innovation Analysis updated to remove Copilot-only language.'
  - date: '2026-03-15'
    changes: 'Brownfield additions: Feature 1 Delete action (permanent deletion with confirmation); Feature 10 (Coffee Supporter Screen) added; Feature 1 home screen actions updated with buy-me-a-coffee; NFR 5 updated to full terminal reset spec (clears scroll-back buffer); Project-Type Requirements updated with License (MIT)'
  - date: '2026-03-15'
    changes: 'Validation fixes: classification frontmatter added (domain: general, projectType: cli_tool); session completion rate KPI added; User Journeys updated with Core Usage visual nav + Settings journey; Feature 1 "appropriately focused" → "domain-specific"; Feature 9 "clearly distinguishable" → concrete inverted-color spec + explicit menu list; NFR 6 self-contradiction resolved; frontmatter classification added'
  - date: '2026-03-15'
    changes: 'Feature 8 added: Global Settings — language (free-text) and tone of voice (Natural/Expressive/Calm/Humorous/Sarcastic/Robot/Pirate), stored at ~/.brain-break/settings.json; injected into all AI calls'
  - date: '2026-03-15'
    changes: 'Feature 9 added: Terminal UI Highlighting & Color System — full-row menu highlight, semantic post-answer colors (green/red), speed tier badge colors, difficulty level badge colors'
  - date: '2026-03-15'
    changes: 'Feature 2 updated: language and tone injected into every AI call covering questions, answer options, and motivational messages'
  - date: '2026-03-15'
    changes: 'Feature 1 updated: motivational message is now AI-generated using active language and tone settings'
  - date: '2026-03-15'
    changes: 'NFR 6 added: Terminal Color Rendering — ANSI baseline compatibility spec'
  - date: '2026-03-14'
    changes: 'Feature 6: replaced 10-per-page pagination with single-question navigation and progress indicator'
  - date: '2026-03-14'
    changes: 'Feature 1: introduced two-level navigation — home screen lists domains only (with score/count) + create/archived/exit; selecting a domain opens a domain sub-menu with Play, View History, View Stats, Archive, and Back'
  - date: '2026-03-14'
    changes: 'Feature 1: create-domain screen input prompt updated with Ctrl+C back hint — pressing Ctrl+C returns to home without creating a domain (2-step flow: home → input)'
  - date: '2026-03-14'
    changes: 'Cross-cutting terminal rendering statement added to Functional Requirements preamble; NFR 5 (Terminal Screen Management) added'
---

# Product Requirements Document: brain-break

> **Status:** Reviewed — validated and updated 2026-03-07. Ready for architecture handoff.

---

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes on any topic you define. It generates contextually relevant, never-repeating questions across any domain — from `java-programming` to `greek-mythology` to `thai-cuisine` — turning idle break time into a measurable, honest knowledge signal. Users choose their AI provider: GitHub Copilot SDK, OpenAI, Anthropic, Google Gemini, or a local Ollama instance. It lives where terminal users already work: the CLI. No accounts. No setup friction. Clone, pick your provider, and run.

Curious people want to stay sharp across a wide variety of topics, but existing learning tools demand 30–60 minute structured sessions that don't fit the short, unplanned breaks that naturally occur during a day. The result: knowledge gaps compound silently, and people either over-commit to platforms they never finish, or do nothing during natural break windows. No existing CLI-first tool combines AI question generation, user-defined open-ended domains, duplicate prevention, and honest skill tracking in a single, zero-friction package.

`brain-break` targets anyone with daily terminal use and access to an LLM provider (GitHub Copilot, OpenAI, Anthropic, Google Gemini, or a local Ollama instance) who wants short, purposeful learning sessions on topics they care about.

---

## Success Criteria

### Engagement KPIs
- **Daily sessions per active user:** ≥ 1 session/day — measured via session timestamps stored in local domain files
- **Average session length:** 2–10 minutes — measured via session duration derived from local timestamps
- **Questions answered per session:** ≥ 5 questions — measured via question count per session in local history

### Learning KPIs
- **Score growth rate:** Score increases progressively over the first 30 days — measured by score trend calculation from local history, surfaced to the user in the View Stats command
- **Correct answer rate over time:** Improves in a configured domain after 20+ questions — measured by correct/incorrect ratio over time from local history, surfaced in View Stats
- **History depth:** Users who have answered 50+ questions have a full personal knowledge log — measured by total question count in local domain file

### Adoption KPIs
- **Time to first question:** < 5 minutes from clone to first answered question — measured manually at first launch
- **7-day return:** User returns to the app within 7 days of first use — measured via session timestamps in local domain file; app surfaces a streak/return message to the user
- **Session completion rate:** ≥ 80% of started sessions result in ≥ 1 answered question — measured via session records in local domain file
- **Domain diversity:** User configures ≥ 2 different domains within 7 days of first use — measured by domain file count in `~/.brain-break/`
- **Team penetration:** Shared with ≥ 3 colleagues within 30 days of publish — tracked via GitHub repo star/fork count and self-reported confirmation in team channel

### MVP Acceptance Criteria

The MVP is considered successful when:
1. The onboarding flow completes without errors — from clone to first answered question in under 5 minutes
2. Questions never repeat within a domain across sessions
3. Difficulty level increases after 3 consecutive correct answers and decreases after 3 consecutive wrong answers
4. Score and history persist correctly between sessions and across domain switches
5. View History displays all answered questions with correct data; View Stats displays correct totals and score trend
6. Speed tier classification (fast / normal / slow) is surfaced to the user after each answer

---

## Product Scope

### In Scope — MVP

The following 10 capabilities define the complete MVP:

1. In-App Domain Management
2. AI-Powered Question Generation (Multi-Provider)
3. Interactive Terminal Quiz
4. Scoring System
5. Persistent History (Per Domain)
6. View History Command
7. View Stats Command
8. Global Settings (Language & Tone)
9. Terminal UI Highlighting & Color System
10. Coffee Supporter Screen

### Out of Scope

The following are explicitly out of scope for the MVP:

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
- Manual difficulty override by the user
- Web UI or any non-terminal interface
- User accounts or cloud sync
- Any feature not listed in this document

*No Growth or Vision phases are defined. Scope is MVP-only.*

---

## Business Objectives

`brain-break` is an open-source tool — success is measured in adoption depth and genuine utility, not revenue.

1. **Adoption:** Users install and actively use `brain-break` within 30 days of discovering it
2. **Habit formation:** Active users engage daily rather than sporadically — the tool earns a permanent place in their routine
3. **Perceived value:** Users voluntarily recommend the tool to others — organic spread
4. **Knowledge reinforcement:** Users report that their knowledge in configured domains feels sharper and more confident over time

---

## Target Users

`brain-break` targets anyone with daily terminal use and access to at least one supported AI provider. Three personas cover the typical range of motivations and use patterns.

### Primary Users

#### Persona 1 — "Alex, the Developer"
**Role:** Mid-level fullstack developer, 3–5 years experience  
**Context:** Uses the terminal daily, has access to at least one supported AI provider

**Motivation:** Wants to feel confident across the full stack. Suspects there are gaps in knowledge they haven't consciously identified yet. Values honest self-assessment over completion badges.

**Problem Experience:** Udemy courses sit half-finished. During a 5-minute build wait, there's nothing that turns that time into learning.

**Success Vision:** A session that challenges them, reveals a surprising gap, or confirms their expertise — all within the time a build takes. A rising score that genuinely reflects skill, not just effort.

---

#### Persona 2 — "Sam, the Student"
**Role:** University student or self-taught learner  
**Context:** Studies across multiple subjects, lives in the terminal, eager to reinforce knowledge between sessions

**Motivation:** Build confidence across coursework topics. The game format removes the anxiety of formal assessment — wrong answers just affect score, not grades. Microlearning fits a short attention span and high curiosity.

**Problem Experience:** Doesn't know what they don't know. Structured courses feel overwhelming. Wants bite-sized, targeted challenges they can come back to repeatedly.

**Success Vision:** A fun, low-stakes way to discover knowledge gaps and fill them incrementally. Watching the score grow is tangible proof of progress.

---

#### Persona 3 — "Jordan, the Curious Generalist"
**Role:** Anyone with broad interests — history, languages, science, culture, or niche hobbies  
**Context:** Comfortable in the terminal, curious by nature, doesn't want a heavyweight app just to test their knowledge

**Motivation:** Stay sharp or explore new topics at their own pace. Not interested in structured curricula — wants sharp, specific questions on exactly the domain they care about.

**Problem Experience:** No existing tool lets them type any topic and immediately get intelligent quiz questions. Everything is either too rigid (fixed question banks) or too heavy (video courses).

**Success Vision:** A quick mental challenge on any topic at will. A score that reflects genuine knowledge, not just luck.

---

### Secondary Users

None. `brain-break` is a purely self-serve individual tool. No admin, team management, or oversight roles required.

---

## User Journeys

**Discovery:** User sees the repo shared or mentioned online. One-line README install hook. Cloned and running in under 2 minutes.

**Onboarding:** Runs `node index.js`. On first launch, a one-time Provider Setup screen appears — the user selects their AI provider from a list (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama) using arrow keys. The app validates readiness (checks Copilot auth, env var presence, or Ollama endpoint reachability). If validation fails, the app displays what’s needed and proceeds to the home screen anyway — the user can explore all UI except Play. Once the provider is ready, the full experience works. On subsequent launches, the saved provider is used automatically. With no domains configured yet, the only available action is to create a new one — the user types any topic, hits enter, selects it, and the first question appears. No config file, no account, no signup.

**Core Usage:**
- Triggered by natural break moments: between tasks, waiting for a process, lunch, commute
- Sessions are 2–10 minutes; 3–10 questions per session
- Navigates menus with arrow keys (↑↓); the focused option is highlighted with a full-row background; confirms selection with Enter
- Answers a question → sees result in color (correct = green, incorrect = red) → sees score delta in color → sees speed tier badge → next question
- History persists between sessions automatically

**"Aha!" Moment:** Gets a question wrong on something they thought they knew. Score dips. They look it up. They come back and get it right next time. The score rises. *That feedback loop is the product.*

**Settings:** User navigates to Settings from the home screen, sets language to `Greek` and tone to `Pirate`, returns to the quiz, and sees questions and answers rendered in Greek with pirate-voiced phrasing. Changing settings takes effect on the next AI call — no restart required.

**Long-term:** The question history becomes a personal knowledge log. The score becomes a genuine, self-earned signal of how well the user knows a topic. Users start tracking multiple domains — "what's your Greek mythology score?" becomes a casual conversation.

---

## Domain Requirements

Not applicable. `brain-break` operates in no regulated domain (no healthcare, fintech, govtech, or e-commerce context). No domain-specific compliance requirements apply.

---

## Innovation Analysis

`brain-break` occupies a gap in the knowledge quiz tooling landscape. No existing tool combines all of the following in a single, zero-friction package:

| Factor | brain-break | Udemy / Video Platforms | Flashcard Apps |
|---|---|---|---|
| Session length | 2–10 minutes | 30–60+ minutes | Variable |
| Terminal-native | ✅ | ❌ | ❌ |
| Any user-defined domain | ✅ | ❌ (fixed catalogue) | ✅ (manual) |
| AI-generated questions | ✅ (5 providers) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| In-app domain management | ✅ | ❌ | ❌ |
| Honest skill-signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / shareable | ✅ | ❌ | Partial |

---

## Project-Type Requirements

- **Runtime:** Node.js (no minimum version mandated for MVP — use current LTS)
- **Interface:** Terminal only — no web UI, no GUI, no browser-based components
- **AI Integration:** The app supports 5 AI providers, selectable by the user at first launch or in Settings:
  - **GitHub Copilot SDK** — uses the user’s existing Copilot credentials (no API key required)
  - **OpenAI** — requires `OPENAI_API_KEY` environment variable
  - **Anthropic** — requires `ANTHROPIC_API_KEY` environment variable
  - **Google Gemini** — requires `GOOGLE_API_KEY` environment variable
  - **Ollama** — local instance, no API key; requires endpoint URL and model name
- All providers must produce the same structured JSON response schema; the app treats providers as interchangeable backends behind a unified interface
- **Storage:** Local file system only — one JSON file per domain at `~/.brain-break/<domain-slug>.json`; no database server, no cloud sync
- **Distribution:** Published to npm — installable via `npx` with no global install required
- **Platform:** Unix-like terminals only (macOS, Linux, WSL) — native Windows CMD/PowerShell is out of scope for MVP
- **License:** MIT

### Implementation Decisions

- **Provider abstraction:** All AI calls route through a unified provider interface. Each provider adapter translates the app’s prompt format to the provider’s API. Adding a new provider requires implementing the adapter interface — no changes to business logic
- **Provider configuration:** The selected provider is stored in `~/.brain-break/settings.json` as `provider` (string enum: `copilot` | `openai` | `anthropic` | `gemini` | `ollama`). For Ollama, the settings also store `ollamaEndpoint` (string, default `http://localhost:11434`) and `ollamaModel` (string, default `llama3`). API keys are read from environment variables at runtime — never stored in settings
- **Question generation:** The active provider is called via structured chat completion prompts; the LLM constructs the prompt and returns a **JSON structured response** with the following schema: question text, answer options (A–D), correct answer, difficulty level, and speed tier time thresholds (fast / normal / slow in ms)
- **Language and tone injection:** Every AI prompt (questions, motivational messages) includes a voice instruction derived from global settings — e.g., `"Respond in Greek using a pirate tone of voice."` — prepended to the system or user message before the question generation instruction
- **Settings persistence:** Global settings are stored at `~/.brain-break/settings.json` as a flat JSON object with fields `provider` (string enum: `copilot` | `openai` | `anthropic` | `gemini` | `ollama`), `language` (string), `tone` (string enum: `natural` | `expressive` | `calm` | `humorous` | `sarcastic` | `robot` | `pirate`), and for Ollama: `ollamaEndpoint` (string, default `http://localhost:11434`) and `ollamaModel` (string, default `llama3`); defaults applied on missing file: `{ "provider": null, "language": "English", "tone": "natural" }`
- **Deduplication mechanism:** Each generated question is hashed using SHA-256 on its normalized text (lowercased, whitespace-stripped); a match against any stored hash triggers regeneration — *Future enhancement: fuzzy/similarity-based deduplication*
- **Domain file naming:** User-typed domain names are slugified for file system use — lowercased, spaces and special characters replaced with hyphens (e.g. `Spring Boot microservices` → `spring-boot-microservices.json`)

---

## Functional Requirements

The following 10 features define the complete MVP capability set. Each feature is specified as a user-facing capability. Implementation details are documented in Project-Type Requirements — Implementation Decisions.

**Terminal rendering (cross-cutting):** All screens perform a full terminal reset on every navigation action — clearing the visible viewport and scroll-back buffer so all content renders at the top of the terminal window with no prior output accessible by scrolling.

### Feature 1 — In-App Domain Management

**Home screen (Level 1)**

- On every launch the app displays the home screen listing all configured active domains, each showing current score and number of questions answered
- If no domains exist, the list is empty and the only available action is to create a new one
- Domain names are free-text — any topic the user types becomes a valid domain, and the AI will generate domain-specific questions for it
- All state (history, score, time played) is domain-scoped and isolated
- The home screen actions are: select a domain, create a new domain, view archived domains, buy me a coffee, and exit — archive/history/stats/delete actions for a domain are **not** shown on the home screen
- Selecting "Create new domain" shows an input prompt (`New domain name (Ctrl+C to go back):`); pressing Ctrl+C returns the user to the home screen without creating a domain

**Domain sub-menu (Level 2)**

- Selecting a domain from the home screen opens a domain sub-menu — the prompt header shows the domain name, current score, and total questions answered (refreshed on every entry)
- The domain sub-menu provides the following actions: **Play**, **View History**, **View Stats**, **Archive**, **Delete**, and **Back**
- Selecting **Play** displays a contextual motivational message before the session starts — triggered when the user has returned within 7 days of their last session or their score is trending upward — the message is AI-generated using the active language and tone of voice settings, then the quiz begins
- After a quiz session ends, the user is returned to the domain sub-menu (not the home screen)
- Selecting **Archive** sets the domain as archived, removes it from the active list, and returns the user to the home screen — all history, score, and progress are fully preserved
- Selecting **Delete** prompts the user with a blocking confirmation dialog (*"Delete '[domain]' permanently? This cannot be undone."*) — confirming permanently removes the domain file and all associated data (history, score, progress) with no recovery path and returns the user to the home screen; declining returns the user to the domain sub-menu
- Selecting **Back** returns the user to the home screen
- Selecting **View History** or **View Stats** opens the respective screen; selecting Back from either returns the user to the domain sub-menu

**Archived domains**

- The home screen includes a *"View archived domains"* action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off
- Switching to a previously used domain resumes exactly where the user left off

### Feature 2 — AI-Powered Question Generation (Multi-Provider)

- Questions are generated on demand via the user's configured AI provider (GitHub Copilot SDK, OpenAI, Anthropic, Google Gemini, or Ollama)
- The app sends identical prompt structures to all providers and expects the same JSON response schema — provider differences are abstracted behind the provider adapter layer
- All questions are multiple choice (4 options: A, B, C, D)
- Every AI call injects the active language and tone of voice from global settings — questions, answer options, and AI-generated motivational messages are rendered in the configured language and voice
- Users never receive a repeated question within the same domain — deduplication persists across all sessions (see Project-Type Requirements — Implementation Decisions)
- If no provider is configured or the configured provider is unreachable, Play displays: *"AI provider not ready. Go to Settings to configure."* and returns the user to the domain sub-menu
- **Adaptive difficulty:** Difficulty is measured on a 5-level scale. The level adjusts based on consecutive answer streaks:
  - 3 consecutive correct answers → difficulty increases by 1 (max level 5)
  - 3 consecutive wrong answers → difficulty decreases by 1 (min level 1)
  - A correct answer breaks a wrong streak and vice versa — the streak counter resets
  - New domains start at level 2 (Elementary)
  - Difficulty and streak counter persist across sessions per domain

| Level | Label | Focus |
|---|---|---|
| 1 | Beginner | Foundational concepts, basic syntax, definitions |
| 2 | Elementary | Common patterns, standard usage, simple debugging |
| 3 | Intermediate | Non-obvious behavior, edge cases, framework internals |
| 4 | Advanced | Architecture decisions, performance trade-offs, complex debugging |
| 5 | Expert | Deep internals, uncommon edge cases, cross-domain reasoning |

- **API error handling:** If the configured AI provider is unreachable or authentication fails, the app fails gracefully without crashing — see NFR 2 for specified behavior.

### Feature 3 — Interactive Terminal Quiz

- Questions are displayed one at a time in the terminal
- A timer starts silently when the question is displayed and stops when the user submits their answer — no visible countdown is shown during the question
- The response time is recorded for every question
- After answering, the user sees: correct/incorrect, the right answer if wrong, time taken, speed tier (fast / normal / slow), and score delta

### Feature 4 — Scoring System

- Score is per-domain and persists across sessions
- Score never resets — it is a cumulative, long-term skill signal per domain
- **Score delta formula:** `score delta = base points × speed multiplier` (rounded to nearest whole number)
- The base points are determined by the **difficulty level of the question being answered** — harder questions are worth more points correct and lose more points incorrect, directly linking the difficulty progression to score growth

**Base points by difficulty level:**

| Level | Label | Base Points |
|---|---|---|
| 1 | Beginner | 10 |
| 2 | Elementary | 20 |
| 3 | Intermediate | 30 |
| 4 | Advanced | 40 |
| 5 | Expert | 50 |

**Speed multipliers:**

| Outcome | Multiplier |
|---|---|
| Fast + Correct | ×2 |
| Normal + Correct | ×1 |
| Slow + Correct | ×0.5 |
| Fast + Incorrect | −1× |
| Normal + Incorrect | −1.5× |
| Slow + Incorrect | −2× |

*Example: A level 3 (Intermediate) question answered correctly and fast = +60 points. Answered incorrectly and slowly = −60 points. Answered incorrectly at normal speed = −45 points.*

### Feature 5 — Persistent History (Per Domain)

- All domain data persists locally between sessions — no data is lost when the app is closed
- Each domain's state is fully isolated — switching domains does not affect other domains
- Each domain stores: current score, current difficulty level, total time played, and complete question history

Every answered question is recorded with:
- Question text and all answer options
- The user's chosen answer
- Whether it was correct or incorrect
- Timestamp of when it was answered
- Time taken to answer (ms)
- Speed tier classification (fast / normal / slow)
- Score delta for that question
- Difficulty level assigned to the question

### Feature 6 — View History Command

- User can view their full question history for the active domain
- Questions are displayed one at a time; the user navigates with Previous and Next controls; a progress indicator shows the user's current position (e.g., "Question 3 of 47")
- Each entry displays all fields recorded per question (see Feature 5 — Persistent History)

### Feature 7 — View Stats Command

User can view a summary dashboard for the active domain:
- Current score
- Total questions answered
- Correct vs. incorrect count and accuracy %
- Total time played across all sessions
- Current difficulty level
- Score trend over the last 30 days (growing / flat / declining) — derived from local question history
- Days since first session and current return streak — derived from local session timestamps

### Feature 8 — Global Settings

- The home screen includes a **Settings** option positioned above the "Buy me a coffee" action
- Selecting Settings opens a settings screen where the user can configure three global preferences: **AI Provider**, **Question Language**, and **Tone of Voice**
- Settings are global — they apply to all domains and all AI-generated content (questions, answer options, motivational messages)
- Settings persist between sessions in a global settings file at `~/.brain-break/settings.json`
- On first launch with no settings file, defaults are: provider = none (must be selected), language = `English`, tone = `Normal`

**First-Launch Provider Setup**

- On first launch (no `settings.json` exists), a one-time **Provider Setup** screen appears before the home screen
- The user selects an AI provider from the fixed list using arrow key navigation: **GitHub Copilot**, **OpenAI**, **Anthropic**, **Google Gemini**, **Ollama**
- After selection, the app validates provider readiness:
  - **GitHub Copilot:** Checks Copilot authentication — if successful, proceed; if not, display: *"Copilot authentication not detected. Ensure you have an active GitHub Copilot subscription and are logged in."*
  - **OpenAI / Anthropic / Google Gemini:** Checks for the corresponding environment variable (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`) — if found, proceed; if missing, display: *"Set the `[VAR_NAME]` environment variable and restart the app."*
  - **Ollama:** Prompts for endpoint URL (pre-filled `http://localhost:11434`) and model name (pre-filled `llama3`) — tests connection; if unreachable, display: *"Could not reach Ollama at [endpoint]. Ensure Ollama is running."*
- If validation fails, the app **proceeds to the home screen anyway** — the user can explore all features except Play; attempting Play shows: *"AI provider not ready. Go to Settings to configure."*
- If validation succeeds, the app proceeds to the home screen with full functionality
- The selected provider (and Ollama endpoint/model if applicable) is saved to `settings.json`
- On subsequent launches, the saved provider is used automatically — no re-prompting

**AI Provider**

- User selects from 5 providers via arrow key navigation: **GitHub Copilot**, **OpenAI**, **Anthropic**, **Google Gemini**, **Ollama**
- Selecting a provider triggers the same validation logic as first-launch setup
- For Ollama, the user can edit the endpoint URL and model name
- API keys are never entered in-app — they are read from environment variables at runtime
- Changing providers takes effect on the next AI call — no restart required

**Question Language**
- Free-text entry — any language name the user types becomes the active language (e.g., `Greek`, `Spanish`, `Japanese`, `Pirate English`)
- The configured language is injected into every AI prompt; the LLM renders all generated content in that language
- No validation — the language string is passed directly to the AI; unsupported or misspelled entries produce AI-best-effort output

**Tone of Voice**
- User selects from 7 preset options via arrow key navigation:
  - **Natural** — neutral, factual, professional quiz tone
  - **Expressive** — energetic, encouraging, high-energy delivery
  - **Calm** — relaxed, measured, unhurried phrasing
  - **Humorous** — witty, playful, light-hearted delivery
  - **Sarcastic** — dry, ironic, deadpan commentary
  - **Robot** — terse, mechanical, emotionless phrasing
  - **Pirate** — pirate vernacular throughout, nautical metaphors, "Arr" as appropriate
- The selected tone is injected into every AI prompt as a voice instruction
- Selecting Back from Settings returns the user to the home screen without saving unsaved changes
- Selecting Save persists the changes and returns the user to the home screen

### Feature 9 — Terminal UI Highlighting & Color System

All interactive menus throughout the application use full-row background highlight to indicate the currently focused option — navigated with arrow keys (↑↓), confirmed with Enter. No existing input mechanism (e.g., typing A/B/C/D for quiz answers) is removed; arrow key navigation is additive.

**Menu highlighting (all menus)**
- The focused menu item renders with inverted foreground/background colors — white text on a colored background (e.g., white-on-cyan) for the selected row; unfocused items render in default terminal colors
- Applies to: home screen, domain sub-menu, settings screen, archived domains list, history navigation controls, and post-quiz navigation

**Post-answer feedback colors**
- Correct answer: displayed in **green**
- User's wrong answer: displayed in **red**
- Correct answer reveal (when user answers wrongly): displayed in **green**
- Score delta positive: displayed in **green**; score delta negative: displayed in **red**

**Speed tier badge colors**
- Fast: **green**
- Normal: **yellow**
- Slow: **red**

**Difficulty level badge colors**
- Level 1 (Beginner): **cyan**
- Level 2 (Elementary): **green**
- Level 3 (Intermediate): **yellow**
- Level 4 (Advanced): **magenta**
- Level 5 (Expert): **red**

### Feature 10 — Coffee Supporter Screen

- The home screen includes a **☕ Buy me a coffee** action, positioned between the "View archived domains" separator and the Exit action
- Selecting it opens a dedicated screen that clears the terminal and displays an ASCII QR code linking to the creator's Buy Me a Coffee page, followed by the URL (`https://www.buymeacoffee.com/georgiosnikitas`) in plain text
- The screen provides a single **Back** action that returns the user to the home screen

---

## Non-Functional Requirements

### NFR 1 — Question Generation Response Time
The next question must appear within **≤ 5 seconds** of the user submitting an answer (covering AI provider API call + local persistence). A loading spinner is displayed during generation so the terminal does not appear frozen.

### NFR 2 — API Error Handling
- **No provider configured:** If no provider is set in `settings.json`, Play displays: *"AI provider not ready. Go to Settings to configure."* and returns the user to the domain sub-menu. All other app features remain functional.
- **Network / API unavailable:** The app displays a provider-specific error message and returns the user to the domain sub-menu without crashing:
  - GitHub Copilot: *"Could not reach the Copilot API. Check your connection and try again."*
  - OpenAI / Anthropic / Gemini: *"Could not reach [Provider] API. Check your connection and try again."*
  - Ollama: *"Could not reach Ollama at [endpoint]. Ensure Ollama is running and try again."*
- **Authentication / API key failure:**
  - GitHub Copilot: *"Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in."*
  - OpenAI / Anthropic / Gemini: *"[Provider] API key is invalid or missing. Set the `[VAR_NAME]` environment variable with a valid key and restart the app."*
  - Ollama: *"Could not connect to Ollama. Check that the endpoint and model are correct in Settings."*
- In all error cases, the app remains running and the user can navigate to Settings to reconfigure.

### NFR 3 — Data Integrity
- **Missing domain file:** Treated as a new domain — the app starts fresh with score 0 and no history. No error displayed.
- **Corrupted domain file:** The app displays a warning (*"Domain data for [domain] appears corrupted and cannot be loaded. Starting fresh."*) and resets the domain to a clean state. The corrupted file is overwritten on the next save.

### NFR 4 — Startup Time
The app must reach the home screen within **≤ 2 seconds** of launch (`npx brain-break` or `node index.js`) on a standard developer machine.

### NFR 5 — Terminal Screen Management
All screen transitions — including home screen, domain sub-menu, quiz questions, post-answer feedback, history navigation, and stats dashboard — perform a full terminal reset, clearing both the visible viewport and the scroll-back buffer. All content renders at the top of the terminal window; no prior output is visible or accessible by scrolling after any navigation action. Measurable: every state-changing user input produces a fully redrawn terminal at scroll position zero, with zero residual output from the previous state.

### NFR 6 — Terminal Color Rendering
All ANSI color output uses standard 8/16-color ANSI escape codes — ensuring compatibility across macOS Terminal, iTerm2, Linux terminals, and WSL. Extended 256-color or true-color codes may be used where supported. The application is interactive-only; non-TTY and piped execution modes are out of scope.

---
