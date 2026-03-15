import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CopilotClient } from '@github/copilot-sdk'
import { generateQuestion, generateMotivationalMessage, AI_ERRORS, _setClient } from './client.js'
import { hashQuestion } from '../utils/hash.js'

// Prevent the real SDK (which has a transitive CJS/ESM issue) from loading
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

// ---------------------------------------------------------------------------
// Mock session fns
// ---------------------------------------------------------------------------
const mockSendAndWait = vi.fn()
const mockDisconnect = vi.fn()
const mockCreateSession = vi.fn()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeValidResponse(question = 'What is 2+2?') {
  return JSON.stringify({
    question,
    options: { A: '1', B: '2', C: '4', D: '8' },
    correctAnswer: 'C',
    difficultyLevel: 2,
    speedThresholds: { fastMs: 8000, slowMs: 20000 },
  })
}

function makeEvent(content: string) {
  return { data: { content } }
}

// Build a fake CopilotClient that bypasses the real CLI constructor
function makeFakeClient(): CopilotClient {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue([]),
    createSession: mockCreateSession,
  } as unknown as CopilotClient
}

// ---------------------------------------------------------------------------
// Setup: inject mock client before each test so getClient() skips start()
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockSendAndWait.mockReset()
  mockDisconnect.mockReset()
  mockCreateSession.mockReset()

  mockDisconnect.mockResolvedValue(undefined)
  mockCreateSession.mockResolvedValue({
    sendAndWait: mockSendAndWait,
    disconnect: mockDisconnect,
  })

  // Inject pre-built client — getClient() returns it without calling start()
  _setClient(makeFakeClient())
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('generateQuestion', () => {
  it('returns ok:true with a valid Question on success', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe('What is 2+2?')
    expect(result.data.options).toEqual({ A: '1', B: '2', C: '4', D: '8' })
    expect(result.data.correctAnswer).toBe('C')
    expect(result.data.difficultyLevel).toBe(2)
    expect(result.data.speedThresholds.fastMs).toBe(8000)
  })

  it('strips ```json fences before parsing', async () => {
    const wrapped = '```json\n' + makeValidResponse() + '\n```'
    mockSendAndWait.mockResolvedValueOnce(makeEvent(wrapped))

    const result = await generateQuestion('typescript', 2, new Set())
    expect(result.ok).toBe(true)
  })

  it('returns PARSE error when response is not valid JSON', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('not json at all'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns PARSE error when JSON does not match schema', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(JSON.stringify({ foo: 'bar' })))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns NETWORK error on generic createSession error', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK)
  })

  it('returns NETWORK error on generic sendAndWait error', async () => {
    mockSendAndWait.mockRejectedValueOnce(new Error('socket hang up'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK)
  })

  it.each([
    ['401', 'HTTP 401 Unauthorized'],
    ['unauthorized', 'unauthorized access'],
    ['authentication', 'authentication failed'],
  ])('returns AUTH error when error message contains "%s"', async (_, errorMsg) => {
    mockCreateSession.mockRejectedValueOnce(new Error(errorMsg))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH)
  })

  it('retries with deduplication prompt when first question is a duplicate', async () => {
    const firstQ = 'What is 2+2?'
    const secondQ = 'What is 3+3?'
    const existingHash = hashQuestion(firstQ)

    mockSendAndWait
      .mockResolvedValueOnce(makeEvent(makeValidResponse(firstQ)))
      .mockResolvedValueOnce(makeEvent(makeValidResponse(secondQ)))

    const result = await generateQuestion('typescript', 2, new Set([existingHash]))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.question).toBe(secondQ)
    expect(mockSendAndWait).toHaveBeenCalledTimes(2)
  })

  it('does not retry when first question is not a duplicate', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))

    await generateQuestion('typescript', 2, new Set())

    expect(mockSendAndWait).toHaveBeenCalledTimes(1)
  })

  it('calls session.disconnect after a successful call', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))

    await generateQuestion('typescript', 2, new Set())

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('calls session.disconnect even when parse fails', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('bad json'))

    await generateQuestion('typescript', 2, new Set())

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('returns AUTH error when error message contains "unauthenticated"', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('unauthenticated request'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH)
  })
})

describe('getClient initialization', () => {
  it('calls client.start() when no client has been previously injected', async () => {
    _setClient(null)

    const { CopilotClient } = await import('@github/copilot-sdk')
    const mockStartFn = vi.fn().mockResolvedValue(undefined)
    // Use a regular function (not arrow) so it works properly as a constructor mock
    vi.mocked(CopilotClient).mockImplementationOnce(function (this: unknown) {
      return {
        start: mockStartFn,
        stop: vi.fn().mockResolvedValue([]),
        createSession: mockCreateSession,
      } as unknown as InstanceType<typeof CopilotClient>
    } as unknown as new () => InstanceType<typeof CopilotClient>)

    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(true)
    expect(mockStartFn).toHaveBeenCalledOnce()

    // Re-inject a mock so subsequent tests are not affected
    _setClient(makeFakeClient())
  })
})

