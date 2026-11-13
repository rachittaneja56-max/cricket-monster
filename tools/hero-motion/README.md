# Cricket.Monster — real night-ground hero

The homepage now uses **real recorded cricket footage**, edited locally in the existing Remotion project. The artificial ball, detached bat, reconstructed pitch and photographic backdrop are no longer in the selected composition. `src/StadiumHero.tsx` and its original compositions are preserved under **Previous-CGI** in Studio for comparison.

The selected source is [Gokuldham Nar's night-match recording on Pexels](https://www.pexels.com/video/aerial-night-view-of-cricket-match-in-india-32311041/), downloaded at 3840×2160 / 29.97 fps. It is a high aerial view of a real local ground, not ground-level broadcast footage or a packed international stadium. Actual players, floodlights, grass, boundary activity and shadows belong to one coherent recording. No generated foreground, animated architecture, simulated people, glow, particles, shake, grading or motion blur was added.

## Reproduce locally on Windows

Node 24+, Python, and the two packages in `requirements-footage.txt` are required. The tested environment used Node 24.21.0, OpenCV 5.0.0.93 and NumPy 2.2.6. From the repository root:

```powershell
cd tools/hero-motion
npm ci
python -m pip install -r requirements-footage.txt
npm run fetch:footage
npm run prepare:footage
npm run dev
```

In a second terminal, in `tools/hero-motion`:

```powershell
npm run render:master
npm run render:batting
npm run encode
npm run lint
```

`fetch:footage` downloads only the two pinned recordings in `sources.json` and verifies SHA-256 hashes. If the CDN blocks a request, use the source page's normal **Free download** control, save the exact resolution shown in the manifest into `public/footage/`, and run the command again. A source hash change requires re-review rather than silently accepting a different clip.

The stock originals and prepared plates are ignored render inputs. They are not published in Git or deployed as a stock library. The first Remotion render downloads its bundled headless Chromium. FFmpeg and ffprobe are installed locally through npm; a global installation is unnecessary.

## Editing and looping

`prepare-footage.py` takes the quiet source window beginning at 10.5 seconds. SIFT features and robust similarity registration remove most camera translation, rotation and scale drift. Transforms are sampled every four frames, interpolated and smoothed; there is no perspective warp, shear, invented background fill or fabricated scene element. A fixed 1.18× crop avoids uncovered edges. The measured uncovered-pixel fraction for the selected plate was zero.

`src/FootageHero.tsx` defines the two real-footage compositions:

- **LiveStadium:** 192 frames at 30 fps = 6.4 seconds. The prepared recording is played at 0.5× to restrain movement. There is a 16-frame / 0.53-second overlap between adjacent parts of the same shot. At the actual last-to-first boundary the source time advances continuously; the overlap then returns gradually to the beginning. Slight residual aerial drift remains. This is an edited recorded loop, not a live feed.
- **BattingMoment:** eight seconds at the source-native 24 fps, with a real helmeted batter in outdoor nets. This candidate demonstrates genuine full-body movement but was rejected for the homepage: it is daylight practice, strokes recur, the ball approaches the viewer, and facility/equipment branding is visible. Its loop is less quiet and its setting does not match the night-ground brief. It is a local comparison asset only.

The long affine-stabilization attempt was rejected because it exposed borders and changed framing. The first downloaded night orbit was also rejected as too fast. Those experiments are not used in LiveStadium.

## Encoding and quality comparison

The 1920×1080 master is rendered at CRF 14 and normalized to limited-range yuv420p. `encode-footage.mjs` makes three 1280×720 H.264 versions, all silent and fast-start, and compares them against a Lanczos-downscaled master using FFmpeg SSIM. Visual inspection includes the encoded clips, 100% grass crops and actual homepage screenshots.

| CRF | Web bytes | SSIM against downscaled master |
| --- | ---: | ---: |
| **18 — selected** | **2,597,457** | **0.985125** |
| 21 | 1,398,694 | 0.980621 |
| 24 | 800,796 | 0.974853 |

CRF 18 retains more grass and boundary detail. Output size is driven by quality, without a bitrate cap or an artificially small target. The selected master is 14,232,997 bytes. The batting comparison is 5,560,188 bytes at 720p and CRF 18; its size is another reason to prefer the quieter night shot. Metrics support comparison but do not establish realism by themselves.

`npm run encode` installs the selected file and poster into `../../assets/`, saves a master alias at `out/stadium-hero-master.mp4`, generates contact sheets and ffprobe JSON, checks fast-start atom order, and decodes every frame. It also encodes BattingMoment if that master exists. Run `node encode-footage.mjs` without `--install` to inspect candidates without changing website assets.

## Main outputs

| File | Contents |
| --- | --- |
| `out/live-stadium-master.mp4` | 1080p selected master |
| `out/stadium-hero-master.mp4` | Alias of the selected master after encoding |
| `../../assets/stadium-hero.mp4` | Selected 720p / 30 fps background |
| `../../assets/stadium-hero-poster.webp` | WebP fallback from the same shot |
| `out/live-stadium-contact-sheet.jpg` | Loop overlap and main action frames |
| `out/real-batting-candidate.mp4` | Rejected but playable real-batting comparison |
| `out/realism-comparison/` | Actual browser screenshots and playback readings for CGI, A and B |
| `out/realism-verification/` | Current local browser tests and responsive screenshots |

The preceding CGI web video, poster, master and contact sheet were copied to `out/previous-cgi/` before replacement. They also remain recoverable from Git commit `7e649ad` and the earlier delivery bundle. Legacy source remains renderable with `npm run render:legacy`; archived notes are in `README-CGI.md`.

## Product integration and verification

The hero grid, dimensions, headline, right-hand card, typography and CTAs are preserved. Eligible desktop visitors get automatic muted playback with no visible pause/play button. Old saved pause preferences are ignored. Playback still pauses while the hero is offscreen or the document is hidden, and the poster remains if autoplay fails. The video/poster is top-aligned so desktop cropping retains the floodlights and the pitch. The footer credits the actual recording.

The established Playwright suite checks 1440, 1024, 768, 390 and 320px, real advancing video time, absence of the motion button, autoplay despite an obsolete saved pause preference, loop wrap, navigation, prediction transfer/saving, all ten quiz questions, overflow, layout shifts, poster loading, mobile/reduced-motion/save-data/no-JS behavior, playback failures, offscreen pause and preference changes. Hidden-document policy is tested with a simulated visibility event and reported as such. No MP4 is requested on mobile or under reduced motion or data saving.

From the repository root:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

From `tools/hero-motion`:

```powershell
$env:ARTIFACT_DIR = 'out/realism-verification'
npm run test:browser
npm run compare
node capture.mjs
```

The browser tools use installed Google Chrome. `compare` temporarily serves each candidate through Playwright request interception behind the unchanged real interface; it does not publish the rejected batting candidate. For a deployed check, set `BASE_URL` to the Vercel preview and choose a separate `ARTIFACT_DIR` before running `test:browser`.

## Source and rights information

See [FOOTAGE-LICENSES.md](FOOTAGE-LICENSES.md) and [sources.json](sources.json) for creator credits, original pages, license links, exact files, restrictions and the separate treatment of the branded batting candidate. No player, club, ground or sponsor endorsement is claimed.
