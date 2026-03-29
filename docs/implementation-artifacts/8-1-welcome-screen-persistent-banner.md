---
title: 'Welcome Screen & Persistent Banner'
slug: 'welcome-screen-persistent-banner'
created: '2026-03-23'
status: 'done'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['TypeScript (ES2022, ESM)', 'chalk ^5.0.0 (bgRgb, rgb for gradients)', '@inquirer/prompts 7.10.1 (select for dismissal)', 'zod (settings schema validation)', 'vitest (testing)', 'node:module createRequire (for package.json version read)']
files_to_modify: ['src/utils/screen.ts', 'src/utils/format.ts', 'src/domain/schema.ts', 'src/screens/welcome.ts (new)', 'src/screens/home.ts', 'src/screens/quiz.ts', 'src/screens/history.ts', 'src/screens/stats.ts', 'src/screens/domain-menu.ts', 'src/screens/archived.ts', 'src/screens/provider-setup.ts', 'src/screens/settings.ts', 'src/screens/create-domain.ts', 'src/index.ts', 'src/router.ts']
code_patterns: ['clearScreen() called at top of every screen - 11 calls across 8 files', 'chalk wrappers in format.ts (success, error, warn, dim, bold, header)', 'Zod schema with .default() for backward-compatible additions', 'select() from @inquirer/prompts for all user interaction', 'menuTheme with chalk.inverse applied to all select prompts', 'atomic file write (tmp + rename) for settings persistence', 'ExitPromptError catch pattern in all screens', 'ESM with "type": "module" - no resolveJsonModule']
test_patterns: ['vitest with vi.mock for module mocking', 'all 8 screen test files mock clearScreen: vi.mock("../utils/screen.js", () => ({ clearScreen: vi.fn() }))', 'screen.test.ts tests clearScreen directly', 'regression.test.ts also mocks clearScreen', 'tests assert clearScreen was called (toHaveBeenCalled)', 'test files: screen.test.ts, home.test.ts, quiz.test.ts, history.test.ts, stats.test.ts, domain-menu.test.ts, archived.test.ts, settings.test.ts, create-domain.test.ts, regression.test.ts']
---

## Tech-Spec: Welcome Screen & Persistent Banner

**Created:** 2026-03-23

## Overview

### Problem Statement

Brain Break launches directly into the home menu with no visual identity moment — no splash/welcome screen and no persistent branding across screens. The app already has personality (emoji-rich menus, typewriter effects, QR code screen) but lacks a cohesive visual identity that greets the user and persists throughout the experience.

### Solution

Add two visual identity elements:

1. **Welcome Screen**: A full-screen splash shown on every launch (configurable via settings) with FIGlet ASCII art logo, cyan→magenta vertical gradient background, emoji branding (🧠🔨), tagline, and version number. Dismissed via Inquirer `select()`.

2. **Persistent Banner**: A 2-line gradient header (horizontal cyan→magenta background bar with `▀` shadow line) shown at the top of every screen via a new `clearAndBanner()` utility that replaces all `clearScreen()` calls.

### Scope

**In Scope:**

- Welcome screen with vertical cyan→magenta gradient, ASCII art, version, emoji, tagline
- `showWelcome` setting (boolean, default `true`) in settings schema
- Settings screen toggle for welcome screen on/off
- Persistent 2-line banner with horizontal gradient + shadow
- `clearAndBanner()` utility replacing `clearScreen()` in all screens
- Adaptive width based on `process.stdout.columns`
- Truecolor fallback for terminals with `chalk.level < 3`

**Out of Scope:**

- Dynamic banner content (score, domain name, etc.)
- Animation effects on the banner
- Welcome screen customization beyond enable/disable

## Context for Development

### Codebase Patterns

