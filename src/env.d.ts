// Ambient declarations for the dashboard's cross-island bridge.
//
// The stat-deck chips live in `index.astro` but filtering is owned by the
// Tracker island (which holds view state and composes the two axes). Calling
// through a typed global keeps the two `<script>` blocks decoupled while
// making the contract explicit.

declare global {
	interface Window {
		/** Set or clear the board's status filter. `null` shows all statuses. */
		__setStatusFilter?: (status: string | null) => void;
	}
}

export {};
