import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { renderBrandedScreen } from '../utils/screen.js'
import { cancellableSleep, menuTheme } from '../utils/format.js'

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
  const exitMessage = getExitMessage(totalQuestions)
  await renderBrandedScreen(exitMessage)

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