- **Screen rendering**: Every screen calls `clearScreen()` at the top, then `console.log()` for output, then `select()` from `@inquirer/prompts` for interaction
- **Colors**: All via `chalk` wrappers in `src/utils/format.ts` — `success`, `error`, `warn`, `dim`, `bold`, `header` (bold.cyan)
- **Settings**: Zod-validated `SettingsFileSchema` in `schema.ts`, read/written atomically via `store.ts`, UI in `settings.ts` with local state + save. Zod `.default()` ensures backward compatibility for new fields.
- **Menu theme**: `menuTheme` with `chalk.inverse` highlighting, applied to all `select()` calls
- **Version**: In `package.json` `"version": "1.4.5"`. No `resolveJsonModule` in tsconfig — must use `createRequire` from `node:module` to read it.
- **ESM**: Project uses `"type": "module"` — all imports use `.js` extension suffix
- **Error handling**: All screens wrap `select()` in `try/catch` for `ExitPromptError` from `@inquirer/core`

### Files to Reference

| File | Purpose | clearScreen calls |
| ---- | ------- | ----------------- |
| `src/utils/screen.ts` | `clearScreen()` definition (2 lines) | definition |
| `src/utils/format.ts` | Chalk wrappers, gradient helpers will go here | — |
| `src/domain/schema.ts` | `SettingsFileSchema` + `defaultSettings()` — add `showWelcome` | — |
| `src/screens/home.ts` | Home screen + coffee screen | 2 calls (L89 coffee, L113 home loop) |
| `src/screens/quiz.ts` | Quiz loop | 2 calls (L109 before question, L155 before feedback) |
| `src/screens/history.ts` | Question history navigation | 2 calls (L54 nav loop, L98 empty history) |
| `src/screens/stats.ts` | Stats dashboard | 1 call (L86) |
| `src/screens/domain-menu.ts` | Domain sub-menu | 1 call (L33) |
| `src/screens/archived.ts` | Archived domains list | 1 call (L76) |
| `src/screens/provider-setup.ts` | First-time provider setup | 1 call (L14) |
| `src/screens/settings.ts` | Settings menu loop | 1 call (L122) |
| `src/screens/create-domain.ts` | Create new domain | 1 call (L17) |
| `src/screens/select-domain.ts` | Motivational message + quiz redirect | 0 calls (no clearScreen) |
| `src/index.ts` | Entry point — wire welcome screen here | — |
| `src/router.ts` | Router facade — add showWelcome export | — |

**Total: 11 `clearScreen()` calls across 9 screen files + 1 definition file.**

### Technical Decisions

1. **Gradient rendering**: Use `chalk.bgRgb(r,g,b)` per-character for backgrounds, `chalk.rgb(r,g,b)` for foreground `▀` shadow characters. Linear interpolation between cyan `rgb(0, 180, 200)` and magenta `rgb(200, 0, 120)`.

2. **Adaptive width**: Read `process.stdout.columns` (default 60 if unavailable). Cap at 80 to prevent excessively wide bars on ultra-wide terminals.

3. **Truecolor fallback**: Check `chalk.level >= 3` before applying `bgRgb`/`rgb`. Fallback: plain text banner with "Brain" in `bold.cyan`, "Break" in `bold.magenta`, no gradient background, no shadow line.

4. **Version source**: Use `createRequire(import.meta.url)` from `node:module` to load `package.json` (since `resolveJsonModule` is not enabled in tsconfig and the project is ESM).

5. **Welcome screen dismissal**: Use `select()` with a single "Continue" choice + `menuTheme`, consistent with all other screens.

6. **Setting field**: `showWelcome: z.boolean().default(true)` added to `SettingsFileSchema`. Backward-compatible — old settings files without this field will default to `true` via Zod `.default()`.

7. **Keep `clearScreen` exported**: The existing `clearScreen` function stays exported from `screen.ts` alongside the new `clearAndBanner`. This way existing test mocks (`vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))`) continue to work. Tests for screens will need their mock factories updated to also export `clearAndBanner: vi.fn()`.

8. **settings.ts `banner` variable conflict**: The settings screen already uses a local variable named `banner` for flash messages. The new `banner()` function import will need an alias like `showBanner` or the screen module should import `clearAndBanner` (which calls `banner` internally) — no direct `banner` import needed in screen files.

