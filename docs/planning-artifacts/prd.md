---
status: reviewed
sourceDocument: product-brief.md
date: 2026-03-07
author: George
inputDocuments:
  - docs/planning-artifacts/product-brief.md
workflowType: prd
workflow: edit
stepsCompleted:
  - step-e-01-discovery
  - step-e-02-review
  - step-e-03-edit
lastEdited: '2026-03-14'
editHistory:
  - date: '2026-03-14'
    changes: 'Feature 6: replaced 10-per-page pagination with single-question navigation and progress indicator'
  - date: '2026-03-14'
    changes: 'Feature 1: introduced two-level navigation — home screen lists domains only (with score/count) + create/archived/exit; selecting a domain opens a domain sub-menu with Play, View History, View Stats, Archive, and Back'
  - date: '2026-03-14'
    changes: 'Feature 1: create-domain screen input prompt updated with Ctrl+C back hint — pressing Ctrl+C returns to home without creating a domain (2-step flow: home → input)'
---

# Product Requirements Document: brain-break

> **Status:** Reviewed — validated and updated 2026-03-07. Ready for architecture handoff.

---

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes on any topic you define. Powered by the GitHub Copilot SDK, it generates contextually relevant, never-repeating questions across any domain — from `java-programming` to `greek-mythology` to `thai-cuisine` — turning idle break time into a measurable, honest knowledge signal. It lives where terminal users already work: the CLI. No accounts. No setup friction. Clone and run.

Curious people want to stay sharp across a wide variety of topics, but existing learning tools demand 30–60 minute structured sessions that don't fit the short, unplanned breaks that naturally occur during a day. The result: knowledge gaps compound silently, and people either over-commit to platforms they never finish, or do nothing during natural break windows. No existing CLI-first tool combines AI question generation, user-defined open-ended domains, duplicate prevention, and honest skill tracking in a single, zero-friction package.

`brain-break` targets anyone with daily terminal use and an active GitHub Copilot subscription who wants short, purposeful learning sessions on topics they care about.

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

The following 7 capabilities define the complete MVP:

1. In-App Domain Management
2. AI-Powered Question Generation (GitHub Copilot SDK)
3. Interactive Terminal Quiz
4. Scoring System
5. Persistent History (Per Domain)
6. View History Command
7. View Stats Command

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

`brain-break` targets anyone with daily terminal use and an active GitHub Copilot subscription. Three personas cover the typical range of motivations and use patterns.

### Primary Users

#### Persona 1 — "Alex, the Developer"
**Role:** Mid-level fullstack developer, 3–5 years experience  
**Context:** Uses the terminal daily, has GitHub Copilot access

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

**Onboarding:** Runs `node index.js`. The home screen appears immediately. With no domains configured yet, the only available action is to create a new one — the user types any topic, hits enter, selects it, and the first question appears. No config file, no account, no signup, no friction.

**Core Usage:**
- Triggered by natural break moments: between tasks, waiting for a process, lunch, commute
- Sessions are 2–10 minutes; 3–10 questions per session
- Answers a question → sees if correct → sees score delta → next question
- History persists between sessions automatically

**"Aha!" Moment:** Gets a question wrong on something they thought they knew. Score dips. They look it up. They come back and get it right next time. The score rises. *That feedback loop is the product.*

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
| AI-generated questions | ✅ (Copilot SDK) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| In-app domain management | ✅ | ❌ | ❌ |
| Honest skill-signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / shareable | ✅ | ❌ | Partial |

---

## Project-Type Requirements

- **Runtime:** Node.js (no minimum version mandated for MVP — use current LTS)
- **Interface:** Terminal only — no web UI, no GUI, no browser-based components
- **AI Integration:** GitHub Copilot SDK — required hard dependency; users must have an active GitHub Copilot subscription; authentication uses the user's existing Copilot credentials (no token setup required by the user)
- **Storage:** Local file system only — one JSON file per domain at `~/.brain-break/<domain-slug>.json`; no database server, no cloud sync
- **Distribution:** Published to npm — installable via `npx` with no global install required
- **Platform:** Unix-like terminals only (macOS, Linux, WSL) — native Windows CMD/PowerShell is out of scope for MVP

