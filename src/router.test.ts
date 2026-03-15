import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  archiveDomain,
  showHome,
  showQuiz,
  showCreateDomain,
  showArchived,
  showHistory,
  showStats,
  deleteDomain,
  showDomainMenu,
  showSettings,
} from './router.js'
import { writeDomain, readDomain, _setDataDir } from './domain/store.js'
import { defaultDomainFile } from './domain/schema.js'

// ---------------------------------------------------------------------------
// vi.mock for screens (prevent side-effects from unrelated router functions)
// ---------------------------------------------------------------------------
vi.mock('./screens/home.js', () => ({ showHomeScreen: vi.fn() }))
vi.mock('./screens/create-domain.js', () => ({ showCreateDomainScreen: vi.fn() }))
vi.mock('./screens/select-domain.js', () => ({ showSelectDomainScreen: vi.fn() }))
vi.mock('./screens/archived.js', () => ({ showArchivedScreen: vi.fn() }))
vi.mock('./screens/history.js', () => ({ showHistory: vi.fn() }))
vi.mock('./screens/stats.js', () => ({ showStats: vi.fn() }))
vi.mock('./screens/domain-menu.js', () => ({ showDomainMenuScreen: vi.fn() }))
vi.mock('./screens/settings.js', () => ({ showSettingsScreen: vi.fn() }))

// ---------------------------------------------------------------------------
// archiveDomain
// ---------------------------------------------------------------------------
let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-router-'))
  _setDataDir(testDir)
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('archiveDomain', () => {
  it('sets archived:true and preserves all domain data', async () => {
    const original = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 42, difficultyLevel: 3 },
    }
    await writeDomain('my-topic', original)

    await archiveDomain('my-topic')

    const after = await readDomain('my-topic')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.meta.archived).toBe(true)
    expect(after.data.meta.score).toBe(42)
    expect(after.data.meta.difficultyLevel).toBe(3)
  })

  it('emits console.warn and does not write when readDomain fails', async () => {
    // Write a corrupted file to force readDomain to return ok:false
    await writeFile(join(testDir, 'bad-slug.json'), 'not-json')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await archiveDomain('bad-slug')

    expect(warnSpy).toHaveBeenCalled()
    // File should remain corrupted (no successful write)
    const after = await readDomain('bad-slug')
    expect(after.ok).toBe(false)
  })

  it('emits console.error when writeDomain fails', async () => {
    const original = defaultDomainFile()
    await writeDomain('write-fail', original)

    // Block the tmp write path so writeDomain returns ok:false
    await mkdir(join(testDir, '.tmp-write-fail.json'))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await archiveDomain('write-fail')

    expect(errorSpy).toHaveBeenCalled()
    // Domain should remain unarchived since write failed
    const after = await readDomain('write-fail')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.meta.archived).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Screen delegation smoke tests
// ---------------------------------------------------------------------------
import { showHomeScreen } from './screens/home.js'
import { showCreateDomainScreen } from './screens/create-domain.js'
import { showSelectDomainScreen } from './screens/select-domain.js'
import { showArchivedScreen } from './screens/archived.js'
import { showHistory as showHistoryScreen } from './screens/history.js'
import { showStats as showStatsScreen } from './screens/stats.js'
import { showDomainMenuScreen } from './screens/domain-menu.js'
import { showSettingsScreen } from './screens/settings.js'

describe('showHome', () => {
  it('delegates to showHomeScreen', async () => {
    await showHome()
    expect(showHomeScreen).toHaveBeenCalledOnce()
  })
})

describe('showQuiz', () => {
  it('delegates to showSelectDomainScreen with the slug', async () => {
    await showQuiz('my-slug')
    expect(showSelectDomainScreen).toHaveBeenCalledWith('my-slug')
  })
})

describe('showCreateDomain', () => {
  it('delegates to showCreateDomainScreen', async () => {
    await showCreateDomain()
    expect(showCreateDomainScreen).toHaveBeenCalledOnce()
  })
})

describe('showArchived', () => {
  it('delegates to showArchivedScreen', async () => {
    await showArchived()
    expect(showArchivedScreen).toHaveBeenCalledOnce()
  })
})

describe('showHistory', () => {
  it('delegates to showHistoryScreen with the slug', async () => {
    await showHistory('history-slug')
    expect(showHistoryScreen).toHaveBeenCalledWith('history-slug')
  })
})

describe('showStats', () => {
  it('delegates to showStatsScreen with the slug', async () => {
    await showStats('stats-slug')
    expect(showStatsScreen).toHaveBeenCalledWith('stats-slug')
  })
})

describe('showDomainMenu', () => {
  it('delegates to showDomainMenuScreen with the slug', async () => {
    await showDomainMenu('menu-slug')
    expect(showDomainMenuScreen).toHaveBeenCalledWith('menu-slug')
  })
})

describe('showSettings', () => {
  it('delegates to showSettingsScreen', async () => {
    await showSettings()
    expect(showSettingsScreen).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// deleteDomain
// ---------------------------------------------------------------------------
describe('deleteDomain', () => {
  it('emits console.error when the underlying store delete fails', async () => {
    // Place a directory at the expected file path so unlink fails with EISDIR
    await mkdir(join(testDir, 'bad-delete.json'))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await deleteDomain('bad-delete')

    expect(errorSpy).toHaveBeenCalled()
  })
})
