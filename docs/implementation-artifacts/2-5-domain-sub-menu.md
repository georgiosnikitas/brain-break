---
Story: 2.5
Title: Domain Sub-Menu Navigation
Status: done
Epic: 2 — Domain Management
Created: 2026-03-14
---

# Story 2.3: Domain Sub-Menu Navigation

> **Supersedes**: `2-3-select-domain-motivational-message.md` (done, old flow).
> That file remains as a historical record; this story replaces the navigation behaviour.

## Story

As a user,
I want to select a domain on the home screen and be taken to a focused sub-menu for that domain,
So that the home screen stays clean and I can choose what to do (play, view history, view stats, or archive) from one central place.

## Acceptance Criteria

- [x] AC1: The home screen lists only active domains (slug + score + question count) plus "Create new domain", "View archived domains", and "Exit" — no Archive / History / Stats actions per domain
- [x] AC2: Selecting a domain on the home screen opens a **Domain Sub-Menu** screen for that domain, not a quiz
- [x] AC3: The Domain Sub-Menu header displays the domain slug, current score, and total question count
- [x] AC4: The Domain Sub-Menu offers exactly these actions in order: ▶ Play, 📜 View History, 📊 View Stats, 🗄 Archive, ← Back
- [x] AC5: Selecting "▶ Play" starts the quiz for that domain (same flow as before: motivational messages → question loop)
- [x] AC6: After the quiz session ends (Exit quiz, Ctrl-C), the user is returned to the Domain Sub-Menu for the same domain — not the home screen
- [x] AC7: Selecting "📜 View History" opens the history screen for that domain; pressing Back in history returns the user to the Domain Sub-Menu for the same domain
- [x] AC8: Selecting "📊 View Stats" opens the stats screen for that domain; pressing Back in stats returns the user to the Domain Sub-Menu for the same domain
- [x] AC9: Selecting "🗄 Archive" archives the domain and navigates to the home screen (which refreshes without the now-archived domain)
- [x] AC10: Selecting "← Back" navigates to the home screen
- [x] AC11: Pressing Ctrl-C on the Domain Sub-Menu navigates to the home screen

## Tasks / Subtasks

- [x] Task 1: Simplify `HomeAction` and `buildHomeChoices` in `src/screens/home.ts` (AC: 1, 2)
  - [x] 1.1 Remove `{ action: 'archive'; slug: string }`, `{ action: 'history'; slug: string }`, and `{ action: 'stats'; slug: string }` from the `HomeAction` union type — keep only `select`, `create`, `archived`, `exit`
  - [x] 1.2 In `buildHomeChoices`, remove the archive / history / stats pushes from the domain loop — each domain entry is now a single `select` choice only
  - [x] 1.3 In `handleHomeAction`, remove the `archive`, `history`, and `stats` branches; change `select` case to call `router.showDomainMenu(answer.slug)` instead of `router.showQuiz(answer.slug)`

- [x] Task 2: Create `src/screens/domain-menu.ts` (AC: 2, 3, 4, 5, 9, 10, 11)
  - [x] 2.1 Export `type DomainMenuAction = { action: 'play' } | { action: 'history' } | { action: 'stats' } | { action: 'archive' } | { action: 'back' }`
  - [x] 2.2 Export pure `buildDomainMenuChoices(): Array<{ name: string; value: DomainMenuAction }>` — returns exactly 5 choices in order: `▶ Play`, `📜 View History`, `📊 View Stats`, `🗄 Archive`, `← Back`; no Separators
  - [x] 2.3 Export `showDomainMenuScreen(slug: string): Promise<void>` with a `while(true)` loop:
    - Read domain via `readDomain(slug)`; on failure log `warn(...)` and use `defaultDomainFile()`
    - Compute `score = domain.meta.score`, `totalQuestions = domain.history.length`
    - Call `select<DomainMenuAction>({ message: <see formatting note below>, choices: buildDomainMenuChoices() })`
    - Dispatch: `play` → `await router.showQuiz(slug)` then continue loop; `history` → `await router.showHistory(slug)` then continue loop; `stats` → `await router.showStats(slug)` then continue loop; `archive` → `await router.archiveDomain(slug)`, then `await router.showHome()`, then `return`; `back` → `await router.showHome()`, then `return`
    - Catch `ExitPromptError` → `await router.showHome()`, `return`
  - [x] 2.4 **Message formatting**: `\n  🧠 ${bold(slug)}  ${dim(`score: ${score} · ${totalQuestions} questions`)}`  (use the same `bold` and `dim` helpers from `../utils/format.js`)

  > **Architecture note**: the `while(true)` loop mirrors `showHomeScreen`'s pattern. When history/stats/quiz call `router.showDomainMenu(slug)` on Back/Exit (Tasks 4–6), they start a fresh sub-menu loop — the waiting loop in the original call never resumes. This is identical to how home.ts works today and is intentional.

