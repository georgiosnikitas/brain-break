import { describe, it, expect, vi } from 'vitest'

vi.mock('./format.js', () => ({
  bold: vi.fn((text: string) => `[bold:${text}]`),
  gradientShadow: vi.fn((width: number) => `[shadow:${width}]`),
  getGradientWidth: vi.fn(() => 60),
  gradientText: vi.fn((text: string) => text),
  typewriterPrint: vi.fn(async () => undefined),
  ASCII_ART: ['line-1', 'line-2'],
}))

import { clearScreen, banner, clearAndBanner, renderBrandedScreen } from './screen.js'
import { gradientShadow, gradientText, typewriterPrint, ASCII_ART } from './format.js'

describe('clearScreen', () => {
  it('writes the RIS escape sequence to reset the terminal viewport', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    clearScreen()
    expect(writeSpy).toHaveBeenCalledOnce()
    expect(writeSpy).toHaveBeenCalledWith('\x1Bc')
    writeSpy.mockRestore()
  })
})

describe('banner', () => {
  it('prints the bold title and shadow line', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    banner()
    expect(logSpy).toHaveBeenCalledTimes(2)
    expect(vi.mocked(gradientShadow)).toHaveBeenCalledWith(60)
    logSpy.mockRestore()
  })
})

describe('clearAndBanner', () => {
  it('clears the screen then prints the banner', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    clearAndBanner()
    expect(writeSpy).toHaveBeenCalledWith('\x1Bc')
    expect(logSpy).toHaveBeenCalledTimes(2)
    writeSpy.mockRestore()
    logSpy.mockRestore()
  })
})

describe('renderBrandedScreen', () => {
  it('renders the branded layout, version, and prompt via the shared helper', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await renderBrandedScreen('Train your brain')

    expect(writeSpy).toHaveBeenCalledWith('\x1Bc')
    expect(writeSpy).toHaveBeenCalledWith('  > ')
    expect(vi.mocked(gradientText)).toHaveBeenCalledTimes(ASCII_ART.length)
    expect(vi.mocked(typewriterPrint)).toHaveBeenCalledWith('Train your brain')
    expect(vi.mocked(gradientShadow)).toHaveBeenCalledWith(60)

    const output = logSpy.mock.calls.map((call) => String(call[0])).join('\n')
    expect(output).toContain('🧠🔨')
    expect(output).toContain('[shadow:60]')
    expect(output).toMatch(/v\d+\.\d+\.\d+/)

    writeSpy.mockRestore()
    logSpy.mockRestore()
  })
})
