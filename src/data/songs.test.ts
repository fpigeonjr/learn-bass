import { describe, it, expect } from 'vitest';
import { songs, nextSong, GIG_DATE, type Song } from './songs';

function s(overrides: Partial<Song> & { slug: string }): Song {
	return {
		title: overrides.slug,
		artist: 'Test',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 1,
		hardPart: 'hard',
		hasLesson: true,
		...overrides,
	};
}

describe('songs data', () => {
	it('has 20 songs with unique slugs', () => {
		expect(songs).toHaveLength(20);
		expect(new Set(songs.map((x) => x.slug)).size).toBe(20);
	});

	it('ships every song archived: false so the user opts in', () => {
		// Archive defaults must not encode guesses about what is already learned.
		expect(songs.every((x) => x.archived === false)).toBe(true);
	});

	it.each([
		['misery-business', 'https://tabs.ultimate-guitar.com/tab/paramore/misery-business-guitar-pro-590967'],
		['crushcrushcrush', 'https://tabs.ultimate-guitar.com/tab/paramore/crushcrushcrush-official-1916653'],
	])('includes %s with an interactive UG chart', (slug, ugTab) => {
		expect(songs.find((song) => song.slug === slug)).toMatchObject({
			artist: 'Paramore', status: 'cold', archived: false, hasLesson: false, ugTab,
		});
	});

	it.each([
		['college-kids', 'Relient K', 'https://tabs.ultimate-guitar.com/tab/relient-k/college-kids-guitar-pro-310718'],
		['be-my-escape', 'Relient K', 'https://tabs.ultimate-guitar.com/tab/relient-k/be-my-escape-official-3567452'],
		['who-i-am-hates-who-ive-been', 'Relient K', 'https://tabs.ultimate-guitar.com/tab/relient-k/who-i-am-hates-who-ive-been-official-3935363'],
		['californication', 'Red Hot Chili Peppers', 'https://tabs.ultimate-guitar.com/tab/red-hot-chili-peppers/californication-guitar-pro-229736'],
	])('includes %s as a new active song with a UG chart', (slug, artist, ugTab) => {
		expect(songs.find((song) => song.slug === slug)).toMatchObject({
			artist, status: 'cold', archived: false, hasLesson: false, ugTab,
		});
	});

	it('GIG_DATE is Oct 9 2026', () => {
		expect(GIG_DATE.getFullYear()).toBe(2026);
		expect(GIG_DATE.getMonth()).toBe(9); // 0-indexed
		expect(GIG_DATE.getDate()).toBe(9);
	});
});

describe('nextSong', () => {
	it('reports all-green when every current song is green', () => {
		expect(nextSong(songs.map((x) => ({ ...x, status: 'green' as const })))).toEqual({
			kind: 'all-green',
		});
	});

	it('prefers cold over dusty over warm', () => {
		const active = [
			s({ slug: 'a', status: 'warm' }),
			s({ slug: 'b', status: 'dusty' }),
			s({ slug: 'c', status: 'cold' }),
		];
		const n = nextSong(active);
		expect(n.kind === 'learning' && n.song.slug).toBe('c');
	});

	it('breaks ties by source order rather than tier', () => {
		const active = [
			s({ slug: 'first', tier: 'backup', status: 'cold' }),
			s({ slug: 'second', tier: 'core', status: 'cold' }),
		];
		const n = nextSong(active);
		expect(n.kind === 'learning' && n.song.slug).toBe('first');
	});

	it('real setlist: first open is cold', () => {
		const n = nextSong([...songs]);
		expect(n.kind).toBe('learning');
		expect(n.kind === 'learning' && n.song.status).toBe('cold');
	});

	it('empty array returns the empty state, not all-green', () => {
		expect(nextSong([])).toEqual({ kind: 'empty' });
	});
});
