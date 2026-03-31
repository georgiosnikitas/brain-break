import { select } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain, readSettings } from '../domain/store.js'
import { defaultSettings, type QuestionRecord, type DomainFile } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { handleExplainAnswer, handleTeachMeMoreAnswer, toggleBookmark, buildNavChoices, displayEntry, selectNavAction, type NavAction } from './question-nav.js'
import * as router from '../router.js'

export { buildNavChoices as buildBookmarkChoices } from './question-nav.js'

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
  if (nav === 'back') return state

  // nav is now 'next' | 'prev' — refresh bookmark list after potential unbookmark
  const _exhaustive: 'next' | 'prev' = nav
  const currentRecord = state.bookmarks[state.index]
  const newBookmarks = domain.history.filter(r => r.bookmarked)
  if (newBookmarks.length === 0) {
    return { ...state, bookmarks: newBookmarks, index: 0, ...resetNavState(), skipClear: false }
  }
  const currentPosInNew = newBookmarks.indexOf(currentRecord)
  let newIndex: number
  if (nav === 'next') {
    newIndex = currentPosInNew >= 0
      ? Math.min(currentPosInNew + 1, newBookmarks.length - 1)
      : Math.min(state.index, newBookmarks.length - 1)
  } else {
    newIndex = currentPosInNew >= 0
      ? Math.max(currentPosInNew - 1, 0)
      : Math.max(state.index - 1, 0)
  }
  return { ...state, index: newIndex, bookmarks: newBookmarks, ...resetNavState(), skipClear: false }
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

    const choices = buildNavChoices(state.index, state.bookmarks.length, state.explainVisible, state.teachVisible, state.bookmarks[state.index].bookmarked)
    const nav = await selectNavAction(`Bookmark ${state.index + 1} of ${state.bookmarks.length}`, choices)
    if (nav === null || nav === 'back') {
      await router.showDomainMenu(domainSlug)
      return
    }

    state = await processNavAction(nav, state, domain, domainSlug, settings)
    if (state.bookmarks.length === 0) {
      await showEmptyBookmarksState(domainSlug)
      return
    }
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
