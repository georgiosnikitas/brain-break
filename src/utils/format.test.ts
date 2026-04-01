import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import chalk from 'chalk'
import {
  success,
  error,
  warn,
  dim,
  bold,
  header,
  formatDuration,
  formatAccuracy,
  typewrite,
  colorCorrect,
  colorIncorrect,
  colorSpeedTier,
  colorDifficultyLevel,
  colorScoreDelta,
  menuTheme,
  getGradientWidth,
  gradientBg,
  gradientShadow,
  gradientText,
  typewriterPrint,
  cancellableSleep,
  lerpColor,
  CYAN,
  MAGENTA,
  renderQuestionDetail,
} from './format.js'
import type { QuestionRecord } from '../domain/schema.js'

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

describe('colorCorrect', () => {
  it('returns a string containing the input text', () => {
    expect(colorCorrect('✓ Correct!')).toContain('✓ Correct!')
  })

  it('returns a string for any input', () => {
    expect(typeof colorCorrect('test')).toBe('string')
  })
})

describe('colorIncorrect', () => {
  it('returns a string containing the input text', () => {
    expect(colorIncorrect('✗ Incorrect')).toContain('✗ Incorrect')
  })

  it('returns a string for any input', () => {
    expect(typeof colorIncorrect('test')).toBe('string')
  })
})

describe('colorSpeedTier', () => {
  it('returns string containing "Fast" for fast tier', () => {
    expect(colorSpeedTier('fast')).toContain('Fast')
  })

  it('returns string containing "Normal" for normal tier', () => {
    expect(colorSpeedTier('normal')).toContain('Normal')
  })

  it('returns string containing "Slow" for slow tier', () => {
    expect(colorSpeedTier('slow')).toContain('Slow')
  })
})

describe('colorDifficultyLevel', () => {
  it('returns string containing "Beginner" for level 1', () => {
    expect(colorDifficultyLevel(1)).toContain('Beginner')
  })

  it('returns string containing "Elementary" for level 2', () => {
    expect(colorDifficultyLevel(2)).toContain('Elementary')
  })

  it('returns string containing "Intermediate" for level 3', () => {
    expect(colorDifficultyLevel(3)).toContain('Intermediate')
  })

  it('returns string containing "Advanced" for level 4', () => {
    expect(colorDifficultyLevel(4)).toContain('Advanced')
  })

  it('returns string containing "Expert" for level 5', () => {
    expect(colorDifficultyLevel(5)).toContain('Expert')
  })

  it('returns uncolored label for out-of-range level', () => {
    expect(colorDifficultyLevel(6)).toBe('6')
  })
})

describe('colorScoreDelta', () => {
  it('includes + sign for positive delta', () => {
    expect(colorScoreDelta(20)).toContain('+20')
  })

  it('includes the number for negative delta', () => {
    expect(colorScoreDelta(-15)).toContain('-15')
  })

  it('includes + sign for zero', () => {
    expect(colorScoreDelta(0)).toContain('+0')
  })
})

describe('menuTheme', () => {
  it('highlight returns a string containing the input text', () => {
    const result = menuTheme.style.highlight('selected item')
    expect(result).toContain('selected item')
  })
})

describe('getGradientWidth', () => {
  const originalColumns = process.stdout.columns

  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', { value: originalColumns, writable: true })
  })

  it('returns terminal width when under 80', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 60, writable: true })
    expect(getGradientWidth()).toBe(60)
  })

  it('caps at 80 for wide terminals', () => {
    Object.defineProperty(process.stdout, 'columns', { value: 200, writable: true })
    expect(getGradientWidth()).toBe(80)
  })

  it('defaults to 60 when columns is undefined', () => {
    Object.defineProperty(process.stdout, 'columns', { value: undefined, writable: true })
    expect(getGradientWidth()).toBe(60)
  })
})

describe('gradientBg', () => {
  it('returns a string containing the input text', () => {
    const result = gradientBg('Hello', 20)
    expect(result).toContain('Hello')
  })

  it('pads output to the specified width', () => {
    // The styled string contains ANSI codes, so we strip them to check width
    const result = gradientBg('Hi', 10)
    const stripped = result.replaceAll(/\x1B\[[0-9;]*m/g, '')
    expect(stripped.length).toBe(10)
  })
})

describe('gradientShadow', () => {
  it('returns a string when called', () => {
    const result = gradientShadow(10)
    expect(typeof result).toBe('string')
  })
})

describe('lerpColor', () => {
  it('returns CYAN at t=0', () => {
    expect(lerpColor(0)).toEqual(CYAN)
  })

  it('returns MAGENTA at t=1', () => {
    expect(lerpColor(1)).toEqual(MAGENTA)
  })

  it('returns a midpoint color at t=0.5', () => {
    const mid = lerpColor(0.5)
    expect(mid.r).toBe(Math.round((CYAN.r + MAGENTA.r) / 2))
    expect(mid.g).toBe(Math.round((CYAN.g + MAGENTA.g) / 2))
    expect(mid.b).toBe(Math.round((CYAN.b + MAGENTA.b) / 2))
  })
})

describe('cancellableSleep', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after the specified time', async () => {
    vi.useFakeTimers()
    const { promise } = cancellableSleep(100)
    vi.advanceTimersByTime(100)
    await expect(promise).resolves.toBeUndefined()
  })

  it('cancel keeps the promise pending after timers advance', async () => {
    vi.useFakeTimers()
    const { promise, cancel } = cancellableSleep(100)
    let settled = false

    void promise.then(() => {
      settled = true
    })

    cancel()
    await vi.runAllTimersAsync()

    expect(settled).toBe(false)
  })
})

