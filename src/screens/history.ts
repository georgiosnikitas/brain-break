import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { defaultDomainFile, type QuestionRecord } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
  renderQuestionDetail,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

type NavAction = 'next' | 'prev' | 'back'

export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (currentIndex > 0) choices.push({ name: '⬅️  Previous', value: 'prev' })
  if (currentIndex < totalItems - 1) choices.push({ name: '➡️  Next', value: 'next' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '←  Back', value: 'back' })
  return choices
}

function displayEntry(record: QuestionRecord): void {
  console.log(record.question)
  renderQuestionDetail(record, { showTimestamp: true })
}

async function navigateHistory(history: QuestionRecord[], domainSlug: string): Promise<void> {
  const totalItems = history.length
  let index = 0

  while (true) {
    clearAndBanner()
    console.log(header(`📜 Question History — ${domainSlug}`))
    displayEntry(history[index])

    const choices = buildPageChoices(index, totalItems)
    let nav: NavAction
    try {
      nav = await select<NavAction>({
        message: `Question ${index + 1} of ${totalItems}`,
        choices,
        theme: menuTheme,
      })
    } catch (err) {
      if (err instanceof ExitPromptError) {
        await router.showDomainMenu(domainSlug)
        return
      }
      throw err
    }

    if (nav === 'next') {
      index++
    } else if (nav === 'prev') {
      index--
    } else {
      await router.showDomainMenu(domainSlug)
      return
    }
  }
}

export async function showHistory(domainSlug: string): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
  }
  const domain = readResult.ok ? readResult.data : defaultDomainFile()
  const history = [...domain.history].reverse()

  if (history.length === 0) {
    clearAndBanner()
    console.log(header(`📜 Question History — ${domainSlug}`))
    console.log(dim('No questions answered yet'))
    try {
      await select<NavAction>({
        message: 'Navigation',
        choices: [{ name: '←  Back', value: 'back' }],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    await router.showDomainMenu(domainSlug)
    return
  }

  await navigateHistory(history, domainSlug)
}
