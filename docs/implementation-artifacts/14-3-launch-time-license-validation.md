# Story 14.3: Launch-Time License Validation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the app to validate my stored license on every launch and gracefully fall back to offline mode when the network is unreachable,
So that revoked or refunded keys lose privileges automatically without ever blocking my startup when I'm offline.

## Acceptance Criteria

1. **Given** `settings.json` has no `license` sub-object (free tier) **When** the app launches **Then** no validation call is made, no spinner is shown; the home screen renders normally (no banner, no offline notice)

2. **Given** `settings.json` contains a `license` sub-object with `status: "active"` **When** the app launches **Then** `validateLicenseOnLaunch()` is `await`ed immediately before `showHome(...)` (i.e. after both `showProviderSetup()` and `showWelcome()` have either run or been skipped) — it reads the freshest settings via its own `readSettings()` call, displays an `ora` spinner `Checking license…`, and calls `validateLicense(license.key, license.instanceId, AbortSignal.timeout(2000))` exactly once, returning a `LaunchNotice | null` outcome that `index.ts` passes directly to `showHome(launchNotice)`

3. **Given** `settings.json` has `license.status: "inactive"` **When** the app launches **Then** no validation call is made and no spinner is shown (cached known-inactive state is authoritative for this launch — the user must re-activate via the Activate License screen to flip back to `"active"`); `validateLicenseOnLaunch` returns `null` immediately without invoking the spinner

4. **Given** the validation call returns `{ ok: true, data: { valid: true } }` **When** the result is handled **Then** the spinner stops with no success line (silent success); `settings.license.status` is left as `"active"`; `settings.json` is NOT written (no mutation when nothing changes); `validateLicenseOnLaunch` returns `null`

5. **Given** the validation call returns `{ ok: true, data: { valid: false } }` **When** the result is handled **Then** the spinner stops silently; the orchestrator re-reads settings via `readSettings()` (defensive idempotency against any concurrent settings write earlier in the launch flow), sets `settings.license.status = "inactive"`, and persists via `writeSettings()` (atomic); `validateLicenseOnLaunch` returns `'revoked'` so the home screen renders the one-time notice: *"Your license is no longer active. You've been returned to the free tier."* — rendered as a single red line above the domains list / menu

6. **Given** the validation call returns `{ ok: false, error: { kind: 'network' } }` (any network failure including the 2 s `AbortSignal.timeout` firing, DNS, TLS, 5xx) **When** the result is handled **Then** the spinner stops silently; `settings.license.status` remains `"active"` (offline grace — NO mutation, NO write to `settings.json`); `validateLicenseOnLaunch` returns `'offline'` so the home screen renders the dim line: *"License could not be validated — offline mode"*; the next launch will re-attempt validation

7. **Given** the home screen has already rendered the launch notice once **When** the user navigates back to home from any other screen during the same process lifetime **Then** the notice is NOT re-rendered (one-time per launch); the `noticeShown` flag inside `showHomeScreen` enforces single-render even though the `launchNotice` parameter remains in scope across loop iterations

