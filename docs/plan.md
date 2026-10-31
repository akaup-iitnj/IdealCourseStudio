# Course Studio · plan v3

A local Windows app that turns one textbook PDF into a full Canvas course: readings, slideshows, assignments, quizzes, discussions, and, later, hand-drawn video lectures. v3 folds in the tech-stack research (`tech-stack.md`). The clickable prototype (`prototype/`) is the reference for every screen.

## Locked decisions

| Area | Decision |
| --- | --- |
| App shell | **Electron** + React 19 + TypeScript. Same UI ceiling as Tauri; Electron wins because the Agent SDK chat needs Node and the lecture renderer needs Chromium. |
| UI | Tailwind v4, shadcn/ui, Motion, GSAP, dnd-kit. Custom title bar with Windows 11 Mica backdrop. Sleek, not "default web" (`ui-guidelines.md`). |
| Python tools | **Bundled** (python-build-standalone + uv). Models download on first run. A teacher only double-clicks. |
| PDF → Markdown | **MinerU** (pictures, tables, LaTeX). PaddleOCR-VL runner-up, Docling fallback. Final pick confirmed by the converter spike. |
| Language model | **Claude API**, key in Settings. Opus for planning, Sonnet for writing and chat, Haiku for naming/tagging. Batch API + prompt caching for whole-course runs. |
| Code | Private GitHub repo `akaup-iitnj/course-studio`, built with Claude Code on Ash's PC. Sweatbox reused for lectures. |
| Dev and test machine | Ash's PC: i7-13700F, 32 GB RAM, RTX 3060 12 GB, Windows 11 x64 (`dev-machine.md`). Must also run on CPU-only PCs. |
| Canvas | Publishes into an **existing** course. First full upload as one **.imscc** package; REST API to republish single items. |
| Secrets | `%APPDATA%\Course Studio\settings.json`, encrypted with `safeStorage`; never in project folders. |
| Undo | Git commit of the project folder after every accepted step and every chat turn (bundled Git via dugite). |
| Offline | Files, PDF work, previews and rendering stay on the PC. Only Claude, Canvas, ElevenLabs and Napkin calls go out. |
| Licenses | No AGPL (PyMuPDF), no non-commercial weights (Nougat, Marker/Chandra), no Remotion. GPL tools only as separate executables. |

## The schedule comes first

Duration is the fixed grid; content is packed into it.

1. Instructor enters **weeks**, **total hours**, **teaching days per week**, **sessions per day** (Ideal default: 10 weeks, 200 h, 4 days, 2 sessions → 20 h/week, 5 h/day, 2.5 h sessions, 80 sessions).
2. **Folders and Canvas modules are per week.**
3. A **module** (topic group) can span weeks; each week is named **"X-1", "X-2"…**.
4. Content can be compressed (a 20-week book into 10 weeks).
5. **v1: a chapter stays whole inside one week.** Splitting at a section heading comes later.

## The flow

1. **Create Course → Create using textbook → upload one PDF.** Estimated processing time from page count + a 3-page speed test on this PC (GPU detected or not).
2. **Chapters found** animation.
3. **Chapter boundaries** from three sources: PDF outline + page labels (pypdf), the printed contents page (Claude reads it), and "Chapter N" headings in MinerU's Markdown. Printed → PDF page offset from page labels or footers. The instructor only sees disagreements. Manual entry last.
4. **Schedule** calculator.
5. **Module split**: Claude (Opus) proposes chapters → modules → weeks → sessions, weighted by chapter density. Drag to adjust.
6. **Files & pictures**: one folder per week; chapters cut with pypdfium2 and converted with MinerU; pictures named by Claude Haiku (Batch), decorative images filtered by Docling's classifier. Live progress with stuck detection. Lesson planning unlocks per week as soon as that week's Markdown is done. Picture bank by chapter.
7. **Course plan (Lessons)** laid out like Canvas modules, with the **contact-hour rubric** (reading 4 min/page, slides 2 min/slide, discussion 15 min, quiz 1 min/question, assignment 10 min/question, video = length; gap spread 45/20/20/15 or assignments only).
8. **Text preview**: Sonnet writes with **Citations** (book page per claim), then a second pass converts to structured JSON. Recommended assets from the picture bank or Napkin (SVG) must be kept ✓ or rejected ✗. Slides with **Marp** (PDF for Canvas, PPTX for editing). Math as MathJax `\( \)` / `$$`.
9. **Upload to Canvas**: one .imscc via content migration (quizzes as QTI via text2qti, land as New Quizzes), blank video placeholders; then REST for single-item republish (TS wrapper, 1–3 concurrent, back off on 429, local ID + hash map). Migration issues shown in plain English.
10. **Lectures** after the text course is done; Canvas-style Overall / Lecture views; background rendering.

## Lectures (from Sweatbox)

Plan → Script (locked) → Voice → Transcript → Beats → Scene → Render.

| Stage | Tool |
| --- | --- |
| Voice | ElevenLabs text-to-speech with timestamps, or instructor's own recording |
| Timings | ElevenLabs timestamps; stable-ts `align()` (faster-whisper fallback) on the RTX 3060 for recordings |
| Scene / render | Sweatbox player in an offscreen Electron window, frame-by-frame capture, FFmpeg (NVENC on NVIDIA, x264 otherwise) |
| Handwriting | Single-line Hershey/Relief fonts, stroke animation, pencil rides the stroke; MathJax SVG for equations |
| Book figures as pen drawings | AutoTrace centerline (separate exe) |
| Captions | WebVTT from the same timings; Canvas `media_tracks` PUT always sends every track |

Look: Sweatbox "Line" (white pen on black, one orange accent).

## Chat

Claude Agent SDK in an Electron `utilityProcess` (native binary in `asarUnpack`), docked right on every screen. The Canvas publish tool is never in `allowedTools`; `canUseTool` allows it only when "Let my next message publish to Canvas" is ticked. Every turn is a git step with Undo.

## Builds

| Build | What it is | Not yet |
| --- | --- | --- |
| 0 (prep, ~1 week) | Scaffold the app shell and run 3 spikes: converter bake-off, Canvas .imscc import, handwriting render | Product features |
| 1 | PDF in → chapters → schedule → module split → week folders with Markdown and pictures, live progress, installer | Lessons, Canvas, chat |
| 2 | Course plan with rubric, text generation with citations, preview, recommended assets, Marp slides | Canvas |
| 3 | Canvas .imscc upload, blank video placeholders, REST republish of one item | Chat, video |
| 4 | Agent SDK chat docked on every screen, screenshots, git undo per turn | Lectures |
| 5 | Lecture stages from Sweatbox, background rendering, replace placeholder | — |

Build 0 doesn't change the five product builds; it de-risks them.

## Tests

Fixtures: small synthetic PDFs (with contents page, without, bookmarks off by N pages), OpenStax textbooks (CC BY, safe to commit), one scanned book, and Ash's real textbooks (kept out of git in `tests/fixtures/private/`). Unit tests ship with each build; e2e runs the packaged app.
