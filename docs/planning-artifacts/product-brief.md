---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments: []
date: 2026-03-01
author: George
lastEdited: '2026-03-25'
editHistory:
  - date: '2026-03-25'
    changes: 'MVP Feature Summary updated from 10 to 12 core capabilities: added Welcome Screen (branded splash with gradient ASCII art, tagline, version — controllable via showWelcome setting) and Static Banner (persistent 🧠🔨 Brain Break header + gradient shadow bar on every screen except Welcome/Provider Setup). Aligns with PRD Features 11 and 12, Epic 8, and FR31–FR34.'
  - date: '2026-03-25'
    changes: 'MVP Feature Summary: View stats command updated to include starting difficulty level alongside current difficulty. Reflects GitHub issue #46.'
  - date: '2026-03-25'
    changes: 'Out of Scope: removed "Manual difficulty override by the user" — issue #46 adds starting-difficulty selection at domain creation.'
  - date: '2026-03-25'
    changes: 'MVP Feature Summary: "Interactive terminal quiz" bullet updated to include post-answer AI explanation option. Reflects GitHub issue #48 (FR35).'
  - date: '2026-03-28'
    changes: 'MVP Feature Summary updated from 12 to 13 core capabilities: added Explanation Drill-Down ("Teach me more" follow-up after AI explanation in both quiz and history contexts — AI generates a micro-lesson on the underlying concept). Aligns with PRD Feature 13.'
---

# Product Brief: brain-break

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes on any topic you define. It generates contextually relevant, never-repeating questions across any domain — from `java-programming` to `greek-mythology` to `thai-cuisine` — turning idle break time into a measurable, honest knowledge signal. Users choose their AI provider: GitHub Copilot SDK, OpenAI, Anthropic, Google Gemini, or a local Ollama instance. It lives where terminal users already work: the CLI. No accounts. No setup friction. Clone, pick your provider, and run.

---

## Core Vision

### Problem Statement

Curious people want to stay sharp across a wide variety of topics, but existing learning tools demand long, structured time commitments (30–60 minute video courses, structured curricula) that are incompatible with the short, unplanned breaks that naturally occur during a day.

### Problem Impact

- Knowledge gaps compound silently when no lightweight reinforcement mechanism exists
- People either over-commit to heavy learning platforms they don't finish, or do nothing during natural break windows
- There is no low-friction, open-ended tool that lets a user define *any* topic and start receiving intelligent quiz questions instantly

### Why Existing Solutions Fall Short

**Udemy** and similar platforms are rich but heavyweight: video-centric, requiring 30+ minute sessions, category-constrained, and wholly inappropriate for a 5-minute break.

Flashcard apps (e.g., Anki) require manual content creation, are limited to what the user already knows to write down, and lack AI-driven question generation.

No existing CLI-first tool combines AI question generation, user-defined open-ended domains, duplicate prevention, and honest skill tracking in a single, zero-friction package.

### Proposed Solution

`brain-break` is a terminal CLI tool that:
- On every launch, displays a home screen listing all configured domains with their current score and progress; if no domains exist, the only available action is to create a new one
- Allows the user to resume an existing domain or add a new one from the home screen at any time; domains can be anything — `algebra-second-degree-polynomial-equations`, `english-grammar`, `greek-mythology`, `music-90s-hits`, `thai-cuisine`, or `java-programming`
- Supports 5 AI providers (GitHub Copilot SDK, OpenAI, Anthropic, Google Gemini, Ollama) to generate fresh, non-repeating multiple-choice questions on demand for any domain
- Presents questions interactively in the terminal with a response timer
- Scores answers based on correctness and response speed — producing an honest, evolving knowledge signal
- Persists a full history of questions, answers, timestamps, durations, and scores locally — reviewable at any point alongside total score and total time played

### Key Differentiators

| Factor | brain-break | Udemy / Video Platforms | Flashcard Apps |
|---|---|---|---|
| Session length | 2–10 minutes | 30–60+ minutes | Variable |
| Terminal-native | ✅ | ❌ | ❌ |
| Any user-defined domain | ✅ | ❌ (fixed catalogue) | ✅ (manual) |
| AI-generated questions | ✅ (5 providers) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| In-app domain management | ✅ | ❌ | ❌ |
| Honest skill signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / shareable | ✅ | ❌ | Partial |

