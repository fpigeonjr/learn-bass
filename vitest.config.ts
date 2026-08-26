import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Only run the unit-test suite; Playwright owns the e2e/ directory.
		exclude: ['e2e/**', 'node_modules/**', 'dist/**', '.astro/**'],
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reportsDirectory: './coverage',
			reporter: ['text', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
		},
	},
});
