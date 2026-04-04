import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile } from '../domain/schema.js'

const mockSelect = vi.fn()
const mockReadDomain = vi.fn()
const mockWriteDomain = vi.fn()
const mockApplyAnswer = vi.fn()
const mockHashQuestion = vi.fn()
const mockClearAndBanner = vi.fn()
const mockRenderQuestionDetail = vi.fn()

class MockSeparator {
  readonly kind = 'separator'
}

vi.mock('@inquirer/prompts', () => ({
  select: mockSelect,
  Separator: MockSeparator,
}))

vi.mock('../domain/store.js', () => ({
  readDomain: mockReadDomain,
  writeDomain: mockWriteDomain,
}))

vi.mock('../domain/scoring.js', () => ({
  applyAnswer: mockApplyAnswer,
}))

vi.mock('../utils/hash.js', () => ({
  hashQuestion: mockHashQuestion,
}))

vi.mock('../utils/screen.js', () => ({
  clearAndBanner: mockClearAndBanner,
}))

vi.mock('../utils/format.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/format.js')>()
  return {
    ...actual,
    header: (text: string) => text,
    dim: (text: string) => text,
    warn: (text: string) => text,
    menuTheme: { style: { highlight: (text: string) => text } },
    renderQuestionDetail: mockRenderQuestionDetail,
  }
})

const { showChallengeExecution } = await import('./challenge.js')

function makeQuestion(question = 'What is 2+2?', correctAnswer: 'A' | 'B' | 'C' | 'D' = 'A') {
  return {
    question,
    options: {
      A: '4',
      B: '3',
      C: '2',
      D: '1',
    },
    correctAnswer,
    difficultyLevel: 2,
    speedThresholds: { fastMs: 2_000, slowMs: 8_000 },
  }
}

