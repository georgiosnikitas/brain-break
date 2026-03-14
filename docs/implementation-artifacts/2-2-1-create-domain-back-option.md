---
Story: 2.2.1
Title: Create Domain — Back Option
Status: done
Epic: 2 — Domain Management
Parent: 2.2 Create New Domain
Created: 2026-03-14
---

# Story 2.2.1: Create Domain — Back Option

## Story

As a user,
I want the create-domain screen to let me type a domain name or press Ctrl+C to go back,
So that I can return to the home screen without being forced to create a domain.

## Acceptance Criteria

- [x] AC1: Selecting "Create new domain" from the home screen shows an `input` prompt with message `'New domain name (Ctrl+C to go back):'`
- [x] AC2: Pressing Ctrl+C (ExitPromptError) returns to the home screen without creating any domain file
- [x] AC3: Entering a valid name proceeds to the existing slugify, duplicate-check, and writeDomain flow unchanged (all existing AC from 2.2 still hold)

## Tasks / Subtasks

- [x] Task 1: Update `src/screens/create-domain.ts` (AC: 1, 2, 3)
  - [x] 1.1 Update `input` prompt message to `'New domain name (Ctrl+C to go back):'`
  - [x] 1.2 Wrap the `input` call in a `try/catch` for `ExitPromptError`; return silently on catch
  - [x] 1.3 Remove `select` import and all `select`-related logic (no intermediate menu)

- [x] Task 2: Update `src/screens/create-domain.test.ts` (AC: 1, 2, 3)
  - [x] 2.1 Remove `mockSelect` — `vi.mock('@inquirer/prompts')` only exports `input`
  - [x] 2.2 Remove `mockSelect.mockReset()` from `beforeEach`
  - [x] 2.3 Add test: when `mockInput` rejects with `ExitPromptError`, `showCreateDomainScreen` resolves undefined and no domain file is written
  - [x] 2.4 Existing tests require no priming change (no more `mockSelect.mockResolvedValueOnce('enter')` calls needed)

## Dev Notes

- No new prompts added — only the `input` prompt message was updated to hint at Ctrl+C for back
- `ExitPromptError` (from `@inquirer/core`) is caught on the `input` call and returns silently; the home screen `while(true)` loop naturally re-displays after `showCreateDomainScreen()` returns
- `vi.mock('@inquirer/prompts', ...)` only needs to export `input` — no `select` mock required
- No new dependencies required; the entire back behavior is handled by the existing `ExitPromptError` pattern already used in `home.ts`

## Dev Agent Record

### Implementation Plan
Updated the `input` prompt message in `showCreateDomainScreen` to hint at Ctrl+C for back. The `ExitPromptError` catch block returns silently; the home screen `while(true)` loop handles the navigation back naturally. No intermediate `select` prompt — 2-step flow: home → input.

### Debug Log
_Initial implementation used a 3-step `select` flow (home → select menu → input). Pivoted to 2-step input-only flow after user review._

### Completion Notes
All tasks complete. 1 new test added (ExitPromptError on input → returns undefined, no domain written). Full test suite: 258 tests pass. `tsc --noEmit` clean.

Code review findings addressed:
- ✅ Fixed [Medium]: Added `docs/planning-artifacts/epics.md` and `docs/planning-artifacts/prd.md` to File List
- ✅ Fixed [High]: Updated story ACs, Tasks, Dev Notes, and prd.md to reflect the 2-step input-only implementation (pivot from original 3-step select flow)

## File List

- src/screens/create-domain.ts (modified)
- src/screens/create-domain.test.ts (modified)
- docs/planning-artifacts/epics.md (modified)
- docs/planning-artifacts/prd.md (modified)

## Change Log

- 2026-03-14: Story created and implemented — George
- 2026-03-14: Post-pivot: updated ACs, Tasks, Dev Notes, and planning artifacts to reflect 2-step input-only flow (removed `select` prompt approach) — George
