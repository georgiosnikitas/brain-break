# Story 6.4: Theme-Aware Gradient Colors

Status: done

## Story

As a user,
I want the gradient colors used in the Welcome Screen, Exit Message, Static Banner, and ASCII Art to adapt to my chosen theme,
So that gradient visuals remain readable and vibrant on both dark and light terminal backgrounds.

## Acceptance Criteria

1. **Given** `utils/format.ts` defines gradient start/end color constants
   **When** the Dark theme is active
   **Then** the gradient uses cyan `rgb(0, 180, 200)` → magenta `rgb(200, 0, 120)`

2. **Given** `utils/format.ts` defines gradient start/end color constants
   **When** the Light theme is active
   **Then** the gradient uses teal `rgb(0, 140, 160)` → magenta `rgb(180, 0, 100)` — darker endpoints for contrast against light backgrounds

3. **Given** the Welcome Screen renders its gradient ASCII art (FR31)
   **When** the Light theme is active
   **Then** the art uses the Light theme gradient endpoints instead of the Dark theme defaults
   **And** the fallback for limited color support (chalk level < 3) renders in bold blue (Light) instead of bold cyan (Dark)

4. **Given** the Static Banner renders its gradient shadow bar (FR34)
   **When** any theme is active
   **Then** the shadow bar uses the active theme's gradient endpoints

5. **Given** the Exit Message renders its gradient ASCII art (FR40)
   **When** any theme is active
   **Then** it uses the active theme's gradient endpoints and fallback color

6. **Given** the ASCII Art screen renders the FIGlet art or progress bar (FR48)
   **When** any theme is active
   **Then** `lerpColor` uses the active theme's gradient endpoints
   **And** unfilled progress bar blocks (`░`) use the active theme's dim style (dim for Dark, gray for Light)

7. **Given** `utils/format.test.ts` is updated
   **When** I run `npm test`
   **Then** all tests pass, covering: gradient constants return correct RGB values for each theme; fallback color is cyan (Dark) or blue (Light)

## Tasks / Subtasks

- [x] Task 1: Add `theme` field to settings schema (AC: prerequisite)
  - [x] In `src/domain/schema.ts`: add `theme: z.enum(['dark', 'light']).default('dark')` to `SettingsFileSchema`
  - [x] In `src/domain/schema.ts`: add `theme: 'dark' as const` to `defaultSettings()` return value
  - [x] Export `type Theme = 'dark' | 'light'` from `schema.ts` (or derive from schema)

- [x] Task 2: Add theme infrastructure to `src/utils/format.ts` (AC: prerequisite)
  - [x] Import `Theme` type (or define locally as `'dark' | 'light'`)
  - [x] Add module-level `let _theme: 'dark' | 'light' = 'dark'`
  - [x] Export `setTheme(t: 'dark' | 'light'): void` — sets `_theme`
  - [x] Export `getTheme(): 'dark' | 'light'` — returns `_theme`

- [x] Task 3: Make gradient constants theme-aware (AC: 1, 2)
  - [x] Keep existing `CYAN` and `MAGENTA` exports as Dark theme constants (backward compat for tests)
  - [x] Add `LIGHT_START = { r: 0, g: 140, b: 160 }` and `LIGHT_END = { r: 180, g: 0, b: 100 }` exports
  - [x] Export `gradientStart(): { r: number; g: number; b: number }` — returns `CYAN` (dark) or `LIGHT_START` (light)
  - [x] Export `gradientEnd(): { r: number; g: number; b: number }` — returns `MAGENTA` (dark) or `LIGHT_END` (light)
  - [x] Update `lerpColor(t)` to use `gradientStart()` / `gradientEnd()` instead of hardcoded `CYAN` / `MAGENTA`

- [x] Task 4: Update `gradientText()` fallback (AC: 3, 5)
  - [x] Change `chalk.bold.cyan(text)` fallback to: `_theme === 'dark' ? chalk.bold.cyan(text) : chalk.bold.blue(text)`

