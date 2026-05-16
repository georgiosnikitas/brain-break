# Story 14.1: License Settings Schema & Types

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a `license` optional sub-object added to the `SettingsFile` Zod schema with all Lemon Squeezy activation fields,
So that license state can be persisted alongside other global settings in `~/.brain-break/settings.json` and read by every screen that needs to gate behaviour on license state.

## Acceptance Criteria

1. **Given** `domain/schema.ts` is updated **When** I inspect the `SettingsFile` schema **Then** it includes an optional `license` field whose value (when present) is a `LicenseRecord` object with required fields: `key` (string), `instanceId` (string), `instanceName` (string), `activatedAt` (string, ISO 8601), `productId` (number), `productName` (string), `storeId` (number), `storeName` (string), `status` (enum: `"active"` | `"inactive"`) **And** existing `settings.json` files without a `license` key pass Zod validation (backward compatible)

2. **Given** `defaultSettings()` is called **When** I inspect the returned object **Then** the `license` field is not present (free-tier installations have no license by default)

3. **Given** a `settings.json` file contains a malformed `license` sub-object (missing required fields or invalid types) **When** the settings file is loaded **Then** Zod validation fails for the license sub-object only; the rest of the settings are preserved; the corrupted `license` is dropped and the user is treated as free-tier — no crash

4. **Given** the schema is exported **When** I import `LicenseRecord` from `domain/schema.ts` **Then** the TypeScript type matches the Zod schema and is used by `domain/license-client.ts` and the license screens (this story only ships the type; consumers land in later stories)

5. **Given** I import `EXPECTED_PRODUCT_ID` from `domain/schema.ts` **Then** the constant exists, is exported, equals exactly `1049453` (number, not string), and is the single source of truth that Story 14.2's `domain/license-client.ts` will import for the defensive product-ID match guard (downstream usage is verified in 14.2, not here)

6. **Given** `domain/schema.ts` is updated **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests cover: schema accepts settings with and without `license`; schema rejects malformed `license` sub-objects; round-trip read/write preserves all license fields; default settings have no `license` key; `EXPECTED_PRODUCT_ID === 1049453`; `readSettings()` drops a malformed `license` while preserving the rest of the file

## Tasks / Subtasks

