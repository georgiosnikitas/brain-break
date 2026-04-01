# Story 11.2: Question Preloading

Status: done

## Story

As a user,
I want all sprint questions generated and validated upfront before the countdown begins,
So that my timed sprint runs smoothly without generation delays between questions.

## Acceptance Criteria

1. `ai/client.ts` exports a new `preloadQuestions(count, domain, difficultyLevel, existingHashes, settings, onProgress?)` function returning `Promise<Result<Question[]>>`
2. `preloadQuestions` generates exactly `count` questions sequentially via the existing `generateQuestion()` pipeline (prompt → AI → Zod → shuffle → verify → dedup)
3. Intra-batch deduplication: each generated question's hash is added to a running `Set` (union of `existingHashes` + all hashes generated so far in this batch) before generating the next question
4. If any single question generation fails (AI unreachable, parse error, etc.), the entire preload fails — returns `{ ok: false, error: <provider-specific message> }`; no partial results
5. On success, returns `{ ok: true, data: Question[] }` with exactly `count` questions
6. `router.ts` `showChallenge(slug)` is updated to: call setup → read domain + settings → call `preloadQuestions()` → on failure display error and return to domain sub-menu → on success pass questions to challenge execution (stubbed as `null` return until Story 11.3)
7. An `ora` spinner is shown during preload with progress text updating per question (e.g., `"Generating questions (3/10)..."`)
8. If preload fails, the provider-specific error message (same `AI_ERRORS` as Play mode) is displayed and the user returns to the domain sub-menu — no sprint starts
9. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `preloadQuestions()` to `src/ai/client.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Add the exported async function with signature: `preloadQuestions(count: number, domain: string, difficultyLevel: number, existingHashes: Set<string>, settings: SettingsFile, onProgress?: (generated: number, total: number) => void): Promise<Result<Question[]>>`
  - [x] Inside the function, create a running hash set: `const runningHashes = new Set(existingHashes)`
  - [x] Create an accumulator: `const questions: Question[] = []` and `const previousQuestions: string[] = []`
  - [x] Loop `count` times sequentially, calling `generateQuestion(domain, difficultyLevel, runningHashes, previousQuestions, settings)` each iteration
  - [x] On each successful generation: push question to `questions[]`, add `hashQuestion(question.question)` to `runningHashes`, push `question.question` to `previousQuestions`
  - [x] On any failure: return the failure result immediately — `{ ok: false, error: result.error }`
  - [x] After loop completes: return `{ ok: true, data: questions }`
  - [x] Accept an optional `onProgress?: (generated: number, total: number) => void` callback parameter — call it after each successful question generation so the caller can update the spinner
- [x] Task 2: Add tests in `src/ai/client.test.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Test: successful preload of N questions returns `{ ok: true, data: Question[] }` with length N
  - [x] Test: each `generateQuestion` call receives the growing `runningHashes` set (verify hashes accumulate)
  - [x] Test: each `generateQuestion` call receives growing `previousQuestions` array
  - [x] Test: if any `generateQuestion` call fails, `preloadQuestions` returns the failure immediately — no further calls made
  - [x] Test: partial failure — e.g., 3rd of 5 questions fails → result is `{ ok: false }`, only 2 `generateQuestion` calls completed
  - [x] Test: `onProgress` callback is called after each successful generation with `(generated, total)` args
  - [x] Test: empty count (0) returns `{ ok: true, data: [] }` immediately
