# Story 7.5: Settings Screen — Provider Configuration

Status: done

## Story

As a user,
I want to change my AI provider from the Settings screen at any time — including configuring Ollama's endpoint and model — with the same validation that runs on first launch,
so that I can switch providers or fix configuration issues without restarting the app.

## Acceptance Criteria

1. **Given** I am on the Settings screen, **When** I inspect the available options, **Then** an "AI Provider" selector is present as the first configuration option, above Question Language and Tone of Voice, **And** it shows the currently configured provider name.

2. **Given** I select the AI Provider option, **When** the provider selector opens, **Then** I can choose from 5 providers via arrow key navigation: GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama.

3. **Given** I select a new provider (e.g., "Anthropic"), **When** the selection is confirmed, **Then** `validateProvider('anthropic', settings)` is called, **And** a success or failure message is displayed (same validation as first-launch setup), **And** the provider selection is updated in the in-memory settings (persisted on Save).

4. **Given** I select "Ollama" as the provider, **When** the selection is confirmed, **Then** I am prompted to edit the endpoint URL (pre-filled with current `ollamaEndpoint`) and model name (pre-filled with current `ollamaModel`), **And** validation tests the connection, **And** the Ollama-specific fields are updated in the in-memory settings.

5. **Given** I have changed the provider on the Settings screen, **When** I select "Save", **Then** `writeSettings()` persists the new provider, `ollamaEndpoint`, and `ollamaModel` (if applicable) alongside language and tone, **And** I am returned to the home screen, **And** the new provider takes effect on the next AI call — no app restart required.

6. **Given** I have changed the provider on the Settings screen, **When** I select "Back" (or press Ctrl+C), **Then** no changes are written and I return to the home screen with the original provider still active.

7. **Given** `screens/settings.test.ts` is updated, **When** I run `npm test`, **Then** all tests pass, covering: AI Provider option present on Settings screen, provider selector renders all 5 options, provider change triggers validation, Ollama prompts for endpoint/model, Save persists provider, Back discards provider change, `clearScreen()` called.

## Tasks / Subtasks

- [x] Task 1: Add provider-related imports and constants to `src/screens/settings.ts` (AC: 1, 2)
  - [x] 1.1 Add imports: `validateProvider` from `../ai/providers.js`, `type AiProviderType` from `../domain/schema.js`, `success`, `warn` from `../utils/format.js`
  - [x] 1.2 Add `PROVIDER_CHOICES` array: `[{ name: 'GitHub Copilot', value: 'copilot' }, { name: 'OpenAI', value: 'openai' }, { name: 'Anthropic', value: 'anthropic' }, { name: 'Google Gemini', value: 'gemini' }, { name: 'Ollama', value: 'ollama' }]` — same constant already in `provider-setup.ts`
  - [x] 1.3 Add `PROVIDER_LABELS` record: `Record<AiProviderType, string>` built from `PROVIDER_CHOICES` — maps `'copilot'` → `'GitHub Copilot'` etc., same pattern as `provider-setup.ts`

- [x] Task 2: Add "AI Provider" option to the Settings screen main menu (AC: 1, 2, 3, 4)
  - [x] 2.1 Add `'provider'` to the `SettingsAction` union type: `type SettingsAction = 'provider' | 'language' | 'tone' | 'save' | 'back'`
  - [x] 2.2 Add a `provider` local variable initialized from `currentSettings.provider` (same pattern as `language` and `tone`)
  - [x] 2.3 Add `ollamaEndpoint` and `ollamaModel` local variables initialized from `currentSettings.ollamaEndpoint` and `currentSettings.ollamaModel`
  - [x] 2.4 Insert "AI Provider" as the **first** choice in the `select()` `choices` array, **before** Language: `{ name: \`AI Provider:   ${provider ? PROVIDER_LABELS[provider] : 'Not set'}\`, value: 'provider' as const }`
  - [x] 2.5 Handle the `'provider'` action in the `if/else` chain (after the existing `if (action === 'language')` etc.): call a new inline block for provider selection (detailed in Task 3)

