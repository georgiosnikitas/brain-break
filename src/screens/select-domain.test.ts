import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isReturningUser, isScoreTrendingUp, showSelectDomainScreen } from './select-domain.js'
import { writeDomain, readDomain, _setDataDir, readSettings } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Ora spinner mock
// ---------------------------------------------------------------------------
const { mockStop, mockStart } = vi.hoisted(() => ({
  mockStop: vi.fn(),
  mockStart: vi.fn().mockReturnThis(),
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({ start: mockStart, stop: mockStop })),
}))

// ---------------------------------------------------------------------------
// Mock utils/format.js — typewrite resolves immediately; success passthrough
// ---------------------------------------------------------------------------
vi.mock('../utils/format.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/format.js')>()
  return { ...actual, typewrite: vi.fn().mockResolvedValue(undefined) }
})

// ---------------------------------------------------------------------------
// Mock ai/client.js — generateMotivationalMessage returns trigger-appropriate text
// ---------------------------------------------------------------------------
vi.mock('../ai/client.js', () => ({
  generateMotivationalMessage: vi.fn().mockImplementation(async (trigger: string) => {
    if (trigger === 'returning') return { ok: true, data: 'Welcome back! Keep the streak going.' }
    if (trigger === 'trending') return { ok: true, data: 'Your score is trending upward.' }
    return { ok: false, error: 'unknown trigger' }
  }),
}))

// ---------------------------------------------------------------------------
// Partial mock domain/store — keep real file I/O, only mock readSettings
// ---------------------------------------------------------------------------
vi.mock('../domain/store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/store.js')>()
  return { ...actual, readSettings: vi.fn().mockResolvedValue({ ok: true, data: { language: 'English', tone: 'natural' } }) }
})

// ---------------------------------------------------------------------------
// Mock screens/quiz.js so the stub never interferes
// ---------------------------------------------------------------------------
vi.mock('./quiz.js', () => ({
  showQuiz: vi.fn().mockResolvedValue(undefined),
}))

let showQuizMock: ReturnType<typeof vi.fn>

// ---------------------------------------------------------------------------
// Mocked AI + settings references
// ---------------------------------------------------------------------------
import { generateMotivationalMessage } from '../ai/client.js'
import { typewrite } from '../utils/format.js'
const mockGenerateMotivationalMessage = vi.mocked(generateMotivationalMessage)
const mockReadSettings = vi.mocked(readSettings)
const mockTypewrite = vi.mocked(typewrite)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function makeRecord(scoreDelta: number): QuestionRecord {
  return {
    question: 'Q?',
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A',
    userAnswer: 'A',
    isCorrect: true,
    answeredAt: new Date().toISOString(),
    timeTakenMs: 1000,
    speedTier: 'normal',
    scoreDelta,
    difficultyLevel: 2,
  }
}

