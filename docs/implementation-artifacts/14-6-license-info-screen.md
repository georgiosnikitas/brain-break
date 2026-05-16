# Story 14.6: License Info Screen

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a licensed user,
I want a License Info screen that shows my license details with a hard-confirm Deactivate action and a Manage keys shortcut,
So that I can audit my license at a glance and release my activation when I move to another machine.

## Acceptance Criteria

1. **Given** `license.status === "active"` and I select `🔑 License Info` from the home screen **When** the screen renders **Then** `clearAndBanner()` is called, header `🔑 License Info` is printed, and the following fields are displayed using the same `'<emoji> ' + bold('Label:') + ' value'` format as the Stats Dashboard:
   - `📛 Status:` rendered as `Active` in **green**
   - `🔑 License key:` masked as first 4 + `…` + last 4 characters (e.g., `38B1…D4F9`)
   - `📅 Activated:` human-readable date derived from `license.activatedAt` (e.g., `May 15, 2026`)
   - `💻 Instance:` the stored `license.instanceName` verbatim
   - `📦 Product:` the stored `license.productName` verbatim
   - `🏬 Store:` the stored `license.storeName` verbatim

2. **Given** `license.status === "inactive"` **When** the screen renders **Then** the Status field is rendered as `Inactive` in **red** and a dim line is printed below the field block: *"This license was deactivated or could not be validated. Activate again to unlock unlimited domains."* All other fields render the same as the active case (masked key, date, instance, product, store)

3. **Given** `license === undefined` (no license at all) **When** `showLicenseInfoScreen()` is called directly (defensive guard — the home menu should not surface License Info in this state, but the screen must not crash) **Then** the screen prints a single notice line: *"No license on this machine. Use Activate License from the home menu."* and offers only a `↩️  Back` action. NO crash, NO exception. This is a safety net for edge cases (e.g., settings.json hand-edited between menu render and route dispatch)

4. **Given** the License Info screen is displayed with `status === "active"` **When** I view the actions **Then** the actions are in order: `🔌 Deactivate`, `🔛 Manage your keys`, `↩️  Back`

