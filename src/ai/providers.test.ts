import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { CopilotClient } from '@github/copilot-sdk'
import { createProvider, validateProvider, testProviderConnection, classifyProviderError, AI_ERRORS, _setCopilotClient } from './providers.js'
import type { AiProvider } from './providers.js'
import { makeSettings } from '../__test-helpers__/factories.js'

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
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => (...args: unknown[]) => mockGoogle(...args),
}))

const mockOpenAICompatibleProvider = vi.fn()
vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: () => (...args: unknown[]) => mockOpenAICompatibleProvider(...args),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
  mockOpenAICompatibleProvider.mockReset()
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
  mockOpenAICompatibleProvider.mockReturnValue('openai-compatible-model')

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

  it('returns ok:true with an AiProvider for openai-compatible', () => {
    const result = createProvider(makeSettings({ provider: 'openai-compatible' }))

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

  it('calls generateText with configured openai model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'response text' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('response text')
    expect(mockOpenai).toHaveBeenCalledWith('gpt-5.4')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'openai-model',
      prompt: 'test prompt',
    })
  })

  it('uses a custom OpenAI model from settings', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'response text' })
    const result = createProvider(makeSettings({ provider: 'openai', openaiModel: 'gpt-5.4-mini' }))
    if (!result.ok) throw new Error('expected ok')

    await result.data.generateCompletion('test prompt')

    expect(mockOpenai).toHaveBeenCalledWith('gpt-5.4-mini')
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

  it('calls generateText with configured anthropic model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'anthropic response' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('anthropic response')
    expect(mockAnthropic).toHaveBeenCalledWith('claude-opus-4-6')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'anthropic-model',
      prompt: 'test prompt',
    })
  })

  it('uses a custom Anthropic model from settings', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'anthropic response' })
    const result = createProvider(makeSettings({ provider: 'anthropic', anthropicModel: 'claude-3-5-haiku-latest' }))
    if (!result.ok) throw new Error('expected ok')

    await result.data.generateCompletion('test prompt')

    expect(mockAnthropic).toHaveBeenCalledWith('claude-3-5-haiku-latest')
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

  it('calls generateText with configured google model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'gemini response' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('gemini response')
    expect(mockGoogle).toHaveBeenCalledWith('gemini-2.5-pro')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'google-model',
      prompt: 'test prompt',
    })
  })

  it('uses a custom Gemini model from settings', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'gemini response' })
    const result = createProvider(makeSettings({ provider: 'gemini', geminiModel: 'gemini-2.5-flash' }))
    if (!result.ok) throw new Error('expected ok')

    await result.data.generateCompletion('test prompt')

    expect(mockGoogle).toHaveBeenCalledWith('gemini-2.5-flash')
  })
})

