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
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
lastEdited: '2026-03-30'
editHistory:
  - date: '2026-03-30'
    changes: 'Settings toggle behavior updated: the settings label is now "🎬 Welcome & Exit screen" (renamed from "Welcome screen") and controls both branded screens. When enabled, the Welcome Screen is shown on launch and the Exit Message is shown on explicit home-screen Exit. When disabled, both screens are skipped. Feature 8, Feature 11, Feature 15, onboarding journey, and Feature 1 exit action wording were aligned to this rule.'
  - date: '2026-03-30'
    changes: 'Feature 15 (Exit Message) added and promoted to MVP: selecting Exit from the home screen now displays a branded farewell screen before termination. The screen reuses Welcome Screen visual language (same gradient ASCII art, styled subtitle, version, and gradient shadow bar), uses clearScreen() (no static banner), supports Ctrl+C immediate exit, and auto-exits after 3 seconds with Enter allowing immediate dismissal. Product Scope updated from 14 to 15 capabilities. Functional Requirements preamble updated. Feature 1 home-screen exit action linked to Feature 15. User Journeys Core Usage updated with explicit app-exit flow. NFR 5 updated to include Exit Message in clearScreen() exceptions.'
  - date: '2026-03-29'
    changes: 'Feature 14 (Session Summary) added: after a quiz session ends, the domain sub-menu renders a one-time session summary block between the domain header and the action menu — displaying score delta, questions answered, correct/incorrect split, accuracy, fastest/slowest answer times, session duration, and difficulty change. The summary is ephemeral: it appears only on the first render of the domain sub-menu after a quiz and is not shown on subsequent re-renders. Product Scope updated from 13 to 14 capabilities. FR preamble updated. Feature 1 domain sub-menu updated with session summary cross-reference. User Journeys Core Usage updated. NFR 5 updated with session summary rendering note.'
  - date: '2026-03-25'
    changes: 'Prose review pass: fixed one hyphenation issue ("fullstack" → "full-stack") and one contradictory phrase in Feature 2 ("factually wrong correct answer" → "factually incorrect answer marked as correct").'
  - date: '2026-03-25'
    changes: 'Source code alignment pass: (1) FR preamble corrected from 10 to 12 features. (2) Google Gemini env var corrected from GOOGLE_API_KEY to GOOGLE_GENERATIVE_AI_API_KEY (2 occurrences: Project-Type Requirements and Feature 8 First-Launch Provider Setup). (3) Runtime updated from "no minimum version — use current LTS" to Node.js v25.8.0 matching engines.node in package.json. (4) Feature 1 home screen action list updated — added "settings" between "view archived domains" and "buy me a coffee" to match implemented home screen menu order. (5) Feature 8 default tone corrected from Normal to Natural. (6) User Journeys Onboarding rewritten — eliminated confusing re-description of provider selection as occurring on the home screen; now accurately describes the sequential flow: Provider Setup → Welcome Screen → Home Screen with domain list. (7) Provider Setup validation updated — all providers now described as making a real one-shot API test call (testProviderConnection) rather than only checking env var presence.'
  - date: '2026-03-25'
    changes: 'Feature 7 (View Stats) updated: starting difficulty level added to the stats dashboard — displayed alongside current difficulty to show progression. Reflects GitHub issue #46.'
  - date: '2026-03-25'
    changes: 'Feature 1 (Domain Management) and Feature 2 (Adaptive Difficulty) updated: when creating a domain, the user now selects a starting difficulty level (1–5) via arrow key navigation after entering the domain name, defaulting to level 2 (Elementary). FR2 updated with difficulty selection step and corrected to match implementation (prompt text is `New domain name:`, back via Save/Back nav menu not Ctrl+C hint). FR7 updated — new domains start at the user-selected level instead of always level 2. Create-domain flow in Feature 1 updated. Domain Data Schema note updated (defaultDomainFile accepts optional startingDifficulty). "Manual difficulty override" removed from Out of Scope. Reflects GitHub issue #46.'
  - date: '2026-03-25'
    changes: 'Feature 3 (Interactive Terminal Quiz) updated: post-answer feedback now renders on the same screen as the original question — no terminal clear between question display and feedback panel. The user sees the question, their chosen answer, and all feedback (correct/incorrect, correct answer reveal, time taken, speed tier, score delta) together. NFR5 updated to exclude the post-answer feedback transition from the full terminal reset list. Reflects GitHub issue #50.'
  - date: '2026-03-25'
    changes: 'Feature 3 (Interactive Terminal Quiz) updated: after answering a question, the post-answer feedback now includes an "Explain answer" option alongside Next and Exit. Selecting it calls the AI provider to generate a concise explanation of why the correct answer is correct, displayed inline before returning to the Next/Exit prompt. FR35 added. FR Coverage Map updated. Reflects GitHub issue #48.'
  - date: '2026-03-25'
    changes: 'Feature 11 (Welcome Screen) updated: subtitle/tagline changed from plain bold-yellow text ("Train your brain, one question at a time!") to a styled line (`> Train your brain, one question at a time_`) where `>` renders in cyan and `_` renders in magenta. User Journeys — Onboarding updated. FR31 description updated in epics. Reflects GitHub issue #47 (implemented and closed).'
  - date: '2026-03-23'
    changes: 'Feature 11 (Welcome Screen) added: on launch, a branded splash screen shows gradient-colored ASCII art, tagline, and version — dismissible with Enter. Controllable via showWelcome setting (default: true). Feature 12 (Static Banner) added: every screen renders a persistent "🧠🔨 Brain Break" header with a cyan-to-magenta gradient shadow bar via clearAndBanner(). Feature 8 (Settings) updated: showWelcome toggle (🎬 Welcome screen: ON/OFF) added. FR31–FR34 added. Startup flow updated. FR Coverage Map updated. NFR5 updated (banner rendering on every screen transition). Settings defaults updated with showWelcome: true.'
  - date: '2026-03-22'
    changes: 'Feature 8 per-provider model selection: selecting OpenAI, Anthropic, or Google Gemini now prompts the user to enter a preferred model name (with a sensible default pre-filled). Entering an empty string resets to the default model. Copilot does not prompt for a model. Implementation Decisions updated with per-provider model fields (openaiModel, anthropicModel, geminiModel) and their defaults. Settings persistence schema updated with new model fields.'
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
  - date: '2026-03-28'
    changes: 'Feature 6 (View History) updated: history navigation now includes an "Explain answer" option alongside Previous/Next/Back. Selecting it calls the AI provider to generate a concise explanation of the correct answer — same flow as Feature 3 quiz explain — displayed inline on the same screen as the question detail. After explanation is shown, the menu reduces to Previous/Next/Back (no redundant Explain while explanation is visible); navigating away and returning to the same question makes Explain available again. User Journeys Long-term updated to reference explain-from-history as an active learning tool.'
  - date: '2026-03-28'
    changes: 'Feature 13 (Explanation Drill-Down) added: after viewing an AI-generated explanation (in both quiz and history contexts), the user can select \"Teach me more\" to receive a concise micro-lesson on the underlying concept. Feature 3 and Feature 6 updated with Teach me more option in post-explanation navigation. Feature 3 \"Exit quiz\" renamed to \"Back\" throughout. Product Scope updated from 12 to 13 capabilities. FR preamble updated. User Journeys Aha Moment and Long-term updated to reference the drill-down learning loop.'
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

