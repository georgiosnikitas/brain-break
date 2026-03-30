import { createRequire } from 'node:module'
import { select } from '@inquirer/prompts'
import { ExitPromptError, AbortPromptError } from '@inquirer/core'
import { clearScreen } from '../utils/screen.js'
import { ASCII_ART, gradientShadow, getGradientWidth, cancellableSleep, gradientText, typewriterPrint, menuTheme } from '../utils/format.js'

const require = createRequire(import.meta.url)
// Path is relative to compiled output depth; keep in sync with tsconfig outDir
const { version } = require('../../package.json')

export const TAGLINE = 'Train your brain, one question at a time'

const AUTO_EXIT_MS = 3000

export async function showWelcomeScreen(): Promise<void> {
  clearScreen()

  const width = getGradientWidth()
  const versionText = `v${version}`

  const artLines = ASCII_ART.map((line, i) => gradientText(`  ${line}`, i, ASCII_ART.length))

  console.log()
  console.log(`  🧠🔨`)
  for (const line of artLines) {
    console.log(line)
  }
  console.log()
  process.stdout.write(`  > `)
  await typewriterPrint(TAGLINE)
  console.log(`  ${versionText}`)
  console.log()
  console.log(gradientShadow(width))
  console.log()

  const abortController = new AbortController()
  const { promise: sleepPromise, cancel: cancelSleep } = cancellableSleep(AUTO_EXIT_MS)
  const promptPromise = select({
    message: ' ',
    choices: [{ value: 'continue', name: 'Press enter to continue...' }],
    theme: menuTheme,
  }, { signal: abortController.signal }).catch((e: unknown) => {
    if (!(e instanceof AbortPromptError)) throw e
  })

  try {
    await Promise.race([sleepPromise, promptPromise])
    cancelSleep()
    abortController.abort()
  } catch (err) {
    cancelSleep()
    abortController.abort()
    if (!(err instanceof ExitPromptError)) throw err
    process.exit(0)
  }
}
