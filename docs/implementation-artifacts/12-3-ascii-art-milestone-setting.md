# Story 12.3: ASCII Art Milestone Setting

Status: done

## Story

As a user,
I want to configure the ASCII Art unlock milestone in Settings with three options — Instant (0 questions), Quick (10 questions), and Classic (100 questions),
So that I can choose how much effort is required to unlock ASCII Art for each domain.

## Acceptance Criteria

1. The Settings screen displays a `🎨 ASCII Art Milestone` selector before the `🎬 Welcome & Exit screen` toggle, showing the currently active option name (Instant / Quick / Classic)
2. Selecting the ASCII Art Milestone setting opens a selector with three options: `Instant (0 questions)`, `Quick (10 questions)`, `Classic (100 questions)` — the current value is pre-selected
3. Selecting `Classic (100 questions)` (the default) stores `asciiArtMilestone` as `100` in `settings.json`
4. Selecting `Instant (0 questions)` stores `asciiArtMilestone` as `0` and ASCII Art is immediately unlocked for all domains (label shows `🎨 ASCII Art ✨`)
5. Selecting `Quick (10 questions)` stores `asciiArtMilestone` as `10` and ASCII Art requires 10 correct answers to unlock
6. The setting is retroactive: changing the threshold immediately affects all domains — domains that already meet the new threshold unlock, domains that no longer meet it re-lock
7. The locked ASCII Art screen motivational message dynamically reflects the configured threshold (e.g., "🔒 ASCII Art unlocks when you've answered 10 questions correctly!" — not hardcoded to 100)
8. When `asciiArtMilestone` is `0` (Instant), domains bypass the locked screen entirely and show FIGlet art immediately
9. When `asciiArtMilestone` is missing from `settings.json` (existing users upgrading), the schema applies the default value of `100` — existing behavior is preserved
10. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Add `asciiArtMilestone` field to `SettingsFileSchema` and `defaultSettings()` in `src/domain/schema.ts` (AC: #3, #9)
  - [x] Add `asciiArtMilestone` field to `SettingsFileSchema`: `z.union([z.literal(0), z.literal(10), z.literal(100)]).default(100)`
  - [x] Add `asciiArtMilestone: 100` to the `defaultSettings()` return object, positioned before `showWelcome`
  - [x] Verify `SettingsFile` type infers correctly (no manual change needed — `z.infer` auto-updates)

- [x] Task 2: Write tests for schema changes in `src/domain/schema.test.ts` (AC: #3, #9, #10)
  - [x] Test `SettingsFileSchema` accepts `asciiArtMilestone: 0` — parses successfully
  - [x] Test `SettingsFileSchema` accepts `asciiArtMilestone: 10` — parses successfully
  - [x] Test `SettingsFileSchema` accepts `asciiArtMilestone: 100` — parses successfully
  - [x] Test `SettingsFileSchema` rejects invalid values (e.g., `50`, `-1`, `"instant"`) — parse fails
  - [x] Test `SettingsFileSchema` applies default `100` when `asciiArtMilestone` is omitted (existing users upgrading)
  - [x] Test `defaultSettings()` returns `asciiArtMilestone: 100`

- [x] Task 3: Add ASCII Art Milestone selector to Settings screen in `src/screens/settings.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Add `'asciiArtMilestone'` to `SettingsAction` type union: `'provider' | 'language' | 'tone' | 'asciiArtMilestone' | 'showWelcome' | 'save' | 'back'`
  - [x] Add `MILESTONE_CHOICES` constant array: `[{ name: 'Instant (0 questions)', value: 0 }, { name: 'Quick (10 questions)', value: 10 }, { name: 'Classic (100 questions)', value: 100 }]`
  - [x] Add `MILESTONE_LABELS` map: `{ 0: 'Instant', 10: 'Quick', 100: 'Classic' }` (for display in menu)
  - [x] Add `asciiArtMilestone` parameter to `selectSettingsAction()` — append after `showWelcome` param
  - [x] Insert `🎨 ASCII Art Milestone: ${MILESTONE_LABELS[asciiArtMilestone]}` choice with value `'asciiArtMilestone'` **before** the `🎬 Welcome & Exit screen` choice in the choices array
  - [x] In `showSettingsScreen()`, add `let asciiArtMilestone = currentSettings.asciiArtMilestone` (alongside existing `let showWelcome = ...`)
  - [x] Pass `asciiArtMilestone` to `selectSettingsAction()` call
  - [x] Add `case 'asciiArtMilestone':` handler in the switch statement — use `select()` with `MILESTONE_CHOICES` and `menuTheme`, set `banner` to success message with new label
  - [x] Include `asciiArtMilestone` in the save spread object: `{ ...currentSettings, ..., asciiArtMilestone, showWelcome }`

- [x] Task 4: Write tests for Settings screen milestone selector in `src/screens/settings.test.ts` (AC: #1, #2, #10)
  - [x] Test that `selectSettingsAction` renders `🎨 ASCII Art Milestone: Classic` when `asciiArtMilestone` is `100`
  - [x] Test that `selectSettingsAction` renders `🎨 ASCII Art Milestone: Instant` when `asciiArtMilestone` is `0`
  - [x] Test that selecting `asciiArtMilestone` action triggers milestone selector prompt
  - [x] Test that saving settings includes `asciiArtMilestone` in the written settings object
  - [x] Test that the ASCII Art Milestone choice appears before the Welcome & Exit screen choice in the menu order

- [x] Task 5: Replace hardcoded `UNLOCK_THRESHOLD` with dynamic threshold in `src/screens/ascii-art.ts` (AC: #6, #7, #8)
  - [x] Remove the exported `UNLOCK_THRESHOLD = 100` constant
  - [x] Update `renderCompactProgressLabel(correctCount)` signature to `renderCompactProgressLabel(correctCount: number, threshold: number)` — replace `UNLOCK_THRESHOLD` references with `threshold` parameter
  - [x] Update `showAsciiArtScreen(slug, correctCount)` signature to `showAsciiArtScreen(slug: string, correctCount: number, threshold: number)`
  - [x] Replace the hardcoded `'100'` in the locked screen message with the dynamic `threshold` value: `` `🔒 ASCII Art unlocks when you've answered ${threshold} questions correctly!` ``
  - [x] Replace all `UNLOCK_THRESHOLD` references in the function with `threshold`
  - [x] When `threshold === 0`: skip the locked screen entirely — go straight to the FIGlet rendering (AC: #8)

- [x] Task 6: Update `src/screens/domain-menu.ts` to use dynamic threshold (AC: #6)
  - [x] Remove `UNLOCK_THRESHOLD` import from `./ascii-art.js`
  - [x] Update `buildDomainMenuChoices(correctCount)` signature to `buildDomainMenuChoices(correctCount: number, threshold: number)`
  - [x] Replace `correctCount >= UNLOCK_THRESHOLD` with `threshold === 0 || correctCount >= threshold`
  - [x] Pass `threshold` to `renderCompactProgressLabel(correctCount, threshold)`
  - [x] Update `promptForDomainAction()` signature to accept `threshold`, pass to `buildDomainMenuChoices()`
  - [x] In `showDomainMenuScreen()`: read settings to obtain `asciiArtMilestone`, pass as `threshold` through the call chain
  - [x] Import `readSettings` from `../domain/store.js` and `defaultSettings` from `../domain/schema.js`
  - [x] Update `handleDomainAction()` to pass `threshold` to `router.showAsciiArt(slug, correctCount, threshold)`

- [x] Task 7: Update `src/router.ts` to pass threshold (AC: #6)
  - [x] Update `showAsciiArt(slug, correctCount)` signature to `showAsciiArt(slug: string, correctCount: number, threshold: number)`
  - [x] Pass `threshold` through to `showAsciiArtScreen(slug, correctCount, threshold)`

- [x] Task 8: Write tests for dynamic threshold in `src/screens/ascii-art.test.ts` (AC: #6, #7, #8, #10)
  - [x] Test `renderCompactProgressLabel(5, 10)` — Quick threshold, 50% progress
  - [x] Test `renderCompactProgressLabel(50, 100)` — Classic threshold, 50% progress
  - [x] Test `renderCompactProgressLabel(0, 0)` — Instant threshold, edge case (no progress bar shown since always unlocked)
  - [x] Test `showAsciiArtScreen(slug, 0, 0)` — Instant threshold bypasses locked screen, renders FIGlet art
  - [x] Test `showAsciiArtScreen(slug, 5, 10)` — Quick threshold locked at 5/10 shows "answered 10 questions"
  - [x] Test `showAsciiArtScreen(slug, 50, 100)` — Classic threshold locked shows "answered 100 questions"
  - [x] Test `showAsciiArtScreen(slug, 10, 10)` — exactly at threshold, unlocked, shows FIGlet art
  - [x] Update existing `renderProgressBar` tests to use threshold parameter where needed
  - [x] Update existing `renderCompactProgressLabel` tests to pass threshold parameter

- [x] Task 9: Write tests for domain-menu threshold integration in `src/screens/domain-menu.test.ts` (AC: #6, #10)
  - [x] Test `buildDomainMenuChoices(50, 100)` — Classic, locked, shows progress bar label
  - [x] Test `buildDomainMenuChoices(100, 100)` — Classic, unlocked, shows sparkle label
  - [x] Test `buildDomainMenuChoices(5, 10)` — Quick, locked, shows progress bar label
  - [x] Test `buildDomainMenuChoices(10, 10)` — Quick, unlocked, shows sparkle label
  - [x] Test `buildDomainMenuChoices(0, 0)` — Instant, always unlocked, shows sparkle label
  - [x] Test `buildDomainMenuChoices(50, 0)` — Instant with history, still shows sparkle label
  - [x] Update existing `buildDomainMenuChoices` tests to pass threshold parameter

- [x] Task 10: Write tests for router threshold pass-through in `src/router.test.ts` (AC: #6, #10)
  - [x] Update existing `showAsciiArt` test to verify `threshold` is passed to `showAsciiArtScreen`

## Dev Notes

### Architecture Requirements

- **Settings schema**: `asciiArtMilestone` stores a number (`0 | 10 | 100`), not a string. Use `z.union([z.literal(0), z.literal(10), z.literal(100)])` with `.default(100)` — this ensures backward compatibility for existing `settings.json` files missing the field.
- **No domain schema changes**: The setting is global (in `settings.json`), not per-domain. The domain's `history` is filtered at runtime to compute `correctCount`, compared against the threshold from settings.
- **Persistence**: Settings use the atomic write-then-rename pattern via `writeSettings()` in `src/domain/store.ts`. No changes needed to read/write logic — Zod parse handles the new field automatically.
- **Retroactive behavior**: Changing the threshold does NOT mutate domain files. The next time the domain sub-menu renders, it reads the current threshold from settings and compares against the domain's correctCount — domains that now meet the threshold immediately show unlocked, and vice versa.

### Key Source Locations

| Component | File | Key Code |
|-----------|------|----------|
| Settings schema | `src/domain/schema.ts` (L118-128) | `SettingsFileSchema` — add `asciiArtMilestone` before `showWelcome` |
| Default settings | `src/domain/schema.ts` (L131-141) | `defaultSettings()` — add `asciiArtMilestone: 100` before `showWelcome: true` |
| Settings screen | `src/screens/settings.ts` (L26) | `SettingsAction` type — add `'asciiArtMilestone'` |
| Settings menu | `src/screens/settings.ts` (L98-115) | `selectSettingsAction()` — add milestone choice before Welcome toggle |
| Settings save | `src/screens/settings.ts` (L175-186) | Save spread — add `asciiArtMilestone` |
| Threshold constant | `src/screens/ascii-art.ts` (L8) | `UNLOCK_THRESHOLD = 100` — **REMOVE**, replace with `threshold` param |
| Progress label | `src/screens/ascii-art.ts` (L62-66) | `renderCompactProgressLabel()` — add `threshold` param |
| ASCII Art screen | `src/screens/ascii-art.ts` (L68-83) | `showAsciiArtScreen()` — add `threshold` param, dynamic message |
| Hardcoded "100" | `src/screens/ascii-art.ts` (L73) | `'answered 100 questions'` — replace with template literal using `threshold` |
| Domain menu import | `src/screens/domain-menu.ts` (L11) | `UNLOCK_THRESHOLD` import — **REMOVE** |
| Menu choices | `src/screens/domain-menu.ts` (L30-44) | `buildDomainMenuChoices()` — add `threshold` param |
| Domain menu flow | `src/screens/domain-menu.ts` (L184-227) | `showDomainMenuScreen()` — read settings, pass threshold |
| Router | `src/router.ts` (L95-97) | `showAsciiArt()` — add `threshold` param, pass through |

### Previous Story Learnings (from Story 12.2)

- `lerpColor(t)` in `src/utils/format.ts` is the existing gradient interpolator — **reuse, do not recreate**
- `renderProgressBar` already has a division-by-zero guard: `total <= 0` returns 0 filled. When `threshold === 0`, the progress bar is never rendered (always unlocked), so this guard is sufficient.
- `renderCompactProgressLabel` caps percentage at 99% since 100% = unlocked state. This logic must now use the dynamic `threshold` instead of `UNLOCK_THRESHOLD`.
- Test pattern for ascii-art: mock `chalk` for deterministic color output in tests; mock `select` from `@inquirer/prompts` for user interaction.
- Settings test pattern: mock `readSettings`, `writeSettings` from `../domain/store.js`; use `defaultSettings()` as base for test data.
- Emoji spacing convention: all menu items use double-space after emoji for alignment (e.g., `🎨  ASCII Art`). However the existing code uses single space for some — follow existing pattern in each file.

### Anti-Patterns to Avoid

- **Do NOT** add `asciiArtMilestone` to the domain schema — it is a global setting only
- **Do NOT** cache the threshold — read it fresh from settings each time the domain menu renders (ensures retroactive behavior)
- **Do NOT** modify `renderProgressBar()` signature — it already accepts `total` as a parameter, which will be the threshold
- **Do NOT** break the existing `chalk.level < 3` fallback in `renderProgressBar`
- **Do NOT** assume `UNLOCK_THRESHOLD` is still exported after Task 5 — all consumers must use the dynamic threshold

### Testing Standards

- Framework: `vitest` — TypeScript-native, ESM-compatible
- Co-located test files: `*.test.ts` alongside source
- Run full suite: `npx vitest run`
- Current baseline: **918 tests passing, 0 failures**
- All new functionality must have unit tests covering success, failure, and edge cases
- Existing tests must be updated where signatures change (threshold parameter)

### References

- [PRD Feature 8 — Global Settings](docs/planning-artifacts/prd.md#feature-8)
- [PRD Feature 18 — ASCII Art Milestone Unlock](docs/planning-artifacts/prd.md#feature-18)
- [Architecture — Settings Schema](docs/planning-artifacts/architecture.md#global-settings-architecture)
- [Epics — Story 12.3](docs/planning-artifacts/epics.md#story-123-ascii-art-milestone-setting)
- [Story 12.2 — ASCII Art Milestone Unlock](docs/implementation-artifacts/12-2-ascii-art-milestone-unlock.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No halts or blockers encountered.

### Completion Notes List

- Task 1: Added `asciiArtMilestone: z.union([z.literal(0), z.literal(10), z.literal(100)]).default(100)` to `SettingsFileSchema` and `asciiArtMilestone: 100` to `defaultSettings()`, positioned before `showWelcome`. Updated existing roundtrip tests in `store.test.ts` and field enumeration test in `schema.test.ts` to include the new field.
- Task 2: Added 6 new schema tests — valid values (0, 10, 100), invalid value rejection (50, -1, "instant"), default behavior on omission, and `defaultSettings()` return value.
- Task 3: Added `MILESTONE_CHOICES`, `MILESTONE_LABELS`, expanded `SettingsAction` type with `'asciiArtMilestone'`, inserted milestone selector before Welcome toggle in `selectSettingsAction()`, added `case 'asciiArtMilestone'` handler in switch, included field in save spread.
- Task 4: Added 5 settings screen tests — label rendering for Classic/Instant, milestone selector trigger, save persistence, menu ordering.
- Task 5: Removed `UNLOCK_THRESHOLD` constant. Updated `renderCompactProgressLabel` and `showAsciiArtScreen` to accept `threshold` parameter. Made motivational message dynamic via template literal. Added `threshold === 0` bypass for Instant mode.
- Task 6: Removed `UNLOCK_THRESHOLD` import. Updated `buildDomainMenuChoices`, `promptForDomainAction`, `handleDomainAction` with `threshold` parameter. Added `readSettings`/`defaultSettings` imports. `showDomainMenuScreen` now reads settings fresh each loop iteration for retroactive behavior.
- Task 7: Updated `router.showAsciiArt` signature to pass `threshold` through to `showAsciiArtScreen`.
- Task 8: Updated all existing `renderCompactProgressLabel` tests with threshold param. Added 6 new tests: Quick/Classic progress labels, Instant bypass, Quick locked message, Classic locked message, exactly-at-threshold unlocked.
- Task 9: Updated all existing `buildDomainMenuChoices` tests with threshold param. Added 4 new tests: Quick locked/unlocked, Instant always unlocked (0 and 50 correct).
- Task 10: Updated router test to verify 3-arg pass-through (slug, correctCount, threshold).
- Code review follow-up: Added a zero-threshold guard in `renderCompactProgressLabel()` so accidental `renderCompactProgressLabel(0, 0)` calls return the unlocked sparkle label instead of emitting `NaN%`. Added a focused regression test for the helper edge case.

### File List

- `src/domain/schema.ts` — Added `asciiArtMilestone` field to `SettingsFileSchema` and `defaultSettings()`
- `src/domain/schema.test.ts` — Added 6 asciiArtMilestone tests, updated field enumeration test
- `src/domain/store.test.ts` — Updated 2 roundtrip test objects with `asciiArtMilestone: 100`
- `src/screens/settings.ts` — Added `MILESTONE_CHOICES`, `MILESTONE_LABELS`, `asciiArtMilestone` action, selector, and save
- `src/screens/settings.test.ts` — Added 5 milestone selector tests
- `src/screens/ascii-art.ts` — Removed `UNLOCK_THRESHOLD`, parameterized `renderCompactProgressLabel` and `showAsciiArtScreen` with `threshold`, dynamic message, Instant bypass, zero-threshold sparkle guard
- `src/screens/ascii-art.test.ts` — Updated all existing tests with threshold param, added 7 new threshold tests including zero-threshold helper regression coverage, removed `UNLOCK_THRESHOLD` test
- `src/screens/domain-menu.ts` — Removed `UNLOCK_THRESHOLD` import, added `readSettings`/`defaultSettings` imports, parameterized `buildDomainMenuChoices`/`promptForDomainAction`/`handleDomainAction` with threshold
- `src/screens/domain-menu.test.ts` — Updated mock and all existing tests, added 4 new threshold tests, added `readSettings` mock
- `src/router.ts` — Updated `showAsciiArt` signature with threshold pass-through
- `src/router.test.ts` — Updated `showAsciiArt` test with 3-arg verification
- `docs/implementation-artifacts/12-3-ascii-art-milestone-setting.md` — Updated post-review story status and recorded the review fix
- `docs/implementation-artifacts/sprint-status.yaml` — Synced story 12.3 from `review` to `done`

### Change Log

- 2026-04-04: Story 12.3 review fix applied — guarded `renderCompactProgressLabel(0, 0)` against `NaN%`, added regression coverage, and verified 939 total passing tests
