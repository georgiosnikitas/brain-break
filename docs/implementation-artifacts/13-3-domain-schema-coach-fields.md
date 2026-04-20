# Story 13.3: Domain Schema Coach Fields

Status: done

## Story

As a developer,
I want `lastCoachQuestionCount` and `lastCoachTimestamp` added as optional fields on the domain JSON schema,
So that the My Coach screen can track when the last report was generated and how many questions existed at that time.

## Acceptance Criteria

1. **Given** `domain/schema.ts` is updated **When** I inspect the `DomainMetaSchema` **Then** it includes two optional fields: `lastCoachQuestionCount` (number, optional) and `lastCoachTimestamp` (string/ISO 8601, optional) **And** existing domain files without these fields pass Zod validation (backward compatible)

2. **Given** `defaultDomainFile()` is called **When** I inspect the returned object **Then** `lastCoachQuestionCount` and `lastCoachTimestamp` are not present (they are only written after a coaching report is generated)

3. **Given** a domain file with coach fields is written **When** `writeDomain()` is called and then `readDomain()` is called **Then** `lastCoachQuestionCount` and `lastCoachTimestamp` round-trip correctly through write/read

4. **Given** `domain/schema.ts` and tests are updated **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests cover: schema accepts domain files with and without coach fields; `lastCoachQuestionCount` and `lastCoachTimestamp` round-trip through write/read; fields are absent from `defaultDomainFile()` output

## Tasks / Subtasks

