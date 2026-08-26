import { describe, it, expect } from 'vitest';
import {
	STRINGS,
	STRING_COLORS,
	EXERCISES,
	getExercise,
	stringAtBeat,
	secondsPerBeat,
	layOutNote,
	isRest,
	type ExerciseId,
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
	it('has all four exercises', () => {
		expect(EXERCISES.map((e) => e.id)).toEqual([
			'alternation',
			'crossing',
			'spider',
			'roots',
		]);
	});

	it('every exercise chart references only valid string indices or -1 (rest)', () => {
		for (const ex of EXERCISES) {
			expect(ex.chart.length).toBeGreaterThan(0);
			expect(ex.length).toBe(ex.chart.length);
			for (const idx of ex.chart) {
				expect(idx).toBeGreaterThanOrEqual(-1);
				expect(idx).toBeLessThanOrEqual(STRINGS.length - 1);
			}
		}
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

describe('stringAtBeat', () => {
	const spider = getExercise('spider');

	it('walks E→A→D→G for the first four beats', () => {
		expect(stringAtBeat(spider, 0)).toBe('E');
		expect(stringAtBeat(spider, 1)).toBe('A');
		expect(stringAtBeat(spider, 2)).toBe('D');
		expect(stringAtBeat(spider, 3)).toBe('G');
	});

	it('wraps around by the loop length (modulo)', () => {
		expect(stringAtBeat(spider, 16)).toBe(stringAtBeat(spider, 0));
		expect(stringAtBeat(spider, 17)).toBe(stringAtBeat(spider, 1));
	});

	it('returns null for rests', () => {
		const crossing = getExercise('crossing');
		// crossing chart has a rest at index 15 (-1)
		expect(stringAtBeat(crossing, 15)).toBeNull();
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
	const geometry = {
		strikeY: 500,
		runwayPx: 460,
		lookaheadBeats: 4,
		bpm: 80,
	};

	it('places a note at the strike line exactly when now === strikeTime', () => {
		const now = 10;
		const r = layOutNote({ strikeTime: now, now, ...geometry });
		expect(r.dt).toBe(0);
		expect(r.y).toBeCloseTo(500, 5);
		expect(r.opacity).toBe(1);
		expect(r.expired).toBe(false);
	});

	it('shows a future note above the strike line (smaller y)', () => {
		const now = 10;
		const r = layOutNote({ strikeTime: now + 2, now, ...geometry });
		expect(r.dt).toBeCloseTo(2, 5);
		expect(r.y).toBeLessThan(500);
	});

	it('dims a note slightly past the strike, and expires it further past', () => {
		const now = 10;
		const dimmed = layOutNote({ strikeTime: now - 0.2, now, ...geometry });
		expect(dimmed.opacity).toBe(0.25);
		expect(dimmed.expired).toBe(false);

		const expired = layOutNote({ strikeTime: now - 0.6, now, ...geometry });
		expect(expired.expired).toBe(true);
	});

	it('a note exactly `lookahead` beats in the future lands at the top of the runway', () => {
		const beatDur = secondsPerBeat(80); // 0.75s
		const now = 10;
		const strikeTime = now + geometry.lookaheadBeats * beatDur;
		const r = layOutNote({ strikeTime, now, ...geometry });
		// top of runway = strikeY - runwayPx
		expect(r.y).toBeCloseTo(500 - 460, 1);
	});
});

describe('isRest', () => {
	it('detects rests (index -1)', () => {
		expect(isRest(-1)).toBe(true);
		expect(isRest(0)).toBe(false);
		expect(isRest(3)).toBe(false);
	});
});
