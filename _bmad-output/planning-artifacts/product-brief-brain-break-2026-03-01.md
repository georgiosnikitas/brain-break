---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments: []
date: 2026-03-01
author: George
---

# Product Brief: brain-break

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes directly in the developer's workflow. Powered by the GitHub Copilot SDK, it generates contextually relevant, never-repeating questions on any configurable technical domain — turning idle break time into a measurable, honest skill signal. Designed for developers, by developers, it lives where they already work: the terminal.

---

## Core Vision

### Problem Statement

Developers want to stay sharp across rapidly evolving technical domains, but existing learning tools demand long, structured time commitments (30–60 minute video courses, structured curricula) that are incompatible with the short, unplanned breaks that naturally occur during a workday.

### Problem Impact

- Knowledge gaps compound silently when no lightweight reinforcement mechanism exists
- Developers either over-commit to heavy learning platforms they don't finish, or do nothing during natural break windows
- Teams have no shared, low-friction tool to encourage continuous technical learning in the flow of daily work

### Why Existing Solutions Fall Short

**Udemy Business Pro** and similar platforms are rich but heavyweight: video-centric, requiring 30+ minute sessions, not terminal-friendly, and not developer-workflow-native. They are excellent for deep dives but wholly inappropriate for a 5-minute break.

Flashcard apps (e.g., Anki) require manual content creation and lack AI-driven question generation or developer domain depth.

No existing CLI-first tool combines AI question generation, configurable technical domains, duplicate prevention, and honest skill tracking in a single, publishable open-source package.

### Proposed Solution

`brain-break` is a terminal CLI tool that:
- Reads a configuration file containing the user's list of preferred domains (e.g., `java`, `react`, `.net`) and prompts the user to select one at startup
- Uses the GitHub Copilot SDK to generate fresh, non-repeating multiple-choice questions on demand
- Presents questions interactively in the terminal with a response timer
- Scores answers based on correctness and response speed — producing an honest, evolving skill signal
- Persists a full history of questions, answers, timestamps, durations, and scores locally
- Allows users to review history, total score, and total time played at any point

### Key Differentiators

| Factor | brain-break | Udemy / Video Platforms | Flashcard Apps |
|---|---|---|---|
| Session length | 2–10 minutes | 30–60+ minutes | Variable |
| Terminal-native | ✅ | ❌ | ❌ |
| AI-generated questions | ✅ (Copilot SDK) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| Multi-domain config + startup selection | ✅ | ❌ | ❌ |
| Honest skill signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / team-shareable | ✅ | ❌ | Partial |

---

## Target Users

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

### User Journey

**Discovery:** Developer sees the repo shared in the team's GitHub organisation. One-line README install hook. Cloned and running in under 2 minutes.

**Onboarding:** Edits the config file to add their domains of interest (e.g., `["java", "react", ".net"]`). Runs `node index.js`. A startup prompt lists available domains — they select one and the first question appears immediately. No account, no signup, no friction.

**Core Usage:**
- Triggered by natural break moments: post-standup, build waiting, between PRs, lunch
- Sessions are 2–10 minutes; 3–10 questions per session
- Answers a question → sees if correct → sees score delta → next question
- History persists between sessions automatically

**"Aha!" Moment:** Gets a question wrong on something they thought they knew. Score dips. They look it up. They come back and get it right next time. The score rises. *That feedback loop is the product.*

**Long-term:** The question history becomes a personal knowledge log. The score becomes a genuine, self-earned signal of domain depth. Devs start comparing domain scores informally — "what's your React score?" becomes a team conversation.

---

## Success Metrics

### User Success Metrics

The primary signal that `brain-break` is working is **behavioural and self-reported improvement** — users who return daily and whose score progression correlates with real-world confidence and competence.

| Metric | Target | Signal |
|---|---|---|
| Daily active usage | ≥ 1 session per day per active user | Tool has become a genuine habit |
| Score progression | Consistent upward trend over 2–4 weeks | Learning is happening, not just playing |
| Session completion rate | ≥ 80% of started sessions completed | Questions are engaging and appropriately challenging |
| Return rate (Day 7) | ≥ 60% of users who try it return within a week | First impression converts to habit |
| Domain diversity | Users configure ≥ 2 different domains over lifetime | Drives breadth of learning |

**The ultimate user success indicator:** A developer saying — or demonstrating — *"I'm becoming a better software developer."*

---

### Business Objectives

