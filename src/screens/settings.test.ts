import { describe, it, expect, vi, beforeEach } from 'vitest'
import { showSettingsScreen } from './settings.js'

vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  Separator: vi.fn(),
}))
vi.mock('../domain/store.js', () => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}))
vi.mock('../router.js', () => ({
  showHome: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn() }))

import { select, input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readSettings, writeSettings } from '../domain/store.js'
import * as router from '../router.js'
import { clearScreen } from '../utils/screen.js'
import { defaultSettings } from '../domain/schema.js'

const mockSelect = vi.mocked(select)
const mockInput = vi.mocked(input)
const mockReadSettings = vi.mocked(readSettings)
const mockWriteSettings = vi.mocked(writeSettings)

beforeEach(() => {
  vi.clearAllMocks()
  mockReadSettings.mockResolvedValue({ ok: true, data: defaultSettings() })
  mockWriteSettings.mockResolvedValue({ ok: true, data: undefined })
  vi.mocked(router.showHome).mockResolvedValue(undefined)
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
    mockReadSettings.mockResolvedValue({ ok: true, data: { language: 'Greek', tone: 'pirate' } })
    mockSelect.mockResolvedValueOnce('language').mockResolvedValueOnce('back')
    mockInput.mockResolvedValue('Greek')

    await showSettingsScreen()

    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ default: 'Greek' }))
  })

  it('passes current tone as default to tone select prompt', async () => {
    mockReadSettings.mockResolvedValue({ ok: true, data: { language: 'English', tone: 'enthusiastic' } })
    mockSelect.mockResolvedValueOnce('tone').mockResolvedValueOnce('enthusiastic').mockResolvedValueOnce('back')

    await showSettingsScreen()

    expect(mockSelect).toHaveBeenNthCalledWith(2, expect.objectContaining({ default: 'enthusiastic' }))
  })

  it('Save path: calls writeSettings with user inputs and then router.showHome()', async () => {
    // Select language → type Spanish, select tone → pick robot, then save
    mockSelect.mockResolvedValueOnce('language').mockResolvedValueOnce('tone').mockResolvedValueOnce('robot').mockResolvedValueOnce('save')
    mockInput.mockResolvedValue('Spanish')

    await showSettingsScreen()

    expect(mockWriteSettings).toHaveBeenCalledWith({ language: 'Spanish', tone: 'robot' })
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

    expect(mockWriteSettings).toHaveBeenCalledWith({ language: 'English', tone: 'normal' })
  })

  it('re-throws non-ExitPromptError from settings select', async () => {
    const boom = new Error('unexpected settings select failure')
    mockSelect.mockRejectedValueOnce(boom)

    await expect(showSettingsScreen()).rejects.toThrow('unexpected settings select failure')
  })
})
