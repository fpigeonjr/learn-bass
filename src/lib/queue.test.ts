import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	computeCounts,
	isVisible,
	liveSongs,
	loadState,
	saveArchived,
	saveStatus,
	heroMessage,
} from './queue';
import { nextSong, type Song } from '../data/songs';

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

/** Minimal localStorage stand-in (vitest runs in node, no DOM). */
function makeStorage() {
	const map = new Map<string, string>();
	return {
		getItem: (k: string) => map.get(k) ?? null,
		setItem: (k: string, v: string) => void map.set(k, v),
		removeItem: (k: string) => void map.delete(k),
		clear: () => map.clear(),
	};
}

beforeEach(() => {
	vi.stubGlobal('localStorage', makeStorage());
});

describe('nextSong — archive filtering', () => {
	it('skips archived songs entirely', () => {
		const active = [
			s({ slug: 'shelved', status: 'cold', archived: true }),
			s({ slug: 'live', status: 'warm' }),
		];
		const n = nextSong(active);
		expect(n.kind).toBe('learning');
		expect(n.kind === 'learning' && n.song.slug).toBe('live');
	});

	it('returns "empty" when every song is archived', () => {
		const active = [s({ slug: 'a', archived: true }), s({ slug: 'b', archived: true })];
		expect(nextSong(active)).toEqual({ kind: 'empty' });
	});

	it('distinguishes empty from all-green', () => {
		const allGreen = [s({ slug: 'a', status: 'green' }), s({ slug: 'b', status: 'green' })];
		expect(nextSong(allGreen)).toEqual({ kind: 'all-green' });
		expect(nextSong([])).toEqual({ kind: 'empty' });
	});
});

describe('nextSong — priority', () => {
	it('prefers cold over dusty over warm', () => {
		const n = nextSong([
			s({ slug: 'a', status: 'warm' }),
			s({ slug: 'b', status: 'dusty' }),
			s({ slug: 'c', status: 'cold' }),
		]);
		expect(n.kind === 'learning' && n.song.slug).toBe('c');
	});

	it('tie-breaks by array order, ignoring tier', () => {
		const n = nextSong([
			s({ slug: 'first', status: 'cold', tier: 'backup' }),
			s({ slug: 'second', status: 'cold', tier: 'core' }),
		]);
		expect(n.kind === 'learning' && n.song.slug).toBe('first');
	});

	it('treats green as not-open but keeps it in the pool', () => {
		const n = nextSong([s({ slug: 'done', status: 'green' }), s({ slug: 'todo', status: 'dusty' })]);
		expect(n.kind === 'learning' && n.song.slug).toBe('todo');
	});
});

describe('computeCounts', () => {
	it('scopes counts to current songs, excluding archived', () => {
		const counts = computeCounts([
			s({ slug: 'a', status: 'green' }),
			s({ slug: 'b', status: 'green' }),
			s({ slug: 'c', status: 'cold' }),
			s({ slug: 'd', status: 'green', archived: true }),
			s({ slug: 'e', status: 'green', archived: true }),
			s({ slug: 'f', status: 'green', archived: true }),
		]);
		expect(counts.current).toBe(3);
		expect(counts.archived).toBe(3);
		expect(counts.byStatus.green).toBe(2);
		expect(counts.byStatus.cold).toBe(1);
	});

	it('greenPct is over current songs only, so archiving cannot depress it', () => {
		// 2 green current out of 2 current = 100%, despite 5 archived cold songs.
		const active = [
			s({ slug: 'a', status: 'green' }),
			s({ slug: 'b', status: 'green' }),
			...Array.from({ length: 5 }, (_, i) =>
				s({ slug: `arch${i}`, status: 'cold', archived: true }),
			),
		];
		expect(computeCounts(active).greenPct).toBe(100);
	});

	it('is 0-lenient when everything is archived', () => {
		const counts = computeCounts([s({ slug: 'a', archived: true })]);
		expect(counts.current).toBe(0);
		expect(counts.greenPct).toBe(0);
	});
});

describe('isVisible — composed predicate', () => {
	it('requires both axes to match', () => {
		expect(isVisible({ archivedMatches: true, statusMatches: true })).toBe(true);
		expect(isVisible({ archivedMatches: false, statusMatches: true })).toBe(false);
		expect(isVisible({ archivedMatches: true, statusMatches: false })).toBe(false);
	});
});

describe('liveSongs', () => {
	it('applies localStorage overrides over shipped defaults', () => {
		const shipped = [s({ slug: 'a', status: 'warm', archived: false })];
		const live = liveSongs(shipped, {
			status: { a: 'green' },
			archived: { a: true },
		});
		expect(live[0].status).toBe('green');
		expect(live[0].archived).toBe(true);
	});

	it('falls back to shipped values when no override exists', () => {
		const shipped = [s({ slug: 'a', status: 'warm', archived: true })];
		const live = liveSongs(shipped, { status: {}, archived: {} });
		expect(live[0].status).toBe('warm');
		expect(live[0].archived).toBe(true);
	});
});

describe('storage', () => {
	it('persists status and archive independently', () => {
		saveStatus('a', 'green');
		saveArchived('a', true);
		const state = loadState();
		expect(state.status.a).toBe('green');
		expect(state.archived.a).toBe(true);
	});

	it('unarchiving preserves the underlying status', () => {
		saveStatus('a', 'green');
		saveArchived('a', true);
		saveArchived('a', false);
		const state = loadState();
		expect(state.status.a).toBe('green');
		expect(state.archived.a).toBe(false);
	});

	it('survives corrupt JSON without throwing', () => {
		localStorage.setItem('learn-bass:status:v1', '{not json');
		expect(() => loadState()).not.toThrow();
		expect(loadState().status).toEqual({});
	});
});