## Implementation Plan

### Tasks

- [x] **Task 1: Add gradient utility functions**
  - File: `src/utils/format.ts`
  - Action: Append three new exported functions at end of file:
    - `getGradientWidth(): number` — returns `Math.min(process.stdout.columns || 60, 80)`
    - `gradientBg(text: string, width: number): string` — renders a single line of text centered on a horizontal cyan→magenta `bgRgb` gradient background, padded to `width` with spaces. Color stops: cyan `rgb(0, 180, 200)` → magenta `rgb(200, 0, 120)`, linear interpolation per-character. If `chalk.level < 3`, return `chalk.bgCyan(chalk.bold.white(text))` padded to `width`.
    - `gradientShadow(width: number): string` — renders `width` `▀` characters with per-character `rgb()` foreground matching the same gradient. If `chalk.level < 3`, return empty string `''`.
  - Notes: `chalk` is already imported in this file. These functions are pure (no I/O side effects) — they return styled strings.

- [x] **Task 2: Add `banner()` and `clearAndBanner()` to screen utilities**
  - File: `src/utils/screen.ts`
  - Action: Add two new exported functions alongside the existing `clearScreen()`:
    - `banner(): void` — calls `console.log(gradientBg(' 🧠🔨 Brain Break', getGradientWidth()))` then `console.log(gradientShadow(getGradientWidth()))`. Import `gradientBg`, `gradientShadow`, `getGradientWidth` from `./format.js`.
    - `clearAndBanner(): void` — calls `clearScreen()` then `banner()`.
  - Notes: Keep `clearScreen` exported unchanged. `banner()` is also exported for potential standalone use but screen files only need `clearAndBanner`.

- [x] **Task 3: Add `showWelcome` setting to schema**
  - File: `src/domain/schema.ts`
  - Action: Two changes:
    1. In `SettingsFileSchema` (Zod object), add field: `showWelcome: z.boolean().default(true)`
    2. In `defaultSettings()` return object, add: `showWelcome: true`
  - Notes: Zod `.default(true)` ensures backward compatibility — existing settings files without this field will parse with `showWelcome: true`.

- [x] **Task 4: Create welcome screen**
  - File: `src/screens/welcome.ts` (new file)
  - Action: Create file exporting `showWelcomeScreen(): Promise<void>` with:
    1. `clearScreen()` (not `clearAndBanner` — welcome replaces the banner)
    2. Build a 12-line vertical gradient block (each line uses `gradientBg` with slightly different color stops progressing cyan→magenta top-to-bottom)
    3. Lines contain: empty padding (2 lines), `🧠🔨` emoji line (bold white), FIGlet ASCII art for "Brain Break" in Standard font (bold white, ~6 lines), tagline `"Train your brain, one question at a time!"` (bold yellow), version `v{version}` (dim white), empty padding (1 line)
    4. Version: `const { version } = createRequire(import.meta.url)('../../package.json')` — import `createRequire` from `node:module`
    5. `console.log()` each gradient line
    6. `await select({ message: ' ', choices: [{ value: 'continue', name: 'Press enter to continue...' }], theme: menuTheme })` — import `select` from `@inquirer/prompts`, `menuTheme` from `../utils/format.js`
    7. Wrap `select()` in `try/catch` for `ExitPromptError` from `@inquirer/core` — on catch, call `process.exit(0)` (matches home screen pattern)
  - Notes: The FIGlet art is a hardcoded template literal — no runtime dependency. Import `clearScreen` from `../utils/screen.js`. For vertical gradient, interpolate bgRgb row-by-row from cyan to magenta (different from horizontal banner gradient).

