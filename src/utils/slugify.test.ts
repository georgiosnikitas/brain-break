import { describe, it, expect } from 'vitest'
import { slugify } from './slugify.js'

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Spring Boot microservices')).toBe('spring-boot-microservices')
  })

  it('collapses multiple consecutive spaces to a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('replaces special characters with hyphens', () => {
    expect(slugify('C++ programming')).toBe('c-programming')
  })

  it('collapses consecutive special characters to a single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world')
    expect(slugify('hello!@#world')).toBe('hello-world')
  })

  it('strips leading hyphens', () => {
    expect(slugify('  hello')).toBe('hello')
  })

  it('strips trailing hyphens', () => {
    expect(slugify('hello  ')).toBe('hello')
  })

  it('strips both leading and trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world')
  })

  it('handles mixed alphanumeric input', () => {
    expect(slugify('Node.js v22')).toBe('node-js-v22')
  })

  it('handles already-valid slug input', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})