- [x] Task 5: Update `gradientBg()` fallback (AC: 4)
  - [x] Change `chalk.bgCyan(chalk.bold.white(padded))` fallback to use `chalk.bgBlue(...)` when Light theme is active

- [x] Task 6: Make `dim()` theme-aware (AC: 6)
  - [x] Change `export const dim = (s: string) => chalk.dim(s)` to `export const dim = (s: string) => _theme === 'dark' ? chalk.dim(s) : chalk.gray(s)`
  - [x] Note: this ensures `dim('░')` in `renderProgressBar()` automatically adapts — no change needed in ascii-art.ts for unfilled blocks

- [x] Task 7: Update `renderProgressBar()` fallback in `src/screens/ascii-art.ts` (AC: 6)
  - [x] Import `getTheme` from `../utils/format.js`
  - [x] Change `chalk.bold.cyan('█')` fallback to: `getTheme() === 'dark' ? chalk.bold.cyan('█') : chalk.bold.blue('█')`

- [x] Task 8: Update `typewriterPrint()` in `src/utils/format.ts` (AC: 3, 5)
  - [x] Change cursor `chalk.bold.cyan('_')` to: `_theme === 'dark' ? chalk.bold.cyan('_') : chalk.bold.blue('_')`
  - [x] Change character styling `chalk.dim.white(char)` to: `_theme === 'dark' ? chalk.dim.white(char) : chalk.gray(char)`

- [x] Task 9: Wire theme from settings at startup (AC: prerequisite)
  - [x] In `src/index.ts` (or wherever `readSettings()` is first called at boot): after reading settings, call `setTheme(settings.theme)` from `utils/format.js`
  - [x] Note: The Settings screen does not yet have a 🌓 Theme toggle — that is Story 5.2's responsibility. When 5.2 adds the toggle, it must call `setTheme(newTheme)` after `writeSettings()` so the change takes effect immediately

- [x] Task 10: Update tests in `src/utils/format.test.ts` (AC: 7)
  - [x] Test `setTheme` / `getTheme` round-trip
  - [x] Test `gradientStart()` returns `CYAN` for dark, `LIGHT_START` for light
  - [x] Test `gradientEnd()` returns `MAGENTA` for dark, `LIGHT_END` for light
  - [x] Test `lerpColor(0)` returns the active theme's start color; `lerpColor(1)` returns the active theme's end color — for both themes
  - [x] Test `gradientText()` fallback (chalk.level < 3) contains 'cyan' ANSI for dark, 'blue' ANSI for light
  - [x] Test `dim()` output differs between dark (chalk.dim) and light (chalk.gray)
  - [x] Always restore `_theme` to `'dark'` in `afterEach` to avoid test pollution

- [x] Task 11: Update tests in `src/screens/ascii-art.test.ts` (AC: 7)
  - [x] Test `renderProgressBar()` fallback (chalk.level < 3) uses cyan for dark theme, blue for light theme
  - [x] Always restore theme in `afterEach`

- [x] Task 12: Update settings-related tests (AC: prerequisite)
  - [x] In `src/domain/schema.test.ts` (or `store.test.ts`): verify `defaultSettings().theme === 'dark'`
  - [x] Verify `SettingsFileSchema` accepts `theme: 'light'` and rejects invalid values

## Dev Notes

### Theme Infrastructure Pattern
- The theme is determined by reading `settings.theme` from `~/.brain-break/settings.json`
- Settings are read asynchronously via `readSettings()` in `domain/store.ts`, but gradient/color functions are synchronous
- Solution: module-level `_theme` variable in `format.ts` with `setTheme()` / `getTheme()` exports
- `setTheme()` is called once at app startup (after `readSettings()`) and again whenever the user changes the theme in Settings
- Default is `'dark'` — matches the pre-theme behavior, so the app works identically if settings are missing or malformed

