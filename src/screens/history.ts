import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain, readSettings } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
  renderQuestionDetail,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { handleExplainAnswer, handleTeachMeMoreAnswer, toggleBookmark } from './question-nav.js'
import * as router from '../router.js'

type NavAction = 'next' | 'prev' | 'back' | 'explain' | 'teach' | 'bookmark'

export function buildPageChoices(
  currentIndex: number,
  totalItems: number,
  explainVisible?: boolean,
  teachVisible?: boolean,
  bookmarked?: boolean,
): Array<{ name: string; value: NavAction } | Separator> {
  const choices: Array<{ name: string; value: NavAction } | Separator> = []
  if (!explainVisible) choices.push({ name: '💡 Explain answer', value: 'explain' })
  if (explainVisible && !teachVisible) choices.push({ name: '📚 Teach me more', value: 'teach' })
  choices.push({ name: bookmarked ? '⭐ Remove bookmark' : '💫 Bookmark', value: 'bookmark' })
  if (currentIndex < totalItems - 1) choices.push({ name: '➡️  Next question', value: 'next' })
  if (currentIndex > 0) choices.push({ name: '⬅️  Previous question', value: 'prev' })
  if (choices.length > 0) choices.push(new Separator())
  choices.push({ name: '←  Back', value: 'back' })
  return choices
}

function displayEntry(record: QuestionRecord): void {
  console.log(record.question)
  renderQuestionDetail(record, { showTimestamp: true })
}

async function selectNavAction(
  message: string,
  choices: Array<{ name: string; value: NavAction } | Separator>,
): Promise<NavAction | null> {
  try {
    return await select<NavAction>({ message, choices, theme: menuTheme })
  } catch (err) {
    if (err instanceof ExitPromptError) return null
    throw err
  }
}

async function navigateHistory(history: QuestionRecord[], domain: DomainFile, domainSlug: string): Promise<void> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  const totalItems = history.length
  let index = 0
  let explainVisible = false
  let teachVisible = false
  let explanationText: string | null = null
  let skipClear = false

  while (true) {
    if (!explainVisible && !skipClear) {
      clearAndBanner()
      console.log(header(`📜 Question History — ${domainSlug}`))
      displayEntry(history[index])
    }
    skipClear = false

    const choices = buildPageChoices(index, totalItems, explainVisible, teachVisible, history[index].bookmarked)
    const nav = await selectNavAction(`Question ${index + 1} of ${totalItems}`, choices)
    if (nav === null) {
      await router.showDomainMenu(domainSlug)
      return
    }

    if (nav === 'explain') {
      const explainResult = await handleExplainAnswer(history[index], settings)
      explainVisible = explainResult.visible
      skipClear = explainResult.skipClear
      explanationText = explainResult.explanationText
      teachVisible = false
    } else if (nav === 'teach') {
      const teachResult = await handleTeachMeMoreAnswer(history[index], explanationText!, settings)
      teachVisible = teachResult.teachShown
      skipClear = teachResult.skipClear
    } else if (nav === 'bookmark') {
      await toggleBookmark(history[index], domainSlug, domain)
      skipClear = true
    } else if (nav === 'next') {
      index++
      explainVisible = false
      teachVisible = false
      explanationText = null
    } else if (nav === 'prev') {
      index--
      explainVisible = false
      teachVisible = false
      explanationText = null
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

  await navigateHistory(history, domain, domainSlug)
}
