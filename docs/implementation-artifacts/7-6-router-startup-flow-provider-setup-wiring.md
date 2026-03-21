# Story 7.6: Router & Startup Flow — Provider Setup Wiring

Status: done

## Story

As a developer,
I want `router.ts` and `index.ts` updated to detect a null provider on startup and route to the Provider Setup screen before the home screen,
so that the first-launch flow is fully wired and subsequent launches skip setup automatically.

## Acceptance Criteria

1. **Given** `router.ts` is updated, **When** I inspect its exports, **Then** a new `showProviderSetup()` function is exported that calls `screens/provider-setup.ts`.

2. **Given** `index.ts` is updated, **When** the app starts, **Then** it calls `readSettings()` as the first operation, **And** if `settings.provider === null` → calls `router.showProviderSetup()` → then calls `router.showHome()`, **And** if `settings.provider !== null` → calls `router.showHome()` directly.

3. **Given** the startup flow is wired, **When** the Provider Setup screen saves a provider and returns, **Then** `router.showHome()` is called immediately — the home screen loads with the newly saved provider active.

4. **Given** the startup flow is wired, **When** the Provider Setup screen fails validation but proceeds, **Then** `router.showHome()` is still called — the user sees the home screen and can explore all features except Play.

5. **Given** `router.ts` dependency rules are enforced, **When** I inspect `router.ts` imports, **Then** it imports from `screens/provider-setup.ts` (new) — never from `ai/` or `domain/` directly (exception: `domain/store.ts` for archiveDomain/deleteDomain as established).

6. **Given** `router.test.ts` and `index.test.ts` are updated, **When** I run `npm test`, **Then** all tests pass, covering: null provider routes to provider setup then home, non-null provider routes directly to home, `showProviderSetup()` function exists and calls the provider setup screen.

## Tasks / Subtasks

- [x] Task 1: Verify `showProviderSetup()` exists in `router.ts` with correct signature (AC: 1, 5)
  - [x] 1.1 Confirm `router.ts` already imports `showProviderSetupScreen` from `./screens/provider-setup.js` — **already present**, no change needed
  - [x] 1.2 Confirm `router.ts` already imports `type SettingsFile` from `./domain/schema.js` — **already present**, no change needed
  - [x] 1.3 Confirm `showProviderSetup(settings: SettingsFile): Promise<void>` is already exported and delegates to `showProviderSetupScreen(settings)` — **already present**, no change needed
  - [x] 1.4 Verify `router.ts` does NOT import from `ai/` directly — **already compliant**, only imports from `screens/`, `domain/store.js`, `domain/schema.js`, and `utils/format.js`

- [x] Task 2: Verify `index.ts` startup flow with provider detection (AC: 2, 3, 4)
  - [x] 2.1 Confirm `index.ts` already imports `showHome` and `showProviderSetup` from `./router.js` — **already present**
  - [x] 2.2 Confirm `index.ts` already imports `readSettings` from `./domain/store.js` — **already present**
  - [x] 2.3 Confirm `index.ts` already imports `defaultSettings` from `./domain/schema.js` — **already present**
  - [x] 2.4 Confirm startup flow: `readSettings()` → fallback to `defaultSettings()` on failure → check `settings.provider === null` → conditional `showProviderSetup(settings)` → always `showHome()` — **already implemented**
  - [x] 2.5 Verify that after `showProviderSetup()` returns (regardless of validation success/failure), `showHome()` is always called — **already correct** (no early return after provider setup)

- [x] Task 3: Verify `router.test.ts` has `showProviderSetup` delegation test (AC: 6)
  - [x] 3.1 Confirm `router.test.ts` already mocks `./screens/provider-setup.js` with `showProviderSetupScreen: vi.fn()` — **already present**
  - [x] 3.2 Confirm test exists: `showProviderSetup` delegates to `showProviderSetupScreen` with settings object — **already present**
  - [x] 3.3 Run `router.test.ts` and confirm all tests pass

