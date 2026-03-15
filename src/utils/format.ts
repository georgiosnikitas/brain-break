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
    case 1: return chalk.cyan('L1')
    case 2: return chalk.green('L2')
    case 3: return chalk.yellow('L3')
    case 4: return chalk.magenta('L4')
    case 5: return chalk.red('L5')
    default: return `L${level}`
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
