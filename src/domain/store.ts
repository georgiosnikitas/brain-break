import { readFile, writeFile, rename, mkdir, readdir, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { DomainFileSchema, DomainFile, DomainMeta, defaultDomainFile, Result } from './schema.js'

// ---------------------------------------------------------------------------
// DomainListEntry — discriminated union to surface corrupted domains to screens
// ---------------------------------------------------------------------------
export type DomainListEntry =
  | { slug: string; meta: DomainMeta; corrupted: false }
  | { slug: string; corrupted: true }

// ---------------------------------------------------------------------------
// Data directory — overridable in tests via _setDataDir()
// ---------------------------------------------------------------------------
let DATA_DIR = join(homedir(), '.brain-break')

/** @internal — test use only */
export function _setDataDir(path: string): void {
  DATA_DIR = path
}

function domainPath(slug: string): string {
  return join(DATA_DIR, `${slug}.json`)
}

function tmpPath(slug: string): string {
  return join(DATA_DIR, `.tmp-${slug}.json`)
}

// ---------------------------------------------------------------------------
// writeDomain — atomic write-then-rename
// ---------------------------------------------------------------------------
export async function writeDomain(slug: string, domain: DomainFile): Promise<Result<void>> {
  const tmp = tmpPath(slug)
  try {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(tmp, JSON.stringify(domain, null, 2), 'utf8')
    await rename(tmp, domainPath(slug))
    return { ok: true, data: undefined }
  } catch (err) {
    try { await unlink(tmp) } catch { /* best-effort cleanup */ }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to write domain "${slug}": ${message}` }
  }
}

// ---------------------------------------------------------------------------
// readDomain — read + Zod validate; ENOENT → defaultDomainFile()
// ---------------------------------------------------------------------------
export async function readDomain(slug: string): Promise<Result<DomainFile>> {
  try {
    const raw = await readFile(domainPath(slug), 'utf8')
    const parsed = JSON.parse(raw)
    const result = DomainFileSchema.safeParse(parsed)
    if (!result.success) {
      return {
        ok: false,
        error: `Domain data for ${slug} appears corrupted and cannot be loaded. Starting fresh.`,
      }
    }
    return { ok: true, data: result.data }
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true, data: defaultDomainFile() }
    }
    return {
      ok: false,
      error: `Domain data for ${slug} appears corrupted and cannot be loaded. Starting fresh.`,
    }
  }
}

// ---------------------------------------------------------------------------
// deleteDomain — permanently remove a domain file
// ---------------------------------------------------------------------------
export async function deleteDomain(slug: string): Promise<Result<void>> {
  try {
    await unlink(domainPath(slug))
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true, data: undefined }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to delete domain "${slug}": ${message}` }
  }
}

// ---------------------------------------------------------------------------
// listDomains — all *.json files excluding .tmp-* prefixes; dir missing → []
// ---------------------------------------------------------------------------
export async function listDomains(): Promise<Result<DomainListEntry[]>> {
  try {
    const entries = await readdir(DATA_DIR)
    const results: DomainListEntry[] = []

    for (const entry of entries) {
      if (!entry.endsWith('.json') || entry.startsWith('.tmp-')) continue
      const slug = entry.slice(0, -5) // strip .json
      const readResult = await readDomain(slug)
      if (readResult.ok) {
        results.push({ slug, meta: readResult.data.meta, corrupted: false })
      } else {
        results.push({ slug, corrupted: true })
      }
    }

    return { ok: true, data: results }
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ok: true, data: [] }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to list domains: ${message}` }
  }
}
