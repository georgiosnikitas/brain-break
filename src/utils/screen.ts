export function clearScreen(): void {
  process.stdout.write('\x1Bc')
}
