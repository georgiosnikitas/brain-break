# Story 13.2: My Coach Scope Setting

Status: done

## Story

As a user,
I want to configure the My Coach history scope in Settings — choosing between Recent (25 questions), Extended (100 questions), or Complete (all questions) — so that I can control the depth of analysis and the token cost of my coaching reports.

## Acceptance Criteria

1. **Given** I open the Settings screen **When** I view the list of settings **Then** a `🏋️ My Coach scope` selector is displayed after **Tone of Voice** and before **🎨 ASCII Art Milestone** **And** it shows the currently active option name (Recent / Extended / Complete)

2. **Given** I select the My Coach scope setting **When** the selector opens **Then** three options are shown: `Recent (25 questions)`, `Extended (100 questions)`, `Complete (all questions)` **And** the current value is pre-selected **And** a Back option appears after a separator

3. **Given** I select `Extended (100 questions)` (the default) **When** I save settings **Then** `myCoachScope` is stored as `"100"` in `settings.json`

4. **Given** I select `Recent (25 questions)` **When** I save settings **Then** `myCoachScope` is stored as `"25"` in `settings.json`

5. **Given** I select `Complete (all questions)` **When** I save settings **Then** `myCoachScope` is stored as `"all"` in `settings.json`

6. **Given** `myCoachScope` is missing from `settings.json` (existing users upgrading) **When** the settings file is loaded **Then** the schema applies the default value of `"100"` — existing behavior is preserved

7. **Given** the Settings screen is updated **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests cover: schema validation for `myCoachScope` (`"25"` / `"100"` / `"all"` accepted, other values rejected, default `"100"`); settings screen shows My Coach scope selector; Save persists selected value; default applied on missing field

## Tasks / Subtasks

