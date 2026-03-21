# Story 7.3: Provider-Agnostic AI Client

Status: done

## Story

As a developer,
I want `ai/client.ts` refactored to use `createProvider()` from `ai/providers.ts` instead of importing the Copilot SDK directly, and `AI_ERRORS` re-exported from `providers.ts` instead of defined locally,
so that the AI client is fully provider-agnostic and returns clear, actionable error messages for any provider failure.

## Acceptance Criteria

1. **Given** `ai/client.ts` is refactored
   **When** I inspect its imports
   **Then** it imports from `ai/providers.ts` (`createProvider`, `AI_ERRORS`, `AiProvider`) and `ai/prompts.ts` — it does **not** import any provider SDK directly (`@github/copilot-sdk`, `ai`, `@ai-sdk/*`, `ollama-ai-provider`)

2. **Given** `ai/client.ts` is refactored
   **When** `generateQuestion(domain, difficultyLevel, existingHashes, previousQuestions, settings)` is called
   **Then** it calls `createProvider(settings)` to get the active adapter
   **And** calls `provider.generateCompletion(prompt)` to get the raw response
   **And** strips JSON fences and validates with `QuestionResponseSchema` (Zod)
   **And** returns `Result<Question>` — same public interface as before

3. **Given** the configured provider is unreachable
   **When** `generateQuestion()` catches a network error
   **Then** it classifies the error and returns `{ ok: false, error: AI_ERRORS.NETWORK_<PROVIDER> }` with the provider-specific message

4. **Given** the configured provider returns an authentication failure
   **When** `generateQuestion()` catches an auth error
   **Then** it returns `{ ok: false, error: AI_ERRORS.AUTH_<PROVIDER> }` with the provider-specific message

5. **Given** `AI_ERRORS` is re-exported from `client.ts`
   **When** I import it
   **Then** it contains all constants from `providers.ts`: `NO_PROVIDER`, `PARSE`, `NETWORK_COPILOT`, `NETWORK_OPENAI`, `NETWORK_ANTHROPIC`, `NETWORK_GEMINI`, `NETWORK_OLLAMA` (function), `AUTH_COPILOT`, `AUTH_OPENAI`, `AUTH_ANTHROPIC`, `AUTH_GEMINI`, `AUTH_OLLAMA`
   **And** `client.ts` exports `isAuthErrorMessage(error: string): boolean` that returns `true` for any `AUTH_*` error constant — used by `quiz.ts` to replace the old `=== AI_ERRORS.AUTH` check

6. **Given** `generateMotivationalMessage(trigger, settings)` exists
   **When** it is called
   **Then** it also uses `createProvider(settings)` — not the Copilot SDK directly

7. **Given** `ai/client.test.ts` is updated
   **When** I run `npm test`
   **Then** all tests pass, covering: success path via `createProvider()`, per-provider network error classification, per-provider auth error classification, parse error, `NO_PROVIDER` when provider is null

8. **Given** `screens/quiz.ts` is updated to use `isAuthErrorMessage()`
   **When** an auth error is returned from any provider
   **Then** `quiz.ts` correctly identifies it as an auth error and calls `process.exit(1)`
   **And** `quiz.test.ts` tests continue to pass with updated mock and assertions

## Tasks / Subtasks

- [x] Task 1: Refactor `ai/client.ts` — replace Copilot SDK imports with provider abstraction (AC: 1, 2, 6)
  - [x] 1.1 Remove `import { CopilotClient, approveAll } from '@github/copilot-sdk'`
  - [x] 1.2 Remove the `_client` singleton, `getClient()`, `_setClient()`, and `isAuthError()` helper — all Copilot-specific internals
  - [x] 1.3 Add `import { createProvider, AI_ERRORS, type AiProvider } from './providers.js'`
  - [x] 1.4 Re-export `AI_ERRORS` from `client.ts` so downstream consumers (`screens/quiz.ts`, `screens/select-domain.ts`) keep working without import path changes
  - [x] 1.5 Keep `stripJsonFences()` and `parseAndValidate()` helpers untouched — they are provider-agnostic
  - [x] 1.6 Keep `buildQuestionPrompt`, `buildDeduplicationPrompt`, `buildMotivationalPrompt`, `QuestionResponseSchema` imports from `./prompts.js` untouched
  - [x] 1.7 Add `import { defaultSettings } from '../domain/schema.js'` — needed for `settings ?? defaultSettings()` fallback when settings parameter is undefined
  - [x] 1.8 Export `isAuthErrorMessage(error: string): boolean` helper that checks against all `AUTH_*` values

