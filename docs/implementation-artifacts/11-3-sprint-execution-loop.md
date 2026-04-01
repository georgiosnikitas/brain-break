# Story 11.3: Sprint Execution Loop

Status: done

## Story

As a user,
I want to answer preloaded sprint questions under a visible countdown timer with limited post-answer navigation,
So that I experience a focused, time-pressured challenge that tests my knowledge under constraint.

## Acceptance Criteria

1. `screens/challenge.ts` exports `showChallengeExecution(slug, config, questions)` returning `Promise<SessionData | null>`
2. A visible countdown timer in `M:SS` format (e.g., `4:32`) is rendered prominently on every screen during the sprint (question display and post-answer feedback)
3. The timer uses wall-clock `Date.now()` delta — `remainingMs = config.timeBudgetMs - (Date.now() - sprintStartMs)` — no `setInterval`
4. Each `inquirer` prompt (answer selection, post-answer navigation) uses `AbortController` + `setTimeout` to abort when the sprint timer expires
5. Questions are displayed and scored identically to quiz mode (same post-answer inline feedback: correct/incorrect status, correct answer reveal, time taken, speed tier, score delta via `renderQuestionDetail`)
6. Per-question speed tier is measured by individual answer time (time from question display to answer selection) — not the sprint clock
7. Post-answer navigation is limited to two options only: **Next question** and **Back** — no Explain, Bookmark, Remove bookmark, or Teach me more
8. Each answered question is written to the domain file immediately via `writeDomain()` — same write-after-every-answer pattern as quiz
9. `router.ts` `showChallenge(slug)` is updated to call `showChallengeExecution(slug, config, questions)` after successful preload and return session data
10. On Ctrl+C during any prompt, the sprint exits gracefully returning session data for questions answered so far
11. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Create `src/screens/challenge.ts` (AC: #1, #2, #3, #4, #5, #6, #7, #8, #10)
  - [x] Create the file with imports:
    - `select`, `Separator` from `@inquirer/prompts`
    - `ExitPromptError` from `@inquirer/core`
    - `type Question` from `../ai/client.js`
    - `readDomain`, `writeDomain` from `../domain/store.js`
    - `applyAnswer` from `../domain/scoring.js`
    - `hashQuestion` from `../utils/hash.js`
    - `defaultDomainFile`, `type QuestionRecord`, `type DomainFile`, `type AnswerOption`, `type SessionData` from `../domain/schema.js`
    - `header`, `dim`, `menuTheme`, `renderQuestionDetail`, `warn` from `../utils/format.js`
    - `clearAndBanner` from `../utils/screen.js`
  - [x] Import `SprintConfig` from `sprint-setup.ts` instead of redefining it locally
  - [x] Export the main function: `showChallengeExecution(slug: string, config: SprintConfig, questions: Question[]): Promise<SessionData | null>`
  - [x] Implementation structure:
    - Read domain state: `readDomain(slug)` → `domain` (fallback to `defaultDomainFile()` on error)
    - Capture `startingDifficulty = domain.meta.difficultyLevel`
    - Initialize: `sessionRecords: QuestionRecord[] = []`, `sprintStartMs = Date.now()`
    - For each question in `questions[]` (index 0..N-1):
      1. Compute `remainingMs = config.timeBudgetMs - (Date.now() - sprintStartMs)`
      2. If `remainingMs <= 0`: break loop (time already expired between questions)
      3. `clearAndBanner()` + render sprint header with timer: `header('⚡ Challenge — slug')` + timer line in `M:SS`
      4. Render question text + options via `select` with `AbortController` timeout
      5. **User answers in time:** record `timeTakenMs`, compute `applyAnswer()`, build `QuestionRecord`, update domain state, `writeDomain()`, render inline feedback via `renderQuestionDetail()`, render timer in feedback area, prompt Next/Back with `AbortController` timeout
      6. **Timer expires mid-question (AbortController fires):** stop the loop and return answered-so-far session data; Story 11.4 adds the timeout auto-submit record and sprint-result metadata
      7. **Timer expires mid-post-answer (AbortController fires):** break loop and return answered-so-far session data; Story 11.4 differentiates this termination reason in the returned metadata
      8. **User selects Back:** break loop
      9. **Ctrl+C (ExitPromptError):** break loop
    - Return `buildSessionResult(sessionRecords, startingDifficulty)` (same pattern as quiz.ts)
  - [x] Add `formatTimer(remainingMs: number): string` — converts ms to `M:SS` format (e.g., 272000 → `4:32`), returns `0:00` for ≤0
  - [x] Add `createTimedPrompt(remainingMs)` — returns `{ controller: AbortController, timeout: NodeJS.Timeout }`, schedules `setTimeout(controller.abort.bind(controller), remainingMs)`; caller clears timeout after prompt resolves
  - [x] Answer prompt: call `select<AnswerOption>({ ...promptConfig, theme: menuTheme }, { signal: controller.signal })` — pass the abort signal as the second `@inquirer/prompts` context argument, not inside the prompt config
  - [x] Post-answer nav prompt: call `select<'next' | 'back'>({ ...promptConfig, theme: menuTheme }, { signal: controller.signal })` with Next + Separator + Back
  - [x] For answered questions, measure `timeTakenMs` from question render to answer selection (`Date.now() - questionStartMs`) — never use `config.timeBudgetMs` as a per-question duration
  - [x] Do NOT persist a synthetic `TIMEOUT` record in Story 11.3; `QuestionRecordSchema` still only accepts `A/B/C/D` and Story 11.4 owns the timeout-record persistence change
  - [x] Per-answer domain state update (same as quiz.ts):

    ```typescript
    domain = {
      meta: { ...updatedMeta, lastSessionAt: new Date().toISOString() },
      hashes: [...domain.hashes, hash],
      history: [...domain.history, record],
    }
    ```

  - [x] After loop: return session result
- [x] Task 2: Create `src/screens/challenge.test.ts` (AC: #1, #2, #3, #4, #5, #6, #7, #8, #10, #11)
  - [x] Mock modules: `@inquirer/prompts` (select), `../ai/client.js` (none needed — questions preloaded), `../domain/store.js` (readDomain, writeDomain), `../domain/scoring.js` (applyAnswer), `../utils/screen.js` (clearAndBanner), `../utils/hash.js` (hashQuestion), `../utils/format.js` (partial — keep renderQuestionDetail real or mock)
  - [x] Test: renders timer in `M:SS` format on question screen
  - [x] Test: answers question within time — builds QuestionRecord, calls `writeDomain`, renders feedback
  - [x] Test: post-answer Next advances to next question
  - [x] Test: post-answer Back exits sprint returning session data
  - [x] Test: timer expiry mid-question ends the sprint gracefully and returns answered-so-far session data without writing a synthetic timeout record yet
  - [x] Test: timer expiry mid-post-answer — sprint ends returning session data
  - [x] Test: Ctrl+C exits gracefully returning session data
  - [x] Test: `writeDomain` called after every answered question (not batched)
  - [x] Test: speed tier measured by individual answer time, not sprint clock
  - [x] Test: post-answer nav has only Next and Back (no Explain, Bookmark, Teach)
  - [x] Test: all N questions answered → returns complete session data
  - [x] Test: `clearAndBanner` called before each question
  - [x] Test: answer and post-answer prompts pass the `AbortSignal` via the second `@inquirer/prompts` context argument
- [x] Task 3: Update `src/router.ts` `showChallenge(slug)` (AC: #9)
  - [x] Add import: `import { showChallengeExecution } from './screens/challenge.js'`
  - [x] After successful preload, call `const sessionData = await showChallengeExecution(slug, config, preloadResult.data)`
  - [x] Return `sessionData` instead of `null`
- [x] Task 4: Update `src/router.test.ts` (AC: #9, #11)
  - [x] Add mock for `./screens/challenge.js` → `{ showChallengeExecution: vi.fn() }`
  - [x] Test: on successful preload, `showChallenge` calls `showChallengeExecution` with slug, config, and questions
  - [x] Test: `showChallenge` returns session data from `showChallengeExecution`
- [x] Task 5: Run full test suite and verify zero regressions (AC: #11)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Sprint Execution]
- `screens/challenge.ts` exports `showChallengeExecution(slug, config, questions)`
- Receives `slug`, `config: { timeBudgetMs, questionCount }`, and `questions: Question[]` from the router
- Owns the sprint loop and timer
- Timer: wall-clock `Date.now()` delta — NO `setInterval`
- Timer-based prompt interruption: `AbortController` + `setTimeout` — pass `signal` to inquirer prompt
- Per-answer persistence via `writeDomain()` — same crash-safe pattern as quiz
- Questions displayed and scored identically to quiz (same `renderQuestionDetail` output)
- Post-answer nav limited to Next + Back only

### Timer Implementation Pattern

```typescript
// Record sprint start
const sprintStartMs = Date.now()

// Before each prompt:
const remainingMs = config.timeBudgetMs - (Date.now() - sprintStartMs)
if (remainingMs <= 0) break // already expired

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), remainingMs)

try {
  const answer = await select({ ... }, { signal: controller.signal })
  clearTimeout(timeout)
  // process answer
} catch (err) {
  clearTimeout(timeout)
  if (err instanceof ExitPromptError) {
    // Ctrl+C — exit gracefully
    break
  }
  // AbortController abort — @inquirer/prompts rejects with AbortPromptError
  // Treat that as timer expiry and end the loop gracefully in Story 11.3
  break
}
```

**Important:** With the installed `@inquirer/prompts` version, aborted prompts reject with `AbortPromptError`, while Ctrl+C still surfaces as `ExitPromptError`. Test both paths and do not place `signal` inside the first prompt-config object.

### Timer Display Format

```typescript
function formatTimer(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
// Examples: 272000 → "4:32", 5000 → "0:05", 0 → "0:00"
```

### Quiz Loop Pattern to Follow (from quiz.ts)

```typescript
// Per-answer flow — challenge.ts follows the SAME pattern:
const isCorrect = userAnswer === question.correctAnswer
const { updatedMeta, scoreDelta, speedTier } = applyAnswer(
  domain.meta, isCorrect, timeTakenMs, question.speedThresholds,
)

const hash = hashQuestion(question.question)
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
  bookmarked: false,
}

domain = {
  meta: { ...updatedMeta, lastSessionAt: new Date().toISOString() },
  hashes: [...domain.hashes, hash],
  history: [...domain.history, record],
}

sessionRecords.push(record)
const writeResult = await writeDomain(domainSlug, domain)
if (!writeResult.ok) {
  console.warn(warn(`Failed to save progress: ${writeResult.error}`))
}

renderQuestionDetail(record)
```

### Differences from Quiz Loop

| Aspect | Quiz (`quiz.ts`) | Challenge (`challenge.ts`) |
| --- | --- | --- |
| Question source | Generated one-at-a-time with spinner | Preloaded array passed in |
| Timer | None | Wall-clock countdown rendered every screen |
| Answer prompt | No timeout | `AbortController` + `setTimeout` |
| Post-answer nav | Explain / Bookmark / Next / Back | **Next / Back ONLY** |
| Auto-submit | N/A | Timeout → incorrect + slow tier |
| Session start | `startingDifficulty` from domain | Same pattern |
| Per-answer write | `writeDomain()` each answer | Same pattern |
| Render feedback | `renderQuestionDetail(record)` | Same function |

### Existing Scoring Pattern

```typescript
// src/domain/scoring.ts — applyAnswer is pure, no side effects
applyAnswer(meta: DomainMeta, isCorrect: boolean, timeTakenMs: number, speedThresholds: SpeedThresholds): ApplyAnswerResult
// Returns: { updatedMeta, scoreDelta, speedTier }
```

For answered questions, `timeTakenMs` should be the actual elapsed time from question render to answer selection. Story 11.4 extends the loop to score timeout questions using the actual elapsed time to timeout.

### Timeout Handling Boundary For Story 11.3

The timer wiring belongs in Story 11.3, but timeout-record persistence does not. The current `QuestionRecordSchema` still only accepts `A/B/C/D`, and `writeDomain()` writes raw JSON that is only validated on the next read. Persisting a synthetic `TIMEOUT` answer in this story would leave the domain unreadable. Story 11.3 should therefore stop the loop on timeout and return answered-so-far session data; Story 11.4 adds the schema widening and `TIMEOUT` record persistence.

### Previous Story Learnings (from Story 11.1 and 11.2)

- Story 11.1 exports `SprintConfig = { timeBudgetMs: number, questionCount: number }` from `sprint-setup.ts` — import it, don't redefine
- Story 11.2 expands `showChallenge(slug)` in router.ts with preload logic — Story 11.3 adds the execution call AFTER the preload section
- ExitPromptError catch pattern: always wrap `select` calls
- `clearAndBanner()` called before each question screen
- `menuTheme` used for all `select` prompts
- `readDomain` fallback: `defaultDomainFile()` if read fails (quiz.ts pattern)

### What This Story Does NOT Do

- Does NOT implement sprint termination history writing or sprint result display (Story 11.4 handles the session summary sprint result field)
- Does NOT modify the `SessionData` type — uses existing `{ records, startingDifficulty }` shape
- Does NOT modify `renderSessionSummary()` in domain-menu.ts (Story 11.4)
- Does NOT modify `QuestionRecord` or `AnswerOption` types (Story 11.4 widens timeout persistence safely)
- Does NOT persist synthetic `TIMEOUT` answers yet; Story 11.4 adds that behavior after the schema is widened
- Does NOT handle unanswered question disposal explicitly — questions simply aren't iterated; they remain in the preloaded array and are garbage-collected

### Project Structure Notes

Files to create:

- `src/screens/challenge.ts`
- `src/screens/challenge.test.ts`

Files to modify:

- `src/router.ts` — add `showChallengeExecution` import and call after preload
- `src/router.test.ts` — add challenge mock and execution tests
- `src/router.challenge.test.ts` — keep preload-orchestration coverage stable after execution wiring

### Testing Standards

- Framework: `vitest` — co-located `*.test.ts` alongside source
- Mock `@inquirer/prompts` (select), `../domain/store.js`, `../domain/scoring.js`, `../utils/screen.js`, `../utils/hash.js`
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` for timer-related tests — mock `Date.now()` to control elapsed time
- Use `vi.mocked()` for type-safe mock access
- `beforeEach` → `vi.clearAllMocks()`
- Current test count: ~846 tests — verify zero regressions

### References

- [Source: docs/planning-artifacts/epics.md#Story 11.3]
- [Source: docs/planning-artifacts/prd.md#FR45 — Sprint Execution]
- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Sprint Execution]
- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Timer Strategy]
- [Source: src/screens/quiz.ts — showQuiz loop, askQuestion, per-answer write pattern]
- [Source: src/domain/scoring.ts — applyAnswer signature]
- [Source: src/utils/format.ts — renderQuestionDetail, menuTheme, colorIncorrect]
- [Source: src/utils/screen.ts — clearAndBanner]
- [Source: src/router.ts — showChallenge (expanded by Story 11.2)]

## Dev Agent Record

### Agent Model Used

- Claude Opus 4.6

### Debug Log References

- `/Users/georgiosnikitas/Library/Application Support/Code/User/workspaceStorage/f9642210105ee078bfc5b6dc4e7792a0/GitHub.copilot-chat/debug-logs/cf2e0465-3411-4955-8e60-1b802957d401`

### Completion Notes List

- Added `src/screens/challenge.ts` with wall-clock sprint timing, `AbortController`-backed prompt interruption, inline feedback reuse via `renderQuestionDetail()`, and per-answer `writeDomain()` persistence.
- Added `src/screens/challenge.test.ts` with coverage for timer rendering, answer timing, per-answer writes, Next/Back-only navigation, mid-question timeout, mid-feedback timeout, Ctrl+C handling, and prompt-context `AbortSignal` wiring.
- Updated `src/router.ts` to hand successful preloads to `showChallengeExecution(slug, config, questions)` and return the resulting session data to the domain menu flow.
- Extended `src/router.test.ts` for execution delegation and return-value assertions, and updated `src/router.challenge.test.ts` so preload orchestration tests remain isolated after the execution hook was added.
- Kept timeout persistence intentionally out of scope for Story 11.3; unanswered timeout cases stop the sprint and return answered-so-far session data until Story 11.4 widens the schema for `TIMEOUT` records.
- Validation complete: `src/screens/challenge.test.ts` passed `13/13`, router-focused coverage passed `30/30`, and the full `npm test` suite passed `846/846`.

### File List

| File | Action |
| ------ | -------- |
| `docs/implementation-artifacts/11-3-sprint-execution-loop.md` | Modified |
| `docs/implementation-artifacts/sprint-status.yaml` | Modified |
| `src/screens/challenge.ts` | Created |
| `src/screens/challenge.test.ts` | Created |
| `src/router.ts` | Modified |
| `src/router.test.ts` | Modified |
| `src/router.challenge.test.ts` | Modified |

### Change Log

- 2026-04-01: Implemented Story 11.3 — added the sprint execution loop with countdown rendering, timed prompts, per-answer persistence, router execution wiring, and co-located tests. Full suite passing: `846/846`.
- 2026-04-01: Code review — added missing non-ExitPromptError re-throw test (MEDIUM), fixed agent model name (LOW), fixed stale test description in router.challenge.test.ts (LOW). 847/847 tests passing.

## Senior Developer Review (AI)

**Review Date:** 2026-04-01
**Review Outcome:** Approve (after fixes)

### Action Items

- [x] [MEDIUM] Missing non-ExitPromptError / non-AbortPromptError re-throw test in `challenge.test.ts` — every other screen has this test; added to match project convention.
- [x] [LOW] Dev Agent Record listed incorrect agent model ("GPT-5.4" → "Claude Opus 4.6").
- [x] [LOW] Stale test description in `router.challenge.test.ts` — updated from "stub for 11.3" to "delegates to showChallengeExecution on preload success".
