import { select } from '@inquirer/prompts'
import { ExitPromptError, AbortPromptError } from '@inquirer/core'
import { renderBrandedScreen } from '../utils/screen.js'
import { cancellableSleep, menuTheme } from '../utils/format.js'

export const TAGLINE = 'Train your brain, one question at a time'

const AUTO_EXIT_MS = 3000

export async function showWelcomeScreen(): Promise<void> {
  await renderBrandedScreen(TAGLINE)

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
