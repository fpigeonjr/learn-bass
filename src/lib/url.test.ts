import { describe, it, expect } from 'vitest';
import { url } from './url';

describe('url', () => {
	it('prefixes base and strips leading slash', () => {
		// BASE_URL in vitest defaults to "/" - just verify stripping
		const a = url('/foo/bar');
		const b = url('foo/bar');
		expect(a).toBe(b);
		expect(a).toContain('foo/bar');
	});
	it('handles empty and root paths', () => {
		expect(url('')).toBeDefined();
		expect(url('/')).toBeDefined();
	});
});