- [x] Task 4: Verify `index.test.ts` has startup flow tests (AC: 6)
  - [x] 4.1 Confirm `index.test.ts` mocks `./router.js` with `showHome: vi.fn()` and `showProviderSetup: vi.fn()` — **already present**
  - [x] 4.2 Confirm `index.test.ts` mocks `./domain/store.js` with `readSettings: vi.fn()` — **already present**
  - [x] 4.3 Confirm test: "shows provider setup then home when provider is null" — `readSettings()` returns `defaultSettings()` (provider: null) → `showProviderSetup` called with settings → `showHome` called — **already present**
  - [x] 4.4 Confirm test: "skips provider setup and shows home directly when provider is set" — `readSettings()` returns settings with `provider: 'openai'` → `showProviderSetup` NOT called → `showHome` called — **already present**
  - [x] 4.5 Run `index.test.ts` and confirm all tests pass

- [x] Task 5: Run full test suite and validate no regressions (AC: 6)
  - [x] 5.1 Run `npm test` — all tests pass
  - [x] 5.2 Run `npm run typecheck` — zero type errors
  - [x] 5.3 Verify total test count matches or exceeds previous baseline (498 tests)

## Dev Notes

### ⚠️ CRITICAL: This Story is Already Fully Implemented

This story's functionality was implemented incrementally across stories 7.4 and 7.5. All code, imports, exports, and tests described in the acceptance criteria **already exist in the codebase**. The dev agent's job is to **VERIFY** the existing implementation satisfies all ACs — not to write new code.

**Evidence of existing implementation:**

1. **`router.ts`** already exports `showProviderSetup(settings: SettingsFile)` — added in story 7.4 (commit `7f72163`)
2. **`index.ts`** already has the full startup flow: `readSettings()` → null check → conditional `showProviderSetup()` → `showHome()` — added in story 7.4 (commit `7f72163`)
3. **`router.test.ts`** already has delegation test for `showProviderSetup` — added in story 7.4
4. **`index.test.ts`** already has both startup flow tests (null provider and set provider paths) — added in story 7.4

### Architecture Requirements

- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- Router (`src/router.ts`) is the **single navigation dispatcher** — the only file that calls screens
- Router exports thin async wrappers that delegate to screen functions
- Router may import from `screens/`, `domain/store.js` (for archiveDomain/deleteDomain), `domain/schema.js` (for types), and `utils/format.js` (for error formatting)
- Router must **NEVER** import from `ai/` directly
- Entry point (`src/index.ts`) is minimal bootstrap — reads settings, routes to provider setup or home
- All imports use `.js` extension (ESM requirement)

### Current `router.ts` State (as of story 7.5 completion)

```typescript
// Imports already present:
import { showProviderSetupScreen } from './screens/provider-setup.js'
import type { SettingsFile } from './domain/schema.js'

// Function already present (line ~69-71):
export async function showProviderSetup(settings: SettingsFile): Promise<void> {
  await showProviderSetupScreen(settings)
}
```

11 functions exported: `showHome`, `showQuiz`, `showCreateDomain`, `showArchived`, `archiveDomain`, `showHistory`, `showStats`, `deleteDomain`, `showDomainMenu`, `showSettings`, `showProviderSetup`

### Current `index.ts` State (as of story 7.5 completion)

```typescript
#!/usr/bin/env node
import { showHome, showProviderSetup } from './router.js'
import { readSettings } from './domain/store.js'
import { defaultSettings } from './domain/schema.js'

const settingsResult = await readSettings()
const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

if (settings.provider === null) {
  await showProviderSetup(settings)
}

await showHome()
```

### Current Test Coverage

**`router.test.ts`** — 13 tests total:
- 3 `archiveDomain` tests (success, read failure, write failure)
- 9 screen delegation tests (home, quiz, createDomain, archived, history, stats, domainMenu, settings, providerSetup)
- 1 `deleteDomain` test (error path)

