import { hostname } from 'node:os'
import { z } from 'zod'
import {
  EXPECTED_PRODUCT_ID,
  LicenseRecordSchema,
  type LicenseRecord,
  type Result,
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
  Accept: 'application/json',
} as const

const ActivateResponseSchema = z.object({
  activated: z.literal(true),
  instance: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    created_at: z.string().min(1),
  }),
  // The Lemon Squeezy License API does NOT return `store_name` in `meta` (only
  // `store_id`, `order_id`, `product_id`, `product_name`, `variant_id`, `variant_name`,
  // and `customer_*`). We keep `store_name` optional here and fall back to a placeholder
  // when constructing the persisted LicenseRecord.
  meta: z.object({
    product_id: z.number().int(),
    product_name: z.string().min(1),
    store_id: z.number().int(),
    store_name: z.string().min(1).optional(),
  }),
})

const ValidateResponseSchema = z.object({
  valid: z.boolean(),
})

const DeactivateResponseSchema = z.object({
  deactivated: z.boolean(),
})

// Lemon Squeezy license endpoints return errors as a flat `{ error: string, ... }` body.
// The general Lemon Squeezy API uses the JSON:API `{ errors: [{ detail }] }` shape; we accept
// both so tests written against the JSON:API shape continue to work and so the real license
// endpoint responses are parsed correctly.
const FlatErrorSchema = z.object({ error: z.string().min(1) })
const JsonApiErrorSchema = z.object({
  errors: z.array(z.object({ detail: z.string().min(1) })).min(1),
})

function networkError(message: string): LicenseError {
  return { kind: 'network', message }
}

function unknownError(message: string): LicenseError {
  return { kind: 'unknown_api_error', message }
}

function classifyActivateError(detail: string): LicenseErrorKind {
  const d = detail.toLowerCase()
  if (d.includes('activation limit') || d.includes('activation_limit')) return 'limit_reached'
  // Terminal states where the key can no longer be used. Lemon Squeezy license keys
  // can be `disabled` (manual), `expired` (time-based), or refunded/revoked.
  if (
    d.includes('disabled') ||
    d.includes('inactive') ||
    d.includes('refunded') ||
    d.includes('revoked') ||
    d.includes('expired')
  ) {
    return 'revoked'
  }
  if (d.includes('not valid') || d.includes('not found') || d.includes('invalid')) return 'invalid_key'
  return 'unknown_api_error'
}

function extractDetail(json: unknown): string | null {
  const flat = FlatErrorSchema.safeParse(json)
  if (flat.success) {
    return flat.data.error
  }
  const jsonApi = JsonApiErrorSchema.safeParse(json)
  if (jsonApi.success) {
    return jsonApi.data.errors[0]?.detail ?? null
  }
  return null
}

export async function activateLicense(
  key: string,
): Promise<Result<LicenseRecord, LicenseError>> {
  const instanceName = `${INSTANCE_NAME_PREFIX}${hostname()}`
  const body = new URLSearchParams({
    license_key: key,
    instance_name: instanceName,
  }).toString()

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
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }

  // Lemon Squeezy returns a top-level `error` string on failed activations even when the
  // HTTP status is 200 (e.g. `{ activated: false, error: "..." }`). Prefer body-driven
  // classification whenever an error string is present, falling back to HTTP-status logic.
  const bodyError = extractDetail(json)
  if (bodyError !== null) {
    return { ok: false, error: { kind: classifyActivateError(bodyError), message: bodyError } }
  }

  if (!response.ok) {
    return { ok: false, error: unknownError(`HTTP ${response.status} with no error detail`) }
  }

  const parseResult = ActivateResponseSchema.safeParse(json)
  if (!parseResult.success) {
    return { ok: false, error: unknownError('Unexpected activate response shape') }
  }

  const parsed = parseResult.data

  if (parsed.meta.product_id !== EXPECTED_PRODUCT_ID) {
    await deactivateLicense(key, parsed.instance.id).catch(() => undefined)
    return {
      ok: false,
      error: {
        kind: 'product_mismatch',
        message: `License is for product ${parsed.meta.product_id}, expected ${EXPECTED_PRODUCT_ID}`,
      },
    }
  }

  // Normalize microsecond timestamps (Lemon Squeezy returns 6-digit ms) to 3-digit ms ISO
  const date = new Date(parsed.instance.created_at)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: unknownError('Invalid created_at timestamp') }
  }
  const activatedAt = date.toISOString()

  const record: LicenseRecord = {
    key,
    instanceId: parsed.instance.id,
    instanceName: parsed.instance.name,
    activatedAt,
    productId: parsed.meta.product_id,
    productName: parsed.meta.product_name,
    storeId: parsed.meta.store_id,
    // Lemon Squeezy's License API doesn't expose the store name; fall back to a derived
    // label (using the store_id that is always returned) so the LicenseRecord schema
    // (which requires a non-empty storeName) remains valid and the displayed value is
    // not a misleading literal like "Lemon Squeezy".
    storeName: parsed.meta.store_name ?? `Store #${parsed.meta.store_id}`,
    status: 'active',
  }

  const recheck = LicenseRecordSchema.safeParse(record)
  if (!recheck.success) {
    return {
      ok: false,
      error: unknownError('Constructed LicenseRecord failed schema validation'),
    }
  }

  return { ok: true, data: recheck.data }
}

export async function validateLicense(
  key: string,
  instanceId: string,
  signal?: AbortSignal,
): Promise<Result<{ valid: boolean }, LicenseError>> {
  const body = new URLSearchParams({
    license_key: key,
    instance_id: instanceId,
  }).toString()

  let response: Response
  try {
    response = await fetch(`${LEMON_SQUEEZY_API_BASE}/validate`, {
      method: 'POST',
      headers: FORM_HEADERS,
      body,
      signal,
    })
  } catch (err) {
    return { ok: false, error: networkError(err instanceof Error ? err.message : String(err)) }
  }

  if (response.status >= 500) {
    return { ok: false, error: networkError(`HTTP ${response.status}`) }
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }

  if (!response.ok) {
    return { ok: false, error: unknownError(extractDetail(json) ?? 'Unexpected validate error response shape') }
  }

  const parsed = ValidateResponseSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, error: unknownError('Unexpected validate response shape') }
  }

  return { ok: true, data: { valid: parsed.data.valid } }
}

export async function deactivateLicense(
  key: string,
  instanceId: string,
): Promise<Result<void, LicenseError>> {
  const body = new URLSearchParams({
    license_key: key,
    instance_id: instanceId,
  }).toString()

  let response: Response
  try {
    response = await fetch(`${LEMON_SQUEEZY_API_BASE}/deactivate`, {
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
  try {
    json = await response.json()
  } catch {
    return { ok: false, error: unknownError('Malformed response body') }
  }

  if (!response.ok) {
    const detail = extractDetail(json) ?? 'Deactivate failed'
    return { ok: false, error: unknownError(detail) }
  }

  const parsed = DeactivateResponseSchema.safeParse(json)
  if (!parsed.success || parsed.data.deactivated !== true) {
    return { ok: false, error: unknownError('Deactivate response did not confirm success') }
  }

  return { ok: true, data: undefined }
}
