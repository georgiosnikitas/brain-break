---
Story: 9.1
Title: Session Summary Display
Status: done
Epic: 9 — Session Summary
Created: 2026-03-29
---

# Story 9.1: Session Summary Display

## Story

As a user,
I want to see a compact summary of my quiz session on the domain sub-menu immediately after finishing a quiz,
So that I get instant feedback on how the session went — score change, accuracy, speed, and difficulty progression — without navigating to a separate screen.

## Acceptance Criteria

- [x] AC1: After completing a quiz session (≥1 answer), a session summary block is displayed between the domain header and the action menu on the first domain sub-menu render
- [x] AC2: The summary shows 8 fields in order using `bold('Label:') + ' value'` format matching the Stats Dashboard:
  1. Score delta — net score change, green (`colorCorrect`) if positive, red (`colorIncorrect`) if negative
  2. Questions answered — count of questions answered in the session
  3. Correct / Incorrect — correct count and incorrect count (e.g., `5 / 2`)
  4. Accuracy — percentage via `formatAccuracy`
  5. Fastest answer — shortest `timeTakenMs` in the session, displayed in green
  6. Slowest answer — longest `timeTakenMs` in the session, displayed in red
  7. Session duration — total time via `formatTotalTimePlayed`
  8. Difficulty — starting → ending with directional indicator (▲ green / ▼ red / — yellow), labels via `colorDifficultyLevel`
- [x] AC3: Summary block is framed by dim horizontal divider lines (e.g., `── Last Session ──────`) rendered using `dim()`
- [x] AC4: Summary is ephemeral — not displayed after navigating to History/Stats/Archive and returning to the domain sub-menu
- [x] AC5: Summary is not displayed when re-entering the domain from the home screen
- [x] AC6: No summary displayed if user exited quiz with 0 answers (Ctrl+C on first question)
- [x] AC7: `showQuiz()` returns session data (list of `QuestionRecord` entries + starting difficulty level) to the caller
- [x] AC8: `showDomainMenuScreen(slug, sessionData?)` accepts optional session data; renders summary on first iteration only; clears it before subsequent iterations
- [x] AC9: `showDomainMenuScreen(slug)` called without session data renders normally (no summary)
- [x] AC10: All existing and new tests pass — covering: summary displayed/not displayed scenarios, all 8 fields with correct values/colors, divider lines, data flow from quiz to domain menu, `formatTotalTimePlayed` and `formatAccuracy` reuse, difficulty indicator coloring

## Tasks / Subtasks

- [x] Task 1: Define `SessionData` interface and update `showQuiz` return path (AC: 6, 7)
  - [x] 1.1 Add `SessionData` type to `src/domain/schema.ts`: `{ records: QuestionRecord[]; startingDifficulty: number }`
  - [x] 1.2 In `src/screens/quiz.ts`, capture `domain.meta.difficultyLevel` before the quiz loop as `startingDifficulty`
  - [x] 1.3 Collect all `QuestionRecord` entries created during the session into a `sessionRecords` array
  - [x] 1.4 Change `showQuiz` return type from `Promise<void>` to `Promise<SessionData | null>` — return `null` when 0 questions answered, return `{ records: sessionRecords, startingDifficulty }` otherwise
  - [x] 1.5 Remove the `await router.showDomainMenu(domainSlug)` calls at exit points — the caller (router/domain-menu) will handle navigation

- [x] Task 2: Update router to pass session data from quiz to domain menu (AC: 7, 8)
  - [x] 2.1 In `src/router.ts`, update `showDomainMenu` signature to accept optional `sessionData?: SessionData`
  - [x] 2.2 Pass `sessionData` through to `showDomainMenuScreen(slug, sessionData)`
  - [x] 2.3 In the call site that invokes `showQuiz` (currently `showSelectDomainScreen` via router), ensure the returned `SessionData` is captured and passed to `showDomainMenu`

- [x] Task 3: Update `showDomainMenuScreen` to accept and render session summary (AC: 1, 2, 3, 4, 5, 8, 9)
  - [x] 3.1 Add optional `sessionData?: SessionData` parameter to `showDomainMenuScreen(slug, sessionData?)`
  - [x] 3.2 On the first loop iteration, if `sessionData` is present and `sessionData.records.length > 0`, call a `renderSessionSummary(sessionData, domain.meta.difficultyLevel)` function after `clearAndBanner()` and the domain header but before the `select()` prompt
  - [x] 3.3 After the first iteration, set `sessionData = undefined` to ensure the summary is not re-rendered on subsequent iterations
  - [x] 3.4 Import `colorCorrect`, `colorIncorrect`, `formatAccuracy` from `../utils/format.js` and `formatTotalTimePlayed`, `difficultyLabel` from `./stats.js`

