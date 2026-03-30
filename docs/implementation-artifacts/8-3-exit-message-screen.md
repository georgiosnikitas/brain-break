---
title: 'Exit Message Screen'
slug: 'exit-message-screen'
created: '2026-03-30'
status: 'done'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['TypeScript (ES2022, ESM)', 'chalk ^5.0.0 (rgb for gradient text)', '@inquirer/prompts 7.10.1 (select for dismissal)', 'node:module createRequire (for package.json version read)', 'vitest (testing)', 'vi.useFakeTimers() + vi.advanceTimersByTimeAsync (timer control)']
files_to_modify: ['src/screens/exit.ts (new)', 'src/screens/exit.test.ts (new)', 'src/router.ts', 'src/router.test.ts', 'src/screens/home.ts', 'src/screens/home.test.ts', 'src/screens/settings.ts', 'src/screens/settings.test.ts']
code_patterns: ['clearScreen() called at top (not clearAndBanner — full-screen branded layout, same as welcome.ts)', 'Promise.race([sleep(3000), select(...)]) for 3-second auto-exit with immediate-dismiss override', 'ExitPromptError catch pattern → process.exit(0)', 'readSettings() before exit in home.ts — falls back to defaultSettings() on error', 'router.ts re-export facade pattern', 'vi.useFakeTimers() + vi.advanceTimersByTimeAsync(3000) for auto-exit test path', 'lerpColor() per-line gradient for ASCII art rows']
test_patterns: ['vi.mock for @inquirer/prompts, utils/screen.js, utils/format.js', 'console.log spy to capture output', 'vi.spyOn(process, "exit").mockImplementation(() => undefined as never) to intercept exits', 'vi.advanceTimersByTimeAsync(3000) for 3s auto-exit path', 'vi.runOnlyPendingTimersAsync() for Enter-immediate-exit path', 'mockSelect.mockRejectedValueOnce(new ExitPromptError()) for Ctrl+C path']
---

## Tech-Spec: Exit Message Screen

**Created:** 2026-03-30

## Overview

### Problem Statement

Brain Break currently exits silently when the user selects Exit from the home menu — no farewell message, no visual continuity with the welcome experience. The app has a strong visual identity on entry (welcome screen with gradient ASCII art) but no symmetric goodbye moment.

### Solution

Add an **Exit Message Screen** (`src/screens/exit.ts`) shown when the user exits from the home menu, conditional on the `showWelcome` setting. The screen mirrors the welcome screen's visual style — same ASCII art, same `clearScreen()` call, same gradient text — and auto-exits after 3 seconds or immediately on Enter/Ctrl+C.

The `showWelcome` settings toggle is renamed to **"Welcome & Exit screen"** to reflect that it now controls both screens.

### Scope

**In Scope:**

- Exit screen with same ASCII art and gradient style as the welcome screen
- 3-second auto-exit via `Promise.race([sleep(3000), select(...)])`
- Immediate exit on Enter or Ctrl+C
- Conditional rendering based on `settings.showWelcome`
- Settings toggle label renamed to "Welcome & Exit screen"
- Router facade export `showExit()`

**Out of Scope:**

- Separate toggle for exit screen vs. welcome screen
- Custom farewell messages
- Animation on exit

## Context for Development

### Codebase Patterns

- **Screen rendering**: Branded full-screen layouts (`welcome.ts`, `exit.ts`) use `clearScreen()`. All other screens use `clearAndBanner()`. This is by design — full-screen gradient layouts replace the banner.
- **Auto-exit pattern**: `Promise.race([sleep(ms), select(...)])` — whichever resolves first wins. After the race, `process.exit(0)` is called unconditionally.
- **ExitPromptError handling**: All screens wrap `select()` in `try/catch` for `ExitPromptError` from `@inquirer/core` → `process.exit(0)`. Non-`ExitPromptError` errors are re-thrown.
- **Gradient utilities**: `lerpColor(t: number)` interpolates cyan `rgb(0,180,200)` → magenta `rgb(200,0,120)` for `t ∈ [0, 1]`. `gradientShadow(width)` renders `▀` chars. `getGradientWidth()` = `Math.min(process.stdout.columns || 60, 80)`.
- **Settings access in home.ts**: `readSettings()` returns `Result<Settings>` — always fall back to `defaultSettings()` on error, never block exit.
- **Router pattern**: `src/router.ts` is a facade that re-exports screen functions. All cross-screen navigation goes through the router, enabling clean test mocking.
- **Version**: `createRequire(import.meta.url)('../../package.json').version` — same as `welcome.ts`.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `src/screens/welcome.ts` | Primary reference — identical visual patterns (ASCII art, gradient, clearScreen, select) |
| `src/screens/home.ts` | Where exit action is handled; conditional routing added here |
| `src/router.ts` | Facade re-export pattern for `showExit` |
| `src/domain/schema.ts` | `showWelcome` field in `SettingsFileSchema`, `defaultSettings()` |
| `src/utils/format.ts` | `lerpColor`, `gradientShadow`, `getGradientWidth`, `menuTheme` |
| `src/utils/screen.ts` | `clearScreen()` |

