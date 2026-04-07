# Story 7.7: OpenAI Compatible API Provider

Status: done

## Story

As a terminal quiz user,
I want to connect to any OpenAI-compatible API endpoint (e.g. Azure OpenAI, Groq, Together AI, Mistral, Perplexity, DeepSeek, LM Studio, vLLM, or corporate proxy servers),
so that I can use Brain Break with providers beyond the five built-in options without waiting for dedicated adapter support.

## Acceptance Criteria

1. `AiProviderType` enum includes `'openai-compatible'` as a valid value (6 total providers)
2. `PROVIDER_CHOICES` and `PROVIDER_LABELS` include the OpenAI Compatible API entry with label `'OpenAI Compatible API'`
3. `SettingsFileSchema` accepts optional `openaiCompatibleEndpoint` (string) and `openaiCompatibleModel` (string) fields with empty-string defaults
4. `defaultSettings()` returns `openaiCompatibleEndpoint: ''` and `openaiCompatibleModel: ''`
5. Existing settings files missing the new fields parse successfully via Zod `.default()` (backward compatibility)
6. `createProvider()` routes `'openai-compatible'` to a new adapter using `@ai-sdk/openai-compatible` and Vercel AI SDK `generateText()`
7. The adapter reads the API key from `OPENAI_COMPATIBLE_API_KEY` environment variable — never stored in settings
8. `AI_ERRORS.NETWORK_OPENAI_COMPATIBLE` is a function `(endpoint: string) => string` that includes the endpoint URL in the message
9. `AI_ERRORS.AUTH_OPENAI_COMPATIBLE` is a static string mentioning `OPENAI_COMPATIBLE_API_KEY`
10. `classifyProviderError()` routes `'openai-compatible'` to the correct `NETWORK_OPENAI_COMPATIBLE` and `AUTH_OPENAI_COMPATIBLE` errors
11. `validateProvider('openai-compatible', settings)` checks for `OPENAI_COMPATIBLE_API_KEY` env var — returns `AUTH_OPENAI_COMPATIBLE` if missing, `ok: true` if present (env-var-only; real connection test happens via `testProviderConnection()`)
12. `testProviderConnection('openai-compatible', settings)` makes a real one-shot API call and classifies errors correctly
13. Provider Setup screen shows 6 providers — selecting OpenAI Compatible API checks env var, prompts for endpoint URL (free-text, required) and model name (free-text, required), then tests connection
14. Settings screen shows 6 providers — selecting OpenAI Compatible API allows editing endpoint URL and model name (free-text); fields persisted via `writeSettings()`
15. All existing tests continue to pass — zero regressions
16. New code has comprehensive unit test coverage for every AC above

## Tasks / Subtasks

- [x] Task 1: Install `@ai-sdk/openai-compatible` dependency (AC: 6)
  - [x] 1.1 Run `npm install @ai-sdk/openai-compatible`
  - [x] 1.2 Verify it appears in `package.json` dependencies
  - [x] 1.3 Run `npm test` — all existing tests still pass

- [x] Task 2: Extend `domain/schema.ts` (AC: 1, 2, 3, 4, 5)
  - [x] 2.1 Add `'openai-compatible'` to `AiProviderTypeSchema` z.enum array
  - [x] 2.2 Add `{ name: 'OpenAI Compatible API', value: 'openai-compatible' }` to `PROVIDER_CHOICES` array (position: after Ollama, before any separator)
  - [x] 2.3 `PROVIDER_LABELS` auto-derives from `PROVIDER_CHOICES` — verify it includes `'openai-compatible': 'OpenAI Compatible API'`
  - [x] 2.4 Add `openaiCompatibleEndpoint: z.string().default('')` and `openaiCompatibleModel: z.string().default('')` to `SettingsFileSchema`
  - [x] 2.5 Update `defaultSettings()` to return `openaiCompatibleEndpoint: ''` and `openaiCompatibleModel: ''`
  - [x] 2.6 Write tests in `schema.test.ts`:
    - `AiProviderTypeSchema` accepts `'openai-compatible'`
    - `SettingsFileSchema` parses object with `openaiCompatibleEndpoint` and `openaiCompatibleModel`
    - `SettingsFileSchema` parses object *without* the new fields (backward compat — defaults to `''`)
    - `defaultSettings()` returns the new fields
    - `PROVIDER_CHOICES` has 6 entries
    - `PROVIDER_LABELS['openai-compatible']` === `'OpenAI Compatible API'`
  - [x] 2.7 Run `npm test` — all tests pass