- [x] Task 2: Implement `classifyError()` helper (AC: 3, 4) — **must be done before Tasks 3–4 which depend on it**
  - [x] 2.1 Create private `classifyError(err: unknown, settings?: SettingsFile): string` function
  - [x] 2.2 Check for auth indicators: `401`, `unauthorized`, `unauthenticated`, `authentication`, `api key`, `invalid key` in error message
  - [x] 2.3 If auth error → return provider-specific `AI_ERRORS.AUTH_<PROVIDER>` using `settings.provider`
  - [x] 2.4 If network error → return provider-specific `AI_ERRORS.NETWORK_<PROVIDER>` using `settings.provider` (for Ollama, call `AI_ERRORS.NETWORK_OLLAMA(settings.ollamaEndpoint)`)
  - [x] 2.5 If `settings.provider` is null or undefined → fall back to `AI_ERRORS.NO_PROVIDER`

- [x] Task 3: Refactor `generateQuestion()` to use `createProvider()` (AC: 2, 3, 4)
  - [x] 3.1 Call `createProvider(settings ?? defaultSettings())` at function entry — propagate `{ ok: false }` immediately if provider is null
  - [x] 3.2 Replace `client.createSession()` + `session.sendAndWait()` with `provider.generateCompletion(prompt)` for the first attempt
  - [x] 3.3 Replace retry path — call `provider.generateCompletion(retryPrompt)` for deduplication retry
  - [x] 3.4 Remove `session.disconnect()` in `finally` — the provider adapter handles its own cleanup
  - [x] 3.5 Use `classifyError(err, settings)` in catch block for provider-specific error mapping

- [x] Task 4: Refactor `generateMotivationalMessage()` to use `createProvider()` (AC: 6)
  - [x] 4.1 Call `createProvider(settings ?? defaultSettings())` at function entry
  - [x] 4.2 Replace `client.createSession()` + `session.sendAndWait()` with `provider.generateCompletion(prompt)`
  - [x] 4.3 Use same `classifyError(err, settings)` for error mapping

- [x] Task 5: Update `ai/client.test.ts` tests (AC: 7, 8)
  - [x] 5.1 Replace `@github/copilot-sdk` mock with `./providers.js` mock — mock `createProvider` to return a fake `AiProvider`
  - [x] 5.2 Remove `_setClient()` calls — no longer relevant
  - [x] 5.3 Update success path tests: verify `createProvider()` is called with settings and `generateCompletion()` receives the built prompt
  - [x] 5.4 Update dedup retry test: verify second `generateCompletion()` call with dedup prompt
  - [x] 5.5 Update error tests: replace generic `NETWORK` / `AUTH` assertions with provider-specific error constants (e.g., `AI_ERRORS.NETWORK_COPILOT`, `AI_ERRORS.AUTH_COPILOT` for copilot provider settings)
  - [x] 5.6 Add `NO_PROVIDER` test: when `createProvider()` returns `{ ok: false, error: AI_ERRORS.NO_PROVIDER }`, both `generateQuestion` and `generateMotivationalMessage` return `{ ok: false, error: AI_ERRORS.NO_PROVIDER }`
  - [x] 5.7 Add parse error test: verify `AI_ERRORS.PARSE` still works when response is not valid JSON
  - [x] 5.8 Update motivational message tests to use provider mock instead of Copilot SDK mock
  - [x] 5.9 Update settings injection tests to verify settings flow to `createProvider()` and to prompt builders
  - [x] 5.10 Update edge case tests (null event, fence stripping, non-Error throws) to work with provider mock
  - [x] 5.11 Verify `AI_ERRORS` re-export works: import `{ AI_ERRORS }` from `./client.js` and assert it contains `NO_PROVIDER`, `PARSE`, and all per-provider constants

- [x] Task 6: Update `ai/client.test.ts` — `isAuthErrorMessage` tests (AC: 5, 8)
  - [x] 6.1 Add test: `isAuthErrorMessage(AI_ERRORS.AUTH_COPILOT)` returns `true`
  - [x] 6.2 Add test: `isAuthErrorMessage(AI_ERRORS.AUTH_OPENAI)` returns `true`
  - [x] 6.3 Add test: `isAuthErrorMessage('some random error')` returns `false`
  - [x] 6.4 Add test: `isAuthErrorMessage(AI_ERRORS.NETWORK_COPILOT)` returns `false`

