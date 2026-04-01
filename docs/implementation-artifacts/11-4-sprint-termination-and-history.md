# Story 11.4: Sprint Termination & History

Status: complete

## Story

As a user,
I want the sprint to end correctly under all four termination conditions and see a session summary with my sprint completion result,
So that my progress is saved accurately and I understand how I performed in the challenge.

## Acceptance Criteria

1. Sprint ends on whichever condition occurs first: (a) all N questions answered, (b) timer expires mid-question, (c) timer expires mid-post-answer feedback, (d) user selects Back
2. For condition (b) — timer expires mid-question: the unanswered question is auto-submitted as incorrect using `userAnswer: "TIMEOUT"`, `isCorrect: false`, `speedTier: "slow"`, and the slow + incorrect scoring multiplier; the question is persisted to domain history
3. For condition (c) — timer expires mid-post-answer: sprint ends immediately after the current feedback; no additional questions displayed
4. For condition (d) — user selects Back: sprint exits immediately; unanswered questions discarded
5. Only answered questions (including auto-submitted timeout questions) are recorded in domain history with all standard `QuestionRecord` fields
6. Preloaded questions that were never displayed are discarded — their hashes are NOT added to the domain's `hashes[]` array
7. `SessionData` type is extended with an optional `sprintResult` field: `{ questionsAnswered: number, totalQuestions: number, timedOut: boolean }`
8. `renderSessionSummary()` in `domain-menu.ts` renders a 9th field — **Sprint result**: `"Completed X / N questions"` in green when all N answered, or `"Time expired — X / N questions answered"` in red when timer ran out
9. The sprint result field (field 9) is only rendered when `sessionData.sprintResult` is present (not shown for regular quiz sessions)
10. Score and difficulty level persist to the domain file after sprint termination via the existing per-answer `writeDomain()` pattern (already implemented in Story 11.3)
11. `QuestionRecord.userAnswer` type is widened to accept `"TIMEOUT"` in addition to `AnswerOption` values
12. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Widen `userAnswer` type in `src/domain/schema.ts` (AC: #11)
  - [x] Update `QuestionRecordSchema.userAnswer` to accept `'TIMEOUT'` in addition to `A/B/C/D`: change the field from `AnswerOptionSchema` to `z.enum(['A', 'B', 'C', 'D', 'TIMEOUT'])`
  - [x] `QuestionRecord` is inferred from `QuestionRecordSchema`, so the TypeScript type widens automatically once the schema is updated — there is no separate interface field to edit
  - [x] Keep `AnswerOptionSchema` unchanged for actual interactive selections; only persisted history records should gain the `'TIMEOUT'` sentinel
  - [x] Verify no existing code that checks `userAnswer` breaks (grep for `userAnswer` usages — `isCorrect` field already tracks correctness independently)
- [x] Task 2: Extend `SessionData` type in `src/domain/schema.ts` (AC: #7)
  - [x] Add optional field to `SessionData`: `sprintResult?: { questionsAnswered: number, totalQuestions: number, timedOut: boolean }`
  - [x] This field is only populated for challenge sessions, not regular quiz sessions
  - [x] No Zod schema needed for `SessionData` — it's an in-memory interface, never serialized to disk
- [x] Task 3: Update `src/screens/challenge.ts` to complete timeout persistence and set `sprintResult` on return (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Remove the `'TIMEOUT' as unknown as AnswerOption` type assertion (if Story 11.3 used it) — now `'TIMEOUT'` is a valid value
  - [x] Track termination reason: `let timedOut = false` — set to `true` when AbortController fires (conditions b or c)
  - [x] Capture `questionStartMs` when each question renders; on timer expiry mid-question, compute `timeTakenMs = Date.now() - questionStartMs` and pass that actual elapsed duration to `applyAnswer()` instead of the full sprint budget
  - [x] On timer expiry mid-question, build and persist the synthetic timeout record: `userAnswer: 'TIMEOUT'`, `isCorrect: false`, `speedTier: 'slow'`, plus the normal `QuestionRecord` fields and per-answer `writeDomain()` update
  - [x] Render a brief timeout line in `challenge.ts` itself (for example, `Time expired. Auto-submitting current question.`) before or after `renderQuestionDetail(record)`; keep the shared renderer unchanged
  - [x] After the sprint loop, build session result with `sprintResult`:

    ```typescript
    const sprintResult = {
      questionsAnswered: sessionRecords.length,
      totalQuestions: questions.length,
      timedOut,
    }
    return sessionRecords.length > 0
      ? { records: sessionRecords, startingDifficulty, sprintResult }
      : null
    ```

  - [x] Ensure unanswered questions' hashes are NOT added to `domain.hashes[]` — only answered questions' hashes are added (already correct if Story 11.3 only adds hashes per-answer)
  - [x] Verify all four termination conditions produce correct session data
- [x] Task 4: Update `src/screens/challenge.test.ts` (AC: #1, #2, #3, #4, #5, #6, #7, #12)
  - [x] Test: termination (a) — all N questions answered → `sprintResult.questionsAnswered === N`, `timedOut: false`
  - [x] Test: termination (b) — timer expires mid-question → auto-submit question as TIMEOUT, `sprintResult.timedOut: true`, `questionsAnswered` includes the timeout question
  - [x] Test: termination (c) — timer expires mid-post-answer → `sprintResult.timedOut: true`, answered questions saved, no further questions
  - [x] Test: termination (d) — user selects Back → `sprintResult.timedOut: false`, only answered questions in records
  - [x] Test: unanswered questions' hashes NOT in domain.hashes after sprint
  - [x] Test: session data includes `sprintResult` field with correct shape
  - [x] Test: `userAnswer: 'TIMEOUT'` is used for auto-submitted questions (not a type assertion)
  - [x] Test: timeout-question scoring uses the actual elapsed time to timeout, not the full sprint budget
- [x] Task 5: Add sprint result field to `renderSessionSummary()` in `src/screens/domain-menu.ts` (AC: #8, #9)
  - [x] After the existing 8 fields (difficulty is field 8), add a conditional 9th field:

    ```typescript
    if (sessionData.sprintResult) {
      const { questionsAnswered, totalQuestions, timedOut } = sessionData.sprintResult
      if (timedOut) {
        console.log('⚡ ' + bold('Sprint result:') + ` ${colorIncorrect(`Time expired — ${questionsAnswered} / ${totalQuestions} questions answered`)}`)
      } else {
        console.log('⚡ ' + bold('Sprint result:') + ` ${colorCorrect(`Completed ${questionsAnswered} / ${totalQuestions} questions`)}`)
      }
    }
    ```

  - [x] This field renders ONLY when `sessionData.sprintResult` is present — regular quiz sessions are unaffected
- [x] Task 6: Update `src/screens/domain-menu.test.ts` (AC: #8, #9, #12)
  - [x] Test: `renderSessionSummary` with `sprintResult` present and `timedOut: false` → renders green "Completed X / N questions"
  - [x] Test: `renderSessionSummary` with `sprintResult` present and `timedOut: true` → renders red "Time expired — X / N questions answered"
  - [x] Test: `renderSessionSummary` WITHOUT `sprintResult` → does NOT render field 9 (existing quiz behavior unchanged)
- [x] Task 7: Update `src/domain/schema.test.ts` (AC: #11, #12)
  - [x] Test: `QuestionRecordSchema` accepts `userAnswer: 'TIMEOUT'`
  - [x] Test: `QuestionRecordSchema` still accepts `userAnswer: 'A'`, `'B'`, `'C'`, `'D'`
  - [x] Test: `QuestionRecordSchema` rejects invalid `userAnswer` values
- [x] Task 8: Run full test suite and verify zero regressions (AC: #12)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Sprint Termination]
- Four termination conditions with specific behaviors per condition
- Per-answer `writeDomain()` already handles persistence (Story 11.3)
- Unanswered questions discarded in memory — hashes NOT added to dedup store
- Post-sprint: return to domain sub-menu with session summary including sprint result field 9

### Termination Conditions Table

| Condition | Trigger | Behavior |
| --- | --- | --- |
| (a) All N answered | Loop exhausts preloaded array | Normal completion — `timedOut: false` |
| (b) Timer mid-question | `AbortController` aborts answer prompt | Auto-submit as TIMEOUT → persist → `timedOut: true` |
| (c) Timer mid-post-answer | `AbortController` aborts nav prompt | Sprint ends immediately → `timedOut: true` |
| (d) User Back | User action during post-answer nav | Sprint exits → `timedOut: false` |

### SessionData Extension

```typescript
// src/domain/schema.ts — current
export interface SessionData {
  records: QuestionRecord[]
  startingDifficulty: number
}

// After Story 11.4:
export interface SessionData {
  records: QuestionRecord[]
  startingDifficulty: number
  sprintResult?: {
    questionsAnswered: number
    totalQuestions: number
    timedOut: boolean
  }
}
```

The `sprintResult` field is optional — quiz sessions don't set it. Only `challenge.ts` populates it.

### QuestionRecord.userAnswer Widening

```typescript
// src/domain/schema.ts — update the Zod schema field only
userAnswer: z.enum(['A', 'B', 'C', 'D', 'TIMEOUT'])
```

`QuestionRecord` is inferred from `QuestionRecordSchema`, so the TypeScript type widens automatically once this schema field changes.

### Impact Analysis for userAnswer Widening

Files that reference `userAnswer`:

- `src/screens/quiz.ts` — sets `userAnswer` from select prompt (always A/B/C/D) — **no change needed**
- `src/screens/challenge.ts` — sets `userAnswer: 'TIMEOUT'` — **now type-safe**
- `src/domain/schema.ts` — type definition — **updated**
- `src/domain/store.ts` — reads/writes JSON — **Zod schema validates; no code change**
- `src/screens/history.ts` / `src/screens/bookmarks.ts` — display records through the shared renderer — **no direct userAnswer indexing today**

### Timeout Feedback Rendering

`renderQuestionDetail()` already renders the option list by iterating `A/B/C/D` and separately reveals the correct answer via `correctAnswer`; it does not index `options` by `userAnswer`. Keep timeout-specific copy in `challenge.ts` itself (for example, a one-line timeout message before or after `renderQuestionDetail(record)`) rather than changing the shared renderer used by quiz, history, and bookmarks.

### Session Summary Sprint Result (from PRD)

- [Source: docs/planning-artifacts/prd.md#Feature 17 — FR46]
- Field 9 of session summary: `Completed X / N questions` in green (all answered) or `Time expired — X / N questions answered` in red (timer ran out)
- Only displayed for challenge sessions (when `sprintResult` present)

### Existing Session Summary Pattern (from domain-menu.ts)

```typescript
export function renderSessionSummary(sessionData: SessionData, endingDifficulty: number): void {
  const { records, startingDifficulty } = sessionData
  console.log(dim('── Last Session ──────'))
  // Fields 1-8 already rendered...
  console.log(dim('─────────────────────'))
}
```

Insert field 9 BEFORE the closing separator line (`dim('─────────────────────')`).

### Previous Story Learnings (from Stories 11.1, 11.2, 11.3)

- Story 11.3 implements the sprint loop and per-answer persistence — Story 11.4 only adds the `sprintResult` metadata and type widening
- `renderQuestionDetail()` is shared across quiz, history, bookmarks, and challenge — changes affect all consumers; test carefully
- Schema changes (Zod) affect on-disk persistence — ensure backward compatibility (old files without 'TIMEOUT' should still parse if `userAnswer` was always A/B/C/D)
- `SessionData` is in-memory only — no disk persistence, no migration needed

### Backward Compatibility

- Old domain files have `userAnswer: 'A'|'B'|'C'|'D'` — the widened Zod schema `z.enum(['A','B','C','D','TIMEOUT'])` accepts all existing values; no migration needed
- Old `SessionData` without `sprintResult` — the field is optional; `renderSessionSummary` checks `if (sessionData.sprintResult)` — existing quiz flow unaffected
- No shared-renderer migration is required for existing quiz/history/bookmark flows

### What This Story Does NOT Do

- Does NOT modify the sprint execution loop mechanics (Story 11.3 handles the loop, timer, AbortController)
- Does NOT modify `preloadQuestions()` (Story 11.2)
- Does NOT modify the sprint setup screen (Story 11.1)
- Does NOT add new screens — only modifies existing files

### Project Structure Notes

Files to create: (none)

Files to modify:

- `src/domain/schema.ts` — widen `userAnswer` type, extend `SessionData`
- `src/screens/challenge.ts` — add `sprintResult` to return value, remove type assertions
- `src/screens/challenge.test.ts` — add termination + sprint result tests
- `src/screens/domain-menu.ts` — add sprint result field 9 to `renderSessionSummary`
- `src/screens/domain-menu.test.ts` — add sprint result rendering tests
- `src/domain/schema.test.ts` — add TIMEOUT Zod validation test

### Testing Standards

- Framework: `vitest` — co-located `*.test.ts` alongside source
- Extend existing test files — do NOT create new test files
- Use `vi.mocked()` for type-safe mock access
- `beforeEach` → `vi.clearAllMocks()`
- Current test count: ~768 tests — verify zero regressions
- Pay special attention to regression in challenge termination semantics and the new session-summary sprint result field

### References

- [Source: docs/planning-artifacts/epics.md#Story 11.4]
- [Source: docs/planning-artifacts/prd.md#FR46 — Sprint Termination & History]
- [Source: docs/planning-artifacts/prd.md#FR39 — Session summary sprint result field 9]
- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Sprint Termination]
- [Source: src/domain/schema.ts — SessionData, QuestionRecord, AnswerOption types]
- [Source: src/screens/domain-menu.ts — renderSessionSummary, 8 existing fields]
- [Source: src/utils/format.ts — renderQuestionDetail]
- [Source: src/screens/challenge.ts — sprint loop (Story 11.3)]

## Dev Agent Record

### File List

- `src/domain/schema.ts` — widened `userAnswer` enum, extended `SessionData` with `sprintResult`
- `src/screens/challenge.ts` — added `autoSubmitTimeoutQuestion()` helper, `sprintResult` construction, forced slow tier on timeout
- `src/screens/domain-menu.ts` — added field 9 (Sprint result), field 2 "X / N" format for sprints
- `src/screens/challenge.test.ts` — updated 6 existing tests for `sprintResult`, added 4 new tests, timeout scoring assertions
- `src/screens/domain-menu.test.ts` — added 5 sprint result rendering tests (field 9 + field 2 format)
- `src/domain/schema.test.ts` — added `QuestionRecordSchema` describe block with 3 tests

### Change Log

1. Widened `QuestionRecordSchema.userAnswer` from `AnswerOptionSchema` to `z.enum(['A','B','C','D','TIMEOUT'])`
2. Added optional `sprintResult` to `SessionData` interface
3. Extracted `autoSubmitTimeoutQuestion()` helper for timeout auto-submit with forced slow tier scoring
4. Built `sprintResult` metadata in `showChallengeExecution()` return
5. Added field 9 (Sprint result) to `renderSessionSummary()` — green/red conditional
6. Updated field 2 (Questions answered) to show "X / N" format for sprint sessions
7. Post-review fix: forced `speedTier: 'slow'` on timeout via `Math.max(timeTakenMs, slowMs)` passed to `applyAnswer()`
8. Post-review fix: added "X / N" format to field 2 for sprint sessions per PRD line 574

### Completion Notes

All 8 tasks complete. 3 post-review fixes applied (HIGH: timeout scoring, MEDIUM: field-2 format, LOW: this doc). All acceptance criteria satisfied.

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)
