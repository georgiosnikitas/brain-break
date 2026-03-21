/**
 * Router + Store integration regression tests.
 *
 * These use a real temporary file system (via _setDataDir) to exercise the
 * full read → transform → write chain inside router.ts.  They verify that
 * archiveDomain and deleteDomain produce the correct persistent on-disk state,
 * catching any accidental breakage to the router → store wiring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Prevent the CJS/ESM issue caused by the transitive import chain:
// router → screens/quiz → ai/client → @github/copilot-sdk
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

import { writeDomain, readDomain, listDomains, _setDataDir, readSettings, writeSettings, _setSettingsPath } from './domain/store.js'
import { defaultDomainFile, defaultSettings } from './domain/schema.js'
import { archiveDomain, deleteDomain } from './router.js'

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-regression-'))
  _setDataDir(testDir)
  _setSettingsPath(join(testDir, 'settings.json'))
})

afterEach(async () => {
  _setSettingsPath(null)
  await rm(testDir, { recursive: true, force: true })
})

// ===========================================================================
// archiveDomain
// ===========================================================================
describe('archiveDomain — router + store integration', () => {
  it('sets archived:true on disk without altering other meta fields', async () => {
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 120, difficultyLevel: 4 },
    }
    await writeDomain('my-topic', domain)

    await archiveDomain('my-topic')

    const result = await readDomain('my-topic')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.archived).toBe(true)
    expect(result.data.meta.score).toBe(120)
    expect(result.data.meta.difficultyLevel).toBe(4)
  })

  it('archiving is idempotent — calling it twice keeps archived:true', async () => {
    await writeDomain('idempotent-test', defaultDomainFile())

    await archiveDomain('idempotent-test')
    await archiveDomain('idempotent-test')

    const result = await readDomain('idempotent-test')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.archived).toBe(true)
  })
})

// ===========================================================================
// deleteDomain
// ===========================================================================
describe('deleteDomain — router + store integration', () => {
  it('removes the domain from the list of known domains', async () => {
    await writeDomain('to-delete', defaultDomainFile())

    const before = await listDomains()
    expect(before.ok).toBe(true)
    if (!before.ok) return
    expect(before.data.some((e) => e.slug === 'to-delete')).toBe(true)

    await deleteDomain('to-delete')

    const after = await listDomains()
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.data.some((e) => e.slug === 'to-delete')).toBe(false)
  })

  it('does not throw when the domain file does not exist', async () => {
    await expect(deleteDomain('nonexistent-slug')).resolves.toBeUndefined()
  })
})

// ===========================================================================
// Settings persistence + tone migration
// ===========================================================================
describe('settings persistence — router + store integration', () => {
  it('roundtrips settings with all fields intact', async () => {
    const settings = { ...defaultSettings(), provider: 'openai' as const, language: 'French', tone: 'pirate' as const }
    await writeSettings(settings)

    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(settings)
  })

  it('migrates legacy "normal" tone to "natural" on read', async () => {
    const { writeFile } = await import('node:fs/promises')
    const legacy = { provider: 'copilot', language: 'English', tone: 'normal', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }
    await writeFile(join(testDir, 'settings.json'), JSON.stringify(legacy), 'utf8')

    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.tone).toBe('natural')
  })

  it('migrates legacy "enthusiastic" tone to "expressive" on read', async () => {
    const { writeFile } = await import('node:fs/promises')
    const legacy = { provider: 'copilot', language: 'English', tone: 'enthusiastic', ollamaEndpoint: 'http://localhost:11434', ollamaModel: 'llama3' }
    await writeFile(join(testDir, 'settings.json'), JSON.stringify(legacy), 'utf8')

    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.tone).toBe('expressive')
  })

  it('returns defaults when settings file is missing', async () => {
    const result = await readSettings()
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data).toEqual(defaultSettings())
  })
})

// ===========================================================================
// Multi-domain isolation
// ===========================================================================
describe('multi-domain isolation — router + store integration', () => {
  it('writing one domain does not affect another', async () => {
    const domainA = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, score: 100 } }
    const domainB = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, score: 200 } }

    await writeDomain('domain-a', domainA)
    await writeDomain('domain-b', domainB)

    const resultA = await readDomain('domain-a')
    const resultB = await readDomain('domain-b')
    expect(resultA.ok && resultA.data.meta.score).toBe(100)
    expect(resultB.ok && resultB.data.meta.score).toBe(200)
  })

  it('deleting one domain leaves others intact', async () => {
    await writeDomain('keep-me', defaultDomainFile())
    await writeDomain('delete-me', defaultDomainFile())

    await deleteDomain('delete-me')

    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.map((e) => e.slug)).toEqual(['keep-me'])
  })

  it('archiving one domain does not archive siblings', async () => {
    await writeDomain('active-domain', defaultDomainFile())
    await writeDomain('archived-domain', defaultDomainFile())

    await archiveDomain('archived-domain')

    const active = await readDomain('active-domain')
    const archived = await readDomain('archived-domain')
    expect(active.ok && active.data.meta.archived).toBe(false)
    expect(archived.ok && archived.data.meta.archived).toBe(true)
  })
})

// ===========================================================================
// Corrupted domain resilience
// ===========================================================================
describe('corrupted domain handling — store integration', () => {
  it('listDomains marks corrupted files and keeps valid ones', async () => {
    const { writeFile } = await import('node:fs/promises')
    await writeDomain('valid-topic', defaultDomainFile())
    await writeFile(join(testDir, 'broken.json'), '{ not valid json !!!', 'utf8')

    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return

    const valid = list.data.find((e) => e.slug === 'valid-topic')
    const broken = list.data.find((e) => e.slug === 'broken')
    expect(valid).toBeDefined()
    expect(valid!.corrupted).toBe(false)
    expect(broken).toBeDefined()
    expect(broken!.corrupted).toBe(true)
  })

  it('readDomain returns error for schema-invalid JSON', async () => {
    const { writeFile } = await import('node:fs/promises')
    await writeFile(join(testDir, 'bad-schema.json'), JSON.stringify({ meta: 'wrong' }), 'utf8')

    const result = await readDomain('bad-schema')
    expect(result.ok).toBe(false)
  })
})
