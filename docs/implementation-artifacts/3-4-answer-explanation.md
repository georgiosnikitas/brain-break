---
Story: 3.4
Title: Answer Explanation
Status: done
Epic: 3 — AI-Powered Adaptive Quiz
Created: 2026-03-25
---

# Story 3.4: Answer Explanation

## Story

As a user,
I want an "Explain answer" option after each quiz question so the AI can explain why the correct answer is right,
So that I can learn from every question immediately instead of having to look it up externally.

## Acceptance Criteria

- [x] AC1: After answering a quiz question and viewing the feedback panel, three post-answer options are shown: "💡 Explain answer", "▶️  Next question", and "🚪 Exit quiz"
- [x] AC2: Selecting "💡 Explain answer" starts an `ora` spinner with "Generating explanation..." while `generateExplanation()` is called; spinner stops and explanation is displayed inline below the feedback panel
- [x] AC3: The explanation is 2–4 sentences, covering why the correct answer is correct and optionally why common wrong choices are incorrect; uses the active language and tone from global settings
- [x] AC4: After the explanation is displayed, two options are shown: "▶️  Next question" and "🚪 Exit quiz" — the "Explain answer" option is no longer available for this question
- [x] AC5: `ai/prompts.ts` exports `buildExplanationPrompt(question, userAnswer, settings)` returning a structured prompt with the question text, all four options, the correct answer, the user's chosen answer, and the voice instruction
- [x] AC6: `ai/client.ts` exports `generateExplanation(question, userAnswer, settings)` returning `Result<string>` — calls `createProvider(settings).generateCompletion(prompt)` and returns `{ ok: true, data: <text> }` on success, `{ ok: false, error: <msg> }` on failure
- [x] AC7: If `generateExplanation()` returns `{ ok: false }`, a warning message is displayed (e.g. "Could not generate explanation.") and the user is returned to the Next/Exit prompt — the failure is non-critical
- [x] AC8: Ctrl+C (ExitPromptError) on the explain/next/exit prompt is handled gracefully and returns to the domain sub-menu
- [x] AC9: All tests pass — covering: explain option in post-answer prompt, `generateExplanation()` success and failure, explanation displayed after selection, explain option removed after use, language/tone injected into explanation prompt, graceful degradation on API failure

## Tasks / Subtasks

- [x] Task 1: Add `buildExplanationPrompt` to `ai/prompts.ts` (AC: 5)
  - [x] 1.1 Export `buildExplanationPrompt(question: Question, userAnswer: AnswerOption, settings?: SettingsFile): string`
  - [x] 1.2 Include question text, all 4 options, correct answer, user's answer, and voice instruction
  - [x] 1.3 Instruct model: 2–4 sentences, explain correct answer, optionally note why wrong choices are incorrect, plain text only

- [x] Task 2: Add `generateExplanation` to `ai/client.ts` (AC: 6)
  - [x] 2.1 Import `buildExplanationPrompt` from `./prompts.js`
  - [x] 2.2 Export `generateExplanation(question: Question, userAnswer: AnswerOption, settings?: SettingsFile): Promise<Result<string>>`
  - [x] 2.3 Follow `generateMotivationalMessage` pattern: createProvider → generateCompletion → trim → wrap in Result

- [x] Task 3: Update `screens/quiz.ts` for explain flow (AC: 1, 2, 3, 4, 7, 8)
  - [x] 3.1 Import `generateExplanation` from `../ai/client.js`
  - [x] 3.2 Replace `askNextAction()` with `askPostAnswerAction()` returning `'explain' | 'next' | 'exit' | null` (3-option prompt)
  - [x] 3.3 Add `askNextOrExit()` helper returning `'next' | 'exit' | null` (2-option prompt, used after explain)
  - [x] 3.4 In quiz loop after feedback: call `askPostAnswerAction()`; if `'explain'` → ora spinner → `generateExplanation()` → display result or warning → call `askNextOrExit()`
  - [x] 3.5 On explain failure, display warning with `warn()` and fall through to `askNextOrExit()`

