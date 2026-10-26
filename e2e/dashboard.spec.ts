import { test, expect } from '@playwright/test';

test.describe('dashboard', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/learn-bass/');
		// Wait for the page to render (h1 is static and stable).
		await page.waitForSelector('h1');
		// Guarantee a clean slate: archive state is per-context localStorage and
		// a leaked override would silently change every row count below.
		await page.evaluate(() => {
			localStorage.removeItem('learn-bass:archive:v1');
			localStorage.removeItem('learn-bass:status:v1');
		});
		await page.reload();
		await page.waitForSelector('h1');
	});

	test('renders the board with all 14 songs and no archived rows visible by default', async ({
		page,
	}) => {
		// Archive defaults to off: every song ships unarchived, so all 14 show.
		const visible = page.locator('.board li:not([hidden])');
		await expect(visible).toHaveCount(14);
		await expect(page.locator('#show-archived')).not.toBeChecked();
	});

	test('archiving a song hides it and persists to localStorage', async ({ page }) => {
		const row = page.locator('.board li').filter({ hasText: 'Dancing Queen' });
		await row.locator('[data-archive]').click();

		// Row hides immediately (archive toggle is off) and shows the badge.
		await expect(row).toHaveAttribute('data-archived', 'true');
		await expect(row).toBeHidden();

		const saved = await page.evaluate(() =>
			JSON.parse(localStorage.getItem('learn-bass:archive:v1') || '{}'),
		);
		expect(saved['dancing-queen']).toBe(true);
	});

	test('archiving preserves the underlying status when unarchived', async ({ page }) => {
		const row = page.locator('.board li').filter({ hasText: 'Dancing Queen' });
		await row.locator('button[data-set="green"]').click();
		await row.locator('[data-archive]').click();

		// Turn on the archive view, then unarchive.
		await page.locator('#show-archived').check();
		await expect(row.locator('.status')).toHaveAttribute('data-status', 'green');
		await row.locator('[data-archive]').click();

		await expect(row).toHaveAttribute('data-archived', 'false');
		await expect(row.locator('.status')).toHaveAttribute('data-status', 'green');
	});

	test('archive toggle reveals archived rows', async ({ page }) => {
		const row = page.locator('.board li').filter({ hasText: 'Dancing Queen' });
		await row.locator('[data-archive]').click();
		await expect(row).toBeHidden();

		await page.locator('#show-archived').check();
		await expect(row).toBeVisible();
		await expect(row.locator('.badge.archive')).toBeVisible();
	});

	test('status chip and archive toggle compose rather than clobber', async ({ page }) => {
		// Archive one cold song, then filter to cold with archives hidden:
		// only the non-archived cold rows should remain visible.
		const archived = page.locator('.board li').filter({ hasText: 'Kryptonite' });
		await archived.locator('[data-archive]').click();

		await page.locator('.stat-mini[data-filter="cold"]').click();
		await expect(archived).toBeHidden();

		// Enabling the archive toggle must widen the set, not reset the status filter.
		await page.locator('#show-archived').check();
		await expect(archived).toBeVisible();
		const visible = page.locator('.board li:not([hidden])');
		for (const row of await visible.all()) {
			await expect(row.locator('.status')).toHaveAttribute('data-status', 'cold');
		}
	});

	test('queue hero shows what to learn next', async ({ page }) => {
		await expect(page.locator('#what-now .title')).toContainText('Currently learning');
	});

	test('hero reports empty rotation separately from all-green', async ({ page }) => {
		// Archive every song; the hero must say "Nothing in rotation", not all-green.
		for (const row of await page.locator('.board li').all()) {
			await row.locator('[data-archive]').click();
		}
		await expect(page.locator('#what-now .title')).toContainText('Nothing in rotation');
		await expect(page.locator('#what-now .title')).not.toContainText('Queue cleared');
	});

	test('countdown is gone from the dashboard', async ({ page }) => {
		await expect(page.locator('#countdown')).toHaveCount(0);
		await expect(page.locator('text=/runway/')).toHaveCount(0);
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

	test('Start Practice CTA is visible and links to warmups', async ({ page }) => {
		const cta = page.locator('a.btn-start');
		await expect(cta).toBeVisible();
		await expect(cta).toHaveAttribute('href', /^\/learn-bass\/reference\/warmups\//);
		await expect(cta).toHaveText(/Start Practice/i);
	});

	test('archive state survives a page reload', async ({ page }) => {
		const row = page.locator('.board li').filter({ hasText: 'Hotel California' });
		await row.locator('[data-archive]').click();
		await expect(row).toHaveAttribute('data-archived', 'true');
		await expect(row).toBeHidden();

		// A reload re-reads learn-bass:archive:v1 and must hide the row again.
		await page.reload();
		await page.waitForSelector('h1');
		const reloaded = page.locator('.board li').filter({ hasText: 'Hotel California' });
		await expect(reloaded).toHaveAttribute('data-archived', 'true');
		await expect(reloaded).toBeHidden();
	});

	test('unarchived status is restored from localStorage after reload', async ({ page }) => {
		const row = page.locator('.board li').filter({ hasText: 'Faithfully' });
		await row.locator('button[data-set="green"]').click();
		await expect(row.locator('.status')).toHaveAttribute('data-status', 'green');
		await row.locator('[data-archive]').click();
		await expect(row).toBeHidden();

		// Both keys are read on boot; status must not be clobbered by the archive key.
		await page.reload();
		await page.waitForSelector('h1');
		await page.locator('#show-archived').check();

		const reloaded = page.locator('.board li').filter({ hasText: 'Faithfully' });
		await expect(reloaded.locator('.status')).toHaveAttribute('data-status', 'green');
		await expect(reloaded.locator('[data-archive]')).toHaveText('Unarchive');
	});

	test('green percentage is scoped to current songs only', async ({ page }) => {
		// Everything green, so the meter would read 100% before any archiving…
		for (const row of await page.locator('.board li').all()) {
			await row.locator('button[data-set="green"]').click();
		}

		// …and archiving half the board must remove songs from numerator *and*
		// denominator rather than depressing the meter.
		const rows = page.locator('.board li');
		for (let i = 0; i < 7; i++) {
			await rows.nth(i).locator('[data-archive]').click();
		}

		await expect(page.locator('#gig-ready-pct')).toHaveText('100%');
		await expect(page.locator('#count-archived')).toHaveText('7');
		await expect(page.locator('#count-current')).toContainText('7');
		// The `current` label must survive hydration: an earlier version set
		// textContent on the whole node and destroyed the <small> child.
		await expect(page.locator('#count-current small')).toHaveText('current');
	});
});