- [x] Task 3: Implement provider selection + validation within the Settings loop (AC: 2, 3, 4)
  - [x] 3.1 When `action === 'provider'`: call `select<AiProviderType>()` with `PROVIDER_CHOICES`, `default: provider ?? undefined`, and `theme: menuTheme` to let user pick a new provider
  - [x] 3.2 If selected provider is `'ollama'`: prompt for `ollamaEndpoint` via `input()` (default: current `ollamaEndpoint`), trim, fallback to current value if empty; then prompt for `ollamaModel` via `input()` (default: current `ollamaModel`), trim, fallback to current value if empty
  - [x] 3.3 Call `validateProvider(selectedProvider, { ...currentSettings, provider: selectedProvider, ollamaEndpoint, ollamaModel })` — pass a settings object with the updated values for validation
  - [x] 3.4 On validation success: display `console.log(success(\`\\n✓ ${PROVIDER_LABELS[selectedProvider]} is ready to go!\`))`
  - [x] 3.5 On validation failure: display `console.log(warn(\`\\n${validationResult.error}\`))` — **non-blocking**, provider is still updated in local state
  - [x] 3.6 Update the `provider` local variable to the selected provider; if Ollama, also update `ollamaEndpoint` and `ollamaModel` local variables

- [x] Task 4: Update Save path to persist provider fields (AC: 5)
  - [x] 4.1 Update the `writeSettings()` call in the `'save'` branch to include `provider`, `ollamaEndpoint`, and `ollamaModel`: `writeSettings({ ...currentSettings, language, tone, provider, ollamaEndpoint, ollamaModel })`

- [x] Task 5: Ensure Back/Ctrl+C discards provider changes (AC: 6)
  - [x] 5.1 Verify that the `'back'` branch does NOT call `writeSettings()` — existing behavior already correct, no code change needed
  - [x] 5.2 Verify that `ExitPromptError` handler does NOT call `writeSettings()` — existing behavior already correct, no code change needed
  - [x] 5.3 Verify that `ExitPromptError` thrown during provider `select()` or Ollama `input()` prompts is caught by the existing outer `try/catch` — the outer `try/catch` already wraps the entire `while` loop, so no additional handling needed

- [x] Task 6: Update `src/screens/settings.test.ts` with provider-related tests (AC: 7)
  - [x] 6.1 Add mock for `../ai/providers.js`: `vi.mock('../ai/providers.js', () => ({ validateProvider: vi.fn() }))` and import `validateProvider`
  - [x] 6.2 Add mock for `../utils/format.js`: ensure `success`, `warn`, `menuTheme` are mocked (note: `menuTheme` is already imported and mocked via `vi.mock('../utils/format.js', ...)` — add `success` and `warn` mocks)
  - [x] 6.3 Set default mock: `mockValidateProvider.mockResolvedValue({ ok: true, data: undefined })` in `beforeEach`
  - [x] 6.4 Test: AI Provider option is the first choice in the select menu — verify `select()` first call has `choices[0]` containing `'AI Provider'`
  - [x] 6.5 Test: Selecting "AI Provider" then choosing "openai" → `validateProvider('openai', ...)` called, then loop continues (user selects "back")
  - [x] 6.6 Test: Provider validation success → `console.log` called with success message containing provider label
  - [x] 6.7 Test: Provider validation failure → `console.log` called with warning message (non-blocking, loop continues)
  - [x] 6.8 Test: Selecting Ollama → `input()` called twice (endpoint, model), `validateProvider('ollama', ...)` called with updated endpoint/model
  - [x] 6.9 Test: Ollama empty input fallback → empty string from `input()` falls back to existing `ollamaEndpoint`/`ollamaModel` values
  - [x] 6.10 Test: Save after provider change → `writeSettings()` called with updated `provider`, `ollamaEndpoint`, `ollamaModel` fields alongside `language` and `tone`
  - [x] 6.11 Test: Back after provider change → `writeSettings()` NOT called, original settings preserved
  - [x] 6.12 Test: `ExitPromptError` during provider select → `writeSettings()` NOT called, `router.showHome()` called
  - [x] 6.13 Test: Provider shows "Not set" label when `currentSettings.provider` is `null`

