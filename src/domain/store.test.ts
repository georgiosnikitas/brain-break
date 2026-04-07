import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeDomain, readDomain, listDomains, deleteDomain, _setDataDir, readSettings, writeSettings, _setSettingsPath } from './store.js'
import { defaultDomainFile, DomainFile, defaultSettings } from './schema.js'

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-test-'))
  _setDataDir(testDir)
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
})

describe('writeDomain + readDomain', () => {
  it('roundtrip returns identical data', async () => {
    const domain = defaultDomainFile()
    const writeResult = await writeDomain('my-topic', domain)
    expect(writeResult.ok).toBe(true)

    const readResult = await readDomain('my-topic')
    expect(readResult.ok).toBe(true)
    if (!readResult.ok) return
    expect(readResult.data.meta.score).toBe(0)
    expect(readResult.data.meta.difficultyLevel).toBe(2)
    expect(readResult.data.hashes).toEqual([])
    expect(readResult.data.history).toEqual([])
  })

  it('persists non-default values correctly', async () => {
    const domain: DomainFile = {
      ...defaultDomainFile(),
      meta: {
        ...defaultDomainFile().meta,
        score: 250,
        difficultyLevel: 4,
        streakCount: 3,
        streakType: 'correct',
      },
      hashes: ['abc123', 'def456'],
    }
    await writeDomain('advanced-topic', domain)
    const result = await readDomain('advanced-topic')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(250)
    expect(result.data.meta.difficultyLevel).toBe(4)
    expect(result.data.hashes).toEqual(['abc123', 'def456'])
  })

  it('returns { ok: false } when write fails (tmp path is a directory)', async () => {
    // Create a directory at the tmp path to make writeFile fail with EISDIR
    await mkdir(join(testDir, '.tmp-fail-slug.json'))
    const result = await writeDomain('fail-slug', defaultDomainFile())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('fail-slug')
  })
})

describe('readDomain', () => {
  it('returns defaultDomainFile() when file does not exist (ENOENT)', async () => {
    const result = await readDomain('nonexistent-slug')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(0)
    expect(result.data.meta.difficultyLevel).toBe(2)
    expect(result.data.hashes).toEqual([])
    expect(result.data.history).toEqual([])
  })

  it('returns { ok: false } when file contains corrupted JSON', async () => {
    await writeFile(join(testDir, 'bad-domain.json'), 'not valid json {{{{')
    const result = await readDomain('bad-domain')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('bad-domain')
    expect(result.error).toContain('corrupted')
  })

  it('returns { ok: false } when JSON is valid but fails Zod validation', async () => {
    const invalid = { meta: { score: 'not-a-number' }, hashes: [], history: [] }
    await writeFile(join(testDir, 'invalid-schema.json'), JSON.stringify(invalid))
    const result = await readDomain('invalid-schema')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('invalid-schema')
    expect(result.error).toContain('corrupted')
  })
})

describe('listDomains', () => {
  it('returns empty array when data directory does not exist', async () => {
    // Point to a subdirectory that doesn't exist
    _setDataDir(join(testDir, 'does-not-exist'))
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual([])
  })

  it('returns correct slugs after writing multiple domains', async () => {
    await writeDomain('topic-a', defaultDomainFile())
    await writeDomain('topic-b', defaultDomainFile())
    await writeDomain('topic-c', defaultDomainFile())
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slugs = result.data.map((d) => d.slug).sort((a, b) => a.localeCompare(b))
    expect(slugs).toEqual(['topic-a', 'topic-b', 'topic-c'])
  })

  it('excludes .tmp- prefixed files', async () => {
    await writeDomain('real-topic', defaultDomainFile())
    // Manually create a stale .tmp- file
    await writeFile(join(testDir, '.tmp-stale.json'), JSON.stringify(defaultDomainFile()))
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slugs = result.data.map((d) => d.slug)
    expect(slugs).not.toContain('.tmp-stale')
    expect(slugs).toContain('real-topic')
  })

  it('excludes settings.json from domain list even when it exists', async () => {
    await writeDomain('real-topic', defaultDomainFile())
    // Simulate saved settings file co-existing in DATA_DIR
    await writeFile(join(testDir, 'settings.json'), JSON.stringify({ language: 'English', tone: 'natural' }))
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slugs = result.data.map((d) => d.slug)
    expect(slugs).not.toContain('settings')
    expect(slugs).toContain('real-topic')
  })

  it('returns meta for each valid domain', async () => {
    const domain: DomainFile = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 100, archived: true },
    }
    await writeDomain('archived-topic', domain)
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const entry = result.data.find((d) => d.slug === 'archived-topic')
    expect(entry).toBeDefined()
    if (!entry || entry.corrupted) return
    expect(entry.meta.score).toBe(100)
    expect(entry.meta.archived).toBe(true)
  })

  it('includes corrupted domain with corrupted: true instead of dropping it', async () => {
    await writeDomain('good-domain', defaultDomainFile())
    await writeFile(join(testDir, 'bad-domain.json'), 'not valid json')
    const result = await listDomains()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const slugs = result.data.map((d) => d.slug)
    expect(slugs).toContain('bad-domain')
    const badEntry = result.data.find((d) => d.slug === 'bad-domain')
    expect(badEntry?.corrupted).toBe(true)
    const goodEntry = result.data.find((d) => d.slug === 'good-domain')
    expect(goodEntry?.corrupted).toBe(false)
  })
})

