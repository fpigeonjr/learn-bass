import { test, expect } from '@playwright/test';

// Spring source of truth — these mirror src/lib/scales.ts. A "scale run" is
// ascending notes then descending (without the duplicate top note).
const E_MINOR_PENTATONIC = [
	{ string: 'E', fret: '0' }, // E
	{ string: 'E', fret: '3' }, // G
	{ string: 'A', fret: '0' }, // A
	{ string: 'A', fret: '2' }, // B
	{ string: 'D', fret: '0' }, // D
	{ string: 'D', fret: '2' }, // E (octave)
	{ string: 'E', fret: '3' }, // G
	{ string: 'D', fret: '2' }, // E
	{ string: 'D', fret: '0' }, // D
	{ string: 'A', fret: '2' }, // B
	{ string: 'A', fret: '0' }, // A
	{ string: 'E', fret: '3' }, // G
	{ string: 'E', fret: '0' }, // E
];

const G_MAJOR = [
	{ string: 'E', fret: '3' }, // G
	{ string: 'A', fret: '0' }, // A
	{ string: 'A', fret: '2' }, // B
	{ string: 'A', fret: '3' }, // C
	{ string: 'D', fret: '0' }, // D
	{ string: 'D', fret: '2' }, // E
	{ string: 'D', fret: '4' }, // F♯
	{ string: 'G', fret: '0' }, // G
	{ string: 'D', fret: '2' }, // E
	{ string: 'D', fret: '0' }, // D
	{ string: 'A', fret: '3' }, // C
	{ string: 'A', fret: '2' }, // B
	{ string: 'A', fret: '0' }, // A
	{ string: 'E', fret: '3' }, // G
];

// True if `got` is a contiguous subsequence of `seq` (order-preserving).
function isContiguousSubsequence(got, seq) {
	if (got.length === 0) return true;
	for (let i = 0; i + got.length <= seq.length; i++) {
		if (got.every((n, j) => n.string === seq[i + j].string && n.fret === seq[i + j].fret)) {
			return true;
		}
	}
	return false;
}

test.describe('scales play-along chart', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/learn-bass/reference/scales/');
		await page.waitForSelector('#gh-exercise');
	});

	test('offers all four scales and defaults to E minor pentatonic', async ({ page }) => {
		const options = await page.locator('#gh-exercise option').allTextContents();
		expect(options).toEqual(['E minor pentatonic', 'Blues (E)', 'G major', 'A minor']);
		await expect(page.locator('#gh-exercise')).toHaveValue('em-pentatonic');
	});

	test('E minor pentatonic falls in the correct string/fret sequence', async ({ page }) => {
		await page.selectOption('#gh-tempo', '60'); // 1s/beat, easy to observe
		await page.click('#gh-start');

		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 8_000 })
			.toBeGreaterThanOrEqual(4);

		// Read notes sorted by spawn order (data-beat), then check they form a
		// valid slice of the ascending→descending scale run.
		const visible = await page.locator('.gh-note').evaluateAll((els) =>
			els
				.map((el) => ({
					beat: Number(el.getAttribute('data-beat')),
					string: el.closest('.gh-lane')?.getAttribute('data-string'),
					fret: el.querySelector('.gh-fret')?.textContent,
				}))
				.sort((a, b) => a.beat - b.beat)
				.map(({ string, fret }) => ({ string, fret })),
		);

		expect(visible.length).toBeGreaterThanOrEqual(3);
		expect(isContiguousSubsequence(visible, E_MINOR_PENTATONIC)).toBe(true);
	});

	test('G major starts on G (E string fret 3) and runs the G major scale', async ({
		page,
	}) => {
		await page.selectOption('#gh-exercise', 'g-major');
		await page.selectOption('#gh-tempo', '60');
		await page.click('#gh-start');

		await expect
			.poll(async () => page.locator('.gh-note').count(), { timeout: 8_000 })
			.toBeGreaterThanOrEqual(4);

		const visible = await page.locator('.gh-note').evaluateAll((els) =>
			els
				.map((el) => ({
					beat: Number(el.getAttribute('data-beat')),
					string: el.closest('.gh-lane')?.getAttribute('data-string'),
					fret: el.querySelector('.gh-fret')?.textContent,
				}))
				.sort((a, b) => a.beat - b.beat)
				.map(({ string, fret }) => ({ string, fret })),
		);

		expect(visible.length).toBeGreaterThanOrEqual(3);
		expect(isContiguousSubsequence(visible, G_MAJOR)).toBe(true);
	});
});
