import { describe, it, expect } from 'vitest'
import { DomainFileSchema, defaultDomainFile, AnswerOptionSchema, SpeedTierSchema, SettingsFileSchema, defaultSettings, AiProviderTypeSchema } from './schema.js'

const validMeta = {
  score: 100,
  difficultyLevel: 3,
  streakCount: 2,
  streakType: 'correct' as const,
  totalTimePlayedMs: 45000,
  createdAt: '2026-03-07T10:00:00.000Z',
  lastSessionAt: '2026-03-07T12:00:00.000Z',
  archived: false,
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
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts null lastSessionAt', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, lastSessionAt: null },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing meta.score', () => {
    const { score: _score, ...metaWithoutScore } = validMeta
    const result = DomainFileSchema.safeParse({
      meta: metaWithoutScore,
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid streakType value', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, streakType: 'winning' },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid correctAnswer value (not A–D)', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [{ ...validHistory[0], correctAnswer: 'E' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid speedTier value', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [{ ...validHistory[0], speedTier: 'turbo' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel below 1 in meta', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, difficultyLevel: 0 },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel above 5 in meta', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, difficultyLevel: 6 },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel below 1 in history entry', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [{ ...validHistory[0], difficultyLevel: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects difficultyLevel above 5 in history entry', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [{ ...validHistory[0], difficultyLevel: 6 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty question string', () => {
    const result = DomainFileSchema.safeParse({
      meta: validMeta,
      hashes: [],
      history: [{ ...validHistory[0], question: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-datetime createdAt string', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, createdAt: 'not-a-date' },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects NaN score', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, score: Number.NaN },
      hashes: [],
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects Infinity score', () => {
    const result = DomainFileSchema.safeParse({
      meta: { ...validMeta, score: Infinity },
      hashes: [],
      history: [],
    })
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
  it('accepts full valid input with all 5 fields including null provider', () => {
    const result = SettingsFileSchema.safeParse({
      provider: null,
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(true)
  })

  it('accepts input with provider set to each valid provider type', () => {
    for (const provider of ['copilot', 'openai', 'anthropic', 'gemini', 'ollama'] as const) {
      const result = SettingsFileSchema.safeParse({
        provider,
        language: 'English',
        tone: 'natural',
        openaiModel: 'gpt-4o-mini',
        anthropicModel: 'claude-sonnet-4-20250514',
        geminiModel: 'gemini-2.0-flash',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3',
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid non-null provider value', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'grok',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(false)
  })

  it('fills defaults for missing provider and model fields (backward compat)', () => {
    const result = SettingsFileSchema.parse({ language: 'English', tone: 'natural' })
    expect(result.provider).toBeNull()
    expect(result.openaiModel).toBe('gpt-4o-mini')
    expect(result.anthropicModel).toBe('claude-sonnet-4-20250514')
    expect(result.geminiModel).toBe('gemini-2.0-flash')
    expect(result.ollamaEndpoint).toBe('http://localhost:11434')
    expect(result.ollamaModel).toBe('llama3')
  })

  it('rejects empty ollamaEndpoint string', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'ollama',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: '',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty ollamaModel string', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'ollama',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty openaiModel string', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'openai',
      language: 'English',
      tone: 'natural',
      openaiModel: '',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty anthropicModel string', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'anthropic',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: '',
      geminiModel: 'gemini-2.0-flash',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty geminiModel string', () => {
    const result = SettingsFileSchema.safeParse({
      provider: 'gemini',
      language: 'English',
      tone: 'natural',
      openaiModel: 'gpt-4o-mini',
      anthropicModel: 'claude-sonnet-4-20250514',
      geminiModel: '',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3',
    })
    expect(result.success).toBe(false)
  })
})

describe('defaultSettings — provider fields', () => {
  it('returns provider: null', () => {
    expect(defaultSettings().provider).toBeNull()
  })

  it('returns openaiModel: gpt-4o-mini', () => {
    expect(defaultSettings().openaiModel).toBe('gpt-4o-mini')
  })

  it('returns anthropicModel: claude-sonnet-4-20250514', () => {
    expect(defaultSettings().anthropicModel).toBe('claude-sonnet-4-20250514')
  })

  it('returns geminiModel: gemini-2.0-flash', () => {
    expect(defaultSettings().geminiModel).toBe('gemini-2.0-flash')
  })

  it('returns ollamaEndpoint: http://localhost:11434', () => {
    expect(defaultSettings().ollamaEndpoint).toBe('http://localhost:11434')
  })

  it('returns ollamaModel: llama3', () => {
    expect(defaultSettings().ollamaModel).toBe('llama3')
  })

  it('returns all settings fields', () => {
    const s = defaultSettings()
    expect(Object.keys(s).sort((a, b) => a.localeCompare(b))).toEqual([
      'anthropicModel',
      'geminiModel',
      'language',
      'ollamaEndpoint',
      'ollamaModel',
      'openaiModel',
      'provider',
      'tone',
    ])
  })
})
