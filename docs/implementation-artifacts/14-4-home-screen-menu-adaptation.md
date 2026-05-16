# Story 14.4: Home Screen Menu Adaptation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the home screen menu to reflect my current license state — showing Activate License when I'm on the free tier and License Info plus a hidden Coffee action when I have an active license,
So that the menu only surfaces actions that are relevant to my current tier.

## Acceptance Criteria

1. **Given** `settings.json` has no `license` sub-object (or `license.status === "inactive"`) **When** the home screen renders **Then** the menu shows in order: domain entries, separator, `➕ Create new domain`, `🗄  Archived domains`, `⚙️  Settings`, separator, `🔑 Activate License`, `🍵 Buy me a coffee`, `🚪 Exit`

2. **Given** `settings.json` has `license.status === "active"` **When** the home screen renders **Then** the menu shows in order: domain entries, separator, `➕ Create new domain`, `🗄  Archived domains`, `⚙️  Settings`, separator, `🔑 License Info`, `🚪 Exit` — the `🍵 Buy me a coffee` choice is omitted ENTIRELY (not just hidden behind a flag — the choice array does not contain it)

3. **Given** I am on the home screen with `license.status === "active"` **When** I select `🔑 License Info` **Then** `router.showLicenseInfo()` is invoked and on return the home loop continues to its next iteration

4. **Given** I am on the home screen with no active license (free tier) **When** I select `🔑 Activate License` **Then** `router.showActivateLicense()` is invoked and on return the home loop continues to its next iteration

5. **Given** I have just completed a successful activation and `router.showActivateLicense()` returned **When** the home screen re-renders (next iteration of the `while (true)` loop) **Then** `readSettings()` is called fresh on every iteration and the menu reflects the new state immediately — `License Info` is shown, `Buy me a coffee` is hidden — no app restart required

6. **Given** I have just completed a successful deactivation and `router.showLicenseInfo()` returned **When** the home screen re-renders **Then** the menu reflects the new state immediately — `Activate License` is shown, `Buy me a coffee` is shown again

7. **Given** `license.status === "inactive"` (revoked license cached in settings) **When** the home screen renders **Then** the menu behaves IDENTICALLY to the free-tier case (Activate License + Coffee both shown) — the inactive state is treated as free tier from a menu perspective

8. **Given** `router.ts` is updated **When** I inspect it **Then** two new exported async functions exist: `showActivateLicense(): Promise<void>` and `showLicenseInfo(): Promise<void>`. For THIS story, both are STUB implementations that print a placeholder line (e.g., `console.log('Activate License screen — coming in Story 14.5')`), await a single `Continue` prompt, and return. Stories 14.5 and 14.6 will replace the bodies with real screens — but the exported signatures and the home-screen wiring land here so 14.4 is independently testable and 14.5/14.6 only edit the function bodies

