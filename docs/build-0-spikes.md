# Build 0 · scaffold + spikes

Goal: an empty but polished app shell running on Ash's PC, plus three throwaway experiments that settle the riskiest choices before Build 1 features. Spike code lives in `spikes/` and is not product code. Each spike ends with a short result written to `docs/decisions.md`.

## M0 · Scaffold

- electron-vite React + TypeScript template, pnpm, strict TS, ESLint + Prettier.
- Tailwind v4, shadcn/ui initialised, Motion, Lucide, sonner, cmdk, zustand, zod.
- Frameless window with `titleBarOverlay` (native min/max/close) and `backgroundMaterial: 'mica'`; custom title bar matching the prototype; light and dark themes from tokens in `docs/ui-guidelines.md`.
- Two screens wired: **Projects** (empty state) and **Settings** (Claude API key saved with `safeStorage`, "Test key" button that makes one tiny Haiku call).
- `python/` uv project (`cs_py`, Python 3.12) with a `hello` CLI that prints JSON Lines progress for 10 s; main process job runner spawns it and the UI shows a live progress card with "last update N s ago" and stuck after 60 s (test by adding a `--hang` flag).
- GPU detection in Python (`torch.cuda.is_available()` when torch is installed; else `nvidia-smi`), shown in Settings → "This PC".
- vitest, pytest and one Playwright `_electron` smoke test pass. `pnpm build:win` produces an installer that launches.
- **Done when:** Ash installs the built app, sees a sleek window, saves his key, and watches the fake job progress and then go stuck.

## Spike 1 · Converter bake-off (most important)

Compare on 50 pages from (a) one OpenStax book with equations, (b) one of Ash's real textbooks, (c) one scanned book if available:

| Converter | Modes to test |
| --- | --- |
| MinerU | pipeline backend on CPU, pipeline on GPU, VLM backend on GPU |
| PaddleOCR-VL | GPU |
| Docling | CPU (default) |

Measure per converter: seconds per page, peak VRAM/RAM, install size and model download size, Markdown quality (headings, reading order, tables, LaTeX equations), pictures extracted (count, cropped correctly, captions linked), Windows install pain. Produce `spikes/converter/report.md` with a table and 3 side-by-side samples (equation page, figure-heavy page, table page). Recommend one; Ash decides.

## Spike 2 · Canvas .imscc import

Hand-write (or script) a tiny cartridge: 2 week modules, 1 page with an image and MathJax, 1 assignment, 1 QTI quiz made with text2qti, 1 placeholder "Lecture video coming soon" page. Import into a **sandbox** Canvas course via the content migrations API. Record what imported, how quizzes landed (New Quizzes?), any migration issues, and how long it took. Also test one REST update of that page afterwards. Needs Ash's Canvas sandbox URL, token and course ID (stored only in settings).

## Spike 3 · Handwriting render

Ten seconds, 1920×1080, 30 fps: "Average velocity" written in a single-line Hershey font with a pencil riding the stroke, then one equation drawn from MathJax SVG. Render in an offscreen Electron window driven by frame number (not wall clock), capture frames, encode with FFmpeg: compare NVENC (`h264_nvenc -preset p5 -cq 23`) and x264 (`-crf 20 -tune animation`). Report render time, file size and a sample MP4. Reuse ideas from `ref/sweatbox/` if Ash has cloned it.