describe('gradientText', () => {
  it('returns a string containing the input text', () => {
    expect(gradientText('Hello', 0, 5)).toContain('Hello')
  })

  it('handles totalRows=1 without division by zero', () => {
    expect(gradientText('X', 0, 1)).toContain('X')
  })

  it('uses truecolor when chalk.level >= 3', () => {
    const origLevel = chalk.level
    try {
      chalk.level = 3
      const result = gradientText('Hi', 0, 3)
      expect(result).toContain('Hi')
    } finally {
      chalk.level = origLevel
    }
  })
})

describe('typewriterPrint', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes characters and a trailing newline to stdout', async () => {
    vi.useFakeTimers()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    const p = typewriterPrint('ab')
    await vi.runAllTimersAsync()
    await p

    const written = writeSpy.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('a')
    expect(written).toContain('b')
    expect(written).toContain('\n')
    writeSpy.mockRestore()
  })

  it('works for empty string (only cursor blink and newline)', async () => {
    vi.useFakeTimers()
    const writeSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    const p = typewriterPrint('')
    await vi.runAllTimersAsync()
    await p

    const written = writeSpy.mock.calls.map((c) => String(c[0])).join('')
    expect(written).toContain('\n')
    writeSpy.mockRestore()
  })
})

describe('gradientBg — truecolor branch', () => {
  let origLevel: typeof chalk.level

  beforeEach(() => {
    origLevel = chalk.level
    chalk.level = 3
  })

  afterEach(() => {
    chalk.level = origLevel
  })

  it('returns a string containing the input text', () => {
    const result = gradientBg('Test', 20)
    expect(result).toContain('Test')
  })

  it('handles empty text', () => {
    const result = gradientBg('', 10)
    expect(typeof result).toBe('string')
  })

  it('handles width equal to text length (no padding)', () => {
    const result = gradientBg('ABCDE', 5)
    expect(result).toContain('ABCDE')
  })
})

describe('gradientShadow — truecolor branch', () => {
  let origLevel: typeof chalk.level

  beforeEach(() => {
    origLevel = chalk.level
    chalk.level = 3
  })

  afterEach(() => {
    chalk.level = origLevel
  })

  it('returns a non-empty string containing shadow characters', () => {
    const result = gradientShadow(10)
    expect(result.length).toBeGreaterThan(0)
    const stripped = result.replaceAll(/\x1B\[[0-9;]*m/g, '')
    expect(stripped).toContain('▀')
  })

  it('handles width=1', () => {
    const result = gradientShadow(1)
    const stripped = result.replaceAll(/\x1B\[[0-9;]*m/g, '')
    expect(stripped).toBe('▀')
  })
})

// ---------------------------------------------------------------------------
// renderQuestionDetail
// ---------------------------------------------------------------------------

function makeRecord(overrides: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    question: 'What is TypeScript?',
    options: { A: 'A typed JS superset', B: 'A framework', C: 'A runtime', D: 'A test tool' },
    correctAnswer: 'A',
    userAnswer: 'A',
    isCorrect: true,
    answeredAt: '2026-03-26T10:00:00.000Z',
    timeTakenMs: 5000,
    speedTier: 'fast',
    scoreDelta: 60,
    difficultyLevel: 3,
    bookmarked: false,
    ...overrides,
  }
}

describe('renderQuestionDetail', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockReturnValue(undefined)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('correct path: ► on correct userAnswer, ✓ Correct!, no reveal, time/score lines', () => {
    renderQuestionDetail(makeRecord({ userAnswer: 'A', correctAnswer: 'A', isCorrect: true }))

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('► A)')
    expect(logged).toContain('A) A typed JS superset')
    expect(logged).toContain('B) A framework')
    expect(logged).toContain('C) A runtime')
    expect(logged).toContain('D) A test tool')
    expect(logged).toContain('✓ Correct!')
    expect(logged).not.toContain('Correct answer:')
    expect(logged).toContain('Time:')
    expect(logged).toContain('Score:')
  })

  it('incorrect path: ✗ Incorrect, reveal line, ► on wrong userAnswer key', () => {
    renderQuestionDetail(makeRecord({ userAnswer: 'B', correctAnswer: 'A', isCorrect: false }))

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('✗ Incorrect')
    expect(logged).toContain('Correct answer:')
    expect(logged).toContain('A) A typed JS superset')
    expect(logged).toContain('► B)')
    expect(logged).not.toContain('► A)')
  })

  it('showTimestamp: true appends Answered: line', () => {
    renderQuestionDetail(makeRecord(), { showTimestamp: true })

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).toContain('Answered:')
  })

  it('showTimestamp omitted: no Answered: line', () => {
    renderQuestionDetail(makeRecord())

    const logged = consoleSpy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(logged).not.toContain('Answered:')
  })
})