Since `brain-break` is an open-source, team-shared tool (not a commercial product), success is measured in adoption depth and genuine utility — not revenue.

1. **Team adoption:** The majority of developers on the team have installed and actively use brain-break within 30 days of publish
2. **Habit formation:** Active users engage daily rather than sporadically — the tool earns a permanent place in the development workflow
3. **Perceived value:** Team members voluntarily recommend the tool to others (organic spread beyond the initial team)
4. **Skill reinforcement:** Users report that their knowledge in configured domains feels sharper and more confident over time

---

### Key Performance Indicators

#### Engagement KPIs
- **Daily sessions per active user:** ≥ 1 session/day
- **Average session length:** 3–10 minutes (short enough to be frictionless, long enough to be meaningful)
- **Questions answered per session:** ≥ 5 questions

#### Learning KPIs
- **Score growth rate:** Score increases progressively over the first 30 days of use (not flat or random)
- **Correct answer rate over time:** Improves measurably in a configured domain after 20+ questions answered
- **History depth:** Users who have answered 50+ questions have a meaningful personal knowledge log they can review

#### Adoption KPIs
- **Time to first question:** < 5 minutes from clone to first answered question
- **7-day retention:** ≥ 60% of users who run it once return within 7 days
- **Team penetration:** ≥ 50% of eligible team members actively using within 30 days of release

---

## MVP Scope

### Core Features

#### 1. Configuration File
- A config file (e.g., `config.json` or `config.yaml`) contains a list of domains the user wants to practice (e.g., `["java", "react", ".net"]`)
- On app startup, the user is presented with an interactive selection menu showing all configured domains
- The user selects one domain per session — that selection determines the active quiz context
- All state (history, score, time played) is domain-scoped and isolated
- Switching to a previously used domain resumes exactly where the user left off
- Adding or removing domains from the config file adds or removes them from the startup selection menu — existing domain data is never deleted

#### 2. AI-Powered Question Generation (GitHub Copilot SDK)
- Questions are generated on demand via the GitHub Copilot SDK
- All questions are multiple choice (e.g., 4 options: A, B, C, D)
- Questions are never repeated within the same domain — a persistent record of asked questions is maintained per domain
- **Adaptive difficulty:** Each question's difficulty adapts based on the previous answer:
  - Correct answer → next question is slightly harder
  - Wrong answer → next question is slightly easier
  - Difficulty progresses progressively over the session and across sessions

#### 3. Interactive Terminal Quiz
- Questions are displayed one at a time in the terminal
- A timer starts when the question is displayed and stops when the user submits their answer
- The response time is recorded for every question
- After answering, the user sees: correct/incorrect, the right answer if wrong, time taken, and score delta

#### 4. Scoring System
- Score is per-domain and persists across sessions
- Score increases for correct answers and decreases for incorrect ones
- Speed modifier: faster correct answers yield higher score gains; slower correct answers yield smaller gains
- Speed modifier: incorrect answers lose more points if answered slowly (penalty for slow + wrong)
- Score never resets — it is a cumulative, honest long-term skill signal per domain

#### 5. Persistent History (Per Domain)
- Every answered question is recorded locally with:
  - Question text and all answer options
  - The user's chosen answer
  - Whether it was correct or incorrect
  - Timestamp of when it was answered
  - Time taken to answer (ms/s)
  - Score delta for that question
  - Difficulty level assigned to the question
- History is isolated per domain — switching domains does not affect other domains' histories

#### 6. View History Command
- User can view their full question history for the active domain
- Display is paginated (e.g., 10 questions per page)
- A total summary is shown (either at top or bottom):
  - Total questions answered
  - Total correct / total wrong
  - Accuracy percentage
  - Current score
  - Total time played

#### 7. View Stats Command
- User can view a summary dashboard for the active domain:
  - Current score
  - Total questions answered
  - Correct vs. incorrect count and accuracy %
  - Total time played across all sessions
  - Current difficulty level

---

### Out of Scope for MVP

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
- Difficulty manual override by user
- Web UI or any non-terminal interface
- User accounts or cloud sync
- Any feature not listed above

---

### MVP Success Criteria

The MVP is considered successful when:
1. A developer can clone the repo, add their domains to the config file, select one at startup, and answer their first question in under 5 minutes
2. Questions never repeat within a domain across sessions
3. Difficulty visibly adapts — users notice questions getting harder as they improve
4. Score and history persist correctly between sessions and across domain switches
5. Viewing history and stats works reliably with accurate data
6. At least 50% of the team installs and uses it within 30 days
