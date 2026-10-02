# Architecture (v2.1)

## Rules that must not change
1. **Four locked symbols (house-v1)**: `led`, `fan`, `socket15`, `socket5`. Source of truth: the supplied `drawing example.jpeg`, especially its legend.
   - LED = small circle · Fan = circle with figure-8 · 15 A = TWO nested closed half-circles + 3 rays on the outer · 5 A = ONE closed half-circle + 3 rays.
   - Never swap in IEC/IS/ANSI symbols. Not claimed to be a published standard.
2. **Every symbol is a free object**: `{id,type:'symbol',symbol,x,y,w,h,rotation,label}`. It can always be moved, rotated, resized, relabelled.
   `wall=` in a script (and dropping a socket within 40 units of a room wall) is only a *helper*: it converts to x/y/rotation once. Nothing stays "locked to a wall".
3. **Box = generic container** `{type:'box',x,y,w,h,label,labelPos,size}`. `label` is multi-line text (`\n`). No special "air curtain" or "TV" objects; the user just types the text.
4. Model is JSON; SVG is derived from it (`render()`). No state in the DOM. No network/AI calls.

## Files
`index.html` shell · `styles.css` · `app.js` (model, render, input, ELS parser, export) · `sw.js` (network-first, offline fallback) · `manifest.webmanifest` + `icons/`.

## Input rules (why touch dragging works)
- Pointer capture is set on the `<svg>` itself, never on a child, because `render()` rebuilds children.
- Selecting an object redraws only the selection layer, not the objects.
- `touch-action:none` only on objects/handles; empty page area can still scroll/pan on touch.

## Next steps (in order)
1. Split `app.js` into classic `<script>` files (not ES modules, so it still opens from a folder): `symbols.js`, `model.js`, `render.js`, `input.js`, `els.js`, `io.js`, `main.js`, sharing one `ELM` namespace.
2. Pinch-zoom/pan, multi-select, copy/paste, align.
3. Parser unit tests (`tests/`) using the reference script (24 LEDs, 4 fans, 11 sockets, 3 dividers, 3 boxes, legend).
4. Polyline/wire tool, layers, templates, DXF export.

## Prompt for your LLM builder
> Read ARCHITECTURE.md, README.md and reference/symbols.png first. Obey the four rules above. Do one "Next step" at a time, keep it working from a plain folder with no build step, show changed files in full, and give me a 5-line phone test checklist. Do not add other symbols or symbol standards.
