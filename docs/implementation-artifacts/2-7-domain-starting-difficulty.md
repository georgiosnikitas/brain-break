---
Story: 2.7
Title: Domain Starting Difficulty
Status: done
Epic: 2 — Domain Management
Created: 2026-03-25
GitHub-Issue: 46
---

# Story 2.7: Domain Starting Difficulty

## Story

As a user,
I want to select a starting difficulty level when creating a new domain,
So that I can begin quizzing at a level that matches my current knowledge instead of always starting at level 2.

## Acceptance Criteria

- [x] AC1: After entering a domain name on the create-domain screen, a difficulty selection prompt appears with options: 1 (Beginner), 2 (Elementary), 3 (Intermediate), 4 (Advanced), 5 (Expert) — navigated via arrow keys, defaulting to level 2 (Elementary)
- [x] AC2: Selecting a difficulty level and pressing Enter shows the Save/Back navigation prompt (existing behavior)
- [x] AC3: When Save is selected, the new domain file is created with `meta.difficultyLevel` set to the user-selected level and `meta.startingDifficulty` set to the same value
- [x] AC4: Pressing Ctrl+C on the difficulty selection prompt returns the user to the home screen without creating a domain
- [x] AC5: `DomainMetaSchema` includes a `startingDifficulty` field (integer, 1–5) — set once at creation, never mutated
- [x] AC6: `defaultDomainFile(startingDifficulty?)` accepts an optional parameter; when provided, both `difficultyLevel` and `startingDifficulty` are set to it; when omitted, both default to 2
- [x] AC7: `readDomain()` ENOENT fallback continues to call `defaultDomainFile()` without arguments (startingDifficulty defaults to 2)
- [x] AC8: The stats dashboard displays "Starting difficulty:" (number + label) as a separate line above "Current difficulty:" (renamed from "Difficulty:")
- [x] AC9: The `difficultyLabel()` function uses "Elementary" for level 2 (not "Easy"), matching the PRD terminology
- [x] AC10: All existing tests pass; new tests cover the startingDifficulty field, defaultDomainFile parameter, difficulty selection prompt, and stats display changes

## Tasks / Subtasks

- [x] Task 1: Add `startingDifficulty` to schema and update factory (AC: 5, 6, 7)
  - [x] 1.1 Add `startingDifficulty: z.number().int().min(1).max(5)` to `DomainMetaSchema` in `src/domain/schema.ts` (line 25, after `difficultyLevel`)
  - [x] 1.2 Update `defaultDomainFile()` signature to `defaultDomainFile(startingDifficulty: number = 2): DomainFile` — set both `meta.difficultyLevel` and `meta.startingDifficulty` to the parameter value
  - [x] 1.3 `readDomain()` in `store.ts` (line 65) already calls `defaultDomainFile()` with no args — no change needed, but verify it still compiles

- [x] Task 2: Fix `difficultyLabel()` level 2 label (AC: 9)
  - [x] 2.1 In `src/screens/stats.ts` (line 24), change `'2 — Easy'` to `'2 — Elementary'`
  - [x] 2.2 In `src/utils/format.ts` (line 28), change `chalk.green('Easy')` to `chalk.green('Elementary')` in `colorDifficultyLevel()`

- [x] Task 3: Add difficulty selection to create-domain screen (AC: 1, 2, 3, 4)
  - [x] 3.1 In `src/screens/create-domain.ts`, after the `input()` call (line 23) and before the Save/Back `select()` (line 26), insert a new `select()` for difficulty level:
    ```typescript
    const difficulty = await select<number>({
      message: 'Starting difficulty:',
      choices: [
        { name: '1 — Beginner', value: 1 },
        { name: '2 — Elementary', value: 2 },
        { name: '3 — Intermediate', value: 3 },
        { name: '4 — Advanced', value: 4 },
        { name: '5 — Expert', value: 5 },
      ],
      default: 2,
      theme: menuTheme,
    })
    ```
  - [x] 3.2 Update the `writeDomain()` call (line 51) to pass the selected difficulty: `writeDomain(slug, defaultDomainFile(difficulty))`

