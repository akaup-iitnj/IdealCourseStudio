# Build 1 spec · PDF in → week folders

Goal: an instructor installs Course Studio, uploads one textbook PDF, sets the schedule, arranges chapters into weeks, and ends with a project folder on the PC holding every week's chapters as cut PDF + Markdown + named pictures, while watching honest live progress. No lessons, Canvas or chat yet.

Screens (match `prototype/`): Projects (Main), Settings, Upload, Chapters found (Chapters), Chapter boundaries (NoContents), Schedule (ModuleSetup), Module split (ModuleSplit), Files & pictures (Folders).

## Stack for this build

- Electron + React + TS per `CLAUDE.md`.
- Python `cs_py` CLIs: `inspect`, `toc`, `cut`, `convert`, `pictures`. JSON Lines progress.
- PDF: pypdf (outline, page labels), pypdfium2 (cutting, page thumbnails), **MinerU** (Markdown, pictures, tables, LaTeX; or the spike winner), Docling picture classifier (drop logos and decorations).
- Claude: Opus for the module split; Haiku via Batch for picture names and for reading the printed contents page; Sonnet when sources disagree on chapter titles.
- dugite for git.

## Project folder

```
Documents\Course Studio\<project>\
  <book>.pdf                      original, untouched
  project.json                    book, chapters, schedule, split, jobs, status (zod schema in src/shared)
  .git\                           one commit per accepted step
  week-01-<module>-1\             module spanning weeks → "<module>-1", "<module>-2"
    ch01-<slug>.pdf
    ch01-<slug>.md                Markdown with relative picture links and LaTeX
    pictures\ch01\<descriptive-name>.png
    pictures\ch01\pictures.json   name, caption, page, kind (figure|table|equation|photo), cleared flag
  week-02-...\
```

Models live in `%LOCALAPPDATA%\Course Studio\models`, logs in `%LOCALAPPDATA%\Course Studio\logs`.

## Milestones and acceptance

Stop after each for Ash's review. Commit at every green step.

1. **M1 Projects + Upload.** New project dialog (name, folder). Accept one PDF (drop zone + file picker). `cs_py inspect`: pages, size, has outline, has page labels, scanned or text. 3-page speed test with the chosen converter → estimate per step, shown on screen, accounting for GPU.
2. **M2 Chapter boundaries.** `cs_py toc` merges: outline + page labels (pypdf), printed contents page (render pages 1–20 as images, Claude reads the contents page, returns titles + printed pages as JSON), "Chapter N" headings from a fast text pass. Compute the printed → PDF offset. UI shows only disagreements as "Which page does Chapter N start on?" with thumbnails (pypdfium2). Manual table only when nothing usable is found.
   - Accept: three synthetic fixtures (contents page, no contents, outline off by N pages) and one OpenStax book give exact PDF page spans.
3. **M3 Chapters found animation.** Pages fly out with chapter names (GSAP or Motion), replayable, reduced-motion fallback.
4. **M4 Schedule.** Weeks, total hours, days/week, sessions/day → hours/week, /day, /session, total sessions, live. Defaults 10 / 200 / 4 / 2. Rubric constants in `src/shared/rubric.ts`.
5. **M5 Module split.** Opus proposes modules (topic groups) across weeks weighted by chapter density (pages, equations, figures), with session ranges per chapter; structured JSON validated with zod. Modules then chapters fly in from the left. Drag chapters between weeks (dnd-kit); a module spanning weeks shows X-1, X-2. Chapters stay whole. Session map updates live. Reset to proposal.
6. **M6 Files & pictures.** Job runner works week by week: cut → convert → pictures → name & tag. Haiku Batch names pictures from image + caption + nearby text.
   - Live status card: step, chapter, page, elapsed, time left, last update; plain-English activity log; orange stuck state after 60 s with the reason; Retry.
   - Whole-course table with order arrows: only the live handoff is blue (animated), stuck handoffs orange, the rest light grey.
   - "Plan lessons" unlocks per week when its Markdown is done.
   - Jobs resume after the app restarts.
7. **M7 Picture bank.** Folder tree → one chapter's pictures (TanStack Virtual grid), rename inline (updates Markdown links), filters by kind, Next chapter, mark chapter checked, "not cleared" flag for figures credited to other sources.
8. **M8 Undo.** Every accepted step is a git commit with a plain-English message; Undo returns to the previous one.
9. **M9 Installer.** electron-builder NSIS with bundled Python; first-run model download with progress; works on a clean Windows PC with no Python, no Git, no GPU.

## Out of scope

Lesson plan, rubric UI, text generation, Canvas, chat, lectures, splitting a chapter across weeks.

## Done when

The fixtures and one real Ideal textbook run end to end from the installer on Ash's PC and on one CPU-only PC, producing correct week folders, and the instructor never wonders whether the app is stuck.
