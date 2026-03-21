# Story 7.4: First-Launch Provider Setup Screen

Status: done

## Story

As a user,
I want a one-time Provider Setup screen on first launch where I can select my AI provider and have it validated,
so that I can start using the app with my preferred provider without editing config files.

## Acceptance Criteria

1. **Given** I launch the app for the first time (no `~/.brain-break/settings.json` exists), **When** the app starts, **Then** it reads settings (which returns `defaultSettings()` with `provider: null`), detects `provider === null`, and displays the Provider Setup screen before the home screen.

2. **Given** the Provider Setup screen is displayed, **When** I inspect the screen, **Then** the terminal is cleared and a heading explains this is first-time setup, **And** a list of 5 providers is shown: GitHub Copilot, OpenAI, Anthropic, Google Gemini, Ollama — navigable with arrow keys.

3. **Given** I select "OpenAI" from the provider list, **When** the selection is confirmed, **Then** `validateProvider('openai', settings)` is called, **And** if `OPENAI_API_KEY` env var is present → success message displayed, provider saved to `settings.json`, app proceeds to home screen, **And** if `OPENAI_API_KEY` env var is missing → message displayed: "Set the `OPENAI_API_KEY` environment variable and restart the app." — provider is still saved, app proceeds to home screen (non-blocking).

4. **Given** I select "Anthropic" from the provider list, **When** validation runs, **Then** it checks for `ANTHROPIC_API_KEY` — same success/failure pattern as OpenAI.

5. **Given** I select "Google Gemini" from the provider list, **When** validation runs, **Then** it checks for `GOOGLE_API_KEY` — same success/failure pattern.

6. **Given** I select "GitHub Copilot" from the provider list, **When** validation runs, **Then** it checks Copilot SDK authentication — displays auth status message.

7. **Given** I select "Ollama" from the provider list, **When** the selection is confirmed, **Then** I am prompted for endpoint URL (pre-filled `http://localhost:11434`) and model name (pre-filled `llama3`), **And** the app tests connection to the endpoint, **And** if reachable → success message, settings saved (including `ollamaEndpoint` and `ollamaModel`), app proceeds to home screen, **And** if unreachable → message displayed: "Could not reach Ollama at [endpoint]. Ensure Ollama is running." — settings still saved, app proceeds to home screen (non-blocking).

8. **Given** validation fails for any provider, **When** the app proceeds to the home screen, **Then** all features except Play are accessible — attempting Play shows: "AI provider not ready. Go to Settings to configure." and returns to the domain sub-menu.

    > **Note (pre-existing behavior):** AC #8 describes the ideal flow. In practice, because the provider-setup saves the provider even on validation failure (non-blocking), the user will have e.g. `provider: 'openai'` saved but no API key. When they try Play, `generateCompletion()` fails with an auth error, and `quiz.ts` currently calls `process.exit(1)` for auth errors — NOT returning to the domain menu. This was flagged as a LOW-severity pre-existing issue in story 7-3's code review. Do NOT fix this in story 7-4; it is out of scope and will be addressed in a future story. The provider-setup screen itself is correct — it saves and proceeds.

9. **Given** the app is launched subsequently (settings.json exists with a non-null provider), **When** the app starts, **Then** the Provider Setup screen is **not** shown — the app goes directly to the home screen.

10. **Given** `screens/provider-setup.ts` has co-located tests, **When** I run `npm test`, **Then** all tests pass, covering: screen renders on null provider, all 5 provider selections, validation success and failure paths, Ollama endpoint/model prompts, settings saved after selection, non-blocking failure proceeds to home, `clearScreen()` called.

## Tasks / Subtasks

- [x] Task 1: Create `src/screens/provider-setup.ts` with screen skeleton (AC: 2, 10)
  - [x] 1.1 Create file with imports: `select`, `input` from `@inquirer/prompts`, `ExitPromptError` from `@inquirer/core`, `clearScreen` from `../utils/screen.js`, `menuTheme`, `success`, `warn` from `../utils/format.js`, `validateProvider` from `../ai/providers.js`, `writeSettings` from `../domain/store.js`, `type AiProviderType`, `type SettingsFile` from `../domain/schema.js`
  - [x] 1.2 Define `PROVIDER_CHOICES` array: `[{ name: 'GitHub Copilot', value: 'copilot' }, { name: 'OpenAI', value: 'openai' }, { name: 'Anthropic', value: 'anthropic' }, { name: 'Google Gemini', value: 'gemini' }, { name: 'Ollama', value: 'ollama' }]`
  - [x] 1.3 Export `async function showProviderSetupScreen(settings: SettingsFile): Promise<void>` — calls `clearScreen()`, displays heading explaining first-time setup, then `select()` with `PROVIDER_CHOICES` and `menuTheme`

