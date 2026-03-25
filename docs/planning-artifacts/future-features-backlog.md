---
status: draft
date: 2026-03-25
author: George
---

# Future Features Backlog

> **Scope:** Post-MVP feature ideas for `brain-break`. These are not committed — they are candidates for evaluation when the MVP is complete.
>
> **Source:** Brainstorming session with the Analyst agent (2026-03-25), grounded in PRD success criteria and user personas.

---

## Priority: High

### 1. Spaced Repetition Integration

**Description:** Re-surface questions the user previously answered incorrectly at increasing intervals (Leitner-box or SM-2 algorithm). Leverages existing history data (timestamps, correctness, difficulty).

**KPIs targeted:** Score growth rate, Correct answer rate over time

**Complexity:** Medium

---

### 2. Session Summary / Post-Session Report

**Description:** After exiting a quiz, display a compact summary: questions attempted, accuracy %, score delta, difficulty change, fastest/slowest answer. Turns every session into a tangible artifact.

**KPIs targeted:** Session completion rate, Perceived value

**Complexity:** Small

---

### 3. Streak & Achievement Badges

**Description:** Surface achievements based on existing tracked data: "7-day streak", "10 correct in a row", "100 questions in Greek Mythology". Habit formation accelerator.

**KPIs targeted:** 7-day return, Daily sessions per active user

**Complexity:** Small

---

## Priority: Medium

### 4. Cross-Domain Stats / Global Dashboard

**Description:** A "View All Stats" command from the home screen aggregating across all domains — total questions answered, total time played, strongest/weakest domains, global score.

**KPIs targeted:** Domain diversity, Perceived value

**Complexity:** Small

---

### 5. Explanation Drill-Down / "Teach Me More"

**Description:** After "Explain answer," offer a follow-up: "Want to go deeper?" — AI generates a 1-minute micro-lesson on the underlying concept. Extends the quiz into a true learning loop.

**KPIs targeted:** Score growth rate, Knowledge reinforcement

**Complexity:** Small

---

### 6. Question Bookmarking / Favorites

**Description:** Let users flag questions they want to revisit. "Star this question" adds it to a bookmarked list accessible from the domain sub-menu.

**KPIs targeted:** Session completion rate, Knowledge reinforcement

**Complexity:** Small

---

### 7. Difficulty Calibration Insights

**Description:** After 50+ questions, show the user their "calibrated difficulty" — the level where they stabilize. "Your natural level in Java is Advanced (4)." A genuine skill signal.

**KPIs targeted:** Score growth rate, Perceived value

**Complexity:** Small

---

### 8. Challenge Mode / Timed Sprint

**Description:** A mode where the user gets N questions in a fixed time window (e.g., 10 questions in 3 minutes). Adds a competitive edge and a different engagement loop from the default exploratory mode.

**KPIs targeted:** Daily sessions per active user, Questions answered per session

**Complexity:** Medium

---

### 9. Custom Question Banks / Import

**Description:** Allow users to import their own question sets (JSON/CSV) for a domain — useful for students studying specific material. AI-generated questions supplement the user's bank.

**KPIs targeted:** Domain diversity, Adoption

**Complexity:** Medium

---

## Priority: Low

### 10. Local Leaderboard / Multi-Profile

**Description:** A local-only leaderboard supporting multiple profiles on the same machine, or opt-in public leaderboard via GitHub Gist. Drives social engagement.

**KPIs targeted:** Team penetration, Perceived value

**Complexity:** Large

---

### 11. Multiplayer / Head-to-Head Mode

**Description:** Two users on the same network or machine alternate answering questions on the same domain with competitive scoring.

**KPIs targeted:** Team penetration, Adoption

**Complexity:** Large

---

### 12. Weekly Digest / Progress Report

**Description:** A scheduled local report summarizing the user's week: domains touched, scores, streaks, weakest areas. Could optionally send via email with a simple integration.

**KPIs targeted:** 7-day return, Habit formation

**Complexity:** Medium
