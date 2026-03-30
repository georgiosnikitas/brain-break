# Story 10.2: Bookmark Toggle in Quiz Post-Answer

Status: done

## Story

As a user,
I want a Bookmark / Remove bookmark option in the quiz post-answer navigation so I can flag interesting or tricky questions during the quiz,
So that I can build a curated list of questions to revisit later without interrupting my quiz flow.

## Acceptance Criteria

1. After answering a quiz question, four options are shown: "▶️  Next question", "💡 Explain answer", "⭐ Bookmark" (or "⭐ Remove bookmark" if already bookmarked), and "←  Back"
2. Selecting "⭐ Bookmark" sets `bookmarked` to `true` on the current question record, updates the domain file via `writeDomain()` immediately, and re-renders the navigation menu with "⭐ Remove bookmark"
3. Selecting "⭐ Remove bookmark" sets `bookmarked` to `false`, updates the domain file immediately, and re-renders the navigation menu with "⭐ Bookmark"
4. After an explanation is displayed, four options are shown: "📚 Teach me more", "⭐ Bookmark" (or "⭐ Remove bookmark"), "▶️  Next question", and "←  Back"
5. After a micro-lesson is displayed, three options are shown: "▶️  Next question", "⭐ Bookmark" (or "⭐ Remove bookmark"), and "←  Back" — Teach me more is removed
6. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Update `askPostAnswerAction()` to include Bookmark option (AC: #1, #2, #3)
  - [x] Add `'bookmark'` to the `PostAnswerAction` type (and to the select type parameter)
  - [x] Add "⭐ Bookmark" choice in the `select()` choices array — positioned after Explain answer, before the Separator
  - [x] Accept a `bookmarked: boolean` parameter to dynamically render "⭐ Bookmark" or "⭐ Remove bookmark"
  - [x] Update tests in `screens/quiz.test.ts`
- [x] Task 2: Add bookmark toggle logic in the quiz loop (AC: #2, #3)
  - [x] When `askPostAnswerAction()` returns `'bookmark'`: toggle `record.bookmarked`, call `writeDomain()`, and loop back to `askPostAnswerAction()` — no screen clear or re-render, preserving inquirer's resolved selection history in the terminal
  - [x] Same pattern applied to the post-explain and post-teach bookmark loops
  - [x] Update tests in `screens/quiz.test.ts`
- [ ] Task 3: ~~Update `renderQuestionDetail()` to show ⭐ indicator~~ — N/A: screen is not re-rendered on bookmark toggle (by design, to preserve terminal history). `renderQuestionDetail()` was not modified.
- [x] Task 4: Update `askPostExplainAction()` to include Bookmark option (AC: #4)
  - [x] Add `'bookmark'` to the return type
  - [x] Add "⭐ Bookmark" / "⭐ Remove bookmark" choice — positioned after Teach me more, before Next question
  - [x] Accept a `bookmarked: boolean` parameter
  - [x] When `'bookmark'` is returned in the post-explain flow, toggle + persist + re-render, then loop back to `askPostExplainAction()`
  - [x] Update tests in `screens/quiz.test.ts`
- [x] Task 5: Update post-micro-lesson navigation with Bookmark option (AC: #5)
  - [x] Update `askNextOrExit()` (or create a new function) to include the Bookmark option after micro-lesson
  - [x] Accept a `bookmarked: boolean` parameter for dynamic label
  - [x] When `'bookmark'` is returned, toggle + persist + re-render, loop back
  - [x] Update tests in `screens/quiz.test.ts`

## Dev Notes

### Pattern to Follow

The bookmark toggle follows a **re-render loop** pattern: when the user selects Bookmark, the action is applied immediately and the navigation prompt is re-displayed — similar to how history navigation re-renders on Previous/Next.

```
askPostAnswerAction(bookmarked) → 4 options (Explain / Next / Bookmark / Back)
  ↳ "bookmark" → toggle record.bookmarked → writeDomain() → re-render → askPostAnswerAction(bookmarked)
  ↳ "explain" → handleExplain() → ...
  ↳ "next" → continue quiz
  ↳ "exit" → exit quiz
```

### Key Implementation Details

**`askPostAnswerAction(bookmarked: boolean)`** — updated signature:
```ts
async function askPostAnswerAction(bookmarked: boolean): Promise<'explain' | 'bookmark' | 'next' | 'exit' | null> {
  try {
    return await select<'explain' | 'bookmark' | 'next' | 'exit'>({
      message: 'Next action:',
      choices: [
        { name: '💡 Explain answer', value: 'explain' as const },
        { name: bookmarked ? '⭐ Remove bookmark' : '⭐ Bookmark', value: 'bookmark' as const },
        { name: '▶️  Next question', value: 'next' as const },
        new Separator(),
        { name: '←  Back', value: 'exit' as const },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}
```

**Bookmark toggle in the quiz loop:**
```ts
// After rendering feedback and entering the action loop:
let nextAction: PostAnswerAction = await askPostAnswerAction(record.bookmarked)

while (nextAction === 'bookmark') {
  record.bookmarked = !record.bookmarked
  // Update the record in domain.history (it's the last element)
  domain = { ...domain, history: [...domain.history.slice(0, -1), record] }
  const writeResult = await writeDomain(domainSlug, domain)
  if (!writeResult.ok) console.warn(warn(`Failed to save bookmark: ${writeResult.error}`))
  // Re-render the question with updated ⭐ indicator
  clearAndBanner()
  console.log(header(`🧠 Quiz — ${domainSlug}`))
  console.log(`\n${record.bookmarked ? '⭐ ' : ''}${record.question}\n`)
  renderQuestionDetail(record)
  nextAction = await askPostAnswerAction(record.bookmarked)
}
```

**`renderQuestionDetail()` update** in `utils/format.ts`:
- The `record` parameter already has `bookmarked`. When `record.bookmarked === true`, prepend `⭐ ` to the question text line that renders above the options.
- Note: `renderQuestionDetail()` currently does NOT render the question text — it only renders options + feedback. The question text is rendered separately by each screen. So the ⭐ indicator should be handled in the quiz loop when printing the question, not in `renderQuestionDetail()`.

**Actually — re-assess:** Check if `renderQuestionDetail()` renders the question text or not. Based on the source, it only renders options A-D, correct/incorrect status, and score line. The question text itself is rendered by the calling screen. So the ⭐ indicator goes in the quiz screen's question rendering, not in `renderQuestionDetail()`.

**Post-explain and post-teach flows:**
- `askPostExplainAction()` gains the same `bookmarked` parameter and `'bookmark'` return value
- `askNextOrExit()` (called after micro-lesson) gains the same — or a new `askPostTeachAction(bookmarked)` is introduced
- On bookmark toggle in these flows, re-render the screen and re-display the prompt

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/screens/quiz.ts` | Update `askPostAnswerAction()`, `askPostExplainAction()`, post-micro-lesson nav; add bookmark toggle loop |
| `src/screens/quiz.test.ts` | Add/update tests for bookmark toggle, re-render, all nav states |
| `src/utils/format.ts` | Potentially update `renderQuestionDetail()` if ⭐ indicator belongs there |
| `src/utils/format.test.ts` | Add tests for ⭐ indicator if `renderQuestionDetail()` is changed |

### Testing Standards

- Co-located `*.test.ts` files
- `vi.mock()` for external deps (`@inquirer/prompts`, `../domain/store.js`, `../router.js`)
- Chained `mockResolvedValueOnce` for multi-step navigation flows (bookmark → next)
- Test: bookmark toggle updates record and calls `writeDomain()`, Remove bookmark available when bookmarked, ⭐ indicator shown/hidden, bookmark option in all 3 nav states (post-answer, post-explain, post-teach), Ctrl+C returns null

### What NOT to Do

- Do NOT modify `screens/history.ts` — that's Story 10.3
- Do NOT create `screens/bookmarks.ts` — that's Story 10.4
- Do NOT modify `screens/domain-menu.ts` or `router.ts` — that's Story 10.4

### Project Structure Notes

- ESM with `.js` extensions in imports
- TypeScript strict mode
- `Result<T>` pattern — no raw `throw` in screens
- All `select()` calls use `menuTheme` and catch `ExitPromptError`

### References

- [Source: docs/planning-artifacts/prd.md#Feature 16 — Question Bookmarking]
- [Source: docs/planning-artifacts/prd.md#Feature 3 — Interactive Quiz Session (navigation options)]
- [Source: docs/planning-artifacts/epics.md#Story 10.2]
- [Source: docs/planning-artifacts/epics.md#FR42]
- [Source: src/screens/quiz.ts#askPostAnswerAction — function to modify]
- [Source: src/screens/quiz.ts#askPostExplainAction — function to modify]
- [Source: src/screens/quiz.ts#handleExplain — flow to update]
- [Source: src/utils/format.ts#renderQuestionDetail — potential update]
- [Source: docs/implementation-artifacts/3-4-answer-explanation.md — post-answer action pattern]
- [Source: docs/implementation-artifacts/3-8-explanation-drill-down.md — post-explain action pattern]
