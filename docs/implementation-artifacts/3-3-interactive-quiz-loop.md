---
Story: 3.3
Title: Interactive Quiz Loop
Status: done
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-12
---

# Story 3.3: Interactive Quiz Loop

## Story

As a user,
I want to answer AI-generated multiple-choice questions in my chosen domain one at a time — with score feedback and speed tier shown after each answer — and have everything persist automatically after every question,
So that I can take a meaningful quiz session and never lose progress even if I quit mid-session.

## Acceptance Criteria

- [x] AC1: `screens/quiz.ts` starts an `ora` spinner with "Generating question..." while `generateQuestion()` is called; spinner stops before the question is displayed
- [x] AC2: Question and all 4 answer options (A–D) are displayed; a silent timer starts when the question is shown and stops when the user submits their answer
- [x] AC3: `applyAnswer()` is called to compute `scoreDelta`, `updatedMeta`, and `speedTier`; the feedback panel shows correct/incorrect, the correct answer (if the user was wrong), time taken, speed tier, and score delta
- [x] AC4: `writeDomain()` is called atomically with the full updated domain state (meta, hashes + new hash appended, history + new record appended) before the next question is shown
- [x] AC5: Every `QuestionRecord` field from FR11 is written: question, options, correctAnswer, userAnswer, isCorrect, answeredAt (ISO 8601), timeTakenMs, speedTier, scoreDelta, difficultyLevel
- [x] AC6: `generateQuestion()` returning `{ ok: false, error: AI_ERRORS.NETWORK }` → error message displayed, user returned to home screen without crashing
- [x] AC7: `generateQuestion()` returning `{ ok: false, error: AI_ERRORS.AUTH }` → auth error message displayed, `process.exit(1)` called
- [x] AC8: "Exit quiz" option available after each answer; choosing it returns the user to the home screen with all persisted data preserved
- [x] AC9: `ExitPromptError` during any `select()` call returns the user to the home screen without crashing

## Tasks / Subtasks

- [x] Task 1: Implement `screens/quiz.ts` (AC: 1–9)
  - [x] 1.1 Import `ora`, `select`, `ExitPromptError`, `generateQuestion`, `AI_ERRORS`, `readDomain`, `writeDomain`, `applyAnswer`, `hashQuestion`, `defaultDomainFile`, `QuestionRecord`, `DomainFile`, `AnswerOption`, format helpers, and `router`
  - [x] 1.2 Export `showQuiz(domainSlug: string): Promise<void>`
  - [x] 1.3 Read domain from disk at entry point; warn and use `defaultDomainFile()` if read fails
  - [x] 1.4 Quiz loop: create and start ora spinner; call `generateQuestion(slug, meta.difficultyLevel, new Set(domain.hashes))`; stop spinner
  - [x] 1.5 Handle `{ ok: false, error: AI_ERRORS.AUTH }` → `console.error` + `process.exit(1)`; handle other errors → `console.error` + `router.showHome()` + return
  - [x] 1.6 Display question via `select()` with options A–D; capture `startTime = Date.now()` just before the call; compute `timeTakenMs = Date.now() - startTime` after it resolves
  - [x] 1.7 Call `applyAnswer(domain.meta, isCorrect, timeTakenMs, question.speedThresholds)` to get `updatedMeta`, `scoreDelta`, `speedTier`
  - [x] 1.8 Build `QuestionRecord` with all FR11 fields; compute hash; accumulate into `domain`; set `meta.lastSessionAt` to current ISO timestamp
  - [x] 1.9 Call `writeDomain(slug, domain)` atomically; log error if result is `{ ok: false }` but continue
  - [x] 1.10 Display feedback panel: correct/incorrect, correct answer if wrong, time, speed tier, score delta
  - [x] 1.11 Display next-action `select()` with "Next question" / "Exit quiz"; "Exit quiz" → `router.showHome()` + return
  - [x] 1.12 Wrap both `select()` calls in try/catch; `ExitPromptError` → `router.showHome()` + return

