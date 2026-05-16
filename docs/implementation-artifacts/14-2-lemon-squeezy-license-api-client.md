# Story 14.2: Lemon Squeezy License API Client

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a `domain/license-client.ts` module that exposes `activateLicense(key)`, `validateLicense(key, instanceId, signal?)`, and `deactivateLicense(key, instanceId)` functions wrapping the Lemon Squeezy License API,
So that screens can call clean typed helpers without dealing with HTTP, form-encoded bodies, hostname derivation, product-ID matching, or error mapping themselves.

## Acceptance Criteria

1. **Given** `domain/license-client.ts` is implemented **When** I call `activateLicense(key)` **Then** it issues `POST https://api.lemonsqueezy.com/v1/licenses/activate` using global `fetch` with `Content-Type: application/x-www-form-urlencoded`, body fields `license_key=<key>` and `instance_name=brain-break@<hostname>` (where `<hostname>` comes from `os.hostname()`)

2. **Given** `activateLicense` receives a successful response **When** the response body is parsed **Then** the client verifies `meta.product_id === EXPECTED_PRODUCT_ID` (the constant from `domain/schema.ts`, equal to `1049453`) **And** if the IDs match, the client returns `{ ok: true, data: LicenseRecord }` populated from `instance.id`, `instance.name`, `instance.created_at`, `meta.product_id`, `meta.product_name`, `meta.store_id`, `meta.store_name`, with `key` set to the submitted key and `status: "active"` **And** if the IDs do not match, the client immediately calls `deactivateLicense(key, instance.id)` to release the just-created instance (best-effort — its result does NOT change the returned error), then returns `{ ok: false, error: { kind: "product_mismatch", message } }`

3. **Given** `activateLicense` receives an error response **When** the body is parsed **Then** the client returns a typed error matching `LicenseError`: `kind: "invalid_key"` (response indicates key not found / not valid), `kind: "revoked"` (response indicates key is `disabled` / `inactive` / refunded), `kind: "limit_reached"` (response indicates `activation_limit` reached), or `kind: "unknown_api_error"` with the upstream error detail as `message`

4. **Given** `activateLicense` cannot reach the server **When** `fetch` throws (DNS / TLS / connection reset / abort) or returns a 5xx status **Then** the client returns `{ ok: false, error: { kind: "network", message } }` with no retries (caller decides what to do)

5. **Given** `validateLicense(key, instanceId, signal?)` is called **When** the call is issued **Then** the client posts `POST /v1/licenses/validate` with form fields `license_key=<key>` and `instance_id=<instanceId>` **And** the optional `signal` parameter is forwarded directly to `fetch` (callers may pass `AbortSignal.timeout(2000)` to honour the NFR 4 launch budget) **And** on `valid: true` the client returns `{ ok: true, data: { valid: true } }` **And** on `valid: false` the client returns `{ ok: true, data: { valid: false } }` with the underlying reason mapped onto the same response body (the data shape stays minimal; reason classification happens via the error path only when the call itself fails) **And** on abort, timeout, or `fetch` failure the client returns `{ ok: false, error: { kind: "network", message } }` (signal to caller to apply offline grace)

6. **Given** `deactivateLicense(key, instanceId)` is called **When** the call is issued **Then** the client posts `POST /v1/licenses/deactivate` with form fields `license_key=<key>` and `instance_id=<instanceId>` **And** on success (`deactivated: true`) returns `{ ok: true, data: undefined }` **And** on API error returns `{ ok: false, error: { kind: "unknown_api_error", message } }` **And** on network failure returns `{ ok: false, error: { kind: "network", message } }`

7. **Given** any response from any of the three endpoints **When** the JSON body is parsed **Then** the client Zod-validates the response shape before reading any field; unexpected shapes (missing required keys, wrong types, malformed `meta`/`instance`) map to `{ kind: "unknown_api_error" }` rather than coercing missing fields to defaults

8. **Given** `Result<T>` exists today in `src/domain/schema.ts` as `{ ok: true; data: T } | { ok: false; error: string }` **When** the license-client signatures are needed **Then** `Result<T>` is extended to `Result<T, E = string>` so existing call sites stay valid (`Result<X>` is now sugar for `Result<X, string>`) and license-client can return `Result<LicenseRecord, LicenseError>`, `Result<{ valid: boolean }, LicenseError>`, and `Result<void, LicenseError>`

