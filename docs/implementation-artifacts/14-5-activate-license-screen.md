# Story 14.5: Activate License Screen

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a dedicated Activate License screen where I can paste my license key, jump to the storefront to buy one, or jump to my orders to manage existing keys,
So that I can unlock unlimited domains in one place without leaving the app.

## Acceptance Criteria

1. **Given** I select `🔑 Activate License` from the home screen **When** the screen renders **Then** `clearAndBanner()` is called, header `🔑 Activate License` is printed, and a short value-proposition paragraph is shown: *"Activate your license to unlock unlimited domains. Free tier is limited to 1 domain."*

2. **Given** the Activate License screen is displayed **When** I view the actions **Then** the screen offers an inquirer top-level `select` with four choices in order: `📋 Paste license key`, `🔛 Manage your keys`, `💳 Buy a license`, `↩️  Back`. Selecting `📋 Paste license key` opens a follow-up `input` prompt labeled `License key:` (trim whitespace; reject empty after trim with a brief retry message that returns to the action menu)

3. **Given** I submit a non-empty license key **When** the activation call is in flight **Then** an ora spinner is shown with text `Activating license…`. The spinner is started before `activateLicense(key)` is awaited and stopped (succeed/fail variant) immediately after the call resolves — never left hanging

4. **Given** `activateLicense(key)` returns `{ ok: true, data: licenseRecord }` **When** the result is handled **Then** the returned `LicenseRecord` is persisted by reading current settings via `readSettings()` (falling back to `defaultSettings()` on parse error), assigning `settings.license = licenseRecord`, and writing via `writeSettings(settings)`. A green confirmation line is printed: *"License activated successfully. Unlimited domains unlocked."* The user is returned to the home screen by RETURNING from `showActivateLicenseScreen()` — the screen does NOT call `router.showHome()` itself; the home loop in `showHomeScreen` is the caller and re-renders naturally on next iteration with the License Info action visible

5. **Given** `activateLicense(key)` returns `{ ok: false, error: { kind, message } }` **When** the error is handled **Then** NO settings write occurs and the corresponding NFR2 license error message is rendered inline in red on the same Activate License screen:
   - `invalid_key` → `License key not recognized. Check the key and try again.`
   - `product_mismatch` → `This license key is not valid for brain-break.`
   - `revoked` → `This license has been revoked or refunded and can no longer be used.`
   - `limit_reached` → `This license has reached its activation limit. Deactivate it on another device or buy an additional seat.`
   - `network` → `Could not reach the licensing server. Check your connection and try again.`
   - `unknown_api_error` → `Could not reach the licensing server. Check your connection and try again.` (same copy as network — user-facing distinction is not useful here)

6. **Given** an error was rendered inline **When** the screen continues **Then** the user remains on the Activate License screen, the action menu is re-rendered, the license-key input is cleared (a fresh `input` prompt each retry), and the user can pick `📋 Paste license key` again or any other action. There is NO retry counter / lockout — unbounded retries are allowed

7. **Given** I select `🔛 Manage your keys` **When** the action runs **Then** the URL `https://app.lemonsqueezy.com/my-orders` is rendered to the terminal in the same format used by `showCoffeeScreen` (header line + QR code via `qrcode-terminal` + the raw URL on its own line for click-to-open in modern terminals). The user remains on the Activate License screen (a single `↩️  Back` Continue prompt returns to the action menu). NOTE: the epic uses the phrase "opened in the default browser" but the codebase has no `open` package and `showCoffeeScreen` does not actually shell out to a browser — it renders a QR + URL. This story follows the existing pattern (Coffee parity), NOT the epic's literal wording

8. **Given** I select `💳 Buy a license` **When** the action runs **Then** the URL `https://georgiosnikitas.lemonsqueezy.com/checkout/buy/8581b2a9-5a89-45af-9367-d93acb044147` is rendered the same way (header `💳 Buy a license` + QR code + raw URL) and the user remains on the Activate License screen

9. **Given** I select `↩️  Back` **When** the action runs **Then** `showActivateLicenseScreen()` returns with no settings mutation. The home loop renders the home menu unchanged