5. **Given** the License Info screen is displayed with `status === "inactive"` **When** I view the actions **Then** the actions are in order: `🔑 Re-activate`, `🔛 Manage your keys`, `↩️  Back`. The Deactivate action is NOT shown (the license is already deactivated server-side from the user's perspective)

6. **Given** I select `🔌 Deactivate` **When** the action runs **Then** a hard-confirm `select` prompt is shown with the message: *"Deactivate this license? You'll be limited to 1 domain again. Existing domains beyond the cap remain readable but you won't be able to create new ones until you re-activate."* offering two choices: `Cancel` (default focus) and `Yes, deactivate`. The choice ORDER in the array places `Cancel` first so inquirer's default focus lands on Cancel

7. **Given** I confirm deactivation (chose `Yes, deactivate`) **When** the deactivation call is in flight **Then** an ora spinner is shown with text `Deactivating license…`. The spinner is started before `deactivateLicense(license.key, license.instanceId)` is awaited and stopped on both success and failure branches

8. **Given** `deactivateLicense(...)` returns `{ ok: true }` **When** the result is handled **Then** the `license` sub-object is REMOVED ENTIRELY from settings via `readSettings → delete settings.license → writeSettings`. A brief green confirmation line is printed: *"License deactivated."* Then `showLicenseInfoScreen()` RETURNS (the home loop re-reads settings on next iteration and renders in free-tier mode — Activate License + Coffee both visible)

9. **Given** `deactivateLicense(...)` returns `{ ok: false, error: { kind } }` **When** the error is handled **Then** the `license` sub-object is NOT mutated (local state preserved with its prior `status`). The corresponding NFR2 deactivation error message is rendered inline in red on the License Info screen, the user remains on the screen, and the action menu re-renders:
   - `network` → `Could not reach the licensing server. Deactivation failed — try again when online.`
   - `unknown_api_error` → same copy as `network`
   - `invalid_key` / `revoked` / `limit_reached` / `product_mismatch` → `Deactivation failed. The licensing server reported an unexpected error — try again later.` (these shouldn't realistically occur on deactivate, but map them to a generic fallback to avoid leaking internals)

10. **Given** I select `🔑 Re-activate` (inactive-status branch) **When** the action runs **Then** `router.showActivateLicense()` is invoked. On its return, `showLicenseInfoScreen()` continues to its loop's next iteration which re-reads settings and re-renders. If activation succeeded, the next render shows `status: Active` (green); if it didn't, the inactive view persists. The existing `license` sub-object is overwritten by `activateLicense` ONLY on successful re-activation

11. **Given** I select `🔛 Manage your keys` **When** the action runs **Then** the URL `https://app.lemonsqueezy.com/my-orders` is rendered with the same QR-code-plus-URL pattern used by `showCoffeeScreen` / Story 14.5 (NO actual browser launch — codebase has no browser-open helper; documented deviation from epic prose). The user remains on the License Info screen

12. **Given** I select `↩️  Back` **When** the action runs **Then** `showLicenseInfoScreen()` returns with no settings mutation. The home loop renders the home menu unchanged

13. **Given** the user presses Ctrl+C on any prompt inside the screen **When** `ExitPromptError` is caught **Then** the screen returns cleanly — no unhandled rejection

14. **Given** Story 14.4's stub `router.showLicenseInfo` is in place **When** Story 14.6 ships **Then** `router.showLicenseInfo` is updated to `await showLicenseInfoScreen()` (imported from `./screens/license-info.js`) and the inline stub body + `STUB —` comment from 14.4 are removed

15. **Given** the License Info screen is implemented **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests in `src/screens/license-info.test.ts` cover (with `deactivateLicense`, inquirer prompts, and `qrcode-terminal` mocked):
    - Field rendering with `status === "active"` (Status green; masked key in `XXXX…YYYY` format; date in `Month D, YYYY` format; instance/product/store verbatim)
    - Field rendering with `status === "inactive"` (Status red; dim notice line printed)
    - Defensive no-license guard (AC #3) prints the notice and offers only Back
    - Key masking helper: `maskKey('38B1AABBCCDDD4F9')` returns `38B1…D4F9`; short keys (< 8 chars) render as `****` (all-asterisk fallback — never expose a short key in plaintext)
    - Date formatting helper: an ISO timestamp like `'2026-05-15T14:30:00.000Z'` → `'May 15, 2026'` (use `Intl.DateTimeFormat` or equivalent — establish the helper in the screen module or in `utils/format.ts` if not present)
    - Action list differs by status: active → `[Deactivate, Manage, Back]`; inactive → `[Re-activate, Manage, Back]`
    - Hard-confirm prompt: choices array places `Cancel` first (default focus); selecting `Cancel` returns to the action menu WITHOUT calling `deactivateLicense`
    - Successful deactivation: `writeSettings` is called with `settings.license === undefined` (or the key removed); screen returns; success line printed
    - Failed deactivation (network): `writeSettings` is NOT called; inline error message matches AC #9; user remains on screen
    - Re-activate action invokes `router.showActivateLicense` exactly once and then loops back to re-render
    - Manage your keys renders the orders URL via QR helper; user remains on screen
    - Back returns from the function (resolves Promise<void>)
    - ExitPromptError on any prompt resolves cleanly

## Tasks / Subtasks

- [ ] **Task 1: Create the new screen module** (AC: #1–#13)
  - [ ] 1.1 Create `src/screens/license-info.ts` with named export `export async function showLicenseInfoScreen(): Promise<void>`
  - [ ] 1.2 Module-scoped constant: `const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'`
  - [ ] 1.3 Module-scoped NFR2 deactivation error-message map keyed by `LicenseErrorKind`:
    ```typescript
    const DEACTIVATION_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
      network: 'Could not reach the licensing server. Deactivation failed — try again when online.',
      unknown_api_error: 'Could not reach the licensing server. Deactivation failed — try again when online.',
      invalid_key: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
      revoked: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
      limit_reached: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
      product_mismatch: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
    }
    ```
  - [ ] 1.4 Imports: `select`, `Separator` from `@inquirer/prompts`; `ExitPromptError` from `@inquirer/core`; `ora`; `qrcode` from `qrcode-terminal`; `deactivateLicense`, type `LicenseErrorKind` from `../domain/license-client.js`; `readSettings`, `writeSettings` from `../domain/store.js`; `defaultSettings` from `../domain/schema.js`; `clearAndBanner` from `../utils/screen.js` (NOT `utils/format.js` — verified path); `bold`, `menuTheme`, `success`, `error as errorFmt`, `dim` from `../utils/format.js` (all five are exported theme-aware helpers); `import * as router from '../router.js'` for `showActivateLicense` on Re-activate

- [ ] **Task 2: Implement field rendering** (AC: #1, #2, #3)
  - [ ] 2.1 At loop top, call `clearAndBanner()` and print header `'🔑 License Info'`
  - [ ] 2.2 Re-read settings at the top of each iteration so re-activate path picks up changes:
    ```typescript
    const cur = await readSettings()
    const settings = cur.ok ? cur.data : defaultSettings()
    const license = settings.license
    ```
  - [ ] 2.3 Defensive no-license guard: `if (!license) { … render the AC #3 notice, await a Back prompt, return }`
  - [ ] 2.4 Status field (use the theme-aware helpers, not raw `chalk`):
    - active → `console.log('  📍 ' + bold('Status:') + ' ' + success('Active'))`
    - inactive → `console.log('  📍 ' + bold('Status:') + ' ' + errorFmt('Inactive'))`
    - `success` is bold-green; `errorFmt` (aliased from `error`) is bold-red. Semantically `error()` for an info field is a small mismatch, but matches the codebase's color-helper convention and stays theme-aware (light vs dark mode)
  - [ ] 2.5 License key: `console.log('🔑 ' + bold('License key:') + ' ' + maskKey(license.key))`
  - [ ] 2.6 Activated date: `console.log('📅 ' + bold('Activated:') + ' ' + formatActivatedAt(license.activatedAt))`
  - [ ] 2.7 Instance / Product / Store: each on its own line with `bold('Instance:')` / `bold('Product:')` / `bold('Store:')` and the stored value verbatim
  - [ ] 2.8 If inactive, print blank line then dim notice: `console.log(dim('  This license was deactivated or could not be validated. Activate again to unlock unlimited domains.'))`

- [ ] **Task 3: Implement helpers `maskKey` and `formatActivatedAt`** (AC: #1, #15)
  - [ ] 3.1 `function maskKey(key: string): string`:
    - If `key.length < 8` return `'****'`
    - Otherwise return `key.slice(0, 4) + '…' + key.slice(-4)`
  - [ ] 3.2 `function formatActivatedAt(iso: string): string`:
    - Parse `new Date(iso)`; if `isNaN(d.getTime())` return the raw `iso` as fallback (never throw)
    - Return `d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })` (e.g., `'May 15, 2026'`)
  - [ ] 3.3 Keep both helpers local to `src/screens/license-info.ts` (do NOT export to `utils/format.ts` unless a reuse case appears — YAGNI)
  - [ ] 3.4 Export them as NAMED exports too so the test file can unit-test them in isolation: `export { maskKey, formatActivatedAt }`

- [ ] **Task 4: Implement action menu and dispatch** (AC: #4, #5, #6, #7, #8, #9, #10, #11, #12)
  - [ ] 4.1 Build choices array conditionally:
    ```typescript
    const choices = license.status === 'active'
      ? [
          { name: '🔌 Deactivate', value: 'deactivate' as const },
          { name: '🔛 Manage your keys', value: 'orders' as const },
          new Separator(),
          { name: '↩️  Back', value: 'back' as const },
        ]
      : [
          { name: '🔑 Re-activate', value: 'reactivate' as const },
          { name: '🔛 Manage your keys', value: 'orders' as const },
          new Separator(),
          { name: '↩️  Back', value: 'back' as const },
        ]
    ```
  - [ ] 4.2 Top-level `select<Action>({ message: 'Choose an action', choices, theme: menuTheme })` wrapped in try/catch for `ExitPromptError` (return on Ctrl+C)
  - [ ] 4.3 `back` → `return`
  - [ ] 4.4 `orders` → `await renderUrlScreen('🔛 Manage your keys', ORDERS_URL)` (helper extracted in Task 5); `continue`
  - [ ] 4.5 `reactivate` → `await router.showActivateLicense(); continue` (loop re-reads settings on next iteration)
  - [ ] 4.6 `deactivate` → hard-confirm flow (Task 6)

- [ ] **Task 5: Reuse the URL-rendering helper** (AC: #11)
  - [ ] 5.1 Story 14.5 added a `renderUrlScreen(title, url)` helper inside `src/screens/activate-license.ts`. DECISION: copy the same helper inline into `src/screens/license-info.ts` (~15 lines) — duplication is cheaper than introducing a shared module dependency that ties two unrelated screens together. If a third caller appears later, refactor into `utils/format.ts` then
  - [ ] 5.2 The copy must match the 14.5 helper byte-for-byte (QR small mode, two-space indent, raw URL line, Back navigation prompt, ExitPromptError catch). If 14.5 is already merged when 14.6 starts, the dev agent can grep the current file and paste

- [ ] **Task 6: Implement hard-confirm and deactivate flow** (AC: #6, #7, #8, #9)
  - [ ] 6.1 Hard-confirm prompt:
    ```typescript
    const confirm = await select<'cancel' | 'confirm'>({
      message: "Deactivate this license? You'll be limited to 1 domain again. Existing domains beyond the cap remain readable but you won't be able to create new ones until you re-activate.",
      choices: [
        { name: 'Cancel', value: 'cancel' },
        { name: 'Yes, deactivate', value: 'confirm' },
      ],
      theme: menuTheme,
    })
    if (confirm === 'cancel') continue
    ```
  - [ ] 6.2 Spinner: `const spinner = ora('Deactivating license…').start()`
  - [ ] 6.3 Call: `let result; try { result = await deactivateLicense(license.key, license.instanceId) } finally { spinner.stop() }`
  - [ ] 6.4 Success branch:
    - `const cur2 = await readSettings(); const s2 = cur2.ok ? cur2.data : defaultSettings()`
    - Remove the license property. Prefer object rest-destructuring over `delete` to satisfy strict TypeScript (`exactOptionalPropertyTypes` may flag `delete` on optional fields):
      ```typescript
      const { license: _omit, ...rest } = s2
      const updated: SettingsFile = rest
      ```
      If `tsconfig.json` does NOT have `exactOptionalPropertyTypes: true`, `delete s2.license` also works. Verify before choosing
    - `const w = await writeSettings(updated)` — if `!w.ok`, render `'Could not save settings after deactivation. Local state may be inconsistent.'` and `continue`; otherwise:
    - `console.log(success('License deactivated.'))`
    - Optional brief Continue prompt (Back to home), then `return`
  - [ ] 6.5 Failure branch:
    - `inlineError = DEACTIVATION_ERROR_MESSAGES[result.error.kind]`
    - DO NOT touch settings
    - `continue` (re-renders header + active-status field block + actions)

- [ ] **Task 7: Re-wire `router.showLicenseInfo` to call the real screen** (AC: #14)
  - [ ] 7.1 Open `src/router.ts`
  - [ ] 7.2 Add import: `import { showLicenseInfoScreen } from './screens/license-info.js'`
  - [ ] 7.3 Replace the stub `showLicenseInfo` body (added by Story 14.4) with: `export async function showLicenseInfo(): Promise<void> { await showLicenseInfoScreen() }`
  - [ ] 7.4 Remove the `// STUB — replaced by screens/license-info.ts in Story 14.6` comment
  - [ ] 7.5 Run `grep -n "STUB" src/router.ts` — should return ZERO matches (after Story 14.5 the only remaining stub was License Info; this story removes it)
  - [ ] 7.6 Run `grep -n "showActivateLicense\|showLicenseInfo" src/router.ts` — confirm both are now real delegating wrappers

- [ ] **Task 8: Tests** (AC: #15)
  - [ ] 8.1 Create `src/screens/license-info.test.ts`. Mock `@inquirer/prompts`, `ora`, `qrcode-terminal`, `../domain/license-client.js`, `../domain/store.js`, and `../router.js`
  - [ ] 8.2 Standard test license fixture (active): `{ key: '38B1AABBCCDDD4F9', instanceId: 'inst-123', instanceName: 'brain-break@georges-mac', activatedAt: '2026-05-15T14:30:00.000Z', productId: 1049453, productName: 'brain-break Pro', storeId: 1, storeName: 'Georgios Store', status: 'active' }`
  - [ ] 8.3 Inactive fixture: same but `status: 'inactive'`
  - [ ] 8.4 Unit-test the exported `maskKey` and `formatActivatedAt` helpers directly (Task 3.4)
  - [ ] 8.5 Cover the 13 test cases enumerated in AC #15
  - [ ] 8.6 For the Cancel-default test: assert `vi.mocked(select).mock.calls[N][0].choices[0].value === 'cancel'` (first choice is the inquirer default focus)
  - [ ] 8.7 For successful-deactivation test: assert `vi.mocked(writeSettings).mock.calls[0][0].license` is `undefined`
  - [ ] 8.8 Confirm baseline + new test count: ~1143 (after 14.5) + ~14 new tests = ~1157

- [ ] **Task 9: Boundary verification**
  - [ ] 9.1 `grep -rn "showLicenseInfoScreen" src/` — matches `src/screens/license-info.ts` (declaration), `src/router.ts` (import + call), and `src/screens/license-info.test.ts` only
  - [ ] 9.2 `grep -rn "deactivateLicense" src/` — matches `src/domain/license-client.ts` (declaration) and `src/screens/license-info.ts` only (no other consumer in Epic 14)
  - [ ] 9.3 `npm test` and `npm run typecheck` — green

## Dev Notes

### Architecture Requirements

- **Screen owns persistence write.** `deactivateLicense` in `domain/license-client.ts` returns a `Result` and does NOT touch settings. Removing the `license` sub-object is this screen's job: `readSettings → delete settings.license → writeSettings`.
- **Inline error rendering, never crash.** All deactivation failures stay on the screen with an inline message; local `license` state is preserved.
- **Loop re-reads settings on each iteration.** The Re-activate action calls `router.showActivateLicense()` which mutates `settings.license` on success. When that call returns, the License Info loop must re-read settings to render the new status. This mirrors the home loop pattern from Story 14.4.
- **Cancel-default on hard-confirm.** Placing `Cancel` as the first choice in the `select` array leverages inquirer's default-focus behavior, satisfying the epic's "default focus on Cancel" requirement WITHOUT needing inquirer's `default` option (which `@inquirer/prompts`'s `select` does not expose for value-based defaults — first-choice convention is the idiomatic answer).
- **Defensive no-license guard.** The home menu (Story 14.4) only shows License Info when `license` exists, but a defensive check at the screen entry prevents crashes from edge cases (concurrent settings edits, future code paths). The notice + Back action is the safety net.
- **QR + URL parity with Coffee and Story 14.5.** Same anti-`open`-package, same `qrcode-terminal` rendering pattern.
- **No browser-open shellout.**
- **ESM `.js` imports.**
- **UX scope: STANDALONE SCREEN** with status-dependent action set and a hard-confirm deactivate flow. No new schema, no new domain types.

[Source: docs/planning-artifacts/architecture.md#License Activation Architecture]
[Source: docs/planning-artifacts/prd.md#FR55 License Info screen]
[Source: docs/planning-artifacts/prd.md#NFR2 — License deactivation error messages]
[Source: docs/planning-artifacts/epics.md#Story 14.6: License Info Screen]

### Key Implementation Details

**Module skeleton:**

```typescript
// src/screens/license-info.ts
import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import qrcode from 'qrcode-terminal'
import { deactivateLicense } from '../domain/license-client.js'
import type { LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings } from '../domain/schema.js'
import type { SettingsFile } from '../domain/schema.js'
import { clearAndBanner } from '../utils/screen.js'
import { bold, menuTheme, success, error as errorFmt, dim } from '../utils/format.js'
import * as router from '../router.js'

const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'

const DEACTIVATION_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
  network: 'Could not reach the licensing server. Deactivation failed — try again when online.',
  unknown_api_error: 'Could not reach the licensing server. Deactivation failed — try again when online.',
  invalid_key: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  revoked: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  limit_reached: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
  product_mismatch: 'Deactivation failed. The licensing server reported an unexpected error — try again later.',
}

type Action = 'deactivate' | 'reactivate' | 'orders' | 'back'

export function maskKey(key: string): string {
  if (key.length < 8) return '****'
  return key.slice(0, 4) + '…' + key.slice(-4)
}

export function formatActivatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export async function showLicenseInfoScreen(): Promise<void> {
  let inlineError: string | null = null

  while (true) {
    clearAndBanner()
    console.log('\n  🔑 License Info\n')

    const cur = await readSettings()
    const settings = cur.ok ? cur.data : defaultSettings()
    const license = settings.license

    if (!license) {
      console.log('  No license on this machine. Use Activate License from the home menu.\n')
      try {
        await select({
          message: 'Navigation',
          choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
          theme: menuTheme,
        })
      } catch (err) {
        if (!(err instanceof ExitPromptError)) throw err
      }
      return
    }

    // Field block
    const statusLabel = license.status === 'active'
      ? success('Active')
      : errorFmt('Inactive')
    console.log('  📛 ' + bold('Status:') + ' ' + statusLabel)
    console.log('  🔑 ' + bold('License key:') + ' ' + maskKey(license.key))
    console.log('  📅 ' + bold('Activated:') + ' ' + formatActivatedAt(license.activatedAt))
    console.log('  💻 ' + bold('Instance:') + ' ' + license.instanceName)
    console.log('  📦 ' + bold('Product:') + ' ' + license.productName)
    console.log('  🏬 ' + bold('Store:') + ' ' + license.storeName)
    if (license.status === 'inactive') {
      console.log('\n  ' + dim('This license was deactivated or could not be validated. Activate again to unlock unlimited domains.'))
    }
    console.log('')

    if (inlineError) { console.log('  ' + errorFmt(inlineError) + '\n'); inlineError = null }

    const choices = license.status === 'active'
      ? [
          { name: '🔌 Deactivate', value: 'deactivate' as Action },
          { name: '🔛 Manage your keys', value: 'orders' as Action },
          new Separator(),
          { name: '↩️  Back', value: 'back' as Action },
        ]
      : [
          { name: '🔑 Re-activate', value: 'reactivate' as Action },
          { name: '🔛 Manage your keys', value: 'orders' as Action },
          new Separator(),
          { name: '↩️  Back', value: 'back' as Action },
        ]

    let action: Action
    try {
      action = await select<Action>({ message: 'Choose an action', choices, theme: menuTheme })
    } catch (err) {
      if (err instanceof ExitPromptError) return
      throw err
    }

    if (action === 'back') return

    if (action === 'orders') {
      await renderUrlScreen('🔛 Manage your keys', ORDERS_URL)
      continue
    }

    if (action === 'reactivate') {
      await router.showActivateLicense()
      continue
    }

    // action === 'deactivate'
    let confirm: 'cancel' | 'confirm'
    try {
      confirm = await select<'cancel' | 'confirm'>({
        message: "Deactivate this license? You'll be limited to 1 domain again. Existing domains beyond the cap remain readable but you won't be able to create new ones until you re-activate.",
        choices: [
          { name: 'Cancel', value: 'cancel' },
          { name: 'Yes, deactivate', value: 'confirm' },
        ],
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) continue
      throw err
    }
    if (confirm === 'cancel') continue

    const spinner = ora('Deactivating license…').start()
    let result
    try {
      result = await deactivateLicense(license.key, license.instanceId)
    } finally {
      spinner.stop()
    }

    if (!result.ok) {
      inlineError = DEACTIVATION_ERROR_MESSAGES[result.error.kind]
      continue
    }

    const cur2 = await readSettings()
    const s2 = cur2.ok ? cur2.data : defaultSettings()
    const { license: _omit, ...rest } = s2
    const updated: SettingsFile = rest
    const w = await writeSettings(updated)
    if (!w.ok) {
      inlineError = 'Could not save settings after deactivation. Local state may be inconsistent.'
      continue
    }
    console.log('\n  ' + success('License deactivated.') + '\n')
    try {
      await select({
        message: 'Navigation',
        choices: [new Separator(), { name: '↩️  Back to home', value: 'home' as const }],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    return
  }
}

async function renderUrlScreen(title: string, url: string): Promise<void> {
  clearAndBanner()
  console.log(`\n  ${title}\n`)
  await new Promise<void>((resolve) => {
    qrcode.generate(url, { small: true }, (code) => {
      const indented = code.split('\n').map((line) => `  ${line}`).join('\n')
      console.log(indented)
      resolve()
    })
  })
  console.log(`\n  ${url}\n`)
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
}
```

**Router re-wire (Story 14.4 stub replacement):**

```typescript
// src/router.ts
import { showLicenseInfoScreen } from './screens/license-info.js'

export async function showLicenseInfo(): Promise<void> {
  await showLicenseInfoScreen()
}
```

> **Cross-check before authoring:** `clearAndBanner` lives in `src/utils/screen.ts`, NOT `utils/format.ts`. The five color helpers (`success`, `error`, `warn`, `dim`, `bold`) ARE in `utils/format.ts` and are theme-aware. Story 14.5 will have established the same import split; align with what 14.5's dev agent chose.

> **Circular import safety:** `import * as router from '../router.js'` creates `router → screens/license-info → router` cycle. This is safe because `router.showActivateLicense` is only called inside an `async` function body — the reference is resolved at call time, not at module evaluation. NEVER call `router.X()` at module top level in this file. Same pattern is used by `home.ts` (existing) and `create-domain.ts` (Story 14.7).

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---|---|---|
| `'<emoji> ' + bold('Label:') + ' value'` field rendering | Stats screen | `src/screens/stats.ts` lines 95–122 |
| Action loop with re-read on each iteration | Story 14.4 home loop; Story 14.5 activate-license loop | `src/screens/home.ts`, `src/screens/activate-license.ts` |
| Hard-confirm via select with Cancel-first | Existing delete-domain confirmation (if present) | check `src/screens/domain-menu.ts` |
| Spinner around awaited domain call | `ora('…').start()` then `.stop()` in finally | `src/router.ts` |
| QR + URL rendering | `showCoffeeScreen`, Story 14.5 `renderUrlScreen` | `src/screens/home.ts`, `src/screens/activate-license.ts` |
| `readSettings` + `defaultSettings` fallback + `writeSettings` | Settings screen save flow | `src/screens/settings.ts` |
| ExitPromptError catch-and-return | Every prompted screen | `src/screens/*.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT render the unmasked `license.key` anywhere — `maskKey` only.
- ❌ Do NOT call `router.showHome()` from this screen — return; let the home loop redraw.
- ❌ Do NOT preserve the `license` sub-object after a successful deactivation — it MUST be deleted entirely. A stale `license: { status: 'inactive' }` after server-side deactivation would mislead the user and the home menu.
- ❌ Do NOT mutate `settings.license` on a deactivation failure — server state is unknown; preserve local state.
- ❌ Do NOT skip the hard-confirm prompt or default to `Yes` — Cancel-first is mandated by the epic.
- ❌ Do NOT render `error.message` from the `LicenseError` — only the `kind`-mapped NFR2 string.
- ❌ Do NOT shell out to a browser. QR + URL parity with `showCoffeeScreen`.
- ❌ Do NOT introduce a shared `renderUrlScreen` module yet — copy from 14.5; refactor when a third caller appears (YAGNI).
- ❌ Do NOT crash on `license === undefined` — defensive notice + Back (AC #3).
- ❌ Do NOT touch any screen other than `license-info.ts` and `router.ts` in this story.
- ❌ Do NOT add a new dependency.

### Previous Story Learnings

- **From Story 14.1:** `LicenseRecord` shape has 9 fields including `instanceId` (required for deactivate API call), `key`, `activatedAt` (ISO string), `instanceName`, `productName`, `storeName`, and `status`. All required fields per schema.
- **From Story 14.2:** `deactivateLicense(key, instanceId): Promise<Result<void, LicenseError>>`. On success returns `{ ok: true }`; on failure returns `{ ok: false, error: { kind, message } }`. The `kind` enum is the same as activate (`invalid_key | product_mismatch | revoked | limit_reached | network | unknown_api_error`). For deactivation, realistic kinds are `network` / `unknown_api_error`; others map to a generic fallback.
- **From Story 14.3:** Launch validation flips `status: 'active' → 'inactive'` when the server reports the license is no longer valid. This screen renders the inactive state and offers Re-activate.
- **From Story 14.4:** Home menu shows License Info only when `license.status === 'active'`. Inactive licenses surface as Activate License from home — but if a user navigates to License Info via a future code path while inactive, the inactive variant of THIS screen (Re-activate action) is what they see. Re-read settings on each iteration ensures consistency.
- **From Story 14.5:** `renderUrlScreen` helper pattern + module structure + spinner discipline + NFR2 message map are all directly portable.

### Project Structure Notes

**New files (this story only):**
- `src/screens/license-info.ts` — the screen module
- `src/screens/license-info.test.ts` — tests

**Modified files:**
- `src/router.ts` — re-wire `showLicenseInfo` to call `showLicenseInfoScreen` (replace Story 14.4 stub)

**Files NOT touched in this story:**
- `src/domain/schema.ts` (no schema changes)
- `src/domain/store.ts` (no persistence-layer changes; only consumed)
- `src/domain/license-client.ts` (only consumed)
- `src/domain/license-launch.ts` (unrelated)
- `src/screens/home.ts` (already wired in Story 14.4)
- `src/screens/activate-license.ts` (Story 14.5)
- `src/screens/create-domain.ts` (Story 14.7)
- `package.json` (no new dependencies)

### References

- [Source: docs/planning-artifacts/prd.md#FR55 — License Info screen](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/prd.md#NFR2 — License deactivation error messages](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.6: License Info Screen](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Deactivate flow](../planning-artifacts/architecture.md)
- [Implementation reference: src/screens/stats.ts — `bold('Label:') + ' value'` rendering convention](../../src/screens/stats.ts)
- [Implementation reference: src/screens/activate-license.ts (Story 14.5) — renderUrlScreen helper pattern](../../src/screens/activate-license.ts)

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent._

### Debug Log References

_To be filled by dev agent._

### Completion Notes List

_To be filled by dev agent._

### File List

_To be filled by dev agent._

### Change Log

- 2026-05-16: Story file created via bmad-create-story workflow — built on Story 14.5 patterns; verified stats.ts field-rendering convention.