The following 15 capabilities define the complete MVP:

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
11. Welcome Screen
12. Static Banner
13. Explanation Drill-Down
14. Session Summary
15. Exit Message

### Out of Scope

The following are explicitly out of scope for the MVP:

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
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
**Role:** Mid-level full-stack developer, 3–5 years experience  
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

**Onboarding:** Runs `node index.js`. On first launch, a one-time Provider Setup screen appears — the user selects their AI provider from a list (GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama) using arrow keys, configures provider-specific settings (model name, endpoint), and the app makes a real one-shot API test call to verify connectivity. If validation fails, the app displays what’s needed and proceeds anyway — the user can explore all UI except Play. The selected provider is saved to `settings.json`. After provider setup (and on every subsequent launch where `showWelcome` is enabled), a branded Welcome Screen displays: gradient-colored ASCII art of the app name, a styled subtitle (`> Train your brain, one question at a time_`) where `>` renders in cyan and `_` renders in magenta, the current version number, and a “Press enter to continue” prompt. This behavior is controlled by the Settings toggle labeled **🎬 Welcome & Exit screen**. After dismissing the welcome screen, the home screen appears — listing all configured domains with their score and question count. With no domains configured yet, the only available action is to create a new one — the user types any topic, selects a starting difficulty, hits Save, selects the new domain, and the first question appears. On subsequent launches, the saved provider is used automatically. No config file, no account, no signup.

