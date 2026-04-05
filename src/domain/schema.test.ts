import { describe, it, expect } from 'vitest'
import { DomainFileSchema, defaultDomainFile, AnswerOptionSchema, SpeedTierSchema, SettingsFileSchema, defaultSettings, AiProviderTypeSchema, QuestionRecordSchema } from './schema.js'

const validMeta = {
  score: 100,
  difficultyLevel: 3,
  startingDifficulty: 3,
  streakCount: 2,
  streakType: 'correct' as const,
  totalTimePlayedMs: 45000,
  createdAt: '2026-03-07T10:00:00.000Z',
  lastSessionAt: '2026-03-07T12:00:00.000Z',
  archived: false,
}

function parseDomain(overrides: { meta?: Record<string, unknown>; hashes?: unknown[]; history?: unknown[] } = {}) {
  return DomainFileSchema.safeParse({
    meta: overrides.meta ?? validMeta,
    hashes: overrides.hashes ?? [],
    history: overrides.history ?? [],
  })
}

const validHistory = [
  {
    question: 'What is 2+2?',
    options: { A: '3', B: '4', C: '5', D: '6' },
    correctAnswer: 'B' as const,
    userAnswer: 'B' as const,
    isCorrect: true,
    answeredAt: '2026-03-07T12:01:00.000Z',
    timeTakenMs: 3200,
    speedTier: 'fast' as const,
    scoreDelta: 60,
    difficultyLevel: 3,
  },
]

describe('DomainFileSchema', () => {
  it('accepts a valid complete domain object', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: ['abc123'],
      history: validHistory,
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty hashes and history arrays', () => {
    const result = parseDomain()
    expect(result.success).toBe(true)
  })

  it('accepts null lastSessionAt', () => {
    const result = parseDomain({ meta: { ...validMeta, lastSessionAt: null } })
    expect(result.success).toBe(true)
  })

  it('rejects missing meta.score', () => {
    const { score: _score, ...metaWithoutScore } = validMeta
    const result = parseDomain({ meta: metaWithoutScore })
    expect(result.success).toBe(false)
  })

  it('rejects invalid streakType value', () => {
    const result = parseDomain({ meta: { ...validMeta, streakType: 'winning' } })
    expect(result.success).toBe(false)
  })

  it('rejects invalid correctAnswer value (not A–D)', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], correctAnswer: 'E' }] })
    expect(result.success).toBe(false)
  })

  it('rejects invalid speedTier value', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], speedTier: 'turbo' }] })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel below 1 in meta', () => {
    const result = parseDomain({ meta: { ...validMeta, difficultyLevel: 0 } })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel above 5 in meta', () => {
    const result = parseDomain({ meta: { ...validMeta, difficultyLevel: 6 } })
    expect(result.success).toBe(false)
  })

  it('rejects startingDifficulty below 1 in meta', () => {
    const result = parseDomain({ meta: { ...validMeta, startingDifficulty: 0 } })
    expect(result.success).toBe(false)
  })

  it('rejects startingDifficulty above 5 in meta', () => {
    const result = parseDomain({ meta: { ...validMeta, startingDifficulty: 6 } })
    expect(result.success).toBe(false)
  })

  it('defaults startingDifficulty to 2 when missing (backward compat)', () => {
    const { startingDifficulty: _, ...metaWithoutStarting } = validMeta
    const result = parseDomain({ meta: metaWithoutStarting })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.meta.startingDifficulty).toBe(2)
    }
  })

  it('rejects difficultyLevel below 1 in history entry', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], difficultyLevel: 0 }] })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel above 5 in history entry', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], difficultyLevel: 6 }] })
    expect(result.success).toBe(false)
  })

  it('defaults bookmarked to false when field is missing (backward compat)', () => {
    const result = parseDomain({ history: [validHistory[0]] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.history[0].bookmarked).toBe(false)
    }
  })

  it('accepts bookmarked: true on history entry', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], bookmarked: true }] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.history[0].bookmarked).toBe(true)
    }
  })

  it('accepts bookmarked: false on history entry', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], bookmarked: false }] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.history[0].bookmarked).toBe(false)
    }
  })

  it('rejects empty question string', () => {
    const result = parseDomain({ history: [{ ...validHistory[0], question: '' }] })
    expect(result.success).toBe(false)
  })

  it('rejects non-datetime createdAt string', () => {
    const result = parseDomain({ meta: { ...validMeta, createdAt: 'not-a-date' } })
    expect(result.success).toBe(false)
  })

  it('rejects NaN score', () => {
    const result = parseDomain({ meta: { ...validMeta, score: Number.NaN } })
    expect(result.success).toBe(false)
  })

  it('rejects Infinity score', () => {
    const result = parseDomain({ meta: { ...validMeta, score: Infinity } })
    expect(result.success).toBe(false)
  })
})