10. **Given** the user presses Ctrl+C on any prompt inside the screen **When** `ExitPromptError` is caught **Then** the screen returns cleanly (or the standard process-exit behavior matches other screens) — never crashes with an unhandled rejection

11. **Given** Story 14.4's stub `router.showActivateLicense` is in place **When** Story 14.5 ships **Then** `router.showActivateLicense` is updated to `await showActivateLicenseScreen()` (imported from `./screens/activate-license.js`) and the inline stub body from 14.4 is removed. The 14.4 `STUB —` comment marker disappears

12. **Given** the Activate License screen is implemented **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests in `src/screens/activate-license.test.ts` cover (with `activateLicense` from `domain/license-client.ts` and the inquirer prompts both mocked):
    - Layout: header, value prop, and the four-choice action menu render in correct order
    - Empty / whitespace-only key submission shows the retry message and returns to the action menu without calling `activateLicense`
    - Spinner is started before `activateLicense` is awaited (assert via mock ordering or spinner.start spy)
    - Successful activation persists `settings.license` via `writeSettings` with the exact `LicenseRecord` returned, prints the green success line, and resolves the screen
    - Each of the 6 error kinds (`invalid_key`, `product_mismatch`, `revoked`, `limit_reached`, `network`, `unknown_api_error`) renders its exact NFR2 message and does NOT call `writeSettings`
    - Failed activation re-renders the action menu (user can retry)
    - `🔛 Manage your keys` action renders the orders URL and remains on the screen
    - `💳 Buy a license` action renders the checkout URL and remains on the screen
    - `↩️  Back` returns from the function (resolves Promise<void>)
    - ExitPromptError on any prompt resolves cleanly (no throw)

## Tasks / Subtasks

