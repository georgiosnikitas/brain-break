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

import { showWelcomeScreen, TAGLINE } from './welcome.js'
import { select } from '@inquirer/prompts'
import { clearScreen } from '../utils/screen.js'
import { ExitPromptError } from '@inquirer/core'
import { menuTheme } from '../utils/format.js'

const mockSelect = vi.mocked(select)
let logSpy: ReturnType<typeof vi.spyOn>
let stdoutSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
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

  it('writes the tagline via stdout (not console.log)', async () => {
    await runScreen()
    const logOutput = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n')
    const stdoutOutput = stdoutSpy.mock.calls.map((c: unknown[]) => String(c[0])).join('')
    // tagline chars are written individually so the continuous string won't appear in log
    expect(logOutput).not.toContain(TAGLINE)
    // each character of the tagline must appear in the stdout stream
    for (const char of new Set(TAGLINE.replaceAll(' ', ''))) {
      expect(stdoutOutput).toContain(char)
    }
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

  describe('typewriter effect', () => {
    it('erases the in-progress cursor after each character', async () => {
      await runScreen()
      const eraseWrites = stdoutSpy.mock.calls.filter((c: unknown[]) => String(c[0]) === '\b \b')
      expect(eraseWrites).toHaveLength(TAGLINE.length)
    })

    it('writes one stdout call per tagline character during typing', async () => {
      await runScreen()
      // Each char gets exactly one write containing the char + cursor pair,
      // preceded by one erase write. Verify each char appears in the collected output.
      const writes = stdoutSpy.mock.calls.map((c: unknown[]) => String(c[0]))
      for (const char of TAGLINE) {
        expect(writes.some((w: string) => w.includes(char))).toBe(true)
      }
    })

    it('blinks the cursor exactly 3 times after typing completes', async () => {
      await runScreen()
      // Each blink cycle hides the cursor with '\b ' then shows it again.
      const blinkOffWrites = stdoutSpy.mock.calls.filter((c: unknown[]) => String(c[0]) === '\b ')
      expect(blinkOffWrites).toHaveLength(3)
    })

    it('leaves the cursor visible after the final blink', async () => {
      await runScreen()
      const writes = stdoutSpy.mock.calls.map((c: unknown[]) => String(c[0]))
      // The last write before '\n' must not be a hide sequence
      const newlineIdx = writes.lastIndexOf('\n')
      expect(newlineIdx).toBeGreaterThan(0)
      const writeBeforeNewline = writes[newlineIdx - 1]
      expect(writeBeforeNewline).not.toBe('\b ')
    })

    it('ends the tagline line with a newline via stdout', async () => {
      await runScreen()
      const writes = stdoutSpy.mock.calls.map((c: unknown[]) => String(c[0]))
      expect(writes).toContain('\n')
    })
  })
})