### Settings Schema Prerequisite
- The `theme` field does not currently exist in `SettingsFileSchema` or `defaultSettings()` — it was planned for Story 5.1 but added to the planning docs after 5.1 was completed
- This story adds `theme` to the schema as a prerequisite; adding a `.default('dark')` ensures backward compatibility with existing settings files that lack the field
- Zod's `.default()` means missing `theme` in saved JSON will parse as `'dark'` — no migration needed

### Gradient System Architecture
- **Dark theme constants (existing):** `CYAN = { r: 0, g: 180, b: 200 }`, `MAGENTA = { r: 200, g: 0, b: 120 }`
- **Light theme constants (new):** `LIGHT_START = { r: 0, g: 140, b: 160 }`, `LIGHT_END = { r: 180, g: 0, b: 100 }`
- `lerpColor(t)` interpolates between start/end — currently hardcoded to CYAN/MAGENTA, must use `gradientStart()` / `gradientEnd()`
- `gradientText()`, `gradientBg()`, `gradientShadow()` all consume `lerpColor()` — once `lerpColor()` is theme-aware, these automatically adapt for the truecolor path
- Fallback paths (chalk.level < 3) must be updated individually: `bold.cyan` → `bold.blue` for Light theme

### dim() Change Impact
- `dim()` is used across the entire codebase for metadata, separators, timestamps, etc.
- Changing `dim()` to be theme-aware (chalk.dim vs chalk.gray) affects more than just the progress bar — it impacts all dim text throughout the app
- This is the **intended behavior** per the PRD and UX spec: dim text should use `chalk.gray` on Light theme for readability
- The existing `dim()` tests will need updating to account for the theme-conditional output

### Screens That Consume Gradients (no code changes needed in these files)
- `src/screens/welcome.ts` — calls `renderBrandedScreen()` which calls `gradientText()`, `gradientShadow()`, `typewriterPrint()` from format.ts
- `src/screens/exit.ts` — same as welcome, calls `renderBrandedScreen()`
- `src/utils/screen.ts` — `banner()` calls `gradientShadow()`; `renderBrandedScreen()` calls `gradientText()` + `typewriterPrint()` — all from format.ts
- These screens do NOT need code changes — they delegate to format.ts helpers which become theme-aware

### Screens That DO Need Code Changes
- `src/screens/ascii-art.ts` — `renderProgressBar()` has an inline `chalk.bold.cyan('█')` fallback that must become theme-aware; needs `getTheme` import

### What This Story Does NOT Cover
- **Semantic color helpers** (`colorCorrect`, `colorIncorrect`, `colorSpeedTier`, `colorDifficultyLevel`, `colorScoreDelta`, `header`): these remain hardcoded to Dark theme colors — they need theme-awareness too but that is a Story 6.1 update concern, not 6.4
- **Settings screen Theme toggle UI**: the Settings screen does not yet have the 🌓 Theme toggle menu item — that is a Story 5.2 update concern
- **Exception:** `dim()` IS made theme-aware in this story because the AC explicitly requires it for progress bar unfilled blocks

### Project Structure Notes
- All color logic centralized in `src/utils/format.ts` — this is the primary file modified
- Settings schema in `src/domain/schema.ts` — prerequisite schema addition
- Screen file `src/screens/ascii-art.ts` — minor fallback color update
- App entry `src/index.ts` — `setTheme()` call after `readSettings()`
- Tests co-located: `format.test.ts`, `ascii-art.test.ts`, `schema.test.ts` / `store.test.ts`

### References

