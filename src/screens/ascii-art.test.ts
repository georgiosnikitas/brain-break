import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import chalk from 'chalk'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('figlet', () => ({
  default: { textSync: vi.fn(() => 'FIGLET_ART') },
}))

vi.mock('../utils/format.js', () => ({
  header: vi.fn((s: string) => s),
  menuTheme: {},
  gradientText: vi.fn((text: string) => `[gradient]${text}`),
  dim: vi.fn((s: string) => `[dim]${s}`),
  lerpColor: vi.fn(() => ({ r: 100, g: 100, b: 100 })),
  getTheme: vi.fn(() => 'dark'),
}))

vi.mock('../utils/screen.js', () => ({
  clearAndBanner: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showDomainMenu: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import figlet from 'figlet'
import { gradientText, getTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'
import { select } from '@inquirer/prompts'
import { colorAsciiArt, FIGLET_FONTS, showAsciiArtScreen, pickRandomFont, renderProgressBar, renderCompactProgressLabel } from './ascii-art.js'

const mockTextSync = vi.mocked(figlet.textSync)
const mockGradientText = vi.mocked(gradientText)
const mockGetTheme = vi.mocked(getTheme)
const mockClearAndBanner = vi.mocked(clearAndBanner)
const mockShowDomainMenu = vi.mocked(router.showDomainMenu)
const mockSelect = vi.mocked(select)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockShowDomainMenu.mockResolvedValue(undefined)
  mockSelect.mockResolvedValue('back')
})

// ---------------------------------------------------------------------------
// pickRandomFont
// ---------------------------------------------------------------------------
describe('pickRandomFont', () => {
  it('returns one of the curated font names', () => {
    const font = pickRandomFont()
    expect(FIGLET_FONTS).toContain(font)
  })

  it('avoids the previous font when possible', () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const font = pickRandomFont('Standard')
      expect(font).not.toBe('Standard')
      expect(FIGLET_FONTS).toContain(font)
    }
  })
})

// ---------------------------------------------------------------------------
// colorAsciiArt
// ---------------------------------------------------------------------------
describe('colorAsciiArt', () => {
  it('returns empty string for empty input', () => {
    expect(colorAsciiArt('')).toBe('')
  })

  it('calls gradientText with row=0, totalRows=1 for single-line art', () => {
    const result = colorAsciiArt('hello')
    expect(mockGradientText).toHaveBeenCalledWith('hello', 0, 1)
    expect(result).toBe('[gradient]hello')
  })

  it('calls gradientText for each row with correct indices for multi-line art', () => {
    const art = 'line1\nline2\nline3'
    const result = colorAsciiArt(art)

    expect(mockGradientText).toHaveBeenCalledTimes(3)
    expect(mockGradientText).toHaveBeenNthCalledWith(1, 'line1', 0, 3)
    expect(mockGradientText).toHaveBeenNthCalledWith(2, 'line2', 1, 3)
    expect(mockGradientText).toHaveBeenNthCalledWith(3, 'line3', 2, 3)
    expect(result).toBe('[gradient]line1\n[gradient]line2\n[gradient]line3')
  })

  it('strips trailing empty lines before coloring', () => {
    const art = 'line1\nline2\n\n\n'
    colorAsciiArt(art)

    expect(mockGradientText).toHaveBeenCalledTimes(2)
    expect(mockGradientText).toHaveBeenNthCalledWith(1, 'line1', 0, 2)
    expect(mockGradientText).toHaveBeenNthCalledWith(2, 'line2', 1, 2)
  })
})

