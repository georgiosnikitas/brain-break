---
Story: 2.8
Title: Duplicate Domain Validation
Status: done
Epic: 2 — Domain Management
Created: 2026-04-03
FR: FR47
---

## Story 2.8: Duplicate Domain Validation

## Story

As a user,
I want the app to detect duplicate domain names during creation and show a context-specific message distinguishing active from archived duplicates,
So that I understand why creation was blocked and know exactly what to do — either pick a different name or unarchive the existing domain.

## Acceptance Criteria

- [x] AC1: After the user enters a domain name that slugifies to the same slug as an existing **active** domain, the app displays: `A domain named '<name>' already exists.` and returns the user to the `New domain name:` input prompt — the create flow is not exited
- [x] AC2: After the user enters a domain name that slugifies to the same slug as an existing **archived** domain, the app displays: `A domain named '<name>' already exists in your archived domains.` and returns the user to the `New domain name:` input prompt — the create flow is not exited
- [x] AC3: The duplicate check uses the **slugified** form of the entered name for comparison — visually distinct inputs that normalize to the same slug (e.g. `Python 3` and `python-3`) are detected as duplicates
- [x] AC4: The duplicate check runs **immediately after name entry**, before the difficulty selection prompt — the user is not asked to select difficulty for a name that already exists
- [x] AC5: If the user enters a duplicate name and then re-enters a unique name, the flow continues normally to difficulty selection → Save/Back → domain creation
- [x] AC6: If `listDomains()` fails during the duplicate check, the existing error handling behavior is preserved — an error message is shown and the function returns
- [x] AC7: All existing tests pass; new tests cover: active duplicate → message + re-prompt, archived duplicate → distinct message + re-prompt, retry with valid name succeeds, slugified collision detected

## Tasks / Subtasks

- [x] Task 1: Move duplicate check before difficulty selection and add archived distinction (AC: 1, 2, 3, 4, 5, 6)
  - [x] 1.1 In `src/screens/create-domain.ts`, restructure `showCreateDomainScreen()`: wrap the name input in a loop that validates uniqueness immediately after entry. Move the `listDomains()` call and slug comparison to run right after the `input()` call and before the difficulty `select()`. Remove the duplicate check from its current position after the Save/Back nav.
  - [x] 1.2 In the duplicate check block, distinguish between active and archived matches: iterate `listResult.data` to find an entry where `e.slug === slug`. If found and `!e.corrupted && e.meta.archived === true`, display the archived-specific message using `warn()`. If found and not archived (or corrupted), display the active-specific message using `warn()`. In both cases, loop back to the name input prompt — do NOT return from the function.
  - [x] 1.3 When no duplicate is found, break out of the loop and proceed to difficulty selection, Save/Back nav, and `writeDomain()` as before.
  - [x] 1.4 Preserve existing `ExitPromptError` handling (Ctrl+C on the name input should still return from the function silently). Preserve `listDomains()` failure handling (error message + return).

- [x] Task 2: Update tests for duplicate domain validation (AC: 7)
  - [x] 2.1 In `src/screens/create-domain.test.ts`, update the test `"does not overwrite existing domain and warns when slug already exists"`: the `warn` message should now contain the user-typed name (not the slug); the mock sequence changes — `mockInput` is called **twice** (first returns duplicate name, second returns unique name), then `mockSelect` for difficulty and nav. Assert the warn message matches `A domain named '<name>' already exists.` and the domain is ultimately created with the second name.
  - [x] 2.2 Update the test `"does not create a file when slug matches an archived domain"`: similar restructure — `mockInput` called twice (first archived duplicate, second unique), `mockSelect` for difficulty and nav. Assert the warn message matches `A domain named '<name>' already exists in your archived domains.`. Assert no new file is created for the archived slug, and the second unique domain is created.
  - [x] 2.3 Add a test: `"detects duplicate via slugified comparison"` — pre-create a domain with slug `python-3`, enter name `Python 3` (different text, same slug). Assert the active duplicate message is shown and the user is re-prompted.
  - [x] 2.4 Verify all existing tests still pass — the mock sequence changes (duplicate check moves before difficulty) may require adjusting mock call order in tests that don't involve duplicates. In practice, non-duplicate tests should be unaffected because the loop exits on first try when no duplicate exists.

## Dev Notes

### Architecture & Patterns

- **`Result<T>` pattern**: all store operations return `{ ok: true; data: T } | { ok: false; error: string }`. No raw throws in screen code.
- **DomainListEntry type**: `{ slug: string; meta: DomainMeta; corrupted: false } | { slug: string; corrupted: true }`. Check `!e.corrupted` before accessing `e.meta.archived`.
- **warn() / success() / error()**: imported from `src/utils/format.ts` — use `warn()` for duplicate messages (yellow warning style).
- **ExitPromptError**: caught in the existing try/catch — Ctrl+C during any prompt returns silently. The new loop must remain inside this try/catch.

