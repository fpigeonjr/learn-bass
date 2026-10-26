# learn-bass

A single-person bass practice queue: the songs you already know, plus the ones you're learning now. Originally built as a seven-week sprint to a gig on **October 9, 2026** (the G6 reunion at Canyon Lake), now a standing queue. Served at <https://fpigeonjr.github.io/learn-bass/>.

## What it is

- **14 songs on the setlist** (12 core + 2 backups), each with a status, an archived flag, and a named hard part.
- **10 lesson pages** — an orientation plus 9 authored song lessons. Each covers: form map, root motion, signature hooks (tab), tempo ramp, the hard part, feel, memory cue, and a technique primer. The remaining songs render a "being written" stub until their lesson lands.
- **Reference cheat sheets**: warm-ups & right hand, scales & arpeggios (mapped to the setlist), setlist & form map, glossary.
- **A dashboard** (single-user, localStorage-only) with a "currently learning" hero, a status legend that doubles as a filter, the song board, and a daily warm-up checklist.
- **Play-along charts** for warm-ups and scales — an animated practice player with 24 digital permutations across all four strings.

### The queue model

`status` (`cold → dusty → warm → green`) and `archived` are **orthogonal axes**. Status is maturity; archive is scope. Archiving shelves a song without destroying its status — unarchive it and it comes back exactly where it was. Two consequences worth knowing:

- Archived songs are excluded from the queue, the status counts, and the green percentage, so the meter always answers "how is my active queue doing."
- Archived is a *display scope*, not a deletion: archived songs stay listed (badged) on the static pages, and their lesson URLs always resolve.

"What now" picks the lowest-status non-archived song, tie-breaking by source order in `songs.ts`. The hero distinguishes **empty rotation** from **all-green** — those are different states and render differently.


## The goal

Play the full set from memory — no charts, no panic. Fills are stretch, not required. Long-term bass fundamentals are the subsurface payoff, subordinated to the songs.

## Structure

```
.
├── src/                    # Astro site (the shell + dashboard)
│   ├── pages/              # routes (lessons, reference/*, about)
│   ├── components/
│   │   ├── Tracker.astro   # song board island (localStorage)
│   │   └── WarmupGame.astro # animated play-along player
│   ├── data/songs.ts       # setlist + status + priority logic (source of truth)
│   ├── lib/                # queue/archive state, lesson reader, scales, url helper (+ tests)
│   └── styles/             # global chrome + lesson typography
├── course/                 # teach-skill workspace (the actual course content)
│   ├── MISSION.md          # why this course exists (public)
│   ├── RESOURCES.md        # trusted sources (BPM to source, links to vet)
│   ├── GLOSSARY.md         # canonical terms (public)
│   ├── lessons/*.html      # one self-contained lesson per song + orientation
│   └── assets/course.css   # print-friendly lesson stylesheet
└── .github/workflows/      # ci (build + unit + e2e), gh-pages deploy
```

## Developing

Requires Node >= 22.12.0.

```sh
npm install
npm run dev          # http://localhost:4321/learn-bass/
npm run build        # static build to dist/
npm test             # unit tests (vitest)
npm run test:e2e     # Playwright e2e (needs `npx playwright install chromium` once)
```

> The dev server serves under `/learn-bass/` (the `base` in `astro.config.mjs`). GitHub Pages serves the repo at a sub-path, so `site` + `base` are set accordingly — use the `url()` helper from `src/lib/url.ts` for internal links rather than a raw `href="/..."`, which breaks on the deployed site.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically. Requires GitHub Pages be set to "Deploy from a GitHub Action" in repo Settings → Pages. CI (`.github/workflows/ci.yml`) runs the build, unit tests with coverage, and the Playwright suite on every push and PR.

## Authoring notes

