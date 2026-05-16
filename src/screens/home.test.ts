import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import chalk from 'chalk'
import { buildHomeChoices, filterDomains, showHomeScreen, showCoffeeScreen, renderLaunchNotice, type HomeEntry, type HomeAction } from './home.js'
import { makeMeta } from '../__test-helpers__/factories.js'

// Prevent the real SDK (CJS/ESM issue) from loading via home → router → quiz → ai/client chain
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))
vi.mock('../domain/store.js', () => ({
  listDomains: vi.fn(),
  readDomain: vi.fn(),
  readSettings: vi.fn(),
}))
vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
  showQuiz: vi.fn(),
  archiveDomain: vi.fn(),
  showCreateDomain: vi.fn(),
  showArchived: vi.fn(),
  showSettings: vi.fn(),
  showExit: vi.fn(),
  showActivateLicense: vi.fn(),
  showLicenseInfo: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))
vi.mock('qrcode-terminal', () => ({
  default: { generate: vi.fn((_url: string, _opts: unknown, cb: (code: string) => void) => cb('QR')) },
}))

import type { DomainListEntry } from '../domain/store.js'
import { select } from '@inquirer/prompts'
import { listDomains, readDomain, readSettings } from '../domain/store.js'
import * as router from '../router.js'
import { clearAndBanner } from '../utils/screen.js'
import { defaultDomainFile, defaultSettings } from '../domain/schema.js'

const mockSelect = vi.mocked(select)
const mockListDomains = vi.mocked(listDomains)
const mockReadDomain = vi.mocked(readDomain)
const mockReadSettings = vi.mocked(readSettings)

beforeEach(() => {
  vi.clearAllMocks()
  mockListDomains.mockResolvedValue({ ok: true, data: [] })
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  vi.mocked(router.showDomainMenu).mockResolvedValue(undefined)
  vi.mocked(router.showQuiz).mockResolvedValue(null)
  vi.mocked(router.archiveDomain).mockResolvedValue(undefined)
  vi.mocked(router.showCreateDomain).mockResolvedValue(undefined)
  vi.mocked(router.showArchived).mockResolvedValue(undefined)
  vi.mocked(router.showSettings).mockResolvedValue(undefined)
  vi.mocked(router.showExit).mockResolvedValue(undefined)
  vi.mocked(router.showActivateLicense).mockResolvedValue(undefined)
  vi.mocked(router.showLicenseInfo).mockResolvedValue(undefined)
})

// Separator instances have no `value` property — use this guard throughout
function isActionChoice(c: unknown): c is { name: string; value: HomeAction } {
  return typeof c === 'object' && c !== null && 'value' in c
}

const freeTierHomeOpts = { hasActiveLicense: false } as const

function actionChoices(entries: HomeEntry[], opts: { hasActiveLicense: boolean } = freeTierHomeOpts) {
  return buildHomeChoices(entries, opts).filter(isActionChoice)
}

function domainChoices(entries: HomeEntry[], opts: { hasActiveLicense: boolean } = freeTierHomeOpts) {
  return actionChoices(entries, opts).filter((c) => c.value.action === 'select')
}

function actionsFromSelectCall(callIndex: number): HomeAction['action'][] {
  return (mockSelect.mock.calls[callIndex]?.[0]?.choices ?? [])
    .filter(isActionChoice)
    .map((choice) => choice.value.action)
}