## Implementation Plan

### Tasks

- [x] **Task 1: Create exit screen**
  - File: `src/screens/exit.ts` (new file)
  - Action: Export `showExitScreen(): Promise<void>` with:
    1. `clearScreen()` (not `clearAndBanner` — full-screen branded layout, same as welcome.ts)
    2. Same `ASCII_ART` constant as `welcome.ts` (hardcoded 5-line FIGlet "Brain Break")
    3. Per-line gradient via `lerpColor(row / (totalRows - 1))` → `chalk.bold.rgb(r,g,b)` with `chalk.level < 3` fallback to `chalk.bold.cyan`
    4. Layout (console.log calls in order): empty line, `🧠🔨` emoji, 5 gradient art lines, empty line, tagline line (cyan `>` + dim white text + bold magenta `_`), `Exiting in 3 seconds...` (dim white), `vX.Y.Z` version (dim white), empty line, `gradientShadow(width)`, empty line
    5. `Promise.race([sleep(AUTO_EXIT_MS), select({ message: ' ', choices: [{ value: 'exit-now', name: 'Press enter to exit now...' }], theme: menuTheme })])`
    6. After race resolves: `process.exit(0)`
    7. `catch (err)`: if not `ExitPromptError`, re-throw; else `process.exit(0)`
  - Notes: `AUTO_EXIT_MS = 3000`. Version via `createRequire(import.meta.url)('../../package.json')`. All utilities already exist — no new dependencies.

- [x] **Task 2: Wire showExit into router**
  - File: `src/router.ts`
  - Action: Add import `import { showExitScreen } from './screens/exit.js'` and export:
    ```typescript
    export async function showExit(): Promise<void> {
      await showExitScreen()
    }
    ```
  - Notes: Follow the same explicit function wrapper pattern used for all other router exports (not a re-export alias, to maintain consistent wrapping).

- [x] **Task 3: Conditional exit routing in home screen**
  - File: `src/screens/home.ts`
  - Action: In the `handleHomeAction()` function, for the `'exit'` case, read settings before exiting:
    ```typescript
    if (answer.action === 'exit') {
      const settingsResult = await readSettings()
      const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
      if (settings.showWelcome) {
        await router.showExit()
      }
      process.exit(0)
    }
    ```
  - Add `readSettings` and `defaultSettings` imports from `'../domain/store.js'` and `'../domain/schema.js'` respectively.
  - Notes: `process.exit(0)` after `showExit()` is still needed — `showExitScreen` calls its own `process.exit(0)` internally, but the defensive call in home.ts ensures exit even if the screen is skipped.

- [x] **Task 4: Rename settings toggle label**
  - File: `src/screens/settings.ts`
  - Action: Three string replacements:
    - Choice label: `'Welcome screen: ON'` / `'Welcome screen: OFF'` → `'Welcome & Exit screen: ON'` / `'Welcome & Exit screen: OFF'`
    - Flash message: `'Welcome screen enabled'` → `'Welcome & Exit screen enabled'`
    - Flash message: `'Welcome screen disabled'` → `'Welcome & Exit screen disabled'`
  - Notes: No logic changes — only display strings.

