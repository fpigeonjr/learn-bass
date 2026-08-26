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

export interface ExerciseDef {
	id: ExerciseId;
	label: string;
	length: number; // beats per loop
	chart: number[]; // index into STRINGS per beat; -1 = rest
}

export const EXERCISES: ExerciseDef[] = [
	{
		id: 'alternation',
		label: 'Open-string alternation',
		length: 16,
		chart: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
	},
	{
		id: 'crossing',
		label: 'String crossing',
		length: 16,
		chart: [0, 0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0, 0, 1, -1],
	},
	{
		id: 'spider',
		label: 'Spider 1-2-3-4',
		length: 16,
		chart: [0, 1, 2, 3, 0, 1, 2, 3, 3, 2, 1, 0, 3, 2, 1, 0],
	},
	{
		id: 'roots',
		label: 'Root-pulse (E A D G)',
		length: 8,
		chart: [0, 0, 1, 1, 2, 2, 3, 3],
	},
];

export function getExercise(id: string): ExerciseDef {
	return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0];
}

// Which string (or null for a rest) should sound on a given absolute beat.
export function stringAtBeat(exercise: ExerciseDef, beat: number): StringId | null {
	const index = exercise.chart[beat % exercise.length];
	return index < 0 ? null : STRINGS[index];
}

// Seconds per beat for a given BPM.
export function secondsPerBeat(bpm: number): number {
	return 60 / bpm;
}

export interface NoteLayout {
	dt: number; // seconds until strike; negative = already passed
	y: number; // pixel offset of the note's top edge (relative to lane top)
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
}): NoteLayout {
	const { strikeTime, now, strikeY, runwayPx, lookaheadBeats, bpm } = opts;
	const dt = strikeTime - now;
	const beatDur = secondsPerBeat(bpm);
	const pxPerSec = runwayPx / (lookaheadBeats * beatDur);
	const y = strikeY - dt * pxPerSec;
	return {
		dt,
		y,
		opacity: dt < -0.15 ? 0.25 : 1,
		expired: dt < -0.5,
	};
}

// A note is "rest" if the chart marks it -1 (no note to show/play).
export function isRest(index: number): boolean {
	return index < 0;
}