**Core Usage:**
- Triggered by natural break moments: between tasks, waiting for a process, lunch, commute
- Sessions are 2–10 minutes; 3–10 questions per session
- Navigates menus with arrow keys (↑↓); the focused option is highlighted with a full-row background; confirms selection with Enter
- Answers a question → sees result in color (correct = green, incorrect = red) → sees score delta in color → sees speed tier badge → next question
- On exiting the quiz, the domain sub-menu displays a one-time session summary — score delta, accuracy, speed stats, and difficulty change — giving every session a tangible result before the user decides what to do next
- When the user is done, selecting Exit from the home screen shows a branded farewell screen (Feature 15), then the app terminates cleanly
- History persists between sessions automatically

**"Aha!" Moment:** Gets a question wrong on something they thought they knew. Score dips. They hit "Explain answer" and immediately understand *why* the correct answer is right. Intrigued, they hit "Teach me more" and get a one-minute micro-lesson on the concept — connecting the question to deeper principles they hadn't considered. They come back and get it right next time. The score rises. *That feedback loop is the product.*

**Settings:** User navigates to Settings from the home screen, sets language to `Greek` and tone to `Pirate`, returns to the quiz, and sees questions and answers rendered in Greek with pirate-voiced phrasing. Changing settings takes effect on the next AI call — no restart required.

**Long-term:** The question history becomes a personal knowledge log. The score becomes a genuine, self-earned signal of how well the user knows a topic. Users revisit past questions, hit "Explain answer" to reinforce understanding, and "Teach me more" to explore concepts in depth — turning history from a passive record into an active learning tool. Users start tracking multiple domains — "what's your Greek mythology score?" becomes a casual conversation.

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