**`index.test.ts`** — 2 tests total:
- "shows provider setup then home when provider is null"
- "skips provider setup and shows home directly when provider is set"

### Previous Story Learnings (from 7.5)

- [Source: docs/implementation-artifacts/7-5-settings-screen-provider-configuration.md]
- All 498 tests passing as of story 7.5 completion (0 regressions, 0 type errors)
- `@github/copilot-sdk` mock required in test files that transitively import provider modules
- ESM `.js` extensions mandatory in all imports
- `vi.resetModules()` required in `index.test.ts` beforeEach (re-imports module with fresh mocks per test)

### Testing Pattern for `index.test.ts`

- [Source: src/index.test.ts]
- `vi.mock('./router.js', ...)` with `showHome`, `showProviderSetup` as `vi.fn()`
- `vi.mock('./domain/store.js', ...)` with `readSettings` as `vi.fn()`
- `vi.mock('./domain/schema.js', ...)` with `importOriginal` to keep `defaultSettings()` implementation
- `beforeEach`: `vi.clearAllMocks()` + `vi.resetModules()`
- Each test sets mock return values then `await import('./index.js')` to trigger startup
- Assertions: check `showProviderSetup` called/not-called, `showHome` always called

### Testing Pattern for `router.test.ts`

- [Source: src/router.test.ts]
- All 9 screen modules mocked: `vi.mock('./screens/*.js', () => ({ ...Screen: vi.fn() }))`
- Uses real filesystem for `archiveDomain`/`deleteDomain` tests (tmpdir, `_setDataDir`)
- Delegation tests: call router function → assert corresponding screen function was called with correct args

### Project Structure Notes

- All files already exist and are in correct locations
- No new files need to be created
- No code changes anticipated — this is a verification story

### References

- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture]
- [Source: docs/planning-artifacts/architecture.md#Multi-Provider Architecture]
- [Source: docs/planning-artifacts/epics.md#Story 7.6]
- [Source: docs/implementation-artifacts/7-5-settings-screen-provider-configuration.md]
- [Source: src/router.ts — showProviderSetup already exists]
- [Source: src/index.ts — startup flow already implemented]
- [Source: src/router.test.ts — delegation test already exists]
- [Source: src/index.test.ts — startup flow tests already exist]
- [Source: src/screens/provider-setup.ts — screen already implemented (story 7.4)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No code changes required — all functionality already implemented in stories 7.4 and 7.5
- Code review confirmed 6/6 ACs pass, 498/498 tests pass, 0 type errors

### Completion Notes List

- This is a verification-only story — all code was already implemented across stories 7.4 (commit `7f72163`) and 7.5 (commit `129e7b2`)
- `router.ts` exports `showProviderSetup(settings: SettingsFile)` delegating to `showProviderSetupScreen` (line 69-71)
- `index.ts` startup flow: `readSettings()` → fallback to `defaultSettings()` → null check → conditional `showProviderSetup()` → always `showHome()`
- `router.test.ts` has delegation test for `showProviderSetup` (13 tests total)
- `index.test.ts` has both startup flow tests: null provider and set provider paths (2 tests)
- Dependency rules verified: `router.ts` has no `ai/` imports
- Minor test gap noted (LOW): no test for `readSettings()` failure fallback in `index.test.ts`

### File List

- `src/router.ts` — NO CHANGES (already implemented in story 7.4)
- `src/index.ts` — NO CHANGES (already implemented in story 7.4)
- `src/router.test.ts` — NO CHANGES (already implemented in story 7.4)
- `src/index.test.ts` — NO CHANGES (already implemented in story 7.4)
- `src/screens/provider-setup.ts` — NO CHANGES (already implemented in story 7.4)

### Change Log

- 2026-03-21: Story 7.6 verified complete — all code already in place from stories 7.4/7.5, 498 tests pass, 0 type errors, 0 regressions