- [ ] **Task 1: Create the new screen module** (AC: #1, #2, #4, #5, #6, #7, #8, #9, #10)
  - [ ] 1.1 Create `src/screens/activate-license.ts` with named export `export async function showActivateLicenseScreen(): Promise<void>`
  - [ ] 1.2 Module-scoped constants near the top:
    - `const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'`
    - `const CHECKOUT_URL = 'https://georgiosnikitas.lemonsqueezy.com/checkout/buy/8581b2a9-5a89-45af-9367-d93acb044147'`
  - [ ] 1.3 Module-scoped NFR2 error-message map (avoids inline string literals scattered through the dispatcher):
    ```typescript
    const LICENSE_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
      invalid_key: 'License key not recognized. Check the key and try again.',
      product_mismatch: 'This license key is not valid for brain-break.',
      revoked: 'This license has been revoked or refunded and can no longer be used.',
      limit_reached: 'This license has reached its activation limit. Deactivate it on another device or buy an additional seat.',
      network: 'Could not reach the licensing server. Check your connection and try again.',
      unknown_api_error: 'Could not reach the licensing server. Check your connection and try again.',
    }
    ```
  - [ ] 1.4 Imports: `select`, `input`, `Separator` from `@inquirer/prompts`; `ExitPromptError` from `@inquirer/core`; `ora` default; `qrcode` from `qrcode-terminal`; `activateLicense`, type `LicenseErrorKind` from `../domain/license-client.js`; `readSettings`, `writeSettings` from `../domain/store.js`; `defaultSettings` from `../domain/schema.js`; `clearAndBanner` from `../utils/screen.js` (NOT `utils/format.js` — verified path); `menuTheme`, `success`, `error as errorFmt` from `../utils/format.js` (verified: both `success` and `error` are exported theme-aware helpers)
  - [ ] 1.5 Pattern: top-level `while (true)` action loop with `select` returning a discriminated union: `'paste' | 'orders' | 'checkout' | 'back'`. `back` breaks the loop; all other actions handle their work then `continue` back to re-render the menu

- [ ] **Task 2: Implement layout (header + value prop)** (AC: #1)
  - [ ] 2.1 At the top of `showActivateLicenseScreen`, call `clearAndBanner()`
  - [ ] 2.2 Print header line `'🔑 Activate License'` and a blank line
  - [ ] 2.3 Print value-prop paragraph: `'Activate your license to unlock unlimited domains. Free tier is limited to 1 domain.'`
  - [ ] 2.4 Helper: extract a local `renderHeader()` function so it can be called at the top of each loop iteration after errors to keep the screen consistent

- [ ] **Task 3: Implement Paste action with input prompt and spinner** (AC: #2, #3, #4, #5, #6)
  - [ ] 3.1 On `'paste'`: `const key = (await input({ message: 'License key:', theme: menuTheme })).trim()`
  - [ ] 3.2 If `key === ''`: print a brief retry-friendly notice (`'No key entered.'`) and `continue` the outer loop
  - [ ] 3.3 Spinner: `const spinner = ora('Activating license…').start()`. Wrap the call in try/finally to guarantee `spinner.stop()` runs even if `activateLicense` throws unexpectedly (defensive: the function returns `Result` so it shouldn't throw, but a try/finally is cheap insurance)
  - [ ] 3.4 `const result = await activateLicense(key)`
  - [ ] 3.5 `spinner.stop()` on both branches (or `spinner.succeed(...)` / `spinner.fail(...)` if format.ts provides matching helpers — check first)
  - [ ] 3.6 Success branch (`result.ok === true`):
    - Read current settings: `const cur = await readSettings(); const settings = cur.ok ? cur.data : defaultSettings()`
    - `settings.license = result.data`
    - `await writeSettings(settings)` — if `writeSettings` returns a `Result`, log a generic error and remain on screen if `!ok`; otherwise proceed
    - Print success line in green: `'License activated successfully. Unlimited domains unlocked.'`
    - Short pause / Continue prompt so user reads confirmation, then `return` (NOT `break` — explicit return for clarity)
  - [ ] 3.7 Failure branch (`result.ok === false`):
    - Render `LICENSE_ERROR_MESSAGES[result.error.kind]` in red (use `errorFmt` or red color helper from format.ts)
    - DO NOT mutate or write settings
    - `continue` the outer loop (which re-renders header + action menu)

- [ ] **Task 4: Implement Manage your keys + Buy a license url-rendering branches** (AC: #7, #8)
  - [ ] 4.1 Extract a local helper `renderUrlScreen(title: string, url: string): Promise<void>`:
    - Calls `clearAndBanner()`
    - Prints `title` line
    - Renders QR via `qrcode.generate(url, { small: true }, cb)` wrapped in `new Promise<void>(resolve => …)` exactly like `showCoffeeScreen` does
    - Prints the raw `url` on its own line
    - Awaits a `select` with a single `↩️  Back` Continue choice (theme: `menuTheme`)
    - Catches `ExitPromptError` (do not rethrow on Ctrl+C from this sub-prompt; just return — same pattern as Coffee)
  - [ ] 4.2 On `'orders'`: `await renderUrlScreen('🔛 Manage your keys', ORDERS_URL)`, then `continue`
  - [ ] 4.3 On `'checkout'`: `await renderUrlScreen('💳 Buy a license', CHECKOUT_URL)`, then `continue`
  - [ ] 4.4 Confirm with `package.json`: `qrcode-terminal` is already a dep (verified — line 42) so no new dependencies

- [ ] **Task 5: Implement Back + Ctrl+C handling** (AC: #9, #10)
  - [ ] 5.1 On `'back'`: `break` the outer loop and return (or `return` directly inside the switch)
  - [ ] 5.2 Wrap the top-level `select` in a `try / catch (err)` block. On `err instanceof ExitPromptError`: `return` (same convention as showCoffeeScreen). Do NOT call `process.exit` from this screen — let `showHomeScreen`'s top-level handler manage exit
  - [ ] 5.3 Likewise wrap the input prompt in Task 3.1 — `ExitPromptError` from the key input should `continue` the loop (treat Ctrl+C in the key field as "cancel this attempt")

- [ ] **Task 6: Re-wire `router.showActivateLicense` to call the real screen** (AC: #11)
  - [ ] 6.1 Open `src/router.ts`
  - [ ] 6.2 Add import: `import { showActivateLicenseScreen } from './screens/activate-license.js'`
  - [ ] 6.3 Replace the stub `showActivateLicense` body (added by Story 14.4) with: `export async function showActivateLicense(): Promise<void> { await showActivateLicenseScreen() }`
  - [ ] 6.4 Remove the `// STUB — replaced by screens/activate-license.ts in Story 14.5` comment
  - [ ] 6.5 DO NOT touch the Story 14.4 `showLicenseInfo` stub — that's owned by Story 14.6
  - [ ] 6.6 Run `grep -n "STUB" src/router.ts` — should show only the License Info stub line remaining

- [ ] **Task 7: Tests** (AC: #12)
  - [ ] 7.1 Create `src/screens/activate-license.test.ts` mirroring the style of `src/screens/home.test.ts` (vitest + `vi.mock` for `@inquirer/prompts`, `ora`, `qrcode-terminal`, `../domain/license-client.js`, `../domain/store.js`)
  - [ ] 7.2 Mock `activateLicense` to return controllable `Result<LicenseRecord, LicenseError>` values per test
  - [ ] 7.3 Mock `writeSettings` to capture the persisted settings object for the success-path assertion
  - [ ] 7.4 Mock the inquirer `select` to return scripted action choices and `input` to return scripted key values per test (use `vi.mocked(select).mockResolvedValueOnce(...)` chains)
  - [ ] 7.5 Cover the 12 test cases enumerated in AC #12
  - [ ] 7.6 Spinner ordering test: capture call order via `const order: string[] = []; spinner.start.mockImplementation(() => order.push('start')); activateLicense.mockImplementation(async () => { order.push('call'); return ... })` then assert `order` is `['start','call']`
  - [ ] 7.7 Confirm baseline + new test count: ~1131 (after 14.1+14.2+14.3+14.4) + ~12 new tests = ~1143

- [ ] **Task 8: Boundary verification** (AC compliance)
  - [ ] 8.1 `grep -rn "showActivateLicenseScreen" src/` — should match `src/screens/activate-license.ts` (declaration), `src/router.ts` (import + call), and `src/screens/activate-license.test.ts` only
  - [ ] 8.2 `grep -n "STUB" src/router.ts` — should only show the `showLicenseInfo` stub
  - [ ] 8.3 `npm test` — green
  - [ ] 8.4 `npm run typecheck` — clean

## Dev Notes

### Architecture Requirements

- **Screen owns the persistence write, not the client.** `activateLicense` in `domain/license-client.ts` (Story 14.2) returns the validated `LicenseRecord` and does NOT touch `settings.json`. This screen is responsible for `readSettings → mutate → writeSettings`. Keeping I/O at the screen layer matches the existing pattern (e.g., domain settings save in `screens/settings.ts`).
- **No router-driven return.** The screen returns from its async function; the home loop is the caller and re-renders naturally. This avoids circular imports (`screens/* → router → screens/*`).
- **Inline error rendering, never modal/throw.** All 6 error kinds map to a single NFR2 line printed in red. The user stays on the screen. Unbounded retries.
- **No SDK / no key logging.** `activateLicense` already swallows the key from its return value (Story 14.2). This screen MUST NOT log the entered key — no `console.log(key)`, no spinner text containing the key. The only log of `key` is its in-memory passing to `activateLicense`.
- **QR + URL parity with Coffee.** Epic prose says "opens in default browser" — the codebase has NO browser-launch package. `showCoffeeScreen` is the reference implementation: QR code + URL text. This story replicates that pattern for Manage your keys and Buy a license. Story documents the deviation from epic prose (AC #7 note).
- **Spinner discipline.** Start before await, stop on both branches. `ora` is already a dep (`router.ts` imports it).
- **ESM imports with `.js` extensions** on internal modules.
- **`menuTheme` for inquirer prompts** for visual consistency.
- **UX scope: STANDALONE SCREEN** with its own action loop. No new schema, no new domain types, no router-side state.

[Source: docs/planning-artifacts/architecture.md#License Activation Architecture]
[Source: docs/planning-artifacts/prd.md#FR54 Activate License — NFR2 license error messages]
[Source: docs/planning-artifacts/epics.md#Story 14.5: Activate License Screen]

### Key Implementation Details

**Module skeleton:**

```typescript
// src/screens/activate-license.ts
import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import qrcode from 'qrcode-terminal'
import { activateLicense } from '../domain/license-client.js'
import type { LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings } from '../domain/schema.js'
import { clearAndBanner } from '../utils/screen.js'
import { menuTheme, success, error as errorFmt } from '../utils/format.js'

const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'
const CHECKOUT_URL = 'https://georgiosnikitas.lemonsqueezy.com/checkout/buy/8581b2a9-5a89-45af-9367-d93acb044147'

const LICENSE_ERROR_MESSAGES: Record<LicenseErrorKind, string> = {
  invalid_key: 'License key not recognized. Check the key and try again.',
  product_mismatch: 'This license key is not valid for brain-break.',
  revoked: 'This license has been revoked or refunded and can no longer be used.',
  limit_reached: 'This license has reached its activation limit. Deactivate it on another device or buy an additional seat.',
  network: 'Could not reach the licensing server. Check your connection and try again.',
  unknown_api_error: 'Could not reach the licensing server. Check your connection and try again.',
}

type Action = 'paste' | 'orders' | 'checkout' | 'back'

export async function showActivateLicenseScreen(): Promise<void> {
  let inlineError: string | null = null
  let inlineNotice: string | null = null

  while (true) {
    clearAndBanner()
    console.log('\n  🔑 Activate License\n')
    console.log('  Activate your license to unlock unlimited domains. Free tier is limited to 1 domain.\n')
    if (inlineError) { console.log(`  ${errorFmt(inlineError)}\n`); inlineError = null }
    if (inlineNotice) { console.log(`  ${inlineNotice}\n`); inlineNotice = null }

    let action: Action
    try {
      action = await select<Action>({
        message: 'Choose an action',
        choices: [
          { name: '📋 Paste license key', value: 'paste' },
          { name: '🔛 Manage your keys', value: 'orders' },
          { name: '💳 Buy a license', value: 'checkout' },
          new Separator(),
          { name: '↩️  Back', value: 'back' },
        ],
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) return
      throw err
    }

    if (action === 'back') return

    if (action === 'orders') { await renderUrlScreen('🔛 Manage your keys', ORDERS_URL); continue }
    if (action === 'checkout') { await renderUrlScreen('💳 Buy a license', CHECKOUT_URL); continue }

    // action === 'paste'
    let key: string
    try {
      key = (await input({ message: 'License key:', theme: menuTheme })).trim()
    } catch (err) {
      if (err instanceof ExitPromptError) continue
      throw err
    }
    if (key === '') { inlineNotice = 'No key entered.'; continue }

    const spinner = ora('Activating license…').start()
    let result
    try {
      result = await activateLicense(key)
    } finally {
      spinner.stop()
    }

    if (!result.ok) { inlineError = LICENSE_ERROR_MESSAGES[result.error.kind]; continue }

    const cur = await readSettings()
    const settings = cur.ok ? cur.data : defaultSettings()
    settings.license = result.data
    const writeResult = await writeSettings(settings)
    if (!writeResult.ok) {
      inlineError = 'Activation succeeded but could not save settings. Please try again.'
      continue
    }

    console.log(`\n  ${success('License activated successfully. Unlimited domains unlocked.')}\n`)
    // brief confirm-and-return
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
import { showActivateLicenseScreen } from './screens/activate-license.js'
// ... existing imports ...

export async function showActivateLicense(): Promise<void> {
  await showActivateLicenseScreen()
}
// (showLicenseInfo stub remains untouched — Story 14.6 replaces it)
```

> **Cross-check before authoring:** read `src/utils/format.ts` to confirm the exact exported names for the green-success and red-error helpers. The skeleton above uses `success` and `error as errorFmt` — adjust if the real export names differ (the codebase already uses `colorIncorrect` and `warn` based on `router.ts` line 23, so `error` + `success` should exist or have equivalents). If `success` doesn't exist, use chalk directly or the nearest existing green helper.

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---|---|---|
| Action-loop screen (while+select+continue) | `showCoffeeScreen` (single iteration) and `showSettingsScreen` (multi-action loop) | `src/screens/home.ts`, `src/screens/settings.ts` |
| Spinner around an awaited call | `ora('…').start()` then `.stop()` after await | `src/router.ts`, `src/ai/client.ts` |
| QR + URL rendering | `showCoffeeScreen` | `src/screens/home.ts` lines 108–129 |
| `readSettings` + `defaultSettings` fallback + `writeSettings` | Settings screen save flow | `src/screens/settings.ts` |
| ExitPromptError catch-and-return | Every screen with a prompt | `src/screens/*.ts` |
| NFR2 inline error rendering | `screens/sprint-setup.ts` provider-error display | `src/screens/sprint-setup.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT log the license `key` anywhere — not in spinner text, not in error lines, not in success confirmation.
- ❌ Do NOT call `router.showHome()` from this screen — return and let the home loop redraw. Importing `router.ts` from here risks a circular import.
- ❌ Do NOT crash on any error kind — every failure path stays on the screen with an inline message.
- ❌ Do NOT add a retry counter or lockout — unbounded retries are the spec.
- ❌ Do NOT shell out to a browser via `child_process.exec("open …")` — codebase has no such helper. QR + URL parity with `showCoffeeScreen` is the contract.
- ❌ Do NOT validate the license key format client-side (length / regex). Lemon Squeezy is the source of truth; empty-string check is the only client-side rejection.
- ❌ Do NOT persist the `license` sub-object on ANY error path — including `product_mismatch` (which is already auto-deactivated inside `activateLicense`).
- ❌ Do NOT call `defaultSettings()` and lose existing settings on success path — always `readSettings()` first; `defaultSettings()` is the parse-failure fallback only.
- ❌ Do NOT touch Story 14.4's `showLicenseInfo` stub in `router.ts` — that's owned by Story 14.6.
- ❌ Do NOT add a new dependency (`open`, `inquirer-secret`, etc.) — `qrcode-terminal` + `ora` + `@inquirer/prompts` are sufficient.

### Previous Story Learnings

- **From Story 14.1:** `settings.license` is `LicenseRecord | undefined` on the typed shape. Assigning `settings.license = record` is type-safe.
- **From Story 14.2:** `activateLicense(key): Promise<Result<LicenseRecord, LicenseError>>`. `LicenseError = { kind: LicenseErrorKind; message: string }`. The `message` field is internal / for logs — the SCREEN maps `kind` to the user-facing NFR2 string. Do NOT render `error.message` verbatim (could leak API internals).
- **From Story 14.2:** `product_mismatch` is already auto-deactivated by `activateLicense` (it issues an immediate `deactivateLicense` call internally to release the just-activated instance). The screen sees a plain `product_mismatch` error and just renders the message — no extra cleanup needed.
- **From Story 14.3:** `readSettings()` returns `Result<SettingsFile, string>` with `defaultSettings()` as the fallback. Same pattern reused here.
- **From Story 14.4:** Home loop re-reads settings each iteration, so returning from this screen naturally swaps `Activate License → License Info` on next render. No need to signal back.
- **From `showCoffeeScreen`:** QR pattern uses `qrcode.generate(url, { small: true }, (code) => { … })` with the callback wrapped in `new Promise<void>(resolve => …)`. Indent each QR line with two spaces for visual alignment. Reuse this verbatim.

### Project Structure Notes

**New files (this story only):**
- `src/screens/activate-license.ts` — the screen module
- `src/screens/activate-license.test.ts` — tests

**Modified files:**
- `src/router.ts` — re-wire `showActivateLicense` to call `showActivateLicenseScreen` (replace Story 14.4 stub)

**Files NOT touched in this story:**
- `src/domain/schema.ts` (no schema changes)
- `src/domain/store.ts` (no persistence-layer changes; only consumed)
- `src/domain/license-client.ts` (no client changes; only consumed)
- `src/domain/license-launch.ts` (unrelated)
- `src/screens/home.ts` (already wired in Story 14.4)
- `src/screens/license-info.ts` (Story 14.6 — new module, NOT here)
- `src/screens/create-domain.ts` (Story 14.7)
- `package.json` (no new dependencies)

### References

- [Source: docs/planning-artifacts/prd.md#FR54 — Activate License](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/prd.md#NFR2 — License error messages](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.5: Activate License Screen](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Activate License flow](../planning-artifacts/architecture.md)
- [Implementation reference: src/screens/home.ts showCoffeeScreen — QR rendering pattern](../../src/screens/home.ts)

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

- 2026-05-16: Story file created via bmad-create-story workflow — context engine reviewed showCoffeeScreen pattern, NFR2 error map, and Story 14.4 router stub.