- [x] Task 4: Update stats dashboard display (AC: 8)
  - [x] 4.1 In `src/screens/stats.ts`, in the `total === 0` branch (around line 101), change:
    `console.log(bold('Difficulty:') + ...)` to two lines:
    ```typescript
    console.log(bold('Starting difficulty:') + ` ${difficultyLabel(meta.startingDifficulty)}`)
    console.log(bold('Current difficulty:') + ` ${difficultyLabel(meta.difficultyLevel)}`)
    ```
  - [x] 4.2 In the `else` branch (around line 115), apply the same rename and add starting difficulty line

- [x] Task 5: Update tests (AC: 10)
  - [x] 5.1 `src/domain/schema.test.ts` — update `validMeta` fixture to include `startingDifficulty: 3` (or appropriate value); add tests: `defaultDomainFile()` returns `startingDifficulty: 2`, `defaultDomainFile(4)` returns both `difficultyLevel: 4` and `startingDifficulty: 4`; add boundary validation tests for `startingDifficulty` (reject 0, reject 6)
  - [x] 5.2 `src/screens/create-domain.test.ts` — update all `mockSelect` chains: currently mock ONE `select` call (Save/Back), now mock TWO: first for difficulty (return 2 or other level), then for Save/Back. Add a new test that creates a domain with a non-default difficulty (e.g. 4) and asserts the written file has `meta.difficultyLevel: 4` and `meta.startingDifficulty: 4`
  - [x] 5.3 `src/screens/stats.test.ts` — update `difficultyLabel` test: `difficultyLabel(2)` now returns `'2 — Elementary'` (not `'2 — Easy'`). Update stats display tests to assert "Starting difficulty:" and "Current difficulty:" lines appear (instead of single "Difficulty:" line)
  - [x] 5.4 Update regression test snapshots in `src/__snapshots__/regression.test.ts.snap` — values `"Difficulty: 2 — Easy"` must change to `"Starting difficulty: 2 — Elementary"` + `"Current difficulty: 2 — Elementary"`

## Dev Notes

### Exact Files to Modify

| File | Action | Lines |
|---|---|---|
| `src/domain/schema.ts` | Add `startingDifficulty` to `DomainMetaSchema`; update `defaultDomainFile()` signature | L25 (schema), L74–88 (factory) |
| `src/screens/create-domain.ts` | Insert difficulty `select()` between name input and Save/Back; pass difficulty to `defaultDomainFile()` | L23–26 (insert), L51 (call) |
| `src/screens/stats.ts` | Fix label "Easy" → "Elementary"; rename "Difficulty:" → split into "Starting difficulty:" + "Current difficulty:" | L24 (label), L101 + L115 (display) |
| `src/utils/format.ts` | Fix `colorDifficultyLevel` level 2: "Easy" → "Elementary" | L28 |
| `src/domain/schema.test.ts` | Add `startingDifficulty` to fixtures; test factory param; test schema validation | L5 (validMeta), L55+ (factory tests) |
| `src/screens/create-domain.test.ts` | Mock TWO selects per test (difficulty + nav); add non-default difficulty test | Throughout |
| `src/screens/stats.test.ts` | Update `difficultyLabel(2)` assertion; update display assertions | L107, display tests |
| `src/__snapshots__/regression.test.ts.snap` | Update snapshot values for new label | L11, L26 |

### Key Patterns & Imports

**create-domain.ts** already imports `select`, `Separator` from `@inquirer/prompts` and `menuTheme` from format — no new imports needed.

**Test mock pattern** (`create-domain.test.ts`):
```typescript
const mockSelect = vi.fn()
const mockInput = vi.fn()
vi.mock('@inquirer/prompts', () => ({
  select: (...args: unknown[]) => mockSelect(...args),
  input: (...args: unknown[]) => mockInput(...args),
  Separator: vi.fn(),
}))
```
When the screen calls `select()` twice (difficulty then nav), the mock needs two `.mockResolvedValueOnce()` calls in sequence:
```typescript
mockSelect.mockResolvedValueOnce(2)    // difficulty
mockSelect.mockResolvedValueOnce('save') // nav
```

**Schema test fixture** (`schema.test.ts` line 5):
```typescript
const validMeta = {
  score: 100,
  difficultyLevel: 3,
  startingDifficulty: 3,  // ← ADD THIS
  streakCount: 2,
  ...
}
```

### Label Discrepancy — "Easy" vs "Elementary"

The PRD and epics consistently use "Elementary" for level 2. The current implementation in `stats.ts` and `format.ts` uses "Easy". This story fixes the discrepancy to match the PRD — "Elementary" is the canonical term.

