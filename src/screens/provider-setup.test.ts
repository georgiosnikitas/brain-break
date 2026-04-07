import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultSettings, type SettingsFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', async () => {
  const actual = await vi.importActual<typeof import('@inquirer/prompts')>('@inquirer/prompts')
  return {
    select: vi.fn(),
    input: vi.fn(),
    Separator: actual.Separator,
  }
})

vi.mock('../ai/providers.js', () => ({
  testProviderConnection: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  writeSettings: vi.fn(),
}))

vi.mock('../utils/screen.js', () => ({
  clearScreen: vi.fn(),
  clearAndBanner: vi.fn(),
}))

const mockStart = vi.fn().mockReturnThis()
const mockStop = vi.fn()
vi.mock('ora', () => ({
  default: vi.fn(() => ({ start: mockStart, stop: mockStop })),
}))

vi.mock('../utils/format.js', () => ({
  success: (s: string) => s,
  warn: (s: string) => s,
  menuTheme: {},
}))

import { Separator, select, input } from '@inquirer/prompts'
import { testProviderConnection } from '../ai/providers.js'
import { writeSettings } from '../domain/store.js'
import { clearAndBanner } from '../utils/screen.js'
import { showProviderSetupScreen } from './provider-setup.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockTestProviderConnection = vi.mocked(testProviderConnection)
const mockWriteSettings = vi.mocked(writeSettings)
const mockClearAndBanner = vi.mocked(clearAndBanner)

let settings: SettingsFile
let logSpy: ReturnType<typeof vi.spyOn>