### Exact File to Modify

| File | Action | Current Lines |
| --- | --- | --- |
| `src/screens/create-domain.ts` | Restructure: wrap name input in a validation loop; move duplicate check before difficulty; distinguish active vs archived | L16–82 (full function body) |
| `src/screens/create-domain.test.ts` | Update 2 existing tests, add 1 new test | L106–148 (duplicate tests) |

### Current Code Structure (`create-domain.ts`)

```text
L16  export async function showCreateDomainScreen()
L17    clearAndBanner()
L18    try {
L19      const name = await input(...)        ← name entry
L24      const difficulty = await select(...)  ← difficulty selection
L40      if (difficulty === 'back') return
L42      const nav = await select(...)         ← Save/Back
L53      if (nav === 'back') return
L55      const slug = slugify(name)
L57      const listResult = await listDomains()  ← duplicate check HERE (too late)
L63      const exists = listResult.data.some(...)
L64      if (exists) { warn + return }
L67      const writeResult = await writeDomain(...)
L74    } catch (err) { ExitPromptError handling }
```

**Target structure after refactor:**

```text
L16  export async function showCreateDomainScreen()
L17    clearAndBanner()
L18    try {
         let name: string
         while (true) {                        ← NEW: validation loop
           name = await input(...)             ← name entry
           const slug = slugify(name)
           const listResult = await listDomains()
           if (!listResult.ok) { error + return }
           const match = listResult.data.find(e => e.slug === slug)
           if (match) {
             if (!match.corrupted && match.meta.archived) {
               warn('...archived message...')  ← NEW: archived-specific
             } else {
               warn('...active message...')    ← UPDATED: uses name not slug
             }
             continue                          ← NEW: re-prompt
           }
           break                               ← valid name, exit loop
         }
         const difficulty = await select(...)  ← unchanged
         ... Save/Back nav ...                 ← unchanged
         writeDomain(...)                      ← duplicate check removed from here
L74    } catch (err) { ExitPromptError handling }
```

### Test Mock Pattern

```typescript
const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
```

For re-prompt tests, chain `mockInput`:

```typescript
mockInput
  .mockResolvedValueOnce('duplicate-name')  // first attempt — triggers warning
  .mockResolvedValueOnce('unique-name')     // second attempt — succeeds
```

### Key Constraint

The duplicate check message must use the **user-typed name** (e.g. `Python 3`), not the slugified form (e.g. `python-3`), to match the PRD specification.

### References

- [Source: docs/planning-artifacts/prd.md — Feature 1, Home screen, create-domain paragraph]
- [Source: docs/planning-artifacts/epics.md — FR47, Story 2.2 ACs]
- [Source: src/screens/create-domain.ts — full function]
- [Source: src/screens/create-domain.test.ts — duplicate tests L106–148]
- [Source: src/domain/store.ts — listDomains() L91–113, DomainListEntry type]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Restructured `showCreateDomainScreen()` to wrap name input in a `while(true)` loop with slug-based duplicate check running immediately after name entry, before difficulty selection
- Active duplicates show: `A domain named "<name>" already exists.`
- Archived duplicates show: `A domain named "<name>" already exists in your archived domains.`
- Both cases loop back to name prompt (user stays in create flow)
- Removed the old duplicate check that ran after Save/Back nav
- ExitPromptError and listDomains failure handling preserved unchanged
- Updated 2 existing tests to use chained mockInput (duplicate → unique) and assert context-specific messages
- Added 1 new test for slugified collision detection (`Python 3` vs `python-3`)
- 886/886 tests pass — 0 regressions
- Code review findings addressed:
  - ✅ Fixed [Medium]: Added `docs/implementation-artifacts/2-8-duplicate-domain-validation.md` and `docs/implementation-artifacts/sprint-status.yaml` to File List for git/story audit completeness

- Planning docs synced to the shorter archived-duplicate message so runtime behavior and specs match.

### File List

- `docs/implementation-artifacts/2-8-duplicate-domain-validation.md` — modified (story status, AC completion, code review audit notes)
- `docs/planning-artifacts/epics.md` — modified (FR47 and Story 2.2 archived-duplicate wording aligned)
- `docs/planning-artifacts/prd.md` — modified (Feature 1 archived-duplicate wording aligned)
- `docs/implementation-artifacts/sprint-status.yaml` — modified (story and epic status sync)
- `src/screens/create-domain.ts` — modified (restructured duplicate check)
- `src/screens/create-domain.test.ts` — modified (2 tests updated, 1 test added)
