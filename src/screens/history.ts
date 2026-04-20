import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import {
  defaultDomainFile,
} from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { buildNavChoices, navigateRecords, type NavAction } from './question-nav.js'
import * as router from '../router.js'

export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
  explainVisible?: boolean,
  teachVisible?: boolean,
  bookmarked?: boolean,
) {
  return buildNavChoices(currentIndex, totalItems, explainVisible, teachVisible, bookmarked)
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
    console.log(header(`📜 History — ${domainSlug}`))
    console.log(dim('No questions answered yet.'))
    try {
      await select<NavAction>({
        message: 'Navigation',
        choices: [
          new Separator(),
          { name: '↩️  Back', value: 'back' },
        ],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    await router.showDomainMenu(domainSlug)
    return
  }

  await navigateRecords(history, domain, domainSlug, {
    headerText: `📜 History — ${domainSlug}`,
    itemLabel: 'Question',
  })
  await router.showDomainMenu(domainSlug)
}
