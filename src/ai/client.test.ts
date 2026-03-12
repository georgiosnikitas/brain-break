import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CopilotClient } from '@github/copilot-sdk'
import { generateQuestion, AI_ERRORS, _setClient } from './client.js'
import { hashQuestion } from '../utils/hash.js'

// Prevent the real SDK (which has a transitive CJS/ESM issue) from loading
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: class {}, approveAll: vi.fn() }))

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

  it('returns AUTH error when error message contains "401"', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('HTTP 401 Unauthorized'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH)
  })

  it('returns AUTH error when error message contains "unauthorized"', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('unauthorized access'))

    const result = await generateQuestion('typescript', 2, new Set())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.AUTH)
  })

  it('returns AUTH error when error message contains "authentication"', async () => {
    mockCreateSession.mockRejectedValueOnce(new Error('authentication failed'))

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
