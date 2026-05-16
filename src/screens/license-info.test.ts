import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { showLicenseInfoScreen, maskKey, formatActivatedAt } from './license-info.js'

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
  Separator: vi.fn(function Separator() { return { separator: true } }),
}))
vi.mock('../domain/license-client.js', () => ({ deactivateLicense: vi.fn() }))
vi.mock('../domain/store.js', () => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearAndBanner: vi.fn() }))
vi.mock('../utils/format.js', () => ({
  menuTheme: { style: { highlight: (text: string) => text } },
  success: (text: string) => `[success]${text}`,
  error: (text: string) => `[error]${text}`,
  dim: (text: string) => `[dim]${text}`,
  bold: (text: string) => `[bold]${text}`,
}))
vi.mock('../router.js', () => ({ showActivateLicense: vi.fn() }))

import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { deactivateLicense, type LicenseErrorKind } from '../domain/license-client.js'
import { readSettings, writeSettings } from '../domain/store.js'
import { defaultSettings, type LicenseRecord, type SettingsFile } from '../domain/schema.js'
import * as router from '../router.js'

const mockSelect = vi.mocked(select)
const mockDeactivate = vi.mocked(deactivateLicense)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteSettings = vi.mocked(writeSettings)
const mockShowActivate = vi.mocked(router.showActivateLicense)

const activeLicense: LicenseRecord = {
  key: '38B1AABBCCDDD4F9',
  instanceId: 'inst-123',
  instanceName: 'brain-break@georges-mac',
  activatedAt: '2026-05-15T14:30:00.000Z',
  productId: 1049453,
  productName: 'brain-break Pro',
  storeId: 1,
  storeName: 'Georgios Store',
  status: 'active',
}

const inactiveLicense: LicenseRecord = { ...activeLicense, status: 'inactive' }

function settingsWithLicense(license: LicenseRecord | undefined): SettingsFile {
  const base = defaultSettings()
  if (license) return { ...base, license }
  return base
}

function actionChoiceNames(callIndex: number): string[] {
  return (mockSelect.mock.calls[callIndex]?.[0]?.choices ?? [])
    .filter((choice): choice is { name: string; value: unknown } => typeof choice === 'object' && choice !== null && 'value' in choice)
    .map((choice) => choice.name)
}

function actionChoiceValues(callIndex: number): unknown[] {
  return (mockSelect.mock.calls[callIndex]?.[0]?.choices ?? [])
    .filter((choice): choice is { name: string; value: unknown } => typeof choice === 'object' && choice !== null && 'value' in choice)
    .map((choice) => choice.value)
}

let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  oraMocks.order.length = 0
  mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithLicense(activeLicense) })
  mockWriteSettings.mockResolvedValue({ ok: true, data: undefined })
  mockDeactivate.mockResolvedValue({ ok: true, data: undefined })
  mockShowActivate.mockResolvedValue(undefined)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  logSpy.mockRestore()
})

describe('maskKey', () => {
  it('masks long keys as first4…last4', () => {
    expect(maskKey('38B1AABBCCDDD4F9')).toBe('38B1…D4F9')
  })
  it('returns **** for keys shorter than 8 chars', () => {
    expect(maskKey('ABC')).toBe('****')
    expect(maskKey('1234567')).toBe('****')
  })
  it('handles exactly 8 chars', () => {
    expect(maskKey('12345678')).toBe('1234…5678')
  })
})

describe('formatActivatedAt', () => {
  it('formats an ISO timestamp as Month D, YYYY in en-US', () => {
    expect(formatActivatedAt('2026-05-15T14:30:00.000Z')).toBe('May 15, 2026')
  })
  it('falls back to raw input on invalid date', () => {
    expect(formatActivatedAt('not-a-date')).toBe('not-a-date')
  })
})