---

## Target Users

`brain-break` targets anyone with daily terminal use and access to at least one supported AI provider who wants short, purposeful learning sessions on topics they care about. The tool fits developers staying sharp on evolving APIs, students reinforcing coursework between study sessions, hobbyists testing trivia knowledge, or anyone who prefers self-directed, low-friction learning over structured platforms.

`brain-break` is a purely self-serve individual tool — no admin, team management, or oversight roles required.

---

## Success Metrics

### User Success Metrics

The primary signal that `brain-break` is working is **behavioral and self-reported improvement** — users who return daily and whose score progression correlates with real-world confidence and competence.

| Metric | Target | Signal |
|---|---|---|
| Daily active usage | ≥ 1 session per day per active user | Tool has become a genuine habit |
| Score progression | Consistent upward trend over 2–4 weeks | Learning is happening, not just playing |
| Session completion rate | ≥ 80% of started sessions completed | Questions are engaging and appropriately challenging |
| Return rate (Day 7) | ≥ 60% of users who try it return within a week | First impression converts to habit |
| Domain diversity | Users configure ≥ 2 different domains over lifetime | Drives curiosity across topics |

**The ultimate user success indicator:** A user saying — or demonstrating — *"I know this topic better than I did before."*

---

### Business Objectives

Since `brain-break` is an open-source tool (not a commercial product), success is measured in adoption depth and genuine utility — not revenue.

1. **Adoption:** Users install and actively use brain-break within 30 days of discovering it
2. **Habit formation:** Active users engage daily rather than sporadically — the tool earns a permanent place in their routine
3. **Perceived value:** Users voluntarily recommend the tool to others (organic spread)
4. **Knowledge reinforcement:** Users report that their knowledge in configured domains feels sharper and more confident over time

---

## MVP Feature Summary

The MVP delivers thirteen core capabilities:

- **In-app domain management** — create, resume, archive, and delete domains from a two-level navigation (home screen + domain sub-menu); all state is domain-scoped and persists across sessions
- **AI-powered question generation (multi-provider)** — on-demand, never-repeating multiple-choice questions via the user's configured AI provider (GitHub Copilot SDK, OpenAI, Anthropic, Google Gemini, or Ollama), with adaptive difficulty based on consecutive answer streaks
- **Interactive terminal quiz** — one question at a time, per-question response timer, immediate correctness feedback with score delta, an on-demand "Explain answer" option that asks the AI to explain why the correct answer is right, and a "Teach me more" follow-up that generates a micro-lesson on the underlying concept
- **Speed-weighted scoring** — a cumulative, per-domain score that rewards fast correct answers and compounds penalties for slow incorrect ones; never resets
- **Persistent question history** — every answered question stored locally with full detail (answer, timing, score delta, difficulty) per domain
- **View history command** — single-question navigation with progress indicator for all past questions in the active domain
- **View stats command** — summary dashboard showing score, accuracy, total time played, starting difficulty, current difficulty level, score trend, and return streak
- **Global settings** — configurable AI provider, question language (free-text), and tone of voice; settings are global across all domains and persist between sessions
- **Terminal UI highlighting & color system** — full-row menu highlight, semantic post-answer colors, speed tier badge colors, and difficulty level badge colors
- **Coffee supporter screen** — dedicated screen with ASCII QR code linking to the creator's Buy Me a Coffee page
- **Welcome screen** — on launch (when enabled), a branded splash screen displays gradient-colored ASCII art, a styled subtitle, and the app version — dismissible with Enter; controllable via a `showWelcome` setting (default: on)
- **Static banner** — every screen (except Welcome and Provider Setup) renders a persistent `🧠🔨 Brain Break` header with a cyan-to-magenta gradient shadow bar at the top of the terminal
- **Explanation drill-down** — after viewing an AI-generated explanation (in both quiz and history), a "Teach me more" option calls the AI to generate a concise micro-lesson on the underlying concept, extending the quiz into a true learning loop

→ Full feature specifications and acceptance criteria: [prd.md](prd.md)

---

## Out of Scope for MVP

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
- Web UI or any non-terminal interface
- User accounts or cloud sync
- Any feature not listed in this document
