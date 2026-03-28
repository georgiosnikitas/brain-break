# Story 4.4: Explain Answer from History

Status: done

## Story

As a user,
I want to select "Explain answer" while browsing my question history so the AI explains why the correct answer is correct,
so that I can reinforce understanding of past questions and turn my history into an active learning tool.

## Acceptance Criteria

1. **Given** I am viewing a question in the history screen,
   **When** the navigation controls are displayed,
   **Then** the options include Previous, Next, Explain answer, and Back (alongside the progress indicator).

2. **Given** I am viewing a question in the history screen,
   **When** I select "Explain answer",
   **Then** a loading spinner is displayed while the AI generates an explanation,
   **And** `generateExplanation()` is called with the question context and the active language/tone settings,
   **And** the explanation (2–4 sentences) is displayed inline on the same screen below the question detail — no terminal clear or screen transition occurs.

3. **Given** the explanation is already displayed on the screen,
   **When** the navigation menu re-appears,
   **Then** the options are Previous, Next, and Back — Explain answer is hidden while the explanation is visible.

4. **Given** the explanation was previously displayed for a question,
   **When** I navigate away (Previous or Next) and then navigate back to the same question,
   **Then** Explain answer is available again in the navigation controls.

5. **Given** I select "Explain answer" and the AI call fails (network error, auth error, parse error),
   **When** the error is caught,
   **Then** a warning message is displayed ("Could not generate explanation.") and I am returned to the full navigation menu (Previous/Next/Explain answer/Back) — the failure is non-critical and does not interrupt history browsing.

6. **Given** the domain has exactly 1 history entry,
   **When** I view the entry and select "Explain answer",
   **Then** the explanation is displayed inline and the navigation menu shows only Back (no Previous, no Next) — Explain answer is hidden while explanation is visible.

7. **Given** `screens/history.test.ts` is updated,
   **When** I run `npm test`,
   **Then** all tests pass, covering: Explain answer option present in navigation, `generateExplanation()` called with correct arguments, explanation rendered inline, Explain hidden after explanation displayed, Explain available again after navigating away and back, AI failure handled gracefully with warning message.

## Tasks / Subtasks

- [x] Task 1: Extend `NavAction` type and `buildPageChoices` (AC: 1, 3, 6)
  - [x] Add `'explain'` to `NavAction` type union: `'next' | 'prev' | 'back' | 'explain'`
  - [x] Add `explainVisible?: boolean` parameter to `buildPageChoices(currentIndex, totalItems, explainVisible?)`
  - [x] Insert "Explain answer" choice between Next and Back — only when `explainVisible` is falsy
- [x] Task 2: Load settings in `showHistory` (AC: 2)
  - [x] Import `readSettings` from `../domain/store.js` and `defaultSettings` from `../domain/schema.js`
  - [x] Call `readSettings()` at the top of `navigateHistory`, fallback to `defaultSettings()`
  - [x] Pass `settings` to `generateExplanation` call
- [x] Task 3: Add explain flow to `navigateHistory` loop (AC: 2, 3, 4, 5)
  - [x] Import `generateExplanation` and `type Question` from `../ai/client.js`
  - [x] Import `ora` for the loading spinner
  - [x] Track `explainVisible` boolean — reset to `false` on every `prev`/`next` navigation
  - [x] When `nav === 'explain'`: call `generateExplanation`, display result inline, set `explainVisible = true`, re-render nav choices (without Explain)
  - [x] On failure: warn + keep `explainVisible = false` so Explain remains available
  - [x] Convert `QuestionRecord` → `Question`-compatible object for `generateExplanation` (see Dev Notes)
  - [x] Pass `explainVisible` to `buildPageChoices(index, totalItems, explainVisible)`
- [x] Task 4: Update tests (AC: 7)
  - [x] Add mock for `generateExplanation` via `vi.mock('../ai/client.js')`
  - [x] Add mock for `readSettings` if not already mocked
  - [x] Test: Explain answer option present in `buildPageChoices` when `explainVisible` is false
  - [x] Test: Explain answer absent when `explainVisible` is true
  - [x] Test: Selecting Explain calls `generateExplanation` with correct args
  - [x] Test: Explanation text rendered inline via `console.log`
  - [x] Test: After explain, nav re-renders without Explain option
  - [x] Test: After prev/next navigation, Explain is available again
  - [x] Test: Failed explain shows warning message, Explain stays available
  - [x] Verify all existing tests still pass (no regressions)

## Dev Notes

### Key Insight: `QuestionRecord` → `Question` Conversion

`generateExplanation(question: Question, userAnswer, settings)` expects a `Question` type (alias for `QuestionResponse`), which includes `speedThresholds`. However, `buildExplanationPrompt()` **does not use `speedThresholds`** at all — it only reads `question`, `options`, and `correctAnswer`.

**Solution:** Cast `QuestionRecord` to a `Question`-compatible object with dummy `speedThresholds`:

```typescript
const question: Question = {
  question: record.question,
  options: record.options,
  correctAnswer: record.correctAnswer,
  difficultyLevel: record.difficultyLevel,
  speedThresholds: { fastMs: 10000, slowMs: 30000 }, // unused by explain prompt
}
```

This is safe because `buildExplanationPrompt` never reads `speedThresholds` or `difficultyLevel` — it only uses `question`, `options`, `correctAnswer`, and `userAnswer`.

### Existing Pattern: Quiz Explain Flow

Follow the exact pattern from `screens/quiz.ts` → `handleExplain()`:

```typescript
// From quiz.ts — this is the pattern to replicate in history:
const explainSpinner = ora('Generating explanation...').start()
const explainResult = await generateExplanation(question, userAnswer, settings)
  .finally(() => explainSpinner.stop())
if (explainResult.ok) {
  console.log(`\n${explainResult.data}\n`)
} else {
  console.warn(warn('Could not generate explanation.'))
}
```