9. **Given** the home screen and router are updated **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests cover: `buildHomeChoices` with `hasActiveLicense: false` produces the free-tier menu order including Activate License + Coffee; `buildHomeChoices` with `hasActiveLicense: true` produces the licensed menu without Coffee, with License Info in place of Activate License; menu re-renders after returning from Activate License or License Info (settings re-read each loop iteration); `handleHomeAction` dispatches `'activateLicense'` to `router.showActivateLicense()` and `'licenseInfo'` to `router.showLicenseInfo()`; `inactive` license status renders the free-tier menu (AC #7)

## Tasks / Subtasks

- [ ] **Task 1: Extend `HomeAction` discriminated union** (AC: #3, #4, #8)
  - [ ] 1.1 In `src/screens/home.ts`, add two new variants to `HomeAction`: `| { action: 'activateLicense' }` and `| { action: 'licenseInfo' }`
  - [ ] 1.2 Keep existing variants (`select | create | archived | settings | coffee | exit`) unchanged

- [ ] **Task 2: Extend `buildHomeChoices` to take license state** (AC: #1, #2, #7)
  - [ ] 2.1 Change signature from `buildHomeChoices(entries: HomeEntry[])` to `buildHomeChoices(entries: HomeEntry[], opts: { hasActiveLicense: boolean })`
  - [ ] 2.2 Determine `hasActiveLicense` semantically (caller's responsibility): `settings.license?.status === 'active'` → `true`; `undefined` license OR `status === 'inactive'` → `false`
  - [ ] 2.3 In the function body, after the existing `Settings` choice and the separator, branch on `opts.hasActiveLicense`:
    - **`false` (free tier / inactive):** push `{ name: '🔑 Activate License', value: { action: 'activateLicense' } }` and `{ name: '🍵 Buy me a coffee', value: { action: 'coffee' } }`
    - **`true` (active):** push `{ name: '🔑 License Info', value: { action: 'licenseInfo' } }` only — DO NOT push the Coffee choice
  - [ ] 2.4 Push `{ name: '🚪 Exit', value: { action: 'exit' } }` at the end in both cases
  - [ ] 2.5 Preserve existing menu prefix (domain entries, separator, Create / Archived / Settings, separator) — those are tier-independent
  - [ ] 2.6 Note on iconography: epic prose shows `☕` for Coffee; the EXISTING code uses `🍵`. Preserve the existing `🍵` icon to avoid an unrelated visual diff. Treat the epic's `☕` as a typo

- [ ] **Task 3: Dispatch new actions in `handleHomeAction`** (AC: #3, #4)
  - [ ] 3.1 In `src/screens/home.ts`, add two new branches inside `handleHomeAction`:
    - `if (answer.action === 'activateLicense') await router.showActivateLicense()`
    - `if (answer.action === 'licenseInfo') await router.showLicenseInfo()`
  - [ ] 3.2 No state mutation in the handler — settings re-read on next loop iteration (Task 4) handles state refresh after these screens return

- [ ] **Task 4: Read settings every iteration in `showHomeScreen`** (AC: #5, #6, #7)
  - [ ] 4.0 Verify imports at the top of `src/screens/home.ts`: ensure `readSettings` is imported from `'../domain/store.js'` and `defaultSettings` is imported from `'../domain/schema.js'`. Add either import if missing (existing exit-branch settings handling may route through `router.ts`, not direct in home.ts)
  - [ ] 4.1 Inside the `while (true)` loop, at the top (after `clearAndBanner()` and before / alongside `listDomains()`), add `const settingsResult = await readSettings()` and `const settings = settingsResult.ok ? settingsResult.data : defaultSettings()`
  - [ ] 4.2 Derive `const hasActiveLicense = settings.license?.status === 'active'`
  - [ ] 4.3 Pass `{ hasActiveLicense }` as the second argument to `buildHomeChoices(homeEntries, { hasActiveLicense })`
  - [ ] 4.4 Verify: after the user selects Activate License (free tier) → returns from `router.showActivateLicense()` → loop iterates → `readSettings()` re-reads the freshly-written license → next render shows License Info. Same flow for deactivation
  - [ ] 4.5 Performance note: `readSettings()` is a single small file read (~0.5 KB JSON); doing it once per home iteration is negligible. Do NOT cache settings across iterations — caching would break ACs #5 and #6

- [ ] **Task 5: Add `showActivateLicense` + `showLicenseInfo` STUB routes to `router.ts`** (AC: #8)
  - [ ] 5.1 Add `export async function showActivateLicense(): Promise<void>` that calls `clearAndBanner()` (or `clearScreen()`), prints `console.log('🔑 Activate License — coming in Story 14.5')`, awaits an inquirer `select` with a single `Continue` choice (so the user has time to read the placeholder), then returns
  - [ ] 5.2 Add `export async function showLicenseInfo(): Promise<void>` with the same shape but printing `'🔑 License Info — coming in Story 14.6'`
  - [ ] 5.3 Both stubs MUST handle `ExitPromptError` the same way other screens do (catch and re-throw or exit) so Ctrl+C works cleanly
  - [ ] 5.4 Document in code comments next to each stub: `// STUB — replaced by screens/activate-license.ts in Story 14.5` / `// STUB — replaced by screens/license-info.ts in Story 14.6` so the dev agents working on 14.5 / 14.6 find them immediately
  - [ ] 5.5 Do NOT import from `screens/activate-license.ts` or `screens/license-info.ts` yet — those modules don't exist. The stubs are self-contained inside `router.ts`. Stories 14.5 / 14.6 will add the screen modules and replace the stub bodies with `await showActivateLicenseScreen()` / `await showLicenseInfoScreen()` calls

- [ ] **Task 6: Update home screen tests** (AC: #1, #2, #5, #6, #7, #9)
  - [ ] 6.1 Find existing tests for `buildHomeChoices` in `src/screens/home.test.ts` (or equivalent location — check file existence and follow the established pattern). Update existing call sites to pass `{ hasActiveLicense: false }` so they continue testing the free-tier menu (which is the current behaviour)
  - [ ] 6.2 Add test: `buildHomeChoices([], { hasActiveLicense: false })` returns choices whose values, in order, are `create`, `archived`, `settings`, `activateLicense`, `coffee`, `exit` (extracting `value.action` from non-Separator entries)
  - [ ] 6.3 Add test: `buildHomeChoices([], { hasActiveLicense: true })` returns choices whose values, in order, are `create`, `archived`, `settings`, `licenseInfo`, `exit` — and assert that NO entry has `value.action === 'coffee'`
  - [ ] 6.4 Add test: `buildHomeChoices([sampleEntry], { hasActiveLicense: true })` still shows domain entries first, then the standard menu without Coffee
  - [ ] 6.5 Add `handleHomeAction` dispatch tests (mocking `router.showActivateLicense` / `router.showLicenseInfo`): asserting `'activateLicense'` action invokes `router.showActivateLicense` exactly once; same for `'licenseInfo'`
  - [ ] 6.6 Add a loop-rerender test: stub `readSettings` to return free-tier settings on first call and active-license settings on second call; drive two iterations of `showHomeScreen` (mock the `select` prompt to return `activateLicense` first, then `exit`); verify the second iteration's `buildHomeChoices` was invoked with `{ hasActiveLicense: true }`. If this is too heavy to test against inquirer directly, settle for: extract a small helper that derives `hasActiveLicense` from settings and test that in isolation; the dispatch + read-every-iteration behaviour is already covered by Tasks 6.2–6.5

- [ ] **Task 7: Update router tests** (AC: #8)
  - [ ] 7.1 If `src/router.test.ts` exists, add tests that `router.showActivateLicense` and `router.showLicenseInfo` are exported functions returning `Promise<void>` (a minimal export-shape assertion is sufficient — the stub bodies are placeholders and 14.5/14.6 will add real tests)
  - [ ] 7.2 Alternatively: skip dedicated router tests; the dispatch tests in Task 6.5 already cover the router invocation contract

- [ ] **Task 8: Verify boundaries** (AC: #8 + architecture compliance)
  - [ ] 8.1 `grep -n "showActivateLicense\|showLicenseInfo" src/` — should match exactly: `src/router.ts` (declarations) and `src/screens/home.ts` (dispatch sites), plus their `.test.ts` files
  - [ ] 8.2 Confirm no new imports of `screens/activate-license.js` or `screens/license-info.js` are added in this story
  - [ ] 8.3 Run `npm test` — baseline after 14.1+14.2+14.3 should be ~1131 tests; this story adds ~6–8 new tests
  - [ ] 8.4 Run `npm run typecheck` — confirm no TS errors from the `HomeAction` union widening (every consumer must handle the new variants — `handleHomeAction` is the only consumer and is updated in Task 3)

## Dev Notes

### Architecture Requirements

- **Pure menu builder + side-effecting loop**: `buildHomeChoices` stays pure; `showHomeScreen` owns the I/O (settings read + dispatch). The license-state input flows IN as an argument, never read inside `buildHomeChoices`. This matches the existing pattern.
- **Settings re-read every iteration**: Already established by `handleHomeAction`'s `exit` branch (which reads settings to decide whether to show the exit screen). This story extends the read to every iteration to refresh license state after activate/deactivate.
- **No persistence in this story**: The home screen is read-only with respect to settings. Activation writes are owned by Story 14.5; deactivation writes by Story 14.6.
- **Coffee hidden, not just disabled**: Per architecture, the Coffee choice is OMITTED from the choice array entirely when license is active — not greyed out, not separated, not labelled "disabled". The user never sees the line. This is the literal interpretation of "conditional Coffee action hidden when license active" in the architecture's nav flow diagram.
- **Stub routes ship in this story**: `router.showActivateLicense` and `router.showLicenseInfo` are added as stubs HERE so 14.4 is independently testable and mergeable. Stories 14.5 and 14.6 replace the stub bodies. This avoids a circular dependency where 14.4 cannot ship without 14.5/14.6.
- **Stubs are user-visible during development**: A user running the app between 14.4 merge and 14.5 merge will see "🔑 Activate License — coming in Story 14.5" placeholder. Acceptable trade-off for keeping stories independently shippable. The placeholders are removed in 14.5/14.6 commits.
- **`inactive` == free tier semantically**: From the menu's perspective, an inactive cached license is exactly the same as no license. The user must re-activate (Activate License screen) to get back to active. AC #7 codifies this.
- **No coupling to launch-validation notice**: This story does NOT read `consumeLaunchNotice` — that's Story 14.3's wiring already in place. Re-rendering the menu with a fresh `settings.license.status` after a revoke is automatic because `readSettings()` is called per iteration.
- **ESM imports**: `.js` extensions on all internal imports.
- **UX scope: TWO MENU ITEMS, ONE BRANCH** — change the choice array based on a boolean. No new screens, no new prompts, no new flows (beyond the placeholder stubs).

> **Implementation order dependency:** Story 14.3 modifies `showHomeScreen`'s loop body to render the launch-validation banner. THIS story (14.4) also modifies the SAME loop body to add per-iteration settings reads. Implement 14.3 BEFORE 14.4 to avoid a merge conflict in `src/screens/home.ts`. If 14.4 is implemented first by mistake, the 14.3 dev agent must manually integrate the banner-render block above the new settings-read block.

[Source: docs/planning-artifacts/architecture.md#License Activation Architecture (L536+)]
[Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture — Navigation Pattern (Level 1 Home menu)]
[Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR54)]
[Source: docs/planning-artifacts/epics.md#Story 14.4: Home Screen Menu Adaptation]

### Key Implementation Details

**`buildHomeChoices` signature update:**

```typescript
export function buildHomeChoices(
  entries: HomeEntry[],
  opts: { hasActiveLicense: boolean },
): Array<{ name: string; value: HomeAction } | Separator> {
  const choices: Array<{ name: string; value: HomeAction } | Separator> = []
  // ... existing domain-entry block unchanged ...
  // ... existing separator block unchanged ...
  choices.push(
    { name: '➕ Create new domain', value: { action: 'create' } },
    { name: '🗄  Archived domains', value: { action: 'archived' } },
    { name: '⚙️  Settings', value: { action: 'settings' } },
    new Separator(),
  )
  if (opts.hasActiveLicense) {
    choices.push({ name: '🔑 License Info', value: { action: 'licenseInfo' } })
  } else {
    choices.push(
      { name: '🔑 Activate License', value: { action: 'activateLicense' } },
      { name: '🍵 Buy me a coffee', value: { action: 'coffee' } },
    )
  }
  choices.push({ name: '🚪 Exit', value: { action: 'exit' } })
  return choices
}
```

**`HomeAction` widening:**

```typescript
export type HomeAction =
  | { action: 'select'; slug: string }
  | { action: 'create' }
  | { action: 'archived' }
  | { action: 'settings' }
  | { action: 'coffee' }
  | { action: 'activateLicense' }   // ← NEW
  | { action: 'licenseInfo' }       // ← NEW
  | { action: 'exit' }
```

**`showHomeScreen` loop addition:**

```typescript
export async function showHomeScreen(): Promise<void> {
  while (true) {
    clearAndBanner()
    const settingsResult = await readSettings()
    const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
    const hasActiveLicense = settings.license?.status === 'active'

    const listResult = await listDomains()
    const homeEntries = await loadDomainEntries(listResult, { archived: false })

    let answer: HomeAction
    try {
      answer = await select<HomeAction>({
        message: '👨‍💻 Choose a domain:',
        choices: buildHomeChoices(homeEntries, { hasActiveLicense }),
        pageSize: 20,
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) process.exit(0)
      throw err
    }

    await handleHomeAction(answer, homeEntries, listResult)
  }
}
```

**`handleHomeAction` dispatch additions:**

```typescript
if (answer.action === 'activateLicense') await router.showActivateLicense()
if (answer.action === 'licenseInfo') await router.showLicenseInfo()
```

**Router stub additions (`src/router.ts`):**

```typescript
// STUB — replaced by screens/activate-license.ts in Story 14.5
export async function showActivateLicense(): Promise<void> {
  clearAndBanner()
  console.log('\n  🔑 Activate License — coming in Story 14.5\n')
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }
}

// STUB — replaced by screens/license-info.ts in Story 14.6
export async function showLicenseInfo(): Promise<void> {
  clearAndBanner()
  console.log('\n  🔑 License Info — coming in Story 14.6\n')
  try {
    await select({
      message: 'Navigation',
      choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }
}
```

> **Note on `clearAndBanner` import in `router.ts`:** check whether `router.ts` already imports `clearAndBanner` / `clearScreen`. If not, add the import for the two stubs. The existing `showCoffeeScreen` in `home.ts` uses `clearAndBanner`; the same helper is available for the stubs.

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---|---|---|
| Pure menu builder taking entries + opts | `buildHomeChoices(entries: HomeEntry[])` today | `src/screens/home.ts` |
| Discriminated `HomeAction` union | Existing 6 variants | `src/screens/home.ts` |
| `readSettings()` + fallback to `defaultSettings()` | Used in `handleHomeAction` exit branch and many screens | `src/screens/home.ts`, `src/router.ts` |
| Router function returning `Promise<void>` | All current `show*` routes | `src/router.ts` |
| `select` with Continue/Back choice | `showCoffeeScreen` | `src/screens/home.ts` |
| `ExitPromptError` handling | Every screen with an inquirer prompt | `src/screens/*.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT read `settings.license` inside `buildHomeChoices` — keep the function pure. The license state must arrive as the `opts.hasActiveLicense` argument.
- ❌ Do NOT cache settings across home loop iterations — that would break ACs #5/#6 (state refresh after activate/deactivate).
- ❌ Do NOT add a "disabled" or "greyed-out" Coffee variant — omit the choice entirely when licensed (architecture mandate).
- ❌ Do NOT import from `screens/activate-license.js` or `screens/license-info.js` in this story — those files don't exist yet (they ship in 14.5 / 14.6). The router stubs are self-contained.
- ❌ Do NOT skip the `STUB` comment markers — they are the breadcrumb 14.5 / 14.6 dev agents follow to find the replacement target.
- ❌ Do NOT change the existing menu prefix (Create / Archived / Settings) or domain-entry rendering — this story is additive at the END of the menu only.
- ❌ Do NOT consume `consumeLaunchNotice` here — that's already wired by Story 14.3.
- ❌ Do NOT treat `license === undefined` and `license.status === "inactive"` differently in the menu — both produce the free-tier menu (AC #7).
- ❌ Do NOT add a new `router.ts` export for "back to home" — the home loop naturally re-renders on return from any sub-route.
- ❌ Do NOT log or render the license `key` field anywhere on the home screen — masking is the License Info screen's concern (Story 14.6); the home menu has no key display.

### Previous Story Learnings

- **From Story 14.1:** `settings.license` is `LicenseRecord | undefined`. `settings.license?.status` safely yields `'active' | 'inactive' | undefined`. The `=== 'active'` comparison is the canonical "is licensed" check.
- **From Story 14.2:** No HTTP calls happen here — this story is pure UI logic plus reading existing settings.
- **From Story 14.3:** Launch validation flips `license.status` to `'inactive'` (or leaves `'active'` on offline grace). The home menu reads whatever state is in settings.json on each iteration; AC #7 ensures `'inactive'` behaves as free tier so revoked-license users see the Activate License action without an app restart.
- **From multi-provider tests (Feature 7):** Pure-function menu builders are heavily unit-tested in this repo. Follow `buildHomeChoices` / `buildSettingsChoices` patterns for the new tests.
- **From Story 10.x (Bookmarks):** Adding new `HomeAction` variants is a familiar operation. TypeScript's exhaustive-switch warning on the union will flag any consumer that forgets to handle the new variants — use this as a sanity check (`npm run typecheck`).

### Project Structure Notes

**Modified files (this story only):**
- `src/screens/home.ts` — extend `HomeAction`, extend `buildHomeChoices` signature, read settings in loop, dispatch new actions
- `src/screens/home.test.ts` (or wherever `buildHomeChoices` is tested — verify location) — add 4–6 new tests; update existing test call sites to pass `{ hasActiveLicense: false }`
- `src/router.ts` — add `showActivateLicense` and `showLicenseInfo` stub exports
- `src/router.test.ts` (if exists) — minimal export-shape assertions for the two new stubs (optional)

**New files:** none. This story is a surgical menu adaptation; no new modules.

**Files NOT touched in this story:**
- `src/domain/schema.ts` (no schema changes)
- `src/domain/store.ts` (no persistence changes)
- `src/domain/license-client.ts` (no HTTP calls)
- `src/domain/license-launch.ts` (no orchestrator changes)
- `src/index.ts` (already wired by 14.3)
- `src/screens/activate-license.ts` (Story 14.5 — new)
- `src/screens/license-info.ts` (Story 14.6 — new)
- `src/screens/create-domain.ts` (Story 14.7)
- `package.json` (no new dependencies)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR54)](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.4: Home Screen Menu Adaptation](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture — conditional menu branching](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#Terminal UI Architecture — Navigation Pattern](../planning-artifacts/architecture.md)

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

- 2026-05-16: Story file created via bmad-create-story workflow — comprehensive context engine analysis completed.
