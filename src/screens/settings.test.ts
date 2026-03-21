import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { showSettingsScreen, getProviderLabel } from './settings.js'

vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

const mockStart = vi.fn().mockReturnThis()
const mockStop = vi.fn()
vi.mock('ora', () => ({
  default: vi.fn(() => ({ start: mockStart, stop: mockStop })),
}))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  Separator: vi.fn(),
}))
vi.mock('../ai/providers.js', () => ({
  testProviderConnection: vi.fn(),
}))
vi.mock('../domain/store.js', () => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}))
vi.mock('../router.js', () => ({
  showHome: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))
vi.mock('../utils/format.js', () => ({
  menuTheme: { style: { highlight: (t: string) => t } },
  success: (t: string) => `[success]${t}`,
  warn: (t: string) => `[warn]${t}`,
}))

import { select, input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { testProviderConnection } from '../ai/providers.js'
import { readSettings, writeSettings } from '../domain/store.js'
import * as router from '../router.js'
import { clearScreen } from '../utils/screen.js'
import { defaultSettings } from '../domain/schema.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteSettings = vi.mocked(writeSettings)
const mockTestProviderConnection = vi.mocked(testProviderConnection)

let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  mockWriteSettings.mockResolvedValue({ ok: true, data: undefined })
  mockTestProviderConnection.mockResolvedValue({ ok: true, data: 'Hello! I am working.' })
  vi.mocked(router.showHome).mockResolvedValue(undefined)
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  logSpy.mockRestore()
})

describe('showSettingsScreen', () => {
  it('calls clearScreen on entry', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(clearScreen).toHaveBeenCalledOnce()
  })

  it('calls readSettings() to load current values', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockReadSettings).toHaveBeenCalledOnce()
  })

  it('passes current language as default to input prompt', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), language: 'Greek', tone: 'pirate' } })
    mockSelect.mockResolvedValueOnce('language').mockResolvedValueOnce('back')
    mockInput.mockResolvedValue('Greek')

    await showSettingsScreen()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ default: 'Greek' }))
  })

  it('passes current tone as default to tone select prompt', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), language: 'English', tone: 'expressive' } })
    mockSelect.mockResolvedValueOnce('tone').mockResolvedValueOnce('expressive').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ default: 'expressive' }))
  })

  it('Save path: calls writeSettings with user inputs and then router.showHome()', async () => {
    // Select language → type Spanish, select tone → pick robot, then save
    mockSelect.mockResolvedValueOnce('language').mockResolvedValueOnce('tone').mockResolvedValueOnce('robot').mockResolvedValueOnce('save')
    mockInput.mockResolvedValue('Spanish')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith({ ...defaultSettings(), language: 'Spanish', tone: 'robot' })
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('Save path: logs error and still navigates home when writeSettings fails', async () => {
    mockSelect.mockResolvedValueOnce('save')
    mockWriteSettings.mockResolvedValue({ ok: false, error: 'disk full' })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await showSettingsScreen()

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('disk full'))
    expect(router.showHome).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })

  it('Back path: does NOT call writeSettings and calls router.showHome()', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('ExitPromptError from main menu is handled gracefully and calls router.showHome()', async () => {
    mockSelect.mockRejectedValue(new ExitPromptError())

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('ExitPromptError during language input is handled gracefully', async () => {
    mockSelect.mockResolvedValueOnce('language')
    mockInput.mockRejectedValue(new ExitPromptError())

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('ExitPromptError during tone select is handled gracefully', async () => {
    mockSelect.mockResolvedValueOnce('tone').mockRejectedValue(new ExitPromptError())

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('falls back to defaults when readSettings fails', async () => {
    mockReadSettings.mockResolvedValue({ ok: false, error: 'read error' })
    mockSelect.mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(defaultSettings())
  })

  it('re-throws non-ExitPromptError from settings select', async () => {
    const boom = new Error('unexpected settings select failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showSettingsScreen()).rejects.toThrow('unexpected settings select failure')
  })

  it('AI Provider is the first choice in the settings menu', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0]![0] as { choices: Array<{ name: string; value: string }> }
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('AI Provider'), value: 'provider' })
    )
  })

  it('shows "Not set" label when provider is null', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0]![0] as { choices: Array<{ name: string; value: string }> }
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('Not set') })
    )
  })

  it('shows current provider name when provider is set', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), provider: 'openai' } })
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0]![0] as { choices: Array<{ name: string; value: string }> }
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('OpenAI') })
    )
  })

  it('selecting provider opens provider selector and calls validateProvider', async () => {
    // Main menu → provider, provider selector → openai, then back
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', expect.objectContaining({ provider: 'openai' }))
  })

  it('provider validation success displays LLM greeting', async () => {
    mockTestProviderConnection.mockResolvedValue({ ok: true, data: 'Hello from OpenAI!' })
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('OpenAI'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
  })

  it('provider validation failure displays warning message (non-blocking)', async () => {
    mockTestProviderConnection.mockResolvedValue({ ok: false, error: 'API key missing' })
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('anthropic').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('API key missing'))
  })

  it('selecting Ollama prompts for endpoint and model', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('ollama').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('http://custom:11434').mockResolvedValueOnce('mistral')

    await showSettingsScreen()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Ollama Endpoint URL' }))
    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Ollama Model Name' }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('ollama', expect.objectContaining({
      provider: 'ollama',
      ollamaEndpoint: 'http://custom:11434',
      ollamaModel: 'mistral',
    }))
  })

  it('Ollama empty input falls back to existing values', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('ollama').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('  ').mockResolvedValueOnce('')

    await showSettingsScreen()

    expect(mockTestProviderConnection).toHaveBeenCalledWith('ollama', expect.objectContaining({
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    }))
  })

  it('Save after provider change persists provider fields', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('anthropic').mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'anthropic',
      language: 'English',
      tone: 'natural',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    }))
  })

  it('Back after provider change does NOT call writeSettings', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })

  it('ExitPromptError during provider select does not save', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockRejectedValueOnce(new ExitPromptError())

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(router.showHome).toHaveBeenCalledOnce()
  })
})

describe('getProviderLabel', () => {
  it('returns "Not set" when provider is null', () => {
    expect(getProviderLabel(null)).toBe('Not set')
  })

  it('maps every provider value to its display name', () => {
    expect(getProviderLabel('copilot')).toBe('GitHub Copilot')
    expect(getProviderLabel('openai')).toBe('OpenAI')
    expect(getProviderLabel('anthropic')).toBe('Anthropic')
    expect(getProviderLabel('gemini')).toBe('Google Gemini')
    expect(getProviderLabel('ollama')).toBe('Ollama')
  })
})
