import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashQuestion } from '../utils/hash.js'
import type { AiProvider } from './providers.js'
import type { SettingsFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mock providers module — intercept createProvider, keep real AI_ERRORS
// ---------------------------------------------------------------------------
const mockGenerateCompletion = vi.fn<(prompt: string) => Promise<string>>()
const mockRandomInt = vi.fn<(max: number) => number>()

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  return {
    ...actual,
    randomInt: (...args: unknown[]) => mockRandomInt(args[0] as number),
  }
})

vi.mock('./providers.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./providers.js')>()
  return {
    ...actual,
    createProvider: vi.fn(),
  }
})

// Must import after mock setup
const { generateQuestion, preloadQuestions, generateMotivationalMessage, generateExplanation, generateMicroLesson, AI_ERRORS, isAuthErrorMessage } = await import('./client.js')
const { createProvider } = await import('./providers.js')
const mockCreateProvider = vi.mocked(createProvider)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMockProvider(): AiProvider {
  return { generateCompletion: mockGenerateCompletion }
}

function makeSettings(provider: SettingsFile['provider'] = 'openai'): SettingsFile {
  return {
    provider,
    language: 'English',
    tone: 'natural',
    openaiModel: 'gpt-4o-mini',
    anthropicModel: 'claude-sonnet-4-20250514',
    geminiModel: 'gemini-2.0-flash',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3',
    showWelcome: true,
  }
}

function makeValidResponse(question = 'What is 2+2?') {
  return JSON.stringify({
    question,
    options: { A: '1', B: '2', C: '4', D: '8' },
    correctAnswer: 'C',
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
  })
}

function makeVerificationResponse(correctAnswer: 'A' | 'B' | 'C' | 'D' = 'C') {
  return JSON.stringify({ correctAnswer })
}

function mockSuccessfulGeneration(question = 'What is 2+2?') {
  mockGenerateCompletion
    .mockResolvedValueOnce(makeValidResponse(question))
    .mockResolvedValueOnce(makeVerificationResponse('C'))
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockGenerateCompletion.mockReset()
  mockCreateProvider.mockReset()
  mockRandomInt.mockReset()
  // Default: provider creation succeeds
  mockCreateProvider.mockReturnValue({ ok: true, data: makeMockProvider() })
  // Default: real-ish random for non-deterministic tests
  mockRandomInt.mockImplementation((max: number) => Math.floor(0.5 * max))
})

// ---------------------------------------------------------------------------
// generateQuestion
// ---------------------------------------------------------------------------
describe('generateQuestion', () => {
  const settings = makeSettings('openai')

  it('returns ok:true with a valid Question on success', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
    // Options are shuffled — verify all values are present and correctAnswer points to '4'
    expect(Object.values(result.data.options).sort((a, b) => a.localeCompare(b))).toEqual(['1', '2', '4', '8'])
    expect(result.data.options[result.data.correctAnswer]).toBe('4')
    expect(result.data.difficultyLevel).toBe(2)
    expect(result.data.speedThresholds.fastMs).toBe(8000)
  })

  it('strips ```json fences before parsing', async () => {
    const wrapped = '```json\n' + makeValidResponse() + '\n```'
    mockGenerateCompletion.mockResolvedValueOnce(wrapped)
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)
    expect(result.ok).toBe(true)
  })

  it('returns PARSE error when response is not valid JSON', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('not json at all')

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns PARSE error when JSON does not match schema', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }))

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns NO_PROVIDER error when provider is not configured', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateQuestion('typescript', 2, new Set(), [], makeSettings(null))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns provider-specific NETWORK error on generic error (openai)', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateQuestion('typescript', 2, new Set(), [], makeSettings('openai'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_OPENAI)
  })

  it('returns provider-specific NETWORK error on generic error (copilot)', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('socket hang up'))

    const result = await generateQuestion('typescript', 2, new Set(), [], makeSettings('copilot'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_COPILOT)
  })

  it.each([
    ['401', 'HTTP 401 Unauthorized'],
    ['unauthorized', 'unauthorized access'],
    ['authentication', 'authentication failed'],
    ['api key', 'Invalid api key provided'],
  ])('returns provider-specific AUTH error when error message contains "%s"', async (_, errorMsg) => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error(errorMsg))

    const result = await generateQuestion('typescript', 2, new Set(), [], makeSettings('anthropic'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH_ANTHROPIC)
  })

  it('retries with deduplication prompt when first question is a duplicate', async () => {
    const firstQ = 'What is 2+2?'
    const secondQ = 'What is 3+3?'
    const existingHash = hashQuestion(firstQ)

    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse(firstQ))
      .mockResolvedValueOnce(makeVerificationResponse('C'))
      .mockResolvedValueOnce(makeValidResponse(secondQ))
      .mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('typescript', 2, new Set([existingHash]), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe(secondQ)
    expect(Object.values(result.data.options).sort((a, b) => a.localeCompare(b))).toEqual(['1', '2', '4', '8'])
    expect(result.data.options[result.data.correctAnswer]).toBe('4')
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(4)
  })

  it('does not retry when first question is not a duplicate', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(mockGenerateCompletion).toHaveBeenCalledTimes(2)
  })

  it('uses defaultSettings when no settings provided', async () => {
    // defaultSettings has provider: null, so createProvider returns NO_PROVIDER
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })
})