// ---------------------------------------------------------------------------
// Ollama adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('Ollama adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the Ollama generate API with custom endpoint and model', async () => {
    const settings = makeSettings({ provider: 'ollama', ollamaEndpoint: 'https://myhost:11434', ollamaModel: 'mistral' })
    const result = createProvider(settings)
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ response: 'ollama response' }),
    }))

    const text = await result.data.generateCompletion('test prompt')

    expect(text).toBe('ollama response')
    expect(fetch).toHaveBeenCalledWith('https://myhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: 'test prompt',
        stream: false,
      }),
    })
  })

  it('uses default ollama settings from makeSettings', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ response: 'ok' }),
    }))

    await result.data.generateCompletion('prompt')

    expect(fetch).toHaveBeenCalledWith('http://localhost:11434/api/generate', expect.objectContaining({
      body: JSON.stringify({ model: 'llama3.2', prompt: 'prompt', stream: false }),
    }))
  })

  it('throws the Ollama API error message when the request fails', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValueOnce({ error: 'model not found' }),
      text: vi.fn().mockResolvedValueOnce('model not found'),
    }))

    await expect(result.data.generateCompletion('prompt')).rejects.toThrow('model not found')
  })

  it('normalizes trailing slashes in the Ollama endpoint URL', async () => {
    const settings = makeSettings({ provider: 'ollama', ollamaEndpoint: 'http://myhost:11434//', ollamaModel: 'llama3' })
    const result = createProvider(settings)
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValueOnce({ response: 'ok' }),
    }))

    await result.data.generateCompletion('prompt')

    expect(fetch).toHaveBeenCalledWith('http://myhost:11434/api/generate', expect.anything())
  })

  it('throws when the Ollama error body contains an object with a message property', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValueOnce({ error: { message: 'model load failed' } }),
      text: vi.fn().mockResolvedValueOnce(''),
    }))

    await expect(result.data.generateCompletion('prompt')).rejects.toThrow('model load failed')
  })

  it('falls back to response text when Ollama returns a non-JSON error body', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValueOnce(new SyntaxError('invalid json')),
      text: vi.fn().mockResolvedValueOnce('Internal server error'),
    }))

    await expect(result.data.generateCompletion('prompt')).rejects.toThrow('Internal server error')
  })

  it('falls back to status line when the Ollama error body text is empty', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: vi.fn().mockRejectedValueOnce(new SyntaxError('invalid json')),
      text: vi.fn().mockResolvedValueOnce('   '),
    }))

    await expect(result.data.generateCompletion('prompt')).rejects.toThrow('Ollama request failed with status 503')
  })

  it('falls back to status line when both JSON and text() reading fail', async () => {
    const result = createProvider(makeSettings({ provider: 'ollama' }))
    if (!result.ok) throw new Error('expected ok')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValueOnce(new SyntaxError('invalid json')),
      text: vi.fn().mockRejectedValueOnce(new Error('read failed')),
    }))

    await expect(result.data.generateCompletion('prompt')).rejects.toThrow('Ollama request failed with status 500')
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
// OpenAI Compatible adapter — generateCompletion
// ---------------------------------------------------------------------------
describe('OpenAI Compatible adapter', () => {
  let provider: AiProvider

  beforeEach(() => {
    const result = createProvider(makeSettings({ provider: 'openai-compatible', openaiCompatibleEndpoint: 'https://api.example.com/v1', openaiCompatibleModel: 'my-model' }))
    if (!result.ok) throw new Error('expected ok')
    provider = result.data
  })

  it('calls generateText with configured model and prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: 'compatible response' })

    const text = await provider.generateCompletion('test prompt')

    expect(text).toBe('compatible response')
    expect(mockOpenAICompatibleProvider).toHaveBeenCalledWith('my-model')
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: 'openai-compatible-model',
      prompt: 'test prompt',
    })
  })

  it('propagates errors from generateText', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('API error'))

    await expect(provider.generateCompletion('test')).rejects.toThrow('API error')
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
    it('returns ok:true when GOOGLE_GENERATIVE_AI_API_KEY is set', async () => {
      process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'gk-test' }

      const result = await validateProvider('gemini', makeSettings())
      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns AUTH_GEMINI error when GOOGLE_GENERATIVE_AI_API_KEY is missing', async () => {
      process.env = { ...originalEnv }
      delete process.env['GOOGLE_GENERATIVE_AI_API_KEY']

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

  describe('openai-compatible', () => {
    it('returns ok:true when OPENAI_COMPATIBLE_API_KEY is set', async () => {
      process.env = { ...originalEnv, OPENAI_COMPATIBLE_API_KEY: 'sk-compat-test' }
      const result = await validateProvider('openai-compatible', makeSettings())
      expect(result).toEqual({ ok: true, data: undefined })
    })

    it('returns AUTH_OPENAI_COMPATIBLE error when OPENAI_COMPATIBLE_API_KEY is missing', async () => {
      process.env = { ...originalEnv }
      delete process.env['OPENAI_COMPATIBLE_API_KEY']
      const result = await validateProvider('openai-compatible', makeSettings())
      expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OPENAI_COMPATIBLE })
    })
  })
})

