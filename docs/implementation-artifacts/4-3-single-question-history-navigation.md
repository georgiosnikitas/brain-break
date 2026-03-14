# Story 4.3: Single-Question History Navigation

Status: done

## Story

As a user,
I want to browse my question history one question at a time using Previous and Next controls with a progress indicator,
so that I can focus on each question individually and clearly see where I am in my history.

## Acceptance Criteria

1. **Given** I open View History for a domain with at least one answered question,  
   **When** `screens/history.ts` loads,  
   **Then** the first (most recent) question is displayed with a header showing "Question 1 of N" (where N is the total number of history entries).

2. **Given** I am viewing any question that is not the last,  
   **When** the navigation prompt is rendered,  
   **Then** a "Next" option is available.

3. **Given** I am viewing any question that is not the first,  
   **When** the navigation prompt is rendered,  
   **Then** a "Previous" option is available.

4. **Given** I am on the first (most recent) question,  
   **When** the navigation prompt is rendered,  
   **Then** "Previous" is NOT present and "Next" + "Back" are the only options (assuming N > 1).

5. **Given** I am on the last (oldest) question,  
   **When** the navigation prompt is rendered,  
   **Then** "Next" is NOT present and "Previous" + "Back" are the only options.

6. **Given** the domain has exactly one history entry,  
   **When** I view history,  
   **Then** only "Back" is shown — no "Previous", no "Next" — and the header shows "Question 1 of 1".

7. **Given** the domain has no history entries,  
   **When** I navigate to View History,  
   **Then** the "No questions answered yet" message and "Back" control are displayed, unchanged from current behaviour.

8. **Given** any question is displayed,  
   **Then** all existing fields are shown exactly as before: question text, all four options (A–D), the user's chosen answer, the correct answer, correct/incorrect status icon, time taken (ms → formatted), speed tier, score delta, difficulty level, and answered-at timestamp.

9. **Given** I select "Next",  
   **When** the screen updates,  
   **Then** the next question (older) is shown and the progress header reads "Question N+1 of Total".

10. **Given** I select "Previous",  
    **When** the screen updates,  
    **Then** the previous question (more recent) is shown and the progress header reads "Question N-1 of Total".

11. **Given** I select "Back" from any question,  
    **Then** `router.showHome()` is called and I return to the home screen.

12. **Given** I press Ctrl+C at any point in the history screen,  
    **Then** `ExitPromptError` is caught, `router.showHome()` is called, and the app does not crash.

## Tasks / Subtasks

- [x] Refactor `navigateHistory` in `src/screens/history.ts` (AC: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12)
  - [x] Remove `PAGE_SIZE` constant (or retain as a deprecated export `0` if needed for test migration — see Dev Notes)
  - [x] Replace `totalPages = Math.ceil(history.length / PAGE_SIZE)` with `totalItems = history.length`
  - [x] Change loop variable from `page` to `index` (starts at 0)
  - [x] Display only `history[index]` (single entry) per iteration instead of a slice
  - [x] Update `header(...)` call to: `` `\nQuestion History — Question ${index + 1} of ${totalItems}` ``
  - [x] Update `select` message to: `` `Question ${index + 1} of ${totalItems}` ``
  - [x] Keep `buildPageChoices(index, totalItems)` call — function logic is identical; only the semantics of the arguments change (index replaces page, totalItems replaces totalPages)
  - [x] Update increment/decrement: `if (nav === 'next') index++` / `if (nav === 'prev') index--`

- [x] Update `src/screens/history.test.ts` (AC: all)
  - [x] Remove or replace all references to imported `PAGE_SIZE`
  - [x] Update `buildPageChoices` test suite comments (page → item/question) — logic is identical so no test logic changes needed
  - [x] Rewrite `showHistory — single page (≤ PAGE_SIZE)` suite → `showHistory — single question` suite:
    - Test that only the first entry (most recent) is rendered per call, not a list
    - Test that "Question 1 of N" appears in console output
    - Keep: `shows only Back navigation`, `selecting Back calls router.showHome`, `displays most-recent entry first`, `each entry log contains required fields`
  - [x] Rewrite `showHistory — multi-page` suite → `showHistory — navigation` suite:
    - Test: first question shows Next + Back, no Previous (AC4)
    - Test: selecting Next shows second question with updated header (AC9)
    - Test: selecting Previous after Next returns to first question (AC10)
    - Test: only ONE entry's content is logged per navigation step (not PAGE_SIZE entries) — confirm question for index N is shown, question for index N+1 is not
  - [x] Keep all existing tests for: empty history (AC7), corrupted domain (no change), ExitPromptError (AC12)

## Dev Notes

### Key File

**`src/screens/history.ts`** — the only file to change.

