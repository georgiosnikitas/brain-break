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
import { clearScreen } from '../utils/screen.js'
import { showProviderSetupScreen } from './provider-setup.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockTestProviderConnection = vi.mocked(testProviderConnection)
const mockWriteSettings = vi.mocked(writeSettings)
const mockClearScreen = vi.mocked(clearScreen)

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
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockClearScreen).toHaveBeenCalledOnce()
  })

  it('displays first-time setup heading', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('First-Time Setup'))
  })

  it('calls select with 5 provider choices in correct order', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
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
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello from OpenAI!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', { ...settings, provider: 'openai' })
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai' })
  })

  it('OpenAI selected + validation failure → warning message + settings still saved', async () => {
    mockSelect.mockResolvedValueOnce('openai' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: false, error: 'API key missing' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('API key missing'))
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'openai' })
  })

  // -------------------------------------------------------------------------
  // Anthropic
  // -------------------------------------------------------------------------
  it('Anthropic selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('anthropic' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockTestProviderConnection).toHaveBeenCalledWith('anthropic', { ...settings, provider: 'anthropic' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'anthropic' })
  })

  // -------------------------------------------------------------------------
  // Gemini
  // -------------------------------------------------------------------------
  it('Gemini selected → validateProvider called with correct args', async () => {
    mockSelect.mockResolvedValueOnce('gemini' as never)
    mockTestProviderConnection.mockResolvedValueOnce({ ok: true, data: 'Hello!' })

    const promise = showProviderSetupScreen(settings)
    await vi.advanceTimersByTimeAsync(2000)
    await promise

    expect(mockTestProviderConnection).toHaveBeenCalledWith('gemini', { ...settings, provider: 'gemini' })
    expect(mockWriteSettings).toHaveBeenCalledWith({ ...settings, provider: 'gemini' })
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
