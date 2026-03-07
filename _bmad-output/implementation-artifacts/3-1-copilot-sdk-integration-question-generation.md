---
Story: 3.1
Title: Copilot SDK Integration & Question Generation
Status: complete
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-07
---

# Story 3.1: Copilot SDK Integration & Question Generation

## Story

As a developer,
I want `ai/client.ts` and `ai/prompts.ts` to integrate with the GitHub Copilot SDK and return validated question objects via `Result<T>`,
So that any screen can request a question and always receive either a valid result or a clear error — never a crash.

## Acceptance Criteria

- [x] AC1: `ai/prompts.ts` exports `buildQuestionPrompt(domain, difficultyLevel)` — returns a structured prompt string instructing the model to respond with JSON matching `QuestionResponseSchema` (question, options A–D, correctAnswer, difficultyLevel, speedThresholds)
- [x] AC2: `ai/prompts.ts` exports `QuestionResponseSchema` (Zod) validating the exact shape returned by the model
- [x] AC3: `ai/client.ts` exports `generateQuestion(domain, difficultyLevel, existingHashes)` — calls the Copilot SDK, validates with `QuestionResponseSchema`, hashes the question text and checks against `existingHashes`, retries once on duplicate
- [x] AC4: `generateQuestion` returns `{ ok: false, error: AI_ERRORS.NETWORK }` on network/connection errors
- [x] AC5: `generateQuestion` returns `{ ok: false, error: AI_ERRORS.AUTH }` on authentication failure
- [x] AC6: `generateQuestion` returns `{ ok: false, error: AI_ERRORS.PARSE }` on Zod validation failure
- [x] AC7: `ai/client.test.ts` tests pass for success path, network error, auth error, and parse error (SDK mocked)

## Tasks / Subtasks

- [x] Task 1: Implement `ai/prompts.ts` (AC: 1, 2)
  - [x] 1.1 Export `QuestionResponseSchema` Zod schema (question, options{A,B,C,D}, correctAnswer enum A-D, difficultyLevel 1-5, speedThresholds{fastMs,slowMs})
  - [x] 1.2 Export `type QuestionResponse = z.infer<typeof QuestionResponseSchema>`
  - [x] 1.3 Export `buildQuestionPrompt(domain: string, difficultyLevel: number): string`
  - [x] 1.4 Export `buildDeduplicationPrompt(domain: string, difficultyLevel: number, previousQuestion: string): string` for retry-on-duplicate

- [x] Task 2: Implement `ai/client.ts` (AC: 3, 4, 5, 6)
  - [x] 2.1 Export `AI_ERRORS` constant with NETWORK, AUTH, PARSE messages
  - [x] 2.2 Export `type Question` derived from QuestionResponseSchema
  - [x] 2.3 Implement `generateQuestion(domain, difficultyLevel, existingHashes): Promise<Result<Question>>`
  - [x] 2.4 Wrap all SDK calls in try/catch — classify thrown errors as NETWORK or AUTH
  - [x] 2.5 Validate parsed JSON response with QuestionResponseSchema before returning
  - [x] 2.6 Hash question text and check against existingHashes; retry once with deduplication prompt on match

- [x] Task 3: Write co-located tests `ai/client.test.ts` (AC: 7)
  - [x] 3.1 Mock `@github/copilot-sdk` — expose `mockSendAndWait` for per-test configuration
  - [x] 3.2 Test success path: valid JSON response → `{ ok: true, data: Question }`
  - [x] 3.3 Test network error: SDK throws generic error → `{ ok: false, error: AI_ERRORS.NETWORK }`
  - [x] 3.4 Test auth error: SDK throws with message containing "401"/"unauthorized"/"auth" → `{ ok: false, error: AI_ERRORS.AUTH }`
  - [x] 3.5 Test parse error: SDK returns non-JSON / wrong shape → `{ ok: false, error: AI_ERRORS.PARSE }`
  - [x] 3.6 Test duplicate hash: first response duplicates existing hash, second response is unique → returns second

## Dev Notes

- SDK: `@github/copilot-sdk` — `CopilotClient` with `createSession()`/`sendAndWait()`/`disconnect()`/`stop()`
- Create and tear down client+session per `generateQuestion` call — no shared state
- Error classification: check error message for `"401"`, `"unauthorized"`, `"authentication"`, `"unauthenticated"` (case-insensitive) → AUTH; all other errors → NETWORK
- `sendAndWait` returns `AssistantMessageEvent | undefined`; `event.data.content` is the text to parse
- Parse strategy: strip ````json` fences if present, then `JSON.parse`, then Zod validate
- `existingHashes` is `Set<string>` at the call site (caller converts from array)
- Do NOT start/stop the CopilotClient inside `generateQuestion` — the CLI connection overhead would make each call too slow. Instead, manage a module-level singleton that is lazily started and reused.
- Tests must mock `@github/copilot-sdk` entirely — no actual CLI connection in tests

## Dev Agent Record

### Implementation Plan
Task 1 (prompts.ts) and Task 2 (client.ts) were already implemented. Task 3 (tests) had all 13 test cases written but 12 were failing due to an incomplete SDK mock.

### Debug Log
- Root cause: `vi.mock('@github/copilot-sdk')` only exported `CopilotClient` but not `approveAll`. Vitest throws when `generateQuestion` accesses the missing `approveAll` export at runtime, which the outer try/catch misclassified as a NETWORK error.
- Fix: Added `approveAll: vi.fn()` to the mock factory return value.
- Removed two leftover DEBUG test cases that were used for troubleshooting.

### Completion Notes
- All 13 tests in `ai/client.test.ts` pass (success, parse error ×2, network error ×2, auth error ×3, dedup retry, no-retry, disconnect ×2)
- Full suite: 140/140 tests passing across 12 files

## File List

- src/ai/prompts.ts (modified)
- src/ai/client.ts (modified)
- src/ai/client.test.ts (new)
- package.json (modified — @github/copilot-sdk added)

## Change Log

- 2026-03-07: Story created — George
- 2026-03-08: Story completed — fixed SDK mock (added `approveAll` export), removed debug tests, all 13 tests green, 140/140 full suite
