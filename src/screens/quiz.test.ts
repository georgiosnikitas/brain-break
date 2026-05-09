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

function getLogs(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((c: unknown[]) => String(c[0])).join('\n')
}

function getChoiceValues(callIndex: number): string[] {
  const call = mockSelect.mock.calls[callIndex]
  return (call[0] as any).choices.map((c: any) => c.value)
}

function setupQuestion(correctAnswer: AnswerOption = 'A') {
  mockGenerateQuestion.mockResolvedValue({ ok: true, data: makeQuestion(correctAnswer) })
}

function setupExplainSuccess(text = 'Explanation.') {
  mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: text })
}

function setupTeachSuccess(text = 'Lesson.') {
  mockGenerateMicroLesson.mockResolvedValueOnce({ ok: true, data: text })
}

const muteLog = () => vi.spyOn(console, 'log').mockReturnValue(undefined)
const muteWarn = () => vi.spyOn(console, 'warn').mockReturnValue(undefined)
const muteError = () => vi.spyOn(console, 'error').mockReturnValue(undefined)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.restoreAllMocks()
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

  it.each([
    [AI_ERRORS.NETWORK_OPENAI, 'OpenAI API'],
    [AI_ERRORS.AUTH_COPILOT, 'authentication'],
    [AI_ERRORS.PARSE, 'unexpected response'],
  ])('displays error and returns null on %s error', async (aiError, expectedMsg) => {
    const consoleSpy = muteError()
    mockGenerateQuestion.mockResolvedValue({ ok: false, error: aiError })
    mockSelect.mockResolvedValueOnce(true as any)

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(expectedMsg))
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(result).toBeNull()
  })

  it('persists domain with correct record and returns SessionData after correct answer + exit', async () => {
    setupQuestion()
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
    setupQuestion()
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
      bookmarked: false,
    })
  })

  it('shows correct answer in feedback on incorrect submission', async () => {
    const consoleSpy = muteLog()
    setupQuestion('B')
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('Correct answer:')
    expect(logged).toContain('B)')
    const record = mockWriteDomain.mock.calls[0][1].history[0]
    expect(record.isCorrect).toBe(false)
  })

  it('does not show "Correct answer:" line on a correct submission', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(getLogs(consoleSpy)).not.toContain('Correct answer:')
  })

  it('loops for a second question when user chooses "next"', async () => {
    setupQuestion()
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
    const consoleSpy = muteError()
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
  })

  it('accumulates history across loop iterations', async () => {
    setupQuestion()
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
    const consoleSpy = muteWarn()
    mockWriteDomain.mockResolvedValueOnce({ ok: false, error: 'disk full' })
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    const result = await showQuiz('typescript')

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('disk full'))
    expect(result).not.toBeNull()
  })

  it('returns null when ExitPromptError is thrown during answer selection', async () => {
    setupQuestion()
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).toBeNull()
  })

  it('returns SessionData when ExitPromptError is thrown during next-action selection', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('updates meta.lastSessionAt when persisting after each answer', async () => {
    const before = new Date().toISOString()
    setupQuestion()
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
    const warnSpy = muteWarn()
    mockReadDomain.mockResolvedValue({ ok: false, error: 'corrupted' })
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('corrupted'))
    expect(mockWriteDomain).toHaveBeenCalledOnce()
  })

  it('calls clearScreen before rendering a question', async () => {
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(vi.mocked(clearAndBanner)).toHaveBeenCalled()
  })

  it('calls clearAndBanner only before rendering a question, not before feedback', async () => {
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // clearAndBanner is called once before question only — feedback renders inline
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('displays domain header after clearAndBanner', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('📝 Quiz — typescript')
  })

  it('shows all 4 answer options with user selection marker before feedback', async () => {
    const consoleSpy = muteLog()
    setupQuestion('B')
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('A) A typed JS superset')
    expect(logged).toContain('B) A framework')
    expect(logged).toContain('C) A runtime')
    expect(logged).toContain('D) A test tool')
    expect(logged).toContain('► A)')
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
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('✓ Correct!')
  })

  it('uses colorIncorrect and colorCorrect reveal for incorrect answer feedback', async () => {
    const consoleSpy = muteLog()
    setupQuestion('B')
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('✗ Incorrect')
    expect(logged).toContain('Correct answer:')
    expect(logged).toContain('B)')
  })

  it('uses colorSpeedTier in feedback — speed tier label is present', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toMatch(/Fast|Normal|Slow/)
  })

  it('uses colorScoreDelta in feedback — score delta is present', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toMatch(/Score:.*[+-]\d+/)
  })

  it('uses colorDifficultyLevel in feedback — difficulty label is present', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // defaultDomainFile() starts at difficultyLevel 2 → label 'Elementary'
    const logged = getLogs(consoleSpy)
    expect(logged).toContain('Elementary')
  })

  it('re-throws non-ExitPromptError from answer select (askQuestion)', async () => {
    setupQuestion()
    const boom = new Error('unexpected answer select failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showQuiz('typescript')).rejects.toThrow('unexpected answer select failure')
  })

  it('re-throws non-ExitPromptError from next-action select (askNextAction)', async () => {
    setupQuestion()
    const boom = new Error('unexpected next-action select failure')
    mockSelect
      .mockResolvedValueOnce('A')    // answer select succeeds
      .mockRejectedValueOnce(boom)   // next-action select throws

    await expect(showQuiz('typescript')).rejects.toThrow('unexpected next-action select failure')
  })

  // -------------------------------------------------------------------------
  // Explain answer flow
  // -------------------------------------------------------------------------
  it('shows four post-answer options including explain and bookmark', async () => {
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // The post-answer select call is the 2nd select call (1st = answer)
    const values = getChoiceValues(1)
    expect(values).toContain('explain')
    expect(values).toContain('bookmark')
    expect(values).toContain('next')
    expect(values).toContain('exit')
  })

  it('displays explanation when user selects explain and AI succeeds', async () => {
    const consoleSpy = muteLog()
    setupQuestion()
    setupExplainSuccess('TypeScript adds static typing.')
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('exit')     // next/exit after explain

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('TypeScript adds static typing.')
    expect(mockGenerateExplanation).toHaveBeenCalledOnce()
  })

  it('starts and stops explain spinner around generateExplanation call', async () => {
    setupQuestion()
    setupExplainSuccess()
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
    const warnSpy = muteWarn()
    setupQuestion()
    mockGenerateExplanation.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate explanation'))
  })

  it('shows teach/next/exit after explain is used (post-explain action)', async () => {
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('exit')     // post-explain (teach/next/exit)

    await showQuiz('typescript')

    // 3rd select call is the post-explain prompt (teach/next/exit)
    const values = getChoiceValues(2)
    expect(values).toContain('teach')
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('explain')
  })

  it('returns SessionData when ExitPromptError during explain/next/exit prompt', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-answer prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('returns SessionData when ExitPromptError during post-explain prompt', async () => {
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-explain prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('continues to next question after explain then next', async () => {
    setupQuestion()
    setupExplainSuccess()
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
    const consoleSpy = muteLog()
    setupQuestion()
    setupExplainSuccess('Explanation text.')
    setupTeachSuccess('Deep dive into TypeScript type system...')
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach me more
      .mockResolvedValueOnce('exit')     // next/exit after teach

    await showQuiz('typescript')

    const logged = getLogs(consoleSpy)
    expect(logged).toContain('Deep dive into TypeScript type system...')
    expect(mockGenerateMicroLesson).toHaveBeenCalledOnce()
  })

  it('calls generateMicroLesson with correct arguments', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess('The explanation.')
    setupTeachSuccess()
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
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
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
    const warnSpy = muteWarn()
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    mockGenerateMicroLesson.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not generate micro-lesson'))
  })

  it('shows next/exit only (no teach) after micro-lesson is displayed', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
    mockSelect
      .mockResolvedValueOnce('A')        // answer
      .mockResolvedValueOnce('explain')  // explain
      .mockResolvedValueOnce('teach')    // teach
      .mockResolvedValueOnce('exit')     // next/exit after teach

    await showQuiz('typescript')

    // 4th select call is the post-teach prompt (next/exit only)
    const values = getChoiceValues(3)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
    expect(values).not.toContain('explain')
  })

  it('returns SessionData when ExitPromptError during post-explain teach/next/exit prompt', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockRejectedValueOnce(new ExitPromptError()) // Ctrl+C on post-explain prompt

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  it('continues to next question after explain → teach → next', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
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
    muteWarn()
    muteLog()
    setupQuestion()
    mockGenerateExplanation.mockResolvedValueOnce({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')     // next/exit after explain failure

    await showQuiz('typescript')

    // 3rd select call is the post-explain-failure prompt (next/exit only, no teach)
    const values = getChoiceValues(2)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
  })

  it('skips teach option and goes to next/exit when AI returns empty explanation', async () => {
    muteLog()
    setupQuestion()
    mockGenerateExplanation.mockResolvedValueOnce({ ok: true, data: '' })
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')     // next/exit prompt (no teach offered)

    await showQuiz('typescript')

    // 3rd select call must not include teach
    const values = getChoiceValues(2)
    expect(values).toContain('next')
    expect(values).toContain('exit')
    expect(values).not.toContain('teach')
    expect(mockGenerateMicroLesson).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Bookmark toggle — post-answer (AC #1, #2, #3)
  // -------------------------------------------------------------------------
  it('post-answer: ⭐ Bookmark option is present in post-answer choices', async () => {
    setupQuestion()
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const values = getChoiceValues(1)
    expect(values).toContain('bookmark')
  })

  it('post-answer: selecting bookmark toggles bookmarked, calls writeDomain', async () => {
    muteLog()
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // writeDomain called twice: initial write + bookmark toggle write
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    // clearAndBanner called once: pre-question only (no re-render on bookmark)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('post-answer: bookmark toggles record.bookmarked to true in persisted domain', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const secondWrite = mockWriteDomain.mock.calls[1]
    expect(secondWrite[1].history[0].bookmarked).toBe(true)
  })

  it('post-answer: second bookmark toggle removes bookmark (back to false)', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')  // set bookmark
      .mockResolvedValueOnce('bookmark')  // remove bookmark
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const thirdWrite = mockWriteDomain.mock.calls[2]
    expect(thirdWrite[1].history[0].bookmarked).toBe(false)
  })

  it('post-answer: shows "⭐ Remove bookmark" label after bookmark is set', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // The 3rd select call (after bookmark toggle re-render) shows "Remove bookmark"
    const call = mockSelect.mock.calls[2]
    const bookmarkChoice = (call[0] as any).choices.find((c: any) => c.value === 'bookmark')
    expect(bookmarkChoice?.name).toContain('Remove bookmark')
  })

  it('post-answer: bookmark then next proceeds to second question', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('exit')

    const result = await showQuiz('typescript')

    expect(mockGenerateQuestion).toHaveBeenCalledTimes(2)
    expect(result?.records).toHaveLength(2)
  })

  it('post-answer: bookmarked state is reflected in SessionData records', async () => {
    setupQuestion()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    const result = await showQuiz('typescript')

    expect(result?.records[0].bookmarked).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Bookmark toggle — post-explain (AC #4)
  // -------------------------------------------------------------------------
  it('post-explain: ⭐ Bookmark option is present in post-explain choices', async () => {
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const values = getChoiceValues(2)
    expect(values).toContain('bookmark')
  })

  it('post-explain: selecting bookmark toggles bookmarked, calls writeDomain', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // writeDomain: initial write + bookmark toggle
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    // clearAndBanner: pre-question only (no re-render on bookmark)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('post-explain: bookmark toggles record.bookmarked to true in persisted domain', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const secondWrite = mockWriteDomain.mock.calls[1]
    expect(secondWrite[1].history[0].bookmarked).toBe(true)
  })

  it('post-explain: after bookmark toggle, loops back to post-explain menu (shows teach option)', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // 4th select call is the re-shown post-explain prompt (should have teach)
    const values = getChoiceValues(3)
    expect(values).toContain('teach')
  })

  it('post-explain: ExitPromptError during bookmark select returns SessionData', async () => {
    setupQuestion()
    setupExplainSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })

  // -------------------------------------------------------------------------
  // Bookmark toggle — post-teach (AC #5)
  // -------------------------------------------------------------------------
  it('post-teach: ⭐ Bookmark option is present in post-teach choices (no teach option)', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const values = getChoiceValues(3)
    expect(values).toContain('bookmark')
    expect(values).not.toContain('teach')
    expect(values).not.toContain('explain')
  })

  it('post-teach: selecting bookmark toggles bookmarked, calls writeDomain', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    // writeDomain: initial write + bookmark toggle
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    // clearAndBanner: pre-question only (no re-render on bookmark)
    expect(vi.mocked(clearAndBanner)).toHaveBeenCalledTimes(1)
  })

  it('post-teach: bookmark toggles record.bookmarked to true in persisted domain', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockResolvedValueOnce('bookmark')
      .mockResolvedValueOnce('exit')

    await showQuiz('typescript')

    const secondWrite = mockWriteDomain.mock.calls[1]
    expect(secondWrite[1].history[0].bookmarked).toBe(true)
  })

  it('post-teach: ExitPromptError during bookmark select returns SessionData', async () => {
    muteLog()
    setupQuestion()
    setupExplainSuccess()
    setupTeachSuccess()
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('explain')
      .mockResolvedValueOnce('teach')
      .mockRejectedValueOnce(new ExitPromptError())

    const result = await showQuiz('typescript')

    expect(result).not.toBeNull()
    expect(result?.records).toHaveLength(1)
  })
})
