import { test, expect } from '@playwright/test';

test.describe('dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/learn-bass/');
		// Wait for the page to render (h1 is static and stable).
		await page.waitForSelector('h1');
	});

	test('renders the setlist board with all 9 songs', async ({ page }) => {
		const rows = page.locator('.board li');
		await expect(rows).toHaveCount(9);
	});

	test('clicking a status updates it and persists to localStorage', async ({ page }) => {
		// Find the "Dancing Queen" row (order 02) and set it to "green".
		const row = page.locator('.board li').filter({ hasText: 'Dancing Queen' });
		await row.locator('button[data-set="green"]').click();

		await expect(row.locator('.status')).toHaveAttribute('data-status', 'green');
		await expect(row.locator('button[data-set="green"]')).toHaveClass(/active/);

		// Persisted under learn-bass:status:v1.
		const saved = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('learn-bass:status:v1') || '{}'),
		);
		expect(saved['dancing-queen']).toBe('green');
	});

	test('warm-up checklist persists checked items to localStorage', async ({ page }) => {
		const first = page.locator('.checklist input').first();
		await first.check();

		const saved = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('learn-bass:warmup:v1') || '{}'),
		);
		expect(saved['0']).toBe(true);

		// Reload and confirm it stays checked.
		await page.reload();
		await expect(page.locator('.checklist input').first()).toBeChecked();
	});

	test('internal links use the /learn-bass/ base path', async ({ page }) => {
		// The warm-up chart link must be base-path aware (a raw /reference/...
		// would 404 on GitHub Pages).
		const warmupLink = page.locator('a[href*="reference/warmups/"]').first();
		await expect(warmupLink).toHaveAttribute('href', /^\/learn-bass\/reference\/warmups\//);
	});

	test('"what now" pointer is populated', async ({ page }) => {
		await expect(page.locator('#what-now .title')).not.toBeEmpty();
	});
});