- [x] **Task 1: Add optional coach fields to `DomainMetaSchema`** (AC: #1)
  - [x] 1.1 Add `lastCoachQuestionCount: z.number().int().min(0).optional()` to `DomainMetaSchema` in `src/domain/schema.ts`
  - [x] 1.2 Add `lastCoachTimestamp: z.iso.datetime().optional()` to `DomainMetaSchema` in `src/domain/schema.ts`
  - [x] 1.3 Verify `DomainMeta` type infers correctly with the new optional fields

- [x] **Task 2: Verify `defaultDomainFile()` omits coach fields** (AC: #2)
  - [x] 2.1 Confirm `defaultDomainFile()` does NOT include `lastCoachQuestionCount` or `lastCoachTimestamp` — these fields should only appear after a My Coach report is generated
  - [x] 2.2 No changes should be needed to `defaultDomainFile()` — the fields are `.optional()` and absent by default

- [x] **Task 3: Write schema tests** (AC: #1, #2, #4)
  - [x] 3.1 Test: accepts a valid domain file with both `lastCoachQuestionCount` and `lastCoachTimestamp` present
  - [x] 3.2 Test: accepts a valid domain file with only `lastCoachQuestionCount` present (timestamp absent)
  - [x] 3.3 Test: accepts a valid domain file with only `lastCoachTimestamp` present (count absent)
  - [x] 3.4 Test: accepts a valid domain file with neither coach field present (backward compatibility)
  - [x] 3.5 Test: rejects negative `lastCoachQuestionCount` (e.g., -1)
  - [x] 3.6 Test: rejects non-integer `lastCoachQuestionCount` (e.g., 3.5)
  - [x] 3.7 Test: rejects invalid ISO datetime string for `lastCoachTimestamp`
  - [x] 3.8 Test: `defaultDomainFile()` output does NOT include `lastCoachQuestionCount` or `lastCoachTimestamp`

- [x] **Task 4: Write store round-trip tests** (AC: #3, #4)
  - [x] 4.1 Test: write a domain with both coach fields set → read back → values match
  - [x] 4.2 Test: write a domain without coach fields → read back → fields are absent/undefined
  - [x] 4.3 Run full test suite — all existing tests pass with no regressions

## Dev Notes

### Architecture Requirements

- **Schema location**: Coach metadata fields belong in `DomainMetaSchema` (per-domain data, not global settings)
- **Optional fields pattern**: Use `.optional()` — Zod treats missing fields as `undefined`; they are NOT included in `defaultDomainFile()` output
- **Backward compatibility**: Existing domain JSON files without these fields must continue to pass Zod validation — `.optional()` ensures this
- **ESM imports**: All imports must use `.js` extension

[Source: docs/planning-artifacts/architecture.md#Data Architecture — Domain File Schema]
[Source: docs/planning-artifacts/architecture.md#My Coach Screen — Domain metadata persistence]

### Key Implementation Details

**Schema addition** — Add to `DomainMetaSchema` in `src/domain/schema.ts`:
```typescript
export const DomainMetaSchema = z.object({
  score: z.number().refine(v => Number.isFinite(v)),
  difficultyLevel: z.number().int().min(1).max(5),
  startingDifficulty: z.number().int().min(1).max(5).default(2),
  streakCount: z.number().int().min(0),
  streakType: z.enum(['correct', 'incorrect', 'none']),
  totalTimePlayedMs: z.number().min(0).refine(v => Number.isFinite(v)),
  createdAt: z.iso.datetime(),
  lastSessionAt: z.iso.datetime().nullable(),
  archived: z.boolean(),
  lastCoachQuestionCount: z.number().int().min(0).optional(),   // ← NEW
  lastCoachTimestamp: z.iso.datetime().optional(),               // ← NEW
})
```

**Use `z.iso.datetime()`** for `lastCoachTimestamp` — this is the same validator used by `createdAt` and `lastSessionAt` in the existing schema, ensuring consistency. `z.string().optional()` would also work but `z.iso.datetime()` enforces the ISO 8601 format.

**defaultDomainFile() — NO changes needed:**
```typescript
export function defaultDomainFile(startingDifficulty: number = 2): DomainFile {
  return {
    meta: {
      score: 0,
      difficultyLevel: startingDifficulty,
      startingDifficulty,
      streakCount: 0,
      streakType: 'none',
      totalTimePlayedMs: 0,
      createdAt: new Date().toISOString(),
      lastSessionAt: null,
      archived: false,
      // lastCoachQuestionCount and lastCoachTimestamp intentionally omitted
    },
    hashes: [],
    history: [],
  }
}
```

Since both fields are `.optional()`, TypeScript allows `defaultDomainFile()` to omit them entirely. They will be `undefined` when read.

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---------|---------|------|
| Optional field in schema | `startingDifficulty: z.number().int().min(1).max(5).default(2)` | `schema.ts` |
| ISO datetime field | `createdAt: z.iso.datetime()` | `schema.ts` |
| Nullable vs optional | `lastSessionAt: z.iso.datetime().nullable()` (null = explicit), vs `.optional()` (undefined = absent) | `schema.ts` |
| Schema test — positive | `parseDomain({ meta: { ...validMeta, newField: value } })` → `expect(result.success).toBe(true)` | `schema.test.ts` |
| Schema test — negative | `parseDomain({ meta: { ...validMeta, field: badValue } })` → `expect(result.success).toBe(false)` | `schema.test.ts` |
| Schema test — default | Omit field from input → `expect(result.data.meta.field).toBe(defaultValue)` | `schema.test.ts` |
| Store round-trip | `writeDomain(slug, domain)` → `readDomain(slug)` → verify values | `store.test.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT add coach fields to `defaultDomainFile()` — they should be absent from new domains
- ❌ Do NOT use `.nullable()` for coach fields — use `.optional()` so they are absent (not `null`) when not set
- ❌ Do NOT use `z.string().optional()` for the timestamp — use `z.iso.datetime().optional()` for format enforcement consistency with `createdAt`
- ❌ Do NOT write migration code in `store.ts` — Zod `.optional()` handles missing fields automatically on parse

### Previous Story Learnings (from Story 12.3)

- `.default()` auto-applies on parse when field is missing — no migration needed
- `.optional()` fields are simply omitted from objects and `undefined` at runtime
- Test both with-field and without-field paths for backward compatibility
- Test baseline: ~939 passing tests — all must continue passing

### Project Structure Notes

**Modified files:**
- `src/domain/schema.ts` — add 2 optional fields to `DomainMetaSchema`
- `src/domain/schema.test.ts` — new tests for coach field validation
- `src/domain/store.test.ts` — new round-trip tests for coach fields

### References

- [Source: docs/planning-artifacts/prd.md#Feature 19 — My Coach]
- [Source: docs/planning-artifacts/epics.md#Story 13.3: Domain Schema Coach Fields]
- [Source: docs/planning-artifacts/architecture.md#Data Architecture — Domain File Schema]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

N/A

### Completion Notes List

- Schema changes (`lastCoachQuestionCount`, `lastCoachTimestamp`) were already applied to `src/domain/schema.ts` prior to dev session start.
- `defaultDomainFile()` required no changes — optional fields are naturally absent.
- Added missing schema tests 3.2 and 3.3 (single-field partial coverage) to `src/domain/schema.test.ts`.
- Added store round-trip tests 4.1 and 4.2 to `src/domain/store.test.ts` in the `writeDomain + readDomain` describe block.
- Full test suite: 1099 tests across 32 files — all passing.

### File List

- `src/domain/schema.ts` — `lastCoachQuestionCount` and `lastCoachTimestamp` optional fields on `DomainMetaSchema`
- `src/domain/schema.test.ts` — `DomainMetaSchema — coach fields` describe block with 8 tests
- `src/domain/store.test.ts` — 2 new round-trip tests in `writeDomain + readDomain` describe block

### Change Log

- 2026-04-20: Story implemented — schema fields verified, schema tests 3.2/3.3 added, store round-trip tests 4.1/4.2 added, all 1099 tests passing.
