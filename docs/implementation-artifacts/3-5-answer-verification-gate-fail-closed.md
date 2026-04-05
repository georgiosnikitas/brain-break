---
Story: 3.5
Title: Answer Verification Gate (Fail-Closed)
Status: done
Epic: 3 - AI-Powered Adaptive Quiz
Created: 2026-04-05
---

## Story 3.5: Answer Verification Gate (Fail-Closed)

## Story

As a user,
I want the system to independently verify the AI's correct answer before presenting the question to me,
so that I can trust the quiz results and not be penalized for choosing the right answer when the AI got it wrong.

## Acceptance Criteria

**Given** `ai/prompts.ts` exports `buildVerificationPrompt(question, settings?)`  
**When** called with a generated question  
**Then** it returns a structured prompt that presents the finalized question text and all four options without revealing any pre-selected answer  
**And** instructs the AI to return both `correctAnswer` and `correctOptionText` for the selected option  
**And** includes the active language and tone voice instruction when settings are provided  
**And** `VerificationResponseSchema` (Zod) is exported and validates the response shape `{ correctAnswer: "A" | "B" | "C" | "D", correctOptionText: string }`

**Given** `ai/client.ts` implements `verifyAnswer(question, provider, settings?)`  
**When** called after a question is generated  
**Then** it sends the verification prompt to the same provider and validates the returned `correctAnswer` and `correctOptionText` against the candidate question's finalized options  
**And** accepts the verification result only when `correctAnswer` points to the same option whose text exactly matches `correctOptionText`  
**And** explicitly marks the candidate as retry-required whenever the verification response cannot be proven consistent locally

**Given** the verification response is not valid JSON, does not match the schema, or the verification call throws a network/provider error  
**When** `verifyAnswer()` encounters the failure  
**Then** the candidate question is rejected and `generateQuestion()` starts a fresh generation + shuffle + verification cycle

**Given** `generateQuestion()` receives a valid question from the AI  
**When** the verification response's `correctAnswer` and `correctOptionText` do not align on the same option  
**Then** the question is discarded and regenerated with a fresh prompt  
**And** the full candidate cycle is retried with a bounded budget of 3 candidate attempts total (initial attempt + 2 retries)  
**And** if all attempts fail, `generateQuestion()` returns `{ ok: false, error: <generation/verification error> }` and no question is shown to the user

**Given** a duplicate question triggers the deduplication retry path  
**When** the dedup question is generated  
**Then** it is also verified via `verifyAnswer()` before being returned  
**And** the same fail-closed candidate budget applies to the dedup path

**Given** `ai/client.test.ts` and `ai/prompts.test.ts` are updated  
**When** I run `npm test`  
**Then** all tests pass, covering: verification accepts only aligned `correctAnswer` + `correctOptionText`, verification parse/schema/network failures trigger retries, retry budget exhaustion returns `{ ok: false }`, verification prompt does not reveal a pre-selected answer, voice instruction injected into verification prompt, and dedup path verification uses the same fail-closed budget

## Tasks / Subtasks

- [x] Task 1: Split generation-candidate data from the verified runtime question contract (AC: 1, 2, 4)
  - [x] 1.1 Replace the current generation schema in `src/ai/prompts.ts` so `QuestionResponseSchema` no longer includes `correctAnswer`.
  - [x] 1.2 Stop aliasing `Question = QuestionResponse` in `src/ai/client.ts`; introduce or derive a verified runtime `Question` shape that still includes `correctAnswer` for quiz, challenge, explanation, micro-lesson, and persistence flows.
  - [x] 1.3 Retype prompt helpers so `buildVerificationPrompt()` accepts an unverified finalized candidate, while `buildExplanationPrompt()` and `buildMicroLessonPrompt()` continue to require a verified question.

- [x] Task 2: Update the verification prompt contract to prove the answer locally (AC: 1, 2)
  - [x] 2.1 Expand `VerificationResponseSchema` to require both `correctAnswer` and `correctOptionText`.
  - [x] 2.2 Rewrite `buildVerificationPrompt()` so it asks for both fields, still hides any pre-selected answer, and preserves the existing voice-instruction injection pattern.
  - [x] 2.3 Keep prompt sanitization behavior intact for question text and option text.