- **`PAGE_SIZE = 10`** (line 18): Remove this constant. The test file imports it (`import { ..., PAGE_SIZE } from './history.js'`), so the tests must be updated to remove that import as well.
- **`buildPageChoices(page, totalPages)`** (lines 26–35): **No logic changes needed.** This function is page-agnostic — it only checks `current > 0` and `current < total - 1`. Calling it as `buildPageChoices(index, totalItems)` produces the correct result. Optionally rename the parameters to `currentIndex`/`totalItems` for clarity.
- **`displayEntry(record, globalIndex)`** (lines 37–46): **No changes needed.** The `globalIndex` parameter controls the `#1 —` label. When showing a single question, pass `index` (the current position in the reversed history array). The `#1 —` label will still display correctly for the first question shown.
- **`navigateHistory(history)`** (lines 48–84): This is the only function that requires a material change. See Tasks above for the exact diff.
- **`showHistory(domainSlug)`** (lines 86–110): No changes needed; it calls `navigateHistory(history)` unchanged.

### Conceptual Diff for `navigateHistory`

```typescript
// BEFORE
const totalPages = Math.ceil(history.length / PAGE_SIZE)
let page = 0
while (true) {
  console.log(header(`\nQuestion History — Page ${page + 1} of ${totalPages}`))
  const start = page * PAGE_SIZE
  const pageEntries = history.slice(start, start + PAGE_SIZE)
  for (let i = 0; i < pageEntries.length; i++) {
    displayEntry(pageEntries[i], start + i)
  }
  const choices = buildPageChoices(page, totalPages)
  // ... select ...
  if (nav === 'next') page++
  else if (nav === 'prev') page--
}

// AFTER
const totalItems = history.length
let index = 0
while (true) {
  console.log(header(`\nQuestion History — Question ${index + 1} of ${totalItems}`))
  displayEntry(history[index], index)
  const choices = buildPageChoices(index, totalItems)
  // ... select ...
  if (nav === 'next') index++
  else if (nav === 'prev') index--
}
```

### Testing Standards

- All tests in `src/screens/history.test.ts` — co-located with source, no separate `__tests__/` folder.
- Mock pattern: `vi.mock('@inquirer/prompts')`, `vi.mock('../domain/store.js')`, `vi.mock('../router.js')` — preserve all three.
- `mockSelect.mockResolvedValueOnce('next').mockResolvedValueOnce('back')` pattern — use chained `mockResolvedValueOnce` for multi-step navigation tests.
- `vi.spyOn(console, 'log').mockReturnValue(undefined)` — use for all tests that check rendered output.
- Do **not** check for multi-entry output per call in the new tests — only one entry should be logged per navigation step.

### Project Structure Notes

- Only `src/screens/history.ts` and `src/screens/history.test.ts` are affected.
- No new files needed; no router, store, schema, or util changes required.
- ESM import extensions (`.js`) are already in place — do not change them.

### References

- [Source: src/screens/history.ts] — full implementation; key lines: 18 (`PAGE_SIZE`), 26–35 (`buildPageChoices`), 37–46 (`displayEntry`), 48–84 (`navigateHistory`)
- [Source: src/screens/history.test.ts] — 87 existing tests; imports `PAGE_SIZE` on line 26
- [Source: docs/planning-artifacts/prd.md#Feature 6] — updated requirement: "Questions are displayed one at a time; the user navigates with Previous and Next controls; a progress indicator shows the user's current position (e.g., 'Question 3 of 47')"
- [Source: docs/planning-artifacts/epics.md#Story 4.1] — original paginated story (superseded by this story for navigation behaviour)
- [Source: docs/planning-artifacts/architecture.md#Project Context Analysis] — Terminal rendering pattern: Inquirer.js `select` prompt for navigation choices

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4.6)

### Debug Log References

- RED test added: `showHistory — progress indicator > shows "Question 1 of 5"` — confirmed failing before implementation
- GREEN: `navigateHistory` refactored in `history.ts` — 1 test passing, 6 old tests failing as expected
- REFACTOR: all tests updated; duplicate RED suite removed; 21 history tests pass

### Completion Notes List

- **Task 1 — `src/screens/history.ts`:** Removed `PAGE_SIZE = 10` constant. Replaced page-based slice loop in `navigateHistory` with single-index display: `totalItems = history.length`, `index = 0`, `displayEntry(history[index], index)`. Header updated to `"Question ${index + 1} of ${totalItems}"`. `buildPageChoices` and `displayEntry` required zero logic changes.
- **Task 2 — `src/screens/history.test.ts`:** Removed `PAGE_SIZE` import. Replaced `showHistory — single page (≤ PAGE_SIZE)` suite with `showHistory — single question` (6 tests incl. new progress header test). Replaced `showHistory — multi-page` suite with `showHistory — navigation` (5 tests). All 4 other suites (buildPageChoices, formatTimestamp, empty history, corrupted domain, ExitPromptError) preserved unchanged.
- Final: **251 tests / 16 files — all pass**. Net +2 tests vs baseline (249).

### File List

- `src/screens/history.ts` (modified)
- `src/screens/history.test.ts` (modified)
- `docs/planning-artifacts/prd.md` (modified)
