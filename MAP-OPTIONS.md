# Map comparison

Matt selected D / Soft charcoal for the main guide. Both the guide and comparison now omit corner zoom/scale/attribution controls; visible linked attribution appears directly below the map. Native MapLibre cooperative gestures support Command-scroll on macOS, Control-scroll elsewhere, and trackpad pinch zoom while preserving ordinary page scrolling.

The default comparison now shows three true dark monochrome variants: D Soft charcoal (tonal), E Graphite (high-contrast street detail), and F Black ink (no buildings, fewer labels). The earlier A–C set remains available through the collection switch. Only the active collection mounts maps, keeping three WebGL contexts rather than six. Neighborhood and camera position carry across collections. Each new style uses neutral grayscale paint values; the monochrome comparison shell also desaturates sprites and controls to prevent color leaks.

`map-options.html` is a separate design comparison, not a replacement for the live guide's map. A preference is held only in browser memory; the chosen style should be applied to the guide only after Matt chooses in chat.

- A: Paper atlas — adapted OpenFreeMap Positron; warm neutral land, subdued water, dark labels.
- B: City wayfinder — adapted OpenFreeMap Liberty; colorful road hierarchy, parks and more detail.
- C: Night atlas — adapted OpenFreeMap Dark; slate land, brighter roads and labels.

The three views share a camera so zoom and panning compare equivalent geography. All marker counts use the existing sanitized venue index; coordinates are neighborhood centers. No precise venue pins are invented.

Style source definitions retrieved from `https://tiles.openfreemap.org/styles/positron`, `/styles/liberty`, and `/styles/dark`. Original data attribution remains displayed on every map. Guidance: https://openfreemap.org/quick_start/. Local copies in `public/map-options` contain the comparison modifications; glyphs, sprites and map tiles load from OpenFreeMap. Material Symbols are the same self-hosted subset as the Zurich guide, with its license in `public/fonts`.

Build both the main guide and comparison using `npm run build`; generated assets publish through GitHub Pages from `docs`. Main guide source and map styling remain unchanged by this comparison.