- [x] Task 3: Add `router.showDomainMenu` in `src/router.ts` (AC: 2)
  - [x] 3.1 Import `showDomainMenuScreen` from `./screens/domain-menu.js`
  - [x] 3.2 Export `async function showDomainMenu(slug: string): Promise<void> { await showDomainMenuScreen(slug) }`

- [x] Task 4: Update `src/screens/quiz.ts` to return to the Domain Sub-Menu (AC: 6)
  - [x] 4.1 In `showQuiz(domainSlug)`, replace `await router.showHome()` at line ~85 (network/parse error path) with `await router.showDomainMenu(domainSlug)`
  - [x] 4.2 In `showQuiz(domainSlug)`, replace `await router.showHome()` at line ~94 (ExitPromptError from `askQuestion`) with `await router.showDomainMenu(domainSlug)` — note: `askQuestion` returns `null` on ExitPromptError; the `if (answered === null)` guard handles it
  - [x] 4.3 In `showQuiz(domainSlug)`, replace `await router.showHome()` at line ~139 (exit/null from `askNextAction`) with `await router.showDomainMenu(domainSlug)`
  - [x] 4.4 Leave the auth error `process.exit(1)` path unchanged

- [x] Task 5: Update `src/screens/history.ts` to return to the Domain Sub-Menu (AC: 7)
  - [x] 5.1 In `navigateHistory`, replace `await router.showHome()` (the `back` branch and the ExitPromptError catch) with `await router.showDomainMenu(domainSlug)` — note: `navigateHistory` does not currently take `domainSlug`; thread it as a parameter from `showHistory`
  - [x] 5.2 In `showHistory(domainSlug)`, replace the two `await router.showHome()` calls (empty-history back and the final `navigateHistory` return path) with `await router.showDomainMenu(domainSlug)`
  - [x] 5.3 Thread `domainSlug` into `navigateHistory(history, domainSlug)` so the domain slug is available at every navigation point inside it

- [x] Task 6: Update `src/screens/stats.ts` to return to the Domain Sub-Menu (AC: 8)
  - [x] 6.1 In `showStats(domainSlug)`, replace both `await router.showHome()` calls (ExitPromptError catch and normal Back) with `await router.showDomainMenu(domainSlug)`

- [x] Task 7: Update `src/screens/home.test.ts` (AC: 1, 2)
  - [x] 7.1 Remove the 4 tests that assert archive/history/stats actions exist in `buildHomeChoices` per domain entry (they will no longer exist):
    - `'includes an archive action for each domain entry'`
    - `'archive action comes immediately after select for the same domain'`
    - `'includes a history action for each domain entry'`
    - `'history action comes after archive for the same domain'`
    - `'includes a stats action for each domain entry'`
    - `'stats action comes after history for the same domain'`
  - [x] 7.2 Add test: with one domain entry, `buildHomeChoices` produces exactly ONE `select` action for that domain and no `archive`/`history`/`stats` action
  - [x] 7.3 Update the `vi.mock('../router.js', ...)` factory: remove `showHistory` and `showStats` from the mock (they are no longer called from home); add `showDomainMenu: vi.fn()`
  - [x] 7.4 Update the `showHomeScreen — routing` describe block: remove the `it.each` cases for `'history'` and `'stats'`; add a test that selecting a domain calls `router.showDomainMenu` with the correct slug