- [x] Task 3: Refactor `generateQuestion()` into a fail-closed, bounded candidate loop (AC: 2, 3, 4, 5)
  - [x] 3.1 Replace the current verify-then-shuffle flow with generate -> parse -> shuffle finalized options -> verify finalized options.
  - [x] 3.2 Remove the current shuffle logic that remaps a generated `correctAnswer`; once generation no longer returns a trusted answer key, shuffling must operate on options only.
  - [x] 3.3 Replace the current fail-open `verifyAnswer()` boolean behavior so parse/schema/provider failures reject the current candidate instead of silently passing it through.
  - [x] 3.4 Implement a bounded loop of 3 total candidate attempts per question (initial attempt + 2 retries) that covers both normal generation and deduplication retries.
  - [x] 3.5 Return only verified runtime questions from `generateQuestion()`; on budget exhaustion return a non-success `Result` with the final provider-specific or generation/verification error.
  - [x] 3.6 Keep provider creation and provider-specific error classification inside `src/ai/client.ts` and `src/ai/providers.ts`; do not move provider-specific logic into screens.

- [x] Task 4: Preserve the existing single-source integration path for quiz and challenge flows (AC: 4, 5)
  - [x] 4.1 Keep `preloadQuestions()` delegating to `generateQuestion()` instead of duplicating verification logic.
  - [x] 4.2 Confirm `src/screens/quiz.ts` and `src/screens/challenge.ts` continue to compare `userAnswer === question.correctAnswer` without any scoring-rule changes.
  - [x] 4.3 Update any impacted type annotations in `src/router.ts`, `src/screens/quiz.ts`, `src/screens/challenge.ts`, or `src/domain/scoring.ts` only if required by the new verified `Question` shape.

- [x] Task 5: Update and expand automated coverage around verification and preload behavior (AC: 5)
  - [x] 5.1 Update `src/ai/prompts.test.ts` so verification-prompt tests assert the new `correctOptionText` contract, voice injection, sanitization, and the absence of any revealed pre-selected answer.
  - [x] 5.2 Update `src/ai/client.test.ts` helpers and fixtures so generation responses no longer carry `correctAnswer`, while verification responses now carry both `correctAnswer` and `correctOptionText`.
  - [x] 5.3 Add client tests for: aligned letter + text success, text mismatch failure, parse/schema/network verification failures causing retries, retry budget exhaustion, and dedup-path verification using the same bounded budget.
  - [x] 5.4 Update preload-focused tests so challenge-mode question preparation fails when any question exhausts its verification budget and succeeds only with verified questions.
  - [x] 5.5 Review any challenge/router tests that assert preload failure handling and update them only if the new fail-closed error path changes their expectations.

- [x] Task 6: Validate the implementation with targeted and full verification passes (AC: 5)
  - [x] 6.1 Run targeted Vitest coverage for `src/ai/client.test.ts`, `src/ai/prompts.test.ts`, and any affected challenge/router preload tests.
  - [x] 6.2 Run `npm run typecheck`.
  - [x] 6.3 Run the full `npm test` suite and only fix failures caused by this story's changes.

## Dev Notes

### Scope Note

- This story is the implementation vehicle for the answer-verification redesign now reflected across planning in Story 3.1, Story 3.5, and Story 11.2. Deliver the coordinated code changes here so the AI pipeline stays coherent.
- The planning docs are already aligned as of 2026-04-05. Do not spend this story rewriting PRD, epics, or architecture unless an implementation detail proves them wrong.
- Do not introduce algebra-specific heuristics or one-off answer-fixing logic. The approved solution is architectural: fail-closed verification with bounded retries.

### Current Code Reality

