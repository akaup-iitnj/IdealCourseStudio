# Kickoff prompt for Claude Code

Paste everything below the line into Claude Code, started in the repo folder (`claude` in PowerShell from `C:\dev\course-studio`).

---

You're the lead engineer on **Course Studio**, a Windows desktop app (Electron + React + bundled Python + Claude API) that turns a textbook PDF into a Canvas course and, later, hand-drawn video lectures. I'm Ash, the product owner. I'm technical but not a full-time developer, so explain choices in plain English when you ask me something.

**First, read and absorb these files fully:** `CLAUDE.md`, `docs/plan.md`, `docs/build-0-spikes.md`, `docs/build-1-spec.md`, `docs/tech-stack.md`, `docs/ui-guidelines.md`, `docs/dev-machine.md`, `docs/decisions.md`, and skim the screens in `docs/prototype/` (design reference markup, not runnable code; the `{{...}}` bits are template bindings).

**Then do this, in order:**

1. **Environment check.** Run read-only checks and report a short table: Windows version, Node, pnpm, Git, uv, Python, NVIDIA driver (`nvidia-smi`), free disk space. Tell me exactly what to install for anything missing (winget commands), then wait for me.
2. **Plan M0.** Enter plan mode and propose the M0 scaffold from `docs/build-0-spikes.md`: folder tree, packages (with licenses), the IPC contract shape, the JSON Lines job protocol, and the window/title-bar approach. Keep it to one screen. Wait for my approval.
3. **Build M0.** Implement it with small commits. Use the latest stable versions and pin them. It must look like a polished desktop app from the first screen (custom title bar, Mica, dark mode, motion) per `docs/ui-guidelines.md`. Finish with lint, typecheck, vitest, pytest and the Playwright smoke test all green, plus `pnpm build:win` producing an installer. Then tell me how to try it and stop.
4. **Spikes.** After I sign off M0, run Spike 1 (converter bake-off) first. Fetch OpenStax test books yourself; ask me for the path to one of my own textbooks and keep it in `tests/fixtures/private/` (gitignored). Write `spikes/converter/report.md` and recommend a converter. Then Spike 3 (handwriting render), then Spike 2 (Canvas import), for which you'll ask me for sandbox Canvas details to put in Settings.
5. **Build 1.** Only after I pick a converter, start Build 1 milestones M1–M9 from `docs/build-1-spec.md`, plan mode for each, stopping after each for my review.

**Ground rules:** follow `CLAUDE.md` exactly (Windows first, secrets only in encrypted settings, license check before every dependency, plain-English UI, honest progress, CPU path always works). Never commit my textbooks, API keys or Canvas tokens. Record any decision you make in `docs/decisions.md`. If something in the docs conflicts or is unclear, ask me before building it.

Start with step 1.
