import { input } from '@inquirer/prompts'
import { ExitPromptError } from '@inquirer/core'
import { slugify } from '../utils/slugify.js'
import { listDomains, writeDomain } from '../domain/store.js'
import { defaultDomainFile } from '../domain/schema.js'
import { warn, success, error as errorFmt } from '../utils/format.js'
import { clearScreen } from '../utils/screen.js'

export function validateDomainName(name: string): string | true {
  if (name.trim().length === 0) return 'Domain name cannot be empty'
  const slug = slugify(name.trim())
  if (slug.length === 0) return 'Domain name must contain at least one letter or number'
  return true
}

export async function showCreateDomainScreen(): Promise<void> {
  clearScreen()
  let name: string
  try {
    name = await input({
      message: 'New domain name (Ctrl+C to go back):',
      validate: validateDomainName,
    })
  } catch (err) {
    if (err instanceof ExitPromptError) return
    throw err
  }

  const slug = slugify(name.trim())

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
}