// ---------------------------------------------------------------------------
// classifyProviderError
// ---------------------------------------------------------------------------
describe('classifyProviderError', () => {
  it('returns QUOTA for 429 error', () => {
    expect(classifyProviderError(new Error('429 Too Many Requests'), 'openai')).toBe(AI_ERRORS.QUOTA)
  })

  it('returns QUOTA for rate limit error', () => {
    expect(classifyProviderError(new Error('rate limit exceeded'), 'anthropic')).toBe(AI_ERRORS.QUOTA)
  })

  it('returns QUOTA for quota exceeded error', () => {
    expect(classifyProviderError(new Error('You exceeded your current quota'), 'gemini')).toBe(AI_ERRORS.QUOTA)
  })

  it('returns provider-specific AUTH for 401 error', () => {
    expect(classifyProviderError(new Error('401 Unauthorized'), 'openai')).toBe(AI_ERRORS.AUTH_OPENAI)
  })

  it('returns provider-specific AUTH for 403 error', () => {
    expect(classifyProviderError(new Error('403 Forbidden'), 'gemini')).toBe(AI_ERRORS.AUTH_GEMINI)
  })

  it('returns provider-specific AUTH for invalid key error', () => {
    expect(classifyProviderError(new Error('invalid api key'), 'anthropic')).toBe(AI_ERRORS.AUTH_ANTHROPIC)
  })

  it('returns provider-specific NETWORK for generic error', () => {
    expect(classifyProviderError(new Error('Connection refused'), 'copilot')).toBe(AI_ERRORS.NETWORK_COPILOT)
  })

  it('returns NETWORK_OLLAMA with custom endpoint', () => {
    expect(classifyProviderError(new Error('ECONNREFUSED'), 'ollama', 'http://myhost:11434')).toBe(AI_ERRORS.NETWORK_OLLAMA('http://myhost:11434'))
  })

  it('returns AUTH_OPENAI_COMPATIBLE for 401 error with openai-compatible provider', () => {
    expect(classifyProviderError(new Error('401 Unauthorized'), 'openai-compatible')).toBe(AI_ERRORS.AUTH_OPENAI_COMPATIBLE)
  })

  it('returns NETWORK_OPENAI_COMPATIBLE with correct endpoint for generic error', () => {
    expect(classifyProviderError(new Error('ECONNREFUSED'), 'openai-compatible', 'https://api.example.com/v1')).toBe(AI_ERRORS.NETWORK_OPENAI_COMPATIBLE('https://api.example.com/v1'))
  })

  it('returns NO_PROVIDER when providerType is null', () => {
    expect(classifyProviderError(new Error('something'), null)).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns NO_PROVIDER for auth error when providerType is null', () => {
    expect(classifyProviderError(new Error('401 Unauthorized'), null)).toBe(AI_ERRORS.NO_PROVIDER)
  })

  it('returns NETWORK for non-Error values', () => {
    expect(classifyProviderError('string error', 'openai')).toBe(AI_ERRORS.NETWORK_OPENAI)
  })
})