describe('deleteDomain', () => {
  it('removes the domain file and returns ok', async () => {
    await writeDomain('to-delete', defaultDomainFile())

    const deleteResult = await deleteDomain('to-delete')
    expect(deleteResult.ok).toBe(true)

    const readResult = await readDomain('to-delete')
    expect(readResult.ok).toBe(true)
    if (!readResult.ok) return
    // File gone → defaultDomainFile() returned (ENOENT path)
    expect(readResult.data.meta.score).toBe(0)
    expect(readResult.data.history).toEqual([])
  })

  it('returns ok when file does not exist (idempotent)', async () => {
    const result = await deleteDomain('nonexistent-slug')
    expect(result.ok).toBe(true)
  })

  it('domain is no longer listed after deletion', async () => {
    await writeDomain('topic-a', defaultDomainFile())
    await writeDomain('topic-b', defaultDomainFile())

    await deleteDomain('topic-a')

    const listResult = await listDomains()
    expect(listResult.ok).toBe(true)
    if (!listResult.ok) return
    const slugs = listResult.data.map((d) => d.slug)
    expect(slugs).not.toContain('topic-a')
    expect(slugs).toContain('topic-b')
  })
})

describe('writeSettings + readSettings', () => {
  let settingsFile: string

  beforeEach(() => {
    settingsFile = join(testDir, 'settings.json')
    _setSettingsPath(settingsFile)
  })

  afterEach(() => {
    _setSettingsPath(null)
  })

  it('roundtrip returns identical settings', async () => {
    const settings = {
      provider: 'anthropic' as const,
      language: 'Greek',
      tone: 'pirate' as const,
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-3-5-haiku-latest',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
      openaiCompatibleEndpoint: '',
      openaiCompatibleModel: '',
      asciiArtMilestone: 100 as const,
      theme: 'dark' as const,
      showWelcome: true,
    }
    const writeResult = await writeSettings(settings)
    expect(writeResult.ok).toBe(true)

    const readResult = await readSettings()
    expect(readResult.ok).toBe(true)
    if (!readResult.ok) return
    expect(readResult.data).toEqual(settings)
  })

  it('ENOENT returns defaultSettings()', async () => {
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(defaultSettings())
  })

  it('uses DATA_DIR-based default settings path when _settingsPath is null', async () => {
    // Explicitly clear the override so settingsPath() falls back to join(DATA_DIR, 'settings.json')
    _setSettingsPath(null)

    const result = await readSettings()

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(defaultSettings())

    // Restore for other tests in this block
    _setSettingsPath(settingsFile)
  })

  it('corrupted JSON returns defaultSettings()', async () => {
    await writeFile(settingsFile, 'not-json', 'utf8')
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(defaultSettings())
  })

  it('Zod-invalid content returns defaultSettings()', async () => {
    await writeFile(settingsFile, JSON.stringify({ language: 'English', tone: 'aggressive' }), 'utf8')
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(defaultSettings())
  })

  it('migrates legacy tone "normal" to "natural"', async () => {
    await writeFile(settingsFile, JSON.stringify({ language: 'English', tone: 'normal' }), 'utf8')
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.tone).toBe('natural')
  })

  it('migrates legacy tone "enthusiastic" to "expressive"', async () => {
    await writeFile(settingsFile, JSON.stringify({ language: 'Greek', tone: 'enthusiastic' }), 'utf8')
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.tone).toBe('expressive')
    expect(result.data.language).toBe('Greek')
  })

  it('fills provider defaults when reading old-format settings', async () => {
    await writeFile(settingsFile, JSON.stringify({ language: 'French', tone: 'pirate' }), 'utf8')
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.language).toBe('French')
    expect(result.data.tone).toBe('pirate')
    expect(result.data.provider).toBeNull()
    expect(result.data.openaiModel).toBe('gpt-5.4')
    expect(result.data.anthropicModel).toBe('claude-opus-4-6')
    expect(result.data.geminiModel).toBe('gemini-2.5-pro')
    expect(result.data.ollamaEndpoint).toBe('http://localhost:11434')
    expect(result.data.ollamaModel).toBe('llama3.2')
  })

  it('roundtrips expanded settings with all provider fields', async () => {
    const full = {
      provider: 'openai' as const,
      language: 'Greek',
      tone: 'pirate' as const,
      openaiModel: 'gpt-5.4',
      anthropicModel: 'claude-opus-4-6',
      geminiModel: 'gemini-2.5-pro',
      ollamaEndpoint: 'http://custom:1234',
      ollamaModel: 'mistral',
      openaiCompatibleEndpoint: '',
      openaiCompatibleModel: '',
      asciiArtMilestone: 100 as const,
      theme: 'dark' as const,
      showWelcome: true,
    }
    const writeResult = await writeSettings(full)
    expect(writeResult.ok).toBe(true)

    const readResult = await readSettings()
    expect(readResult.ok).toBe(true)
    if (!readResult.ok) return
    expect(readResult.data).toEqual(full)
  })

  it('returns { ok: false } and cleans up when writeSettings fails (tmp path is a directory)', async () => {
    // Create a directory at the .tmp path so writeFile fails with EISDIR
    const { join: pathJoin, dirname } = await import('node:path')
    await mkdir(pathJoin(dirname(settingsFile), '.tmp-settings.json'))

    const result = await writeSettings(defaultSettings())

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('Failed to write settings')
  })
})