// ---------------------------------------------------------------------------
// settings injection
// ---------------------------------------------------------------------------
describe('settings injection', () => {
  it('injects voice instruction into prompt when settings are non-default', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))
    const settings = makeSettings('openai')
    settings.language = 'Greek'
    settings.tone = 'pirate'

    await generateQuestion('typescript', 2, new Set(), [], settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('no voice instruction in prompt when settings are English/natural', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))
    const settings = makeSettings('openai')

    await generateQuestion('typescript', 2, new Set(), [], settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).not.toContain('Respond in')
  })

  it('injects voice instruction into deduplication retry prompt', async () => {
    const firstQ = 'What is 2+2?'
    const existingHash = hashQuestion(firstQ)
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse(firstQ))
      .mockResolvedValueOnce(makeVerificationResponse('C'))
      .mockResolvedValueOnce(makeValidResponse('What is 3+3?'))
      .mockResolvedValueOnce(makeVerificationResponse('C'))
    const settings = makeSettings('openai')
    settings.language = 'Spanish'
    settings.tone = 'expressive'

    await generateQuestion('typescript', 2, new Set([existingHash]), [], settings)

    const retryPrompt: string = mockGenerateCompletion.mock.calls[2][0]
    expect(retryPrompt).toContain('Respond in Spanish using an expressive tone of voice.')
  })
})

// ---------------------------------------------------------------------------
// generateMotivationalMessage
// ---------------------------------------------------------------------------
describe('generateMotivationalMessage', () => {
  const settings = makeSettings('openai')

  it('returns ok:true with message string on success', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Great job coming back!')

    const result = await generateMotivationalMessage('returning', settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Great job coming back!')
  })

  it('trims whitespace from the returned message', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('  Keep it up!  \n')

    const result = await generateMotivationalMessage('returning', settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Keep it up!')
  })

  it('returns NO_PROVIDER error when provider is not configured', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateMotivationalMessage('returning', makeSettings(null))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns provider-specific error on network error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateMotivationalMessage('trending', makeSettings('gemini'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_GEMINI)
  })

  it('returns provider-specific error on auth error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const result = await generateMotivationalMessage('returning', makeSettings('copilot'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH_COPILOT)
  })

  it('passes settings to the prompt (voice instruction injected)', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Kalimera!')
    const settings = makeSettings('openai')
    settings.language = 'Greek'
    settings.tone = 'pirate'

    await generateMotivationalMessage('returning', settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })
})

