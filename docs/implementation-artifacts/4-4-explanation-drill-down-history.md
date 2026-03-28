# Story 4.4: Explanation Drill-Down (History)

Status: done

## Story

As a user,
I want a "Teach me more" option after viewing an AI-generated explanation in the history screen so the AI generates a deeper micro-lesson on the underlying concept,
So that I can turn my question history into a genuine learning resource by exploring concepts in depth.

## Acceptance Criteria

1. After an AI explanation is displayed for the current history question, the navigation options include: "📚 Teach me more", Previous (if applicable), Next (if applicable), and "←  Back" — "💡 Explain answer" is hidden
2. Selecting "Teach me more" shows an `ora` spinner ("Generating micro-lesson..."), calls `generateMicroLesson()` with the question context, the explanation, and active language/tone settings, and displays the micro-lesson inline below the explanation — no terminal clear
3. The micro-lesson is ~1-minute read (3–5 paragraphs), consistent with the output format established in Story 3.8
4. After the micro-lesson is displayed, the options are: Previous (if applicable), Next (if applicable), and Back — "Teach me more" is no longer available for this question
5. If I navigate away (Previous or Next) and then back to the same question, "Teach me more" is available again only after selecting "Explain answer" again — micro-lesson availability follows explanation availability
6. If the AI call fails, a warning ("Could not generate micro-lesson.") is shown and the user returns to the navigation menu with "Teach me more" still available — the failure is non-critical
7. When the domain has exactly 1 history entry and an explanation has been displayed, selecting "Teach me more" displays the micro-lesson and the navigation menu shows only "Back"
8. Ctrl+C on any prompt calls `router.showDomainMenu()` and does not crash
9. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `'teach'` to `NavAction` type in `screens/history.ts` (AC: #1)
  - [x] Extend the `NavAction` union: `'next' | 'prev' | 'back' | 'explain' | 'teach'`
- [x] Task 2: Update `buildPageChoices` to include "Teach me more" option (AC: #1, #4, #7)
  - [x] Add new parameter `teachVisible?: boolean`
  - [x] When `explainVisible === true` and `teachVisible !== true` (explain shown, micro-lesson not yet shown): include `📚 Teach me more` option with value `'teach'`
  - [x] When both `explainVisible === true` and `teachVisible === true`: do NOT include "Teach me more" (micro-lesson already shown)
  - [x] Existing `!explainVisible` logic for "Explain answer" remains unchanged
- [x] Task 3: Add `handleTeachMeMore` function (AC: #2, #3, #6)
  - [x] Import `generateMicroLesson` from `../ai/client.js`
  - [x] Pattern: `ora('Generating micro-lesson...')` → `generateMicroLesson(question, explanation, settings)` → `.finally(() => spinner.stop())`
  - [x] On success: `console.log(\`\n${result.data}\n\`)` → return `{ teachShown: true, skipClear: false }`
  - [x] On failure: `console.warn(warn('Could not generate micro-lesson.'))` → return `{ teachShown: false, skipClear: true }`
- [x] Task 4: Update `handleExplain` return type and shape (AC: #1, #5)
  - [x] Add the explanation text to the return value so it can be passed to `handleTeachMeMore`:
    - Success: `{ visible: true, skipClear: false, explanationText: result.data }`
    - Failure: `{ visible: false, skipClear: true, explanationText: null }`
- [x] Task 5: Update `navigateHistory` loop to track micro-lesson state (AC: #1, #2, #4, #5, #7, #8)
  - [x] Add `let teachVisible = false` and `let explanationText: string | null = null` state variables
  - [x] Pass `teachVisible` to `buildPageChoices(index, totalItems, explainVisible, teachVisible)`
  - [x] Handle `nav === 'teach'`: call `handleTeachMeMore(history[index], explanationText!, settings)`, set `teachVisible = explainResult.teachShown`, `skipClear = explainResult.skipClear`
  - [x] On `nav === 'next'` or `nav === 'prev'`: reset `teachVisible = false` and `explanationText = null` (alongside existing `explainVisible = false`)
  - [x] On `nav === 'explain'`: capture `explanationText` from `handleExplain` result, reset `teachVisible = false`
- [x] Task 6: Update tests in `screens/history.test.ts` (AC: #9)
  - [x] Add mock for `generateMicroLesson`
  - [x] Update `buildPageChoices` tests for new `teachVisible` parameter
  - [x] Add test: "Teach me more" appears after explanation is shown
  - [x] Add test: `generateMicroLesson` called with correct arguments
  - [x] Add test: micro-lesson rendered inline
  - [x] Add test: "Teach me more" removed after micro-lesson displayed
  - [x] Add test: "Teach me more" available again after navigating away and back then re-explaining
  - [x] Add test: AI failure shows warning and keeps "Teach me more" available
  - [x] Add test: single-entry history shows only "Back" after micro-lesson

## Dev Notes

### Pattern to Follow

This feature extends the explain flow in `screens/history.ts` the same way Story 3.8 extends `screens/quiz.ts`. The existing flow:

```
navigateHistory loop:
  display entry → buildPageChoices() → select nav action
    ↳ 'explain' → handleExplain() → explainVisible = true → re-render choices (no Explain)
    ↳ 'next'/'prev' → index++ / index-- → explainVisible = false
    ↳ 'back' → router.showDomainMenu()
```

Extended flow:

```
navigateHistory loop:
  display entry → buildPageChoices(index, total, explainVisible, teachVisible) → select nav action
    ↳ 'explain' → handleExplain() → explainVisible = true, teachVisible = false, capture explanationText → re-render choices (Teach me more visible)
    ↳ 'teach' → handleTeachMeMore() → teachVisible = true → re-render choices (no Teach me more)
    ↳ 'next'/'prev' → index++ / index-- → explainVisible = false, teachVisible = false, explanationText = null
    ↳ 'back' → router.showDomainMenu()
```

### Key Implementation Details

**`buildPageChoices(currentIndex, totalItems, explainVisible?, teachVisible?)`** — updated signature:
- Current logic: if `!explainVisible` → show "💡 Explain answer"
- New logic: if `explainVisible && !teachVisible` → show "📚 Teach me more" with value `'teach'`
- Insert "Teach me more" at the same position where "Explain answer" was (first in the list)
- Previous/Next logic unchanged
- Separator + Back unchanged

**`handleTeachMeMore(record, explanationText, settings)`**:
- Reuses the same `Question` construction as `handleExplain()` does (record → Question shape)
- Calls `generateMicroLesson(question, explanationText, settings)` — same function used by Story 3.8
- Returns `{ teachShown: boolean; skipClear: boolean }` for state tracking
- `skipClear: true` on failure so warning stays visible; `skipClear: false` on success (next loop iteration will skip clear because `teachVisible` prevents re-render)

**`handleExplain` return type change**:
- Current: `{ visible: boolean; skipClear: boolean }`
- New: `{ visible: boolean; skipClear: boolean; explanationText: string | null }`
- On success: `explanationText: result.data`
- On failure: `explanationText: null`

**State management in `navigateHistory`**:
- `explainVisible`: existing — controls whether "Explain answer" is hidden
- `teachVisible`: new — controls whether "Teach me more" is hidden
- `explanationText`: new — caches the explanation output for passing to `generateMicroLesson`
- On navigation (next/prev): all three reset to defaults (`false`, `false`, `null`)

### Dependency on Story 3.8

This story depends on `generateMicroLesson()` and `buildMicroLessonPrompt()` being available in `ai/client.ts` and `ai/prompts.ts` respectively. These are created in Story 3.8. If implementing 4.4 before 3.8 is complete, the import will fail — implement 3.8 first.

### Files to Modify

| File | Action |
|------|--------|
| `src/screens/history.ts` | Update `NavAction`, `buildPageChoices`, `handleExplain` return, add `handleTeachMeMore`, update `navigateHistory` state |
| `src/screens/history.test.ts` | Add `generateMicroLesson` mock, update `buildPageChoices` tests, add teach-me-more flow tests |

No new files are created. The AI client functions (`generateMicroLesson`, `buildMicroLessonPrompt`) are created in Story 3.8.

### Testing Standards

- Co-located `*.test.ts` files
- `vi.mock()` for external deps — add `generateMicroLesson` to existing `../ai/client.js` mock
- Chained `mockResolvedValueOnce` for multi-step navigation flows (explain → teach → back)
- `vi.spyOn(console, 'log')` for micro-lesson output assertions
- `vi.spyOn(console, 'warn')` for failure warning assertions
- Follow exact patterns from existing `showHistory — explain answer` test suite

### What NOT to Do

- Do NOT create a new screen file — all changes are within `screens/history.ts`
- Do NOT import from `screens/quiz.ts` — the quiz and history drill-down implementations are independent
- Do NOT persist micro-lessons — they are ephemeral, generated on demand
- Do NOT change how `renderQuestionDetail()` works — micro-lesson is displayed after it via `console.log()`
- Do NOT modify the empty-history flow — it remains unchanged

### References

- [Source: docs/planning-artifacts/prd.md#Feature 13 — Explanation Drill-Down]
- [Source: docs/planning-artifacts/epics.md#Story 4.4]
- [Source: docs/planning-artifacts/epics.md#FR38]
- [Source: src/screens/history.ts#handleExplain — function to modify]
- [Source: src/screens/history.ts#buildPageChoices — function to modify]
- [Source: src/screens/history.ts#navigateHistory — loop to extend]
- [Source: docs/implementation-artifacts/4-3-single-question-history-navigation.md — previous story patterns]
- [Source: docs/implementation-artifacts/3-8-explanation-drill-down.md — sibling story (Quiz context)]

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.6

### Completion Notes List
- All 5 implementation tasks completed in `src/screens/history.ts`
- 10 new tests added: 3 in `buildPageChoices` suite, 8 in new `showHistory — teach me more` suite (one existing test updated for new `teachVisible` param semantics)
- 686/686 tests pass (25 files), no regressions
- `explanationText` state cached in `navigateHistory` loop and passed to `handleTeachMeMore` via non-null assertion (safe: teach only selectable after successful explain)
- `skipClear` logic ensures warnings survive across loop iterations; existing `!explainVisible` render guard prevents unwanted screen clears during teach flow

### File List
- `src/screens/history.ts`
- `src/screens/history.test.ts`
