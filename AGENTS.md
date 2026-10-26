# learn-bass — agent guidance

Single-person bass practice **queue** (originally a course for a gig on Oct 9, 2026, now passed). Built with **Astro 7**, served via GitHub Pages.

## Architecture (don't break these)

- **Content source of truth = `course/lessons/*.html`** (teach-skill workspace). The Astro route `src/pages/lessons/[slug].astro` reads them at build via `src/lib/lessons.ts` and injects the body. Never author lesson content directly in `.astro` pages.
- **Song data = `src/data/songs.ts`.** Status (`cold|dusty|warm|green`), `archived` (orthogonal scope flag), tier (`core|backup`), `order`, `hardPart`. The "what now" priority logic (`nextSong`) lives here too and returns a discriminated union (`learning | all-green | empty`).
- **The dashboard is client-hydrated**, not server-stateful. `src/components/Tracker.astro` imports song data and shared logic from `src/lib/queue.ts` as a bundled module (do NOT inline a copy of queue logic in a `<script>` — that duplication was removed). Status persists under `learn-bass:status:v1`, archive under `learn-bass:archive:v1`, warm-up checklist under `learn-bass:warmup:v1`. The Tracker island is the single owner of the status filter, including parsing `#status=` on init.
- **Base path**: GitHub Pages serves at `/learn-bass/`. `astro.config.mjs` sets `site` + `base`. In `.astro` templates use the `url()` helper from `src/lib/url.ts` (or `import.meta.env.BASE_URL`) for internal links — raw `href="/..."` will break on the deployed site.
- **Course styling** is split: `src/styles/global.css` (dark dashboard chrome) vs `src/styles/lesson.css` (light, print-friendly lesson body). `course/assets/course.css` is the canonical print sheet; its `<link>` is stripped from injected lessons to avoid duplicate/path issues.

## Gitignore

`course/NOTES.md` and `course/learning-records/` are intentionally gitignored — session scaffolding, not public content. `MISSION.md`, `RESOURCES.md`, `GLOSSARY.md` in `course/` are public.

## Workflow

- `npm run dev` → http://localhost:4321/learn-bass/
- `npm run build` → `dist/`
- Deploy: push to `main` (`.github/workflows/deploy.yml`).

## Known open items

- BPM per song should be sourced from recordings (not guessed) — see `course/RESOURCES.md` "Gaps".
- YouTube bass-cover links are candidates to be vetted by Frank.
- "Faithfully" (key of G, Boyce Avenue) voicings need confirming with Paul.

## Context worth knowing

- The owner (Frank) already has a detailed 7-week plan in his LogSeq vault (`Oct 9 Gig Prep.md`); this app operationalized it, and now serves as his standing queue.
- North star: repertoire, not technique-for-its-own-sake. Technique is a "primer" inside each song lesson.
- Frank uses Ultimate Guitar (paid) for full tabs/playback — the course owns only the bass-specific gold (root motion, hooks, hard parts), and links out for full charts.
- Notation: tab + chord maps only. No standard notation.
