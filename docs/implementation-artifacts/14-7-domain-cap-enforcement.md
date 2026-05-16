# Story 14.7: Domain Cap Enforcement at Create Domain

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a free-tier user,
I want the Create new domain action to politely block me with an upsell when I already have one domain (active or archived), with a fast path to the Activate License screen,
So that I learn about the paid tier exactly when the cap matters without losing access to any of my existing data.

## Acceptance Criteria

1. **Given** `settings.json` has `license.status === "active"` **When** I select `➕ Create new domain` from the home screen **Then** the cap is NOT enforced and the standard create-domain flow runs unchanged (name input → starting difficulty → Save/Back) — `showCreateDomainScreen()` short-circuits the cap check and proceeds directly to the existing flow

2. **Given** no active license is present (license `undefined` OR `status === "inactive"`) AND the total number of domain files in `~/.brain-break/` is `0` (active + archived combined; corrupted files also counted — see Implementation Details) **When** I select `➕ Create new domain` **Then** the cap is NOT enforced and the standard create-domain flow runs (first domain must always be allowed on the free tier)

3. **Given** no active license is present AND the total number of domain files is `≥ 1` (active + archived combined) **When** I select `➕ Create new domain` **Then** the upsell variant of the create-domain screen is displayed:
   - `clearAndBanner()` is called
   - Header line: `➕ Create new domain`
   - Upsell message (printed in dim or warning style on its own block): *"Free version is limited to 1 domain. Activate a license to create more."*
   - Action `select` with two choices in order: `🔑 Activate License`, `↩️  Back`
   - NO name input prompt, NO difficulty prompt, NO Save action

4. **Given** the cap-blocked create-domain screen is displayed **When** I select `🔑 Activate License` **Then** `router.showActivateLicense()` is invoked. On its return, `showCreateDomainScreen()` RETURNS (does NOT loop back to re-check the cap — the home loop is the caller and will route the user back through home → Create new domain if they want to retry). RATIONALE: the home loop re-reads settings each iteration; if activation succeeded, the next Create new domain entry passes the cap check naturally

5. **Given** the cap-blocked create-domain screen is displayed **When** I select `↩️  Back` **Then** `showCreateDomainScreen()` returns with no settings or domain mutation; the home loop renders the home menu unchanged

6. **Given** the user presses Ctrl+C on the cap-blocked action prompt **When** `ExitPromptError` is caught **Then** the screen returns cleanly (matches existing `showCreateDomainScreen` Ctrl+C convention)

7. **Given** I had 2 domains while licensed, then deactivated the license **When** I select `➕ Create new domain` **Then** the upsell is displayed (2 ≥ 1, no active license). The 2 existing domains remain fully readable, playable, archivable, and deletable from the home screen and their sub-menus — ONLY domain creation is blocked. NO retroactive enforcement on existing domains

