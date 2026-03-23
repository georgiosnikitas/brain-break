import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultSettings, type SettingsFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
}))

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

import { select, input } from '@inquirer/prompts'
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
  it('calls clearScreen as first operation', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4o-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockClearAndBanner).toHaveBeenCalledOnce()
  })

  it('displays first-time setup heading', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4o-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('First-Time Setup'))
  })

  it('calls select with 5 provider choices in correct order', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4o-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [
          { name: 'GitHub Copilot', value: 'copilot' },
          { name: 'OpenAI', value: 'openai' },
          { name: 'Anthropic', value: 'anthropic' },
          { name: 'Google Gemini', value: 'gemini' },
          { name: 'Ollama', value: 'ollama' },
        ],
      }),
    )
  })

  // -------------------------------------------------------------------------
  // OpenAI
  // -------------------------------------------------------------------------
  it('OpenAI selected + validation success → success message + settings saved', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4.1-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello from OpenAI!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'OpenAI Model Name', default: settings.openaiModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', { ...settings, provider: 'openai', openaiModel: 'gpt-4.1-mini' })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai', openaiModel: 'gpt-4.1-mini' })
  })

  it('OpenAI selected + validation failure → warning message + settings still saved', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4o-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'API key missing' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('API key missing'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai' })
  })

  it('OpenAI empty input resets to the default model', async () => {
    settings = { ...settings, openaiModel: 'gpt-4.1-mini' }
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', { ...settings, provider: 'openai', openaiModel: 'gpt-4o-mini' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai', openaiModel: 'gpt-4o-mini' })
  })

  // -------------------------------------------------------------------------
  // Anthropic
  // -------------------------------------------------------------------------
  it('Anthropic selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('anthropic' as never)
    mockInput.mockResolvedValueOnce('claude-3-5-haiku-latest')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Anthropic Model Name', default: settings.anthropicModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('anthropic', { ...settings, provider: 'anthropic', anthropicModel: 'claude-3-5-haiku-latest' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'anthropic', anthropicModel: 'claude-3-5-haiku-latest' })
  })

  // -------------------------------------------------------------------------
  // Gemini
  // -------------------------------------------------------------------------
  it('Gemini selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('gemini' as never)
    mockInput.mockResolvedValueOnce('gemini-2.5-flash')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Google Gemini Model Name', default: settings.geminiModel }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('gemini', { ...settings, provider: 'gemini', geminiModel: 'gemini-2.5-flash' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'gemini', geminiModel: 'gemini-2.5-flash' })
  })

  // -------------------------------------------------------------------------
  // Copilot
  // -------------------------------------------------------------------------
  it('Copilot selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('copilot' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

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

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

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

  it('Ollama empty model input resets to the default model', async () => {
    settings = { ...settings, ollamaModel: 'mistral' }
    mockSelect.mockResolvedValueOnce('ollama' as never)
    mockInput
      .mockResolvedValueOnce('http://localhost:11434')
      .mockResolvedValueOnce('')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockTestProviderConnection).toHaveBeenCalledWith('ollama', {
      ...settings,
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(mockWriteSettings).toHaveBeenCalledWith({
      ...settings,
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
  })

  it('Ollama validation failure → warning message + settings still saved', async () => {
    mockSelect.mockResolvedValueOnce('ollama' as never)
    mockInput
      .mockResolvedValueOnce('http://localhost:11434')
      .mockResolvedValueOnce('llama3')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'Could not reach Ollama' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Could not reach Ollama'))
    expect(mockWriteSettings).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'ollama' }),
    )
  })

  // -------------------------------------------------------------------------
  // writeSettings error path
  // -------------------------------------------------------------------------
  it('logs console.error when writeSettings fails', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockInput.mockResolvedValueOnce('gpt-4o-mini')
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })
    mockWriteSettings.mockResolvedValueOnce({ ok: false, error: 'disk full' })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(errorSpy).toHaveBeenCalledWith('Failed to save settings: disk full')
  })

  // -------------------------------------------------------------------------
  // ExitPromptError (Ctrl+C)
  // -------------------------------------------------------------------------
  it('ExitPromptError during select → no writeSettings, returns cleanly', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await showProviderSetupScreen(settings)

    expect(mockWriteSettings).not.toHaveBeenCalled()
  })
})
