import { createHash } from 'node:crypto'

export function hashQuestion(text: string): string {
  const normalized = text.toLowerCase().replaceAll(/\s+/g, '')
  return createHash('sha256').update(normalized).digest('hex')
}
