import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { CopilotClient } from '@github/copilot-sdk'
import type { SettingsFile } from '../domain/schema.js'
import { createProvider, validateProvider, AI_ERRORS, _setCopilotClient } from './providers.js'
import type { AiProvider } from './providers.js'

// ---------------------------------------------------------------------------
// Mock all provider SDKs — prevent real SDK loading
// ---------------------------------------------------------------------------
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

const mockGenerateText = vi.fn()
vi.mock('ai', () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }))

const mockOpenai = vi.fn()
vi.mock('@ai-sdk/openai', () => ({ openai: (...args: unknown[]) => mockOpenai(...args) }))

const mockAnthropic = vi.fn()
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: (...args: unknown[]) => mockAnthropic(...args) }))

const mockGoogle = vi.fn()
vi.mock('@ai-sdk/google', () => ({ google: (...args: unknown[]) => mockGoogle(...args) }))

const mockOllamaModel = vi.fn()
const mockCreateOllama = vi.fn()
vi.mock('ollama-ai-provider', () => ({ createOllama: (...args: unknown[]) => mockCreateOllama(...args) }))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSettings(overrides: Partial<SettingsFile> = {}): SettingsFile {
  return {
    provider: null,
    language: 'English',
    tone: 'natural',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3',
    ...overrides,
  }
}

const mockSendAndWait = vi.fn()
const mockDisconnect = vi.fn()
const mockCreateSession = vi.fn()

function makeFakeCopilotClient(): CopilotClient {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue([]),
    createSession: mockCreateSession,
  } as unknown as CopilotClient
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockGenerateText.mockReset()
  mockOpenai.mockReset()
  mockAnthropic.mockReset()
  mockGoogle.mockReset()
  mockOllamaModel.mockReset()
  mockCreateOllama.mockReset()
  mockSendAndWait.mockReset()
  mockDisconnect.mockReset()
  mockCreateSession.mockReset()

  mockDisconnect.mockResolvedValue(undefined)
  mockCreateSession.mockResolvedValue({
    sendAndWait: mockSendAndWait,
    disconnect: mockDisconnect,
  })

  // Model constructors return a sentinel for assertion
  mockOpenai.mockReturnValue('openai-model')
  mockAnthropic.mockReturnValue('anthropic-model')
  mockGoogle.mockReturnValue('google-model')
  mockOllamaModel.mockReturnValue('ollama-model')
  mockCreateOllama.mockReturnValue((...args: unknown[]) => mockOllamaModel(...args))

  _setCopilotClient(null)
})

// ---------------------------------------------------------------------------
// createProvider
// ---------------------------------------------------------------------------
describe('createProvider', () => {
  it('returns NO_PROVIDER error when provider is null', () => {
    const result = createProvider(makeSettings({ provider: null }))

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns ok:true with an AiProvider for copilot', () => {
    _setCopilotClient(makeFakeCopilotClient())
    const result = createProvider(makeSettings({ provider: 'copilot' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toBeDefined()
    expect(typeof result.data.generateCompletion).toBe('function')
  })

  it('returns ok:true with an AiProvider for openai', () => {
    const result = createProvider(makeSettings({ provider: 'openai' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.data.generateCompletion).toBe('function')
  })

  it('returns ok:true with an AiProvider for anthropic', () => {
    const result = createProvider(makeSettings({ provider: 'anthropic' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.data.generateCompletion).toBe('function')
  })

  it('returns ok:true with an AiProvider for gemini', () => {
    const result = createProvider(makeSettings({ provider: 'gemini' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.data.generateCompletion).toBe('function')
  })

  it('returns ok:true with an AiProvider for ollama', () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.data.generateCompletion).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// OpenAI adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('OpenAI adapter', () => {
  let provider: AiProvider

  beforeEach(() => {
    const result = createProvider(makeSettings({ provider: 'openai' }))
    if (!result.ok) throw new Error('expected ok')
    provider = result.data
  })

  it('calls generateText with openai model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'response text' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('response text')
    expect(mockOpenai).toHaveBeenCalledWith('gpt-4o-mini')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'openai-model',
      prompt: 'test prompt',
    })
  })

  it('propagates errors from generateText', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('API error'))

    await expect(provider.generateCompletion('test')).rejects.toThrow('API error')
  })
})

// ---------------------------------------------------------------------------
// Anthropic adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('Anthropic adapter', () => {
  let provider: AiProvider

  beforeEach(() => {
    const result = createProvider(makeSettings({ provider: 'anthropic' }))
    if (!result.ok) throw new Error('expected ok')
    provider = result.data
  })

  it('calls generateText with anthropic model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'anthropic response' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('anthropic response')
    expect(mockAnthropic).toHaveBeenCalledWith('claude-sonnet-4-20250514')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'anthropic-model',
      prompt: 'test prompt',
    })
  })
})

