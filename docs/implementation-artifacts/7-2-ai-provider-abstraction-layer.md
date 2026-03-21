# Story 7.2: AI Provider Abstraction Layer

Status: done

## Story

As a developer,
I want `ai/providers.ts` to define an `AiProvider` interface and implement 5 provider adapters (4 via Vercel AI SDK + 1 custom Copilot) with a `createProvider()` factory and `validateProvider()` readiness check,
So that all AI calls are routed through a unified interface and adding a new provider requires only implementing the adapter — no changes to business logic.

## Acceptance Criteria

1. **Given** `ai/providers.ts` is implemented
   **When** I import `AiProvider`
   **Then** it is an interface with a single method: `generateCompletion(prompt: string): Promise<string>`

2. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = 'openai'`
   **Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/openai`

3. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = 'anthropic'`
   **Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/anthropic`

4. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = 'gemini'`
   **Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `@ai-sdk/google`

5. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = 'ollama'`
   **Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses Vercel AI SDK `generateText()` with `ollama-ai-provider`, using `settings.ollamaEndpoint` and `settings.ollamaModel`

6. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = 'copilot'`
   **Then** it returns `{ ok: true, data: <AiProvider> }` where the adapter uses the `@github/copilot-sdk` directly (custom adapter, not Vercel AI SDK)

7. **Given** `ai/providers.ts` is implemented
   **When** I call `createProvider(settings)` with `settings.provider = null`
   **Then** it returns `{ ok: false, error: AI_ERRORS.NO_PROVIDER }`

8. **Given** `ai/providers.ts` exports `validateProvider(providerType, settings)`
   **When** called with `providerType = 'openai'`
   **Then** it checks for the `OPENAI_API_KEY` environment variable and returns `{ ok: true }` if present, `{ ok: false, error: <auth message> }` if missing

9. **Given** `validateProvider()` is called with `providerType = 'anthropic'`
   **When** the function runs
   **Then** it checks for the `ANTHROPIC_API_KEY` environment variable

10. **Given** `validateProvider()` is called with `providerType = 'gemini'`
    **When** the function runs
    **Then** it checks for the `GOOGLE_API_KEY` environment variable

11. **Given** `validateProvider()` is called with `providerType = 'ollama'`
    **When** the function runs
    **Then** it tests connection to `settings.ollamaEndpoint` and returns success/failure accordingly

12. **Given** `validateProvider()` is called with `providerType = 'copilot'`
    **When** the function runs
    **Then** it checks Copilot SDK authentication readiness

13. **Given** `ai/providers.ts` is the **only** module that imports provider SDKs
    **When** I grep the codebase for Vercel AI SDK or Copilot SDK imports
    **Then** they appear only in `ai/providers.ts` — no other module imports provider SDKs directly

14. **Given** `ai/providers.test.ts` exists
    **When** I run `npm test`
    **Then** all tests pass, covering: `createProvider()` for all 5 providers (SDK mocked), null provider error, `validateProvider()` success and failure for each provider type

## Tasks / Subtasks

- [x] Task 1: Install Vercel AI SDK dependencies (AC: 2–5)
  - [x] `npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google ollama-ai-provider`
  - [x] Verify all 5 packages appear in `package.json` dependencies

- [x] Task 2: Create `src/ai/providers.ts` with `AiProvider` interface (AC: 1)
  - [x] Export `interface AiProvider { generateCompletion(prompt: string): Promise<string> }`

- [x] Task 3: Implement `AI_ERRORS` per-provider error constants (AC: 7–12)
  - [x] `NO_PROVIDER`, `PARSE` — generic messages
  - [x] `NETWORK_COPILOT`, `NETWORK_OPENAI`, `NETWORK_ANTHROPIC`, `NETWORK_GEMINI` — per-provider network messages
  - [x] `NETWORK_OLLAMA` — function taking endpoint URL
  - [x] `AUTH_COPILOT`, `AUTH_OPENAI`, `AUTH_ANTHROPIC`, `AUTH_GEMINI`, `AUTH_OLLAMA` — per-provider auth messages

- [x] Task 4: Implement Copilot adapter (AC: 6, 12)
  - [x] Custom adapter using `@github/copilot-sdk` `CopilotClient` + `createSession` + `sendAndWait`
  - [x] Lazy singleton `CopilotClient` with `_setCopilotClient()` test helper
  - [x] Session disconnect in `finally` block

- [x] Task 5: Implement OpenAI adapter (AC: 2)
  - [x] Uses Vercel AI SDK `generateText()` with `@ai-sdk/openai` + `gpt-4o-mini` model

- [x] Task 6: Implement Anthropic adapter (AC: 3)
  - [x] Uses Vercel AI SDK `generateText()` with `@ai-sdk/anthropic` + `claude-sonnet-4-20250514` model

- [x] Task 7: Implement Gemini adapter (AC: 4)
  - [x] Uses Vercel AI SDK `generateText()` with `@ai-sdk/google` + `gemini-2.0-flash` model

- [x] Task 8: Implement Ollama adapter (AC: 5)
  - [x] Uses Vercel AI SDK `generateText()` with `ollama-ai-provider` `createOllama()` + settings-driven model and endpoint
  - [x] Type assertion for `LanguageModelV1` → `LanguageModel` compatibility (`ollama-ai-provider` not yet updated for `@ai-sdk/provider` v3)

- [x] Task 9: Implement `createProvider()` factory (AC: 2–7)
  - [x] Returns `{ ok: false, error: AI_ERRORS.NO_PROVIDER }` when `settings.provider` is null
  - [x] Returns `{ ok: true, data: <adapter> }` for each valid provider type
  - [x] Uses Record-based lookup for clean dispatch

- [x] Task 10: Implement `validateProvider()` function (AC: 8–12)
  - [x] OpenAI: checks `OPENAI_API_KEY` env var
  - [x] Anthropic: checks `ANTHROPIC_API_KEY` env var
  - [x] Gemini: checks `GOOGLE_API_KEY` env var
  - [x] Ollama: fetches `{endpoint}/api/tags` to verify reachability
  - [x] Copilot: creates / validates CopilotClient session

- [x] Task 11: Verify SDK import isolation (AC: 13) — **partial: Vercel AI SDK isolated; `@github/copilot-sdk` remains in `client.ts` until Story 7.3 migrates it**
  - [x] Grep confirms Vercel AI SDK imports (`ai`, `@ai-sdk/*`, `ollama-ai-provider`) only in `ai/providers.ts`
  - [ ] `@github/copilot-sdk` import in `client.ts` — deferred to Story 7.3 (Provider-Agnostic AI Client)

- [x] Task 12: Write `src/ai/providers.test.ts` (AC: 14)
  - [x] `createProvider()` returns NO_PROVIDER error for null provider
  - [x] `createProvider()` returns ok:true with AiProvider for all 5 providers
  - [x] OpenAI adapter calls `generateText()` with correct model and prompt
  - [x] Anthropic adapter calls `generateText()` with correct model and prompt
  - [x] Gemini adapter calls `generateText()` with correct model and prompt
  - [x] Ollama adapter calls `createOllama()` with baseURL and correct model
  - [x] Copilot adapter uses `CopilotClient.createSession()` + `sendAndWait()`
  - [x] Copilot adapter disconnects session even on error
  - [x] Copilot adapter trims whitespace, handles null event
  - [x] `validateProvider()` for OpenAI: env var present → ok, missing → auth error
  - [x] `validateProvider()` for Anthropic: env var present → ok, missing → auth error
  - [x] `validateProvider()` for Gemini: env var present → ok, missing → auth error
  - [x] `validateProvider()` for Ollama: reachable → ok, unreachable → auth error
  - [x] `validateProvider()` for Copilot: session success → ok, failure → auth error
  - [x] `AI_ERRORS` constants verification (all messages present and correct)

- [x] Task 13: Run full test suite and verify no regressions (AC: 14)
  - [x] Run `npm test` — all 464 tests pass (23 test files)
  - [x] Run `npm run typecheck` — type checking passes with zero errors

## Dev Notes

### Architecture requirements
- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- `AiProvider` interface: single method `generateCompletion(prompt: string): Promise<string>`
- `createProvider(settings: SettingsFile): Result<AiProvider>` — factory returning adapter or error
- `validateProvider(providerType: AiProviderType, settings: SettingsFile): Promise<Result<void>>` — readiness check
- Provider SDKs must ONLY be imported in `ai/providers.ts` — enforcement rule from architecture
- Copilot adapter is custom (`@github/copilot-sdk`); other 4 use Vercel AI SDK `generateText()`

### Provider models
- OpenAI: `gpt-4o-mini`
- Anthropic: `claude-sonnet-4-20250514`
- Gemini: `gemini-2.0-flash`
- Ollama: `settings.ollamaModel` (default: `llama3`)

### `ollama-ai-provider` compatibility note
- `ollama-ai-provider` v1.2.0 exports `LanguageModelV1`, but `ai` v6 expects `LanguageModelV3`
- Type assertion `as unknown as LanguageModel` used for compatibility — runtime behavior is correct
- Will be resolved when `ollama-ai-provider` updates to `@ai-sdk/provider` v3

### Story 7.3 dependency
- Story 7.3 (Provider-Agnostic AI Client) will refactor `ai/client.ts` to use `createProvider()` from this module
- `AI_ERRORS` from `providers.ts` replaces the existing `AI_ERRORS` in `client.ts`
- Current `client.ts` Copilot-only implementation remains functional until 7.3

## Dev Agent Record

### Senior Developer Review (AI)

**Reviewer:** Adversarial Code Review (2026-03-21)
**Verdict:** PASS with annotations

**Findings (2 total — 0 Critical, 1 High→downgraded to Medium, 1 Medium):**

1. **[MEDIUM] AC 13 partially met — `client.ts` still imports `@github/copilot-sdk`**
   `src/ai/client.ts:1` retains `import { CopilotClient, approveAll } from '@github/copilot-sdk'`. This is expected — Story 7.3 will migrate `client.ts` to use `createProvider()`. Task 11 and AC 13 annotated as partial. No code fix needed.

2. **[MEDIUM] `package-lock.json` not in File List**
   Git shows `package-lock.json` modified (expected for dependency additions). Added to File List.

**Clean Areas:** AC 1–12 fully verified. Code quality clean — thin adapters, Record-based dispatch, session cleanup in `finally`. 34 real tests with proper mocks and assertions. No security issues. Architecture compliance verified.

### Completion Notes
13 of 14 acceptance criteria fully satisfied. AC 13 (SDK import isolation) is partially met — all Vercel AI SDK imports are isolated in `providers.ts`, but `@github/copilot-sdk` remains in `client.ts` until Story 7.3 migrates it to use the provider abstraction. Implementation creates `src/ai/providers.ts` with:
- `AiProvider` interface with `generateCompletion()` method
- 5 adapter factories (Copilot custom, OpenAI/Anthropic/Gemini/Ollama via Vercel AI SDK)
- `createProvider()` factory with null-provider error handling
- `validateProvider()` readiness check (env vars for OpenAI/Anthropic/Gemini, endpoint fetch for Ollama, session check for Copilot)
- Full `AI_ERRORS` with per-provider network and auth messages
- `_setCopilotClient()` test helper for mock injection

Test coverage: 34 tests across createProvider, all 5 adapters, validateProvider for each provider, and AI_ERRORS constants.

### Debug Log
- Initial `ollama-ai-provider` import used `ollama()` with `{ baseURL }` option — wrong API. Fixed to `createOllama({ baseURL })`.
- `ollama-ai-provider` v1.2.0 returns `LanguageModelV1` but `ai` v6 expects `LanguageModelV3`. Added `as unknown as LanguageModel` type assertion.

## File List
- `src/ai/providers.ts` — NEW: AiProvider interface, 5 adapters, createProvider, validateProvider, AI_ERRORS
- `src/ai/providers.test.ts` — NEW: 34 tests covering all exports
- `package.json` — MODIFIED: added `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `ollama-ai-provider` dependencies
- `package-lock.json` — MODIFIED: lockfile updated for new dependencies

## Change Log
- 2026-03-21: Story implemented — created providers.ts with AiProvider interface, 5 provider adapters, createProvider factory, validateProvider, and AI_ERRORS. 34 new tests. 464/464 total tests pass.
- 2026-03-21: Code review — annotated Task 11/AC 13 as partial (`@github/copilot-sdk` in `client.ts` deferred to 7.3). Added `package-lock.json` to File List.