- [x] Task 2: Implement provider selection + validation logic (AC: 3, 4, 5, 6, 7)
  - [x] 2.1 After provider selection, if provider is `'ollama'`: prompt for `endpointUrl` via `input()` (default: `settings.ollamaEndpoint`), then prompt for `modelName` via `input()` (default: `settings.ollamaModel`); update settings object with `ollamaEndpoint` and `ollamaModel`
  - [x] 2.2 Call `validateProvider(selectedProvider, updatedSettings)` for all 5 providers
  - [x] 2.3 On validation success (`result.ok === true`): display via `console.log(success('✓ OpenAI is ready to go!'))` — use provider label in message
  - [x] 2.4 On validation failure (`result.ok === false`): display via `console.log(warn(result.error))` — the `result.error` already contains the user-facing message from `AI_ERRORS`; this is **non-blocking** — the app continues
  - [x] 2.5 Handle `ExitPromptError` — if user presses Ctrl+C during provider setup, exit gracefully (do not save, do not proceed)

- [x] Task 3: Save settings + proceed to home (AC: 1, 3, 7, 9)
  - [x] 3.1 After validation (regardless of success/failure), update `settings.provider` to the selected provider value
  - [x] 3.2 Call `writeSettings(updatedSettings)` to persist to `~/.brain-break/settings.json`; check `Result` — if `!result.ok`, log error via `console.error()` (follow pattern from `settings.ts` line 63)
  - [x] 3.3 The function returns (caller handles navigation to home screen)

- [x] Task 4: Write co-located unit tests `src/screens/provider-setup.test.ts` (AC: 10)
  - [x] 4.1 Mock dependencies: `@inquirer/prompts` (`select`, `input`), `../ai/providers.js` (`validateProvider`), `../domain/store.js` (`writeSettings`), `../utils/screen.js` (`clearScreen`), `../utils/format.js` (`success`, `warn`, `menuTheme`)
  - [x] 4.2 Test: `clearScreen()` called as first operation
  - [x] 4.3 Test: heading text displayed describing first-time setup
  - [x] 4.4 Test: `select()` called with 5 provider choices in correct order
  - [x] 4.5 Test: OpenAI selected + validation success → success message + `writeSettings` called with `{ ...settings, provider: 'openai' }`
  - [x] 4.6 Test: OpenAI selected + validation failure → warning message displayed + `writeSettings` called with `{ ...settings, provider: 'openai' }` (non-blocking)
  - [x] 4.7 Test: Anthropic selected → `validateProvider('anthropic', settings)` called, same save pattern
  - [x] 4.8 Test: Gemini selected → `validateProvider('gemini', settings)` called, same save pattern
  - [x] 4.9 Test: Copilot selected → `validateProvider('copilot', settings)` called, same save pattern
  - [x] 4.10 Test: Ollama selected → `input()` called twice (endpoint, model), `validateProvider('ollama', updatedSettings)` called with updated endpoint/model, `writeSettings` called with `ollamaEndpoint` and `ollamaModel`
  - [x] 4.11 Test: Ollama validation failure → warning message + settings still saved (non-blocking)
  - [x] 4.12 Test: `ExitPromptError` during select → no `writeSettings` call, function returns cleanly

- [x] Task 5: Wire into router — add `showProviderSetup` function (AC: 1, 9)
  - [x] 5.1 Add `import { showProviderSetupScreen } from './screens/provider-setup.js'` to `src/router.ts`
  - [x] 5.2 Export `async function showProviderSetup(settings: SettingsFile): Promise<void>` that calls `showProviderSetupScreen(settings)`
  - [x] 5.3 Add `import type { SettingsFile } from './domain/schema.js'` to `src/router.ts`

- [x] Task 6: Update `src/index.ts` startup flow (AC: 1, 8, 9)
  - [x] 6.1 Import `readSettings` from `./domain/store.js`, `defaultSettings` from `./domain/schema.js`, `showProviderSetup` from `./router.js`
  - [x] 6.2 Before `showHome()`: read settings, if `provider === null` call `showProviderSetup(settings)`, then `showHome()`
  - [x] 6.3 If provider is not null, go directly to `showHome()` (existing behavior)