- [x] Task 4: Implement `renderSessionSummary` function (AC: 2, 3)
  - [x] 4.1 Add `renderSessionSummary(sessionData: SessionData, endingDifficulty: number): void` in `src/screens/domain-menu.ts` (exported for testing)
  - [x] 4.2 Print dim divider line: `dim('── Last Session ──────')`
  - [x] 4.3 Compute and print 8 fields in order
  - [x] 4.4 Print closing dim divider line
  - [x] 4.5 Use `bold('Label:') + ' value'` format for each line (matching Stats Dashboard pattern)

- [x] Task 5: Update navigation flow in `handleDomainAction` (AC: 4, 7)
  - [x] 5.1 Refactored `handleDomainAction` to return `false | SessionData | null` — play action captures and returns `SessionData` from `router.showQuiz`, other actions return `null` (continue) or `false` (exit)
  - [x] 5.2 While loop in `showDomainMenuScreen` checks result and sets `sessionData` for next iteration when quiz returns data

- [x] Task 6: Write / update tests (AC: 10)
  - [x] 6.1 `src/screens/domain-menu.test.ts` — added 10 new tests: renderSessionSummary unit tests (all fields, ▲/▼/— indicators, negative delta) + integration tests (summary displayed/not displayed with sessionData/null/undefined/empty, ephemeral behavior on second iteration, summary after play via router)
  - [x] 6.2 `src/screens/quiz.test.ts` — updated all existing tests: removed router mock, replaced `mockShowDomainMenu` assertions with return value checks (`SessionData | null`)
  - [x] 6.3 `src/router.test.ts` — added test verifying `showDomainMenu` passes sessionData through to `showDomainMenuScreen`
  - [x] 6.4 Unit tested `renderSessionSummary` directly with known inputs verifying all 8 fields and dividers in console output

## Dev Notes

- **Pattern:** Use `bold('Label:') + ' value'` for each summary line — same format as Stats Dashboard (`src/screens/stats.ts` lines 96–118)
- **Ephemeral mechanism:** Set `sessionData = undefined` after the first rendering loop iteration. Do NOT persist session data to disk — it exists only in memory during the showDomainMenuScreen call
- **Data flow:** `showQuiz()` → returns `SessionData | null` → router passes to `showDomainMenuScreen(slug, sessionData)` → rendered once → cleared
- **`showQuiz` currently calls `router.showDomainMenu(domainSlug)` at two exit points** (line 173 when ExitPromptError on first question, line 211 on exit/null action) — these must be removed so quiz returns data instead of navigating
- **`router.showQuiz(slug)` wraps `showSelectDomainScreen(slug)`** — the select-domain screen calls `showQuiz` from `screens/quiz.ts`; the returned session data must bubble up through this chain
- **Circular dependency:** `quiz.ts → router.ts → select-domain.ts → quiz.ts` already exists and is safe (runtime calls only). Adding `SessionData` to the chain does not change this
- **`formatDuration`** from `utils/format.ts` formats milliseconds as `3.2s` — use for fastest/slowest answer
- **`formatTotalTimePlayed`** from `screens/stats.ts` formats milliseconds as `1h 23m 45s` — use for session duration
- **`formatAccuracy`** from `utils/format.ts` formats as `71.4%` — use for accuracy field
- **`difficultyLabel`** from `screens/stats.ts` formats as `3 — Intermediate` — use for difficulty field
- **`colorDifficultyLevel`** from `utils/format.ts` applies level-based chalk color — wrap difficulty labels
- **`colorScoreDelta`** from `utils/format.ts` could be reused for score delta, but the AC specifies `colorCorrect`/`colorIncorrect` — use those instead for consistency with the PRD spec
- **Domain state after quiz:** When the domain menu reads the domain from disk, `domain.meta.difficultyLevel` is the ending difficulty (already updated by `applyAnswer` and persisted during quiz). The starting difficulty comes from `SessionData.startingDifficulty`
- **Test mocking:** Existing domain-menu tests mock `readDomain`, `router`, `select`, `clearAndBanner`. Session summary tests need to verify `console.log` output content — use `vi.spyOn(console, 'log')` pattern already established in stats tests
- **Important:** `select-domain.ts` currently calls `showQuiz()` and does not use the return value. It must be updated to capture and return `SessionData`, or the routing must be restructured so quiz → domain-menu data flow works

