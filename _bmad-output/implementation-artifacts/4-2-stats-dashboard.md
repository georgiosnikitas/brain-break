---
Story: 4.2
Title: Stats Dashboard
Status: done
Epic: 4 — Learning Insights
Created: 2026-03-12
---

# Story 4.2: Stats Dashboard

## Story

As a user,
I want to view a stats dashboard for the active domain showing my score, accuracy, time played, difficulty level, score trend, and return streak,
So that I have a clear, motivating picture of my progress and know whether my skills are genuinely growing.

## Acceptance Criteria

- [x] AC1: Selecting "View Stats [slug]" from the home screen loads `screens/stats.ts` and displays all required fields: current score, total questions answered, correct/incorrect count + accuracy %, total time played (h/m/s), difficulty level (number + label), score trend over last 30 days, days since first session, and current return streak
- [x] AC2: Domain has no history entries → dashboard shows score (0), totals (0), and "No data yet" for all derived fields
- [x] AC3: Selecting "Back" returns to the home screen via `router.showHome()`

## Tasks / Subtasks

- [x] Task 1: Implement pure helper functions in `screens/stats.ts` (AC: 1, 2)
  - [x] 1.1 Export `formatTotalTimePlayed(ms: number): string` — converts ms to `Xh Ym Zs` (omits hours/minutes if zero)
  - [x] 1.2 Export `difficultyLabel(level: number): string` — maps 1–5 to "1 — Beginner" … "5 — Expert"
  - [x] 1.3 Export `computeScoreTrend(history, nowMs?): 'growing' | 'flat' | 'declining'` — sums scoreDelta for entries within last 30 days
  - [x] 1.4 Export `daysSinceFirstSession(history, nowMs?): number | null` — floor days from earliest answeredAt to now; null for empty history
  - [x] 1.5 Export `computeReturnStreak(history): number` — unique dates sorted descending, counts consecutive 1-day gaps from the most recent date

- [x] Task 2: Implement `showStats(domainSlug: string): Promise<void>` in `screens/stats.ts` (AC: 1, 2, 3)
  - [x] 2.1 Import `select` from `@inquirer/prompts`, `ExitPromptError` from `@inquirer/core`, `readDomain` from `domain/store.js`, `defaultDomainFile`, `QuestionRecord` from `domain/schema.js`, format helpers, and `router`
  - [x] 2.2 Read domain via `readDomain()`; warn and fall back to `defaultDomainFile()` if read fails
  - [x] 2.3 Empty history path: display score + "No data yet" for all derived fields
  - [x] 2.4 Non-empty history path: display all 9 stats fields with computed values
  - [x] 2.5 Show "Back" select prompt; handle `ExitPromptError`; call `router.showHome()` in all exit paths

- [x] Task 3: Update `home.ts` to support "View Stats" navigation (AC: 1)
  - [x] 3.1 Add `{ action: 'stats'; slug: string }` to `HomeAction` union
  - [x] 3.2 Add "View Stats [slug]" choice per domain in `buildHomeChoices()` — after "View History"
  - [x] 3.3 Wire `answer.action === 'stats'` → `router.showStats(answer.slug)` in `showHomeScreen()`

- [x] Task 4: Wire `router.ts` (AC: 1)
  - [x] 4.1 Import `showStats as showStatsScreen` from `./screens/stats.js`
  - [x] 4.2 Replace stub `router.showStats()` with `await showStatsScreen(slug)`

- [x] Task 5: Write `screens/stats.test.ts` (AC: 1–3)
  - [x] 5.1 Mock `@inquirer/prompts`, `@inquirer/core`, `../domain/store.js`, `../router.js`
  - [x] 5.2 Test `formatTotalTimePlayed`: 0ms, seconds-only, minutes, hours+minutes+seconds
  - [x] 5.3 Test `difficultyLabel`: all 5 levels
  - [x] 5.4 Test `computeScoreTrend`: empty, no recent entries, growing, declining, flat, only-recent entries considered
  - [x] 5.5 Test `daysSinceFirstSession`: null for empty, 0 for today, correct count for past date
  - [x] 5.6 Test `computeReturnStreak`: empty, single day, consecutive days, gap breaks streak, multiple records same day count as one
  - [x] 5.7 Test `showStats` empty history: "No data yet" logged, score 0 shown, `router.showHome` called
  - [x] 5.8 Test `showStats` with history: correct/incorrect counts, accuracy %, formatted time, difficulty label, streak suffix
  - [x] 5.9 Test Back navigation: `router.showHome` called
  - [x] 5.10 Test ExitPromptError: `router.showHome` called
  - [x] 5.11 Test corrupted domain: warning logged, empty stats shown

- [x] Task 6: Update `home.test.ts` (AC: 1)
  - [x] 6.1 Add `showStats: vi.fn()` to the `../router.js` mock
  - [x] 6.2 Add test: `buildHomeChoices` includes a stats action per domain
  - [x] 6.3 Add test: stats action comes after history for the same domain
  - [x] 6.4 Add test: `showHomeScreen` calls `router.showStats` with the correct slug

## Dev Notes

- `computeReturnStreak` uses `answeredAt.slice(0, 10)` to extract `YYYY-MM-DD` date strings — timezone-consistent since timestamps are stored in ISO 8601 UTC
- `computeScoreTrend` accepts optional `nowMs` parameter (defaults to `Date.now()`) for deterministic testing
- `daysSinceFirstSession` accepts optional `nowMs` parameter for deterministic testing
- Score trend label mapping: `'growing'` → `'Growing 📈'`, `'flat'` → `'Flat ➡️'`, `'declining'` → `'Declining 📉'`
- Streak plural: `"1 day"` / `"N days"`

## File List

- `src/screens/stats.ts` — implemented (was stub)
- `src/screens/stats.test.ts` — created (32 tests)
- `src/screens/home.ts` — updated (HomeAction union, buildHomeChoices, showHomeScreen)
- `src/screens/home.test.ts` — updated (router mock + 3 new tests)
- `src/router.ts` — updated (import + showStats wired)

## Dev Agent Record

### Completion Notes
- All 243 tests pass across 16 test files (32 new in stats.test.ts, 3 new in home.test.ts)
- Full suite was 211 tests before this story; net addition: 32 tests
- All AC covered; no raw throws in screens; corrupted domain falls back to `defaultDomainFile()` per project error-handling pattern

### Code Review Fixes (post-review)
- **M1** — Added `showStats — with history` integration tests for score trend label ("Growing 📈") and days-since-first-session field
- **M2** — Removed unreachable `?? 'N/A'` fallback in the `total > 0` branch; replaced with non-null assertion `daySinceFirst!`
- **L1** — Strengthened `'shows score 0'` test: now finds the Score log call specifically and asserts `' 0'` in that line
- **L2** — Added `formatTotalTimePlayed(3_603_000)` test covering hours-with-zero-minutes edge case (`'1h 0m 3s'`)
- **L3** — `computeReturnStreak` now accepts `nowMs` param (default `Date.now()`) and returns `0` when the most recent play was more than 1 day ago (stale streak); all streak tests updated to pass deterministic `nowMs`; stale-streak test added

Full suite after fixes: 247/247 tests across 16 files.
