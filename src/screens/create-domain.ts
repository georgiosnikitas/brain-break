import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { slugify } from '../utils/slugify.js'
import { listDomains, readSettings, writeDomain } from '../domain/store.js'
import { defaultDomainFile, defaultSettings } from '../domain/schema.js'
import { warn, success, error as errorFmt, menuTheme } from '../utils/format.js'
import { clearAndBanner } from '../utils/screen.js'
import * as router from '../router.js'

export function validateDomainName(name: string): string | true {
  if (name.trim().length === 0) return 'Domain name cannot be empty'
  const slug = slugify(name.trim())
  if (slug.length === 0) return 'Domain name must contain at least one letter or number'
  return true
}

function duplicateDomainMessage(name: string, isArchived: boolean): string {
  return isArchived
    ? `A domain named "${name}" already exists in your archived domains.`
    : `A domain named "${name}" already exists.`
}

async function promptForUniqueDomainSlug(): Promise<string | null> {
  while (true) {
    const name = (await input({
      message: 'New domain name:',
      validate: validateDomainName,
    })).trim()

    const slug = slugify(name)

    const listResult = await listDomains()
    if (!listResult.ok) {
      console.error(errorFmt(`Failed to check existing domains: ${listResult.error}`))
      return null
    }

    const match = listResult.data.find((entry) => entry.slug === slug)
    if (!match) return slug

    console.warn(warn(duplicateDomainMessage(name, !match.corrupted && match.meta.archived)))
  }
}

export async function isCapBlocked(): Promise<boolean> {
  const settingsResult = await readSettings()
  const settings = settingsResult.ok ? settingsResult.data : defaultSettings()
  if (settings.license?.status === 'active') return false

  const listResult = await listDomains()
  if (!listResult.ok) return false

  return listResult.data.length >= 1
}

async function showCapBlockedScreen(): Promise<void> {
  clearAndBanner()
  console.log('\n  ➕ Create new domain\n')
  console.log('  ' + warn('Free version is limited to 1 domain. Activate a license to create more.') + '\n')

  let action: 'activate' | 'back'
  try {
    action = await select<'activate' | 'back'>({
      message: 'Choose an action',
      choices: [
        { name: '🔑 Activate License', value: 'activate' },
        new Separator(),
        { name: '↩️  Back', value: 'back' },
      ],
      theme: menuTheme,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }

  if (action === 'activate') {
    await router.showActivateLicense()
  }
}

export async function showCreateDomainScreen(): Promise<void> {
  if (await isCapBlocked()) {
    await showCapBlockedScreen()
    return
  }

  clearAndBanner()
  try {
    const slug = await promptForUniqueDomainSlug()
    if (!slug) return

    const difficulty = await select<number | 'back'>({
      message: 'Starting difficulty:',
      choices: [
        { name: '1 — Beginner', value: 1 },
        { name: '2 — Elementary', value: 2 },
        { name: '3 — Intermediate', value: 3 },
        { name: '4 — Advanced', value: 4 },
        { name: '5 — Expert', value: 5 },
        new Separator(),
        { name: '↩️  Back', value: 'back' as const },
      ],
      default: 2,
      theme: menuTheme,
    })

    if (difficulty === 'back') return

    const nav = await select<'save' | 'back'>({
      message: 'Navigation',
      choices: [
        new Separator(),
        { name: '💾 Save', value: 'save' as const },
        { name: '↩️  Back', value: 'back' as const },
      ],
      theme: menuTheme,
    })

    if (nav === 'back') return

    const writeResult = await writeDomain(slug, defaultDomainFile(difficulty))
    if (!writeResult.ok) {
      console.error(errorFmt(`Failed to create domain: ${writeResult.error}`))
      return
    }

    console.log(success(`Domain "${slug}" created!`))
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }
}
