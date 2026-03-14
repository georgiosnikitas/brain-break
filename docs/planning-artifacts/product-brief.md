---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments: []
date: 2026-03-01
author: George
---

# Product Brief: brain-break

## Executive Summary

`brain-break` is a Node.js terminal application that delivers AI-powered, multiple-choice knowledge quizzes on any topic you define. Powered by the GitHub Copilot SDK, it generates contextually relevant, never-repeating questions across any domain — from `java-programming` to `greek-mythology` to `thai-cuisine` — turning idle break time into a measurable, honest knowledge signal. It lives where terminal users already work: the CLI.

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

No existing CLI-first tool combines AI question generation, user-defined open-ended domains, duplicate prevention, and honest skill tracking in a single, publishable open-source package.

### Proposed Solution

`brain-break` is a terminal CLI tool that:
- On every launch, displays a home screen listing all configured domains with their current score and progress; if no domains exist, the only available action is to create a new one
- Allows the user to resume an existing domain or add a new one from the home screen at any time; domains can be anything — `algebra-second-degree-polynomial-equations`, `english-grammar`, `greek-mythology`, `music-90s-hits`, `thai-cuisine`, or `java-programming`
- Uses the GitHub Copilot SDK to generate fresh, non-repeating multiple-choice questions on demand for any domain
- Presents questions interactively in the terminal with a response timer
- Scores answers based on correctness and response speed — producing an honest, evolving knowledge signal
- Persists a full history of questions, answers, timestamps, durations, and scores locally — reviewable at any point alongside total score and total time played

### Key Differentiators

| Factor | brain-break | Udemy / Video Platforms | Flashcard Apps |
|---|---|---|---|
| Session length | 2–10 minutes | 30–60+ minutes | Variable |
| Terminal-native | ✅ | ❌ | ❌ |
| Any user-defined domain | ✅ | ❌ (fixed catalogue) | ✅ (manual) |
| AI-generated questions | ✅ (Copilot SDK) | ❌ | ❌ |
| Never repeats questions | ✅ | N/A | ❌ |
| In-app domain management | ✅ | ❌ | ❌ |
| Honest skill signal scoring | ✅ | ❌ (completion %) | ❌ |
| Zero setup friction | ✅ | ❌ | ❌ |
| Open source / shareable | ✅ | ❌ | Partial |

---

## Target Users

Anyone curious enough to define a topic and answer questions about it. The tool fits developers staying sharp on evolving APIs, students reinforcing coursework between study sessions, hobbyists testing trivia knowledge, or anyone who prefers self-directed, low-friction learning over structured platforms. The common thread is daily terminal use and a preference for short, purposeful sessions.

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

The MVP delivers seven core capabilities:

- **In-app domain management** — create, resume, and archive domains from a home screen; all state is domain-scoped and persists across sessions
- **AI-powered question generation** — on-demand, never-repeating multiple-choice questions via the GitHub Copilot SDK, with adaptive difficulty based on the previous answer
- **Interactive terminal quiz** — one question at a time, per-question response timer, and immediate correctness feedback with score delta
- **Speed-weighted scoring** — a cumulative, per-domain score that rewards fast correct answers and compounds penalties for slow incorrect ones; never resets
- **Persistent question history** — every answered question stored locally with full detail (answer, timing, score delta, difficulty) per domain
- **View history command** — paginated review of all past questions for the active domain
- **View stats command** — summary dashboard showing score, accuracy, total time played, and current difficulty level

→ Full feature specifications and acceptance criteria: [prd.md](prd.md)

---

## Out of Scope for MVP

- Multiple simultaneous domains in a single session
- Score or history reset
- Leaderboards or team comparison features
- Difficulty manual override by user
- Web UI or any non-terminal interface
- User accounts or cloud sync
- Any feature not listed above
