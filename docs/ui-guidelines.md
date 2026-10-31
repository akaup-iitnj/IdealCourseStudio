# UI guidelines

The prototype in `prototype/` fixes **what** each screen shows. This file fixes **how it should feel**: a modern native-feeling desktop app (think Linear, Notion, Raycast, Ash's Eisenhower app), not a web page in a window. Ash will drop reference screenshots in `design-reference/`; when present, they override the details below.

## Foundations

- **Window:** frameless, custom 40 px title bar with app mark, breadcrumb and Chat button; native caption buttons via `titleBarOverlay`; Mica backdrop showing through the sidebar and title bar.
- **Tokens** as CSS variables, light and dark. Starting values from the prototype:
  - ink `#15181E`, muted `#5A6170`, surface `#FFFFFF`, canvas `#F4F5F7`, line `#DDE1E7`
  - accent blue `#2450C8` (live / primary), success `#1A6A3D` on `#E6F3EC`, stuck orange `#C25A00`-ish on a pale orange
  - radius 8 (controls) / 12 (cards); spacing on a 4 px grid
- **Type:** Instrument Sans (UI), JetBrains Mono (numbers, file names, timings), Caveat only inside lecture previews. Bundle fonts locally (offline app).
- **Density:** desktop density, 13–14 px body, 32–36 px controls, 44 px for primary actions.

## Feel

- Motion everywhere it explains something: layout changes animate (Motion `layout`), lists stagger in, drag has lift and drop settles with a spring, page transitions 150–250 ms. Set pieces (pages flying out, modules flying in) with GSAP timelines. All motion off under `prefers-reduced-motion`.
- No browser tells: no text selection on chrome, `cursor: default` on UI, custom thin scrollbars, no focus rings on mouse click but clear rings on keyboard focus, no blue link underlines in the app shell, no white flash on launch (set `backgroundColor`, show window on `ready-to-show`).
- Skeletons instead of spinners; optimistic updates; toasts (sonner) for background results; Ctrl+K command palette (cmdk).
- Live states: pulsing blue dot for running, orange for stuck, green check for done. "Last update N s ago" on every long job.
- Plain-English copy written for teachers. No jargon, no stack traces.
- Chat docks on the right at 380 px and the screen reflows (never overlaps).

## Accessibility

Keyboard reachable everything, visible focus, 4.5:1 contrast, labels on icon buttons, respects Windows text scaling.