- [x] Task 3: Add OpenAI Compatible adapter and errors to `ai/providers.ts` (AC: 6, 7, 8, 9, 10, 11, 12)
  - [x] 3.1 Add import: `import { createOpenAICompatible } from '@ai-sdk/openai-compatible'`
  - [x] 3.2 Add `NETWORK_OPENAI_COMPATIBLE` to `AI_ERRORS`:

    ```typescript
    NETWORK_OPENAI_COMPATIBLE: (endpoint: string) => `Could not reach the OpenAI Compatible API endpoint at ${endpoint}. Verify the endpoint URL in Settings and try again.`,
    ```

  - [x] 3.3 Add `AUTH_OPENAI_COMPATIBLE` to `AI_ERRORS`:

    ```typescript
    AUTH_OPENAI_COMPATIBLE: 'OpenAI Compatible API key is invalid or missing. Set the OPENAI_COMPATIBLE_API_KEY environment variable with a valid key and restart the app.',
    ```

  - [x] 3.4 Create `createOpenAICompatibleAdapter(settings: SettingsFile): AiProvider`:

    ```typescript
    function createOpenAICompatibleAdapter(settings: SettingsFile): AiProvider {
      const provider = createOpenAICompatible({
        baseURL: settings.openaiCompatibleEndpoint,
        apiKey: process.env['OPENAI_COMPATIBLE_API_KEY'] ?? '',
        name: 'openai-compatible',
      })
      return {
        async generateCompletion(prompt: string): Promise<string> {
          const { text } = await generateText({
            model: provider(settings.openaiCompatibleModel),
            prompt,
          })
          return text
        },
      }
    }
    ```

  - [x] 3.5 Add `'openai-compatible': () => createOpenAICompatibleAdapter(settings)` to the `adapters` record in `createProvider()`
  - [x] 3.6 Add `case 'openai-compatible':` to `validateProvider()` — env var check only (same pattern as OpenAI/Anthropic/Gemini; real connection test happens in `testProviderConnection()` which the setup screen calls separately):

    ```typescript
    case 'openai-compatible':
      return process.env['OPENAI_COMPATIBLE_API_KEY']
        ? { ok: true, data: undefined }
        : { ok: false, error: AI_ERRORS.AUTH_OPENAI_COMPATIBLE }
    ```

  - [x] 3.7 Refactor `classifyProviderError()` third parameter from `ollamaEndpoint` to `endpointOverride` for provider-agnostic endpoint injection, then add `case 'openai-compatible':` to both switch blocks:
    - Auth branch: `case 'openai-compatible': return AI_ERRORS.AUTH_OPENAI_COMPATIBLE`
    - Network branch: `case 'openai-compatible': return AI_ERRORS.NETWORK_OPENAI_COMPATIBLE(endpointOverride)`
    - Update all call sites to pass the correct endpoint for the active provider:
      - `testProviderConnection()` in `providers.ts`: `classifyProviderError(err, providerType, providerType === 'openai-compatible' ? settings.openaiCompatibleEndpoint : settings.ollamaEndpoint)`
      - `classifyError()` in `client.ts`: `classifyProviderError(err, settings?.provider ?? null, settings?.provider === 'openai-compatible' ? settings?.openaiCompatibleEndpoint : settings?.ollamaEndpoint)`
  - [x] 3.8 Update `isAuthErrorMessage()` in `ai/client.ts` — add `|| error === AI_ERRORS.AUTH_OPENAI_COMPATIBLE` to the return expression (required: without this, auth errors from OpenAI Compatible API are misclassified downstream)
  - [x] 3.9 Write tests in `providers.test.ts`:
    - `createProvider` returns an adapter for `'openai-compatible'` provider
    - OpenAI Compatible adapter calls `generateText` with correct model and prompt (mock `@ai-sdk/openai-compatible`)
    - `validateProvider('openai-compatible', settings)` returns `AUTH_OPENAI_COMPATIBLE` when env var missing
    - `validateProvider('openai-compatible', settings)` returns `ok: true` when env var present
    - `classifyProviderError` returns `AUTH_OPENAI_COMPATIBLE` for 401 errors with `'openai-compatible'` provider
    - `classifyProviderError` returns `NETWORK_OPENAI_COMPATIBLE(endpoint)` for generic errors with `'openai-compatible'` provider (verify correct endpoint is used, not ollamaEndpoint)
    - `AI_ERRORS.NETWORK_OPENAI_COMPATIBLE` includes endpoint in message
  - [x] 3.10 Update existing `isAuthErrorMessage` test in `client.test.ts` — add `AI_ERRORS.AUTH_OPENAI_COMPATIBLE` to the `it.each` array of auth error constants (the test already uses `it.each` for all 5 existing AUTH_* values)
  - [x] 3.11 Run `npm test` — all tests pass