### Key Difference from Quiz Flow

In the quiz, after explaining, the user gets a two-option prompt (Next/Exit) and Explain is never offered again for the same question.

In history, the behavior is different:
- After explaining, the **same navigation prompt** re-appears but **without Explain** (since explanation is visible on screen)
- If the user navigates away (`prev`/`next`) and returns, **Explain is available again** (the screen was re-rendered, explanation is no longer visible)
- On failure, Explain **stays available** (explanation was not displayed)

### Implementation Strategy for `explainVisible`

```typescript
// In navigateHistory loop:
let explainVisible = false

while (true) {
  if (!explainVisible) {
    // Full re-render: clear + banner + question detail
    clearAndBanner()
    console.log(header(`📜 Question History — ${domainSlug}`))
    displayEntry(history[index])
  }
  // else: explanation was just printed inline — don't re-render

  const choices = buildPageChoices(index, totalItems, explainVisible)
  // ...select...

  if (nav === 'explain') {
    // Spinner + generateExplanation inline (no clearAndBanner)
    // On success: explainVisible = true → loop continues, re-renders choices without Explain
    // On failure: explainVisible = false → loop continues, re-renders choices with Explain
  } else if (nav === 'next' || nav === 'prev') {
    explainVisible = false  // reset on any navigation
    index += nav === 'next' ? 1 : -1
  } else {
    // back → return to domain menu
  }
}
```

### File Changes Summary

| File | Action |
|---|---|
| `src/screens/history.ts` | Modify — add explain flow to navigation loop |
| `src/screens/history.test.ts` | Modify — add explain test cases |

No other files need changes. `generateExplanation`, `buildExplanationPrompt`, `renderQuestionDetail`, `readSettings`, schemas — all already exist and work correctly.

### Imports to Add in `history.ts`

```typescript
import { generateExplanation, type Question } from '../ai/client.js'
import ora from 'ora'
import { readSettings } from '../domain/store.js'
import { defaultSettings } from '../domain/schema.js'
```

Note: `warn` from `../utils/format.js` is already imported. `readDomain`, `defaultDomainFile`, `clearAndBanner`, `header`, `dim`, `menuTheme` are already imported.

### Testing Standards

- Co-located tests: `src/screens/history.test.ts`
- Mock pattern: `vi.mock('@inquirer/prompts')`, `vi.mock('../domain/store.js')`, `vi.mock('../router.js')` — add `vi.mock('../ai/client.js')` for `generateExplanation`
- Navigation mock: `mockSelect.mockResolvedValueOnce('explain').mockResolvedValueOnce('back')`
- Console spy: `vi.spyOn(console, 'log')` and `vi.spyOn(console, 'warn')` for explanation text and error messages
- Follow chained `mockResolvedValueOnce` pattern from existing nav tests

### Project Structure Notes

- Only `src/screens/history.ts` and `src/screens/history.test.ts` are modified
- No new files, no schema changes, no router changes, no utility changes
- ESM import extensions (`.js`) must be preserved
- `ora` is already a project dependency (used in quiz.ts)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 6] — "Selecting Explain answer calls the AI provider to generate a concise explanation"
- [Source: docs/planning-artifacts/epics.md#Story 4.3] — Acceptance criteria for Explain Answer from History
- [Source: docs/planning-artifacts/epics.md#FR37] — Functional requirement definition
- [Source: src/screens/history.ts] — Current implementation: `navigateHistory` loop, `buildPageChoices`, `displayEntry`, `NavAction` type
- [Source: src/screens/quiz.ts] — `handleExplain()` pattern to replicate
- [Source: src/ai/client.ts#generateExplanation] — `(question: Question, userAnswer: AnswerOption, settings?: SettingsFile) → Promise<Result<string>>`
- [Source: src/ai/prompts.ts#buildExplanationPrompt] — Does NOT use `speedThresholds` — safe to pass dummy values
- [Source: docs/implementation-artifacts/4-3-single-question-history-navigation.md] — Previous story dev notes and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Type check: `tsc --noEmit` passed with zero errors after implementation
- History tests: 33/33 passed (up from 27 baseline)
- Full suite: 649/649 passed across 25 files — zero regressions

### Completion Notes List

- **Task 1 — NavAction + buildPageChoices:** Extended `NavAction` union with `'explain'`. Added optional `explainVisible?: boolean` third parameter to `buildPageChoices`. Explain choice inserted between Next and Back, hidden when `explainVisible` is truthy.
- **Task 2 — Settings loading:** Settings loaded via `readSettings()` inside `navigateHistory` (not `showHistory`) to keep settings scoped to navigation. Falls back to `defaultSettings()` on read failure.
- **Task 3 — Explain flow:** Added `explainVisible` state variable, reset to `false` on prev/next navigation. On explain: constructs `Question` from `QuestionRecord` with dummy `speedThresholds` (unused by `buildExplanationPrompt`), shows `ora` spinner, calls `generateExplanation`, prints result inline (no `clearAndBanner`), sets `explainVisible = true`. On failure: warns and sets `skipClear = true` so the warning persists on screen until the next navigation action.
- **Code review fix:** Added `skipClear` flag to prevent `clearAndBanner()` from wiping the failure warning before the user can read it. Added `clearAndBanner` call-count assertion to the failure test.
- **Task 4 — Tests:** Added 6 new explain-specific tests + 2 new `buildPageChoices` tests for `explainVisible`. Updated 4 existing tests to account for new `explain` option in navigation choices. Added mocks for `generateExplanation` and `readSettings`. All 33 history tests pass. Full suite: 649/649.

### File List

- `src/screens/history.ts` (modified)
- `src/screens/history.test.ts` (modified)
