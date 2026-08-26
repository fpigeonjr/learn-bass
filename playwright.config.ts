import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	// Single worker avoids dev-server contention and keeps the timing-based
	// note-fall assertions deterministic.
	workers: 1,
	use: {
		baseURL: 'http://localhost:4321',
	},
	webServer: {
		command: 'npm run dev',
		url: 'http://localhost:4321/learn-bass/',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
	projects: [
		{
			name: 'mobile',
			use: {
				browserName: 'chromium',
				viewport: { width: 390, height: 844 },
				hasTouch: true,
				isMobile: true,
			},
		},
	],
});
