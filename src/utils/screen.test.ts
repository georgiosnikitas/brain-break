import { describe, it, expect, vi } from 'vitest'
import { clearScreen } from './screen.js'

describe('clearScreen', () => {
  it('writes the RIS escape sequence to reset the terminal viewport', () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    clearScreen()
    expect(writeSpy).toHaveBeenCalledOnce()
    expect(writeSpy).toHaveBeenCalledWith('\x1Bc')
    writeSpy.mockRestore()
  })
})
