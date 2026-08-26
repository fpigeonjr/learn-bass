// Scale note sequences for the play-along chart.
// Each scale is a list of (string, fret) notes — null = rest.
// Standard first-position bass fingerings (4-string, E-A-D-G).

import type { StringId, Slot } from './warmup';

export interface ScaleDef {
	id: string;
	label: string;
	notes: Slot[];
}

const n = (string: StringId, fret: number): Slot => ({ string, fret });

// Shift every fretted note up by `semitones` (open 0 becomes 12, etc.).
function shift(notes: Slot[], semitones: number): Slot[] {
	return notes.map((s) => (s ? { string: s.string, fret: s.fret + semitones } : s));
}

// Ascend one octave, then descend back to the root — the classic
// "run the scale" exercise that loops naturally.
function ascendDescend(ascending: Slot[]): Slot[] {
	const down = [...ascending].reverse();
	// Drop the duplicate root at the turn-around, re-add descending without it.
	return [...ascending, ...down.slice(1)];
}

// Single exercise up the fretboard: low position → high position (+12)
// then back down, so you climb the neck in one chart.
function upTheBoard(ascending: Slot[]): Slot[] {
	const low = ascending;
	const high = shift(ascending, 12);
	// Ascend low, ascend high, then descend high, descend low (one continuous run).
	const up = [...low, ...high];
	const down = [...high].reverse().slice(1).concat([...low].reverse());
	return [...up, ...down];
}

// E minor pentatonic: E G A B D (up to octave E, then G).
const emPentatonicAscending: Slot[] = [
	n('E', 0), // E
	n('E', 3), // G
	n('A', 0), // A
	n('A', 2), // B
	n('D', 0), // D
	n('D', 2), // E (octave)
	n('E', 3), // G
];

// E blues: E G A B♭ B D (adds the flat 5 between A and B).
const emBluesAscending: Slot[] = [
	n('E', 0), // E
	n('E', 3), // G
	n('A', 0), // A
	n('A', 1), // B♭
	n('A', 2), // B
	n('D', 0), // D
	n('D', 2), // E (octave)
	n('E', 3), // G
];

// G major: G A B C D E F♯ G.
const gMajorAscending: Slot[] = [
	n('E', 3), // G
	n('A', 0), // A
	n('A', 2), // B
	n('A', 3), // C
	n('D', 0), // D
	n('D', 2), // E
	n('D', 4), // F♯
	n('G', 0), // G (octave)
];

// A natural minor: A B C D E F G A.
const aMinorAscending: Slot[] = [
	n('A', 0), // A
	n('A', 2), // B
	n('A', 3), // C
	n('D', 0), // D
	n('D', 2), // E
	n('D', 3), // F
	n('G', 0), // G
	n('G', 2), // A (octave)
];

export const SCALES: ScaleDef[] = [
	{
		id: 'em-pentatonic',
		label: 'E minor pentatonic',
		notes: upTheBoard(emPentatonicAscending),
	},
	{
		id: 'em-blues',
		label: 'Blues (E)',
		notes: upTheBoard(emBluesAscending),
	},
	{
		id: 'g-major',
		label: 'G major',
		notes: upTheBoard(gMajorAscending),
	},
	{
		id: 'a-minor',
		label: 'A minor',
		notes: upTheBoard(aMinorAscending),
	},
];

export function getScale(id: string): ScaleDef {
	return SCALES.find((s) => s.id === id) ?? SCALES[0];
}
