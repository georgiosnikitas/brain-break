---
Story: 3.6
Title: Same-Screen Quiz Feedback
Status: done
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-25
GitHub-Issue: 50
---

# Story 3.6: Same-Screen Quiz Feedback

## Story

As a user,
I want the post-answer feedback (correct/incorrect, score delta, speed tier, etc.) to remain on the same screen as the original question after I answer,
So that I can see the question, my chosen answer, and all feedback together without a screen clear.

## Acceptance Criteria

- [x] AC1: After answering a quiz question, the feedback panel renders **inline on the same screen** — no `clearAndBanner()` or `clearScreen()` call occurs between the question display and the feedback panel
- [x] AC2: The user can see the original question text, answer options, and their chosen answer above the feedback (correct/incorrect, correct answer reveal, time taken, speed tier, score delta)
- [x] AC3: A terminal reset (`clearAndBanner()`) occurs only when the user selects "Next question" (before rendering the next question) — not between question and feedback
- [x] AC4: The explain flow still works correctly after the feedback is displayed inline — explanation appends below feedback, then shows Next/Exit prompt
- [x] AC5: `clearAndBanner()` is called exactly **once** per question cycle (before question display) — not twice as before
- [x] AC6: All existing quiz tests pass after the change; tests are updated to assert `clearAndBanner` is called once (not twice) per question cycle
- [x] AC7: A visual separator (blank line) is printed between the answer selection and the feedback panel for readability

## Tasks / Subtasks

- [x] Task 1: Remove `clearAndBanner()` between answer and feedback in `screens/quiz.ts` (AC: 1, 2, 3, 5, 7)
  - [x] 1.1 In `showQuiz()`, remove the `clearAndBanner()` call on line 184 (after `writeDomain`, before `showFeedback`)
  - [x] 1.2 Add `console.log()` (blank line) before `showFeedback()` call to visually separate feedback from the inquirer answer selection
  - [x] 1.3 Verify `clearAndBanner()` is called exactly once: before `askQuestion()` (line 140)

- [x] Task 2: Update `screens/quiz.test.ts` to match new behavior (AC: 5, 6)
  - [x] 2.1 Update all test assertions that expect `clearAndBanner` to be called **2 times** per question → change to **1 time**
  - [x] 2.2 Verify no test expects a `clearAndBanner` call between answer submission and feedback display
  - [x] 2.3 Run full test suite — all tests must pass

## Dev Notes

### The Change

The current `showQuiz()` flow calls `clearAndBanner()` **twice** per question cycle:
1. **Line 130** — before `askQuestion()` (displays the question on a clean screen) ✅ KEEP
2. **Line 165** — after `writeDomain()`, before `showFeedback()` (clears the question before showing feedback) ❌ REMOVE

After this change, the feedback panel renders directly below the user's answer on the same screen. The user sees:
```
🧠🔨 Brain Break
─────────────────
? [Question text]
  A) Option A
❯ B) Option B    ← user's selection
  C) Option C
  D) Option D

✓ Correct!
Time: 2.1s | Speed: Fast | Difficulty: Intermediate
Score: +60
```

### Exact Code Change in `screens/quiz.ts`

**REMOVE** this line (currently line 165):
```typescript
clearAndBanner()
```

**ADD** a blank line separator before feedback:
```typescript
console.log() // visual separator between answer and feedback
```

The result in context (lines ~162–170):
```typescript
    // Atomic persist before showing feedback or the next question
    const writeResult = await writeDomain(domainSlug, domain)
    if (!writeResult.ok) {
      console.warn(warn(`Failed to save progress: ${writeResult.error}`))
    }

    console.log() // visual separator between answer and feedback
    showFeedback(isCorrect, question, timeTakenMs, speedTier, scoreDelta, record.difficultyLevel)
```

### Test Changes in `screens/quiz.test.ts`

Find this assertion on **line 329**:
```typescript
expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(2)
```
Change to:
```typescript
expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
```

This is the only test that asserts a specific `clearAndBanner` call count. Line 319 uses `.toHaveBeenCalled()` (without a count) and does not need changing.

### Architecture Compliance

- `clearAndBanner()` remains the screen-clearing primitive — used before question display (no change)
- Architecture doc updated: NFR5 now explicitly excludes post-answer feedback from terminal reset
- `showFeedback()` function unchanged — it just uses `console.log()` (no clearing inside)
- `askPostAnswerAction()` / `askNextOrExit()` unchanged
- `handleExplain()` unchanged — appends explanation below feedback (already inline)
- `writeDomain()` timing unchanged — still persists atomically before feedback display

### No Other Files Affected

- `utils/screen.ts` — no changes needed
- `utils/format.ts` — no changes needed
- `ai/client.ts` — no changes needed
- `ai/prompts.ts` — no changes needed
- `domain/store.ts` — no changes needed
- `domain/scoring.ts` — no changes needed
- `router.ts` — no changes needed

### References

- [Source: docs/planning-artifacts/prd.md#Feature 3 — Interactive Terminal Quiz]
- [Source: docs/planning-artifacts/epics.md#FR8]
- [Source: docs/planning-artifacts/epics.md#NFR5]
- [Source: docs/planning-artifacts/epics.md#Story 3.3]
- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture — Screen Clearing Pattern]
- [Source: docs/implementation-artifacts/3-3-interactive-quiz-loop.md]
- [Source: docs/implementation-artifacts/3-4-answer-explanation.md]
- [GitHub Issue: #50]

### Previous Story Intelligence

From **Story 3.4** (Answer Explanation):
- `askPostAnswerAction()` and `askNextOrExit()` already work with inline rendering (explanation appends below feedback with `console.log`)
- `handleExplain()` uses `console.log(`\n${explainResult.data}\n`)` — already renders inline, no clear
- The explain flow will continue to work identically after removing the clearAndBanner between question and feedback

From **Story 3.3** (Interactive Quiz Loop):
- `showFeedback()` is a pure rendering function using `console.log()` — does not call `clearScreen()` or `clearAndBanner()` internally
- `writeDomain()` is called BEFORE showing feedback — this order is preserved
- `ExitPromptError` handling is unchanged

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Removed `clearAndBanner()` call on line 184 of `quiz.ts` (before `showFeedback`), replaced with `console.log()` blank-line separator
- `clearAndBanner()` now called exactly once per question cycle — before `askQuestion()` only
- Updated test assertion from `toHaveBeenCalledTimes(2)` → `toHaveBeenCalledTimes(1)` and updated test description to reflect new behavior
- All 630 tests pass across 25 test files, zero regressions
- Explain flow, post-answer actions, and domain persistence all continue to work identically

### Change Log
- 2026-03-25: Implemented same-screen quiz feedback — removed clearAndBanner between question and feedback display

### File List
- src/screens/quiz.ts (modified)
- src/screens/quiz.test.ts (modified)
