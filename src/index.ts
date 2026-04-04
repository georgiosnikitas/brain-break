#!/usr/bin/env node
import { showHome, showProviderSetup, showWelcome } from './router.js'
import { readSettings } from './domain/store.js'
import { defaultSettings } from './domain/schema.js'

const settingsResult = await readSettings()
const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

let skippedProviderSetup = false

if (settings.provider === null) {
  skippedProviderSetup = await showProviderSetup(settings)
}

if (!skippedProviderSetup && settings.showWelcome) {
  await showWelcome()
}

await showHome()