- [x] Task 3: Update `src/router.ts` `showChallenge(slug)` (AC: #6, #7, #8)
  - [x] Add imports: `import { preloadQuestions } from './ai/client.js'`, `import { readDomain, readSettings } from './domain/store.js'`, `import { defaultSettings, defaultDomainFile } from './domain/schema.js'`, `import ora from 'ora'`
  - [x] After `showSprintSetup(slug)` returns config (non-null), read domain via `readDomain(slug)` and settings via `readSettings()`
  - [x] Start an `ora` spinner: `ora('Generating questions (0/${config.questionCount})...').start()`
  - [x] Call `preloadQuestions(config.questionCount, slug, domain.meta.difficultyLevel, new Set(domain.hashes), settings)` with an `onProgress` callback that updates the spinner text
  - [x] On preload failure: stop spinner, `console.error(colorIncorrect(result.error))`, show a Back prompt (same `showGenerationError` pattern as quiz), return `null`
  - [x] On preload success: stop spinner — for now return `null` (Story 11.3 will add `showChallengeExecution(slug, config, questions)` call here)
  - [x] Handle `ExitPromptError` during the error-display Back prompt (return `null`)
- [x] Task 4: Update `src/router.test.ts` showChallenge coverage without breaking the existing real-store tests (AC: #6, #7, #8, #9)
  - [x] Prefer `vi.spyOn()` for `preloadQuestions`, `readDomain`, and `readSettings` inside the showChallenge-specific tests; avoid a top-level `vi.mock('./domain/store.js')` in `src/router.test.ts` because that file already relies on the real store helpers for archive/delete coverage
  - [x] If isolating those spies inside `src/router.test.ts` becomes awkward, create a dedicated `src/router.challenge.test.ts` file instead of destabilizing the existing router smoke tests
  - [x] Test: `showChallenge` calls `readDomain(slug)` and `readSettings()` after setup returns config
  - [x] Test: `showChallenge` calls `preloadQuestions` with correct args (count, slug, difficultyLevel, hashes set, settings)
  - [x] Test: on preload success, `showChallenge` currently returns `null` (stub for 11.3)
  - [x] Test: on preload failure, `showChallenge` returns `null` (error displayed)
  - [x] Test: if setup returns `null` (user backed out), `preloadQuestions` is NOT called
- [x] Task 5: Run full test suite and verify zero regressions (AC: #9)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Question Preloading]
- `preloadQuestions()` is a new public export in `ai/client.ts`
- Sequential generation loop — NOT parallel (each question's hash feeds the next call's dedup set)
- Each question goes through the same `generateQuestion()` pipeline: prompt → AI call → Zod parse → Fisher-Yates shuffle → self-consistency verification → dedup check
- Fail-all-on-error: if ANY question fails, total failure — no partial results returned
- The calling screen (router) drives the ora spinner — `preloadQuestions` itself does NOT start/stop spinners
- Questions are passed in memory to the execution screen — NOT written to disk until answered

### Coding Patterns to Follow

- [Source: docs/planning-artifacts/architecture.md#Implementation Patterns]
- **Result wrapping:** All public AI functions return `Result<T>` — `preloadQuestions` returns `Result<Question[]>`
- **ESM imports:** Always `.js` extension
- **Error classification:** Reuse existing `classifyError()` from `ai/client.ts` — but note `preloadQuestions` delegates to `generateQuestion` which already handles classification
- **No barrel imports:** Import from specific module files
- **Test co-location:** Tests go in `src/ai/client.test.ts` (extend existing file)

### Existing `generateQuestion` Signature (DO NOT MODIFY)

```typescript
// src/ai/client.ts — existing function, Story 11.2 calls it as-is
export async function generateQuestion(
  domain: string,
  difficultyLevel: number,
  existingHashes: Set<string>,
  previousQuestions: string[] = [],
  settings?: SettingsFile,
): Promise<Result<Question>>
```

### Existing `readDomain` and `readSettings` Patterns

```typescript
// src/domain/store.ts — both already exist
export async function readDomain(slug: string): Promise<Result<DomainFile>>
export async function readSettings(): Promise<Result<SettingsFile>>
```

### Router `showChallenge` — Current State (Story 11.1)

```typescript
// src/router.ts — Story 11.1 creates this stub; Story 11.2 expands it
export async function showChallenge(slug: string): Promise<SessionData | null> {
  const config = await showSprintSetup(slug)
  // Story 11.1: just returns null after setup
  return null
}
```

Story 11.2 expands this to: setup → read domain/settings → preload → (stub for 11.3) → return null.

### Error Display Pattern (from quiz.ts)

```typescript
// src/screens/quiz.ts — showGenerationError pattern to REUSE in router
async function showGenerationError(error: string): Promise<void> {
  console.error(colorIncorrect(error))
  try {
    await select({
      message: 'Something went wrong',
      choices: [new Separator(), { name: '←  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}
```

The router should either import a shared version or inline this pattern. Since quiz.ts does NOT export `showGenerationError`, inline it in router.ts (or extract to a shared util if clean — but keep it simple).

### Test Patterns for AI Client (from client.test.ts)

```typescript
// Existing mock pattern — extend these, do NOT create separate describe blocks outside existing structure
vi.mock('./providers.js', () => ({ ... }))

// Mock provider
const mockProvider = { generateCompletion: vi.fn() }

// Test pattern for generateQuestion
it('returns parsed and shuffled question on success', async () => {
  mockCreateProvider.mockReturnValue({ ok: true, data: mockProvider })
  mockProvider.generateCompletion
    .mockResolvedValueOnce(JSON.stringify(mockQuestion))  // question
    .mockResolvedValueOnce(JSON.stringify({ correctAnswer: 'C' }))  // verification
  const result = await generateQuestion('math', 3, new Set())
  expect(result.ok).toBe(true)
})
```

### Previous Story Learnings (from Story 11.1)

- Story 11.1 creates `showChallenge(slug)` in router.ts as a stub that only calls `showSprintSetup`. Story 11.2 MUST expand this stub — do NOT create a new function.
- ExitPromptError pattern: wrap all `select` calls in try/catch
- Test assertions: verify mock call counts and argument shapes precisely
- `defaultDomainFile()` and `defaultSettings()` are the fallback patterns when `readDomain` / `readSettings` fail

### What This Story Does NOT Do

- Does NOT create the sprint execution loop or challenge screen (Story 11.3)
- Does NOT implement the countdown timer or AbortController logic (Story 11.3)
- Does NOT write answered questions to disk or handle sprint termination (Story 11.4)
- Does NOT modify SessionData type (Story 11.4)
- Does NOT add the sprint result field to session summary (Story 11.4)
- The router `showChallenge` will still return `null` after successful preload — challenge execution is Story 11.3

### Project Structure Notes

Files to create: (none — this story only adds to existing files)

Files to modify:

- `src/ai/client.ts` — add `preloadQuestions()` export
- `src/ai/client.test.ts` — add preload tests
- `src/router.ts` — expand `showChallenge()` with preload orchestration
- `src/router.test.ts` — add preload-related tests for `showChallenge`

### Testing Standards

- Framework: `vitest` — co-located `*.test.ts` alongside source
- Extend existing test files — do NOT create new test files for this story
- In `src/router.test.ts`, avoid a top-level `vi.mock('./domain/store.js')`; that file already uses the real filesystem-backed store helpers for other router behaviors. Prefer `vi.spyOn()` or a dedicated challenge-router test file if isolation is cleaner.
- Use `vi.mocked()` for type-safe mock access
- `beforeEach` → `vi.clearAllMocks()`
- Current test count: ~768 tests — verify zero regressions

### References

- [Source: docs/planning-artifacts/epics.md#Story 11.2]
- [Source: docs/planning-artifacts/prd.md#FR44 — Sprint Setup Screen (preload portion)]
- [Source: docs/planning-artifacts/architecture.md#Challenge Mode (Sprint) Architecture — Question Preloading]
- [Source: src/ai/client.ts — generateQuestion signature and classifyError pattern]
- [Source: src/ai/client.test.ts — existing test patterns for AI functions]
- [Source: src/router.ts — showChallenge stub from Story 11.1]
- [Source: src/screens/quiz.ts — showGenerationError pattern]

## Dev Agent Record

- **Agent**: BMAD Dev Agent (Claude Opus 4.6)
- **Status**: done
- **Tests**: 831/831 passing (16 new: 7 preloadQuestions + 9 router challenge)
- **Files modified**:
  - `src/ai/client.ts` — added `preloadQuestions()` export (sequential generation loop with running hash dedup, fail-fast, onProgress callback)
  - `src/ai/client.test.ts` — added 7 tests in new `preloadQuestions` describe block (success, hash accumulation, previousQuestions growth, fail-fast, partial failure, onProgress, empty count)
  - `src/router.ts` — expanded `showChallenge()`: reads domain+settings, starts ora spinner, calls preloadQuestions with onProgress, on failure shows error+Back prompt, on success stops spinner (returns null stub for 11.3)
  - `src/router.test.ts` — updated existing showChallenge delegation test to use null config (avoids triggering preload path without mocks)
- **Files created**:
  - `src/router.challenge.test.ts` — 9 tests for showChallenge preload orchestration (readDomain/readSettings called, preloadQuestions args, success returns null, failure shows error, setup-null skips preload, spinner lifecycle, defaults fallback, ExitPromptError handling, re-throw non-ExitPromptError)
- **Design decisions**:
  - Created separate `router.challenge.test.ts` instead of adding mocks to `router.test.ts` to avoid destabilizing archive/delete tests that use the real filesystem store
  - Verified hash accumulation and previousQuestions growth indirectly through dedup behavior (same-module function calls bypass vi.spyOn)
  - Inlined the `showGenerationError` pattern in router.ts rather than extracting a shared util (keeping it simple per story guidance)

## Senior Developer Review (AI)

**Review Date:** 2026-04-01
**Review Outcome:** Approve

### Findings

- [x] [LOW] `src/ai/client.test.ts` defined `mockSuccessfulGeneration()` inside the `preloadQuestions` describe block. Fixed by moving the helper to module scope, which clears the non-blocking Problems entry.

### Notes

- Acceptance criteria validated against `src/ai/client.ts`, `src/router.ts`, `src/ai/client.test.ts`, `src/router.test.ts`, and `src/router.challenge.test.ts`.
- No HIGH or MEDIUM issues found; Story 11.2 is complete.