9. **Given** `domain/license-client.ts` is exported **When** I run `npm test` **Then** all existing tests pass with no regressions, and new tests (with `fetch` stubbed via `vi.fn()` / `vi.spyOn(globalThis, 'fetch')`) cover every AC including: successful activate with matching product ID 1049453 returns a populated `LicenseRecord`; successful activate with non-matching product ID triggers an immediate deactivate call AND returns `product_mismatch`; `invalid_key`, `revoked`, `limit_reached`, and `unknown_api_error` error responses are mapped correctly; `network` error path on `fetch` rejection AND on 5xx status; `validateLicense` forwards the supplied `AbortSignal` to `fetch`; `deactivateLicense` posts the expected payload and surfaces success/failure correctly; `os.hostname()` is invoked exactly once per `activateLicense` call and feeds the `instance_name` body field

## Tasks / Subtasks

- [ ] **Task 1: Extend `Result<T>` to be parameterised on the error type** (AC: #8)
  - [ ] 1.1 In `src/domain/schema.ts`, change `export type Result<T> = { ok: true; data: T } | { ok: false; error: string }` → `export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E }`
  - [ ] 1.2 Run `npm test` and `npm run typecheck` to confirm all ~60+ existing `Result<X>` usages still compile (the default `E = string` preserves the original meaning)
  - [ ] 1.3 If any test or source file relied on `error: string` being narrowed implicitly, leave it untouched — no widening is necessary

- [ ] **Task 2: Create `src/domain/license-client.ts` skeleton** (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [ ] 2.1 Add imports: `hostname` from `node:os`; `z` from `zod`; `LicenseRecord`, `LicenseRecordSchema`, `EXPECTED_PRODUCT_ID`, `Result` from `./schema.js`
  - [ ] 2.2 Define and export module constants:
    - `LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1/licenses'`
    - `INSTANCE_NAME_PREFIX = 'brain-break@'`
  - [ ] 2.3 Define and export `LicenseErrorKind` union type literally matching the architecture spec (`'invalid_key' | 'product_mismatch' | 'revoked' | 'limit_reached' | 'network' | 'unknown_api_error'`)
  - [ ] 2.4 Define and export `LicenseError = { kind: LicenseErrorKind; message: string }`
  - [ ] 2.5 Declare the three exported functions with the signatures specified in the Story Story section
  - [ ] 2.6 Add Zod schemas (module-private, not exported) for the three API response shapes: `ActivateResponseSchema`, `ValidateResponseSchema`, `DeactivateResponseSchema` (see Key Implementation Details below)

- [ ] **Task 3: Implement `activateLicense(key)`** (AC: #1, #2, #3, #4, #7)
  - [ ] 3.1 Build `instance_name = ${INSTANCE_NAME_PREFIX}${hostname()}`
  - [ ] 3.2 Build form-encoded body via `new URLSearchParams({ license_key: key, instance_name }).toString()`
  - [ ] 3.3 Wrap `fetch('${LEMON_SQUEEZY_API_BASE}/activate', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }, body })` in a try/catch — any thrown error becomes `{ kind: 'network' }`
  - [ ] 3.4 If `response.status >= 500`, return `{ kind: 'network' }` (architecture-mandated mapping for 5xx)
  - [ ] 3.5 Parse JSON body inside try/catch — JSON parse failure becomes `{ kind: 'unknown_api_error' }`
  - [ ] 3.6 If `response.ok === false`, classify error from payload: search `errors[0].detail` (case-insensitive) for `"not valid" | "not found"` → `invalid_key`; for `"activation limit"` → `limit_reached`; for `"disabled" | "inactive" | "refunded"` → `revoked`; everything else → `unknown_api_error` (keep raw detail as `message`)
  - [ ] 3.7 If `response.ok === true`, Zod-parse with `ActivateResponseSchema.safeParse(json)` — failure → `unknown_api_error`
  - [ ] 3.8 Check `parsed.meta.product_id === EXPECTED_PRODUCT_ID`. On mismatch: call `deactivateLicense(key, parsed.instance.id)` (await it but ignore its result), then return `{ kind: 'product_mismatch', message: '...' }` with a message referencing the mismatched product
  - [ ] 3.9 On match: build `LicenseRecord`:
    - `key` (submitted key)
    - `instanceId = parsed.instance.id`
    - `instanceName = parsed.instance.name`
    - `activatedAt = new Date(parsed.instance.created_at).toISOString()` — **NORMALIZATION REQUIRED**: Lemon Squeezy returns timestamps with 6-digit microseconds (e.g., `'2024-01-15T12:34:56.000000Z'`); Zod's `z.iso.datetime()` is strict by default and rejects microsecond precision. Round-tripping through `new Date().toISOString()` produces a 3-digit-ms ISO string that the schema accepts. If `new Date(...)` returns `Invalid Date`, surface as `unknown_api_error` (the API contract broke)
    - `productId = parsed.meta.product_id`
    - `productName = parsed.meta.product_name`
    - `storeId = parsed.meta.store_id`
    - `storeName = parsed.meta.store_name`
    - `status = 'active'`
    Return `{ ok: true, data: record }`. Validate the constructed record once with `LicenseRecordSchema.safeParse()` before returning — schema failure → `unknown_api_error` (defends against the API returning unexpected types)

- [ ] **Task 4: Implement `validateLicense(key, instanceId, signal?)`** (AC: #5, #7)
  - [ ] 4.1 Build body via `new URLSearchParams({ license_key: key, instance_id: instanceId })`
  - [ ] 4.2 Wrap `fetch('${LEMON_SQUEEZY_API_BASE}/validate', { method: 'POST', headers, body, signal })` in try/catch — any thrown error (including `AbortError` / DOMException with name `AbortError`) → `{ kind: 'network' }`
  - [ ] 4.3 If `response.status >= 500` → `{ kind: 'network' }`
  - [ ] 4.4 Parse JSON in try/catch → failure becomes `unknown_api_error`
  - [ ] 4.5 Zod-parse via `ValidateResponseSchema.safeParse(json)` → failure becomes `unknown_api_error`
  - [ ] 4.6 Return `{ ok: true, data: { valid: parsed.valid } }`

- [ ] **Task 5: Implement `deactivateLicense(key, instanceId)`** (AC: #6, #7)
  - [ ] 5.1 Build body via `new URLSearchParams({ license_key: key, instance_id: instanceId })`
  - [ ] 5.2 Wrap `fetch('${LEMON_SQUEEZY_API_BASE}/deactivate', ...)` in try/catch → throw → `{ kind: 'network' }`
  - [ ] 5.3 If `response.status >= 500` → `{ kind: 'network' }`
  - [ ] 5.4 Parse JSON in try/catch → failure → `unknown_api_error`
  - [ ] 5.5 If `!response.ok` → `{ kind: 'unknown_api_error', message }`
  - [ ] 5.6 Zod-parse with `DeactivateResponseSchema.safeParse(json)` — if `parsed.deactivated !== true` → `unknown_api_error`; else return `{ ok: true, data: undefined }`

- [ ] **Task 6: Write `src/domain/license-client.test.ts`** (AC: #9)
  - [ ] 6.1 `beforeEach`: stub `globalThis.fetch` via `vi.spyOn(globalThis, 'fetch')`; restore in `afterEach`
  - [ ] 6.2 Helper: `okJson(body)` returns a `Response`-shaped object `{ ok: true, status: 200, json: async () => body }`; `errJson(status, body)` returns the error equivalent. (Avoid `new Response()` — the Node test runtime supports it but the manual stub keeps the test contract explicit and side-effect free.)
  - [ ] 6.3 **Activate — happy path:** stub returns a full activate body with `meta.product_id = 1049453`; assert returned `LicenseRecord` matches every field; assert exactly one `fetch` call to `/v1/licenses/activate` with correct headers and form body (decode body via `new URLSearchParams(call.body)` and assert both fields)
  - [ ] 6.4 **Activate — product mismatch:** stub returns a body with `meta.product_id = 9999999`; assert the function makes a SECOND `fetch` call to `/v1/licenses/deactivate` with the returned `instance.id` (before returning), and returns `{ ok: false, error: { kind: 'product_mismatch' } }`
  - [ ] 6.5 **Activate — invalid_key:** stub returns 400 with `{ errors: [{ detail: 'license_key not valid' }] }`; assert `{ kind: 'invalid_key' }`
  - [ ] 6.6 **Activate — limit_reached:** stub returns 400 with `{ errors: [{ detail: 'activation limit reached' }] }`; assert `{ kind: 'limit_reached' }`
  - [ ] 6.7 **Activate — revoked:** stub returns 400 with `{ errors: [{ detail: 'license is disabled' }] }`; assert `{ kind: 'revoked' }`
  - [ ] 6.8 **Activate — unknown_api_error (unmapped detail):** stub returns 400 with `{ errors: [{ detail: 'random server error' }] }`; assert `{ kind: 'unknown_api_error', message: <contains 'random server error'> }`
  - [ ] 6.9 **Activate — unknown_api_error (malformed body):** stub returns 200 with `{ unexpected: 'shape' }`; assert `{ kind: 'unknown_api_error' }`
  - [ ] 6.10 **Activate — network (fetch throws):** stub rejects with `new Error('ECONNREFUSED')`; assert `{ kind: 'network' }`
  - [ ] 6.11 **Activate — network (5xx):** stub returns `{ ok: false, status: 503 }`; assert `{ kind: 'network' }`
  - [ ] 6.12 **Activate — hostname:** mock `os.hostname` to return `'test-host'`; assert the `instance_name` form field equals `'brain-break@test-host'`; assert `os.hostname` is invoked exactly once per call
  - [ ] 6.12.1 **Activate — microsecond timestamp normalization:** stub returns a body with `instance.created_at = '2024-01-15T12:34:56.123456Z'` (6-digit microseconds); assert returned `LicenseRecord.activatedAt === '2024-01-15T12:34:56.123Z'` (3-digit ms) AND that `LicenseRecordSchema.safeParse(record).success === true`. Catches the Lemon Squeezy / `z.iso.datetime()` strictness gotcha
  - [ ] 6.12.2 **Activate — invalid timestamp:** stub returns `instance.created_at = 'not-a-date'`; assert `{ kind: 'unknown_api_error' }` (the response Zod schema would have rejected before this, but covers belt-and-braces)
  - [ ] 6.13 **Validate — valid: true:** stub returns 200 `{ valid: true, license_key: { status: 'active' }, meta: { ... } }`; assert returned `{ valid: true }`
  - [ ] 6.14 **Validate — valid: false:** stub returns 200 `{ valid: false, license_key: { status: 'inactive' }, meta: { ... } }`; assert returned `{ valid: false }`
  - [ ] 6.15 **Validate — signal propagation:** create `const controller = new AbortController(); controller.abort()`; pass `controller.signal` to `validateLicense`; assert `fetch` was called with `signal: controller.signal` (read from the mock's call args) AND that the function returned `{ kind: 'network' }` because the mocked `fetch` throws `AbortError`
  - [ ] 6.16 **Validate — network on 5xx:** stub returns `{ ok: false, status: 502 }`; assert `{ kind: 'network' }`
  - [ ] 6.17 **Deactivate — happy path:** stub returns 200 `{ deactivated: true }`; assert `{ ok: true, data: undefined }`; assert form body has both fields
  - [ ] 6.18 **Deactivate — API error:** stub returns 400 `{ errors: [{ detail: 'invalid' }] }`; assert `{ kind: 'unknown_api_error' }`
  - [ ] 6.19 **Deactivate — deactivated: false:** stub returns 200 `{ deactivated: false }`; assert `{ kind: 'unknown_api_error' }`
  - [ ] 6.20 **Deactivate — network:** stub rejects with thrown `Error`; assert `{ kind: 'network' }`
  - [ ] 6.21 Run full suite (`npm test`) — confirm no regressions in the ~1099 existing passing tests

- [ ] **Task 7: Verify boundaries** (AC: #9 + architecture compliance)
  - [ ] 7.1 `grep -rn "api.lemonsqueezy.com" src/` should return matches ONLY in `src/domain/license-client.ts` (and its `.test.ts` if you choose to inline the URL in test assertions)
  - [ ] 7.2 `grep -rn "from 'node:os'" src/` should return matches ONLY in `src/domain/license-client.ts` (other files may use other `node:*` imports, but `node:os` for `hostname()` is exclusively license-client's)
  - [ ] 7.3 `grep -rn "1049453" src/` should return matches ONLY in `src/domain/schema.ts` (the `EXPECTED_PRODUCT_ID` constant), `src/domain/license-client.ts` (consuming it via import), and their `.test.ts` files

### Review Findings

- [x] Review/Patch: Activation stores `activated: false` responses as active licenses [src/domain/license-client.ts:122]
- [x] Review/Patch: `activation_limit` API error text is not mapped to `limit_reached` [src/domain/license-client.ts:59]
- [x] Review/Patch: Error response bodies are read without Zod validation [src/domain/license-client.ts:67]
- [x] Review/Patch: `validateLicense` treats non-5xx non-OK valid-shaped responses as successful validation results [src/domain/license-client.ts:187]

## Dev Notes

### Architecture Requirements

- **Single Lemon Squeezy chokepoint**: `domain/license-client.ts` is the ONLY module in the codebase that calls `api.lemonsqueezy.com`. No HTTP traffic to this host is permitted elsewhere. This is an enforced internal boundary.
- **Single `os.hostname()` chokepoint**: `domain/license-client.ts` is the ONLY module that imports `node:os` for `hostname()`. The hostname is read at activation time and never re-read on subsequent validates/deactivates (those reuse the persisted `instanceName`).
- **`EXPECTED_PRODUCT_ID` import (not duplicate)**: The product-ID match guard reads `EXPECTED_PRODUCT_ID` from `domain/schema.ts` — never hard-code `1049453` in `license-client.ts`. This is what Story 14.1 set up.
- **No SDK, no npm package added**: All HTTP traffic uses global `fetch` (Node 22+ has it built in). No `lemonsqueezy.js`, no `axios`, no `node-fetch`. Form-encoded bodies are built with `new URLSearchParams(...).toString()` — Node built-in.
- **Zod-validated responses**: Every successful response body MUST be parsed through a Zod schema before any field access. The architecture explicitly forbids coercing missing fields to defaults — unexpected shapes map to `unknown_api_error`.
- **No client-side retry**: All three calls are single-shot. The caller (UI screen or launch sequence) decides how to react. Launch validation in Story 14.3 will translate `network` to offline grace; activate/deactivate screens (Stories 14.5, 14.6) re-prompt the user.
- **Defensive product-match auto-release**: On `product_mismatch`, the just-created instance is released via an immediate `deactivateLicense` call. The deactivate's own success/failure does NOT change the returned `product_mismatch` error — the user must see the mismatch, not a deactivation failure. The rejected key/instance is NEVER persisted to `settings.json` (settings write happens in Story 14.5, downstream of this client).
- **Optional `signal` parameter on `validateLicense` only**: The architecture spec uses `signal?: AbortSignal` on validate so the caller controls the timeout policy. The epic AC's `{ timeoutMs }` shorthand is implemented at the call site (Story 14.3 will pass `AbortSignal.timeout(2000)`). Activate and deactivate do NOT take a signal — they are user-initiated single-shot operations without a launch budget.
- **No persistence in this story**: `license-client.ts` is HTTP-only and returns typed values. It NEVER reads or writes `settings.json`. The persistence of `LicenseRecord` happens in Story 14.5 (Activate License screen) after activate succeeds, and removal happens in Story 14.6 (License Info screen) after deactivate succeeds.
- **ESM imports**: `.js` extensions on all internal imports (NodeNext). `node:os` import uses the `node:` prefix per existing convention.
- **UX scope: N/A** — this is a pure HTTP-client module. No screens, no prompts, no user-facing strings (error `message` fields are stored for downstream rendering, but the human-readable text in the architecture's error mapping table lives in Stories 14.5/14.6 UI code, not here). For THIS story, the `message` field can be the raw upstream `detail` (or a brief constant for `network` / `product_mismatch`). UI translation happens downstream.

[Source: docs/planning-artifacts/architecture.md#API & Communication Patterns / Lemon Squeezy License API (L484–L502)]
[Source: docs/planning-artifacts/architecture.md#License Activation Architecture (L536+)]
[Source: docs/planning-artifacts/architecture.md#External Boundaries (Lemon Squeezy row, L1221)]
[Source: docs/planning-artifacts/architecture.md#Authentication & Security (L351)]
[Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR53–FR57)]

### Key Implementation Details

**Response Zod schemas (private to `license-client.ts`):**

```typescript
// Activate response — full instance + meta payload
const ActivateResponseSchema = z.object({
  activated: z.boolean(),
  instance: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    created_at: z.iso.datetime(),
  }),
  meta: z.object({
    product_id: z.number().int(),
    product_name: z.string().min(1),
    store_id: z.number().int(),
    store_name: z.string().min(1),
  }),
})

// Validate response — minimal, only the bits we read
const ValidateResponseSchema = z.object({
  valid: z.boolean(),
})

// Deactivate response — just the deactivated flag
const DeactivateResponseSchema = z.object({
  deactivated: z.boolean(),
})
```

**Skeleton with error classification helper:**

```typescript
import { hostname } from 'node:os'
import { z } from 'zod'
import {
  LicenseRecord,
  LicenseRecordSchema,
  EXPECTED_PRODUCT_ID,
  Result,
} from './schema.js'

export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1/licenses'
export const INSTANCE_NAME_PREFIX = 'brain-break@'

export type LicenseErrorKind =
  | 'invalid_key'
  | 'product_mismatch'
  | 'revoked'
  | 'limit_reached'
  | 'network'
  | 'unknown_api_error'

export type LicenseError = { kind: LicenseErrorKind; message: string }

const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Accept': 'application/json',
} as const

function classifyActivateError(detail: string): LicenseErrorKind {
  const d = detail.toLowerCase()
  if (d.includes('activation limit')) return 'limit_reached'
  if (d.includes('disabled') || d.includes('inactive') || d.includes('refunded')) return 'revoked'
  if (d.includes('not valid') || d.includes('not found') || d.includes('invalid')) return 'invalid_key'
  return 'unknown_api_error'
}

function networkError(message: string): LicenseError {
  return { kind: 'network', message }
}

function unknownError(message: string): LicenseError {
  return { kind: 'unknown_api_error', message }
}
```

> **Important ordering for `classifyActivateError`:** check `activation limit` BEFORE `invalid` — Lemon Squeezy's "activation limit reached" detail string contains neither "invalid" nor "not valid", but defensive ordering protects against future API changes. Check `disabled/inactive/refunded` BEFORE `invalid` to avoid `invalid_key` swallowing a `revoked` case.

**`activateLicense` flow (pseudocode):**

```typescript
export async function activateLicense(key: string): Promise<Result<LicenseRecord, LicenseError>> {
  const instanceName = `${INSTANCE_NAME_PREFIX}${hostname()}`
  const body = new URLSearchParams({ license_key: key, instance_name: instanceName }).toString()

  let response: Response
  try {
    response = await fetch(`${LEMON_SQUEEZY_API_BASE}/activate`, {
      method: 'POST',
      headers: FORM_HEADERS,
      body,
    })
  } catch (err) {
    return { ok: false, error: networkError(err instanceof Error ? err.message : String(err)) }
  }

  if (response.status >= 500) {
    return { ok: false, error: networkError(`HTTP ${response.status}`) }
  }

  let json: unknown
  try { json = await response.json() } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }

  if (!response.ok) {
    // Extract errors[0].detail safely
    const detail =
      (typeof json === 'object' && json !== null && 'errors' in json &&
       Array.isArray((json as any).errors) && (json as any).errors[0]?.detail) || 'Unknown API error'
    const kind = classifyActivateError(String(detail))
    return { ok: false, error: { kind, message: String(detail) } }
  }

  const parseResult = ActivateResponseSchema.safeParse(json)
  if (!parseResult.success) return { ok: false, error: unknownError('Unexpected activate response shape') }

  const parsed = parseResult.data
  if (parsed.meta.product_id !== EXPECTED_PRODUCT_ID) {
    // Best-effort release — ignore its result
    await deactivateLicense(key, parsed.instance.id).catch(() => undefined)
    return { ok: false, error: {
      kind: 'product_mismatch',
      message: `License is for product ${parsed.meta.product_id}, expected ${EXPECTED_PRODUCT_ID}`,
    } }
  }

  const record: LicenseRecord = {
    key,
    instanceId: parsed.instance.id,
    instanceName: parsed.instance.name,
    activatedAt: parsed.instance.created_at,
    productId: parsed.meta.product_id,
    productName: parsed.meta.product_name,
    storeId: parsed.meta.store_id,
    storeName: parsed.meta.store_name,
    status: 'active',
  }
  // Defensive: revalidate against schema before returning
  const recheck = LicenseRecordSchema.safeParse(record)
  if (!recheck.success) return { ok: false, error: unknownError('Constructed LicenseRecord failed schema validation') }

  return { ok: true, data: recheck.data }
}
```

**`validateLicense` flow (pseudocode):**

```typescript
export async function validateLicense(
  key: string,
  instanceId: string,
  signal?: AbortSignal,
): Promise<Result<{ valid: boolean }, LicenseError>> {
  const body = new URLSearchParams({ license_key: key, instance_id: instanceId }).toString()
  let response: Response
  try {
    response = await fetch(`${LEMON_SQUEEZY_API_BASE}/validate`, {
      method: 'POST', headers: FORM_HEADERS, body, signal,
    })
  } catch (err) {
    return { ok: false, error: networkError(err instanceof Error ? err.message : String(err)) }
  }
  if (response.status >= 500) return { ok: false, error: networkError(`HTTP ${response.status}`) }

  let json: unknown
  try { json = await response.json() } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }
  const parsed = ValidateResponseSchema.safeParse(json)
  if (!parsed.success) return { ok: false, error: unknownError('Unexpected validate response shape') }
  return { ok: true, data: { valid: parsed.data.valid } }
}
```

**`deactivateLicense` flow (pseudocode):**

```typescript
export async function deactivateLicense(
  key: string,
  instanceId: string,
): Promise<Result<void, LicenseError>> {
  const body = new URLSearchParams({ license_key: key, instance_id: instanceId }).toString()
  let response: Response
  try {
    response = await fetch(`${LEMON_SQUEEZY_API_BASE}/deactivate`, {
      method: 'POST', headers: FORM_HEADERS, body,
    })
  } catch (err) {
    return { ok: false, error: networkError(err instanceof Error ? err.message : String(err)) }
  }
  if (response.status >= 500) return { ok: false, error: networkError(`HTTP ${response.status}`) }
  let json: unknown
  try { json = await response.json() } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }
  if (!response.ok) {
    const detail = (json as any)?.errors?.[0]?.detail ?? 'Deactivate failed'
    return { ok: false, error: unknownError(String(detail)) }
  }
  const parsed = DeactivateResponseSchema.safeParse(json)
  if (!parsed.success || parsed.data.deactivated !== true) {
    return { ok: false, error: unknownError('Deactivate response did not confirm success') }
  }
  return { ok: true, data: undefined }
}
```

### Existing Code Patterns to Follow

| Pattern | Example | File |
| --- | --- | --- |
| Module with named exports, no default export | `export async function activateLicense(...)` | All `domain/*.ts` |
| `Result<T>` discriminated union | `if (result.ok) { /* use result.data */ } else { /* use result.error */ }` | All `domain/*.ts`, all `ai/*.ts` |
| Zod schema co-located in same file as its consumer (when private) | `const DomainMetaSchema = z.object({...})` declared alongside its parse-site | `domain/store.ts`, `domain/schema.ts` |
| `vi.spyOn(globalThis, '<fn>')` to stub global APIs in tests | Provider tests stub `fetch` extensively | `src/ai/providers/*.test.ts` (Anthropic, OpenAI, Gemini, OpenAI-compatible) |
| Mock-based test of HTTP boundary | Each provider's `.test.ts` mocks `fetch` and asserts URL + headers + body | `src/ai/providers/anthropic.test.ts` |
| Form-encoded body via `URLSearchParams` | Not yet used in repo — license-client introduces this idiom | new |
| `node:os` import with `node:` prefix | Existing `node:fs/promises`, `node:path`, `node:os` (in tests) imports | `src/domain/store.ts` |
| Architecture-mandated module boundary | `ai/providers/*.ts` are the only callers of provider HTTP APIs; same pattern applies to license-client | `src/ai/providers/*.ts` |
| Error mapping helper at top of module | Existing AI providers map HTTP errors to typed kinds (similar pattern) | `src/ai/providers/openai.ts` |

> **Strongly recommended:** before writing the new tests, scan one existing provider test file (e.g., `src/ai/providers/anthropic.test.ts`) to lift the exact `fetch` stub pattern, error-shape conventions, and `vi.spyOn` setup. The same shape will keep the new test file consistent with the existing 1099-test baseline.

### Anti-Patterns to Avoid

- ❌ Do NOT add `lemonsqueezy.js`, `node-fetch`, `axios`, or any other HTTP library to `package.json`. Use global `fetch` only.
- ❌ Do NOT hard-code `1049453` anywhere in `license-client.ts` — import `EXPECTED_PRODUCT_ID` from `./schema.js`.
- ❌ Do NOT read or write `~/.brain-break/settings.json` from `license-client.ts`. Persistence is the caller's job (Stories 14.5 / 14.6).
- ❌ Do NOT log the `license_key` to console, files, or any telemetry. The key is a secret; only its masked form (last 4 chars) is ever rendered, and that masking lives in UI code, not here.
- ❌ Do NOT retry failed requests inside the client. No exponential backoff, no second attempt. Callers decide.
- ❌ Do NOT swallow the `product_mismatch` case by treating it as success — the auto-release deactivate is a side effect; the function must STILL return `product_mismatch` so the UI explains to the user why activation failed.
- ❌ Do NOT skip Zod validation of the response body on the "happy path" — even successful responses must be Zod-validated. `unknown_api_error` is the catch-all for unexpected shapes.
- ❌ Do NOT widen the optional `signal` parameter to `activateLicense` or `deactivateLicense`. Only `validateLicense` accepts a signal; the other two are user-initiated single-shot operations.
- ❌ Do NOT couple `validateLicense`'s timeout to the function. The 2000 ms timeout is the CALLER's responsibility (Story 14.3 passes `AbortSignal.timeout(2000)`).
- ❌ Do NOT use `Response.text()` and re-parse — use `Response.json()` directly.
- ❌ Do NOT add fields to the response Zod schemas that aren't actually consumed (YAGNI). If a future story needs `license_key.status` from the activate body, that story adds it.
- ❌ Do NOT call `os.hostname()` lazily inside the body string concatenation in a way that re-evaluates — invoke it ONCE per `activateLicense` call and store it in a const.

### Previous Story Learnings

- **From Story 14.1 (License Settings Schema & Types — just shipped):** `LicenseRecord`, `LicenseRecordSchema`, `LicenseStatusSchema`, `LicenseStatus`, and `EXPECTED_PRODUCT_ID` are all exported from `src/domain/schema.ts`. The `Result<T>` type is the single-param form — extending it to `Result<T, E = string>` in this story is the ONLY change `schema.ts` needs.
- **From Story 14.1:** The `migrateSettings()` graceful-drop hook is already in place for malformed license sub-objects on disk. This story doesn't touch persistence at all, but downstream stories (14.5/14.6) will rely on the schema + migrate combo to safely round-trip the records this client produces.
- **From multi-provider AI stories (Feature 7):** The `fetch`-mocked test pattern is mature in this repo. Mock at `globalThis.fetch` via `vi.spyOn`, decode form/JSON bodies from the call args, and assert on response-shape mappings. Use this pattern verbatim.
- **From Story 5.1 (Settings Schema) + Story 13.3 (Coach Fields):** Zod schemas live in `domain/`. Test files live as `*.test.ts` siblings. The test baseline is ~1099 passing tests after Epic 13 — this story should land ~20 new tests for a baseline of ~1119.

### Project Structure Notes

**Modified files (this story only):**

- `src/domain/schema.ts` — extend `Result<T>` → `Result<T, E = string>` (Task 1, single-line change)

**New files:**

- `src/domain/license-client.ts` — the new HTTP client module
- `src/domain/license-client.test.ts` — fetch-mocked test suite

**Files NOT touched in this story:**

- `src/domain/store.ts` (no persistence in this story)
- `src/screens/activate-license.ts` (Story 14.5 — new)
- `src/screens/license-info.ts` (Story 14.6 — new)
- `src/index.ts` (Story 14.3 — launch validation wiring)
- `src/utils/open-url.ts` (Story 14.2 in the architecture sequence is the API client; `open-url.ts` is a separate concern landed in Story 14.5)
- `package.json` (no new dependencies)

### References

- [Source: docs/planning-artifacts/prd.md#Feature 20 — License Activation (FR53–FR57)](../planning-artifacts/prd.md)
- [Source: docs/planning-artifacts/epics.md#Story 14.2: Lemon Squeezy License API Client](../planning-artifacts/epics.md)
- [Source: docs/planning-artifacts/architecture.md#API & Communication Patterns — Lemon Squeezy License API](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#License Activation Architecture](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#External Boundaries (Lemon Squeezy row)](../planning-artifacts/architecture.md)
- [Source: docs/planning-artifacts/architecture.md#Authentication & Security](../planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent._

### Debug Log References

_To be filled by dev agent._

### Completion Notes List

_To be filled by dev agent._

### File List

_To be filled by dev agent._

### Change Log

- 2026-05-16: Story file created via bmad-create-story workflow — comprehensive context engine analysis completed.