- [x] Task 7: Full regression test suite (AC: 7)
  - [x] 7.1 Run `npm test` — all new and existing tests pass
  - [x] 7.2 Run `npm run typecheck` — zero type errors

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- Screen file is `src/screens/settings.ts` — **MODIFY existing file**, do NOT create a new screen file
- Co-located test: `src/screens/settings.test.ts` — **MODIFY existing file**
- Every screen MUST call `clearScreen()` as its first side-effectful operation (already done in settings.ts)
- Use `menuTheme` from `utils/format.js` for all `select()` calls (already done in settings.ts)
- Use `ExitPromptError` from `@inquirer/core` for Ctrl+C handling (already done in settings.ts)
- `select()` and `input()` from `@inquirer/prompts` — the project uses `@inquirer/prompts` (not `inquirer`)
- Use `Separator` from `@inquirer/prompts` for visual grouping (already imported in settings.ts)

### Existing Settings Screen Pattern

- [Source: src/screens/settings.ts]
- The settings screen is a **loop** (unlike provider-setup which is one-shot)
- Main menu uses `select<SettingsAction>()` with choices: Language, Tone, Separator, Save, Back
- Each option modifies a local variable (`language`, `tone`), NOT the settings object directly
- Only `Save` calls `writeSettings()` with all local variables spread onto `currentSettings`
- `Back` and `ExitPromptError` exit without saving — changes are discarded
- After the loop (save or back), `router.showHome()` is called

### How to Add Provider to the Settings Loop

- **Pattern**: Follow exactly how `language` and `tone` work:
  1. Initialize local var from `currentSettings`: `let provider = currentSettings.provider`
  2. Add `'provider'` to `SettingsAction` type
  3. Add choice to `select()` — first position, before Language
  4. Handle `action === 'provider'` in the if/else chain
  5. Update `writeSettings()` call in Save branch to include `provider`, `ollamaEndpoint`, `ollamaModel`
- **Provider display name**: Use `PROVIDER_LABELS[provider]` or `'Not set'` when `provider === null`
- **Validation within loop**: After selecting a provider, run `validateProvider()` and display result — this does NOT save, user must explicitly choose Save
- **Key difference from provider-setup.ts**: The settings screen does NOT auto-save after validation. Provider selection + validation just updates local state. Only Save persists.

### Provider Validation API

- [Source: src/ai/providers.ts]
- `validateProvider(providerType: AiProviderType, settings: SettingsFile): Promise<Result<void>>` — already exists
- Returns `{ ok: true, data: undefined }` on success
- Returns `{ ok: false, error: string }` on failure — the `error` string is user-facing from `AI_ERRORS`
- **DO NOT reimplement validation logic** — call `validateProvider()` from `ai/providers.ts`
- **DO NOT import provider SDKs** — only `validateProvider` and types are needed

### Provider Constants — Reuse Pattern

- [Source: src/screens/provider-setup.ts]
- `PROVIDER_CHOICES` and `PROVIDER_LABELS` are already defined in `provider-setup.ts`
- For settings.ts, **duplicate these constants** (do NOT import from provider-setup.ts — screens should not import from other screens)
- Exact same values: `[{ name: 'GitHub Copilot', value: 'copilot' }, ...]`
- Alternative: extract to a shared location like `utils/constants.ts` — but this is over-engineering for 2 consumers. Duplicate is fine.

### Settings API

- [Source: src/domain/store.ts, src/domain/schema.ts]
- `readSettings(): Promise<Result<SettingsFile>>` — returns `defaultSettings()` on ENOENT
- `writeSettings(settings: SettingsFile): Promise<Result<void>>` — atomic write
- `defaultSettings()` returns `{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`

### Color/Formatting Helpers

- [Source: src/utils/format.ts]
- `success(text)` — `chalk.green(text)`, returns styled string
- `warn(text)` — `chalk.yellow(text)`, returns styled string
- `menuTheme` — already imported in settings.ts
- Usage: `console.log(success('✓ OpenAI is ready to go!'))`, `console.log(warn(validationResult.error))`

