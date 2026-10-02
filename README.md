# Electrical Layout Maker

Phone-first, offline electrical layout editor based on the supplied reference drawing.

## What is implemented

- Locked `house-v1` reference symbols: `led`, `fan`, `socket15`, and `socket5`.
- Reference-style fan figure-8 and socket arcs/rays; wall placement is only a helper, so every socket becomes a normal free object after placement and can be moved or rotated.
- Room rectangles, dashed dividers, generic multi-line boxes, free text, and an automatic legend. There are no special TV or air-curtain object types.
- Touch-friendly SVG editing: place, select, drag, rotate, resize, relabel, duplicate, reorder, delete, grid, snap, undo/redo. Pointer capture is held by the SVG canvas while objects are redrawn.
- Electrical Layout Script (ELS) import with comments, code-fence cleanup, aliases, percentage grids, wall sockets, warnings, line-numbered errors, preview, replace/add modes, and patch commands.
- Lossless Copy as script export, Tidy layout, AI helper prompt templates, JSON backup/restore, SVG/PNG/print/share export.
- Local browser autosave and a service worker/manifest for GitHub Pages installation and offline use.

## Run locally

For the editor itself, open `index.html`. To test the service worker and install behavior, serve the folder over HTTP:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`. On a phone on the same Wi-Fi, use the computer's local IP instead of `localhost`.

## GitHub Pages

Upload `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, and `sw.js` to a repository. Enable Pages from Settings → Pages using the main branch and root folder. Open the HTTPS URL on the phone and use Add to Home Screen.

## ELS quick example

```text
ELS 1
page A4 portrait border
room "Hall" at 40,80 size 700x1050
led x=15%,34%,65%,80% y=9%,19%,29%
fan at 28%,40%
socket15 wall=right y=9%,18%,27%
box "AIR CURTAIN" at 31%,67% size 330x50 label=inside
legend auto at right
```

The app never calls an AI or sends drawing data anywhere. The AI helper only copies prompt text for a manually chosen external chat assistant.