function makeAbortPromptError(): Error {
  const err = new Error('aborted')
  err.name = 'AbortPromptError'
  return err
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(0)
  vi.clearAllMocks()
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockWriteDomain.mockResolvedValue({ ok: true, data: undefined })
  mockHashQuestion.mockImplementation((question: string) => `hash:${question}`)
  mockApplyAnswer.mockImplementation((meta, isCorrect, timeTakenMs, speedThresholds) => {
    const isSlow = timeTakenMs >= (speedThresholds?.slowMs ?? 8_000)
    const speedTier = isSlow ? 'slow' : 'fast'
    let scoreDelta = 10
    if (!isCorrect) {
      scoreDelta = isSlow ? -40 : -10
    }
    return {
      updatedMeta: {
        ...meta,
        score: meta.score + scoreDelta,
        totalTimePlayedMs: meta.totalTimePlayedMs + timeTakenMs,
      },
      scoreDelta,
      speedTier,
    }
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
})

describe('showChallengeExecution', () => {
  it('renders timer in M:SS format on the question screen', async () => {
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    const output = vi.mocked(console.log).mock.calls.map((call) => String(call[0])).join('\n')
    expect(output).toContain('⚡ Challenge — typescript')
    expect(output).toContain('Time remaining: 5:00')
  })

  it('answers a question within time, writes the record, and renders feedback', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(2_500)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('back')

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    expect(mockApplyAnswer).toHaveBeenCalledWith(expect.any(Object), true, 2_500, { fastMs: 2_000, slowMs: 8_000 })
    expect(mockRenderQuestionDetail).toHaveBeenCalledWith(expect.objectContaining({
      question: 'What is 2+2?',
      userAnswer: 'A',
      isCorrect: true,
      timeTakenMs: 2_500,
      scoreDelta: 10,
    }))
    expect(mockWriteDomain).toHaveBeenCalledWith('typescript', expect.objectContaining({
      hashes: ['hash:What is 2+2?'],
      history: [expect.objectContaining({ question: 'What is 2+2?', userAnswer: 'A' })],
    }))
    expect(result).toEqual({
      startingDifficulty: 2,
      records: [expect.objectContaining({ question: 'What is 2+2?', userAnswer: 'A' })],
      sprintResult: { questionsAnswered: 1, totalQuestions: 1, timedOut: false },
    })
  })

  it('advances to the next question on post-answer Next', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(1_000)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('next')
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(1_500)
        return Promise.resolve('B')
      })
      .mockResolvedValueOnce('back')

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    expect(mockClearAndBanner).toHaveBeenCalledTimes(2)
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    expect(result?.records).toHaveLength(2)
  })

  it('returns session data when post-answer Back is selected', async () => {
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('back')

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    expect(result).toEqual({
      startingDifficulty: 2,
      records: [expect.objectContaining({ question: 'What is 2+2?' })],
      sprintResult: { questionsAnswered: 1, totalQuestions: 1, timedOut: false },
    })
  })

  it('auto-submits the current question on timer expiry mid-question', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(1_000)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('next')
      .mockImplementationOnce((_config, context) => new Promise((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(makeAbortPromptError()))
      }))

    const resultPromise = showChallengeExecution('typescript', { timeBudgetMs: 5_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(4_000)
    const result = await resultPromise

    expect(result?.records).toHaveLength(2)
    expect(result?.records[0]?.userAnswer).toBe('A')
    expect(result?.records[1]?.userAnswer).toBe('TIMEOUT')
    expect(result?.records[1]?.isCorrect).toBe(false)
    expect(result?.records[1]?.speedTier).toBe('slow')
    expect(result?.records[1]?.scoreDelta).toBe(-40)
    expect(mockApplyAnswer).toHaveBeenNthCalledWith(2, expect.any(Object), false, 8_000, { fastMs: 2_000, slowMs: 8_000 })
    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
    expect(result?.sprintResult).toEqual({ questionsAnswered: 2, totalQuestions: 2, timedOut: true })
  })

  it('ends gracefully on timer expiry mid-post-answer', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(1_000)
        return Promise.resolve('A')
      })
      .mockImplementationOnce((_config, context) => new Promise((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(makeAbortPromptError()))
      }))

    const resultPromise = showChallengeExecution('typescript', { timeBudgetMs: 5_000, questionCount: 1 }, [makeQuestion()])

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(4_000)
    const result = await resultPromise

    expect(result?.records).toHaveLength(1)
    expect(mockWriteDomain).toHaveBeenCalledTimes(1)
    expect(result?.sprintResult).toEqual({ questionsAnswered: 1, totalQuestions: 1, timedOut: true })
  })

  it('returns answered-so-far session data on Ctrl+C during a prompt', async () => {
    mockSelect
      .mockResolvedValueOnce('A')
      .mockRejectedValueOnce(new ExitPromptError())

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    expect(result?.records).toHaveLength(1)
    expect(mockWriteDomain).toHaveBeenCalledTimes(1)
    expect(result?.sprintResult).toEqual({ questionsAnswered: 1, totalQuestions: 1, timedOut: false })
  })

  it('writes domain state after every answered question', async () => {
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('B')
      .mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    expect(mockWriteDomain).toHaveBeenCalledTimes(2)
  })

  it('measures speed by individual answer time, not sprint budget', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(2_500)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    expect(mockApplyAnswer.mock.calls[0][2]).toBe(2_500)
    expect(mockApplyAnswer.mock.calls[0][2]).not.toBe(300_000)
  })

  it('limits post-answer navigation to Next and Back only', async () => {
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    const postAnswerPrompt = mockSelect.mock.calls[1][0]
    const choiceNames = postAnswerPrompt.choices.filter((choice: unknown) => !(choice instanceof MockSeparator)).map((choice: { name: string }) => choice.name)
    expect(choiceNames).toEqual(['▶️  Next question', '↩️  Back'])
  })

  it('returns complete session data when all questions are answered', async () => {
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('B')
      .mockResolvedValueOnce('next')

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    expect(result).toEqual({
      startingDifficulty: 2,
      records: [
        expect.objectContaining({ question: 'Q1', userAnswer: 'A' }),
        expect.objectContaining({ question: 'Q2', userAnswer: 'B' }),
      ],
      sprintResult: { questionsAnswered: 2, totalQuestions: 2, timedOut: false },
    })
  })

  it('calls clearAndBanner before each question render', async () => {
    mockSelect
      .mockResolvedValueOnce('A')
      .mockResolvedValueOnce('next')
      .mockResolvedValueOnce('B')
      .mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    expect(mockClearAndBanner).toHaveBeenCalledTimes(2)
  })

  it('passes AbortSignal in the prompt context for answer and post-answer prompts', async () => {
    mockSelect.mockResolvedValueOnce('A').mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()])

    expect(mockSelect.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    expect(mockSelect.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal)
    expect(mockSelect.mock.calls[0][0].signal).toBeUndefined()
    expect(mockSelect.mock.calls[1][0].signal).toBeUndefined()
  })

  it('re-throws non-ExitPromptError and non-AbortPromptError from answer prompt', async () => {
    mockSelect.mockRejectedValueOnce(new Error('unexpected'))

    await expect(
      showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 1 }, [makeQuestion()]),
    ).rejects.toThrow('unexpected')
  })

  it('uses forced slow threshold for timeout question scoring', async () => {
    mockSelect
      .mockImplementationOnce((_config, context) => new Promise((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(makeAbortPromptError()))
      }))

    const resultPromise = showChallengeExecution('typescript', { timeBudgetMs: 3_000, questionCount: 1 }, [makeQuestion()])

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(3_000)
    await resultPromise

    expect(mockApplyAnswer).toHaveBeenCalledWith(expect.any(Object), false, 8_000, { fastMs: 2_000, slowMs: 8_000 })
  })

  it('does not add unanswered questions hashes to the domain', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(1_000)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('back')

    await showChallengeExecution('typescript', { timeBudgetMs: 300_000, questionCount: 3 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
      makeQuestion('Q3', 'C'),
    ])

    expect(mockWriteDomain).toHaveBeenCalledTimes(1)
    const writtenDomain = mockWriteDomain.mock.calls[0][1]
    expect(writtenDomain.hashes).toEqual(['hash:Q1'])
    expect(writtenDomain.hashes).not.toContain('hash:Q2')
    expect(writtenDomain.hashes).not.toContain('hash:Q3')
  })

  it('renders timeout feedback message on timer expiry mid-question', async () => {
    mockSelect
      .mockImplementationOnce((_config, context) => new Promise((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(makeAbortPromptError()))
      }))

    const resultPromise = showChallengeExecution('typescript', { timeBudgetMs: 3_000, questionCount: 1 }, [makeQuestion()])

    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(3_000)
    await resultPromise

    const output = vi.mocked(console.log).mock.calls.map((call) => String(call[0])).join('\n')
    expect(output).toContain('Time expired. Auto-submitting current question.')
  })

  it('sets timedOut to true when timer expires between questions', async () => {
    mockSelect
      .mockImplementationOnce(() => {
        vi.advanceTimersByTime(5_000)
        return Promise.resolve('A')
      })
      .mockResolvedValueOnce('next')

    const result = await showChallengeExecution('typescript', { timeBudgetMs: 5_000, questionCount: 2 }, [
      makeQuestion('Q1', 'A'),
      makeQuestion('Q2', 'B'),
    ])

    expect(result?.sprintResult).toEqual({ questionsAnswered: 1, totalQuestions: 2, timedOut: true })
  })
})