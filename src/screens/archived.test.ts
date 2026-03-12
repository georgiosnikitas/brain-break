import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  filterArchivedDomains,
  buildArchivedChoices,
  showArchivedScreen,
  type ArchivedAction,
} from './archived.js'
import { writeDomain, readDomain, _setDataDir } from '../domain/store.js'
import { defaultDomainFile } from '../domain/schema.js'
import type { DomainListEntry } from '../domain/store.js'
import type { DomainMeta } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mock @inquirer/prompts
// ---------------------------------------------------------------------------
const mockSelect = vi.fn()
vi.mock('@inquirer/prompts', () => ({
  select: (...args: unknown[]) => mockSelect(...args),
  Separator: class Separator {},
}))

// ---------------------------------------------------------------------------
// Helpers
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

function isActionChoice(c: unknown): c is { name: string; value: ArchivedAction } {
  return typeof c === 'object' && c !== null && 'value' in c
}

function actionChoices(choices: ReturnType<typeof buildArchivedChoices>) {
  return choices.filter(isActionChoice)
}

// ---------------------------------------------------------------------------
// filterArchivedDomains
// ---------------------------------------------------------------------------
describe('filterArchivedDomains', () => {
  it('returns only archived non-corrupted entries', () => {
    const entries: DomainListEntry[] = [
      { slug: 'active', meta: makeMeta({ archived: false }), corrupted: false },
      { slug: 'archived', meta: makeMeta({ archived: true }), corrupted: false },
      { slug: 'broken', corrupted: true },
    ]
    const result = filterArchivedDomains(entries)
    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe('archived')
  })

  it('returns empty array when no archived domains', () => {
    const entries: DomainListEntry[] = [
      { slug: 'active', meta: makeMeta({ archived: false }), corrupted: false },
    ]
    expect(filterArchivedDomains(entries)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// buildArchivedChoices
// ---------------------------------------------------------------------------
describe('buildArchivedChoices', () => {
  it('returns only Back when entries is empty', () => {
    const choices = buildArchivedChoices([])
    const actions = actionChoices(choices)
    expect(actions).toHaveLength(1)
    expect(actions[0].value.action).toBe('back')
  })

  it('includes an unarchive choice per entry followed by Back', () => {
    const entries = [
      { slug: 'typescript', score: 100, totalQuestions: 10 },
      { slug: 'rust', score: 50, totalQuestions: 5 },
    ]
    const actions = actionChoices(buildArchivedChoices(entries))
    const unarchives = actions.filter((c) => c.value.action === 'unarchive')
    expect(unarchives).toHaveLength(2)
    const slugs = unarchives.map((c) => (c.value as { action: 'unarchive'; slug: string }).slug)
    expect(slugs).toContain('typescript')
    expect(slugs).toContain('rust')
    expect(actions.at(-1)!.value.action).toBe('back')
  })

  it('shows score and question count in unarchive choice name', () => {
    const entries = [{ slug: 'go', score: 200, totalQuestions: 20 }]
    const choice = actionChoices(buildArchivedChoices(entries))[0]
    expect(choice.name).toContain('200')
    expect(choice.name).toContain('20 questions')
    expect(choice.name).toContain('go')
  })
})

// ---------------------------------------------------------------------------
// showArchivedScreen — integration tests
// ---------------------------------------------------------------------------
let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-archived-'))
  _setDataDir(testDir)
  mockSelect.mockReset()
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('showArchivedScreen', () => {
  it('returns immediately when Back is selected', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'back' })
    await showArchivedScreen()
    expect(mockSelect).toHaveBeenCalledTimes(1)
  })

  it('unarchives a domain and preserves all data', async () => {
    const original = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 500, difficultyLevel: 4, archived: true },
    }
    await writeDomain('my-domain', original)

    mockSelect
      .mockResolvedValueOnce({ action: 'unarchive', slug: 'my-domain' })
      .mockResolvedValueOnce({ action: 'back' })

    await showArchivedScreen()

    const after = await readDomain('my-domain')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.meta.archived).toBe(false)
    // All other data preserved (AC4)
    expect(after.data.meta.score).toBe(500)
    expect(after.data.meta.difficultyLevel).toBe(4)
  })

  it('re-renders after unarchive (calls select twice before back)', async () => {
    const archived = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, archived: true },
    }
    await writeDomain('topic', archived)

    mockSelect
      .mockResolvedValueOnce({ action: 'unarchive', slug: 'topic' })
      .mockResolvedValueOnce({ action: 'back' })

    await showArchivedScreen()

    expect(mockSelect).toHaveBeenCalledTimes(2)
  })

  it('shows error and renders empty list when listDomains fails', async () => {
    // Point DATA_DIR at a file to force readdir to fail with ENOTDIR
    const fakePath = join(testDir, 'not-a-dir')
    await writeFile(fakePath, 'data')
    _setDataDir(fakePath)

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showArchivedScreen()

    expect(errorSpy).toHaveBeenCalled()
    // Screen still renders (select called), user can exit via Back
    expect(mockSelect).toHaveBeenCalledTimes(1)
    errorSpy.mockRestore()
  })

  it('shows error and re-renders when writeDomain fails during unarchive', async () => {
    const archived = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, archived: true },
    }
    await writeDomain('fail-topic', archived)

    // Create a directory at the tmp path to force writeFile to fail (EISDIR)
    await mkdir(join(testDir, '.tmp-fail-topic.json'))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSelect
      .mockResolvedValueOnce({ action: 'unarchive', slug: 'fail-topic' })
      .mockResolvedValueOnce({ action: 'back' })

    await showArchivedScreen()

    expect(errorSpy).toHaveBeenCalled()
    // Screen re-rendered after failure (select called twice)
    expect(mockSelect).toHaveBeenCalledTimes(2)
    // Domain remains archived on disk since write failed
    const after = await readDomain('fail-topic')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.meta.archived).toBe(true)
    errorSpy.mockRestore()
  })

  it('returns cleanly on ExitPromptError', async () => {
    mockSelect.mockRejectedValue(new ExitPromptError())
    // Should not throw
    await expect(showArchivedScreen()).resolves.toBeUndefined()
  })
})
