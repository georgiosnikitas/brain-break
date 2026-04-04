import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createFormatMock } from './__test-helpers__/format-mock.js'

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}))
vi.mock('../utils/screen.js', () => ({ clearScreen: vi.fn(), renderBrandedScreen: vi.fn() }))
vi.mock('../utils/format.js', () => createFormatMock())

import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import * as screen from '../utils/screen.js'
import { cancellableSleep } from '../utils/format.js'
import { showExitScreen, getExitMessage } from './exit.js'

const mockSelect = vi.mocked(select)

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  mockSelect.mockResolvedValueOnce('exit-now' as unknown as string)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('showExitScreen', () => {
  it('delegates rendering to renderBrandedScreen', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showExitScreen(0)
    await vi.runAllTimersAsync()
    await promise

    expect(vi.mocked(screen.renderBrandedScreen)).toHaveBeenCalledOnce()
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('renders exit status line and prompt', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showExitScreen(0)
    await vi.runAllTimersAsync()
    await promise

    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        choices: [{ value: 'exit-now', name: 'Press enter to exit now...' }],
      }),
    )
    exitSpy.mockRestore()
  })

  it('auto-exits after 3 seconds when no keypress is provided', async () => {
    mockSelect.mockReset()
    mockSelect.mockImplementation(() => new Promise(() => {}) as never)
    vi.mocked(cancellableSleep).mockReturnValueOnce({ promise: Promise.resolve(), cancel: vi.fn() })
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showExitScreen(0)
    await vi.runAllTimersAsync()
    await promise

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('exits immediately on Enter before timer elapses', async () => {
    mockSelect.mockReset()
    mockSelect.mockResolvedValueOnce('exit-now' as unknown as string)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showExitScreen(0)
    await vi.runAllTimersAsync()
    await promise

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('exits immediately on ExitPromptError (Ctrl+C)', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new ExitPromptError())
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    const promise = showExitScreen(0)
    await vi.runAllTimersAsync()
    await promise

    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
  })

  it('re-throws non-ExitPromptError errors', async () => {
    mockSelect.mockReset()
    mockSelect.mockRejectedValueOnce(new Error('unexpected exit failure'))

    const promise = showExitScreen(0)
    const assertion = expect(promise).rejects.toThrow('unexpected exit failure')
    await vi.runAllTimersAsync()
    await assertion
  })
})

describe('getExitMessage', () => {
  it('returns zero-questions message when totalQuestions is 0', () => {
    expect(getExitMessage(0)).toBe("Break's over, see you next round")
  })

  it('returns tier 1 message for 1-9 questions', () => {
    expect(getExitMessage(5)).toBe('5 questions smashed, not bad for a break')
  })

  it('returns tier 2 message for 10-49 questions', () => {
    expect(getExitMessage(25)).toBe("25 questions? Your brain's showing off")
  })

  it('returns tier 3 message for 50-99 questions', () => {
    expect(getExitMessage(75)).toBe('75 questions deep, absolute brain breaker')
  })

  it('returns tier 4 message for 100+ questions', () => {
    expect(getExitMessage(150)).toBe('150 questions mastered, certified brain breaker')
  })

  it('boundary: 1 question uses tier 1 message', () => {
    expect(getExitMessage(1)).toBe('1 question smashed, not bad for a break')
  })

  it('boundary: 9 questions uses tier 1 message', () => {
    expect(getExitMessage(9)).toBe('9 questions smashed, not bad for a break')
  })

  it('boundary: 10 questions uses tier 2 message', () => {
    expect(getExitMessage(10)).toBe("10 questions? Your brain's showing off")
  })

  it('boundary: 49 questions uses tier 2 message', () => {
    expect(getExitMessage(49)).toBe("49 questions? Your brain's showing off")
  })

  it('boundary: 50 questions uses tier 3 message', () => {
    expect(getExitMessage(50)).toBe('50 questions deep, absolute brain breaker')
  })

  it('boundary: 99 questions uses tier 3 message', () => {
    expect(getExitMessage(99)).toBe('99 questions deep, absolute brain breaker')
  })

  it('boundary: 100 questions uses tier 4 message', () => {
    expect(getExitMessage(100)).toBe('100 questions mastered, certified brain breaker')
  })
})
