# Story 7.4b: Provider Setup — Skip & Retry Flow

Status: done

## Story

As a user,
I want to skip provider setup entirely or retry/skip after a connection failure,
so that I am never blocked at the setup screen and can explore the app immediately.

## Acceptance Criteria

1. **Given** the Provider Setup screen is displayed, **When** I inspect the provider list, **Then** below the 5 provider options a `Separator` line is shown, followed by a **⏭️ Skip — set up later in ⚙️ Settings** option.

2. **Given** I select **⏭️ Skip** from the provider list, **When** the selection is confirmed, **Then** settings are saved with `provider: null` (no connection test or provider-specific prompts are performed), **And** the app navigates directly to the home screen.

3. **Given** I select a provider and validation **fails**, **When** the error message is displayed, **Then** the 2-second wait is removed, **And** I am presented with a `select` menu showing **🔄 Retry** and **⏭️ Skip** options (separated from the error message by a blank line).

4. **Given** validation has failed and I select **🔄 Retry**, **When** the retry is confirmed, **Then** the connection test re-runs for the same provider with the same settings (no re-prompting for provider or model) — and if it fails again, the retry/skip menu reappears.

5. **Given** validation has failed and I select **⏭️ Skip**, **When** the skip is confirmed, **Then** settings are saved with `provider: null` and the app proceeds to the home screen.

6. **Given** validation **succeeds** (for any provider), **When** the success message is displayed, **Then** the existing 2-second display delay remains, **And** settings are saved with the selected provider (unchanged from current behavior).

7. **Given** `screens/provider-setup.test.ts` is updated, **When** I run `npm test`, **Then** all tests pass, covering: skip option present in choices below a separator, skip from list saves `provider: null` and does not call `testProviderConnection`, retry on failure re-calls `testProviderConnection`, skip on failure saves `provider: null`, retry-then-success saves the provider, existing success/failure paths still pass.

> **Scope note:** These ACs are additive — all original Story 7.4 ACs (Ollama endpoint prompts, Copilot selection, subsequent-launch skip, clearAndBanner, heading text, etc.) remain in force unchanged. This story only modifies the provider list choices and the post-validation failure flow.

## Tasks / Subtasks

- [x] Task 1: Add Skip option and update imports in `src/screens/provider-setup.ts` (AC: 1, 2)
  - [x] 1.1 Update imports: add `Separator` to `@inquirer/prompts` import; add `import { testProviderConnection } from '../ai/providers.js'`; add `import ora from 'ora'`; add `success, warn` to the `../utils/format.js` import; add `PROVIDER_LABELS` to the `../domain/schema.js` import; remove `testAndReport` from the `./provider-settings.js` import (keep `promptForProviderSettings`)
  - [x] 1.2 Change the `select` call's type from `select<AiProviderType>` to `select<AiProviderType | 'skip'>` to accommodate the skip value
  - [x] 1.3 Spread `PROVIDER_CHOICES` into a new choices array, append `new Separator()`, then `{ name: '⏭️  Skip — set up later in ⚙️ Settings', value: 'skip' as const }`
  - [x] 1.4 After the `select` resolves, if the value is `'skip'`: call `writeSettings({ ...settings })` (provider remains `null` from `defaultSettings()`), then `return` early — no provider-specific prompts, no connection test, no delay

