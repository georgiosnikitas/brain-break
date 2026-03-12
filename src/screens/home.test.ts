import { describe, it, expect, vi } from 'vitest'
import { buildHomeChoices, filterActiveDomains, type HomeEntry, type HomeAction } from './home.js'

// Prevent the real SDK (CJS/ESM issue) from loading via home → router → quiz → ai/client chain
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: class {}, approveAll: vi.fn() }))
import type { DomainListEntry } from '../domain/store.js'
import type { DomainMeta } from '../domain/schema.js'

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
    const choices = buildHomeChoices([])
    const actions = actionChoices([])
    const domainItems = domainChoices([])

    expect(domainItems).toHaveLength(0)

    // No archive action when list is empty
    expect(actions.every((c) => c.value.action !== 'archive')).toBe(true)

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

  it('includes an archive action for each domain entry', () => {
    const entries: HomeEntry[] = [{ slug: 'typescript', score: 100, totalQuestions: 10 }]
    const actions = actionChoices(entries)
    const archiveActions = actions.filter((c) => c.value.action === 'archive')
    expect(archiveActions).toHaveLength(1)
    expect((archiveActions[0].value as { action: 'archive'; slug: string }).slug).toBe('typescript')
  })

  it('archive action comes immediately after select for the same domain', () => {
    const entries: HomeEntry[] = [{ slug: 'react', score: 0, totalQuestions: 0 }]
    const actions = actionChoices(entries)
    const selectIdx = actions.findIndex((c) => c.value.action === 'select')
    const archiveIdx = actions.findIndex((c) => c.value.action === 'archive')
    expect(archiveIdx).toBe(selectIdx + 1)
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