Affected locations:
- `src/screens/stats.ts` line 24: `'2 — Easy'` → `'2 — Elementary'`
- `src/utils/format.ts` line 28: `chalk.green('Easy')` → `chalk.green('Elementary')`
- `src/screens/stats.test.ts` line 107: `'2 — Easy'` → `'2 — Elementary'`
- `src/__snapshots__/regression.test.ts.snap` lines 11, 26: `"Difficulty: 2 — Easy"` → updated

### Backward Compatibility

Existing domain files on disk will NOT have a `startingDifficulty` field. Two paths handle this:

1. **Zod validation in `readDomain()`** — adding a required field to `DomainMetaSchema` will cause existing files to fail validation, returning an error result. This is by design (NFR3 says corrupted files get reset).
2. **Alternative (recommended):** Make `startingDifficulty` optional in the schema with a default: `startingDifficulty: z.number().int().min(1).max(5).default(2)`. This way, existing domain files load successfully with `startingDifficulty` defaulting to 2. This is the safer approach — it avoids resetting users' existing domains.

**Use `.default(2)` on the Zod field** to preserve backward compatibility.

### References

- [Source: docs/planning-artifacts/prd.md#Feature 1 — Domain Management]
- [Source: docs/planning-artifacts/prd.md#Feature 2 — Adaptive Difficulty]
- [Source: docs/planning-artifacts/prd.md#Feature 7 — Stats Dashboard]
- [Source: docs/planning-artifacts/epics.md#FR2]
- [Source: docs/planning-artifacts/epics.md#FR7]
- [Source: docs/planning-artifacts/epics.md#FR13]
- [Source: docs/planning-artifacts/epics.md#Story 2.2]
- [Source: docs/planning-artifacts/epics.md#Story 4.2]
- [Source: docs/planning-artifacts/architecture.md#Gap Analysis]
- [GitHub Issue: #46]

## Dev Agent Record

### Implementation Plan
Added `startingDifficulty` field to `DomainMetaSchema` with `.default(2)` for backward compatibility with existing domain files. Updated `defaultDomainFile()` to accept an optional `startingDifficulty` parameter that sets both `difficultyLevel` and `startingDifficulty`. Inserted a difficulty `select()` prompt in the create-domain flow between the name input and Save/Back navigation. Split the single "Difficulty:" line in stats into "Starting difficulty:" and "Current difficulty:". Fixed the "Easy" → "Elementary" label discrepancy across `stats.ts`, `format.ts`, and all related tests.

### Debug Log
Two additional test files needed updating beyond the story spec: `src/utils/format.test.ts` (asserted "Easy" for level 2 in `colorDifficultyLevel`) and `src/screens/quiz.test.ts` (asserted "Easy" in quiz feedback output). Both fixed to use "Elementary".

Code review follow-up fixes: strengthened `src/screens/stats.test.ts` to assert the explicit `Starting difficulty:` and `Current difficulty:` lines required by AC8, and corrected the create-domain nav `ExitPromptError` test so the rejection happens on the Save/Back prompt rather than the preceding difficulty prompt.

### Completion Notes
All 5 tasks complete. Code review findings resolved: stats tests now verify the explicit starting/current difficulty labels and the create-domain nav Ctrl+C test now exercises the correct prompt. Full test suite passes with zero regressions. `tsc --noEmit` clean. New tests added: `defaultDomainFile()` returns `startingDifficulty: 2`, `defaultDomainFile(4)` sets both fields, boundary validation for `startingDifficulty` (reject 0/6), backward compat `.default(2)`, and non-default difficulty domain creation.

## File List
- src/domain/schema.ts (modified)
- src/screens/create-domain.ts (modified)
- src/screens/stats.ts (modified)
- src/utils/format.ts (modified)
- src/domain/schema.test.ts (modified)
- src/screens/create-domain.test.ts (modified)
- src/screens/stats.test.ts (modified)
- src/screens/quiz.test.ts (modified)
- src/utils/format.test.ts (modified)
- src/regression.test.ts (modified)
- src/__snapshots__/regression.test.ts.snap (modified)

## Change Log

- 2026-03-25: Story created — George
- 2026-03-25: Implemented — all 5 tasks complete, 637 tests passing
- 2026-03-25: Addressed code review findings — added explicit stats label assertions and fixed nav Ctrl+C test coverage