/** Run setup screen and advance fake timers past the success-message delay. */
async function runSetup() {
  const promise = showProviderSetupScreen(settings)
  await vi.advanceTimersByTimeAsync(2000)
  return promise
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  settings = defaultSettings()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  mockWriteSettings.mockResolvedValue({ ok: true, data: undefined })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Screen rendering
// ---------------------------------------------------------------------------
describe('showProviderSetupScreen', () => {
  it('calls clearAndBanner as first operation', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('gpt-5.4-mini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockClearAndBanner).toHaveBeenCalledOnce()
  })

  it('displays first-time setup heading', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('gpt-5.4-mini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('First-Time Setup'))
  })

  it('calls select with 6 provider choices + separator + skip option', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('gpt-5.4-mini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    const choices = mockSelect.mock.calls[0]?.[0]?.choices
    expect(choices).toHaveLength(8)
    expect(choices?.[0]).toEqual({ name: 'OpenAI', value: 'openai' })
    expect(choices?.[1]).toEqual({ name: 'Anthropic', value: 'anthropic' })
    expect(choices?.[2]).toEqual({ name: 'Google Gemini', value: 'gemini' })
    expect(choices?.[3]).toEqual({ name: 'GitHub Copilot', value: 'copilot' })
    expect(choices?.[4]).toEqual({ name: 'Ollama', value: 'ollama' })
    expect(choices?.[5]).toEqual({ name: 'OpenAI Compatible API', value: 'openai-compatible' })
    expect(choices?.[6]).toBeInstanceOf(Separator)
    expect(choices?.[7]).toEqual({ name: '⏭️  Skip — set up later in ⚙️  Settings', value: 'skip' })
    expect(mockSelect.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ pageSize: 8 }))
  })

  // -------------------------------------------------------------------------
  // OpenAI
  // -------------------------------------------------------------------------
  it('OpenAI selected + validation success → success message + settings saved', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('gpt-5.4-mini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello from OpenAI!' })

    await runSetup()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ message: 'OpenAI Model', default: settings.openaiModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', { ...settings, provider: 'openai', openaiModel: 'gpt-5.4-mini' })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai', openaiModel: 'gpt-5.4-mini' })
  })

  it('OpenAI selected + validation failure → retry/skip shown, skip saves provider null', async () => {
    mockSelect
      .mockResolvedValueOnce('openai' as never)
      .mockResolvedValueOnce('gpt-5.4-mini' as never)
      .mockResolvedValueOnce('skip' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'API key missing' })

    const result = await showProviderSetupScreen(settings)

    expect(result).toBe(true)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('API key missing'))
    expect(mockSelect).toHaveBeenCalledTimes(3)
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: null, openaiModel: 'gpt-5.4-mini' })
  })

  // -------------------------------------------------------------------------
  // Anthropic
  // -------------------------------------------------------------------------
  it('Anthropic selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('anthropic' as never)
    mockSelect.mockResolvedValueOnce('claude-haiku-4-5' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ message: 'Anthropic Model', default: settings.anthropicModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('anthropic', { ...settings, provider: 'anthropic', anthropicModel: 'claude-haiku-4-5' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'anthropic', anthropicModel: 'claude-haiku-4-5' })
  })

  // -------------------------------------------------------------------------
  // Gemini
  // -------------------------------------------------------------------------
  it('Gemini selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('gemini' as never)
    mockSelect.mockResolvedValueOnce('gemini-2.5-flash' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ message: 'Google Gemini Model', default: settings.geminiModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('gemini', { ...settings, provider: 'gemini', geminiModel: 'gemini-2.5-flash' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'gemini', geminiModel: 'gemini-2.5-flash' })
  })

  // -------------------------------------------------------------------------
  // Custom model via free text
  // -------------------------------------------------------------------------
  it('OpenAI custom model → prompts for free-text input and saves', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('custom' as never)
    mockInput.mockResolvedValueOnce('o3-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({
      message: 'OpenAI Model Name',
      default: settings.openaiModel,
      validate: expect.any(Function),
    }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', { ...settings, provider: 'openai', openaiModel: 'o3-mini' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai', openaiModel: 'o3-mini' })
  })

  it('Custom model input has validation that rejects empty strings', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('custom' as never)
    mockInput.mockResolvedValueOnce('o3-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    const validateFn = mockInput.mock.calls[0]?.[0]?.validate as (value: string) => boolean | string
    expect(validateFn('gpt-5.4')).toBe(true)
    expect(validateFn('   ')).toBe('Model name cannot be empty')
    expect(validateFn('')).toBe('Model name cannot be empty')
  })

  it('Custom model pre-selects when saved model is not in predefined list', async () => {
    settings = { ...settings, openaiModel: 'o3-mini' }
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('custom' as never)
    mockInput.mockResolvedValueOnce('o3-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    const modelSelectCall = mockSelect.mock.calls[1]?.[0]
    expect(modelSelectCall?.default).toBe('custom')
    const customChoice = (modelSelectCall?.choices as Array<{ value?: string; description?: string }>)?.find(c => c?.value === 'custom')
    expect(customChoice?.description).toBe('Current: o3-mini')
  })

  // -------------------------------------------------------------------------
  // Copilot
  // -------------------------------------------------------------------------
  it('Copilot selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('copilot' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockTestProviderConnection).toHaveBeenCalledWith('copilot', { ...settings, provider: 'copilot' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'copilot' })
  })

  // -------------------------------------------------------------------------
  // Ollama
  // -------------------------------------------------------------------------
  it('Ollama selected → prompts for endpoint and model, validates with updated settings', async () => {
    mockSelect.mockResolvedValueOnce('ollama' as never)
    mockInput
      .mockResolvedValueOnce('http://my-server:11434')
      .mockResolvedValueOnce('mistral')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockInput).toHaveBeenCalledTimes(2)
    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({ default: settings.ollamaEndpoint }),
    )
    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({ default: settings.ollamaModel }),
    )

    const expectedSettings = {
      ...settings,
      provider: 'ollama' as const,
      ollamaEndpoint: 'http://my-server:11434',
      ollamaModel: 'mistral',
    }
    expect(mockTestProviderConnection).toHaveBeenCalledWith('ollama', expectedSettings)
    expect(mockWriteSettings).toHaveBeenCalledWith(expectedSettings)
  })

  it('OpenAI Compatible API selected → prompts for endpoint and model, validates with updated settings', async () => {
    mockSelect.mockResolvedValueOnce('openai-compatible' as never)
    mockInput
      .mockResolvedValueOnce('https://api.example.com/v1')
      .mockResolvedValueOnce('my-model')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Endpoint URL', default: 'https://api.x.ai/v1', validate: expect.any(Function) }),
    )
    expect(mockInput).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Model Name', default: 'grok-4-1-fast-reasoning', validate: expect.any(Function) }),
    )

    const expectedSettings = {
      ...settings,
      provider: 'openai-compatible' as const,
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    }
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai-compatible', expectedSettings)
    expect(mockWriteSettings).toHaveBeenCalledWith(expectedSettings)
  })

  it('Ollama empty model input resets to the default model', async () => {
    settings = { ...settings, ollamaModel: 'mistral' }
    mockSelect.mockResolvedValueOnce('ollama' as never)
    mockInput
      .mockResolvedValueOnce('http://localhost:11434')
      .mockResolvedValueOnce('')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    await runSetup()

    expect(mockTestProviderConnection).toHaveBeenCalledWith('ollama', {
      ...settings,
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
    })
    expect(mockWriteSettings).toHaveBeenCalledWith({
      ...settings,
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
    })
  })

  it('Ollama validation failure → retry/skip shown, skip saves provider null', async () => {
    mockSelect
      .mockResolvedValueOnce('ollama' as never)
      .mockResolvedValueOnce('skip' as never)
    mockInput
      .mockResolvedValueOnce('http://localhost:11434')
      .mockResolvedValueOnce('llama3.3')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'Could not reach Ollama' })

    await showProviderSetupScreen(settings)

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Could not reach Ollama'))
    expect(mockWriteSettings).toHaveBeenCalledWith(
      expect.objectContaining({ provider: null, ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3.3' }),
    )
  })

  // -------------------------------------------------------------------------
  // Skip from provider list
  // -------------------------------------------------------------------------
  it('Skip from provider list → saves provider null, no connection test', async () => {
    mockSelect.mockResolvedValueOnce('skip' as never)

    const result = await showProviderSetupScreen(settings)

    expect(result).toBe(true)
    expect(mockTestProviderConnection).not.toHaveBeenCalled()
    expect(mockInput).not.toHaveBeenCalled()
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings })
    expect(mockWriteSettings.mock.calls[0]?.[0]).toMatchObject({ provider: null })
  })

  // -------------------------------------------------------------------------
  // Retry on failure then success
  // -------------------------------------------------------------------------
  it('Retry on failure → returns to provider selection, success saves provider', async () => {
    mockSelect
      .mockResolvedValueOnce('openai' as never)   // 1st: provider select
      .mockResolvedValueOnce('gpt-5.4-mini' as never) // 2nd: model select
      .mockResolvedValueOnce('retry' as never)     // 3rd: retry/skip
      .mockResolvedValueOnce('openai' as never)    // 4th: provider select again
      .mockResolvedValueOnce('gpt-5.4-mini' as never) // 5th: model select again
    mockTestProviderConnection
      .mockResolvedValueOnce({ ok: false, error: 'API key missing' })
      .mockResolvedValueOnce({ ok: true, data: 'Hello from OpenAI!' })

    const result = await runSetup()

    expect(result).toBe(false)
    expect(mockClearAndBanner).toHaveBeenCalledTimes(2)
    expect(mockTestProviderConnection).toHaveBeenCalledTimes(2)
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai', openaiModel: 'gpt-5.4-mini' })
  })

  // -------------------------------------------------------------------------
  // Retry on failure then skip
  // -------------------------------------------------------------------------
  it('Retry on failure then skip → saves provider null', async () => {
    mockSelect
      .mockResolvedValueOnce('openai' as never)   // 1st: provider select
      .mockResolvedValueOnce('gpt-5.4-mini' as never) // 2nd: model select
      .mockResolvedValueOnce('retry' as never)     // 3rd: retry/skip
      .mockResolvedValueOnce('openai' as never)    // 4th: provider select again
      .mockResolvedValueOnce('gpt-5.4-mini' as never) // 5th: model select again
      .mockResolvedValueOnce('skip' as never)      // 6th: retry/skip again
    mockTestProviderConnection
      .mockResolvedValueOnce({ ok: false, error: 'API key missing' })
      .mockResolvedValueOnce({ ok: false, error: 'Still missing' })

    const result = await showProviderSetupScreen(settings)

    expect(result).toBe(true)
    expect(mockClearAndBanner).toHaveBeenCalledTimes(2)
    expect(mockTestProviderConnection).toHaveBeenCalledTimes(2)
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: null, openaiModel: 'gpt-5.4-mini' })
  })

  // -------------------------------------------------------------------------
  // ExitPromptError during retry/skip select
  // -------------------------------------------------------------------------
  it('ExitPromptError during retry/skip select → no writeSettings, returns cleanly', async () => {
    mockSelect
      .mockResolvedValueOnce('openai' as never)
      .mockResolvedValueOnce('gpt-5.4-mini' as never)
      .mockRejectedValueOnce(new ExitPromptError())
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'API key missing' })

    const result = await showProviderSetupScreen(settings)

    expect(result).toBe(false)
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // writeSettings error path
  // -------------------------------------------------------------------------
  it('logs console.error when writeSettings fails', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockSelect.mockResolvedValueOnce('gpt-5.4-mini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })
    mockWriteSettings.mockResolvedValueOnce({ ok: false, error: 'disk full' })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await runSetup()

    expect(errorSpy).toHaveBeenCalledWith('Failed to save settings: disk full')
  })

  // -------------------------------------------------------------------------
  // ExitPromptError (Ctrl+C)
  // -------------------------------------------------------------------------
  it('ExitPromptError during select → no writeSettings, returns cleanly', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    const result = await showProviderSetupScreen(settings)

    expect(result).toBe(false)
    expect(mockWriteSettings).not.toHaveBeenCalled()
  })
})
