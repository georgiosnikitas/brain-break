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
- On every launch, displays a home screen listing all configured domains with their current score and progress; if no domains exist, the only available action is to create a new one
- Allows the user to resume an existing domain or add a new one from the home screen at any time
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
| In-app domain management | ✅ | ❌ | ❌ |
| Honest skill signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / team-shareable | ✅ | ❌ | Partial |

---

## Target Users

Three developer personas share this tool: junior developers building foundational confidence, mid-level developers filling knowledge gaps across their stack, and senior developers staying sharp on evolving APIs and adjacent domains. All have daily terminal use and prefer self-directed, low-friction learning over structured platforms.

`brain-break` is a purely self-serve individual tool — no admin, team management, or oversight roles required.

→ Full persona profiles and user journey: [prd-brain-break-2026-03-06.md](prd-brain-break-2026-03-06.md)

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

## MVP Feature Summary

The MVP delivers seven core capabilities:

- **In-app domain management** — create, resume, and archive domains from a home screen; all state is domain-scoped and persists across sessions
- **AI-powered question generation** — on-demand, never-repeating multiple-choice questions via the GitHub Copilot SDK, with adaptive difficulty based on the previous answer
- **Interactive terminal quiz** — one question at a time, per-question response timer, and immediate correctness feedback with score delta
- **Speed-weighted scoring** — a cumulative, per-domain score that rewards fast correct answers and compounds penalties for slow incorrect ones; never resets
- **Persistent question history** — every answered question stored locally with full detail (answer, timing, score delta, difficulty) per domain
- **View history command** — paginated review of all past questions for the active domain
- **View stats command** — summary dashboard showing score, accuracy, total time played, and current difficulty level

→ Full feature specifications and acceptance criteria: [prd-brain-break-2026-03-06.md](prd-brain-break-2026-03-06.md)

---

## Out of Scope for MVP

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
- Difficulty manual override by user
- Web UI or any non-terminal interface
- User accounts or cloud sync
- Any feature not listed above
