import chalk from 'chalk'
import type { SpeedTier, QuestionRecord, Theme } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Theme state
// ---------------------------------------------------------------------------
let _theme: Theme = 'dark'
export function setTheme(t: Theme): void { _theme = t }
export function getTheme(): Theme { return _theme }

// Basic chalk wrappers
export const success = (s: string) => _theme === 'dark' ? chalk.green(s) : chalk.bold.green(s)
export const error = (s: string) => _theme === 'dark' ? chalk.red(s) : chalk.bold.red(s)
export const warn = (s: string) => _theme === 'dark' ? chalk.yellow(s) : chalk.bold.yellow(s)
export const dim = (s: string) => _theme === 'dark' ? chalk.dim(s) : chalk.gray(s)
export const bold = (s: string) => chalk.bold(s)
export const header = (s: string) => _theme === 'dark' ? chalk.bold.cyan(s) : chalk.bold.blue(s)
export const accent = (s: string) => _theme === 'dark' ? chalk.cyan(s) : chalk.blue(s)

// Semantic color helpers (FR20–FR23)
export const colorCorrect = (text: string) => _theme === 'dark' ? chalk.green(text) : chalk.bold.green(text)
export const colorIncorrect = (text: string) => _theme === 'dark' ? chalk.red(text) : chalk.bold.red(text)

export function colorSpeedTier(tier: SpeedTier): string {
  switch (tier) {
    case 'fast': return _theme === 'dark' ? chalk.green('Fast') : chalk.bold.green('Fast')
    case 'normal': return _theme === 'dark' ? chalk.yellow('Normal') : chalk.bold.yellow('Normal')
    case 'slow': return _theme === 'dark' ? chalk.red('Slow') : chalk.bold.red('Slow')
  }
}

export function colorDifficultyLevel(level: number): string {
  switch (level) {
    case 1: return _theme === 'dark' ? chalk.cyan('Beginner') : chalk.blue('Beginner')
    case 2: return _theme === 'dark' ? chalk.green('Elementary') : chalk.bold.green('Elementary')
    case 3: return _theme === 'dark' ? chalk.yellow('Intermediate') : chalk.bold.yellow('Intermediate')
    case 4: return _theme === 'dark' ? chalk.magenta('Advanced') : chalk.bold.blueBright('Advanced')
    case 5: return _theme === 'dark' ? chalk.red('Expert') : chalk.bold.red('Expert')
    default: return String(level)
  }
}

export function colorScoreDelta(delta: number): string {
  if (delta >= 0) {
    const text = `+${delta}`
    if (_theme === 'dark') return chalk.green(text)
    return chalk.bold.green(text)
  }
  if (_theme === 'dark') return chalk.red(`${delta}`)
  return chalk.bold.red(`${delta}`)
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
    await SLEEP_MS(delayMs)
  }
  process.stdout.write('\n')
}

// ---------------------------------------------------------------------------
// Branded screen utilities (shared by welcome and exit screens)
// ---------------------------------------------------------------------------

const SLEEP_MS = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export function cancellableSleep(ms: number): { promise: Promise<void>; cancel: () => void } {
  let id: NodeJS.Timeout
  const promise = new Promise<void>((resolve) => { id = setTimeout(resolve, ms) })
  return { promise, cancel: () => clearTimeout(id) }
}

export function gradientText(text: string, row: number, totalRows: number): string {
  const t = totalRows <= 1 ? 0 : row / (totalRows - 1)
  const c = lerpColor(t)
  if (chalk.level < 3) {
    return _theme === 'dark' ? chalk.bold.cyan(text) : chalk.bold.blue(text)
  }
  return chalk.bold.rgb(c.r, c.g, c.b)(text)
}

export async function typewriterPrint(text: string): Promise<void> {
  const CHAR_DELAY_MS = 30
  const BLINK_DELAY_MS = 300
  const BLINK_COUNT = 3
  const cursor = _theme === 'dark' ? chalk.magenta('_') : chalk.bold.blueBright('_')
  for (const char of text) {
    process.stdout.write((_theme === 'dark' ? chalk.dim.white(char) : chalk.gray(char)) + cursor)
    await SLEEP_MS(CHAR_DELAY_MS)
    process.stdout.write('\b \b')
  }
  process.stdout.write(cursor)
  for (let i = 0; i < BLINK_COUNT; i++) {
    await SLEEP_MS(BLINK_DELAY_MS)
    process.stdout.write('\b ')
    await SLEEP_MS(BLINK_DELAY_MS)
    process.stdout.write('\b' + cursor)
  }
  process.stdout.write('\n')
}

// Branded ASCII art used by welcome and exit screens
export const ASCII_ART = [
  ' ____            _          ____                 _    ',
  '| __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __',
  '|  _ \\| \'__/ _` | | \'_ \\   |  _ \\| \'__/ _ \\/ _` | |/ /',
  '| |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   < ',
  '|____/|_|  \\__,_|_|_| |_|  |____/|_|  \\___|\\__,_|_|\\_\\',
]

// Gradient utilities for banner and welcome screen
export const CYAN = { r: 0, g: 180, b: 200 }
export const MAGENTA = { r: 200, g: 0, b: 120 }
export const LIGHT_START = { r: 0, g: 140, b: 160 }
export const LIGHT_END = { r: 180, g: 0, b: 100 }

export function gradientStart(): { r: number; g: number; b: number } {
  return _theme === 'dark' ? CYAN : LIGHT_START
}

export function gradientEnd(): { r: number; g: number; b: number } {
  return _theme === 'dark' ? MAGENTA : LIGHT_END
}

export function lerpColor(t: number): { r: number; g: number; b: number } {
  const start = gradientStart()
  const end = gradientEnd()
  return {
    r: Math.round(start.r + (end.r - start.r) * t),
    g: Math.round(start.g + (end.g - start.g) * t),
    b: Math.round(start.b + (end.b - start.b) * t),
  }
}

export function getGradientWidth(): number {
  return Math.min(process.stdout.columns || 60, 80)
}

export function gradientBg(text: string, width: number): string {
  if (chalk.level < 3) {
    const padded = text.padEnd(width)
    return _theme === 'dark'
      ? chalk.bgCyan(chalk.bold.white(padded))
      : chalk.bgBlue(chalk.bold.white(padded))
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

// ---------------------------------------------------------------------------
// Question detail rendering (shared by quiz feedback and history views)
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function renderQuestionDetail(
  record: QuestionRecord,
  opts?: { showTimestamp?: boolean },
): void {
  for (const key of ['A', 'B', 'C', 'D'] as const) {
    const marker = key === record.userAnswer ? '►' : ' '
    console.log(`  ${marker} ${key}) ${record.options[key]}`)
  }
  console.log()
  if (record.isCorrect) {
    console.log(`${colorCorrect('✓ Correct!')} 😊 Score: ${colorScoreDelta(record.scoreDelta)}`)
  } else {
    console.log(`${colorIncorrect('✗ Incorrect')} 😞 Score: ${colorScoreDelta(record.scoreDelta)}`)
    const correctText = `${record.correctAnswer}) ${record.options[record.correctAnswer]}`
    console.log(`Correct answer: ${colorCorrect(bold(correctText))}`)
  }
  console.log(`Time: ${formatDuration(record.timeTakenMs)} | Speed: ${colorSpeedTier(record.speedTier)} | Difficulty: ${colorDifficultyLevel(record.difficultyLevel)}`)
  if (opts?.showTimestamp) {
    console.log(dim(`Answered: ${formatTimestamp(record.answeredAt)}`))
  }
}
