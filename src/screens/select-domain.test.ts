import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isReturningUser, isScoreTrendingUp, showSelectDomainScreen } from './select-domain.js'
import { writeDomain, readDomain, _setDataDir } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mock screens/quiz.js so the stub never interferes
// ---------------------------------------------------------------------------
vi.mock('./quiz.js', () => ({
  showQuiz: vi.fn().mockResolvedValue(undefined),
}))

let showQuizMock: ReturnType<typeof vi.fn>

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

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await showSelectDomainScreen('returning')
    const calls = logSpy.mock.calls.map((c) => String(c[0]))
    expect(calls.some((msg) => msg.toLowerCase().includes('welcome back'))).toBe(true)
    logSpy.mockRestore()
  })

  it('prints a trending message when score is trending upward', async () => {
    const domain = {
      ...defaultDomainFile(),
      history: [5, 5, 5, 20, 20, 20].map(makeRecord),
    }
    await writeDomain('trending', domain)

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await showSelectDomainScreen('trending')
    const calls = logSpy.mock.calls.map((c) => String(c[0]))
    expect(calls.some((msg) => msg.toLowerCase().includes('trending'))).toBe(true)
    logSpy.mockRestore()
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
