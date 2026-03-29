import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile, defaultSettings } from '../domain/schema.js'
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

vi.mock('@inquirer/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/prompts')>()
  return {
    ...actual,
    select: vi.fn(),
  }
})

vi.mock('../ai/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ai/client.js')>()
  return {
    ...actual,
    generateQuestion: vi.fn(),
    generateExplanation: vi.fn(),
    generateMicroLesson: vi.fn(),
  }
})

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
  writeDomain: vi.fn(),
  readSettings: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { generateQuestion, generateExplanation, generateMicroLesson, AI_ERRORS } from '../ai/client.js'
import { readDomain, writeDomain, readSettings } from '../domain/store.js'
import { select } from '@inquirer/prompts'
import { clearAndBanner } from '../utils/screen.js'
import { showQuiz } from './quiz.js'

const mockGenerateQuestion = vi.mocked(generateQuestion)
const mockGenerateExplanation = vi.mocked(generateExplanation)
const mockGenerateMicroLesson = vi.mocked(generateMicroLesson)
const mockReadDomain = vi.mocked(readDomain)
const mockWriteDomain = vi.mocked(writeDomain)
const mockReadSettings = vi.mocked(readSettings)
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
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('showQuiz', () => {
  it('starts and stops the ora spinner around question generation', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect.mockResolvedValueOnce(true as any)

    await showQuiz('typescript')

    expect(mockStart).toHaveBeenCalled()
    expect(mockStop).toHaveBeenCalled()
  })

  it('displays error and returns null on NETWORK error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect.mockResolvedValueOnce(true as any)

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OpenAI API'))
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })

  it('displays error and returns null on AUTH error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.AUTH_COPILOT })
    mockSelect.mockResolvedValueOnce(true as any)

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('authentication'))
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })

  it('displays error and returns null on PARSE error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.PARSE })
    mockSelect.mockResolvedValueOnce(true as any)

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected response'))
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })

  it('persists domain with correct record and returns SessionData after correct answer + exit', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    const result = await showQuiz('typescript')

    expect(mockWriteDomain).toHaveBeenCalledOnce()
    const [slug, domain] = mockWriteDomain.mock.calls[0]
    expect(slug).toBe('typescript')
    expect(domain.history).toHaveLength(1)
    expect(domain.history[0].isCorrect).toBe(true)
    expect(domain.history[0].userAnswer).toBe('A')
    expect(domain.hashes).toHaveLength(1)
    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
    expect(result?.startingDifficulty).toBe(2)
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

    const result = await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(2)
  })

  it('returns null when the next question generation fails after earlier answers', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockReturnValue(undefined)
    mockGenerateQuestion
      .mockResolvedValueOnce({ ok: true, data: makeQuestion('A') })
      .mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce(true as any)

    const result = await showQuiz('typescript')

    expect(mockWriteDomain).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OpenAI API'))
    expect(result).toBeNull()
    consoleSpy.mockRestore()
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

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('disk full'))
    expect(result).not.toBeNull()
    consoleSpy.mockRestore()
  })

  it('returns null when ExitPromptError is thrown during answer selection', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).toBeNull()
  })

  it('returns SessionData when ExitPromptError is thrown during next-action selection', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('updates meta.lastSessionAt when persisting after each answer', async () => {
    const before = new Date().toISOString()
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const meta = mockWriteDomain.mock.calls[0][1].meta
    expect(meta.lastSessionAt).toBeTypeOf('string')
    const lastSession = meta.lastSessionAt ?? ''
    expect(new Date(lastSession).getTime()).toBeGreaterThanOrEqual(
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

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })

  it('calls clearAndBanner only before rendering a question, not before feedback', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // clearAndBanner is called once before question only — feedback renders inline
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('displays domain header after clearAndBanner', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('📝 Quiz — typescript')
    consoleSpy.mockRestore()
  })

  it('shows all 4 answer options with user selection marker before feedback', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('B') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('A) A typed JS superset')
    expect(logged).toContain('B) A framework')
    expect(logged).toContain('C) A runtime')
    expect(logged).toContain('D) A test tool')
    expect(logged).toContain('► A)')
    consoleSpy.mockRestore()
  })

  it('calls readSettings once per quiz session start', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect.mockResolvedValueOnce(true as any)

    await showQuiz('typescript')

    expect(mockReadSettings).toHaveBeenCalledOnce()
  })

  it('passes settings from readSettings to generateQuestion', async () => {
    const settings = { ...defaultSettings(), language: 'Spanish', tone: 'expressive' as const }
    mockReadSettings.mockResolvedValue({ ok: true, data: settings })
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect.mockResolvedValueOnce(true as any)

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
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect.mockResolvedValueOnce(true as any)

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledWith(
      'typescript',
      expect.any(Number),
      expect.any(Set),
      expect.any(Array),
      defaultSettings(),
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

    // defaultDomainFile() starts at difficultyLevel 2 → label 'Elementary'
    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Elementary')
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

  // -------------------------------------------------------------------------
  // Explain answer flow
  // -------------------------------------------------------------------------
  it('shows three post-answer options including explain', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // The post-answer select call is the 2nd select call (1st = answer)
    const postAnswerCall = mockSelect.mock.calls[1]
    const choices = (postAnswerCall[0] as any).choices
    const values = choices.map((c: any) => c.value)
    expect(values).toContain('explain')
    expect(values).toContain('next')
    expect(values).toContain('exit')
  })

  it('displays explanation when user selects explain and AI succeeds', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'TypeScript adds static typing.' })
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('exit')     // next/exit after explain

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('TypeScript adds static typing.')
    expect(mockGenerateExplanation).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('starts and stops explain spinner around generateExplanation call', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // mockStart is called for question spinner + explain spinner
    expect(mockStart).toHaveBeenCalledTimes(2)
    expect(mockStop).toHaveBeenCalledTimes(2)
  })

  it('shows warning on explain failure and falls through to next/exit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate explanation'))
    warnSpy.mockRestore()
  })

  it('shows teach/next/exit after explain is used (post-explain action)', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('exit')     // post-explain (teach/next/exit)

    await showQuiz('typescript')

    // 3rd select call is the post-explain prompt (teach/next/exit)
    const postExplainCall = mockSelect.mock.calls[2]
    const choices = (postExplainCall[0] as any).choices
    const values = choices.map((c: any) => c.value)
    expect(values).toContain('teach')
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('explain')
  })

  it('returns SessionData when ExitPromptError during explain/next/exit prompt', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-answer prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('returns SessionData when ExitPromptError during post-explain prompt', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-explain prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('continues to next question after explain then next', async () => {
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockSelect
      .mockResolvedValueOnce('A')        // 1st answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('next')     // next after explain (post-explain action)
      .mockResolvedValueOnce('A')        // 2nd answer
      .mockResolvedValueOnce('exit')     // exit

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
  })

  // -------------------------------------------------------------------------
  // Teach me more flow
  // -------------------------------------------------------------------------
  it('displays micro-lesson when user selects teach after explain', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation text.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: 'Deep dive into TypeScript type system...' })
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach me more
      .mockResolvedValueOnce('exit')     // next/exit after teach

    await showQuiz('typescript')

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Deep dive into TypeScript type system...')
    expect(mockGenerateMicroLesson).toHaveBeenCalledOnce()
    consoleSpy.mockRestore()
  })

  it('calls generateMicroLesson with correct arguments', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'The explanation.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: 'Lesson.' })
    mockSelect
      .mockResolvedValueOnce('B')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach
      .mockResolvedValueOnce('exit')     // exit

    await showQuiz('typescript')

    const [question, explanation, settings] = mockGenerateMicroLesson.mock.calls[0]
    expect(question.question).toBe('What is TypeScript?')
    expect(explanation).toBe('The explanation.')
    expect(settings).toBeDefined()
  })

  it('starts and stops teach spinner around generateMicroLesson call', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: 'Lesson.' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // mockStart called for: question spinner + explain spinner + teach spinner
    expect(mockStart).toHaveBeenCalledTimes(3)
    expect(mockStop).toHaveBeenCalledTimes(3)
  })

  it('shows warning on teach failure and falls through to next/exit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate micro-lesson'))
    warnSpy.mockRestore()
  })

  it('shows next/exit only (no teach) after micro-lesson is displayed', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: 'Lesson.' })
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach
      .mockResolvedValueOnce('exit')     // next/exit after teach

    await showQuiz('typescript')

    // 4th select call is the post-teach prompt (next/exit only)
    const postTeachCall = mockSelect.mock.calls[3]
    const choices = (postTeachCall[0] as any).choices
    const values = choices.map((c: any) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
    expect(values).not.toContain('explain')
  })

  it('returns SessionData when ExitPromptError during post-explain teach/next/exit prompt', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-explain prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('continues to next question after explain → teach → next', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: 'Explanation.' })
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: 'Lesson.' })
    mockSelect
      .mockResolvedValueOnce('A')        // 1st answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach
      .mockResolvedValueOnce('next')     // next after teach
      .mockResolvedValueOnce('A')        // 2nd answer
      .mockResolvedValueOnce('exit')     // exit

    await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
  })

  it('shows next/exit after explain failure (no teach option)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')     // next/exit after explain failure

    await showQuiz('typescript')

    // 3rd select call is the post-explain-failure prompt (next/exit only, no teach)
    const postFailCall = mockSelect.mock.calls[2]
    const choices = (postFailCall[0] as any).choices
    const values = choices.map((c: any) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
    warnSpy.mockRestore()
  })

  it('skips teach option and goes to next/exit when AI returns empty explanation', async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion('A') })
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: '' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')     // next/exit prompt (no teach offered)

    await showQuiz('typescript')

    // 3rd select call must not include teach
    const postEmptyCall = mockSelect.mock.calls[2]
    const choices = (postEmptyCall[0] as any).choices
    const values = choices.map((c: any) => c.value)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
    expect(mockGenerateMicroLesson).not.toHaveBeenCalled()
  })
})