- `src/ai/prompts.ts` still treats generation as trusted: `QuestionResponseSchema` currently requires `correctAnswer`, and `VerificationResponseSchema` currently validates only `correctAnswer`.
- `src/ai/client.ts` currently verifies the generated question before returning it, but the implementation is still fail-open:
  - verification parse errors return `true`
  - verification schema mismatches return `true`
  - verification provider/network failures return `true`
  - answer mismatch triggers a single regenerate-once branch instead of a bounded fail-closed loop
- `src/ai/client.ts` currently exports `type Question = QuestionResponse`, which will become incorrect as soon as generation and verified-runtime contracts diverge.
- `shuffleOptions()` currently depends on a generated `correctAnswer` and remaps it after shuffling. That behavior must be replaced because generation will no longer supply the trusted answer key.
- `src/screens/quiz.ts` and `src/screens/challenge.ts` already use `userAnswer === question.correctAnswer` as the local grading rule. That part is correct and should remain the consumer-facing contract.

### Architecture Guardrails

- `src/ai/client.ts` remains the single orchestration point for question generation, verification, deduplication, and preload reuse.
- `src/ai/providers.ts` remains the only module with provider SDK imports and provider-specific error strings.
- Preserve the existing `Result<T>` boundaries and `AI_ERRORS` re-export pattern established by Story 7.3.
- Verification is now a mandatory approval gate. Questions without a successful verification result must never leave `src/ai/client.ts`.
- Challenge preload must inherit the exact same generation and verification behavior by continuing to call `preloadQuestions()` -> `generateQuestion()`.
- No new dependencies are required. Keep the implementation inside the current TypeScript, Zod, Vercel AI SDK, and Vitest stack.

### File-Level Guidance

#### `src/ai/prompts.ts`

- Update the generation schema to remove `correctAnswer` from the model contract.
- Expand the verification schema to include `correctOptionText`.
- Keep `buildVoiceInstruction()` behavior unchanged.
- Re-evaluate prompt-builder parameter types carefully:
  - `buildVerificationPrompt()` should accept the finalized candidate question with shuffled options but no trusted answer key.
  - `buildExplanationPrompt()` and `buildMicroLessonPrompt()` still need a verified question with `correctAnswer`.

#### `src/ai/client.ts`

- Refactor parsing helpers so generation parsing and verified-question construction are separate steps.
- Change the candidate order to: generate raw candidate -> parse candidate -> shuffle options -> verify finalized candidate -> build verified runtime `Question`.
- `verifyAnswer()` should reject any response that cannot be proven locally. The local proof is: `question.options[result.correctAnswer] === result.correctOptionText`.
- The attempt budget is per question, not per sub-step. Dedup retries must spend from the same 3-attempt budget rather than creating an unlimited side path.
- Preserve the existing provider creation and error-classification patterns from Story 7.3.

#### `src/ai/client.test.ts`

- Existing helpers currently assume generation returns `correctAnswer` and verification returns only a letter. Those fixtures need to be split.
- Update the existing verification tests that currently assert fail-open behavior; those expectations are now intentionally stale.
- Add at least one explicit text-mismatch case where `correctAnswer` points to an option whose text does not equal `correctOptionText`.
- Cover both the standard generation path and the deduplication path under the same bounded retry model.

#### `src/ai/prompts.test.ts`

- Existing verification-prompt tests already cover hidden-answer behavior and voice injection. Extend those tests rather than replacing them.
- Add assertions that the prompt requests both `correctAnswer` and `correctOptionText` and still returns JSON only.

#### `src/router.ts`, `src/screens/quiz.ts`, `src/screens/challenge.ts`, `src/domain/scoring.ts`

- These files are downstream consumers of a verified runtime question.
- Avoid behavioral changes here unless type fallout requires them.
- If type updates are needed, keep them minimal and do not duplicate verification logic outside `src/ai/client.ts`.

### Previous Story Intelligence

