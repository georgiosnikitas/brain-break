import { select, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import ora from 'ora'
import { showHomeScreen } from './screens/home.js'
import { showCreateDomainScreen } from './screens/create-domain.js'
import { showSelectDomainScreen } from './screens/select-domain.js'
import { showArchivedScreen } from './screens/archived.js'
import { showHistory as showHistoryScreen } from './screens/history.js'
import { showBookmarks as showBookmarksScreen } from './screens/bookmarks.js'
import { showStats as showStatsScreen } from './screens/stats.js'
import { showDomainMenuScreen } from './screens/domain-menu.js'
import { showSprintSetup } from './screens/sprint-setup.js'
import { showChallengeExecution } from './screens/challenge.js'
import { showAsciiArtScreen } from './screens/ascii-art.js'
import { showMyCoachScreen } from './screens/my-coach.js'
import { showSettingsScreen } from './screens/settings.js'
import { showProviderSetupScreen } from './screens/provider-setup.js'
import { showWelcomeScreen } from './screens/welcome.js'
import { showExitScreen } from './screens/exit.js'
import { readDomain, writeDomain, deleteDomain as deleteDomainStore, readSettings } from './domain/store.js'
import { defaultDomainFile, defaultSettings } from './domain/schema.js'
import { preloadQuestions } from './ai/client.js'
import { warn, error as errorFmt, colorIncorrect, menuTheme } from './utils/format.js'
import type { SettingsFile, SessionData } from './domain/schema.js'
import type { LaunchNotice } from './domain/license-launch.js'

export async function showHome(launchNotice: LaunchNotice | null = null): Promise<void> {
  await showHomeScreen(launchNotice)
}

export async function showQuiz(slug: string): Promise<SessionData | null> {
  return await showSelectDomainScreen(slug)
}

export async function showChallenge(slug: string): Promise<SessionData | null> {
  const config = await showSprintSetup(slug)
  if (config === null) {
    return null
  }

  const domainResult = await readDomain(slug)
  const domain = domainResult.ok ? domainResult.data : defaultDomainFile()

  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

  const spinner = ora(`Generating questions (0/${config.questionCount})...`).start()

  const preloadResult = await preloadQuestions(
    config.questionCount,
    slug,
    domain.meta.difficultyLevel,
    new Set(domain.hashes),
    settings,
    (generated, total) => {
      spinner.text = `Generating questions (${generated}/${total})...`
    },
  )

  if (!preloadResult.ok) {
    spinner.stop()
    console.error(colorIncorrect(preloadResult.error))
    try {
      await select({
        message: 'Something went wrong',
        choices: [new Separator(), { name: '↩️  Back', value: 'back' as const }],
        theme: menuTheme,
      })
    } catch (err) {
      if (!(err instanceof ExitPromptError)) throw err
    }
    return null
  }

  spinner.stop()
  return await showChallengeExecution(slug, config, preloadResult.data)
}

export async function showCreateDomain(): Promise<void> {
  await showCreateDomainScreen()
}

export async function showArchived(): Promise<void> {
  await showArchivedScreen()
}

export async function archiveDomain(slug: string): Promise<void> {
  const result = await readDomain(slug)
  if (!result.ok) {
    console.warn(warn(result.error))
    return
  }
  const updated = { ...result.data, meta: { ...result.data.meta, archived: true } }
  const writeResult = await writeDomain(slug, updated)
  if (!writeResult.ok) {
    console.error(errorFmt(`Failed to archive domain: ${writeResult.error}`))
  }
}

export async function showHistory(slug: string): Promise<void> {
  await showHistoryScreen(slug)
}

export async function showBookmarks(slug: string): Promise<void> {
  await showBookmarksScreen(slug)
}

export async function showStats(slug: string): Promise<void> {
  await showStatsScreen(slug)
}

export async function showAsciiArt(slug: string, correctCount: number, threshold: number): Promise<void> {
  await showAsciiArtScreen(slug, correctCount, threshold)
}

export async function showMyCoach(slug: string): Promise<void> {
  await showMyCoachScreen(slug)
}

export async function deleteDomain(slug: string): Promise<void> {
  const result = await deleteDomainStore(slug)
  if (!result.ok) {
    console.error(errorFmt(`Failed to delete domain: ${result.error}`))
  }
}

export async function showDomainMenu(slug: string, sessionData?: SessionData | null): Promise<void> {
  await showDomainMenuScreen(slug, sessionData)
}

export async function showSettings(): Promise<void> {
  await showSettingsScreen()
}

export async function showProviderSetup(settings: SettingsFile): Promise<boolean> {
  return await showProviderSetupScreen(settings)
}

export async function showWelcome(): Promise<void> {
  await showWelcomeScreen()
}

export async function showExit(totalQuestions: number): Promise<void> {
  await showExitScreen(totalQuestions)
}
