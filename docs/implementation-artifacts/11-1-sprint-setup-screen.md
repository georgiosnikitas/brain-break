# Story 11.1: Sprint Setup Screen

Status: done

## Story

As a user,
I want a sprint setup screen accessible from the domain sub-menu where I can configure the number of questions and time budget before starting a timed sprint,
So that I can define the exact scope of my sprint and start with clear expectations.

## Acceptance Criteria

1. A "⚡ Challenge" action is present in the domain sub-menu immediately after "▶  Play"
2. Selecting "⚡ Challenge" opens the sprint setup screen where `clearAndBanner()` is called first
3. The sprint setup screen renders two parameter selectors navigated via arrow keys:
   - **Time budget:** 2 min / 5 min / 10 min
   - **Question count:** 5 / 10 / 20
4. The setup screen provides two actions: **Confirm** and **Back**
5. Selecting "Back" returns to the domain sub-menu without starting a sprint and without triggering any question preloading
6. Pressing Ctrl+C on the sprint setup screen returns gracefully to the domain sub-menu
7. `router.ts` exports a `showChallenge(slug)` function that calls `screens/sprint-setup.ts`
8. `screens/domain-menu.ts` routes the "⚡ Challenge" action to `router.showChallenge(slug)`
9. On Confirm, `showSprintSetup()` returns `{ timeBudgetMs: number, questionCount: number }` — time budgets stored as milliseconds: 120_000, 300_000, 600_000
10. On Back or Ctrl+C, `showSprintSetup()` returns `null`
11. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Create `src/screens/sprint-setup.ts` (AC: #2, #3, #4, #5, #6, #9, #10)
  - [x] Create the file exporting `showSprintSetup(slug: string): Promise<SprintConfig | null>`
  - [x] Define and export `SprintConfig` type: `{ timeBudgetMs: number, questionCount: number }`
  - [x] Define and export `TIME_BUDGET_CHOICES` and `QUESTION_COUNT_CHOICES` constant arrays for inquirer select prompts
  - [x] `TIME_BUDGET_CHOICES`: `[{ name: '2 min', value: 120_000 }, { name: '5 min', value: 300_000 }, { name: '10 min', value: 600_000 }]`
  - [x] `QUESTION_COUNT_CHOICES`: `[{ name: '5 questions', value: 5 }, { name: '10 questions', value: 10 }, { name: '20 questions', value: 20 }]`
  - [x] On entry: call `clearAndBanner()`, render the slug header via `bold()` + `dim()` (same pattern as domain-menu's `renderDomainHeader`)
  - [x] Render two sequential `select` prompts from `@inquirer/prompts` using `menuTheme`: first Time budget, then Question count
  - [x] After both selects, render a final `select` prompt with Confirm and Back actions
  - [x] On Confirm: return `{ timeBudgetMs, questionCount }`
  - [x] On Back from the final Confirm/Back prompt: return `null`
  - [x] Wrap all `select` calls in try/catch for `ExitPromptError` (Ctrl+C) — return `null`
- [x] Task 2: Create `src/screens/sprint-setup.test.ts` (AC: #2, #3, #4, #5, #6, #9, #10)
  - [x] Mock `@inquirer/prompts` (`select`), `../utils/screen.js` (`clearAndBanner`), and `../utils/format.js` (partial — keep real `bold`, `dim`)
  - [x] Test: `clearAndBanner()` is called on entry
  - [x] Test: `select` is called 3 times (time budget, question count, confirm/back)
  - [x] Test: On Confirm, returns `{ timeBudgetMs: <selected>, questionCount: <selected> }`
  - [x] Test: On Back (third prompt returns 'back'), returns `null`
  - [x] Test: On Ctrl+C (select throws `ExitPromptError`), returns `null`
  - [x] Test: exports `TIME_BUDGET_CHOICES` with 3 entries (120000, 300000, 600000)
  - [x] Test: exports `QUESTION_COUNT_CHOICES` with 3 entries (5, 10, 20)
- [x] Task 3: Add "⚡ Challenge" action to `src/screens/domain-menu.ts` (AC: #1, #8)
  - [x] Add `| { action: 'challenge' }` to `DomainMenuAction` union type
  - [x] Insert `{ name: '⚡  Challenge', value: { action: 'challenge' } }` in `buildDomainMenuChoices()` immediately after the Play entry
  - [x] Add `else if (answer.action === 'challenge')` branch in `handleDomainAction()` — calls `await router.showChallenge(slug)` and returns the session data (same pattern as `play` branch)
- [x] Task 4: Update `src/screens/domain-menu.test.ts` (AC: #1, #8)
  - [x] Add `showChallenge: vi.fn()` to the router mock
  - [x] Update `buildDomainMenuChoices` test: expect 9 items (was 8) with Challenge after Play
  - [x] Add test: selecting 'challenge' calls `router.showChallenge(slug)`
  - [x] Add test: challenge action returns session data from router (same as play pattern)
- [x] Task 5: Add `showChallenge(slug)` to `src/router.ts` (AC: #7)
  - [x] Add `import { showSprintSetup } from './screens/sprint-setup.js'` at the top
  - [x] Add exported function `showChallenge(slug: string): Promise<SessionData | null>` — for now, calls `showSprintSetup(slug)` and returns `null` (preloading + execution is Story 11.2+11.3; this story only wires the setup screen)
- [x] Task 6: Update `src/router.test.ts` (AC: #7)
  - [x] Add `vi.mock('./screens/sprint-setup.js', () => ({ showSprintSetup: vi.fn() }))` to the mocks
  - [x] Add test: `showChallenge` is exported and callable
  - [x] Add test: `showChallenge(slug)` calls `showSprintSetup(slug)`
- [x] Task 7: Run full test suite and verify zero regressions (AC: #11)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture]
- `screens/sprint-setup.ts` exports `showSprintSetup(slug)`. Returns `SprintConfig | null`.
- The router's `showChallenge(slug)` orchestrates: setup → preload → execute → return to domain sub-menu. **Story 11.1 only implements the setup step** — `showChallenge` calls `showSprintSetup` and returns `null` for now.
- Challenge action is positioned after Play in the domain sub-menu.
- Time budgets stored as milliseconds: 120_000, 300_000, 600_000.

### Coding Patterns to Follow

- [Source: docs/planning-artifacts/architecture.md#Implementation Patterns]
- **File naming:** `kebab-case` — `sprint-setup.ts`, `sprint-setup.test.ts`
- **ESM imports:** Always `.js` extension — `import { showSprintSetup } from './screens/sprint-setup.js'`
- **Error handling:** `ExitPromptError` catch pattern from `@inquirer/core` — return `null` on Ctrl+C (see `domain-menu.ts` for exact pattern)
- **Screen entry:** Call `clearAndBanner()` as first operation (imported from `../utils/screen.js`)
- **Menu theme:** Use `menuTheme` from `../utils/format.js` for all `select` prompts
- **No barrel imports:** Import from specific module files, never `index.ts`
- **Test co-location:** `sprint-setup.test.ts` alongside `sprint-setup.ts` in `src/screens/`

### Existing File Patterns to Match

**domain-menu.ts choice structure:**

```typescript
export function buildDomainMenuChoices(): Array<{ name: string; value: DomainMenuAction } | Separator> {
  return [
    { name: '▶  Play', value: { action: 'play' } },
    // ⚡ Challenge goes HERE — immediately after Play
    { name: '📜  View History', value: { action: 'history' } },
    ...
  ]
}
```

**domain-menu.ts action handler pattern:**

```typescript
async function handleDomainAction(slug: string, answer: DomainMenuAction): Promise<false | SessionData | null> {
  if (answer.action === 'play') {
    return await router.showQuiz(slug)
  } else if (answer.action === 'challenge') {
    return await router.showChallenge(slug)  // ← new branch, same return type as play
  } else if ...
}
```

**router.ts export pattern:**

```typescript
export async function showChallenge(slug: string): Promise<SessionData | null> {
  const config = await showSprintSetup(slug)
  // Story 11.2+11.3 will add preloading and execution here
  return null
}
```

**Test mock pattern (from domain-menu.test.ts):**

```typescript
vi.mock('../router.js', () => ({
  showQuiz: vi.fn(),
  showChallenge: vi.fn(),  // ← add this
  ...
}))
```

**Test mock pattern (from router.test.ts):**

```typescript
vi.mock('./screens/sprint-setup.js', () => ({ showSprintSetup: vi.fn() }))
```

### Previous Story Learnings (from Story 10.4)

- [Source: docs/implementation-artifacts/10-4-view-bookmarks-screen.md]
- When adding a new action to domain-menu: update DomainMenuAction type, buildDomainMenuChoices, handleDomainAction, AND the test choice count assertion
- Keep screens independent — no cross-screen imports
- Ctrl+C handling: always wrap `select` calls in try/catch for `ExitPromptError`
- Test assertions: remember to verify `clearAndBanner` call AND the mock call counts in domain-menu tests

### What This Story Does NOT Do

- Does NOT implement question preloading (Story 11.2)
- Does NOT implement the sprint execution loop (Story 11.3)
- Does NOT implement sprint termination or history writing (Story 11.4)
- `showChallenge()` in router returns `null` for now — it only calls the setup screen

### Project Structure Notes

Files to create:

- `src/screens/sprint-setup.ts`
- `src/screens/sprint-setup.test.ts`

Files to modify:

- `src/screens/domain-menu.ts` — add Challenge action type + choice + handler
- `src/screens/domain-menu.test.ts` — update choice count, add challenge routing tests
- `src/router.ts` — add showChallenge export + sprint-setup import
- `src/router.test.ts` — add sprint-setup mock + showChallenge tests

### Testing Standards

- Framework: `vitest` — co-located `*.test.ts` alongside source
- Mock `@inquirer/prompts` (select), `../utils/screen.js` (clearAndBanner), `../router.js` (for domain-menu tests)
- Use `vi.hoisted()` for mock values needed in mock factory functions
- Use `vi.mocked()` for type-safe mock access
- `beforeEach` → `vi.clearAllMocks()`
- Current test count: ~768 tests — verify zero regressions

### References

- [Source: docs/planning-artifacts/epics.md#Story 11.1]
- [Source: docs/planning-artifacts/prd.md#Feature 17 — Sprint setup screen]
- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Sprint Setup Screen]
- [Source: docs/planning-artifacts/architecture.md#Navigation Pattern — Two-level menu]
- [Source: src/screens/domain-menu.ts — buildDomainMenuChoices, handleDomainAction, DomainMenuAction]
- [Source: src/router.ts — showQuiz pattern for new screen exports]
- [Source: src/screens/domain-menu.test.ts — mock setup and choice count patterns]
- [Source: src/router.test.ts — screen mock pattern]

## Dev Agent Record

### Agent Model Used

- Claude Opus 4.6

### Debug Log References

- `/Users/georgiosnikitas/Library/Application Support/Code/User/workspaceStorage/f9642210105ee078bfc5b6dc4e7792a0/GitHub.copilot-chat/debug-logs/cf2e0465-3411-4955-8e60-1b802957d401`

### Completion Notes List

- Added `src/screens/sprint-setup.ts` with `clearAndBanner()` entry, slug header rendering, time-budget/question-count selectors, and Confirm/Back flow returning `SprintConfig | null`.
- Added `src/screens/sprint-setup.test.ts` with 7 tests covering entry rendering, prompt sequencing, confirm/back behavior, Ctrl+C handling, and exported choice arrays.
- Updated `src/screens/domain-menu.ts` and `src/router.ts` to expose and route the new `⚡  Challenge` action. `showChallenge()` intentionally stops after `showSprintSetup()` and returns `null` for now per Story 11.1 scope.
- Extended `src/screens/domain-menu.test.ts` and `src/router.test.ts` for Challenge ordering, routing, and returned-session handling.
- Validation complete: targeted tests for the new screen and wiring passed, `get_errors` reported no diagnostics, and full `npm test` passed at `815/815` tests.

### File List

| File | Action |
| ------ | -------- |
| `docs/implementation-artifacts/11-1-sprint-setup-screen.md` | Modified |
| `docs/implementation-artifacts/sprint-status.yaml` | Modified |
| `src/screens/sprint-setup.ts` | Created |
| `src/screens/sprint-setup.test.ts` | Created |
| `src/screens/domain-menu.ts` | Modified |
| `src/screens/domain-menu.test.ts` | Modified |
| `src/router.ts` | Modified |
| `src/router.test.ts` | Modified |

## Senior Developer Review (AI)

**Review Date:** 2026-04-01
**Review Outcome:** Approve (after fixes)

### Action Items

- [x] [MEDIUM] Missing non-ExitPromptError re-throw test in `sprint-setup.test.ts` — every other screen has this test; added to match project convention.
- [x] [LOW] Dev Agent Record listed incorrect agent model ("GPT-5.4" → "Claude Opus 4.6").

### Change Log

- 2026-04-01: Implemented Story 11.1 — added the sprint setup screen, wired the `⚡  Challenge` domain-menu action, added the `showChallenge()` router stub, and extended co-located tests. Full suite passing: `814/814`.
- 2026-04-01: Code review — added missing non-ExitPromptError re-throw test (MEDIUM), fixed agent model name (LOW). 815/815 tests passing.
