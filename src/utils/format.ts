import chalk from 'chalk'
import type { SpeedTier } from '../domain/schema.js'

// Basic chalk wrappers
export const success = (s: string) => chalk.green(s)
export const error = (s: string) => chalk.red(s)
export const warn = (s: string) => chalk.yellow(s)
export const dim = (s: string) => chalk.dim(s)
export const bold = (s: string) => chalk.bold(s)
export const header = (s: string) => chalk.bold.cyan(s)

// Semantic color helpers (FR20–FR23)
export const colorCorrect = (text: string) => chalk.green(text)
export const colorIncorrect = (text: string) => chalk.red(text)

export function colorSpeedTier(tier: SpeedTier): string {
  switch (tier) {
    case 'fast': return chalk.green('Fast')
    case 'normal': return chalk.yellow('Normal')
    case 'slow': return chalk.red('Slow')
  }
}

export function colorDifficultyLevel(level: number): string {
  switch (level) {
    case 1: return chalk.cyan('Beginner')
    case 2: return chalk.green('Easy')
    case 3: return chalk.yellow('Intermediate')
    case 4: return chalk.magenta('Advanced')
    case 5: return chalk.red('Expert')
    default: return String(level)
  }
}

export function colorScoreDelta(delta: number): string {
  return delta >= 0 ? chalk.green(`+${delta}`) : chalk.red(`${delta}`)
}

// Menu highlight theme for all inquirer select prompts (FR20)
export const menuTheme = {
  style: {
    highlight: (text: string) => chalk.inverse(text),
  },
}

// Domain-specific helpers
export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return '0.0%'
  const clamped = Math.min(correct, total)
  return `${((clamped / total) * 100).toFixed(1)}%`
}

export async function typewrite(text: string, delayMs = 30): Promise<void> {
  for (const char of text) {
    process.stdout.write(char)
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
  }
  process.stdout.write('\n')
}

// Gradient utilities for banner and welcome screen
export const CYAN = { r: 0, g: 180, b: 200 }
export const MAGENTA = { r: 200, g: 0, b: 120 }

export function lerpColor(t: number): { r: number; g: number; b: number } {
  return {
    r: Math.round(CYAN.r + (MAGENTA.r - CYAN.r) * t),
    g: Math.round(CYAN.g + (MAGENTA.g - CYAN.g) * t),
    b: Math.round(CYAN.b + (MAGENTA.b - CYAN.b) * t),
  }
}

export function getGradientWidth(): number {
  return Math.min(process.stdout.columns || 60, 80)
}

export function gradientBg(text: string, width: number): string {
  if (chalk.level < 3) {
    const padded = text.padEnd(width)
    return chalk.bgCyan(chalk.bold.white(padded))
  }
  // Smooth gradient across the full width.
  // Text portion uses one chalk call (emoji-safe) at its visual midpoint color.
  // Padding spaces get per-character gradient continuing from where text ends.
  const textLen = [...text].length
  const padCount = Math.max(0, width - textLen)
  const denom = Math.max(1, width - 1)
  const textMid = textLen > 0 ? (textLen - 1) / 2 / denom : 0
  const textColor = lerpColor(textMid)
  let result = chalk.bgRgb(textColor.r, textColor.g, textColor.b)(chalk.bold.white(text))
  for (let i = 0; i < padCount; i++) {
    const t = (textLen + i) / denom
    const c = lerpColor(t)
    result += chalk.bgRgb(c.r, c.g, c.b)(' ')
  }
  return result
}

export function gradientShadow(width: number): string {
  if (chalk.level < 3) return ''
  let result = ''
  for (let i = 0; i < width; i++) {
    const t = width <= 1 ? 0 : i / (width - 1)
    const c = lerpColor(t)
    result += chalk.rgb(c.r, c.g, c.b)('▀')
  }
  return result
}
