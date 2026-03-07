import chalk from 'chalk'
import type { SpeedTier } from '../domain/schema.js'

// Basic chalk wrappers
export const success = (s: string) => chalk.green(s)
export const error = (s: string) => chalk.red(s)
export const warn = (s: string) => chalk.yellow(s)
export const dim = (s: string) => chalk.dim(s)
export const bold = (s: string) => chalk.bold(s)
export const header = (s: string) => chalk.bold.cyan(s)

// Domain-specific helpers
export function formatSpeedTier(tier: SpeedTier): string {
  switch (tier) {
    case 'fast': return chalk.green('Fast')
    case 'normal': return chalk.yellow('Normal')
    case 'slow': return chalk.red('Slow')
  }
}

export function formatScoreDelta(delta: number): string {
  return delta >= 0 ? chalk.green(`+${delta}`) : chalk.red(`${delta}`)
}

export function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatAccuracy(correct: number, total: number): string {
  if (total === 0) return '0.0%'
  const clamped = Math.min(correct, total)
  return `${((clamped / total) * 100).toFixed(1)}%`
}
