import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExitPromptError } from '@inquirer/core'
import { defaultDomainFile } from '../domain/schema.js'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@github/copilot-sdk', () => ({ CopilotClient: vi.fn(), approveAll: vi.fn() }))

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  Separator: vi.fn(),
}))

vi.mock('../domain/store.js', () => ({
  readDomain: vi.fn(),
}))

vi.mock('../router.js', () => ({
  showQuiz: vi.fn(),
  showHistory: vi.fn(),
  showStats: vi.fn(),
  archiveDomain: vi.fn(),
  showHome: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------
import { select } from '@inquirer/prompts'
import { readDomain } from '../domain/store.js'
import * as router from '../router.js'
import { buildDomainMenuChoices, showDomainMenuScreen } from './domain-menu.js'

const mockSelect = vi.mocked(select)
const mockReadDomain = vi.mocked(readDomain)

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockReadDomain.mockResolvedValue({ ok: true, data: defaultDomainFile() })
  vi.mocked(router.showQuiz).mockResolvedValue(undefined)
  vi.mocked(router.showHistory).mockResolvedValue(undefined)
  vi.mocked(router.showStats).mockResolvedValue(undefined)
  vi.mocked(router.archiveDomain).mockResolvedValue(undefined)
  vi.mocked(router.showHome).mockResolvedValue(undefined)
})

// ---------------------------------------------------------------------------
// buildDomainMenuChoices
// ---------------------------------------------------------------------------
describe('buildDomainMenuChoices', () => {
  it('returns exactly 5 items with no Separators', () => {
    const choices = buildDomainMenuChoices()
    expect(choices).toHaveLength(5)
  })

  it('names contain Play, History, Stats, Archive, Back in order', () => {
    const choices = buildDomainMenuChoices()
    expect(choices[0].name).toContain('Play')
    expect(choices[1].name).toContain('History')
    expect(choices[2].name).toContain('Stats')
    expect(choices[3].name).toContain('Archive')
    expect(choices[4].name).toContain('Back')
  })

  it('action values are play, history, stats, archive, back in order', () => {
    const choices = buildDomainMenuChoices()
    expect(choices[0].value).toEqual({ action: 'play' })
    expect(choices[1].value).toEqual({ action: 'history' })
    expect(choices[2].value).toEqual({ action: 'stats' })
    expect(choices[3].value).toEqual({ action: 'archive' })
    expect(choices[4].value).toEqual({ action: 'back' })
  })
})

// ---------------------------------------------------------------------------
// showDomainMenuScreen
// ---------------------------------------------------------------------------
describe('showDomainMenuScreen — Play', () => {
  it('calls router.showQuiz with the correct slug on play', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'play' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showQuiz)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — History', () => {
  it('calls router.showHistory with the correct slug on history', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'history' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHistory)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — Stats', () => {
  it('calls router.showStats with the correct slug on stats', async () => {
    mockSelect
      .mockResolvedValueOnce({ action: 'stats' })
      .mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showStats)).toHaveBeenCalledWith('typescript')
  })
})

describe('showDomainMenuScreen — Archive', () => {
  it('calls router.archiveDomain then router.showHome on archive', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'archive' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.archiveDomain)).toHaveBeenCalledWith('typescript')
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — Back', () => {
  it('calls router.showHome on back', async () => {
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — ExitPromptError', () => {
  it('calls router.showHome when ExitPromptError is thrown', async () => {
    mockSelect.mockRejectedValueOnce(new ExitPromptError())

    await showDomainMenuScreen('typescript')

    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
  })
})

describe('showDomainMenuScreen — readDomain failure', () => {
  it('falls back to defaultDomainFile and logs warning when readDomain fails', async () => {
    mockReadDomain.mockResolvedValue({ ok: false, error: 'file not found' })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(vi.mocked(router.showHome)).toHaveBeenCalledOnce()
    warnSpy.mockRestore()
  })
})

describe('showDomainMenuScreen — message', () => {
  it('message includes slug, score, and question count', async () => {
    const domain = {
      ...defaultDomainFile(),
      meta: { ...defaultDomainFile().meta, score: 250 },
      history: Array.from({ length: 15 }, () => ({
        question: 'Q',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'A' as const,
        userAnswer: 'A' as const,
        isCorrect: true,
        answeredAt: new Date().toISOString(),
        timeTakenMs: 1000,
        speedTier: 'fast' as const,
        scoreDelta: 10,
        difficultyLevel: 2,
      })),
    }
    mockReadDomain.mockResolvedValue({ ok: true, data: domain })
    mockSelect.mockResolvedValueOnce({ action: 'back' })

    await showDomainMenuScreen('typescript')

    const callArgs = mockSelect.mock.calls[0][0] as { message: string }
    expect(callArgs.message).toContain('typescript')
    expect(callArgs.message).toContain('250')
    expect(callArgs.message).toContain('15')
  })
})