// ---------------------------------------------------------------------------
// Gemini adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('Gemini adapter', () => {
  let provider: AiProvider

  beforeEach(() => {
    const result = createProvider(makeSettings({ provider: 'gemini' }))
    if (!result.ok) throw new Error('expected ok')
    provider = result.data
  })

  it('calls generateText with google model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'gemini response' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('gemini response')
    expect(mockGoogle).toHaveBeenCalledWith('gemini-2.0-flash')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'google-model',
      prompt: 'test prompt',
    })
  })
})

// ---------------------------------------------------------------------------
// Ollama adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('Ollama adapter', () => {
  it('calls generateText with ollama model, custom endpoint and model', async () => {
    const settings = makeSettings({ provider: 'ollama', ollamaEndpoint: 'http://myhost:11434', ollamaModel: 'mistral' })
    const result = createProvider(settings)
    if (!result.ok) throw new Error('expected ok')

    mockGenerateText.mockResolvedValueOnce({ text: 'ollama response' })

    const text = await result.data.generateCompletion('test prompt')

    expect(text).toBe('ollama response')
    expect(mockCreateOllama).toHaveBeenCalledWith({ baseURL: 'http://myhost:11434/api' })
    expect(mockOllamaModel).toHaveBeenCalledWith('mistral')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'ollama-model',
      prompt: 'test prompt',
    })
  })

  it('uses default ollama settings from makeSettings', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    mockGenerateText.mockResolvedValueOnce({ text: 'ok' })
    await result.data.generateCompletion('prompt')

    expect(mockCreateOllama).toHaveBeenCalledWith({ baseURL: 'http://localhost:11434/api' })
    expect(mockOllamaModel).toHaveBeenCalledWith('llama3')
  })
})

// ---------------------------------------------------------------------------
// Copilot adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('Copilot adapter', () => {
  beforeEach(() => {
    _setCopilotClient(makeFakeCopilotClient())
  })

  it('uses CopilotClient to generate completion', async () => {
    mockSendAndWait.mockResolvedValueOnce({ data: { content: 'copilot response' } })
    const result = createProvider(makeSettings({ provider: 'copilot' }))
    if (!result.ok) throw new Error('expected ok')

    const text = await result.data.generateCompletion('test prompt')

    expect(text).toBe('copilot response')
    expect(mockCreateSession).toHaveBeenCalled()
    expect(mockSendAndWait).toHaveBeenCalledWith({ prompt: 'test prompt' })
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('disconnects session even when sendAndWait throws', async () => {
    mockSendAndWait.mockRejectedValueOnce(new Error('network error'))
    const result = createProvider(makeSettings({ provider: 'copilot' }))
    if (!result.ok) throw new Error('expected ok')

    await expect(result.data.generateCompletion('test')).rejects.toThrow('network error')
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('trims whitespace from copilot response', async () => {
    mockSendAndWait.mockResolvedValueOnce({ data: { content: '  hello  \n' } })
    const result = createProvider(makeSettings({ provider: 'copilot' }))
    if (!result.ok) throw new Error('expected ok')

    const text = await result.data.generateCompletion('test')
    expect(text).toBe('hello')
  })

  it('returns empty string when event is null', async () => {
    mockSendAndWait.mockResolvedValueOnce(null)
    const result = createProvider(makeSettings({ provider: 'copilot' }))
    if (!result.ok) throw new Error('expected ok')

    const text = await result.data.generateCompletion('test')
    expect(text).toBe('')
  })

  it('initializes CopilotClient when no client is injected', async () => {
    _setCopilotClient(null)

    const { CopilotClient } = await import('@github/copilot-sdk')
    const mockStartFn = vi.fn().mockResolvedValue(undefined)
    vi.mocked(CopilotClient).mockImplementationOnce(function (this: unknown) {
      return {
        start: mockStartFn,
        stop: vi.fn().mockResolvedValue([]),
        createSession: mockCreateSession,
      } as unknown as InstanceType<typeof CopilotClient>
    } as unknown as new () => InstanceType<typeof CopilotClient>)

    mockSendAndWait.mockResolvedValueOnce({ data: { content: 'ok' } })

    const result = createProvider(makeSettings({ provider: 'copilot' }))
    if (!result.ok) throw new Error('expected ok')

    await result.data.generateCompletion('test')
    expect(mockStartFn).toHaveBeenCalledOnce()

    // Re-inject null so subsequent tests are clean
    _setCopilotClient(null)
  })
})

// ---------------------------------------------------------------------------
// validateProvider
// ---------------------------------------------------------------------------
describe('validateProvider', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  describe('openai', () => {
    it('returns ok:true when OPENAI_API_KEY is set', async () => {
      process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test' }

      const result = await validateProvider('openai', makeSettings())
      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns AUTH_OPENAI error when OPENAI_API_KEY is missing', async () => {
      process.env = { ...originalEnv }
      delete process.env['OPENAI_API_KEY']

      const result = await validateProvider('openai', makeSettings())
      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OPENAI })
    })
  })

  describe('anthropic', () => {
    it('returns ok:true when ANTHROPIC_API_KEY is set', async () => {
      process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'sk-ant-test' }

      const result = await validateProvider('anthropic', makeSettings())
      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns AUTH_ANTHROPIC error when ANTHROPIC_API_KEY is missing', async () => {
      process.env = { ...originalEnv }
      delete process.env['ANTHROPIC_API_KEY']

      const result = await validateProvider('anthropic', makeSettings())
      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_ANTHROPIC })
    })
  })

  describe('gemini', () => {
    it('returns ok:true when GOOGLE_API_KEY is set', async () => {
      process.env = { ...originalEnv, GOOGLE_API_KEY: 'gk-test' }

      const result = await validateProvider('gemini', makeSettings())
      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns AUTH_GEMINI error when GOOGLE_API_KEY is missing', async () => {
      process.env = { ...originalEnv }
      delete process.env['GOOGLE_API_KEY']

      const result = await validateProvider('gemini', makeSettings())
      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_GEMINI })
    })
  })

  describe('ollama', () => {
    it('returns ok:true when endpoint is reachable', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true }))

      const result = await validateProvider('ollama', makeSettings({ ollamaEndpoint: 'http://localhost:11434' }))

      expect(result).toEqual({ ok: true, data: undefined })
      expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags')

      vi.unstubAllGlobals()
    })

    it('returns AUTH_OLLAMA error when endpoint returns non-ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false }))

      const result = await validateProvider('ollama', makeSettings())

      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OLLAMA })

      vi.unstubAllGlobals()
    })

    it('returns AUTH_OLLAMA error when fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')))

      const result = await validateProvider('ollama', makeSettings())

      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OLLAMA })

      vi.unstubAllGlobals()
    })
  })

  describe('copilot', () => {
    it('returns ok:true when CopilotClient session can be created', async () => {
      _setCopilotClient(makeFakeCopilotClient())

      const result = await validateProvider('copilot', makeSettings())

      expect(result).toEqual({ ok: true, data: undefined })
      expect(mockCreateSession).toHaveBeenCalled()
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('returns AUTH_COPILOT error when session creation fails', async () => {
      _setCopilotClient(makeFakeCopilotClient())
      mockCreateSession.mockRejectedValueOnce(new Error('auth failed'))

      const result = await validateProvider('copilot', makeSettings())

      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_COPILOT })
    })

    it('returns AUTH_COPILOT error when CopilotClient initialization fails', async () => {
      _setCopilotClient(null)

      const { CopilotClient } = await import('@github/copilot-sdk')
      vi.mocked(CopilotClient).mockImplementationOnce(function (this: unknown) {
        return {
          start: vi.fn().mockRejectedValue(new Error('not installed')),
          stop: vi.fn().mockResolvedValue([]),
          createSession: mockCreateSession,
        } as unknown as InstanceType<typeof CopilotClient>
      } as unknown as new () => InstanceType<typeof CopilotClient>)

      const result = await validateProvider('copilot', makeSettings())

      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_COPILOT })

      _setCopilotClient(null)
    })
  })
})