describe('settings injection', () => {
  it('accepts settings parameter and returns ok:true', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))
    const settings = { language: 'Spanish', tone: 'expressive' as const }

    const result = await generateQuestion('typescript', 2, new Set(), [], settings)

    expect(result.ok).toBe(true)
  })

  it('injects voice instruction into prompt when settings are non-default', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))
    const settings = { language: 'Greek', tone: 'pirate' as const }

    await generateQuestion('typescript', 2, new Set(), [], settings)

    const sentPrompt: string = mockSendAndWait.mock.calls[0][0].prompt
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('no voice instruction in prompt when settings are English/normal', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent(makeValidResponse()))
    const settings = { language: 'English', tone: 'natural' as const }

    await generateQuestion('typescript', 2, new Set(), [], settings)

    const sentPrompt: string = mockSendAndWait.mock.calls[0][0].prompt
    expect(sentPrompt).not.toContain('Respond in')
  })

  it('injects voice instruction into deduplication retry prompt', async () => {
    const firstQ = 'What is 2+2?'
    const existingHash = hashQuestion(firstQ)
    mockSendAndWait
      .mockResolvedValueOnce(makeEvent(makeValidResponse(firstQ)))
      .mockResolvedValueOnce(makeEvent(makeValidResponse('What is 3+3?')))
    const settings = { language: 'Spanish', tone: 'expressive' as const }

    await generateQuestion('typescript', 2, new Set([existingHash]), [], settings)

    const retryPrompt: string = mockSendAndWait.mock.calls[1][0].prompt
    expect(retryPrompt).toContain('Respond in Spanish using an expressive tone of voice.')
  })
})

describe('generateMotivationalMessage', () => {
  it('returns ok:true with message string on success', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('Great job coming back!'))

    const result = await generateMotivationalMessage('returning')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Great job coming back!')
  })

  it('trims whitespace from the returned message', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('  Keep it up!  \n'))

    const result = await generateMotivationalMessage('returning')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('Keep it up!')
  })

  it('returns ok:false on network error', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('Connection refused'))

    const result = await generateMotivationalMessage('trending')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK)
  })

  it('returns ok:false on auth error', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const result = await generateMotivationalMessage('returning')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH)
  })

  it('calls session.disconnect after success', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('Well done!'))

    await generateMotivationalMessage('trending')

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('calls session.disconnect even when sendAndWait throws', async () => {
    mockSendAndWait.mockRejectedValueOnce(new Error('socket hang up'))
    // session is created, so finally runs
    mockCreateSession.mockResolvedValueOnce({
      sendAndWait: mockSendAndWait,
      disconnect: mockDisconnect,
    })

    await generateMotivationalMessage('returning')

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('passes settings to the prompt (voice instruction injected)', async () => {
    mockSendAndWait.mockResolvedValueOnce(makeEvent('Kalimera!'))
    const settings = { language: 'Greek', tone: 'pirate' as const }

    await generateMotivationalMessage('returning', settings)

    const sentPrompt: string = mockSendAndWait.mock.calls[0][0].prompt
    expect(sentPrompt).toContain('Respond in Greek using a pirate tone of voice.')
  })
})

describe('edge cases', () => {
  it('returns NETWORK error when a non-Error value is thrown', async () => {
    // Throws a plain string — isAuthError returns false (err not instanceof Error)
    mockCreateSession.mockRejectedValueOnce('plain string error')

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK)
  })

  it('handles ``` fence with no newline after language tag (slice(3) branch)', async () => {
    // '```' immediately followed by JSON (no newline) — exercises newlineIdx === -1 branch
    const noNewlineFence = '```' + makeValidResponse() + '```'
    mockSendAndWait.mockResolvedValueOnce(makeEvent(noNewlineFence))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(true)
  })

  it('returns PARSE error when sendAndWait returns a null event (content ?? fallback)', async () => {
    mockSendAndWait.mockResolvedValueOnce(null)

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns PARSE error when retry sendAndWait returns a null event', async () => {
    const firstQ = 'What is 2+2?'
    const existingHash = hashQuestion(firstQ)
    mockSendAndWait
      .mockResolvedValueOnce(makeEvent(makeValidResponse(firstQ)))
      .mockResolvedValueOnce(null)

    const result = await generateQuestion('typescript', 2, new Set([existingHash]))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.PARSE)
  })

  it('returns NETWORK error when generateMotivationalMessage receives non-Error throw', async () => {
    mockCreateSession.mockRejectedValueOnce('string error')

    const result = await generateMotivationalMessage('returning')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NETWORK)
  })

  it('returns empty string data when motivational event content is null', async () => {
    mockSendAndWait.mockResolvedValueOnce(null)

    const result = await generateMotivationalMessage('returning')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBe('')
  })
})