- **Lesson content lives in `course/lessons/*.html`** (teach-skill format). The Astro route `src/pages/lessons/[slug].astro` reads them at build via `src/lib/lessons.ts` and injects the body. Never author lesson content directly in `.astro` pages.
- **Missing lessons fail soft.** `getLesson` falls back to a stub when `course/lessons/<slug>.html` doesn't exist, so a page still renders while content is authored. Keep `hasLesson` in `songs.ts` in sync so the lesson index shows "coming soon" rather than a dead link.
- **Internal scaffolding is gitignored**: `course/NOTES.md` and `course/learning-records/` are session state, not course content.
- **Song status and archive state** live in `src/data/songs.ts` as shipped defaults, overridden at runtime in the browser via `localStorage` (`learn-bass:status:v1`, `learn-bass:archive:v1`). The warm-up checklist uses `learn-bass:warmup:v1`. This is the durability limit: clearing site data resets your queue.
- **Client logic lives in `src/lib/queue.ts`** and is imported by both the dashboard and the `Tracker` island. It used to be duplicated as a hand-synced inline copy (`nextSong` in `Tracker.astro`), which is exactly the kind of drift a refactor should not re-introduce.
- **Priority rule** ("what now"): lowest status among non-archived songs (`cold > dusty > warm`), ties broken by array order in `songs.ts`, `green` excluded, all-green reported separately from empty.
- **One composed visibility predicate.** The status chip and the archive toggle are two axes on the same row; both live in `isVisible()` in `src/lib/queue.ts` so neither can clobber the other by writing `row.hidden` independently. Note `.board li[hidden]` needs an explicit `display:none` rule — `display:flex` outranks the UA `[hidden]` default.
- **The Tracker island owns the status filter, including `#status=` on init.** Do not push the initial filter from another `<script>`: module scripts run in document order and the dashboard's script is emitted *before* the Tracker bundle, so a `window.__setStatusFilter` call at boot is a no-op and silently drops the deep link. Chips in `index.astro` only forward *subsequent* clicks and read current state off the DOM.
- **Two style worlds on purpose**: `global.css` is dark dashboard chrome, `lesson.css` is light and print-friendly. `course/assets/course.css` is the canonical print sheet; its `<link>` is stripped from injected lessons to avoid duplicate/path conflicts.

## Known gaps

- **BPM per song is unverified.** Target tempos must come from the recordings, not guessed. `src/data/songs.ts` has no BPM field yet, and the setlist page says key/tempo "live in each lesson… as lessons are authored." This is the biggest risk to the "at gig tempo" success criterion.
- **There is no way to add a song from the UI.** The queue is a code-level list; a new song means editing `songs.ts` (and hand-writing a lesson if it needs one).
- **`heroMessage` builds HTML by string concatenation** (`src/lib/queue.ts`) and interpolates `title`/`hardPart` unescaped. Harmless while song data is authored in `songs.ts`, but it becomes markup-injection surface the moment song editing moves into the UI. Escape at that point (or build with DOM nodes).
- **Static-page archived badges are build-time dead code today.** Every song ships `archived: false`, so the `{s.archived && <span class="badge archive">}` branch never renders and no test exercises it. The e2e assertion only guards the inverse invariant (no badges when nothing is archived). First song archived in `songs.ts` defaults is when this needs a real test.
- **First-paint flash on the dashboard.** Archived rows and status counts are rendered from shipped defaults, then corrected once the Tracker island hydrates. With local overrides you briefly see the unfiltered/stale numbers. Inherent to static HTML + localStorage.
- **Status buttons vs archive button accessible state.** Both use `aria-pressed` now; the four status buttons additionally convey state via the `.active` class.
- **Archive state is browser-local.** No export/import, no sync — a browser-clear forfeits the queue.
- **Gig-era vocabulary remains.** `tier` (core/backup), `order`, and the "Setlist" page title were kept for a smaller diff; `tier` no longer affects priority.
- **Five songs still need charting**: Kryptonite, Summer of '69, Friends in Low Places, To Be Loved By You, In Too Deep (`hasLesson: false`).
- **Faithfully** is a Boyce Avenue arrangement in the key of G — root-motion voicings need confirming with Paul.

## To do

- [ ] Source verified BPM per song (recordings), confirm against Ultimate Guitar
- [ ] Chart the 5 unauthored songs
- [ ] Decide whether song editing belongs in the UI or stays a code edit
- [ ] Vet/swap the YouTube bass-cover links
- [ ] Confirm the Faithfully (key of G) voicings with Paul
