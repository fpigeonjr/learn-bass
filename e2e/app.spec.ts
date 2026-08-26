import { test, expect } from '@playwright/test';

const pages = [
  { path: '/learn-bass/', title: /Dashboard|Gig-Ready Bass/ },
  { path: '/learn-bass/lessons/', title: /Lessons/ },
  { path: '/learn-bass/lessons/orientation/', title: /Orientation/ },
  { path: '/learn-bass/lessons/plush/', title: /Plush|Orientation/ },
  { path: '/learn-bass/reference/', title: /Reference/ },
  { path: '/learn-bass/reference/warmups/', title: /Warm-ups/ },
  { path: '/learn-bass/reference/scales/', title: /Scales/ },
  { path: '/learn-bass/reference/setlist/', title: /Setlist/ },
  { path: '/learn-bass/reference/glossary/', title: /Glossary/ },
  { path: '/learn-bass/about/', title: /About/ },
];

test.describe('whole app', () => {
  for (const { path, title } of pages) {
    test(`${path} loads and has correct title`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('main').first()).toBeVisible();
    });
  }

  test('nav links use base path and are reachable', async ({ page }) => {
    await page.goto('/learn-bass/');
    for (const href of ['/learn-bass/', '/learn-bass/lessons/', '/learn-bass/reference/', '/learn-bass/about']) {
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toBeVisible();
    }
  });

  test('lessons index lists orientation + 9 songs', async ({ page }) => {
    await page.goto('/learn-bass/lessons/');
    await expect(page.locator('text=Orientation')).toBeVisible();
    // 1 orientation + 9 songs = at least 10 list items (grouped in 2 cards)
    await expect(page.locator('.board li')).toHaveCount(10);
  });

  test('reference index lists 4 cards', async ({ page }) => {
    await page.goto('/learn-bass/reference/');
    await expect(page.locator('.board li')).toHaveCount(4);
  });

  test('setlist page shows 9 songs', async ({ page }) => {
    await page.goto('/learn-bass/reference/setlist/');
    await expect(page.locator('.board li')).toHaveCount(9);
  });

  test('unknown lesson returns 404', async ({ page }) => {
    const res = await page.goto('/learn-bass/lessons/nonexistent-slug-xyz/');
    // Astro static build: unknown slug not in getStaticPaths => 404
    expect(res?.status()).toBe(404);
  });

  test('mobile: no horizontal scroll on any page', async ({ page }) => {
    for (const { path } of pages.slice(0, 5)) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `overflow on ${path}`).toBe(false);
    }
  });
});
