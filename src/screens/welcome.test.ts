import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFormatMock } from './__test-helpers__/format-mock.js'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), clearAndBanner: vi.fn() }))
vi.mock('../utils/format.js', () => createFormatMock())

import { showWelcomeScreen, TAGLINE } from './welcome.js'
import { select } from '@inquirer/prompts'
import { clearScreen } from '../utils/screen.js'
import { ExitPromptError } from '@inquirer/core'
import { menuTheme, typewriterPrint, cancellableSleep } from '../utils/format.js'

const mockSelect = vi.mocked(select)
let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  mockSelect.mockResolvedValueOnce('continue' as unknown as string)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

async function runScreen(): Promise<void> {
  const promise = showWelcomeScreen()
  await vi.runAllTimersAsync()
  await promise
}

describe('showWelcomeScreen', () => {
  it('clears the screen before rendering', async () => {
    await runScreen()
    expect(vi.mocked(clearScreen)).toHaveBeenCalledOnce()
  })

  it('prints the ASCII art and version lines via console.log', async () => {
    await runScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('| __ )')
    expect(output).toContain('____')
    expect(output).toMatch(/v\d+\.\d+\.\d+/)
  })

  it('prints the tagline via typewriterPrint', async () => {
    await runScreen()
    expect(vi.mocked(typewriterPrint)).toHaveBeenCalledWith(TAGLINE)
  })

  it('displays the version from package.json', async () => {
    await runScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toMatch(/v\d+\.\d+\.\d+/)
  })

  it('displays the emoji branding', async () => {
    await runScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('🧠🔨')
  })

  it('presents a select prompt to dismiss', async () => {
    await runScreen()
    expect(mockSelect).toHaveBeenCalledOnce()
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [{ value: 'continue', name: 'Press enter to continue...' }],
        theme: menuTheme,
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('exits process on ExitPromptError (Ctrl+C)', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new ExitPromptError())
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showWelcomeScreen()
    await vi.runAllTimersAsync()
    await promise

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError errors', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new Error('unexpected'))

    const promise = showWelcomeScreen()
    // Register rejection handler before advancing timers to avoid unhandled rejection
    const assertion = expect(promise).rejects.toThrow('unexpected')
    await vi.runAllTimersAsync()
    await assertion
  })

  it('prints a gradient shadow separator', async () => {
    await runScreen()
    const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    expect(output).toContain('[shadow:60]')
  })

  it('auto-dismisses after 3 seconds when no keypress is provided', async () => {
    mockSelect.mockReset()
    mockSelect.mockImplementation(() => new Promise(() => {}) as never)
    vi.mocked(cancellableSleep).mockReturnValueOnce({ promise: Promise.resolve(), cancel: vi.fn() })

    const promise = showWelcomeScreen()
    await vi.runAllTimersAsync()
    await promise

    // Should resolve without error (no process.exit on welcome auto-dismiss)
  })
})
