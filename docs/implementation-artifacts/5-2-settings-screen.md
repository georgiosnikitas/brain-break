# Story 5.2: Settings Screen

Status: done

## Story

As a user,
I want a Settings option in the home screen menu that opens a screen where I can configure my question language and tone of voice,
So that I can personalise how questions and AI responses are delivered to me.

## Acceptance Criteria

1. **Given** I am on the home screen  
   **When** I inspect the menu options  
   **Then** a "⚙️  Settings" action is present between "View archived domains" and "☕  Buy me a coffee"

2. **Given** I select "⚙️  Settings" from the home screen  
   **When** the settings screen loads  
   **Then** the terminal is cleared and current settings are read from disk via `readSettings()`  
   **And** the screen displays the current values for Question Language and Tone of Voice

3. **Given** the settings screen is open  
   **When** I edit the Question Language field  
   **Then** I can type any free-text value (e.g. `Greek`, `Japanese`, `Pirate English`)

4. **Given** the settings screen is open  
   **When** I navigate the Tone of Voice selector  
   **Then** I can choose from: Normal, Enthusiastic, Robot, Pirate — navigated with arrow keys

5. **Given** I have made changes on the settings screen  
   **When** I select "Save"  
   **Then** `writeSettings()` is called with the new values and persists to `~/.brain-break/settings.json`  
   **And** I am returned to the home screen

6. **Given** I have made changes on the settings screen  
   **When** I select "Back" (or press Ctrl+C)  
   **Then** no changes are written to disk and I am returned to the home screen

7. **Given** `screens/settings.ts` has co-located tests  
   **When** I run `npm test`  
   **Then** all tests pass, covering: Settings action present in home menu, routing home → settings screen, current values loaded on open, Save persists + navigates home, Back discards + navigates home, Ctrl+C handled gracefully

## Tasks / Subtasks

- [x] Create `src/screens/settings.ts` (AC: 2, 3, 4, 5, 6)
  - [x] Export `showSettingsScreen()` async function
  - [x] Call `clearScreen()` on entry
  - [x] Call `readSettings()` to load current values
  - [x] Show `input` prompt for Question Language (pre-filled with current value)
  - [x] Show `select` prompt for Tone of Voice with 4 options (Normal/Enthusiastic/Robot/Pirate)
  - [x] Show `select` prompt for Save/Back navigation
  - [x] On Save: call `writeSettings()` then `router.showHome()`
  - [x] On Back: call `router.showHome()` without writing
  - [x] Catch `ExitPromptError` → call `router.showHome()`

- [x] Add `settings` to `HomeAction` and update `buildHomeChoices` and `handleHomeAction` in `src/screens/home.ts` (AC: 1)
  - [x] Add `| { action: 'settings' }` to `HomeAction` union
  - [x] Insert `{ name: '⚙️  Settings', value: { action: 'settings' } }` between archived and coffee in `buildHomeChoices`
  - [x] Add `if (answer.action === 'settings') await router.showSettings()` in `handleHomeAction`

- [x] Add `showSettings()` to `src/router.ts` (AC: 5, 6)
  - [x] Import `showSettingsScreen` from `./screens/settings.js`
  - [x] Export `async function showSettings(): Promise<void>`

- [x] Create `src/screens/settings.test.ts` (AC: 2, 3, 4, 5, 6, 7)
  - [x] Settings action present in home menu choices (via `buildHomeChoices`)
  - [x] `showSettingsScreen` calls `clearScreen()`
  - [x] Current values loaded via `readSettings()` and passed as defaults to prompts
  - [x] Save path: `writeSettings()` called with user input values, then `router.showHome()` called
  - [x] Back path: `writeSettings()` NOT called, `router.showHome()` called
  - [x] `ExitPromptError` handled gracefully → `router.showHome()` called

- [x] Update `src/screens/home.test.ts` (AC: 1)
  - [x] Update `buildHomeChoices` tests to include `settings` action in expected action types
  - [x] Add test: selecting `settings` from home calls `router.showSettings`
  - [x] Mock `router.showSettings` in home screen tests

## Dev Notes

### Files to create
- `src/screens/settings.ts`
- `src/screens/settings.test.ts`

### Files to modify
- `src/screens/home.ts` — add `settings` action, menu entry, handler
- `src/router.ts` — add `showSettings()`

### Settings screen interaction flow
```
clearScreen()
readSettings() → { language, tone }
input:   "Question Language" (default: language)
select:  "Tone of Voice" (choices: Normal/Enthusiastic/Robot/Pirate, default: tone)
select:  "Navigation" (choices: separator, Save, Back)
  → Save: writeSettings({ language: langAnswer, tone: toneAnswer }) → router.showHome()  
  → Back: router.showHome()
ExitPromptError → router.showHome()
```

### Tone display labels → schema values
| Display   | Schema value  |
|-----------|---------------|
| Normal    | `normal`      |
| Enthusiastic | `enthusiastic` |
| Robot     | `Robot`... wait, lowercase in schema: `robot` |
| Pirate    | `pirate`      |

### Home screen menu order
After this story, `buildHomeChoices` produces (for non-empty domain list):
1. domain entries…
2. [Separator]
3. ➕  Create new domain
4. 🗄  View archived domains
5. ⚙️  Settings             ← NEW
6. [Separator]
7. ☕  Buy me a coffee
8. 🚪  Exit

### Inquirer usage
- Language: `input` from `@inquirer/prompts` with `default: currentLanguage`
- Tone: `select` with `{ name: 'Normal', value: 'normal' }` etc., `default: currentTone`
- Navigation: `select` with Separator + Save + Back choices (same pattern as coffee screen)

## Dev Agent Record

### Implementation Notes
- `showSettingsScreen` uses sequential prompts (input then select for tone then select for nav)
- Navigation select has a Separator above Save/Back to distinguish navigation from content
- `ExitPromptError` can be thrown at any prompt step; catch wraps the entire prompt sequence

### Senior Developer Review (AI)
**Outcome:** Changes Requested | **Date:** 2026-03-15
**Action Items:** 2 fixed

- [x] [M3] `writeSettings()` return value discarded — silent failure on save; fixed to log error and still navigate home
- [x] [L1] No test for `writeSettings` failure path — added

### Completion Notes
- All tests pass (307/307)
- Full regression suite passes after review fixes

## File List
- src/screens/settings.ts
- src/screens/settings.test.ts
- src/screens/home.ts
- src/router.ts

## Change Log
- 2026-03-15: Story 5.2 implemented — Settings screen, home menu entry, router wiring
