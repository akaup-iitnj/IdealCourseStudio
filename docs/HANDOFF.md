# Handoff · cloud session → Ash's PC

Written 2026-10-31 at the end of the first (cloud) session. Read this first in the new session, then `CLAUDE.md`.

## Where things stand

- **M0 done** and green on Windows CI (lint, typecheck, vitest, pytest, Playwright e2e, NSIS installer). See "M0" commits.
- **MCP server added** (`src/main/mcp/`): Claude Code can drive the app. See CLAUDE.md → "Driving the app from Claude Code".
- **Spike 1 started**: test book analysed, expected chapter spans written in `spikes/converter/report.md`. **No converter has run yet**: the cloud session couldn't download models.
- Not yet checked by eye on Windows 11: Mica backdrop, native caption buttons, the look in general. Do this first with `pnpm dev` + the `screenshot` tool.

## First steps in the PC session

Work in `C:\Users\CNC\Downloads\Ideal Course Studio` (Ash's choice). Anything Ash keeps there that isn't part of the project goes in `_downloads\`, which git ignores locally.


1. Check the environment (step 1 of `KICKOFF-PROMPT.md`): Node 22+, pnpm, Git, uv, Python, `nvidia-smi`, free disk.
2. `pnpm install`, `cd python; uv sync; cd ..`, then run every check from CLAUDE.md → Commands.
3. `pnpm dev`, turn on Settings → Claude Code connection, copy the setup command, run it, restart Claude Code, and confirm `get_app_state` works.
4. Ash's test book is in his Downloads as `Start_your_own_nonprofit_organization.pdf`. Copy it to `tests/fixtures/private/` (gitignored). Note `.claude/settings.json` denies Claude *reading* that folder; converters and scripts may process it, but loosen the rule with Ash's OK if Claude needs to look at pages directly.
5. Run Spike 1 on that book (all 98 pages): MinerU pipeline CPU and GPU, MinerU VLM GPU, PaddleOCR-VL GPU, Docling CPU. Update `spikes/converter/report.md`.

## Things to know

- **MinerU's license changed.** MinerU 4.x on PyPI says `LicenseRef-MinerU-Open-Source-License`, not Apache-2.0 as `docs/tech-stack.md` assumes. Read it before recommending MinerU (CLAUDE.md rule 3) and tell Ash.
- `mineru[core]` no longer exists in 4.x; the extras are `torch`, `full`, `all`.
- PyTorch CPU wheels download from `download-r2.pytorch.org` (a redirect), relevant only if a network policy applies.
- The test book has traps (no bookmarks, contents without page numbers, drop caps before "CHAPTER N", and a 16-page excerpt of another book at the end with its own chapters 1–41). Details in the spike report.
- Open question for Ash: keep the left sidebar (added in M0) or go full-width like the prototype?
