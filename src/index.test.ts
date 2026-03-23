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

vi.mock('./domain/schema.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./domain/schema.js')>()
  return { ...actual }
})

import { showHome, showProviderSetup, showWelcome } from './router.js'
import { readSettings } from './domain/store.js'

const mockReadSettings = vi.mocked(readSettings)
const mockShowHome = vi.mocked(showHome)
const mockShowProviderSetup = vi.mocked(showProviderSetup)
const mockShowWelcome = vi.mocked(showWelcome)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('startup flow', () => {
  it('shows provider setup then home when provider is null', async () => {
    const settings = defaultSettings() // provider: null
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })

    await import('./index.js')

    expect(mockShowProviderSetup).toHaveBeenCalledWith(settings)
    expect(mockShowHome).toHaveBeenCalledOnce()
  })

  it('skips provider setup and shows home directly when provider is set', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })

    await import('./index.js')

    expect(mockShowProviderSetup).not.toHaveBeenCalled()
    expect(mockShowHome).toHaveBeenCalledOnce()
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
    expect(mockShowHome).toHaveBeenCalledOnce()
  })
})
