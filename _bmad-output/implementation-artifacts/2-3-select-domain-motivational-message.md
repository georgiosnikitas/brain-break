---
Story: 2.3
Title: Select Domain & Motivational Message
Status: done
Epic: 2 — Domain Management
Created: 2026-03-07
---

# Story 2.3: Select Domain & Motivational Message

## Story

As a user,
I want to select an active domain from the home screen and receive a motivational message when I'm on a return visit or upward score trend,
So that I feel acknowledged and encouraged to keep going.

## Acceptance Criteria

- [x] AC1: Selecting a domain reads the domain file via `readDomain()` and proceeds to the quiz screen
- [x] AC2: If `meta.lastSessionAt` is within 7 days of now, a contextual motivational message is displayed
- [x] AC3: If the score delta trend is upward over the last 6+ history entries, a motivational message referencing the trend is displayed
- [x] AC4: If the domain file is corrupted (`readDomain` returns `ok: false`), the warning message is displayed and the domain is reset to `defaultDomainFile()` (written to disk) before proceeding to the quiz

## Tasks / Subtasks

- [x] Task 1: Implement pure helpers in `src/screens/select-domain.ts` (AC: 2, 3)
  - [x] 1.1 Export `isReturningUser(lastSessionAt: string | null): boolean` — true when `lastSessionAt` is non-null and the elapsed time since that ISO string is < 7 days
  - [x] 1.2 Export `isScoreTrendingUp(history: QuestionRecord[]): boolean` — requires `history.length >= 6`; splits the last 6 entries into two halves of 3; returns true when the second half's total `scoreDelta` exceeds the first half's

- [x] Task 2: Implement `showSelectDomainScreen(slug: string): Promise<void>` (AC: 1, 2, 3, 4)
  - [x] 2.1 Call `readDomain(slug)`; if `!result.ok`: print the error message via `warn()`, call `writeDomain(slug, defaultDomainFile())` to reset on disk, set `domain = defaultDomainFile()`
  - [x] 2.2 If `isReturningUser(domain.meta.lastSessionAt)` → print returning-user message via `success()`
  - [x] 2.3 If `isScoreTrendingUp(domain.history)` → print trending message via `success()`
  - [x] 2.4 Call `showQuiz(slug)` from `screens/quiz.js` (the stub)

- [x] Task 3: Wire `router.showQuiz(slug)` (AC: 1)
  - [x] 3.1 Import `showSelectDomainScreen` from `./screens/select-domain.js`
  - [x] 3.2 Replace stub body with `await showSelectDomainScreen(slug)`

- [x] Task 4: Write co-located tests `src/screens/select-domain.test.ts` (AC: 1, 2, 3, 4)
  - [x] 4.1 `isReturningUser(null)` returns false
  - [x] 4.2 `isReturningUser` returns false for lastSessionAt > 7 days ago
  - [x] 4.3 `isReturningUser` returns true for lastSessionAt < 7 days ago
  - [x] 4.4 `isScoreTrendingUp([])` returns false (< 6 entries)
  - [x] 4.5 `isScoreTrendingUp` returns false when second half delta sum ≤ first half
  - [x] 4.6 `isScoreTrendingUp` returns true when second half delta sum > first half
  - [x] 4.7 Screen integration: corrupted domain → warning printed, file reset to default on disk, quiz stub called
  - [x] 4.8 Screen integration: returning user → success message printed
  - [x] 4.9 Screen integration: trending score → success message printed
  - [x] 4.10 Screen integration: fresh domain (no session, no history) → no motivational message

## Dev Notes

- Use `_setDataDir` from `domain/store.ts` to isolate file I/O in tests (same pattern as `store.test.ts` and `create-domain.test.ts`)
- Mock `screens/quiz.js` in tests via `vi.mock` to prevent stub from interfering
- `isScoreTrendingUp` uses last 6 entries only — no need to process the entire history array
- The `QuestionRecord` type is imported from `domain/schema.ts`
- For corruption: `writeDomain` is best-effort here (failure should not prevent proceeding to quiz)

## Dev Agent Record

### Implementation Plan
`isReturningUser` and `isScoreTrendingUp` are pure exported functions for testability. `showSelectDomainScreen` composes them with `readDomain`/`writeDomain` and the quiz stub. `router.showQuiz` delegates to `showSelectDomainScreen`.

### Debug Log
_No issues encountered_

### Completion Notes
All tasks/subtasks complete. 16 tests total. Full suite 247/247 passes. `tsc --noEmit` clean.

Code review findings addressed:
- ✅ Fixed [Medium]: Corrupted-domain test now asserts `showQuiz` was called (AC4 fully covered)
- ✅ Fixed [Medium]: `showQuiz` mock cleared in `beforeEach`; first test uses `toHaveBeenCalledTimes(1)` for isolation
- ✅ Fixed [Low]: Motivational message tests assert message content (`'welcome back'`, `'trending'`)
- ✅ Fixed [Low]: Added boundary test — exactly 7 days returns false (`<` not `<=`)

Code review 2 findings addressed:
- ✅ Fixed [Medium]: Updated suite count from 112 → 247
- ✅ Fixed [Low]: Moved dynamic `import('node:fs/promises')` to top-level import
- ✅ Fixed [Low]: Fresh-domain test now asserts `showQuiz` was called (guards against silent failures)
- ✅ Fixed [Low]: Replaced `getShowQuizMock()` helper with module-level `showQuizMock` variable — single import, no repeated dynamic imports

## File List

- src/screens/select-domain.ts (new)
- src/screens/select-domain.test.ts (new)
- src/router.ts (modified)

## Change Log

- 2026-03-07: Story created and implemented — George
