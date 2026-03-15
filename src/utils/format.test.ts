import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  success,
  error,
  warn,
  dim,
  bold,
  header,
  formatSpeedTier,
  formatScoreDelta,
  formatDuration,
  formatAccuracy,
  typewrite,
} from './format.js'

// chalk can produce empty strings in test environments when colors are disabled.
// We test that each helper returns a string containing the expected text content.

describe('basic chalk wrappers', () => {
  it('success returns a string containing the input', () => {
    expect(success('ok')).toContain('ok')
  })

  it('error returns a string containing the input', () => {
    expect(error('bad')).toContain('bad')
  })

  it('warn returns a string containing the input', () => {
    expect(warn('caution')).toContain('caution')
  })

  it('dim returns a string containing the input', () => {
    expect(dim('quiet')).toContain('quiet')
  })

  it('bold returns a string containing the input', () => {
    expect(bold('KEY')).toContain('KEY')
  })

  it('header returns a string containing the input', () => {
    expect(header('Title')).toContain('Title')
  })
})

describe('formatSpeedTier', () => {
  it('returns string containing "Fast" for fast tier', () => {
    expect(formatSpeedTier('fast')).toContain('Fast')
  })

  it('returns string containing "Normal" for normal tier', () => {
    expect(formatSpeedTier('normal')).toContain('Normal')
  })

  it('returns string containing "Slow" for slow tier', () => {
    expect(formatSpeedTier('slow')).toContain('Slow')
  })
})

describe('formatScoreDelta', () => {
  it('includes + sign for positive delta', () => {
    expect(formatScoreDelta(20)).toContain('+20')
  })

  it('includes the number for negative delta', () => {
    expect(formatScoreDelta(-15)).toContain('-15')
  })

  it('includes + sign for zero', () => {
    expect(formatScoreDelta(0)).toContain('+0')
  })
})

describe('formatDuration', () => {
  it('formats milliseconds as seconds with one decimal', () => {
    expect(formatDuration(1200)).toBe('1.2s')
  })

  it('formats 0ms as 0.0s', () => {
    expect(formatDuration(0)).toBe('0.0s')
  })

  it('rounds to one decimal place', () => {
    expect(formatDuration(1550)).toBe('1.6s')
  })
})

describe('formatAccuracy', () => {
  it('calculates percentage correctly', () => {
    expect(formatAccuracy(7, 10)).toBe('70.0%')
  })

  it('returns 0.0% when total is 0', () => {
    expect(formatAccuracy(0, 0)).toBe('0.0%')
  })

  it('returns 100.0% for all correct', () => {
    expect(formatAccuracy(5, 5)).toBe('100.0%')
  })
})

describe('typewrite', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes each character to stdout followed by a newline', async () => {
    vi.useFakeTimers()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    const p = typewrite('hi', 10)
    await vi.runAllTimersAsync()
    await p

    const written = writeSpy.mock.calls.map((c) => c[0]).join('')
    expect(written).toContain('h')
    expect(written).toContain('i')
    expect(written).toContain('\n')
    writeSpy.mockRestore()
  })

  it('writes exactly text.length + 1 chunks (chars + trailing newline)', async () => {
    vi.useFakeTimers()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    const p = typewrite('abc', 10)
    await vi.runAllTimersAsync()
    await p

    expect(writeSpy).toHaveBeenCalledTimes(4) // 'a', 'b', 'c', '\n'
    writeSpy.mockRestore()
  })

  it('resolves immediately for an empty string (only newline written)', async () => {
    vi.useFakeTimers()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    const p = typewrite('', 10)
    await vi.runAllTimersAsync()
    await p

    expect(writeSpy).toHaveBeenCalledTimes(1)
    expect(writeSpy).toHaveBeenCalledWith('\n')
    writeSpy.mockRestore()
  })
})
