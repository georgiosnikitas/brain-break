export function slugify(text: string): string {
  const base = text.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
  let start = 0
  let end = base.length
  while (start < end && base[start] === '-') start++
  while (end > start && base[end - 1] === '-') end--
  return base.slice(start, end)
}
