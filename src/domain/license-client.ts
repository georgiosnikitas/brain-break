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
  meta: z.object({
    product_id: z.number().int(),
    product_name: z.string().min(1),
    store_id: z.number().int(),
    store_name: z.string().min(1),
  }),
})

const ValidateResponseSchema = z.object({
  valid: z.boolean(),
})

const DeactivateResponseSchema = z.object({
  deactivated: z.boolean(),
})

const ErrorResponseSchema = z.object({
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
  if (d.includes('disabled') || d.includes('inactive') || d.includes('refunded')) return 'revoked'
  if (d.includes('not valid') || d.includes('not found') || d.includes('invalid')) return 'invalid_key'
  return 'unknown_api_error'
}

function extractDetail(json: unknown, fallback: string): string {
  const parsed = ErrorResponseSchema.safeParse(json)
  if (!parsed.success) {
    return fallback
  }
  return parsed.data.errors[0]?.detail ?? fallback
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

  if (!response.ok) {
    const detail = extractDetail(json, 'Unexpected error response shape')
    if (detail === 'Unexpected error response shape') {
      return { ok: false, error: unknownError(detail) }
    }
    const kind = classifyActivateError(detail)
    return { ok: false, error: { kind, message: detail } }
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
    storeName: parsed.meta.store_name,
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
    return { ok: false, error: unknownError(extractDetail(json, 'Unexpected validate error response shape')) }
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
    const detail = extractDetail(json, 'Deactivate failed')
    return { ok: false, error: unknownError(detail) }
  }

  const parsed = DeactivateResponseSchema.safeParse(json)
  if (!parsed.success || parsed.data.deactivated !== true) {
    return { ok: false, error: unknownError('Deactivate response did not confirm success') }
  }

  return { ok: true, data: undefined }
}
