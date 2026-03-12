---
Story: 2.2
Title: Create New Domain
Status: done
Epic: 2 — Domain Management
Created: 2026-03-07
---

# Story 2.2: Create New Domain

## Story

As a user,
I want to create a new domain by typing any free-text topic name from the home screen,
So that I can immediately start getting quiz questions on any technical subject I choose.

## Acceptance Criteria

- [x] AC1: Selecting "Create new domain" prompts for a free-text name
- [x] AC2: The typed name is slugified and a new domain file is written to `~/.brain-break/<slug>.json` with `defaultDomainFile()` values
- [x] AC3: The home screen refreshes showing the new domain in the active list after creation
- [x] AC4: If the slug already exists (active or archived), the user is informed and returned to the home screen without creating a duplicate file
- [x] AC5: If the name field is left empty (or resolves to an empty slug), a validation message is shown and the user is re-prompted

## Tasks / Subtasks

- [x] Task 1: Implement `src/screens/create-domain.ts` (AC: 1, 2, 4, 5)
  - [x] 1.1 Export `validateDomainName(name: string): string | true` — returns error message for empty/blank input or a name whose slug resolves to empty; returns `true` otherwise
  - [x] 1.2 Use `input` from `@inquirer/prompts` with `validate: validateDomainName`; catch `ExitPromptError` and return silently
  - [x] 1.3 After getting `name`, call `slugify(name.trim())` to produce `slug`
  - [x] 1.4 Call `listDomains()`; if slug matches any existing entry (including archived), print a warning via `warn()` and return without writing
  - [x] 1.5 Call `writeDomain(slug, defaultDomainFile())`; on failure print error via `errorFmt()` and return
  - [x] 1.6 On success print confirmation via `success()`

- [x] Task 2: Wire `router.showCreateDomain()` (AC: 1, 3)
  - [x] 2.1 Import `showCreateDomainScreen` from `./screens/create-domain.js`
  - [x] 2.2 Replace stub body with `await showCreateDomainScreen()`

- [x] Task 3: Write co-located tests `src/screens/create-domain.test.ts` (AC: 2, 4, 5)
  - [x] 3.1 `validateDomainName('')` returns an error string (AC5)
  - [x] 3.2 `validateDomainName('   ')` (whitespace only) returns an error string (AC5)
  - [x] 3.3 `validateDomainName('---')` (resolves to empty slug) returns an error string (AC5)
  - [x] 3.4 `validateDomainName('Spring Boot microservices')` returns `true` (AC5)
  - [x] 3.5 Screen integration: `showCreateDomainScreen()` creates file when slug is new (AC2)
  - [x] 3.6 Screen integration: does not create file and returns when slug already exists (AC4)

## Dev Notes

- Follow `src/screens/home.ts` patterns: import from `@inquirer/prompts`, catch `ExitPromptError`, use format helpers
- Use `_setDataDir()` from `domain/store.ts` in tests to isolate file I/O (same pattern as `store.test.ts`)
- Mock `@inquirer/prompts` in integration tests using `vi.mock` — vitest hoists mocks automatically
- `listDomains()` already returns archived entries; no extra filtering needed for duplicate check
- `defaultDomainFile()` from `domain/schema.ts` is the factory to use on creation
- The `input` validator runs before the value is returned, so re-prompting on empty input is automatic; no manual loop needed

## Dev Agent Record

### Implementation Plan
Implemented `validateDomainName` as a pure exported function for testability. `showCreateDomainScreen` uses `input` from `@inquirer/prompts` with the validator inline, then checks `listDomains()` for duplicate slugs (including archived), writes via `writeDomain`, and prints outcome using format helpers.

### Debug Log
_No issues encountered_

### Completion Notes
All 8 tasks/subtasks complete. 9 tests total (5 unit + 4 integration). Full test suite (247 tests) passes. `tsc --noEmit` clean.

Code review findings addressed:
- ✅ Fixed [High]: `listDomains()` failure now causes early return with error — prevents silent data loss / overwrite
- ✅ Fixed [Medium]: Duplicate-exists test now asserts `console.warn` was called AND verifies existing score (999) is preserved
- ✅ Fixed [Medium]: Added `package-lock.json` to File List
- ✅ Fixed [Low]: Warning output changed from `console.log` to `console.warn` for correct output channel
- ✅ Fixed [Low]: Added test for `listDomains()` failure path (ENOTDIR → early return)

Code review 2 findings addressed:
- ✅ Fixed [Medium]: Tightened `validateDomainName` error assertions — now assert non-empty string (prevents empty-string false-positive)
- ✅ Fixed [Low]: Replaced dynamic `import('../domain/store.js')` inside test bodies with top-level import
- ✅ Fixed [Low]: Updated suite test count from 96 → 247

## File List

- src/screens/create-domain.ts (new)
- src/screens/create-domain.test.ts (new)
- src/router.ts (modified)
- package-lock.json (modified)

## Change Log

- 2026-03-07: Story created and implemented — George
