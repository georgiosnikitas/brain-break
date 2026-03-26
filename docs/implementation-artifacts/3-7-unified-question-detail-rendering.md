---
Story: 3.7
Title: Unified Question Detail Rendering
Status: review
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-26
GitHub-Issue: 52
---

# Story 3.7: Unified Question Detail Rendering

## Story

As a user,
I want the post-answer feedback layout in the quiz to be replicated exactly in the question detail view in my history,
So that the experience is consistent and I recognise the same layout whether I just answered a question or I'm reviewing it later.

## Acceptance Criteria

- [x] AC1: `utils/format.ts` exports `renderQuestionDetail(record: QuestionRecord, opts?: { showTimestamp?: boolean }): void` that renders: all 4 options (A–D) with `►` on the user's answer, a blank line, correct/incorrect status (+ reveal on wrong), compound time/speed/difficulty line, score delta line, and optionally the answered-at timestamp (when `opts.showTimestamp === true`)
- [x] AC2: `screens/quiz.ts` replaces `showAnswerOptions(question, userAnswer)` + `console.log()` + `showFeedback(...)` with a single `renderQuestionDetail(record)` call (no timestamp); `showAnswerOptions` and `showFeedback` private functions are removed
- [x] AC3: Post-answer actions (💡 Explain answer / ▶️ Next question / 🚪 Exit quiz) are fully preserved and render immediately after `renderQuestionDetail(record)`, unchanged
- [x] AC4: `screens/history.ts` `displayEntry()` prints the question text as a plain (non-bold, non-numbered) line — `console.log(`\n${record.question}`)` — then calls `renderQuestionDetail(record, { showTimestamp: true })`; the `globalIndex` parameter is removed from `displayEntry()` and its call site; the `📜 Question History — {domainSlug}` header in `navigateHistory` is unchanged
- [x] AC5: `formatTimestamp` export is moved from `screens/history.ts` into `utils/format.ts` (used internally by `renderQuestionDetail` when `showTimestamp` is true); the history module no longer exports or defines `formatTimestamp`
- [x] AC6: Visual output of the options + feedback block is identical in both screens for the same `QuestionRecord` — same markers, same color helpers, same field order; history additionally shows the timestamp line
- [x] AC7: `utils/format.test.ts` gains tests for `renderQuestionDetail` covering: correct path (options, `✓ Correct!`, `►` on correct key, no reveal, score/time lines), incorrect path (`✗ Incorrect`, reveal, `►` on wrong key), `showTimestamp: true` appends timestamp, default omits it
- [x] AC8: All existing tests in `screens/quiz.test.ts` and `screens/history.test.ts` continue to pass

## Tasks / Subtasks

- [x] Task 1: Move `formatTimestamp` to `utils/format.ts` and add `renderQuestionDetail` (AC: 1, 5)
  - [x] 1.1 Move `formatTimestamp(iso: string): string` from `screens/history.ts` into `utils/format.ts` — keep it non-exported (module-private helper)
  - [x] 1.2 Import `QuestionRecord` from `../domain/schema.js` in `utils/format.ts`
  - [x] 1.3 Export `renderQuestionDetail(record: QuestionRecord, opts?: { showTimestamp?: boolean }): void`

- [x] Task 2: Update `screens/quiz.ts` (AC: 2, 3)
  - [x] 2.1 Import `renderQuestionDetail` from `../utils/format.js`
  - [x] 2.2 Replace `showAnswerOptions` + `console.log()` + `showFeedback` with `renderQuestionDetail(record)`
  - [x] 2.3 Remove the `showAnswerOptions()` private function
  - [x] 2.4 Remove the `showFeedback()` private function
  - [x] 2.5 Verify `askPostAnswerAction()`, `askNextOrExit()`, and `handleExplain()` are completely unchanged

- [x] Task 3: Update `screens/history.ts` (AC: 4, 5)
  - [x] 3.1 Remove the `formatTimestamp` export from `screens/history.ts`
  - [x] 3.2 Import `renderQuestionDetail` from `../utils/format.js`
  - [x] 3.3 Replace `displayEntry(record, globalIndex)` with `displayEntry(record)` using `renderQuestionDetail`
  - [x] 3.4 Update the `displayEntry` call site in `navigateHistory`

- [x] Task 4: Write/update tests (AC: 7, 8)
  - [x] 4.1 `utils/format.test.ts`: add `renderQuestionDetail` test suite
    - [x] 4.1.1 Correct answer case
    - [x] 4.1.2 Incorrect answer case
    - [x] 4.1.3 `showTimestamp: true`: assert the `Answered:` line is present
    - [x] 4.1.4 `showTimestamp` omitted: assert no `Answered:` line
  - [x] 4.2 `screens/history.test.ts`: remove `formatTimestamp` import, update format assertions
  - [x] 4.3 `screens/quiz.test.ts`: all existing assertions pass (no changes needed)

