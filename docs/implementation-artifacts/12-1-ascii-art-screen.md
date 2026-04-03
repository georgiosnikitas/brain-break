# Story 12.1: ASCII Art Screen

Status: done

## Story

As a user,
I want to select an ASCII Art option from the domain sub-menu and see a FIGlet-rendered ASCII art banner of my domain name, colored in a cyan-to-magenta gradient,
So that I can enjoy a fun, personalized visual for my domain.

## Acceptance Criteria

1. A `🎨 ASCII Art` option appears in the domain sub-menu after `📊 Statistics` and before `🗄  Archive`
2. Selecting `🎨 ASCII Art` renders the domain name as ASCII art using the `figlet` npm package — no AI provider required
3. Each render randomly selects one font from a curated list of 14 FIGlet fonts (Standard, Big, Slant, Shadow, Doom, 3-D, Graffiti, Colossal, Roman, ANSI Shadow, Banner3-D, Ogre, Larry 3D, Star Wars)
4. The screen clears (`clearAndBanner()`) and displays a header: `🎨 ASCII Art — <domain>` using `header()` (same pattern as the Statistics screen)
5. The rendered ASCII art is displayed below the header, colored row-by-row using `lerpColor` from cyan (top, `t=0`) to magenta (bottom, `t=1`)
6. Below the art, a `🔄 Regenerate` choice, a separator, and a `←  Back` choice are displayed (same navigation pattern as the Statistics screen)
7. Selecting `🔄 Regenerate` rerenders the domain name immediately using a different font from the curated list
8. Selecting `←  Back` or pressing Ctrl+C returns the user to the domain sub-menu via `router.showDomainMenu(slug)`
9. Rendering is local and instant — no network calls, no loading spinner, no AI dependency
10. All new code has co-located tests; all existing tests pass with no regressions

## Tasks / Subtasks

