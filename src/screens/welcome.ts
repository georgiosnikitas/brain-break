import { createRequire } from 'node:module'
import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import chalk from 'chalk'
import { clearScreen } from '../utils/screen.js'
import { gradientShadow, getGradientWidth, lerpColor, menuTheme } from '../utils/format.js'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

const ASCII_ART = [
  ' ____            _          ____                 _    ',
  '| __ ) _ __ __ _(_)_ __    | __ ) _ __ ___  __ _| | __',
  '|  _ \\| \'__/ _` | | \'_ \\   |  _ \\| \'__/ _ \\/ _` | |/ /',
  '| |_) | | | (_| | | | | |  | |_) | | |  __/ (_| |   < ',
  '|____/|_|  \\__,_|_|_| |_|  |____/|_|  \\___|\\__,_|_|\\_\\',
]

function gradientText(text: string, row: number, totalRows: number): string {
  const t = totalRows <= 1 ? 0 : row / (totalRows - 1)
  const c = lerpColor(t)
  if (chalk.level < 3) {
    return chalk.bold.cyan(text)
  }
  return chalk.bold.rgb(c.r, c.g, c.b)(text)
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
  console.log(`  ${chalk.bold.cyan('>')} ${chalk.bold.yellow('Train your brain, one question at a time')}${chalk.reset.bold.magenta('_')}`)
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
