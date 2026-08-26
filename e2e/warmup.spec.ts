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
		// Lanes are laid out E, A, D, G (low to high, left to right on screen).
		expect(labels).toEqual(['E', 'A', 'D', 'G']);
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

		// Speed up the count-in: 120 bpm → 0.5s/beat → 2s lead-in.
		await page.selectOption('#gh-tempo', '120');

		// Wait for the count-in to finish (notes only spawn once `running` is true).
		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 6_000 })
			.toBeGreaterThan(0);

		// Each note carries an absolute strike time; as "now" advances, its
		// vertical offset (translateY) grows until it reaches the strike line.
		// Track a specific note by data-beat so removal/replacement can't skew
		// the measurement.
		const readBeatOffset = (beat) =>
			page
				.locator(`.gh-note[data-beat="${beat}"]`)
				.evaluate((el) => {
					const m = el.style.transform.match(/translateY\((-?[\d.]+)px\)/);
					return m ? Number.parseFloat(m[1]) : null;
				});

		// Choose a note a couple beats in (plenty of runway left to fall).
		const beat = await page
			.locator('.gh-note')
			.last()
			.evaluate((el) => el.dataset.beat);
		const firstOffset = await readBeatOffset(beat!);
		await page.waitForTimeout(300);
		const secondOffset = await readBeatOffset(beat!);

		expect(firstOffset).not.toBeNull();
		expect(secondOffset).not.toBeNull();
		// Falling downward = translateY increases toward the strike line.
		expect(secondOffset!).toBeGreaterThan(firstOffset!);
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

	test('notes show their fret number (spider exercise shows 1-2-3-4)', async ({ page }) => {
		await page.selectOption('#gh-exercise', 'spider');
		await page.selectOption('#gh-tempo', '60'); // 1s/beat → slow, easy to observe
		await page.click('#gh-start');

		// Wait for the count-in (4 beats = 4s) to finish and notes to appear.
		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 8_000 })
			.toBeGreaterThan(0);

		// Every visible note carries a fret label and a lane (string).
		const notes = await page.locator('.gh-note').evaluateAll((els) =>
			els.map((el) => ({
				string: el.closest('.gh-lane')?.getAttribute('data-string'),
				fret: el.querySelector('.gh-fret')?.textContent,
			})),
		);

		expect(notes.length).toBeGreaterThan(0);
		for (const n of notes) {
			expect(['E', 'A', 'D', 'G']).toContain(n.string);
			expect(['1', '2', '3', '4']).toContain(n.fret);
		}
	});

	test('open-string exercises show fret 0', async ({ page }) => {
		// Default exercise is "Open-string alternation" — all open strings.
		await page.selectOption('#gh-tempo', '60');
		await page.click('#gh-start');

		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 8_000 })
			.toBeGreaterThan(0);

		const frets = await page.locator('.gh-fret').allTextContents();
		expect(frets.length).toBeGreaterThan(0);
		for (const f of frets) {
			expect(f).toBe('0');
		}
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