8. **Given** any unexpected exception is thrown inside `validateLicenseOnLaunch` (defensive `try/catch`) **When** the orchestrator handles it **Then** the spinner stops silently, no settings write occurs, and the function returns `'offline'` — the exception is never propagated out of the launch orchestrator (any uncaught exception would abort the user's launch entirely)

9. **Given** the launch validation orchestrator is implemented **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests (with `validateLicense` mocked) cover: no call when license is absent; no call when `license.status === "inactive"`; status preserved + no write + returns `null` on `valid: true`; flip to `"inactive"` + write + returns `'revoked'` on `valid: false`; offline grace + no write + returns `'offline'` on `network` error; unexpected exception caught + returns `'offline'`; `AbortSignal` is correctly wired through to `validateLicense`

## Tasks / Subtasks

- [x] **Task 1: Create launch-validation orchestrator module** (AC: #1, #2, #3, #4, #5, #6, #8)
  - [x] 1.1 Create `src/domain/license-launch.ts`
  - [x] 1.2 Define and export `LaunchNotice = 'revoked' | 'offline'` type
  - [x] 1.3 Export `async function validateLicenseOnLaunch(): Promise<LaunchNotice | null>` — the main orchestrator. Takes NO arguments — it reads the freshest settings itself via `readSettings()`. This makes the function self-contained and robust to any prior step in the launch flow that may have written to settings (notably `showProviderSetup` which persists `provider`/`apiKey`/`model`). If `readSettings()` fails, OR the parsed settings have no `license` field, OR `license.status !== 'active'`, returns `null` immediately (no spinner, no network call). Otherwise creates an `ora('Checking license…').start()` spinner, calls `validateLicense(license.key, license.instanceId, AbortSignal.timeout(2000))`, stops the spinner silently (no success/fail line), handles the three outcomes per ACs #4, #5, #6, and returns the resulting notice
  - [x] 1.4 On `valid: false` outcome: re-read settings via `readSettings()` one more time (defensive against any further write between the initial read and the validation completing — e.g., the `AbortSignal` timeout window can be up to 2s), then if the re-read shows `license.status` still active, set `license.status = 'inactive'` and call `writeSettings()`. Return `'revoked'`. If the re-read shows the license has been removed or already flipped, do not write — still return `'revoked'`
  - [x] 1.5 On `network` outcome (or any non-`ok` Result): do NOT call `writeSettings()`; return `'offline'`
  - [x] 1.6 On `valid: true` outcome: do NOT call `writeSettings()`; return `null`
  - [x] 1.7 Wrap the entire orchestrator body in `try/catch`. On any unexpected exception, stop the spinner (`spinner.stop()`), do NOT mutate settings, and return `'offline'` (defensive treat-as-network). The exception must never escape — an uncaught error in the launch path would abort the user's session

- [x] **Task 2: Wire orchestrator into `src/index.ts` and propagate notice via parameter** (AC: #1, #2, #3)
  - [x] 2.1 Add import: `import { validateLicenseOnLaunch } from './domain/license-launch.js'`
  - [x] 2.2 Immediately before the existing `await showHome()` line, add: `const launchNotice = await validateLicenseOnLaunch()` (no arg — the orchestrator reads its own settings)
  - [x] 2.3 Change the existing `await showHome()` to `await showHome(launchNotice)`
  - [x] 2.4 Placement rationale: validation runs AFTER both `showProviderSetup()` and `showWelcome()` (whichever ran, or none), and BEFORE `showHome()` so the banner is passed in directly. The orchestrator's own `readSettings()` call picks up any settings mutation that `showProviderSetup` performed during the launch flow
  - [x] 2.5 Update `src/router.ts` `showHome()` signature: change `export async function showHome(): Promise<void>` to `export async function showHome(launchNotice: LaunchNotice | null = null): Promise<void>`; pass through to `showHomeScreen(launchNotice)`. Import `LaunchNotice` from `./domain/license-launch.js`. The default `= null` keeps all other callers (none exist today, but defensive) working without changes

- [x] **Task 3: Render the one-time notice in `src/screens/home.ts`** (AC: #5, #6, #7)
  - [x] 3.1 Add import: `import type { LaunchNotice } from '../domain/license-launch.js'` and ensure `error`, `dim` are already imported from `'../utils/format.js'`
  - [x] 3.2 Change the `showHomeScreen` signature: `export async function showHomeScreen(launchNotice: LaunchNotice | null = null): Promise<void>`. Inside the function body, declare `let noticeShown = false` outside the `while (true)` loop so it persists across loop iterations
  - [x] 3.3 Add a new exported pure helper `renderLaunchNotice(notice: LaunchNotice | null): string | null` that returns the formatted notice text (or `null` for no banner): `'revoked'` → `error("Your license is no longer active. You've been returned to the free tier.")`; `'offline'` → `dim('License could not be validated — offline mode')`. Reuse the existing `error()` / `dim()` helpers from `utils/format.ts`
  - [x] 3.4 After `clearAndBanner()` and before the `select<HomeAction>(...)` call, if `launchNotice` is non-null AND `noticeShown === false`: `console.log(renderLaunchNotice(launchNotice))` followed by a blank line for visual separation; then set `noticeShown = true`
  - [x] 3.5 Ensure the notice is rendered exactly ONCE — the second iteration of the home loop (after the user returns from any sub-screen) must NOT show it again, even though `launchNotice` is still in scope. The `noticeShown` flag enforces this
  - [x] 3.6 Do NOT touch `buildHomeChoices()` or the menu structure — that work belongs to Story 14.4

- [x] **Task 4: Write `src/domain/license-launch.test.ts`** (AC: #9)
  - [x] 4.1 `beforeEach`: stub `validateLicense` via `vi.spyOn(licenseClient, 'validateLicense')` (import the module namespace style: `import * as licenseClient from './license-client.js'`); stub `readSettings` and `writeSettings` via `vi.spyOn(store, 'readSettings' / 'writeSettings')`
  - [x] 4.2 `afterEach`: restore all spies
  - [x] 4.3 **No license:** stub `readSettings` to return settings with `license: undefined`; await `validateLicenseOnLaunch()`; assert return value is `null`; assert `validateLicense` was NOT called
  - [x] 4.4 **Inactive license:** stub `readSettings` to return settings with `license.status: 'inactive'`; await; assert return value is `null`; assert `validateLicense` NOT called
  - [x] 4.5 **readSettings fails:** stub `readSettings` to resolve `{ ok: false, error: '...' }`; await; assert return value is `null`; assert `validateLicense` NOT called (defensive — if we can't read settings we can't validate)
  - [x] 4.6 **Active + valid:** stub `readSettings` to return settings with `license.status: 'active'`; stub `validateLicense` to resolve `{ ok: true, data: { valid: true } }`; await; assert `validateLicense` was called once with the correct `(key, instanceId, signal)` args; assert `writeSettings` NOT called; assert return value is `null`
  - [x] 4.7 **Active + valid:false → revoked:** stub `readSettings` to return the same active settings on BOTH calls (initial read + post-validation re-read); stub `validateLicense` to resolve `{ ok: true, data: { valid: false } }`; stub `writeSettings` to resolve `{ ok: true, data: undefined }`; await; assert `writeSettings` was called with `license.status = 'inactive'`; assert return value is `'revoked'`
  - [x] 4.8 **Active + valid:false but post-validation race (license removed between reads):** stub `readSettings` to return active settings on first call, then settings WITHOUT `license` on second call; assert `writeSettings` NOT called; assert return value is still `'revoked'` (harmless redundant message — do NOT silence it)
  - [x] 4.9 **Active + network error → offline:** stub `validateLicense` to resolve `{ ok: false, error: { kind: 'network', message: 'timeout' } }`; await; assert `writeSettings` NOT called; assert return value is `'offline'`
  - [x] 4.10 **Active + unknown_api_error → offline:** stub returns `{ kind: 'unknown_api_error' }`; assert treated same as network (no write, return value = `'offline'`). Rationale: an unexpected server response on launch is indistinguishable from offline from the user's perspective; we err toward grace
  - [x] 4.11 **Unexpected exception caught:** stub `validateLicense` to throw a synchronous exception OR reject with a non-`LicenseError`-shaped rejection; await `validateLicenseOnLaunch` and confirm it resolves to `'offline'` (does not throw)
  - [x] 4.12 **AbortSignal passed:** capture the `signal` argument from the `validateLicense` mock call; assert it is an `AbortSignal` instance (further timing-based assertions are unnecessary — the spec is that the signal exists and is wired)

- [x] **Task 5: Write home-screen notice rendering test** (AC: #5, #6, #7)
  - [x] 5.1 Add tests to `src/screens/home.test.ts` (or create one if it doesn't exist for the notice helper specifically) — prefer adding a focused unit test for `renderLaunchNotice(notice)` which returns the formatted string for each input
  - [x] 5.2 Test: `renderLaunchNotice(null)` returns `null`
  - [x] 5.3 Test: `renderLaunchNotice('revoked')` returns a string containing the substring `"no longer active"` AND the red `error()` ANSI color
  - [x] 5.4 Test: `renderLaunchNotice('offline')` returns a string containing the substring `"offline mode"` AND the dim ANSI color
  - [x] 5.5 Integration-style test (optional): drive `showHomeScreen('revoked')` once; assert the notice was rendered to stdout. Skip if integrating against inquirer is too heavy; the pure helper test + the parameter-passing wiring cover the contract

- [x] **Task 6: Verify launch boundary discipline** (AC: #2)
  - [x] 6.1 `grep -rn "validateLicense" src/` should match: `src/domain/license-client.ts` (definition), `src/domain/license-launch.ts` (the orchestrator), and their `.test.ts` siblings — and NO OTHER files. The launch orchestrator is the only consumer of `validateLicense` in this story
  - [x] 6.2 `grep -rn "validateLicenseOnLaunch\|renderLaunchNotice" src/` should show `index.ts` calls `validateLicenseOnLaunch` exactly once, `home.ts` exports `renderLaunchNotice` exactly once
  - [x] 6.3 Confirm `src/index.ts` `await`s `validateLicenseOnLaunch()` and passes the result into `showHome(launchNotice)` — serial execution + parameter propagation is the contract
  - [x] 6.4 Run full suite (`npm test`) — confirm no regressions; baseline after 14.1+14.2 lands should be ~1119 tests; this story adds ~12 new tests for ~1131

### Review Findings

- [x] [Review][Patch] Missing trailing newline at end of `src/domain/license-launch.ts` [src/domain/license-launch.ts:46] — fixed
- [x] [Review][Defer] TOCTOU race on settings — concurrent process mutating `settings.json` between defensive re-read and `writeSettings` could overwrite unrelated fields [src/domain/license-launch.ts:27-35] — deferred, pre-existing pattern (codebase has no locking; single-user CLI threat model)
- [x] [Review][Defer] `writeSettings()` Result is not inspected — on persistent write failure, function returns `'revoked'` but `settings.license.status` stays `active`, causing the revoked notice to repeat every launch [src/domain/license-launch.ts:31] — deferred, spec does not specify write-error UX; current behavior is recoverable next launch

## Dev Notes

### Architecture Requirements

- **Serial execution with `ora` spinner**: `validateLicenseOnLaunch()` is `await`ed from `index.ts` between Welcome and Home. While the call is in flight, the user sees an `ora('Checking license…')` spinner — the same idiom used for provider connection tests, AI calls, explanation generation, and challenge preloading. This is the documented codebase guardrail: "Use `ora` for any AI or network task that can visibly pause the terminal." The launch budget is bounded by `AbortSignal.timeout(2000)`, so worst-case latency for active-license users is ~2s.
- **No-op when license absent or inactive**: Free-tier launches and launches with `license.status === 'inactive'` skip the spinner entirely — `validateLicenseOnLaunch` returns `null` immediately with zero network or visual cost. This is the dominant path for most users.
- **Self-contained orchestrator**: `validateLicenseOnLaunch()` takes NO arguments and calls `readSettings()` itself. This protects against staleness if a preceding launch step (e.g. `showProviderSetup` writing fresh provider credentials) mutated settings on disk. The cost is one extra disk read per launch (sub-millisecond on local SSD) in exchange for self-contained correctness.
- **Offline grace is the default failure mode**: Both `network` and `unknown_api_error` outcomes preserve the cached `"active"` status with no settings write. The architecture explicitly forbids blocking launch on validation failure.
- **Notice propagated via parameter, not module state**: The `LaunchNotice | null` outcome is returned from `validateLicenseOnLaunch()` to `index.ts`, then passed directly to `showHome(launchNotice)` → `showHomeScreen(launchNotice)`. The parameter defaults to `null` so other callers of `showHome` (none today) remain unaffected. A `noticeShown` boolean inside `showHomeScreen` enforces single-render across loop iterations.
- **Settings write happens via the existing `writeSettings()` atomic primitive**: No new disk-writing module is introduced. The orchestrator re-reads settings with `readSettings()` before mutating, for defensive idempotency against settings writes that may have happened during the 2s validation window.
- **`AbortSignal.timeout(2000)` lives at the orchestrator (caller of `validateLicense`)**: Story 14.2 deliberately declined to bake the timeout into the client. This is the call site that owns the policy.
- **No retries**: One validation attempt per launch. Network failures show the offline notice. The user can re-launch to retry.
- **No telemetry, no logging the key**: If a `console.warn`/`debug` is added during dev, it must NOT include `license.key` — only `instanceId` or generic context.
- **Exception safety**: A `try/catch` around the orchestrator body converts any unexpected exception to `'offline'`. Even though the call is now `await`ed (not fire-and-forget), an uncaught exception would still abort the user's launch — defensive handling stays mandatory.
- **Ctrl+C during the spinner**: Default Node SIGINT during an `ora` spinner kills the process while the cursor is hidden, leaving the user's next shell prompt with a hidden cursor. This is pre-existing behavior shared with `showProviderSetup`'s connection-test spinner — not a regression introduced by this story. No additional mitigation needed.
- **ESM imports**: `.js` extensions on all internal imports.
- **UX scope: ONE SPINNER, ONE BANNER LINE, ONE TIME** — no modals, no prompts, no animations beyond the standard `ora` spinner.

[Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Launch validation (L536+)]
[Source: docs/planning-artifacts/architecture.md#Cross-Cutting Concerns — launch validation row]
[Source: docs/planning-artifacts/architecture.md#NFR 4 — ≤ 2 s launch budget]
[Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR55: launch-time validation; FR56: offline grace)]
[Source: docs/planning-artifacts/epics.md#Story 14.3: Launch-Time License Validation]
[Source: docs/planning-artifacts/ux-design-specification.md#Startup flow — License launch validation step]

### Key Implementation Details

**`src/domain/license-launch.ts` — full skeleton:**

```typescript
import ora from 'ora'
import { validateLicense } from './license-client.js'
import { readSettings, writeSettings } from './store.js'
import type { SettingsFile } from './schema.js'

export type LaunchNotice = 'revoked' | 'offline'

export async function validateLicenseOnLaunch(): Promise<LaunchNotice | null> {
  const initial = await readSettings()
  if (!initial.ok || !initial.data.license || initial.data.license.status !== 'active') {
    return null
  }

  const { key, instanceId } = initial.data.license
  const spinner = ora('Checking license…').start()

  try {
    const result = await validateLicense(key, instanceId, AbortSignal.timeout(2000))
    spinner.stop()

    if (!result.ok) {
      // network OR unknown_api_error → offline grace
      return 'offline'
    }
    if (result.data.valid) {
      // Status preserved, no write, no notice
      return null
    }

    // valid: false → revoke; re-read for defensive idempotency
    const fresh = await readSettings()
    if (fresh.ok && fresh.data.license && fresh.data.license.status === 'active') {
      const updated: SettingsFile = {
        ...fresh.data,
        license: { ...fresh.data.license, status: 'inactive' as const },
      }
      await writeSettings(updated)
    }
    return 'revoked'
  } catch {
    spinner.stop()
    return 'offline'
  }
}
```

**`src/index.ts` — minimal addition:**

```typescript
#!/usr/bin/env node
import { showHome, showProviderSetup, showWelcome } from './router.js'
import { readSettings } from './domain/store.js'
import { defaultSettings } from './domain/schema.js'
import { setTheme } from './utils/format.js'
import { validateLicenseOnLaunch } from './domain/license-launch.js'  // ← NEW

const settingsResult = await readSettings()
const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

setTheme(settings.theme)

let skippedProviderSetup = false
if (settings.provider === null) {
  skippedProviderSetup = await showProviderSetup(settings)
}
if (!skippedProviderSetup && settings.showWelcome) {
  await showWelcome()
}

// ← NEW: serial license validation between Welcome and Home
const launchNotice = await validateLicenseOnLaunch()
await showHome(launchNotice)   // ← CHANGED: pass notice through
```

**`src/router.ts` — signature update:**

```typescript
import type { LaunchNotice } from './domain/license-launch.js'   // ← NEW

export async function showHome(launchNotice: LaunchNotice | null = null): Promise<void> {
  await showHomeScreen(launchNotice)
}
```

**`src/screens/home.ts` — notice render integration:**

```typescript
import type { LaunchNotice } from '../domain/license-launch.js'
import { error, dim } from '../utils/format.js'

export function renderLaunchNotice(notice: LaunchNotice | null): string | null {
  if (notice === 'revoked') return error("Your license is no longer active. You've been returned to the free tier.")
  if (notice === 'offline') return dim('License could not be validated — offline mode')
  return null
}

export async function showHomeScreen(launchNotice: LaunchNotice | null = null): Promise<void> {
  let noticeShown = false
  while (true) {
    clearAndBanner()
    if (launchNotice && !noticeShown) {
      const banner = renderLaunchNotice(launchNotice)
      if (banner) {
        console.log(banner)
        console.log('')   // blank line for visual separation
      }
      noticeShown = true   // one-time per launch
    }
    // ... existing listDomains / loadDomainEntries / select / handleHomeAction logic unchanged ...
  }
}
```

> **Why serial, not concurrent:** The first draft of this story used a detached promise so validation could run in parallel with Welcome / Provider Setup. That approach was rejected because: (1) every other network call in the app uses `ora` — a fire-and-forget detached promise would be the only piece of background work in the codebase, breaking pattern consistency; (2) it added module-scoped `launchPromise` state and race-condition surface against Activate License / License Info screens that could mutate settings while validation was in flight; (3) the worst-case saving is ~2s (capped by `AbortSignal.timeout`) for the subset of users who have an active license AND a slow network AND no Welcome screen — a small win for meaningful complexity cost. Serial-with-spinner gives a familiar UX, zero race surface, and is bounded by the same 2s timeout.

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---|---|---|
| Optional parameter with default for backward-compatible signature change | None directly comparable — `showHome(launchNotice = null)` is a focused addition | new |
| `ora` spinner for network calls | Provider connection test, AI question generation, explanation generation | `src/screens/provider-setup.ts`, `src/screens/quiz.ts` |
| `vi.spyOn(globalThis, 'fetch')` for HTTP stubbing | All AI provider tests | `src/ai/providers/*.test.ts` |
| `vi.spyOn(module, 'fn')` for cross-module stubbing | Test patterns in `router.*.test.ts` | `src/router.test.ts` |
| `error()` / `dim()` formatting helpers | All screens that surface success/failure feedback | `src/utils/format.ts` |
| `clearAndBanner()` first call in screen loops | Every screen | `src/screens/*.ts` |
| `AbortSignal.timeout(ms)` usage | Not yet used in repo — license-launch introduces this idiom | new |

### Anti-Patterns to Avoid

- ❌ Do NOT make `validateLicenseOnLaunch` fire-and-forget. The serial-with-spinner pattern is the chosen architecture (see "Why serial, not concurrent" callout above).
- ❌ Do NOT propagate exceptions from the orchestrator. Wrap the body in `try/catch` and convert to `'offline'`. An uncaught exception in the launch path aborts the user's session.
- ❌ Do NOT persist the launch notice to disk. It's a session-only flag.
- ❌ Do NOT reintroduce module-scoped notice state (`pendingNotice` / `setLaunchNotice` / `consumeLaunchNotice`). With serial execution, parameter-passing through `showHome(launchNotice)` is the simpler shape and removes test-state-reset concerns entirely.
- ❌ Do NOT render the notice more than once per launch — the `noticeShown` flag in `showHomeScreen` enforces this even though `launchNotice` remains in scope across loop iterations.
- ❌ Do NOT pass the `settings` object into `validateLicenseOnLaunch` as a parameter. The orchestrator must read its own settings to be robust against any prior launch step that may have written settings (e.g. `showProviderSetup`).
- ❌ Do NOT write to `settings.json` on `valid: true` — this is a no-op outcome. Writing every launch would churn `mtime` and waste I/O.
- ❌ Do NOT write to `settings.json` on `network` failure — that's the offline-grace contract. The cached `"active"` status survives.
- ❌ Do NOT show the spinner when license is absent or inactive (free-tier and known-inactive launches must be visually identical to the pre-Epic-14 startup).
- ❌ Do NOT show a success line ("License OK") on `valid: true` — silent success keeps the launch ramp clean. Only failures surface a banner on Home.
- ❌ Do NOT log `settings.license.key` for debugging — even at debug level. Use `instanceId` (which is non-secret) if logging is needed.
- ❌ Do NOT touch the home menu choices (`buildHomeChoices`). That's Story 14.4's scope. This story ONLY adds the spinner during launch + the banner line above the menu.
- ❌ Do NOT skip the `AbortSignal.timeout(2000)` — that 2-second cap is the load-bearing piece of NFR 4 compliance.

### Previous Story Learnings

- **From Story 14.2:** `validateLicense(key, instanceId, signal?)` returns `Result<{ valid: boolean }, LicenseError>`. The `signal` param is forwarded to `fetch`. Pass `AbortSignal.timeout(2000)` to enforce the launch budget. Network/timeout/5xx all surface as `{ kind: 'network' }`; unexpected response shapes as `{ kind: 'unknown_api_error' }` — this story treats BOTH as offline grace.
- **From Story 14.1:** `settings.license` is `LicenseRecord | undefined` on a parsed `SettingsFile`. Existing free-tier installs have NO `license` key (verified by AC #2 in 14.1). The `migrateSettings()` graceful-drop hook means a malformed `license` on disk produces `settings.license === undefined` — which this orchestrator treats as "no license, no call" per AC #1.
- **From multi-provider tests:** `vi.spyOn(moduleNamespace, 'fn')` is the cleanest cross-module mock pattern. Import as `import * as licenseClient from './license-client.js'` and spy on `licenseClient.validateLicense`.
- **From Story 7.x (provider setup non-blocking validation):** The codebase already has precedent for spinner-based startup checks — provider connection test runs the same `ora` + bounded network call pattern. This story follows the same idiom.

### Project Structure Notes

**Modified files (this story only):**
- `src/index.ts` — add 1 import + 1 line (`const launchNotice = await validateLicenseOnLaunch()`) + update existing `await showHome()` to `await showHome(launchNotice)`
- `src/router.ts` — update `showHome` signature to accept optional `launchNotice: LaunchNotice | null = null`; import `LaunchNotice` type; pass through to `showHomeScreen(launchNotice)`
- `src/screens/home.ts` — update `showHomeScreen` signature to accept optional `launchNotice` parameter; add `noticeShown` flag + render block; export `renderLaunchNotice()` helper; import `LaunchNotice` type

**New files:**
- `src/domain/license-launch.ts` — the orchestrator module
- `src/domain/license-launch.test.ts` — orchestrator tests

**Files NOT touched in this story:**
- `src/domain/license-client.ts` (Story 14.2 — already exists)
- `src/domain/schema.ts` (no schema changes — `LicenseRecord` already has the `status` enum)
- `src/domain/store.ts` (we call `readSettings` / `writeSettings` as already exported — no internal changes)
- `src/screens/activate-license.ts` (Story 14.5 — new)
- `src/screens/license-info.ts` (Story 14.6 — new)
- `src/screens/create-domain.ts` (Story 14.7)
- `src/router.ts` no NEW routes (we only update the existing `showHome` signature); new routes for Activate License / License Info land in 14.5 / 14.6
- `src/screens/home.ts` menu structure (Story 14.4 — conditional menu items)
- `package.json` (no new dependencies — `ora` already in use)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR55, FR56)](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.3: Launch-Time License Validation](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Launch validation flow](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#Cross-Cutting Concerns — launch validation row](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#NFR 4 — Performance / launch budget](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/ux-design-specification.md#Startup flow — License launch validation step](../planning-artifacts/ux-design-specification.md)

## Dev Agent Record

### Agent Model Used

GitHub Copilot

### Debug Log References

- `npm test -- src/domain/license-launch.test.ts` — red phase confirmed missing `src/domain/license-launch.ts`
- `npm test -- src/domain/license-launch.test.ts` — 10 tests passed after Task 1 implementation
- `npm test -- src/index.test.ts src/router.test.ts` — red phase confirmed missing startup/router notice wiring
- `npm test -- src/index.test.ts src/router.test.ts` — 30 tests passed after Task 2 wiring
- `npm test -- src/screens/home.test.ts` — red phase confirmed missing `renderLaunchNotice` export and one-time notice path
- `npm test -- src/screens/home.test.ts` — 31 tests passed after Task 3 rendering
- `npm test -- src/domain/license-launch.test.ts` — 10 tests passed for Task 4 orchestrator coverage checklist
- `npm test -- src/screens/home.test.ts` — 31 tests passed for Task 5 launch notice rendering coverage
- `rg -n "\bvalidateLicense\b" src && rg -n "validateLicenseOnLaunch\(|renderLaunchNotice" src` — Task 6 boundary check passed
- `npm test` — 34 test files passed, 1211 tests passed
- `npm run typecheck` — passed

### Completion Notes List

- Task 1 implemented `validateLicenseOnLaunch()` with active-only launch validation, 2s abort signal, offline grace, revoked status persistence, and exception safety.
- Task 2 wired launch validation after provider setup/welcome and before home, passing the launch notice through `showHome()`.
- Task 3 added formatted revoked/offline launch notices and a per-launch `noticeShown` guard inside the home loop without changing menu choices.
- Task 4 added focused orchestrator coverage for no-op paths, validation outcomes, race-safe revocation persistence, offline grace, exception safety, and abort signal propagation.
- Task 5 added pure formatting tests for revoked/offline/null notices plus a one-time home-loop render test.
- Task 6 verified launch boundary discipline, full regression suite, and TypeScript typecheck with no regressions.

### File List

- src/domain/license-launch.ts
- src/domain/license-launch.test.ts
- src/index.ts
- src/index.test.ts
- src/router.ts
- src/router.test.ts
- src/screens/home.ts
- src/screens/home.test.ts
- docs/implementation-artifacts/14-3-launch-time-license-validation.md
- docs/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-05-16: Story file created via bmad-create-story workflow — comprehensive context engine analysis completed.
- 2026-05-16: Rewritten from concurrent fire-and-forget to serial-with-`ora`-spinner execution. Rationale: codebase consistency (every other network call uses `ora`), elimination of race surface with Activate/Info screens, and worst-case saving of only ~2s for the niche slice of active-license + slow-network + Welcome-disabled users. Architecture is now bounded by the same 2s `AbortSignal.timeout` but uses an awaited promise + spinner UX. Module surface changes: `startLaunchValidation` → `validateLicenseOnLaunch` (async, returns `LaunchNotice | null`); added `setLaunchNotice(notice)` for `index.ts` to push the result into module state; removed `_waitForLaunchValidation` test helper (no longer needed with serial execution).
- 2026-05-16: Adversarial-review polish pass. (1) Removed module-scoped notice state (`pendingNotice` / `setLaunchNotice` / `consumeLaunchNotice` / `_resetLaunchState`); the notice is now propagated as a parameter through `showHome(launchNotice)` → `showHomeScreen(launchNotice)` — simpler shape, no test-state-reset concern. (2) `validateLicenseOnLaunch()` now takes NO arguments and calls `readSettings()` itself for self-contained correctness against any settings mutation by prior launch steps (notably `showProviderSetup`). (3) AC #2 phrasing tightened ("immediately before `showHome(...)`" instead of OR-of-alternatives). (4) Added dev-note about Ctrl+C/SIGINT during spinner (known pre-existing behavior shared with provider-setup). (5) Task 2 now explicitly covers the `src/router.ts` signature update. Net effect: 3 fewer exports, 1 fewer module global, 1 extra disk read per launch, AC count unchanged at 9.
- 2026-05-16: Implemented launch-time license validation with serial startup wiring, revoked/offline home notices, focused tests, and full regression/typecheck validation. Status moved to review.