- [x] **Task 5: Tests**
  - File: `src/screens/exit.test.ts` (new file) — 6 tests:
    1. `clears the screen before rendering` — asserts `clearScreen` called once; `process.exit(0)` called
    2. `renders exit status line and prompt` — captures `console.log` output, asserts `'Exiting in 3 seconds...'` and `select()` called with correct choices
    3. `auto-exits after 3 seconds when no keypress is provided` — `mockSelect` returns never-resolving promise; `vi.advanceTimersByTimeAsync(3000)` triggers sleep; asserts `process.exit(0)`
    4. `exits immediately on Enter before timer elapses` — `mockSelect` resolves immediately; `vi.runOnlyPendingTimersAsync()`; asserts `process.exit(0)`
    5. `exits immediately on ExitPromptError (Ctrl+C)` — `mockSelect.mockRejectedValueOnce(new ExitPromptError())`; asserts `process.exit(0)`
    6. `re-throws non-ExitPromptError errors` — `mockSelect.mockRejectedValueOnce(new Error('unexpected'))` ; asserts `promise.rejects.toThrow('unexpected')`
  - File: `src/router.test.ts` — 1 new `describe('showExit')` block:
    - Mocks `./screens/exit.js` with `showExitScreen: vi.fn()`; asserts `showExit()` calls `showExitScreen()`
  - File: `src/screens/home.test.ts` — 2 new tests:
    - `calls router.showExit before process.exit when showWelcome is true` — `mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: true } })`; asserts `mockShowExit` called before `process.exit`
    - `exits immediately without router.showExit when showWelcome is false` — `mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: false } })`; asserts `mockShowExit` NOT called
  - File: `src/screens/settings.test.ts` — updated assertions + 1 new test:
    - Updated: `'Welcome screen enabled'` → `'Welcome & Exit screen enabled'`; same for disabled
    - New: `renders the Welcome & Exit screen toggle label in settings menu` — asserts `toggleChoice.name` contains `'Welcome & Exit screen'`

### Acceptance Criteria

- [x] **AC1**: Given the user selects Exit from home, when `showWelcome` is `true` in settings, then `showExitScreen()` is called before `process.exit(0)`.
- [x] **AC2**: Given the exit screen is displayed, when 3 seconds elapse with no input, then `process.exit(0)` is called automatically.
- [x] **AC3**: Given the exit screen is displayed, when the user presses Enter on the "Press enter to exit now..." prompt, then `process.exit(0)` is called immediately (before the 3-second timer).
- [x] **AC4**: Given the exit screen is displayed, when the user presses Ctrl+C (`ExitPromptError`), then `process.exit(0)` is called immediately.
- [x] **AC5**: Given the user selects Exit from home, when `showWelcome` is `false` in settings, then `showExitScreen()` is NOT called and the app exits immediately.
- [x] **AC6**: Given the user navigates to Settings, when they view the toggle, then the label reads "Welcome & Exit screen" (not "Welcome screen").
- [x] **AC7**: Given the exit screen renders, when `clearScreen()` is called, then the terminal is cleared (no banner — this is a full-screen branded layout identical to welcome).

## Additional Context

### Design Decisions

1. **`clearScreen()` not `clearAndBanner()`**: The exit screen is a full-screen branded layout, same as `welcome.ts`. Using `clearAndBanner()` would overlay the gradient ASCII art with the persistent banner header.

2. **`Promise.race` auto-exit**: This is the canonical pattern for timed-auto-dismiss with user override in this codebase. `sleep()` and `select()` race — whichever resolves first wins. No cancellation of the losing promise is needed since `process.exit(0)` terminates immediately after.

3. **Settings read in home.ts, not exit.ts**: The conditional check belongs in the caller (home.ts) because it determines whether to show the screen at all. `showExitScreen()` itself is unconditional — it always shows the screen when called.

4. **Fallback to `defaultSettings()` on read error**: If settings cannot be read (corrupted file, I/O error), we default to `showWelcome: true` — conservative choice that shows the exit screen rather than silently skipping it.

5. **Shared ASCII art**: The same 5-line FIGlet constant is defined independently in both `welcome.ts` and `exit.ts`. This duplication is intentional — the files are symmetric siblings, not a hierarchy. Sharing via a utility would couple them unnecessarily.

### Dependencies

- No new packages — all utilities (`lerpColor`, `gradientShadow`, `getGradientWidth`, `menuTheme`, `clearScreen`) were added in Story 8.1.

### Testing Notes

- `vi.useFakeTimers()` in `beforeEach` is required to control the `setTimeout` used by `sleep()`.
- The auto-exit test path (`vi.advanceTimersByTimeAsync(3000)`) requires `mockSelect` to return a never-resolving promise — otherwise `select()` resolves first and the timer test is actually testing the Enter path.
- `vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)` — the `as never` cast is necessary because TypeScript knows `process.exit()` never returns; without the cast the mock type doesn't satisfy TypeScript's expectations.
