import { createRequire } from 'node:module'
import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { clearScreen } from '../utils/screen.js'
import { ASCII_ART, gradientShadow, getGradientWidth, cancellableSleep, gradientText, typewriterPrint, menuTheme } from '../utils/format.js'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

const AUTO_EXIT_MS = 3000

export function getExitMessage(totalQuestions: number): string {
  const q = totalQuestions === 1 ? 'question' : 'questions'
  if (totalQuestions === 0) return "Break's over, see you next round"
  if (totalQuestions < 10) return `${totalQuestions} ${q} smashed, not bad for a break`
  if (totalQuestions < 50) return `${totalQuestions} ${q}? Your brain's showing off`
  if (totalQuestions < 100) return `${totalQuestions} ${q} deep, absolute brain breaker`
  return `${totalQuestions} ${q} mastered, certified brain breaker`
}

export async function showExitScreen(totalQuestions: number): Promise<void> {
  clearScreen()

  const width = getGradientWidth()
  const versionText = `v${version}`
  const exitMessage = getExitMessage(totalQuestions)
  const artLines = ASCII_ART.map((line, i) => gradientText(`  ${line}`, i, ASCII_ART.length))

  console.log()
  console.log(`  🧠🔨`)
  for (const line of artLines) {
    console.log(line)
  }
  console.log()
  process.stdout.write(`  > `)
  await typewriterPrint(exitMessage)
  console.log(`  ${versionText}`)
  console.log()
  console.log(gradientShadow(width))
  console.log()

  const { promise: sleepPromise, cancel: cancelSleep } = cancellableSleep(AUTO_EXIT_MS)
  try {
    await Promise.race([
      sleepPromise,
      select({
        message: ' ',
        choices: [{ value: 'exit-now', name: 'Press enter to exit now...' }],
        theme: menuTheme,
      }),
    ])
    cancelSleep()
    process.exit(0)
  } catch (err) {
    cancelSleep()
    if (!(err instanceof ExitPromptError)) throw err
    process.exit(0)
  }
}