- [x] Task 8: Create `src/screens/domain-menu.test.ts` (AC: 3, 4, 5, 9, 10, 11)
  - [x] 8.1 Mock dependencies: `@github/copilot-sdk`, `@inquirer/prompts` (`select` + `Separator`), `../domain/store.js` (`readDomain`), `../router.js` (all used functions)
  - [x] 8.2 `buildDomainMenuChoices` returns exactly 5 items (no Separators); names contain `'Play'`, `'History'`, `'Stats'`, `'Archive'`, `'Back'`; action values are `play`, `history`, `stats`, `archive`, `back` respectively
  - [x] 8.3 `showDomainMenuScreen` — Play: calls `router.showQuiz` with the correct slug
  - [x] 8.4 `showDomainMenuScreen` — History: calls `router.showHistory` with the correct slug
  - [x] 8.5 `showDomainMenuScreen` — Stats: calls `router.showStats` with the correct slug
  - [x] 8.6 `showDomainMenuScreen` — Archive: calls `router.archiveDomain` then `router.showHome`
  - [x] 8.7 `showDomainMenuScreen` — Back: calls `router.showHome`
  - [x] 8.8 `showDomainMenuScreen` — ExitPromptError: calls `router.showHome`
  - [x] 8.9 `showDomainMenuScreen` — message includes slug, score, and question count (read from domain)

## Dev Notes

### Navigation flow after this story

```
showHomeScreen()              ← while(true) loop
  → select domain
  → router.showDomainMenu(slug)
  → showDomainMenuScreen(slug) ← while(true) loop
      → "▶ Play"
        → router.showQuiz(slug)
        → showSelectDomainScreen(slug)  [motivational messages]
        → showQuiz(slug) [quiz.ts]
        → on exit/error → router.showDomainMenu(slug) [fresh sub-menu]
      → "📜 View History"
        → router.showHistory(slug)
        → showHistory(slug) [history.ts]
        → on back → router.showDomainMenu(slug) [fresh sub-menu]
      → "📊 View Stats"
        → router.showStats(slug)
        → showStats(slug) [stats.ts]
        → on back → router.showDomainMenu(slug) [fresh sub-menu]
      → "🗄 Archive"
        → router.archiveDomain(slug)
        → router.showHome() [home refreshes, domain is gone]
      → "← Back"
        → router.showHome()
```

### Exact lines to change in each file

**`src/screens/quiz.ts`** — 3 `router.showHome()` calls to change:
- Line ~85: `await router.showHome()` inside the network/parse error branch → `router.showDomainMenu(domainSlug)`
- Line ~94: `await router.showHome()` in the `if (answered === null)` guard → `router.showDomainMenu(domainSlug)`
- Line ~139: `await router.showHome()` in the `if (nextAction === null || nextAction === 'exit')` guard → `router.showDomainMenu(domainSlug)`
- Auth error `process.exit(1)` (line ~83): **do not touch**

**`src/screens/history.ts`** — Signature change + 3 `router.showHome()` changes:
- `navigateHistory` becomes `navigateHistory(history: QuestionRecord[], domainSlug: string)` — add parameter
- Line ~63: ExitPromptError catch inside `navigateHistory` → `router.showDomainMenu(domainSlug)`
- Line ~75: `back` branch inside `navigateHistory` → `router.showDomainMenu(domainSlug)`
- Line ~99: empty-history back + ExitPromptError in `showHistory` → `router.showDomainMenu(domainSlug)`
- Call site: `navigateHistory(history)` → `navigateHistory(history, domainSlug)` (pass slug through)

