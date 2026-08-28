import { describe, it, expect } from 'vitest';
import {
	STRINGS,
	STRING_COLORS,
	EXERCISES,
	PERMUTATION_ORDERS,
	permutations,
	getExercise,
	noteAtBeat,
	secondsPerBeat,
	layOutNote,
	strikeLineY,
	isRest,
	type Note,
} from './warmup';

describe('STRINGS', () => {
	it('lists strings low → high', () => {
		expect(STRINGS).toEqual(['E', 'A', 'D', 'G']);
	});

	it('has a color for every string', () => {
		for (const s of STRINGS) {
			expect(STRING_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
		}
	});
});

describe('EXERCISES', () => {
	it('has all five exercises', () => {
		expect(EXERCISES.map((e) => e.id)).toEqual([
			'alternation',
			'crossing',
			'spider',
			'roots',
			'permutations',
		]);
	});

	it('every exercise chart has a valid length and only known strings / non-negative frets', () => {
		for (const ex of EXERCISES) {
			expect(ex.chart.length).toBeGreaterThan(0);
			expect(ex.length).toBe(ex.chart.length);
			for (const slot of ex.chart) {
				if (slot === null) continue; // rest is allowed
				expect(STRINGS).toContain(slot.string);
				expect(slot.fret).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('open-string exercises use fret 0 throughout', () => {
		for (const id of ['alternation', 'crossing', 'roots'] as const) {
			const ex = getExercise(id);
			for (const slot of ex.chart) {
				if (slot === null) continue;
				expect(slot.fret).toBe(0);
			}
		}
	});

	it('spider exercise maps frets 1-2-3-4 (and back) across strings', () => {
		const spider = getExercise('spider');
		const frets = spider.chart.map((slot) => (slot ? slot.fret : null));
		expect(frets).toEqual([
			1, 2, 3, 4, // E string
			1, 2, 3, 4, // A string
			4, 3, 2, 1, // D string (descend)
			4, 3, 2, 1, // G string (descend)
		]);
	});
});

describe('getExercise', () => {
	it('returns a known exercise by id', () => {
		expect(getExercise('spider').id).toBe('spider');
	});

	it('falls back to the first exercise for an unknown id', () => {
		expect(getExercise('nonsense').id).toBe(EXERCISES[0].id);
	});

	it('is case-sensitive (ids are exact)', () => {
		expect(getExercise('Spider').id).toBe(EXERCISES[0].id); // unknown → fallback
	});
});

describe('noteAtBeat', () => {
	const spider = getExercise('spider');

	it('returns the note (string + fret) for a beat', () => {
		expect(noteAtBeat(spider, 0)).toEqual({ string: 'E', fret: 1 });
		expect(noteAtBeat(spider, 4)).toEqual({ string: 'A', fret: 1 });
		expect(noteAtBeat(spider, 11)).toEqual({ string: 'D', fret: 1 });
	});

	it('wraps around by the loop length (modulo)', () => {
		expect(noteAtBeat(spider, 16)).toEqual(noteAtBeat(spider, 0));
		expect(noteAtBeat(spider, 17)).toEqual(noteAtBeat(spider, 1));
	});

	it('returns null for rests', () => {
		const crossing = getExercise('crossing');
		// crossing chart has a rest at index 15
		expect(noteAtBeat(crossing, 15)).toBeNull();
	});
});

describe('secondsPerBeat', () => {
	it('computes seconds per beat from BPM', () => {
		expect(secondsPerBeat(60)).toBe(1);
		expect(secondsPerBeat(120)).toBe(0.5);
		expect(secondsPerBeat(90)).toBeCloseTo(0.6667, 3);
	});
});

describe('layOutNote', () => {
	const noteHeight = 22;
	const geometry = {
		strikeY: 500,
		runwayPx: 460,
		lookaheadBeats: 4,
		bpm: 80,
		noteHeight,
	};

	it('centers the note on the strike line exactly when now === strikeTime (the click)', () => {
		const now = 10;
		const r = layOutNote({ strikeTime: now, now, ...geometry });
		expect(r.dt).toBe(0);
		// y is the top edge; the note's center must sit on the line so the
		// visual crossing matches the metronome.
		expect(r.y + noteHeight / 2).toBeCloseTo(500, 5);
		expect(r.y).toBeCloseTo(500 - noteHeight / 2, 5);
		expect(r.opacity).toBe(1);
		expect(r.expired).toBe(false);
	});

	it('a taller note is centered, not top-aligned, at the strike moment', () => {
		const now = 10;
		const tall = layOutNote({ strikeTime: now, now, ...geometry, noteHeight: 26 });
		expect(tall.y + 13).toBeCloseTo(500, 5);
	});

	it('shows a future note above the strike line (smaller y)', () => {
		const now = 10;
		const r = layOutNote({ strikeTime: now + 2, now, ...geometry });
		expect(r.dt).toBeCloseTo(2, 5);
		expect(r.y + noteHeight / 2).toBeLessThan(500);
	});

	it('dims a note slightly past the strike, and expires it further past', () => {
		const now = 10;
		const dimmed = layOutNote({ strikeTime: now - 0.2, now, ...geometry });
		expect(dimmed.opacity).toBe(0.25);
		expect(dimmed.expired).toBe(false);

		const expired = layOutNote({ strikeTime: now - 0.6, now, ...geometry });
		expect(expired.expired).toBe(true);
	});

	it('falls at a constant rate: one beat of time = runwayPx / lookaheadBeats of distance', () => {
		const now = 10;
		const beatDur = secondsPerBeat(80); // 0.75s
		const a = layOutNote({ strikeTime: now + 2 * beatDur, now, ...geometry });
		const b = layOutNote({ strikeTime: now + 1 * beatDur, now, ...geometry });
		expect(b.y - a.y).toBeCloseTo(geometry.runwayPx / geometry.lookaheadBeats, 5);
	});

	it('a note exactly `lookahead` beats in the future lands at the top of the runway', () => {
		const beatDur = secondsPerBeat(80); // 0.75s
		const now = 10;
		const strikeTime = now + geometry.lookaheadBeats * beatDur;
		const r = layOutNote({ strikeTime, now, ...geometry });
		// top of runway = strikeY - runwayPx (center-aligned, half note above)
		expect(r.y).toBeCloseTo(500 - 460 - noteHeight / 2, 1);
	});
});

describe('strikeLineY', () => {
	it('places the line center at bottom-offset + half line-height from the stage bottom', () => {
		// .gh-strike: bottom: 56px, height: 2px → center 57px above the bottom.
		expect(strikeLineY(600)).toBe(600 - 57);
	});
});

describe('permutations', () => {
	it('produces all n! orderings, each exactly once', () => {
		const result = permutations([1, 2, 3, 4]);
		expect(result).toHaveLength(24);
		expect(new Set(result.map((p) => p.join('')))).toHaveLength(24);
		for (const p of result) expect([...p].sort()).toEqual([1, 2, 3, 4]);
	});

	it('handles the trivial cases', () => {
		expect(permutations([])).toEqual([[]]);
		expect(permutations(['x'])).toEqual([['x']]);
	});
});

describe('permutations exercise', () => {
	const ex = getExercise('permutations');

	it('the core list now includes the single permutations track', () => {
		expect(EXERCISES.map((e) => e.id)).toEqual([
			'alternation',
			'crossing',
			'spider',
			'roots',
			'permutations',
		]);
		expect(ex.label).toBe('Digital permutations (all 24)');
	});

	it('cycles through all 24 orderings, each across E → A → D → G', () => {
		expect(ex.length).toBe(24 * 16);
		expect(ex.chart).toHaveLength(ex.length);
		PERMUTATION_ORDERS.forEach((order, p) => {
			const base = p * 16;
			STRINGS.forEach((str, si) => {
				order.forEach((fret, fi) => {
					expect(ex.chart[base + si * 4 + fi]).toEqual({ string: str, fret });
				});
			});
		});
	});

	it('starts with 1234 on E and ends with 4321 on G', () => {
		expect(ex.chart.slice(0, 4)).toEqual([
			{ string: 'E', fret: 1 }, { string: 'E', fret: 2 },
			{ string: 'E', fret: 3 }, { string: 'E', fret: 4 },
		]);
		expect(ex.chart.slice(-4)).toEqual([
			{ string: 'G', fret: 4 }, { string: 'G', fret: 3 },
			{ string: 'G', fret: 2 }, { string: 'G', fret: 1 },
		]);
	});
});

describe('isRest', () => {
	it('detects rests (null slot)', () => {
		expect(isRest(null)).toBe(true);
		expect(isRest({ string: 'E', fret: 0 })).toBe(false);
	});
});
