import { showHomeScreen } from './screens/home.js'
import { showCreateDomainScreen } from './screens/create-domain.js'
import { showSelectDomainScreen } from './screens/select-domain.js'
import { showArchivedScreen } from './screens/archived.js'
import { showHistory as showHistoryScreen } from './screens/history.js'
import { showStats as showStatsScreen } from './screens/stats.js'
import { showDomainMenuScreen } from './screens/domain-menu.js'
import { showSettingsScreen } from './screens/settings.js'
import { showProviderSetupScreen } from './screens/provider-setup.js'
import { showWelcomeScreen } from './screens/welcome.js'
import { showExitScreen } from './screens/exit.js'
import { readDomain, writeDomain, deleteDomain as deleteDomainStore } from './domain/store.js'
import { warn, error as errorFmt } from './utils/format.js'
import type { SettingsFile, SessionData } from './domain/schema.js'

export async function showHome(): Promise<void> {
  await showHomeScreen()
}

export async function showQuiz(slug: string): Promise<SessionData | null> {
  return await showSelectDomainScreen(slug)
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

export async function showStats(slug: string): Promise<void> {
  await showStatsScreen(slug)
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

export async function showProviderSetup(settings: SettingsFile): Promise<void> {
  await showProviderSetupScreen(settings)
}

export async function showWelcome(): Promise<void> {
  await showWelcomeScreen()
}

export async function showExit(totalQuestions: number): Promise<void> {
  await showExitScreen(totalQuestions)
}