- [x] Task 2: Add retry/skip flow on validation failure (AC: 3, 4, 5)
  - [x] 2.1 Replace the `testAndReport()` call with inline connection testing: call `testProviderConnection(provider, updatedSettings)` directly (imported in Task 1.1), wrap with `ora('Testing connection...').start()` / `spinner.stop()`. On success, format the message as `` success(`✓ ${PROVIDER_LABELS[provider]}: ${result.data}`) ``. On failure, format as `warn(result.error)`. This replicates `testAndReport`'s logic locally and exposes the `result.ok` boolean needed for the retry branch
  - [x] 2.2 Implement the retry loop: after a failed connection test, display the warning message, then show a `select<'retry' | 'skip'>` menu with choices `[{ name: '🔄 Retry', value: 'retry' }, { name: '⏭️  Skip', value: 'skip' }]` and `theme: menuTheme`. If `'retry'` is selected, re-run the connection test (same provider, same `updatedSettings`). If `'skip'` is selected, save with `writeSettings({ ...updatedSettings, provider: null })` — preserving any model/endpoint the user entered so they're pre-filled when they visit ⚙️ Settings later — and return
  - [x] 2.3 On success (inside or after the loop): display the success message, keep the 2-second `setTimeout` delay, save `updatedSettings` (with provider set), and return
  - [x] 2.4 Remove the unconditional 2-second `MESSAGE_DISPLAY_MS` delay that currently runs after every test — it should only apply on success, not on failure (failure now shows the retry/skip menu immediately)
  - [x] 2.5 Ensure `ExitPromptError` from the retry/skip `select` is caught by the existing `try/catch` — no new error handling needed

- [x] Task 3: Update unit tests in `src/screens/provider-setup.test.ts` (AC: 7)
  - [x] 3.1 Add `Separator` to the `@inquirer/prompts` mock factory: `Separator: vi.fn()` (or re-export the real class) — without this, `new Separator()` throws during tests
  - [x] 3.2 Update the existing `select` assertion test: the choices array should now include 5 providers + a `Separator` instance + the skip option object
  - [x] 3.3 Add test: **Skip from provider list** — mock `select` to return `'skip'`, verify `writeSettings` called with `provider: null`, verify `testProviderConnection` NOT called, verify no `input` prompts shown
  - [x] 3.4 Update existing **failure tests** (OpenAI failure, Ollama failure): change expectations from "warning message + settings saved with provider set" → "warning message shown + retry/skip select shown". Mock the second `select` to return `'skip'`, verify `writeSettings` called with `{ ...updatedSettings, provider: null }`
  - [x] 3.5 Add test: **Retry on failure then success** — first `testProviderConnection` call returns failure, second returns success. First `select` returns provider, second `select` (retry/skip) returns `'retry'`. Verify `testProviderConnection` called twice, `writeSettings` called with provider set (not null)
  - [x] 3.6 Add test: **Retry on failure then skip** — first `testProviderConnection` call returns failure. Mock retry/skip `select` to return `'skip'`. Verify `writeSettings` called with `{ ...updatedSettings, provider: null }`
  - [x] 3.7 Add test: **ExitPromptError during retry/skip select** — verify no `writeSettings` call, function returns cleanly (same as existing Ctrl+C test pattern)
  - [x] 3.8 Verify existing success-path tests still pass unchanged (success message + 2-second delay + writeSettings with provider)

- [x] Task 4: Run full test suite and typecheck (AC: 7)
  - [x] 4.1 Run `npm test` — all new and existing tests pass (945/945)
  - [x] 4.2 Run `npm run typecheck` — zero type errors

## Dev Notes

### Architecture Constraints

- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- `provider-setup.ts` is a one-shot screen (not a loop) — it renders once and returns
- Must call `clearAndBanner()` as first operation (existing, don't change)
- Use `menuTheme` for all `select()` calls
- Use `ExitPromptError` from `@inquirer/core` for Ctrl+C handling
- `select()`, `input()`, `Separator` from `@inquirer/prompts`

### Current Implementation — What Exists

- [Source: src/screens/provider-setup.ts]
- The screen currently does: `clearAndBanner()` → heading → `select<AiProviderType>(PROVIDER_CHOICES)` → `promptForProviderSettings()` → `testAndReport()` → 2-second delay → `writeSettings()` → return
- **No skip option** in the provider list
- **No retry/skip** on failure — it always saves the selected provider (even on failure) and proceeds after a 2-second wait
- `testAndReport()` is imported from `./provider-settings.js` — it returns a formatted string (success or warn styled), does NOT return a structured ok/error result

### Shared Module — `provider-settings.ts`

- [Source: src/screens/provider-settings.ts]
- `promptForProviderSettings(provider, settings)` — prompts for provider-specific config (model name for hosted providers, endpoint+model for Ollama, nothing for Copilot). Returns `SettingsFile` with `provider` field set to the selected provider
- `testAndReport(provider, settings)` — runs `ora` spinner, calls `testProviderConnection()`, returns a styled string. **This function does NOT expose success/failure status** — only a formatted message string
- Both functions are also used by `settings.ts` — **DO NOT modify** `provider-settings.ts` unless absolutely necessary (any change affects the settings screen too)

### Recommended Implementation Approach

Instead of modifying the shared `testAndReport` to return structured data (which would affect `settings.ts`), handle the connection test directly in `provider-setup.ts`:

```typescript
import { testProviderConnection } from '../ai/providers.js'
import ora from 'ora'
```

Then in the post-selection flow:
1. Call `promptForProviderSettings()` as before
2. Run the connection test inline: `const spinner = ora('Testing connection...').start()` → `testProviderConnection(provider, updatedSettings)` → `spinner.stop()`
3. If `result.ok` → display success message, wait 2s, save `updatedSettings`
4. If `!result.ok` → display warning, show retry/skip select in a loop

This avoids changing `testAndReport` and keeps `provider-settings.ts` stable.

**Note:** `ora` and `testProviderConnection` are already indirect dependencies of this file (via `provider-settings.ts`). After this change, `testAndReport` is no longer called from `provider-setup.ts` — remove that import.

### Type Considerations

- The `select` call type changes: `select<AiProviderType>` → `select<AiProviderType | 'skip'>`
- After `select`, check `if (provider === 'skip')` before proceeding to provider-specific logic
- `Separator` is a class from `@inquirer/prompts` — instantiate with `new Separator()`
- The skip choice uses `value: 'skip' as const` for type narrowing

### `Separator` Usage Pattern

- [Source: src/screens/settings.ts — reference]
- Settings screen already uses `Separator` with the same import: `import { select, input, Separator } from '@inquirer/prompts'`
- Pattern: `[...PROVIDER_CHOICES, new Separator(), { name: '⏭️  Skip — ...', value: 'skip' as const }]`

### Testing Pattern Changes

- The existing tests mock `testProviderConnection` from `../ai/providers.js` — this mock is **already in place** (see current test file)
- After refactoring away from `testAndReport`, the `ora` mock is still needed (already in place)
- The second `select` call (retry/skip) will need mock sequencing: `mockSelect.mockResolvedValueOnce('openai').mockResolvedValueOnce('skip')` — first call selects provider, second call selects retry/skip action
- Existing tests that use `vi.advanceTimersByTimeAsync(2000)` for the success path remain valid, but failure-path tests no longer need timer advancement (the 2-second wait is removed on failure)

### Settings Save Semantics

- **Skip from list:** Save `settings` as-is — `writeSettings({ ...settings })` — provider remains `null` from `defaultSettings()`, no model/endpoint fields changed
- **Skip after failure:** Save `writeSettings({ ...updatedSettings, provider: null })` — explicitly reset `provider` to `null` since `promptForProviderSettings` sets it to the selected value, but **preserve** model/endpoint fields so they're pre-filled when the user visits ⚙️ Settings later
- **Success:** Save `writeSettings(updatedSettings)` — provider set to selected value, model fields updated

### What NOT to Change

- `provider-settings.ts` — shared with settings screen, keep stable
- `schema.ts` — no new types or constants needed (the skip value is a local string literal, not a schema type)
- The `clearAndBanner()` call and heading text — keep as-is

### Previous Story Learnings (from 7.4)

- [Source: docs/implementation-artifacts/7-4-first-launch-provider-setup-screen.md]
- Mock `@inquirer/prompts` as a module: `vi.mock('@inquirer/prompts', () => ({ select: vi.fn(), input: vi.fn() }))` — add `Separator` to the mock (can be a class or just re-export the real one)
- `ExitPromptError` must be caught to prevent crashes on Ctrl+C
- Use `vi.useFakeTimers()` / `vi.useRealTimers()` for the 2-second delay assertions
- The test file uses `vi.advanceTimersByTimeAsync(2000)` pattern — keep this for success-path tests

### Previous Story Learnings (from 7.5)

- [Source: docs/implementation-artifacts/7-5-settings-screen-provider-configuration.md]
- `Separator` in `@inquirer/prompts` mock: include `Separator` in the mock factory — the current `provider-setup.test.ts` mock does NOT include it; add `Separator: vi.fn()` or re-export the real class
- Settings screen uses `new Separator()` in choices — same pattern applies here

### Project Structure Notes

- All screens in `src/screens/` — flat structure
- Tests co-located: `src/screens/provider-setup.test.ts`
- Imports use `.js` extension (ESM): `import { foo } from './bar.js'`
- No new source files created — implementation touched `provider-setup.ts` and `provider-setup.test.ts`; review fixes also touched `router.ts`, `index.ts`, and `index.test.ts`

### References

- [Source: docs/planning-artifacts/prd.md#Feature 8 — Global Settings — First-Launch Provider Setup]
- [Source: docs/planning-artifacts/epics.md#Story 7.4: First-Launch Provider Setup Screen]
- [Source: docs/planning-artifacts/epics.md#Story 7.6: Router & Startup Flow — Provider Setup Wiring]
- [Source: docs/planning-artifacts/epics.md#FR26: First-Launch Provider Setup]
- [Source: docs/planning-artifacts/epics.md#FR27: Provider Readiness Validation]
- [Source: docs/planning-artifacts/ux-design-specification.md#1. Provider Setup]
- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- [Source: src/screens/provider-setup.ts — current implementation]
- [Source: src/screens/provider-settings.ts — shared module]
- [Source: src/screens/settings.ts — Separator usage reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (via GitHub Copilot)

### Debug Log References

### Completion Notes List

- Replaced `testAndReport` import with direct `testProviderConnection` + `ora` inline to expose `result.ok` for retry branching — `provider-settings.ts` unchanged
- Added `runConnectionTest()` private helper to encapsulate spinner + `testProviderConnection` call
- Provider list now uses `select<AiProviderType | 'skip'>` with `Separator` + skip option appended after `PROVIDER_CHOICES`
- Skip from list: saves `settings` as-is (`provider: null`), returns early
- Skip after failure: saves `{ ...updatedSettings, provider: null }` — preserves model/endpoint entries
- Retry loop: `while (!result.ok)` re-runs `runConnectionTest` on retry, breaks to skip on skip
- 2-second `MESSAGE_DISPLAY_MS` delay only on success path, removed from failure path
- Test mock updated: `Separator` imported via `vi.importActual` to get real class for `toBeInstanceOf` assertion
- 18 tests total (4 new: skip-from-list, retry-then-success, retry-then-skip, ExitPromptError-during-retry; 2 updated: OpenAI failure, Ollama failure)
- Full suite: 945/945 pass, 0 regressions, 0 type errors
- Review fix: provider setup now returns whether the user explicitly skipped; startup uses that flag so both skip paths bypass Welcome and land directly on Home
- Review fix: startup tests now cover both null-provider paths — non-skip still shows Welcome, skip bypasses Welcome

### Change Log

- 2026-04-04: Implemented skip & retry flow for provider setup (Story 7.4b)
- 2026-04-04: Code review fixes applied — skip paths now bypass Welcome and File List aligned to actual changed files

### File List

- docs/planning-artifacts/epics.md (modified)
- docs/planning-artifacts/prd.md (modified)
- docs/planning-artifacts/ux-design-specification.md (modified)
- docs/implementation-artifacts/7-4b-provider-setup-skip-retry-flow.md (new, modified)
- src/index.ts (modified)
- src/index.test.ts (modified)
- src/router.ts (modified)
- src/screens/provider-setup.ts (modified)
- src/screens/provider-setup.test.ts (modified)
