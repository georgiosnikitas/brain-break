---
Story: 3.2
Title: Scoring & Difficulty Progression Logic
Status: complete
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-12
---

# Story 3.2: Scoring & Difficulty Progression Logic

## Story

As a developer,
I want `domain/scoring.ts` to implement the `applyAnswer()` pure function that computes score delta and updates difficulty/streak state,
So that all score and difficulty mutations happen in one tested, side-effect-free place.

## Acceptance Criteria

- [x] AC1: `applyAnswer(meta, isCorrect, timeTakenMs, speedThresholds)` returns `{ updatedMeta: DomainMeta, scoreDelta: number }` without mutating the input
- [x] AC2: Correct + fast at L3 → scoreDelta = 60, score updated
- [x] AC3: Incorrect + slow at L3 → scoreDelta = -60, score updated
- [x] AC4: 3rd consecutive correct at L3 → difficultyLevel becomes 4
- [x] AC5: 3rd consecutive incorrect at L2 → difficultyLevel becomes 1
- [x] AC6: Correct after wrong streak (or vice versa) → streakCount resets to 1, streakType flips
- [x] AC7: All 6 speed×outcome combinations tested, streak transitions tested, difficulty boundary clamping tested

## Tasks / Subtasks

- [x] Task 1: Implement `domain/scoring.ts` (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 Export `SpeedThresholds` interface `{ fastMs: number; slowMs: number }`
  - [x] 1.2 Export `ApplyAnswerResult` interface `{ updatedMeta: DomainMeta; scoreDelta: number; speedTier: SpeedTier }`
  - [x] 1.3 Export `getSpeedTier(timeTakenMs, speedThresholds): SpeedTier`
  - [x] 1.4 Implement base-points lookup: L1=10, L2=20, L3=30, L4=40, L5=50
  - [x] 1.5 Implement speed-multiplier logic per outcome×tier combination
  - [x] 1.6 Implement streak update: same type increments, different type resets to 1
  - [x] 1.7 Implement difficulty update: streakCount reaches 3 → level ±1 (clamped 1–5), streakCount resets to 0
  - [x] 1.8 Return immutable result (spread input meta, update fields, do not mutate input)

- [x] Task 2: Write `domain/scoring.test.ts` (AC: 7)
  - [x] 2.1 Test all 6 speed×outcome combos for scoreDelta and score update
  - [x] 2.2 Test streak transitions (correct → reset on incorrect, incorrect → reset on correct)
  - [x] 2.3 Test difficulty increases to 4 after 3rd correct at L3
  - [x] 2.4 Test difficulty clamps at 5 (no overflow beyond max)
  - [x] 2.5 Test difficulty decreases to 1 after 3rd incorrect at L2
  - [x] 2.6 Test difficulty clamps at 1 (no underflow below min)
  - [x] 2.7 Test streakCount resets to 0 after difficulty change
  - [x] 2.8 Test totalTimePlayedMs accumulates
  - [x] 2.9 Test input meta is not mutated

## Dev Notes

- Base points: `{ 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }`
- Multipliers: Fast+Correct=×2, Normal+Correct=×1, Slow+Correct=×0.5, Fast+Incorrect=−1, Normal+Incorrect=−1.5, Slow+Incorrect=−2
- scoreDelta = Math.round(basePts × multiplier)
- Speed tier: timeTakenMs < fastMs → 'fast'; timeTakenMs >= slowMs → 'slow'; else 'normal'
- Streak: same type increments; different type → streakCount = 1, streakType = new type
- Difficulty on streak === 3: correct → Math.min(level + 1, 5); incorrect → Math.max(level - 1, 1); then streakCount = 0
- Return `{ updatedMeta, scoreDelta, speedTier }` — immutable, pure

## Dev Agent Record

### Implementation Plan
Implement scoring.ts (Task 1) then scoring.test.ts (Task 2), run tests, verify all pass.

### Completion Notes
- All 34 tests in `domain/scoring.test.ts` pass (30 original + 4 added during code review)
- Full suite: 248/248 tests passing across 16 files
- `applyAnswer` is pure/immutable — spreads input meta, never mutates
- `getSpeedTier` exported as a standalone helper for use in quiz loop (Story 3.3)
- `speedTier` included in `ApplyAnswerResult` (needed by quiz loop for feedback panel and QuestionRecord)

### Code Review Fixes Applied
- **M1 fixed**: `BASE_POINTS` lookup now uses `?? 30` fallback — prevents silent `NaN` on out-of-range `difficultyLevel`
- **L1 fixed**: `streakType` now resets to `'none'` (alongside `streakCount = 0`) when a difficulty change triggers
- **L2 fixed**: Added 2 tests asserting `streakType === 'none'` after difficulty-triggered resets
- **L3 fixed**: Added 2 tests confirming score accumulation from non-zero starting values

## File List

- src/domain/scoring.ts (modified)
- src/domain/scoring.test.ts (new)

## Change Log

- 2026-03-12: Story created — George
- 2026-03-12: Story completed — all 30 tests green, 170/170 full suite