- **Runtime:** Node.js v25.8.0 (Current release — developer tool, single-user, no stability concern)
- **Interface:** Terminal only — no web UI, no GUI, no browser-based components
- **AI Integration:** The app supports 5 AI providers, selectable by the user at first launch or in Settings:
  - **GitHub Copilot SDK** — uses the user’s existing Copilot credentials (no API key required)
  - **OpenAI** — requires `OPENAI_API_KEY` environment variable
  - **Anthropic** — requires `ANTHROPIC_API_KEY` environment variable
  - **Google Gemini** — requires `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
  - **Ollama** — local instance, no API key; requires endpoint URL and model name
- All providers must produce the same structured JSON response schema; the app treats providers as interchangeable backends behind a unified interface
- **Storage:** Local file system only — one JSON file per domain at `~/.brain-break/<domain-slug>.json`; no database server, no cloud sync
- **Distribution:** Published to npm — installable via `npx` with no global install required
- **Platform:** Unix-like terminals only (macOS, Linux, WSL) — native Windows CMD/PowerShell is out of scope for MVP
- **License:** MIT

### Implementation Decisions

- **Provider abstraction:** All AI calls route through a unified provider interface. Each provider adapter translates the app’s prompt format to the provider’s API. Adding a new provider requires implementing the adapter interface — no changes to business logic
- **Provider configuration:** The selected provider is stored in `~/.brain-break/settings.json` as `provider` (string enum: `copilot` | `openai` | `anthropic` | `gemini` | `ollama`). Each hosted provider stores its preferred model: `openaiModel` (string, default `gpt-4o-mini`), `anthropicModel` (string, default `claude-sonnet-4-20250514`), `geminiModel` (string, default `gemini-2.0-flash`). For Ollama, the settings also store `ollamaEndpoint` (string, default `http://localhost:11434`) and `ollamaModel` (string, default `llama3`). API keys are read from environment variables at runtime — never stored in settings
- **Question generation:** The active provider is called via structured chat completion prompts; the LLM constructs the prompt and returns a **JSON structured response** with the following schema: question text, answer options (A–D), correct answer, difficulty level, and speed tier time thresholds (fast / normal / slow in ms)
- **Language and tone injection:** Every AI prompt (questions, motivational messages, answer explanations) includes a voice instruction derived from global settings — e.g., `"Respond in Greek using a pirate tone of voice."` — prepended to the system or user message before the generation instruction
- **Settings persistence:** Global settings are stored at `~/.brain-break/settings.json` as a flat JSON object with fields `provider` (string enum: `copilot` | `openai` | `anthropic` | `gemini` | `ollama`), `language` (string), `tone` (string enum: `natural` | `expressive` | `calm` | `humorous` | `sarcastic` | `robot` | `pirate`), per-provider model fields: `openaiModel` (string, default `gpt-4o-mini`), `anthropicModel` (string, default `claude-sonnet-4-20250514`), `geminiModel` (string, default `gemini-2.0-flash`), and for Ollama: `ollamaEndpoint` (string, default `http://localhost:11434`) and `ollamaModel` (string, default `llama3`), and `showWelcome` (boolean, default `true`); defaults applied on missing file: `{ "provider": null, "language": "English", "tone": "natural", "openaiModel": "gpt-4o-mini", "anthropicModel": "claude-sonnet-4-20250514", "geminiModel": "gemini-2.0-flash", "showWelcome": true }`
- **Deduplication mechanism:** Each generated question is hashed using SHA-256 on its normalized text (lowercased, whitespace-stripped); a match against any stored hash triggers regeneration — *Future enhancement: fuzzy/similarity-based deduplication*
- **Answer verification mechanism:** After generating a question, a separate verification prompt asks the AI to independently determine the correct answer for the same question (without revealing the original `correctAnswer`). If the verification answer disagrees with the generated answer, the question is discarded and regenerated once. The verification prompt uses the active language/tone settings. This is a fail-open mechanism: verification errors (network, parse, schema mismatch) silently pass through to avoid blocking the quiz experience
- **Domain file naming:** User-typed domain names are slugified for file system use — lowercased, spaces and special characters replaced with hyphens (e.g. `Spring Boot microservices` → `spring-boot-microservices.json`)

---

## Functional Requirements

The following 15 features define the complete MVP capability set. Each feature is specified as a user-facing capability. Implementation details are documented in Project-Type Requirements — Implementation Decisions.

**Terminal rendering (cross-cutting):** All screens perform a full terminal reset on every navigation action — clearing the visible viewport and scroll-back buffer so all content renders at the top of the terminal window with no prior output accessible by scrolling.

### Feature 1 — In-App Domain Management

**Home screen (Level 1)**

- On every launch the app displays the home screen listing all configured active domains, each showing current score and number of questions answered
- If no domains exist, the list is empty and the only available action is to create a new one
- Domain names are free-text — any topic the user types becomes a valid domain, and the AI will generate domain-specific questions for it
- All state (history, score, time played) is domain-scoped and isolated
- The home screen actions are: select a domain, create a new domain, view archived domains, settings, buy me a coffee, and exit — archive/history/stats/delete actions for a domain are **not** shown on the home screen; when `showWelcome` is `true`, selecting Exit displays the Exit Message screen (Feature 15) before terminating the app; when `showWelcome` is `false`, the app terminates immediately
- Selecting "Create new domain" shows an input prompt (`New domain name:`); after entering a name, the user selects a starting difficulty level via arrow key navigation from labeled options (1 — Beginner, 2 — Elementary, 3 — Intermediate, 4 — Advanced, 5 — Expert; default: 2 — Elementary); a Save/Back navigation prompt follows — selecting Save creates the domain, selecting Back returns to the home screen without creating a domain; pressing Ctrl+C at any prompt returns the user to the home screen without creating a domain

**Domain sub-menu (Level 2)**

