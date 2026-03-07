---
status: reviewed
sourceDocument: product-brief-brain-break-2026-03-01.md
date: 2026-03-07
author: George
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-brain-break-2026-03-01.md
---

# Product Requirements Document: brain-break

> **Status:** Reviewed — validated and updated 2026-03-07. Ready for architecture handoff.

---

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes in the developer's workflow. Powered by the GitHub Copilot SDK, it generates contextually relevant, never-repeating questions on any configurable technical domain — turning idle break time into a measurable skill check. It lives where developers already work: the terminal. No accounts. No setup friction. Clone and run.

Developers want to stay sharp across rapidly evolving technical domains, but existing learning tools demand 30–60 minute structured sessions that don't fit the short, unplanned breaks that naturally occur during a workday. The result: knowledge gaps compound silently, and developers either over-commit to platforms they never finish, or do nothing during natural break windows. No existing CLI-first tool combines AI question generation, configurable technical domains, duplicate prevention, and skill tracking in a single, zero-friction package — making it easy for an entire team to adopt without coordination overhead.

`brain-break` targets developers of all experience levels with daily terminal use and an active GitHub Copilot subscription — from juniors building foundational confidence to seniors staying sharp on evolving APIs.

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

`brain-break` is an open-source, team-shared tool — success is measured in adoption depth and genuine utility, not revenue.

1. **Team adoption:** The majority of developers on the team have installed and actively use `brain-break` within 30 days of publish
2. **Habit formation:** Active users engage daily rather than sporadically — the tool earns a permanent place in the development workflow
3. **Perceived value:** Team members voluntarily recommend the tool to others — organic spread beyond the initial team
4. **Skill reinforcement:** Users report that their knowledge in configured domains feels sharper and more confident over time

---

## Target Users

`brain-break` targets individual developers of all experience levels who use the terminal daily and have GitHub Copilot access. Three personas cover the typical range of motivations and use patterns.

### Primary Users

#### Persona 1 — "Alex, the Mid-Level Developer"
**Role:** Mid-level fullstack developer, 3–5 years experience  
**Stack:** Java / Spring Boot backend, React frontend  
**Context:** Works in a team environment, uses the terminal daily, has GitHub Copilot access

**Motivation:** Wants to feel confident across the full stack. Suspects there are gaps in knowledge they haven't consciously identified yet. Values honest self-assessment over completion badges.

**Problem Experience:** Udemy courses sit half-finished. Stack Overflow answers questions reactively — it doesn't build systematic knowledge. During a 5-minute build wait, there's nothing that turns that time into learning.

**Success Vision:** A session that challenges them, reveals a surprising gap, or confirms their expertise — all within the time a build takes. A rising score that genuinely reflects skill, not just effort.

---

#### Persona 2 — "Sam, the Junior Developer"
**Role:** Junior developer, 0–2 years experience, recently onboarded  
**Stack:** React (primary), learning Java  
**Context:** Learning fast, eager to prove themselves, lives in the terminal

**Motivation:** Build confidence. The game format removes the anxiety of formal assessment — wrong answers just affect score, not performance reviews. Microlearning fits their short attention span and high curiosity.

**Problem Experience:** Doesn't know what they don't know. Structured courses feel overwhelming. Wants bite-sized, targeted challenges they can come back to repeatedly.

**Success Vision:** A fun, low-stakes way to discover knowledge gaps and fill them incrementally. Watching the score grow is tangible proof of progress.

---

#### Persona 3 — "Jordan, the Senior Developer"
**Role:** Senior engineer, 8+ years experience  
**Stack:** .NET, Java, React — across the board  
**Context:** Busy, deep in architecture and code reviews; rarely gets time for structured learning

**Motivation:** Stay sharp on evolving APIs, new framework features, and domains adjacent to their core. Not interested in beginner content — wants sharp, specific questions.

**Problem Experience:** Senior devs are the last to refresh foundational knowledge. brain-break's AI-generated questions can probe deep, specific topics that no static quiz covers.

**Success Vision:** A quick mental warm-up or cool-down. Questions that are actually hard enough to be satisfying. A score that doesn't flatter.

---

### Secondary Users

None. `brain-break` is a purely self-serve individual tool. No admin, team management, or oversight roles required.

---

## User Journeys

**Discovery:** Developer sees the repo shared in the team's GitHub organization. One-line README install hook. Cloned and running in under 2 minutes.

**Onboarding:** Runs `node index.js`. The home screen appears immediately. With no domains configured yet, the only available action is to create a new one — the user types a domain name, hits enter, selects it, and the first question appears. No config file, no account, no signup, no friction.

**Core Usage:**
- Triggered by natural break moments: post-standup, build waiting, between PRs, lunch
- Sessions are 2–10 minutes; 3–10 questions per session
- Answers a question → sees if correct → sees score delta → next question
- History persists between sessions automatically

**"Aha!" Moment:** Gets a question wrong on something they thought they knew. Score dips. They look it up. They come back and get it right next time. The score rises. *That feedback loop is the product.*

**Long-term:** The question history becomes a personal knowledge log. The score becomes a genuine, self-earned signal of domain depth. Devs start comparing domain scores informally — "what's your React score?" becomes a team conversation.

---

## Domain Requirements

Not applicable. `brain-break` operates in no regulated domain (no healthcare, fintech, govtech, or e-commerce context). No domain-specific compliance requirements apply.

---

## Innovation Analysis

`brain-break` occupies a gap in the developer tooling landscape. No existing tool combines all of the following in a single, zero-friction package:

| Factor | brain-break | Udemy / Video Platforms | Flashcard Apps |
|---|---|---|---|
| Session length | 2–10 minutes | 30–60+ minutes | Variable |
| Terminal-native | ✅ | ❌ | ❌ |
| AI-generated questions | ✅ (Copilot SDK) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| In-app domain management | ✅ | ❌ | ❌ |
| Skill-signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / team-shareable | ✅ | ❌ | Partial |

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

- On every launch the app displays the home screen listing all configured domains, each showing current score and number of questions answered
- If no domains exist, the list is empty and the only available action is to create a new one
- The user selects a domain to resume, or chooses to add a new one at any time from the home screen
- When the user selects an existing domain, a contextual motivational message is displayed before the session starts — triggered when the user has returned within 7 days of their last session or their score is trending upward
- Domain names are free-text — any topic the user types becomes a valid domain, and the AI will generate appropriately focused questions for it
- The user selects one domain per session — that selection determines the active quiz context
- All state (history, score, time played) is domain-scoped and isolated
- Switching to a previously used domain resumes exactly where the user left off
- Domains can be archived from the home screen — archived domains disappear from the active list but all their history, score, and progress are fully preserved
- The home screen includes a *"View archived domains"* action that opens the archived list, where the user can unarchive any domain to resume exactly where they left off

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
- Display is paginated (e.g., 10 questions per page)
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

### NFR 5 — Local File Security
All files written to `~/.brain-break/` must be created with **owner read/write only** permissions (`0o600`). No world-readable history or score files.

---

## Open Questions

No open questions — all design and implementation decisions were resolved during PRD review.