### Previous Story Learnings (from 7.4)

- [Source: docs/implementation-artifacts/7-4-first-launch-provider-setup-screen.md]
- `PROVIDER_CHOICES` array order: Copilot, OpenAI, Anthropic, Gemini, Ollama
- `PROVIDER_LABELS` built from `PROVIDER_CHOICES` via `Object.fromEntries` + `as Record<AiProviderType, string>`
- Ollama empty-input fallback: `(await input(...)).trim() || settings.ollamaEndpoint` — use same pattern
- `ExitPromptError` must be caught to prevent crashes on Ctrl+C
- `validateProvider()` return: check `.ok` then display via `success()` or `warn()`
- `writeSettings` error check: `if (!result.ok) console.error(...)` — same pattern in settings.ts already

### Testing Pattern

- [Source: src/screens/settings.test.ts]
- Mock modules: `@inquirer/prompts`, `@inquirer/core` (for `ExitPromptError`), `../domain/store.js`, `../router.js`, `../utils/screen.js`
- Mock `@github/copilot-sdk` to prevent import errors: `vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))`
- Use `vi.mocked()` for type-safe mock access
- `beforeEach`: `vi.clearAllMocks()`, set default mock returns
- Test selection sequences via chained `mockResolvedValueOnce()`
- `console.log` spy for validation messages: `vi.spyOn(console, 'log').mockImplementation(() => {})`
- `afterEach`: restore spies with `.mockRestore()`

### Project Structure Notes

- All screens in `src/screens/` — flat structure
- Tests co-located: `src/screens/settings.test.ts` alongside `settings.ts`
- Imports use `.js` extension (ESM)
- Router already has `showSettings()` wrapper — no router changes needed for this story
- No new router functions needed — settings screen already accessible via `showSettings()`

### References

- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture]
- [Source: docs/planning-artifacts/epics.md#Epic 7: Multi-Provider AI Integration]
- [Source: docs/implementation-artifacts/7-4-first-launch-provider-setup-screen.md]
- [Source: src/screens/settings.ts — existing settings screen (modify)]
- [Source: src/screens/settings.test.ts — existing tests (modify)]
- [Source: src/screens/provider-setup.ts — PROVIDER_CHOICES, PROVIDER_LABELS pattern reference]
- [Source: src/ai/providers.ts — validateProvider(), AI_ERRORS]
- [Source: src/domain/schema.ts — AiProviderType, SettingsFile, defaultSettings()]
- [Source: src/domain/store.ts — readSettings(), writeSettings()]
- [Source: src/utils/format.ts — success(), warn(), menuTheme]
- [Source: src/utils/screen.ts — clearScreen()]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Existing settings.test.ts had no mock for `../utils/format.js` — added full mock with `menuTheme`, `success`, `warn` to support provider validation message assertions
- Added `afterEach` with `logSpy.mockRestore()` to properly clean up console.log spy

### Completion Notes List

- Task 1-3: Updated `src/screens/settings.ts` — added PROVIDER_CHOICES, PROVIDER_LABELS, provider/ollamaEndpoint/ollamaModel local vars, AI Provider as first menu option, provider selection with Ollama endpoint/model prompts, validateProvider integration with success/warn display
- Task 4: Updated writeSettings call to include provider, ollamaEndpoint, ollamaModel alongside language and tone
- Task 5: Verified existing back/ExitPromptError paths discard changes — no code changes needed
- Task 6: Updated `src/screens/settings.test.ts` — added 11 new tests (23 total), mocks for providers.js and format.js, coverage for all provider paths
- Task 7: Full suite: 498 tests pass, 24 test files, 0 regressions, 0 type errors

### File List

- `src/screens/settings.ts` — MODIFIED: added provider selection, validation, Ollama config, save with provider fields
- `src/screens/settings.test.ts` — MODIFIED: added 11 provider-related tests, mocks for providers.js and format.js

### Change Log

- 2026-03-21: Implemented story 7.5 — settings screen provider configuration with full test coverage (498 tests, 0 regressions)