- [x] Task 4: Write tests (AC: 9)
  - [x] 4.1 `prompts.test.ts`: test `buildExplanationPrompt` includes question, options, correct answer, user answer, voice instruction
  - [x] 4.2 `client.test.ts`: test `generateExplanation` success/failure paths, settings injection
  - [x] 4.3 `quiz.test.ts`: test 3-option prompt after answer, explain flow with spinner, explain removed after use, explain failure warning, Ctrl+C handling

## Dev Notes

- Follow `generateMotivationalMessage()` pattern exactly — same provider creation, try/catch, classifyError, Result wrapping
- `buildExplanationPrompt` follows pattern of `buildMotivationalPrompt` — voice instruction prefix, plain text output instruction
- `askPostAnswerAction` replaces `askNextAction` — the 3-option version; `askNextOrExit` is the old 2-option version renamed
- Spinner pattern already exists in quiz.ts for question generation — reuse same ora pattern
- `warn()` from format.js already used for write errors — reuse for explain failure
- `Question` type is already exported from `client.ts` and includes `question`, `options`, `correctAnswer`
- `AnswerOption` type is from `domain/schema.ts`
- No schema changes needed — explanation is ephemeral (not persisted to domain file)
- No router changes needed — same navigation flow

### Architecture Compliance

- Stays within existing `ai/` module boundary — no new modules or dependencies
- `Result<T>` pattern for all I/O (matches architecture)
- Provider-agnostic via `createProvider()` abstraction (matches architecture)
- Error classification via `classifyError()` (matches architecture)
- Voice instruction injection via `buildVoiceInstruction()` (matches architecture)

### File Structure

- `src/ai/prompts.ts` — add `buildExplanationPrompt()`
- `src/ai/client.ts` — add `generateExplanation()`
- `src/screens/quiz.ts` — modify `askNextAction` → `askPostAnswerAction`, add explain flow
- `src/ai/prompts.test.ts` — add `buildExplanationPrompt` tests
- `src/ai/client.test.ts` — add `generateExplanation` tests
- `src/screens/quiz.test.ts` — add explain flow tests, update existing tests for 3-option prompt

### References

- [Source: docs/planning-artifacts/prd.md#Feature 3]
- [Source: docs/planning-artifacts/epics.md#Story 3.4]
- [Source: docs/implementation-artifacts/3-3-interactive-quiz-loop.md]

## Dev Agent Record

### Agent Model Used

### Completion Notes List

- All 611 tests pass (23 new tests added: 8 in prompts.test.ts, 7 in client.test.ts, 8 in quiz.test.ts)
- `buildExplanationPrompt` follows `buildMotivationalPrompt` pattern — voice instruction prefix, plain text output
- `generateExplanation` follows `generateMotivationalMessage` pattern — createProvider, try/catch, classifyError, Result wrapping
- Extracted `showGenerationError` and `handleExplain` helpers from `showQuiz` to keep cognitive complexity ≤ 15
- Renamed `askNextAction` → `askPostAnswerAction` (3-option) and added `askNextOrExit` (2-option post-explain)
- SonarQube analysis: zero issues on all three modified source files

### File List

- src/ai/prompts.ts (modified — added `buildExplanationPrompt`)
- src/ai/client.ts (modified — added `generateExplanation`, imported `buildExplanationPrompt` and `AnswerOption`)
- src/screens/quiz.ts (modified — added explain flow with `askPostAnswerAction`, `askNextOrExit`, `handleExplain`, `showGenerationError`)
- src/ai/prompts.test.ts (modified — 8 new tests for `buildExplanationPrompt`)
- src/ai/client.test.ts (modified — 8 new tests for `generateExplanation`)
- src/screens/quiz.test.ts (modified — 8 new tests for explain flow, added `generateExplanation` mock)
- docs/planning-artifacts/prd.md (modified — FR35, Feature 3 updated)
- docs/planning-artifacts/epics.md (modified — FR35, Story 3.4, Epic 3 updated)
- docs/planning-artifacts/product-brief.md (modified — MVP feature summary updated)
- README.md (modified — explain answer feature bullet added)
- docs/implementation-artifacts/sprint-status.yaml (modified — story 3-4 added, epic-3 reopened)
