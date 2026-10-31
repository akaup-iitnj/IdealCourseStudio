# Course Studio

A Windows desktop app that turns one textbook PDF into a Canvas course. Electron + React + a bundled Python helper (`cs_py`) + the Claude API.

Start with [`CLAUDE.md`](CLAUDE.md) (rules), [`docs/plan.md`](docs/plan.md) (what and why) and [`docs/build-0-spikes.md`](docs/build-0-spikes.md) (where we are).

## Run it (PowerShell)

```powershell
pnpm install
cd python; uv sync; cd ..
pnpm dev
```

## Checks

```powershell
pnpm lint; pnpm typecheck
pnpm test             # vitest
pnpm test:py          # pytest
pnpm test:e2e         # builds, then Playwright drives the Electron app
pnpm build:win        # NSIS installer in dist\
```

## Layout

```
src/main/        Electron main: window, IPC handlers, settings (safeStorage), job runner, Claude client
src/preload/     contextBridge API only
src/renderer/    React app (screens, components, design tokens in styles/globals.css)
src/shared/      zod schemas: IPC contract, job protocol, settings, model IDs, rubric
python/cs_py/    helper tools speaking JSON Lines on stdout
tests/e2e/       Playwright Electron smoke test
```

## Troubleshooting switches

| Variable | Effect |
| --- | --- |
| `CS_FORCE_CPU=1` | Pretend there's no GPU |
| `CS_PYTHON=C:\path\python.exe` | Use this Python for helpers |
| `CS_STUCK_MS=5000` | Mark silent jobs stuck sooner (testing) |
| `CS_USER_DATA_DIR=C:\tmp\cs` | Keep settings and logs somewhere else (testing) |

Logs: `%LOCALAPPDATA%\Course Studio\logs`. Settings: `%APPDATA%\Course Studio\settings.json`.
