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
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))
vi.mock('../utils/format.js', () => ({
  menuTheme: { style: { highlight: (t: string) => t } },
  success: (t: string) => `[success]${t}`,
  warn: (t: string) => `[warn]${t}`,
  header: (t: string) => `[header]${t}`,
  setTheme: vi.fn(),
}))

import { select, input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { testProviderConnection } from '../ai/providers.js'
import { readSettings, writeSettings } from '../domain/store.js'
import * as router from '../router.js'
import { clearAndBanner } from '../utils/screen.js'
import { setTheme } from '../utils/format.js'
import { defaultSettings } from '../domain/schema.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteSettings = vi.mocked(writeSettings)
const mockTestProviderConnection = vi.mocked(testProviderConnection)
const mockSetTheme = vi.mocked(setTheme)

type SettingsChoice = { name?: string; value?: string | number }

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
  it('calls clearAndBanner on entry', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(clearAndBanner).toHaveBeenCalledOnce()
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

    const firstCallArgs = mockSelect.mock.calls[0][0]
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('AI Provider'), value: 'provider' })
    )
  })

  it('uses a taller page size on the main settings menu', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ pageSize: 10 }))
  })

  it('shows "Not set" label when provider is null', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('Not set') })
    )
  })

  it('shows current provider name when provider is set', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), provider: 'openai' } })
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    expect(firstCallArgs.choices[0]).toEqual(
      expect.objectContaining({ name: expect.stringContaining('OpenAI') })
    )
  })

  it('selecting provider opens provider selector and calls validateProvider', async () => {
    // Main menu → provider, provider selector → openai, model select → gpt-4o-mini, then back
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('gpt-4o-mini').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(3, expect.objectContaining({ message: 'OpenAI Model' }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', expect.objectContaining({
      provider: 'openai',
      openaiModel: 'gpt-4o-mini',
    }))
    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ pageSize: 10 }))
  })

  it('provider validation success displays LLM greeting', async () => {
    mockTestProviderConnection.mockResolvedValue({ ok: true, data: 'Hello from OpenAI!' })
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('gpt-4o-mini').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('OpenAI'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hello from OpenAI!'))
  })

  it('provider validation failure displays warning message (non-blocking)', async () => {
    mockTestProviderConnection.mockResolvedValue({ ok: false, error: 'API key missing' })
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('anthropic').mockResolvedValueOnce('claude-opus-4-6').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('API key missing'))
  })

  it('selecting OpenAI prompts for model select', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('gpt-5.4-mini').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(3, expect.objectContaining({ message: 'OpenAI Model', default: 'gpt-5.4' }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', expect.objectContaining({ openaiModel: 'gpt-5.4-mini' }))
  })

  it('OpenAI back from model select returns to settings without connection test', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('back').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockTestProviderConnection).not.toHaveBeenCalled()
  })

  it('selecting custom model prompts for free-text input', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('custom').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('o3-mini')

    await showSettingsScreen()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({
      message: 'OpenAI Model Name',
      validate: expect.any(Function),
    }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai', expect.objectContaining({ openaiModel: 'o3-mini' }))
  })

  it('custom model pre-selects when saved model is not in predefined list', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), provider: 'openai', openaiModel: 'o3-mini' } })
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('custom').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('o3-mini')

    await showSettingsScreen()

    const modelSelectCall = mockSelect.mock.calls[2]?.[0]
    expect(modelSelectCall?.default).toBe('custom')
    const customChoice = (modelSelectCall?.choices as Array<{ value?: string; description?: string }>)?.find(c => c?.value === 'custom')
    expect(customChoice?.description).toBe('Current: o3-mini')
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

  it('provider selector includes OpenAI Compatible API', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('back').mockResolvedValueOnce('back')

    await showSettingsScreen()

    const providerSelectCall = mockSelect.mock.calls[1]?.[0]
    expect(providerSelectCall?.choices).toContainEqual({ name: 'OpenAI Compatible API', value: 'openai-compatible' })
  })

  it('selecting OpenAI Compatible API prompts for endpoint and model', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai-compatible').mockResolvedValueOnce('back')
    mockInput.mockResolvedValueOnce('https://api.example.com/v1').mockResolvedValueOnce('my-model')

    await showSettingsScreen()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Endpoint URL' }))
    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ message: 'Model Name' }))
    expect(mockTestProviderConnection).toHaveBeenCalledWith('openai-compatible', expect.objectContaining({
      provider: 'openai-compatible',
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    }))
  })

  it('Save after provider change persists provider fields', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('anthropic').mockResolvedValueOnce('claude-haiku-4-5').mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'anthropic',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-5.4',
      anthropicModel: 'claude-haiku-4-5',
      geminiModel: 'gemini-2.5-pro',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
    }))
  })

  it('Save after OpenAI Compatible API change persists endpoint and model', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai-compatible').mockResolvedValueOnce('save')
    mockInput.mockResolvedValueOnce('https://api.example.com/v1').mockResolvedValueOnce('my-model')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'openai-compatible',
      openaiCompatibleEndpoint: 'https://api.example.com/v1',
      openaiCompatibleModel: 'my-model',
    }))
  })

  it('Back after provider change does NOT call writeSettings', async () => {
    mockSelect.mockResolvedValueOnce('provider').mockResolvedValueOnce('openai').mockResolvedValueOnce('gpt-5.4-mini').mockResolvedValueOnce('back')

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

  it('showWelcome toggle flips the value and shows enabled banner', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: false } })
    mockSelect.mockResolvedValueOnce('showWelcome').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome & Exit screen enabled'))
  })

  it('showWelcome toggle shows disabled banner when turning off', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: true } })
    mockSelect.mockResolvedValueOnce('showWelcome').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome & Exit screen disabled'))
  })

  it('renders the Welcome & Exit screen toggle label in settings menu', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const toggleChoice = choices.find((c) => c?.value === 'showWelcome')
    expect(toggleChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('Welcome & Exit screen') })
    )
  })

  it('Save after showWelcome toggle persists the toggled value', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), showWelcome: true } })
    mockSelect.mockResolvedValueOnce('showWelcome').mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ showWelcome: false }))
  })

  it('renders ASCII Art Milestone label with Classic when asciiArtMilestone is 100', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const milestoneChoice = choices.find((c) => c?.value === 'asciiArtMilestone')
    expect(milestoneChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('ASCII Art Milestone: Classic') })
    )
  })

  it('renders ASCII Art Milestone label with Instant when asciiArtMilestone is 0', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), asciiArtMilestone: 0 } })
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const milestoneChoice = choices.find((c) => c?.value === 'asciiArtMilestone')
    expect(milestoneChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('ASCII Art Milestone: Instant') })
    )
  })

  it('selecting asciiArtMilestone action triggers milestone selector prompt', async () => {
    mockSelect
      .mockResolvedValueOnce('asciiArtMilestone')
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({
      message: 'ASCII Art Milestone',
      default: 100,
    }))
  })

  it('ASCII Art Milestone selector includes a Back option after a separator', async () => {
    mockSelect
      .mockResolvedValueOnce('asciiArtMilestone')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce('back')

    await showSettingsScreen()

    const milestonePrompt = mockSelect.mock.calls[1]?.[0]
    expect(milestonePrompt).toEqual(expect.objectContaining({ message: 'ASCII Art Milestone' }))
    expect(milestonePrompt?.choices).toHaveLength(5)
    expect(milestonePrompt?.choices[4]).toEqual({ name: '↩️  Back', value: 'back' })
  })

  it('saving settings includes asciiArtMilestone in written settings', async () => {
    mockSelect
      .mockResolvedValueOnce('asciiArtMilestone')
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ asciiArtMilestone: 10 }))
  })

  it('Back from the ASCII Art Milestone selector leaves the value unchanged', async () => {
    mockSelect
      .mockResolvedValueOnce('asciiArtMilestone')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ asciiArtMilestone: 100 }))
  })

  it('ASCII Art Milestone choice appears before Welcome & Exit screen choice', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = (firstCallArgs.choices as SettingsChoice[]).filter((c) => c?.value)
    const milestoneIdx = choices.findIndex((c) => c?.value === 'asciiArtMilestone')
    const welcomeIdx = choices.findIndex((c) => c?.value === 'showWelcome')
    expect(milestoneIdx).toBeLessThan(welcomeIdx)
    expect(milestoneIdx).toBeGreaterThanOrEqual(0)
  })

  it('renders Theme toggle label with Dark when theme is dark', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const themeChoice = choices.find((c) => c?.value === 'theme')
    expect(themeChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('Theme:         Dark') })
    )
  })

  it('renders Theme toggle label with Light when theme is light', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), theme: 'light' } })
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const themeChoice = choices.find((c) => c?.value === 'theme')
    expect(themeChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('Theme:         Light') })
    )
  })

  it('theme toggle flips dark to light and shows success banner', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), theme: 'dark' } })
    mockSelect.mockResolvedValueOnce('theme').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Theme set to Light'))
  })

  it('theme toggle flips light to dark and shows success banner', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), theme: 'light' } })
    mockSelect.mockResolvedValueOnce('theme').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Theme set to Dark'))
  })

  it('Save after theme toggle persists theme and calls setTheme', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), theme: 'dark' } })
    mockSelect.mockResolvedValueOnce('theme').mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light' }))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('Back after theme toggle does NOT call setTheme or writeSettings', async () => {
    mockSelect.mockResolvedValueOnce('theme').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
    expect(mockSetTheme).not.toHaveBeenCalled()
  })

  it('Theme choice appears between ASCII Art Milestone and Welcome & Exit screen', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = (firstCallArgs.choices as SettingsChoice[]).filter((c) => c?.value)
    const milestoneIdx = choices.findIndex((c) => c?.value === 'asciiArtMilestone')
    const themeIdx = choices.findIndex((c) => c?.value === 'theme')
    const welcomeIdx = choices.findIndex((c) => c?.value === 'showWelcome')
    expect(themeIdx).toBeGreaterThan(milestoneIdx)
    expect(themeIdx).toBeLessThan(welcomeIdx)
  })

  // ---------------------------------------------------------------------------
  // My Coach scope
  // ---------------------------------------------------------------------------
  it('My Coach scope choice appears after Tone of Voice and before ASCII Art Milestone', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = (firstCallArgs.choices as SettingsChoice[]).filter((c) => c?.value)
    const toneIdx = choices.findIndex((c) => c?.value === 'tone')
    const coachIdx = choices.findIndex((c) => c?.value === 'myCoachScope')
    const milestoneIdx = choices.findIndex((c) => c?.value === 'asciiArtMilestone')
    expect(coachIdx).toBeGreaterThan(toneIdx)
    expect(coachIdx).toBeLessThan(milestoneIdx)
    expect(coachIdx).toBeGreaterThanOrEqual(0)
  })

  it('renders My Coach scope label with Extended when myCoachScope is "100"', async () => {
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const coachChoice = choices.find((c) => c?.value === 'myCoachScope')
    expect(coachChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('My Coach Scope: Extended') })
    )
  })

  it('renders My Coach scope label with Recent when myCoachScope is "25"', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { ...defaultSettings(), myCoachScope: '25' } })
    mockSelect.mockResolvedValueOnce('back')

    await showSettingsScreen()

    const firstCallArgs = mockSelect.mock.calls[0][0]
    const choices = firstCallArgs.choices as SettingsChoice[]
    const coachChoice = choices.find((c) => c?.value === 'myCoachScope')
    expect(coachChoice).toEqual(
      expect.objectContaining({ name: expect.stringContaining('My Coach Scope: Recent') })
    )
  })

  it('selecting myCoachScope action triggers scope selector prompt with correct default', async () => {
    mockSelect
      .mockResolvedValueOnce('myCoachScope')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({
      message: 'My Coach Scope',
      default: '100',
    }))
  })

  it('My Coach scope selector includes a Back option after a separator', async () => {
    mockSelect
      .mockResolvedValueOnce('myCoachScope')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce('back')

    await showSettingsScreen()

    const scopePrompt = mockSelect.mock.calls[1]?.[0]
    expect(scopePrompt).toEqual(expect.objectContaining({ message: 'My Coach Scope' }))
    expect(scopePrompt?.choices).toHaveLength(5)
    expect(scopePrompt?.choices[4]).toEqual({ name: '↩️  Back', value: 'back' })
  })

  it('Back from My Coach scope selector leaves the value unchanged', async () => {
    mockSelect
      .mockResolvedValueOnce('myCoachScope')
      .mockResolvedValueOnce('back')
      .mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ myCoachScope: '100' }))
  })

  it('Save after My Coach scope change persists the selected value', async () => {
    mockSelect
      .mockResolvedValueOnce('myCoachScope')
      .mockResolvedValueOnce('25')
      .mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ myCoachScope: '25' }))
  })

  it('Save with default scope includes myCoachScope: "100"', async () => {
    mockSelect.mockResolvedValueOnce('save')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith(expect.objectContaining({ myCoachScope: '100' }))
  })

  it('ExitPromptError during scope select does not call writeSettings', async () => {
    mockSelect
      .mockResolvedValueOnce('myCoachScope')
      .mockRejectedValueOnce(new ExitPromptError('canceled'))

    await showSettingsScreen()

    expect(mockWriteSettings).not.toHaveBeenCalled()
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
    expect(getProviderLabel('openai-compatible')).toBe('OpenAI Compatible API')
  })
})