- [x] Task 4: Update `screens/provider-settings.ts` for OpenAI Compatible API (AC: 13, 14)
  - [x] 4.1 Add OpenAI Compatible API case to `promptForProviderSettings()` — same pattern as Ollama:

    ```typescript
    if (provider === 'openai-compatible') {
      updatedSettings.openaiCompatibleEndpoint = (await input({
        message: 'Endpoint URL',
        default: settings.openaiCompatibleEndpoint || undefined,
        validate: (value: string) => value.trim() ? true : 'Endpoint URL cannot be empty',
      })).trim()

      updatedSettings.openaiCompatibleModel = (await input({
        message: 'Model Name',
        default: settings.openaiCompatibleModel || undefined,
        validate: (value: string) => value.trim() ? true : 'Model name cannot be empty',
      })).trim()

      return updatedSettings
    }
    ```

  - [x] 4.2 Verify `isHostedProvider()` does NOT include `'openai-compatible'` (it should only match openai/anthropic/gemini for the model select box flow)
  - [x] 4.3 Run `npm test` — all tests pass

- [x] Task 5: Update `screens/settings.ts` for OpenAI Compatible API fields (AC: 14)
  - [x] 5.1 Update `handleProviderAction()` function signature and body to pass `openaiCompatibleEndpoint` and `openaiCompatibleModel` alongside existing fields when calling `promptForProviderSettings()`
  - [x] 5.2 Ensure `showSettingsScreen()` local state tracks `openaiCompatibleEndpoint` and `openaiCompatibleModel` alongside existing `ollamaEndpoint`, `ollamaModel`, etc.
  - [x] 5.3 Ensure Save action includes the new fields in the `writeSettings()` call
  - [x] 5.4 Run `npm test` — all tests pass

- [x] Task 6: Final validation (AC: 15, 16)
  - [x] 6.1 Run full test suite: `npm test` — all tests pass
  - [x] 6.2 Run typecheck: `npm run typecheck` — zero errors
  - [x] 6.3 Verify test count increased (new tests added for OpenAI Compatible API)

## Dev Notes

### Architecture Compliance

