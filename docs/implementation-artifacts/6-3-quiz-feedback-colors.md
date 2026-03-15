# Story 6.3: Quiz Feedback Colors

Status: done

## Story

As a user,
I want the post-answer feedback panel to use semantic colors — green for correct, red for incorrect, colored speed-tier and difficulty badges — so that I can read my result and score at a glance without parsing text.

## Acceptance Criteria

1. **Given** `screens/quiz.ts` is updated to use the semantic color helpers from Story 6.1
   **When** I answer a question correctly
   **Then** the correct confirmation line is rendered using `colorCorrect()`
   **And** the score delta is rendered using `colorScoreDelta()` (green for positive)

2. **Given** I answer a question incorrectly
   **When** the feedback panel renders
   **Then** the incorrect line (my wrong answer) is rendered using `colorIncorrect()`
   **And** the correct answer reveal is rendered using `colorCorrect()`
   **And** the score delta is rendered using `colorScoreDelta()` (red for negative)

3. **Given** the speed tier is determined after an answer
   **When** the feedback panel renders
   **Then** the speed tier badge is rendered using `colorSpeedTier(tier)` — green/yellow/red

4. **Given** the current difficulty level is shown in the feedback panel
   **When** the panel renders
   **Then** the difficulty label is rendered using `colorDifficultyLevel(level)` — cyan/green/yellow/magenta/red

5. **Given** `screens/quiz.ts` tests are updated
   **When** I run `npm test`
   **Then** all tests pass, covering: correct answer path uses colorCorrect, incorrect path uses colorIncorrect + colorCorrect reveal, score delta uses colorScoreDelta, speed tier uses colorSpeedTier, difficulty uses colorDifficultyLevel

## Tasks / Subtasks

- [x] Update `src/screens/quiz.ts` (AC: 1–4)
  - [x] Import `colorCorrect`, `colorIncorrect`, `colorSpeedTier`, `colorScoreDelta`, `colorDifficultyLevel` from `../utils/format.js`
  - [x] Add `difficultyLevel: number` parameter to `showFeedback()`
  - [x] Replace `success('✓ Correct!')` with `colorCorrect('✓ Correct!')`
  - [x] Replace `errorFmt('✗ Incorrect')` with `colorIncorrect('✗ Incorrect')`
  - [x] Replace `bold(correctText)` reveal with `colorCorrect(bold(correctText))`
  - [x] Replace `formatSpeedTier(speedTier)` with `colorSpeedTier(speedTier)`
  - [x] Replace `formatScoreDelta(scoreDelta)` with `colorScoreDelta(scoreDelta)`
  - [x] Add `Difficulty: ${colorDifficultyLevel(difficultyLevel)}` line to feedback output
  - [x] Pass `record.difficultyLevel` (pre-answer capture) to `showFeedback()` at call site

- [x] Update `src/screens/quiz.test.ts` (AC: 5)
  - [x] Test correct answer feedback contains '✓ Correct!'
  - [x] Test correct answer feedback contains score delta (positive format)
  - [x] Test incorrect feedback contains '✗ Incorrect'
  - [x] Test incorrect feedback contains correct answer reveal
  - [x] Test feedback contains speed tier label
  - [x] Test feedback contains difficulty label (e.g., 'L2')

## Dev Notes

### difficultyLevel threading
- `showFeedback(isCorrect, question, timeTakenMs, speedTier, scoreDelta)` gains a 6th param `difficultyLevel: number`
- Call site uses `record.difficultyLevel` (captured before `domain` is mutated with `updatedMeta`) to show the difficulty of the answered question
- `record.difficultyLevel` stores `domain.meta.difficultyLevel` at question time (before `applyAnswer()`)

### Import cleanup
- `success` and `error as errorFmt` imports from format.js can be removed from quiz.ts once replaced by `colorCorrect`/`colorIncorrect` — but only if they're not used elsewhere in the file

### Files to modify
- `src/screens/quiz.ts` — update showFeedback + call site
- `src/screens/quiz.test.ts` — add / update feedback color tests

## Dev Agent Record

### Implementation Notes
- `showFeedback` gains a 6th param `difficultyLevel: number`; call site passes `record.difficultyLevel` (captured before `domain` is mutated with `updatedMeta`)
- `errorFmt` (the old `error` alias) was also used for AI error messages in `showQuiz`; replaced with `colorIncorrect` for consistency
- `success` and `error as errorFmt` imports fully removed from quiz.ts; no other usages remained
- Feedback line: `Time: X.Xs | Speed: Fast | Difficulty: L2` — difficulty appended on the same line as speed

### Completion Notes
- 25 tests in quiz.test.ts (20 pre-existing + 5 new feedback color tests) — all pass
- Full suite: 369/369 tests passing after review fixes

### Senior Developer Review (AI)
**Outcome:** Changes Requested | **Date:** 2026-03-15
**Action Items:** 3 fixed

- [x] [M2] `history.ts displayEntry` used old `success`/`errorFmt`/`formatSpeedTier`/`formatScoreDelta` and plain `record.difficultyLevel` — updated to use `colorCorrect`/`colorIncorrect`/`colorSpeedTier`/`colorScoreDelta`/`colorDifficultyLevel` for consistency with FR21–FR23
- [x] [M3] `console.error(warn(...))` on writeDomain failure path was semantically wrong — changed to `console.warn(warn(...))` to match intent; write-error test updated to spy on `console.warn`
- [x] [L3] `colorScoreDelta` quiz test regex `/Score:.*[+-]?\d+/` had optional sign — tightened to `/Score:.*[+-]\d+/`

## File List
- src/screens/quiz.ts
- src/screens/quiz.test.ts
- src/screens/history.ts
- src/screens/history.test.ts
- src/utils/format.test.ts

## Change Log
- Updated `src/screens/quiz.ts`: semantic color helpers in showFeedback, added difficultyLevel display, replaced all errorFmt usages (Date: 2026-03-15)
- Updated `src/screens/quiz.test.ts`: added 5 feedback color tests (Date: 2026-03-15)
- Updated `src/screens/history.ts`: displayEntry uses semantic color helpers + colorDifficultyLevel (Date: 2026-03-15, code review fix)
- Fixed `console.error(warn(...))` → `console.warn(warn(...))` in quiz.ts write-error path (Date: 2026-03-15, code review fix)
- Updated `src/screens/quiz.test.ts`: write-error test spy changed to console.warn; colorScoreDelta regex tightened (Date: 2026-03-15, code review fix)
- Fixed `history.test.ts` difficultyLevel assertion: `.toContain('4')` → `.toContain('L4')` to match colorDifficultyLevel output (Date: 2026-03-15, code review fix)
- Added out-of-range `colorDifficultyLevel` test to `format.test.ts` (Date: 2026-03-15, code review fix)
