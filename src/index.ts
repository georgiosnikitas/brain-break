#!/usr/bin/env node
import { showHome, showProviderSetup, showWelcome } from './router.js'
import { readSettings } from './domain/store.js'
import { defaultSettings } from './domain/schema.js'
import { setTheme } from './utils/format.js'
import { validateLicenseOnLaunch } from './domain/license-launch.js'

const settingsResult = await readSettings()
const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

setTheme(settings.theme)

let skippedProviderSetup = false

if (settings.provider === null) {
  skippedProviderSetup = await showProviderSetup(settings)
}

if (!skippedProviderSetup && settings.showWelcome) {
  await showWelcome()
}

const launchNotice = await validateLicenseOnLaunch()
await showHome(launchNotice)