- Selecting a domain from the home screen opens a domain sub-menu — the prompt header shows the domain name, current score, and total questions answered (refreshed on every entry)
- The domain sub-menu provides the following actions: **Play**, **View History**, **View Stats**, **Archive**, **Delete**, and **Back**
- Selecting **Play** displays a contextual motivational message before the session starts — triggered when the user has returned within 7 days of their last session or their score is trending upward — the message is AI-generated using the active language and tone of voice settings, then the quiz begins
- After a quiz session ends, the user is returned to the domain sub-menu (not the home screen); on this first re-render, a session summary block is displayed between the domain header and the action menu (see Feature 14 — Session Summary)
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
  - New domains start at the difficulty level selected during domain creation (default: level 2 — Elementary)
  - Difficulty and streak counter persist across sessions per domain

| Level | Label | Focus |
|---|---|---|
| 1 | Beginner | Foundational concepts, basic syntax, definitions |
| 2 | Elementary | Common patterns, standard usage, simple debugging |
| 3 | Intermediate | Non-obvious behavior, edge cases, framework internals |
| 4 | Advanced | Architecture decisions, performance trade-offs, complex debugging |
| 5 | Expert | Deep internals, uncommon edge cases, cross-domain reasoning |

- **Answer self-consistency verification:** After generating a question, the system independently asks the AI to verify the correct answer without revealing the original `correctAnswer`. If the verification disagrees, the question is discarded and regenerated once. Verification failures (network, parse) are non-blocking — the original question is accepted. This mitigates LLM hallucinations where the model returns a factually incorrect answer marked as correct
- **API error handling:** If the configured AI provider is unreachable or authentication fails, the app fails gracefully without crashing — see NFR 2 for specified behavior.

### Feature 3 — Interactive Terminal Quiz

- Questions are displayed one at a time in the terminal
- A timer starts silently when the question is displayed and stops when the user submits their answer — no visible countdown is shown during the question
- The response time is recorded for every question
- After answering, the post-answer feedback is rendered **on the same screen** as the original question — no terminal clear or screen transition occurs between the question display and the feedback panel. The user sees the question text, answer options, their chosen answer, and all feedback together: correct/incorrect status, the right answer if wrong, time taken, speed tier (fast / normal / slow), and score delta
- After the feedback panel, the user is presented with three options: **Next question**, **Explain answer**, and **Back**
- Selecting **Explain answer** calls the AI provider to generate a concise explanation (2–4 sentences) of why the correct answer is correct — optionally noting why common wrong choices are incorrect — displayed inline below the feedback panel using the active language and tone settings; a loading spinner is shown during generation
- After the explanation is displayed, the user is presented with three options: **Teach me more**, **Next question**, and **Back** (Explain is not offered again for the same question)
- If the AI call for the explanation fails, a warning message is displayed (e.g. *"Could not generate explanation."*) and the user is returned to the Next/Back prompt — the failure is non-critical and does not interrupt the quiz session

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
- Questions are displayed one at a time; the user navigates with Previous, Next, Explain answer, and Back controls; a progress indicator shows the user's current position (e.g., "Question 3 of 47")
- Each entry displays all fields recorded per question (see Feature 5 — Persistent History)
- Selecting **Explain answer** calls the AI provider to generate a concise explanation (2–4 sentences) of why the correct answer is correct — using the same explain flow as Feature 3 (Interactive Terminal Quiz) with the active language and tone settings; a loading spinner is shown during generation
- The explanation is displayed inline on the same screen as the question detail — no terminal clear or screen transition occurs; the user sees the question, their answer, all recorded fields, and the explanation together
- After the explanation is displayed, the navigation menu re-appears with Teach me more, Previous, Next, and Back (Explain is not shown while the explanation is already visible on screen). If the user navigates away and returns to the same question, Explain answer is available again
- If the AI call for the explanation fails, a warning message is displayed (e.g., *"Could not generate explanation."*) and the user is returned to the navigation menu — the failure is non-critical and does not interrupt history browsing

### Feature 7 — View Stats Command

User can view a summary dashboard for the active domain:
- Current score
- Total questions answered
- Correct vs. incorrect count and accuracy %
- Total time played across all sessions
- Starting difficulty level (set at domain creation, never changes)
- Current difficulty level
- Score trend over the last 30 days (growing / flat / declining) — derived from local question history
- Days since first session and current return streak — derived from local session timestamps

