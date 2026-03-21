#!/usr/bin/env node
import { showHome, showProviderSetup } from './router.js'
import { readSettings } from './domain/store.js'
import { defaultSettings } from './domain/schema.js'

const settingsResult = await readSettings()
const settings = settingsResult.ok ? settingsResult.data : defaultSettings()

if (settings.provider === null) {
  await showProviderSetup(settings)
}

await showHome()