describe('AnswerOptionSchema', () => {
  it('accepts A, B, C, D', () => {
    for (const v of ['A', 'B', 'C', 'D']) {
      expect(AnswerOptionSchema.safeParse(v).success).toBe(true)
    }
  })

  it('rejects E and lowercase a', () => {
    expect(AnswerOptionSchema.safeParse('E').success).toBe(false)
    expect(AnswerOptionSchema.safeParse('a').success).toBe(false)
  })
})

describe('SpeedTierSchema', () => {
  it('accepts fast, normal, slow', () => {
    for (const v of ['fast', 'normal', 'slow']) {
      expect(SpeedTierSchema.safeParse(v).success).toBe(true)
    }
  })

  it('rejects unknown tiers', () => {
    expect(SpeedTierSchema.safeParse('turbo').success).toBe(false)
    expect(SpeedTierSchema.safeParse('').success).toBe(false)
  })
})

describe('defaultDomainFile', () => {
  it('returns a valid DomainFile passing schema validation', () => {
    const d = defaultDomainFile()
    expect(() => DomainFileSchema.parse(d)).not.toThrow()
  })

  it('has score: 0', () => {
    expect(defaultDomainFile().meta.score).toBe(0)
  })

  it('has difficultyLevel: 2', () => {
    expect(defaultDomainFile().meta.difficultyLevel).toBe(2)
  })

  it('has startingDifficulty: 2', () => {
    expect(defaultDomainFile().meta.startingDifficulty).toBe(2)
  })

  it('accepts startingDifficulty parameter and sets both fields', () => {
    const d = defaultDomainFile(4)
    expect(d.meta.difficultyLevel).toBe(4)
    expect(d.meta.startingDifficulty).toBe(4)
    expect(() => DomainFileSchema.parse(d)).not.toThrow()
  })

  it('has streakCount: 0', () => {
    expect(defaultDomainFile().meta.streakCount).toBe(0)
  })

  it('has streakType: "none"', () => {
    expect(defaultDomainFile().meta.streakType).toBe('none')
  })

  it('has totalTimePlayedMs: 0', () => {
    expect(defaultDomainFile().meta.totalTimePlayedMs).toBe(0)
  })

  it('has lastSessionAt: null', () => {
    expect(defaultDomainFile().meta.lastSessionAt).toBeNull()
  })

  it('has archived: false', () => {
    expect(defaultDomainFile().meta.archived).toBe(false)
  })

  it('has empty hashes array', () => {
    expect(defaultDomainFile().hashes).toEqual([])
  })

  it('has empty history array', () => {
    expect(defaultDomainFile().history).toEqual([])
  })
})