- [x] Task 7: Update `screens/quiz.ts` and `screens/quiz.test.ts` for auth error compatibility (AC: 8)
  - [x] 7.1 Update `quiz.ts` import: add `isAuthErrorMessage` to the import from `../ai/client.js`
  - [x] 7.2 Replace `questionResult.error === AI_ERRORS.AUTH` (line 88) with `isAuthErrorMessage(questionResult.error)`
  - [x] 7.3 Update `quiz.test.ts` mock of `../ai/client.js`: replace `AI_ERRORS: { NETWORK: '...', AUTH: '...', PARSE: '...' }` with the actual per-provider constants re-exported from `providers.ts`, and add `isAuthErrorMessage` to the mock
  - [x] 7.4 Update quiz test assertions that check for `AI_ERRORS.AUTH` / `AI_ERRORS.NETWORK` to use per-provider constants (e.g., `AI_ERRORS.AUTH_COPILOT`, `AI_ERRORS.NETWORK_COPILOT`) with a copilot-configured settings mock
  - [x] 7.5 Confirm `screens/select-domain.ts` imports `{ generateMotivationalMessage }` from `../ai/client.js` — no changes needed

- [x] Task 8: Verify SDK import isolation (AC: 1)
  - [x] 8.1 `grep -rn "@github/copilot-sdk" src/ --include="*.ts" | grep -v providers | grep -v test` — must return empty
  - [x] 8.2 `grep -rn "from 'ai'" src/ --include="*.ts" | grep -v providers | grep -v test` — must return empty
  - [x] 8.3 `grep -rn "@ai-sdk/" src/ --include="*.ts" | grep -v providers | grep -v test` — must return empty
  - [x] 8.4 `grep -rn "ollama-ai-provider" src/ --include="*.ts" | grep -v providers | grep -v test` — must return empty

- [x] Task 9: Run full test suite and verify no regressions (AC: 7, 8)
  - [x] 9.1 Run `npm test` — all tests must pass
  - [x] 9.2 Run `npm run typecheck` — zero type errors

## Dev Notes

### Architecture requirements
- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- `ai/client.ts` is the **business-logic** layer — it builds prompts, calls the provider, parses responses
- `ai/providers.ts` is the **adapter** layer — it creates provider instances and handles SDK-specific concerns
- After this story, `ai/client.ts` must have **zero** direct provider SDK imports
- `AI_ERRORS` is defined in `providers.ts` and re-exported from `client.ts` for backward compatibility with screen imports

### Current `client.ts` structure (what changes)
- **REMOVE:** `import { CopilotClient, approveAll } from '@github/copilot-sdk'` (line 1)
- **REMOVE:** `_client` singleton, `getClient()`, `_setClient()` — replaced by `createProvider()`
- **REMOVE:** `isAuthError()` — replaced by `classifyError()` that returns provider-specific messages
- **REMOVE:** local `AI_ERRORS` definition — replaced by re-export from `providers.ts`
- **KEEP:** `stripJsonFences()`, `parseAndValidate()` — these are provider-agnostic
- **KEEP:** `Question` type export, function signatures, `Result<>` return type

### What stays the same (public API contract)
- `generateQuestion(domain, difficultyLevel, existingHashes, previousQuestions?, settings?)` → `Result<Question>`
- `generateMotivationalMessage(trigger, settings?)` → `Result<string>`
- `AI_ERRORS` exported object with error message constants
- `Question` type alias
- Deduplication retry logic (hash check → retry with dedup prompt) is unchanged

### `classifyError()` design
Map `settings.provider` to the correct `AI_ERRORS.NETWORK_*` / `AI_ERRORS.AUTH_*`:
```
copilot  → NETWORK_COPILOT / AUTH_COPILOT
openai   → NETWORK_OPENAI  / AUTH_OPENAI
anthropic→ NETWORK_ANTHROPIC/ AUTH_ANTHROPIC
gemini   → NETWORK_GEMINI  / AUTH_GEMINI
ollama   → NETWORK_OLLAMA(endpoint) / AUTH_OLLAMA
null     → NO_PROVIDER (fallback)
```
Auth detection: check error message for `401`, `unauthorized`, `unauthenticated`, `authentication`, `api key`, `invalid key` (case-insensitive).

### `defaultSettings()` import
When `settings` parameter is `undefined`, use `defaultSettings()` from `../domain/schema.js` so `createProvider()` always receives a valid `SettingsFile`. 
`defaultSettings()` returns `{ provider: null, ... }` which causes `createProvider()` to return `NO_PROVIDER` error — correct behavior for unconfigured app.

### Previous story learnings (from 7-2)
- `ollama-ai-provider` v1.2.0 exports `LanguageModelV1` but `ai` v6 expects `LanguageModelV3` — type assertion already handled in `providers.ts`
- `_setCopilotClient()` test helper remains in `providers.ts` for provider-level tests; `client.ts` tests should NOT use it
- Provider SDK mocks should be in `providers.test.ts` only; `client.test.ts` should mock `./providers.js` module

