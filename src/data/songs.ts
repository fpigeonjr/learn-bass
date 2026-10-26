// Single source of truth for the setlist and its state.
// Status: cold | dusty | warm | green
// tier:   attack-first (cold) > middle (dusty) > polish (warm) > backup

/**
 * `archived` is a separate axis from `status`, not a fifth status value.
 * Archiving shelves a song without destroying its maturity: unarchiving
 * restores exactly where it was (green stays green).
 */
export type SongStatus = 'cold' | 'dusty' | 'warm' | 'green';

export interface Song {
	slug: string;
	title: string;
	artist: string;
	status: SongStatus; // initial status (tracker overrides via localStorage)
	archived: boolean; // shelved: excluded from the queue, counts, and meter
	tier: 'core' | 'backup';
	order: number; // setlist running order (1..n)
	hardPart: string; // shown by the "what now" pointer
	hasLesson: boolean; // whether a full lesson exists yet
	ugTab?: string; // optional Ultimate Guitar tab URL
}

/** What to work on next. `null` is never returned: an empty queue and an
 * all-green queue are different states and must render differently. */
export type NextUp =
	| { kind: 'learning'; song: Song }
	| { kind: 'all-green' }
	| { kind: 'empty' };

export const songs: Song[] = [
	{
		slug: 'say-it-aint-so',
		title: 'Say It Ain\u2019t So',
		artist: 'Weezer',
		status: 'warm',
		archived: false,
		tier: 'core',
		order: 1,
		hardPart: 'intro hook + verse root-motion',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/weezer/say-it-aint-so-official-1952129',
	},
	{
		slug: 'dancing-queen',
		title: 'Dancing Queen',
		artist: 'ABBA',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 2,
		hardPart: 'octave disco line (verse + chorus)',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/abba/dancing-queen-official-1979611',
	},
	{
		slug: 'interstate-love-song',
		title: 'Interstate Love Song',
		artist: 'Stone Temple Pilots',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 3,
		hardPart: 'verse root-motion + unison runs',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/interstate-love-song-official-1958787',
	},
	{
		slug: 'plush',
		title: 'Plush',
		artist: 'Stone Temple Pilots',
		status: 'warm',
		archived: false,
		tier: 'core',
		order: 4,
		hardPart: 'verse pocket',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/plush-official-2130323',
	},
	{
		slug: 'wicked-garden',
		title: 'Wicked Garden',
		artist: 'Stone Temple Pilots',
		status: 'warm',
		archived: false,
		tier: 'core',
		order: 5,
		hardPart: 'verse groove',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/wicked-garden-official-2932436',
	},
	{
		slug: 'hotel-california',
		title: 'Hotel California',
		artist: 'Eagles',
		status: 'dusty',
		archived: false,
		tier: 'core',
		order: 6,
		hardPart: 'intro arpeggio + verse root-motion',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/eagles/hotel-california-official-1910943',
	},
	{
		slug: 'faithfully',
		title: 'Faithfully',
		artist: 'Journey (Boyce Avenue, key of G)',
		status: 'dusty',
		archived: false,
		tier: 'core',
		order: 7,
		hardPart: 'verse root-motion (key of G)',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/journey/faithfully-official-1975267',
	},
	{
		slug: 'my-own-worst-enemy',
		title: 'My Own Worst Enemy',
		artist: 'Lit',
		status: 'warm',
		archived: false,
		tier: 'backup',
		order: 8,
		hardPart: 'refresh pass',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/lit/my-own-worst-enemy-official-2134857',
	},
	{
		slug: 'cumbersome',
		title: 'Cumbersome',
		artist: 'Seven Mary Three',
		status: 'dusty',
		archived: false,
		tier: 'backup',
		order: 9,
		hardPart: 're-learn the part',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/seven-mary-three/cumbersome-official-2218299',
	},
	{
		slug: 'kryptonite',
		title: 'Kryptonite',
		artist: '3 Doors Down',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 10,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/3-doors-down/kryptonite-official-1942221',
	},
	{
		slug: 'summer-of-69',
		title: 'Summer of \u201969',
		artist: 'Bryan Adams',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 11,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/bryan-adams/summer-of-69-official-1960235',
	},
	{
		slug: 'friends-in-low-places',
		title: 'Friends in Low Places',
		artist: 'Garth Brooks',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 12,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/garth-brooks/friends-in-low-places-official-2423303',
	},
	{
		slug: 'to-be-loved-by-you',
		title: 'To Be Loved By You',
		artist: 'Parker McCollum',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 13,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/parker-mccollum/to-be-loved-by-you-official-5011297',
	},
	{
		slug: 'in-too-deep',
		title: 'In Too Deep',
		artist: 'Sum 41',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 14,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/sum-41/in-too-deep-official-1949741',
	},
	{
		slug: 'misery-business',
		title: 'Misery Business',
		artist: 'Paramore',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 15,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/paramore/misery-business-guitar-pro-590967',
	},
	{
		slug: 'crushcrushcrush',
		title: 'crushcrushcrush',
		artist: 'Paramore',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 16,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/paramore/crushcrushcrush-official-1916653',
	},
	{
		slug: 'college-kids',
		title: 'College Kids',
		artist: 'Relient K',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 17,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/relient-k/college-kids-guitar-pro-310718',
	},
	{
		slug: 'be-my-escape',
		title: 'Be My Escape',
		artist: 'Relient K',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 18,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/relient-k/be-my-escape-official-3567452',
	},
	{
		slug: 'who-i-am-hates-who-ive-been',
		title: 'Who I Am Hates Who I\u2019ve Been',
		artist: 'Relient K',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 19,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/relient-k/who-i-am-hates-who-ive-been-official-3935363',
	},
	{
		slug: 'californication',
		title: 'Californication',
		artist: 'Red Hot Chili Peppers',
		status: 'cold',
		archived: false,
		tier: 'core',
		order: 20,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/red-hot-chili-peppers/californication-guitar-pro-229736',
	},
];

export const GIG_DATE = new Date('2026-10-09T00:00:00-05:00');

// Priority: cold > dusty > warm; ties fall back to array order in this file.
const statusRank: Record<SongStatus, number> = { cold: 0, dusty: 1, warm: 2, green: 99 };

export function nextSong(active: Song[]): NextUp {
	const pool = active.filter((s) => !s.archived);
	if (pool.length === 0) return { kind: 'empty' };

	const open = pool.filter((s) => s.status !== 'green');
	if (open.length === 0) return { kind: 'all-green' };

	// Decorate-sort-undecorate: the index breaks every tie, so the result is
	// deterministic (a bare comparator would rely on Array#sort stability for
	// entries that compare equal).
	const ranked = open
		.map((song, index) => ({ song, index }))
		.sort(
			(a, b) =>
				statusRank[a.song.status] - statusRank[b.song.status] || a.index - b.index,
		);
	return { kind: 'learning', song: ranked[0].song };
}