// ---------------------------------------------------------------------------
// generateExplanation
// ---------------------------------------------------------------------------
describe('generateExplanation', () => {
  const settings = makeSettings('openai')
  const question = {
    question: 'What is TypeScript?',
    options: { A: 'A typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
    correctAnswer: 'A' as const,
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
  }

  it('returns ok:true with explanation string on success', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('TypeScript is a typed superset of JavaScript.')

    const result = await generateExplanation(question, 'B', settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('TypeScript is a typed superset of JavaScript.')
  })

  it('trims whitespace from the returned explanation', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('  Explanation here.  \n')

    const result = await generateExplanation(question, 'A', settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Explanation here.')
  })

  it('returns NO_PROVIDER error when provider is not configured', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateExplanation(question, 'A', makeSettings(null))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns provider-specific error on network error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateExplanation(question, 'A', makeSettings('gemini'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_GEMINI)
  })

  it('returns provider-specific error on auth error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const result = await generateExplanation(question, 'A', makeSettings('copilot'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH_COPILOT)
  })

  it('passes settings to the prompt (voice instruction injected)', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Explanation in Greek!')
    const settings = makeSettings('openai')
    settings.language = 'Greek'
    settings.tone = 'pirate'

    await generateExplanation(question, 'B', settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('includes question context in prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Explanation.')

    await generateExplanation(question, 'B', settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('What is TypeScript?')
    expect(sentPrompt).toContain('Correct answer: A')
    expect(sentPrompt).toContain("User's answer: B")
  })

  it('uses defaultSettings when no settings provided', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateExplanation(question, 'A')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })
})

