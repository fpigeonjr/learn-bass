# learn-bass

A single-person, seven-week bass course to get **gig-ready for October 9, 2026** (Friday, Canyon Lake — the G6 reunion gig). Served at <https://fpigeonjr.github.io/learn-bass/>.

## What it is

- **9 song lessons** (7 core + 2 backups), one per song, each covering: form map, root motion, signature hooks (tab), tempo ramp, the hard part, feel, and memory cues.
- **Reference cheat sheets**: warm-ups, scales, setlist/form map, glossary.
- **A dashboard** (single-user, localStorage-only) with a setlist board, "what to work next" pointer, daily warm-up checklist, and countdown.

A song is **green** when you can play its roots + groove in time from memory, plus the recognizable signature hooks.

## The goal

Play the full set from memory — no charts, no panic. Fills are stretch, not required. Long-term bass fundamentals are the subsurface payoff, subordinated to the songs.

## Structure

```
.
├── src/                    # Astro site (the shell + dashboard)
│   ├── pages/              # routes
│   ├── components/         # Tracker (interactive island)
│   ├── data/songs.ts       # setlist + status + priority logic (source of truth)
│   ├── lib/                # course file reader, url helper
│   └── styles/             # global chrome + lesson typography
├── course/                 # teach-skill workspace (the actual course content)
│   ├── MISSION.md          # why this course exists (public)
│   ├── RESOURCES.md        # trusted sources (BPM to source, links to vet)
│   ├── GLOSSARY.md         # canonical terms (public)
│   ├── lessons/*.html      # one self-contained lesson per song + orientation
│   ├── reference/          # (content lives in src/pages/reference for now)
│   └── assets/course.css   # print-friendly lesson stylesheet
└── .github/workflows/      # gh-pages deploy
```

## Developing

```sh
npm install
npm run dev          # http://localhost:4321/learn-bass/
npm run build        # static build to dist/
```

> The dev server serves under `/learn-bass/` (the `base` in `astro.config.mjs`). History on the `base` config: GitHub Pages serves the repo at a sub-path, so `site` + `base` are set accordingly.

## Deploying

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys to GitHub Pages automatically. Requires GitHub Pages be set to "Deploy from a GitHub Action" in repo Settings → Pages.

## Authoring notes

- **Lesson content lives in `course/lessons/*.html`** (teach-skill format). The Astro route `src/pages/lessons/[slug].astro` reads them at build and injects the body.
- **Internal scaffolding is gitignored**: `course/NOTES.md` and `course/learning-records/` are session state, not course content.
- **Song status** lives in `src/data/songs.ts` (initial values) and is overridden at runtime in the user's browser via `localStorage`.
- **Priority rule** ("what now"): `cold > dusty > warm > green`, tie-break by earliest target week; backups deprioritized; all-green → full-set run.

## To do

- [ ] Source verified BPM per song (recordings), confirm against Ultimate Guitar
- [ ] Vet/swap the YouTube bass-cover links (candidates to be added per lesson)
- [ ] Confirm the Faithfully (key of G) voicings with Paul
- [ ] Full-band jam with Paul/Fidel in weeks 5-6