### Test refactoring strategy
The current `client.test.ts`:
- Mocks `@github/copilot-sdk` and injects a fake `CopilotClient` via `_setClient()`
- Tests interact with `mockSendAndWait` / `mockCreateSession` / `mockDisconnect`

After refactoring:
- Mock `./providers.js` module: `createProvider` returns `{ ok: true, data: mockProvider }` where `mockProvider.generateCompletion` is a `vi.fn()`
- No Copilot SDK mock needed in `client.test.ts`
- Tests verify: `createProvider` called with correct settings, `generateCompletion` called with built prompt, proper error mapping

### Downstream impact — `quiz.ts` breaking change (MUST FIX)
- `screens/quiz.ts` line 88 does `questionResult.error === AI_ERRORS.AUTH` — this constant no longer exists after refactor
- `screens/quiz.test.ts` lines 27–30 hard-code a mock `AI_ERRORS: { NETWORK: '...', AUTH: '...', PARSE: '...' }` — these keys won't exist in the re-exported `AI_ERRORS`
- **Solution:** Export `isAuthErrorMessage(error: string): boolean` from `client.ts` and update `quiz.ts` to use it
- **Task 7** covers both `quiz.ts` and `quiz.test.ts` updates

### `quiz.ts` compatibility approach
Export from `client.ts`:
```typescript
export function isAuthErrorMessage(error: string): boolean {
  return error === AI_ERRORS.AUTH_COPILOT
    || error === AI_ERRORS.AUTH_OPENAI
    || error === AI_ERRORS.AUTH_ANTHROPIC
    || error === AI_ERRORS.AUTH_GEMINI
    || error === AI_ERRORS.AUTH_OLLAMA
}
```
Update `quiz.ts` line 88: `if (isAuthErrorMessage(questionResult.error))` instead of `=== AI_ERRORS.AUTH`.
Update `quiz.test.ts` mock to include all per-provider `AI_ERRORS` constants and `isAuthErrorMessage`.

### Project Structure Notes
- All AI client code in `src/ai/client.ts` — no path changes
- All AI provider code in `src/ai/providers.ts` — no path changes  
- Tests co-located: `src/ai/client.test.ts`
- `screens/quiz.ts` — import updated to include `isAuthErrorMessage`, `=== AI_ERRORS.AUTH` replaced
- `screens/quiz.test.ts` — mock updated: old `{ NETWORK, AUTH, PARSE }` keys replaced with per-provider constants + `isAuthErrorMessage` mock

### References
- [Source: docs/planning-artifacts/epics.md#Story 7.3]
- [Source: docs/implementation-artifacts/7-2-ai-provider-abstraction-layer.md — Dev Notes, Debug Log]
- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- [Source: src/ai/client.ts — current implementation]
- [Source: src/ai/providers.ts — provider abstraction layer]
- [Source: src/ai/providers.test.ts — provider test patterns]
- [Source: src/screens/quiz.ts#L88 — AI_ERRORS.AUTH check that needs updating]

## Dev Agent Record

### Agent Model Used


### Debug Log References


### Completion Notes List


### Senior Developer Review (AI)

**Date:** 2026-03-21

**Issues Found:** 0 High, 1 Medium, 1 Low

**MEDIUM — Fixed:** Missing `generateMotivationalMessage` NO_PROVIDER test. Task 5.6 claimed both functions were tested for NO_PROVIDER, but only `generateQuestion` had the test. Added the missing test.

**LOW — Pre-existing, not fixed:** `screens/quiz.ts` calls `process.exit(1)` on auth errors. The architecture spec says auth errors should return to the domain sub-menu (same as network errors). This behavior predates story 7-3 — the story only changed the detection method from `=== AI_ERRORS.AUTH` to `isAuthErrorMessage()`. Should be addressed in a future story.

### File List

- `src/ai/client.ts` — refactored: removed Copilot SDK imports, uses `createProvider()` + `AiProvider`, re-exports `AI_ERRORS`, exports `isAuthErrorMessage()`, private `classifyError()` helper
- `src/ai/client.test.ts` — rewritten: mocks `./providers.js` instead of `@github/copilot-sdk`, tests per-provider error classification, `isAuthErrorMessage`, `AI_ERRORS` re-export
- `src/screens/quiz.ts` — updated import: `isAuthErrorMessage` replaces `AI_ERRORS.AUTH` equality check
- `src/screens/quiz.test.ts` — updated mock: uses `importOriginal` pattern, per-provider error constants