### Feature 8 — Global Settings

- The home screen includes a **Settings** option positioned above the "Buy me a coffee" action
- Selecting Settings opens a settings screen where the user can configure four global preferences: **AI Provider**, **Question Language**, **Tone of Voice**, and **Welcome & Exit Screen** toggle
- Settings are global — they apply to all domains and all AI-generated content (questions, answer options, motivational messages)
- Settings persist between sessions in a global settings file at `~/.brain-break/settings.json`
- On first launch with no settings file, defaults are: provider = none (must be selected), language = `English`, tone = `Natural`, showWelcome = `true`

**First-Launch Provider Setup**

- On first launch (no `settings.json` exists), a one-time **Provider Setup** screen appears before the home screen
- The user selects an AI provider from the fixed list using arrow key navigation: **GitHub Copilot**, **OpenAI**, **Anthropic**, **Google Gemini**, **Ollama**
- After selection, the app configures provider-specific settings and makes a real one-shot API test call to verify connectivity:
  - **GitHub Copilot:** Tests Copilot authentication with a real API call — if successful, proceed; if not, display: *"Copilot authentication not detected. Ensure you have an active GitHub Copilot subscription and are logged in."*
  - **OpenAI / Anthropic / Google Gemini:** Checks for the corresponding environment variable (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`) — if found, prompts the user to enter a preferred model name (pre-filled with the provider's default: `gpt-4o-mini` for OpenAI, `claude-sonnet-4-20250514` for Anthropic, `gemini-2.0-flash` for Gemini). The user can accept the default by pressing Enter, type a different model name, or enter an empty string to reset to the default. After provider-specific configuration, the app makes a real one-shot API test call to verify connectivity. If the env var is missing, display: *"Set the `[VAR_NAME]` environment variable and restart the app."*
  - **Ollama:** Prompts for endpoint URL (pre-filled `http://localhost:11434`) and model name (pre-filled `llama3`) — tests connection; if unreachable, display: *"Could not reach Ollama at [endpoint]. Ensure Ollama is running."*
- If validation fails, the app **proceeds to the home screen anyway** — the user can explore all features except Play; attempting Play shows: *"AI provider not ready. Go to Settings to configure."*
- If validation succeeds, the app proceeds to the home screen with full functionality
- The selected provider (and Ollama endpoint/model if applicable) is saved to `settings.json`
- On subsequent launches, the saved provider is used automatically — no re-prompting

**AI Provider**

- User selects from 5 providers via arrow key navigation: **GitHub Copilot**, **OpenAI**, **Anthropic**, **Google Gemini**, **Ollama**
- Selecting a provider triggers the same validation logic as first-launch setup
- For OpenAI, Anthropic, and Google Gemini, the user is prompted to enter a preferred model name (pre-filled with the current or default value). Entering an empty string resets the model to the provider's default (`gpt-4o-mini`, `claude-sonnet-4-20250514`, or `gemini-2.0-flash` respectively)
- For Ollama, the user can edit the endpoint URL and model name
- GitHub Copilot does not prompt for a model — model selection is managed internally by the Copilot SDK
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

**Welcome & Exit Screen**
- A 🎬 Welcome & Exit screen toggle (displayed as ON/OFF) controls whether the branded Welcome Screen (Feature 11) is shown on launch and whether the branded Exit Message screen (Feature 15) is shown on explicit home-screen Exit
- Default is ON — when disabled, the app skips the Welcome Screen and also skips the Exit Message screen (explicit Exit terminates immediately)

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

### Feature 11 — Welcome Screen

- On every launch where the `showWelcome` setting is `true` (default), a branded Welcome Screen is displayed after the Provider Setup screen (if shown) and before the home screen
- The Welcome Screen renders the following content in order:
  1. The app emoji branding (`🧠🔨`)
  2. A gradient-colored ASCII art rendering of "Brain Break" — the text interpolates from cyan `rgb(0, 180, 200)` to magenta `rgb(200, 0, 120)` row-by-row; on terminals with limited color support (chalk level < 3), the art renders in bold cyan
  3. A styled subtitle line: `>` rendered in **cyan**, the text `Train your brain, one question at a time`, and `_` rendered in **magenta**
  4. The current app version (e.g., `v1.2.0`) rendered in dim white
  5. A gradient shadow bar spanning the terminal width (same cyan-to-magenta gradient)
- The user dismisses the Welcome Screen by pressing Enter (via a single "Press enter to continue..." prompt)
- Pressing Ctrl+C on the Welcome Screen exits the app cleanly with code 0
- The Welcome Screen uses `clearScreen()` (not `clearAndBanner()`) because it renders its own full-screen branded layout
- When `showWelcome` is `false` in settings, the Welcome Screen is skipped entirely — the app proceeds directly from Provider Setup (if needed) to the home screen
- The `showWelcome` setting is a boolean stored in `~/.brain-break/settings.json` (default: `true`)
- The Settings screen includes a **🎬 Welcome & Exit screen** toggle (displayed as ON/OFF) allowing the user to enable or disable both the Welcome Screen and the Exit Message screen; the toggle takes effect on the next app launch and on the next explicit Exit action

### Feature 12 — Static Banner

- Every screen in the app (except the Welcome Screen and Provider Setup screen) renders a persistent static banner at the top of the terminal after clearing the viewport
- The banner consists of:
  1. A bold text line: `🧠🔨 Brain Break`
  2. A gradient shadow bar immediately below — the same cyan-to-magenta gradient used in the Welcome Screen, spanning the terminal width (capped at 80 columns)
- The banner is rendered via a shared `clearAndBanner()` utility in `utils/screen.ts` that calls `clearScreen()` followed by `banner()`
- The banner applies to: home screen, domain sub-menu, quiz question display, post-answer feedback, history navigation, stats dashboard, archived domains list, settings screen, and coffee supporter screen
- The Welcome Screen and Provider Setup screen use `clearScreen()` instead (no banner) — they render their own branded header layout

### Feature 13 — Explanation Drill-Down

- After an AI-generated explanation is displayed — in both the quiz post-answer flow (Feature 3) and history navigation (Feature 6) — the user is presented with a **Teach me more** option alongside the existing navigation controls
- Selecting **Teach me more** calls the AI provider to generate a concise micro-lesson (~1-minute read, 3–5 paragraphs) on the underlying concept behind the question — going deeper than the initial explanation to cover foundational principles, related concepts, and practical context
- The micro-lesson is displayed inline below the explanation on the same screen — no terminal clear or screen transition occurs; the user sees the question, feedback, explanation, and micro-lesson together; a loading spinner is shown during generation; the micro-lesson uses the active language and tone settings
- After the micro-lesson is displayed, the **Teach me more** option is removed — the user sees only the remaining navigation controls (Next question / Back in the quiz context; Previous / Next / Back in the history context). Teach me more is not offered again for the same question while the micro-lesson is visible
- If the user navigates away and returns to the same question, **Teach me more** is available again only after selecting **Explain answer** again — micro-lesson availability follows explanation availability
- If the AI call for the micro-lesson fails, a warning message is displayed (e.g., *"Could not generate micro-lesson."*) and the user is returned to the navigation controls — the failure is non-critical and does not interrupt the session

### Feature 14 — Session Summary

- After a quiz session ends and the user is returned to the domain sub-menu, a one-time session summary block is displayed between the domain header and the action menu
- The session summary is ephemeral — it appears only on the first render of the domain sub-menu immediately after a quiz session; navigating to View History, View Stats, or any other screen and returning to the domain sub-menu does not re-display it; re-entering the domain from the home screen does not re-display it
- A session is defined as the period from selecting Play to selecting Back — every session that includes at least one answered question produces a summary
- The session summary displays the following fields in order, using the same `bold('Label:') + ' value'` format as the Stats Dashboard (Feature 7):
  1. **Score delta:** Net score change for the session (positive or negative) — displayed in green (positive) or red (negative) using `colorCorrect` / `colorIncorrect`
  2. **Questions answered:** Count of questions answered in the session
  3. **Correct / Incorrect:** Correct count and incorrect count (e.g., `5 / 2`)
  4. **Accuracy:** Percentage of correct answers (e.g., `71.4%`) — formatted using `formatAccuracy`
  5. **Fastest answer:** Shortest response time in the session (e.g., `3.2s`) — displayed in green
  6. **Slowest answer:** Longest response time in the session (e.g., `12.8s`) — displayed in red
  7. **Session duration:** Total time from first question displayed to last answer submitted — formatted using the same `formatTotalTimePlayed` function as the Stats Dashboard
  8. **Difficulty:** Starting difficulty level → ending difficulty level with directional indicator (e.g., `2 — Elementary → 3 — Intermediate ▲`) — difficulty labels use `colorDifficultyLevel`; ▲ displayed in green, ▼ displayed in red, — displayed in yellow when difficulty is unchanged
- The summary block is framed by dim horizontal divider lines (e.g., `── Last Session ──────`) rendered using `dim()`
- The summary renders on the domain sub-menu screen using the standard `clearAndBanner()` flow — no additional terminal reset is triggered; it is content between the banner and the action menu

### Feature 15 — Exit Message

- When `showWelcome` is `true`, selecting **Exit** from the home screen displays a branded Exit Message screen before the process terminates
- When `showWelcome` is `false`, selecting **Exit** terminates immediately with no Exit Message screen
- The Exit Message screen uses `clearScreen()` (not `clearAndBanner()`) so it renders as a full-screen branded layout, consistent with the Welcome Screen behavior
- The Exit Message screen renders the following content in order:
  1. The app emoji branding (`🧠🔨`)
  2. A gradient-colored ASCII art rendering of "Brain Break" identical to the Welcome Screen — cyan `rgb(0, 180, 200)` to magenta `rgb(200, 0, 120)` row-by-row; on terminals with limited color support (chalk level < 3), the art renders in bold cyan
  3. A styled subtitle line identical to the Welcome Screen: `>` rendered in **cyan**, the text `Train your brain, one question at a time`, and `_` rendered in **magenta**
  4. A dim status line indicating automatic termination: `Exiting in 3 seconds...` (or equivalent phrasing)
  5. The current app version (e.g., `v1.2.0`) rendered in dim white
  6. A gradient shadow bar spanning the terminal width (same cyan-to-magenta gradient)
- Interaction model:
  - The app auto-exits after 3 seconds with process exit code 0
  - Pressing Enter on the Exit Message screen exits immediately with process exit code 0
  - Pressing Ctrl+C on the Exit Message screen exits immediately with process exit code 0
- The Exit Message appears only for the explicit Exit action on the home screen; it is not required for error-driven termination paths

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
All screen transitions — including home screen, domain sub-menu, quiz questions, history navigation, stats dashboard, welcome screen, exit message screen, and settings screen — perform a full terminal reset, clearing both the visible viewport and the scroll-back buffer. All content renders at the top of the terminal window; no prior output is visible or accessible by scrolling after any navigation action. **Exception:** the post-answer feedback panel does **not** trigger a terminal reset — it renders inline on the same screen as the quiz question so the user can see the original question alongside the feedback. A terminal reset occurs only when the user selects Next question (loading the next question) or exits the quiz. On all screens except the Welcome Screen, Exit Message screen, and Provider Setup screen, a static banner (`🧠🔨 Brain Break` + gradient shadow bar) is rendered immediately after the terminal reset and before any screen content — this is handled by the shared `clearAndBanner()` utility. The session summary block (Feature 14) renders on the domain sub-menu screen as part of the standard `clearAndBanner()` flow — it does not trigger an additional terminal reset; it is content rendered between the banner and the action menu on the domain sub-menu's normal screen draw. Measurable: every state-changing user input produces a fully redrawn terminal at scroll position zero, with zero residual output from the previous state — except post-answer feedback, which appends to the current question screen.

### NFR 6 — Terminal Color Rendering
All ANSI color output uses standard 8/16-color ANSI escape codes — ensuring compatibility across macOS Terminal, iTerm2, Linux terminals, and WSL. Extended 256-color or true-color codes may be used where supported. The application is interactive-only; non-TTY and piped execution modes are out of scope.

---
