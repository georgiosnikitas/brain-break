import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ExitPromptError } from '@inquirer/core'
import { validateDomainName, showCreateDomainScreen, isCapBlocked } from './create-domain.js'
import { writeDomain, readDomain, listDomains, readSettings, writeSettings, _setDataDir } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, LicenseRecord, SettingsFile } from '../domain/schema.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

// ---------------------------------------------------------------------------
// Mock @inquirer/prompts so interactive prompts can be controlled in tests
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))

vi.mock('../router.js', () => ({ showActivateLicense: vi.fn() }))

vi.mock('../domain/store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/store.js')>()
  return { ...actual, readSettings: vi.fn(actual.readSettings) }
})

import { select, input } from '@inquirer/prompts'
const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)

// ---------------------------------------------------------------------------
// Helpers shared across cap-aware and legacy duplicate tests
// ---------------------------------------------------------------------------
function activeLicense(): LicenseRecord {
  return {
    key: 'KEY-XYZ',
    instanceId: 'instance-1',
    instanceName: 'machine',
    activatedAt: '2026-01-01T00:00:00.000Z',
    productId: 1,
    productName: 'Brain Break Pro',
    storeId: 1,
    storeName: 'Lemon Squeezy',
    status: 'active',
  }
}

function settingsWith(license: LicenseRecord | undefined): SettingsFile {
  return { ...defaultSettings(), ...(license ? { license } : {}) }
}

