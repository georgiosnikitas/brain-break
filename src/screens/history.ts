import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain, readSettings } from '../domain/store.js'
import { defaultDomainFile, defaultSettings, type QuestionRecord, type DomainFile } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { handleExplainAnswer, handleTeachMeMoreAnswer, toggleBookmark, buildNavChoices, displayEntry, selectNavAction, type NavAction } from './question-nav.js'
import * as router from '../router.js'

export { buildNavChoices as buildPageChoices } from './question-nav.js'

interface HistoryNavState {
  index: number
  explainVisible: boolean
  teachVisible: boolean
  explanationText: string | null
  skipClear: boolean
}

function resetHistoryNavState(index: number): HistoryNavState {
  return { index, explainVisible: false, teachVisible: false, explanationText: null, skipClear: false }
}

async function processHistoryNavAction(
  nav: NavAction,
  state: HistoryNavState,
  history: QuestionRecord[],
  domain: DomainFile,
  domainSlug: string,
  settings: ReturnType<typeof defaultSettings>,
): Promise<HistoryNavState> {
  if (nav === 'explain') {
    const explainResult = await handleExplainAnswer(history[state.index], settings)
    return {
      ...state,
      explainVisible: explainResult.visible,
      skipClear: explainResult.skipClear,
      explanationText: explainResult.explanationText,
      teachVisible: false,
    }
  }

  if (nav === 'teach') {
    if (state.explanationText === null) return state
    const teachResult = await handleTeachMeMoreAnswer(history[state.index], state.explanationText, settings)
    return { ...state, teachVisible: teachResult.teachShown, skipClear: teachResult.skipClear }
  }

  if (nav === 'bookmark') {
    await toggleBookmark(history[state.index], domainSlug, domain)
    return { ...state, skipClear: true }
  }

  if (nav === 'back') return state
  if (nav === 'next') return resetHistoryNavState(state.index + 1)
  if (nav === 'prev') return resetHistoryNavState(state.index - 1)

  const _exhaustive: never = nav
  return state
}

async function navigateHistory(history: QuestionRecord[], domain: DomainFile, domainSlug: string): Promise<void> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  const totalItems = history.length
  let state = resetHistoryNavState(0)

  while (true) {
    if (!state.explainVisible && !state.skipClear) {
      clearAndBanner()
      console.log(header(`📜 History — ${domainSlug}`))
      displayEntry(history[state.index])
    }
    state.skipClear = false

    const choices = buildNavChoices(
      state.index,
      totalItems,
      state.explainVisible,
      state.teachVisible,
      history[state.index].bookmarked,
    )
    const nav = await selectNavAction(`Question ${state.index + 1} of ${totalItems}`, choices)
    if (nav === null || nav === 'back') {
      await router.showDomainMenu(domainSlug)
      return
    }

    state = await processHistoryNavAction(nav, state, history, domain, domainSlug, settings)
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
    console.log(header(`📜 History — ${domainSlug}`))
    console.log(dim('No questions answered yet'))
    try {
      await select<NavAction>({
        message: 'Navigation',
        choices: [{ name: '↩️  Back', value: 'back' }],
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
