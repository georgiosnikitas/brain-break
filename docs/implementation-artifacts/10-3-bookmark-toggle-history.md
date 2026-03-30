# Story 10.3: Bookmark Toggle in History Navigation

Status: done

## Story

As a user,
I want a Bookmark / Remove bookmark option in the history navigation so I can flag past questions for targeted review,
So that I can curate my study list from my full question history.

## Acceptance Criteria

1. When viewing a question in the history screen, the navigation controls include: Explain answer (or Teach me more if explain visible), Previous, Next, Bookmark (or Remove bookmark if already bookmarked), and Back
2. Selecting "⭐ Bookmark" sets `bookmarked` to `true` on the current question record, updates the domain file via `writeDomain()` immediately, shows a ⭐ indicator next to the question text, and re-renders the navigation menu with "⭐ Remove bookmark"
3. Selecting "⭐ Remove bookmark" sets `bookmarked` to `false`, updates the domain file immediately, removes the ⭐ indicator, and re-renders with "⭐ Bookmark"
4. The Bookmark/Remove bookmark option persists through explanation and micro-lesson states
5. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `'bookmark'` to `NavAction` type in `screens/history.ts` (AC: #1)
  - [x] Extend `NavAction` union: `'next' | 'prev' | 'back' | 'explain' | 'teach' | 'bookmark'`
- [x] Task 2: Update `buildPageChoices()` to include Bookmark option (AC: #1, #4)
  - [x] Add `bookmarked: boolean` parameter to `buildPageChoices()`
  - [x] Add "⭐ Bookmark" / "⭐ Remove bookmark" choice — positioned after Explain/Teach, before Previous/Next
  - [x] The bookmark choice renders in all states: default, post-explain, post-teach
  - [x] Update tests in `screens/history.test.ts`
- [x] Task 3: Add bookmark toggle logic in `navigateHistory()` loop (AC: #2, #3)
  - [x] When `nav === 'bookmark'`: toggle `history[index].bookmarked`, rebuild the domain object with the updated record, call `writeDomain()`, set `skipClear = true` so the menu re-renders without a full screen clear (matches quiz pattern)
  - [x] Import `writeDomain` from `../domain/store.js`
  - [x] Import `readDomain` if not already imported (need full domain to call `writeDomain()`)
  - [x] The domain data must be loaded at navigation start and kept in sync — when `bookmarked` is toggled, update both the local `history` array and the full domain object, then persist
  - [x] Update tests in `screens/history.test.ts`
- [x] Task 4: Update question display in history to show ⭐ indicator (AC: #2, #3)
  - [x] In `displayEntry()` or the equivalent history rendering function, prepend "⭐ " to the question text when `record.bookmarked === true`
  - [x] Update tests in `screens/history.test.ts`

## Dev Notes

### Pattern to Follow

History navigation already has a `while(true)` loop with a `switch`/`if-else` on `NavAction`. The bookmark toggle follows the same pattern as Previous/Next — it updates state and continues the loop:

```
navigateHistory loop:
  → render question + detail
  → select nav action (with bookmark option)
  → 'bookmark' → toggle record.bookmarked → writeDomain() → continue loop (re-renders)
  → 'explain' → handleExplain() → set explainVisible → continue loop
  → 'next'/'prev' → update index → continue loop
  → 'back'/null → break
```

### Key Implementation Details

**`buildPageChoices()` update:**
```ts
export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
  explainVisible?: boolean,
  teachVisible?: boolean,
  bookmarked?: boolean,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (!explainVisible) choices.push({ name: '💡 Explain answer', value: 'explain' })
  if (explainVisible && !teachVisible) choices.push({ name: '📚 Teach me more', value: 'teach' })
  choices.push({ name: bookmarked ? '⭐ Remove bookmark' : '⭐ Bookmark', value: 'bookmark' })
  if (currentIndex < totalItems - 1) choices.push({ name: '➡️  Next question', value: 'next' })
  if (currentIndex > 0) choices.push({ name: '⬅️  Previous question', value: 'prev' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '←  Back', value: 'back' })
  return choices
}
```

**Domain data management in `navigateHistory()`:**
- Currently `navigateHistory()` receives only `history: QuestionRecord[]` and `domainSlug: string`
- For bookmark toggle, we need the full `DomainFile` to call `writeDomain()` — consider changing the signature to accept `domain: DomainFile` or reading-and-caching it once at navigation start
- When toggling: update `history[index]` in the local array AND `domain.history[historyIndex]` in the full domain, then persist
- Note: `history` in `navigateHistory` may be a reversed copy or the full array — verify the index mapping

**⭐ indicator in question display:**
- `displayEntry()` in `history.ts` renders the question text via `console.log()` and then calls `renderQuestionDetail(record, { showTimestamp: true })`
- Prepend `⭐ ` to the question text line when `record.bookmarked === true`

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/screens/history.ts` | Update `NavAction` type, `buildPageChoices()`, `navigateHistory()` loop, `displayEntry()` |
| `src/screens/history.test.ts` | Add/update tests for bookmark in choices, toggle persists, ⭐ indicator, all nav states |

### Testing Standards

- Co-located `*.test.ts` files
- `vi.mock()` for external deps (`@inquirer/prompts`, `../domain/store.js`, `../router.js`, `../ai/client.js`)
- Test: bookmark choice present in default/explain/teach states, toggle updates record and calls `writeDomain()`, Remove bookmark shown when bookmarked, ⭐ indicator shown/hidden
- Test `buildPageChoices()` with `bookmarked: true` and `bookmarked: false`

### What NOT to Do

- Do NOT modify `screens/quiz.ts` — that's Story 10.2
- Do NOT create `screens/bookmarks.ts` — that's Story 10.4
- Do NOT modify `screens/domain-menu.ts` or `router.ts` — that's Story 10.4
- Do NOT change the history navigation order (Previous/Next) or unrelated behavior

### Project Structure Notes

- ESM with `.js` extensions in imports
- TypeScript strict mode
- `Result<T>` pattern — no raw `throw` in screens
- All `select()` calls use `menuTheme` and catch `ExitPromptError`
- `buildPageChoices()` is exported (used by tests directly)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 16 — Question Bookmarking]
- [Source: docs/planning-artifacts/prd.md#Feature 6 — View History (navigation controls)]
- [Source: docs/planning-artifacts/epics.md#Story 10.3]
- [Source: docs/planning-artifacts/epics.md#FR42]
- [Source: src/screens/history.ts#buildPageChoices — function to modify]
- [Source: src/screens/history.ts#navigateHistory — loop to update]
- [Source: src/screens/history.ts#NavAction — type to extend]
- [Source: docs/implementation-artifacts/4-3-single-question-history-navigation.md — history navigation pattern]
- [Source: docs/implementation-artifacts/4-4-explanation-drill-down-history.md — explain/teach in history]

## Dev Agent Record

### Implementation Plan

- Leveraged the fact that `[...domain.history].reverse()` creates a shallow copy sharing object references with `domain.history`. Toggling `history[index].bookmarked` in-place automatically updates `domain.history[...]`, so `writeDomain(domainSlug, domain)` persists the correct state without manual index mapping.
- `navigateHistory()` signature extended to accept `domain: DomainFile` (passed from `showHistory`). `domainSlug` retained for `writeDomain()` call and `router.showDomainMenu()`.
- `buildPageChoices()` now always includes the ⭐ bookmark choice regardless of explain/teach state (AC #4), positioned between explain/teach options and next/prev navigation.
- `displayEntry()` prepends `⭐ ` to `record.question` when `record.bookmarked === true`.
- Two existing tests updated: `toEqual(['back'])` → `toEqual(['bookmark', 'back'])` where bookmark is always present.

### Completion Notes

- All 4 tasks implemented and tested. 67 tests in `history.test.ts` (24 new/updated), all passing.
- Full suite: 760 tests, 0 regressions.
- ACs 1–5 satisfied.
- Post-implementation: aligned bookmark toggle with quiz pattern — `skipClear = true` (no full re-render), added `writeDomain` failure warning, added 2 additional tests.

## File List

- `src/screens/history.ts` — modified: `NavAction` type, `buildPageChoices()`, `displayEntry()`, `navigateHistory()`, `showHistory()`
- `src/screens/history.test.ts` — modified: store mock, writeDomain import/mock, 4 updated tests, 22 new tests (3 new describe blocks)

## Change Log

- 2026-03-30: Implemented Story 10-3 — bookmark toggle in history navigation. Extended `NavAction`, updated `buildPageChoices` with bookmark param, added ⭐ indicator in `displayEntry`, added bookmark toggle in `navigateHistory` with `writeDomain` persistence.
- 2026-03-30: Aligned bookmark toggle with quiz pattern — `skipClear = true` (no full screen re-render on toggle), added `writeDomain` failure warning, updated/added 4 tests.
