// Single source of truth for the setlist and its state.
// Status: cold | dusty | warm | green
// tier:   attack-first (cold) > middle (dusty) > polish (warm) > backup

export type SongStatus = 'cold' | 'dusty' | 'warm' | 'green';

export interface Song {
	slug: string;
	title: string;
	artist: string;
	status: SongStatus; // initial status (tracker overrides via localStorage)
	tier: 'core' | 'backup';
	order: number; // setlist running order (1..n)
	targetWeek: number; // 1..7, soft calendar guidance
	hardPart: string; // shown by the "what now" pointer
	hasLesson: boolean; // whether a full lesson exists yet
	ugTab?: string; // optional Ultimate Guitar tab URL
}

export const songs: Song[] = [
	{
		slug: 'say-it-aint-so',
		title: 'Say It Ain\u2019t So',
		artist: 'Weezer',
		status: 'warm',
		tier: 'core',
		order: 1,
		targetWeek: 1,
		hardPart: 'intro hook + verse root-motion',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/weezer/say-it-aint-so-official-1952129',
	},
	{
		slug: 'dancing-queen',
		title: 'Dancing Queen',
		artist: 'ABBA',
		status: 'cold',
		tier: 'core',
		order: 2,
		targetWeek: 1,
		hardPart: 'octave disco line (verse + chorus)',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/abba/dancing-queen-official-1979611',
	},
	{
		slug: 'interstate-love-song',
		title: 'Interstate Love Song',
		artist: 'Stone Temple Pilots',
		status: 'cold',
		tier: 'core',
		order: 3,
		targetWeek: 1,
		hardPart: 'verse root-motion + unison runs',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/interstate-love-song-official-1958787',
	},
	{
		slug: 'plush',
		title: 'Plush',
		artist: 'Stone Temple Pilots',
		status: 'warm',
		tier: 'core',
		order: 4,
		targetWeek: 2,
		hardPart: 'verse pocket',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/plush-official-2130323',
	},
	{
		slug: 'wicked-garden',
		title: 'Wicked Garden',
		artist: 'Stone Temple Pilots',
		status: 'warm',
		tier: 'core',
		order: 5,
		targetWeek: 2,
		hardPart: 'verse groove',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/stone-temple-pilots/wicked-garden-official-2932436',
	},
	{
		slug: 'hotel-california',
		title: 'Hotel California',
		artist: 'Eagles',
		status: 'dusty',
		tier: 'core',
		order: 6,
		targetWeek: 3,
		hardPart: 'intro arpeggio + verse root-motion',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/eagles/hotel-california-official-1910943',
	},
	{
		slug: 'faithfully',
		title: 'Faithfully',
		artist: 'Journey (Boyce Avenue, key of G)',
		status: 'dusty',
		tier: 'core',
		order: 7,
		targetWeek: 3,
		hardPart: 'verse root-motion (key of G)',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/journey/faithfully-official-1975267',
	},
	{
		slug: 'my-own-worst-enemy',
		title: 'My Own Worst Enemy',
		artist: 'Lit',
		status: 'warm',
		tier: 'backup',
		order: 8,
		targetWeek: 0,
		hardPart: 'refresh pass',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/lit/my-own-worst-enemy-official-2134857',
	},
	{
		slug: 'cumbersome',
		title: 'Cumbersome',
		artist: 'Seven Mary Three',
		status: 'dusty',
		tier: 'backup',
		order: 9,
		targetWeek: 0,
		hardPart: 're-learn the part',
		hasLesson: true,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/seven-mary-three/cumbersome-official-2218299',
	},
	{
		slug: 'kryptonite',
		title: 'Kryptonite',
		artist: '3 Doors Down',
		status: 'cold',
		tier: 'core',
		order: 10,
		targetWeek: 0,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/3-doors-down/kryptonite-official-1942221',
	},
	{
		slug: 'summer-of-69',
		title: 'Summer of \u201969',
		artist: 'Bryan Adams',
		status: 'cold',
		tier: 'core',
		order: 11,
		targetWeek: 0,
		hardPart: 'to chart — tab + root-motion',
		hasLesson: false,
		ugTab: 'https://tabs.ultimate-guitar.com/tab/bryan-adams/summer-of-69-official-1960235',
	},
];

export const GIG_DATE = new Date('2026-10-09T00:00:00-05:00');

// Priority: cold > dusty > warm; tie-break by earliest targetWeek; backups last.
const tierRank: Record<SongStatus, number> = { cold: 0, dusty: 1, warm: 2, green: 99 };

export function nextSong(active: Song[]): Song | null {
	const open = active.filter((s) => s.status !== 'green');
	if (open.length === 0) return null; // all green -> full-set run
	open.sort((a, b) => {
		if (tierRank[a.status] !== tierRank[b.status]) {
			return tierRank[a.status] - tierRank[b.status];
		}
		if (a.tier !== b.tier) return a.tier === 'backup' ? 1 : -1;
		return a.targetWeek - b.targetWeek;
	});
	return open[0];
}
