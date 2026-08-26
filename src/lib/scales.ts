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

// Single exercise that climbs chromatically: same scale pattern starting
// on E, then F, F#, G, etc. — so you walk up the fretboard. Each
// position's first note is marked boxStart for the flash indicator.
function chromaticClimb(ascending: Slot[], semitones = 7): Slot[] {
	const out: Slot[] = [];
	for (let off = 0; off < semitones; off++) {
		const shifted = shift(ascending, off);
		const run = ascendDescend(shifted);
		// Mark the first note of each new position (except the very first)
		if (off > 0 && run[0]) (run[0] as any).boxStart = true;
		out.push(...run);
	}
	return out;
}

// E minor pentatonic: E G A B D (up to octave E).
const emPentatonicAscending: Slot[] = [
	n('E', 0), // E
	n('E', 3), // G
	n('A', 0), // A
	n('A', 2), // B
	n('D', 0), // D
	n('D', 2), // E (octave)
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
		notes: chromaticClimb(emPentatonicAscending, 7),
	},
	{
		id: 'em-blues',
		label: 'Blues (E)',
		notes: chromaticClimb(emBluesAscending, 7),
	},
	{
		id: 'g-major',
		label: 'G major',
		notes: chromaticClimb(gMajorAscending, 7),
	},
	{
		id: 'a-minor',
		label: 'A minor',
		notes: chromaticClimb(aMinorAscending, 7),
	},
];

export function getScale(id: string): ScaleDef {
	return SCALES.find((s) => s.id === id) ?? SCALES[0];
}