// ---------------------------------------------------------------------------
// validateDomainName — pure unit tests
// ---------------------------------------------------------------------------
describe('validateDomainName', () => {
  it('returns error string for empty input', () => {
    const result = validateDomainName('')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('returns error string for whitespace-only input', () => {
    const result = validateDomainName('   ')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('returns error string when slug resolves to empty (e.g. "---")', () => {
    const result = validateDomainName('---')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('returns true for a valid domain name', () => {
    const result = validateDomainName('Spring Boot microservices')
    expect(result).toBe(true)
  })

  it('returns true for a single word', () => {
    expect(validateDomainName('kubernetes')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// showCreateDomainScreen — integration tests with isolated file I/O
// ---------------------------------------------------------------------------
let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-create-'))
  _setDataDir(testDir)
  mockInput.mockReset()
  mockSelect.mockReset()
  vi.mocked(readSettings).mockClear()
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('showCreateDomainScreen', () => {
  it('creates domain file when slug is new', async () => {
    mockInput.mockResolvedValueOnce('Spring Boot microservices')
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    await showCreateDomainScreen()

    const result = await readDomain('spring-boot-microservices')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(0)
    expect(result.data.meta.difficultyLevel).toBe(2)
    expect(result.data.meta.startingDifficulty).toBe(2)
    expect(result.data.history).toEqual([])
  })

  it('creates domain with non-default starting difficulty', async () => {
    mockInput.mockResolvedValueOnce('Advanced topic')
    mockSelect.mockResolvedValueOnce(4)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    await showCreateDomainScreen()

    const result = await readDomain('advanced-topic')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.difficultyLevel).toBe(4)
    expect(result.data.meta.startingDifficulty).toBe(4)
  })

  it('does not overwrite existing domain and warns when slug already exists', async () => {
    await writeSettings(settingsWith(activeLicense()))
    // Pre-create with a non-default score to detect overwrites
    const existing = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, score: 999 } }
    await writeDomain('my-topic', existing)

    mockInput
      .mockResolvedValueOnce('my-topic')     // first attempt — duplicate
      .mockResolvedValueOnce('other-topic')  // second attempt — unique
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showCreateDomainScreen()

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('A domain named "my-topic" already exists.'))
    warnSpy.mockRestore()

    // Existing data must be preserved — score still 999, not reset to 0
    const result = await readDomain('my-topic')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(999)

    // Second unique domain should have been created
    const result2 = await readDomain('other-topic')
    expect(result2.ok).toBe(true)
  })

  it('does not create a file when slug matches an archived domain', async () => {
    await writeSettings(settingsWith(activeLicense()))
    const archived = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, archived: true } }
    await writeDomain('archived-topic', archived)

    mockInput
      .mockResolvedValueOnce('archived-topic')  // first attempt — archived duplicate
      .mockResolvedValueOnce('fresh-topic')     // second attempt — unique
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showCreateDomainScreen()

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('A domain named "archived-topic" already exists in your archived domains.'))
    warnSpy.mockRestore()

    // listDomains should still show exactly one entry for archived slug (no duplicate written)
    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'archived-topic')).toHaveLength(1)

    // Second unique domain should have been created
    const result = await readDomain('fresh-topic')
    expect(result.ok).toBe(true)
  })

  it('detects duplicate via slugified comparison', async () => {
    await writeSettings(settingsWith(activeLicense()))
    // Pre-create with slug "python-3"
    await writeDomain('python-3', defaultDomainFile())

    mockInput
      .mockResolvedValueOnce('Python 3')       // slugifies to "python-3" — duplicate
      .mockResolvedValueOnce('python-basics')   // unique
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showCreateDomainScreen()

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('A domain named "Python 3" already exists.'))
    warnSpy.mockRestore()

    // Unique domain should have been created
    const result = await readDomain('python-basics')
    expect(result.ok).toBe(true)
  })

  it('logs an error and does not write when listDomains fails', async () => {
    // Point DATA_DIR at a file to force readdir to fail with ENOTDIR → { ok: false }
    const fakePath = join(testDir, 'not-a-dir')
    await writeFile(fakePath, 'data')
    _setDataDir(fakePath)

    mockInput.mockResolvedValueOnce('new-topic')
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await showCreateDomainScreen()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()

    // Restore real testDir and confirm no domain file was created
    _setDataDir(testDir)
    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'new-topic')).toHaveLength(0)
  })

  it('Back: does not create domain and returns without error', async () => {
    mockInput.mockResolvedValueOnce('some-topic')
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('back') // nav

    await expect(showCreateDomainScreen()).resolves.toBeUndefined()

    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'some-topic')).toHaveLength(0)
  })

  it('Back at difficulty: does not create domain and returns without error', async () => {
    mockInput.mockResolvedValueOnce('some-topic')
    mockSelect.mockResolvedValueOnce('back') // back at difficulty

    await expect(showCreateDomainScreen()).resolves.toBeUndefined()

    expect(mockSelect).toHaveBeenCalledOnce()
    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'some-topic')).toHaveLength(0)
  })

  it('returns silently when ExitPromptError is thrown from input', async () => {
    mockInput.mockRejectedValueOnce(new ExitPromptError())

    await expect(showCreateDomainScreen()).resolves.toBeUndefined()

    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data).toHaveLength(0)
  })

  it('returns silently when ExitPromptError is thrown from nav select', async () => {
    mockInput.mockResolvedValueOnce('some-topic')
    mockSelect.mockResolvedValueOnce(2)
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await expect(showCreateDomainScreen()).resolves.toBeUndefined()

    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data).toHaveLength(0)
  })

  it('logs an error when writeDomain fails', async () => {
    mockInput.mockResolvedValueOnce('new-topic')
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav
    const { chmod } = await import('node:fs/promises')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Make the data directory read-only so the atomic tmp write fails
    await chmod(testDir, 0o555)
    try {
      await showCreateDomainScreen()
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create domain'))
    } finally {
      await chmod(testDir, 0o755)
      errorSpy.mockRestore()
    }
  })

  it('calls clearScreen before the input prompt', async () => {
    mockInput.mockResolvedValueOnce('new domain name')
    mockSelect.mockResolvedValueOnce(2)      // difficulty
    mockSelect.mockResolvedValueOnce('save') // nav

    await showCreateDomainScreen()

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })

  it('re-throws non-ExitPromptError from input prompt', async () => {
    const boom = new Error('unexpected input failure')
    mockInput.mockRejectedValueOnce(boom)

    await expect(showCreateDomainScreen()).rejects.toThrow('unexpected input failure')
  })
})

// ---------------------------------------------------------------------------
// Domain cap enforcement (Story 14.7)
// ---------------------------------------------------------------------------