- Story 7.3 (`docs/implementation-artifacts/7-3-provider-agnostic-ai-client.md`) centralized provider concerns in `src/ai/providers.ts`. Do not reintroduce provider SDK imports or provider-specific branches in screens.
- Story 3.4 (`docs/implementation-artifacts/3-4-answer-explanation.md`) and Story 3.8 depend on a verified question object that already contains `correctAnswer`. Preserve that runtime contract for explanation and micro-lesson flows.
- The challenge-mode implementation added in commit `1b0c117` introduced `preloadQuestions()` and router wiring for sprint preparation. Reuse that path instead of special-casing challenge-mode verification.

### Git Intelligence Summary

- Recent top-of-tree commits are mostly maintenance and provider-order/version work, not AI-pipeline redesign. Keep this story focused on the AI layer and its tests.
- Relevant historical change:
  - `1b0c117 feat: add sprint challenge mode (Epic 11)` added `src/ai/client.ts` preload support plus router/challenge integration. This is the shared path that must inherit the new fail-closed behavior.

### Library / Framework Requirements

- Node.js `>=22.0.0`
- TypeScript `^6.0.2`
- Vitest `^4.0.18`
- Zod `^4.3.6`
- `ai` `^6.0.134`
- `@ai-sdk/openai` `^3.0.47`
- `@ai-sdk/anthropic` `^3.0.63`
- `@ai-sdk/google` `^3.0.52`
- `@github/copilot-sdk` `^0.2.1`
- Keep using `randomInt` from `node:crypto` for option shuffling. No dependency changes are expected for this story.

### Project Structure Notes

- No `project-context.md` file is present in the repo.
- There is no existing implementation artifact for Story 3.5; this file is now the source of truth for the implementation slice.
- The older implementation artifact for Story 3.1 is historical context only. The updated planning docs override its old generation-schema assumptions.
- A stale repo-memory note mentions an algebra-specific answer-key correction path. The current source does not implement that behavior, and this story must not add it.

### Testing Requirements

- Minimum targeted coverage:
  - `src/ai/client.test.ts`
  - `src/ai/prompts.test.ts`
  - any affected preload integration tests such as `src/router.challenge.test.ts`
- Full validation before completion:
  - `npm run typecheck`
  - `npm test`
- If unrelated pre-existing failures surface, document them and avoid broad opportunistic fixes.

### References

- `docs/planning-artifacts/prd.md` - Feature 2, Feature 3, Feature 17, Project-Type Requirements / Implementation Decisions
- `docs/planning-artifacts/epics.md` - Story 3.5, Story 11.2, FR6, FR44
- `docs/planning-artifacts/architecture.md` - Response Validation, `ai/client.ts` Role, Error Handling Strategy
- `docs/implementation-artifacts/7-3-provider-agnostic-ai-client.md`
- `docs/implementation-artifacts/3-4-answer-explanation.md`
- `src/ai/client.ts`
- `src/ai/prompts.ts`
- `src/ai/client.test.ts`
- `src/ai/prompts.test.ts`
- `src/router.ts`
- `src/screens/quiz.ts`

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

### Completion Notes List

- All 6 tasks completed. Generation schema no longer includes `correctAnswer`. Verification returns both `correctAnswer` and `correctOptionText` with local proof alignment. `generateQuestion()` is now a bounded 3-attempt fail-closed loop. All 953 tests pass, typecheck clean. No downstream consumer changes required — `Question` type is now `VerifiedQuestion` which structurally satisfies all existing usages.
- Review follow-up fixes applied: verification-side provider failures now preserve provider-specific errors, local proof compares the same sanitized option text shown in the verification prompt, and duplicate-only exhaustion returns a dedicated generation error instead of `PARSE`.

### File List

- docs/implementation-artifacts/3-5-answer-verification-gate-fail-closed.md
- docs/implementation-artifacts/sprint-status.yaml
- docs/planning-artifacts/prd.md
- docs/planning-artifacts/epics.md
- docs/planning-artifacts/architecture.md
- src/ai/prompts.ts
- src/ai/client.ts
- src/ai/prompts.test.ts
- src/ai/client.test.ts
- src/ai/providers.ts
- src/ai/providers.test.ts
- src/__test-helpers__/factories.ts
