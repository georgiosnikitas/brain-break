import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile } from '../domain/schema.js'
import type { AnswerOption } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Hoisted variables needed inside mock factories
// ---------------------------------------------------------------------------
const { mockStop, mockStart } = vi.hoisted(() => ({
  mockStop: vi.fn(),
  mockStart: vi.fn().mockReturnThis(),
}))

// ---------------------------------------------------------------------------
// Mocks — hoisted automatically by Vitest
// ---------------------------------------------------------------------------
vi.mock('ora', () => ({
  default: vi.fn(() => ({ start: mockStart, stop: mockStop })),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))

vi.mock('../ai/client.js', () => ({
  generateQuestion: vi.fn(),
  AI_ERRORS: {
    NETWORK: 'Could not reach the Copilot API. Check your connection and try again.',
    AUTH: 'Copilot authentication failed. Ensure you have an active GitHub Copilot subscription and are logged in.',
    PARSE: 'Received an unexpected response from Copilot. Please try again.',
  },
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
  writeDomain: vi.fn(),
  readSettings: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { generateQuestion, AI_ERRORS } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import { clearScreen } from '../utils/screen.js'
import { showQuiz } from './quiz.js'

const mockGenerateQuestion = vi.mocked(generateQuestion)
const mockReadDomain = vi.mocked(readDomain)
const mockWriteDomain = vi.mocked(writeDomain)
const mockReadSettings = vi.mocked(readSettings)
const mockShowDomainMenu = vi.mocked(router.showDomainMenu)
const mockSelect = vi.mocked(select)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeQuestion(correctAnswer: AnswerOption = 'A') {
  return {
    question: 'What is TypeScript?',
    options: {
      A: 'A typed JS superset',
      B: 'A framework',
      C: 'A runtime',
      D: 'A test tool',
    },
    correctAnswer,
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockStart.mockReturnThis()
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockWriteDomain.mockResolvedValue({ ok: true, data: undefined })
  mockReadSettings.mockResolvedValue({ ok: true, data: { language: 'English', tone: 'natural' } })
  mockShowDomainMenu.mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('showQuiz', () => {
  it('starts and stops the ora spinner around question generation', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK })

    await showQuiz('typescript')

    expect(mockStart).toHaveBeenCalled()
    expect(mockStop).toHaveBeenCalled()
  })

  it('displays error and navigates home on NETWORK error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK })

    await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Copilot API'))
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
    expect(mockSelect).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('calls process.exit(1) on AUTH error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementationOnce((_code?: string | number | null) => {
      throw new Error('process.exit called')
    })
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.AUTH })

    await expect(showQuiz('typescript')).rejects.toThrow('process.exit called')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('authentication'))
    expect(exitSpy).toHaveBeenCalledWith(1)
    consoleSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('displays error and navigates home on PARSE error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.PARSE })

    await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected response'))
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
    expect(mockSelect).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('persists domain with correct record and returns home after correct answer + exit', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(mockWriteDomain).toHaveBeenCalledOnce()
    const [slug, domain] = mockWriteDomain.mock.calls[0]
    expect(slug).toBe('typescript')
    expect(domain.history).toHaveLength(1)
    expect(domain.history[0].isCorrect).toBe(true)
    expect(domain.history[0].userAnswer).toBe('A')
    expect(domain.hashes).toHaveLength(1)
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('includes all FR11 fields in the QuestionRecord', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const record = mockWriteDomain.mock.calls[0][1].history[0]
    expect(record).toMatchObject({
      question: expect.any(String),
      options: {
        A: expect.any(String),
        B: expect.any(String),
        C: expect.any(String),
        D: expect.any(String),
      },
      correctAnswer: expect.stringMatching(/^[A-D]$/),
      userAnswer: expect.stringMatching(/^[A-D]$/),
      isCorrect: expect.any(Boolean),
      answeredAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      timeTakenMs: expect.any(Number),
      speedTier: expect.stringMatching(/^(fast|normal|slow)$/),
      scoreDelta: expect.any(Number),
      difficultyLevel: expect.any(Number),
    })
  })

  it('shows correct answer in feedback on incorrect submission', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('B') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Correct answer:')
    expect(logged).toContain('B)')
    const record = mockWriteDomain.mock.calls[0][1].history[0]
    expect(record.isCorrect).toBe(false)
    consoleSpy.mockRestore()
  })

  it('does not show "Correct answer:" line on a correct submission', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const hasCorrectAnswerLine = consoleSpy.mock.calls
      .map((c) => String(c[0]))
      .some((m) => m.includes('Correct answer:'))
    expect(hasCorrectAnswerLine).toBe(false)
    consoleSpy.mockRestore()
  })

  it('loops for a second question when user chooses "next"', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect
      .mockResolvedValueOnce('A')     // first answer
      .mockResolvedValueOnce('next')  // continue
      .mockResolvedValueOnce('A')     // second answer
      .mockResolvedValueOnce('exit')  // exit

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('accumulates history across loop iterations', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const [, secondDomain] = mockWriteDomain.mock.calls[1]
    expect(secondDomain.history).toHaveLength(2)
    expect(secondDomain.hashes).toHaveLength(2)
  })

  it('logs write error but continues to the next action when writeDomain fails', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    mockWriteDomain.mockResolvedValueOnce({ ok: false, error: 'disk full' })
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('disk full'))
    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('navigates home when ExitPromptError is thrown during answer selection', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await showQuiz('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('navigates home when ExitPromptError is thrown during next-action selection', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError())

    await showQuiz('typescript')

    expect(mockShowDomainMenu).toHaveBeenCalledOnce()
  })

  it('updates meta.lastSessionAt when persisting after each answer', async () => {
    const before = new Date().toISOString()
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const meta = mockWriteDomain.mock.calls[0][1].meta
    expect(meta.lastSessionAt).not.toBeNull()
    expect(new Date(meta.lastSessionAt as string).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    )
  })

  it('warns and uses a fresh domain when readDomain fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    mockReadDomain.mockResolvedValue({ ok: false, error: 'corrupted' })
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('corrupted'))
    expect(mockWriteDomain).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })

  it('calls clearScreen before rendering a question', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(vi.mocked(clearScreen)).toHaveBeenCalled()
  })

  it('calls clearScreen before showing feedback', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // clearScreen is called once before question, once before feedback
    expect(vi.mocked(clearScreen)).toHaveBeenCalledTimes(2)
  })

  it('calls readSettings once per quiz session start', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK })

    await showQuiz('typescript')

    expect(mockReadSettings).toHaveBeenCalledOnce()
  })

  it('passes settings from readSettings to generateQuestion', async () => {
    const settings = { language: 'Spanish', tone: 'expressive' as const }
    mockReadSettings.mockResolvedValue({ ok: true, data: settings })
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK })

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledWith(
      'typescript',
      expect.any(Number),
      expect.any(Set),
      expect.any(Array),
      settings,
    )
  })

  it('falls back to defaultSettings when readSettings fails', async () => {
    mockReadSettings.mockResolvedValue({ ok: false, error: 'disk error' })
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK })

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledWith(
      'typescript',
      expect.any(Number),
      expect.any(Set),
      expect.any(Array),
      { language: 'English', tone: 'natural' },
    )
  })

  it('uses colorCorrect for correct answer feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('✓ Correct!')
    consoleSpy.mockRestore()
  })

  it('uses colorIncorrect and colorCorrect reveal for incorrect answer feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('B') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('✗ Incorrect')
    expect(logged).toContain('Correct answer:')
    expect(logged).toContain('B)')
    consoleSpy.mockRestore()
  })

  it('uses colorSpeedTier in feedback — speed tier label is present', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toMatch(/Fast|Normal|Slow/)
    consoleSpy.mockRestore()
  })

  it('uses colorScoreDelta in feedback — score delta is present', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toMatch(/Score:.*[+-]\d+/)
    consoleSpy.mockRestore()
  })

  it('uses colorDifficultyLevel in feedback — difficulty label is present', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // defaultDomainFile() starts at difficultyLevel 2 → label 'Easy'
    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Easy')
    consoleSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError from answer select (askQuestion)', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    const boom = new Error('unexpected answer select failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showQuiz('typescript')).rejects.toThrow('unexpected answer select failure')
  })

  it('re-throws non-ExitPromptError from next-action select (askNextAction)', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    const boom = new Error('unexpected next-action select failure')
    mockSelect
      .mockResolvedValueOnce('A')    // answer select succeeds
      .mockRejectedValueOnce(boom)   // next-action select throws

    await expect(showQuiz('typescript')).rejects.toThrow('unexpected next-action select failure')
  })
})
