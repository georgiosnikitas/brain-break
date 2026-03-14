---
Story: 4.1
Title: Paginated Question History View
Status: done
Epic: 4 — Learning Insights
Created: 2026-03-12
---

# Story 4.1: Paginated Question History View

## Story

As a user,
I want to view my full question history for the active domain — paginated at 10 entries per page — with all recorded fields visible,
So that I can review past questions, see where I went wrong, and track my learning in detail.

## Acceptance Criteria

- [x] AC1: Selecting "View History [slug]" from the home screen loads `screens/history.ts`, reads the domain file, and displays history 10 entries per page (most recent first); each entry shows: question text, all 4 options, my chosen answer, the correct answer, whether I was correct, timestamp (formatted), time taken (ms), speed tier, score delta, and difficulty level
- [x] AC2: Domain has more than 10 history entries → pagination controls are shown (Next / Previous / Back) and navigate correctly between pages
- [x] AC3: Domain has 10 or fewer history entries → all entries shown on a single page with no Next/Previous controls, only a "Back" option
- [x] AC4: Domain has no history entries → a message "No questions answered yet" is shown and a "Back" option returns to the home screen
- [x] AC5: Selecting "Back" returns to the home screen via `router.showHome()`

## Tasks / Subtasks

- [x] Task 1: Update `screens/home.ts` and `router.ts` to support "View History" navigation (AC: 1, 5)
  - [x] 1.1 Add `{ action: 'history'; slug: string }` to `HomeAction` union in `screens/home.ts`
  - [x] 1.2 Add "View History [slug]" choice per domain in `buildHomeChoices()` (after the Archive choice)
  - [x] 1.3 Wire `answer.action === 'history'` → `router.showHistory(answer.slug)` in `showHomeScreen()`
  - [x] 1.4 Update `router.showHistory()` stub to call `showHistory()` from `screens/history.ts`

- [x] Task 2: Implement `screens/history.ts` (AC: 1–5)
  - [x] 2.1 Import `select` from `@inquirer/prompts`, `ExitPromptError` from `@inquirer/core`, `readDomain` from `domain/store.js`, `defaultDomainFile`, `QuestionRecord` from `domain/schema.js`, format helpers, and `router`
  - [x] 2.2 Export `PAGE_SIZE = 10` constant
  - [x] 2.3 Export `formatTimestamp(iso: string): string` — formats ISO string as locale date/time string
  - [x] 2.4 Export `buildPageChoices(page: number, totalPages: number)` — returns nav choices array (Next/Previous/Back as appropriate; `hasEntries` param dropped — not needed since empty history is handled before reaching pagination)
  - [x] 2.5 Export `showHistory(domainSlug: string): Promise<void>`; read domain with `readDomain()`; warn and use `defaultDomainFile()` if read fails
  - [x] 2.6 Handle empty history: display "No questions answered yet" message, show "Back" select prompt, call `router.showHome()` and return
  - [x] 2.7 Reverse history array for most-recent-first display; compute `totalPages = Math.ceil(history.length / PAGE_SIZE)`; loop with `page = 0`
  - [x] 2.8 Per page: `console.log` each entry with all required fields (question, options A-D, user answer, correct answer, isCorrect, formatted timestamp, timeTakenMs, speed tier, score delta, difficulty level)
  - [x] 2.9 Build nav choices: include "Next" if more pages ahead, "Previous" if not on first page, always "Back"
  - [x] 2.10 Single page (≤ PAGE_SIZE entries): show only "Back" with no Next/Previous
  - [x] 2.11 Wrap `select()` in try/catch for `ExitPromptError` → `router.showHome()` + return
  - [x] 2.12 "Back" → `router.showHome()` + return; "Next" → `page++`; "Previous" → `page--`

- [x] Task 3: Write `screens/history.test.ts` (AC: 1–5)
  - [x] 3.1 Mock `@inquirer/prompts`, `@inquirer/core`, `../domain/store.js`, `../router.js`
  - [x] 3.2 Test empty history: "No questions answered yet" logged, `router.showHome` called once, `select` shows only "Back"
  - [x] 3.3 Test single-page history (≤ 10 entries): all entries logged, select shows only "Back"
  - [x] 3.4 Test single-page history: selecting "Back" calls `router.showHome`
  - [x] 3.5 Test multi-page history (> 10 entries): first page shows only "Next" + "Back" (no "Previous")
  - [x] 3.6 Test last page of multi-page history: only "Previous" + "Back" (no "Next")
  - [x] 3.7 Test "Next" increments page; "Previous" decrements page
  - [x] 3.8 Test each history entry log contains question text, user answer, correct answer, isCorrect, timestamp, speed tier, score delta, difficulty level
  - [x] 3.9 Test corrupted domain read: warning logged, history is empty, "No questions answered yet" shown
  - [x] 3.10 Test `ExitPromptError` during select → `router.showHome` called

## Dev Notes

- History displayed most-recent-first: `[...domain.history].reverse()` — do NOT mutate the original array
- `PAGE_SIZE = 10` exported constant; used in both implementation and tests
- `formatTimestamp`: `new Date(iso).toLocaleString()` is sufficient
- Each history entry is displayed as a block of `console.log` calls (not as select choices), then navigation uses a `select()` prompt
- Pattern: same circular-dependency and import patterns as `archived.ts`/`quiz.ts`
- `ExitPromptError` must be caught from `@inquirer/core`
- `router.showHistory` in `router.ts` must import `showHistory` from `./screens/history.js`

## Dev Agent Record

### Implementation Plan
Task 1 (wiring) → Task 2 (implementation) → Task 3 (tests) → run full suite.

### Completion Notes
- All 19 tests in `src/screens/history.test.ts` pass; full suite: 208/208 tests across 15 files
- `buildPageChoices` exported for direct unit testing; `PAGE_SIZE = 10` and `formatTimestamp` also exported
- History reversed with `[...domain.history].reverse()` — original array not mutated
- `ExitPromptError` caught in both the multi-entry navigation loop and the empty-history single-select path
- Corrupted domain read: warns and falls back to `defaultDomainFile()`, resulting in empty history path
- `home.ts` extended with `{ action: 'history'; slug: string }` — existing tests all still pass
- `router.ts` now imports `showHistory` from `./screens/history.js`
- TypeScript strict mode passes with zero errors

### Code Review Fixes Applied
- **H1 fixed**: Added 2 tests to `describe('buildHomeChoices')` in `home.test.ts` — `'includes a history action for each domain entry'` and `'history action comes after archive for the same domain'`
- **M1 fixed**: Added `describe('showHomeScreen — routing')` block in `home.test.ts` with integration test verifying `router.showHistory` is called with the correct slug when the history action is selected
- **M2 fixed**: `pageSize: 15` → `pageSize: 20` in `showHomeScreen()` — each domain now emits 3 choices so 15 would clip domains off the visible list
- **L2 fixed**: Replaced `expect(allLogs).toContain('B')` / `toContain('C')` with `toContain('Your answer:')` / `toContain('Correct:')` — letter-only assertions were too generic and would match option text, not answer context
- Final suite: 211/211 tests across 15 files

## File List

- src/screens/history.ts (modified — full implementation replacing stub)
- src/screens/history.test.ts (created)
- src/screens/home.ts (modified — added history action type + choice + handler + pageSize bump)
- src/router.ts (modified — wired showHistory to screens/history.ts)
- src/screens/home.test.ts (modified — added mocks, beforeEach, and history action tests)