describe('buildHomeChoices', () => {
  it('returns no domain entries and correct actions when entries is empty', () => {
    const actions = actionChoices([])
    const domainItems = domainChoices([])

    expect(domainItems).toHaveLength(0)

    // No archive action when list is empty
    expect(actions.every((c) => (c.value.action as string) !== 'archive')).toBe(true)

    // "Create new domain" must be the first non-separator item
    expect(actions[0].value.action).toBe('create')

    const actionTypes = actions.map((c) => c.value.action)
    expect(actionTypes).toContain('archived')
    expect(actionTypes).toContain('settings')
    expect(actionTypes).toContain('exit')
  })

  it('puts single domain entry first before action items', () => {
    const entries: HomeEntry[] = [{ slug: 'typescript', score: 100, totalQuestions: 10 }]
    const choices = buildHomeChoices(entries, { hasActiveLicense: false })
    const action = actionChoices(entries)

    // First non-separator item is the domain entry
    expect(action[0].value.action).toBe('select')
    expect((action[0].value as { action: 'select'; slug: string }).slug).toBe('typescript')

    // Separator must come after domain entries and before create
    const separatorIdx = choices.findIndex((c) => !isActionChoice(c))
    const createIdx = choices.findIndex(
      (c) => isActionChoice(c) && c.value.action === 'create',
    )
    expect(separatorIdx).toBeGreaterThan(0)
    expect(separatorIdx).toBeLessThan(createIdx)
  })

  it('shows score and question count in the domain entry name', () => {
    const entries: HomeEntry[] = [{ slug: 'react', score: 250, totalQuestions: 25 }]
    const domain = domainChoices(entries)[0]

    expect(domain.name).toContain('250')
    expect(domain.name).toContain('25 questions')
    expect(domain.name).toContain('react')
  })

  it('lists all provided entries when multiple domains given', () => {
    const entries: HomeEntry[] = [
      { slug: 'typescript', score: 100, totalQuestions: 10 },
      { slug: 'kubernetes', score: 50, totalQuestions: 5 },
      { slug: 'rust', score: 0, totalQuestions: 0 },
    ]
    const domains = domainChoices(entries)

    expect(domains).toHaveLength(3)
    const slugs = domains.map((c) => (c.value as { action: 'select'; slug: string }).slug)
    expect(slugs).toContain('typescript')
    expect(slugs).toContain('kubernetes')
    expect(slugs).toContain('rust')
  })

  it('always includes create, archived, settings, coffee, and exit actions regardless of domain count', () => {
    for (const entries of [[], [{ slug: 'go', score: 10, totalQuestions: 1 }]] as HomeEntry[][]) {
      const actions = actionChoices(entries).map((c) => c.value.action)
      expect(actions).toContain('create')
      expect(actions).toContain('archived')
      expect(actions).toContain('settings')
      expect(actions).toContain('coffee')
      expect(actions).toContain('exit')
    }
  })

  it('settings action appears between archived and coffee in menu order', () => {
    const actions = actionChoices([])
    const types = actions.map((c) => c.value.action)
    const archivedIdx = types.indexOf('archived')
    const settingsIdx = types.indexOf('settings')
    const coffeeIdx = types.indexOf('coffee')
    expect(archivedIdx).toBeGreaterThanOrEqual(0)
    expect(settingsIdx).toBeGreaterThan(archivedIdx)
    expect(coffeeIdx).toBeGreaterThan(settingsIdx)
  })

  it('each domain entry produces exactly ONE select action and no archive/history/stats actions', () => {
    const entries: HomeEntry[] = [{ slug: 'typescript', score: 100, totalQuestions: 10 }]
    const actions = actionChoices(entries)
    const selectActions = actions.filter((c) => c.value.action === 'select')
    expect(selectActions).toHaveLength(1)
    expect((selectActions[0].value as { action: 'select'; slug: string }).slug).toBe('typescript')
    expect(actions.every((c) => (c.value.action as string) !== 'archive')).toBe(true)
    expect(actions.every((c) => (c.value.action as string) !== 'history')).toBe(true)
    expect(actions.every((c) => (c.value.action as string) !== 'stats')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildHomeChoices — license-aware branching
// ---------------------------------------------------------------------------
describe('buildHomeChoices — license-aware branching', () => {
  it('free-tier menu order: create, archived, settings, activateLicense, coffee, exit', () => {
    const actions = actionChoices([], { hasActiveLicense: false })
    const types = actions.map((c) => c.value.action)
    expect(types).toEqual(['create', 'archived', 'settings', 'activateLicense', 'coffee', 'exit'])
  })

  it('active-license menu order: create, archived, settings, licenseInfo, exit — and NO coffee', () => {
    const actions = actionChoices([], { hasActiveLicense: true })
    const types = actions.map((c) => c.value.action)
    expect(types).toEqual(['create', 'archived', 'settings', 'licenseInfo', 'exit'])
    expect(types).not.toContain('coffee')
    expect(types).not.toContain('activateLicense')
  })

  it('renders domain entries first, then licensed menu without coffee', () => {
    const entries: HomeEntry[] = [{ slug: 'typescript', score: 100, totalQuestions: 10 }]
    const actions = actionChoices(entries, { hasActiveLicense: true })
    expect(actions[0].value.action).toBe('select')
    const tail = actions.slice(1).map((c) => c.value.action)
    expect(tail).toEqual(['create', 'archived', 'settings', 'licenseInfo', 'exit'])
  })

  it('uses the 🔑 Activate License label on free tier', () => {
    const actions = actionChoices([], { hasActiveLicense: false })
    const activate = actions.find((c) => c.value.action === 'activateLicense')
    expect(activate?.name).toContain('Activate License')
  })

  it('uses the 🔑 License Info label on active tier', () => {
    const actions = actionChoices([], { hasActiveLicense: true })
    const info = actions.find((c) => c.value.action === 'licenseInfo')
    expect(info?.name).toContain('License Info')
  })
})

// ---------------------------------------------------------------------------
// filterDomains
// ---------------------------------------------------------------------------

function activeEntry(slug: string): DomainListEntry {
  return { slug, corrupted: false, meta: makeMeta() }
}

function archivedEntry(slug: string): DomainListEntry {
  return { slug, corrupted: false, meta: makeMeta({ archived: true }) }
}

function corruptedEntry(slug: string): DomainListEntry {
  return { slug, corrupted: true }
}

describe('filterDomains', () => {
  it('returns empty array when input is empty', () => {
    expect(filterDomains([], { archived: false })).toHaveLength(0)
  })

  it('includes active (non-archived, non-corrupted) entries', () => {
    const result = filterDomains([activeEntry('typescript')], { archived: false })
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('typescript')
  })

  it('excludes corrupted entries', () => {
    const result = filterDomains([activeEntry('a'), corruptedEntry('b')], { archived: false })
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('a')
  })

  it('excludes archived entries', () => {
    const result = filterDomains([activeEntry('a'), archivedEntry('b')], { archived: false })
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('a')
  })

  it('excludes both corrupted and archived, keeps only active', () => {
    const entries: DomainListEntry[] = [
      activeEntry('active-1'),
      corruptedEntry('corrupted-1'),
      archivedEntry('archived-1'),
      activeEntry('active-2'),
    ]
    const result = filterDomains(entries, { archived: false })
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.slug)).toEqual(['active-1', 'active-2'])
  })
})

// ---------------------------------------------------------------------------
// showHomeScreen — routing
// ---------------------------------------------------------------------------
describe('showHomeScreen — pageSize', () => {
  it('uses a pageSize tall enough to show at least 10 domain rows plus the trailing menu', async () => {
    mockListDomains.mockResolvedValue({ ok: true, data: [] })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    const pageSize = mockSelect.mock.calls[0]?.[0]?.pageSize
    expect(pageSize).toBeGreaterThanOrEqual(18)
    exitSpy.mockRestore()
  })

  it('grows pageSize with the number of domains so all entries and trailing menu fit', async () => {
    const entries = Array.from({ length: 25 }, (_, i) => ({
      slug: `domain-${i}`,
      meta: defaultDomainFile().meta,
      corrupted: false as const,
    }))
    mockListDomains.mockResolvedValue({ ok: true, data: entries })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    const pageSize = mockSelect.mock.calls[0]?.[0]?.pageSize
    expect(pageSize).toBeGreaterThanOrEqual(25 + 8)
    exitSpy.mockRestore()
  })
})

describe('showHomeScreen — routing', () => {
  it('calls router.showExit before process.exit when showWelcome is true and exit is selected', async () => {
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: { ...defaultSettings(), showWelcome: true } })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showExit)).toHaveBeenCalledWith(0)
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('exits immediately without router.showExit when showWelcome is false and exit is selected', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: false } })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showExit)).not.toHaveBeenCalled()
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('calls router.showDomainMenu with the correct slug when a domain is selected', async () => {
    const domain = defaultDomainFile()
    mockListDomains.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript', meta: domain.meta, corrupted: false as const }],
    })
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'select', slug: 'typescript' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showDomainMenu)).toHaveBeenCalledOnce()
    expect(vi.mocked(router.showDomainMenu)).toHaveBeenCalledWith('typescript')
    exitSpy.mockRestore()
  })

  it('calls router.showSettings when settings action is selected', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'settings' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showSettings)).toHaveBeenCalledOnce()
    exitSpy.mockRestore()
  })

  it('calls showCoffeeScreen when coffee action is selected', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect
      .mockResolvedValueOnce({ action: 'coffee' })
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('buymeacoffee.com/georgiosnikitas'))
    exitSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('calls clearScreen before rendering', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
    exitSpy.mockRestore()
  })

  it('dispatches activateLicense action to router.showActivateLicense', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'activateLicense' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showActivateLicense)).toHaveBeenCalledOnce()
    expect(vi.mocked(router.showLicenseInfo)).not.toHaveBeenCalled()
    exitSpy.mockRestore()
  })

  it('dispatches licenseInfo action to router.showLicenseInfo', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'licenseInfo' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showLicenseInfo)).toHaveBeenCalledOnce()
    expect(vi.mocked(router.showActivateLicense)).not.toHaveBeenCalled()
    exitSpy.mockRestore()
  })

  it('re-reads settings every iteration so menu reflects newly-active license', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    const licenseRecord = {
      key: 'k', instanceId: 'i', instanceName: 'n',
      activatedAt: '2026-05-16T00:00:00.000Z', productId: 1049453, productName: 'p',
      storeId: 1, storeName: 's', status: 'active' as const,
    }
    // 1st iteration: free tier → user selects activateLicense
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: defaultSettings() })
    // 2nd iteration: active license → user selects exit
    mockReadSettings.mockResolvedValueOnce({
      ok: true,
      data: { ...defaultSettings(), license: licenseRecord },
    })
    // 3rd readSettings is called by the exit branch in handleHomeAction
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: { ...defaultSettings(), showWelcome: false } })
    mockSelect
      .mockResolvedValueOnce({ action: 'activateLicense' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    const types = actionsFromSelectCall(1)
    expect(types).toContain('licenseInfo')
    expect(types).not.toContain('coffee')
    expect(types).not.toContain('activateLicense')
    exitSpy.mockRestore()
  })

  it('re-reads settings every iteration so menu reflects newly-inactive license', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    const activeLicense = {
      key: 'k', instanceId: 'i', instanceName: 'n',
      activatedAt: '2026-05-16T00:00:00.000Z', productId: 1049453, productName: 'p',
      storeId: 1, storeName: 's', status: 'active' as const,
    }
    const inactiveLicense = { ...activeLicense, status: 'inactive' as const }
    mockReadSettings.mockResolvedValueOnce({
      ok: true,
      data: { ...defaultSettings(), license: activeLicense },
    })
    mockReadSettings.mockResolvedValueOnce({
      ok: true,
      data: { ...defaultSettings(), license: inactiveLicense },
    })
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: { ...defaultSettings(), showWelcome: false } })
    mockSelect
      .mockResolvedValueOnce({ action: 'licenseInfo' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    expect(vi.mocked(router.showLicenseInfo)).toHaveBeenCalledOnce()
    const types = actionsFromSelectCall(1)
    expect(types).toContain('activateLicense')
    expect(types).toContain('coffee')
    expect(types).not.toContain('licenseInfo')
    exitSpy.mockRestore()
  })

  it('treats license.status === "inactive" as free tier (AC #7)', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    const inactiveLicense = {
      key: 'k', instanceId: 'i', instanceName: 'n',
      activatedAt: '2026-05-16T00:00:00.000Z', productId: 1049453, productName: 'p',
      storeId: 1, storeName: 's', status: 'inactive' as const,
    }
    mockReadSettings.mockResolvedValueOnce({
      ok: true,
      data: { ...defaultSettings(), license: inactiveLicense },
    })
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: { ...defaultSettings(), showWelcome: false } })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    const types = actionsFromSelectCall(0)
    expect(types).toContain('activateLicense')
    expect(types).toContain('coffee')
    expect(types).not.toContain('licenseInfo')
    exitSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// launch notice rendering
