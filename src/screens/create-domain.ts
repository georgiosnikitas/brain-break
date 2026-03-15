import { select, input, Separator } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { slugify } from '../utils/slugify.js'
import { listDomains, writeDomain } from '../domain/store.js'
import { defaultDomainFile } from '../domain/schema.js'
import { warn, success, error as errorFmt, menuTheme } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'

export function validateDomainName(name: string): string | true {
  if (name.trim().length === 0) return 'Domain name cannot be empty'
  const slug = slugify(name.trim())
  if (slug.length === 0) return 'Domain name must contain at least one letter or number'
  return true
}

export async function showCreateDomainScreen(): Promise<void> {
  clearScreen()
  try {
    const name = (await input({
      message: 'New domain name:',
      validate: validateDomainName,
    })).trim()

    const nav = await select<'save' | 'back'>({
      message: 'Navigation',
      choices: [
        new Separator(),
        { name: '💾  Save', value: 'save' as const },
        { name: '←  Back', value: 'back' as const },
      ],
      theme: menuTheme,
    })

    if (nav === 'back') return

    const slug = slugify(name)

    const listResult = await listDomains()
    if (!listResult.ok) {
      console.error(errorFmt(`Failed to check existing domains: ${listResult.error}`))
      return
    }
    const exists = listResult.data.some((e) => e.slug === slug)
    if (exists) {
      console.warn(warn(`Domain "${slug}" already exists.`))
      return
    }

    const writeResult = await writeDomain(slug, defaultDomainFile())
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