8. **Given** I deleted my over-cap domains until the total reached `0` **When** I select `➕ Create new domain` **Then** the standard create-domain flow runs (count is now `0`, so the cap check passes via AC #2)

9. **Given** `listDomains()` returns `{ ok: false, error: ... }` (filesystem error) **When** the cap check runs **Then** the upsell is NOT shown and the standard create-domain flow runs (fail-open). RATIONALE: if we can't count domains, blocking the user could lock them out entirely; the existing `writeDomain` flow will surface any subsequent FS errors. This is the same fail-open posture as Story 14.3's offline-grace on launch validation

10. **Given** the cap is implemented **When** I run `npm test` **Then** all existing `create-domain.test.ts` tests pass with no regressions, and new tests cover:
    - **Licensed pass-through:** `license.status === 'active'` with 5 existing domains → standard flow runs (assert name input prompt is reached)
    - **Free-tier 0 domains:** no license + empty domain list → standard flow runs
    - **Free-tier 1 active domain:** no license + 1 active domain → upsell shown
    - **Free-tier 1 archived domain:** no license + 1 archived domain → upsell shown
    - **Free-tier 1 active + 1 archived:** no license + 2 total → upsell shown
    - **Free-tier 1 corrupted domain:** no license + 1 entry with `corrupted: true` → upsell shown (corrupted files count toward the cap because they occupy the slot)
    - **Inactive license, 1 domain:** `license.status === 'inactive'` + 1 domain → upsell shown (inactive is treated as free tier — same semantics as Story 14.4 AC #7)
    - **Activate License action dispatch:** upsell + `🔑 Activate License` selection → `router.showActivateLicense` invoked exactly once; screen then returns
    - **Back action:** upsell + `↩️  Back` selection → screen returns, `router.showActivateLicense` NOT invoked, no domain file written
    - **Fail-open on listDomains error:** `listDomains` returns `{ ok: false }` → standard flow runs
    - **Settings read failure:** `readSettings` returns `{ ok: false }` → treat as no license (free tier) and run the cap check normally; if domain count ≥ 1, upsell is shown

## Tasks / Subtasks

- [ ] **Task 1: Extend `showCreateDomainScreen` with a cap-check entry guard** (AC: #1–#9)
  - [ ] 1.1 At the very top of `showCreateDomainScreen` (BEFORE `clearAndBanner()`), perform the cap check (encapsulated in a helper — see Task 2)
  - [ ] 1.2 If the cap is hit: call the new `showCapBlockedScreen()` helper (Task 3) and return — do NOT fall through to the standard flow
  - [ ] 1.3 If the cap is not hit: proceed to the existing `clearAndBanner()` + `promptForUniqueDomainSlug()` + … unchanged flow
  - [ ] 1.4 Preserve the EXISTING try/catch around the standard flow (`ExitPromptError` handling)
  - [ ] 1.5 Do NOT modify `validateDomainName`, `duplicateDomainMessage`, or `promptForUniqueDomainSlug` — those remain unchanged

- [ ] **Task 2: Implement the cap-check helper** (AC: #1, #2, #3, #7, #9, #10)
  - [ ] 2.1 New local helper `async function isCapBlocked(): Promise<boolean>`:
    ```typescript
    async function isCapBlocked(): Promise<boolean> {
      const settingsResult = await readSettings()
      const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
      if (settings.license?.status === 'active') return false // AC #1

      const listResult = await listDomains()
      if (!listResult.ok) return false // AC #9 — fail-open

      return listResult.data.length >= 1 // AC #2/#3
    }
    ```
  - [ ] 2.2 Place this helper either INSIDE `create-domain.ts` (preferred — keeps cap logic co-located with the screen that enforces it) OR export it for testability. DECISION: export as `export async function isCapBlocked()` so the tests can unit-test the cap predicate in isolation without driving the full screen
  - [ ] 2.3 Add imports to `src/screens/create-domain.ts`:
    - `readSettings` from `../domain/store.js` (already exists — `listDomains` is already imported)
    - `defaultSettings` from `../domain/schema.js` (already imported)
    - Verify both imports — if `readSettings` is not yet imported, add it
  - [ ] 2.4 Counting semantics — `listResult.data.length >= 1` covers all 4 cases the epic enumerates:
    - 1 active → length 1 → blocked
    - 1 archived → length 1 → blocked (archived files live in the same dir; `listDomains` includes them)
    - 1 active + 1 archived → length 2 → blocked
    - 1 corrupted → length 1 → blocked (corrupted entries are in the array with `corrupted: true`)
  - [ ] 2.5 Verify with `src/domain/store.ts` lines 91–116: `listDomains` returns ALL `*.json` files except `settings.json` and `.tmp-*` prefixes. Active + archived + corrupted ALL counted. This is the correct denominator for the cap

- [ ] **Task 3: Implement the cap-blocked screen variant** (AC: #3, #4, #5, #6)
  - [ ] 3.1 New local helper `async function showCapBlockedScreen(): Promise<void>`:
    ```typescript
    async function showCapBlockedScreen(): Promise<void> {
      clearAndBanner()
      console.log('\n  ➕ Create new domain\n')
      console.log('  ' + warn('Free version is limited to 1 domain. Activate a license to create more.') + '\n')

      let action: 'activate' | 'back'
      try {
        action = await select<'activate' | 'back'>({
          message: 'Choose an action',
          choices: [
            { name: '🔑 Activate License', value: 'activate' },
            new Separator(),
            { name: '↩️  Back', value: 'back' },
          ],
          theme: menuTheme,
        })
      } catch (err) {
        if (err instanceof ExitPromptError) return
        throw err
      }

      if (action === 'activate') {
        await router.showActivateLicense()
        return // AC #4 — single-shot; home loop is the retry path
      }
      // action === 'back' → return
    }
    ```
  - [ ] 3.2 Use `warn(...)` (already imported from `utils/format.js`) for the upsell line — yellow/orange tone is the standard for soft blocks in this codebase. If a `dim` helper exists in format.ts and feels more apt, prefer it
  - [ ] 3.3 Import `router` namespace: `import * as router from '../router.js'`. The import is a NEW one for this file — verify it isn't already present
  - [ ] 3.4 ExitPromptError caught and returns silently (matches existing `showCreateDomainScreen` convention at the bottom of the file)

- [ ] **Task 4: Wire the guard into `showCreateDomainScreen`** (AC: #1, #2, #3)
  - [ ] 4.1 Edit the existing `export async function showCreateDomainScreen(): Promise<void>`:
    ```typescript
    export async function showCreateDomainScreen(): Promise<void> {
      if (await isCapBlocked()) {
        await showCapBlockedScreen()
        return
      }
      clearAndBanner()
      try {
        // ... existing body unchanged ...
      } catch (err) {
        if (err instanceof ExitPromptError) return
        throw err
      }
    }
    ```
  - [ ] 4.2 The cap check is performed BEFORE `clearAndBanner()` so the `showCapBlockedScreen` helper owns its own screen clear. This avoids a double-clear flash
  - [ ] 4.3 Verify no other function in `create-domain.ts` needs cap-checking — only the entry point matters

- [ ] **Task 5: Tests** (AC: #10)
  - [ ] 5.1 Open `src/screens/create-domain.test.ts` (verify the file exists; if not, use the closest existing pattern)
  - [ ] 5.2 Add a new `describe('domain cap enforcement', ...)` block
  - [ ] 5.3 Mock `readSettings`, `listDomains`, `writeDomain`, `@inquirer/prompts` (`select`, `input`), and `../router.js` (the `showActivateLicense` export)
  - [ ] 5.4 Cover the 11 test cases enumerated in AC #10 (one per bullet)
  - [ ] 5.5 For unit tests of `isCapBlocked` in isolation: import the exported function and assert its return value across the four key permutations (active license + N domains; free + 0; free + N; settings/list errors)
  - [ ] 5.6 For dispatch tests: mock `select` to return `'activate'` (assert `vi.mocked(router.showActivateLicense)` called once + `vi.mocked(writeDomain)` NOT called) and `'back'` (assert neither called)
  - [ ] 5.7 For regression: ensure existing pass-through tests still work by either passing `{ ok: true, data: licensedSettings }` from `readSettings` mock OR `{ ok: true, data: [] }` from `listDomains` mock — depending on what each existing test setup already mocks. If existing tests don't mock `readSettings` / `listDomains`, prefer `defaultSettings()` fallback (no license) + empty list (free + 0 domains → pass-through)
  - [ ] 5.8 Confirm baseline + new test count: ~1157 (after 14.6) + ~11 new tests = ~1168

- [ ] **Task 6: Boundary verification** (AC compliance)
  - [ ] 6.1 `grep -n "isCapBlocked\|showCapBlockedScreen" src/` — matches only `src/screens/create-domain.ts` and `src/screens/create-domain.test.ts`
  - [ ] 6.2 `grep -rn "router.showActivateLicense" src/screens/` — should now match three callsites: `home.ts` (Story 14.4), `license-info.ts` (Story 14.6 Re-activate), and `create-domain.ts` (this story Activate from upsell)
  - [ ] 6.3 Confirm NO OTHER files were modified beyond `src/screens/create-domain.ts` and `src/screens/create-domain.test.ts`
  - [ ] 6.4 `npm test` — green
  - [ ] 6.5 `npm run typecheck` — clean

- [ ] **Task 7: Epic 14 closing checks (not blocking, but recommended)**
  - [ ] 7.1 Run the full Epic 14 happy path manually if possible: free tier → create 1 domain → try to create a second → upsell → Activate License (mock or real key) → return → menu now shows License Info → create a 2nd domain succeeds
  - [ ] 7.2 Run the deactivate flow: License Info → Deactivate → confirm → returns to home (Activate License + Coffee both visible) → Create new domain → upsell (since 2 domains exist)
  - [ ] 7.3 If any issue is found, file a correction-course note rather than expanding 14.7 scope

## Dev Notes

### Architecture Requirements

- **Cap counted from `listDomains` (active + archived + corrupted combined).** `listDomains` already returns every `*.json` in `~/.brain-break/` except `settings.json` and `.tmp-*` prefixes. The epic explicitly counts active + archived; corrupted files counting toward the cap is the safer interpretation (they occupy filesystem slots; a corrupted file is still "a domain the user has").
- **Single-domain hard limit on free tier.** `length >= 1` is the predicate, NOT `> 1`. The first domain is FREE (`length === 0`); the second attempt is blocked.
- **Fail-open on FS errors.** If `listDomains` fails, the cap is bypassed (AC #9). This avoids permanently locking a user out due to a transient filesystem issue. The existing `writeDomain` flow will surface any persistent FS problem.
- **Active license fully bypasses the cap.** No domain counting happens for licensed users. The check short-circuits on `settings.license?.status === 'active'`.
- **Inactive license == free tier semantically.** Same convention as Story 14.4 AC #7. An expired or revoked license offers no cap relief.
- **Existing over-cap domains remain functional.** This story ONLY blocks the creation entry point. Read / Play / History / Stats / Archive / Delete / Bookmark / Sprint / My Coach / ASCII art are all unaffected. No retroactive enforcement.
- **No retry loop inside the upsell.** Selecting `Activate License` invokes the activate screen and returns. If activation succeeded, the user will see the home menu re-render (Story 14.4) and can pick Create new domain again — the home loop is the retry path. This avoids an awkward "did it work?" question inside the create-domain screen.
- **Counting semantics edge case: corrupted files.** A user with one corrupted `.json` and no other domains is at the cap (length 1, blocked). This is the correct behaviour: the user must clean up the corrupted file (delete from disk or via the archived/active menu) before creating a fresh domain. Documenting it explicitly so the test asserts it.
- **No new schema, no new persistence.** This story is pure UI + cap-predicate logic.
- **ESM `.js` imports.**

> **Scope note — fail-open posture (AC #9) extends beyond epic prose:** The epic does not explicitly mandate behavior when `listDomains()` returns a filesystem error. AC #9 adds defensive fail-open semantics (run the standard flow when we can't count domains) to prevent permanently locking users out due to transient FS issues. This is a defensive expansion of scope. If the product owner prefers fail-closed (block creation on FS error with a generic error message), flip the predicate in `isCapBlocked` to return `true` on `!listResult.ok` and add a corresponding inline error message in the upsell variant. Default in this story is fail-open.

[Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Cap Enforcement]
[Source: docs/planning-artifacts/prd.md#FR2 — Create Domain (cap pre-check)]
[Source: docs/planning-artifacts/epics.md#Story 14.7: Domain Cap Enforcement at Create Domain]

### Key Implementation Details

**Final shape of `src/screens/create-domain.ts` (top of file):**

```typescript
import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { slugify } from '../utils/slugify.js'
import { listDomains, readSettings, writeDomain } from '../domain/store.js'
import { defaultDomainFile, defaultSettings } from '../domain/schema.js'
import { warn, success, error as errorFmt, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

// ... validateDomainName, duplicateDomainMessage, promptForUniqueDomainSlug unchanged ...

export async function isCapBlocked(): Promise<boolean> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  if (settings.license?.status === 'active') return false

  const listResult = await listDomains()
  if (!listResult.ok) return false

  return listResult.data.length >= 1
}

async function showCapBlockedScreen(): Promise<void> {
  clearAndBanner()
  console.log('\n  ➕ Create new domain\n')
  console.log('  ' + warn('Free version is limited to 1 domain. Activate a license to create more.') + '\n')

  let action: 'activate' | 'back'
  try {
    action = await select<'activate' | 'back'>({
      message: 'Choose an action',
      choices: [
        { name: '🔑 Activate License', value: 'activate' },
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }

  if (action === 'activate') {
    await router.showActivateLicense()
    return
  }
}

export async function showCreateDomainScreen(): Promise<void> {
  if (await isCapBlocked()) {
    await showCapBlockedScreen()
    return
  }

  clearAndBanner()
  try {
    // ... EXISTING body unchanged: promptForUniqueDomainSlug → difficulty → Save/Back → writeDomain → success ...
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }
}
```

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---|---|---|
| Entry-guard short-circuit before main flow | Provider-setup guard in startup | `src/index.ts`, `src/screens/provider-setup.ts` |
| `readSettings` + `defaultSettings` fallback | Settings screen, License Info screen | `src/screens/settings.ts`, `src/screens/license-info.ts` (Story 14.6) |
| `listDomains` for whole-folder enumeration | Home screen, archived screen | `src/screens/home.ts`, `src/screens/archived.ts` |
| Dispatching to a router action and returning | Home screen action dispatch | `src/screens/home.ts` (Story 14.4) |
| Soft-warn line above an action prompt | Free-tier guidance | `src/screens/*.ts` |
| ExitPromptError silent return | Bottom of `showCreateDomainScreen` today | `src/screens/create-domain.ts` line 105 |

### Anti-Patterns to Avoid

- ❌ Do NOT retroactively block reading, archiving, deleting, playing, or any non-creation operation on over-cap domains — only the creation entry is gated (AC #7).
- ❌ Do NOT delete or archive a user's domain automatically when a license is deactivated — local data stays untouched.
- ❌ Do NOT count `settings.json` or `.tmp-*` files toward the cap — `listDomains` already excludes these; don't reintroduce the bug.
- ❌ Do NOT block on `listDomains` failure — fail-open (AC #9).
- ❌ Do NOT loop the upsell after `Activate License` returns — single-shot; the home loop is the retry path (AC #4).
- ❌ Do NOT render the create-domain name input or difficulty prompt in the upsell variant — those belong to the standard flow only.
- ❌ Do NOT add `back-to-home` navigation logic — `return` from the screen suffices; the caller (home loop) handles re-render.
- ❌ Do NOT introduce a new domain-count helper outside this module unless a second caller emerges. `isCapBlocked` is local to create-domain.ts.
- ❌ Do NOT trust `listResult.data.length` if `listResult.ok === false` — short-circuit fail-open BEFORE reading `.data`.
- ❌ Do NOT treat `corrupted: true` entries as "not a domain" for cap purposes — they still occupy a slot (intentional, documented in AC #10).
- ❌ Do NOT call `isCapBlocked` from any other screen — it is exported ONLY for unit testability. Future cap checks elsewhere (e.g., domain duplication, bulk import) belong in a dedicated `domain/license-cap.ts` module to keep the cap contract single-sourced. Adding callers here would leak licensing policy into unrelated screens.

### Previous Story Learnings

- **From Story 14.1:** `settings.license` is `LicenseRecord | undefined`. `settings.license?.status === 'active'` is the canonical licensed check.
- **From Story 14.3:** `readSettings` returns `Result<SettingsFile, string>` with `defaultSettings()` fallback on parse error. Same convention here.
- **From Story 14.4:** Inactive license is treated as free-tier from a feature-gating perspective. AC #7 of THIS story reaffirms.
- **From Story 14.5:** Activate License is the user's path to lift the cap. `router.showActivateLicense()` is a stable callable (re-wired to the real screen in 14.5).
- **From Story 14.6:** Deactivation deletes the `license` sub-object entirely; the next `isCapBlocked()` call sees `settings.license === undefined` and treats the user as free-tier (cap applies).
- **From `listDomains` source:** Active + archived + corrupted are ALL in the same returned array; `settings.json` and `.tmp-*` are excluded. Single-source-of-truth for the cap denominator.

### Project Structure Notes

**Modified files (this story only):**
- `src/screens/create-domain.ts` — add `isCapBlocked` + `showCapBlockedScreen` helpers; gate `showCreateDomainScreen` entry; add `readSettings`, `defaultSettings`, `router` namespace imports
- `src/screens/create-domain.test.ts` — add `domain cap enforcement` describe block with ~11 new tests

**New files:** none. This story is a surgical addition to an existing screen.

**Files NOT touched:**
- `src/domain/schema.ts` (no schema changes)
- `src/domain/store.ts` (no persistence-layer changes)
- `src/domain/license-client.ts` (no client changes)
- `src/domain/license-launch.ts` (unrelated)
- `src/screens/home.ts`, `activate-license.ts`, `license-info.ts` (already wired)
- `src/router.ts` (no router changes — `router.showActivateLicense` already exists)
- Any other domain sub-menu screen (`domain-menu.ts`, `archived.ts`, etc.) — existing over-cap domains remain fully operational
- `package.json` (no new dependencies)

### References

- [Source: docs/planning-artifacts/prd.md#FR2 — Create new domain](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/prd.md#FR53 — Free tier cap](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.7: Domain Cap Enforcement at Create Domain](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture — Cap Enforcement](../planning-artifacts/architecture.md)
- [Implementation reference: src/screens/create-domain.ts — existing flow](../../src/screens/create-domain.ts)
- [Implementation reference: src/domain/store.ts#listDomains — counting semantics](../../src/domain/store.ts)

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

- 2026-05-16: Story file created via bmad-create-story workflow — final story in Epic 14. Verified `listDomains` counting semantics include archived + corrupted; fail-open posture documented for FS errors.
