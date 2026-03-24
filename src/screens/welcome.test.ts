import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))
vi.mock('../utils/format.js', () => ({
  gradientShadow: vi.fn((width: number) => `[shadow:${width}]`),
  getGradientWidth: vi.fn(() => 60),
  lerpColor: vi.fn(() => ({ r: 100, g: 90, b: 160 })),
  menuTheme: { style: { highlight: (t: string) => t } },
}))

import { showWelcomeScreen } from './welcome.js'
import { select } from '@inquirer/prompts'
import { clearScreen } from '../utils/screen.js'
import { ExitPromptError } from '@inquirer/core'

const mockSelect = vi.mocked(select)
let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  mockSelect.mockResolvedValueOnce('continue' as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('showWelcomeScreen', () => {
  it('clears the screen before rendering', async () => {
    await showWelcomeScreen()
    expect(vi.mocked(clearScreen)).toHaveBeenCalledOnce()
  })

  it('prints the ASCII art, tagline, and version lines', async () => {
    await showWelcomeScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('| __ )')
    expect(output).toContain('____')
    expect(output).toContain('Train your brain, one question at a time')
  })

  it('displays the version from package.json', async () => {
    await showWelcomeScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toMatch(/v\d+\.\d+\.\d+/)
  })

  it('displays the emoji branding', async () => {
    await showWelcomeScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('🧠🔨')
  })

  it('presents a select prompt to dismiss', async () => {
    await showWelcomeScreen()
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [{ value: 'continue', name: 'Press enter to continue...' }],
      }),
    )
  })

  it('exits process on ExitPromptError (Ctrl+C)', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new ExitPromptError())
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await showWelcomeScreen()

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError errors', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new Error('unexpected'))

    await expect(showWelcomeScreen()).rejects.toThrow('unexpected')
  })

  it('prints a gradient shadow separator', async () => {
    await showWelcomeScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('[shadow:60]')
  })
})
