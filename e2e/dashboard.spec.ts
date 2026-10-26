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

	test('renders the board with all 20 songs and no archived rows visible by default', async ({
		page,
	}) => {
		// Archive defaults to off: every song ships unarchived, so all 20 show.
		const visible = page.locator('.board li:not([hidden])');
		await expect(visible).toHaveCount(20);
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

	test('deep link filters the board on load', async ({ page }) => {
		// Regression: the stat chips and the island are separate module scripts
		// that run in document order, so pushing the initial filter through the
		// cross-island bridge dropped it (boot call ran before the island
		// existed). The island must parse #status= itself.
		await page.goto('/learn-bass/#status=cold');
		// A hash-only goto does NOT create a new document (it just fires
		// hashchange), which would exercise the listener instead of the init
		// path this test is about. Reload forces a real load.
		await page.reload();
		await page.waitForSelector('h1');

		await expect(page.locator('.stat-mini[data-filter="cold"]')).toHaveClass(/is-active/);

		// Derive the expected count from the chip so this doesn't rot when the
		// setlist changes, then assert every visible row really is cold.
		const coldCount = Number(await page.locator('#count-cold').textContent());
		expect(coldCount).toBeGreaterThan(0);

		const rows = page.locator('.board li:not([hidden])');
		await expect(rows).toHaveCount(coldCount);
		for (const row of await rows.all()) {
			await expect(row.locator('.status')).toHaveAttribute('data-status', 'cold');
		}
	});

	test('deep link survives a reload and ignores a junk value', async ({ page }) => {
		await page.goto('/learn-bass/#status=dusty');
		await page.reload(); // real document load, not a hashchange
		await page.waitForSelector('h1');

		// Assert the filter actually applied rather than comparing the state to
		// itself: every visible row must be dusty, and it must be a real subset.
		const dustyCount = Number(await page.locator('#count-dusty').textContent());
		expect(dustyCount).toBeGreaterThan(0);
		expect(dustyCount).toBeLessThan(20);

		const rows = page.locator('.board li:not([hidden])');
		await expect(rows).toHaveCount(dustyCount);
		for (const row of await rows.all()) {
			await expect(row.locator('.status')).toHaveAttribute('data-status', 'dusty');
		}

		await page.reload();
		await page.waitForSelector('h1');
		await expect(rows).toHaveCount(dustyCount);

		// An unrecognized status must be ignored, not applied as a filter
		// that matches nothing.
		await page.goto('/learn-bass/#status=banana');
		await page.reload();
		await page.waitForSelector('h1');
		await expect(page.locator('.board li:not([hidden])')).toHaveCount(20);
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
		for (let i = 0; i < 10; i++) {
			await rows.nth(i).locator('[data-archive]').click();
		}

		await expect(page.locator('#green-pct')).toHaveText('100%');
		await expect(page.locator('#count-archived')).toHaveText('10');
		await expect(page.locator('#count-current')).toContainText('10');
		// The `current` label must survive hydration: an earlier version set
		// textContent on the whole node and destroyed the <small> child.
		await expect(page.locator('#count-current small')).toHaveText('current');
	});
});
