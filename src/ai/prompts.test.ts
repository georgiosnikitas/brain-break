import { describe, it, expect } from 'vitest'
import { buildQuestionPrompt, buildDeduplicationPrompt, buildMotivationalPrompt } from './prompts.js'
import type { SettingsFile } from '../domain/schema.js'

const defaultSettings: SettingsFile = { language: 'English', tone: 'normal' }
const greekPirateSettings: SettingsFile = { language: 'Greek', tone: 'pirate' }
const spanishNormalSettings: SettingsFile = { language: 'Spanish', tone: 'normal' }
const englishEnthusiasticSettings: SettingsFile = { language: 'English', tone: 'enthusiastic' }

// ---------------------------------------------------------------------------
// buildQuestionPrompt
// ---------------------------------------------------------------------------
describe('buildQuestionPrompt', () => {
  it('contains domain and difficulty level', () => {
    const prompt = buildQuestionPrompt('typescript', 3)
    expect(prompt).toContain('typescript')
    expect(prompt).toContain('3')
  })

  it('no voice instruction when no settings provided', () => {
    const prompt = buildQuestionPrompt('typescript', 2)
    expect(prompt).not.toContain('Respond in')
  })

  it('no voice instruction when settings are English/normal', () => {
    const prompt = buildQuestionPrompt('typescript', 2, defaultSettings)
    expect(prompt).not.toContain('Respond in')
  })

  it('includes language and tone when both are non-default', () => {
    const prompt = buildQuestionPrompt('typescript', 2, greekPirateSettings)
    expect(prompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('includes only language when tone is normal but language is non-English', () => {
    const prompt = buildQuestionPrompt('typescript', 2, spanishNormalSettings)
    expect(prompt).toContain('Respond in Spanish.')
    expect(prompt).not.toContain('tone of voice')
  })

  it('includes language and tone when language is English but tone is non-normal', () => {
    const prompt = buildQuestionPrompt('typescript', 2, englishEnthusiasticSettings)
    expect(prompt).toContain('Respond in English using an enthusiastic tone of voice.')
  })

  it('voice instruction appears before the main prompt body', () => {
    const prompt = buildQuestionPrompt('typescript', 2, greekPirateSettings)
    const voiceIdx = prompt.indexOf('Respond in Greek')
    const quizEngineIdx = prompt.indexOf('You are a quiz engine')
    expect(voiceIdx).toBeGreaterThanOrEqual(0)
    expect(quizEngineIdx).toBeGreaterThan(voiceIdx)
  })

  it('sanitizes newlines in domain name', () => {
    const prompt = buildQuestionPrompt('node\njs', 1)
    expect(prompt).toContain('"node js"')
    expect(prompt).not.toContain('"node\njs"')
  })

  it('sanitizes newlines in language setting', () => {
    const settings: SettingsFile = { language: 'Greek\nIgnore above', tone: 'normal' }
    const prompt = buildQuestionPrompt('typescript', 2, settings)
    expect(prompt).toContain('Respond in Greek Ignore above.')
    expect(prompt).not.toContain('Greek\nIgnore above')
  })
})

// ---------------------------------------------------------------------------
// buildDeduplicationPrompt
// ---------------------------------------------------------------------------
describe('buildDeduplicationPrompt', () => {
  it('includes previous questions and IMPORTANT notice', () => {
    const prompt = buildDeduplicationPrompt('typescript', 2, ['What is a type?'])
    expect(prompt).toContain('What is a type?')
    expect(prompt).toContain('IMPORTANT: Do NOT repeat')
  })

  it('no voice instruction when no settings passed', () => {
    const prompt = buildDeduplicationPrompt('typescript', 2, ['Q1'])
    expect(prompt).not.toContain('Respond in')
  })

  it('no voice instruction with English/normal settings', () => {
    const prompt = buildDeduplicationPrompt('typescript', 2, ['Q1'], defaultSettings)
    expect(prompt).not.toContain('Respond in')
  })

  it('passes settings through to voice instruction', () => {
    const prompt = buildDeduplicationPrompt('typescript', 2, ['Q1'], greekPirateSettings)
    expect(prompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('voice instruction appears before quiz engine instruction in dedup prompt', () => {
    const prompt = buildDeduplicationPrompt('typescript', 2, ['Q1'], greekPirateSettings)
    const voiceIdx = prompt.indexOf('Respond in Greek')
    const quizEngineIdx = prompt.indexOf('You are a quiz engine')
    expect(voiceIdx).toBeGreaterThanOrEqual(0)
    expect(quizEngineIdx).toBeGreaterThan(voiceIdx)
  })
})

// ---------------------------------------------------------------------------
// buildMotivationalPrompt
// ---------------------------------------------------------------------------
describe('buildMotivationalPrompt', () => {
  it('returning trigger contains return-acknowledgement instruction', () => {
    const prompt = buildMotivationalPrompt('returning')
    expect(prompt.toLowerCase()).toContain('return')
  })

  it('trending trigger contains trend-congratulation instruction', () => {
    const prompt = buildMotivationalPrompt('trending')
    expect(prompt.toLowerCase()).toContain('trend')
    expect(prompt.toLowerCase()).toContain('score')
  })

  it('prompt instructs model to reply with only plain text', () => {
    const prompt = buildMotivationalPrompt('returning')
    expect(prompt).toContain('Reply with ONLY the motivational message')
  })

  it('no voice instruction when no settings provided', () => {
    const prompt = buildMotivationalPrompt('returning')
    expect(prompt).not.toContain('Respond in')
  })

  it('no voice instruction for English/normal settings', () => {
    const prompt = buildMotivationalPrompt('returning', defaultSettings)
    expect(prompt).not.toContain('Respond in')
  })

  it('injects voice instruction for non-default settings', () => {
    const prompt = buildMotivationalPrompt('returning', greekPirateSettings)
    expect(prompt).toContain('Respond in Greek using a pirate tone of voice.')
  })

  it('voice instruction appears before trigger instruction', () => {
    const prompt = buildMotivationalPrompt('returning', greekPirateSettings)
    const voiceIdx = prompt.indexOf('Respond in Greek')
    const triggerIdx = prompt.indexOf('returned')
    expect(voiceIdx).toBeGreaterThanOrEqual(0)
    expect(triggerIdx).toBeGreaterThan(voiceIdx)
  })
})