- [x] Task 1: Install `figlet` and `@types/figlet` dependencies (AC: #2)
  - [x] Add `figlet@^1.11.0` to `dependencies` in `package.json`
  - [x] Add `@types/figlet@^1.7.0` to `devDependencies`
  - [x] Run `npm install` to update `package-lock.json`

- [x] Task 2: Define curated font list and `pickRandomFont(previousFont?)` helper (AC: #3, #7)
  - [x] Export `FIGLET_FONTS` array with 14 curated FIGlet fonts
  - [x] Export `pickRandomFont(previousFont?: string)` that returns a random font from the list and excludes the immediate previous font during regeneration

- [x] Task 3: (removed — originally added `buildAsciiArtPrompt()` to AI layer; replaced by local figlet rendering)

- [x] Task 4: (removed — originally added `generateAsciiArt()` to AI layer; replaced by local figlet rendering)

- [x] Task 5: Create `src/screens/ascii-art.ts` (AC: #2, #3, #4, #5, #6, #7, #8, #9)
  - [x] Create new file with the following exports:
    - `FIGLET_FONTS: string[]` — curated list of 14 FIGlet fonts
    - `pickRandomFont(previousFont?: string): string` — returns a random font from the list and avoids the immediate previous font during regeneration
    - `colorAsciiArt(art: string): string` — exported for testing
    - `showAsciiArtScreen(slug: string): Promise<void>` — main screen function
  - [x] `colorAsciiArt(art: string)`:
    1. Split art into lines
    2. Filter out empty trailing lines
    3. For each line, compute `t = row / (totalRows - 1)` (or `t = 0` if single row)
    4. Apply `gradientText(line, row, totalRows)` from `utils/format.ts` (reuse existing helper — it already calls `lerpColor` and handles `chalk.level < 3` fallback)
    5. Join with newlines and return
  - [x] `showAsciiArtScreen(slug: string)`:
    1. Track the previous font and pick the next font via `pickRandomFont(previousFont)`
    2. Render ASCII art via `figlet.textSync(slug, { font })`
    3. `clearAndBanner()`
    4. Print header: `console.log(header('🎨 ASCII Art — ' + slug))`
    5. Print empty line
    6. Print `colorAsciiArt(art)`
    7. Show a `select()` prompt with `[{ name: '🔄 Regenerate', value: 'regenerate' }, new Separator(), { name: '←  Back', value: 'back' }]`, using `menuTheme`
    8. On `regenerate`, loop and rerender immediately with a different font
    9. On `back` or `ExitPromptError` (Ctrl+C) → `await router.showDomainMenu(slug)` and return
  - [x] Imports: `figlet` from `figlet`; `select`, `Separator` from `@inquirer/prompts`; `ExitPromptError` from `@inquirer/core`; `header`, `menuTheme`, `gradientText` from `../utils/format.js`; `clearAndBanner` from `../utils/screen.js`; `* as router` from `../router.js`

- [x] Task 6: Create `src/screens/ascii-art.test.ts` (AC: #4, #5, #6, #7, #8, #10)
  - [x] Mock dependencies following existing patterns (see `stats.test.ts`):
    ```typescript
    vi.mock('figlet', () => ({ default: { textSync: vi.fn(() => 'FIGLET_ART') } }))
    vi.mock('@inquirer/prompts', () => ({ select: vi.fn(), Separator: vi.fn() }))
    vi.mock('../utils/format.js', () => ({
      header: vi.fn((s: string) => s),
      menuTheme: {},
      gradientText: vi.fn((text: string) => text),
    }))
    vi.mock('../utils/screen.js', () => ({ clearAndBanner: vi.fn() }))
    vi.mock('../router.js', () => ({ showDomainMenu: vi.fn() }))
    ```
  - [x] Test `pickRandomFont`:
    - Returns a string that is one of the curated fonts
  - [x] Test `colorAsciiArt`:
    - Single-line art calls `gradientText` with row=0, totalRows=1
    - Multi-line art calls `gradientText` for each row with correct row index and totalRows
    - Empty string returns empty string
    - Trailing empty lines are stripped before coloring
  - [x] Test `showAsciiArtScreen`:
    - Calls `figlet.textSync` with slug and selected font
    - Calls `clearAndBanner()`, prints header with domain slug, prints colored art, shows Regenerate and Back prompt
    - Regenerate rerenders the art immediately with a different font
    - Back selection → calls `router.showDomainMenu(slug)`
    - Ctrl+C (`ExitPromptError`) → calls `router.showDomainMenu(slug)`

- [x] Task 7: Add `'ascii-art'` action to domain sub-menu in `src/screens/domain-menu.ts` (AC: #1)
  - [x] Add `| { action: 'ascii-art' }` to the `DomainMenuAction` union type
  - [x] Insert `{ name: '🎨 ASCII Art', value: { action: 'ascii-art' } }` into `buildDomainMenuChoices()` after the `📊 Statistics` entry and before `🗄  Archive`
  - [x] Add handler in `handleDomainAction()`: `else if (answer.action === 'ascii-art') { await router.showAsciiArt(slug) }`

- [x] Task 8: Add `showAsciiArt()` to `src/router.ts` (AC: #7)
  - [x] Import `showAsciiArtScreen` from `./screens/ascii-art.js`
  - [x] Add exported function:
    ```typescript
    export async function showAsciiArt(slug: string): Promise<void> {
      await showAsciiArtScreen(slug)
    }
    ```

- [x] Task 9: Update `src/screens/domain-menu.test.ts` (AC: #1, #9)
  - [x] Add `showAsciiArt: vi.fn()` to the router mock
  - [x] Test: `buildDomainMenuChoices()` includes `🎨 ASCII Art` after `📊 Statistics` and before `🗄  Archive`
  - [x] Test: selecting `ascii-art` action calls `router.showAsciiArt(slug)`

- [x] Task 10: Update `src/router.test.ts` (if exists) or verify in integration (AC: #7, #9)
  - [x] Test: `showAsciiArt(slug)` delegates to `showAsciiArtScreen(slug)`

- [x] Task 11: Run full test suite and verify zero regressions (AC: #9)

## Dev Notes

### Architecture Requirements

- [Source: docs/planning-artifacts/prd.md#Feature 18 — ASCII Art]
- [Source: docs/planning-artifacts/epics.md#Epic 12, Story 12.1]
- New domain sub-menu action → FIGlet-rendered ASCII art banner → gradient-colored display → Regenerate/Back navigation
- Follows the same shell and header pattern as `stats.ts`, but keeps the user on the screen for immediate regeneration before returning to the domain menu

### Screen Pattern (from stats.ts)

Current `buildDomainMenuChoices()` order:
1. Play
2. Challenge
3. History
4. Bookmarks
5. Statistics
6. Archive ← insert ASCII Art BEFORE this
7. Delete
8. Separator
9. Back

After change:
1. Play
2. Challenge
3. History
4. Bookmarks
5. Statistics
6. **ASCII Art** ← NEW
7. Archive
8. Delete
9. Separator
10. Back

Current `handleDomainAction()` uses if/else if chain — add `ascii-art` case.

### Router Pattern (from router.ts)

Simple delegation — one line:
```typescript
export async function showAsciiArt(slug: string): Promise<void> {
  await showAsciiArtScreen(slug)
}
```

### What This Story Does NOT Do

- Does NOT save or cache generated ASCII art
- Does NOT call any AI provider — uses the `figlet` npm package for local rendering
- Does NOT modify any existing screens except domain-menu.ts (adding menu item + handler)
- Does NOT change the `Result<T>` type or any other shared type

### Project Structure Notes

Files to create:
- `src/screens/ascii-art.ts`
- `src/screens/ascii-art.test.ts`

Files to modify:
- `package.json` — add `figlet` and `@types/figlet` dependencies
- `src/screens/domain-menu.ts` — add `ascii-art` action to type, choices, and handler
- `src/screens/domain-menu.test.ts` — add ASCII Art menu item and handler tests
- `src/router.ts` — add `showAsciiArt()` function and import

### Testing Standards

- Framework: `vitest` — co-located `*.test.ts` alongside source
- Use `vi.mock()` for module mocking, `vi.mocked()` for type-safe access
- `beforeEach` → `vi.clearAllMocks()`
- Current test count: ~897 tests — verify zero regressions after all changes
- Follow mocking patterns established in `stats.test.ts` and `domain-menu.test.ts`

### References

- [Source: docs/planning-artifacts/prd.md#Feature 18 — ASCII Art]
- [Source: docs/planning-artifacts/epics.md#Story 12.1]
- [Source: src/screens/stats.ts — screen pattern, header, back navigation]
- [Source: src/utils/format.ts — gradientText, lerpColor, header, CYAN, MAGENTA, menuTheme]
- [Source: src/utils/screen.ts — clearAndBanner]
- [Source: src/screens/domain-menu.ts — DomainMenuAction, buildDomainMenuChoices, handleDomainAction]
- [Source: src/router.ts — delegation pattern]

## Dev Agent Record

### File List

- `package.json` — added `figlet@^1.11.0` to dependencies, `@types/figlet@^1.7.0` to devDependencies
- `package-lock.json` — lockfile updated for `figlet` and `@types/figlet` installation
- `src/screens/ascii-art.ts` — **NEW** — `FIGLET_FONTS`, `pickRandomFont(previousFont?)`, `colorAsciiArt()`, `showAsciiArtScreen()` with regenerate loop
- `src/screens/ascii-art.test.ts` — **NEW** — 12 tests covering curated font selection, non-repeating font selection across repeated regenerations, colorAsciiArt, and showAsciiArtScreen
- `src/screens/domain-menu.ts` — added `ascii-art` to `DomainMenuAction`, choices, and handler
- `src/screens/domain-menu.test.ts` — updated choice count/indices, added ASCII Art action test, added router mock
- `src/router.ts` — added `showAsciiArt()` + import
- `src/router.test.ts` — added `showAsciiArt` delegation test + mock + import
- `src/ai/prompts.ts` — removed `buildAsciiArtPrompt()` (previously added, now replaced by figlet)
- `src/ai/prompts.test.ts` — removed 6 `buildAsciiArtPrompt` tests
- `src/ai/client.ts` — removed `generateAsciiArt()` (previously added, now replaced by figlet)
- `src/ai/client.test.ts` — removed 5 `generateAsciiArt` tests
- `docs/planning-artifacts/prd.md` — updated Feature 18 summary and edit history to match local FIGlet rendering
- `docs/planning-artifacts/epics.md` — updated Epic 12 summary and detailed story text to match FIGlet implementation
- `docs/planning-artifacts/ux-design-specification.md` — corrected loading behavior, domain navigation, Domain Menu order, and removed stale ASCII Art technical-debt note
- `docs/planning-artifacts/ux-cleanup-backlog.md` — marked ASCII Art integration resolved and recorded bookmark-ordering UX cleanup
- `src/screens/bookmarks.ts` — concurrent working-tree change: aligned bookmark ordering with History (newest-first)
- `src/screens/bookmarks.test.ts` — concurrent working-tree change: added newest-first ordering coverage for bookmarks

### Change Log

1. Installed `figlet@^1.11.0` and `@types/figlet@^1.7.0` — local FIGlet ASCII art rendering
2. Created `src/screens/ascii-art.ts` — `FIGLET_FONTS` (14 curated fonts), `pickRandomFont(previousFont?)`, `colorAsciiArt()` reuses `gradientText()` row-by-row, `showAsciiArtScreen()` renders via `figlet.textSync()` in a Regenerate/Back loop using the standard screen shell
3. Removed AI-based ASCII art code — `buildAsciiArtPrompt()` from prompts.ts, `generateAsciiArt()` from client.ts, and their associated tests (11 tests removed)
4. Added `🎨 ASCII Art` action to domain sub-menu between Statistics and Archive
5. Added `showAsciiArt(slug)` router delegation
6. Synchronized PRD, epic, and UX planning artifacts with the shipped FIGlet implementation and live menu routing
7. Recorded concurrent branch work that aligns Bookmarks ordering with History and captured it in UX cleanup documentation
8. Full test suite passes. Zero regressions.
9. Added `🔄 Regenerate` action to the ASCII Art screen — the screen loops, re-rendering with a different font each time, until the user selects Back or presses Ctrl+C. `pickRandomFont()` now accepts an optional `previousFont` parameter to avoid immediately reusing the same font.
