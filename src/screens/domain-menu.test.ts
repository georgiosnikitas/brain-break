import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, defaultSettings } from '../domain/schema.js'

const { mockColorDifficultyLevel } = vi.hoisted(() => ({
  mockColorDifficultyLevel: vi.fn((level: number) => `LEVEL_${level}`),
}))

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
  readSettings: vi.fn(),
}))

vi.mock('../utils/format.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/format.js')>()
  return {
    ...actual,
    colorDifficultyLevel: mockColorDifficultyLevel,
  }
})

vi.mock('../router.js', () => ({
  showQuiz: vi.fn(),
  showChallenge: vi.fn(),
  showHistory: vi.fn(),
  showBookmarks: vi.fn(),
  showStats: vi.fn(),
  showMyCoach: vi.fn(),
  showAsciiArt: vi.fn(),
  archiveDomain: vi.fn(),
  deleteDomain: vi.fn(),
  showHome: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))

vi.mock('./ascii-art.js', () => ({
  renderCompactProgressLabel: vi.fn((count: number, threshold: number) => `🎨 ASCII Art 🔒 ${Math.round((count / threshold) * 100)}%`),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { select, confirm } from '@inquirer/prompts'
import { readDomain, readSettings } from '../domain/store.js'
import * as router from '../router.js'
import { clearAndBanner } from '../utils/screen.js'
import { buildDomainMenuChoices, showDomainMenuScreen, renderSessionSummary, type DomainMenuAction } from './domain-menu.js'

const mockSelect = vi.mocked(select)
const mockConfirm = vi.mocked(confirm)
const mockReadDomain = vi.mocked(readDomain)
const mockReadSettings = vi.mocked(readSettings)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  vi.mocked(router.showQuiz).mockResolvedValue(null)
  vi.mocked(router.showChallenge).mockResolvedValue(null)
  vi.mocked(router.showHistory).mockResolvedValue(undefined)
  vi.mocked(router.showBookmarks).mockResolvedValue(undefined)
  vi.mocked(router.showStats).mockResolvedValue(undefined)
  vi.mocked(router.showMyCoach).mockResolvedValue(undefined)
  vi.mocked(router.showAsciiArt).mockResolvedValue(undefined)
  vi.mocked(router.archiveDomain).mockResolvedValue(undefined)
  vi.mocked(router.deleteDomain).mockResolvedValue(undefined)
  vi.mocked(router.showHome).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// buildDomainMenuChoices
// ---------------------------------------------------------------------------
describe('buildDomainMenuChoices', () => {
  it('returns 11 items with a Separator before Back', () => {
    const choices = buildDomainMenuChoices(0, 100)
    expect(choices).toHaveLength(11)
  })

  it('names contain Play, Challenge, History, Bookmarks, Statistics, My Coach, ASCII Art, Archive, Delete, Back in order', () => {
    const choices = buildDomainMenuChoices(0, 100) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[0].name).toContain('Play')
    expect(choices[1].name).toContain('Challenge')
    expect(choices[2].name).toContain('History')
    expect(choices[3].name).toContain('Bookmarks')
    expect(choices[4].name).toContain('Statistics')
    expect(choices[5].name).toContain('My Coach')
    expect(choices[6].name).toContain('ASCII Art')
    expect(choices[7].name).toContain('Archive')
    expect(choices[8].name).toContain('Delete')
    expect(choices[10].name).toContain('Back')
  })

  it('action values are play, challenge, history, bookmarks, stats, my-coach, ascii-art, archive, delete, back in order', () => {
    const choices = buildDomainMenuChoices(0, 100) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[0].value).toEqual({ action: 'play' })
    expect(choices[1].value).toEqual({ action: 'challenge' })
    expect(choices[2].value).toEqual({ action: 'history' })
    expect(choices[3].value).toEqual({ action: 'bookmarks' })
    expect(choices[4].value).toEqual({ action: 'stats' })
    expect(choices[5].value).toEqual({ action: 'my-coach' })
    expect(choices[6].value).toEqual({ action: 'ascii-art' })
    expect(choices[7].value).toEqual({ action: 'archive' })
    expect(choices[8].value).toEqual({ action: 'delete' })
    expect(choices[10].value).toEqual({ action: 'back' })
  })

  it('shows unlocked label when correctCount >= 100', () => {
    const choices = buildDomainMenuChoices(100, 100) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toBe('🎨 ASCII Art ✨')
  })

  it('shows locked progress label when correctCount < 100', () => {
    const choices = buildDomainMenuChoices(42, 100) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toContain('🎨 ASCII Art')
    expect(choices[6].name).toContain('42%')
  })

  it('Quick threshold: locked at 5/10 shows progress bar', () => {
    const choices = buildDomainMenuChoices(5, 10) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toContain('🎨 ASCII Art')
    expect(choices[6].name).toContain('50%')
  })

  it('Quick threshold: unlocked at 10/10 shows sparkle', () => {
    const choices = buildDomainMenuChoices(10, 10) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toBe('🎨 ASCII Art ✨')
  })

  it('Instant threshold (0): always shows sparkle label', () => {
    const choices = buildDomainMenuChoices(0, 0) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toBe('🎨 ASCII Art ✨')
  })

  it('Instant threshold (0) with history: still shows sparkle label', () => {
    const choices = buildDomainMenuChoices(50, 0) as Array<{ name: string; value: DomainMenuAction }>
    expect(choices[6].name).toBe('🎨 ASCII Art ✨')
  })
})

// ---------------------------------------------------------------------------
// showDomainMenuScreen
// ---------------------------------------------------------------------------
describe('showDomainMenuScreen — Play', () => {
  it('calls router.showQuiz with the correct slug on play', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'play' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showQuiz)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — Challenge', () => {
  it('calls router.showChallenge with the correct slug on challenge', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'challenge' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showChallenge)).toHaveBeenCalledWith('typescript')
  })

  it('renders returned challenge session data on the next menu render', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    vi.mocked(router.showChallenge).mockResolvedValueOnce({
      startingDifficulty: 2,
      records: [makeSessionRecord({ scoreDelta: 12, answeredAt: '2026-03-29T10:00:03.000Z' })],
    })
    mockSelect
      .mockResolvedValueOnce({ action: 'challenge' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const logged = consoleSpy.mock.calls.map((call) => String(call[0])).join('\n')
    expect(logged).toContain('Last Session')

    consoleSpy.mockRestore()
  })
})

