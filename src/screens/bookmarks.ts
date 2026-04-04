import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { readDomain } from '../domain/store.js'
import { type QuestionRecord, type DomainFile } from '../domain/schema.js'
import {
  warn,
  dim,
  header,
  menuTheme,
} from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import { buildNavChoices, navigateRecords, type NavAction } from './question-nav.js'
import * as router from '../router.js'

export { buildNavChoices as buildBookmarkChoices } from './question-nav.js'

function getBookmarkedHistory(domain: DomainFile): QuestionRecord[] {
  return [...domain.history].reverse().filter(record => record.bookmarked)
}

async function showEmptyBookmarksState(domainSlug: string): Promise<void> {
  clearAndBanner()
  console.log(header(`⭐ Bookmarks — ${domainSlug}`))
  try {
    await select<NavAction>({
      message: 'Navigation',
      choices: [
        new Separator(dim('No bookmarked questions.')),
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (!(err instanceof ExitPromptError)) throw err
  }
  await router.showDomainMenu(domainSlug)
}

export async function showBookmarks(domainSlug: string): Promise<void> {
  const readResult = await readDomain(domainSlug)
  if (!readResult.ok) {
    console.warn(warn(readResult.error))
    await router.showDomainMenu(domainSlug)
    return
  }
  const domain = readResult.data
  const bookmarks = getBookmarkedHistory(domain)

  if (bookmarks.length === 0) {
    await showEmptyBookmarksState(domainSlug)
    return
  }

  const result = await navigateRecords(bookmarks, domain, domainSlug, {
    headerText: `⭐ Bookmarks — ${domainSlug}`,
    itemLabel: 'Bookmark',
    onNavigate: (currentIndex, direction, currentRecord, domain) => {
      const newBookmarks = getBookmarkedHistory(domain)
      if (newBookmarks.length === 0) return null
      const currentPosInNew = newBookmarks.indexOf(currentRecord)
      let newIndex: number
      if (direction === 'next') {
        newIndex = currentPosInNew >= 0
          ? Math.min(currentPosInNew + 1, newBookmarks.length - 1)
          : Math.min(currentIndex, newBookmarks.length - 1)
      } else {
        newIndex = currentPosInNew >= 0
          ? Math.max(currentPosInNew - 1, 0)
          : Math.max(currentIndex - 1, 0)
      }
      return { records: newBookmarks, newIndex }
    },
  })

  if (result === 'exhausted') {
    await showEmptyBookmarksState(domainSlug)
    return
  }
  await router.showDomainMenu(domainSlug)
}