// ---------------------------------------------------------------------------
// isReturningUser
// ---------------------------------------------------------------------------
describe('isReturningUser', () => {
  it('returns false for null lastSessionAt', () => {
    expect(isReturningUser(null)).toBe(false)
  })

  it('returns false when last session was more than 7 days ago', () => {
    expect(isReturningUser(daysAgo(8))).toBe(false)
  })

  it('returns false at exactly 7 days boundary (< not <=)', () => {
    const exactlySevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(isReturningUser(exactlySevenDays)).toBe(false)
  })

  it('returns true when last session was within 7 days', () => {
    expect(isReturningUser(daysAgo(3))).toBe(true)
  })

  it('returns true for a session from today', () => {
    expect(isReturningUser(new Date().toISOString())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// isScoreTrendingUp
// ---------------------------------------------------------------------------
describe('isScoreTrendingUp', () => {
  it('returns false for empty history', () => {
    expect(isScoreTrendingUp([])).toBe(false)
  })

  it('returns false when history has fewer than 6 entries', () => {
    expect(isScoreTrendingUp([makeRecord(10), makeRecord(10), makeRecord(10)])).toBe(false)
  })

  it('returns false when second half delta sum equals first half', () => {
    const history = [10, 10, 10, 10, 10, 10].map(makeRecord)
    expect(isScoreTrendingUp(history)).toBe(false)
  })

  it('returns false when second half delta sum is less than first half', () => {
    const history = [20, 20, 20, 5, 5, 5].map(makeRecord)
    expect(isScoreTrendingUp(history)).toBe(false)
  })

  it('returns true when second half delta sum exceeds first half', () => {
    const history = [5, 5, 5, 20, 20, 20].map(makeRecord)
    expect(isScoreTrendingUp(history)).toBe(true)
  })

  it('uses only last 6 entries from a longer history', () => {
    // First 10 entries have terrible deltas; last 6 are clearly trending up
    const oldBad = new Array(10).fill(-50).map(makeRecord)
    const recentGood = [5, 5, 5, 20, 20, 20].map(makeRecord)
    expect(isScoreTrendingUp([...oldBad, ...recentGood])).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// showSelectDomainScreen — integration tests
// ---------------------------------------------------------------------------
let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-select-'))
  _setDataDir(testDir)
  const { showQuiz } = await import('./quiz.js')
  showQuizMock = showQuiz as ReturnType<typeof vi.fn>
  showQuizMock.mockClear()
  mockGenerateMotivationalMessage.mockClear()
  mockReadSettings.mockResolvedValue({ ok: true, data: { language: 'English', tone: 'natural' as const } })
  mockStart.mockClear()
  mockStop.mockClear()
  mockTypewrite.mockClear()
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('showSelectDomainScreen', () => {
  it('calls the quiz stub after loading a valid domain', async () => {
    await writeDomain('typescript', defaultDomainFile())

    await showSelectDomainScreen('typescript')

    expect(showQuizMock).toHaveBeenCalledTimes(1)
    expect(showQuizMock).toHaveBeenCalledWith('typescript')
  })

  it('prints warning, resets file, and proceeds to quiz when domain is corrupted', async () => {
    // Write deliberately corrupted JSON
    await writeFile(join(testDir, 'broken.json'), 'NOT JSON {{{{')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showSelectDomainScreen('broken')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    // File should now be a valid reset domain
    const after = await readDomain('broken')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.meta.score).toBe(0)

    // Must still proceed to quiz (AC4)
    expect(showQuizMock).toHaveBeenCalledWith('broken')
  })

  it('prints a returning-user message when lastSessionAt is within 7 days', async () => {
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(2) },
    }
    await writeDomain('returning', domain)

    await showSelectDomainScreen('returning')
    expect(mockTypewrite).toHaveBeenCalled()
    const args = mockTypewrite.mock.calls.map((c) => String(c[0]))
    expect(args.some((msg) => msg.toLowerCase().includes('welcome back'))).toBe(true)
  })

  it('prints a trending message when score is trending upward', async () => {
    const domain = {
      ...defaultDomainFile(),
      history: [5, 5, 5, 20, 20, 20].map(makeRecord),
    }
    await writeDomain('trending', domain)

    await showSelectDomainScreen('trending')
    expect(mockTypewrite).toHaveBeenCalled()
    const args = mockTypewrite.mock.calls.map((c) => String(c[0]))
    expect(args.some((msg) => msg.toLowerCase().includes('trending'))).toBe(true)
  })

  it('prints no motivational message for a fresh domain', async () => {
    await writeDomain('fresh', defaultDomainFile())

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showSelectDomainScreen('fresh')
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    logSpy.mockRestore()
    warnSpy.mockRestore()

    expect(showQuizMock).toHaveBeenCalledWith('fresh')
  })
})

// ---------------------------------------------------------------------------
// motivational message AI integration tests
// ---------------------------------------------------------------------------
describe('showSelectDomainScreen — motivational message AI integration', () => {
  it('calls generateMotivationalMessage with returning trigger when user is returning', async () => {
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(2) },
    }
    await writeDomain('ai-returning', domain)

    await showSelectDomainScreen('ai-returning')

    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('returning', { language: 'English', tone: 'natural' })
  })

  it('calls generateMotivationalMessage with trending trigger when score is trending up', async () => {
    const domain = {
      ...defaultDomainFile(),
      history: [5, 5, 5, 20, 20, 20].map(makeRecord),
    }
    await writeDomain('ai-trending', domain)

    await showSelectDomainScreen('ai-trending')

    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('trending', { language: 'English', tone: 'natural' })
  })

  it('passes settings from readSettings to generateMotivationalMessage', async () => {
    const customSettings = { language: 'Greek', tone: 'pirate' as const }
    mockReadSettings.mockResolvedValue({ ok: true, data: customSettings })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-settings', domain)

    await showSelectDomainScreen('ai-settings')

    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('returning', customSettings)
  })

  it('displays message via typewrite when AI returns ok', async () => {
    mockGenerateMotivationalMessage.mockResolvedValue({ ok: true, data: 'Great job!' })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-display', domain)

    await showSelectDomainScreen('ai-display')

    expect(mockTypewrite).toHaveBeenCalledOnce()
    const arg: string = mockTypewrite.mock.calls[0][0]
    expect(arg).toContain('Great job!')
  })

  it('silently skips message when AI returns ok:false (typewrite not called)', async () => {
    mockGenerateMotivationalMessage.mockResolvedValue({ ok: false, error: 'network error' })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-fail', domain)

    await showSelectDomainScreen('ai-fail')

    expect(mockTypewrite).not.toHaveBeenCalled()
    expect(showQuizMock).toHaveBeenCalledWith('ai-fail')
  })

  it('does not call generateMotivationalMessage for a fresh domain', async () => {
    await writeDomain('ai-fresh', defaultDomainFile())

    await showSelectDomainScreen('ai-fresh')

    expect(mockGenerateMotivationalMessage).not.toHaveBeenCalled()
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('starts and stops the ora spinner around AI message generation', async () => {
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-spinner', domain)

    await showSelectDomainScreen('ai-spinner')

    expect(mockStart).toHaveBeenCalled()
    expect(mockStop).toHaveBeenCalled()
  })

  it('does not call typewrite when AI returns ok:true but data is empty string', async () => {
    mockGenerateMotivationalMessage.mockResolvedValue({ ok: true, data: '' })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-empty', domain)

    await showSelectDomainScreen('ai-empty')

    expect(mockTypewrite).not.toHaveBeenCalled()
  })

  it('fires both AI calls concurrently when both triggers are met', async () => {
    mockGenerateMotivationalMessage
      .mockResolvedValueOnce({ ok: true, data: 'Welcome back!' })
      .mockResolvedValueOnce({ ok: true, data: 'Trending up!' })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
      history: [5, 5, 5, 20, 20, 20].map(makeRecord),
    }
    await writeDomain('ai-both', domain)

    await showSelectDomainScreen('ai-both')

    expect(mockGenerateMotivationalMessage).toHaveBeenCalledTimes(2)
    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('returning', { language: 'English', tone: 'natural' })
    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('trending', { language: 'English', tone: 'natural' })
    expect(mockTypewrite).toHaveBeenCalledTimes(2)
  })

  it('uses defaultSettings when readSettings fails', async () => {
    mockReadSettings.mockResolvedValue({ ok: false, error: 'disk error' })
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, lastSessionAt: daysAgo(1) },
    }
    await writeDomain('ai-settings-fail', domain)

    await showSelectDomainScreen('ai-settings-fail')

    expect(mockGenerateMotivationalMessage).toHaveBeenCalledWith('returning', { language: 'English', tone: 'natural' })
  })
})
