import { describe, it, expect } from 'vitest'
import { hashQuestion } from './hash.js'

describe('hashQuestion', () => {
  it('returns a 64-character hex string', () => {
    expect(hashQuestion('What is TypeScript?')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic — same input returns same hash', () => {
    const h1 = hashQuestion('What is TypeScript?')
    const h2 = hashQuestion('What is TypeScript?')
    expect(h1).toBe(h2)
  })

  it('normalizes to lowercase before hashing', () => {
    expect(hashQuestion('HELLO')).toBe(hashQuestion('hello'))
  })

  it('strips all whitespace before hashing', () => {
    expect(hashQuestion('hello world')).toBe(hashQuestion('helloworld'))
    expect(hashQuestion('  hello  world  ')).toBe(hashQuestion('helloworld'))
  })

  it('combines lowercasing and whitespace stripping', () => {
    expect(hashQuestion('  HELLO   WORLD  ')).toBe(hashQuestion('helloworld'))
  })

  it('different inputs produce different hashes', () => {
    expect(hashQuestion('question one')).not.toBe(hashQuestion('question two'))
  })

  it('returns the correct known SHA-256 for "hello" (golden hash)', () => {
    // SHA-256 of 'hello' (normalized: already lowercase, no whitespace)
    // pre-computed: echo -n 'hello' | sha256sum
    expect(hashQuestion('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('golden hash matches regardless of casing and spacing', () => {
    // '  HELLO  ' normalizes to 'hello' — must equal the same golden hash
    expect(hashQuestion('  HELLO  ')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })
})