- [x] **Task 5: Add welcome screen toggle to settings screen**
  - File: `src/screens/settings.ts`
  - Action: Three changes:
    1. Add `showWelcome` to the local state variables (destructured from `readSettings()` around existing `language`, `tone`, `provider`, `model` variables)
    2. Add a new choice in the settings `select()` choices array: `{ value: 'showWelcome', name: '🎬  Welcome screen: ${showWelcome ? 'ON' : 'OFF'}' }`
    3. Add a case in the action handler switch/if block: when `action === 'showWelcome'`, flip `showWelcome = !showWelcome` and set local `banner` variable (the flash message) to `showWelcome ? 'Welcome screen enabled' : 'Welcome screen disabled'`
    4. Include `showWelcome` in the save payload passed to `writeSettings()`
  - Notes: The local `banner` variable in settings.ts is used for flash messages — no conflict since the imported utility will be `clearAndBanner` (Task 7), not `banner`.

- [x] **Task 6: Wire welcome screen into app startup**
  - File: `src/router.ts`
  - Action: Add `export { showWelcomeScreen as showWelcome } from './screens/welcome.js'`
  - File: `src/index.ts`
  - Action: After the existing provider setup check and before `showHome()`, add:

    ```typescript
    if (settings.showWelcome) {
      await showWelcome();
    }
    ```

    Import `showWelcome` from `./router.js` (add to existing import).
  - Notes: `settings` is already read from `readSettings()` earlier in the file.

- [x] **Task 7: Replace `clearScreen()` with `clearAndBanner()` in all screen files**
  - Files & anchors (each file: change import + replace call sites):
    - `src/screens/home.ts` — import L5, calls at L89 + L113 (2 calls)
    - `src/screens/quiz.ts` — import L10, calls at L109 + L155 (2 calls)
    - `src/screens/history.ts` — import L18, calls at L54 + L98 (2 calls)
    - `src/screens/stats.ts` — import L6, call at L86 (1 call)
    - `src/screens/domain-menu.ts` — import L6, call at L33 (1 call)
    - `src/screens/archived.ts` — import L5, call at L76 (1 call)
    - `src/screens/provider-setup.ts` — import L8, call at L14 (1 call)
    - `src/screens/settings.ts` — import L8, call at L122 (1 call)
    - `src/screens/create-domain.ts` — import L7, call at L17 (1 call)
  - Action per file: Change `import { clearScreen } from '../utils/screen.js'` to `import { clearAndBanner } from '../utils/screen.js'` and replace every `clearScreen()` call with `clearAndBanner()`.
  - Notes: `src/screens/select-domain.ts` does NOT import or call `clearScreen` — skip it. Total: 11 call replacements across 9 files.

- [x] **Task 8: Update test mocks for `clearAndBanner`**
  - Files & anchors (each file: update mock factory, import, and assertions):
    - `src/screens/home.test.ts` — mock L23, import L33, assertions L279+L286+L301
    - `src/screens/quiz.test.ts` — mock L47, import L56, assertions L311+L317+L326+L327
    - `src/screens/history.test.ts` — mock L21, import L29, assertions L392+L400+L403+L410
    - `src/screens/stats.test.ts` — mock L20, import L28, assertions L368+L376
    - `src/screens/domain-menu.test.ts` — mock L29, import L37, assertions L202+L203+L208
    - `src/screens/archived.test.ts` — mock L27, import L16, assertions L278+L283
    - `src/screens/settings.test.ts` — mock L27, import L39, assertions L64+L69
    - `src/screens/create-domain.test.ts` — mock L20, import L9, assertions L206+L212
    - `src/regression.test.ts` — mock L25 (no assertions to update)
  - Action per test file:
    1. Update mock factory: `vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))` — keep `clearScreen` in mock for backward compat
    2. Update import: change `clearScreen` to `clearAndBanner` (or add `clearAndBanner` alongside)
    3. Update assertions: change `expect(vi.mocked(clearScreen))` → `expect(vi.mocked(clearAndBanner))`
  - File: `src/utils/screen.test.ts`
  - Action: Keep existing `clearScreen` tests. Add new tests for `banner()` and `clearAndBanner()`:
    - Test `banner()` calls `console.log` twice (gradient bar + shadow line)
    - Test `clearAndBanner()` calls `clearScreen()` then `banner()`
  - Notes: Mock `gradientBg`, `gradientShadow`, `getGradientWidth` from `../utils/format.js` in screen.test.ts to isolate `banner()` logic.