- [x] **Task 1: Add `LicenseRecord` Zod schema + `EXPECTED_PRODUCT_ID` constant** (AC: #1, #4, #5)
- [x] **Task 2: Add optional `license` field to `SettingsFileSchema`** (AC: #1, #2)
- [x] **Task 3: Extend `migrateSettings()` to drop a malformed `license` sub-object** (AC: #3)
- [x] **Task 4: Write `LicenseRecordSchema` + `EXPECTED_PRODUCT_ID` tests** (AC: #1, #4, #5, #6)
- [x] **Task 5: Write `SettingsFileSchema` license-field tests** (AC: #1, #2, #3, #6)
- [x] **Task 6: Write `readSettings()` / `writeSettings()` round-trip + graceful-drop tests** (AC: #3, #6)

## Dev Notes

### Architecture Requirements

- **Schema location**: License metadata fields belong on the global `SettingsFileSchema` (per-installation state, not per-domain) — confirmed by the architecture document.
- **Required-on-construct, optional-on-Settings**: All 9 `LicenseRecord` fields are required (none `.optional()`); the OUTER `license` field on `SettingsFileSchema` is `.optional()`. This guarantees that when a `license` is present, every field is populated, but free-tier installations omit the entire sub-object.
- **No `null`, only `undefined`**: Use `.optional()` (not `.nullable()`) on `SettingsFileSchema.license` so free-tier files have NO `license` key at all (byte-identical to today's settings files). Deactivation removes the key entirely; it does not set it to `null`.
- **Defensive product-ID match value**: `EXPECTED_PRODUCT_ID = 1049453` lives in `domain/schema.ts` as the single source of truth. `domain/license-client.ts` (Story 14.2) will import and compare against this constant — never hard-code `1049453` anywhere else.
- **Status enum**: Only `"active"` and `"inactive"` are valid schema values. Server-side revocation maps to `status: "inactive"` at the call site (Story 14.3) — the schema itself has no notion of `"revoked"`.
- **Malformed-license graceful drop**: A new behaviour added in this story — currently `readSettings()` falls back to `defaultSettings()` on ANY parse failure (wipes everything). For Story 14.1 we surgically strip only the malformed `license` sub-object via `migrateSettings()` BEFORE `SettingsFileSchema.safeParse()` runs, so the rest of the user's settings (provider, language, tone, etc.) survive a corrupt license.
- **ESM imports**: All imports must use `.js` extension (NodeNext).
- **No new npm dependencies**: This story is pure schema work — no SDK, no HTTP, no filesystem changes beyond the existing `store.ts` migration hook.
- **UX scope: N/A** — Story 14.1 is data-layer-only. No screens, no prompts, no user-facing strings. The UX surfaces for license activation (Activate License screen, License Info screen, cap-blocked upsell modal) ship in Stories 14.5, 14.6, and 14.7 respectively. No UX design spec lookup required for this story.

[Source: docs/planning-artifacts/architecture.md#Global Settings Architecture]
[Source: docs/planning-artifacts/architecture.md#License Activation Architecture]
[Source: docs/planning-artifacts/architecture.md#Authentication & Security]

### Key Implementation Details

**Schema additions** — Add to `src/domain/schema.ts` (alongside other module-level constants and Zod schemas):

```typescript
// ---------------------------------------------------------------------------
// License — Lemon Squeezy activation record (F17)
// ---------------------------------------------------------------------------
export const EXPECTED_PRODUCT_ID = 1049453

export const LicenseStatusSchema = z.enum(['active', 'inactive'])
export type LicenseStatus = z.infer<typeof LicenseStatusSchema>

export const LicenseRecordSchema = z.object({
  key: z.string().min(1),
  instanceId: z.string().min(1),
  instanceName: z.string().min(1),
  activatedAt: z.iso.datetime(),
  productId: z.number().int(),
  productName: z.string().min(1),
  storeId: z.number().int(),
  storeName: z.string().min(1),
  status: LicenseStatusSchema,
})
export type LicenseRecord = z.infer<typeof LicenseRecordSchema>
```

**`SettingsFileSchema` addition** — Append the optional license field at the end:

```typescript
export const SettingsFileSchema = z.object({
  provider: AiProviderTypeSchema.nullable().default(null),
  // ... existing fields unchanged ...
  showWelcome: z.boolean().default(true),
  license: LicenseRecordSchema.optional(),   // ← NEW
})
```

**`defaultSettings()` — NO changes needed:**
```typescript
export function defaultSettings(): SettingsFile {
  return {
    // ... existing fields unchanged ...
    showWelcome: true,
    // license intentionally omitted — free-tier installations have no license
  }
}
```

**`migrateSettings()` extension** — In `src/domain/store.ts`:

```typescript
import { /* existing */, LicenseRecordSchema } from './schema.js'

function migrateSettings(parsed: unknown): unknown {
  if (parsed !== null && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>
    let result = obj
    // Existing tone migration
    if ('tone' in result && typeof result.tone === 'string' && result.tone in TONE_MIGRATIONS) {
      result = { ...result, tone: TONE_MIGRATIONS[result.tone] }
    }
    // NEW: drop a malformed license sub-object, preserving the rest
    if ('license' in result && result.license !== undefined) {
      const licenseParse = LicenseRecordSchema.safeParse(result.license)
      if (!licenseParse.success) {
        const { license: _drop, ...rest } = result
        result = rest
      }
    }
    return result
  }
  return parsed
}
```

> Note: prefer surgical surgery on the parsed object rather than re-architecting the function. The tone migration logic must remain intact and continue to work for legacy settings files. Verify both migrations can run in the same pass.

### Existing Code Patterns to Follow

| Pattern | Example | File |
|---------|---------|------|
| Optional sub-object on a Zod schema | `lastCoachReport: z.string().max(MAX_COACH_REPORT_LENGTH).optional()` | `schema.ts` |
| ISO datetime field | `createdAt: z.iso.datetime()` | `schema.ts` |
| Enum schema + inferred type | `ToneOfVoiceSchema = z.enum([...])` + `export type ToneOfVoice = z.infer<typeof ToneOfVoiceSchema>` | `schema.ts` |
| Module-level numeric constant | `export const MAX_COACH_REPORT_LENGTH = 50_000` | `schema.ts` |
| Schema test — positive | `SettingsFileSchema.safeParse({ ...validSettings, license: validLicense })` → `expect(result.success).toBe(true)` | `schema.test.ts` |
| Schema test — negative | `SettingsFileSchema.safeParse({ ...validSettings, license: { /* missing key */ } })` → `expect(result.success).toBe(false)` | `schema.test.ts` |
| `defaultSettings()` absence check | `expect('asciiArtMilestone' in defaultSettings()).toBe(true)` patterns from existing tests | `schema.test.ts` |
| Store round-trip | `writeSettings(s)` → `readSettings()` → verify values | `store.test.ts` |
| Settings file mocking | Existing tests use a real `~/.brain-break/` write via the store API or a temp dir override — follow the same pattern | `store.test.ts` |

### Anti-Patterns to Avoid

- ❌ Do NOT add `license` to `defaultSettings()` — free-tier installations must produce byte-identical settings files to today's free-tier installs.
- ❌ Do NOT use `.nullable()` on the outer `license` field — use `.optional()` so the key is absent (not `null`) when unset.
- ❌ Do NOT make any `LicenseRecord` field optional or nullable — when a license exists, every field is required. The optionality lives ONE level up at the `SettingsFile.license` boundary.
- ❌ Do NOT add a `"revoked"` value to `LicenseStatusSchema` — server-side revocation maps to `status: "inactive"` at the call site. Schema only knows two states.
- ❌ Do NOT hard-code `1049453` in `domain/license-client.ts` (Story 14.2) or anywhere else — always reference `EXPECTED_PRODUCT_ID` from `domain/schema.ts`.
- ❌ Do NOT widen the existing `readSettings()` "everything goes to defaults" fallback — for THIS story, only a malformed `license` sub-object is surgically removed; a completely corrupt file still falls back to defaults.
- ❌ Do NOT write any HTTP client, screen, or router wiring in this story — that work belongs to Stories 14.2 through 14.7. This story is schema-only.
- ❌ Do NOT mask, hash, or transform the `key` field at the schema level — masking is a UI rendering concern (Stories 14.5, 14.6). Persistence stores the full key verbatim.

### Previous Story Learnings

- **From Story 13.3 (Domain Schema Coach Fields):** `.optional()` fields are simply omitted from objects and `undefined` at runtime — no migration needed, no `defaultSettings()` change needed. Test both with-field and without-field paths for backward compatibility. Test baseline at end of Epic 13 was 1099 passing tests — verify that count holds.
- **From Story 13.3:** Co-located schema tests in `src/domain/schema.test.ts` with a dedicated `describe` block per feature is the convention. Round-trip tests live in `src/domain/store.test.ts`.
- **From Story 12.3 (ASCII Art Milestone Setting):** `.default()` auto-applies on parse when a field is missing — no migration needed. The new `license` field uses `.optional()` (not `.default()`) so it stays absent on free tier.
- **From Story 5.1 (Settings Schema):** `migrateSettings()` is the canonical location to massage parsed input before `SettingsFileSchema.safeParse()`. Existing tone migration is the pattern to follow.

### Project Structure Notes

**Modified files (this story only):**
- `src/domain/schema.ts` — add `EXPECTED_PRODUCT_ID` constant, `LicenseStatusSchema` + type, `LicenseRecordSchema` + type, `SettingsFileSchema.license` optional field
- `src/domain/schema.test.ts` — add `describe('LicenseRecordSchema', ...)` block + `describe('SettingsFileSchema — license field', ...)` block + `EXPECTED_PRODUCT_ID` check
- `src/domain/store.ts` — import `LicenseRecordSchema`; extend `migrateSettings()` with the malformed-license drop logic
- `src/domain/store.test.ts` — add round-trip tests for `license` present/absent + graceful-drop test for malformed `license` (via temp `settings.json` write or store-level mock following existing patterns in the file)

**Files NOT touched in this story (defer to later stories):**
- `src/domain/license-client.ts` (Story 14.2 — new)
- `src/utils/open-url.ts` (Story 14.2 — new)
- `src/index.ts` (Story 14.3 — launch validation wiring)
- `src/screens/home.ts` (Story 14.4 — conditional menu)
- `src/screens/activate-license.ts` (Story 14.5 — new)
- `src/screens/license-info.ts` (Story 14.6 — new)
- `src/screens/create-domain.ts` (Story 14.7 — cap enforcement)
- `src/router.ts` (Stories 14.5, 14.6 — wire `showActivateLicense` + `showLicenseInfo`)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR53–FR57)](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.1: License Settings Schema & Types](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#Global Settings Architecture](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#Authentication & Security](../planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used

GitHub Copilot.

### Debug Log References

- `npm test` → 1167/1167 passing (baseline was 1099; +68 = expanded license coverage).
- `npm run typecheck` → clean.

### Completion Notes List

- Added `EXPECTED_PRODUCT_ID = 1049453`, `LicenseStatusSchema`, and `LicenseRecordSchema` (all 9 fields required) to `src/domain/schema.ts`.
- Added optional `license: LicenseRecordSchema.optional()` to `SettingsFileSchema`. `defaultSettings()` left untouched — free-tier installs remain byte-identical.
- Extended `migrateSettings()` in `src/domain/store.ts` to surgically strip a malformed `license` sub-object via object rest-destructuring (no `delete`, no full-file fallback), preserving every other field. Tone migration logic preserved and both passes can run in the same `readSettings()` cycle.
- Schema-level + store-level tests cover: positive parse, every required field missing/empty/non-integer, invalid ISO datetime, invalid status enum, `satisfies LicenseRecord` compile assertion, round-trip with license, round-trip without license, malformed-license graceful drop preserving other settings, combined legacy tone migration + malformed-license drop, and `status: "inactive"` preservation.

### File List

- Modified: `src/domain/schema.ts`
- Modified: `src/domain/schema.test.ts`
- Modified: `src/domain/store.ts`
- Modified: `src/domain/store.test.ts`

### Change Log

- 2026-05-16: Story file created via bmad-create-story workflow — comprehensive context engine analysis completed.
- 2026-05-16: Implemented schema + migration + tests. All 1167 tests passing, typecheck clean. Status → done.
