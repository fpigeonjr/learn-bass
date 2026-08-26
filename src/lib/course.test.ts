import { describe, it, expect } from 'vitest';
import { readCourseFile } from './course';

describe('readCourseFile', () => {
	it('returns empty string for missing file', () => {
		expect(readCourseFile('DOES_NOT_EXIST.md')).toBe('');
	});
	it('reads GLOSSARY.md', () => {
		const c = readCourseFile('GLOSSARY.md');
		expect(c.length).toBeGreaterThan(10);
	});
});
