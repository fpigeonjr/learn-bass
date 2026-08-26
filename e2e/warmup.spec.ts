import { test, expect } from '@playwright/test';

test.describe('warm-up play-along chart', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/learn-bass/reference/warmups/');
		// Wait for the game to hydrate (script attached).
		await page.waitForSelector('#gh-start');
	});

	test('starts with a Start button and four labeled lanes', async ({ page }) => {
		await expect(page.locator('#gh-start')).toHaveText('Start');
		const labels = await page.locator('.gh-lane .gh-label').allTextContents();
		// Lanes are laid out G, D, A, E (high to low, left to right on screen).
		expect(labels).toEqual(['G', 'D', 'A', 'E']);
	});

	test('clicking Start runs a count-in, then drops notes that fall', async ({ page }) => {
		const start = page.locator('#gh-start');
		await start.click();

		// Button flips to Stop immediately.
		await expect(start).toHaveText('Stop');

		// Count-in shows a number, and over the next beats counts down.
		const count = page.locator('#gh-count');
		await expect(count).toBeVisible();
		expect(['1', '2', '3', '4']).toContain(await count.textContent());

		// At 120 bpm the 4-count is 0.5s/beat (2s total). Notes appear after that.
		// Use the default 80 bpm → 0.75s/beat → 3s count-in. Speed it up for the test.
		await page.selectOption('#gh-tempo', '120');

		// Wait for the count-in to finish (notes only spawn once `running` is true).
		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 6_000 })
			.toBeGreaterThan(0);

		// Notes should be moving: capture a note's transform, wait, capture again.
		const firstY = await page
			.locator('.gh-note')
			.first()
			.evaluate((el) => el.style.transform);
		await page.waitForTimeout(400);
		const secondY = await page
			.locator('.gh-note')
			.first()
			.evaluate((el) => el.style.transform);

		// The note's translateY should have changed while falling.
		expect(secondY).not.toBe(firstY);
	});

	test('clicking Stop clears notes and resets the button', async ({ page }) => {
		const start = page.locator('#gh-start');
		await page.selectOption('#gh-tempo', '120');
		await start.click();
		await expect(start).toHaveText('Stop');

		// Wait for notes to appear before stopping.
		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 6_000 })
			.toBeGreaterThan(0);

		await start.click();
		await expect(start).toHaveText('Start');
		await expect(page.locator('.gh-note')).toHaveCount(0);
	});

	test('is mobile-friendly: no horizontal scroll and a full-width Start button', async ({
		page,
	}) => {
		// No horizontal overflow on a 390px-wide viewport.
		const overflowing = await page.evaluate(
			() => document.documentElement.scrollWidth > document.documentElement.clientWidth,
		);
		expect(overflowing).toBe(false);

		const btn = page.locator('#gh-start');
		const box = await btn.boundingBox();
		expect(box).not.toBeNull();
		// Generous tap target (≥44px tall), near-full width on mobile.
		expect(box!.height).toBeGreaterThanOrEqual(44);
		expect(box!.width).toBeGreaterThan(250);
	});
});
