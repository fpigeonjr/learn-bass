# Mission: Keep a Bass Queue

## Why
This started as a seven-week sprint to a reunion gig with the G6 band on Friday, October 9, 2026 at Canyon Lake, after roughly a year away from the instrument. That gig is done. What remains useful is the habit and the repertoire, so the course has been retooled into a **standing queue**: songs I already know, kept from going rusty, plus the ones I'm actively learning.

## Success looks like
- A short rotation of songs I can play from memory, at tempo, without charts.
- Hitting the recognizable signature hooks, not just the root motion.
- A queue that reflects reality: what's solid, what's rusty, what's new.
- Learning something new without letting the old set decay.

## The queue model
- **Status** is maturity: `cold` (not started) → `dusty` (rusty) → `warm` (needs reps) → `green` (solid).
- **Archived** is scope, and is orthogonal to status. Archiving shelves a song without changing its status; unarchiving restores it exactly. Archived songs are excluded from the queue, the counts, and the progress meter.
- **"What now"** picks the lowest-status non-archived song, tie-breaking by list order.

## Constraints
- Returning player; practice in ~45-60 min daily sessions.
- Uses Ultimate Guitar (paid) for full tabs/playback — this course owns the *bass-specific* gold (root motion, hooks, hard parts), not full transcriptions.
- Single user. State lives in the browser (localStorage), so clearing site data resets the queue.

## Out of scope
- Note-for-note transcription fidelity (fills/embellishment are stretch, not required).
- General music theory beyond what a song needs ("one transferable idea" per lesson).
- Setlist planning and gig logistics.