// ---------------------------------------------------------------------------
// AI_ERRORS constants
// ---------------------------------------------------------------------------
describe('AI_ERRORS', () => {
  it('has NO_PROVIDER message', () => {
    expect(AI_ERRORS.NO_PROVIDER).toBe('AI provider not ready. Go to Settings to configure.')
  })

  it('has PARSE message', () => {
    expect(AI_ERRORS.PARSE).toBe('Received an unexpected response from the AI provider. Please try again.')
  })

  it('has all network error messages', () => {
    expect(AI_ERRORS.NETWORK_COPILOT).toContain('Copilot')
    expect(AI_ERRORS.NETWORK_OPENAI).toContain('OpenAI')
    expect(AI_ERRORS.NETWORK_ANTHROPIC).toContain('Anthropic')
    expect(AI_ERRORS.NETWORK_GEMINI).toContain('Gemini')
  })

  it('NETWORK_OLLAMA is a function that includes the endpoint', () => {
    const msg = AI_ERRORS.NETWORK_OLLAMA('http://custom:1234')
    expect(msg).toContain('http://custom:1234')
    expect(msg).toContain('Ollama')
  })

  it('has all auth error messages', () => {
    expect(AI_ERRORS.AUTH_COPILOT).toContain('Copilot')
    expect(AI_ERRORS.AUTH_OPENAI).toContain('OPENAI_API_KEY')
    expect(AI_ERRORS.AUTH_ANTHROPIC).toContain('ANTHROPIC_API_KEY')
    expect(AI_ERRORS.AUTH_GEMINI).toContain('GOOGLE_API_KEY')
    expect(AI_ERRORS.AUTH_OLLAMA).toContain('Ollama')
  })
})
