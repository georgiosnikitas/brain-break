import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateDomainName, showCreateDomainScreen } from './create-domain.js'
import { writeDomain, readDomain, listDomains, _setDataDir } from '../domain/store.js'
import { defaultDomainFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mock @inquirer/prompts so interactive prompts can be controlled in tests
// ---------------------------------------------------------------------------
const mockInput = vi.fn()

vi.mock('@inquirer/prompts', () => ({
  input: (...args: unknown[]) => mockInput(...args),
}))

// ---------------------------------------------------------------------------
// validateDomainName — pure unit tests
// ---------------------------------------------------------------------------
describe('validateDomainName', () => {
  it('returns error string for empty input', () => {
    const result = validateDomainName('')
    expect(typeof result).toBe('string')
    expect(result as string).toBeTruthy()
  })

  it('returns error string for whitespace-only input', () => {
    const result = validateDomainName('   ')
    expect(typeof result).toBe('string')
    expect(result as string).toBeTruthy()
  })

  it('returns error string when slug resolves to empty (e.g. "---")', () => {
    const result = validateDomainName('---')
    expect(typeof result).toBe('string')
    expect(result as string).toBeTruthy()
  })

  it('returns true for a valid domain name', () => {
    const result = validateDomainName('Spring Boot microservices')
    expect(result).toBe(true)
  })

  it('returns true for a single word', () => {
    expect(validateDomainName('kubernetes')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// showCreateDomainScreen — integration tests with isolated file I/O
// ---------------------------------------------------------------------------
let testDir: string

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'brain-break-create-'))
  _setDataDir(testDir)
  mockInput.mockReset()
})

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('showCreateDomainScreen', () => {
  it('creates domain file when slug is new', async () => {
    mockInput.mockResolvedValueOnce('Spring Boot microservices')

    await showCreateDomainScreen()

    const result = await readDomain('spring-boot-microservices')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(0)
    expect(result.data.meta.difficultyLevel).toBe(2)
    expect(result.data.history).toEqual([])
  })

  it('does not overwrite existing domain and warns when slug already exists', async () => {
    // Pre-create with a non-default score to detect overwrites
    const existing = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, score: 999 } }
    await writeDomain('my-topic', existing)

    mockInput.mockResolvedValueOnce('my-topic')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showCreateDomainScreen()

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    // Existing data must be preserved — score still 999, not reset to 0
    const result = await readDomain('my-topic')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.meta.score).toBe(999)
  })

  it('does not create a file when slug matches an archived domain', async () => {
    const archived = { ...defaultDomainFile(), meta: { ...defaultDomainFile().meta, archived: true } }
    await writeDomain('archived-topic', archived)

    mockInput.mockResolvedValueOnce('archived-topic')

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await showCreateDomainScreen()

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()

    // listDomains should still show exactly one entry (no duplicate written)
    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'archived-topic')).toHaveLength(1)
  })

  it('logs an error and does not write when listDomains fails', async () => {
    // Point DATA_DIR at a file to force readdir to fail with ENOTDIR → { ok: false }
    const fakePath = join(testDir, 'not-a-dir')
    await writeFile(fakePath, 'data')
    _setDataDir(fakePath)

    mockInput.mockResolvedValueOnce('new-topic')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await showCreateDomainScreen()

    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()

    // Restore real testDir and confirm no domain file was created
    _setDataDir(testDir)
    const list = await listDomains()
    expect(list.ok).toBe(true)
    if (!list.ok) return
    expect(list.data.filter((e) => e.slug === 'new-topic')).toHaveLength(0)
  })
})