// ---------------------------------------------------------------------------
// renderProgressBar
// ---------------------------------------------------------------------------
describe('renderProgressBar', () => {
  it('renders all unfilled blocks when correctCount is 0', () => {
    const result = renderProgressBar(0, 100, 10)
    expect(result).toMatch(/^\[/)
    expect(result).toMatch(/\]$/)
    // 0 filled, 10 unfilled
    const inner = result.slice(1, -1)
    expect(inner).not.toContain('█')
    expect((inner.match(/░/g) || []).length).toBe(10)
  })

  it('renders half filled, half unfilled when correctCount is 50', () => {
    const result = renderProgressBar(50, 100, 10)
    const inner = result.slice(1, -1)
    expect((inner.match(/█/g) || []).length).toBe(5)
    expect((inner.match(/░/g) || []).length).toBe(5)
  })

  it('renders all filled blocks when correctCount equals total', () => {
    const result = renderProgressBar(100, 100, 10)
    const inner = result.slice(1, -1)
    expect((inner.match(/█/g) || []).length).toBe(10)
    expect(inner).not.toContain('░')
  })

  it('renders correct filled/unfilled ratio for arbitrary values', () => {
    const result = renderProgressBar(42, 100, 20)
    const inner = result.slice(1, -1)
    // Math.round(42/100 * 20) = Math.round(8.4) = 8
    expect((inner.match(/█/g) || []).length).toBe(8)
    expect((inner.match(/░/g) || []).length).toBe(12)
  })

  it('renders all unfilled blocks when total is 0 (division-by-zero guard)', () => {
    const result = renderProgressBar(0, 0, 10)
    const inner = result.slice(1, -1)
    expect(inner).not.toContain('█')
    expect((inner.match(/░/g) || []).length).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// renderProgressBar — theme-aware fallback (chalk.level < 3)
// ---------------------------------------------------------------------------
describe('renderProgressBar — theme-aware fallback', () => {
  let origLevel: typeof chalk.level

  beforeEach(() => {
    origLevel = chalk.level
    chalk.level = 1
  })

  afterEach(() => {
    chalk.level = origLevel
    mockGetTheme.mockReturnValue('dark')
  })

  it('uses cyan filled blocks for dark theme on low chalk level', () => {
    mockGetTheme.mockReturnValue('dark')
    const result = renderProgressBar(50, 100, 10)
    const inner = result.slice(1, -1)
    expect((inner.match(/█/g) || []).length).toBe(5)
    // ANSI cyan = 36m
    expect(result).toMatch(/\x1B\[.*36/)
  })

  it('uses blue filled blocks for light theme on low chalk level', () => {
    mockGetTheme.mockReturnValue('light')
    const result = renderProgressBar(50, 100, 10)
    const inner = result.slice(1, -1)
    expect((inner.match(/█/g) || []).length).toBe(5)
    // ANSI blue = 34m
    expect(result).toMatch(/\x1B\[.*34/)
  })
})

// ---------------------------------------------------------------------------
// renderCompactProgressLabel
// ---------------------------------------------------------------------------
describe('renderCompactProgressLabel', () => {
  it('shows 0% for 0 correct answers', () => {
    const result = renderCompactProgressLabel(0, 100)
    expect(result).toContain('🎨 ASCII Art')
    expect(result).toContain('0%')
  })

  it('shows 42% for 42 correct answers', () => {
    const result = renderCompactProgressLabel(42, 100)
    expect(result).toContain('42%')
  })

  it('shows 99% for 99 correct answers (capped below 100)', () => {
    const result = renderCompactProgressLabel(99, 100)
    expect(result).toContain('99%')
  })

  it('caps at 99% even when correctCount >= threshold', () => {
    const result = renderCompactProgressLabel(100, 100)
    expect(result).toContain('99%')
    expect(result).not.toContain('100%')
  })

  it('shows 50% for Quick threshold (5/10)', () => {
    const result = renderCompactProgressLabel(5, 10)
    expect(result).toContain('50%')
  })

  it('shows 50% for Classic threshold (50/100)', () => {
    const result = renderCompactProgressLabel(50, 100)
    expect(result).toContain('50%')
  })

  it('returns unlocked sparkle label for Instant threshold edge case', () => {
    const result = renderCompactProgressLabel(0, 0)
    expect(result).toBe('🎨 ASCII Art ✨')
  })
})

// ---------------------------------------------------------------------------
// showAsciiArtScreen (unlocked)
// ---------------------------------------------------------------------------
describe('showAsciiArtScreen (unlocked)', () => {
  it('calls figlet.textSync with the slug and a font when unlocked', async () => {
    await showAsciiArtScreen('python', 100, 100)

    expect(mockTextSync).toHaveBeenCalledWith('python', { font: expect.any(String) })
  })

  it('clears screen, prints header with slug, prints colored art, shows navigation choices', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await showAsciiArtScreen('javascript', 150, 100)

    expect(mockClearAndBanner).toHaveBeenCalled()
    const logCalls = consoleSpy.mock.calls.map((c) => c[0])
    expect(logCalls).toContain('🎨 ASCII Art — javascript')
    expect(logCalls.some((c) => typeof c === 'string' && c.includes('[gradient]'))).toBe(true)
    const prompt = mockSelect.mock.calls[0]?.[0]
    if (prompt === undefined) {
      throw new Error('Expected the navigation prompt to be shown')
    }
    const promptChoices = prompt.choices.flatMap((choice) =>
      typeof choice === 'object' && choice !== null && 'name' in choice && typeof choice.name === 'string'
        ? [choice.name]
        : [],
    )
    expect(promptChoices).toEqual(expect.arrayContaining(['🔄 Regenerate', '↩️  Back']))
    expect(mockShowDomainMenu).toHaveBeenCalledWith('javascript')

    consoleSpy.mockRestore()
  })

  it('Regenerate rerenders the art with a different font before returning', async () => {
    mockSelect.mockResolvedValueOnce('regenerate').mockResolvedValueOnce('back')

    await showAsciiArtScreen('python', 100, 100)

    expect(mockTextSync).toHaveBeenCalledTimes(2)
    expect(mockClearAndBanner).toHaveBeenCalledTimes(2)
    expect(mockSelect).toHaveBeenCalledTimes(2)
    const firstCallOptions = mockTextSync.mock.calls[0]?.[1]
    const secondCallOptions = mockTextSync.mock.calls[1]?.[1]
    if (firstCallOptions === undefined || secondCallOptions === undefined) {
      throw new Error('Expected figlet.textSync to be called twice with font options')
    }
    expect(firstCallOptions.font).not.toBe(secondCallOptions.font)
    expect(mockShowDomainMenu).toHaveBeenCalledTimes(1)
    expect(mockShowDomainMenu).toHaveBeenCalledWith('python')
  })

  it('consecutive regenerations each use a different font', async () => {
    mockSelect
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('regenerate')
      .mockResolvedValueOnce('back')

    await showAsciiArtScreen('python', 100, 100)

    expect(mockTextSync).toHaveBeenCalledTimes(3)
    expect(mockClearAndBanner).toHaveBeenCalledTimes(3)
    const fonts = mockTextSync.mock.calls.map((call) => call[1]?.font)
    expect(fonts[0]).not.toBe(fonts[1])
    expect(fonts[1]).not.toBe(fonts[2])
    expect(mockShowDomainMenu).toHaveBeenCalledTimes(1)
  })

  it('Back selection returns to domain menu', async () => {
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 100, 100)

    expect(mockShowDomainMenu).toHaveBeenCalledWith('python')
  })

  it('Ctrl+C (ExitPromptError) returns to domain menu', async () => {
    mockSelect.mockRejectedValue(new ExitPromptError())

    await showAsciiArtScreen('python', 100, 100)

    expect(mockShowDomainMenu).toHaveBeenCalledWith('python')
  })
})

// ---------------------------------------------------------------------------
// showAsciiArtScreen (locked)
// ---------------------------------------------------------------------------
describe('showAsciiArtScreen (locked)', () => {
  it('shows motivational message and progress when locked', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 42, 100)

    expect(mockClearAndBanner).toHaveBeenCalled()
    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    expect(logCalls).toContain('🎨 ASCII Art — python')
    expect(logCalls.some((c) => c.includes('🔒'))).toBe(true)
    expect(logCalls.some((c) => c.includes('42%'))).toBe(true)
    // Should NOT call figlet
    expect(mockTextSync).not.toHaveBeenCalled()
    // Should NOT call router.showDomainMenu (caller handles navigation)
    expect(mockShowDomainMenu).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('shows 0% progress for zero correct answers', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 0, 100)

    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    expect(logCalls.some((c) => c.includes('0%'))).toBe(true)
    expect(mockTextSync).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('Back returns without calling router', async () => {
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 42, 100)

    expect(mockShowDomainMenu).not.toHaveBeenCalled()
  })

  it('Ctrl+C returns without calling router', async () => {
    mockSelect.mockRejectedValue(new ExitPromptError())

    await showAsciiArtScreen('python', 42, 100)

    expect(mockShowDomainMenu).not.toHaveBeenCalled()
  })

  it('at correctCount=99 still shows locked screen', async () => {
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 99, 100)

    expect(mockTextSync).not.toHaveBeenCalled()
  })

  it('Quick threshold locked shows "answered 10 questions"', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 5, 10)

    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    expect(logCalls.some((c) => c.includes('answered 10 questions correctly'))).toBe(true)
    expect(mockTextSync).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('Classic threshold locked shows "answered 100 questions"', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockSelect.mockResolvedValue('back')

    await showAsciiArtScreen('python', 50, 100)

    const logCalls = consoleSpy.mock.calls.map((c) => String(c[0]))
    expect(logCalls.some((c) => c.includes('answered 100 questions correctly'))).toBe(true)
    expect(mockTextSync).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('exactly at threshold shows unlocked (FIGlet art)', async () => {
    await showAsciiArtScreen('python', 10, 10)

    expect(mockTextSync).toHaveBeenCalledWith('python', { font: expect.any(String) })
  })

  it('Instant threshold (0) bypasses locked screen and renders FIGlet art', async () => {
    await showAsciiArtScreen('python', 0, 0)

    expect(mockTextSync).toHaveBeenCalledWith('python', { font: expect.any(String) })
  })
})