- [x] **Task 9: Add new unit tests**
  - File: `src/utils/format.test.ts` (new file, or append to existing if one exists)
  - Action: Add tests for the three gradient functions:
    - `getGradientWidth()`: mock `process.stdout.columns` to test various widths; verify cap at 80; verify default 60 when undefined
    - `gradientBg(text, width)`: verify returned string contains the text; verify output when `chalk.level >= 3` uses bgRgb; verify fallback when `chalk.level < 3` uses bgCyan
    - `gradientShadow(width)`: verify output contains `▀` characters; verify empty string when `chalk.level < 3`
  - File: `src/domain/schema.test.ts` (append to existing if one exists, else new)
  - Action: Add tests for `showWelcome` setting:
    - `SettingsFileSchema.parse({ ...defaultSettings() })` includes `showWelcome: true`
    - `SettingsFileSchema.parse({})` (empty object) defaults `showWelcome` to `true` (backward compat)
    - `SettingsFileSchema.parse({ ...defaultSettings(), showWelcome: false })` preserves `false`

### Acceptance Criteria

- [x] **AC1**: Given the app launches with `showWelcome: true` in settings, when the entry point runs, then a full-screen welcome splash is displayed with FIGlet ASCII art, 🧠🔨 emoji, tagline "Train your brain, one question at a time!", version number, and cyan→magenta vertical gradient background.
- [x] **AC2**: Given the welcome screen is displayed, when the user presses Enter on the "Press enter to continue..." prompt, then the welcome screen clears and the home screen is shown.
- [x] **AC3**: Given the user navigates to Settings, when they toggle the "Welcome screen" option to OFF and save, then on next app launch the welcome screen is skipped.
- [x] **AC4**: Given a fresh install with no existing settings file (or an old settings file missing `showWelcome`), when the app launches, then `showWelcome` defaults to `true` and the welcome screen is shown.
- [x] **AC5**: Given the app is running, when the user navigates to any screen (home, quiz, history, stats, settings, domain menu, archived, provider setup, create domain, coffee), then a 2-line gradient banner with `🧠🔨 Brain Break` text and `▀` shadow is visible at the top of that screen.
- [x] **AC6**: Given the terminal width is N columns, when the banner or welcome screen renders, then the gradient bar width is `min(N, 80)` characters wide.
- [x] **AC7**: Given the terminal does not support truecolor (`chalk.level < 3`), when the banner or welcome screen renders, then text is shown with basic chalk colors (bold cyan/magenta) without `bgRgb` gradient backgrounds and without the `▀` shadow line.
- [x] **AC8**: Given `package.json` has `"version": "X.Y.Z"`, when the welcome screen renders, then the version is displayed as `vX.Y.Z` in dim white text.

## Additional Context

### Dependencies

- No new packages needed — `chalk` already supports `bgRgb`/`rgb`
- `@inquirer/prompts` already in use for `select()`

### Testing Strategy

- Unit test gradient functions with mocked `chalk.level` for fallback path
- Unit test `clearAndBanner` by capturing stdout writes
- Schema test: `SettingsFileSchema.parse({})` includes `showWelcome: true`
- Integration: manual verification of visual output in terminal (gradient rendering is inherently visual)

### Notes

- The FIGlet ASCII art for "Brain Break" uses the "Standard" font (the one from our design session). The exact string should be hardcoded as a constant, not generated at runtime (no FIGlet dependency needed).
- Emoji rendering width varies across terminals — 🧠🔨 typically takes 2 cells each. Account for this when calculating padding.
- The welcome screen gradient is vertical (top-to-bottom, per-line bgRgb), while the banner gradient is horizontal (left-to-right, per-character bgRgb). Same color stops, different axis.
