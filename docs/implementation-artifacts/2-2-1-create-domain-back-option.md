---
Story: 2.2.1
Title: Create Domain — Back Option
Status: review
Epic: 2 — Domain Management
Parent: 2.2 Create New Domain
Created: 2026-03-14
---

# Story 2.2.1: Create Domain — Back Option

## Story

As a user,
I want the create-domain screen to present a select-style prompt with "Enter domain name" and "Back" options,
So that I can return to the home screen without being forced to create a domain.

## Acceptance Criteria

- [ ] AC1: Selecting "Create new domain" from the home screen shows a `select` prompt with two options: "✏️  Enter domain name" and "←  Back"
- [ ] AC2: Selecting "←  Back" returns to the home screen without creating any domain file
- [ ] AC3: Selecting "✏️  Enter domain name" proceeds to the existing free-text name input flow unchanged (all existing AC from 2.2 still hold)

## Tasks / Subtasks

- [x] Task 1: Update `src/screens/create-domain.ts` (AC: 1, 2, 3)
  - [x] 1.1 Add `select` to the `@inquirer/prompts` import
  - [x] 1.2 Define `type CreateDomainAction = 'enter' | 'back'`
  - [x] 1.3 At the start of `showCreateDomainScreen`, show a `select` prompt (message: `'Create new domain'`) with choices `{ name: '✏️  Enter domain name', value: 'enter' }` and `{ name: '←  Back', value: 'back' }`; wrap in try/catch for `ExitPromptError`
  - [x] 1.4 If resolved action is `'back'`, return immediately without running the input prompt or any domain logic

- [x] Task 2: Update `src/screens/create-domain.test.ts` (AC: 1, 2, 3)
  - [x] 2.1 Replace `vi.mock('@inquirer/prompts')` stub to also export a `mockSelect` spy alongside the existing `mockInput` spy
  - [x] 2.2 Reset `mockSelect` in `beforeEach` alongside `mockInput`
  - [x] 2.3 Add test: when user selects `'back'`, no domain file is written and no `console.warn`/`console.error` is called
  - [x] 2.4 Add test: when user selects `'enter'` followed by a valid name, the domain file is created (ensures "Enter domain name" path still works end-to-end)
  - [x] 2.5 Update all existing `showCreateDomainScreen` tests to first resolve `mockSelect` with `'enter'` before resolving `mockInput` with the domain name

## Dev Notes

- Follow the `select` usage pattern from `src/screens/home.ts`: `import { select, Separator } from '@inquirer/prompts'` — no `Separator` needed here but the import pattern is the same
- The `ExitPromptError` catch block already wrapping the `input` call should be expanded to also wrap the new `select` call (or a single outer try/catch covers both)
- `vi.mock('@inquirer/prompts', ...)` must be updated to return both `input` and `select` spy references; vitest hoists the mock so both mocks are available from the top of the test file
- No new dependencies are required — `select` is already in `@inquirer/prompts`
- The inner `input` prompt logic (validation, slugify, duplicate check, writeDomain) must remain identical; only the entry point changes

## Dev Agent Record

### Implementation Plan
Added a `select` prompt as the entry point of `showCreateDomainScreen`. When user picks "back", the function returns immediately. When user picks "enter", the existing `input` prompt and domain creation logic runs unchanged. Both prompts are wrapped in their own `try/catch` for `ExitPromptError`.

### Debug Log
_No issues encountered_

### Completion Notes
All 6 tasks/subtasks complete. 2 new tests added (back path + enter-then-create path); 4 existing integration tests updated to prime `mockSelect` with `'enter'`. Full test suite: 259 tests pass (was 257). `tsc --noEmit` clean.

## File List

- src/screens/create-domain.ts (modified)
- src/screens/create-domain.test.ts (modified)

## Change Log

- 2026-03-14: Story created and implemented — George
