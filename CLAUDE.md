# Course Studio

A local Windows desktop app that turns one textbook PDF into a full Canvas LMS course (readings, slides, assignments, quizzes, discussions) and later hand-drawn "pen on blackboard" video lectures. Owner: Ash (Head of Curriculum, Ideal Institute of Technology). Users are instructors, not developers.

Read before working: `docs/plan.md` (what and why), the current build spec (`docs/build-1-spec.md`), `docs/tech-stack.md` (which libraries and why), `docs/ui-guidelines.md` (how it must look and feel). The clickable design reference is in `docs/prototype/`. Log every decision that changes a doc in `docs/decisions.md`.

## Current focus

Build 1 (PDF in → week folders). Start with `docs/build-0-spikes.md`. Work milestone by milestone in the order in `docs/build-1-spec.md`. Stop after each milestone for Ash to review.

## Stack (do not swap without asking)

- Electron (latest stable) + electron-vite + TypeScript (strict) + React 19.
- Tailwind CSS v4, shadcn/ui, Motion (`motion/react`), GSAP for set-piece animations, dnd-kit, TanStack Virtual, Lucide icons, sonner toasts, cmdk command palette, zustand for renderer state, zod for every IPC and file schema.
- Python 3.12 managed with uv in `python/` (package `cs_py`). Called from Electron as child processes. Packaged with python-build-standalone.
- PDF: MinerU (default converter, confirmed by spike), pypdf (outline, page labels), pypdfium2 (cutting, thumbnails), Docling picture classifier.
- Claude API via `@anthropic-ai/sdk` in the main process only. Model IDs come from `src/shared/models.ts`, never hard-coded elsewhere.
- Git for undo via dugite.
- Packaging: electron-builder (NSIS) + electron-updater.
- Tests: vitest (TS), pytest (Python), Playwright `_electron` for end-to-end.

## Architecture

```
src/main/        Electron main: windows, IPC handlers, project store, job runner, Claude client, git, settings
src/preload/     contextBridge API only, typed from src/shared/ipc.ts
src/renderer/    React app (screens, components, design tokens)
src/shared/      zod schemas, IPC contract, project.json types, model IDs, rubric constants
python/cs_py/    CLI tools: inspect, toc, cut, convert, pictures; each prints JSON Lines progress to stdout
spikes/          throwaway experiments from Build 0, results written to docs/decisions.md
tests/           e2e (Playwright), fixtures (small synthetic + OpenStax PDFs)
ref/sweatbox/    Ash's Sweatbox repo, reference only (gitignored); used in Build 5
```

- Security: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. The renderer never sees API keys or touches the filesystem directly.
- Python protocol: one JSON object per line: `{"type":"progress"|"log"|"result"|"error", "step":..., "chapter":..., "page":..., "of":..., "msg": "<plain English>"}`. Emit at least every 5 s while working (heartbeat). The job runner marks a job **stuck** after 60 s without a line and shows why.
- Jobs are queued and persisted in `project.json`, so a closed app resumes where it stopped.
- Project folder layout and `project.json` shape: see `docs/build-1-spec.md`.

## Rules

1. **Windows first.** Use `path.join`, handle spaces and long paths, test on Windows. Commands in docs use PowerShell.
2. **Secrets** live only in `%APPDATA%\Course Studio\settings.json`, encrypted with Electron `safeStorage`. Never in project folders, logs, git, or the renderer.
3. **Licenses.** Before adding any dependency, check its license. No AGPL (e.g. PyMuPDF), no non-commercial model weights (Nougat, Marker/Chandra weights), no Remotion. GPL tools only as separate executables, never imported. Record new deps in `docs/tech-stack.md`.
4. **Offline by default.** Only Claude API (and later Canvas, ElevenLabs, Napkin) calls leave the PC. Models download once on first run to `%LOCALAPPDATA%\Course Studio\models` with a progress bar.
5. **GPU optional.** Everything must work on CPU. Use CUDA when present (Ash's PC: RTX 3060 12 GB). Never assume a GPU in time estimates without detecting it.
6. **Plain English in the UI.** Status and log lines say what is happening to which chapter in teacher words ("Reading pictures in Chapter 3, page 41 of 60"), never stack traces. Technical detail goes to the log file.
7. **Honest progress.** Every long task shows step, item, elapsed, time left, and "last update N s ago". No fake progress bars.
8. **Looks matter.** Follow `docs/ui-guidelines.md`. No default browser look: custom title bar, custom scrollbars, real motion, dark mode. Respect reduced motion.
9. **Small steps.** Use plan mode for each milestone, commit after each working step with a clear message, keep tests green, and update docs when behavior changes.
10. **Ask instead of guessing** when a choice changes what the instructor sees or what gets published. Make reasonable assumptions for internal details and note them in `docs/decisions.md`.

## Commands

```powershell
pnpm install            # JS deps
pnpm dev                # run the app with hot reload
pnpm test               # vitest
pnpm test:e2e           # Playwright Electron tests
pnpm lint; pnpm typecheck
cd python; uv sync; cd ..; pnpm test:py   # pytest
pnpm build:win          # NSIS installer in dist/
```

Env switches for testing (`CS_FORCE_CPU`, `CS_PYTHON`, `CS_STUCK_MS`, `CS_USER_DATA_DIR`) are listed in `README.md`.