- [x] Task 2: Write `screens/quiz.test.ts` (AC: 1–9)
  - [x] 2.1 Mock `ora`, `@inquirer/prompts`, `../ai/client.js`, `../domain/store.js`, `../router.js`
  - [x] 2.2 Test ora spinner is started and stopped around question generation
  - [x] 2.3 Test NETWORK error → error logged, `router.showHome` called once, no `select` called
  - [x] 2.4 Test AUTH error → `process.exit(1)` called
  - [x] 2.5 Test correct answer + exit: `writeDomain` called once with correct record (all FR11 fields), `router.showHome` called
  - [x] 2.6 Test incorrect answer: correct answer displayed in feedback
  - [x] 2.7 Test correct answer is not re-displayed on correct submission
  - [x] 2.8 Test "next question" continues the loop (two `generateQuestion` calls, two `writeDomain` calls)
  - [x] 2.9 Test `writeDomain` failure: error logged, quiz continues to exit
  - [x] 2.10 Test `ExitPromptError` during answer select → `router.showHome` called
  - [x] 2.11 Test `ExitPromptError` during next-action select → `router.showHome` called
  - [x] 2.12 Test `meta.lastSessionAt` is updated on persist
  - [x] 2.13 Test corrupted domain read: warning logged, fresh domain used

## Dev Notes

- `showQuiz` receives only `domainSlug`; must read domain internally
- Timer: `const startTime = Date.now()` immediately before `select()` answer prompt; `const timeTakenMs = Date.now() - startTime` immediately after it resolves
- `QuestionRecord.difficultyLevel` = `domain.meta.difficultyLevel` **before** `applyAnswer` (the level at which the question was asked)
- Domain state is accumulated in-memory across loop iterations; each `writeDomain` call persists the full state
- `meta.lastSessionAt` is updated on every iteration (set to `new Date().toISOString()` after `applyAnswer`)
- Circular dependency `quiz.ts → router.ts → select-domain.ts → quiz.ts` is acceptable (existing project pattern, functions called at runtime not at import time)
- `ExitPromptError` from `@inquirer/core` must be caught around both `select()` calls

## Dev Agent Record

### Implementation Plan
Implement quiz.ts (Task 1) then quiz.test.ts (Task 2), run full test suite, verify all pass.

### Completion Notes
- All 14 tests in `src/screens/quiz.test.ts` pass; full suite: 248/248 tests across 16 files
- `showQuiz` reads domain at entry, accumulates state in-memory across iterations, writes atomically after each answer
- `QuestionRecord.difficultyLevel` captures the level at question-ask time (before `applyAnswer` may promote/demote)
- `meta.lastSessionAt` set to `new Date().toISOString()` after each answer, merged into `updatedMeta` spread
- Circular dependency `quiz.ts → router.ts → select-domain.ts → quiz.ts` is safe (runtime calls only)
- Added `vi.mock('@github/copilot-sdk', ...)` to `src/screens/home.test.ts` — previously not needed because quiz.ts was a stub with no imports; now that quiz.ts imports ai/client.ts, the transitive CJS/ESM issue surfaces in the home test import chain

### Code Review Fixes Applied
- **M3 fixed**: `spinner.stop()` moved into `.finally()` on the `generateQuestion` promise — spinner always stops even if the promise unexpectedly throws
- **M2 fixed**: AUTH error test now asserts `console.error` was called with the auth message string, in addition to asserting `process.exit(1)` — console.error also suppressed in test output
- **M1 fixed**: Added test for `AI_ERRORS.PARSE` error path — asserts error is logged to console.error, `router.showHome` is called once, and `select` is never called
- **L1 fixed**: AUTH test now suppresses `console.error` via spy (consistent with all other error tests)
- **L2 fixed**: Incorrect-answer feedback test now asserts `'Correct answer:'` text specifically instead of bare `'B'`
- **L3 fixed**: Incorrect-answer test now also asserts `record.isCorrect === false` via `writeDomain` call inspection
- Final suite: 189/189 tests across 14 files

## File List

- src/screens/quiz.ts (modified)
- src/screens/quiz.test.ts (created)
- src/screens/home.test.ts (modified — added `@github/copilot-sdk` mock)
