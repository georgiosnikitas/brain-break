# Story 10.1: Question Record — Bookmarked Field

Status: done

## Story

As a developer,
I want the `QuestionRecord` schema extended with a `bookmarked` boolean field (default: `false`),
So that every question can be flagged for later revisiting and the flag persists across sessions.

## Acceptance Criteria

1. `QuestionRecordSchema` in `domain/schema.ts` includes a `bookmarked` field of type `z.boolean().default(false)`
2. Existing domain JSON files without a `bookmarked` field on question records are backward compatible — Zod applies the default value `false` on parse, no migration required
3. Explicit `true` and `false` values for `bookmarked` are accepted by the schema
4. The `QuestionRecord` type (inferred from `QuestionRecordSchema`) includes `bookmarked: boolean`
5. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `bookmarked` field to `QuestionRecordSchema` in `domain/schema.ts` (AC: #1, #2, #3, #4)
  - [x] Add `bookmarked: z.boolean().default(false)` to `QuestionRecordSchema`
  - [x] Verify `QuestionRecord` type now includes `bookmarked: boolean` (inferred automatically)
- [x] Task 2: Update all `QuestionRecord` construction sites (AC: #1)
  - [x] Update `screens/quiz.ts` — add `bookmarked: false` to the `record` object built after answering a question
- [x] Task 3: Add/update tests (AC: #1, #2, #3, #5)
  - [x] Add tests in `domain/schema.test.ts`: bookmarked field present, default value `false`, explicit `true`/`false` accepted, backward compatibility with records missing the field
  - [x] Update `screens/quiz.test.ts` snapshot/assertion if any test asserts on the full `QuestionRecord` shape

## Dev Notes

### Pattern to Follow

The `bookmarked` field follows the same pattern as `showWelcome` in `SettingsFileSchema` — a boolean with a Zod `.default()`:

```ts
// Existing pattern in SettingsFileSchema:
showWelcome: z.boolean().default(true),

// New field in QuestionRecordSchema:
bookmarked: z.boolean().default(false),
```

### Key Implementation Details

**`QuestionRecordSchema` change** in `domain/schema.ts`:
- Add `bookmarked: z.boolean().default(false)` as the last field in the schema object
- The `QuestionRecord` type is `z.infer<typeof QuestionRecordSchema>` — it updates automatically

**Record construction** in `screens/quiz.ts`:
- The quiz loop builds a `QuestionRecord` literal after each answer. Add `bookmarked: false` to that object:
```ts
const record: QuestionRecord = {
  question: question.question,
  options: question.options,
  correctAnswer: question.correctAnswer,
  userAnswer,
  isCorrect,
  answeredAt: new Date().toISOString(),
  timeTakenMs,
  speedTier,
  scoreDelta,
  difficultyLevel: domain.meta.difficultyLevel,
  bookmarked: false,  // ← new field
}
```

**Backward compatibility:**
- `z.boolean().default(false)` means Zod will inject `bookmarked: false` for any existing record that lacks the field — no migration needed
- This is the same strategy used for `showWelcome` in settings

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/domain/schema.ts` | Add `bookmarked` field to `QuestionRecordSchema` |
| `src/domain/schema.test.ts` | Add backward compatibility + default + explicit value tests |
| `src/screens/quiz.ts` | Add `bookmarked: false` to record construction |
| `src/screens/quiz.test.ts` | Update any full-record assertions if needed |

### Testing Standards

- Co-located `*.test.ts` files
- Test default value injection on parse (missing field → `false`)
- Test explicit `true` and `false` accepted
- Test that existing records without `bookmarked` parse successfully

### What NOT to Do

- Do NOT add a migration function — Zod's `.default()` handles backward compat
- Do NOT modify `renderQuestionDetail()` yet — the ⭐ indicator is added in Story 10.2/10.3
- Do NOT modify navigation options — that's Story 10.2/10.3

### Project Structure Notes

- ESM with `.js` extensions in imports
- TypeScript strict mode
- Zod schemas define the source of truth; types are inferred via `z.infer<>`

### References

- [Source: docs/planning-artifacts/prd.md#Feature 5 — Persistent History (schema definition)]
- [Source: docs/planning-artifacts/prd.md#Feature 16 — Question Bookmarking]
- [Source: docs/planning-artifacts/epics.md#Story 10.1]
- [Source: docs/planning-artifacts/epics.md#FR41]
- [Source: src/domain/schema.ts — QuestionRecordSchema]
- [Source: src/screens/quiz.ts — record construction after answer]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (via GitHub Copilot)

### Completion Notes List
- Task 1: Added `bookmarked: z.boolean().default(false)` as the last field in `QuestionRecordSchema` in `domain/schema.ts`. `QuestionRecord` type automatically includes `bookmarked: boolean` via `z.infer<>`.
- Task 2: Added `bookmarked: false` to the `QuestionRecord` literal in `screens/quiz.ts` at the record construction site after answering a question.
- Task 3: Added 3 tests in `domain/schema.test.ts` — backward compat (missing field defaults to `false`), explicit `true` accepted, explicit `false` accepted. Updated 1 assertion in `screens/quiz.test.ts` to include `bookmarked: false` in the full-record shape expectation.
- All 720 tests pass (26 files, 0 regressions).

**Code Review Fix (M1):** Added `bookmarked: false` to `makeRecord()` helpers in `stats.test.ts`, `history.test.ts`, and `format.test.ts`. These helpers return `QuestionRecord` but were missing the field — at runtime the field would have been `undefined` instead of `false`, which would cause subtle failures in Stories 10.2–10.4 tests. All 720 tests pass post-fix.

### File List
- `src/domain/schema.ts` — added `bookmarked: z.boolean().default(false)` to `QuestionRecordSchema`
- `src/domain/schema.test.ts` — added 3 tests for bookmarked field (default, true, false)
- `src/screens/quiz.ts` — added `bookmarked: false` to record construction
- `src/screens/quiz.test.ts` — updated full-record assertion to include `bookmarked: false`
- `src/screens/stats.test.ts` — added `bookmarked: false` to `makeRecord()` helper
- `src/screens/history.test.ts` — added `bookmarked: false` to `makeRecord()` helper
- `src/utils/format.test.ts` — added `bookmarked: false` to `makeRecord()` helper