describe('showDomainMenuScreen — History', () => {
  it('calls router.showHistory with the correct slug on history', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'history' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHistory)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — Bookmarks', () => {
  it('calls router.showBookmarks with the correct slug on bookmarks', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'bookmarks' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showBookmarks)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — Stats', () => {
  it('calls router.showStats with the correct slug on stats', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'stats' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showStats)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — My Coach', () => {
  it('calls router.showMyCoach with the correct slug on my-coach', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'my-coach' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showMyCoach)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — ASCII Art', () => {
  it('calls router.showAsciiArt with the correct slug and correctCount on ascii-art', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'ascii-art' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    // defaultDomainFile() has empty history → correctCount = 0, default threshold = 100
    expect(vi.mocked(router.showAsciiArt)).toHaveBeenCalledWith('typescript', 0, 100)
  })
})

describe('showDomainMenuScreen — Archive', () => {
  it('calls router.archiveDomain then router.showHome on archive', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'archive' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.archiveDomain)).toHaveBeenCalledWith('typescript')
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — Back', () => {
  it('calls router.showHome on back', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — ExitPromptError', () => {
  it('calls router.showHome when ExitPromptError is thrown', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — readDomain failure', () => {
  it('falls back to defaultDomainFile and logs warning when readDomain fails', async () => {
    mockReadDomain.mockResolvedValue({ ok: false, error: 'file not found' })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })
})

describe('showDomainMenuScreen — message', () => {
  it('prints the domain header before the action prompt', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 250 },
      history: Array.from({ length: 15 }, () => ({
        question: 'Q',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'A' as const,
        userAnswer: 'A' as const,
        isCorrect: true,
        answeredAt: new Date().toISOString(),
        timeTakenMs: 1000,
        speedTier: 'fast' as const,
        scoreDelta: 10,
        difficultyLevel: 2,
        bookmarked: false,
      })),
    }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const headerLine = String(consoleSpy.mock.calls[0][0])
    expect(headerLine).toContain('typescript')
    expect(headerLine).toContain('250')
    expect(headerLine).toContain('15')

    const callArgs = mockSelect.mock.calls[0][0] as { message: string }
    expect(callArgs.message).toBe('Choose an action:')
    consoleSpy.mockRestore()
  })
})

describe('showDomainMenuScreen — clearScreen', () => {
  it('calls clearScreen before rendering', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })
})

