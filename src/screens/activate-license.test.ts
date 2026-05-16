import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { showActivateLicenseScreen } from './activate-license.js'

const oraMocks = vi.hoisted(() => {
  const order: string[] = []
  const spinner = {
    start: vi.fn(),
    stop: vi.fn(),
  }
  spinner.start.mockImplementation(() => {
    order.push('start')
    return spinner
  })
  spinner.stop.mockImplementation(() => {
    order.push('stop')
  })
  return {
    order,
    ora: vi.fn(() => spinner),
    spinner,
  }
})

const qrMocks = vi.hoisted(() => ({
  generate: vi.fn((_url: string, _opts: unknown, cb: (code: string) => void) => cb('QR\nCODE')),
}))

vi.mock('ora', () => ({ default: oraMocks.ora }))
vi.mock('qrcode-terminal', () => ({ default: { generate: qrMocks.generate } }))
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  Separator: vi.fn(function Separator() { return { separator: true } }),
}))
vi.mock('../domain/license-client.js', () => ({ activateLicense: vi.fn() }))
vi.mock('../domain/store.js', () => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearAndBanner: vi.fn() }))
vi.mock('../utils/format.js', () => ({
  menuTheme: { style: { highlight: (text: string) => text } },
  success: (text: string) => `[success]${text}`,
  error: (text: string) => `[error]${text}`,
  header: (text: string) => `[header]${text}`,
}))

import { select, input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { activateLicense, type LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type LicenseRecord } from '../domain/schema.js'
import { clearAndBanner } from '../utils/screen.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockActivateLicense = vi.mocked(activateLicense)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteSettings = vi.mocked(writeSettings)

const ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders'
const CHECKOUT_URL = 'https://georgiosnikitas.lemonsqueezy.com/checkout/buy/8581b2a9-5a89-45af-9367-d93acb044147'

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

const expectedMessages: Record<LicenseErrorKind, string> = {
  invalid_key: 'License key not recognized. Check the key and try again.',
  product_mismatch: 'This license key is not valid for brain-break.',
  revoked: 'This license has been revoked or refunded and can no longer be used.',
  limit_reached: 'This license has reached its activation limit. Deactivate it on another device or buy an additional seat.',
  network: 'Could not reach the licensing server. Check your connection and try again.',
  unknown_api_error: 'Could not reach the licensing server. Check your connection and try again.',
}

let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  oraMocks.order.length = 0
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  mockWriteSettings.mockResolvedValue({ ok: true, data: undefined })
  mockActivateLicense.mockResolvedValue({ ok: true, data: activeLicense })
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  logSpy.mockRestore()
})

function actionChoiceNames(callIndex = 0): string[] {
  return (mockSelect.mock.calls[callIndex]?.[0]?.choices ?? [])
    .filter((choice): choice is { name: string; value: unknown } => typeof choice === 'object' && choice !== null && 'value' in choice)
    .map((choice) => choice.name)
}

describe('showActivateLicenseScreen', () => {
  it('renders layout and the four action choices in order', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showActivateLicenseScreen()

    expect(clearAndBanner).toHaveBeenCalledOnce()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('🔑 Activate License'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Activate your license to unlock unlimited domains. Free tier is limited to 1 domain.'))
    expect(actionChoiceNames()).toEqual([
      '📋 Paste license key',
      '🔛 Manage your keys',
      '💳 Buy a license',
      '↩️  Back',
    ])
  })

  it('rejects empty or whitespace-only keys and returns to the action menu without activation', async () => {
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('   ')

    await showActivateLicenseScreen()

    expect(mockActivateLicense).not.toHaveBeenCalled()
    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No key entered.'))
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('starts the spinner before awaiting activation and stops it after resolution', async () => {
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('home')
    mockInput.mockResolvedValueOnce('LK-123')
    mockActivateLicense.mockImplementationOnce(async () => {
      oraMocks.order.push('call')
      return { ok: true, data: activeLicense }
    })

    await showActivateLicenseScreen()

    expect(oraMocks.ora).toHaveBeenCalledWith('Activating license…')
    expect(oraMocks.order).toEqual(['start', 'call', 'stop'])
  })

  it('persists the exact returned license, prints success, and resolves', async () => {
    const existing = { ...defaultSettings(), provider: 'openai' as const }
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: existing })
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('home')
    mockInput.mockResolvedValueOnce('LK-123')
    mockActivateLicense.mockResolvedValueOnce({ ok: true, data: activeLicense })

    await showActivateLicenseScreen()

    expect(mockActivateLicense).toHaveBeenCalledWith('LK-123')
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...existing, license: activeLicense })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[success]License activated successfully. Unlimited domains unlocked.'))
  })

  it('falls back to default settings when current settings cannot be read on successful activation', async () => {
    mockReadSettings.mockResolvedValueOnce({ ok: false, error: 'corrupt settings' })
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('home')
    mockInput.mockResolvedValueOnce('LK-123')

    await showActivateLicenseScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith({ ...defaultSettings(), license: activeLicense })
  })

  it.each(Object.entries(expectedMessages) as Array<[LicenseErrorKind, string]>)('renders the NFR2 %s error and does not write settings', async (kind, message) => {
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('LK-123')
    mockActivateLicense.mockResolvedValueOnce({ ok: false, error: { kind, message: 'internal detail' } })

    await showActivateLicenseScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`[error]${message}`))
    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('renders the manage-orders URL with QR code and remains on the screen', async () => {
    mockSelect.mockResolvedValueOnce('orders').mockResolvedValueOnce('back').mockResolvedValueOnce('back')

    await showActivateLicenseScreen()

    expect(qrMocks.generate).toHaveBeenCalledWith(ORDERS_URL, { small: true }, expect.any(Function))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('🔛 Manage your keys'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(ORDERS_URL))
    expect(actionChoiceNames(2)).toContain('📋 Paste license key')
  })

  it('renders the checkout URL with QR code and remains on the screen', async () => {
    mockSelect.mockResolvedValueOnce('checkout').mockResolvedValueOnce('back').mockResolvedValueOnce('back')

    await showActivateLicenseScreen()

    expect(qrMocks.generate).toHaveBeenCalledWith(CHECKOUT_URL, { small: true }, expect.any(Function))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('💳 Buy a license'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(CHECKOUT_URL))
    expect(actionChoiceNames(2)).toContain('📋 Paste license key')
  })

  it('returns on Back without settings mutation', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showActivateLicenseScreen()

    expect(mockActivateLicense).not.toHaveBeenCalled()
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  it('resolves cleanly when the action prompt receives Ctrl+C', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await expect(showActivateLicenseScreen()).resolves.toBeUndefined()
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  it('cancels a key-entry attempt on Ctrl+C and returns to the action menu', async () => {
    mockSelect.mockResolvedValueOnce('paste').mockResolvedValueOnce('back')
    mockInput.mockRejectedValueOnce(new ExitPromptError())

    await showActivateLicenseScreen()

    expect(mockActivateLicense).not.toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })
})