### Implementation Decisions

- **Question generation:** The Copilot SDK is called via structured chat completion prompts; the LLM constructs the prompt and returns a **JSON structured response** with the following schema: question text, answer options (A–D), correct answer, difficulty level, and speed tier time thresholds (fast / normal / slow in ms)
- **Deduplication mechanism:** Each generated question is hashed using SHA-256 on its normalized text (lowercased, whitespace-stripped); a match against any stored hash triggers regeneration — *Future enhancement: fuzzy/similarity-based deduplication*
- **Domain file naming:** User-typed domain names are slugified for file system use — lowercased, spaces and special characters replaced with hyphens (e.g. `Spring Boot microservices` → `spring-boot-microservices.json`)

---

## Functional Requirements

The following 7 features define the complete MVP capability set. Each feature is specified as a user-facing capability. Implementation details are documented in Project-Type Requirements — Implementation Decisions.

### Feature 1 — In-App Domain Management

**Home screen (Level 1)**

- On every launch the app displays the home screen listing all configured active domains, each showing current score and number of questions answered
- If no domains exist, the list is empty and the only available action is to create a new one
- Domain names are free-text — any topic the user types becomes a valid domain, and the AI will generate appropriately focused questions for it
- All state (history, score, time played) is domain-scoped and isolated
- The home screen actions are: select a domain, create a new domain, view archived domains, and exit — archive/history/stats actions for a domain are **not** shown on the home screen
- Selecting "Create new domain" shows an input prompt (`New domain name (Ctrl+C to go back):`); pressing Ctrl+C returns the user to the home screen without creating a domain

**Domain sub-menu (Level 2)**

- Selecting a domain from the home screen opens a domain sub-menu — the prompt header shows the domain name, current score, and total questions answered (refreshed on every entry)
- The domain sub-menu provides the following actions: **Play**, **View History**, **View Stats**, **Archive**, and **Back**
- Selecting **Play** displays a contextual motivational message before the session starts — triggered when the user has returned within 7 days of their last session or their score is trending upward — then begins the quiz
- After a quiz session ends, the user is returned to the domain sub-menu (not the home screen)
- Selecting **Archive** sets the domain as archived, removes it from the active list, and returns the user to the home screen — all history, score, and progress are fully preserved
- Selecting **Back** returns the user to the home screen
- Selecting **View History** or **View Stats** opens the respective screen; selecting Back from either returns the user to the domain sub-menu

**Archived domains**

- The home screen includes a *"View archived domains"* action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off
- Switching to a previously used domain resumes exactly where the user left off

### Feature 2 — AI-Powered Question Generation (GitHub Copilot SDK)

- Questions are generated on demand via the GitHub Copilot SDK
- All questions are multiple choice (4 options: A, B, C, D)
- Users never receive a repeated question within the same domain — deduplication persists across all sessions (see Project-Type Requirements — Implementation Decisions)
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

- **API error handling:** If the Copilot API is unreachable or authentication fails, the app fails gracefully without crashing — see NFR 2 for specified behavior.

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

---

## Non-Functional Requirements

### NFR 1 — Question Generation Response Time
The next question must appear within **≤ 5 seconds** of the user submitting an answer (covering Copilot API call + local persistence). A loading spinner is displayed during generation so the terminal does not appear frozen.

### NFR 2 — API Error Handling
- **Network / API unavailable:** The app displays a clear error message (*"Could not reach the Copilot API. Check your connection and try again."*) and returns the user to the home screen without crashing.
- **Authentication failure:** The app displays a specific message (*"Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in."*) and exits cleanly.

### NFR 3 — Data Integrity
- **Missing domain file:** Treated as a new domain — the app starts fresh with score 0 and no history. No error displayed.
- **Corrupted domain file:** The app displays a warning (*"Domain data for [domain] appears corrupted and cannot be loaded. Starting fresh."*) and resets the domain to a clean state. The corrupted file is overwritten on the next save.

### NFR 4 — Startup Time
The app must reach the home screen within **≤ 2 seconds** of launch (`npx brain-break` or `node index.js`) on a standard developer machine.

---

## Open Questions

No open questions — all design and implementation decisions were resolved during PRD review.