- [Source: docs/planning-artifacts/prd.md — Feature 9 (Color Feedback System / dual palettes)]
- [Source: docs/planning-artifacts/prd.md — Feature 15 (Exit Message — gradient endpoints)]
- [Source: docs/planning-artifacts/prd.md — Feature 18 (ASCII Art — lerpColor gradient + dim unfilled blocks)]
- [Source: docs/planning-artifacts/prd.md — Implementation Decisions (settings.json schema with `theme` field)]
- [Source: docs/planning-artifacts/epics.md — Story 6.4 acceptance criteria]
- [Source: docs/planning-artifacts/architecture.md — Color System section (gradient helpers, lerpColor)]
- [Source: docs/planning-artifacts/architecture.md — Utilities Module (format.ts description)]
- [Source: docs/planning-artifacts/ux-design-specification.md — Semantic Color System + Gradient Usage]
- [Source: docs/implementation-artifacts/6-3-quiz-feedback-colors.md — Previous story patterns + dev notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Added `ThemeSchema`, `Theme` type, and `theme` field to `SettingsFileSchema` with `.default('dark')` for backward compat
- Added `theme: 'dark' as const` to `defaultSettings()`
- Added `setTheme()` / `getTheme()` module-level theme state in `format.ts`
- Added `LIGHT_START` / `LIGHT_END` gradient constants and `gradientStart()` / `gradientEnd()` helpers
- Updated `lerpColor()` to use `gradientStart()` / `gradientEnd()` instead of hardcoded CYAN/MAGENTA
- Updated `gradientText()`, `gradientBg()`, `typewriterPrint()` fallbacks to use blue for light theme
- Made `dim()` theme-aware: `chalk.dim` (dark) vs `chalk.gray` (light)
- Updated `renderProgressBar()` in ascii-art.ts to use `getTheme()` for fallback color
- Wired `setTheme(settings.theme)` in `index.ts` after `readSettings()`
- Updated store.test.ts roundtrip tests to include `theme` field
- 23 new tests added (998 total, all passing)
- TypeScript type check passes cleanly
- Code review follow-up: aligned `header()`, `success()`, `warn()`, `colorCorrect()`, `colorSpeedTier()`, `colorDifficultyLevel()`, and `colorScoreDelta()` with the active theme palette
- Code review follow-up: restored branded subtitle styling so the prompt uses theme accent color and the cursor underscore stays magenta
- Code review follow-up: synced the story File List with the actual git-changed files in the worktree

### File List

- README.md
- docs/implementation-artifacts/6-4-theme-aware-gradient-colors.md
- docs/implementation-artifacts/sprint-status.yaml
- docs/planning-artifacts/epics.md
- docs/planning-artifacts/prd.md
- docs/planning-artifacts/ux-design-specification.md
- src/domain/schema.ts
- src/domain/schema.test.ts
- src/domain/store.test.ts
- src/utils/screen.ts
- src/utils/screen.test.ts
- src/utils/format.ts
- src/utils/format.test.ts
- src/screens/ascii-art.ts
- src/screens/ascii-art.test.ts
- src/index.ts

## Change Log

- Added `ThemeSchema`, `Theme` type, `theme` field to `SettingsFileSchema` and `defaultSettings()` in schema.ts (Date: 2026-04-05)
- Added `setTheme`/`getTheme` theme infrastructure, `LIGHT_START`/`LIGHT_END` constants, `gradientStart()`/`gradientEnd()` helpers, theme-aware `lerpColor()`, `gradientText()`, `gradientBg()`, `dim()`, `typewriterPrint()` in format.ts (Date: 2026-04-05)
- Updated `renderProgressBar()` fallback color in ascii-art.ts to be theme-aware (Date: 2026-04-05)
- Wired `setTheme(settings.theme)` at startup in index.ts (Date: 2026-04-05)
- Added 7 theme tests in schema.test.ts, 2 theme roundtrip fixes in store.test.ts, 14 theme-aware tests in format.test.ts, 2 theme-aware tests in ascii-art.test.ts (Date: 2026-04-05)
- Addressed code review findings: aligned shared semantic helpers with the active theme, restored branded subtitle accent/cursor styling, and synced the story File List with git reality (Date: 2026-04-05)