// ---------------------------------------------------------------------------
// testProviderConnection
// ---------------------------------------------------------------------------
describe('testProviderConnection', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    vi.unstubAllGlobals()
  })

  it('returns validation error when validateProvider fails (e.g. missing API key)', async () => {
    process.env = { ...originalEnv }
    delete process.env['OPENAI_API_KEY']

    const result = await testProviderConnection('openai', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OPENAI })
  })

  it('returns ok:true with response text when test API call succeeds for openai', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test' }
    mockGenerateText.mockResolvedValueOnce({ text: 'Hello! I am working.' })

    const result = await testProviderConnection('openai', makeSettings())

    expect(result).toEqual({ ok: true, data: 'Hello! I am working.' })
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Say a short, one-sentence greeting to confirm you are working.' }),
    )
  })

  it('returns ok:true with response text when test API call succeeds for anthropic', async () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'sk-ant-test' }
    mockGenerateText.mockResolvedValueOnce({ text: 'Greetings!' })

    const result = await testProviderConnection('anthropic', makeSettings())

    expect(result).toEqual({ ok: true, data: 'Greetings!' })
    expect(mockGenerateText).toHaveBeenCalled()
  })

  it('returns ok:true with response text when test API call succeeds for gemini', async () => {
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'gk-test' }
    mockGenerateText.mockResolvedValueOnce({ text: 'Hi there!' })

    const result = await testProviderConnection('gemini', makeSettings())

    expect(result).toEqual({ ok: true, data: 'Hi there!' })
    expect(mockGenerateText).toHaveBeenCalled()
  })

  it('returns ok:true with response text when test API call succeeds for ollama', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ response: 'Ready!' }),
      }))

    const result = await testProviderConnection('ollama', makeSettings({ ollamaEndpoint: 'http://localhost:11434' }))

    expect(result).toEqual({ ok: true, data: 'Ready!' })
    expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:11434/api/tags')
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:11434/api/generate', expect.any(Object))
  })

  it('returns ok:true with response text when test API call succeeds for copilot', async () => {
    _setCopilotClient(makeFakeCopilotClient())
    mockSendAndWait.mockResolvedValueOnce({ data: { content: 'Hello!' } })

    const result = await testProviderConnection('copilot', makeSettings())

    expect(result).toEqual({ ok: true, data: 'Hello!' })
    _setCopilotClient(null)
  })

  it('returns ok:true with response text when test API call succeeds for openai-compatible', async () => {
    process.env = { ...originalEnv, OPENAI_COMPATIBLE_API_KEY: 'sk-compat-test' }
    mockGenerateText.mockResolvedValueOnce({ text: 'Hello from compatible!' })

    const settings = makeSettings({
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    })
    const result = await testProviderConnection('openai-compatible', settings)

    expect(result).toEqual({ ok: true, data: 'Hello from compatible!' })
    expect(mockOpenAICompatibleProvider).toHaveBeenCalledWith('my-model')
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'Say a short, one-sentence greeting to confirm you are working.' }),
    )
  })

  it('returns NETWORK_OPENAI error when test call throws for openai', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('connection refused'))

    const result = await testProviderConnection('openai', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_OPENAI })
  })

  it('returns NETWORK_ANTHROPIC error when test call throws for anthropic', async () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'sk-ant-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('timeout'))

    const result = await testProviderConnection('anthropic', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_ANTHROPIC })
  })

  it('returns NETWORK_GEMINI error when test call throws for gemini', async () => {
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'gk-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('service unavailable'))

    const result = await testProviderConnection('gemini', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_GEMINI })
  })

  it('returns NETWORK_OLLAMA error with endpoint when test call throws for ollama', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('connection refused')))

    const settings = makeSettings({ ollamaEndpoint: 'https://custom:11434' })
    const result = await testProviderConnection('ollama', settings)

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_OLLAMA('https://custom:11434') })
  })

  it('returns NETWORK_COPILOT error when test call throws for copilot', async () => {
    _setCopilotClient(makeFakeCopilotClient())
    mockSendAndWait.mockRejectedValueOnce(new Error('network error'))

    const result = await testProviderConnection('copilot', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_COPILOT })
    _setCopilotClient(null)
  })

  it('returns NETWORK_OPENAI_COMPATIBLE error with endpoint when test call throws for openai-compatible', async () => {
    process.env = { ...originalEnv, OPENAI_COMPATIBLE_API_KEY: 'sk-compat-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('connection refused'))

    const settings = makeSettings({
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    })
    const result = await testProviderConnection('openai-compatible', settings)

    expect(result).toEqual({ ok: false, error: AI_ERRORS.NETWORK_OPENAI_COMPATIBLE('https://api.example.com/v1') })
  })

  it('returns AUTH_GEMINI error when test call throws with 403 message', async () => {
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'gk-invalid' }
    mockGenerateText.mockRejectedValueOnce(new Error('403 Forbidden: API key not valid'))

    const result = await testProviderConnection('gemini', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_GEMINI })
  })

  it('returns AUTH_OPENAI error when test call throws with 401 message', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-invalid' }
    mockGenerateText.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const result = await testProviderConnection('openai', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OPENAI })
  })

  it('returns AUTH_ANTHROPIC error when test call throws with invalid key message', async () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'sk-ant-invalid' }
    mockGenerateText.mockRejectedValueOnce(new Error('invalid api key'))

    const result = await testProviderConnection('anthropic', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_ANTHROPIC })
  })

  it('returns AUTH_OPENAI_COMPATIBLE error when test call throws with 401 message', async () => {
    process.env = { ...originalEnv, OPENAI_COMPATIBLE_API_KEY: 'sk-compat-invalid' }
    mockGenerateText.mockRejectedValueOnce(new Error('401 Unauthorized'))

    const settings = makeSettings({
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    })
    const result = await testProviderConnection('openai-compatible', settings)

    expect(result).toEqual({ ok: false, error: AI_ERRORS.AUTH_OPENAI_COMPATIBLE })
  })

  it('returns QUOTA error when test call throws with quota exceeded message', async () => {
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'gk-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('You exceeded your current quota, please check your plan and billing details.'))

    const result = await testProviderConnection('gemini', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.QUOTA })
  })

  it('returns QUOTA error when test call throws with 429 status', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'sk-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('429 Too Many Requests'))

    const result = await testProviderConnection('openai', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.QUOTA })
  })

  it('returns QUOTA error when test call throws with rate limit message', async () => {
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'sk-ant-test' }
    mockGenerateText.mockRejectedValueOnce(new Error('rate limit exceeded'))

    const result = await testProviderConnection('anthropic', makeSettings())

    expect(result).toEqual({ ok: false, error: AI_ERRORS.QUOTA })
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

  it('has DUPLICATE message', () => {
    expect(AI_ERRORS.DUPLICATE).toBe('Could not generate a unique question. Please try again.')
  })

  it('has all network error messages', () => {
    expect(AI_ERRORS.NETWORK_COPILOT).toContain('Copilot')
    expect(AI_ERRORS.NETWORK_OPENAI).toContain('OpenAI')
    expect(AI_ERRORS.NETWORK_ANTHROPIC).toContain('Anthropic')
    expect(AI_ERRORS.NETWORK_GEMINI).toContain('Gemini')
  })

  it('NETWORK_OLLAMA is a function that includes the endpoint', () => {
    const msg = AI_ERRORS.NETWORK_OLLAMA('https://custom:1234')
    expect(msg).toContain('https://custom:1234')
    expect(msg).toContain('Ollama')
  })

  it('NETWORK_OPENAI_COMPATIBLE is a function that includes the endpoint', () => {
    const msg = AI_ERRORS.NETWORK_OPENAI_COMPATIBLE('https://api.example.com/v1')
    expect(msg).toContain('https://api.example.com/v1')
    expect(msg).toContain('OpenAI Compatible')
  })

  it('has all auth error messages', () => {
    expect(AI_ERRORS.AUTH_COPILOT).toContain('Copilot')
    expect(AI_ERRORS.AUTH_OPENAI).toContain('OPENAI_API_KEY')
    expect(AI_ERRORS.AUTH_ANTHROPIC).toContain('ANTHROPIC_API_KEY')
    expect(AI_ERRORS.AUTH_GEMINI).toContain('GOOGLE_GENERATIVE_AI_API_KEY')
    expect(AI_ERRORS.AUTH_OLLAMA).toContain('Ollama')
    expect(AI_ERRORS.AUTH_OPENAI_COMPATIBLE).toContain('OPENAI_COMPATIBLE_API_KEY')
  })
})