// ---------------------------------------------------------------------------
describe('launch notice rendering', () => {
  let originalChalkLevel: typeof chalk.level

  beforeEach(() => {
    originalChalkLevel = chalk.level
    chalk.level = 1
  })

  afterEach(() => {
    chalk.level = originalChalkLevel
  })

  it('returns null when no launch notice is present', () => {
    expect(renderLaunchNotice(null)).toBeNull()
  })

  it('renders revoked notices with red formatting', () => {
    const result = renderLaunchNotice('revoked')

    expect(result).toContain('no longer active')
    expect(result).toMatch(/\x1B\[.*31m/)
  })

  it('renders offline notices with dim formatting', () => {
    const result = renderLaunchNotice('offline')

    expect(result).toContain('offline mode')
    expect(result).toMatch(/\x1B\[2m/)
  })

  it('prints the launch notice once across multiple home iterations', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect
      .mockResolvedValueOnce({ action: 'settings' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen('revoked')).rejects.toThrow('process.exit')

    const noticeCalls = logSpy.mock.calls.filter(([message]) => String(message).includes('no longer active'))
    expect(noticeCalls).toHaveLength(1)
    exitSpy.mockRestore()
    logSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showCoffeeScreen
// ---------------------------------------------------------------------------
describe('showCoffeeScreen', () => {
  it('shows QR code and URL then resolves when Back is selected', async () => {
    mockSelect.mockResolvedValueOnce('back')
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await showCoffeeScreen()

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('buymeacoffee.com/georgiosnikitas'))
    logSpy.mockRestore()
  })

  it('resolves silently when prompt is force-exited', async () => {
    mockSelect.mockRejectedValueOnce(new (await import('@inquirer/core')).ExitPromptError())
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(showCoffeeScreen()).resolves.toBeUndefined()
    logSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError from coffee screen select', async () => {
    const boom = new Error('unexpected coffee select failure')
    mockSelect.mockRejectedValueOnce(boom)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await expect(showCoffeeScreen()).rejects.toThrow('unexpected coffee select failure')
    logSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showHomeScreen — error paths
// ---------------------------------------------------------------------------
describe('showHomeScreen — error paths', () => {
  it('logs error and shows empty list when listDomains fails', async () => {
    mockListDomains.mockResolvedValue({ ok: false, error: 'disk error' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('disk error'))
    expect(errorSpy).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError from select', async () => {
    const boom = new Error('unexpected prompt failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showHomeScreen()).rejects.toThrow('unexpected prompt failure')
  })

  it('calls process.exit(0) when select throws ExitPromptError (Ctrl+C)', async () => {
    const ExitPromptError = (await import('@inquirer/core')).ExitPromptError
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await expect(showHomeScreen()).rejects.toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })
})

describe('showHomeScreen — readDomain fallback per entry', () => {
  it('falls back to listDomains meta score when readDomain fails for an entry', async () => {
    const meta = { ...defaultDomainFile().meta, score: 77 }
    mockListDomains.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript', meta, corrupted: false as const }],
    })
    mockReadDomain.mockResolvedValue({ ok: false, error: 'corrupted' })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')

    const callArg = mockSelect.mock.calls[0][0] as unknown as { choices: Array<{ name: string; value: HomeAction }> }
    const domainChoice = callArg.choices.find(
      (c) => c.value && (c.value as { action: string }).action === 'select',
    )
    expect(domainChoice?.name).toContain('77')
    exitSpy.mockRestore()
  })
})

describe('showHomeScreen — create and archived routing', () => {
  it('calls router.showCreateDomain when create action is selected', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'create' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showCreateDomain)).toHaveBeenCalledOnce()
    exitSpy.mockRestore()
  })

  it('calls router.showArchived when archived action is selected', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit')
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'archived' })
      .mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(router.showArchived)).toHaveBeenCalledOnce()
    exitSpy.mockRestore()
  })
})
