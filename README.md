# Column Board

Portrait-first teacher writing pad + 16:9 classroom board renderer.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and click **Start New Room**.

For LAN access from Galaxy S Ultra:

```bash
npm run dev -- --host 0.0.0.0
```

Then open `http://<PC_LOCAL_IP>:5173/write/<roomId>` from Galaxy browser.

## Routes

| Route | Role | Description |
|---|---|---|
| `/` | — | Start page, create new room |
| `/prototype` | — | Local-only test (no realtime) |
| `/write/:roomId` | Teacher | Input canvas + display preview |
| `/display/:roomId` | TV/Projector | Read-only 16:9 board |
| `/viewer/:roomId` | Students | Read-only viewer |

## Realtime Setup (Phase 1)

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Without Supabase configured, the app runs in local-only mode (drawing works, no sync).

## Architecture

- All stroke points stored in **logical coordinates** (0..1000 × 0..1800)
- Stroke widths in **logical units**: `renderWidth = stroke.width * scale`
- `setupCanvasDpi()` is the **only** place that uses `devicePixelRatio`
- Three canvas layers: `backgroundCanvas`, `strokeCanvas`, `overlayLayer`
- Eraser uses `destination-out` on `strokeCanvas` only; always resets to `source-over`
- No `React.setState` on `pointermove`; stroke committed on `pointerup`/`cancel`
- `InputManager` handles palm rejection; auto mode rejects touch after pen detected

## Manual QA Checklist

### Phase 0 — Local

- [ ] Desktop mouse drawing test
- [ ] Galaxy S Ultra S Pen test (check `pointerType === "pen"` in debug panel)
- [ ] Chrome on Galaxy test
- [ ] Samsung Internet test
- [ ] Palm rejection: draw with pen → touch is ignored
- [ ] Fast writing: no dropped strokes
- [ ] Small math notation: fractions, exponents, roots, angles, coordinate labels
- [ ] Resize/fullscreen: redraw from logical state, no bitmap stretch
- [ ] Next column / previous column
- [ ] Undo removes last stroke from active column
- [ ] Eraser removes ink, does NOT erase grid/background
- [ ] TV/projector 3m readability with 3 columns
- [ ] `/viewer` route shows board, has no drawing controls

### Phase 1 — Realtime

- [ ] Open `/write/:roomId` on PC
- [ ] Open `/display/:roomId` in another window — strokes appear after pointerup
- [ ] Open `/viewer/:roomId` — receives board via snapshot
- [ ] Refresh `/display` — board recovers via snapshot+replay
- [ ] Refresh `/viewer` — board recovers via snapshot+replay
- [ ] Disconnect network — UI shows reconnecting status
- [ ] `/viewer` cannot draw
- [ ] `/display` cannot draw
- [ ] Reload `/write/:roomId` — board restored from localStorage
- [ ] S Pen writing feels local and immediate (pointermove is never sent over network)
- [ ] Undo/clear/column events sync to display and viewer