describe('heroMessage', () => {
	const base = '/learn-bass/';

	it('renders the learning song with its hard part and lesson link', () => {
		const html = heroMessage({ kind: 'learning', song: s({ slug: 'x', title: 'Song X' }) }, base);
		expect(html).toContain('Currently learning: Song X');
		expect(html).toContain('hard');
		expect(html).toContain('/learn-bass/lessons/x/');
	});

	it('links to the lessons index when no lesson exists yet', () => {
		const html = heroMessage(
			{ kind: 'learning', song: s({ slug: 'y', hasLesson: false }) },
			base,
		);
		expect(html).toContain('/learn-bass/lessons/');
		expect(html).not.toContain('/lessons/y/');
	});

	it('empty and all-green produce different copy', () => {
		const empty = heroMessage({ kind: 'empty' }, base);
		const allGreen = heroMessage({ kind: 'all-green' }, base);
		expect(empty).not.toBe(allGreen);
		expect(empty).toContain('Nothing in rotation');
		expect(allGreen).toContain('Queue cleared');
	});
});

// Value-level persistence guards.
//
// These assert the *stored value*, not merely that a key exists. There was a
// real bug where `saveStatus` declared `const status = { ...{ [slug]: status } }`
// — a self-shadowing binding that was a parse error. Key-presence assertions
// would have passed for every other near-miss of that shape, so the regression
// guard has to read the JSON back out.
describe('storage — persisted values', () => {
	const readStatus = () => JSON.parse(localStorage.getItem('learn-bass:status:v1') ?? 'null');
	const readArchive = () => JSON.parse(localStorage.getItem('learn-bass:archive:v1') ?? 'null');

	it('stores the given status value, not a placeholder', () => {
		saveStatus('x', 'dusty');
		expect(readStatus().x).toBe('dusty');
	});

	it('merges a second save instead of replacing the record', () => {
		saveStatus('x', 'dusty');
		saveStatus('y', 'cold');
		const stored = readStatus();
		expect(stored.x).toBe('dusty');
		expect(stored.y).toBe('cold');
	});

	it('writes the archive key independently of the status key', () => {
		saveStatus('x', 'dusty');
		saveArchived('x', true);
		expect(readArchive().x).toBe(true);
		// The archive write must not touch status.
		expect(readStatus().x).toBe('dusty');
	});

	it('overwrites a previously stored status value', () => {
		saveStatus('x', 'dusty');
		saveStatus('x', 'green');
		expect(readStatus().x).toBe('green');
	});
});

describe('heroMessage — output passthrough', () => {
	const base = '/learn-bass/';

	it('renders a hard part containing HTML-significant characters without truncating', () => {
		const song = s({ slug: 'x', title: 'Song X', hardPart: 'verse & chorus <riff>' });
		const html = heroMessage({ kind: 'learning', song }, base);
		expect(html).toContain('Currently learning:');
		expect(html).toContain('verse & chorus <riff>');
		expect(html).toContain('/learn-bass/lessons/x/');
	});

	it('does not throw when the song has no ugTab', () => {
		const song = s({ slug: 'nogtab', title: 'No Tab' });
		expect(song.ugTab).toBeUndefined();
		expect(() => heroMessage({ kind: 'learning', song }, base)).not.toThrow();
	});
});

describe('computeCounts — all-green edge case', () => {
	const allGreen = () => [
		s({ slug: 'a', status: 'green' }),
		s({ slug: 'b', status: 'green' }),
		s({ slug: 'c', status: 'green' }),
	];

	it('reports 100% green and an all-green next-up', () => {
		const active = allGreen();
		expect(computeCounts(active).greenPct).toBe(100);
		expect(nextSong(active)).toEqual({ kind: 'all-green' });
	});

	it('stays at 100% after archiving one of the green songs', () => {
		const active = allGreen();
		active[0] = { ...active[0], archived: true };
		const counts = computeCounts(active);
		expect(counts.greenPct).toBe(100);
		expect(counts.archived).toBe(1);
		expect(counts.current).toBe(2);
	});
});

describe('liveSongs — untrusted override validation', () => {
	it('ignores a status value that is not one of the four', () => {
		// localStorage is user-writable; a junk value must not create a phantom
		// status that vanishes from the counts, meter, and every chip.
		const shipped = [s({ slug: 'a', status: 'warm' })];
		const live = liveSongs(shipped, {
			status: { a: 'banana' as never },
			archived: {},
		});
		expect(live[0].status).toBe('warm');
	});

	it('keeps counts finite and complete when a junk status is stored', () => {
		const shipped = [s({ slug: 'a', status: 'cold' }), s({ slug: 'b', status: 'warm' })];
		const live = liveSongs(shipped, {
			status: { a: 'banana' as never },
			archived: {},
		});
		const counts = computeCounts(live);
		expect(counts.current).toBe(2);
		expect(counts.byStatus.cold).toBe(1);
		expect(counts.byStatus.warm).toBe(1);
		// No phantom key leaked into the byStatus map.
		expect(Object.keys(counts.byStatus).sort()).toEqual(['cold', 'dusty', 'green', 'warm']);
	});

	it('ignores a non-boolean archived override', () => {
		const shipped = [s({ slug: 'a', archived: false })];
		const live = liveSongs(shipped, { status: {}, archived: { a: 'yes' as never } });
		expect(live[0].archived).toBe(false);
	});

	it('ignores overrides for slugs that are no longer shipped', () => {
		const shipped = [s({ slug: 'a', status: 'cold' })];
		const live = liveSongs(shipped, {
			status: { ghost: 'green' as never },
			archived: { ghost: true },
		});
		expect(live).toHaveLength(1);
		expect(computeCounts(live).current).toBe(1);
	});
});
