import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateLicenseOnLaunch } from './license-launch.js'
import * as licenseClient from './license-client.js'
import * as store from './store.js'
import { defaultSettings, type LicenseRecord, type SettingsFile } from './schema.js'

const oraMocks = vi.hoisted(() => {
  const spinner = {
    start: vi.fn(),
    stop: vi.fn(),
  }
  spinner.start.mockReturnValue(spinner)
  return {
    ora: vi.fn(() => spinner),
    spinner,
  }
})

vi.mock('ora', () => ({ default: oraMocks.ora }))

const activeLicense: LicenseRecord = {
  key: 'LK-123',
  instanceId: 'inst-123',
  instanceName: 'brain-break@test-host',
  activatedAt: '2026-05-16T10:00:00.000Z',
  productId: 1049453,
  productName: 'brain-break',
  storeId: 42,
  storeName: 'brain-break-store',
  status: 'active',
}

function settingsWithLicense(license: LicenseRecord | undefined): SettingsFile {
  return { ...defaultSettings(), provider: 'openai', license }
}

function inactiveLicense(): LicenseRecord {
  return { ...activeLicense, status: 'inactive' }
}

beforeEach(() => {
  vi.clearAllMocks()
  oraMocks.spinner.start.mockReturnValue(oraMocks.spinner)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('validateLicenseOnLaunch', () => {
  it('returns null without validating when no license is stored', async () => {
    const validateSpy = vi.spyOn(licenseClient, 'validateLicense')
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(undefined) })

    await expect(validateLicenseOnLaunch()).resolves.toBeNull()

    expect(validateSpy).not.toHaveBeenCalled()
    expect(writeSpy).not.toHaveBeenCalled()
    expect(oraMocks.ora).not.toHaveBeenCalled()
  })

  it('returns null without validating when the stored license is inactive', async () => {
    const validateSpy = vi.spyOn(licenseClient, 'validateLicense')
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(inactiveLicense()) })

    await expect(validateLicenseOnLaunch()).resolves.toBeNull()

    expect(validateSpy).not.toHaveBeenCalled()
    expect(writeSpy).not.toHaveBeenCalled()
    expect(oraMocks.ora).not.toHaveBeenCalled()
  })

  it('returns null without validating when settings cannot be read', async () => {
    const validateSpy = vi.spyOn(licenseClient, 'validateLicense')
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: false, error: 'settings unavailable' })

    await expect(validateLicenseOnLaunch()).resolves.toBeNull()

    expect(validateSpy).not.toHaveBeenCalled()
    expect(writeSpy).not.toHaveBeenCalled()
    expect(oraMocks.ora).not.toHaveBeenCalled()
  })

  it('preserves active status without writing when validation succeeds', async () => {
    const validateSpy = vi
      .spyOn(licenseClient, 'validateLicense')
      .mockResolvedValueOnce({ ok: true, data: { valid: true } })
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await expect(validateLicenseOnLaunch()).resolves.toBeNull()

    expect(oraMocks.ora).toHaveBeenCalledWith('Checking license…')
    expect(oraMocks.spinner.start).toHaveBeenCalledOnce()
    expect(oraMocks.spinner.stop).toHaveBeenCalledOnce()
    expect(validateSpy).toHaveBeenCalledTimes(1)
    expect(validateSpy).toHaveBeenCalledWith(activeLicense.key, activeLicense.instanceId, expect.any(AbortSignal))
    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('flips an active license inactive and returns revoked when validation says invalid', async () => {
    vi.spyOn(licenseClient, 'validateLicense').mockResolvedValueOnce({ ok: true, data: { valid: false } })
    const writeSpy = vi.spyOn(store, 'writeSettings').mockResolvedValueOnce({ ok: true, data: undefined })
    vi.spyOn(store, 'readSettings')
      .mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })
      .mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await expect(validateLicenseOnLaunch()).resolves.toBe('revoked')

    expect(writeSpy).toHaveBeenCalledOnce()
    const updated = writeSpy.mock.calls[0][0]
    expect(updated.license?.status).toBe('inactive')
    expect(updated.license?.key).toBe(activeLicense.key)
  })

  it('returns revoked without writing when the license is removed before the post-validation re-read', async () => {
    vi.spyOn(licenseClient, 'validateLicense').mockResolvedValueOnce({ ok: true, data: { valid: false } })
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings')
      .mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })
      .mockResolvedValueOnce({ ok: true, data: settingsWithLicense(undefined) })

    await expect(validateLicenseOnLaunch()).resolves.toBe('revoked')

    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('preserves active status and returns offline on network errors', async () => {
    vi.spyOn(licenseClient, 'validateLicense').mockResolvedValueOnce({
      ok: false,
      error: { kind: 'network', message: 'timeout' },
    })
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await expect(validateLicenseOnLaunch()).resolves.toBe('offline')

    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('treats unknown API errors as offline grace', async () => {
    vi.spyOn(licenseClient, 'validateLicense').mockResolvedValueOnce({
      ok: false,
      error: { kind: 'unknown_api_error', message: 'unexpected shape' },
    })
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await expect(validateLicenseOnLaunch()).resolves.toBe('offline')

    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('catches unexpected validation exceptions, stops the spinner, and returns offline', async () => {
    vi.spyOn(licenseClient, 'validateLicense').mockRejectedValueOnce(new Error('boom'))
    const writeSpy = vi.spyOn(store, 'writeSettings')
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await expect(validateLicenseOnLaunch()).resolves.toBe('offline')

    expect(oraMocks.spinner.stop).toHaveBeenCalledOnce()
    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('passes an AbortSignal to validateLicense', async () => {
    const validateSpy = vi
      .spyOn(licenseClient, 'validateLicense')
      .mockResolvedValueOnce({ ok: true, data: { valid: true } })
    vi.spyOn(store, 'readSettings').mockResolvedValueOnce({ ok: true, data: settingsWithLicense(activeLicense) })

    await validateLicenseOnLaunch()

    const signal = validateSpy.mock.calls[0][2]
    expect(signal).toBeInstanceOf(AbortSignal)
  })
})