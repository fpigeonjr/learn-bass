import { describe, it, expect } from 'vitest';
import { SCALES, getScale } from './scales';
import { STRINGS, isRest } from './warmup';

describe('SCALES', () => {
	it('has all four scales', () => {
		expect(SCALES.map((s) => s.id)).toEqual([
			'em-pentatonic',
			'em-blues',
			'g-major',
			'a-minor',
		]);
	});

	it('every scale has notes with known strings and non-negative frets (or rest)', () => {
		for (const scale of SCALES) {
			expect(scale.notes.length).toBeGreaterThan(0);
			for (const slot of scale.notes) {
				if (isRest(slot)) continue;
				expect(STRINGS).toContain(slot!.string);
				expect(slot!.fret).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('each scale starts on its root', () => {
		for (const scale of SCALES) {
			const first = scale.notes[0];
			expect(isRest(first)).toBe(false);
			// First note should be the low root (fret 0-3)
			expect(first!.fret).toBeLessThan(5);
		}
	});

	it('E minor pentatonic spells E G A B D (ascending)', () => {
		const em = getScale('em-pentatonic');
		// Ascending portion = first 6 notes (E up to octave E).
		const ascending = em.notes.slice(0, 6);
		expect(ascending).toEqual([
			{ string: 'E', fret: 0 }, // E
			{ string: 'E', fret: 3 }, // G
			{ string: 'A', fret: 0 }, // A
			{ string: 'A', fret: 2 }, // B
			{ string: 'D', fret: 0 }, // D
			{ string: 'D', fret: 2 }, // E (octave)
		]);
	});

	it('E blues adds the flat-5 B♭ (A string fret 1)', () => {
		const blues = getScale('em-blues');
		expect(blues.notes[3]).toEqual({ string: 'A', fret: 1 }); // B♭
	});

	it('G major spells G A B C D E F♯', () => {
		const g = getScale('g-major');
		expect(g.notes.slice(0, 8)).toEqual([
			{ string: 'E', fret: 3 }, // G
			{ string: 'A', fret: 0 }, // A
			{ string: 'A', fret: 2 }, // B
			{ string: 'A', fret: 3 }, // C
			{ string: 'D', fret: 0 }, // D
			{ string: 'D', fret: 2 }, // E
			{ string: 'D', fret: 4 }, // F♯
			{ string: 'G', fret: 0 }, // G
		]);
	});

	it('A minor spells A B C D E F G', () => {
		const am = getScale('a-minor');
		expect(am.notes.slice(0, 8)).toEqual([
			{ string: 'A', fret: 0 }, // A
			{ string: 'A', fret: 2 }, // B
			{ string: 'A', fret: 3 }, // C
			{ string: 'D', fret: 0 }, // D
			{ string: 'D', fret: 2 }, // E
			{ string: 'D', fret: 3 }, // F
			{ string: 'G', fret: 0 }, // G
			{ string: 'G', fret: 2 }, // A
		]);
	});

	it('scales climb chromatically (E -> F -> F# ...)', () => {
		for (const scale of SCALES) {
			const hasHigh = scale.notes.some((s) => s && s.fret >= 6);
			expect(hasHigh, `${scale.id} should have notes up the board`).toBe(true);
		}
		// E minor pentatonic E0 appears again as F (1), F# (2), G (3) up the board
		const em = getScale('em-pentatonic');
		expect(em.notes).toContainEqual(expect.objectContaining({ string: 'E', fret: 1 }));
		expect(em.notes).toContainEqual(expect.objectContaining({ string: 'E', fret: 2 }));
		// First note of each chromatic position is marked boxStart
		const boxStarts = em.notes.filter((s) => s && (s as any).boxStart);
		expect(boxStarts.length).toBeGreaterThan(0);
	});
});

describe('getScale', () => {
	it('returns a known scale by id', () => {
		expect(getScale('g-major').id).toBe('g-major');
	});

	it('falls back to the first scale for an unknown id', () => {
		expect(getScale('nonsense').id).toBe(SCALES[0].id);
	});
});
