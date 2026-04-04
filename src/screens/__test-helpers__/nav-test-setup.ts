/**
 * Shared test helpers for history and bookmark screen tests.
 * Centralises mock setup helpers that were previously duplicated.
 */
import { vi } from 'vitest'
import { defaultDomainFile } from '../../domain/schema.js'
import { makeSettings } from '../../__test-helpers__/factories.js'

export { makeRecord } from '../../__test-helpers__/factories.js'

/**
 * Standard beforeEach setup for nav screen tests.
 * Requires the mocked modules to already be imported in the calling scope.
 */
interface NavScreenMocks {
  mockShowDomainMenu: ReturnType<typeof vi.fn>
  mockWriteDomain: ReturnType<typeof vi.fn>
  mockReadDomain: ReturnType<typeof vi.fn>
  mockReadSettings: ReturnType<typeof vi.fn>
  mockGenerateExplanation: ReturnType<typeof vi.fn>
  mockGenerateMicroLesson: ReturnType<typeof vi.fn>
}

export function setupNavScreenBeforeEach(mocks: NavScreenMocks): void {
  const { mockShowDomainMenu, mockWriteDomain, mockReadDomain, mockReadSettings, mockGenerateExplanation, mockGenerateMicroLesson } = mocks
  vi.clearAllMocks()
  mockShowDomainMenu.mockResolvedValue(undefined)
  mockWriteDomain.mockResolvedValue({ ok: true, data: undefined })
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  mockReadSettings.mockResolvedValue({ ok: true, data: makeSettings() })
  mockGenerateExplanation.mockResolvedValue({ ok: true, data: 'Test explanation text' })
  mockGenerateMicroLesson.mockResolvedValue({ ok: true, data: 'Test micro-lesson text' })
}
