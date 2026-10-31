# Decisions log

Newest at the bottom. One entry per decision: date, decision, why, who.

- 2026-10-31 · Electron over Tauri: same UI ceiling; Node for Agent SDK and Chromium for lecture capture. · Ash
- 2026-10-31 · Week = folder = Canvas module; modules spanning weeks named X-1, X-2; duration is the fixed grid. · Ash
- 2026-10-31 · v1 keeps each chapter whole in one week. · Ash
- 2026-10-31 · Python bundled; Claude API; private repo akaup-iitnj/course-studio. · Ash
- 2026-10-31 · MinerU default converter (pending spike 1); pypdfium2 instead of PyMuPDF (AGPL); no Marker weights, no Remotion. · research
- 2026-10-31 · First Canvas upload as .imscc, REST for republish. · research
- 2026-10-31 · Dev/test PC: i7-13700F, 32 GB, RTX 3060 12 GB; CPU path must still work. · Ash
- 2026-10-31 · Repo is `akaup-iitnj/IdealCourseStudio` with the starter kit at the root (the kit assumed `course-studio`). · Ash (repo choice), noted by Claude
- 2026-10-31 · M0 built in a Linux cloud session, not on Ash's PC. Verified there: lint, typecheck, vitest, pytest, Playwright e2e (under a virtual display) and `pnpm build:win` (NSIS via Wine). Still to check on Windows 11: Mica, native caption buttons, DPAPI key storage, installer launch. A GitHub Actions job on `windows-latest` runs the same checks and uploads the installer. · Claude
- 2026-10-31 · TypeScript pinned to 6.0.3, not 7.0: typescript-eslint supports TS < 6.1 only. Revisit when it supports 7. · Claude
- 2026-10-31 · Left sidebar (Projects, Settings) added. The prototype has no sidebar, but ui-guidelines want Mica showing through "the sidebar and title bar". Content sits on a solid panel with a rounded top-left corner, like Windows 11 apps. Easy to remove if Ash prefers the prototype's full-width layout. · Claude (ask Ash)
- 2026-10-31 · How the app finds Python: `CS_PYTHON` override → bundled runtime in `resources/python-runtime` (M9) → `uv run` against `python/` (dev only) → a Python already on the PC (`py -3`, `python3`, `python`). Until M9 bundles python-build-standalone, the installed M0 app needs Python 3.10+ on the PC; `cs_py` is stdlib-only for now. · Claude
- 2026-10-31 · Helpers get a parent watchdog: the app keeps their stdin open and they exit on EOF, so a crashed or closed app never leaves orphan Python processes (Windows doesn't kill children with their parent). · Claude
- 2026-10-31 · The preload repeats the IPC channel list (a sandboxed preload can't bundle zod cheaply); a unit test fails if it drifts from `src/shared/ipc.ts`. · Claude
- 2026-10-31 · Test-only env vars: `CS_USER_DATA_DIR` (settings/logs location), `CS_STUCK_MS` (stuck limit), `CS_FORCE_CPU=1`, `CS_E2E=1` (Linux only: allows safeStorage's plain-text backend because CI has no keyring; never applies on Windows). · Claude
- 2026-10-31 · Jobs aren't persisted yet. Persisting to `project.json` arrives with projects (M1) and the real pipeline (M6). · Claude
- 2026-10-31 · First real test book: *Start Your Own Nonprofit Organization* (private, not committed). It has no bookmarks and no page numbers in its contents, plus a 16-page excerpt of another book at the end. M2 must rely on "CHAPTER N" headings and stop where this book's own contents list ends. Expected spans are in `spikes/converter/report.md`. · Claude
- 2026-10-31 · Added a local MCP server so Claude Code can drive the app (Ash's request): Streamable HTTP on 127.0.0.1:39217, bearer token kept encrypted in settings.json, browser Origins refused, stateless, off by default (Settings switch; `CS_MCP=1` forces it on for tests). The renderer never sees the token: "Copy setup command" writes it straight to the clipboard from main. Tools cover everything the UI can do today; no secret or Canvas tools, ever. Every future UI feature gets a matching tool. · Ash / Claude
- 2026-10-31 · Development moves to Ash's PC (local Claude Code session) for fast cycles, direct access to the running app via MCP, and the RTX 3060 for Spike 1. The cloud session stops here; see `docs/HANDOFF.md`. · Ash
