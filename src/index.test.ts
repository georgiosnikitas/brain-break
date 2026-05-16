import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defaultSettings } from './domain/schema.js'

vi.mock('./router.js', () => ({
  showHome: vi.fn(),
  showProviderSetup: vi.fn(),
  showWelcome: vi.fn(),
}))

vi.mock('./domain/store.js', () => ({
  readSettings: vi.fn(),
}))

vi.mock('./domain/license-launch.js', () => ({
  validateLicenseOnLaunch: vi.fn(),
}))

vi.mock('./domain/schema.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./domain/schema.js')>()
  return { ...actual }
})

import { showHome, showProviderSetup, showWelcome } from './router.js'
import { readSettings } from './domain/store.js'
import { validateLicenseOnLaunch } from './domain/license-launch.js'

const mockReadSettings = vi.mocked(readSettings)
const mockShowHome = vi.mocked(showHome)
const mockShowProviderSetup = vi.mocked(showProviderSetup)
const mockShowWelcome = vi.mocked(showWelcome)
const mockValidateLicenseOnLaunch = vi.mocked(validateLicenseOnLaunch)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  mockValidateLicenseOnLaunch.mockResolvedValue(null)
})

describe('startup flow', () => {
  it('shows provider setup, welcome, then home when provider is null and setup is not skipped', async () => {
    const settings = defaultSettings() // provider: null
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })
    mockShowProviderSetup.mockResolvedValueOnce(false)

    await import('./index.js')

    expect(mockShowProviderSetup).toHaveBeenCalledWith(settings)
    expect(mockShowWelcome).toHaveBeenCalledOnce()
    expect(mockValidateLicenseOnLaunch).toHaveBeenCalledOnce()
    expect(mockShowHome).toHaveBeenCalledWith(null)
  })

  it('skips welcome and shows home directly when provider setup is skipped', async () => {
    const settings = defaultSettings() // provider: null
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })
    mockShowProviderSetup.mockResolvedValueOnce(true)

    await import('./index.js')

    expect(mockShowProviderSetup).toHaveBeenCalledWith(settings)
    expect(mockShowWelcome).not.toHaveBeenCalled()
    expect(mockValidateLicenseOnLaunch).toHaveBeenCalledOnce()
    expect(mockShowHome).toHaveBeenCalledWith(null)
  })

  it('skips provider setup and shows home directly when provider is set', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })

    await import('./index.js')

    expect(mockShowProviderSetup).not.toHaveBeenCalled()
    expect(mockValidateLicenseOnLaunch).toHaveBeenCalledOnce()
    expect(mockShowHome).toHaveBeenCalledWith(null)
  })

  it('calls showWelcome when showWelcome setting is true', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const, showWelcome: true }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })

    await import('./index.js')

    expect(mockShowWelcome).toHaveBeenCalledOnce()
  })

  it('skips showWelcome when showWelcome setting is false', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const, showWelcome: false }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })

    await import('./index.js')

    expect(mockShowWelcome).not.toHaveBeenCalled()
    expect(mockValidateLicenseOnLaunch).toHaveBeenCalledOnce()
    expect(mockShowHome).toHaveBeenCalledWith(null)
  })

  it('validates the license after welcome and passes the launch notice to home', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const, showWelcome: true }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })
    mockValidateLicenseOnLaunch.mockResolvedValueOnce('revoked')

    await import('./index.js')

    expect(mockShowWelcome).toHaveBeenCalledOnce()
    expect(mockValidateLicenseOnLaunch).toHaveBeenCalledOnce()
    expect(mockShowHome).toHaveBeenCalledWith('revoked')
    expect(mockShowWelcome.mock.invocationCallOrder[0]).toBeLessThan(mockValidateLicenseOnLaunch.mock.invocationCallOrder[0])
    expect(mockValidateLicenseOnLaunch.mock.invocationCallOrder[0]).toBeLessThan(mockShowHome.mock.invocationCallOrder[0])
  })
})
