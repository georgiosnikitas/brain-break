# Story 6.1: Semantic Color Helpers

Status: done

## Story

As a developer,
I want `utils/format.ts` extended with semantic color helper functions for all UI feedback states,
So that every screen can apply consistent, tested color semantics without duplicating chalk logic.

## Acceptance Criteria

1. **Given** `utils/format.ts` is updated
   **When** I call `colorCorrect(text)`
   **Then** it returns the text styled in ANSI green

2. **Given** `utils/format.ts` is updated
   **When** I call `colorIncorrect(text)`
   **Then** it returns the text styled in ANSI red

3. **Given** `utils/format.ts` exports `colorSpeedTier(tier)`
   **When** called with `"fast"`, `"normal"`, or `"slow"`
   **Then** it returns the text in green, yellow, or red respectively

4. **Given** `utils/format.ts` exports `colorDifficultyLevel(level)`
   **When** called with levels 1–5
   **Then** it returns the label styled in: cyan (1), green (2), yellow (3), magenta (4), red (5)

5. **Given** `utils/format.ts` exports `colorScoreDelta(delta)`
   **When** called with a positive number
   **Then** it returns the formatted delta string in green
   **When** called with a negative number
   **Then** it returns the formatted delta string in red

6. **Given** co-located tests exist in `utils/format.test.ts`
   **When** I run `npm test`
   **Then** all new color helper tests pass for all branches

## Tasks / Subtasks

- [x] Extend `src/utils/format.ts` with semantic color helpers (AC: 1–5)
  - [x] Add `colorCorrect(text: string): string` → `chalk.green(text)`
  - [x] Add `colorIncorrect(text: string): string` → `chalk.red(text)`
  - [x] Add `colorSpeedTier(tier: SpeedTier): string` → green/yellow/red with capitalized label
  - [x] Add `colorDifficultyLevel(level: number): string` → "L{n}" styled cyan/green/yellow/magenta/red
  - [x] Add `colorScoreDelta(delta: number): string` → `"+N"` in green or `"-N"` in red

- [x] Add tests to `src/utils/format.test.ts` (AC: 6)
  - [x] `colorCorrect` returns string containing input text
  - [x] `colorIncorrect` returns string containing input text
  - [x] `colorSpeedTier('fast')` contains 'Fast'
  - [x] `colorSpeedTier('normal')` contains 'Normal'
  - [x] `colorSpeedTier('slow')` contains 'Slow'
  - [x] `colorDifficultyLevel(1)` contains 'L1'
  - [x] `colorDifficultyLevel(2)` contains 'L2'
  - [x] `colorDifficultyLevel(3)` contains 'L3'
  - [x] `colorDifficultyLevel(4)` contains 'L4'
  - [x] `colorDifficultyLevel(5)` contains 'L5'
  - [x] `colorScoreDelta(20)` contains '+20'
  - [x] `colorScoreDelta(-15)` contains '-15'
  - [x] `colorScoreDelta(0)` contains '+0'

## Dev Notes

### Color semantics
- `colorCorrect` / `colorIncorrect`: canonical correct/incorrect feedback colors (green/red); semantic counterparts to existing `success`/`error` wrappers
- `colorSpeedTier`: capitalizes tier name (Fast/Normal/Slow) and applies green/yellow/red
- `colorDifficultyLevel`: renders "L1"–"L5" labels in cyan/green/yellow/magenta/red respectively
- `colorScoreDelta`: formats positive as `"+N"` in green, negative as `"-N"` in red; zero → `"+0"` in green

### Files to modify
- `src/utils/format.ts` — add five new exports
- `src/utils/format.test.ts` — add tests for all five new exports

## Dev Agent Record

### Implementation Notes
- `colorCorrect`/`colorIncorrect` are clean semantic aliases for `success`/`error`; both use chalk.green/red respectively
- `colorSpeedTier` mirrors `formatSpeedTier` (capitalizes label + adds color) but under a semantically clearer name
- `colorDifficultyLevel(level)` renders `L1`–`L5` labels; levels outside 1–5 fall back to `L{n}` (no color) as a safe default
- `colorScoreDelta` is identical behavior to `formatScoreDelta`; exported under semantic name for story 6.3 usage
- `menuTheme` also added to `format.ts` in this same edit for story 6.2 colocation

### Completion Notes
- 36 tests in format.test.ts (23 pre-existing + 13 new color helper tests) — all pass
- Full suite: 369/369 tests passing

## File List
- src/utils/format.ts
- src/utils/format.test.ts

## Change Log
- Added `colorCorrect`, `colorIncorrect`, `colorSpeedTier`, `colorDifficultyLevel`, `colorScoreDelta`, `menuTheme` to `src/utils/format.ts` (Date: 2026-03-15)
- Added 13 new color helper tests to `src/utils/format.test.ts` (Date: 2026-03-15)
- Removed dead `formatSpeedTier` and `formatScoreDelta` from `src/utils/format.ts`; removed 6 corresponding tests from `src/utils/format.test.ts` (Date: 2026-03-15, code review fix)