describe('showDomainMenuScreen — Delete (confirmed)', () => {
  it('calls router.deleteDomain then router.showHome when user confirms deletion', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'delete' })
    mockConfirm.mockResolvedValueOnce(true)

    await showDomainMenuScreen('typescript')

    expect(mockConfirm).toHaveBeenCalledOnce()
    expect(vi.mocked(router.deleteDomain)).toHaveBeenCalledWith('typescript')
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — Delete (cancelled)', () => {
  it('stays in the menu when user cancels deletion', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'delete' })
      .mockResolvedValueOnce({ action: 'back' })
    mockConfirm.mockResolvedValueOnce(false)

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.deleteDomain)).not.toHaveBeenCalled()
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — Delete (Ctrl+C during confirm)', () => {
  it('calls router.showHome when ExitPromptError is thrown during confirm', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'delete' })
    mockConfirm.mockRejectedValueOnce(new ExitPromptError())

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.deleteDomain)).not.toHaveBeenCalled()
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — non-ExitPromptError re-throw', () => {
  it('re-throws unexpected errors from select', async () => {
    const boom = new Error('unexpected select failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showDomainMenuScreen('typescript')).rejects.toThrow('unexpected select failure')
  })
})

// ---------------------------------------------------------------------------
// renderSessionSummary
// ---------------------------------------------------------------------------
function makeSessionRecord(overrides: Partial<{
  answeredAt: string
  isCorrect: boolean
  scoreDelta: number
  timeTakenMs: number
  difficultyLevel: number
}> = {}) {
  return {
    question: 'Q',
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A' as const,
    userAnswer: overrides.isCorrect === false ? ('B' as const) : ('A' as const),
    isCorrect: overrides.isCorrect ?? true,
    answeredAt: overrides.answeredAt ?? '2026-03-29T10:00:05.000Z',
    timeTakenMs: overrides.timeTakenMs ?? 5000,
    speedTier: 'normal' as const,
    scoreDelta: overrides.scoreDelta ?? 10,
    difficultyLevel: overrides.difficultyLevel ?? 2,
    bookmarked: false,
  }
}

describe('renderSessionSummary', () => {
  it('prints all 8 fields with dim dividers', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    const records = [
      makeSessionRecord({ isCorrect: true, scoreDelta: 15, timeTakenMs: 3000, answeredAt: '2026-03-29T10:00:03.000Z' }),
      makeSessionRecord({ isCorrect: false, scoreDelta: -5, timeTakenMs: 12000, answeredAt: '2026-03-29T10:00:17.000Z' }),
      makeSessionRecord({ isCorrect: true, scoreDelta: 10, timeTakenMs: 3000, answeredAt: '2026-03-29T10:00:22.000Z' }),
    ]
    renderSessionSummary({ records, startingDifficulty: 2 }, 3)

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')

    // Dividers
    expect(logged).toContain('Last Session')
    // Score delta (+20)
    expect(logged).toContain('Score delta:')
    expect(logged).toContain('+20')
    // Questions answered
    expect(logged).toContain('Questions answered:')
    expect(logged).toContain('3')
    // Correct / Incorrect
    expect(logged).toContain('Correct / Incorrect:')
    expect(logged).toContain('2 / 1')
    // Accuracy
    expect(logged).toContain('Accuracy:')
    expect(logged).toContain('66.7%')
    // Fastest answer
    expect(logged).toContain('Fastest answer:')
    expect(logged).toContain('3.0s')
    // Slowest answer
    expect(logged).toContain('Slowest answer:')
    expect(logged).toContain('12.0s')
    // Session duration
    expect(logged).toContain('Session duration:')
    expect(logged).toContain('22s')
    // Difficulty with ▲ indicator
    expect(logged).toContain('Difficulty:')
    expect(logged).toContain('2 — LEVEL_2')
    expect(logged).toContain('3 — LEVEL_3')
    expect(logged).toContain('▲')
    expect(mockColorDifficultyLevel).toHaveBeenNthCalledWith(1, 2)
    expect(mockColorDifficultyLevel).toHaveBeenNthCalledWith(2, 3)

    consoleSpy.mockRestore()
  })

  it('shows ▼ indicator when difficulty decreased', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      { records: [makeSessionRecord()], startingDifficulty: 3 },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('▼')
    consoleSpy.mockRestore()
  })

  it('omits a trailing indicator when difficulty is unchanged', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      { records: [makeSessionRecord()], startingDifficulty: 2 },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Difficulty:')
    expect(logged).toContain('2 — LEVEL_2 → 2 — LEVEL_2')
    expect(logged).not.toContain('2 — LEVEL_2 → 2 — LEVEL_2 —')
    consoleSpy.mockRestore()
  })

  it('uses negative delta formatting when score is negative', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      { records: [makeSessionRecord({ scoreDelta: -8 })], startingDifficulty: 2 },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('-8')
    consoleSpy.mockRestore()
  })

  it('does not render sprint result when all questions completed', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      {
        records: [makeSessionRecord(), makeSessionRecord()],
        startingDifficulty: 2,
        sprintResult: { questionsAnswered: 2, totalQuestions: 2, timedOut: false },
      },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Sprint result:')
    consoleSpy.mockRestore()
  })

  it('renders red sprint result when timer expired', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      {
        records: [makeSessionRecord()],
        startingDifficulty: 2,
        sprintResult: { questionsAnswered: 1, totalQuestions: 3, timedOut: true },
      },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Sprint result:')
    expect(logged).toContain('Time expired — 1 / 3 questions answered')
    consoleSpy.mockRestore()
  })

  it('does not render sprint result field for regular quiz sessions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      { records: [makeSessionRecord()], startingDifficulty: 2 },
      2,
    )

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Sprint result:')
    consoleSpy.mockRestore()
  })

  it('shows X / N format for questions answered in sprint sessions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      {
        records: [makeSessionRecord()],
        startingDifficulty: 2,
        sprintResult: { questionsAnswered: 1, totalQuestions: 5, timedOut: true },
      },
      2,
    )

    const calls = consoleSpy.mock.calls.map((c) => String(c[0]))
    const answeredLine = calls.find((line) => line.includes('Questions answered:'))
    expect(answeredLine).toContain('1 / 5')
    consoleSpy.mockRestore()
  })

  it('shows plain count for questions answered in regular quiz sessions', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)

    renderSessionSummary(
      { records: [makeSessionRecord(), makeSessionRecord(), makeSessionRecord()], startingDifficulty: 2 },
      2,
    )

    const calls = consoleSpy.mock.calls.map((c) => String(c[0]))
    const answeredLine = calls.find((line) => line.includes('Questions answered:'))
    expect(answeredLine).toContain('3')
    expect(answeredLine).not.toContain('/')
    consoleSpy.mockRestore()
  })
})

