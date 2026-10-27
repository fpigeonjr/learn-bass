import { expect, test } from '@playwright/test';

for (const width of [320, 390, 640, 760]) {
	test(`tracker controls sit below readable song metadata at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 844 });
		await page.goto('/learn-bass/');
		const rows = page.locator('#tracker .board li:visible');
		await expect(rows.first()).toBeVisible();
		for (const row of await rows.all()) {
			const info = await row.locator('.info').boundingBox();
			const actions = await row.locator('.row-actions').boundingBox();
			expect(info).not.toBeNull();
			expect(actions).not.toBeNull();
			expect(info!.width).toBeGreaterThan(150);
			expect(actions!.y).toBeGreaterThanOrEqual(info!.y + info!.height);
			for (const button of await row.locator('.status button').all()) {
				const box = await button.boundingBox();
				expect(box!.x).toBeGreaterThanOrEqual(0);
				expect(box!.x + box!.width).toBeLessThanOrEqual(width);
				expect(box!.height).toBeGreaterThanOrEqual(44);
			}
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
	});
}
