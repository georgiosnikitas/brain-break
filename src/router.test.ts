import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  archiveDomain,
  showHome,
  showQuiz,
  showChallenge,
  showCreateDomain,
  showArchived,
  showHistory,
  showBookmarks,
  showStats,
  showAsciiArt,
  showMyCoach,
  deleteDomain,
  showDomainMenu,
  showSettings,
  showProviderSetup,
  showWelcome,
  showExit,
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
vi.mock('./screens/bookmarks.js', () => ({ showBookmarks: vi.fn() }))
vi.mock('./screens/stats.js', () => ({ showStats: vi.fn() }))
vi.mock('./screens/ascii-art.js', () => ({ showAsciiArtScreen: vi.fn() }))
vi.mock('./screens/my-coach.js', () => ({ showMyCoachScreen: vi.fn() }))
vi.mock('./screens/domain-menu.js', () => ({ showDomainMenuScreen: vi.fn() }))
vi.mock('./screens/sprint-setup.js', () => ({ showSprintSetup: vi.fn() }))
vi.mock('./screens/challenge.js', () => ({ showChallengeExecution: vi.fn() }))
vi.mock('./screens/settings.js', () => ({ showSettingsScreen: vi.fn() }))
vi.mock('./screens/provider-setup.js', () => ({ showProviderSetupScreen: vi.fn() }))
vi.mock('./screens/welcome.js', () => ({ showWelcomeScreen: vi.fn() }))
vi.mock('./screens/exit.js', () => ({ showExitScreen: vi.fn() }))

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
import { showBookmarks as showBookmarksScreen } from './screens/bookmarks.js'
import { showStats as showStatsScreen } from './screens/stats.js'
import { showAsciiArtScreen } from './screens/ascii-art.js'
import { showMyCoachScreen } from './screens/my-coach.js'
import { showDomainMenuScreen } from './screens/domain-menu.js'
import { showSprintSetup } from './screens/sprint-setup.js'
import { showChallengeExecution } from './screens/challenge.js'
import { showSettingsScreen } from './screens/settings.js'
import { showProviderSetupScreen } from './screens/provider-setup.js'
import { showWelcomeScreen } from './screens/welcome.js'
import { showExitScreen } from './screens/exit.js'

describe('showHome', () => {
  it('delegates to showHomeScreen', async () => {
    await showHome()
    expect(showHomeScreen).toHaveBeenCalledWith(null)
  })

  it('passes a launch notice to showHomeScreen', async () => {
    await showHome('offline')
    expect(showHomeScreen).toHaveBeenCalledWith('offline')
  })
})

describe('showQuiz', () => {
  it('delegates to showSelectDomainScreen with the slug', async () => {
    await showQuiz('my-slug')
    expect(showSelectDomainScreen).toHaveBeenCalledWith('my-slug')
  })
})