- [x] Task 7: Update startup flow tests (AC: 1, 9)
  - [x] 7.1 In `src/index.test.ts`: **replace the existing scaffold smoke test** (currently just `expect(true).toBe(true)`) with proper tests. Mock `./router.js` (`showHome`, `showProviderSetup`) and `./domain/store.js` (`readSettings`). Verify that when `readSettings` returns `provider: null`, `showProviderSetup` is called before `showHome`
  - [x] 7.2 Verify that when `readSettings` returns `provider: 'openai'`, `showProviderSetup` is NOT called, only `showHome`
  - [x] 7.3 In `src/router.test.ts`: add test for `showProviderSetup` — verifies delegation to `showProviderSetupScreen`. Follow the existing pattern: `vi.mock('./screens/provider-setup.js', () => ({ showProviderSetupScreen: vi.fn() }))`

- [x] Task 8: Full regression test suite (AC: 10)
  - [x] 8.1 Run `npm test` — all new and existing tests pass
  - [x] 8.2 Run `npm run typecheck` — zero type errors (if configured)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- Screen file goes in `src/screens/provider-setup.ts` with co-located test `src/screens/provider-setup.test.ts`
- Screen follows the standard pattern: exported `async function showProviderSetupScreen()` returning `Promise<void>`
- Every screen MUST call `clearScreen()` as its first side-effectful operation
- Use `menuTheme` from `utils/format.js` for all `select()` calls
- Use `ExitPromptError` from `@inquirer/core` for Ctrl+C handling
- `select()` and `input()` from `@inquirer/prompts` — the project uses `@inquirer/prompts` (not `inquirer`)

### Provider Validation API

- [Source: src/ai/providers.ts]
- `validateProvider(providerType: AiProviderType, settings: SettingsFile): Promise<Result<void>>` — already exists in `src/ai/providers.ts`
- Returns `{ ok: true, data: undefined }` on success
- Returns `{ ok: false, error: string }` on failure — the `error` string is the user-facing message from `AI_ERRORS`
- **DO NOT reimplement validation logic** — call `validateProvider()` from `ai/providers.ts`
- **DO NOT import provider SDKs** — only `validateProvider` and types are needed from providers

### Settings API

- [Source: src/domain/store.ts, src/domain/schema.ts]
- `readSettings(): Promise<Result<SettingsFile>>` — returns `defaultSettings()` on ENOENT (no error)
- `writeSettings(settings: SettingsFile): Promise<Result<void>>` — atomic write to `~/.brain-break/settings.json`
- `defaultSettings()` returns `{ provider: null, language: 'English', tone: 'natural', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }`
- **Non-blocking flow**: Always save the selected provider regardless of validation outcome; user can fix config later via Settings screen

### Startup Flow Design

