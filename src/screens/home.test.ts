import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildHomeChoices, filterActiveDomains, showHomeScreen, type HomeEntry, type HomeAction } from './home.js'

// Prevent the real SDK (CJS/ESM issue) from loading via home → router → quiz → ai/client chain
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))
vi.mock('../domain/store.js', () => ({
  listDomains: vi.fn(),
  readDomain: vi.fn(),
}))
vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
  showQuiz: vi.fn(),
  archiveDomain: vi.fn(),
  showCreateDomain: vi.fn(),
  showArchived: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))

import type { DomainListEntry } from '../domain/store.js'
import type { DomainMeta } from '../domain/schema.js'
import { select } from '@inquirer/prompts'
import { listDomains, readDomain } from '../domain/store.js'
import * as router from '../router.js'
import { clearScreen } from '../utils/screen.js'
import { defaultDomainFile } from '../domain/schema.js'

const mockSelect = vi.mocked(select)
const mockListDomains = vi.mocked(listDomains)
const mockReadDomain = vi.mocked(readDomain)

beforeEach(() => {
  vi.clearAllMocks()
  mockListDomains.mockResolvedValue({ ok: true, data: [] })
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  vi.mocked(router.showDomainMenu).mockResolvedValue(undefined)
  vi.mocked(router.showQuiz).mockResolvedValue(undefined)
  vi.mocked(router.archiveDomain).mockResolvedValue(undefined)
  vi.mocked(router.showCreateDomain).mockResolvedValue(undefined)
  vi.mocked(router.showArchived).mockResolvedValue(undefined)
})

// Separator instances have no `value` property — use this guard throughout
function isActionChoice(c: unknown): c is { name: string; value: HomeAction } {
  return typeof c === 'object' && c !== null && 'value' in c
}

function actionChoices(entries: HomeEntry[]) {
  return buildHomeChoices(entries).filter(isActionChoice)
}

function domainChoices(entries: HomeEntry[]) {
  return actionChoices(entries).filter((c) => c.value.action === 'select')
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
    expect(actionTypes).toContain('exit')
  })

  it('puts single domain entry first before action items', () => {
    const entries: HomeEntry[] = [{ slug: 'typescript', score: 100, totalQuestions: 10 }]
    const choices = buildHomeChoices(entries)
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

  it('always includes create, archived, and exit actions regardless of domain count', () => {
    for (const entries of [[], [{ slug: 'go', score: 10, totalQuestions: 1 }]] as HomeEntry[][]) {
      const actions = actionChoices(entries).map((c) => c.value.action)
      expect(actions).toContain('create')
      expect(actions).toContain('archived')
      expect(actions).toContain('exit')
    }
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
// filterActiveDomains
// ---------------------------------------------------------------------------

function makeMeta(overrides: Partial<DomainMeta> = {}): DomainMeta {
  return {
    score: 0,
    difficultyLevel: 2,
    streakCount: 0,
    streakType: 'none',
    totalTimePlayedMs: 0,
    createdAt: new Date().toISOString(),
    lastSessionAt: null,
    archived: false,
    ...overrides,
  }
}

function activeEntry(slug: string): DomainListEntry {
  return { slug, corrupted: false, meta: makeMeta() }
}

function archivedEntry(slug: string): DomainListEntry {
  return { slug, corrupted: false, meta: makeMeta({ archived: true }) }
}

function corruptedEntry(slug: string): DomainListEntry {
  return { slug, corrupted: true }
}

describe('filterActiveDomains', () => {
  it('returns empty array when input is empty', () => {
    expect(filterActiveDomains([])).toHaveLength(0)
  })

  it('includes active (non-archived, non-corrupted) entries', () => {
    const result = filterActiveDomains([activeEntry('typescript')])
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('typescript')
  })

  it('excludes corrupted entries', () => {
    const result = filterActiveDomains([activeEntry('a'), corruptedEntry('b')])
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('a')
  })

  it('excludes archived entries', () => {
    const result = filterActiveDomains([activeEntry('a'), archivedEntry('b')])
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
    const result = filterActiveDomains(entries)
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.slug)).toEqual(['active-1', 'active-2'])
  })
})

// ---------------------------------------------------------------------------
// showHomeScreen — routing
// ---------------------------------------------------------------------------
describe('showHomeScreen — routing', () => {
  it('calls router.showDomainMenu with the correct slug when a domain is selected', async () => {
    const domain = defaultDomainFile()
    mockListDomains.mockResolvedValue({
      ok: true,
      data: [{ slug: 'typescript', meta: domain.meta, corrupted: false as const }],
    })
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: string | number | null) => {
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

  it('calls clearScreen before rendering', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: string | number | null) => {
      throw new Error('process.exit')
    })
    mockSelect.mockResolvedValueOnce({ action: 'exit' })

    await expect(showHomeScreen()).rejects.toThrow('process.exit')
    expect(vi.mocked(clearScreen)).toHaveBeenCalled()
    exitSpy.mockRestore()
  })
})
