import { describe, it, expect } from 'vitest';
import { getLesson } from './lessons';

describe('getLesson', () => {
	it('returns stub for missing slug', () => {
		const l = getLesson('nonexistent-slug-xyz');
		expect(l).not.toBeNull();
		expect(l!.slug).toBe('nonexistent-slug-xyz');
		expect(l!.html).toContain('being written');
	});
	it('loads orientation lesson and strips body wrapper', () => {
		const l = getLesson('orientation');
		expect(l).not.toBeNull();
		// html should not contain <html> or <head> wrapper
		expect(l!.html).not.toMatch(/<html/i);
		expect(l!.html).not.toMatch(/course\.css/i);
		expect(l!.html.length).toBeGreaterThan(20);
	});
	it('strips course.css link', () => {
		const l = getLesson('plush');
		expect(l!.html).not.toMatch(/course\.css/i);
	});
});