describe('showLicenseInfoScreen', () => {
  it('renders active fields (green Status, masked key, formatted date, instance/product/store)', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('🔑 License Info'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[success]Active'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('38B1…D4F9'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('May 15, 2026'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('brain-break@georges-mac'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('brain-break Pro'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Georgios Store'))
  })

  it('renders inactive fields with red Status and the dim notice line', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithLicense(inactiveLicense) })
    mockSelect.mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[error]Inactive'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[dim]This license was deactivated or could not be validated. Activate again to unlock unlimited domains.'))
  })

  it('defensively prints the no-license notice and offers only Back when license is undefined', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithLicense(undefined) })
    mockSelect.mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No license on this machine. Use Activate License from the home menu.'))
    expect(actionChoiceNames(0)).toEqual(['↩️  Back'])
    expect(mockDeactivate).not.toHaveBeenCalled()
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  it('shows the active-status action set: Deactivate, Manage, Back', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(actionChoiceNames(0)).toEqual(['🔌 Deactivate', '🔛 Manage your keys', '↩️  Back'])
  })

  it('shows the inactive-status action set: Re-activate, Manage, Back (no Deactivate)', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithLicense(inactiveLicense) })
    mockSelect.mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(actionChoiceNames(0)).toEqual(['🔑 Re-activate', '🔛 Manage your keys', '↩️  Back'])
  })

  it('hard-confirm prompt places Cancel first (default focus) and Cancel returns to action menu without calling deactivateLicense', async () => {
    mockSelect
      .mockResolvedValueOnce('deactivate') // action menu
      .mockResolvedValueOnce('cancel')      // confirm prompt
      .mockResolvedValueOnce('back')        // back to action menu

    await showLicenseInfoScreen()

    expect(actionChoiceValues(1)).toEqual(['cancel', 'confirm'])
    expect(mockDeactivate).not.toHaveBeenCalled()
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  it('successful deactivation removes license from settings, prints success, and returns', async () => {
    const existing = { ...defaultSettings(), provider: 'openai' as const, license: activeLicense }
    mockReadSettings.mockResolvedValue({ ok: true, data: existing })
    mockSelect
      .mockResolvedValueOnce('deactivate')
      .mockResolvedValueOnce('confirm')
      .mockResolvedValueOnce('back') // final Back-to-home prompt

    await showLicenseInfoScreen()

    expect(mockDeactivate).toHaveBeenCalledWith(activeLicense.key, activeLicense.instanceId)
    expect(oraMocks.ora).toHaveBeenCalledWith('Deactivating license…')
    expect(mockWriteSettings).toHaveBeenCalledTimes(1)
    const written = mockWriteSettings.mock.calls[0][0]
    expect(written.license).toBeUndefined()
    expect(written.provider).toBe('openai')
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[success]License deactivated.'))
  })

  it('failed deactivation (network) renders inline NFR2 error and does NOT write settings', async () => {
    mockDeactivate.mockResolvedValueOnce({ ok: false, error: { kind: 'network', message: 'boom' } })
    mockSelect
      .mockResolvedValueOnce('deactivate')
      .mockResolvedValueOnce('confirm')
      .mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[error]Could not reach the licensing server. Deactivation failed — try again when online.'))
  })

  it.each<[LicenseErrorKind, string]>([
    ['network', 'Could not reach the licensing server. Deactivation failed — try again when online.'],
    ['unknown_api_error', 'Could not reach the licensing server. Deactivation failed — try again when online.'],
    ['invalid_key', 'Deactivation failed. The licensing server reported an unexpected error — try again later.'],
    ['revoked', 'Deactivation failed. The licensing server reported an unexpected error — try again later.'],
    ['limit_reached', 'Deactivation failed. The licensing server reported an unexpected error — try again later.'],
    ['product_mismatch', 'Deactivation failed. The licensing server reported an unexpected error — try again later.'],
  ])('maps deactivation error kind %s to NFR2 copy', async (kind, message) => {
    mockDeactivate.mockResolvedValueOnce({ ok: false, error: { kind, message: 'internal' } })
    mockSelect
      .mockResolvedValueOnce('deactivate')
      .mockResolvedValueOnce('confirm')
      .mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`[error]${message}`))
  })

  it('Re-activate action invokes router.showActivateLicense and loops back to re-render', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: settingsWithLicense(inactiveLicense) })
    mockSelect
      .mockResolvedValueOnce('reactivate')
      .mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(mockShowActivate).toHaveBeenCalledTimes(1)
    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('Manage your keys renders the orders URL via QR helper and remains on screen', async () => {
    mockSelect
      .mockResolvedValueOnce('orders')
      .mockResolvedValueOnce('back') // URL screen Back
      .mockResolvedValueOnce('back') // action menu Back

    await showLicenseInfoScreen()

    expect(qrMocks.generate).toHaveBeenCalledWith('https://app.lemonsqueezy.com/my-orders', { small: true }, expect.any(Function))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('https://app.lemonsqueezy.com/my-orders'))
  })

  it('Back returns from the function with no settings mutation', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await expect(showLicenseInfoScreen()).resolves.toBeUndefined()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(mockDeactivate).not.toHaveBeenCalled()
  })

  it('resolves cleanly when the action prompt receives Ctrl+C', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await expect(showLicenseInfoScreen()).resolves.toBeUndefined()
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  it('cancels the hard-confirm prompt on Ctrl+C and returns to the action menu', async () => {
    mockSelect
      .mockResolvedValueOnce('deactivate')
      .mockRejectedValueOnce(new ExitPromptError())
      .mockResolvedValueOnce('back')

    await showLicenseInfoScreen()

    expect(mockDeactivate).not.toHaveBeenCalled()
  })

  it('starts the spinner before awaiting deactivation and stops it after resolution', async () => {
    mockSelect
      .mockResolvedValueOnce('deactivate')
      .mockResolvedValueOnce('confirm')
      .mockResolvedValueOnce('back')
    mockDeactivate.mockImplementationOnce(async () => {
      oraMocks.order.push('call')
      return { ok: true, data: undefined }
    })

    await showLicenseInfoScreen()

    expect(oraMocks.order).toEqual(['start', 'call', 'stop'])
  })
})
