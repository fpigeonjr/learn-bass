// Browser-side helpers for the dashboard islands.
//
// This module exists so `Tracker.astro` and `index.astro` can share queue logic
// instead of each keeping a hand-synced copy (the inline `nextSong` duplication
// was the previous arrangement). Astro bundles `<script>` imports, so both
// islands can import from here directly.
//
// It must stay dependency-light and DOM-free so it remains unit-testable.

import { nextSong, type NextUp, type Song, type SongStatus } from '../data/songs';

/** localStorage key for per-song status overrides. */
export const STATUS_KEY = 'learn-bass:status:v1';
/** localStorage key for per-song archive overrides. */
export const ARCHIVE_KEY = 'learn-bass:archive:v1';

export interface StoredState {
	status: Record<string, SongStatus>;
	archived: Record<string, boolean>;
}

function readRecord(key: string): Record<string, unknown> {
	try {
		const raw = localStorage.getItem(key);
		const parsed = raw ? JSON.parse(raw) : {};
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

export function loadState(): StoredState {
	const status = readRecord(STATUS_KEY) as Record<string, SongStatus>;
	const archived = readRecord(ARCHIVE_KEY) as Record<string, boolean>;
	return { status, archived };
}

export function saveStatus(slug: string, status: SongStatus): void {
	const next = { ...(readRecord(STATUS_KEY) as Record<string, SongStatus>), [slug]: status };
	localStorage.setItem(STATUS_KEY, JSON.stringify(next));
}

export function saveArchived(slug: string, archived: boolean): void {
	const all = { ...(readRecord(ARCHIVE_KEY) as Record<string, boolean>), [slug]: archived };
	localStorage.setItem(ARCHIVE_KEY, JSON.stringify(all));
}

/** Merge shipped defaults with the user's localStorage overrides.
 *
 * Overrides are validated, not trusted: localStorage is user-writable, and a
 * stray value (tampered, or left behind by an older build) would otherwise
 * produce a status outside the four known ones — which vanishes from the
 * counts, the meter, and every status chip, and cannot be filtered to.
 */
export function liveSongs(songs: Song[], state: StoredState = loadState()): Song[] {
	return songs.map((s) => {
		const override = state.status[s.slug];
		const archivedOverride = state.archived[s.slug];
		return {
			...s,
			status: isStatus(override) ? override : s.status,
			archived: typeof archivedOverride === 'boolean' ? archivedOverride : s.archived,
		};
	});
}

const STATUSES: readonly SongStatus[] = ['cold', 'dusty', 'warm', 'green'];

export function isStatus(value: unknown): value is SongStatus {
	return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

export interface Counts {
	/** Current (non-archived) songs by status. */
	byStatus: Record<SongStatus, number>;
	/** How many songs are shelved. */
	archived: number;
	/** How many songs are still in rotation. */
	current: number;
	/** Percentage of *current* songs that are green. */
	greenPct: number;
}

/** Counts scope to current songs only: archiving removes a song from both the
 * numerator and the denominator, so the meter always means "how is my active
 * queue doing" rather than becoming permanently depressed by shelved songs. */
export function computeCounts(active: Song[]): Counts {
	const byStatus: Record<SongStatus, number> = { cold: 0, dusty: 0, warm: 0, green: 0 };
	let archived = 0;
	let current = 0;
	for (const s of active) {
		if (s.archived) {
			archived += 1;
			continue;
		}
		current += 1;
		byStatus[s.status] += 1;
	}
	const greenPct = current === 0 ? 0 : Math.round((byStatus.green / current) * 100);
	return { byStatus, archived, current, greenPct };
}

/** Current songs that still need work, in queue order. */
interface Border {
	/** Whether the row's archived flag matches the toggle. */
	archivedMatches: boolean;
	/** Whether the row's status matches the active chip (null = any). */
	statusMatches: boolean;
}

/** Single composed visibility predicate.
 *
 * Both filters are view concerns that used to write `row.hidden` independently,
 * which meant one silently clobbered the other. Composing them here keeps the
 * two axes (archived scope x status chip) honest. */
export function isVisible({ archivedMatches, statusMatches }: Border): boolean {
	return archivedMatches && statusMatches;
}

export function heroMessage(next: NextUp, baseUrl: string): string {
	const label = '<span class="label">What now</span>';
	if (next.kind === 'empty') {
		return (
			`${label}<div class="title">Nothing in rotation</div>` +
			'<div class="artist">Every song is archived — turn on “Show archived” and unarchive the one you want to work.</div>'
		);
	}
	if (next.kind === 'all-green') {
		return (
			`${label}<div class="title">Queue cleared 🎸</div>` +
			'<div class="artist">Everything currently in rotation is green. Learn something new, or unarchive a song to refresh it.</div>'
		);
	}
	const { song } = next;
	const href = song.hasLesson ? `${baseUrl}lessons/${song.slug}/` : `${baseUrl}lessons/`;
	const action = song.hasLesson ? 'open the lesson' : 'browse lessons';
	return (
		`${label}<div class="title">Currently learning: ${song.title}</div>` +
		`<div class="artist">Work the <strong>${song.hardPart}</strong> — <a href="${href}">${action}</a>.</div>`
	);
}

export { nextSong };
export type { NextUp, Song, SongStatus };
