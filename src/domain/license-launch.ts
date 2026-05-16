import ora from 'ora'
import { validateLicense } from './license-client.js'
import { readSettings, writeSettings } from './store.js'
import type { SettingsFile } from './schema.js'

export type LaunchNotice = 'revoked' | 'offline'

export async function validateLicenseOnLaunch(): Promise<LaunchNotice | null> {
  let spinner: ReturnType<typeof ora> | null = null

  try {
    const initial = await readSettings()
    if (!initial.ok || initial.data.license?.status !== 'active') {
      return null
    }

    const { key, instanceId } = initial.data.license
    spinner = ora('Checking license…').start()

    const result = await validateLicense(key, instanceId, AbortSignal.timeout(2000))
    spinner.stop()
    spinner = null

    if (!result.ok) {
      return 'offline'
    }

    if (result.data.valid) {
      return null
    }

    const fresh = await readSettings()
    if (fresh.ok && fresh.data.license?.status === 'active') {
      const updated: SettingsFile = {
        ...fresh.data,
        license: { ...fresh.data.license, status: 'inactive' },
      }
      await writeSettings(updated)
    }

    return 'revoked'
  } catch {
    spinner?.stop()
    return 'offline'
  }
}
