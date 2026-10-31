# Start here · Course Studio on your PC

About 30 minutes of setup, then Claude Code takes over.

## 1. Install the tools (PowerShell)

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install astral-sh.uv
winget install GitHub.cli
corepack enable; corepack prepare pnpm@latest --activate
irm https://claude.ai/install.ps1 | iex      # Claude Code
```

Also update the NVIDIA driver (GeForce Experience or nvidia.com) so the RTX 3060 is used for PDF conversion and video encoding. Close and reopen PowerShell after installing.

## 2. Create the private repo

```powershell
mkdir C:\dev; cd C:\dev
gh auth login
gh repo create akaup-iitnj/course-studio --private --clone
cd course-studio
```

Keep it in a short path like `C:\dev` (not OneDrive or Documents) so Windows path limits and sync don't get in the way.

## 3. Add the starter files

Unzip `course-studio-starter.zip` and copy everything **inside** its `course-studio` folder into `C:\dev\course-studio` (including the hidden `.claude` folder and `.gitignore`). Then:

```powershell
git add -A; git commit -m "Starter docs and project rules"; git push
```

Optional for Build 5: clone Sweatbox into `ref\sweatbox` (it's gitignored):

```powershell
gh repo clone akaup-iitnj/sweatbox ref\sweatbox
```

(Use the real repo name if it differs.)

## 4. Start Claude Code

```powershell
cd C:\dev\course-studio
claude
```

Open `KICKOFF-PROMPT.md`, copy everything below the line, paste it in, and press Enter. Claude Code will check your setup, propose the scaffold, and wait for your OK at each step.

## What's in the kit

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | Rules Claude Code reads every session: stack, architecture, do's and don'ts |
| `KICKOFF-PROMPT.md` | The first message to paste |
| `docs/plan.md` | Plan v3 with the research folded in |
| `docs/build-0-spikes.md` | App scaffold + 3 experiments before real features |
| `docs/build-1-spec.md` | Build 1 milestones M1–M9 with acceptance tests |
| `docs/tech-stack.md` | Every library, why, and its license |
| `docs/ui-guidelines.md` | How the app should look and feel |
| `docs/dev-machine.md` | Your PC and what it means for the build |
| `docs/decisions.md` | Running decision log |
| `docs/prototype/` | The clickable prototype's screens as design reference |
| `docs/design-reference/` | Drop Eisenhower screenshots here for the look you want |

## Tips while building

- Say "plan first" for anything big; approve or edit the plan before it codes.
- Run `/clear` between milestones to start fresh; CLAUDE.md and the docs carry the context.
- If it drifts from the look you want, add screenshots to `docs/design-reference/` and point it at them.