**`src/screens/stats.ts`** — 2 `router.showHome()` changes:
- Line ~129: ExitPromptError catch → `router.showDomainMenu(domainSlug)`
- Line ~134: after `select` resolves (Back pressed) → `router.showDomainMenu(domainSlug)`

### buildDomainMenuChoices format

```typescript
export function buildDomainMenuChoices(): Array<{ name: string; value: DomainMenuAction }> {
  return [
    { name: '▶  Play',         value: { action: 'play' } },
    { name: '📜  View History', value: { action: 'history' } },
    { name: '📊  View Stats',   value: { action: 'stats' } },
    { name: '🗄  Archive',      value: { action: 'archive' } },
    { name: '←  Back',          value: { action: 'back' } },
  ]
}
```

### Test isolation pattern (copy from archived.test.ts)

Use `_setDataDir` from `domain/store.js` when integration-testing with the real file system; mock `@inquirer/prompts` for unit tests. For `showDomainMenuScreen` tests use mocked `select` that returns a chosen action value then throws `ExitPromptError` to terminate the while loop (or mock `router.showHome` to throw a sentinel error).

### File count summary

| File | Status |
|---|---|
| `src/screens/home.ts` | modified |
| `src/screens/home.test.ts` | modified |
| `src/screens/domain-menu.ts` | new |
| `src/screens/domain-menu.test.ts` | new |
| `src/router.ts` | modified |
| `src/screens/quiz.ts` | modified |
| `src/screens/history.ts` | modified |
| `src/screens/stats.ts` | modified |

### Unchanged files

- `src/screens/select-domain.ts` — no changes; Play still routes through `router.showQuiz` → `showSelectDomainScreen`
- `src/screens/archived.ts` — no changes; Archive sub-menu still calls `router.showHome()` on Back (correct)
- `src/screens/create-domain.ts` — no changes
- `src/router.ts` tests (`router.test.ts`) — no changes (only `archiveDomain` is tested there)

## Dev Agent Record

### Implementation Plan
Followed the story task order strictly: (1) simplified `HomeAction` and removed per-domain action buttons from home; (2) created `domain-menu.ts` with the new sub-menu screen; (3) wired up `router.showDomainMenu`; (4–6) updated `quiz.ts`, `history.ts`, `stats.ts` to return to the domain sub-menu; (7–8) updated/created all tests.

### Debug Log
- `history.ts`: `navigateHistory` needed a new `domainSlug` parameter threaded through from `showHistory` — updated signature and all internal call sites.
- Companion test files (`history.test.ts`, `quiz.test.ts`, `stats.test.ts`) needed router mock updated from `showHome` to `showDomainMenu` to match the new implementation.
- Circular dependency (`domain-menu.ts` ↔ `router.ts`) is the same intentional pattern used by `home.ts` ↔ `router.ts`.

### Completion Notes
All 256 tests pass (252 pre-existing + 4 new from `domain-menu.test.ts`). No regressions. Story fully implemented per ACs.

## File List

- `src/screens/home.ts` — modified
- `src/screens/home.test.ts` — modified
- `src/screens/domain-menu.ts` — created
- `src/screens/domain-menu.test.ts` — created
- `src/router.ts` — modified
- `src/screens/quiz.ts` — modified
- `src/screens/history.ts` — modified
- `src/screens/stats.ts` — modified
- `src/screens/history.test.ts` — modified (router mock updated)
- `src/screens/quiz.test.ts` — modified (router mock updated)
- `src/screens/stats.test.ts` — modified (router mock updated)
- `docs/planning-artifacts/epics.md` — modified (FR1/FR3/FR4, Epic 2 description, Story 2.1 AC updated to reflect domain sub-menu navigation)
- `docs/planning-artifacts/prd.md` — modified (Feature 1 rewritten to describe two-level navigation; editHistory entry added)

## Change Log

- 2026-03-14: Story created — George / John (PM)
- 2026-03-14: Story implemented — Amelia (Dev Agent)