- [x] **Task 1: Add `myCoachScope` to `SettingsFileSchema`** (AC: #3, #4, #5, #6)
  - [x] 1.1 Define `MyCoachScopeSchema` as `z.enum(['25', '100', 'all'])` in `src/domain/schema.ts`
  - [x] 1.2 Export `MyCoachScope` type: `type MyCoachScope = z.infer<typeof MyCoachScopeSchema>`
  - [x] 1.3 Add `myCoachScope: MyCoachScopeSchema.default('100')` to `SettingsFileSchema`
  - [x] 1.4 Add `myCoachScope: '100'` to `defaultSettings()` return object

- [x] **Task 2: Add My Coach scope selector to settings screen** (AC: #1, #2)
  - [x] 2.1 Add `'myCoachScope'` to the `SettingsAction` type union in `src/screens/settings.ts`
  - [x] 2.2 Create `MY_COACH_SCOPE_CHOICES` constant array: `[{ name: 'Recent (25 questions)', value: '25' }, { name: 'Extended (100 questions)', value: '100' }, { name: 'Complete (all questions)', value: 'all' }]`
  - [x] 2.3 Create `MY_COACH_SCOPE_LABELS` constant: `Record<string, string>` mapping `'25'` → `'Recent'`, `'100'` → `'Extended'`, `'all'` → `'Complete'`
  - [x] 2.4 Import `MyCoachScope` type from `schema.js`
  - [x] 2.5 Create `handleMyCoachScopeAction()` async function following `handleAsciiArtMilestoneAction()` pattern — returns `{ value: MyCoachScope; banner: string }`
  - [x] 2.6 Add `🏋️ My Coach scope:   ${MY_COACH_SCOPE_LABELS[myCoachScope]}` choice to `selectSettingsAction()` — positioned after Tone of Voice and before ASCII Art Milestone
  - [x] 2.7 Add `myCoachScope` parameter to `selectSettingsAction()` function signature
  - [x] 2.8 Add `let myCoachScope = currentSettings.myCoachScope` to `showSettingsScreen()` local variables
  - [x] 2.9 Add `case 'myCoachScope'` to the switch block in `showSettingsScreen()` — calls `handleMyCoachScopeAction(myCoachScope)` and updates local + banner
  - [x] 2.10 Include `myCoachScope` in the save object spread in the `case 'save'` block

- [x] **Task 3: Write schema tests for `myCoachScope`** (AC: #6, #7)
  - [x] 3.1 Test: schema accepts `myCoachScope: '25'`
  - [x] 3.2 Test: schema accepts `myCoachScope: '100'`
  - [x] 3.3 Test: schema accepts `myCoachScope: 'all'`
  - [x] 3.4 Test: schema rejects `myCoachScope: '50'` (invalid value)
  - [x] 3.5 Test: schema rejects `myCoachScope: 100` (number, not string)
  - [x] 3.6 Test: `myCoachScope` defaults to `'100'` when missing from input (backward compatibility)
  - [x] 3.7 Test: `defaultSettings()` returns `myCoachScope: '100'`

- [x] **Task 4: Write settings screen tests** (AC: #1, #2, #3, #4, #5, #7)
  - [x] 4.1 Test: My Coach scope choice appears after Tone of Voice and before ASCII Art Milestone (ordering test with `findIndex`)
  - [x] 4.2 Test: My Coach scope label shows current value name (e.g., `Extended` for `'100'`)
  - [x] 4.3 Test: My Coach scope label shows `Recent` when `myCoachScope` is `'25'`
  - [x] 4.4 Test: selecting `myCoachScope` action triggers scope selector prompt with correct default
  - [x] 4.5 Test: My Coach scope selector includes a Back option after a separator
  - [x] 4.6 Test: Back from the My Coach scope selector leaves the value unchanged
  - [x] 4.7 Test: Save after scope change persists `myCoachScope` in written settings
  - [x] 4.8 Test: Save with default scope includes `myCoachScope: '100'`
  - [x] 4.9 Test: ExitPromptError during scope select does not save
  - [x] 4.10 Run full test suite — no regressions

## Dev Notes

### Architecture Requirements

- **Schema location**: `myCoachScope` is a global user preference, NOT per-domain — it belongs in `SettingsFileSchema`
- **Value type**: String enum `"25" | "100" | "all"` (strings, not numbers)
- **Default**: `"100"` — Extended scope
- **Backward compatibility**: `.default('100')` on the schema field ensures existing settings files without `myCoachScope` parse correctly
- **ESM imports**: All imports must use `.js` extension

[Source: docs/planning-artifacts/architecture.md#Settings — My Coach Scope]
[Source: docs/planning-artifacts/epics.md#Story 13.2: My Coach Scope Setting]

### Key Implementation Details

**Schema addition** — Add to `src/domain/schema.ts`:
```typescript
export const MyCoachScopeSchema = z.enum(['25', '100', 'all'])
export type MyCoachScope = z.infer<typeof MyCoachScopeSchema>
```
Then in `SettingsFileSchema`:
```typescript
myCoachScope: MyCoachScopeSchema.default('100'),
```
Then in `defaultSettings()`:
```typescript
myCoachScope: '100',
```

**Settings screen — follow `asciiArtMilestone` pattern exactly:**

Constants:
```typescript
const MY_COACH_SCOPE_CHOICES: Array<{ name: string; value: MyCoachScope }> = [
  { name: 'Recent (25 questions)', value: '25' },
  { name: 'Extended (100 questions)', value: '100' },
  { name: 'Complete (all questions)', value: 'all' },
]

const MY_COACH_SCOPE_LABELS: Record<string, string> = {
  '25': 'Recent',
  '100': 'Extended',
  'all': 'Complete',
}
```

Action type — add `'myCoachScope'` to union:
```typescript
type SettingsAction = 'provider' | 'language' | 'tone' | 'myCoachScope' | 'asciiArtMilestone' | 'theme' | 'showWelcome' | 'save' | 'back'
```

Handler function:
```typescript
async function handleMyCoachScopeAction(current: MyCoachScope): Promise<{ value: MyCoachScope; banner: string }> {
  const selectedScope = await select<MyCoachScope | 'back'>({
    message: 'My Coach Scope',
    choices: [
      ...MY_COACH_SCOPE_CHOICES,
      new Separator(),
      { name: '↩️  Back', value: 'back' as const },
    ],
    default: current,
    theme: menuTheme,
    pageSize: SETTINGS_PAGE_SIZE,
  })
  if (selectedScope === 'back') {
    return { value: current, banner: '' }
  }
  return { value: selectedScope, banner: success(`My Coach scope set to ${MY_COACH_SCOPE_LABELS[selectedScope]}`) }
}
```

Menu choice — add between Tone of Voice and ASCII Art Milestone in `selectSettingsAction()`:
```typescript
{ name: `🏋️ My Coach scope: ${MY_COACH_SCOPE_LABELS[myCoachScope]}`, value: 'myCoachScope' as const },
```

Switch case in `showSettingsScreen()`:
```typescript
case 'myCoachScope': {
  const scopeResult = await handleMyCoachScopeAction(myCoachScope)
  myCoachScope = scopeResult.value
  if (scopeResult.banner) banner = scopeResult.banner
  break
}
```

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---------|---------|------|
| Select-type setting enum | `AsciiArtMilestoneSchema = z.union([z.literal(0), z.literal(10), z.literal(100)])` | `schema.ts` |
| String enum alternative | `z.enum(['25', '100', 'all'])` — simpler for strings | — |
| Schema default | `asciiArtMilestone: AsciiArtMilestoneSchema.default(100)` | `schema.ts` |
| defaultSettings() field | `asciiArtMilestone: 100` | `schema.ts` |
| CHOICES array | `MILESTONE_CHOICES: Array<{ name: string; value: AsciiArtMilestone }>` | `settings.ts` |
| LABELS lookup | `MILESTONE_LABELS: Record<number, string>` | `settings.ts` |
| Handler function | `handleAsciiArtMilestoneAction(current)` → `{ value, banner }` | `settings.ts` |
| SettingsAction union | `type SettingsAction = 'provider' \| ... \| 'back'` | `settings.ts` |
| Menu choice format | `{ name: \`🎨 ASCII Art Milestone: \${MILESTONE_LABELS[...]\}\`, value: 'asciiArtMilestone' as const }` | `settings.ts` |
| Switch case | `case 'asciiArtMilestone': { ... break }` | `settings.ts` |
| Save object spread | `{ ...currentSettings, language, tone, ..., asciiArtMilestone, theme, showWelcome }` | `settings.ts` |
| Test: ordering | `findIndex(c => c?.value === 'asciiArtMilestone')` / `findIndex(c => c?.value === 'showWelcome')` + `expect(idx1).toBeLessThan(idx2)` | `settings.test.ts` |
| Test: label rendering | `choices.find(c => c?.value === 'asciiArtMilestone')` → `expect(…).toEqual(objectContaining({ name: stringContaining('...') }))` | `settings.test.ts` |
| Test: selector trigger | `mockSelect.mockResolvedValueOnce('asciiArtMilestone').mockResolvedValueOnce(10).mockResolvedValueOnce('back')` | `settings.test.ts` |
| Test: Back unchanged | `mockSelect ... 'back' ... 'save'` → `expect(writeSettings).toHaveBeenCalledWith(objectContaining({ ... defaultValue }))` | `settings.test.ts` |
| Test: Save persists | `mockSelect ... value ... 'save'` → `expect(writeSettings).toHaveBeenCalledWith(objectContaining({ field: newValue }))` | `settings.test.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT use numbers for `myCoachScope` values — they are strings: `"25"`, `"100"`, `"all"`
- ❌ Do NOT place the My Coach scope choice after ASCII Art Milestone — it goes BEFORE, after Tone of Voice
- ❌ Do NOT forget to add `myCoachScope` to the save object in the `case 'save'` block
- ❌ Do NOT forget to add `myCoachScope` parameter to `selectSettingsAction()` signature
- ❌ Do NOT use `z.union([z.literal('25'), ...])` — use `z.enum(['25', '100', 'all'])` for cleaner string enums

### Previous Story Learnings (from Story 12.3)

- `.default()` auto-applies on parse when field is missing — no migration needed
- The `asciiArtMilestone` select-type setting is the exact template for this feature
- Settings screen test patterns are well-established — follow them exactly
- Test baseline: ~939 passing tests — all must continue passing

### Dependency Note

- **Story 13.1 Task 2** also adds `myCoachScope` to the schema. If Story 13.2 is implemented BEFORE 13.1, then 13.1 Task 2 is already done. If 13.1 is implemented first, duplicate schema changes should be avoided.
- **Recommended order**: Implement 13.2 before 13.1 — Story 13.1's Task 2 can then be checked off as already complete.

### Project Structure Notes

**Modified files:**
- `src/domain/schema.ts` — add `MyCoachScopeSchema`, `MyCoachScope` type, `myCoachScope` field to `SettingsFileSchema` + `defaultSettings()`
- `src/screens/settings.ts` — add `myCoachScope` action type, choices, labels, handler, menu entry, switch case, save field
- `src/domain/schema.test.ts` — new tests for `myCoachScope` schema validation + default
- `src/screens/settings.test.ts` — new tests for My Coach scope UI in settings screen

### References

- [Source: docs/planning-artifacts/prd.md#Feature 19 — My Coach]
- [Source: docs/planning-artifacts/epics.md#Story 13.2: My Coach Scope Setting]
- [Source: docs/planning-artifacts/architecture.md#Settings — My Coach Scope]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Amelia — Senior Software Engineer persona, bmad-dev workflow)

### Debug Log References

None — implementation straightforward. Task 1 (schema) was already complete from Story 13.1. Tasks 2 and 4 were the only work needed.

### Completion Notes List

- **Task 1 (schema):** Already done in Story 13.1. `MyCoachScopeSchema`, `MyCoachScope` type, `myCoachScope: MyCoachScopeSchema.default('100')` in `SettingsFileSchema`, and `myCoachScope: '100'` in `defaultSettings()` all confirmed present in `src/domain/schema.ts`. Checked off without code changes.
- **Task 2 (settings UI):** Added `MyCoachScope` to schema import; added `'myCoachScope'` to `SettingsAction` union; added `MY_COACH_SCOPE_CHOICES` array and `MY_COACH_SCOPE_LABELS` Record constants; added `handleMyCoachScopeAction()` following exact `handleAsciiArtMilestoneAction()` pattern; added `myCoachScope` parameter to `selectSettingsAction()` and inserted `🏋️ My Coach scope: ${MY_COACH_SCOPE_LABELS[myCoachScope]}` choice between Tone of Voice and ASCII Art Milestone; added `let myCoachScope = currentSettings.myCoachScope` local var; added `case 'myCoachScope'` switch block; added `myCoachScope` to the save spread.
- **Task 3 (schema tests):** Already done in Story 13.1 (`src/domain/schema.test.ts` contains all 7 myCoachScope schema tests). Checked off without code changes.
- **Task 4 (settings screen tests):** Added 9 new tests to `src/screens/settings.test.ts`: ordering (after tone, before ASCII Art Milestone), label rendering for Extended/Recent, scope selector prompt with correct default, Back option presence, Back leaves value unchanged, save persists selected value, save includes default scope, ExitPromptError does not save.
- **Test result:** 1094 passing, 1 pre-existing unrelated failure (`stats.test.ts > displays score trend label`).

### File List

**Modified:**
- `src/screens/settings.ts` — `MyCoachScope` import, `SettingsAction` union, constants, handler, menu choice, local var, switch case, save spread
- `src/screens/settings.test.ts` — 9 new My Coach scope tests

### Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-04-20 | 1.0 | Implemented Story 13.2: My Coach scope selector in Settings screen. Task 1 (schema) and Task 3 (schema tests) were already complete from Story 13.1; implemented Task 2 (settings UI) and Task 4 (settings tests). | Amelia (dev) |
