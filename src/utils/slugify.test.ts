import { describe, it, expect } from 'vitest'
import { slugify } from './slugify.js'

describe('slugify', () => {
  it.each([
    ['lowercases and replaces spaces with hyphens', 'Spring Boot microservices', 'spring-boot-microservices'],
    ['collapses multiple consecutive spaces to a single hyphen', 'hello   world', 'hello-world'],
    ['replaces special characters with hyphens', 'C++ programming', 'c-programming'],
    ['strips leading hyphens', '  hello', 'hello'],
    ['strips trailing hyphens', 'hello  ', 'hello'],
    ['strips both leading and trailing hyphens', '  hello world  ', 'hello-world'],
    ['handles mixed alphanumeric input', 'Node.js v22', 'node-js-v22'],
    ['handles already-valid slug input', 'already-a-slug', 'already-a-slug'],
    ['handles empty string', '', ''],
  ])('%s', (_, input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('collapses consecutive special characters to a single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world')
    expect(slugify('hello!@#world')).toBe('hello-world')
  })
})
