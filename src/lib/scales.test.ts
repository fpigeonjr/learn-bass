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

	it('each scale starts and ends on its root', () => {
		for (const scale of SCALES) {
			const first = scale.notes[0];
			const last = scale.notes[scale.notes.length - 1];
			expect(isRest(first)).toBe(false);
			expect(isRest(last)).toBe(false);
			expect(first!.string).toBe(last!.string);
			expect(first!.fret).toBe(last!.fret);
		}
	});

	it('E minor pentatonic spells E G A B D (ascending)', () => {
		const em = getScale('em-pentatonic');
		// Ascending portion = first 7 notes (up to octave E).
		const ascending = em.notes.slice(0, 7);
		expect(ascending).toEqual([
			{ string: 'E', fret: 0 }, // E
			{ string: 'E', fret: 3 }, // G
			{ string: 'A', fret: 0 }, // A
			{ string: 'A', fret: 2 }, // B
			{ string: 'D', fret: 0 }, // D
			{ string: 'D', fret: 2 }, // E (octave)
			{ string: 'E', fret: 3 }, // G
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
});

describe('getScale', () => {
	it('returns a known scale by id', () => {
		expect(getScale('g-major').id).toBe('g-major');
	});

	it('falls back to the first scale for an unknown id', () => {
		expect(getScale('nonsense').id).toBe(SCALES[0].id);
	});
});