### Project Structure Notes

- All source files use ESM with `.js` extensions in imports (NodeNext resolution)
- Tests are co-located: `domain-menu.test.ts` alongside `domain-menu.ts`
- `SessionData` type belongs in `src/domain/schema.ts` alongside other domain types
- No new files created — all changes are modifications to existing files

### References

- [Source: docs/planning-artifacts/prd.md#Feature 14 — Session Summary]
- [Source: docs/planning-artifacts/epics.md#Epic 9, Story 9.1]
- [Source: src/screens/quiz.ts — showQuiz function, lines 143–211]
- [Source: src/screens/domain-menu.ts — showDomainMenuScreen function, lines 32–57]
- [Source: src/screens/domain-menu.ts — handleDomainAction function, lines 60–84]
- [Source: src/screens/stats.ts — formatTotalTimePlayed (line 9), difficultyLabel (line 21), Stats Dashboard render (lines 96–118)]
- [Source: src/utils/format.ts — bold, dim, colorCorrect, colorIncorrect, colorDifficultyLevel, colorScoreDelta, formatDuration, formatAccuracy]
- [Source: src/router.ts — showQuiz wraps showSelectDomainScreen (line 21), showDomainMenu wraps showDomainMenuScreen (line 44)]
- [Source: docs/implementation-artifacts/3-3-interactive-quiz-loop.md — quiz.ts implementation context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- All 699 tests pass across 25 test files — zero regressions
- `SessionData` interface added to `schema.ts` with `records: QuestionRecord[]` and `startingDifficulty: number`
- `showQuiz` return type changed from `Promise<void>` to `Promise<SessionData | null>` — returns null when 0 questions answered (Ctrl+C on first question or generation error), returns SessionData otherwise
- Removed all `router.showDomainMenu()` calls from quiz.ts — quiz no longer navigates directly; the `router` import was removed entirely from quiz.ts
- `showGenerationError` simplified: removed `domainSlug` parameter and `router.showDomainMenu` call; just shows error and returns
- `showSelectDomainScreen` updated to return `SessionData | null` by capturing and returning `showQuiz` result
- `router.showQuiz` updated to return `SessionData | null`; `router.showDomainMenu` accepts optional `sessionData` parameter
- `handleDomainAction` refactored from `Promise<boolean>` to `Promise<false | SessionData | null>` — play action captures returned SessionData, other actions return null (continue) or false (exit)
- `renderSessionSummary` implemented as exported function in domain-menu.ts — prints 8 fields between dim divider lines using `bold('Label:') + ' value'` format matching Stats Dashboard
- Code review fixes applied: the domain header now renders before the session summary, difficulty labels are formatted with `colorDifficultyLevel`, and session duration is computed from the wall-clock span between the first question display and the last answer submission
- Mid-session AI generation failures now return `null` instead of a completed session summary, so only sessions ended via Back produce the ephemeral post-session block
- Session summary ephemeral mechanism: `sessionData = undefined` after first loop iteration in `showDomainMenuScreen`
- Expanded domain-menu and quiz tests now cover header/summary ordering, `colorDifficultyLevel` usage, wall-clock session duration, and the no-summary-on-generation-failure path
- Quiz tests updated: removed router.showDomainMenu mock entirely, all assertions converted to return value checks
- Router test updated: added test verifying sessionData passthrough to showDomainMenuScreen

### File List

- src/domain/schema.ts (modified — added SessionData interface)
- src/screens/quiz.ts (modified — return SessionData | null, removed router import, updated showGenerationError)
- src/screens/select-domain.ts (modified — return SessionData | null from showSelectDomainScreen)
- src/router.ts (modified — updated showQuiz return type, showDomainMenu accepts sessionData)
- src/screens/domain-menu.ts (modified — added renderSessionSummary, updated showDomainMenuScreen signature, refactored handleDomainAction)
- src/screens/quiz.test.ts (modified — removed router mock, updated all assertions to check return values)
- src/screens/domain-menu.test.ts (modified — added 10 session summary tests)
- src/router.test.ts (modified — added sessionData passthrough test)
