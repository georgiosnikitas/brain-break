import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defaultDomainFile, defaultSettings } from './domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks — must be declared before dynamic imports
// ---------------------------------------------------------------------------
const mockShowSprintSetup = vi.fn()
const mockShowChallengeExecution = vi.fn()
const mockReadDomain = vi.fn()
const mockReadSettings = vi.fn()
const mockPreloadQuestions = vi.fn()
const mockSelect = vi.fn()
const mockOraInstance = { start: vi.fn(), stop: vi.fn(), text: '' }
const mockOra = vi.fn(() => {
  mockOraInstance.start.mockReturnValue(mockOraInstance)
  return mockOraInstance
})

vi.mock('./screens/sprint-setup.js', () => ({ showSprintSetup: mockShowSprintSetup }))
vi.mock('./screens/challenge.js', () => ({ showChallengeExecution: mockShowChallengeExecution }))
vi.mock('./domain/store.js', () => ({
  readDomain: mockReadDomain,
  readSettings: mockReadSettings,
  writeDomain: vi.fn(),
  deleteDomain: vi.fn(),
  _setDataDir: vi.fn(),
}))
vi.mock('./ai/client.js', () => ({ preloadQuestions: mockPreloadQuestions }))
vi.mock('ora', () => ({ default: mockOra }))
vi.mock('@inquirer/prompts', () => ({ select: mockSelect, Separator: vi.fn() }))
vi.mock('@inquirer/core', () => ({
  ExitPromptError: class ExitPromptError extends Error {},
}))

// Stub out all other screen mocks to prevent side-effects
vi.mock('./screens/home.js', () => ({ showHomeScreen: vi.fn() }))
vi.mock('./screens/create-domain.js', () => ({ showCreateDomainScreen: vi.fn() }))
vi.mock('./screens/select-domain.js', () => ({ showSelectDomainScreen: vi.fn() }))
vi.mock('./screens/archived.js', () => ({ showArchivedScreen: vi.fn() }))
vi.mock('./screens/history.js', () => ({ showHistory: vi.fn() }))
vi.mock('./screens/bookmarks.js', () => ({ showBookmarks: vi.fn() }))
vi.mock('./screens/stats.js', () => ({ showStats: vi.fn() }))
vi.mock('./screens/domain-menu.js', () => ({ showDomainMenuScreen: vi.fn() }))
vi.mock('./screens/settings.js', () => ({ showSettingsScreen: vi.fn() }))
vi.mock('./screens/provider-setup.js', () => ({ showProviderSetupScreen: vi.fn() }))
vi.mock('./screens/welcome.js', () => ({ showWelcomeScreen: vi.fn() }))
vi.mock('./screens/exit.js', () => ({ showExitScreen: vi.fn() }))

const { showChallenge } = await import('./router.js')
const { ExitPromptError } = await import('@inquirer/core')

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const domain = defaultDomainFile()
const settings = defaultSettings()
const config = { timeBudgetMs: 300_000, questionCount: 10 }

beforeEach(() => {
  vi.clearAllMocks()
  mockOraInstance.text = ''
  mockShowChallengeExecution.mockResolvedValue(null)
  mockReadDomain.mockResolvedValue({ ok: true, data: domain })
  mockReadSettings.mockResolvedValue({ ok: true, data: settings })
})

// ---------------------------------------------------------------------------
// showChallenge — preload orchestration
// ---------------------------------------------------------------------------
describe('showChallenge — preload orchestration', () => {
  it('calls readDomain and readSettings after setup returns config', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockResolvedValueOnce({ ok: true, data: [] })

    await showChallenge('my-slug')

    expect(mockReadDomain).toHaveBeenCalledWith('my-slug')
    expect(mockReadSettings).toHaveBeenCalledOnce()
  })

  it('calls preloadQuestions with correct args', async () => {
    const domainWithData = {
      ...defaultDomainFile(3),
      hashes: ['hash-a', 'hash-b'],
    }
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockReadDomain.mockResolvedValueOnce({ ok: true, data: domainWithData })
    mockReadSettings.mockResolvedValueOnce({ ok: true, data: settings })
    mockPreloadQuestions.mockResolvedValueOnce({ ok: true, data: [] })

    await showChallenge('my-slug')

    expect(mockPreloadQuestions).toHaveBeenCalledWith(
      10,
      'my-slug',
      3,
      new Set(['hash-a', 'hash-b']),
      settings,
      expect.any(Function),
    )
  })

  it('delegates to showChallengeExecution on preload success', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockResolvedValueOnce({ ok: true, data: [{ question: 'Q1' }] })
    mockShowChallengeExecution.mockResolvedValueOnce(null)

    const result = await showChallenge('my-slug')

    expect(result).toBeNull()
    expect(mockShowChallengeExecution).toHaveBeenCalledWith('my-slug', config, [{ question: 'Q1' }])
    expect(mockOraInstance.stop).toHaveBeenCalled()
  })

  it('returns null on preload failure and displays error', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockResolvedValueOnce({ ok: false, error: 'No API key' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await showChallenge('my-slug')

    expect(result).toBeNull()
    expect(mockOraInstance.stop).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('does not call preloadQuestions when setup returns null', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(null)

    const result = await showChallenge('my-slug')

    expect(result).toBeNull()
    expect(mockPreloadQuestions).not.toHaveBeenCalled()
    expect(mockReadDomain).not.toHaveBeenCalled()
    expect(mockReadSettings).not.toHaveBeenCalled()
  })

  it('starts and updates the ora spinner during preload', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockImplementation(async (_count, _d, _diff, _h, _s, onProgress) => {
      onProgress?.(3, 10)
      return { ok: true, data: [] }
    })

    await showChallenge('my-slug')

    expect(mockOra).toHaveBeenCalledWith('Generating questions (0/10)...')
    expect(mockOraInstance.start).toHaveBeenCalled()
    expect(mockOraInstance.text).toBe('Generating questions (3/10)...')
    expect(mockOraInstance.stop).toHaveBeenCalled()
  })

  it('falls back to defaults when readDomain fails', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockReadDomain.mockResolvedValueOnce({ ok: false, error: 'not found' })
    mockPreloadQuestions.mockResolvedValueOnce({ ok: true, data: [] })

    await showChallenge('my-slug')

    const callArgs = mockPreloadQuestions.mock.calls[0]
    expect(callArgs[2]).toBe(2) // defaultDomainFile().meta.difficultyLevel
    expect(callArgs[3]).toEqual(new Set())
  })

  it('returns null when error-display Back prompt throws ExitPromptError', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockResolvedValueOnce({ ok: false, error: 'fail' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    const result = await showChallenge('my-slug')

    expect(result).toBeNull()
  })

  it('re-throws non-ExitPromptError from error-display Back prompt', async () => {
    mockShowSprintSetup.mockResolvedValueOnce(config)
    mockPreloadQuestions.mockResolvedValueOnce({ ok: false, error: 'fail' })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockSelect.mockRejectedValueOnce(new Error('unexpected'))

    await expect(showChallenge('my-slug')).rejects.toThrow('unexpected')
  })
})
