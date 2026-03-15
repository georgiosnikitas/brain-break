# Story 5.3: Language & Tone Injection into AI Prompts

Status: done

## Story

As a user,
I want every AI-generated question and answer option to be rendered in my configured language and tone of voice,
So that the quiz experience matches my personal preference from start to finish.

## Acceptance Criteria

1. **Given** `ai/prompts.ts` is updated  
   **When** I call `buildQuestionPrompt(domain, difficultyLevel, settings)`  
   **Then** the prompt includes a voice instruction prepended to the generation request — e.g. `"Respond in Greek using a pirate tone of voice."`  
   **And** when `settings.language` is `"English"` and `settings.tone` is `"normal"`, no voice instruction prefix is added

2. **Given** `ai/client.ts` is updated  
   **When** `generateQuestion(domain, difficultyLevel, existingHashes, previousQuestions, settings)` is called  
   **Then** it passes `settings` to `buildQuestionPrompt()` and `buildDeduplicationPrompt()` so language + tone are injected into every API call

3. **Given** `screens/quiz.ts` is updated  
   **When** a quiz session starts  
   **Then** `readSettings()` is called once at session start and the result is passed to every `generateQuestion()` call in that session

4. **Given** the active language is `"Spanish"` and tone is `"enthusiastic"`  
   **When** a question is generated  
   **Then** the prompt sent to the API contains `"Respond in Spanish using an enthusiastic tone of voice."`

5. **Given** `ai/client.test.ts` and `ai/prompts.test.ts` are updated/created  
   **When** I run `npm test`  
   **Then** all tests pass, covering: settings injected into prompt, language + tone appear in prompt, neutral case (English/normal) produces no voice prefix, deduplication retry also injects settings

## Tasks / Subtasks

- [x] Update `src/ai/prompts.ts` (AC: 1)
  - [x] Import `type SettingsFile` from `../domain/schema.js`
  - [x] Add `buildVoiceInstruction(settings)` private helper
  - [x] Add optional `settings?: SettingsFile` param to `buildQuestionPrompt()`
  - [x] Add optional `settings?: SettingsFile` param to `buildDeduplicationPrompt()` and pass through

- [x] Update `src/ai/client.ts` (AC: 2)
  - [x] Import `type SettingsFile` from `../domain/schema.js`
  - [x] Add optional `settings?: SettingsFile` as 5th param to `generateQuestion()`
  - [x] Pass `settings` to `buildQuestionPrompt()` (first attempt)
  - [x] Pass `settings` to `buildDeduplicationPrompt()` (retry)

- [x] Update `src/screens/quiz.ts` (AC: 3)
  - [x] Add `readSettings` to store imports
  - [x] Add `defaultSettings, type SettingsFile` to schema imports
  - [x] Call `readSettings()` once at top of `showQuiz()`, fallback to `defaultSettings()` on failure
  - [x] Pass `settings` as 5th arg to `generateQuestion()`

- [x] Create `src/ai/prompts.test.ts` (AC: 1, 4, 5)
  - [x] Test no voice instruction when no settings passed
  - [x] Test no voice instruction for English/normal settings
  - [x] Test language + tone instruction for non-default language + tone
  - [x] Test language-only instruction when tone is normal but language is non-English
  - [x] Test tone instruction when language is English but tone is non-normal
  - [x] Test voice instruction appears before main prompt body
  - [x] Test deduplication prompt passes settings through

- [x] Update `src/ai/client.test.ts` (AC: 2, 5)
  - [x] Test `generateQuestion` succeeds with settings param
  - [x] Test voice instruction appears in prompt sent to API for non-default settings
  - [x] Test no voice instruction when English/normal settings passed
  - [x] Test deduplication retry prompt also injects voice instruction

- [x] Update `src/screens/quiz.test.ts` (AC: 3)
  - [x] Add `readSettings` to store mock
  - [x] Setup `mockReadSettings` default return value in `beforeEach`
  - [x] Test `readSettings` called once per session start
  - [x] Test settings passed to `generateQuestion`
  - [x] Test fallback to `defaultSettings` when `readSettings` fails

## Dev Notes

### Voice instruction logic
- If `language === 'English'` AND `tone === 'normal'`: no prefix added
- If `tone === 'normal'` but language is non-English: `"Respond in {language}."`
- Otherwise: `"Respond in {language} using a {tone} tone of voice."`
- Instruction is prepended to the prompt with a blank line separator (`\n\n`)

### Backward compatibility
- All new `settings` params are optional (`settings?: SettingsFile`) — existing call sites continue to work without passing settings
- `buildQuestionPrompt` with no settings arg → no voice instruction (existing behavior preserved)

### Files to modify
- `src/ai/prompts.ts` — add voice instruction logic
- `src/ai/client.ts` — thread settings param through to prompt builders
- `src/screens/quiz.ts` — read settings once per session, pass to generateQuestion

### Files to create
- `src/ai/prompts.test.ts` — new test file for prompt builders

## Dev Agent Record

### Implementation Notes
- `buildVoiceInstruction(settings)` — no prefix for English/normal; language-only for normal tone + non-English; full "language + tone" for all other combos
- All new params are optional (`settings?: SettingsFile`) — all existing call sites remain compatible
- `readSettings()` called once per `showQuiz()` invocation (not per question loop iteration); falls back to `defaultSettings()` on failure

### Senior Developer Review (AI)
**Outcome:** Changes Requested | **Date:** 2026-03-15
**Action Items:** 2 fixed

- [x] [M1] `settings.language` injected raw into prompt without sanitization — fixed via `sanitizeInput()` in `buildVoiceInstruction()`
- [x] [M2] Grammar error `"a enthusiastic"` — fixed with vowel-check article (`a/an`) logic

### Completion Notes
- All tests pass after review fixes
- 20 tests in quiz.test.ts, 14 in client.test.ts, 12 in prompts.test.ts (new sanitization test added)

## File List
- src/ai/prompts.ts
- src/ai/client.ts
- src/screens/quiz.ts
- src/ai/prompts.test.ts
- src/ai/client.test.ts
- src/screens/quiz.test.ts