- [Source: docs/planning-artifacts/architecture.md#Navigation Pattern]
- Current: `index.ts` → `showHome()`
- After: `index.ts` → `readSettings()` → if `provider === null` → `showProviderSetup(settings)` → `showHome()`
- The Provider Setup screen does NOT need to call `showHome()` itself — `index.ts` handles the sequence
- On subsequent launches, `provider !== null` → skip setup, go straight to `showHome()`

### Screen Pattern to Follow

- [Source: src/screens/settings.ts — reference implementation]
- Import pattern: `select`, `input` from `@inquirer/prompts`; `ExitPromptError` from `@inquirer/core`
- Use `clearScreen()` before any output
- Use `menuTheme` for `select()` theme
- Use `try/catch` with `ExitPromptError` for graceful Ctrl+C handling
- **This screen is NOT a loop** (unlike settings/home) — it's a one-shot flow: display → select → validate → save → return

### Result Type Pattern

- [Source: src/domain/schema.ts]
- `Result<T> = { ok: true; data: T } | { ok: false; error: string }`
- Always check `.ok` before accessing `.data` or `.error`

### Color/Formatting Helpers & Console Output

- [Source: src/utils/format.ts]
- `success(text)` — `chalk.green(text)`, returns styled string
- `warn(text)` — `chalk.yellow(text)`, returns styled string
- `error(text)` — `chalk.red(text)`, returns styled string
- `header(text)` — `chalk.bold.cyan(text)`, returns styled string
- `menuTheme` — `{ style: { highlight: (text) => chalk.inverse(text) } }` for Inquirer select menus
- All are formatting functions — they return strings, don't print. Use `console.log(success('text'))` to display
- For heading output: `console.log(header('🔧 First-Time Setup'))` or `console.log('\n🔧 First-Time Setup\n')`

### Previous Story Learnings (from 7.3)

- [Source: docs/implementation-artifacts/7-3-provider-agnostic-ai-client.md]
- `AI_ERRORS` constants are defined in `src/ai/providers.ts` and re-exported from `src/ai/client.ts`
- `isAuthErrorMessage()` exists in `src/ai/client.ts` — NOT needed for this story (provider-setup uses `validateProvider()` directly)
- `ExitPromptError` must be caught to prevent crashes on Ctrl+C
- Mock `@inquirer/prompts` as a module for testing — use `vi.mock('@inquirer/prompts')` pattern
- Co-locate tests: `src/screens/provider-setup.test.ts` alongside the screen file
- Pre-existing quiz.ts issue: auth errors call `process.exit(1)` instead of returning to domain menu — do NOT fix in this story (out of scope, LOW severity from 7-3 review)

### Previous Story Learnings (from 7.2)

- [Source: docs/implementation-artifacts/7-2-ai-provider-abstraction-layer.md]
- `validateProvider()` already handles all 5 providers — don't reimplement
- `ollama-ai-provider` v1.2.0 type compatibility issues are already handled in `providers.ts`
- Testing: mock at module boundaries, not SDK internals

### Project Structure Notes

- All screens in `src/screens/` — flat structure, no subdirectories
- All tests co-located with source: `src/screens/provider-setup.test.ts`
- Imports use `.js` extension (ESM): `import { foo } from './bar.js'`
- Router adds thin wrapper functions — no business logic in router
- `src/index.ts` is the CLI entry point — keep it minimal

### References

- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture]
- [Source: docs/planning-artifacts/epics.md#Epic 7: Multi-Provider AI Integration]
- [Source: docs/implementation-artifacts/7-3-provider-agnostic-ai-client.md]
- [Source: docs/implementation-artifacts/7-2-ai-provider-abstraction-layer.md]
- [Source: src/ai/providers.ts — validateProvider(), AI_ERRORS]
- [Source: src/domain/schema.ts — AiProviderType, SettingsFile, defaultSettings()]
- [Source: src/domain/store.ts — readSettings(), writeSettings()]
- [Source: src/screens/settings.ts — reference screen pattern]
- [Source: src/router.ts — routing pattern]
- [Source: src/index.ts — startup flow]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- index.test.ts required `vi.resetModules()` in `beforeEach` to re-import `index.ts` (top-level await caching)

### Completion Notes List

- Task 1-3: Created `src/screens/provider-setup.ts` — one-shot screen with clearScreen, provider select, Ollama endpoint/model inputs, validateProvider call, non-blocking save pattern
- Task 4: Created `src/screens/provider-setup.test.ts` — 11 tests covering all 5 providers, validation success/failure, Ollama inputs, ExitPromptError
- Task 5: Updated `src/router.ts` — added `showProviderSetup(settings)` delegating to `showProviderSetupScreen`
- Task 6: Updated `src/index.ts` — startup reads settings, shows provider setup when `provider === null`, then home
- Task 7: Replaced `src/index.test.ts` scaffold with 2 proper startup flow tests; added `showProviderSetup` delegation test in `src/router.test.ts`
- Task 8: Full suite: 486 tests pass, 24 test files, 0 regressions

### File List

- `src/screens/provider-setup.ts` — NEW: first-launch provider setup screen
- `src/screens/provider-setup.test.ts` — NEW: 11 co-located unit tests
- `src/router.ts` — MODIFIED: added `showProviderSetup` function + imports
- `src/router.test.ts` — MODIFIED: added provider-setup mock + delegation test
- `src/index.ts` — MODIFIED: startup flow reads settings, conditionally shows provider setup
- `src/index.test.ts` — MODIFIED: replaced scaffold with startup flow tests

### Change Log

- 2026-03-21: Implemented story 7.4 — first-launch provider setup screen with full test coverage (486 tests, 0 regressions)
- 2026-03-21: Code review fixes — added writeSettings error path test (+1 test → 487), added Ollama empty-input fallback, added afterEach restoreAllMocks
