# Cricket.Monster hero motion

A local Remotion + React Three Fiber + Three.js project for the existing static homepage. The website needs no React runtime. No AI video service, paid video API, external model, or generated stadium is used.

## Reproduce on Windows

Node 24+ is recommended (the physics check uses Node's TypeScript support). From the repository root:

```powershell
cd tools/hero-motion
npm ci
npm run dev
# In another terminal, in tools/hero-motion:
npm run render:preview
npm run render:ground
npm run render:master
npm run encode
npm run lint
npm run test:physics
```

The first render downloads Remotion's own headless Chromium. `--gl=angle` uses the Windows ANGLE backend; rendering is local. All Remotion packages are pinned to 4.0.543, React to 19.3.1, R3F to 9.8.2, and Three.js to 0.187.0. The lockfile pins transitive dependencies. A `postcss-selector-parser` override avoids a registry version unavailable during setup.

FFmpeg and ffprobe are project-local npm dependencies; no global PATH setup is required. `encode.mjs` normalizes the master to limited-range yuv420p if needed, produces a 720p H.264 fast-start MP4, strips audio, creates a WebP poster and eight-frame contact sheet, saves ffprobe JSON, and decodes every web-output frame as an integrity check.

## Outputs

| File | Purpose |
| --- | --- |
| `out/stadium-hero-master.mp4` | 1920×1080 master, 9 seconds, 24 fps |
| `../../assets/stadium-hero.mp4` | 1280×720 web asset committed to Git |
| `../../assets/stadium-hero-poster.webp` | First-frame fallback committed to Git |
| `out/ball-contact-preview.mp4` | Half-resolution Ball Contact direction |
| `out/broadcast-ground-preview.mp4` | Half-resolution Broadcast Ground alternative |
| `out/contact-sheet.jpg` | Frames 0, 48, 79, 96, 108, 120, 144, 215 |
| `out/*-metadata.json` | FFprobe stream and container metadata |

Masters, previews, browser screenshots, installed dependencies, and abandoned install folders are ignored by Git. Only the optimized video, poster, small source material maps, and source are committed. `.vercelignore` excludes the local production tooling from the static deployment.

## Compositions and visual choice

**BallContact** uses a pitch-level camera, seeded grass and dry-pitch materials, a regulation-radius 36 mm red leather ball with six stitch rows and a geometric seam, a willow blade with bevels and rubber grip, crease lines, and stumps. The incoming ball bounces at frame 79, meets the front of the bat at frame 108, then changes direction into the outfield. `physics.ts` separates screen time from physical time for restrained slow motion. Only frame-controlled values drive animation; there are no wall-clock animation timers or real-time physics dependencies.

**BroadcastGround** has a wider view with an independently animated rolling ball, boundary flag movement, and periodic light variation. It is included for comparison; its distant activity is less clear behind the interface. BallContact was selected for recognizable action and its lower-left contact area.

The bat enters from above without a full-body character. This is visibly procedural CGI composited against a photograph, not filmed cricket or photorealistic player footage. The photographed crowd is static; independent motion comes from the local 3D action. No licensed batting footage or credible character was identified in the repository or inspected local-media inventory, so no real-player version is included.

The original photograph is `../../assets/stadium.webp`, credited by the website to [Zoshua Colah / Unsplash](https://unsplash.com/photos/cricket-match-happening-at-night-under-bright-stadium-lights-66X4NgftbrA). A byte-identical copy is included in `public/` for deterministic rendering. Other maps are seeded procedural textures made by `make-textures.py`; optionally rebuilding them requires Python, Pillow, and NumPy. The maps are checked in, so Python is not required to render.

Opening and closing holds contain no ball or bat. Camera and light variation are periodic, with a very small difference between adjacent last/first frames. The ball resets out of camera view.

## Homepage behavior

`scripts/hero-motion.js` attaches the source only above 850px when reduced motion and data saving are off. The poster paints immediately. Video stays muted, inline, decorative, and pointer-transparent. A 44px pause/play control remembers the user's choice for the browser session. The controller pauses offscreen, on hidden documents, and during page suspension, and unloads the source when mobile or reduced motion becomes active. Download, decode, and autoplay failures leave the poster and interactive hero intact. The headline, right-hand prediction card, CTAs, and prediction behavior are preserved.

## Browser verification

From the repository root:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Then in `tools/hero-motion`:

```powershell
npm run test:browser
```

The suite uses installed Google Chrome through Playwright. It tests widths 1440, 1024, 768, 390, and 320; actual advancing video time; pause/resume; desktop card placement; both CTAs; winner transfer; saving predictions; a full ten-question Daily Monster attempt; overflow; layout shifts; mobile/reduced-motion/save-data/no-JS fallbacks; rejected autoplay; failed video requests; out-of-view pausing; preference changes; and loop wrap. The hidden-document policy uses a simulated visibility event and is identified as such in the report.

Screenshots and JSON reports are written to `out/verification`. To test a deployment:

```powershell
$env:BASE_URL = 'https://your-preview.vercel.app'
npm run test:browser
```

The workflow follows the [official Remotion Three.js integration](https://www.remotion.dev/docs/three) and [Remotion agent skills](https://github.com/remotion-dev/skills).
