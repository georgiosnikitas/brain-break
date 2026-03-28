# Story 3.8: Explanation Drill-Down (Quiz)

Status: done

## Story

As a user,
I want a "Teach me more" option after viewing an AI-generated explanation so the AI generates a deeper micro-lesson on the underlying concept,
So that I can go beyond the immediate answer and understand the foundational principles behind the question.

## Acceptance Criteria

1. After an AI explanation is displayed for a quiz question, three options are shown: "📚 Teach me more", "▶️  Next question", and "←  Back"
2. Selecting "Teach me more" shows an `ora` spinner ("Generating micro-lesson..."), calls `generateMicroLesson()`, and displays the micro-lesson inline below the explanation — no terminal clear
3. The micro-lesson is ~1-minute read (3–5 paragraphs), covering foundational principles, related concepts, and practical context
4. The micro-lesson uses the active language and tone from global settings
5. After the micro-lesson is displayed, two options are shown: "▶️  Next question" and "←  Back" — "Teach me more" is removed
6. If the AI call fails, a warning ("Could not generate micro-lesson.") is shown and the user returns to Next/Back prompt
7. Ctrl+C on any prompt returns gracefully to the domain sub-menu
8. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `buildMicroLessonPrompt` to `ai/prompts.ts` (AC: #3, #4)
  - [x] Create prompt builder following `buildExplanationPrompt` pattern
  - [x] Include question text, all options, correct answer, the explanation already provided
  - [x] Instruct model: 3–5 paragraphs, foundational principles, related concepts, practical context
  - [x] Inject voice instruction via `buildVoiceInstruction(settings)`
  - [x] Add tests in `ai/prompts.test.ts`
- [x] Task 2: Add `generateMicroLesson` to `ai/client.ts` (AC: #2, #6)
  - [x] Follow `generateExplanation` pattern exactly: `defaultSettings()` fallback → `createProvider()` → `buildMicroLessonPrompt()` → `provider.generateCompletion()` → trim → `Result<string>`
  - [x] Add tests in `ai/client.test.ts`
- [x] Task 3: Update `screens/quiz.ts` post-explanation flow (AC: #1, #2, #5, #6, #7)
  - [x] Add `askPostExplainAction()` — 3-option: Teach me more / Next / Back
  - [x] Add `handleTeachMeMore()` — ora spinner → `generateMicroLesson()` → display or warn → `askNextOrExit()`
  - [x] Modify `handleExplain()` to call `askPostExplainAction()` instead of `askNextOrExit()`
  - [x] When user selects "teach" → call `handleTeachMeMore()` which returns `askNextOrExit()` result
  - [x] Add/update tests in `screens/quiz.test.ts`
- [x] Task 4: Export `buildMicroLessonPrompt` and `generateMicroLesson` from their modules (AC: #2)
  - [x] Update imports in `screens/quiz.ts`

## Dev Notes

### Pattern to Follow

This feature follows the **exact same pattern** as Story 3.4 (Answer Explanation). The explain flow established:

```
askPostAnswerAction() → 3 options (Explain / Next / Back)
  ↳ "explain" → handleExplain() → ora spinner → generateExplanation() → display → askNextOrExit()
```

The drill-down extends this to:

```
askPostAnswerAction() → 3 options (Explain / Next / Back)
  ↳ "explain" → handleExplain() → ora spinner → generateExplanation() → display → askPostExplainAction()
    ↳ "teach" → handleTeachMeMore() → ora spinner → generateMicroLesson() → display → askNextOrExit()
    ↳ "next"/"exit" → return as-is
```

### Key Implementation Details

**`buildMicroLessonPrompt(question, explanation, settings)`** in `ai/prompts.ts`:
- Takes `question: QuestionResponse`, `explanation: string` (the already-generated explanation text), `settings?: SettingsFile`
- Uses `sanitizeInput()` for all user-facing strings (existing private utility in prompts.ts)
- Uses `buildVoiceInstruction(settings)` for language/tone injection (existing private utility)
- Prompt instructs: *"The user answered a quiz question and has already seen an explanation. Now generate a deeper micro-lesson (~1-minute read, 3–5 paragraphs) on the underlying concept. Cover foundational principles, related concepts, and practical context. Go beyond the explanation already provided."*
- Include: question text, all 4 options, correct answer, the explanation text
- End with: *"Reply with ONLY the micro-lesson — no JSON, no quotes, no extra text."*

**`generateMicroLesson(question, explanation, settings)`** in `ai/client.ts`:
- Signature: `(question: Question, explanation: string, settings?: SettingsFile) => Promise<Result<string>>`
- Follows `generateExplanation` pattern verbatim — same error handling via `classifyError()`
- Import and call `buildMicroLessonPrompt` from `./prompts.js`

**`askPostExplainAction()`** in `screens/quiz.ts`:
- New function returning `Promise<'teach' | 'next' | 'exit' | null>`
- 3 choices: `📚 Teach me more` / `▶️  Next question` / `←  Back` (with Separator before Back)
- Uses `menuTheme`, `ExitPromptError` catch → return null
- Pattern identical to `askPostAnswerAction()`

**`handleTeachMeMore(question, explanation, settings)`** in `screens/quiz.ts`:
- `ora('Generating micro-lesson...')` → `generateMicroLesson(question, explanation, settings)` → `.finally(() => spinner.stop())`
- On success: `console.log(\`\n${result.data}\n\`)`
- On failure: `console.warn(warn('Could not generate micro-lesson.'))`
- Then call `askNextOrExit()` and return the result

**Modify `handleExplain()`:**
- Currently returns `askNextOrExit()` after displaying explanation
- Change: capture explanation text on success, then call `askPostExplainAction()` instead of `askNextOrExit()`
- If user selects `'teach'` → call `handleTeachMeMore(question, explainResult.data, settings)` and return its result
- If user selects `'next'` or `'exit'` or `null` → return that value directly (same type `'next' | 'exit' | null`)

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/ai/prompts.ts` | Add `buildMicroLessonPrompt()` export |
| `src/ai/prompts.test.ts` | Add tests for `buildMicroLessonPrompt()` |
| `src/ai/client.ts` | Add `generateMicroLesson()` export |
| `src/ai/client.test.ts` | Add tests for `generateMicroLesson()` |
| `src/screens/quiz.ts` | Add `askPostExplainAction()`, `handleTeachMeMore()`, modify `handleExplain()` |
| `src/screens/quiz.test.ts` | Add tests for teach-me-more flow |

### Testing Standards

- Co-located `*.test.ts` files
- `vi.mock()` for external deps (`@inquirer/prompts`, `../ai/client.js`, `../domain/store.js`, `../router.js`)
- Chained `mockResolvedValueOnce` for multi-step navigation flows
- `vi.spyOn(console, 'log')` and `vi.spyOn(console, 'warn')` for output assertions
- Test success path, failure path, Ctrl+C (null return)

### What NOT to Do

- Do NOT create a new screen file — this is all within `screens/quiz.ts`
- Do NOT modify `renderQuestionDetail()` — micro-lesson is displayed after it, via `console.log()`
- Do NOT change the post-answer action flow (`askPostAnswerAction()`) — it stays as-is with Explain/Next/Back
- Do NOT add storage for micro-lessons — they are ephemeral, generated on demand
- Do NOT import from `screens/history.ts` — the quiz and history drill-down implementations are independent (Story 4.4 handles history)

### Project Structure Notes

- ESM with `.js` extensions in imports
- TypeScript strict mode
- `Result<T>` pattern — no raw `throw` in screens
- All `select()` calls use `menuTheme` and catch `ExitPromptError`

### References

- [Source: docs/planning-artifacts/prd.md#Feature 13 — Explanation Drill-Down]
- [Source: docs/planning-artifacts/epics.md#Story 3.8]
- [Source: docs/planning-artifacts/epics.md#FR38]
- [Source: src/ai/prompts.ts#buildExplanationPrompt — pattern to follow]
- [Source: src/ai/client.ts#generateExplanation — pattern to follow]
- [Source: src/screens/quiz.ts#handleExplain — function to modify]
- [Source: src/screens/quiz.ts#askPostAnswerAction — pattern for askPostExplainAction]
- [Source: docs/implementation-artifacts/3-4-answer-explanation.md — previous story learnings]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (via GitHub Copilot)

### Completion Notes List
- Task 1: Added `buildMicroLessonPrompt(question, explanation, settings?)` to `ai/prompts.ts` following `buildExplanationPrompt` pattern. Uses `sanitizeInput()` for question/explanation strings, `buildVoiceInstruction()` for language/tone injection. 10 tests added.
- Task 2: Added `generateMicroLesson(question, explanation, settings?)` to `ai/client.ts` following `generateExplanation` pattern exactly — same `classifyError()` error handling, same `Result<string>` return. 8 tests added.
- Task 3: Added `askPostExplainAction()` (3-option: teach/next/exit) and `handleTeachMeMore()` to `screens/quiz.ts`. Modified `handleExplain()` — on success, calls `askPostExplainAction()` instead of `askNextOrExit()`. On explain failure, falls back to `askNextOrExit()` (no teach option). 8 new tests + 1 updated test.
- Task 4: Exports and imports handled as part of Tasks 1-3. `buildMicroLessonPrompt` exported from `prompts.ts`, imported in `client.ts`. `generateMicroLesson` exported from `client.ts`, imported in `screens/quiz.ts`.
- All 675 tests pass (25 files, 0 regressions).
- Code review fixes applied: added `PostAnswerAction` type alias (M1); added empty-explanation guard in `handleExplain()` — skips teach option and falls to `askNextOrExit()` when AI returns empty string (M2); renamed `spinner` → `teachSpinner` in `handleTeachMeMore()` for consistency with `explainSpinner` naming (L2). 1 new test added for M2 guard. 676 total tests pass.

### File List
- `src/ai/prompts.ts` — added `buildMicroLessonPrompt()` export
- `src/ai/prompts.test.ts` — added 10 tests for `buildMicroLessonPrompt`
- `src/ai/client.ts` — added `generateMicroLesson()` export, updated import
- `src/ai/client.test.ts` — added 8 tests for `generateMicroLesson`
- `src/screens/quiz.ts` — added `askPostExplainAction()`, `handleTeachMeMore()`, modified `handleExplain()`, updated import, added `PostAnswerAction` type alias, renamed teach spinner, added empty-explanation guard
- `src/screens/quiz.test.ts` — added 8 teach-me-more tests, 1 empty-explanation guard test, updated 1 existing test, added mock for `generateMicroLesson`