- **Provider abstraction boundary:** `@ai-sdk/openai-compatible` may ONLY be imported in `ai/providers.ts` — nowhere else [Source: docs/planning-artifacts/architecture.md#Enforcement-Guidelines]
- **API key handling:** Read from `OPENAI_COMPATIBLE_API_KEY` env var at runtime — NEVER store in `settings.json` [Source: docs/planning-artifacts/architecture.md#Authentication-Security]
- **Result&lt;T&gt; pattern:** All I/O functions return `Result<T>` — never throw to callers [Source: docs/planning-artifacts/architecture.md#Error-Handling-Patterns]
- **ESM imports:** All imports use `.js` extension [Source: docs/planning-artifacts/architecture.md#Format-Patterns]

### Source Code Reference Patterns

**Closest reference adapter: Ollama** — but OpenAI Compatible uses Vercel AI SDK (`@ai-sdk/openai-compatible` + `generateText()`) instead of raw `fetch()`. The adapter body follows the same pattern as the OpenAI/Anthropic/Gemini adapters (~5 lines).

**Key difference from Ollama:** Ollama uses raw HTTP `fetch()` to `{endpoint}/api/generate`. OpenAI Compatible uses the Vercel AI SDK `createOpenAICompatible()` factory from `@ai-sdk/openai-compatible`, which internally calls `{endpoint}/chat/completions`. This means the adapter is thinner than Ollama's.

**Key difference from OpenAI/Anthropic/Gemini:** Those adapters import a pre-configured provider function (e.g., `openai()` from `@ai-sdk/openai`). OpenAI Compatible uses `createOpenAICompatible()` which accepts a `baseURL` parameter — similar to how you'd configure a custom endpoint.

### Settings screen field threading

`settings.ts` uses a local variable pattern where each provider's fields are tracked as local variables during the settings loop and only written on Save. The following variables need to be added to this pattern:

- `openaiCompatibleEndpoint`
- `openaiCompatibleModel`

Follow the exact same pattern as `ollamaEndpoint` / `ollamaModel` — search for all occurrences of those variable names in `settings.ts` and replicate for the new fields.

### classifyProviderError endpoint parameter

`classifyProviderError()` currently has a parameter named `ollamaEndpoint` that's used to inject the endpoint URL into the `NETWORK_OLLAMA` error message. For OpenAI Compatible API, the same pattern is needed but with `openaiCompatibleEndpoint`. Consider renaming the parameter to `endpointOverride` to make it provider-agnostic, or add a separate parameter. Check all call sites of `classifyProviderError` to understand the impact.

### validateProvider approach for openai-compatible

`validateProvider` uses env-var-only check (same as OpenAI/Anthropic/Gemini). The real connection test happens in `testProviderConnection()`, which the setup screen calls separately after `validateProvider` passes. This keeps validation fast and avoids a redundant API call.

### Project Structure Notes

- All changes are within existing files — no new files created
- Files to modify: `src/domain/schema.ts`, `src/ai/providers.ts`, `src/screens/provider-settings.ts`, `src/screens/settings.ts`
- Test files to modify: `src/domain/schema.test.ts`, `src/ai/providers.test.ts`
- Files also modified: `src/ai/client.ts` (Task 3.7: `classifyError()` endpoint routing, Task 3.8: `isAuthErrorMessage()` update)
- Test files also modified: `src/ai/client.test.ts` (Task 3.10: `isAuthErrorMessage` test update)
- No changes needed to: `src/ai/prompts.ts`, `src/router.ts`, `src/screens/provider-setup.ts` (uses `PROVIDER_CHOICES` from schema — auto-picks up the 6th entry)

### References

- [Source: docs/planning-artifacts/epics.md — Epic 7, Stories 7.1–7.5, FR6, FR26, FR27, FR28, FR30, NFR2]
- [Source: docs/planning-artifacts/architecture.md — Technical Constraints, Settings Schema, AI Provider Enum, Adapter Table, AI_ERRORS, Authentication & Security, Module Architecture]
- [Source: docs/planning-artifacts/prd.md — Feature 2, Feature 8]
- [Source: src/ai/providers.ts — createOllamaAdapter pattern, validateProvider switch, classifyProviderError switch, AI_ERRORS object]
- [Source: src/domain/schema.ts — AiProviderTypeSchema, SettingsFileSchema, PROVIDER_CHOICES, defaultSettings()]
- [Source: src/screens/provider-settings.ts — promptForProviderSettings() Ollama case]
- [Source: src/screens/settings.ts — handleProviderAction() field threading pattern]
- [Source: package.json — current @ai-sdk dependencies: @ai-sdk/openai ^3.0.47, @ai-sdk/anthropic ^3.0.63, @ai-sdk/google ^3.0.52]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debugging required — all tasks completed on first pass.

### Completion Notes List

- **Task 1:** Installed `@ai-sdk/openai-compatible@^2.0.40`. 1005/1005 tests passed.
- **Task 2:** Extended `AiProviderTypeSchema` (6 values), `PROVIDER_CHOICES` (6 entries), `SettingsFileSchema` (2 new fields with `z.string().default('')`), `defaultSettings()`. Added 8 tests in `schema.test.ts`. Fixed 2 existing roundtrip tests in `store.test.ts` and 1 provider-count test in `provider-setup.test.ts`. 1013/1013 tests passed.
- **Task 3:** Added `createOpenAICompatible` import, `NETWORK_OPENAI_COMPATIBLE` (function) + `AUTH_OPENAI_COMPATIBLE` (string) to `AI_ERRORS`, `createOpenAICompatibleAdapter` (Vercel AI SDK pattern), adapter entry in `createProvider()`, `case 'openai-compatible':` in `validateProvider()` (env-var-only), refactored `classifyProviderError()` 3rd param from `ollamaEndpoint` → `endpointOverride` with openai-compatible cases in both switch blocks, updated `classifyError()` in `client.ts` for provider-aware endpoint routing, added `AUTH_OPENAI_COMPATIBLE` to `isAuthErrorMessage()` in `client.ts`. Added 9 tests: 1 `createProvider` + 2 adapter + 2 `validateProvider` + 2 `classifyProviderError` + 1 `AI_ERRORS` + 1 `isAuthErrorMessage` in `client.test.ts`. 1022/1022 tests passed.
- **Task 4:** Added `openai-compatible` case to `promptForProviderSettings()` (free-text endpoint + model with validation). Updated `HostedProviderType` to exclude `'openai-compatible'`. `isHostedProvider()` correctly excludes it. 1022/1022 tests passed.
- **Task 5:** Threaded `openaiCompatibleEndpoint` and `openaiCompatibleModel` through `handleProviderAction()` (signature, all return paths, `promptForProviderSettings` call), `showSettingsScreen()` (local variables, destructuring, save action). 1022/1022 tests passed.
- **Task 6:** Final validation — 1022/1022 tests pass, `tsc --noEmit` zero errors, 17 new tests added (1005 → 1022).
- **Code review fixes:** Added 7 review-driven tests to close coverage gaps: 3 `testProviderConnection('openai-compatible')` cases in `providers.test.ts`, 1 OpenAI Compatible API first-launch setup flow test in `provider-setup.test.ts`, and 3 OpenAI Compatible API settings-screen tests in `settings.test.ts`. Re-ran full validation: 1029/1029 tests pass, `tsc --noEmit` zero errors, total new tests now 24 (1005 → 1029).
- **Additional fixes:** Updated `store.test.ts` roundtrip fixtures (2 tests) and `provider-setup.test.ts` provider count assertion (1 test) to account for new schema fields and 6th provider.

### File List

- `README.md` — provider list and requirements updated for OpenAI Compatible API
- `docs/planning-artifacts/prd.md` — PRD aligned to OpenAI Compatible API naming and provider count
- `docs/planning-artifacts/epics.md` — Epic 7 and FRs aligned to 6th provider
- `docs/planning-artifacts/product-brief.md` — provider count and summary aligned to 6th provider
- `docs/planning-artifacts/architecture.md` — architecture updated for OpenAI Compatible API adapter, settings, and errors
- `docs/implementation-artifacts/sprint-status.yaml` — story tracking updated through review completion
- `docs/implementation-artifacts/7-7-openai-compatible-api-provider.md` — story, review notes, file list, and status updated
- `package.json` — added `@ai-sdk/openai-compatible` dependency
- `package-lock.json` — lockfile updated
- `src/domain/schema.ts` — `AiProviderTypeSchema`, `PROVIDER_CHOICES`, `SettingsFileSchema`, `defaultSettings()`
- `src/domain/schema.test.ts` — 8 new tests for openai-compatible schema/choices/labels/defaults
- `src/domain/store.test.ts` — updated 2 roundtrip test fixtures with new fields
- `src/ai/providers.ts` — import, `AI_ERRORS` (2 new), `classifyProviderError` refactor, adapter, `createProvider`, `validateProvider`, `testProviderConnection` endpoint routing
- `src/ai/providers.test.ts` — mock for `@ai-sdk/openai-compatible`, 8 new tests
- `src/ai/client.ts` — `classifyError` provider-aware endpoint, `isAuthErrorMessage` update
- `src/ai/client.test.ts` — added `AUTH_OPENAI_COMPATIBLE` to `isAuthErrorMessage` `it.each`
- `src/screens/provider-settings.ts` — `HostedProviderType` exclude, openai-compatible prompt case
- `src/screens/provider-setup.test.ts` — updated provider count assertion (5→6, choices 7→8)
- `src/screens/settings.test.ts` — added OpenAI Compatible API selector, prompt, and persistence coverage
- `src/screens/settings.ts` — `handleProviderAction` signature + threading, `showSettingsScreen` local vars + save

## Senior Developer Review (AI)

### Review Date

2026-04-07

### Outcome

Approve

### Action Items

- [x] High — Added missing `testProviderConnection('openai-compatible')` success/auth/network coverage in `src/ai/providers.test.ts`.
- [x] High — Added missing OpenAI Compatible API first-launch setup and settings-screen coverage in `src/screens/provider-setup.test.ts` and `src/screens/settings.test.ts`.
- [x] Medium — Synced the story File List with the current git delta, including planning docs, README, sprint status, and the story file itself.

## Change Log

- 2026-04-07 — Addressed code review findings: added 7 review-driven tests for OpenAI Compatible API connection and UI flows, synced File List with git reality, and advanced story status from `review` to `done`.
