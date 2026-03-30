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

export function buildBookmarkChoices(
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

async function showEmptyBookmarksState(domainSlug: string): Promise<void> {
  clearAndBanner()
  console.log(header(`⭐ Bookmarks — ${domainSlug}`))
  console.log(dim('No bookmarked questions.'))
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
}

function resetNavState(): { explainVisible: boolean; teachVisible: boolean; explanationText: string | null } {
  return { explainVisible: false, teachVisible: false, explanationText: null }
}

interface NavState {
  index: number
  explainVisible: boolean
  teachVisible: boolean
  explanationText: string | null
  skipClear: boolean
  bookmarks: QuestionRecord[]
}

async function processNavAction(
  nav: NavAction,
  state: NavState,
  domain: DomainFile,
  domainSlug: string,
  settings: ReturnType<typeof defaultSettings>,
): Promise<NavState> {
  if (nav === 'explain') {
    const result = await handleExplainAnswer(state.bookmarks[state.index], settings)
    return { ...state, explainVisible: result.visible, skipClear: result.skipClear, explanationText: result.explanationText, teachVisible: false }
  }
  if (nav === 'teach') {
    if (!state.explanationText) return state
    const result = await handleTeachMeMoreAnswer(state.bookmarks[state.index], state.explanationText, settings)
    return { ...state, teachVisible: result.teachShown, skipClear: result.skipClear }
  }
  if (nav === 'bookmark') {
    await toggleBookmark(state.bookmarks[state.index], domainSlug, domain)
    return { ...state, skipClear: true }
  }
  const newIndex = nav === 'next' ? state.index + 1 : state.index - 1
  return { ...state, index: newIndex, ...resetNavState(), skipClear: false }
}

async function navigateBookmarks(bookmarks: QuestionRecord[], domain: DomainFile, domainSlug: string): Promise<void> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  let state: NavState = { index: 0, explainVisible: false, teachVisible: false, explanationText: null, skipClear: false, bookmarks }

  while (true) {
    if (!state.explainVisible && !state.skipClear) {
      clearAndBanner()
      console.log(header(`⭐ Bookmarks — ${domainSlug}`))
      displayEntry(state.bookmarks[state.index])
    }
    state.skipClear = false

    const choices = buildBookmarkChoices(state.index, state.bookmarks.length, state.explainVisible, state.teachVisible, state.bookmarks[state.index].bookmarked)
    const nav = await selectNavAction(`Bookmark ${state.index + 1} of ${state.bookmarks.length}`, choices)
    if (nav === null || nav === 'back') {
      await router.showDomainMenu(domainSlug)
      return
    }

    state = await processNavAction(nav, state, domain, domainSlug, settings)
  }
}

export async function showBookmarks(domainSlug: string): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
    await router.showDomainMenu(domainSlug)
    return
  }
  const domain = readResult.data
  // Bookmarks is a filtered view — elements are references into domain.history.
  // Un-bookmarked items remain navigable in the current session but disappear on re-entry.
  const bookmarks = domain.history.filter(r => r.bookmarked)

  if (bookmarks.length === 0) {
    await showEmptyBookmarksState(domainSlug)
    return
  }

  await navigateBookmarks(bookmarks, domain, domainSlug)
}
