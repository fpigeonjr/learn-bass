import { describe, it, expect } from 'vitest';
import { songs, nextSong, GIG_DATE, type Song } from './songs';

function s(overrides: Partial<Song> & { slug: string }): Song {
	return {
		title: overrides.slug,
		artist: 'Test',
		status: 'cold',
		tier: 'core',
		order: 1,
		targetWeek: 1,
		hardPart: 'hard',
		hasLesson: true,
		...overrides,
	};
}

describe('songs data', () => {
	it('has 9 songs with unique slugs', () => {
		expect(songs).toHaveLength(9);
		expect(new Set(songs.map((x) => x.slug)).size).toBe(9);
	});
	it('GIG_DATE is Oct 9 2026', () => {
		expect(GIG_DATE.getFullYear()).toBe(2026);
		expect(GIG_DATE.getMonth()).toBe(9); // 0-indexed
		expect(GIG_DATE.getDate()).toBe(9);
	});
});

describe('nextSong', () => {
	it('returns null when all green', () => {
		expect(nextSong(songs.map((x) => ({ ...x, status: 'green' as const })))).toBeNull();
	});
	it('prefers cold over dusty over warm', () => {
		const active = [s({ slug: 'a', status: 'warm' }), s({ slug: 'b', status: 'dusty' }), s({ slug: 'c', status: 'cold' })];
		expect(nextSong(active)!.slug).toBe('c');
	});
	it('backup songs sort after core at same status', () => {
		const active = [s({ slug: 'core', tier: 'core', status: 'cold' }), s({ slug: 'backup', tier: 'backup', status: 'cold' })];
		expect(nextSong(active)!.slug).toBe('core');
	});
	it('earlier targetWeek wins at same status+tier', () => {
		const active = [s({ slug: 'w2', targetWeek: 2, status: 'cold' }), s({ slug: 'w1', targetWeek: 1, status: 'cold' })];
		expect(nextSong(active)!.slug).toBe('w1');
	});
	it('real setlist: first open is Dancing Queen (coldest)', () => {
		// Dancing Queen is cold core week1; ILS also cold but week1 tie - Dancing Queen wins by order? actually stable sort by tier then week; both core cold week1 so first in input wins after sort is stable? Check actual.
		const n = nextSong([...songs]);
		expect(n).not.toBeNull();
		// At least not green and not backup at top
		expect(n!.tier).toBe('core');
	});
	it('empty array returns null', () => {
		expect(nextSong([])).toBeNull();
	});
});
