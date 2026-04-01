import { coverageConfigDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      exclude: ['src/**/__test-helpers__/**', ...coverageConfigDefaults.exclude],
    },
  },
})
