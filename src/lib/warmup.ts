// Pure logic for the warm-up play-along chart.
// Kept UI-free so it can be unit-tested without a DOM or audio context.

export type StringId = 'E' | 'A' | 'D' | 'G';

export const STRINGS: StringId[] = ['E', 'A', 'D', 'G']; // low → high, left→right

export const STRING_COLORS: Record<StringId, string> = {
	E: '#c94f4f',
	A: '#e07a3f',
	D: '#4a8f6b',
	G: '#7f8fd0',
};

export type ExerciseId = 'alternation' | 'crossing' | 'spider' | 'roots';

// A single grid position: which string and which fret to play.
// A `null` slot is a rest (no note).
export interface Note {
	string: StringId;
	fret: number; // 0 = open string, 1-4 = fretted (spider)
	boxStart?: boolean; // first note of a new box/position up the neck
}

export type Slot = Note | null;

export interface ExerciseDef {
	id: ExerciseId;
	label: string;
	length: number; // beats per loop (equals chart.length)
	chart: Slot[];
}

// Shorthand helpers keep the charts readable.
const s = (string: StringId, fret: number): Slot => ({ string, fret });
const R = null; // rest

// All n! orderings of an array, in lexicographic order.
export function permutations<T>(items: T[]): T[][] {
	if (items.length <= 1) return [items.slice()];
	const out: T[][] = [];
	for (let i = 0; i < items.length; i++) {
		const rest = items.slice(0, i).concat(items.slice(i + 1));
		for (const tail of permutations(rest)) {
			out.push([items[i], ...tail]);
		}
	}
	return out;
}

export const PERMUTATION_ORDERS = permutations([1, 2, 3, 4]);

// Digital permutations (Lesson 1 — Greg Norris): one chart cycling through
// all 24 finger orderings. Each ordering is played across all four strings
// (E → A → D → G), then the next ordering begins. The whole 384-beat chart
// loops.
const permutationChart: Slot[] = PERMUTATION_ORDERS.flatMap((order) =>
	STRINGS.flatMap((str) => order.map((f): Slot => s(str, f))),
);

export const EXERCISES: ExerciseDef[] = [
	{
		id: 'alternation',
		label: 'Open-string alternation',
		length: 16,
		chart: [
			s('E', 0), s('E', 0), s('E', 0), s('E', 0),
			s('A', 0), s('A', 0), s('A', 0), s('A', 0),
			s('D', 0), s('D', 0), s('D', 0), s('D', 0),
			s('G', 0), s('G', 0), s('G', 0), s('G', 0),
		],
	},
	{
		id: 'crossing',
		label: 'String crossing',
		length: 16,
		chart: [
			s('E', 0), s('E', 0), s('A', 0), s('A', 0),
			s('D', 0), s('D', 0), s('G', 0), s('G', 0),
			s('D', 0), s('D', 0), s('A', 0), s('A', 0),
			s('E', 0), s('E', 0), s('A', 0), R,
		],
	},
	{
		id: 'spider',
		label: 'Spider 1-2-3-4',
		length: 16,
		// One finger per fret, walking across strings: 1-2-3-4 then back down.
		chart: [
			s('E', 1), s('E', 2), s('E', 3), s('E', 4),
			s('A', 1), s('A', 2), s('A', 3), s('A', 4),
			s('D', 4), s('D', 3), s('D', 2), s('D', 1),
			s('G', 4), s('G', 3), s('G', 2), s('G', 1),
		],
	},
	{
		id: 'roots',
		label: 'Root-pulse (E A D G)',
		length: 8,
		chart: [
			s('E', 0), s('E', 0), s('A', 0), s('A', 0),
			s('D', 0), s('D', 0), s('G', 0), s('G', 0),
		],
	},
	{
		id: 'permutations',
		label: 'Digital permutations (all 24)',
		length: permutationChart.length,
		chart: permutationChart,
	},
];

export function getExercise(id: string): ExerciseDef {
	return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0];
}

// Which note (string + fret) — or null for a rest — sounds on a given beat.
export function noteAtBeat(exercise: ExerciseDef, beat: number): Slot {
	return exercise.chart[beat % exercise.length];
}

// Seconds per beat for a given BPM.
export function secondsPerBeat(bpm: number): number {
	return 60 / bpm;
}

// Geometry shared with WarmupGame.astro's scoped CSS. If you change these,
// change the CSS to match.
export const STRIKE_LINE_BOTTOM_PX = 56; // .gh-strike `bottom` offset
export const STRIKE_LINE_HEIGHT_PX = 2; // .gh-strike height
export const RUNWAY_TOP_PX = 40; // notes spawn this far below the stage top

// y-pixel of the strike line's *center* within the stage.
export function strikeLineY(stageHeight: number): number {
	return stageHeight - STRIKE_LINE_BOTTOM_PX - STRIKE_LINE_HEIGHT_PX / 2;
}

export interface NoteLayout {
	dt: number; // seconds until strike; negative = already passed
	y: number; // pixel offset of the note's *top edge* (relative to lane top)
	opacity: number;
	expired: boolean;
}

// Map a note's scheduled strike time to a vertical pixel position.
// strikeY = y-pixel of the strike line, runwayPx = pixel height of the
// look-ahead runway, lookaheadBeats = beats of runway, now = current time.
export function layOutNote(opts: {
	strikeTime: number;
	now: number;
	strikeY: number;
	runwayPx: number;
	lookaheadBeats: number;
	bpm: number;
	noteHeight: number; // rendered pixel height of the note block
}): NoteLayout {
	const { strikeTime, now, strikeY, runwayPx, lookaheadBeats, bpm, noteHeight } = opts;
	const dt = strikeTime - now;
	const beatDur = secondsPerBeat(bpm);
	const pxPerSec = runwayPx / (lookaheadBeats * beatDur);
	// Center the note block on the strike line exactly when the click sounds,
	// so what the eye sees crossing the line matches the metronome.
	const y = strikeY - dt * pxPerSec - noteHeight / 2;
	return {
		dt,
		y,
		opacity: dt < -0.15 ? 0.25 : 1,
		expired: dt < -0.5,
	};
}

// A slot is a "rest" when it's null.
export function isRest(slot: Slot): boolean {
	return slot === null;
}
