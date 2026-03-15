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

import { writeDomain, readDomain, listDomains, _setDataDir } from './domain/store.js'
import { defaultDomainFile } from './domain/schema.js'
import { archiveDomain, deleteDomain } from './router.js'

let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-regression-'))
  _setDataDir(testDir)
})

afterEach(async () => {
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