describe('SettingsFileSchema', () => {
  it('accepts valid settings with all tone values', () => {
    for (const tone of ['natural', 'expressive', 'calm', 'humorous', 'sarcastic', 'robot', 'pirate'] as const) {
      const result = SettingsFileSchema.safeParse({ language: 'English', tone })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an invalid tone value', () => {
    const result = SettingsFileSchema.safeParse({ language: 'English', tone: 'aggressive' })
    expect(result.success).toBe(false)
  })

  it('rejects empty language string', () => {
    const result = SettingsFileSchema.safeParse({ language: '', tone: 'natural' })
    expect(result.success).toBe(false)
  })

  it('rejects missing tone field', () => {
    const result = SettingsFileSchema.safeParse({ language: 'English' })
    expect(result.success).toBe(false)
  })
})

describe('defaultSettings', () => {
  it('returns language: English', () => {
    expect(defaultSettings().language).toBe('English')
  })

  it('returns tone: natural', () => {
    expect(defaultSettings().tone).toBe('natural')
  })

  it('passes SettingsFileSchema validation', () => {
    const result = SettingsFileSchema.safeParse(defaultSettings())
    expect(result.success).toBe(true)
  })
})

describe('AiProviderTypeSchema', () => {
  it('accepts all 5 valid provider types', () => {
    for (const provider of ['copilot', 'openai', 'anthropic', 'gemini', 'ollama']) {
      expect(AiProviderTypeSchema.safeParse(provider).success).toBe(true)
    }
  })

  it('rejects invalid provider value', () => {
    expect(AiProviderTypeSchema.safeParse('grok').success).toBe(false)
    expect(AiProviderTypeSchema.safeParse('').success).toBe(false)
  })
})

describe('SettingsFileSchema — provider fields', () => {
  const validSettings = {
    provider: null as string | null,
    language: 'English',
    tone: 'natural',
    openaiModel: 'gpt-5.4',
    anthropicModel: 'claude-sonnet-4.6-latest',
    geminiModel: 'gemini-2.5-pro',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama4',
  }

  function parseSettings(overrides: Record<string, unknown> = {}) {
    return SettingsFileSchema.safeParse({ ...validSettings, ...overrides })
  }

  it('accepts full valid input with all 5 fields including null provider', () => {
    const result = parseSettings()
    expect(result.success).toBe(true)
  })

  it('accepts input with provider set to each valid provider type', () => {
    for (const provider of ['copilot', 'openai', 'anthropic', 'gemini', 'ollama'] as const) {
      const result = parseSettings({ provider })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid non-null provider value', () => {
    const result = parseSettings({ provider: 'grok' })
    expect(result.success).toBe(false)
  })

  it('fills defaults for missing provider and model fields (backward compat)', () => {
    const result = SettingsFileSchema.parse({ language: 'English', tone: 'natural' })
    expect(result.provider).toBeNull()
    expect(result.openaiModel).toBe('gpt-5.4')
    expect(result.anthropicModel).toBe('claude-opus-4-6')
    expect(result.geminiModel).toBe('gemini-2.5-pro')
    expect(result.ollamaEndpoint).toBe('http://localhost:11434')
    expect(result.ollamaModel).toBe('llama4')
  })

  it('rejects empty ollamaEndpoint string', () => {
    const result = parseSettings({ provider: 'ollama', ollamaEndpoint: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty ollamaModel string', () => {
    const result = parseSettings({ provider: 'ollama', ollamaModel: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty openaiModel string', () => {
    const result = parseSettings({ provider: 'openai', openaiModel: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty anthropicModel string', () => {
    const result = parseSettings({ provider: 'anthropic', anthropicModel: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty geminiModel string', () => {
    const result = parseSettings({ provider: 'gemini', geminiModel: '' })
    expect(result.success).toBe(false)
  })
})

describe('defaultSettings — provider fields', () => {
  it('returns provider: null', () => {
    expect(defaultSettings().provider).toBeNull()
  })

  it('returns openaiModel: gpt-5.4', () => {
    expect(defaultSettings().openaiModel).toBe('gpt-5.4')
  })

  it('returns anthropicModel: claude-opus-4-6', () => {
    expect(defaultSettings().anthropicModel).toBe('claude-opus-4-6')
  })

  it('returns geminiModel: gemini-2.5-pro', () => {
    expect(defaultSettings().geminiModel).toBe('gemini-2.5-pro')
  })

  it('returns ollamaEndpoint: http://localhost:11434', () => {
    expect(defaultSettings().ollamaEndpoint).toBe('http://localhost:11434')
  })

  it('returns ollamaModel: llama4', () => {
    expect(defaultSettings().ollamaModel).toBe('llama4')
  })

  it('returns all settings fields', () => {
    const s = defaultSettings()
    expect(Object.keys(s).sort((a, b) => a.localeCompare(b))).toEqual([
      'anthropicModel',
      'asciiArtMilestone',
      'geminiModel',
      'language',
      'ollamaEndpoint',
      'ollamaModel',
      'openaiModel',
      'provider',
      'showWelcome',
      'tone',
    ])
  })
})

describe('showWelcome setting', () => {
  it('defaults showWelcome to true in defaultSettings', () => {
    expect(defaultSettings().showWelcome).toBe(true)
  })

  it('defaults showWelcome to true when parsing empty object', () => {
    const parsed = SettingsFileSchema.parse({ language: 'English', tone: 'natural' })
    expect(parsed.showWelcome).toBe(true)
  })

  it('preserves showWelcome: false when explicitly set', () => {
    const parsed = SettingsFileSchema.parse({ ...defaultSettings(), showWelcome: false })
    expect(parsed.showWelcome).toBe(false)
  })

  it('defaults showWelcome when old settings file lacks the field', () => {
    const oldSettings = {
      provider: 'openai',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-5.4',
      anthropicModel: 'claude-opus-4-6',
      geminiModel: 'gemini-2.5-pro',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama4',
    }
    const parsed = SettingsFileSchema.parse(oldSettings)
    expect(parsed.showWelcome).toBe(true)
  })
})

describe('asciiArtMilestone setting', () => {
  it('accepts asciiArtMilestone: 0', () => {
    const parsed = SettingsFileSchema.parse({ ...defaultSettings(), asciiArtMilestone: 0 })
    expect(parsed.asciiArtMilestone).toBe(0)
  })

  it('accepts asciiArtMilestone: 10', () => {
    const parsed = SettingsFileSchema.parse({ ...defaultSettings(), asciiArtMilestone: 10 })
    expect(parsed.asciiArtMilestone).toBe(10)
  })

  it('accepts asciiArtMilestone: 100', () => {
    const parsed = SettingsFileSchema.parse({ ...defaultSettings(), asciiArtMilestone: 100 })
    expect(parsed.asciiArtMilestone).toBe(100)
  })

  it('rejects invalid asciiArtMilestone values', () => {
    expect(SettingsFileSchema.safeParse({ ...defaultSettings(), asciiArtMilestone: 50 }).success).toBe(false)
    expect(SettingsFileSchema.safeParse({ ...defaultSettings(), asciiArtMilestone: -1 }).success).toBe(false)
    expect(SettingsFileSchema.safeParse({ ...defaultSettings(), asciiArtMilestone: 'instant' }).success).toBe(false)
  })

  it('defaults asciiArtMilestone to 100 when omitted (existing users upgrading)', () => {
    const parsed = SettingsFileSchema.parse({ language: 'English', tone: 'natural' })
    expect(parsed.asciiArtMilestone).toBe(100)
  })

  it('returns asciiArtMilestone: 100 in defaultSettings()', () => {
    expect(defaultSettings().asciiArtMilestone).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// QuestionRecordSchema — userAnswer validation
// ---------------------------------------------------------------------------
describe('QuestionRecordSchema', () => {
  const validRecord = {
    question: 'What is 2+2?',
    options: { A: '3', B: '4', C: '5', D: '6' },
    correctAnswer: 'B',
    userAnswer: 'B',
    isCorrect: true,
    answeredAt: '2026-03-07T12:01:00.000Z',
    timeTakenMs: 3200,
    speedTier: 'fast',
    scoreDelta: 60,
    difficultyLevel: 3,
  }

  it('accepts TIMEOUT as a valid userAnswer', () => {
    const result = QuestionRecordSchema.safeParse({ ...validRecord, userAnswer: 'TIMEOUT', isCorrect: false })
    expect(result.success).toBe(true)
  })

  it.each(['A', 'B', 'C', 'D'] as const)('accepts %s as a valid userAnswer', (answer) => {
    const result = QuestionRecordSchema.safeParse({ ...validRecord, userAnswer: answer })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid userAnswer value', () => {
    const result = QuestionRecordSchema.safeParse({ ...validRecord, userAnswer: 'E' })
    expect(result.success).toBe(false)
  })
})
