# Story 1.2: Domain Data Schema & Types

Status: done

## Story

As a developer,
I want the core domain data types and Zod schemas defined in `domain/schema.ts`,
so that all modules have a single, type-safe source of truth for domain file structure.

## Acceptance Criteria

1. **Given** `domain/schema.ts` is implemented  
   **When** I import `DomainFileSchema`  
   **Then** it is a Zod schema that validates a complete domain JSON object with `meta`, `hashes`, and `history` fields matching the architecture-defined structure

2. **Given** `domain/schema.ts` is implemented  
   **When** I call `defaultDomainFile()`  
   **Then** it returns a valid `DomainFile` with `score: 0`, `difficultyLevel: 2`, `streakCount: 0`, `streakType: "none"`, `totalTimePlayedMs: 0`, empty `hashes: []`, and empty `history: []`

3. **Given** `domain/schema.ts` is implemented  
   **When** I import the `Result<T>` type  
   **Then** it resolves to `{ ok: true; data: T } | { ok: false; error: string }`

4. **Given** `domain/schema.ts` has tests in `domain/schema.test.ts`  
   **When** I run `npm test`  
   **Then** all schema tests pass, covering valid input, `defaultDomainFile()` output, and rejection of malformed input

## Tasks / Subtasks

- [x] Task 1: Implement `domain/schema.ts` (AC: 1, 2, 3)
  - [x] 1.1 Define `Result<T>` type
  - [x] 1.2 Define `SpeedTier` type (`"fast" | "normal" | "slow"`)
  - [x] 1.3 Define `DomainMetaSchema` Zod schema with all meta fields
  - [x] 1.4 Define `QuestionRecordSchema` Zod schema with all history entry fields
  - [x] 1.5 Define `DomainFileSchema` composing meta + hashes + history
  - [x] 1.6 Export inferred TypeScript types: `DomainMeta`, `QuestionRecord`, `DomainFile`
  - [x] 1.7 Implement and export `defaultDomainFile()` factory function

- [x] Task 2: Write tests in `domain/schema.test.ts` (AC: 4)
  - [x] 2.1 Test `DomainFileSchema.parse()` accepts a valid complete domain object
  - [x] 2.2 Test `defaultDomainFile()` returns correct zero-state values
  - [x] 2.3 Test `DomainFileSchema.parse()` rejects missing required fields
  - [x] 2.4 Test `DomainFileSchema.parse()` rejects invalid `streakType` value
  - [x] 2.5 Test `DomainFileSchema.parse()` rejects invalid `correctAnswer` value (not A–D)
  - [x] 2.6 Test `DomainFileSchema.parse()` accepts empty `hashes` and `history` arrays
  - [x] 2.7 Run `npm test` and confirm all pass

## Dev Notes

### Architecture — Domain File Schema

[Source: architecture.md#Data Architecture]

```jsonc
{
  "meta": {
    "score": 0,                          // number
    "difficultyLevel": 2,                // 1–5 integer
    "streakCount": 0,                    // number
    "streakType": "correct" | "incorrect" | "none",
    "totalTimePlayedMs": 0,              // number
    "createdAt": "ISO8601",              // string
    "lastSessionAt": "ISO8601",          // string (nullable — null before first session)
    "archived": false                    // boolean
  },
  "hashes": ["sha256hex", ...],          // string[]
  "history": [
    {
      "question": "string",
      "options": { "A": "", "B": "", "C": "", "D": "" },
      "correctAnswer": "A" | "B" | "C" | "D",
      "userAnswer": "A" | "B" | "C" | "D",
      "isCorrect": boolean,
      "answeredAt": "ISO8601",
      "timeTakenMs": number,
      "speedTier": "fast" | "normal" | "slow",
      "scoreDelta": number,
      "difficultyLevel": number
    }
  ]
}
```

### Zod Schema Conventions

[Source: architecture.md#Naming Patterns]
- Schema variables: `PascalCase` + `Schema` suffix — e.g. `DomainFileSchema`, `DomainMetaSchema`
- Inferred types: `PascalCase`, no suffix — e.g. `type DomainFile = z.infer<typeof DomainFileSchema>`
- Export both the schema and its inferred type

### `defaultDomainFile()` Required Output

Must satisfy `DomainFileSchema.parse()` and return exactly:
```ts
{
  meta: {
    score: 0,
    difficultyLevel: 2,
    streakCount: 0,
    streakType: 'none',
    totalTimePlayedMs: 0,
    createdAt: <current ISO8601>,
    lastSessionAt: null,
    archived: false,
  },
  hashes: [],
  history: [],
}
```

### `Result<T>` Placement

The `Result<T>` type is defined here in `domain/schema.ts` (it's a core domain type) and re-exported from here — `domain/store.ts` and `ai/client.ts` import it from `'./schema.js'` and `'../domain/schema.js'` respectively.

### ESM Import Rule

All local imports must use `.js` extension [Source: architecture.md#Format Patterns]:
```ts
import { z } from 'zod'   // ✅ package import — no extension needed
import { foo } from './other.js'  // ✅ local — .js required
```

### Testing Approach

- Co-located: `src/domain/schema.test.ts` [Source: architecture.md#Structure Patterns]
- Use `vitest` `describe`/`it`/`expect`
- Test both `.safeParse()` (for rejection tests) and `.parse()` (for acceptance tests)

### Previous Story

Story 1.1 established: `package.json` with `zod@^3`, `vitest@^4`, `typescript@^5.9.3`, strict NodeNext ESM config. The stub `src/domain/schema.ts` exists and must be replaced entirely.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Senior Developer Review (AI)

**Outcome:** Changes Requested → Fixed  
**Date:** 2026-03-07  
**Action Items:** 5 found, 5 resolved

#### Action Items

- [x] [Med] Timestamp fields accepted any string — added `.datetime()` to `createdAt`, `lastSessionAt`, `answeredAt`
- [x] [Med] `question` and `options` strings accepted empty values — added `.min(1)`
- [x] [Med] No boundary tests for `difficultyLevel` (0 / 6) — 4 tests added
- [x] [Low] `score`, `totalTimePlayedMs`, `timeTakenMs`, `scoreDelta` permitted `NaN`/`Infinity` — added `.finite()`
- [x] [Low] `AnswerOptionSchema` and `SpeedTierSchema` not directly tested — 2 describe blocks added

### Completion Notes List

- All 2 tasks / 14 subtasks complete. Implemented `domain/schema.ts` with `Result<T>`, `SpeedTier`, `AnswerOption`, `DomainMetaSchema`, `QuestionRecordSchema`, `DomainFileSchema`, and `defaultDomainFile()`. All Zod schemas export both schema and inferred type. 17 tests written covering valid input, zero-state factory, and rejection of invalid `streakType`, `correctAnswer`, `speedTier`. `npm test` 18/18 ✅. `tsc --noEmit` exits 0 ✅.

### File List

- `src/domain/schema.ts`
- `src/domain/schema.test.ts`