describe('domain cap enforcement', () => {
  beforeEach(() => {
    vi.mocked(router.showActivateLicense).mockReset()
    vi.mocked(router.showActivateLicense).mockResolvedValue(undefined)
  })

  describe('isCapBlocked predicate', () => {
    it('returns false when license is active even with many domains', async () => {
      await writeSettings(settingsWith(activeLicense()))
      for (let i = 0; i < 5; i++) {
        await writeDomain(`d-${i}`, defaultDomainFile())
      }
      expect(await isCapBlocked()).toBe(false)
    })

    it('returns false on free tier with 0 domains', async () => {
      expect(await isCapBlocked()).toBe(false)
    })

    it('returns true on free tier with 1 active domain', async () => {
      await writeDomain('only-one', defaultDomainFile())
      expect(await isCapBlocked()).toBe(true)
    })

    it('returns true on free tier with 1 archived domain', async () => {
      const archived = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, archived: true } }
      await writeDomain('archived-one', archived)
      expect(await isCapBlocked()).toBe(true)
    })

    it('returns true on free tier with 1 active + 1 archived', async () => {
      await writeDomain('active-one', defaultDomainFile())
      const archived = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, archived: true } }
      await writeDomain('archived-one', archived)
      expect(await isCapBlocked()).toBe(true)
    })

    it('returns true on free tier with 1 corrupted domain', async () => {
      await writeFile(join(testDir, 'broken.json'), '{not json', 'utf8')
      const list = await listDomains()
      expect(list.ok).toBe(true)
      if (!list.ok) return
      expect(list.data.some((e) => e.corrupted)).toBe(true)
      expect(await isCapBlocked()).toBe(true)
    })

    it('returns true with inactive license and 1 domain', async () => {
      await writeSettings(settingsWith({ ...activeLicense(), status: 'inactive' }))
      await writeDomain('only-one', defaultDomainFile())
      expect(await isCapBlocked()).toBe(true)
    })

    it('fails open when listDomains errors (returns false)', async () => {
      const fakePath = join(testDir, 'not-a-dir-cap')
      await writeFile(fakePath, 'data')
      _setDataDir(fakePath)
      try {
        expect(await isCapBlocked()).toBe(false)
      } finally {
        _setDataDir(testDir)
      }
    })

    it('treats settings read failure as free tier and blocks when a domain exists', async () => {
      await writeDomain('existing', defaultDomainFile())
      vi.mocked(readSettings).mockResolvedValueOnce({ ok: false, error: 'Failed to read settings' })

      expect(await isCapBlocked()).toBe(true)
    })
  })

  describe('showCreateDomainScreen with cap', () => {
    it('runs standard flow when licensed even with many domains', async () => {
      await writeSettings(settingsWith(activeLicense()))
      for (let i = 0; i < 5; i++) {
        await writeDomain(`d-${i}`, defaultDomainFile())
      }
      mockInput.mockResolvedValueOnce('new domain')
      mockSelect.mockResolvedValueOnce(2)
      mockSelect.mockResolvedValueOnce('save')

      await showCreateDomainScreen()

      expect(mockInput).toHaveBeenCalled()
      expect(vi.mocked(router.showActivateLicense)).not.toHaveBeenCalled()
      const result = await readDomain('new-domain')
      expect(result.ok).toBe(true)
    })

    it('shows upsell when free-tier with one existing domain, dispatching Activate License', async () => {
      await writeDomain('existing', defaultDomainFile())
      mockSelect.mockResolvedValueOnce('activate')

      await showCreateDomainScreen()

      expect(mockInput).not.toHaveBeenCalled()
      expect(vi.mocked(router.showActivateLicense)).toHaveBeenCalledOnce()
      // No new domain written
      const list = await listDomains()
      expect(list.ok).toBe(true)
      if (!list.ok) return
      expect(list.data.map((e) => e.slug)).toEqual(['existing'])
    })

    it('shows upsell and returns without writing on Back', async () => {
      await writeDomain('existing', defaultDomainFile())
      mockSelect.mockResolvedValueOnce('back')

      await showCreateDomainScreen()

      expect(vi.mocked(router.showActivateLicense)).not.toHaveBeenCalled()
      expect(mockInput).not.toHaveBeenCalled()
      const list = await listDomains()
      expect(list.ok).toBe(true)
      if (!list.ok) return
      expect(list.data.map((e) => e.slug)).toEqual(['existing'])
    })

    it('shows upsell when settings read fails and one domain exists', async () => {
      await writeDomain('existing', defaultDomainFile())
      vi.mocked(readSettings).mockResolvedValueOnce({ ok: false, error: 'Failed to read settings' })
      mockSelect.mockResolvedValueOnce('back')

      await showCreateDomainScreen()

      expect(mockInput).not.toHaveBeenCalled()
      expect(mockSelect).toHaveBeenCalledOnce()
      expect(vi.mocked(router.showActivateLicense)).not.toHaveBeenCalled()
    })

    it('returns silently on Ctrl+C (ExitPromptError) at the upsell action prompt', async () => {
      await writeDomain('existing', defaultDomainFile())
      mockSelect.mockRejectedValueOnce(new ExitPromptError())

      await expect(showCreateDomainScreen()).resolves.toBeUndefined()
      expect(vi.mocked(router.showActivateLicense)).not.toHaveBeenCalled()
    })
  })
})