// ---------------------------------------------------------------------------
// showDomainMenuScreen — session summary integration
// ---------------------------------------------------------------------------
describe('showDomainMenuScreen — session summary', () => {
  it('displays the session summary after the domain header and before the action prompt', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const sessionData = {
      records: [makeSessionRecord({ scoreDelta: 10, timeTakenMs: 5000 })],
      startingDifficulty: 2,
    }
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript', sessionData)

    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    expect(logCalls[0]).toContain('typescript')
    const summaryIndex = logCalls.findIndex((message) => message.includes('Last Session'))
    expect(summaryIndex).toBeGreaterThan(0)

    const callArgs = mockSelect.mock.calls[0][0] as { message: string }
    expect(callArgs.message).toBe('Choose an action:')
    consoleSpy.mockRestore()
  })

  it('does not display session summary when sessionData is null', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript', null)

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Last Session')
    consoleSpy.mockRestore()
  })

  it('does not display session summary when sessionData is undefined', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Last Session')
    consoleSpy.mockRestore()
  })

  it('does not display session summary when sessionData has empty records', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript', { records: [], startingDifficulty: 2 })

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Last Session')
    consoleSpy.mockRestore()
  })

  it('does not display session summary on second loop iteration', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const sessionData = {
      records: [makeSessionRecord()],
      startingDifficulty: 2,
    }
    // First iteration: history (returns to loop), second iteration: back (exits)
    mockSelect
      .mockResolvedValueOnce({ action: 'history' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript', sessionData)

    // Session summary should appear only once (first iteration)
    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    const summaryCount = logCalls.filter((m) => m.includes('Last Session')).length
    expect(summaryCount).toBe(1)
    consoleSpy.mockRestore()
  })

  it('displays session summary after quiz returns SessionData via play', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const sessionData = {
      records: [makeSessionRecord({ scoreDelta: 20, timeTakenMs: 4000 })],
      startingDifficulty: 2,
    }
    vi.mocked(router.showQuiz).mockResolvedValueOnce(sessionData)

    // First select: play (triggers quiz, returns sessionData)
    // Second select: the domain menu re-renders with summary, user selects back
    mockSelect
      .mockResolvedValueOnce({ action: 'play' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Last Session')
    expect(logged).toContain('Score delta:')
    consoleSpy.mockRestore()
  })

  it('does not display a session summary after play when quiz returns null', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    vi.mocked(router.showQuiz).mockResolvedValueOnce(null)

    mockSelect
      .mockResolvedValueOnce({ action: 'play' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Last Session')
    consoleSpy.mockRestore()
  })
})