describe('showChallenge', () => {
  it('is exported and callable', async () => {
    vi.mocked(showSprintSetup).mockResolvedValueOnce(null)

    await expect(showChallenge('my-slug')).resolves.toBeNull()
  })

  it('delegates to showSprintSetup with the slug', async () => {
    vi.mocked(showSprintSetup).mockResolvedValueOnce(null)

    await showChallenge('my-slug')

    expect(showSprintSetup).toHaveBeenCalledWith('my-slug')
  })

  it('calls showChallengeExecution with slug, config, and preloaded questions after successful preload', async () => {
    const config = { timeBudgetMs: 300_000, questionCount: 10 }
    const sessionData = { records: [], startingDifficulty: 2 }
    const questions = [{ question: 'Q1' }] as Array<{ question: string }>
    const storeModule = await import('./domain/store.js')
    const aiClientModule = await import('./ai/client.js')
    const { defaultSettings } = await import('./domain/schema.js')

    vi.mocked(showSprintSetup).mockResolvedValueOnce(config)
    vi.spyOn(storeModule, 'readDomain').mockResolvedValueOnce({ ok: true, data: defaultDomainFile() })
    vi.spyOn(storeModule, 'readSettings').mockResolvedValueOnce({ ok: true, data: defaultSettings() })
    vi.spyOn(aiClientModule, 'preloadQuestions').mockResolvedValueOnce({ ok: true, data: questions as never[] })
    vi.mocked(showChallengeExecution).mockResolvedValueOnce(sessionData)

    await showChallenge('my-slug')

    expect(showChallengeExecution).toHaveBeenCalledWith('my-slug', config, questions)
  })

  it('returns session data from showChallengeExecution', async () => {
    const config = { timeBudgetMs: 300_000, questionCount: 10 }
    const sessionData = { records: [], startingDifficulty: 2 }
    const questions = [{ question: 'Q1' }] as Array<{ question: string }>
    const storeModule = await import('./domain/store.js')
    const aiClientModule = await import('./ai/client.js')
    const { defaultSettings } = await import('./domain/schema.js')

    vi.mocked(showSprintSetup).mockResolvedValueOnce(config)
    vi.spyOn(storeModule, 'readDomain').mockResolvedValueOnce({ ok: true, data: defaultDomainFile() })
    vi.spyOn(storeModule, 'readSettings').mockResolvedValueOnce({ ok: true, data: defaultSettings() })
    vi.spyOn(aiClientModule, 'preloadQuestions').mockResolvedValueOnce({ ok: true, data: questions as never[] })
    vi.mocked(showChallengeExecution).mockResolvedValueOnce(sessionData)

    await expect(showChallenge('my-slug')).resolves.toEqual(sessionData)
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

describe('showBookmarks', () => {
  it('delegates to showBookmarksScreen with the slug', async () => {
    await showBookmarks('bookmarks-slug')
    expect(showBookmarksScreen).toHaveBeenCalledWith('bookmarks-slug')
  })
})

describe('showStats', () => {
  it('delegates to showStatsScreen with the slug', async () => {
    await showStats('stats-slug')
    expect(showStatsScreen).toHaveBeenCalledWith('stats-slug')
  })
})

describe('showAsciiArt', () => {
  it('delegates to showAsciiArtScreen with slug, correctCount, and threshold', async () => {
    await showAsciiArt('art-slug', 100, 100)
    expect(showAsciiArtScreen).toHaveBeenCalledWith('art-slug', 100, 100)
  })
})

describe('showDomainMenu', () => {
  it('delegates to showDomainMenuScreen with the slug', async () => {
    await showDomainMenu('menu-slug')
    expect(showDomainMenuScreen).toHaveBeenCalledWith('menu-slug', undefined)
  })

  it('delegates to showDomainMenuScreen with sessionData when provided', async () => {
    const sessionData = { records: [], startingDifficulty: 2 }
    await showDomainMenu('menu-slug', sessionData)
    expect(showDomainMenuScreen).toHaveBeenCalledWith('menu-slug', sessionData)
  })
})

describe('showSettings', () => {
  it('delegates to showSettingsScreen', async () => {
    await showSettings()
    expect(showSettingsScreen).toHaveBeenCalledOnce()
  })
})

describe('showProviderSetup', () => {
  it('delegates to showProviderSetupScreen with settings', async () => {
    const { defaultSettings } = await import('./domain/schema.js')
    const s = defaultSettings()
    await showProviderSetup(s)
    expect(showProviderSetupScreen).toHaveBeenCalledWith(s)
  })
})

describe('showWelcome', () => {
  it('delegates to showWelcomeScreen', async () => {
    await showWelcome()
    expect(showWelcomeScreen).toHaveBeenCalledOnce()
  })
})

describe('showExit', () => {
  it('delegates to showExitScreen', async () => {
    await showExit(42)
    expect(showExitScreen).toHaveBeenCalledWith(42)
  })
})

describe('showMyCoach', () => {
  it('delegates to showMyCoachScreen with the slug', async () => {
    await showMyCoach('my-slug')
    expect(showMyCoachScreen).toHaveBeenCalledWith('my-slug')
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