// ---------------------------------------------------------------------------
// generateMicroLesson
// ---------------------------------------------------------------------------
describe('generateMicroLesson', () => {
  const settings = makeSettings('openai')
  const question = {
    question: 'What is TypeScript?',
    options: { A: 'A typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
    correctAnswer: 'A' as const,
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
  }
  const explanation = 'TypeScript is a typed superset of JavaScript.'

  it('returns ok:true with micro-lesson string on success', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('TypeScript builds on JavaScript by adding static types...')

    const result = await generateMicroLesson(question, explanation, settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('TypeScript builds on JavaScript by adding static types...')
  })

  it('trims whitespace from the returned micro-lesson', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('  Micro-lesson content.  \n')

    const result = await generateMicroLesson(question, explanation, settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Micro-lesson content.')
  })

  it('returns NO_PROVIDER error when provider is not configured', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateMicroLesson(question, explanation, makeSettings(null))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns provider-specific error on network error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateMicroLesson(question, explanation, makeSettings('gemini'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_GEMINI)
  })

  it('returns provider-specific error on auth error', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const result = await generateMicroLesson(question, explanation, makeSettings('copilot'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH_COPILOT)
  })

  it('passes settings to the prompt (voice instruction injected)', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Micro-lesson in Greek!')
    const settings = makeSettings('openai')
    settings.language = 'Greek'
    settings.tone = 'pirate'

    await generateMicroLesson(question, explanation, settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('includes question and explanation context in prompt', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('Lesson.')

    await generateMicroLesson(question, explanation, settings)

    const sentPrompt: string = mockGenerateCompletion.mock.calls[0][0]
    expect(sentPrompt).toContain('What is TypeScript?')
    expect(sentPrompt).toContain('Correct answer: A')
    expect(sentPrompt).toContain('TypeScript is a typed superset of JavaScript.')
  })

  it('uses defaultSettings when no settings provided', async () => {
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await generateMicroLesson(question, explanation)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })
})

// ---------------------------------------------------------------------------
// isAuthErrorMessage
// ---------------------------------------------------------------------------
describe('isAuthErrorMessage', () => {
  it.each([
    AI_ERRORS.AUTH_COPILOT,
    AI_ERRORS.AUTH_OPENAI,
    AI_ERRORS.AUTH_ANTHROPIC,
    AI_ERRORS.AUTH_GEMINI,
    AI_ERRORS.AUTH_OLLAMA,
  ])('returns true for "%s"', (msg) => {
    expect(isAuthErrorMessage(msg)).toBe(true)
  })

  it.each([
    AI_ERRORS.NETWORK_COPILOT,
    AI_ERRORS.NETWORK_OPENAI,
    AI_ERRORS.PARSE,
    AI_ERRORS.NO_PROVIDER,
    'some random error',
    '',
  ])('returns false for "%s"', (msg) => {
    expect(isAuthErrorMessage(msg)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  const settings = makeSettings('openai')

  it('returns NETWORK error when a non-Error value is thrown', async () => {
    mockGenerateCompletion.mockRejectedValueOnce('plain string error')

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_OPENAI)
  })

  it('handles ``` fence with no newline after language tag', async () => {
    const noNewlineFence = '```' + makeValidResponse() + '```'
    mockGenerateCompletion.mockResolvedValueOnce(noNewlineFence)
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
  })

  it('returns NETWORK_OLLAMA with custom endpoint', async () => {
    const ollamaSettings = makeSettings('ollama')
    ollamaSettings.ollamaEndpoint = 'http://custom:9999'
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateQuestion('typescript', 2, new Set(), [], ollamaSettings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_OLLAMA('http://custom:9999'))
  })

  it('classifies auth error per provider for ollama', async () => {
    mockGenerateCompletion.mockRejectedValueOnce(new Error('401 unauthorized'))

    const result = await generateQuestion('typescript', 2, new Set(), [], makeSettings('ollama'))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH_OLLAMA)
  })

  it('returns NETWORK error for motivational message with non-Error throw', async () => {
    mockGenerateCompletion.mockRejectedValueOnce('string error')

    const result = await generateMotivationalMessage('returning', settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_OPENAI)
  })

  it('returns empty string data when provider returns empty content', async () => {
    mockGenerateCompletion.mockResolvedValueOnce('')

    const result = await generateMotivationalMessage('returning', settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('')
  })

  it('AI_ERRORS re-exported from client matches providers AI_ERRORS', async () => {
    const { AI_ERRORS: clientErrors } = await import('./client.js')
    const { AI_ERRORS: providerErrors } = await import('./providers.js')
    expect(clientErrors).toBe(providerErrors)
  })
})

// ---------------------------------------------------------------------------
// shuffleOptions (deterministic via randomInt mock)
// ---------------------------------------------------------------------------
describe('shuffleOptions', () => {
  const settings = makeSettings('openai')

  it('shuffles option positions while preserving correctAnswer mapping', async () => {
    // Mock randomInt to always return 0:
    // Fisher-Yates with indices [0,1,2,3]:
    //   i=3: j=0 → swap(3,0) → [3,1,2,0]
    //   i=2: j=0 → swap(2,0) → [2,1,3,0]
    //   i=1: j=0 → swap(1,0) → [1,2,3,0]
    // Result indices: [1,2,3,0] → A=B, B=C, C=D, D=A
    mockRandomInt.mockReturnValue(0)

    mockGenerateCompletion.mockResolvedValueOnce(JSON.stringify({
      question: 'Capital of France?',
      options: { A: 'Berlin', B: 'Paris', C: 'Rome', D: 'Madrid' },
      correctAnswer: 'B',
      difficultyLevel: 1,
      speedThresholds: { fastMs: 8000, slowMs: 25000 },
    }))
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('B'))

    const result = await generateQuestion('geography', 1, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // With all-zero randomInt: indices become [1,2,3,0]
    // A=options[keys[1]]=B(Paris), B=options[keys[2]]=C(Rome), C=options[keys[3]]=D(Madrid), D=options[keys[0]]=A(Berlin)
    expect(result.data.options).toEqual({ A: 'Paris', B: 'Rome', C: 'Madrid', D: 'Berlin' })
    expect(result.data.correctAnswer).toBe('A') // Paris moved from B to A
    expect(result.data.options[result.data.correctAnswer]).toBe('Paris')
  })

  it('preserves all option values after shuffle', async () => {
    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.values(result.data.options).sort((a, b) => a.localeCompare(b))).toEqual(['1', '2', '4', '8'])
    expect(['A', 'B', 'C', 'D']).toContain(result.data.correctAnswer)
    expect(result.data.options[result.data.correctAnswer]).toBe('4')
  })

  it('identity shuffle when randomInt always returns max', async () => {
    // When randomInt(max) returns max-1 (last valid index), every swap is self-swap → identity
    mockRandomInt.mockImplementation((max: number) => max - 1)

    mockGenerateCompletion.mockResolvedValueOnce(makeValidResponse())
    mockGenerateCompletion.mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Identity shuffle: positions unchanged
    expect(result.data.options).toEqual({ A: '1', B: '2', C: '4', D: '8' })
    expect(result.data.correctAnswer).toBe('C')
  })
})

// ---------------------------------------------------------------------------
// answer verification (self-consistency check)
// ---------------------------------------------------------------------------
describe('answer verification', () => {
  const settings = makeSettings('openai')

  it('regenerates question when verification disagrees with correctAnswer', async () => {
    // First question: correctAnswer C, but verification says A → mismatch
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse('What is 2+2?'))
      .mockResolvedValueOnce(makeVerificationResponse('A'))
      // Regenerated question
      .mockResolvedValueOnce(makeValidResponse('What is 3+3?'))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 3+3?')
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(3)
  })

  it('proceeds normally when verification agrees', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce(makeVerificationResponse('C'))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(2)
  })

  it('skips verification when verification response is not valid JSON', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce('not json')

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(2)
  })

  it('skips verification when verification response does not match schema', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce(JSON.stringify({ answer: 'C' }))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
  })

  it('skips verification when verification call throws', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockRejectedValueOnce(new Error('network error'))

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
  })

  it('returns PARSE error when regenerated question after verification failure is invalid', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce(makeVerificationResponse('A')) // disagree
      .mockResolvedValueOnce('not json') // regeneration fails

    const result = await generateQuestion('math', 2, new Set(), [], settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('verification prompt does not reveal the original correct answer', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce(makeVerificationResponse('C'))

    await generateQuestion('math', 2, new Set(), [], settings)

    const verifyPrompt: string = mockGenerateCompletion.mock.calls[1][0]
    expect(verifyPrompt).toContain('answer-verification engine')
    expect(verifyPrompt).not.toContain('Correct answer:')
  })

  it('includes voice instruction in verification prompt when settings are non-default', async () => {
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse())
      .mockResolvedValueOnce(makeVerificationResponse('C'))
    const greekSettings = makeSettings('openai')
    greekSettings.language = 'Greek'
    greekSettings.tone = 'pirate'

    await generateQuestion('math', 2, new Set(), [], greekSettings)

    const verifyPrompt: string = mockGenerateCompletion.mock.calls[1][0]
    expect(verifyPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('verifies dedup question and regenerates on inconsistency', async () => {
    const firstQ = 'What is 2+2?'
    const existingHash = hashQuestion(firstQ)

    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse(firstQ))       // first question (duplicate)
      .mockResolvedValueOnce(makeVerificationResponse('C'))    // first verification (passes)
      .mockResolvedValueOnce(makeValidResponse('What is 3+3?')) // dedup question
      .mockResolvedValueOnce(makeVerificationResponse('A'))    // dedup verification (disagrees)
      .mockResolvedValueOnce(makeValidResponse('What is 5+5?')) // regenerated dedup

    const result = await generateQuestion('math', 2, new Set([existingHash]), [], settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 5+5?')
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(5)
  })
})

// ---------------------------------------------------------------------------
// preloadQuestions
// ---------------------------------------------------------------------------
describe('preloadQuestions', () => {
  const settings = makeSettings('openai')

  it('returns ok:true with Question[] of length N on success', async () => {
    mockSuccessfulGeneration('Q1')
    mockSuccessfulGeneration('Q2')
    mockSuccessfulGeneration('Q3')

    const result = await preloadQuestions(3, 'typescript', 2, new Set(), settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(3)
    expect(result.data[0].question).toBe('Q1')
    expect(result.data[1].question).toBe('Q2')
    expect(result.data[2].question).toBe('Q3')
  })

  it('accumulates hashes in the running set across calls', async () => {
    // Q1 generates fine. Q2 is a duplicate of Q1 → dedup retry fires
    // because Q1's hash is now in the running set.
    mockSuccessfulGeneration('Q1')
    // Q2 returns same text as Q1 → triggers dedup → retry returns unique Q
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse('Q1'))       // Q2 first attempt (dup of Q1)
      .mockResolvedValueOnce(makeVerificationResponse('C'))  // Q2 verification
      .mockResolvedValueOnce(makeValidResponse('Q2-unique')) // Q2 dedup retry
      .mockResolvedValueOnce(makeVerificationResponse('C'))  // Q2 retry verification

    const result = await preloadQuestions(2, 'typescript', 2, new Set(), settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toHaveLength(2)
    expect(result.data[0].question).toBe('Q1')
    expect(result.data[1].question).toBe('Q2-unique')
    // 2 completions for Q1 + 4 completions for Q2 (gen+verify+dedup+verify) = 6
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(6)
  })

  it('passes growing previousQuestions array to each call', async () => {
    // Q1 generates fine. Q2 duplicates Q1 → dedup prompt should contain Q1's text
    mockSuccessfulGeneration('Q1')
    // Q2 returns same as Q1 → dedup retry fires with previousQuestions containing Q1
    mockGenerateCompletion
      .mockResolvedValueOnce(makeValidResponse('Q1'))       // Q2 dup
      .mockResolvedValueOnce(makeVerificationResponse('C'))  // Q2 verify
      .mockResolvedValueOnce(makeValidResponse('Q2-unique')) // Q2 dedup retry
      .mockResolvedValueOnce(makeVerificationResponse('C'))  // verify

    await preloadQuestions(2, 'typescript', 2, new Set(), settings)

    // The dedup prompt (3rd call to generateCompletion) should contain Q1
    const dedupPrompt: string = mockGenerateCompletion.mock.calls[4][0]
    expect(dedupPrompt).toContain('Q1')
  })

  it('returns failure immediately on any generateQuestion error — no further calls', async () => {
    mockSuccessfulGeneration('Q1')
    // Second call fails
    mockCreateProvider.mockReturnValueOnce({ ok: false, error: AI_ERRORS.NO_PROVIDER })

    const result = await preloadQuestions(3, 'typescript', 2, new Set(), settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('partial failure at 3rd of 5 — result is ok:false, only 2 completions', async () => {
    mockSuccessfulGeneration('Q1')
    mockSuccessfulGeneration('Q2')
    // 3rd fails with network error
    mockGenerateCompletion.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await preloadQuestions(5, 'typescript', 2, new Set(), settings)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK_OPENAI)
    // 2 successful calls × 2 completions each + 1 failed = 5 total completion calls
    expect(mockGenerateCompletion).toHaveBeenCalledTimes(5)
  })

  it('calls onProgress after each successful generation', async () => {
    mockSuccessfulGeneration('Q1')
    mockSuccessfulGeneration('Q2')
    mockSuccessfulGeneration('Q3')
    const onProgress = vi.fn()

    await preloadQuestions(3, 'typescript', 2, new Set(), settings, onProgress)

    expect(onProgress).toHaveBeenCalledTimes(3)
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3)
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3)
    expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3)
  })

  it('returns ok:true with empty array when count is 0', async () => {
    const result = await preloadQuestions(0, 'typescript', 2, new Set(), settings)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual([])
  })
})
