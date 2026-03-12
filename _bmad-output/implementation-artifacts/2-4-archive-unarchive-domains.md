---
Story: 2.4
Title: Archive & Unarchive Domains
Status: done
Epic: 2 — Domain Management
Created: 2026-03-07
---

# Story 2.4: Archive & Unarchive Domains

## Story

As a user,
I want to archive domains I'm not currently using and unarchive them later to resume exactly where I left off,
So that my active domain list stays focused without losing any history or progress.

## Acceptance Criteria

- [x] AC1: Each active domain on the home screen has an "Archive [slug]" action; selecting it sets `meta.archived: true`, saves atomically, and the home screen refreshes without that domain
- [x] AC2: Selecting "View archived domains" shows a list of all archived domains with score and question count; "Back" returns to the home screen
- [x] AC3: Selecting "Unarchive" on an archived domain sets `meta.archived: false`, saves atomically, and the domain reappears in the active list on the home screen with all data intact
- [x] AC4: All history, score, difficulty level, and streak data are preserved through an archive/unarchive cycle

## Tasks / Subtasks

- [x] Task 1: Extend `HomeAction` and `buildHomeChoices` in `src/screens/home.ts` (AC: 1)
  - [x] 1.1 Add `{ action: 'archive'; slug: string }` to the `HomeAction` union
  - [x] 1.2 In `buildHomeChoices`, push `{ name: 'Archive [slug]', value: { action: 'archive', slug } }` immediately after each domain entry
  - [x] 1.3 In `showHomeScreen`, handle `action === 'archive'`: call `router.archiveDomain(answer.slug)` and continue the loop

- [x] Task 2: Add `router.archiveDomain(slug)` (AC: 1)
  - [x] 2.1 Export `archiveDomain(slug: string): Promise<void>` in `router.ts`
  - [x] 2.2 Body: `readDomain(slug)` → merge `meta.archived: true` → `writeDomain`; on `readDomain` failure print warning and return; on `writeDomain` failure print error and return

- [x] Task 3: Create `src/screens/archived.ts` (AC: 2, 3, 4)
  - [x] 3.1 Export `type ArchivedAction = { action: 'unarchive'; slug: string } | { action: 'back' }`
  - [x] 3.2 Export pure `buildArchivedChoices(entries: HomeEntry[]): Array<{ name: string; value: ArchivedAction } | Separator>` — one "Unarchive [slug] (score · questions)" choice per entry, then separator, then "Back"
  - [x] 3.3 Export `showArchivedScreen(): Promise<void>` — calls `listDomains()`, filters archived non-corrupted entries, reads each for score/totalQuestions; renders with `select`; handle `back` → return; handle `unarchive`: `readDomain` → set `archived: false` → `writeDomain`, re-render loop

- [x] Task 4: Wire `router.showArchived()` (AC: 2)
  - [x] 4.1 Import `showArchivedScreen` from `./screens/archived.js`
  - [x] 4.2 Replace stub body with `await showArchivedScreen()`

- [x] Task 5: Write co-located tests (AC: 1, 2, 3, 4)
  - [x] 5.1 `src/screens/home.test.ts` additions: `buildHomeChoices` with one domain includes an `archive` action for that domain; archive action comes after select for same slug
  - [x] 5.2 `src/screens/archived.test.ts`: `buildArchivedChoices([])` returns only "Back"; with entries shows unarchive choices then "Back"
  - [x] 5.3 `showArchivedScreen` integration: unarchive sets `meta.archived: false` and preserves score/history (AC4); back returns without changes

## Dev Notes

- `archiveDomain` lives in `router.ts` (thin logic, no dedicated screen needed)
- Reuse `HomeEntry` type from `home.ts` for archived entries (same slug/score/totalQuestions shape)
- `filterActiveDomains` in `home.ts` already excludes archived — home list auto-refreshes on loop iteration
- Use `_setDataDir` for test isolation; mock `@inquirer/prompts` in integration tests
- `ExitPromptError` must be caught in `showArchivedScreen` like other screens

## Dev Agent Record

### Implementation Plan
`archiveDomain` is a thin read-modify-write in `router.ts`. `home.ts` gets `{ action: 'archive' }` in the union and an archive item per domain. `archived.ts` follows the same `select`+loop pattern as `home.ts`. `filterArchivedDomains` mirrors `filterActiveDomains`; `buildArchivedChoices` mirrors `buildHomeChoices`.

### Debug Log
_No issues encountered_

### Completion Notes
All 13 tasks/subtasks complete. 10 new tests (archived.test.ts ×8 + home.test.ts ×2). Full suite 247/247 passes. `tsc --noEmit` clean.

## File List

- src/screens/home.ts (modified)
- src/screens/home.test.ts (modified)
- src/screens/archived.ts (new)
- src/screens/archived.test.ts (new)
- src/router.ts (modified)

## Change Log

- 2026-03-07: Story created and implemented — George
- 2026-03-12: Code review 2 fixes applied — Amelia
  - ✅ Note [Medium]: `archiveDomain` already had 3 tests in `router.test.ts` (happy path, read failure, write failure) — M1 confirmed covered
  - ✅ Fixed [Low]: Updated suite count from 122 → 248
  - ✅ Fixed [Low]: Added `ExitPromptError` test to `showArchivedScreen`
  - ✅ Fixed [Low]: `router.archiveDomain` warn/error channel confirmed correct and tested
