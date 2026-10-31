# Tech stack

Picks from the research of Oct 31, 2026 (full write-up: "Course Studio · Tech stack research" doc). Versions move: at install time use the latest stable release and pin it in lockfiles. Add a row here for every new dependency, with its license.

## App and UI

| Need | Pick | License | Notes |
| --- | --- | --- | --- |
| Shell | [Electron](https://www.electronjs.org/) | MIT | Frameless + `titleBarOverlay`, `backgroundMaterial: 'mica'` |
| Build | [electron-vite](https://electron-vite.org/) | MIT | |
| Package / update | [electron-builder](https://www.electron.build/) NSIS + electron-updater | MIT | Code-sign later (Azure Artifact Signing) |
| UI framework | React 19 + TypeScript | MIT | |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | MIT | Tokens in CSS variables |
| Components | [shadcn/ui](https://ui.shadcn.com/) | MIT | Source owned in repo |
| Motion | [Motion](https://motion.dev/) (`motion/react`), [GSAP](https://gsap.com/) | MIT / free GSAP license | GSAP for timeline set pieces |
| Drag and drop | [dnd-kit](https://dndkit.com/) | MIT | |
| Virtual lists | [TanStack Virtual](https://tanstack.com/virtual) | MIT | Picture bank |
| Toasts, palette | sonner, cmdk | MIT | |
| State, schemas | zustand, zod | MIT | |
| Rich text (B2) | [Tiptap](https://tiptap.dev/) | MIT core | |
| Waveforms (B5) | [wavesurfer.js](https://wavesurfer.xyz/) | BSD-3 | Plus custom canvas timeline |
| Git | [dugite](https://github.com/desktop/dugite) | MIT | Bundled Git |
| Chat (B4) | Claude Agent SDK in `utilityProcess` | Anthropic terms | `asarUnpack` the native binary |

### Added in M0 (pinned in `package.json`)

| Need | Pick | License | Notes |
| --- | --- | --- | --- |
| Electron helpers | @electron-toolkit/utils 4.0.0 | MIT | `is.dev` |
| Claude client | @anthropic-ai/sdk 1.3.0 | Apache-2.0 | Main process only |
| shadcn/ui building blocks | @radix-ui/react-slot, class-variance-authority, clsx, tailwind-merge, tw-animate-css | MIT / Apache-2.0 | What `shadcn add` generates against |
| Fonts | @fontsource-variable/instrument-sans, @fontsource-variable/jetbrains-mono | OFL-1.1 | Bundled locally (offline) |
| Lint and format | ESLint 10, typescript-eslint 8, eslint-plugin-react-hooks, eslint-plugin-react-refresh, Prettier 3 | MIT | |
| Tests | vitest 5, Playwright 1.64 (`_electron`), jsdom, @testing-library/react | MIT / Apache-2.0 | |
| TypeScript | typescript 6.0.3 | Apache-2.0 | Not 7.0 yet (typescript-eslint support) |
| Python tests and build | pytest 9, hatchling | MIT | Dev only |

## Python and PDF

| Need | Pick | License | Notes |
| --- | --- | --- | --- |
| Runtime | [python-build-standalone](https://github.com/astral-sh/python-build-standalone) + [uv](https://docs.astral.sh/uv/) | MPL/Apache | `uv pip install torch --torch-backend=auto` for CUDA |
| PDF → Markdown | [MinerU](https://github.com/opendatalab/MinerU) | Apache-2.0 + large-company clauses | Default; confirm in spike 1 |
| Runner-up | [PaddleOCR-VL](https://github.com/PaddlePaddle/PaddleOCR) | Apache-2.0 | Best scores, GPU |
| Fallback + picture classifier | [Docling](https://github.com/docling-project/docling) | MIT | |
| Outline, page labels | [pypdf](https://pypdf.readthedocs.io/) | BSD | |
| Cutting, thumbnails | [pypdfium2](https://github.com/pypdfium2-team/pypdfium2) | Apache/BSD | |
| **Avoid** | PyMuPDF (AGPL), Marker/Chandra weights (OpenRAIL revenue cap), Nougat (non-commercial), olmOCR (Docker only) | | |

## AI

| Model ID | $ per 1M in / out | Use |
| --- | --- | --- |
| claude-opus-5-5 | 4 / 20 | Module split, lesson planning |
| claude-sonnet-5-5 | 2 / 10 | Writing, chat, title disagreements |
| claude-haiku-5-5 | 0.10 / 0.50 | Picture names, tags, contents-page reading |

Batch API (50% off), prompt caching (5 min / 1 h), Files API, Citations (`page_location`; not combinable with structured outputs, so two passes). Napkin API for diagrams (SVG, download within 30 min). Marp for slides.

## Canvas (Build 3)

.imscc via [content migrations](https://canvas.instructure.com/doc/api/content_migrations.html) for the first upload; [REST](https://canvas.instructure.com/doc/api/) TS wrapper for republish; [3-step file upload](https://canvas.instructure.com/doc/api/file.file_uploads.html); [text2qti](https://github.com/gpoore/text2qti) for QTI; `media_tracks` PUT replaces all captions.

## Lectures (Build 5)

ElevenLabs TTS with timestamps; [stable-ts](https://github.com/jianfch/stable-ts) / [faster-whisper](https://github.com/SYSTRAN/faster-whisper); Sweatbox player + offscreen Electron capture + [FFmpeg](https://ffmpeg.org/) (NVENC / x264); Hershey/Relief single-line fonts; vivus; MathJax SVG; [AutoTrace](https://github.com/autotrace/autotrace) (GPL, separate exe); WebVTT. Fallback renderer [Revideo](https://github.com/redotvideo/revideo) (MIT). **Not Remotion** (paid license above 3 employees).
