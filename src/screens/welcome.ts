import { createRequire } from 'node:module'
import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import chalk from 'chalk'
import { clearScreen } from '../utils/screen.js'
import { gradientShadow, getGradientWidth, lerpColor, menuTheme } from '../utils/format.js'

const require = createRequire(import.meta.url)
// Path is relative to compiled output depth; keep in sync with tsconfig outDir
const { version } = require('../../package.json')

const TYPEWRITER_CHAR_DELAY_MS = 30
const TYPEWRITER_BLINK_DELAY_MS = 300
const TYPEWRITER_BLINK_COUNT = 3

export const TAGLINE = 'Train your brain, one question at a time'

const ASCII_ART = [
  ' ____            _          ____                 _    ',
  '| __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __',
  '|  _ \\| \'__/ _` | | \'_ \\   |  _ \\| \'__/ _ \\/ _` | |/ /',
  '| |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   < ',
  '|____/|_|  \\__,_|_|_| |_|  |____/|_|  \\___|\\__,_|_|\\_\\',
]

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function gradientText(text: string, row: number, totalRows: number): string {
  const t = totalRows <= 1 ? 0 : row / (totalRows - 1)
  const c = lerpColor(t)
  if (chalk.level < 3) { // 3 = truecolor; degrade gracefully on limited terminals
    return chalk.bold.cyan(text)
  }
  return chalk.bold.rgb(c.r, c.g, c.b)(text)
}

async function typewriterPrint(text: string): Promise<void> {
  for (const char of text) {
    process.stdout.write(chalk.dim.white(char) + chalk.bold.cyan('_'))
    await sleep(TYPEWRITER_CHAR_DELAY_MS)
    process.stdout.write('\b \b')
  }
  process.stdout.write(chalk.bold.cyan('_'))
  for (let i = 0; i < TYPEWRITER_BLINK_COUNT; i++) {
    await sleep(TYPEWRITER_BLINK_DELAY_MS)
    process.stdout.write('\b ')
    await sleep(TYPEWRITER_BLINK_DELAY_MS)
    process.stdout.write('\b' + chalk.bold.cyan('_'))
  }
  process.stdout.write('\n')
}

export async function showWelcomeScreen(): Promise<void> {
  clearScreen()

  const width = getGradientWidth()
  const versionText = `v${version}`

  const artLines = ASCII_ART.map((line, i) => gradientText(`  ${line}`, i, ASCII_ART.length))

  console.log()
  console.log(chalk.bold('  🧠🔨'))
  for (const line of artLines) {
    console.log(line)
  }
  console.log()
  process.stdout.write(`  ${chalk.bold.cyan('>')} `)
  await typewriterPrint(TAGLINE)
  console.log(`  ${chalk.dim.white(versionText)}`)
  console.log()
  console.log(gradientShadow(width))
  console.log()

  try {
    await select({
      message: ' ',
      choices: [{ value: 'continue', name: 'Press enter to continue...' }],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
    process.exit(0)
  }
}
