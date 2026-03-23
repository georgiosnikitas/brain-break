import { describe, it, expect, vi } from 'vitest'

vi.mock('./format.js', () => ({
  bold: vi.fn((text: string) => `[bold:${text}]`),
  gradientShadow: vi.fn((width: number) => `[shadow:${width}]`),
  getGradientWidth: vi.fn(() => 60),
}))

import { clearScreen, banner, clearAndBanner } from './screen.js'
import { gradientShadow } from './format.js'

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
