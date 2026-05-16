import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  activateLicense,
  validateLicense,
  deactivateLicense,
  LEMON_SQUEEZY_API_BASE,
  INSTANCE_NAME_PREFIX,
} from './license-client.js'
import { EXPECTED_PRODUCT_ID, LicenseRecordSchema } from './schema.js'

const hostnameMock = vi.fn(() => 'test-host')
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os')
  return { ...actual, hostname: (...args: unknown[]) => hostnameMock(...args) }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type FakeResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

function okJson(body: unknown, status = 200): FakeResponse {
  return { ok: true, status, json: async () => body }
}

function errJson(status: number, body: unknown): FakeResponse {
  return { ok: false, status, json: async () => body }
}

function makeActivateBody(overrides: {
  productId?: number
  instanceId?: string
  instanceName?: string
  createdAt?: string
  productName?: string
  storeId?: number
  storeName?: string
} = {}): unknown {
  return {
    activated: true,
    instance: {
      id: overrides.instanceId ?? 'inst-123',
      name: overrides.instanceName ?? 'brain-break@test-host',
      created_at: overrides.createdAt ?? '2024-01-15T12:34:56.000000Z',
    },
    meta: {
      product_id: overrides.productId ?? EXPECTED_PRODUCT_ID,
      product_name: overrides.productName ?? 'brain-break',
      store_id: overrides.storeId ?? 42,
      store_name: overrides.storeName ?? 'gn-store',
    },
  }
}

function decodeFormBody(body: unknown): Record<string, string> {
  const params = new URLSearchParams(String(body))
  return Object.fromEntries(params.entries())
}

let fetchSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// activateLicense
// ---------------------------------------------------------------------------
describe('activateLicense', () => {
  it('returns a populated LicenseRecord on success with matching product id', async () => {
    fetchSpy.mockResolvedValueOnce(okJson(makeActivateBody()))

    const result = await activateLicense('LK-AAA-BBB-CCC')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toMatchObject({
      key: 'LK-AAA-BBB-CCC',
      instanceId: 'inst-123',
      instanceName: 'brain-break@test-host',
      productId: EXPECTED_PRODUCT_ID,
      productName: 'brain-break',
      storeId: 42,
      storeName: 'gn-store',
      status: 'active',
    })
    expect(result.data.activatedAt).toBe('2024-01-15T12:34:56.000Z')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${LEMON_SQUEEZY_API_BASE}/activate`)
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    })
    const fields = decodeFormBody(init.body)
    expect(fields.license_key).toBe('LK-AAA-BBB-CCC')
    expect(fields.instance_name?.startsWith(INSTANCE_NAME_PREFIX)).toBe(true)
  })

  it('triggers an auto-deactivate and returns product_mismatch when product id differs', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson(makeActivateBody({ productId: 9999999, instanceId: 'inst-mismatch' })))
      .mockResolvedValueOnce(okJson({ deactivated: true }))

    const result = await activateLicense('LK-WRONG')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('product_mismatch')

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    const [secondUrl, secondInit] = fetchSpy.mock.calls[1]
    expect(secondUrl).toBe(`${LEMON_SQUEEZY_API_BASE}/deactivate`)
    const fields = decodeFormBody(secondInit.body)
    expect(fields.instance_id).toBe('inst-mismatch')
    expect(fields.license_key).toBe('LK-WRONG')
  })

  it('returns product_mismatch even when the auto-deactivate fails', async () => {
    fetchSpy
      .mockResolvedValueOnce(okJson(makeActivateBody({ productId: 9999999 })))
      .mockRejectedValueOnce(new Error('boom'))

    const result = await activateLicense('LK-WRONG')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('product_mismatch')
  })

  it('maps invalid_key error response', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 'license_key not valid' }] }),
    )
    const result = await activateLicense('bad')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('invalid_key')
  })

  it('maps limit_reached error response', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 'activation limit reached' }] }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('limit_reached')
  })

  it('maps activation_limit error response to limit_reached', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 'activation_limit reached' }] }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('limit_reached')
  })

  it('maps revoked error response (disabled)', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 'license is disabled' }] }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('revoked')
  })

  it('maps unmapped detail strings to unknown_api_error preserving detail in message', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 'random server error' }] }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
    expect(result.error.message).toContain('random server error')
  })

  it('returns unknown_api_error when the success body shape is malformed', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ unexpected: 'shape' }))
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns unknown_api_error when activated is false', async () => {
    fetchSpy.mockResolvedValueOnce(
      okJson({
        ...makeActivateBody(),
        activated: false,
      }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns unknown_api_error when activate error body shape is malformed', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { errors: [{ detail: 123 }] }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns network error when fetch throws', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')
  })

  it('returns network error on 5xx response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')
  })

  it('uses os.hostname() exactly once per call to build instance_name', async () => {
    hostnameMock.mockClear()
    hostnameMock.mockReturnValue('test-host')
    fetchSpy.mockResolvedValueOnce(okJson(makeActivateBody()))

    await activateLicense('LK-XYZ')

    expect(hostnameMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchSpy.mock.calls[0]
    const fields = decodeFormBody(init.body)
    expect(fields.instance_name).toBe('brain-break@test-host')
  })

  it('normalizes microsecond timestamps to 3-digit ms ISO format', async () => {
    fetchSpy.mockResolvedValueOnce(
      okJson(makeActivateBody({ createdAt: '2024-01-15T12:34:56.123456Z' })),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.activatedAt).toBe('2024-01-15T12:34:56.123Z')
    expect(LicenseRecordSchema.safeParse(result.data).success).toBe(true)
  })

  it('returns unknown_api_error for an unparseable created_at timestamp', async () => {
    fetchSpy.mockResolvedValueOnce(
      okJson({
        activated: true,
        instance: { id: 'i', name: 'n', created_at: 'not-a-date' },
        meta: {
          product_id: EXPECTED_PRODUCT_ID,
          product_name: 'p',
          store_id: 1,
          store_name: 's',
        },
      }),
    )
    const result = await activateLicense('any')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  // -------------------------------------------------------------------------
  // Real Lemon Squeezy response shape regressions
  // -------------------------------------------------------------------------
  it('accepts a real Lemon Squeezy success body that omits meta.store_name and synthesizes a Store #<id> label', async () => {
    fetchSpy.mockResolvedValueOnce(
      okJson({
        activated: true,
        error: null,
        license_key: {
          id: 1,
          status: 'active',
          key: 'LK-REAL',
          activation_limit: 1,
          activation_usage: 1,
          created_at: '2024-01-15T12:34:56.000000Z',
          expires_at: null,
        },
        instance: {
          id: 'inst-real',
          name: 'brain-break@host',
          created_at: '2024-01-15T12:34:56.000000Z',
        },
        meta: {
          store_id: 42,
          order_id: 99,
          order_item_id: 100,
          product_id: EXPECTED_PRODUCT_ID,
          product_name: 'brain-break',
          variant_id: 1,
          variant_name: 'Default',
          customer_id: 7,
          customer_name: 'GN',
          customer_email: 'gn@example.com',
        },
      }),
    )

    const result = await activateLicense('LK-REAL')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.storeId).toBe(42)
    expect(result.data.storeName).toBe('Store #42')
    expect(LicenseRecordSchema.safeParse(result.data).success).toBe(true)
  })

  it('classifies a 200 response with activated:false + error:"activation limit" as limit_reached', async () => {
    fetchSpy.mockResolvedValueOnce(
      okJson({
        activated: false,
        error: 'This license key has reached the activation limit.',
        license_key: { id: 1, status: 'active', key: 'k', activation_limit: 5, activation_usage: 5, created_at: 'x', expires_at: null },
        meta: { store_id: 1, product_id: EXPECTED_PRODUCT_ID, product_name: 'brain-break' },
      }),
    )

    const result = await activateLicense('LK-LIMIT')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('limit_reached')
    expect(result.error.message).toContain('activation limit')
  })

  it('classifies an "expired" error string as revoked', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { activated: false, error: 'License key has expired.' }),
    )
    const result = await activateLicense('LK-EXP')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('revoked')
    expect(result.error.message).toContain('expired')
  })

  it('classifies a "revoked" error string as revoked', async () => {
    fetchSpy.mockResolvedValueOnce(
      errJson(400, { activated: false, error: 'License key has been revoked.' }),
    )
    const result = await activateLicense('LK-REV')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('revoked')
  })
})

// ---------------------------------------------------------------------------
// validateLicense
// ---------------------------------------------------------------------------
describe('validateLicense', () => {
  it('returns { valid: true } when API responds with valid: true', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ valid: true }))
    const result = await validateLicense('LK', 'inst-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.valid).toBe(true)

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${LEMON_SQUEEZY_API_BASE}/validate`)
    const fields = decodeFormBody(init.body)
    expect(fields).toEqual({ license_key: 'LK', instance_id: 'inst-1' })
  })

  it('returns { valid: false } when API responds with valid: false', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ valid: false }))
    const result = await validateLicense('LK', 'inst-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.valid).toBe(false)
  })

  it('forwards AbortSignal to fetch and maps abort to network error', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchSpy.mockImplementationOnce(async () => {
      throw new DOMException('Aborted', 'AbortError')
    })

    const result = await validateLicense('LK', 'inst-1', controller.signal)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')

    const [, init] = fetchSpy.mock.calls[0]
    expect(init.signal).toBe(controller.signal)
  })

  it('returns network error on 5xx response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
    const result = await validateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')
  })

  it('returns unknown_api_error when validate response shape is unexpected', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ wrong: 'shape' }))
    const result = await validateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns unknown_api_error when non-OK validate response has a valid-shaped body', async () => {
    fetchSpy.mockResolvedValueOnce(errJson(400, { valid: false }))
    const result = await validateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })
})

// ---------------------------------------------------------------------------
// deactivateLicense
// ---------------------------------------------------------------------------
describe('deactivateLicense', () => {
  it('returns ok with undefined data on success', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ deactivated: true }))
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBeUndefined()

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(`${LEMON_SQUEEZY_API_BASE}/deactivate`)
    const fields = decodeFormBody(init.body)
    expect(fields).toEqual({ license_key: 'LK', instance_id: 'inst-1' })
  })

  it('returns unknown_api_error when API responds with an error body', async () => {
    fetchSpy.mockResolvedValueOnce(errJson(400, { errors: [{ detail: 'invalid' }] }))
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns unknown_api_error when deactivate error body shape is malformed', async () => {
    fetchSpy.mockResolvedValueOnce(errJson(400, { errors: [{ detail: 123 }] }))
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns unknown_api_error when deactivated: false', async () => {
    fetchSpy.mockResolvedValueOnce(okJson({ deactivated: false }))
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('unknown_api_error')
  })

  it('returns network error when fetch throws', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')
  })

  it('returns network error on 5xx', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) })
    const result = await deactivateLicense('LK', 'inst-1')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.kind).toBe('network')
  })
})