## Dev Notes

### Reference design: quiz post-answer screen

The quiz `showQuiz()` loop currently renders feedback like this (after the inquirer `select` prompt returns):
```
  ► B) Option B       ← from showAnswerOptions()
    A) Option A
    C) Option C
    D) Option D
              ← blank console.log()
✓ Correct!             ← from showFeedback()
Time: 2.1s | Speed: Fast | Difficulty: Intermediate
Score: +60
```

### Historic `displayEntry()` layout (to be replaced)

`displayEntry()` in `history.ts` currently renders:
```
#3 — Question text     ← bold header with #N numbering (REMOVE)
  A) Option A          ← dim
  B) Option B          ← dim
  C) Option C          ← dim
  D) Option D          ← dim
  Your answer: B  |  Correct: B  |  ✓ Correct   ← inline compound
  Time: 2.1s  |  Speed: Fast  |  Score: +60  |  Difficulty: Intermediate
  Answered: 3/26/2026, 10:12:00 AM             ← dim timestamp
```

After this change, `displayEntry()` calls `renderQuestionDetail(record, { showTimestamp: true })` and produces:
```
📜 Question History — domain-name   ← rendered by navigateHistory (unchanged)

What is the capital of France?    ← plain question text (displayEntry)
  ► B) Paris             ← renderQuestionDetail — ► on user answer
    A) London
    C) Berlin
    D) Madrid
              ← blank separator
✓ Correct!
Time: 2.1s | Speed: Fast | Difficulty: Intermediate
Score: +60
Answered: 3/26/2026, 10:12:00 AM   ← dim, only shown when showTimestamp: true
```

### Key import changes

| File | Add import | Remove import |
|---|---|---|
| `utils/format.ts` | `QuestionRecord` from `domain/schema.js` | — |
| `screens/quiz.ts` | `renderQuestionDetail` from `utils/format.js` | — |
| `screens/history.ts` | `renderQuestionDetail` from `utils/format.js` | `formatTimestamp` (moved to format.ts) |

### `formatTimestamp` relocation

`formatTimestamp` is currently exported from `screens/history.ts`. After this story:
- It moves to `utils/format.ts` as a **non-exported** module-private function (used only by `renderQuestionDetail`)
- Any test that imports `formatTimestamp` from `screens/history.ts` must be updated to remove or replace that import

## Changelog

- 2026-03-26: Story created — unified question detail rendering for GitHub issue #52
- 2026-03-26: Story implemented — all ACs satisfied, 640 tests passing

## Dev Agent Record

### Implementation Notes

- Moved `formatTimestamp` from `screens/history.ts` to `utils/format.ts` as a non-exported private helper
- Added `renderQuestionDetail` exported from `utils/format.ts`, consuming the private `formatTimestamp` when `showTimestamp: true`
- `screens/quiz.ts`: removed `showAnswerOptions` and `showFeedback`; replaced with single `renderQuestionDetail(record)` call; cleaned up now-unused imports (`formatDuration`, `colorCorrect`, `colorSpeedTier`, `colorScoreDelta`, `colorDifficultyLevel`, `bold`, `SpeedTier`)
- `screens/history.ts`: removed `formatTimestamp` export and old `displayEntry` impl; replaced with `renderQuestionDetail(record, { showTimestamp: true })`; removed globalIndex param; cleaned up unused imports
- `screens/history.test.ts`: removed `formatTimestamp` import + test suite; updated format-dependent assertions to match new output structure (`► B)`, `✗ Incorrect`, `Answered:` instead of `Your answer:` / `Correct:` / `#N —`)
- `utils/format.test.ts`: added `renderQuestionDetail` suite with 4 test cases (correct, incorrect, timestamp present, timestamp absent)

### File List

- `src/utils/format.ts` — added private `formatTimestamp`, exported `renderQuestionDetail`; added `QuestionRecord` import
- `src/screens/quiz.ts` — replaced `showAnswerOptions`+`showFeedback` with `renderQuestionDetail`; removed private functions; cleaned imports
- `src/screens/history.ts` — removed `formatTimestamp` export; updated `displayEntry` to use `renderQuestionDetail`; cleaned imports
- `src/utils/format.test.ts` — added `renderQuestionDetail` test suite (4 cases)
- `src/screens/history.test.ts` — removed `formatTimestamp` import/test; updated 3 format-dependent assertions
